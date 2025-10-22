const nodemailer = require("nodemailer");

// Railway-optimized configuration
const createTransporter = () => {
  // Get Mailtrap token - Railway automatically provides this
  const mailtrapToken = process.env.MAILTRAP_TOKEN;

  if (!mailtrapToken) {
    console.error('❌ MAILTRAP_TOKEN is not set in Railway environment variables');
    throw new Error('Email service not configured - missing MAILTRAP_TOKEN');
  }

  const config = {
    host: process.env.SMTP_HOST || "live.smtp.mailtrap.io",
    port: parseInt(process.env.SMTP_PORT) || 587,
    secure: false,
    requireTLS: true,
    auth: {
      user: process.env.SMTP_USER || "api",
      pass: mailtrapToken
    },
    // Railway-optimized timeouts
    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 20000,
    dnsTimeout: 5000,
    tls: {
      rejectUnauthorized: true
    }
  };

  console.log('📧 Creating Mailtrap transporter for Railway:', {
    host: config.host,
    port: config.port,
    user: config.auth.user,
    hasToken: !!config.auth.pass,
    environment: process.env.NODE_ENV
  });

  // FIX: Use createTransport (not createTransporter)
  return nodemailer.createTransport(config);
};

let transport = createTransporter();

// Handle transporter errors (common on Railway)
transport.on('error', (error) => {
  console.error('❌ Mailtrap transporter error:', error.message);
});

transport.on('idle', () => {
  console.log('✅ Mailtrap transporter ready on Railway');
});

const defaultSender = {
  name: process.env.FROM_NAME || "Neureka NG",
  address: process.env.FROM_EMAIL || "hello@neureka.ng",
};

const sendEmail = async (mailOptions) => {
  try {
    console.log(`📨 Sending email via Railway to: ${mailOptions.to}`);

    const info = await transport.sendMail({
      from: defaultSender,
      ...mailOptions
    });

    console.log('✅ Email sent successfully via Railway:', info.messageId);
    return {
      success: true,
      messageId: info.messageId,
      response: info.response
    };

  } catch (error) {
    console.error('❌ Email sending failed on Railway:', {
      message: error.message,
      code: error.code,
      command: error.command
    });

    // Enhanced error for better debugging
    const enhancedError = new Error(`Failed to send email: ${error.message}`);
    enhancedError.code = error.code;
    enhancedError.originalError = error;
    
    throw enhancedError;
  }
};

const verifyConnection = async () => {
  try {
    await transport.verify();
    console.log('✅ Mailtrap connection verified on Railway');
    return true;
  } catch (error) {
    console.error('❌ Mailtrap connection failed on Railway:', error.message);
    
    // Try to recreate transporter
    try {
      transport = createTransporter();
      await transport.verify();
      console.log('✅ Reconnected to Mailtrap successfully');
      return true;
    } catch (retryError) {
      console.error('❌ Failed to reconnect to Mailtrap:', retryError.message);
      return false;
    }
  }
};

// Verify connection on startup in production
if (process.env.NODE_ENV === 'production') {
  console.log('🚀 Initializing Mailtrap on Railway production...');
  verifyConnection().then(success => {
    if (success) {
      console.log('✅ Mailtrap ready for production on Railway');
    } else {
      console.warn('⚠️ Mailtrap connection issue - emails may fail');
    }
  });
}

module.exports = {
  sendEmail,
  transport,
  verifyConnection,
  createTransporter
};