// utils/mailer.js
const nodemailer = require('nodemailer');
const mailgunTransport = require('nodemailer-mailgun-transport');

// Configure Mailgun transport
const mailgunOptions = {
  auth: {
    api_key: process.env.MAILGUN_API_KEY,
    domain: process.env.MAILGUN_DOMAIN,
  }
};

const transport = nodemailer.createTransport(mailgunTransport(mailgunOptions));

// Verify connection
transport.verify((error) => {
  if (error) {
    console.log('Mailgun configuration error:', error);
  } else {
    console.log('Mailgun is ready to send emails');
  }
});

const sendEmail = async (to, subject, html, text = '') => {
  try {
    const mailOptions = {
      from: process.env.FROM_EMAIL || 'noreply@yourdomain.com',
      to: to,
      subject: subject,
      html: html,
      text: text
    };

    const result = await transport.sendMail(mailOptions);
    console.log('Email sent successfully to:', to);
    return result;
  } catch (error) {
    console.error('Error sending email:', error);
    throw error;
  }
};

module.exports = { sendEmail };