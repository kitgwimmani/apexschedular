const express = require('express');
const router = express.Router();
const { sendEmail, verifyConnection } = require('../utils/mailer');

// Health check endpoint
router.get('/health', async (req, res) => {
  try {
    const isConnected = await verifyConnection();
    res.json({
      success: true,
      data: {
        service: 'email',
        status: isConnected ? 'connected' : 'disconnected',
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    res.status(503).json({
      success: false,
      message: 'Email service health check failed',
      error: error.message
    });
  }
});

// Enhanced email sending with timeout handling
router.post('/send-email', async (req, res) => {
  // Set a reasonable timeout for the request
  req.setTimeout(45000); // 45 seconds
  
  try {
    const { to, subject, text, html } = req.body;

    // Basic validation
    if (!to || !subject || (!text && !html)) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: to, subject, and either text or html'
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const recipients = Array.isArray(to) ? to : [to];
    
    for (const email of recipients) {
      if (!emailRegex.test(email)) {
        return res.status(400).json({
          success: false,
          message: `Invalid email format: ${email}`
        });
      }
    }

    console.log(`Processing email send request to: ${recipients.join(', ')}`);

    const result = await Promise.race([
      sendEmail({
        to: to,
        subject: subject,
        text: text,
        html: html
      }),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Email sending timeout')), 40000)
      )
    ]);

    res.json({
      success: true,
      message: 'Email sent successfully',
      data: result
    });

  } catch (error) {
    console.error('Send email error:', error);
    
    // Specific error handling for production
    let statusCode = 500;
    let errorMessage = 'Failed to send email';
    
    if (error.message.includes('timeout') || error.code === 'ETIMEDOUT') {
      statusCode = 504;
      errorMessage = 'Email service timeout. Please try again.';
    } else if (error.code === 'ECONNECTION') {
      statusCode = 503;
      errorMessage = 'Email service temporarily unavailable.';
    } else if (error.code === 'EAUTH') {
      statusCode = 500;
      errorMessage = 'Email authentication failed. Check your credentials.';
    }

    const errorResponse = {
      success: false,
      message: errorMessage,
      ...(process.env.NODE_ENV === 'development' && { 
        details: error.message,
        stack: error.stack 
      })
    };

    res.status(statusCode).json(errorResponse);
  }
});

// Test endpoint with production checks
router.post('/test', async (req, res) => {
  req.setTimeout(45000);
  
  try {
    const { email } = req.body;
    const testRecipient = email || "talk2kayceenow@gmail.com";
    
    console.log(`Sending test email to: ${testRecipient}`);

    const result = await Promise.race([
      sendEmail({
        to: [testRecipient],
        subject: "Test Email from Neureka",
        text: "This is a test email from your production server. If you received this, your email setup is working correctly!",
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #333;">Test Email from Production</h1>
            <p>This is a test email from your <strong>production server</strong>.</p>
            <p>If you received this, your email setup is working correctly!</p>
            <p><strong>Timestamp:</strong> ${new Date().toISOString()}</p>
          </div>
        `
      }),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Test email timeout')), 40000)
      )
    ]);

    res.json({
      success: true,
      message: 'Test email sent successfully',
      data: result
    });

  } catch (error) {
    console.error('Test email error:', error);
    
    let statusCode = 500;
    let errorMessage = 'Failed to send test email';

    if (error.message.includes('timeout')) {
      statusCode = 504;
      errorMessage = 'Test email timeout. Check your Mailtrap configuration.';
    }

    res.status(statusCode).json({
      success: false,
      message: errorMessage,
      ...(process.env.NODE_ENV === 'development' && { 
        error: error.message 
      })
    });
  }
});

module.exports = router;