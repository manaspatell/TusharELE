const Inquiry = require('../models/Inquiry');
const Product = require('../models/Product');
const mongoose = require('mongoose');
const { sendInquiryEmail, sendAutoReply } = require('../utils/email');
const { sanitizeText } = require('../middleware/validation');

// helper validators (added)
const isValidEmail = (email) => {
  // simple email validation (sufficient for basic server-side checks)
  return typeof email === 'string' && /\S+@\S+\.\S+/.test(email);
};

const allowedStatuses = ['new', 'contacted', 'closed'];

// List all inquiries (Admin)
exports.list = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = 20;
    const skip = (page - 1) * limit;
    const status = req.query.status || 'all';

    const query = status !== 'all' ? { status } : {};

    const inquiries = await Inquiry.find(query)
      .populate('product_ids')
      .sort({ created_at: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Inquiry.countDocuments(query);
    const stats = {
      new: await Inquiry.countDocuments({ status: 'new' }),
      contacted: await Inquiry.countDocuments({ status: 'contacted' }),
      closed: await Inquiry.countDocuments({ status: 'closed' }),
    };

    res.render('admin/inquiries/list', {
      baseUrl: req.baseUrl,
      inquiries,
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      total,
      stats,
      currentStatus: status,
    });
  } catch (error) {
    res.render('admin/inquiries/list', { error: 'Failed to load inquiries' });
  }
};

// View inquiry details (Admin)
exports.view = async (req, res) => {
  try {
    const inquiry = await Inquiry.findById(req.params.id).populate(
      'product_ids'
    );
    res.render('admin/inquiries/view', { inquiry, baseUrl: req.baseUrl });
  } catch (error) {
    res.redirect(`${req.baseUrl}/inquiries`);
  }
};

// Update inquiry status
exports.updateStatus = async (req, res) => {
  try {
    const { status } = req.body;
    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({ success: false, error: 'Invalid status' });
    }
    await Inquiry.findByIdAndUpdate(req.params.id, { status });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Delete inquiry
exports.delete = async (req, res) => {
  try {
    await Inquiry.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (error) {
    res.json({ success: false, error: error.message });
  }
};

// Create inquiry (Customer)
exports.create = async (req, res) => {
  try {
    let { name, email, phone, message, product_ids } = req.body || {};

    // Basic validation
    name = typeof name === 'string' ? sanitizeText(name).trim() : '';
    email = typeof email === 'string' ? email.toLowerCase().trim() : '';
    phone = typeof phone === 'string' ? sanitizeText(phone).trim() : '';
    message = typeof message === 'string' ? sanitizeText(message).trim() : '';

    if (!name || !isValidEmail(email) || !message) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid name, email and message.',
      });
    }

    // Validate and sanitize product_ids
    let productIdsArray = [];
    if (product_ids) {
      const ids = Array.isArray(product_ids) ? product_ids : [product_ids];
      productIdsArray = ids
        .filter(
          (id) => typeof id === 'string' && mongoose.Types.ObjectId.isValid(id)
        )
        .map((id) => new mongoose.Types.ObjectId(id));
    }

    const inquiry = new Inquiry({
      name,
      email,
      phone,
      message,
      product_ids: productIdsArray,
    });

    await inquiry.save();

    // Respond immediately to user (don't wait for emails)
    res.status(201).json({
      success: true,
      message:
        'Your inquiry has been sent successfully! We will contact you shortly.',
      inquiryId: inquiry._id,
      createdAt: inquiry.created_at || inquiry.createdAt || new Date(),
    });

    // Send emails in background (non-blocking)
    setImmediate(async () => {
      try {
        // Populate products for email
        const populatedInquiry = await Inquiry.findById(inquiry._id).populate(
          'product_ids'
        );

        // Prepare product details for email
        const productDetails =
          populatedInquiry.product_ids &&
          populatedInquiry.product_ids.length > 0
            ? populatedInquiry.product_ids
                .map((p) => `- ${p.name || 'Product'} (ID: ${p._id})`)
                .join('\n')
            : 'General inquiry (no specific products)';

        const inquiryEmailPayload = {
          name,
          email,
          phone,
          message,
          product_ids: (populatedInquiry.product_ids || []).map((p) => ({
            name: p.name || 'Product',
            id: p._id,
          })),
        };

        // Use allSettled so one failing email doesn't reject the whole operation
        const results = await Promise.allSettled([
          sendInquiryEmail(inquiryEmailPayload),
          sendAutoReply(email, name, productDetails),
        ]);

        results.forEach((r, idx) => {
          if (r.status === 'rejected') {
            console.error(`Email task ${idx} failed:`, r.reason);
          }
        });
      } catch (error) {
        console.error('Error sending inquiry emails:', error);
        // Do not throw - background only
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Failed to send inquiry. Please try again.',
    });
  }
};
