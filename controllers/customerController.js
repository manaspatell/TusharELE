const Product = require('../models/Product');
const Category = require('../models/Category');
const Article = require('../models/Article');
const Banner = require('../models/Banner');
const Testimonial = require('../models/Testimonial');
const Newsletter = require('../models/Newsletter');
const { sanitizeText } = require('../middleware/validation');

// Helper function to convert Map to object
const convertSpecsToObject = (product) => {
  if (product.specifications && product.specifications instanceof Map) {
    const specsObj = {};
    product.specifications.forEach((value, key) => {
      specsObj[key] = value;
    });
    product.specifications = specsObj;
  }
  return product;
};

// Homepage
exports.home = async (req, res) => {
  try {
    const [
      banners,
      categories,
      featuredProducts,
      latestArticles,
      testimonials,
    ] = await Promise.all([
      // Fetch ALL active banners and sort by `order` ascending, then `created_at` descending.
      // Do NOT filter by `order` value — only sort.
      Banner.find({ status: 'active' })
        .sort({ order: 1, created_at: -1 })
        .catch(() => []),
      // Show all active categories on the homepage so newly added categories appear
      Category.find({ status: 'active' })
        .sort({ name: 1 })
        .catch(() => []),
      // Featured products: return all active featured products (no hard limit here)
      Product.find({ status: 'active' })
        .populate('category_id')
        .sort({ created_at: -1 })
        .catch(() => []),
      Article.find({ status: 'published' })
        .sort({ created_at: -1 })
        .limit(3)
        .catch(() => []),
      Testimonial.find({ status: 'active' })
        .sort({ created_at: -1 })
        .limit(6)
        .catch(() => []),
    ]);

    // Convert specifications Map to object for all products
    const processedProducts = (featuredProducts || []).map(
      convertSpecsToObject
    );

    res.render('customer/index', {
      banners: banners || [],
      categories: categories || [],
      featuredProducts: processedProducts,
      latestArticles: latestArticles || [],
      testimonials: testimonials || [],
    });
  } catch (error) {
    console.error(error);
    res.render('customer/index', {
      banners: [],
      categories: [],
      featuredProducts: [],
      latestArticles: [],
      testimonials: [],
      error: 'Failed to load homepage. Please check MongoDB connection.',
    });
  }
};

// Category page
exports.category = async (req, res) => {
  try {
    const category = await Category.findOne({ slug: req.params.slug });

    if (!category) {
      return res.status(404).render('customer/404');
    }

    const page = parseInt(req.query.page) || 1;
    const limit = 12;
    const skip = (page - 1) * limit;

    const products = await Product.find({
      category_id: category._id,
      status: 'active',
    })
      .sort({ created_at: -1 })
      .skip(skip)
      .limit(limit);

    // Convert specifications Map to object
    const processedProducts = products.map(convertSpecsToObject);

    const total = await Product.countDocuments({
      category_id: category._id,
      status: 'active',
    });

    res.render('customer/pages/category', {
      category,
      products: processedProducts,
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      total,
    });
  } catch (error) {
    console.error('Error loading category:', error);
    res.status(404).render('customer/404');
  }
};

// Product listing
exports.products = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = 12;
    const skip = (page - 1) * limit;
    const search = req.query.search || '';
    const category = req.query.category || 'all';

    let query = { status: 'active' };

    if (search) {
      query.$text = { $search: search };
    }

    if (category !== 'all') {
      const categoryDoc = await Category.findOne({ slug: category });
      if (categoryDoc) {
        query.category_id = categoryDoc._id;
      }
    }

    const products = await Product.find(query)
      .populate('category_id')
      .sort(search ? { score: { $meta: 'textScore' } } : { created_at: -1 })
      .skip(skip)
      .limit(limit);

    // Convert specifications Map to object
    const processedProducts = products.map(convertSpecsToObject);

    const total = await Product.countDocuments(query);
    const categories = await Category.find({ status: 'active' });

    res.render('customer/pages/products', {
      products: processedProducts,
      categories,
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      total,
      search,
      currentCategory: category,
    });
  } catch (error) {
    res.render('customer/pages/products', { error: 'Failed to load products' });
  }
};

