const crypto = require('crypto');

const generateResetToken = () => {
  const resetToken = crypto.randomBytes(32).toString('hex');
  const resetPasswordToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');
  const resetPasswordExpire = Date.now() + 10 * 60 * 1000; // 10 minutes

  return { resetToken, resetPasswordToken, resetPasswordExpire };
};

module.exports = { generateResetToken };
