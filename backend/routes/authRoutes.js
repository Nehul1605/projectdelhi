const express = require("express");
const router = express.Router();
const User = require("../models/User");
const { OAuth2Client } = require("google-auth-library");
const crypto = require("crypto");
const mailer = require("../config/mailer");
const { logActivity } = require("../utils/activityLogger");

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// Test SMTP email route to diagnose connection and credential issues
router.get("/auth/test-email", async (req, res) => {
  try {
    const targetEmail = req.query.email || process.env.ADMIN_EMAIL || "test@example.com";
    console.log(`[TEST EMAIL] Attempting test email to: ${targetEmail}`);

    const nodemailer = require("nodemailer");
    
    // Log configuration parameters (obfuscating password)
    const smtpConfig = {
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || "587"),
      secure: process.env.SMTP_PORT === "465",
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS ? `${process.env.SMTP_PASS.substring(0, 3)}***` : "missing",
      },
    };

    console.log("[TEST EMAIL] SMTP Config:", JSON.stringify(smtpConfig, null, 2));

    const testTransporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: smtpConfig.port,
      secure: smtpConfig.secure,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    // 1. Verify Transporter connection
    const verification = await new Promise((resolve) => {
      testTransporter.verify((err, success) => {
        if (err) {
          console.error("[TEST EMAIL] SMTP verification failed:", err);
          resolve({ success: false, error: err.message, code: err.code, command: err.command });
        } else {
          console.log("[TEST EMAIL] SMTP verification succeeded!");
          resolve({ success: true });
        }
      });
    });

    if (!verification.success) {
      return res.status(500).json({
        success: false,
        phase: "verification",
        error: verification.error,
        code: verification.code,
        command: verification.command,
        smtpConfig
      });
    }

    // 2. Try sending a basic test email
    const mailOptions = {
      from: process.env.SMTP_FROM || '"Project Delhi Test" <info@projectdelhi.org>',
      to: targetEmail,
      subject: "Project Delhi - SMTP Connection Test",
      text: "If you receive this email, your SMTP configuration on Render is working perfectly!",
      html: "<p>If you receive this email, your SMTP configuration on Render is working perfectly!</p>"
    };

    const sendResult = await new Promise((resolve) => {
      testTransporter.sendMail(mailOptions, (err, info) => {
        if (err) {
          console.error("[TEST EMAIL] Send mail failed:", err);
          resolve({ success: false, error: err.message, code: err.code, command: err.command });
        } else {
          console.log("[TEST EMAIL] Send mail succeeded:", info.messageId);
          resolve({ success: true, messageId: info.messageId, response: info.response });
        }
      });
    });

    if (!sendResult.success) {
      return res.status(500).json({
        success: false,
        phase: "sending",
        error: sendResult.error,
        code: sendResult.code,
        command: sendResult.command,
        smtpConfig
      });
    }

    return res.json({
      success: true,
      message: `Test email sent successfully! Message ID: ${sendResult.messageId}`,
      response: sendResult.response,
      smtpConfig
    });

  } catch (error) {
    console.error("[TEST EMAIL] Route exception:", error);
    res.status(500).json({
      success: false,
      phase: "exception",
      error: error.message,
      stack: error.stack
    });
  }
});

// Get all users
router.get("/users", async (req, res) => {
  try {
    const users = await User.find({});
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Register user / OAuth fallback
router.post("/users", async (req, res) => {
  try {
    const { email, name, role, password } = req.body;
    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      return res.status(400).json({ error: "User already exists" });
    }
    const newUser = new User({
      email: email.toLowerCase(),
      name,
      role: role || "USER",
      password: password || "delhi123"
    });
    await newUser.save();

    await logActivity({
      userId: newUser._id,
      userName: newUser.name,
      userEmail: newUser.email,
      action: "SIGNUP",
      details: `User registered with role ${newUser.role}`,
    });

    res.json(newUser);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Google OAuth verification and registration/login
router.post("/auth/google", async (req, res) => {
  try {
    const { token } = req.body;
    if (!token) {
      return res.status(400).json({ error: "Token is required" });
    }

    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    const { email, name } = payload;

    if (!email) {
      return res.status(400).json({ error: "Email not verified in Google token" });
    }

    let user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      let role = "USER";
      if (email.toLowerCase() === "admin@projectdelhi.org") {
        role = "ADMIN";
      } else if (
        [
          "rahul@projectdelhi.org",
          "priya@projectdelhi.org",
          "raghav@projectdelhi.org",
        ].includes(email.toLowerCase())
      ) {
        role = "MODERATOR";
      }

      user = new User({
        email: email.toLowerCase(),
        name: name || email.split("@")[0],
        role,
        password: "delhi123"
      });
      await user.save();
    }

    await logActivity({
      userId: user._id,
      userName: user.name,
      userEmail: user.email,
      action: "LOGIN_GOOGLE",
      details: "User logged in using Google OAuth",
    });

    res.json(user);
  } catch (error) {
    console.error("Error verifying Google token:", error);
    res.status(401).json({ error: "Invalid Google token" });
  }
});

// Email/password login
router.post("/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }
    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) {
      return res.status(401).json({ error: "User not found" });
    }
    if (user.password !== password) {
      return res.status(401).json({ error: "Invalid password" });
    }

    await logActivity({
      userId: user._id,
      userName: user.name,
      userEmail: user.email,
      action: "LOGIN",
      details: "User logged in successfully",
    });

    res.json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Forgot Password endpoint
router.post("/auth/forgot-password", async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ error: "Email is required" });
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) {
      return res.status(404).json({ error: "No account with that email address exists." });
    }

    // Generate token
    const token = crypto.randomBytes(20).toString("hex");
    user.resetPasswordToken = token;
    user.resetPasswordExpires = Date.now() + 3600000; // 1 hour from now
    await user.save();

    // Reset link
    const clientUrl = req.get("origin") || process.env.CLIENT_URL || "http://localhost:5173";
    const resetLink = `${clientUrl}/reset-password?token=${token}&email=${encodeURIComponent(user.email)}`;

    // Print to console for easy local access
    console.log(`\n========================================\n🔑 [PASSWORD RESET LINK]\nClick/copy this link to reset password:\n${resetLink}\n========================================\n`);

    // Send email and check status
    const emailSent = await mailer.sendPasswordResetEmail(user.email, user.name, resetLink);
    if (!emailSent) {
      return res.status(500).json({ error: "Failed to send password reset email. Please verify backend logs or SMTP server status." });
    }

    await logActivity({
      userId: user._id,
      userName: user.name,
      userEmail: user.email,
      action: "FORGOT_PASSWORD_REQUEST",
      details: "Password reset link requested",
    });

    res.json({ message: "Password reset instructions sent successfully." });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Reset Password endpoint
router.post("/auth/reset-password", async (req, res) => {
  try {
    const { email, token, password } = req.body;
    if (!email || !token || !password) {
      return res.status(400).json({ error: "Email, token, and password are required" });
    }

    const user = await User.findOne({
      email: email.toLowerCase().trim(),
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({ error: "Password reset token is invalid or has expired." });
    }

    // Update password
    user.password = password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    await logActivity({
      userId: user._id,
      userName: user.name,
      userEmail: user.email,
      action: "PASSWORD_RESET_SUCCESS",
      details: "Password reset confirmed successfully",
    });

    res.json({ message: "Password has been reset successfully." });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;

