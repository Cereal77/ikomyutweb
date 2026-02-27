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
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
});

// Verify transporter connection
transporter.verify((error, success) => {
  if (error) {
    console.error('Gmail transporter error:', error);
  } else {
    console.log('Gmail transporter ready:', success);
  }
});

// Send Contact Email - No verification required
exports.sendContactEmail = async (req, res) => {
  try {
    const { name, email, message } = req.body;

    // Validation
    if (!name || !email || !message) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    // Validate email format
    if (!isValidEmail(email)) {
      return res.status(400).json({ message: 'Please enter a valid email address' });
    }

    // Save contact directly to database (no verification needed)
    const contact = await Contact.create({
      name,
      email,
      message,
      isVerified: true,
    });

    console.log('Contact saved to database:', contact._id);

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

    // Send confirmation email to user (fire and forget, don't wait)
    transporter.sendMail(userMailOptions, (err, info) => {
      if (err) {
        console.error('Failed to send confirmation email to user:', err.message);
      } else {
        console.log('Confirmation email sent to user:', info.response);
      }
    });

    // Send admin notification email
    const adminMailOptions = {
      from: process.env.GMAIL_USER,
      to: process.env.GMAIL_USER,
      subject: `New Message from ${name}`,
      html: `
        <h2>New Contact Message</h2>
        <p><strong>From:</strong> ${name}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Message:</strong></p>
        <p>${message.replace(/\n/g, '<br>')}</p>
      `,
    };

    // Send admin notification email (fire and forget, don't wait)
    transporter.sendMail(adminMailOptions, (err, info) => {
      if (err) {
        console.error('Failed to send admin notification:', err.message);
      } else {
        console.log('Admin notification sent:', info.response);
      }
    });

    // Return success immediately
    res.status(200).json({
      message: 'Thank you! Your message has been received. We will get back to you soon.',
      status: 'ok',
    });
  } catch (error) {
    console.error('Error:', error.message);
    res.status(500).json({
      message: 'Failed to process your message. Please try again later.',
      error: error.message,
    });
  }
};

