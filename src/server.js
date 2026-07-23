require('dotenv').config();

const app = require('./app');
const { pool, verifyDatabaseConnection } = require('./db');

const port = Number(process.env.PORT || 3000);

async function start() {
  await verifyDatabaseConnection();
  const server = app.listen(port, () => {
    console.log(`Orders API listening on port ${port}`);
  });

  const shutdown = (signal) => {
    console.log(`${signal} received; closing server`);
    server.close(async () => {
      await pool.end();
      process.exit(0);
    });
  };

  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
}

start().catch((error) => {
  console.error('Unable to start Orders API:', error);
  process.exit(1);
});
