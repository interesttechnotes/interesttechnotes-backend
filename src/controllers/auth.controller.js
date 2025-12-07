import { User } from "../models/User.model.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { handleGoogleAuth } from "../services/auth.service.js";

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
