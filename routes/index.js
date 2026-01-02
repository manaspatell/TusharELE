const express = require('express');
const customerController = require('../controllers/customerController');
const router = express.Router();

// Existing routes...

// Sitemap XML route
const Product = require('../models/Product');
const Category = require('../models/Category');
const Article = require('../models/Article');

router.get('/sitemap.xml', async (req, res) => {
  const baseUrl = 'https://tusharagro.com';
  let urls = [
    `${baseUrl}/`,
    `${baseUrl}/products`,
    `${baseUrl}/categories`,
    `${baseUrl}/blog`,
    `${baseUrl}/contact`,
    `${baseUrl}/about`,
    `${baseUrl}/warranty`,
    `${baseUrl}/returns`,
    `${baseUrl}/shipping`,
    `${baseUrl}/terms`,
    `${baseUrl}/privacy`,
    `${baseUrl}/faq`,
  ];

  const products = await Product.find({ status: 'active' }, 'slug updatedAt');
  products.forEach((p) => {
    urls.push(`${baseUrl}/product/${p.slug}`);
  });

  const categories = await Category.find(
    { status: 'active' },
    'slug created_at'
  );
  categories.forEach((c) => {
    urls.push(`${baseUrl}/category/${c.slug}`);
  });

  const articles = await Article.find(
    { status: 'published' },
    'slug updatedAt'
  );
  articles.forEach((a) => {
    urls.push(`${baseUrl}/article/${a.slug}`);
  });

  res.header('Content-Type', 'application/xml');
  res.send(`<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map((u) => `  <url><loc>${u}</loc></url>`).join('\n')}
</urlset>`);
});

// Search suggestions route
router.get('/search-suggestions', customerController.searchSuggestions);

module.exports = router;
