const bcrypt = require('bcryptjs');
const Product = require('../models/Product');
const Category = require('../models/Category');
const Inquiry = require('../models/Inquiry');
const Article = require('../models/Article');
const Banner = require('../models/Banner');
const Testimonial = require('../models/Testimonial');
const Newsletter = require('../models/Newsletter');
const speakeasy = require('speakeasy');
const qrcode = require('qrcode');
const fs = require('fs');
const path = require('path');

const TWO_FA_FILE = path.join(__dirname, '..', 'data', 'admin-2fa.json');

// Login
exports.login = async (req, res) => {
  try {
    const { username, password } = req.body;
    const envUser = process.env.ADMIN_USERNAME;
    const envPass = process.env.ADMIN_PASSWORD;

    if (username !== envUser || password !== envPass) {
      return res.render('admin/login', {
        error: 'Invalid credentials',
        baseUrl: req.baseUrl,
      });
    }

    // If 2FA is enabled, redirect to verify step
    let twoFaEnabled = false;
    try {
      if (fs.existsSync(TWO_FA_FILE)) {
        const raw = fs.readFileSync(TWO_FA_FILE, 'utf8');
        const obj = JSON.parse(raw || '{}');
        twoFaEnabled = !!obj.enabled;
      }
    } catch (e) {
      twoFaEnabled = false;
    }

    if (twoFaEnabled) {
      // store temp admin info until 2FA verified
      req.session.tempAdmin = { username: envUser };
      return res.redirect(`${req.baseUrl}/2fa/verify`);
    }

    req.session.admin = {
      username: envUser,
      role: 'superadmin',
    };

    // Redirect using router base path so it works under custom mount
    res.redirect(`${req.baseUrl}/dashboard`);
  } catch (error) {
    console.error(error);
    res.render('admin/login', { error: 'Login failed', baseUrl: req.baseUrl });
  }
};

// Logout
exports.logout = (req, res) => {
  req.session.destroy();
  // Redirect back to login under the mounted base path
  res.redirect(`${req.baseUrl}/login`);
};

// 2FA setup page (generate secret + QR)
exports.get2faSetup = async (req, res) => {
  try {
    const envUser = process.env.ADMIN_USERNAME || 'admin';
    const secret = speakeasy.generateSecret({
      length: 20,
      name: `Tushar Electronics Admin (${envUser})`,
    });
    const otpauth = secret.otpauth_url;
    const qrDataUrl = await qrcode.toDataURL(otpauth);
    res.render('admin/2fa_setup', {
      baseUrl: req.baseUrl,
      qrDataUrl,
      secretBase32: secret.base32,
      error: null,
    });
  } catch (e) {
    console.error(e);
    res.render('admin/2fa_setup', {
      baseUrl: req.baseUrl,
      qrDataUrl: null,
      secretBase32: null,
      error: 'Failed to generate 2FA setup',
    });
  }
};

// Enable 2FA (verify provided code against secret then save)
exports.post2faEnable = (req, res) => {
  try {
    const { secret, token } = req.body;
    if (!secret || !token) {
      return res.render('admin/2fa_setup', {
        baseUrl: req.baseUrl,
        qrDataUrl: null,
        secretBase32: secret,
        error: 'Missing secret or token',
      });
    }

    const verified = speakeasy.totp.verify({
      secret,
      encoding: 'base32',
      token,
      window: 1,
    });
    if (!verified) {
      return res.render('admin/2fa_setup', {
        baseUrl: req.baseUrl,
        qrDataUrl: null,
        secretBase32: secret,
        error: 'Invalid token, please try again',
      });
    }

    // save to data file
    const payload = { enabled: true, secret };
    fs.mkdirSync(path.dirname(TWO_FA_FILE), { recursive: true });
    fs.writeFileSync(TWO_FA_FILE, JSON.stringify(payload, null, 2), 'utf8');

    res.redirect(`${req.baseUrl}/dashboard`);
  } catch (e) {
    console.error(e);
    res.render('admin/2fa_setup', {
      baseUrl: req.baseUrl,
      qrDataUrl: null,
      secretBase32: null,
      error: 'Failed to enable 2FA',
    });
  }
};

