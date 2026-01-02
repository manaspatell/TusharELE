require('dotenv').config();
const db = require('./utils/db');
const app = require('./server');

const PORT = process.env.PORT || 3000;

async function start() {
  try {
    await db.connect();
    app.listen(PORT, () => {
      console.log(`Dev server listening on http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error('Failed to start dev server:', err);
    process.exit(1);
  }
}

start();
