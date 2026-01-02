const express = require('express');
const mongoose = require('mongoose');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

// Security middleware
const { securityHeaders, apiLimiter } = require('./middleware/security');

const app = express();
const PORT = process.env.PORT || 3000;

// MongoDB URI for session store and local dev fallback
const MONGODB_URI =
  process.env.MONGODB_URI || 'mongodb://localhost:27017/tushar_electronics';
if (!process.env.MONGODB_URI) {
  console.warn(
    'Warning: MONGODB_URI not set in environment; using local fallback.'
  );
}

// NOTE: Database connection + one-time initialization are handled in
// `api/index.js` using a serverless-friendly cached connector (see `utils/db.js`).
// For serverless environments (Vercel), filesystem persistence is ephemeral and
// upload paths should not be relied on. See `VERCEL_DEPLOY.md` for recommended
// external storage options (Cloudinary / S3 / GridFS).

// Security Middleware
app.use(securityHeaders);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Static files
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(path.join(__dirname, 'public', 'uploads')));

// API rate limiting
app.use('/api', apiLimiter);
app.use('/inquiry', require('./middleware/security').inquiryLimiter);
app.use('/newsletter', require('./middleware/security').newsletterLimiter);

// Session Configuration
app.use(
  session({
    secret:
      process.env.SESSION_SECRET || 'your-secret-key-change-in-production',
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
      mongoUrl: MONGODB_URI,
    }),
    cookie: {
      maxAge: 1000 * 60 * 60 * 24,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production', // true if production (HTTPS), false otherwise
    },
  })
);

// View Engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Routes
app.use('/api', require('./routes/api'));
// Change admin base path per request
app.use('/admin-tushar-ele-8429', require('./routes/admin'));
// Legacy admin path disabled: return 410 Gone to prevent old path from functioning
// Legacy admin path returns 404 error page
app.use('/admin', (req, res) => {
  try {
    res.status(404).render('customer/404');
  } catch (err) {
    res.status(404).send('404 - This page does not exist');
  }
});

// Dynamic sitemap.xml route
app.get('/sitemap.xml', async (req, res) => {
  try {
    const Product = require('./models/Product');
    const Article = require('./models/Article');
    const Category = require('./models/Category');
    const baseUrl = 'https://tusharagro.com';

    const [products, articles, categories] = await Promise.all([
      Product.find({ status: 'active' }, 'slug updatedAt'),
      Article.find({}, 'slug updatedAt'),
      Category.find({}, 'slug updatedAt'),
    ]);

    let urls = [
      { loc: baseUrl + '/', priority: 1.0 },
      { loc: baseUrl + '/products', priority: 0.8 },
      { loc: baseUrl + '/blog', priority: 0.7 },
      { loc: baseUrl + '/categories', priority: 0.7 },
    ];
    products.forEach((p) =>
      urls.push({
        loc: `${baseUrl}/product/${p.slug}`,
        lastmod: p.updatedAt?.toISOString(),
      })
    );
    articles.forEach((a) =>
      urls.push({
        loc: `${baseUrl}/article/${a.slug}`,
        lastmod: a.updatedAt?.toISOString(),
      })
    );
    categories.forEach((c) =>
      urls.push({
        loc: `${baseUrl}/category/${c.slug}`,
        lastmod: c.updatedAt?.toISOString(),
      })
    );

    const xml =
      '<?xml version="1.0" encoding="UTF-8"?>\n' +
      '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
      urls
        .map(
          (u) =>
            '<url>\n' +
            `  <loc>${u.loc}</loc>\n` +
            (u.lastmod ? `  <lastmod>${u.lastmod}</lastmod>\n` : '') +
            (u.priority ? `  <priority>${u.priority}</priority>\n` : '') +
            '</url>'
        )
        .join('\n') +
      '\n</urlset>';
    res.header('Content-Type', 'application/xml');
    res.send(xml);
  } catch (e) {
    res.status(500).send('Could not generate sitemap');
  }
});

app.use('/', require('./routes/customer'));

// Favicon
app.get('/favicon.ico', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'logo', 'Logo1.png'));
});

// 404 Handler
app.use((req, res) => {
  try {
    res.status(404).render('customer/404');
  } catch (err) {
    res.status(404).send(`
      <html>
        <head><title>404 - Page Not Found</title></head>
        <body style="font-family: Arial; text-align: center; padding: 50px;">
          <h1>404</h1>
          <p>Page Not Found</p>
          <a href="/">Go to Homepage</a>
        </body>
      </html>
    `);
  }
});

// Error Handling
app.use((err, req, res, next) => {
  console.error('Error:', err.message);
  console.error('Stack:', err.stack);

  const isDevelopment = process.env.NODE_ENV === 'development';

  if (err.message && err.message.includes('Failed to lookup view')) {
    return res.status(404).render('customer/404');
  }

  if (req.xhr || req.headers.accept?.includes('json')) {
    return res.status(err.status || 500).json({
      error: isDevelopment ? err.message : 'Something went wrong!',
      ...(isDevelopment && { stack: err.stack }),
    });
  }

  try {
    res.status(err.status || 500).render('customer/404', {
      error: isDevelopment ? err.message : 'Something went wrong!',
    });
  } catch {
    res.status(err.status || 500).send(`
      <html>
        <head><title>Error</title></head>
        <body style="font-family: Arial; text-align: center; padding: 50px;">
          <h1>Error</h1>
          <p>${isDevelopment ? err.message : 'Something went wrong!'}</p>
          <a href="/">Go to Homepage</a>
        </body>
      </html>
    `);
  }
});

// IMPORTANT FIX: No '0.0.0.0' — use normal localhost mode
// Export app for serverless wrapper (api/index.js) or local use in tests.
module.exports = app;
