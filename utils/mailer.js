const sendEmail = async (mailOptions) => {
  try {
    const payload = {
      from: {
        email: process.env.EMAIL_FROM_EMAIL || 'noreply@neureka.ng',
        name: process.env.EMAIL_FROM_NAME || 'Neureka'
      },
      to: [
        {
          email: mailOptions.to
        }
      ],
      subject: mailOptions.subject,
      text: mailOptions.text,
      html: mailOptions.html,
      category: mailOptions.category || 'General'
    };

    console.log('Sending email via Mailtrap API to:', mailOptions.to);
    
    const response = await fetch('https://send.api.mailtrap.io/api/send', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.MAILTRAP_API_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
      timeout: 15000
    });

    const responseData = await response.json();

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}, message: ${responseData.message}`);
    }

    console.log('✅ Email sent successfully via Mailtrap API');
    console.log('Message ID:', responseData.message_ids?.[0]);

    return {
      success: true,
      messageId: responseData.message_ids?.[0],
      response: responseData
    };
  } catch (error) {
    console.error('❌ Email sending failed:');
    console.error('Error:', error.message);
    
    return {
      success: false,
      error: error.message
    };
  }
};

module.exports = {
  sendEmail
};