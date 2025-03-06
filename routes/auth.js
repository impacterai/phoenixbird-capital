const express = require('express');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const User = require('../models/User');
const router = express.Router();
const sgMail = require('@sendgrid/mail');
const fs = require('fs');
const path = require('path');

// Initialize SendGrid
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

// Register new user
router.post('/register', async (req, res) => {
    try {
        const { email, password, firstName, lastName, phone, isAccredited } = req.body;
        
        // Validate required fields
        if (!email || !password || !firstName || !lastName) {
            return res.status(400).json({ error: 'All required fields must be provided' });
        }

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({ error: 'Please provide a valid email address' });
        }

        // Validate password length
        if (password.length < 8) {
            return res.status(400).json({ error: 'Password must be at least 8 characters long' });
        }

        // Check if user already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ error: 'Email already exists' });
        }

        // Generate verification token
        const verificationToken = crypto.randomBytes(32).toString('hex');
        const verificationTokenExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

        // Create new user
        const user = new User({
            email,
            password,
            firstName,
            lastName,
            phone,
            isAccredited,
            verificationToken,
            verificationTokenExpires
        });

        await user.save();

        // Generate JWT token
        const token = jwt.sign(
            { 
                userId: user._id,
                role: user.role // Include role in JWT
            },
            process.env.JWT_SECRET || 'your-secret-key', // Fallback secret for development
            { expiresIn: '24h' }
        );

         // Construct the full path to the image file
         const logoPath = path.join(__dirname, '../images/phoenix-bird-logo.png');

         // Read the file and convert it to Base64
         const logoData = fs.readFileSync(logoPath).toString('base64');

         // Send verification email
         const verificationUrl = `${process.env.FRONTEND_URL}/verify-email.html?token=${verificationToken}`;

         const msg = {
          to: email,
          from: process.env.SENDGRID_FROM_EMAIL,
          subject: 'Welcome to PhoenixBird Capital - Please Verify Your Email',
          html: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333;">
              <div style="text-align: center; margin-bottom: 20px;">
                  <img src="cid:phoenixBirdLogo" alt="PhoenixBird Capital Logo" style="max-width: 200px;">
              </div>
              <h2 style="color: #0A2540; margin-bottom: 20px;">Welcome to PhoenixBird Capital, ${firstName}!</h2>
              <p>Thank you for signing up. To complete your registration and verify your email address, please click the button below:</p>
              <div style="text-align: center; margin: 30px 0;">
                  <a href="${verificationUrl}" style="background-color: #EFB700; color: #0A2540; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold; display: inline-block;">Verify Email Address</a>
              </div>
              <p>If the button doesn't work, you can also copy and paste the following link into your browser:</p>
              <p style="word-break: break-all; color: #0A2540;">${verificationUrl}</p>
              <p>This link will expire in 24 hours.</p>
              <hr style="border: 0; border-top: 1px solid #eee; margin: 30px 0;">
              <p style="font-size: 12px; color: #666; text-align: center;">If you did not sign up for an account with PhoenixBird Capital, please disregard this email.</p>
              </div>
          `,
          attachments: [
              {
              content: logoData,
              filename: 'phoenix-bird-logo.png',
              type: 'image/png',
              disposition: 'inline',
              content_id: 'phoenixBirdLogo'
              }
          ]
        };
 
         try {
             // Try to send email but don't block registration if it fails
             await sgMail.send(msg);
             console.log('Verification email sent successfully');
         } catch (emailError) {
             // Log the error but continue with registration
             console.error('Error sending verification email:', emailError);
             // Don't auto-verify the user, but let them know about the issue
         } 

        res.json({
            success: true,
            message: 'Registration successful! Please check your email to verify your account.',
            emailVerificationRequired: true,
            emailVerificationStatus: 'pending',
            token,
            user: {
                id: user._id,
                email: user.email,
                firstName: user.firstName,
                lastName: user.lastName,
                role: user.role,
                isAccredited: user.isAccredited,
                emailVerified: user.emailVerified
            }
        });
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ error: 'An error occurred during registration' });
    }
});

// Verify email
router.get('/verify-email', async (req, res) => {
    try {
        const { token } = req.query;
        
        if (!token) {
            return res.status(400).json({ error: 'Verification token is required' });   
        }
        const user = await User.findOne({
            verificationToken: token,
            verificationTokenExpires: { $gt: Date.now() }
        });
        
        if (!user) {
            return res.status(400).json({ error: 'Invalid or expired verification token' });
        }
        // Update user as verified
        user.emailVerified = true;
        user.verificationToken = undefined;
        user.verificationTokenExpires = undefined;
        await user.save();
        
        res.json({
            success: true,
            message: 'Email verified successfully! You can now log in to your account.'
        });
        
    } catch (error) {
        console.error('Email verification error:', error);
        res.status(500).json({ error: 'An error occurred during email verification' });
    }
});

// Resend verification email
router.post('/resend-verification', async (req, res) => {
    try {
        const { email } = req.body;
        
        if (!email) {
            return res.status(400).json({ error: 'Email is required' });
        }
        
        // Find user
        const user = await User.findOne({ email });
        
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        
        if (user.emailVerified) {
            return res.status(400).json({ error: 'Email is already verified' });
        }
        
        // Generate new verification token
        const verificationToken = crypto.randomBytes(32).toString('hex');
        const verificationTokenExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
        
        // Update user
        user.verificationToken = verificationToken;
        user.verificationTokenExpires = verificationTokenExpires;
        await user.save();
        
        // Send verification email
        const verificationUrl = `${process.env.FRONTEND_URL}/verify-email.html?token=${verificationToken}`;
        
        const msg = {
            to: email,
            from: process.env.SENDGRID_FROM_EMAIL,
            subject: 'PhoenixBird Capital - Verify Your Email',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333;">
                    <div style="text-align: center; margin-bottom: 20px;">
                        <img src="${process.env.FRONTEND_URL}/images/phoenix-bird-logo.png" alt="PhoenixBird Capital Logo" style="max-width: 200px;">
                    </div>
                    <h2 style="color: #0A2540; margin-bottom: 20px;">Verify Your Email Address</h2>
                    <p>You requested a new verification email. To verify your email address, please click the button below:</p>
                    <div style="text-align: center; margin: 30px 0;">
                        <a href="${verificationUrl}" style="background-color: #EFB700; color: #0A2540; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold; display: inline-block;">Verify Email Address</a>
                    </div>
                    <p>If the button doesn't work, you can also copy and paste the following link into your browser:</p>
                    <p style="word-break: break-all; color: #0A2540;">${verificationUrl}</p>
                    <p>This link will expire in 24 hours.</p>
                    <hr style="border: 0; border-top: 1px solid #eee; margin: 30px 0;">
                    <p style="font-size: 12px; color: #666; text-align: center;">If you did not request this email, please disregard it.</p>
                </div>
            `
        };
        
        try {
            // Try to send email but don't block the process if it fails
            await sgMail.send(msg);
            console.log('Verification email resent successfully');
        } catch (emailError) {
            // Log the error but continue
            console.error('Error resending verification email:', emailError);
            // Don't auto-verify the user, but let them know about the issue
        }
        
        res.json({
            success: true,
            message: 'Verification email sent! Please check your inbox.'
        });
        
    } catch (error) {
        console.error('Resend verification error:', error);
        res.status(500).json({ error: 'An error occurred while resending verification email' });
    }
});