// Product details
exports.product = async (req, res) => {
  try {
    const product = await Product.findOne({
      slug: req.params.slug,
      status: 'active',
    }).populate('category_id');

    if (!product) {
      return res.status(404).render('customer/404');
    }

    // Convert specifications Map to plain object for easier template rendering
    const processedProduct = convertSpecsToObject(product);

    // Use helper to fetch similar products (tag intersection + category match)
    const similarLimit = 8;
    const similarProducts = await findSimilarProducts(product, similarLimit);

    // Convert specifications for similar products too
    const processedSimilarProducts = similarProducts.map(convertSpecsToObject);

    res.render('customer/pages/product', {
      product: processedProduct,
      similarProducts: processedSimilarProducts,
    });
  } catch (error) {
    console.error('Error loading product:', error);
    res.status(404).render('customer/404');
  }
};

// Helper: find similar products using MongoDB aggregation
async function findSimilarProducts(product, limit = 8) {
  try {
    // Normalize tags and category id (handle populated category)
    const tags = Array.isArray(product.tags) ? product.tags.map(String) : [];
    const categoryId =
      product.category_id && product.category_id._id
        ? product.category_id._id
        : product.category_id;

    // If we have tags, favor tag intersection; always allow category matches
    if (tags.length > 0) {
      const pipeline = [
        { $match: { _id: { $ne: product._id }, status: 'active' } },
        {
          $addFields: {
            tagMatches: { $size: { $setIntersection: ['$tags', tags] } },
            categoryMatch: {
              $cond: [{ $eq: ['$category_id', categoryId] }, 1, 0],
            },
          },
        },
        {
          $addFields: {
            score: {
              $add: [{ $multiply: ['$tagMatches', 10] }, '$categoryMatch'],
            },
          },
        },
        { $match: { score: { $gt: 0 } } },
        { $sort: { score: -1, updated_at: -1 } },
        { $limit: limit },
      ];

      const results = await Product.aggregate(pipeline).exec();
      return results;
    }

    // If no tags, fallback to same-category recent products
    const fallback = await Product.find({
      _id: { $ne: product._id },
      category_id: categoryId,
      status: 'active',
    })
      .sort({ updated_at: -1 })
      .limit(limit)
      .exec();

    return fallback;
  } catch (err) {
    console.error('Error computing similar products:', err);
    return [];
  }
}

// Newsletter subscription
exports.newsletter = async (req, res) => {
  try {
    const { email } = req.body;
    const sanitizedEmail = email.toLowerCase().trim();

    const existing = await Newsletter.findOne({ email: sanitizedEmail });
    if (existing) {
      return res.json({
        success: false,
        message: 'Email already subscribed',
      });
    }

    const newsletter = new Newsletter({ email: sanitizedEmail });
    await newsletter.save();

    res.json({
      success: true,
      message: 'Successfully subscribed to newsletter!',
    });
  } catch (error) {
    res.json({
      success: false,
      message: 'Failed to subscribe. Please try again.',
    });
  }
};

// Support pages
exports.about = (req, res) => {
  try {
    res.render('customer/pages/about');
  } catch (error) {
    console.error('Error rendering about page:', error);
    res.status(500).render('customer/404', { error: 'Failed to load page' });
  }
};

exports.contact = (req, res) => {
  try {
    res.render('customer/pages/contact');
  } catch (error) {
    console.error('Error rendering contact page:', error);
    res.status(500).render('customer/404', { error: 'Failed to load page' });
  }
};

exports.faq = (req, res) => {
  try {
    res.render('customer/pages/faq');
  } catch (error) {
    console.error('Error rendering FAQ page:', error);
    res.status(500).render('customer/404', { error: 'Failed to load page' });
  }
};

exports.privacy = (req, res) => {
  try {
    res.render('customer/pages/privacy');
  } catch (error) {
    console.error('Error rendering privacy page:', error);
    res.status(500).render('customer/404', { error: 'Failed to load page' });
  }
};

exports.terms = (req, res) => {
  try {
    res.render('customer/pages/terms');
  } catch (error) {
    console.error('Error rendering terms page:', error);
    res.status(500).render('customer/404', { error: 'Failed to load page' });
  }
};

