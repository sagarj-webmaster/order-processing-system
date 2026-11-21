const cron = require('node-cron');
const { Order } = require('../models/Order');

let isJobRunning = false;

/**
 * Transitions all PENDING orders to PROCESSING.
 * Uses an in-memory lock to prevent overlapping executions.
 */
const processPendingOrders = async () => {
  if (isJobRunning) {
    console.warn('[OrderStatusJob] Previous execution still running. Skipping tick.');
    return { skipped: true, modifiedCount: 0 };
  }

  isJobRunning = true;
  try {
    const result = await Order.updateMany(
      { status: 'PENDING' },
      { $set: { status: 'PROCESSING' } }
    );

    if (result.modifiedCount > 0) {
      console.log(
        `[OrderStatusJob] ${new Date().toISOString()} - Moved ${result.modifiedCount} PENDING order(s) to PROCESSING.`
      );
    }

    return { skipped: false, modifiedCount: result.modifiedCount };
  } catch (error) {
    console.error('[OrderStatusJob] Failed to update pending orders:', error);
    throw error;
  } finally {
    isJobRunning = false;
  }
};

const startOrderStatusJob = () => {
  const schedule = process.env.CRON_SCHEDULE || '*/5 * * * *';

  if (!cron.validate(schedule)) {
    throw new Error(`Invalid CRON_SCHEDULE expression: ${schedule}`);
  }

  const task = cron.schedule(schedule, async () => {
    try {
      await processPendingOrders();
    } catch (_) {
      // Already logged inside processPendingOrders
    }
  });

  console.log(`[OrderStatusJob] Scheduled with pattern "${schedule}"`);
  return task;
};

module.exports = {
  processPendingOrders,
  startOrderStatusJob,
};
