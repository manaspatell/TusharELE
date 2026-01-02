const express = require('express');
const router = express.Router();
const Category = require('../models/Category');
const Product = require('../models/Product');

// Search suggestions API
router.get('/search-suggestions', async (req, res) => {
  try {
    const query = (req.query.q || '').trim();
    if (!query) {
      return res.json({ categories: [], products: [] });
    }

    const searchRegex = new RegExp(
      query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'),
      'i'
    );

    // Get matching categories
    const categories = await Category.find({
      $or: [{ name: searchRegex }, { description: searchRegex }],
      status: 'active',
    })
      .limit(5)
      .select('name slug image')
      .lean();

    // Get matching products
    const products = await Product.find({
      $or: [{ name: searchRegex }, { description: searchRegex }],
      status: 'active',
    })
      .limit(5)
      .select('name slug images price category_id')
      .populate('category_id', 'name slug')
      .lean();

    res.json({ categories: categories || [], products: products || [] });
  } catch (error) {
    console.error('Search suggestions error:', error);
    res.json({ categories: [], products: [] });
  }
});

// Suggested products API (for empty search state)
router.get('/suggested-products', async (req, res) => {
  try {
    // Return latest active products; can be adapted to "featured" later
    const products = await Product.find({ status: 'active' })
      .sort({ created_at: -1 })
      .limit(8)
      .select('name slug images price category_id')
      .populate('category_id', 'name slug')
      .lean();

    res.json({ products: products || [] });
  } catch (error) {
    console.error('Suggested products error:', error);
    res.json({ products: [] });
  }
});

module.exports = router;
