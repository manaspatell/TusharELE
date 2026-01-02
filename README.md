# Tushar Electronics - E-Commerce Platform

A modern, full-featured e-commerce platform built with Node.js, Express, and MongoDB for Tushar Electronics. Perfect for B2B, custom orders, and electronic product inquiries.

## Features

### Customer Features

- Browse products by category
- Product search and filtering
- Shopping cart (session-based)
- Product inquiry system
- Blog/article reading
- Static pages (About, Contact, FAQ, Policies)
- Newsletter signup
- Recently viewed items

### Admin Features

- Secure admin login
- Dashboard with statistics
- Product management (CRUD)
- Category management (CRUD)
- Inquiry management
- Blog/article management
- Banner management
- Testimonial management
- Newsletter subscriber management

## Installation

1. Install dependencies:

```bash
npm install
```

2. Create a `.env` file based on `.env.example`:

```bash
cp .env.example .env
```

3. Update `.env` with your MongoDB connection string and other settings

4. Seed the database with an admin account:

```bash
npm run seed
```

5. Start the server:

```bash
npm start
```

For development with auto-reload:

```bash
npm run dev
```

6. Access the application:

- Customer site: http://localhost:3000
- Admin panel: http://localhost:3000/admin

## Default Admin Credentials

After running the seed script:

- Username: `admin`
- Password: `admin123`

**⚠️ Change these credentials immediately in production!**

## Email Configuration

The platform uses Gmail SMTP to send inquiry emails. To configure:

1. Enable 2-Step Verification on your Gmail account
2. Generate an App Password: https://myaccount.google.com/apppasswords
3. Add the app password to your `.env` file as `EMAIL_PASS`

**Email:** tusharelectronics8439@gmail.com

## Tech Stack

- **Backend**: Node.js + Express
- **Database**: MongoDB + Mongoose
- **Frontend**: HTML5, CSS3, Bootstrap 5, JavaScript
- **Authentication**: Express Sessions
- **File Upload**: Multer
- **Email**: Nodemailer

## Project Structure

```
├── models/          # MongoDB models
├── routes/          # Express routes
├── controllers/     # Business logic
├── middleware/      # Custom middleware
├── public/          # Static files
│   ├── css/
│   ├── js/
│   └── uploads/
├── views/           # EJS templates
│   ├── admin/
│   └── customer/
└── server.js        # Main entry point
```

## Features Overview

### Customer Features

- 🏠 **Homepage** with banner sliders, featured categories, and trending products
- 🛍️ **Product Browsing** by category with filters and search
- 🛒 **Shopping Cart** (session-based, no checkout)
- 📧 **Inquiry System** - Send product inquiries via email
- 📰 **Blog/Articles** - SEO-optimized articles about electronics
- 📞 **Support Pages** - About, Contact, FAQ, Privacy, Terms, Shipping, Returns
- 🔔 **Newsletter** subscription
- 💬 **WhatsApp** integration button
- 🔍 **Live Search** functionality

### Admin Features

- 📊 **Dashboard** with analytics (products, categories, inquiries, articles)
- 📦 **Product Management** - Add/Edit/Delete with multiple images
- 🏷️ **Category Management** - Organize products by categories
- 📬 **Inquiry Management** - View and manage customer inquiries with status tracking
- ✍️ **Article Management** - Create SEO-optimized blog posts
- 🖼️ **Banner Management** - Manage homepage sliders
- 📈 **Reports** - Category performance and inquiry analytics
- 🔐 **Secure Authentication** with session management

## Database Collections

- `admin` - Admin users
- `categories` - Product categories
- `products` - Product catalog
- `inquiries` - Customer inquiries
- `articles` - Blog posts/articles
- `banners` - Homepage banners
- `testimonials` - Customer testimonials
- `newsletter` - Newsletter subscribers

## API Endpoints

### Customer Routes

- `GET /` - Homepage
- `GET /products` - Product listing
- `GET /product/:slug` - Product details
- `GET /category/:slug` - Category page
- `GET /blog` - Blog listing
- `GET /article/:slug` - Article details
- `POST /inquiry` - Send inquiry
- `POST /newsletter` - Subscribe to newsletter

### Admin Routes

- `GET /admin/login` - Admin login page
- `POST /admin/login` - Admin login
- `GET /admin/dashboard` - Admin dashboard
- `/admin/products` - Product management
- `/admin/categories` - Category management
- `/admin/inquiries` - Inquiry management
- `/admin/articles` - Article management
- `/admin/banners` - Banner management

## Development

```bash
# Install dependencies
npm install

# Run seed script (creates admin and sample data)
npm run seed

# Start development server
npm run dev

# Start production server
npm start
```

## Production Deployment

1. Set `NODE_ENV=production` in `.env`
2. Use a secure `SESSION_SECRET`
3. Configure MongoDB connection string
4. Set up email credentials
5. Change default admin password
6. Configure file upload limits
7. Set up SSL/HTTPS

## Support

For inquiries, contact: **tusharelectronics8439@gmail.com**

## License

ISC
