const mongoose = require('mongoose');

const investmentSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        required: true
    },
    minimumInvestment: {
        type: Number,
        required: true,
        min: 0
    },
    targetReturn: {
        type: Number,
        required: true
    },
    status: {
        type: String,
        enum: ['open', 'closed', 'pending'],
        default: 'open'
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Investment', investmentSchema);
