// Diagnostic script to check product images
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const Product = require('../models/Product');

async function checkProductImages() {
  try {
    await mongoose.connect(
      process.env.MONGODB_URI || 'mongodb://localhost:27017/tushar_electronics'
    );
    console.log('✅ Connected to MongoDB\n');

    const products = await Product.find({});
    console.log(`Found ${products.length} products:\n`);

    for (const product of products) {
      console.log(`Product: ${product.name}`);
      console.log(`  ID: ${product._id}`);
      console.log(
        `  Images in DB: ${product.images ? product.images.length : 0}`
      );

      if (product.images && product.images.length > 0) {
        product.images.forEach((img, idx) => {
          const filePath = path.join(__dirname, '..', 'public', img);
          const exists = fs.existsSync(filePath);
          console.log(
            `    [${idx + 1}] ${img} - ${exists ? '✅ EXISTS' : '❌ NOT FOUND'}`
          );
        });
      } else {
        console.log('    ⚠️  No images in database');
      }
      console.log('');
    }

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

checkProductImages();
