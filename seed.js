const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const Admin = require('./models/Admin');
const Category = require('./models/Category');
const Product = require('./models/Product');
const Banner = require('./models/Banner');
const Testimonial = require('./models/Testimonial');
const { generateSlug } = require('./utils/helpers');

// Connect to MongoDB
mongoose
  .connect(
    process.env.MONGODB_URI || 'mongodb://localhost:27017/tushar_electronics'
  )
  .then(async () => {
    console.log('✅ MongoDB Connected');

    // Clear existing data (optional - comment out if you want to keep existing data)
    // await Admin.deleteMany({});
    // await Category.deleteMany({});
    // await Product.deleteMany({});
    // await Banner.deleteMany({});
    // await Testimonial.deleteMany({});

    // Create default admin
    const adminExists = await Admin.findOne({ username: 'admin' });
    if (!adminExists) {
      const hashedPassword = await bcrypt.hash('admin123', 10);
      const admin = new Admin({
        username: 'admin',
        password: hashedPassword,
        role: 'super_admin',
      });
      await admin.save();
      console.log(
        '✅ Default admin created (username: admin, password: admin123)'
      );
    } else {
      console.log('ℹ️  Admin already exists');
    }

    // Create sample categories
    const categories = [
      { name: 'Televisions', description: 'Smart TVs, LED TVs, OLED TVs' },
      {
        name: 'Air Conditioners',
        description: 'Split AC, Window AC, Inverter AC',
      },
      {
        name: 'Washing Machines',
        description: 'Front Load, Top Load, Semi-Automatic',
      },
      {
        name: 'Refrigerators',
        description: 'Single Door, Double Door, Side by Side',
      },
      {
        name: 'Home Appliances',
        description: 'Microwaves, Mixers, Water Purifiers',
      },
    ];

    const createdCategories = [];
    for (const catData of categories) {
      const existing = await Category.findOne({
        slug: generateSlug(catData.name),
      });
      if (!existing) {
        const category = new Category({
          ...catData,
          slug: generateSlug(catData.name),
          status: 'active',
        });
        await category.save();
        createdCategories.push(category);
        console.log(`✅ Category created: ${catData.name}`);
      } else {
        createdCategories.push(existing);
      }
    }

    // Create sample products
    if (createdCategories.length > 0) {
      const products = [
        {
          name: 'Samsung 55" 4K Smart TV',
          category: 'Televisions',
          price: 55000,
          description: '55-inch 4K UHD Smart TV with HDR support',
          sku: 'TV-SAM-55-4K',
          tags: ['smart tv', '4k', 'samsung'],
          specifications: {
            'Screen Size': '55 inches',
            Resolution: '4K UHD',
            'Smart TV': 'Yes',
            HDR: 'Yes',
          },
        },
        {
          name: 'LG 1.5 Ton Split AC',
          category: 'Air Conditioners',
          price: 35000,
          description: '1.5 Ton 5 Star Inverter Split AC',
          sku: 'AC-LG-1.5T',
          tags: ['ac', 'split', 'inverter'],
          specifications: {
            Capacity: '1.5 Ton',
            Type: 'Split AC',
            'Star Rating': '5 Star',
            Inverter: 'Yes',
          },
        },
        {
          name: 'Whirlpool 7kg Front Load Washing Machine',
          category: 'Washing Machines',
          price: 25000,
          description: '7kg Fully Automatic Front Load Washing Machine',
          sku: 'WM-WH-7KG',
          tags: ['washing machine', 'front load', 'automatic'],
          specifications: {
            Capacity: '7 kg',
            Type: 'Front Load',
            'Fully Automatic': 'Yes',
          },
        },
      ];

      for (const prodData of products) {
        const category = createdCategories.find(
          (c) => c.name === prodData.category
        );
        if (category) {
          const existing = await Product.findOne({
            slug: generateSlug(prodData.name),
          });
          if (!existing) {
            const product = new Product({
              name: prodData.name,
              slug: generateSlug(prodData.name),
              category_id: category._id,
              description: prodData.description,
              price: prodData.price,
              sku: prodData.sku,
              tags: prodData.tags,
              specifications: prodData.specifications,
              status: 'active',
            });
            await product.save();
            console.log(`✅ Product created: ${prodData.name}`);
          }
        }
      }
    }

    // Create sample banners (only when SEED_BANNERS=true)
    if (process.env.SEED_BANNERS === 'true') {
      const banners = [
        {
          title: 'Welcome to Tushar Electronics',
          subtitle: 'Your Trusted Electronics Partner',
          status: 'active',
          order: 1,
        },
        {
          title: 'Latest Smart TVs',
          subtitle: 'Up to 30% Off',
          status: 'active',
          order: 2,
        },
      ];

      for (const bannerData of banners) {
        const existing = await Banner.findOne({ title: bannerData.title });
        if (!existing) {
          const banner = new Banner({
            ...bannerData,
            image:
              'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="800" height="400"%3E%3Crect width="800" height="400" fill="%23F7A400"/%3E%3Ctext x="50%25" y="50%25" text-anchor="middle" dy=".3em" fill="white" font-size="32"%3E<%= bannerData.title %>%3C/text%3E%3C/svg%3E',
            link: '/products',
          });
          await banner.save();
          console.log(`✅ Banner created: ${bannerData.title}`);
        }
      }
    } else {
      console.log('ℹ️  Skipping banner seeding (SEED_BANNERS not set to true)');
    }

    // Create sample testimonials
    const testimonials = [
      {
        name: 'Rajesh Kumar',
        feedback: 'Great service and quality products. Highly recommended!',
        rating: 5,
        status: 'active',
      },
      {
        name: 'Priya Sharma',
        feedback: 'Excellent customer support and fast delivery.',
        rating: 5,
        status: 'active',
      },
      {
        name: 'Anita Patel',
        feedback:
          'Solar insect traps significantly reduced pests in my vegetable farm without using pesticides.',
        rating: 5,
        status: 'active',
      },
      {
        name: 'Mahesh Yadav',
        feedback:
          'Lure traps helped us monitor and control fruit fly with minimal chemicals. Very effective!',
        rating: 4,
        status: 'active',
      },
      {
        name: 'Sneha Deshmukh',
        feedback:
          'Plasma‑treated water improved seed germination in our nursery. Impressed with the results.',
        rating: 5,
        status: 'active',
      },
      {
        name: 'Harish Mehta',
        feedback:
          'Honest guidance and quick delivery. Sustainable solutions that actually work in the field.',
        rating: 5,
        status: 'active',
      },
    ];

    for (const testData of testimonials) {
      const existing = await Testimonial.findOne({ name: testData.name });
      if (!existing) {
        const testimonial = new Testimonial(testData);
        await testimonial.save();
        console.log(`✅ Testimonial created: ${testData.name}`);
      }
    }

    console.log('\n✅ Seeding completed!');
    process.exit(0);
  })
  .catch((err) => {
    console.error('❌ Error:', err);
    process.exit(1);
  });
