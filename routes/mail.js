const express = require('express');
const router = express.Router();
const { sendEmail } = require('../utils/mailer');

// POST /send-email
router.post('/send-email', async (req, res) => {
  try {
    const { to, subject, text, html, category } = req.body;

    // Validation
    if (!to || !subject || (!text && !html)) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: to, subject, and text or html are required'
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const emails = to.split(',').map(email => email.trim());
    
    for (const email of emails) {
      if (!emailRegex.test(email)) {
        return res.status(400).json({
          success: false,
          error: `Invalid email address format: ${email}`
        });
      }
    }

    // Prepare mail options
    const mailOptions = {
      to: emails.join(', '),
      subject,
      text,
      html: html || text,
      category: category || 'API Email'
    };

    // Send email
    const result = await sendEmail(mailOptions);

    if (result.success) {
      res.json({
        success: true,
        message: 'Email sent successfully via Mailtrap API',
        messageId: result.messageId,
        environment: process.env.NODE_ENV
      });
    } else {
      res.status(500).json({
        success: false,
        error: result.error,
        code: result.code,
        message: 'Failed to send email via Mailtrap API'
      });
    }

  } catch (error) {
    console.error('Route error sending email:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message
    });
  }
});

// GET /send-email (for testing)
router.get('/send-email', async (req, res) => {
  const testMailOptions = {
    to: 'kitgwimmani@gmail.com',
    subject: 'Test Email via Mailtrap API',
    text: 'This is a test email sent via Mailtrap API!',
    html: '<p>This is a <strong>test email</strong> sent via Mailtrap API!</p>',
    category: 'Test'
  };

  try {
    const result = await sendEmail(testMailOptions);
    
    if (result.success) {
      res.json({
        success: true,
        message: 'Test email sent successfully via Mailtrap API',
        messageId: result.messageId
      });
    } else {
      res.status(500).json({
        success: false,
        error: result.error
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