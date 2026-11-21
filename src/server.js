require('dotenv').config();
const mongoose = require('mongoose');
const app = require('./app');
const connectDB = require('./config/db');
const { startOrderStatusJob } = require('./jobs/orderStatusJob');

const PORT = process.env.PORT || 5000;

let server;
let cronTask;

const startServer = async () => {
  await connectDB();
  cronTask = startOrderStatusJob();

  server = app.listen(PORT, () => {
    console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
  });
};

// Graceful shutdown
const shutdown = async (signal) => {
  console.log(`\n${signal} received. Shutting down gracefully...`);
  if (cronTask) cronTask.stop();
  if (server) {
    server.close(async () => {
      await mongoose.connection.close();
      console.log('HTTP server and MongoDB connection closed.');
      process.exit(0);
    });
  }
};

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));

process.on('unhandledRejection', (err) => {
  console.error('UNHANDLED REJECTION:', err);
  shutdown('unhandledRejection');
});

startServer();
