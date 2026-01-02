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

// NOTE: Do NOT provide fallbacks for secrets. `MONGODB_URI` and
// `SESSION_SECRET` must be supplied via `process.env` (Vercel Environment Variables).

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

// Session setup is deferred to `initialize()` which is called after DB connect
// to ensure the session store reuses the same MongoDB client (serverless-safe).

let initialized = false;

async function initialize() {
  if (initialized) return;

  // Require secrets from environment
  if (!process.env.SESSION_SECRET) {
    throw new Error('SESSION_SECRET environment variable is required');
  }

  if (!process.env.MONGODB_URI) {
    throw new Error('MONGODB_URI environment variable is required');
  }

  // Attach session middleware using existing mongoose client to avoid
  // creating multiple connections in serverless environments.
  const client = mongoose.connection.getClient && mongoose.connection.getClient();
  if (!client) {
    throw new Error('Mongoose client not available. Ensure DB is connected before initialize()');
  }

  const store = MongoStore.create({ clientPromise: Promise.resolve(client) });

  app.use(
    session({
      secret: process.env.SESSION_SECRET,
      resave: false,
      saveUninitialized: false,
      store,
      cookie: {
        maxAge: 1000 * 60 * 60 * 24,
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
      },
    })
  );

  // Attach routes after session middleware is configured
  app.use('/api', require('./routes/api'));
  app.use('/admin-tushar-ele-8429', require('./routes/admin'));
  app.use('/admin', (req, res) => {
    try {
      res.status(404).render('customer/404');
    } catch (err) {
      res.status(404).send('404 - This page does not exist');
    }
  });

  app.use('/', require('./routes/customer'));

  initialized = true;
}

// View Engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Health endpoint for debugging (safe to remove after debugging)
app.get('/_health', (req, res) => {
  try {
    const dbState = typeof mongoose !== 'undefined' ? mongoose.connection.readyState : -1;
    return res.json({
      ok: true,
      env: {
        mongodb: !!process.env.MONGODB_URI,
        sessionSecret: !!process.env.SESSION_SECRET,
      },
      dbState,
    });
  } catch (err) {
    console.error('Health check error:', err);
    return res.status(500).json({ ok: false, error: err.message });
  }
});

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

// NOTE: routes are attached during `initialize()` once DB + session are ready.

// Favicon
// Favicon - serve safely and log errors. Prefer static serving or placing a
// `favicon.ico` at `public/favicon.ico` for Vercel static handling.
app.get('/favicon.ico', (req, res) => {
  try {
    const faviconPath = path.join(__dirname, 'public', 'logo', 'Logo1.png');
    if (fs.existsSync(faviconPath)) {
      return res.sendFile(faviconPath, (err) => {
        if (err) {
          console.error('Failed to send favicon:', err);
          try {
            res.status(500).end();
          } catch (e) {
            // ignore
          }
        }
      });
    }

    console.warn('Favicon not found at', faviconPath);
    return res.status(204).end();
  } catch (err) {
    console.error('Error in favicon handler:', err);
    return res.status(500).end();
  }
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
module.exports.initialize = initialize;
