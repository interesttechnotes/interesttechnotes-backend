import { User } from "../models/User.model.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { handleGoogleAuth } from "../services/auth.service.js";
import { sendOtpEmail } from "../services/email.service.js";
import { randomInt } from "crypto";

// Helper: generate JWT token
const generateToken = (user) => {
  return jwt.sign(
    { id: user._id, email: user.email },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || "7d" }
  );
};

// Signup
export const signup = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    const existed = await User.findOne({ email });
    if (existed) return res.status(400).json({ message: "User already exists" });

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = await User.create({ name, email, password: hashedPassword });

    const token = generateToken(newUser);

    return res.status(201).json({
      message: "Signup successful ✅",
      user: { id: newUser._id, name: newUser.name, email: newUser.email },
      token,
    });
  } catch (error) {
    console.error("Signup Error:", error);
    res.status(500).json({ message: "Server Error" });
  }
};

// Login
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ message: "Invalid email or password ❌" });

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(401).json({ message: "Invalid email or password ❌" });

    const token = generateToken(user);

    return res.json({
      message: "Login successful ✅",
      user: { id: user._id, name: user.name, email: user.email },
      token,
    });
  } catch (error) {
    console.error("Login Error:", error);
    res.status(500).json({ message: "Server Error" });
  }
};
export const googleAuth = async (req, res) => {
  console.log("login with google");
  
  const { code } = req.body;

  if (!code) {
    return res.status(400).json({ error: "Missing authorization code" });
  }

  try {
    // Get result from handleGoogleAuth (already includes user + token)
    const result = await handleGoogleAuth(code);

    // Send that directly to frontend
    res.status(200).json(result);
  } catch (error) {
    console.error("Google Auth Controller Error:", error.message);
    res.status(500).json({
      success: false,
      error: error.message || "Google authentication failed",
    });
  }
};
export const requestOtp = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    let user = await User.findOne({ email });

    if (!user) {
      // Optional: auto-create user (remove this block if you don't want auto signup)
      user = await User.create({
        email,
        provider: "local",
      });
    }

    // Generate 6-digit OTP
    const otp = randomInt(100000, 999999).toString();

    user.otp = {
      code: otp,
      expiresAt: new Date(Date.now() + 5 * 60 * 1000), // 5 minutes
    };

    await user.save();

    await sendOtpEmail(email, otp);

    return res.json({ message: "OTP sent successfully ✅" });

  } catch (error) {
    console.error("Request OTP Error:", error);
    res.status(500).json({ message: "Failed to send OTP" });
  }
};

export const requestOtp2 = async (req, res) => {
  try {
    console.log("--otp request--");
    
    const { email } = req.body;
    console.log("--otp request--",email);
    
    let user = await User.findOne({ email });
    
    console.log("--otp request--",user);
    if (!user) {
      // Optional: auto create user if not exists
      user = await User.create({ email });
    }
    console.log("--otp request--2",user);

    // Generate 6 digit OTP
    const otp = crypto.randomInt(100000, 999999).toString();

    user.otp = {
      code: otp,
      expiresAt: new Date(Date.now() + 5 * 60 * 1000), // 5 minutes
    };

    await user.save();

    await sendOtpEmail(email, otp);

    return res.json({ message: "OTP sent successfully ✅" });
  } catch (error) {
    console.error("Request OTP Error:", error);
    res.status(500).json({ message: "Failed to send OTP" });
  }
};
export const verifyOtp2 = async (req, res) => {
  try {
    const { email, otp } = req.body;
if (!email || !otp) {
  return res.status(400).json({ message: "Email and OTP are required" });
}

    const user = await User.findOne({ email });

    if (!user || !user.otp?.code) {
      return res.status(400).json({ message: "OTP not requested" });
    }

    if (user.otp.code !== otp) {
      return res.status(400).json({ message: "Invalid OTP ❌" });
    }

    if (user.otp.expiresAt < new Date()) {
      return res.status(400).json({ message: "OTP expired ⏳" });
    }

    // Clear OTP after successful verification
    user.otp = undefined;
    await user.save();

    const token = generateToken(user);

    return res.json({
      message: "Login successful ✅",
      user: { id: user._id, email: user.email },
      token,
    });
  } catch (error) {
    console.error("Verify OTP Error:", error);
    res.status(500).json({ message: "Server Error" });
  }
};

export const verifyOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;
console.log("--verify,email",email,otp);

    if (!email || !otp) {
      return res.status(400).json({ message: "Email and OTP are required" });
    }

    const user = await User.findOne({ email });

    if (!user || !user.otp?.code) {
      return res.status(400).json({ message: "OTP not requested" });
    }

    if (user.otp.expiresAt < new Date()) {
      return res.status(400).json({ message: "OTP expired ⏳" });
    }

    // const isValid = await bcrypt.compare(otp, user.otp.code);
    if (user.otp.code !== otp) {
  return res.status(400).json({ message: "Invalid OTP ❌" });
}


    // if (!isValid) {
    //   return res.status(400).json({ message: "Invalid OTP ❌" });
    // }

    // Clear OTP
    user.otp = undefined;
    await user.save();

    const token = generateToken(user);
res.cookie("token_itn", token, {
  httpOnly: true,                 // prevents JS access (XSS protection)
  secure: process.env.NODE_ENV === "production", 
  sameSite: "strict",             // CSRF protection
  maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
});
    return res.json({
      message: "Login successful ✅",
      user: { id: user._id, email: user.email },
      token,
    });

  } catch (error) {
    console.error("Verify OTP Error:", error);
    res.status(500).json({ message: "Server Error" });
  }
};
