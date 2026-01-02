const rateLimit = require('express-rate-limit');
const helmet = require('helmet');

// Security headers middleware
const securityHeaders = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ['\'self\''],
      styleSrc: [
        '\'self\'',
        '\'unsafe-inline\'',
        'https://cdn.jsdelivr.net',
        'https://fonts.googleapis.com',
      ],
      styleSrcElem: [
        '\'self\'',
        '\'unsafe-inline\'',
        'https://cdn.jsdelivr.net',
        'https://fonts.googleapis.com',
      ],
      scriptSrc: ['\'self\'', '\'unsafe-inline\'', 'https://cdn.jsdelivr.net'],
      scriptSrcAttr: ['\'unsafe-inline\''], // Allow inline event handlers
      imgSrc: ['\'self\'', 'data:', 'https:'],
      fontSrc: [
        '\'self\'',
        'https://cdn.jsdelivr.net',
        'https://fonts.gstatic.com',
      ],
      connectSrc: ['\'self\'', 'https://cdn.jsdelivr.net'],
    },
  },
  crossOriginEmbedderPolicy: false,
});

// Rate limiting for login
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts per window
  message: 'Too many login attempts, please try again after 15 minutes.',
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true,
});

// Rate limiting for API endpoints
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests per window
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

// Rate limiting for inquiry submissions
const inquiryLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // 10 inquiries per hour
  message: 'Too many inquiries submitted, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

// Rate limiting for newsletter
const newsletterLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5, // 5 subscriptions per hour
  message: 'Too many newsletter subscriptions, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

module.exports = {
  securityHeaders,
  loginLimiter,
  apiLimiter,
  inquiryLimiter,
  newsletterLimiter,
};
