const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

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
    if (!fullName || !email || !mobileNo || !password) return res.status(400).json({ message: "All fields are required" });

    // Check if already registered
    const existingUser = await User.findOne({ $or: [ { mobileNo }, { email } ] });
    if (existingUser) {
      if (existingUser.email === email) {
        return res.status(400).json({ message: "Email already registered" });
      } else {
        return res.status(400).json({ message: "Mobile number already registered" });
      }
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({
      fullName,
      email,
      mobileNo,
      password: hashedPassword,
    });

    res.status(201).json({ message: "User registered successfully", userId: user._id });
  } catch (error) {
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
