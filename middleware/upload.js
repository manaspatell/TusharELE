const multer = require('multer');
const path = require('path');
const fs = require('fs');
const os = require('os');

// Ensure upload directories exist
// On Vercel (serverless) the filesystem is ephemeral. If running on Vercel
// we store uploads temporarily in the OS temp dir and warn developers to
// configure external storage (Cloudinary, S3 or GridFS) for persistent files.
const isVercel = Boolean(process.env.VERCEL);
const baseUpload = isVercel ? os.tmpdir() : 'public/uploads';

const uploadDirs = {
  products: path.join(baseUpload, 'products'),
  categories: path.join(baseUpload, 'categories'),
  articles: path.join(baseUpload, 'articles'),
  banners: path.join(baseUpload, 'banners'),
  testimonials: path.join(baseUpload, 'testimonials'),
};

Object.values(uploadDirs).forEach((dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// Storage configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    let uploadPath = baseUpload;

    // Check both baseUrl and originalUrl to determine the route
    const url = req.baseUrl || req.originalUrl || '';
    const path = req.path || '';
    const fullPath = url + path;

    if (fullPath.includes('/products') || fullPath.includes('/product')) {
      uploadPath = uploadDirs.products;
    } else if (
      fullPath.includes('/categories') ||
      fullPath.includes('/category')
    ) {
      uploadPath = uploadDirs.categories;
    } else if (
      fullPath.includes('/articles') ||
      fullPath.includes('/article')
    ) {
      uploadPath = uploadDirs.articles;
    } else if (fullPath.includes('/banners') || fullPath.includes('/banner')) {
      uploadPath = uploadDirs.banners;
    } else if (
      fullPath.includes('/testimonials') ||
      fullPath.includes('/testimonial')
    ) {
      uploadPath = uploadDirs.testimonials;
    }

    // Ensure directory exists
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }

    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(
      null,
      file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname)
    );
  },
});

// File filter with enhanced security
const fileFilter = (req, file, cb) => {
  // Allowed MIME types
  const allowedMimeTypes = [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/gif',
    'image/webp',
  ];

  // Allowed file extensions
  const allowedExtensions = /\.(jpeg|jpg|png|gif|webp)$/i;

  const extname = allowedExtensions.test(path.extname(file.originalname));
  const mimetype = allowedMimeTypes.includes(file.mimetype);

  console.log('File filter check:', {
    originalname: file.originalname,
    mimetype: file.mimetype,
    extname: extname,
    mimetypeMatch: mimetype,
  });

  // Check both extension and MIME type
  if (mimetype && extname) {
    console.log('✅ File accepted:', file.originalname);
    return cb(null, true);
  } else {
    console.log(
      '❌ File rejected:',
      file.originalname,
      'Reason: MIME type or extension not allowed'
    );
    cb(new Error('Only image files (JPEG, PNG, GIF, WebP) are allowed!'));
  }
};

// Create separate upload instances for each type
const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: fileFilter,
});

// Product images upload (multiple files)
const uploadProducts = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      const uploadPath = uploadDirs.products;
      if (!fs.existsSync(uploadPath)) {
        fs.mkdirSync(uploadPath, { recursive: true });
      }
      console.log('Product image upload destination:', uploadPath);
      cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
      const filename =
        file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname);
      console.log('Product image filename:', filename);
      cb(null, filename);
    },
  }),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: fileFilter,
});

// Category image upload (single file)
const uploadCategories = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      const uploadPath = uploadDirs.categories;
      if (!fs.existsSync(uploadPath)) {
        fs.mkdirSync(uploadPath, { recursive: true });
      }
      cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
      cb(
        null,
        file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname)
      );
    },
  }),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: fileFilter,
});

// Article image upload (single file)
const uploadArticles = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      const uploadPath = uploadDirs.articles;
      if (!fs.existsSync(uploadPath)) {
        fs.mkdirSync(uploadPath, { recursive: true });
      }
      cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
      cb(
        null,
        file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname)
      );
    },
  }),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: fileFilter,
});

// Banner image upload (single file)
const uploadBanners = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      const uploadPath = uploadDirs.banners;
      if (!fs.existsSync(uploadPath)) {
        fs.mkdirSync(uploadPath, { recursive: true });
      }
      cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
      cb(
        null,
        file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname)
      );
    },
  }),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: fileFilter,
});

module.exports = upload;
module.exports.products = uploadProducts;
module.exports.categories = uploadCategories;
module.exports.articles = uploadArticles;
module.exports.banners = uploadBanners;
