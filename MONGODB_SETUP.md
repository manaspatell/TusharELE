# MongoDB Setup Guide

You have **two options** to set up MongoDB:

## Option 1: MongoDB Atlas (Cloud - Recommended for Beginners) ⭐

This is the easiest option - no installation needed!

### Steps:

1. **Create a Free Account**
   - Go to: https://www.mongodb.com/cloud/atlas/register
   - Sign up for free (no credit card required)

2. **Create a Cluster**
   - Click "Build a Database"
   - Choose "FREE" (M0 Sandbox)
   - Select a cloud provider and region (choose closest to you)
   - Click "Create"

3. **Create Database User**
   - Go to "Database Access" in left menu
   - Click "Add New Database User"
   - Choose "Password" authentication
   - Username: `tushar_admin` (or any username)
   - Password: Create a strong password (save it!)
   - Database User Privileges: "Atlas admin"
   - Click "Add User"

4. **Whitelist Your IP**
   - Go to "Network Access" in left menu
   - Click "Add IP Address"
   - Click "Add Current IP Address" (or "Allow Access from Anywhere" for testing)
   - Click "Confirm"

5. **Get Connection String**
   - Go to "Database" in left menu
   - Click "Connect" on your cluster
   - Choose "Connect your application"
   - Copy the connection string (looks like: `mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority`)

6. **Update .env File**
   - Open your `.env` file
   - Replace `MONGODB_URI` with your connection string
   - Replace `<password>` with your database user password
   - Replace `<dbname>` with `tushar_electronics` (or add it at the end)

   Example:

   ```
   MONGODB_URI=mongodb+srv://tushar_admin:YourPassword123@cluster0.xxxxx.mongodb.net/tushar_electronics?retryWrites=true&w=majority
   ```

7. **Test Connection**
   ```bash
   npm run seed
   ```

---

## Option 2: Local MongoDB Installation

### For Windows:

1. **Download MongoDB**
   - Go to: https://www.mongodb.com/try/download/community
   - Select: Windows, MSI package
   - Download and run the installer

2. **Install MongoDB**
   - Choose "Complete" installation
   - Install as Windows Service (recommended)
   - Install MongoDB Compass (GUI tool - optional but helpful)

3. **Start MongoDB**
   - MongoDB should start automatically as a service
   - If not, open Services (Win+R, type `services.msc`)
   - Find "MongoDB" and start it

4. **Verify Installation**
   - Open Command Prompt
   - Run: `mongod --version`
   - Should show MongoDB version

5. **Test Connection**
   ```bash
   npm run seed
   ```

### For Mac:

1. **Install using Homebrew**

   ```bash
   brew tap mongodb/brew
   brew install mongodb-community
   ```

2. **Start MongoDB**

   ```bash
   brew services start mongodb-community
   ```

3. **Test Connection**
   ```bash
   npm run seed
   ```

### For Linux (Ubuntu/Debian):

1. **Install MongoDB**

   ```bash
   sudo apt-get update
   sudo apt-get install -y mongodb
   ```

2. **Start MongoDB**

   ```bash
   sudo systemctl start mongod
   sudo systemctl enable mongod
   ```

3. **Test Connection**
   ```bash
   npm run seed
   ```

---

## Quick Test

After setting up MongoDB (either option), test the connection:

```bash
npm run seed
```

You should see:

```
✅ MongoDB Connected
✅ Default admin created (username: admin, password: admin123)
✅ Category created: Televisions
...
✅ Seeding completed!
```

If you see errors, check:

- MongoDB is running (for local installation)
- Connection string is correct (for Atlas)
- IP is whitelisted (for Atlas)
- Password is correct (for Atlas)

---

## Which Option Should I Choose?

- **MongoDB Atlas (Cloud)**: Best for beginners, no installation, works anywhere
- **Local MongoDB**: Best if you want everything on your computer, faster for development

**Recommendation**: Start with MongoDB Atlas - it's easier and works immediately!
