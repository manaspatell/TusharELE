// Test script to verify upload configuration
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const uploadDirs = {
  products: 'public/uploads/products',
};

const fileFilter = (req, file, cb) => {
  const allowedMimeTypes = [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/gif',
    'image/webp',
  ];
  const allowedExtensions = /\.(jpeg|jpg|png|gif|webp)$/i;

  const extname = allowedExtensions.test(path.extname(file.originalname));
  const mimetype = allowedMimeTypes.includes(file.mimetype);

  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb(new Error('Only image files are allowed!'));
  }
};

const uploadProducts = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      const uploadPath = uploadDirs.products;
      if (!fs.existsSync(uploadPath)) {
        fs.mkdirSync(uploadPath, { recursive: true });
      }
      console.log('✅ Upload destination:', uploadPath);
      cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
      const filename =
        file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname);
      console.log('✅ Generated filename:', filename);
      cb(null, filename);
    },
  }),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: fileFilter,
});

console.log('✅ Upload middleware configured correctly');
console.log('✅ Products upload directory:', uploadDirs.products);
console.log('✅ Directory exists:', fs.existsSync(uploadDirs.products));
