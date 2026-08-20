const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS, // Gmail App Password
  },
});

/**
 * Send an email
 * @param {string} to - recipient email
 * @param {string} subject - email subject
 * @param {string} html - email HTML body
 */
const sendEmail = async (to, subject, html) => {
  const mailOptions = {
    from: `"TuniStudy / TuniJob" <${process.env.EMAIL_USER}>`,
    to,
    subject,
    html,
  };

  await transporter.sendMail(mailOptions);
};

/**
 * Password reset email template
 */
const sendPasswordResetEmail = async (to, resetUrl) => {
  const html = `
    <div style="font-family: Inter, sans-serif; max-width: 500px; margin: auto; padding: 32px; background: #0d1117; color: #e6edf3; border-radius: 12px;">
      <h2 style="color: #6c63ff;">Reset Your Password</h2>
      <p>You requested a password reset. Click the button below to set a new password. This link expires in <strong>1 hour</strong>.</p>
      <a href="${resetUrl}" style="display:inline-block; margin-top:16px; padding:12px 28px; background: linear-gradient(135deg, #6c63ff, #00d2ff); color:white; border-radius:9999px; text-decoration:none; font-weight:600;">
        Reset Password
      </a>
      <p style="margin-top: 24px; color: #8b949e; font-size: 13px;">If you didn't request this, you can safely ignore this email.</p>
    </div>
  `;
  await sendEmail(to, 'Password Reset — TuniStudy/TuniJob', html);
};

/**
 * Recruiter approval notification
 */
const sendRecruitApprovedEmail = async (to, name) => {
  const html = `
    <div style="font-family: Inter, sans-serif; max-width: 500px; margin: auto; padding: 32px; background: #0d1117; color: #e6edf3; border-radius: 12px;">
      <h2 style="color: #10b981;">🎉 Recruit Rights Approved!</h2>
      <p>Hi <strong>${name}</strong>,</p>
      <p>Your request to post listings on <strong>TuniJob</strong> has been approved by the admin. You can now post universities, internships, and jobs.</p>
      <p style="margin-top: 24px; color: #8b949e; font-size: 13px;">Log in to your dashboard to get started.</p>
    </div>
  `;
  await sendEmail(to, 'Recruit Rights Approved — TuniJob', html);
};

module.exports = { sendEmail, sendPasswordResetEmail, sendRecruitApprovedEmail };
