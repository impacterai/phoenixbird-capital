const express = require('express');
const jwt = require('jsonwebtoken');
const Investment = require('../models/Investment');
const UserInvestment = require('../models/UserInvestment');
const router = express.Router();

// Middleware to authenticate token
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ error: 'Access denied' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.userId = decoded.userId;
        next();
    } catch (error) {
        res.status(401).json({ error: 'Invalid token' });
    }
};

// List all open investments
router.get('/', async (req, res) => {
    try {
        const investments = await Investment.find({ status: 'open' })
            .sort('-createdAt');
        res.json({ success: true, investments });
    } catch (error) {
        console.error('List investments error:', error);
        res.status(500).json({ error: 'Failed to fetch investments' });
    }
});

// Submit investment
router.post('/invest', authenticateToken, async (req, res) => {
    try {
        const { investmentId, amount } = req.body;

        // Validate investment exists and is open
        const investment = await Investment.findOne({
            _id: investmentId,
            status: 'open'
        });

        if (!investment) {
            return res.status(400).json({ error: 'Invalid investment' });
        }

        // Check minimum investment amount
        if (amount < investment.minimumInvestment) {
            return res.status(400).json({
                error: `Minimum investment amount is ${investment.minimumInvestment}`
            });
        }

        // Create user investment
        const userInvestment = new UserInvestment({
            userId: req.userId,
            investmentId,
            amount
        });

        await userInvestment.save();

        res.json({
            success: true,
            message: 'Investment submitted successfully'
        });
    } catch (error) {
        console.error('Submit investment error:', error);
        res.status(500).json({ error: 'Failed to submit investment' });
    }
});

// Get user's investments
router.get('/my-investments', authenticateToken, async (req, res) => {
    try {
        const userInvestments = await UserInvestment.find({ userId: req.userId })
            .populate('investmentId')
            .sort('-createdAt');

        const investments = userInvestments.map(ui => ({
            id: ui._id,
            amount: ui.amount,
            status: ui.status,
            createdAt: ui.createdAt,
            investment: {
                id: ui.investmentId._id,
                title: ui.investmentId.title,
                description: ui.investmentId.description
            }
        }));

        res.json({ success: true, investments });
    } catch (error) {
        console.error('Fetch user investments error:', error);
        res.status(500).json({ error: 'Failed to fetch investments' });
    }
});

module.exports = router;
