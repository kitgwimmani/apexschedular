const nodemailer = require("nodemailer");

// Production-optimized transporter configuration
const createTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || "live.smtp.mailtrap.io",
    port: parseInt(process.env.SMTP_PORT) || 587,
    secure: false, // Use TLS
    requireTLS: true, // Force TLS
    auth: {
      user: process.env.SMTP_USER || "api",
      pass: process.env.MAILTRAP_TOKEN
    },
    // Production optimizations
    connectionTimeout: 30000, // 30 seconds
    greetingTimeout: 30000,   // 30 seconds
    socketTimeout: 60000,     // 60 seconds
    dnsTimeout: 30000,        // 30 seconds
    // Retry logic
    retries: 3,
    // Logger for debugging
    logger: process.env.NODE_ENV === 'production',
    // Debug for development
    debug: process.env.NODE_ENV === 'development'
  });
};

const transport = createTransporter();

// Default sender
const defaultSender = {
  name: process.env.FROM_NAME || "Neureka NG",
  address: process.env.FROM_EMAIL || "hello@neureka.ng",
};

const sendEmail = async (mailOptions) => {
  try {
    console.log(`Attempting to send email to: ${mailOptions.to}`);
    
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
    console.error('Send email error:', {
      message: error.message,
      code: error.code,
      command: error.command,
      to: mailOptions.to
    });
    
    // Enhanced error with more context
    const enhancedError = new Error(`Email sending failed: ${error.message}`);
    enhancedError.code = error.code;
    enhancedError.originalError = error;
    throw enhancedError;
  }
};

// Verify connection with better error handling
const verifyConnection = async () => {
  try {
    await transport.verify();
    console.log('Mailtrap connection verified successfully');
    return true;
  } catch (error) {
    console.error('Mailtrap connection failed:', {
      message: error.message,
      code: error.code,
      host: transport.options.host
    });
    return false;
  }
};

// Verify on startup
if (process.env.NODE_ENV === 'production') {
  verifyConnection().then(success => {
    if (!success) {
      console.warn('Initial connection verification failed - emails may still work');
    }
  });
}

module.exports = { 
  sendEmail, 
  transport, 
  verifyConnection,
  createTransporter 
};