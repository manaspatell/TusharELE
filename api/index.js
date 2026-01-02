const serverless = require('serverless-http');
const app = require('../server');
const db = require('../utils/db');
const { ensureDefaultTestimonials } = require('../utils/ensureDefaults');

let bootPromise = null;

async function boot() {
  // Connect to DB once per cold start
  await db.connect();
  // Ensure initial data exists
  await ensureDefaultTestimonials();
}

if (!bootPromise) {
  bootPromise = boot().catch((err) => {
    console.error('Error during cold-start boot:', err);
  });
}

const handler = serverless(app);

module.exports = async (req, res) => {
  // Ensure boot finished before handling first request
  await bootPromise;
  return handler(req, res);
};
