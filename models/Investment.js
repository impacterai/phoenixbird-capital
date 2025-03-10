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
        enum: ['active', 'coming soon', 'closed'],
        default: 'coming soon'
    },
    type: {
        type: String,
        enum: ['real_estate', 'private_equity', 'venture_capital', 'debt', 'hedge_fund'],
        required: true
    },
    duration: {
        type: Number, // in months
        required: false,
        min: 1
    },
    totalFundSize: {
        type: Number,
        required: true,
        min: 0
    },
    targetRaise: {
        type: Number,
        required: true,
        min: 0
    },
    currentRaise: {
        type: Number,
        default: 0,
        min: 0
    },
    numberOfInvestors: {
        type: Number,
        default: 0,
        min: 0
    },
    percentageRaised: {
        type: Number,
        default: 0,
        min: 0,
        max: 100
    },
    riskLevel: {
        type: String,
        enum: ['low', 'medium', 'high'],
        required: true
    },
    startDate: {
        type: Date,
        required: false
    },
    endDate: {
        type: Date,
        required: false
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
    images: [{
        data: String, // Base64 encoded image data
        contentType: String, // MIME type of the image
        caption: String,
        order: Number
    }],
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    },
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
    return (this.currentRaise / this.targetRaise) * 100;
});

// Virtual field for remaining investment needed
investmentSchema.virtual('remainingInvestment').get(function() {
    return this.targetRaise - this.currentRaise;
});

// Virtual field for days remaining until closing
investmentSchema.virtual('daysRemaining').get(function() {
    if (!this.endDate) return null;
    
    const today = new Date();
    const endDate = new Date(this.endDate);
    const timeDiff = endDate.getTime() - today.getTime();
    const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));
    
    return daysDiff > 0 ? daysDiff : 0;
});

// Ensure virtuals are included in JSON output
investmentSchema.set('toJSON', { virtuals: true });
investmentSchema.set('toObject', { virtuals: true });

// Update the updatedAt timestamp before saving
investmentSchema.pre('save', function(next) {
    this.updatedAt = Date.now();
    next();
});

module.exports = mongoose.model('Investment', investmentSchema);