// Check admin status
router.get('/check-admin', async (req, res) => {
    try {
        const token = req.header('Authorization')?.replace('Bearer ', '');
        
        if (!token) {
            return res.status(401).json({ error: 'No authentication token found' });
        }

        // Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
        
        // Find user
        const user = await User.findById(decoded.userId)
            .select('-password -resetPasswordToken -resetPasswordExpires');

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        if (user.role !== 'admin') {
            return res.status(403).json({ error: 'Access denied. Admin privileges required.' });
        }

        // Update last login
        user.lastLogin = new Date();
        await user.save();

        res.json({
            success: true,
            user: {
                id: user._id,
                email: user.email,
                firstName: user.firstName,
                lastName: user.lastName,
                role: user.role
            }
        });
    } catch (error) {
        console.error('Check admin error:', error);
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({ error: 'Invalid token' });
        }
        res.status(500).json({ error: 'Server error' });
    }
});

// Login
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        
        // Find user
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }

        // Check password
        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }

        // Update last login
        user.lastLogin = new Date();
        await user.save();

        // Generate token
        const token = jwt.sign(
            { 
                userId: user._id,
                role: user.role
            },
            process.env.JWT_SECRET || 'your-secret-key',
            { expiresIn: '24h' }
        );

        // Check if email is verified but don't block login
        const emailVerificationStatus = user.emailVerified ? 'verified' : 'pending';

        res.json({
            success: true,
            token,
            emailVerificationStatus,
            emailVerificationRequired: true,
            message: user.emailVerified ? 'Login successful' : 'Please verify your email before accessing investments',
            user: {
                id: user._id,
                email: user.email,
                firstName: user.firstName,
                lastName: user.lastName,
                role: user.role,
                emailVerified: user.emailVerified
            }
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Login failed. Please try again.' });
    }
});

