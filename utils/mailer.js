const nodemailer = require("nodemailer");

// Create transporter using Mailtrap's SMTP settings
const transport = nodemailer.createTransport({
  host: "live.smtp.mailtrap.io",
  port: 587,
  auth: {
    user: "api", // Mailtrap uses 'api' as username for their sending service
    pass: process.env.MAILTRAP_TOKEN
  }
});

// Default sender
const defaultSender = {
  name: "Neureka NG",
  address: "hello@neureka.ng",
};

const sendEmail = async (mailOptions) => {
  try {
    const info = await transport.sendMail({
      from: defaultSender,
      ...mailOptions
    });
    
    console.log('Email sent successfully:', info.messageId);
    return { 
      success: true, 
      messageId: info.messageId,
      response: info.response 
    };
    
  } catch (error) {
    console.error('Send email error:', error);
    throw error;
  }
};

// Verify connection on startup
transport.verify(function(error, success) {
  if (error) {
    console.error('Mailtrap connection failed:', error);
  } else {
    console.log('Mailtrap transporter is ready to send messages');
  }
});

module.exports = { sendEmail, transport };