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
    console.log(`${signal} received; closing HTTP server...`);
    
    // Force shutdown if cleanup takes too long
    const forceShutdownTimeout = setTimeout(() => {
      console.error('Forcing process exit due to cleanup timeout');
      process.exit(1);
    }, 10000); // 10 seconds

    server.close(async () => {
      console.log('HTTP server closed. Closing database pool...');
      try {
        await pool.end();
        console.log('Database pool closed successfully.');
        clearTimeout(forceShutdownTimeout);
        process.exit(0);
      } catch (err) {
        console.error('Error while closing database pool:', err);
        clearTimeout(forceShutdownTimeout);
        process.exit(1);
      }
    });
  };

  // Graceful shutdown signals
  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));

  // Catch unhandled errors globally
  process.on('unhandledRejection', (reason) => {
    console.error('Unhandled Promise Rejection:', reason);
  });

  process.on('uncaughtException', (error) => {
    console.error('Uncaught Exception:', error);
    shutdown('UNCAUGHT_EXCEPTION');
  });
}

start().catch((error) => {
  console.error('Unable to start Orders API:', error);
  process.exit(1);
});