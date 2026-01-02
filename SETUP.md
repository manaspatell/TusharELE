# Quick Setup Guide

## Prerequisites

- Node.js (v14 or higher)
- MongoDB (local or cloud instance like MongoDB Atlas)
- Gmail account with App Password enabled

## Step-by-Step Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment Variables

Create a `.env` file in the root directory:

```env
# MongoDB Configuration
MONGODB_URI=mongodb://localhost:27017/tushar_electronics

# Server Configuration
PORT=3000
NODE_ENV=development
SESSION_SECRET=your-super-secret-session-key-change-in-production

# Email Configuration (Gmail)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=tusharelectronics8439@gmail.com
EMAIL_PASS=your-app-password-here
EMAIL_FROM=tusharelectronics8439@gmail.com

# Admin Default Credentials (change after first login)
ADMIN_USERNAME=admin
ADMIN_PASSWORD=admin123
```

### 3. Set Up Gmail App Password

1. Go to your Google Account: https://myaccount.google.com/
2. Enable 2-Step Verification
3. Go to App Passwords: https://myaccount.google.com/apppasswords
4. Generate a new app password for "Mail"
5. Copy the 16-character password
6. Paste it in `.env` as `EMAIL_PASS`

### 4. Start MongoDB

**Local MongoDB:**

```bash
# Windows
mongod

# Mac/Linux
sudo systemctl start mongod
# or
brew services start mongodb-community
```

**MongoDB Atlas (Cloud):**

- Create a free cluster at https://www.mongodb.com/cloud/atlas
- Get your connection string
- Update `MONGODB_URI` in `.env`

### 5. Seed the Database

This creates the default admin account and sample data:

```bash
npm run seed
```

**Default Admin Login:**

- Username: `admin`
- Password: `admin123`

⚠️ **Change these credentials immediately after first login!**

### 6. Start the Server

**Development (with auto-reload):**

```bash
npm run dev
```

**Production:**

```bash
npm start
```

### 7. Access the Application

- **Customer Site:** http://localhost:3000
- **Admin Panel:** http://localhost:3000/admin/login

## First Steps After Setup

1. **Login to Admin Panel**
   - Go to http://localhost:3000/admin/login
   - Use default credentials: admin / admin123
   - Change your password immediately

2. **Add Categories**
   - Go to Admin → Categories
   - Add your product categories (TVs, ACs, etc.)

3. **Add Products**
   - Go to Admin → Products
   - Add products with images, descriptions, and prices

4. **Create Banners**
   - Go to Admin → Banners
   - Add homepage slider banners

5. **Test Inquiry System**
   - Go to customer site
   - Add products to cart
   - Send an inquiry
   - Check your email (tusharelectronics8439@gmail.com)

## Troubleshooting

### MongoDB Connection Error

- Ensure MongoDB is running
- Check your connection string in `.env`
- Verify network/firewall settings

### Email Not Sending

- Verify Gmail App Password is correct
- Check 2-Step Verification is enabled
- Ensure `EMAIL_PASS` in `.env` is the 16-character app password (not your regular password)

### Images Not Uploading

- Check `public/uploads/` directories exist
- Verify file permissions
- Check file size (max 5MB)

### Admin Login Not Working

- Run `npm run seed` again to recreate admin
- Check MongoDB connection
- Verify session configuration

## Production Deployment Checklist

- [ ] Change `NODE_ENV=production` in `.env`
- [ ] Use a strong, unique `SESSION_SECRET`
- [ ] Change default admin password
- [ ] Set up SSL/HTTPS
- [ ] Configure proper MongoDB connection (Atlas recommended)
- [ ] Set up proper file storage (consider cloud storage)
- [ ] Configure email service (consider SendGrid/Mailgun for production)
- [ ] Set up backup system
- [ ] Configure domain and DNS
- [ ] Set up monitoring and logging

## Support

For issues or questions, contact: **tusharelectronics8439@gmail.com**
