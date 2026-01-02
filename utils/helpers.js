// Generate slug from string
const generateSlug = (text) => {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w\-]+/g, '')
    .replace(/\-\-+/g, '-')
    .replace(/^-+/, '')
    .replace(/-+$/, '');
};

// Format currency
const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
  }).format(amount);
};

// Truncate text
const truncate = (text, length = 100) => {
  if (text.length <= length) return text;
  return text.substring(0, length) + '...';
};

module.exports = { generateSlug, formatCurrency, truncate };

// Common helpers (no feature changes)

// Build pagination values consistently
const buildPagination = (page = 1, limit = 10, total = 0) => {
  const currentPage = Math.max(1, parseInt(page) || 1);
  const perPage = Math.max(1, parseInt(limit) || 10);
  const totalPages = Math.ceil(total / perPage) || 1;
  const skip = (currentPage - 1) * perPage;
  return { currentPage, perPage, totalPages, total, skip };
};

// Parse comma-separated tags into sanitized array
const parseTags = (tags, sanitizer) => {
  if (!tags) return [];
  const clean = typeof tags === 'string' ? tags : String(tags);
  return clean
    .split(',')
    .map((t) => (sanitizer ? sanitizer(t.trim()) : t.trim()))
    .filter(Boolean);
};

// Build public uploads path prefix for a given folder and filename
const buildUploadPath = (folder, filename) => {
  if (!filename) return '';
  return `/uploads/${folder}/${filename}`;
};

// Safely delete a file under public directory given a web path like
// "/uploads/<folder>/<file>"; silently ignores missing files
const deletePublicFile = (webPath) => {
  try {
    if (!webPath) return;
    const path = require('path');
    const fs = require('fs');
    const fullPath = path.join(__dirname, '..', 'public', webPath);
    if (fs.existsSync(fullPath)) fs.unlinkSync(fullPath);
  } catch (_) {
    // ignore
  }
};

module.exports.buildPagination = buildPagination;
module.exports.parseTags = parseTags;
module.exports.buildUploadPath = buildUploadPath;
module.exports.deletePublicFile = deletePublicFile;
