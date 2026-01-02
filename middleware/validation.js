const { body, validationResult } = require('express-validator');
const sanitizeHtmlLib = require('sanitize-html');

// Sanitize HTML input
const sanitizeHtml = (html) => {
  return sanitizeHtmlLib(html, {
    allowedTags: [
      'p',
      'br',
      'strong',
      'em',
      'u',
      'h1',
      'h2',
      'h3',
      'h4',
      'h5',
      'h6',
      'ul',
      'ol',
      'li',
      'a',
    ],
    allowedAttributes: {
      a: ['href', 'target', 'rel'],
    },
    // Ensure target links are safe
    transformTags: {
      'a': (tagName, attribs) => {
        const safe = Object.assign({}, attribs);
        if (safe.target && safe.target !== '_self') {
          safe.rel = 'noopener noreferrer';
        }
        return { tagName, attribs: safe };
      }
    }
  });
};

// Sanitize text input (remove HTML)
const sanitizeText = (text) => {
  if (!text) return '';
  return sanitizeHtmlLib(text, { allowedTags: [] });
};

// Validation middleware
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    // If it's an AJAX request, return JSON
    if (req.xhr || req.headers.accept?.indexOf('json') > -1) {
      return res.status(400).json({
        success: false,
        errors: errors.array(),
      });
    }
    // Otherwise, redirect or render with error
    return res.status(400).render('admin/login', {
      error: errors.array()[0].msg,
      baseUrl: req.baseUrl,
    });
  }
  next();
};

// Login validation
const validateLogin = [
  body('username')
    .trim()
    .notEmpty()
    .withMessage('Username is required')
    .isLength({ min: 3, max: 50 })
    .withMessage('Username must be between 3 and 50 characters')
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage('Username can only contain letters, numbers, and underscores'),
  body('password')
    .notEmpty()
    .withMessage('Password is required')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters'),
  validate,
];

// Inquiry validation
const validateInquiry = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Name is required')
    .isLength({ min: 2, max: 100 })
    .withMessage('Name must be between 2 and 100 characters')
    .customSanitizer((value) => sanitizeText(value)),
  body('email')
    .trim()
    .notEmpty()
    .withMessage('Email is required')
    .isEmail()
    .withMessage('Invalid email format')
    .normalizeEmail(),
  // allow any valid email provider for inquiries (better UX)
  body('phone')
    .trim()
    .notEmpty()
    .withMessage('Phone is required')
    .matches(
      /^[+]?[(]?[0-9]{1,4}[)]?[-\s.]?[(]?[0-9]{1,4}[)]?[-\s.]?[0-9]{1,9}$/
    )
    .withMessage('Invalid phone number format'),
  body('message')
    .trim()
    .notEmpty()
    .withMessage('Message is required')
    .isLength({ min: 10, max: 2000 })
    .withMessage('Message must be between 10 and 2000 characters')
    .customSanitizer((value) => sanitizeText(value)),
  validate,
];

// Newsletter validation
const validateNewsletter = [
  body('email')
    .trim()
    .notEmpty()
    .withMessage('Email is required')
    .isEmail()
    .withMessage('Invalid email format')
    .normalizeEmail(),
  validate,
];

// Product validation
const validateProduct = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Product name is required')
    .isLength({ min: 3, max: 200 })
    .withMessage('Product name must be between 3 and 200 characters')
    .customSanitizer((value) => sanitizeText(value)),
  body('category_id')
    .notEmpty()
    .withMessage('Category is required')
    .isMongoId()
    .withMessage('Invalid category ID'),
  body('price')
    .notEmpty()
    .withMessage('Price is required')
    .isFloat({ min: 0 })
    .withMessage('Price must be a positive number'),
  body('description')
    .optional()
    .customSanitizer((value) => (value ? sanitizeHtml(value) : '')),
  body('sku')
    .optional()
    .trim()
    .customSanitizer((value) => (value ? sanitizeText(value) : '')),
  validate,
];

// Category validation
const validateCategory = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Category name is required')
    .isLength({ min: 2, max: 100 })
    .withMessage('Category name must be between 2 and 100 characters')
    .customSanitizer((value) => sanitizeText(value)),
  body('description')
    .optional()
    .customSanitizer((value) => (value ? sanitizeHtml(value) : '')),
  validate,
];

// Article validation
const validateArticle = [
  body('title')
    .trim()
    .notEmpty()
    .withMessage('Title is required')
    .isLength({ min: 5, max: 200 })
    .withMessage('Title must be between 5 and 200 characters')
    .customSanitizer((value) => sanitizeText(value)),
  body('content')
    .trim()
    .notEmpty()
    .withMessage('Content is required')
    .isLength({ min: 50 })
    .withMessage('Content must be at least 50 characters')
    .customSanitizer((value) => sanitizeHtml(value)),
  body('excerpt')
    .optional()
    .customSanitizer((value) => (value ? sanitizeText(value) : '')),
  validate,
];

module.exports = {
  sanitizeHtml,
  sanitizeText,
  validate,
  validateLogin,
  validateInquiry,
  validateNewsletter,
  validateProduct,
  validateCategory,
  validateArticle,
};
