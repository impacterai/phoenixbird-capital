const express = require('express');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
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

// Configure multer for image uploads
const storage = multer.diskStorage({
    destination: function(req, file, cb) {
        const uploadPath = path.join(__dirname, '../uploads/investments');
        
        // Ensure upload directory exists
        if (!fs.existsSync(uploadPath)) {
            fs.mkdirSync(uploadPath, { recursive: true });
        }
        
        cb(null, uploadPath);
    },
    filename: function(req, file, cb) {
        // Add prefix for better organization and unique timestamp
        const fileName = `investment-${Date.now()}-${Math.floor(Math.random() * 1000000000)}.${file.originalname.split('.').pop()}`;
        cb(null, fileName);
    }
});

// Filter function to only allow image files
const fileFilter = (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Invalid file type. Only JPEG, PNG and WebP are allowed.'), false);
    }
};

const upload = multer({ 
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB limit
    }
});

// List all investments (public)
router.get('/public', async (req, res) => {
    try {
        const investments = await Investment.find()
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

// Admin: Get a single investment by ID
router.get('/:id', adminAuth, async (req, res) => {
    try {
        console.log(`Fetching investment with ID: ${req.params.id}`);
        const investment = await Investment.findById(req.params.id);
        
        if (!investment) {
            console.log(`Investment not found with ID: ${req.params.id}`);
            return res.status(404).json({ error: 'Investment not found' });
        }

        console.log(`Successfully found investment: ${investment.title}`);
        res.json(investment);
    } catch (error) {
        console.error('Get investment error:', error);
        res.status(500).json({ error: 'Failed to fetch investment' });
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

// Admin: Upload images for an investment
router.post('/:id/images', adminAuth, upload.array('images', 10), async (req, res) => {
  try {
    const investmentId = req.params.id;
    
    console.log(`Adding images to investment ${investmentId}`);
    console.log(`Request files: ${req.files ? req.files.length : 0}`);
    
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'No images uploaded' });
    }
    
    // Get the investment
    const investment = await Investment.findById(investmentId);
    if (!investment) {
      return res.status(404).json({ error: 'Investment not found' });
    }
    
    // Process uploaded files
    const newImages = req.files.map((file) => {
      // Create path that will work with static middleware
      const relativePath = `/uploads/investments/${file.filename}`;
      
      return {
        url: relativePath
      };
    });
    
    // Add new images to the investment
    if (!investment.images) {
      investment.images = [];
    }
    
    investment.images = [...investment.images, ...newImages];
    await investment.save();
    
    res.json({
      success: true,
      images: newImages,
      investment: investment
    });
  } catch (error) {
    console.error('Error uploading images:', error);
    res.status(500).json({ error: error.message });
  }
});

// Admin: Delete an image from an investment
router.delete('/:investmentId/images/:imageIndex', adminAuth, async (req, res) => {
    try {
        const { investmentId, imageIndex } = req.params;
        console.log(`Deleting image at index ${imageIndex} from investment ${investmentId}`);
        
        const investment = await Investment.findById(investmentId);
        
        if (!investment) {
            return res.status(404).json({ error: 'Investment not found' });
        }
        
        if (!investment.images || !investment.images.length) {
            return res.status(404).json({ error: 'No images found for this investment' });
        }
        
        const index = parseInt(imageIndex, 10);
        if (isNaN(index) || index < 0 || index >= investment.images.length) {
            return res.status(400).json({ error: 'Invalid image index' });
        }
        
        // Get the image to delete
        const imageToDelete = investment.images[index];
        console.log('Image to delete:', imageToDelete);
        
        // If the image has a URL that points to a file in our system, delete it
        if (imageToDelete && imageToDelete.url) {
            try {
                // Convert URL to file path
                let imagePath = imageToDelete.url;
                
                // Remove leading slash if present
                if (imagePath.startsWith('/')) {
                    imagePath = imagePath.substring(1);
                }
                
                // Try different paths if the image is from the old or new format
                const possiblePaths = [
                    path.join(__dirname, '..', imagePath),
                    path.join(__dirname, '..', 'uploads', 'investments', path.basename(imagePath))
                ];
                
                let fileDeleted = false;
                
                // Try each possible path
                for (const filePath of possiblePaths) {
                    console.log('Checking path:', filePath);
                    
                    if (fs.existsSync(filePath)) {
                        console.log('File found, deleting:', filePath);
                        fs.unlinkSync(filePath);
                        fileDeleted = true;
                        break;
                    }
                }
                
                if (fileDeleted) {
                    console.log('File deleted successfully');
                } else {
                    console.log('File not found in any expected location');
                }
            } catch (fileError) {
                console.error('Error deleting image file:', fileError);
                // Continue with database update even if file deletion fails
            }
        }
        
        // Remove the image from the array
        investment.images.splice(index, 1);
        
        // Save the investment with updated images
        await investment.save();
        console.log('Investment saved with updated images array');
        
        res.json({ 
            success: true,
            message: 'Image deleted successfully' 
        });
    } catch (error) {
        console.error('Error deleting image:', error);
        res.status(500).json({ error: error.message });
    }
});

// Admin: Update image order
router.put('/:id/images', adminAuth, async (req, res) => {
    try {
        const investment = await Investment.findById(req.params.id);
        
        if (!investment) {
            return res.status(404).json({ error: 'Investment not found' });
        }
        
        const { images } = req.body;
        
        if (!Array.isArray(images)) {
            return res.status(400).json({ error: 'Invalid images data' });
        }
        
        // Update images with new order
        investment.images = images;
        await investment.save();
        
        res.status(200).json({ 
            message: 'Images updated successfully',
            images: investment.images
        });
    } catch (error) {
        console.error('Update images error:', error);
        res.status(500).json({ error: 'Failed to update images' });
    }
});

// Admin: Reorder images
router.put('/:investmentId/images/reorder', adminAuth, async (req, res) => {
    try {
        const { investmentId } = req.params;
        const { images } = req.body;
        
        if (!images || !Array.isArray(images)) {
            return res.status(400).json({ error: 'Invalid request: images array is required' });
        }
        
        const investment = await Investment.findById(investmentId);
        
        if (!investment) {
            return res.status(404).json({ error: 'Investment not found' });
        }
        
        // Update the images array with new order
        investment.images = images;
        
        await investment.save();
        
        res.status(200).json({ 
            message: 'Images updated successfully',
            images: investment.images
        });
    } catch (error) {
        console.error('Update images error:', error);
        res.status(500).json({ error: 'Failed to update images' });
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
