const Banner = require('../models/Banner');
const { buildUploadPath, deletePublicFile } = require('../utils/helpers');

// List all banners
exports.list = async (req, res) => {
  try {
    const banners = await Banner.find().sort({ order: 1, created_at: -1 });
    res.render('admin/banners/list', { banners, baseUrl: req.baseUrl });
  } catch (error) {
    res.render('admin/banners/list', { error: 'Failed to load banners' });
  }
};

// Show create form
exports.createForm = (req, res) => {
  res.render('admin/banners/form', { banner: null, baseUrl: req.baseUrl });
};

// Create banner
exports.create = async (req, res) => {
  try {
    const { title, subtitle, link, status, order } = req.body;

    if (!req.file) {
      return res.render('admin/banners/form', {
        banner: null,
        error: 'Image is required',
        baseUrl: req.baseUrl,
      });
    }

    const banner = new Banner({
      title,
      subtitle,
      image: buildUploadPath('banners', req.file.filename),
      link: link || '',
      status: status || 'active',
      order: parseInt(order) || 0,
    });

    await banner.save();
    res.redirect(`${req.baseUrl}/banners`);
  } catch (error) {
    console.error(error);
    res.render('admin/banners/form', {
      banner: null,
      error: 'Failed to create banner',
      baseUrl: req.baseUrl,
    });
  }
};

// Show edit form
exports.editForm = async (req, res) => {
  try {
    const banner = await Banner.findById(req.params.id);
    res.render('admin/banners/form', { banner, baseUrl: req.baseUrl });
  } catch (error) {
    res.redirect(`${req.baseUrl}/banners`);
  }
};

// Update banner
exports.update = async (req, res) => {
  try {
    const { title, subtitle, link, status, order } = req.body;
    const banner = await Banner.findById(req.params.id);

    if (!banner) {
      return res.redirect(`${req.baseUrl}/banners`);
    }

    banner.title = title;
    banner.subtitle = subtitle;
    banner.link = link || '';
    banner.status = status || 'active';
    banner.order = parseInt(order) || 0;

    if (req.file) {
      // Delete old image
      if (banner.image) {
        deletePublicFile(banner.image);
      }
      banner.image = buildUploadPath('banners', req.file.filename);
    }

    await banner.save();
    res.redirect(`${req.baseUrl}/banners`);
  } catch (error) {
    console.error(error);
    res.redirect(`${req.baseUrl}/banners`);
  }
};

// Delete banner
exports.delete = async (req, res) => {
  try {
    const banner = await Banner.findById(req.params.id);

    if (banner) {
      // Delete image
      if (banner.image) {
        deletePublicFile(banner.image);
      }

      await Banner.findByIdAndDelete(req.params.id);
    }

    res.redirect(`${req.baseUrl}/banners`);
  } catch (error) {
    res.redirect(`${req.baseUrl}/banners`);
  }
};
