# Vercel Deployment & Serverless Migration Guide

This document explains required environment variables, before vs after, and step-by-step instructions to deploy this project to Vercel (free tier) using MongoDB Atlas.

## Environment Variables
- `MONGODB_URI` - MongoDB Atlas connection string (use SRV format recommended by Atlas)
- `SESSION_SECRET` - session secret used by `express-session`
- `NODE_ENV` - `production` on Vercel (set automatically)
- `VERCEL` - set by Vercel at runtime (no need to set)

Example (local .env):

MONGODB_URI="mongodb+srv://<user>:<password>@cluster0.mongodb.net/dbname?retryWrites=true&w=majority"
SESSION_SECRET="replace-this-with-a-long-secret"

## Before vs After (high level)
- Before: `server.js` started an HTTP server with `app.listen()` and established a direct Mongoose connection on start.
- After: `server.js` exports the Express `app`. `api/index.js` is a Vercel serverless entry that:
  - uses a serverless-friendly cached Mongoose connector (`utils/db.js`)
  - wraps Express app via `serverless-http`
  - runs one-time data initialization (`utils/ensureDefaults.js`) during cold start

Notes:
- File uploads: On Vercel the filesystem is ephemeral. The project now writes uploads to `os.tmpdir()` in serverless environment. This preserves functionality but files are not persistent — configure external storage (Cloudinary / S3 / GridFS) for production persistence.

## Files added/changed
- Modified: `server.js` - removed `app.listen()` and direct `mongoose.connect()`; now exports `app`.
- Added: `api/index.js` - Vercel serverless function handler wrapping Express app.
- Added: `utils/db.js` - serverless-friendly Mongoose connector with global cache.
- Added: `utils/ensureDefaults.js` - ensures default testimonial documents on cold-start.
- Modified: `middleware/upload.js` - uses OS temp dir when `process.env.VERCEL` is present.
- Updated: `package.json` - added `serverless-http` dependency.
- Added: `vercel.json` - Vercel config.

## Deployment Steps (quick)
1. Create MongoDB Atlas free tier cluster and database. Create a user and whitelist IPs or set network access to allow connections from anywhere (0.0.0.0/0) for testing.
2. Set project environment variables in Vercel dashboard: `MONGODB_URI`, `SESSION_SECRET`.
3. Push repository to GitHub (or connect your Git provider).
4. In Vercel, create a new project and import the repository. Set the build command to `npm install` and output directory to `/` (default). Vercel will detect `vercel.json` and treat `api/index.js` as serverless function.
5. Deploy. Monitor function logs in Vercel dashboard and check initial DB connection logs.

## Local testing
- Install dependencies: `npm install`
- Create a `.env` file with `MONGODB_URI` and `SESSION_SECRET`
- Run locally (not serverless): `npm start` will still work (it uses `server.js` export if used directly by some tools); to run exactly like before use `node server.js` (but note app no longer listens — use `npm run dev` instructions are updated in report).

## Notes about uploads & static files
- For true persistence, configure external storage and update upload middleware to push files to that service after multer receives them.
- Vercel serves static files efficiently if added to the repository; however runtime uploads to `public/uploads` won't persist across deployments or cold starts.

## Next steps (recommended)
- Migrate uploads to Cloudinary (free tier) or S3 and replace local storage in `middleware/upload.js` to upload to cloud directly.
- Consider moving session store to `connect-mongo` with the `mongoUrl` using Atlas (already supported). On serverless, session store operations will open connections; the cached connector reduces overhead.
- Add health check endpoint and monitoring.

