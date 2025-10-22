const express = require('express');
const router = express.Router();
const { sendEmail } = require('../utils/mailer');

router.post('/send-email', async (req, res) => {
  try {
    const { to, subject, text, html, category } = req.body;

    console.log('Received email request:', { to, subject });

    // Validation
    if (!to || !subject || (!text && !html)) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: to, subject, and text or html are required'
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(to)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid email address format'
      });
    }

    // Send email
    const result = await sendEmail({
      to,
      subject,
      text,
      html: html || text,
      category: category || 'API Test'
    });

    if (result.success) {
      res.json({
        success: true,
        message: 'Email sent successfully via Mailtrap API',
        messageId: result.messageId,
        environment: process.env.NODE_ENV
      });
    } else {
      // Provide specific error messages based on status code
      let errorMessage = 'Failed to send email';
      if (result.status === 401) {
        errorMessage = 'Invalid API token - check your Mailtrap token';
      } else if (result.status === 403) {
        errorMessage = 'API token does not have sending permissions';
      } else if (result.status === 422) {
        errorMessage = 'Validation failed - check email format and parameters';
      }

      res.status(500).json({
        success: false,
        error: errorMessage,
        details: result.data || result.error
      });
    }

  } catch (error) {
    console.error('Route error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message
    });
  }
});

// Test endpoint
router.get('/test-email', async (req, res) => {
  const testMailOptions = {
    to: 'kitgwimmani@gmail.com',
    subject: 'Test Email from Neureka',
    text: 'This is a test email from Neureka via Mailtrap API!',
    html: '<p>This is a <strong>test email</strong> from Neureka via Mailtrap API!</p>',
    category: 'Test'
  };

  try {
    const result = await sendEmail(testMailOptions);
    
    if (result.success) {
      res.json({
        success: true,
        message: 'Test email sent successfully',
        messageId: result.messageId
      });
    } else {
      res.status(500).json({
        success: false,
        error: result.error,
        details: result.data
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;