const mongoose = require('mongoose');

// Serverless-friendly mongoose connector with global cache
// Reuses the existing connection across lambda invocations to avoid
// creating multiple connections (recommended for Vercel / serverless).

const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) {
  throw new Error('MONGODB_URI environment variable is required');
}

let cached = global.__mongoose;
if (!cached) cached = global.__mongoose = { conn: null, promise: null };

async function connect() {
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    const opts = {
      // Recommended options for serverless
      bufferCommands: false,
      // useNewUrlParser and useUnifiedTopology are defaults in Mongoose 6+
    };
    cached.promise = mongoose.connect(MONGODB_URI, opts).then((mongoose) => {
      return mongoose;
    });
  }
  cached.conn = await cached.promise;
  return cached.conn;
}

module.exports = { connect };
