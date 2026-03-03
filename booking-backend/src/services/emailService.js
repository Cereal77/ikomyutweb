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

// Verify transporter on startup
console.log('\n========== EMAIL SERVICE INITIALIZATION ==========');
console.log('📧 Gmail User:', process.env.GMAIL_USER);
console.log('🔐 App Password present:', !!process.env.GMAIL_APP_PASSWORD);
console.log('Host: smtp.gmail.com');
console.log('Port: 587');
console.log('Secure: false (STARTTLS)');

transporter.verify((error, success) => {
  if (error) {
    console.error('❌ ❌ ❌ GMAIL TRANSPORTER VERIFICATION FAILED ❌ ❌ ❌');
    console.error('Error type:', error.code);
    console.error('Error message:', error.message);
    console.error('Full error:', error);
  } else {
    console.log('✅ ✅ ✅ GMAIL TRANSPORTER VERIFIED AND READY ✅ ✅ ✅');
  }
});
console.log('=================================================\n');

// Function to send verification email
async function sendVerificationEmail(email, fullName, verificationCode) {
  try {
    console.log('\n📧 ============= SENDING VERIFICATION EMAIL =============');
    console.log('📧 TO:', email);
    console.log('👤 NAME:', fullName);
    console.log('🔐 CODE:', verificationCode);
    console.log('⏰ TIME:', new Date().toLocaleString());

    const mailOptions = {
      from: process.env.GMAIL_USER,
      to: email,
      subject: 'Verify Your iKomyut Email - 6-Digit Code',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #009432;">Email Verification</h2>
          <p>Hi ${fullName},</p>
          <p>Welcome to iKomyut! Please verify your email address to complete your registration.</p>
          <div style="background-color: #f0f0f0; padding: 20px; border-radius: 8px; text-align: center; margin: 20px 0;">
            <p style="margin: 0; color: #666; font-size: 14px;">Your verification code:</p>
            <p style="font-size: 32px; font-weight: bold; letter-spacing: 5px; margin: 10px 0; color: #009432;">
              ${verificationCode}
            </p>
            <p style="margin: 0; color: #666; font-size: 12px;">This code will expire in 30 minutes.</p>
          </div>
          <p>If you didn't create this account, please ignore this email.</p>
          <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
          <p style="color: #666; font-size: 12px;">Best regards,<br><strong>The iKomyut Team</strong></p>
        </div>
      `,
    };

    console.log('📤 Attempting to send via SMTP...');
    const info = await transporter.sendMail(mailOptions);

    console.log('✅ ✅ ✅ EMAIL SENT SUCCESSFULLY ✅ ✅ ✅');
    console.log('📬 MESSAGE ID:', info.messageId);
    console.log('📬 RESPONSE:', info.response);
    console.log('=========================================================\n');

    return true;
  } catch (error) {
    console.error('\n❌ ❌ ❌ EMAIL SENDING FAILED ❌ ❌ ❌');
    console.error('TO:', email);
    console.error('ERROR TYPE:', error.code);
    console.error('ERROR MESSAGE:', error.message);
    console.error('ERROR FULL:', error);
    console.error('=========================================================\n');

    return false;
  }
}

module.exports = {
  transporter,
  sendVerificationEmail,
};
