
import nodemailer from 'nodemailer';

// Build transporter from environment variables if provided, otherwise use a
// JSON transport (development fallback) which doesn't actually send emails
// but allows inspection of the generated message.
let transporter;
if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
  const port = process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT, 10) : undefined;
  const secure = process.env.SMTP_SECURE === 'true' || port === 465;

  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: port || 587,
    secure: !!secure,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    }
  });
} else {
  // Development fallback: output the message object to console instead of sending
  transporter = nodemailer.createTransport({ jsonTransport: true });
}

export const sendStatusEmail = async (applicantEmail, status) => {
  const isHired = status === 'Hired';

  const mailOptions = {
    from: process.env.EMAIL_FROM || 'PESO Admin <no-reply@example.com>',
    to: process.env.DEMO_EMAIL || applicantEmail,
    subject: `[TEST MODE] ${isHired ? 'Hired' : 'Rejected'}: ${applicantEmail}`,
    html: `
      <div style="font-family: sans-serif; padding: 20px;">
        <h2 style="color: ${isHired ? '#166534' : '#991b1b'};">
          Notification for: ${applicantEmail}
        </h2>
        <p>Status: <strong>${status}</strong></p>
        <p>This is a test notification for the PESO Admin Portal.</p>
      </div>
    `
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    // When using jsonTransport the message is in `info.message` or `info` itself
    console.log('Email send result:', info);
    return info;
  } catch (err) {
    console.error('Error sending status email:', err);
    throw err;
  }
};