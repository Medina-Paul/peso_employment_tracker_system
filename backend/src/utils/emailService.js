import nodemailer from 'nodemailer';

let transporter;
// Ensure you have SMTP credentials in .env if you want to actually send emails.
// If you don't, it will output to the console via jsonTransport.
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
  transporter = nodemailer.createTransport({ jsonTransport: true });
}

export const sendStatusEmail = async (applicantEmail, status) => {
  const isHired = status === 'Hired';

  const mailOptions = {
    from: process.env.EMAIL_FROM || 'PESO Admin <no-reply@example.com>',
    // If DEMO_EMAIL is set, use it; otherwise, send to the actual applicant
    to: process.env.DEMO_EMAIL || applicantEmail, 
    subject: `[${process.env.DEMO_EMAIL ? 'TEST MODE' : 'Status Update'}] ${status}: ${applicantEmail}`,
    html: `
      <div style="font-family: sans-serif; padding: 20px;">
        <h2 style="color: ${isHired ? '#166534' : '#991b1b'};">
          Notification for: ${applicantEmail}
        </h2>
        <p>Status: <strong>${status}</strong></p>
        <p>This is a ${process.env.DEMO_EMAIL ? 'test' : 'system'} notification for the PESO Admin Portal.</p>
      </div>
    `
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('Email send result:', info.message || info);
    return info;
  } catch (err) {
    console.error('Error sending status email:', err);
    throw err;
  }
};