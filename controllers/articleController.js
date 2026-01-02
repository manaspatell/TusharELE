const Article = require('../models/Article');
const {
  generateSlug,
  truncate,
  parseTags,
  buildUploadPath,
  deletePublicFile,
  buildPagination,
} = require('../utils/helpers');
const { sanitizeText, sanitizeHtml } = require('../middleware/validation');
const fs = require('fs');
const path = require('path');

// List all articles (Admin)
exports.listAdmin = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = 10;
    const total = await Article.countDocuments();
    const { skip, totalPages, currentPage } = buildPagination(
      page,
      limit,
      total
    );

    const articles = await Article.find()
      .sort({ created_at: -1 })
      .skip(skip)
      .limit(limit);

    res.render('admin/articles/list', {
      baseUrl: req.baseUrl,
      articles,
      currentPage,
      totalPages,
      total,
    });
  } catch (error) {
    res.render('admin/articles/list', {
      error: 'Failed to load articles',
      baseUrl: req.baseUrl,
    });
  }
};

// Show create form
exports.createForm = (req, res) => {
  res.render('admin/articles/form', { article: null, baseUrl: req.baseUrl });
};

// Create article
exports.create = async (req, res) => {
  try {
    const { title, content, excerpt, tags, category, status } = req.body;
    const image = req.file
      ? buildUploadPath('articles', req.file.filename)
      : '';
    const tagArray = parseTags(tags, sanitizeText);

    const article = new Article({
      title: sanitizeText(title),
      slug: generateSlug(title),
      content: sanitizeHtml(content),
      excerpt: excerpt ? sanitizeText(excerpt) : truncate(content, 150),
      image,
      tags: tagArray,
      category: sanitizeText(category || 'general'),
      status: status === 'published' || status === 'draft' ? status : 'draft',
    });

    await article.save();
    res.redirect(`${req.baseUrl}/articles`);
  } catch (error) {
    console.error(error);
    res.render('admin/articles/form', {
      article: null,
      error: 'Failed to create article',
      baseUrl: req.baseUrl,
    });
  }
};

// Show edit form
exports.editForm = async (req, res) => {
  try {
    const article = await Article.findById(req.params.id);
    res.render('admin/articles/form', { article, baseUrl: req.baseUrl });
  } catch (error) {
    res.redirect(`${req.baseUrl}/articles`);
  }
};

// Update article
exports.update = async (req, res) => {
  try {
    const { title, content, excerpt, tags, category, status } = req.body;
    const article = await Article.findById(req.params.id);

    if (!article) {
      return res.redirect(`${req.baseUrl}/articles`);
    }

    const tagArray = parseTags(tags);

    article.title = title;
    article.slug = generateSlug(title);
    article.content = content;
    article.excerpt = excerpt || truncate(content, 150);
    article.tags = tagArray;
    article.category = category || 'general';
    article.status = status || 'draft';
    article.updated_at = Date.now();

    if (req.file) {
      // Delete old image
      if (article.image) {
        deletePublicFile(article.image);
      }
      article.image = buildUploadPath('articles', req.file.filename);
    }

    await article.save();
    res.redirect(`${req.baseUrl}/articles`);
  } catch (error) {
    console.error(error);
    res.redirect(`${req.baseUrl}/articles`);
  }
};

// Delete article
exports.delete = async (req, res) => {
  try {
    const article = await Article.findById(req.params.id);

    if (article) {
      // Delete image
      if (article.image) {
        deletePublicFile(article.image);
      }

      await Article.findByIdAndDelete(req.params.id);
    }

    res.redirect(`${req.baseUrl}/articles`);
  } catch (error) {
    res.redirect(`${req.baseUrl}/articles`);
  }
};

// View article (Customer)
exports.view = async (req, res) => {
  try {
    const article = await Article.findOne({
      slug: req.params.slug,
      status: 'published',
    });

    if (!article) {
      return res.status(404).render('customer/404');
    }

    // Increment views
    article.views += 1;
    await article.save();

    // Get related articles
    const relatedArticles = await Article.find({
      _id: { $ne: article._id },
      status: 'published',
      $or: [{ category: article.category }, { tags: { $in: article.tags } }],
    })
      .limit(3)
      .sort({ views: -1 });

    res.render('customer/pages/article', { article, relatedArticles });
  } catch (error) {
    res.status(404).render('customer/404');
  }
};

// List articles (Customer)
exports.list = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = 9;
    const category = req.query.category || 'all';

    const query = { status: 'published' };
    if (category !== 'all') {
      query.category = category;
    }

    const total = await Article.countDocuments(query);
    const { skip, totalPages, currentPage } = buildPagination(
      page,
      limit,
      total
    );
    const articles = await Article.find(query)
      .sort({ created_at: -1 })
      .skip(skip)
      .limit(limit);
    const categories = await Article.distinct('category', {
      status: 'published',
    });

    res.render('customer/pages/blog', {
      articles,
      categories,
      currentPage,
      totalPages,
      total,
      currentCategory: category,
    });
  } catch (error) {
    res.render('customer/pages/blog', { error: 'Failed to load articles' });
  }
};
