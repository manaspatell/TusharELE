// Utility script to fix image paths in database
// This moves images from root uploads to correct subdirectories
// and updates database paths accordingly

const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const Product = require('../models/Product');
const Category = require('../models/Category');
const Article = require('../models/Article');
const Banner = require('../models/Banner');

async function fixImagePaths() {
  try {
    await mongoose.connect(
      process.env.MONGODB_URI || 'mongodb://localhost:27017/tushar_electronics'
    );
    console.log('✅ Connected to MongoDB');

    const uploadsRoot = path.join(__dirname, '..', 'public', 'uploads');
    const productsDir = path.join(uploadsRoot, 'products');
    const categoriesDir = path.join(uploadsRoot, 'categories');
    const articlesDir = path.join(uploadsRoot, 'articles');
    const bannersDir = path.join(uploadsRoot, 'banners');

    // Ensure directories exist
    [productsDir, categoriesDir, articlesDir, bannersDir].forEach((dir) => {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    });

    // Fix Products
    const products = await Product.find({});
    console.log(`\n📦 Found ${products.length} products`);

    for (const product of products) {
      if (product.images && product.images.length > 0) {
        const updatedImages = [];
        for (const imgPath of product.images) {
          const fileName = path.basename(imgPath);

          // Check if file exists in root uploads directory
          const rootPath = path.join(uploadsRoot, fileName);
          const expectedPath = path.join(__dirname, '..', 'public', imgPath);

          if (fs.existsSync(rootPath) && !fs.existsSync(expectedPath)) {
            // File is in root, but database says it's in products/
            const newPath = path.join(productsDir, fileName);
            fs.renameSync(rootPath, newPath);
            const newImagePath = `/uploads/products/${fileName}`;
            updatedImages.push(newImagePath);
            console.log(`  ✅ Moved ${fileName} from root to products/`);
          } else if (
            imgPath.startsWith('/uploads/') &&
            !imgPath.startsWith('/uploads/products/') &&
            !imgPath.startsWith('/uploads/categories/') &&
            !imgPath.startsWith('/uploads/articles/') &&
            !imgPath.startsWith('/uploads/banners/')
          ) {
            // Path doesn't have subdirectory, check if file exists in root
            const oldPath = path.join(uploadsRoot, fileName);
            const newPath = path.join(productsDir, fileName);

            if (fs.existsSync(oldPath)) {
              fs.renameSync(oldPath, newPath);
              const newImagePath = `/uploads/products/${fileName}`;
              updatedImages.push(newImagePath);
              console.log(`  ✅ Moved ${fileName} to products/`);
            } else {
              updatedImages.push(imgPath);
            }
          } else {
            updatedImages.push(imgPath);
          }
        }
        if (JSON.stringify(product.images) !== JSON.stringify(updatedImages)) {
          product.images = updatedImages;
          await product.save();
          console.log(`  ✅ Updated product: ${product.name}`);
        }
      }
    }

    // Fix Categories
    const categories = await Category.find({});
    console.log(`\n📁 Found ${categories.length} categories`);

    for (const category of categories) {
      if (category.image) {
        const fileName = path.basename(category.image);
        const rootPath = path.join(uploadsRoot, fileName);
        const expectedPath = path.join(
          __dirname,
          '..',
          'public',
          category.image
        );

        if (fs.existsSync(rootPath) && !fs.existsSync(expectedPath)) {
          // File is in root, but database says it's in categories/
          const newPath = path.join(categoriesDir, fileName);
          fs.renameSync(rootPath, newPath);
          category.image = `/uploads/categories/${fileName}`;
          await category.save();
          console.log(`  ✅ Moved ${fileName} from root to categories/`);
        } else if (
          category.image.startsWith('/uploads/') &&
          !category.image.startsWith('/uploads/categories/') &&
          !category.image.startsWith('/uploads/products/') &&
          !category.image.startsWith('/uploads/articles/') &&
          !category.image.startsWith('/uploads/banners/')
        ) {
          const oldPath = path.join(uploadsRoot, fileName);
          const newPath = path.join(categoriesDir, fileName);

          if (fs.existsSync(oldPath)) {
            fs.renameSync(oldPath, newPath);
            category.image = `/uploads/categories/${fileName}`;
            await category.save();
            console.log(`  ✅ Moved ${fileName} to categories/`);
          }
        }
      }
    }

    // Fix Articles
    const articles = await Article.find({});
    console.log(`\n📄 Found ${articles.length} articles`);

    for (const article of articles) {
      if (article.image) {
        const fileName = path.basename(article.image);
        const rootPath = path.join(uploadsRoot, fileName);
        const expectedPath = path.join(
          __dirname,
          '..',
          'public',
          article.image
        );

        if (fs.existsSync(rootPath) && !fs.existsSync(expectedPath)) {
          const newPath = path.join(articlesDir, fileName);
          fs.renameSync(rootPath, newPath);
          article.image = `/uploads/articles/${fileName}`;
          await article.save();
          console.log(`  ✅ Moved ${fileName} from root to articles/`);
        } else if (
          article.image.startsWith('/uploads/') &&
          !article.image.startsWith('/uploads/articles/') &&
          !article.image.startsWith('/uploads/products/') &&
          !article.image.startsWith('/uploads/categories/') &&
          !article.image.startsWith('/uploads/banners/')
        ) {
          const oldPath = path.join(uploadsRoot, fileName);
          const newPath = path.join(articlesDir, fileName);

          if (fs.existsSync(oldPath)) {
            fs.renameSync(oldPath, newPath);
            article.image = `/uploads/articles/${fileName}`;
            await article.save();
            console.log(`  ✅ Moved ${fileName} to articles/`);
          }
        }
      }
    }

    // Fix Banners
    const banners = await Banner.find({});
    console.log(`\n🖼️  Found ${banners.length} banners`);

    for (const banner of banners) {
      if (banner.image) {
        const fileName = path.basename(banner.image);
        const rootPath = path.join(uploadsRoot, fileName);
        const expectedPath = path.join(__dirname, '..', 'public', banner.image);

        if (fs.existsSync(rootPath) && !fs.existsSync(expectedPath)) {
          const newPath = path.join(bannersDir, fileName);
          fs.renameSync(rootPath, newPath);
          banner.image = `/uploads/banners/${fileName}`;
          await banner.save();
          console.log(`  ✅ Moved ${fileName} from root to banners/`);
        } else if (
          banner.image.startsWith('/uploads/') &&
          !banner.image.startsWith('/uploads/banners/') &&
          !banner.image.startsWith('/uploads/products/') &&
          !banner.image.startsWith('/uploads/categories/') &&
          !banner.image.startsWith('/uploads/articles/')
        ) {
          const oldPath = path.join(uploadsRoot, fileName);
          const newPath = path.join(bannersDir, fileName);

          if (fs.existsSync(oldPath)) {
            fs.renameSync(oldPath, newPath);
            banner.image = `/uploads/banners/${fileName}`;
            await banner.save();
            console.log(`  ✅ Moved ${fileName} to banners/`);
          }
        }
      }
    }

    // Move any remaining image files from root to products directory
    console.log(
      '\n🔍 Checking for remaining files in root uploads directory...'
    );
    const rootFiles = fs.readdirSync(uploadsRoot).filter((file) => {
      const filePath = path.join(uploadsRoot, file);
      return (
        fs.statSync(filePath).isFile() &&
        /\.(jpg|jpeg|png|gif|webp)$/i.test(file) &&
        file !== '.gitkeep'
      );
    });

    if (rootFiles.length > 0) {
      console.log(`  Found ${rootFiles.length} image files in root directory`);
      for (const file of rootFiles) {
        const oldPath = path.join(uploadsRoot, file);
        const newPath = path.join(productsDir, file);

        // Check if this file is referenced in any product
        const productsWithImage = await Product.find({
          images: { $regex: file, $options: 'i' },
        });

        if (productsWithImage.length > 0) {
          // File is referenced in products, move it
          fs.renameSync(oldPath, newPath);
          console.log(
            `  ✅ Moved ${file} to products/ (referenced in ${productsWithImage.length} product(s))`
          );

          // Update product paths
          for (const product of productsWithImage) {
            const updatedImages = product.images.map((img) => {
              if (img.includes(file)) {
                return `/uploads/products/${file}`;
              }
              return img;
            });
            product.images = updatedImages;
            await product.save();
          }
        } else {
          // Not referenced, move to products anyway (likely product images)
          fs.renameSync(oldPath, newPath);
          console.log(
            `  ✅ Moved ${file} to products/ (assumed product image)`
          );
        }
      }
    }

    console.log('\n✅ Image paths fixed successfully!');
    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error fixing image paths:', error);
    process.exit(1);
  }
}

fixImagePaths();