// Disable 2FA (requires admin logged in)
exports.post2faDisable = (req, res) => {
  try {
    const payload = { enabled: false, secret: '' };
    fs.writeFileSync(TWO_FA_FILE, JSON.stringify(payload, null, 2), 'utf8');
    res.redirect(`${req.baseUrl}/dashboard`);
  } catch (e) {
    console.error(e);
    res.redirect(`${req.baseUrl}/dashboard`);
  }
};

// Show verify form when tempAdmin present
exports.get2faVerify = (req, res) => {
  if (!req.session || !req.session.tempAdmin) {
    return res.redirect(`${req.baseUrl}/login`);
  }
  res.render('admin/2fa_verify', { baseUrl: req.baseUrl, error: null });
};

// Handle verification code submission
exports.post2faVerify = (req, res) => {
  try {
    if (!req.session || !req.session.tempAdmin) {
      return res.redirect(`${req.baseUrl}/login`);
    }
    const { token } = req.body;
    if (!token)
      return res.render('admin/2fa_verify', {
        baseUrl: req.baseUrl,
        error: 'Missing token',
      });

    if (!fs.existsSync(TWO_FA_FILE))
      return res.render('admin/2fa_verify', {
        baseUrl: req.baseUrl,
        error: '2FA not configured',
      });
    const raw = fs.readFileSync(TWO_FA_FILE, 'utf8');
    const obj = JSON.parse(raw || '{}');
    const secret = obj.secret;
    if (!secret)
      return res.render('admin/2fa_verify', {
        baseUrl: req.baseUrl,
        error: '2FA not configured',
      });

    const verified = speakeasy.totp.verify({
      secret,
      encoding: 'base32',
      token,
      window: 1,
    });
    if (!verified)
      return res.render('admin/2fa_verify', {
        baseUrl: req.baseUrl,
        error: 'Invalid token',
      });

    // verified: complete login
    const envUser = process.env.ADMIN_USERNAME;
    req.session.admin = { username: envUser, role: 'superadmin' };
    delete req.session.tempAdmin;
    res.redirect(`${req.baseUrl}/dashboard`);
  } catch (e) {
    console.error(e);
    res.render('admin/2fa_verify', {
      baseUrl: req.baseUrl,
      error: 'Verification failed',
    });
  }
};

// Dashboard
exports.dashboard = async (req, res) => {
  try {
    const [
      totalProducts,
      totalCategories,
      totalInquiries,
      totalArticles,
      newInquiries,
      activeProducts,
      recentInquiries,
      categoryStats,
    ] = await Promise.all([
      Product.countDocuments(),
      Category.countDocuments(),
      Inquiry.countDocuments(),
      Article.countDocuments(),
      Inquiry.countDocuments({ status: 'new' }),
      Product.countDocuments({ status: 'active' }),
      Inquiry.find().sort({ created_at: -1 }).limit(5).populate('product_ids'),
      Product.aggregate([
        { $group: { _id: '$category_id', count: { $sum: 1 } } },
        {
          $lookup: {
            from: 'categories',
            localField: '_id',
            foreignField: '_id',
            as: 'category',
          },
        },
        { $unwind: '$category' },
        { $project: { name: '$category.name', count: 1 } },
        { $sort: { count: -1 } },
        { $limit: 5 },
      ]),
    ]);

    res.render('admin/dashboard', {
      baseUrl: req.baseUrl,
      totalProducts,
      totalCategories,
      totalInquiries,
      totalArticles,
      newInquiries,
      activeProducts,
      recentInquiries,
      categoryStats,
    });
  } catch (error) {
    console.error(error);
    res.render('admin/dashboard', {
      error: 'Failed to load dashboard',
      baseUrl: req.baseUrl,
    });
  }
};
