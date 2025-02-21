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
        required: true,
        min: 0
    },
    status: {
        type: String,
        enum: ['active', 'coming_soon', 'closed'],
        default: 'coming_soon'
    },
    type: {
        type: String,
        enum: ['real_estate', 'private_equity', 'venture_capital', 'other'],
        required: true
    },
    duration: {
        type: Number, // in months
        required: true,
        min: 1
    },
    totalFundSize: {
        type: Number,
        required: true,
        min: 0
    },
    currentInvestment: {
        type: Number,
        default: 0,
        min: 0
    },
    riskLevel: {
        type: String,
        enum: ['low', 'medium', 'high'],
        required: true
    },
    highlights: [{
        type: String,
        trim: true
    }],
    documents: [{
        title: String,
        url: String,
        type: {
            type: String,
            enum: ['prospectus', 'financial_report', 'legal_document', 'other']
        }
    }],
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    }
}, {
    timestamps: true
});

// Virtual field for progress percentage
investmentSchema.virtual('progressPercentage').get(function() {
    return (this.currentInvestment / this.totalFundSize) * 100;
});

// Virtual field for remaining investment needed
investmentSchema.virtual('remainingInvestment').get(function() {
    return this.totalFundSize - this.currentInvestment;
});

// Ensure virtuals are included in JSON output
investmentSchema.set('toJSON', { virtuals: true });
investmentSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Investment', investmentSchema);
