const User = require("../models/User");
const PendingUser = require("../models/PendingUser");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { sendVerificationEmail } = require("../services/emailService");

// Generate 6-digit verification code
const generateVerificationCode = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// SEND OTP (Placeholder - just for loading screen)
exports.sendOtp = async (req, res) => {
  try {
    const { mobileNo } = req.body;
    if (!mobileNo) return res.status(400).json({ message: "Mobile number is required" });

    // Check if already registered
    const existingUser = await User.findOne({ mobileNo });
    if (existingUser) return res.status(400).json({ message: "Mobile number already registered" });

    // Placeholder response - no actual OTP logic needed
    res.json({ message: "Ready to continue", status: "ok" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// VERIFY OTP (Placeholder - just for loading screen)
exports.verifyOTP = async (req, res) => {
  try {
    const { mobileNo } = req.body;
    if (!mobileNo) return res.status(400).json({ message: "Mobile number is required" });

    // Placeholder response - no actual OTP verification needed
    res.json({ message: "Verified", status: "ok" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// REGISTER
exports.register = async (req, res) => {
  try {
    const { fullName, email, mobileNo, password } = req.body;
    console.log('🔐 NEW REGISTRATION ATTEMPT');
    console.log('👤 Name:', fullName);
    console.log('📧 Email:', email);
    console.log('📱 Mobile:', mobileNo);
    
    if (!fullName || !email || !mobileNo || !password) return res.status(400).json({ message: "All fields are required" });

    // Check if already registered (both User and PendingUser)
    const existingUser = await User.findOne({ $or: [ { mobileNo }, { email } ] });
    const existingPendingUser = await PendingUser.findOne({ $or: [ { mobileNo }, { email } ] });
    
    if (existingUser) {
      if (existingUser.email === email) {
        console.log('❌ Email already registered');
        return res.status(400).json({ message: "Email already registered" });
      } else {
        console.log('❌ Mobile already registered');
        return res.status(400).json({ message: "Mobile number already registered" });
      }
    }

    if (existingPendingUser) {
      console.log('♻️ Deleting old pending registration');
      // Delete the old pending user and create a new one
      await PendingUser.deleteOne({ _id: existingPendingUser._id });
    }

    console.log('🔒 Hashing password...');
    const hashedPassword = await bcrypt.hash(password, 10);
    const verificationCode = generateVerificationCode();
    const verificationCodeExpire = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes

    console.log('💾 Saving to PendingUser collection...');
    // Save to PendingUser collection (not verified yet)
    const pendingUser = await PendingUser.create({
      fullName,
      email,
      mobileNo,
      password: hashedPassword,
      verificationCode,
      verificationCodeExpire,
    });

    console.log('✅ PendingUser saved:', pendingUser._id);
    console.log('🔐 Verification code generated:', verificationCode);

    // Send verification email
    console.log('📧 Calling sendVerificationEmail function...');
    const emailSent = await sendVerificationEmail(email, fullName, verificationCode);

    if (!emailSent) {
      console.log('❌ Email sending failed, deleting pending user');
      await PendingUser.deleteOne({ _id: pendingUser._id });
      return res.status(500).json({ message: "Failed to send verification email. Please try again." });
    }

    console.log('✅ Registration successful, email sent');
    res.status(201).json({ 
      message: "Verification code sent to your email. Please verify to complete registration.", 
      email: pendingUser.email,
      requiresEmailVerification: true 
    });
  } catch (error) {
    console.error('❌ Error in register:', error.message);
    console.error('📋 Stack:', error.stack);
    res.status(500).json({ message: error.message });
  }
};


// LOGIN (for existing users, not used in signup flow)
exports.login = async (req, res) => {
  try {
    const { mobileNo, password } = req.body;
    if (!mobileNo || !password) {
      return res.status(400).json({ message: "Mobile number and password are required" });
    }
    const user = await User.findOne({ mobileNo });
    if (!user) return res.status(400).json({ message: "Invalid credentials" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: "Invalid credentials" });
    // Generate JWT token
    const token = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );
    res.json({
      message: "Login successful",
      token,
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        mobileNo: user.mobileNo,
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// VERIFY EMAIL
exports.verifyEmail = async (req, res) => {
  try {
    const { email, verificationCode } = req.body;
    if (!email || !verificationCode) {
      return res.status(400).json({ message: "Email and verification code are required" });
    }

    console.log('🔍 Verifying email:', email);
    console.log('🔐 Provided code:', verificationCode);

    // Find pending user
    const pendingUser = await PendingUser.findOne({ email });
    if (!pendingUser) {
      console.log('❌ No pending registration found for:', email);
      return res.status(400).json({ message: "No pending registration found. Please register first." });
    }

    console.log('✅ Found pending user:', pendingUser.fullName);
    console.log('🔐 Stored code:', pendingUser.verificationCode);
    console.log('⏰ Code expires at:', pendingUser.verificationCodeExpire);

    // Check if verification code is expired
    if (new Date() > pendingUser.verificationCodeExpire) {
      console.log('⏳ Verification code has expired');
      await PendingUser.deleteOne({ _id: pendingUser._id });
      return res.status(400).json({ message: "Verification code has expired. Please register again." });
    }

    // Verify code
    if (pendingUser.verificationCode !== verificationCode) {
      console.log('❌ Code mismatch. Expected:', pendingUser.verificationCode, 'Got:', verificationCode);
      return res.status(400).json({ message: "Invalid verification code" });
    }

    console.log('✅ Code is correct! Creating user in User collection...');

    // Create user in User collection
    const user = await User.create({
      fullName: pendingUser.fullName,
      email: pendingUser.email,
      mobileNo: pendingUser.mobileNo,
      password: pendingUser.password,
    });

    console.log('✅ User created successfully:', user._id);

    // Delete pending user
    await PendingUser.deleteOne({ _id: pendingUser._id });
    console.log('🗑️ Pending user deleted');

    res.json({ message: "Email verified successfully. You can now login." });
  } catch (error) {
    console.error('❌ Error in verifyEmail:', error.message);
    console.error('📋 Stack:', error.stack);
    res.status(500).json({ message: error.message });
  }
};

// RESEND VERIFICATION CODE
exports.resendVerificationCode = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    // Find pending user
    const pendingUser = await PendingUser.findOne({ email });
    if (!pendingUser) {
      return res.status(400).json({ message: "No pending registration found. Please register first." });
    }

    // Generate new verification code
    const verificationCode = generateVerificationCode();
    const verificationCodeExpire = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes

    pendingUser.verificationCode = verificationCode;
    pendingUser.verificationCodeExpire = verificationCodeExpire;
    await pendingUser.save();

    // Send verification email
    const emailSent = await sendVerificationEmail(email, pendingUser.fullName, verificationCode);

    if (!emailSent) {
      return res.status(500).json({ message: "Failed to send verification email. Please try again." });
    }

    res.json({ message: "Verification code sent to your email" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
