const nodemailer = require('nodemailer');

// Helper to determine if actual SMTP credentials are provided
const hasSmtpConfig = () => {
  return Boolean(
    (process.env.EMAIL_USER && process.env.EMAIL_PASS && !process.env.EMAIL_USER.includes('your_gmail')) ||
    process.env.SMTP_USER
  );
};

// Create transporter
const createTransporter = () => {
  if (process.env.SMTP_HOST) {
    return nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT) || 587,
      secure: Number(process.env.SMTP_PORT) === 465,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }

  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });
};

/**
 * Send an email
 * If SMTP is not yet configured, logs the email gracefully so password reset works in dev/sandbox
 */
const sendEmail = async (to, subject, html) => {
  const fromAddress = process.env.FROM_EMAIL || process.env.EMAIL_USER || 'noreply@tuniverse.tn';

  if (!hasSmtpConfig()) {
    console.log('\n📧 [MAIL NOTICE] SMTP credentials not configured. Outgoing email logged:');
    console.log(`To: ${to}`);
    console.log(`Subject: ${subject}`);
    console.log('─────────────────────────────────────────────────────────────────\n');
    return { logged: true };
  }

  const transporter = createTransporter();
  const mailOptions = {
    from: `"TuniVerse" <${fromAddress}>`,
    to,
    subject,
    html,
  };

  return await transporter.sendMail(mailOptions);
};

/**
 * Password reset email template
 */
const sendPasswordResetEmail = async (to, resetUrl) => {
  const html = `
    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 540px; margin: auto; padding: 36px 28px; background: #0B0C10; color: #F3F4F6; border-radius: 16px; border: 1px solid #2A2E39;">
      <div style="text-align: center; margin-bottom: 24px;">
        <div style="display: inline-block; width: 44px; height: 44px; line-height: 44px; background: #E11D48; border-radius: 12px; color: white; font-size: 22px; font-weight: 800;">T</div>
        <h2 style="color: #FFFFFF; font-size: 22px; margin: 12px 0 4px 0; font-weight: 700;">TuniVerse Password Reset</h2>
        <p style="color: #9CA3AF; font-size: 13px; margin: 0;">Academic & Career Platform</p>
      </div>

      <p style="color: #D1D5DB; font-size: 15px; line-height: 1.6;">You recently requested to reset your password for your TuniVerse account. Click the button below to set a new password:</p>

      <div style="text-align: center; margin: 32px 0;">
        <a href="${resetUrl}" style="display: inline-block; padding: 14px 34px; background: #E11D48; color: #FFFFFF; border-radius: 8px; text-decoration: none; font-weight: 700; font-size: 15px; box-shadow: 0 4px 14px rgba(225, 29, 72, 0.4);">
          Reset My Password
        </a>
      </div>

      <div style="background: #151821; border-radius: 8px; padding: 14px; border: 1px solid #232733; margin-bottom: 24px;">
        <p style="margin: 0; color: #9CA3AF; font-size: 12px; line-height: 1.5;">Or copy and paste this link into your browser:</p>
        <p style="margin: 6px 0 0 0; word-break: break-all; color: #60A5FA; font-size: 12px;">${resetUrl}</p>
      </div>

      <p style="color: #9CA3AF; font-size: 12px; line-height: 1.5; margin-bottom: 4px;">⏳ This password reset link expires in <strong>1 hour</strong>.</p>
      <p style="color: #6B7280; font-size: 12px; margin: 0;">If you did not request a password reset, you can safely ignore this email — your account remains secure.</p>
    </div>
  `;

  return await sendEmail(to, '🔐 Reset your TuniVerse password', html);
};

/**
 * Recruiter approval notification
 */
const sendRecruitApprovedEmail = async (to, name) => {
  const html = `
    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 540px; margin: auto; padding: 36px 28px; background: #0B0C10; color: #F3F4F6; border-radius: 16px; border: 1px solid #2A2E39;">
      <h2 style="color: #10B981; margin-top: 0;">🎉 Recruiter Rights Approved!</h2>
      <p>Hi <strong>${name}</strong>,</p>
      <p style="color: #D1D5DB; line-height: 1.6;">Your request for Recruiter Rights on <strong>TuniVerse Career Centre</strong> has been approved by the platform administration.</p>
      <p style="color: #D1D5DB; line-height: 1.6;">You can now post job opportunities, internship stages, and review applicant CVs directly from your Recruiter Hub.</p>
      <p style="margin-top: 24px; color: #9CA3AF; font-size: 13px;">Log in to your dashboard to get started.</p>
    </div>
  `;

  return await sendEmail(to, '🎉 Recruiter Rights Approved — TuniVerse', html);
};

module.exports = { sendEmail, sendPasswordResetEmail, sendRecruitApprovedEmail, hasSmtpConfig };