exports.shipping = (req, res) => {
  try {
    res.render('customer/pages/shipping');
  } catch (error) {
    console.error('Error rendering shipping page:', error);
    res.status(500).render('customer/404', { error: 'Failed to load page' });
  }
};

exports.returns = (req, res) => {
  try {
    res.render('customer/pages/returns');
  } catch (error) {
    console.error('Error rendering returns page:', error);
    res.status(500).render('customer/404', { error: 'Failed to load page' });
  }
};

exports.warranty = (req, res) => {
  try {
    res.render('customer/pages/warranty');
  } catch (error) {
    console.error('Error rendering warranty page:', error);
    res.status(500).render('customer/404', { error: 'Failed to load page' });
  }
};

// Sitemap for SEO
exports.sitemap = async (req, res) => {
  try {
    const baseUrl = process.env.SITE_URL || `http://${req.headers.host}`;
    const [products, categories, articles] = await Promise.all([
      Product.find({ status: 'active' })
        .select('slug updated_at')
        .catch(() => []),
      Category.find({ status: 'active' })
        .select('slug updated_at')
        .catch(() => []),
      Article.find({ status: 'published' })
        .select('slug updated_at')
        .catch(() => []),
    ]);

    const urls = [
      { loc: `${baseUrl}/`, changefreq: 'daily', priority: '1.0' },
      { loc: `${baseUrl}/products`, changefreq: 'daily', priority: '0.9' },
      { loc: `${baseUrl}/blog`, changefreq: 'weekly', priority: '0.8' },
      { loc: `${baseUrl}/about`, changefreq: 'monthly', priority: '0.7' },
      { loc: `${baseUrl}/contact`, changefreq: 'monthly', priority: '0.7' },
      ...products.map((p) => ({
        loc: `${baseUrl}/product/${p.slug}`,
        changefreq: 'weekly',
        priority: '0.8',
        lastmod: p.updated_at
          ? new Date(p.updated_at).toISOString().split('T')[0]
          : new Date().toISOString().split('T')[0],
      })),
      ...categories.map((c) => ({
        loc: `${baseUrl}/category/${c.slug}`,
        changefreq: 'weekly',
        priority: '0.8',
        lastmod: c.updated_at
          ? new Date(c.updated_at).toISOString().split('T')[0]
          : new Date().toISOString().split('T')[0],
      })),
      ...articles.map((a) => ({
        loc: `${baseUrl}/article/${a.slug}`,
        changefreq: 'monthly',
        priority: '0.7',
        lastmod: a.updated_at
          ? new Date(a.updated_at).toISOString().split('T')[0]
          : new Date().toISOString().split('T')[0],
      })),
    ];

    const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls
  .map(
    (url) => `  <url>
    <loc>${url.loc}</loc>
    <changefreq>${url.changefreq}</changefreq>
    <priority>${url.priority}</priority>
    ${url.lastmod ? `<lastmod>${url.lastmod}</lastmod>` : ''}
  </url>`
  )
  .join('\n')}
</urlset>`;

    res.set('Content-Type', 'application/xml');
    res.send(sitemap);
  } catch (error) {
    console.error('Error generating sitemap:', error);
    res.status(500).send('Error generating sitemap');
  }
};

// Search suggestions
exports.searchSuggestions = async (req, res) => {
  try {
    const query = req.query.q ? req.query.q.trim() : '';

    if (!query) {
      return res.json({ categories: [], products: [] });
    }

    const [categories, products] = await Promise.all([
      Category.find({
        status: 'active',
        $or: [
          { name: { $regex: query, $options: 'i' } },
          { description: { $regex: query, $options: 'i' } },
        ],
      })
        .select('name slug')
        .limit(5),

      Product.find({
        status: 'active',
        $or: [
          { name: { $regex: query, $options: 'i' } },
          { description: { $regex: query, $options: 'i' } },
        ],
      })
        .select('name slug price')
        .limit(5),
    ]);

    res.json({ categories, products });
  } catch (error) {
    console.error('Error fetching search suggestions:', error);
    res.status(500).json({ error: 'Failed to fetch search suggestions' });
  }
};

// Saved-items endpoints removed
