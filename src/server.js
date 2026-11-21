require('dotenv').config();
const mongoose = require('mongoose');
const app = require('./app');
const connectDB = require('./config/db');
const { startOrderStatusJob } = require('./jobs/orderStatusJob');
const logger = require('./utils/logger');
const config = require('./config');

// Validate required environment variables before starting
try {
  config; // triggers validation in config/index.js
} catch (err) {
  console.error('Configuration error:', err.message);
  process.exit(1);
}

const PORT = config.port;

let server;
let cronTask;

const startServer = async () => {
  try {
    await connectDB();
    cronTask = startOrderStatusJob();

    server = app.listen(PORT, () => {
      logger.info(`Server running in ${config.nodeEnv} mode on port ${PORT}`, { pid: process.pid });
    });
  } catch (error) {
    logger.error('Failed to start server', { error: error.message, stack: error.stack });
    process.exit(1);
  }
};

// Graceful shutdown
const FORCE_EXIT_TIMEOUT = 10000;
let shutdownStarted = false;
let shutdownTimeout = null;

const forceExit = () => {
  logger.error('Graceful shutdown timed out, forcing exit');
  process.exit(1);
};

const startShutdownTimeout = () => {
  if (shutdownTimeout) {
    clearTimeout(shutdownTimeout);
  }
  shutdownTimeout = setTimeout(forceExit, FORCE_EXIT_TIMEOUT);
  if (shutdownTimeout.unref) {
    shutdownTimeout.unref();
  }
};

const clearShutdownTimeout = () => {
  if (shutdownTimeout) {
    clearTimeout(shutdownTimeout);
    shutdownTimeout = null;
  }
};

const shutdown = async (signal) => {
  if (shutdownStarted) {
    return;
  }
  shutdownStarted = true;

  logger.info(`${signal} received. Shutting down gracefully...`, { signal });
  startShutdownTimeout();

  if (cronTask) {
    cronTask.stop();
  }
  if (server) {
    server.close(async () => {
      try {
        await mongoose.connection.close();
        clearShutdownTimeout();
        logger.info('HTTP server and MongoDB connection closed.');
        process.exit(0);
      } catch (err) {
        logger.error('Error during shutdown', { error: err.message });
        process.exit(1);
      }
    });
  } else {
    clearShutdownTimeout();
    process.exit(0);
  }
};

process.on('SIGINT', () => {
  shutdownStarted = true;
  shutdown('SIGINT');
});

process.on('SIGTERM', () => {
  shutdownStarted = true;
  shutdown('SIGTERM');
});

process.on('unhandledRejection', (err) => {
  logger.error('UNHANDLED REJECTION', {
    error: err.message,
    stack: err.stack,
  });
  shutdown('unhandledRejection');
});

process.on('uncaughtException', (err) => {
  logger.error('UNCAUGHT EXCEPTION', {
    error: err.message,
    stack: err.stack,
  });
  shutdown('uncaughtException');
});

startServer();
