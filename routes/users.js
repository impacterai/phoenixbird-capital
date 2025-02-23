const express = require('express');
const router = express.Router();
const User = require('../models/User');
const adminAuth = require('../middleware/adminAuth');
const { parse } = require('json2csv');

// Get all users (paginated)
router.get('/', adminAuth, async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const search = req.query.search || '';

        const query = {};
        if (search) {
            query.$or = [
                { firstName: { $regex: search, $options: 'i' } },
                { lastName: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } }
            ];
        }

        const totalUsers = await User.countDocuments(query);
        
        if (totalUsers === 0) {
            return res.json({
                users: [],
                total: 0
            });
        }

        const users = await User.find(query)
            .select('-password -resetPasswordToken -resetPasswordExpires')
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(limit);

        const formattedUsers = users.map(user => ({
            _id: user._id,
            name: `${user.firstName} ${user.lastName}`,
            email: user.email,
            role: user.role,
            status: user.isActive ? 'Active' : 'Inactive',
            joinedDate: user.createdAt,
            lastLogin: user.lastLogin,
            phone: user.phone,
            isAccredited: user.isAccredited
        }));

        res.json({
            users: formattedUsers,
            total: totalUsers
        });
    } catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).json({ 
            error: 'Failed to fetch users',
            details: error.message 
        });
    }
});

// Get user by ID
router.get('/:id', adminAuth, async (req, res) => {
    try {
        const user = await User.findById(req.params.id)
            .select('-password -resetPasswordToken -resetPasswordExpires');

        if (!user) {
            return res.status(404).json({ 
                error: 'User not found',
                details: 'User with the provided ID does not exist' 
            });
        }

        const formattedUser = {
            _id: user._id,
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email,
            role: user.role,
            status: user.isActive ? 'Active' : 'Inactive',
            joinedDate: user.createdAt || user.joinedDate,
            lastLogin: user.lastLogin,
            phone: user.phone,
            isAccredited: user.isAccredited,
            statistics: {
                totalInvestments: 0, // You'll need to implement this
                totalAmountInvested: 0, // You'll need to implement this
                activeInvestments: 0 // You'll need to implement this
            }
        };

        res.json(formattedUser);
    } catch (error) {
        console.error('Error fetching user:', error);
        res.status(500).json({ 
            error: 'Failed to fetch user details',
            details: error.message 
        });
    }
});

// Activate user
router.post('/:id/activate', adminAuth, async (req, res) => {
    try {
        const user = await User.findByIdAndUpdate(
            req.params.id,
            { isActive: true },
            { new: true }
        );

        if (!user) {
            return res.status(404).json({ 
                error: 'User not found',
                details: 'User with the provided ID does not exist' 
            });
        }

        res.json({ message: 'User activated successfully' });
    } catch (error) {
        console.error('Error activating user:', error);
        res.status(500).json({ 
            error: 'Failed to activate user',
            details: error.message 
        });
    }
});

// Deactivate user
router.post('/:id/deactivate', adminAuth, async (req, res) => {
    try {
        const user = await User.findByIdAndUpdate(
            req.params.id,
            { isActive: false },
            { new: true }
        );

        if (!user) {
            return res.status(404).json({ 
                error: 'User not found',
                details: 'User with the provided ID does not exist' 
            });
        }

        res.json({ message: 'User deactivated successfully' });
    } catch (error) {
        console.error('Error deactivating user:', error);
        res.status(500).json({ 
            error: 'Failed to deactivate user',
            details: error.message 
        });
    }
});

// Export users
router.get('/export', adminAuth, async (req, res) => {
    try {
        const users = await User.find()
            .select('-password -resetPasswordToken -resetPasswordExpires');

        if (users.length === 0) {
            return res.json({
                error: 'No users found',
                details: 'The database is empty'
            });
        }

        const formattedUsers = users.map(user => ({
            'Name': `${user.firstName} ${user.lastName}`,
            'Email': user.email,
            'Role': user.role,
            'Status': user.isActive ? 'Active' : 'Inactive',
            'Phone': user.phone || 'Not provided',
            'Accredited': user.isAccredited ? 'Yes' : 'No',
            'Joined Date': user.createdAt.toLocaleDateString(),
            'Last Login': user.lastLogin ? user.lastLogin.toLocaleDateString() : 'Never'
        }));

        const fields = ['Name', 'Email', 'Role', 'Status', 'Phone', 'Accredited', 'Joined Date', 'Last Login'];
        const csv = parse(formattedUsers, { fields });

        res.header('Content-Type', 'text/csv');
        res.attachment('users.csv');
        res.send(csv);
    } catch (error) {
        console.error('Error exporting users:', error);
        res.status(500).json({ 
            error: 'Failed to export users',
            details: error.message 
        });
    }
});

module.exports = router;
