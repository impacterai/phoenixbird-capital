/**
 * This script fixes image paths in the database
 * It ensures all image URLs have the correct format for serving via static middleware
 */
require('dotenv').config();
const mongoose = require('mongoose');
const path = require('path');
const fs = require('fs');

// Load models
const Investment = require('../models/Investment');

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(() => {
    console.log('Connected to MongoDB');
    fixImagePaths();
  })
  .catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });

async function fixImagePaths() {
  try {
    console.log('Starting image path fix process...');
    
    // Get all investments with images
    const investments = await Investment.find({ 'images.0': { $exists: true } });
    console.log(`Found ${investments.length} investments with images`);
    
    let updatedCount = 0;
    
    for (const investment of investments) {
      let needsUpdate = false;
      
      console.log(`Checking investment: ${investment.title} (${investment._id})`);
      console.log(`Current images: ${investment.images.length}`);
      
      // Check each image URL and fix if needed
      if (investment.images && investment.images.length > 0) {
        investment.images.forEach((image, index) => {
          if (!image.url) {
            console.log(`Image at index ${index} has no URL`);
            return;
          }
          
          // Log the original URL
          console.log(`Original URL: ${image.url}`);
          
          // Check if URL needs fixing
          if (!image.url.startsWith('/uploads/') && 
              !image.url.startsWith('http://') && 
              !image.url.startsWith('https://')) {
            
            // Get the filename from the URL
            const filename = path.basename(image.url);
            
            // Create new URL with correct path
            const newUrl = `/uploads/investments/${filename}`;
            
            console.log(`Fixing URL: ${image.url} -> ${newUrl}`);
            image.url = newUrl;
            needsUpdate = true;
          }
        });
      }
      
      // Save if changes were made
      if (needsUpdate) {
        await investment.save();
        console.log(`Updated investment: ${investment._id}`);
        updatedCount++;
      } else {
        console.log(`No updates needed for: ${investment._id}`);
      }
    }
    
    console.log(`Completed. Updated ${updatedCount} investments.`);
    
    // Disconnect from the database
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
    
    process.exit(0);
  } catch (error) {
    console.error('Error fixing image paths:', error);
    process.exit(1);
  }
}
