const mongoose = require('mongoose');
const Product = require('../models/Product');
const Category = require('../models/Category');
const { generateSlug } = require('../utils/helpers');
const { sanitizeText, sanitizeHtml } = require('../middleware/validation');
const fs = require('fs');
const path = require('path');

// List all products
exports.list = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = 10;
    const skip = (page - 1) * limit;

    const products = await Product.find()
      .populate('category_id')
      .sort({ created_at: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Product.countDocuments();

    res.render('admin/products/list', {
      baseUrl: req.baseUrl,
      products,
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      total,
    });
  } catch (error) {
    res.render('admin/products/list', {
      error: 'Failed to load products',
      baseUrl: req.baseUrl,
    });
  }
};

// Show create form
exports.createForm = async (req, res) => {
  try {
    const categories = await Category.find({ status: 'active' });
    res.render('admin/products/form', {
      categories,
      product: null,
      baseUrl: req.baseUrl,
    });
  } catch (error) {
    res.redirect(`${req.baseUrl}/products`);
  }
};

// Create product
exports.create = async (req, res) => {
  try {
    const {
      name,
      category_id,
      description,
      price,
      sku,
      tags,
      status,
      specifications,
      discount_enabled,
      discount_percentage,
    } = req.body;

    console.log('\n=== CREATING PRODUCT ===');
    console.log('Product name:', name);
    console.log('Request body keys:', Object.keys(req.body));
    console.log('Files received:', req.files ? req.files.length : 0);
    console.log('req.file:', req.file);
    console.log('req.files:', req.files);

    if (req.files && req.files.length > 0) {
      req.files.forEach((file, idx) => {
        console.log(`  File ${idx + 1}:`);
        console.log(`    - Original name: ${file.originalname}`);
        console.log(`    - Filename: ${file.filename}`);
        console.log(`    - Size: ${file.size} bytes`);
        console.log(`    - Path: ${file.path}`);
        console.log(`    - MIME type: ${file.mimetype}`);
      });
    } else {
      console.log('⚠️  WARNING: No files received!');
      console.log('  This could mean:');
      console.log('    1. No files were selected');
      console.log('    2. Multer middleware failed');
      console.log('    3. File size exceeded limit');
      console.log('    4. File type not allowed');
    }

    // Validate category_id is a valid MongoDB ObjectId
    if (!mongoose.Types.ObjectId.isValid(category_id)) {
      return res.status(400).render('admin/products/form', {
        categories: await Category.find({ status: 'active' }),
        product: null,
        error: 'Invalid category selected',
      });
    }

    let images = [];
    if (req.files && req.files.length > 0) {
      images = req.files.map((file) => {
        const imagePath = `/uploads/products/${file.filename}`;
        const fullPath = path.join(__dirname, '..', 'public', imagePath);
        const fileExists = fs.existsSync(fullPath);
        console.log('📸 Processing image:', {
          originalName: file.originalname,
          filename: file.filename,
          path: imagePath,
          fullPath: fullPath,
          exists: fileExists,
          size: file.size,
        });
        if (!fileExists) {
          console.log('⚠️  WARNING: File not found at expected path!');
        }
        return imagePath;
      });
    }

    console.log('📊 Total images to save:', images.length);
    console.log('📊 Image paths:', images);
    const tagArray = tags
      ? tags
          .split(',')
          .map((t) => sanitizeText(t.trim()))
          .filter((t) => t)
      : [];

    // Handle specifications - convert to Map
    const specsMap = new Map();
    if (specifications && specifications.trim()) {
      const specPairs = specifications.split('\n');
      specPairs.forEach((pair) => {
        const [key, value] = pair.split(':');
        if (key && value) {
          specsMap.set(sanitizeText(key.trim()), sanitizeText(value.trim()));
        }
      });
    }

    // Handle discount
    const discount = {
      enabled: discount_enabled === 'on' || discount_enabled === true,
      percentage: Math.max(
        0,
        Math.min(100, parseFloat(discount_percentage) || 0)
      ),
    };

    const product = new Product({
      name: sanitizeText(name),
      slug: generateSlug(name),
      category_id,
      description: description ? sanitizeHtml(description) : '',
      price: Math.max(0, parseFloat(price) || 0),
      images: images || [],
      tags: tagArray,
      sku: sku ? sanitizeText(sku) : '',
      status: status === 'active' || status === 'inactive' ? status : 'active',
      specifications: specsMap,
      discount: discount,
    });

    console.log('Product to save:', {
      name: product.name,
      images: product.images,
      imagesCount: product.images.length,
    });

    await product.save();

    // Verify save by fetching from database
    const savedProduct = await Product.findById(product._id);
    console.log('✅ Product saved successfully with ID:', savedProduct._id);
    console.log('✅ Product images in database:', savedProduct.images);
    console.log(
      '✅ Images count:',
      savedProduct.images ? savedProduct.images.length : 0
    );

    if (savedProduct.images && savedProduct.images.length > 0) {
      console.log('✅ Images are linked to product!');
    } else {
      console.log('⚠️  WARNING: Product saved but no images linked!');
    }

    res.redirect(`${req.baseUrl}/products`);
  } catch (error) {
    console.error('❌ Error creating product:', error);
    console.error('Error stack:', error.stack);
    const categories = await Category.find({ status: 'active' });
    res.render('admin/products/form', {
      categories,
      product: null,
      error: 'Failed to create product: ' + error.message,
      baseUrl: req.baseUrl,
    });
  }
};

