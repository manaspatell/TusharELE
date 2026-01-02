/**
 * scripts/remove_default_banners.js
 *
 * Safe script to remove default banners created by `seed.js`.
 * Usage:
 *   node scripts/remove_default_banners.js           # dry-run (no delete)
 *   node scripts/remove_default_banners.js --dry-run
 *   node scripts/remove_default_banners.js --force   # actually delete
 *
 * The script reads `MONGODB_URI` from env or falls back to localhost.
 */

const mongoose = require('mongoose');
const path = require('path');

// Load env (if you have a .env)
require('dotenv').config();

(async function main() {
  const args = process.argv.slice(2);
  const dryRun =
    args.includes('--dry-run') ||
    (args.length === 0 && !args.includes('--force'));
  const force = args.includes('--force');

  const mongoUri =
    process.env.MONGODB_URI || 'mongodb://localhost:27017/tushar_electronics';

  console.log('Connecting to MongoDB:', mongoUri);
  await mongoose.connect(mongoUri, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });

  // Import Banner model via the project models path
  const Banner = require(path.join(__dirname, '..', 'models', 'Banner'));

  try {
    // Match by titles used in seed.js and by the inline SVG placeholder (color code %23F7A400)
    const titleMatches = ['Welcome to Tushar Electronics', 'Latest Smart TVs'];
    const imagePattern = /%23F7A400/; // encoded #F7A400 used in seed's SVG data URL

    const candidates = await Banner.find({
      $or: [
        { title: { $in: titleMatches } },
        { image: { $regex: imagePattern } },
      ],
    }).lean();

    if (!candidates || candidates.length === 0) {
      console.log('No matching default banners found. Nothing to do.');
      process.exit(0);
    }

    console.log(
      '\nFound the following banner documents that look like seed defaults:'
    );
    candidates.forEach((b) => {
      console.log(
        `- id: ${b._id} | title: "${b.title}" | status: ${b.status} | image: ${String(b.image).slice(0, 80)}${String(b.image).length > 80 ? '...' : ''}`
      );
    });

    if (dryRun && !force) {
      console.log('\nDry-run mode: no documents will be deleted.');
      console.log(
        'To delete them run: node scripts/remove_default_banners.js --force'
      );
      await mongoose.disconnect();
      process.exit(0);
    }

    // Confirm via interactive prompt if not forced
    if (!force) {
      const readline = require('readline');
      const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
      });
      const answer = await new Promise((resolve) =>
        rl.question(
          '\nAre you sure you want to DELETE these banners? Type "yes" to confirm: ',
          (ans) => {
            rl.close();
            resolve(ans);
          }
        )
      );
      if (String(answer).trim().toLowerCase() !== 'yes') {
        console.log('Aborted by user. No changes made.');
        await mongoose.disconnect();
        process.exit(0);
      }
    }

    // Delete matched banners
    const ids = candidates.map((c) => c._id);
    const result = await Banner.deleteMany({ _id: { $in: ids } });

    console.log(`\nDeleted ${result.deletedCount} banner(s).`);
    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error('Error while removing banners:', err);
    await mongoose.disconnect();
    process.exit(1);
  }
})();
