const nodemailer = require('nodemailer');
const Contact = require('../models/Contact');

// Email validation regex - stricter validation
const emailRegex = /^[^\s@]+@[^\s@]+\.[a-zA-Z]{2,}$/;

// Validate email format
const isValidEmail = (email) => {
  // Check basic format
  if (!emailRegex.test(email)) return false;
  
  // Check minimum length
  if (email.length < 5) return false;
  
  // Check if it starts or ends with a dot
  if (email.startsWith('.') || email.endsWith('.')) return false;
  
  // Check if it has consecutive dots
  if (email.includes('..')) return false;
  
  // Check if local part is too short
  const [localPart] = email.split('@');
  if (localPart.length < 1) return false;
  
  return true;
};

// Create Nodemailer transporter with Gmail
const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587,
  secure: false,
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
});

// Verify transporter connection
transporter.verify((error, success) => {
  if (error) {
    console.error('✗ Gmail transporter FAILED:', {
      error: error.message,
      code: error.code,
      user: process.env.GMAIL_USER,
      hasPassword: !!process.env.GMAIL_APP_PASSWORD,
    });
  } else {
    console.log('✓ Gmail transporter ready and verified');
  }
});

// Send Contact Email - No verification required
exports.sendContactEmail = async (req, res) => {
  try {
    const { name, email, message } = req.body;

    console.log('=== Contact Email Received ===');
    console.log('From:', name, 'Email:', email);
    console.log('Message:', message.substring(0, 50) + '...');

    // Validation
    if (!name || !email || !message) {
      console.log('Validation failed: Missing fields');
      return res.status(400).json({ message: 'All fields are required' });
    }

    // Validate email format
    if (!isValidEmail(email)) {
      console.log('Validation failed: Invalid email format -', email);
      return res.status(400).json({ message: 'Please enter a valid email address' });
    }

    // Save contact directly to database (no verification needed)
    const contact = await Contact.create({
      name,
      email,
      message,
      isVerified: true,
    });

    console.log('✓ Contact saved to database:', contact._id);

    // Send confirmation email to user
    const userMailOptions = {
      from: process.env.GMAIL_USER,
      to: email,
      subject: 'We Received Your Message',
      html: `
        <h2>Thank You for Contacting Us</h2>
        <p>Hi ${name},</p>
        <p>We received your message and will get back to you soon.</p>
        <p><strong>Your Message:</strong><br>${message.replace(/\n/g, '<br>')}</p>
        <p>Best regards,<br>The iKomyut Team</p>
      `,
    };

    // Send confirmation email to user - WAIT for result
    console.log('📧 Attempting to send confirmation email to:', email);
    try {
      const userInfo = await transporter.sendMail(userMailOptions);
      console.log('✓ Confirmation email sent successfully:', userInfo.response);
    } catch (userEmailError) {
      console.error('✗ User email failed:', {
        to: email,
        error: userEmailError.message,
        code: userEmailError.code,
      });
      // Don't stop - message is already saved to database
    }

    // Return success to client
    console.log('=== Contact Email Process Completed ===');
    res.status(200).json({
      message: 'Thank you! Your message has been received. We will get back to you soon.',
      status: 'ok',
    });
  } catch (error) {
    console.error('✗ Error in sendContactEmail:', {
      message: error.message,
      stack: error.stack,
    });
    res.status(500).json({
      message: 'Failed to process your message. Please try again later.',
      error: error.message,
    });
  }
};

