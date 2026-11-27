const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const app = require('./app');
const { initDatabase } = require('./config/db');
const { seedIfEmpty } = require('./seed');

const PORT = Number(process.env.PORT) || 5000;

async function startServer() {
  initDatabase();
  await seedIfEmpty();

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`CampusLoop API server running on http://localhost:${PORT} (network: http://0.0.0.0:${PORT})`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start CampusLoop server:', err);
  process.exit(1);
});

