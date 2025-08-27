const nodemailer = require("nodemailer");
require('dotenv').config({ path: './config.env' });

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

async function sendOnboardingEmail(to, tempPassword) {
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to,
    subject: "Employee Onboarding Login Details",
    text: `Welcome to the company! \n\nLogin here: http://localhost:3000/login \nEmail: ${to} \nTemporary Password: ${tempPassword}\n\nPlease reset your password after logging in.`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Welcome to the Company!</h2>
        <p>Your employee onboarding account has been created successfully.</p>
        
        <div style="background-color: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="color: #007bff; margin-top: 0;">Login Details</h3>
          <p><strong>Login URL:</strong> <a href="http://localhost:3000/login">http://localhost:3000/login</a></p>
          <p><strong>Email:</strong> ${to}</p>
          <p><strong>Temporary Password:</strong> <span style="background-color: #fff; padding: 5px 10px; border-radius: 4px; font-family: monospace;">${tempPassword}</span></p>
        </div>
        
        <div style="background-color: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 8px; margin: 20px 0;">
          <p style="margin: 0; color: #856404;"><strong>Important:</strong> Please reset your password after your first login for security purposes.</p>
        </div>
        
        <p>If you have any questions, please contact the HR department.</p>
        
        <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
        <p style="color: #666; font-size: 12px;">This is an automated message. Please do not reply to this email.</p>
      </div>
    `
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log("✅ Email sent successfully to " + to);
    return true;
  } catch (err) {
    console.error("❌ Failed to send email:", err);
    return false;
  }
}

async function sendPasswordResetEmail(to, resetToken) {
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to,
    subject: "Password Reset Request",
    text: `You requested a password reset. Click the link below to reset your password:\n\nhttp://localhost:3000/reset-password?token=${resetToken}\n\nIf you didn't request this, please ignore this email.`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Password Reset Request</h2>
        <p>You requested a password reset for your account.</p>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="http://localhost:3000/reset-password?token=${resetToken}" 
             style="background-color: #007bff; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
            Reset Password
          </a>
        </div>
        
        <p>If the button doesn't work, copy and paste this link into your browser:</p>
        <p style="word-break: break-all; background-color: #f5f5f5; padding: 10px; border-radius: 4px;">
          http://localhost:3000/reset-password?token=${resetToken}
        </p>
        
        <div style="background-color: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 8px; margin: 20px 0;">
          <p style="margin: 0; color: #856404;"><strong>Security Note:</strong> This link will expire in 1 hour. If you didn't request this password reset, please ignore this email.</p>
        </div>
        
        <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
        <p style="color: #666; font-size: 12px;">This is an automated message. Please do not reply to this email.</p>
      </div>
    `
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log("✅ Password reset email sent successfully to " + to);
    return true;
  } catch (err) {
    console.error("❌ Failed to send password reset email:", err);
    return false;
  }
}

module.exports = { sendOnboardingEmail, sendPasswordResetEmail };