// Show edit form
exports.editForm = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id).populate(
      'category_id'
    );
    const categories = await Category.find({ status: 'active' });

    // Convert specifications Map to plain object for rendering
    if (product && product.specifications instanceof Map) {
      const specsObj = {};
      product.specifications.forEach((value, key) => {
        specsObj[key] = value;
      });
      product.specifications = specsObj;
    }

    res.render('admin/products/form', {
      product,
      categories,
      baseUrl: req.baseUrl,
    });
  } catch (error) {
    res.redirect(`${req.baseUrl}/products`);
  }
};

// Update product
exports.update = async (req, res) => {
  try {
    const {
      name,
      category_id,
      description,
      price,
      sku,
      tags,
      status,
      specifications,
      discount_enabled,
      discount_percentage,
    } = req.body;
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.redirect(`${req.baseUrl}/products`);
    }

    // Validate category_id is a valid MongoDB ObjectId
    if (category_id && !mongoose.Types.ObjectId.isValid(category_id)) {
      const categories = await Category.find({ status: 'active' });
      return res.render('admin/products/form', {
        product,
        categories,
        error: 'Invalid category selected',
        baseUrl: req.baseUrl,
      });
    }

    const tagArray = tags
      ? tags
          .split(',')
          .map((t) => sanitizeText(t.trim()))
          .filter((t) => t)
      : [];

    // Handle specifications - convert to Map if provided
    if (specifications && specifications.trim()) {
      const specs = {};
      const specPairs = specifications.split('\n');
      specPairs.forEach((pair) => {
        const [key, value] = pair.split(':');
        if (key && value) {
          specs[sanitizeText(key.trim())] = sanitizeText(value.trim());
        }
      });

      // Convert plain object to Map for Mongoose
      const specsMap = new Map();
      Object.entries(specs).forEach(([key, value]) => {
        specsMap.set(key, value);
      });
      product.specifications = specsMap;
    } else if (
      specifications === '' ||
      (specifications && specifications.trim() === '')
    ) {
      // If specifications field is empty, clear it
      product.specifications = new Map();
    }
    // If specifications is not provided, keep existing value

    product.name = sanitizeText(name);
    product.slug = generateSlug(name);
    if (category_id) {
      product.category_id = category_id;
    }
    product.description = description
      ? sanitizeHtml(description)
      : product.description;
    product.price = Math.max(0, parseFloat(price) || product.price);
    product.tags = tagArray;
    product.sku = sku ? sanitizeText(sku) : product.sku;
    product.status =
      status === 'active' || status === 'inactive' ? status : product.status;

    // Handle discount
    product.discount = {
      enabled: discount_enabled === 'on' || discount_enabled === true,
      percentage: Math.max(
        0,
        Math.min(100, parseFloat(discount_percentage) || 0)
      ),
    };

    product.updated_at = Date.now();

    // Handle new image uploads - append to existing images
    console.log('Updating product:', product.name);
    console.log('Files received:', req.files ? req.files.length : 0);
    if (req.files) {
      req.files.forEach((file, idx) => {
        console.log(
          `  File ${idx + 1}: ${file.filename}, size: ${file.size}, path: ${file.path}`
        );
      });
    }

    if (req.files && req.files.length > 0) {
      const newImages = req.files.map((file) => {
        const imagePath = `/uploads/products/${file.filename}`;
        const fullPath = path.join(__dirname, '..', 'public', imagePath);
        console.log('Updating product with image path:', imagePath);
        console.log('File saved at:', fullPath);
        console.log('File exists:', fs.existsSync(fullPath));
        return imagePath;
      });
      // Ensure images array exists
      if (!product.images) {
        product.images = [];
      }
      product.images = [...product.images, ...newImages];
      console.log('Product images after update:', product.images);
    } else {
      console.log('⚠️  No files received in update request');
    }

    console.log('Product before save:', {
      name: product.name,
      images: product.images,
      imagesCount: product.images ? product.images.length : 0,
    });

    await product.save();

    // Verify the save
    const savedProduct = await Product.findById(product._id);
    console.log('✅ Product saved successfully');
    console.log('✅ Product images in database:', savedProduct.images);
    console.log(
      '✅ Images count:',
      savedProduct.images ? savedProduct.images.length : 0
    );

    res.redirect(`${req.baseUrl}/products`);
  } catch (error) {
    console.error('Error updating product:', error);
    const categories = await Category.find({ status: 'active' });
    res.render('admin/products/form', {
      product: await Product.findById(req.params.id).populate('category_id'),
      categories,
      error: 'Failed to update product: ' + error.message,
      baseUrl: req.baseUrl,
    });
  }
};

// Delete product
exports.delete = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (product) {
      // Delete associated images
      product.images.forEach((image) => {
        const imagePath = path.join(__dirname, '..', 'public', image);
        if (fs.existsSync(imagePath)) {
          fs.unlinkSync(imagePath);
        }
      });

      await Product.findByIdAndDelete(req.params.id);
    }

    res.redirect(`${req.baseUrl}/products`);
  } catch (error) {
    res.redirect(`${req.baseUrl}/products`);
  }
};

// Delete product image
exports.deleteImage = async (req, res) => {
  try {
    const { productId, imagePath } = req.body;
    const product = await Product.findById(productId);

    if (product) {
      product.images = product.images.filter((img) => img !== imagePath);
      await product.save();

      const fullPath = path.join(__dirname, '..', 'public', imagePath);
      if (fs.existsSync(fullPath)) {
        fs.unlinkSync(fullPath);
      }
    }

    res.json({ success: true });
  } catch (error) {
    res.json({ success: false, error: error.message });
  }
};
