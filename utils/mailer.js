const nodemailer = require('nodemailer');

// Using Mailtrap's API with Nodemailer
const transporter = nodemailer.createTransport({
  host: "send.api.mailtrap.io",
  port: 587,
  auth: {
    user: "api",
    pass: process.env.MAILTRAP_TOKEN
  }
});

const sendEmail = async (mailOptions) => {
  try {
    const info = await transporter.sendMail({
      from: '"Your App" <noreply@neureka.ng>',
      ...mailOptions
    });
    
    console.log('Email sent via API:', info.messageId);
    return { success: true, messageId: info.messageId };
    
  } catch (error) {
    console.error('Send email error:', error);
    throw error;
  }
};

module.exports = { sendEmail };