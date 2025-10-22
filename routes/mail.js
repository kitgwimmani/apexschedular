const express = require('express');
const router = express.Router();
const { sendEmail } = require('../utils/mailer');

// POST /send-email - Send to single recipient
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

// POST /send-many-email - Send to multiple recipients simultaneously
router.post('/send-many-email', async (req, res) => {
  try {
    const { recipients, subject, text, html, category } = req.body;

    console.log('Received bulk email request:', { 
      recipientCount: recipients?.length, 
      subject 
    });

    // Validation
    if (!recipients || !Array.isArray(recipients) || recipients.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Missing or invalid recipients array'
      });
    }

    if (!subject || (!text && !html)) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: subject, and text or html are required'
      });
    }

    // Validate email formats and limit batch size
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const validRecipients = [];
    const invalidEmails = [];

    recipients.forEach(email => {
      if (emailRegex.test(email)) {
        validRecipients.push(email);
      } else {
        invalidEmails.push(email);
      }
    });

    if (validRecipients.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No valid email addresses found',
        invalidEmails
      });
    }

    // Limit batch size to prevent overload
    const MAX_BATCH_SIZE = 50;
    const emailsToSend = validRecipients.slice(0, MAX_BATCH_SIZE);
    
    if (validRecipients.length > MAX_BATCH_SIZE) {
      console.log(`Limiting batch size from ${validRecipients.length} to ${MAX_BATCH_SIZE}`);
    }

    console.log(`Sending to ${emailsToSend.length} valid recipients`);
    if (invalidEmails.length > 0) {
      console.log(`Skipping ${invalidEmails.length} invalid emails:`, invalidEmails);
    }

    // Send emails concurrently
    const emailPromises = emailsToSend.map(email => 
      sendEmail({
        to: email,
        subject,
        text,
        html: html || text,
        category: category || 'Bulk Email'
      })
    );

    // Wait for all emails to complete
    const results = await Promise.allSettled(emailPromises);

    // Process results
    const successful = [];
    const failed = [];

    results.forEach((result, index) => {
      const email = emailsToSend[index];
      if (result.status === 'fulfilled' && result.value.success) {
        successful.push({
          email,
          messageId: result.value.messageId
        });
      } else {
        const error = result.status === 'fulfilled' 
          ? result.value.error 
          : result.reason.message;
        failed.push({
          email,
          error
        });
      }
    });

    // Prepare response
    const response = {
      success: true,
      summary: {
        total: emailsToSend.length,
        successful: successful.length,
        failed: failed.length,
        skippedInvalid: invalidEmails.length
      },
      details: {
        successful,
        failed
      }
    };

    if (invalidEmails.length > 0) {
      response.details.invalidEmails = invalidEmails;
    }

    console.log(`Bulk email completed: ${successful.length}/${emailsToSend.length} successful`);

    res.json(response);

  } catch (error) {
    console.error('Bulk email route error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error during bulk email sending',
      message: error.message
    });
  }
});

// Test endpoint for single email
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

// Test endpoint for multiple emails
router.get('/test-many-email', async (req, res) => {
  const testRecipients = [
    'kitgwimmani@gmail.com',
    'test1@example.com',
    'test2@example.com'
  ];

  const testMailOptions = {
    recipients: testRecipients,
    subject: 'Bulk Test Email from Neureka',
    text: 'This is a bulk test email from Neureka via Mailtrap API!',
    html: '<p>This is a <strong>bulk test email</strong> from Neureka via Mailtrap API!</p>',
    category: 'Bulk Test'
  };

  try {
    // Simulate the bulk email request
    const response = await fetch(`http://localhost:${process.env.PORT || 3000}/send-many-email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testMailOptions)
    });

    const result = await response.json();
    res.json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;