const express = require('express');
const router = express.Router();

// Controllers
const customerController = require('../controllers/customerController');
const inquiryController = require('../controllers/inquiryController');
const articleController = require('../controllers/articleController');

// Validation middleware
const {
  validateInquiry,
  validateNewsletter,
} = require('../middleware/validation');

// Homepage
router.get('/', customerController.home);

// Products
router.get('/products', customerController.products);
router.get('/product/:slug', customerController.product);

// Categories
router.get('/category/:slug', customerController.category);

// Blog/Articles
router.get('/blog', articleController.list);
router.get('/article/:slug', articleController.view);

// Inquiry
router.post('/inquiry', validateInquiry, inquiryController.create);

// Saved-items routes were removed

// Newsletter
router.post('/newsletter', validateNewsletter, customerController.newsletter);

// Support pages
router.get('/about', customerController.about);
router.get('/contact', customerController.contact);
router.get('/faq', customerController.faq);
// Privacy Policy and Terms of Service (static EJS pages)
router.get('/privacy', (req, res) => {
  res.render('customer/pages/privacy');
});
router.get('/terms', (req, res) => {
  res.render('customer/pages/terms');
});
router.get('/privacy-policy', customerController.privacy);
router.get('/terms-conditions', customerController.terms);
router.get('/shipping-policy', customerController.shipping);
router.get('/return-refund-policy', customerController.returns);
// Alias to avoid 404 for legacy link
router.get('/refund-policy', customerController.returns);
// Warranty page
router.get('/warranty', customerController.warranty);

// SEO - Sitemap and Robots
router.get('/sitemap.xml', customerController.sitemap);
router.get('/robots.txt', (req, res) => {
  res.type('text/plain');
  res.sendFile(require('path').join(__dirname, '../public/robots.txt'));
});

module.exports = router;
