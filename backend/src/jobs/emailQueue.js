const Queue = require('bull');
const { sendOrderConfirmation, sendResetPassword, sendLowStockAlert } = require('../services/email');

const emailQueue = new Queue('email', process.env.REDIS_URL || 'redis://localhost:6379', {
  redis: {
    maxRetriesPerRequest: null,
    enableReadyCheck: false
  }
});

emailQueue.process('send-order-confirmation', async (job) => {
  try {
    await sendOrderConfirmation(job.data);
    console.log('Order confirmation email sent:', job.data.email);
  } catch (error) {
    console.error('Error sending order confirmation email:', error);
    throw error;
  }
});

emailQueue.process('send-reset-password', async (job) => {
  try {
    await sendResetPassword(job.data);
    console.log('Reset password email sent:', job.data.email);
  } catch (error) {
    console.error('Error sending reset password email:', error);
    throw error;
  }
});

emailQueue.process('send-low-stock-alert', async (job) => {
  try {
    await sendLowStockAlert(job.data);
    console.log('Low stock alert sent:', job.data.sellerEmail);
  } catch (error) {
    console.error('Error sending low stock alert:', error);
    throw error;
  }
});

emailQueue.on('completed', (job) => {
  console.log(`Email job completed: ${job.name}`);
});

emailQueue.on('failed', (job, err) => {
  console.error(`Email job failed: ${job.name}`, err);
});

module.exports = emailQueue;
