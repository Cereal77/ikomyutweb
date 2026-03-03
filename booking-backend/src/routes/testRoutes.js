const express = require("express");
const router = express.Router();
const nodemailer = require("nodemailer");

// Create Nodemailer transporter
const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587,
  secure: false,
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
});

// Test email sending
router.post("/send-test-email", async (req, res) => {
  try {
    console.log('🧪 TEST: Attempting to send test email');
    console.log('📧 Gmail User:', process.env.GMAIL_USER);
    console.log('🔐 Has password:', !!process.env.GMAIL_APP_PASSWORD);
    
    const testEmail = req.body.testEmail || "test@example.com";
    
    const mailOptions = {
      from: process.env.GMAIL_USER,
      to: testEmail,
      subject: 'Test Email - iKomyut Verification System',
      html: '<h2>Test Email</h2><p>If you received this, email sending works!</p><p>Test code: 123456</p>',
    };

    console.log('📤 Sending test email to:', testEmail);
    const info = await transporter.sendMail(mailOptions);
    
    console.log('✅ Test email sent successfully!');
    console.log('📬 Response:', info.response);
    
    res.json({ 
      success: true, 
      message: 'Test email sent successfully!',
      response: info.response,
      messageId: info.messageId
    });
  } catch (error) {
    console.error('❌ Test email failed:', error.message);
    console.error('Error code:', error.code);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to send test email',
      error: error.message,
      code: error.code
    });
  }
});

module.exports = router;
