const express = require('express');
const router = express.Router();
const { isAdmin } = require('../middleware/auth');
const fs = require('fs');
const path = require('path');
const upload = require('../middleware/upload');
const { loginLimiter } = require('../middleware/security');
const { validateLogin } = require('../middleware/validation');

// Controllers
const adminController = require('../controllers/adminController');
const productController = require('../controllers/productController');
const categoryController = require('../controllers/categoryController');
const inquiryController = require('../controllers/inquiryController');
const articleController = require('../controllers/articleController');
const bannerController = require('../controllers/bannerController');

// Auth routes
// Always show the login form and clear any existing admin session
router.get('/login', (req, res) => {
  if (req.session && req.session.admin) {
    req.session.admin = null;
  }
  res.render('admin/login', { error: null, baseUrl: req.baseUrl });
});

// Load 2FA status for admin views
router.use((req, res, next) => {
  try {
    const file = path.join(__dirname, '..', 'data', 'admin-2fa.json');
    if (fs.existsSync(file)) {
      const raw = fs.readFileSync(file, 'utf8');
      const obj = JSON.parse(raw || '{}');
      res.locals.admin2faEnabled = !!obj.enabled;
    } else {
      res.locals.admin2faEnabled = false;
    }
  } catch (e) {
    res.locals.admin2faEnabled = false;
  }
  next();
});

router.post('/login', loginLimiter, validateLogin, adminController.login);
router.get('/logout', adminController.logout);

// 2FA routes
router.get('/2fa/setup', isAdmin, adminController.get2faSetup);
router.post('/2fa/enable', isAdmin, adminController.post2faEnable);
router.post('/2fa/disable', isAdmin, adminController.post2faDisable);
router.get('/2fa/verify', adminController.get2faVerify);
router.post('/2fa/verify', adminController.post2faVerify);

// Dashboard
router.get('/dashboard', isAdmin, adminController.dashboard);

// Products
router.get('/products', isAdmin, productController.list);
router.get('/products/create', isAdmin, productController.createForm);
router.post(
  '/products/create',
  isAdmin,
  upload.products.array('images', 10),
  productController.create
);
router.get('/products/edit/:id', isAdmin, productController.editForm);
router.post(
  '/products/edit/:id',
  isAdmin,
  upload.products.array('images', 10),
  productController.update
);
router.post('/products/delete/:id', isAdmin, productController.delete);
router.post('/products/delete-image', isAdmin, productController.deleteImage);

// Categories
router.get('/categories', isAdmin, categoryController.list);
router.get('/categories/create', isAdmin, categoryController.createForm);
router.post(
  '/categories/create',
  isAdmin,
  upload.categories.single('image'),
  categoryController.create
);
router.get('/categories/edit/:id', isAdmin, categoryController.editForm);
router.post(
  '/categories/edit/:id',
  isAdmin,
  upload.categories.single('image'),
  categoryController.update
);
router.post('/categories/delete/:id', isAdmin, categoryController.delete);

// Inquiries
router.get('/inquiries', isAdmin, inquiryController.list);
router.get('/inquiries/view/:id', isAdmin, inquiryController.view);
router.post(
  '/inquiries/update-status/:id',
  isAdmin,
  inquiryController.updateStatus
);
router.post('/inquiries/delete/:id', isAdmin, inquiryController.delete);

// Articles
router.get('/articles', isAdmin, articleController.listAdmin);
router.get('/articles/create', isAdmin, articleController.createForm);
router.post(
  '/articles/create',
  isAdmin,
  upload.articles.single('image'),
  articleController.create
);
router.get('/articles/edit/:id', isAdmin, articleController.editForm);
router.post(
  '/articles/edit/:id',
  isAdmin,
  upload.articles.single('image'),
  articleController.update
);
router.post('/articles/delete/:id', isAdmin, articleController.delete);

// Banners
router.get('/banners', isAdmin, bannerController.list);
router.get('/banners/create', isAdmin, bannerController.createForm);
router.post(
  '/banners/create',
  isAdmin,
  upload.banners.single('image'),
  bannerController.create
);
router.get('/banners/edit/:id', isAdmin, bannerController.editForm);
router.post(
  '/banners/edit/:id',
  isAdmin,
  upload.banners.single('image'),
  bannerController.update
);
router.post('/banners/delete/:id', isAdmin, bannerController.delete);

module.exports = router;
