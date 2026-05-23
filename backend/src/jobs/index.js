const emailQueue = require('./emailQueue');
const inventoryQueue = require('./inventoryQueue');

const startQueues = async () => {
  console.log('Starting Bull queues...');

  // Schedule inventory jobs
  // Release expired reservations every 5 minutes
  await inventoryQueue.add(
    'release-expired-reservations',
    {},
    {
      repeat: { every: 5 * 60 * 1000 }, // 5 minutes
      removeOnComplete: 10,
      removeOnFail: 10
    }
  );

  // Check low stock every hour
  await inventoryQueue.add(
    'check-low-stock',
    {},
    {
      repeat: { every: 60 * 60 * 1000 }, // 1 hour
      removeOnComplete: 10,
      removeOnFail: 10
    }
  );

  console.log('Bull queues started successfully');
};

module.exports = {
  startQueues,
  emailQueue,
  inventoryQueue
};
