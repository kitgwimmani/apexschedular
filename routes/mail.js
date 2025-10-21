const express = require('express');
const router = express.Router();
const { sendEmail } = require('../utils/mailer');

router.post('/send-email', async (req, res) => {
  try {
    const { to, subject, text, html } = req.body;

    if (!to || !subject || (!text && !html)) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields'
      });
    }

    const result = await sendEmail({
      from: '"Your App" <noreply@neureka.ng>',
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

module.exports = router;