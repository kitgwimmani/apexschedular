const express = require('express');
const router = express.Router();
const { sendEmail } = require('../utils/mailer');

router.post('/send-email', async (req, res) => {
  try {
    const { to, subject, text, html } = req.body;

    // Basic validation
    if (!to || !subject || (!text && !html)) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: to, subject, and either text or html'
      });
    }

    const result = await sendEmail({
      to: to,
      subject: subject,
      text: text,
      html: html
    });

    res.json({
      success: true,
      message: 'Email sent successfully',
      data: result
    });

  } catch (error) {
    console.error('Send email error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send email',
      error: error.message
    });
  }
});

// Test endpoint
router.post('/test', async (req, res) => {
  try {
    const result = await sendEmail({
      to: ["talk2kayceenow@gmail.com"],
      subject: "You are awesome!",
      text: "Congrats for sending test email with Mailtrap!",
      html: "<p>Congrats for sending test email with <strong>Mailtrap</strong>!</p>"
    });

    res.json({
      success: true,
      message: 'Test email sent successfully',
      data: result
    });

  } catch (error) {
    console.error('Test email error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send test email',
      error: error.message
    });
  }
});

module.exports = router;