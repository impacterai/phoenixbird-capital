const mongoose = require('mongoose');

const userInvestmentSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    investmentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Investment',
        required: true
    },
    amount: {
        type: Number,
        required: true,
        min: 0
    },
    status: {
        type: String,
        enum: ['pending', 'approved', 'rejected'],
        default: 'pending'
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('UserInvestment', userInvestmentSchema);
