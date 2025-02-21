const express = require('express');
const jwt = require('jsonwebtoken');
const Investment = require('../models/Investment');
const UserInvestment = require('../models/UserInvestment');
const adminAuth = require('../middleware/adminAuth');
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

// List all investments (public)
router.get('/public', async (req, res) => {
    try {
        const investments = await Investment.find({ status: 'active' })
            .select('-documents') // Exclude private documents
            .sort('-createdAt');
        res.json(investments);
    } catch (error) {
        console.error('List investments error:', error);
        res.status(500).json({ error: 'Failed to fetch investments' });
    }
});

// Admin: List all investments
router.get('/', adminAuth, async (req, res) => {
    try {
        const investments = await Investment.find()
            .populate('createdBy', 'firstName lastName email')
            .sort('-createdAt');
        res.json(investments);
    } catch (error) {
        console.error('List investments error:', error);
        res.status(500).json({ error: 'Failed to fetch investments' });
    }
});

// Admin: Create new investment
router.post('/', adminAuth, async (req, res) => {
    try {
        const {
            title,
            description,
            minimumInvestment,
            targetReturn,
            status,
            type,
            duration,
            totalFundSize,
            riskLevel,
            highlights,
            documents,
            targetRaise,
            currentRaise,
            numberOfInvestors,
            percentageRaised
        } = req.body;

        const investment = new Investment({
            title,
            description,
            minimumInvestment,
            targetReturn,
            status,
            type,
            duration,
            totalFundSize,
            riskLevel,
            highlights: highlights || [],
            documents: documents || [],
            targetRaise: targetRaise || 0,
            currentRaise: currentRaise || 0,
            numberOfInvestors: numberOfInvestors || 0,
            percentageRaised: percentageRaised || 0,
            createdBy: req.user._id
        });

        await investment.save();
        res.status(201).json(investment);
    } catch (error) {
        console.error('Create investment error:', error);
        res.status(500).json({ error: 'Failed to create investment' });
    }
});

// Admin: Update investment
router.put('/:id', adminAuth, async (req, res) => {
    try {
        const allowedFields = [
            'title',
            'description',
            'minimumInvestment',
            'targetReturn',
            'status',
            'type',
            'duration',
            'totalFundSize',
            'riskLevel',
            'highlights',
            'documents',
            'targetRaise',
            'currentRaise',
            'numberOfInvestors',
            'percentageRaised'
        ];

        const updateData = {};
        Object.keys(req.body).forEach(key => {
            if (allowedFields.includes(key)) {
                updateData[key] = req.body[key];
            }
        });

        const investment = await Investment.findByIdAndUpdate(
            req.params.id,
            { $set: updateData },
            { new: true, runValidators: true }
        );

        if (!investment) {
            return res.status(404).json({ error: 'Investment not found' });
        }

        res.json(investment);
    } catch (error) {
        console.error('Update investment error:', error);
        res.status(500).json({ error: 'Failed to update investment' });
    }
});

// Admin: Delete investment
router.delete('/:id', adminAuth, async (req, res) => {
    try {
        const investment = await Investment.findByIdAndDelete(req.params.id);

        if (!investment) {
            return res.status(404).json({ error: 'Investment not found' });
        }

        // You might want to handle related records (e.g., user investments) here

        res.json({ message: 'Investment deleted successfully' });
    } catch (error) {
        console.error('Delete investment error:', error);
        res.status(500).json({ error: 'Failed to delete investment' });
    }
});

// Admin: Get investment details with user investments
router.get('/:id/details', adminAuth, async (req, res) => {
    try {
        const investment = await Investment.findById(req.params.id)
            .populate('createdBy', 'firstName lastName email');
        
        if (!investment) {
            return res.status(404).json({ error: 'Investment not found' });
        }

        const userInvestments = await UserInvestment.find({ investmentId: req.params.id })
            .populate('userId', 'firstName lastName email');

        res.json({
            investment,
            userInvestments
        });
    } catch (error) {
        console.error('Get investment details error:', error);
        res.status(500).json({ error: 'Failed to fetch investment details' });
    }
});

// Submit investment (for users)
router.post('/invest', authenticateToken, async (req, res) => {
    try {
        const { investmentId, amount } = req.body;

        // Validate investment exists and is active
        const investment = await Investment.findOne({
            _id: investmentId,
            status: 'active'
        });

        if (!investment) {
            return res.status(400).json({ error: 'Invalid or inactive investment' });
        }

        // Check minimum investment amount
        if (amount < investment.minimumInvestment) {
            return res.status(400).json({
                error: `Minimum investment amount is $${investment.minimumInvestment}`
            });
        }

        // Check if total investment would exceed fund size
        const totalInvested = investment.currentInvestment + amount;
        if (totalInvested > investment.totalFundSize) {
            return res.status(400).json({
                error: `Investment would exceed fund size. Maximum available: $${investment.remainingInvestment}`
            });
        }

        // Create user investment
        const userInvestment = new UserInvestment({
            userId: req.userId,
            investmentId,
            amount
        });

        await userInvestment.save();

        // Update current investment amount
        investment.currentInvestment = totalInvested;
        await investment.save();

        res.json({
            success: true,
            message: 'Investment submitted successfully',
            investment: {
                id: investment._id,
                title: investment.title,
                amount,
                currentInvestment: investment.currentInvestment,
                progressPercentage: investment.progressPercentage
            }
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
                description: ui.investmentId.description,
                status: ui.investmentId.status,
                type: ui.investmentId.type,
                targetReturn: ui.investmentId.targetReturn,
                progressPercentage: ui.investmentId.progressPercentage
            }
        }));

        res.json(investments);
    } catch (error) {
        console.error('Fetch user investments error:', error);
        res.status(500).json({ error: 'Failed to fetch investments' });
    }
});

module.exports = router;
