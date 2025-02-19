const express = require('express');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const User = require('../models/User');
const router = express.Router();

// Register new user
router.post('/register', async (req, res) => {
    try {
        const { email, password, firstName, lastName, phone, isAccredited } = req.body;
        
        // Check if user already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ error: 'Email already exists' });
        }

        // Create new user
        const user = new User({
            email,
            password,
            firstName,
            lastName,
            phone,
            isAccredited
        });

        await user.save();

        // Generate token
        const token = jwt.sign(
            { userId: user._id },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.json({
            success: true,
            token,
            user: {
                id: user._id,
                email: user.email,
                firstName: user.firstName,
                lastName: user.lastName
            }
        });
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ error: 'Registration failed' });
    }
});

// Login
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        
        // Find user
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // Check password
        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // Generate token
        const token = jwt.sign(
            { userId: user._id },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.json({
            success: true,
            token,
            user: {
                id: user._id,
                email: user.email,
                firstName: user.firstName,
                lastName: user.lastName
            }
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Login failed' });
    }
});

// Reset password request
router.post('/reset-password', async (req, res) => {
    try {
        const { email } = req.body;
        
        // Validate email
        if (!email || !email.includes('@')) {
            return res.status(400).json({ error: 'Please provide a valid email address' });
        }

        const user = await User.findOne({ email });

        if (user) {
            // Generate reset token
            const resetToken = crypto.randomBytes(32).toString('hex');
            user.resetToken = resetToken;
            user.resetTokenExpiry = Date.now() + 3600000; // 1 hour
            await user.save();

            // In a real application, send email with reset link
            // For demo, we'll return the token directly
            return res.json({
                success: true,
                message: 'Password reset instructions sent',
                resetToken: resetToken // In production, this would be sent via email
            });
        }

        // If no user found, still return success for security
        res.json({
            success: true,
            message: 'If an account exists with this email, you will receive password reset instructions'
        });
    } catch (error) {
        console.error('Reset password error:', error);
        res.status(500).json({ error: 'An error occurred while processing your request' });
    }
});

// Reset password with token
router.post('/reset-password/:token', async (req, res) => {
    try {
        const { token } = req.params;
        const { password } = req.body;

        // Find user with valid reset token
        const user = await User.findOne({
            resetToken: token,
            resetTokenExpiry: { $gt: Date.now() }
        });

        if (!user) {
            return res.status(400).json({ error: 'Invalid or expired reset token' });
        }

        // Update password
        user.password = password;
        user.resetToken = undefined;
        user.resetTokenExpiry = undefined;
        await user.save();

        res.json({
            success: true,
            message: 'Password has been reset successfully'
        });
    } catch (error) {
        console.error('Reset password error:', error);
        res.status(500).json({ error: 'An error occurred while resetting your password' });
    }
});

module.exports = router;
