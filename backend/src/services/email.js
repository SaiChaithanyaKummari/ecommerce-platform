const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: process.env.EMAIL_PORT || 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

const sendOrderConfirmation = async ({ email, name, orderId, totalAmount }) => {
  const mailOptions = {
    from: process.env.EMAIL_FROM,
    to: email,
    subject: 'Order Confirmation - Your Order has been Placed',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Order Confirmation</h2>
        <p>Dear ${name},</p>
        <p>Thank you for your order! Your order has been successfully placed and is being processed.</p>
        <div style="background: #f5f5f5; padding: 20px; margin: 20px 0; border-radius: 5px;">
          <p><strong>Order ID:</strong> ${orderId}</p>
          <p><strong>Total Amount:</strong> $${totalAmount.toFixed(2)}</p>
        </div>
        <p>You will receive another email when your order ships.</p>
        <p>Thank you for shopping with us!</p>
      </div>
    `
  };

  await transporter.sendMail(mailOptions);
};

const sendResetPassword = async ({ email, name, resetUrl }) => {
  const mailOptions = {
    from: process.env.EMAIL_FROM,
    to: email,
    subject: 'Password Reset Request',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Password Reset</h2>
        <p>Dear ${name},</p>
        <p>You requested a password reset. Click the button below to reset your password:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${resetUrl}" style="background: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">Reset Password</a>
        </div>
        <p>This link will expire in 10 minutes.</p>
        <p>If you didn't request this, please ignore this email.</p>
      </div>
    `
  };

  await transporter.sendMail(mailOptions);
};

const sendLowStockAlert = async ({ productName, currentStock, sellerEmail }) => {
  const mailOptions = {
    from: process.env.EMAIL_FROM,
    to: sellerEmail,
    subject: 'Low Stock Alert',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #dc3545;">Low Stock Alert</h2>
        <p>The following product is running low on stock:</p>
        <div style="background: #fff3cd; padding: 20px; margin: 20px 0; border-radius: 5px; border-left: 4px solid #ffc107;">
          <p><strong>Product:</strong> ${productName}</p>
          <p><strong>Current Stock:</strong> ${currentStock}</p>
        </div>
        <p>Please restock this product soon to avoid missing sales.</p>
      </div>
    `
  };

  await transporter.sendMail(mailOptions);
};

module.exports = {
  sendOrderConfirmation,
  sendResetPassword,
  sendLowStockAlert
};
