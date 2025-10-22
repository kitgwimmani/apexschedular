const nodemailer = require('nodemailer');

// Create transporter using Mailtrap API
const createTransporter = () => {
  // For Mailtrap API with token
  return nodemailer.createTransport({
    host: 'send.api.mailtrap.io',
    port: 587,
    secure: false, // Use TLS
    auth: {
      user: 'api',
      pass: process.env.MAILTRAP_API_TOKEN
    },
    connectionTimeout: 10000,
    socketTimeout: 15000
  });
};

const transporter = createTransporter();

// Verify transporter configuration
transporter.verify(function(error, success) {
  if (error) {
    console.log('Mailtrap API connection error:', error);
  } else {
    console.log('Mailtrap API is ready to send emails');
  }
});

// Send email function
const sendEmail = async (mailOptions) => {
  try {
    // Set default from address
    const defaultFrom = process.env.EMAIL_FROM || '"Your App" <noreply@yourapp.com>';
    
    const fullMailOptions = {
      from: mailOptions.from || defaultFrom,
      to: mailOptions.to,
      subject: mailOptions.subject,
      text: mailOptions.text,
      html: mailOptions.html,
      replyTo: mailOptions.replyTo,
      // Mailtrap specific options
      headers: {
        'X-Mailtrap-Category': mailOptions.category || 'General'
      }
    };

    const info = await transporter.sendMail(fullMailOptions);
    
    console.log('Email sent successfully via Mailtrap API:', {
      messageId: info.messageId,
      to: mailOptions.to,
      accepted: info.accepted,
      rejected: info.rejected
    });

    return {
      success: true,
      messageId: info.messageId,
      accepted: info.accepted,
      rejected: info.rejected
    };
  } catch (error) {
    console.error('Error sending email via Mailtrap API:', error);
    
    return {
      success: false,
      error: error.message,
      code: error.code,
      response: error.response
    };
  }
};

module.exports = {
  sendEmail,
  transporter
};