// Request password reset
router.post('/forgot-password', async (req, res) => {
    try {
        const { email } = req.body;
        
        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({ error: 'Please provide a valid email address' });
        }

        // Find user
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Generate reset token
        const resetToken = crypto.randomBytes(32).toString('hex');
        const resetTokenExpiry = Date.now() + 3600000; // Token expires in 1 hour

        // Save reset token to user
        user.resetPasswordToken = resetToken;
        user.resetPasswordExpires = resetTokenExpiry;
        await user.save();

        // Create reset URL - make sure it includes .html extension
        const resetUrl = `${process.env.FRONTEND_URL}/new-password.html?token=${resetToken}`;

        // Send email
        const msg = {
            to: email,
            from: process.env.SENDGRID_FROM_EMAIL,
            subject: 'Password Reset Request',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2>Password Reset Request</h2>
                    <p>You requested a password reset for your account.</p>
                    <p>Please click the button below to reset your password:</p>
                    <div style="text-align: center; margin: 30px 0;">
                        <a href="${resetUrl}" style="background-color: #4CAF50; color: white; padding: 14px 20px; text-decoration: none; border-radius: 4px; display: inline-block;">Reset Password</a>
                    </div>
                    <p>This link will expire in 1 hour.</p>
                    <p>If you didn't request this, please ignore this email.</p>
                    <hr>
                    <p style="color: #666; font-size: 12px;">This is an automated email, please do not reply.</p>
                </div>
            `
        };

        await sgMail.send(msg);

        res.json({ message: 'Password reset email sent successfully' });
    } catch (error) {
        console.error('Password reset request error:', error);
        res.status(500).json({ error: 'Failed to send password reset email' });
    }
});

// Reset password with token
router.post('/reset-password', async (req, res) => {
    try {
        const { token, newPassword } = req.body;

        if (!token || !newPassword) {
            return res.status(400).json({ error: 'Token and new password are required' });
        }

        // Find user with valid reset token
        const user = await User.findOne({
            resetPasswordToken: token,
            resetPasswordExpires: { $gt: Date.now() }
        });

        if (!user) {
            return res.status(400).json({ error: 'Invalid or expired reset token' });
        }

        // Update password
        user.password = newPassword;
        user.resetPasswordToken = undefined;
        user.resetPasswordExpires = undefined;
        await user.save();

        // Send confirmation email
        const msg = {
            to: user.email,
            from: process.env.SENDGRID_FROM_EMAIL,
            subject: 'Password Reset Successful',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2>Password Reset Successful</h2>
                    <p>Your password has been successfully reset.</p>
                    <p>If you did not perform this action, please contact support immediately.</p>
                    <hr>
                    <p style="color: #666; font-size: 12px;">This is an automated email, please do not reply.</p>
                </div>
            `
        };

        await sgMail.send(msg);

        res.json({ message: 'Password reset successful' });
    } catch (error) {
        console.error('Password reset error:', error);
        res.status(500).json({ error: 'Failed to reset password' });
    }
});

module.exports = router;
