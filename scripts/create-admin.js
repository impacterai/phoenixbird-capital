require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');

async function createAdminUser() {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGODB_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });

        // Check if admin already exists
        const existingAdmin = await User.findOne({ email: process.argv[2] });
        if (existingAdmin) {
            console.log('An account with this email already exists.');
            process.exit(1);
        }

        // Create admin user
        const admin = new User({
            email: process.argv[2],
            password: process.argv[3],
            firstName: process.argv[4],
            lastName: process.argv[5],
            role: 'admin',
            isAccredited: true
        });

        await admin.save();
        console.log('Admin user created successfully!');
        console.log(`Email: ${admin.email}`);
        console.log(`Name: ${admin.firstName} ${admin.lastName}`);
    } catch (error) {
        console.error('Error creating admin user:', error);
    } finally {
        await mongoose.disconnect();
    }
}

// Check if all required arguments are provided
if (process.argv.length < 6) {
    console.log('Usage: node create-admin.js <email> <password> <firstName> <lastName>');
    process.exit(1);
}

createAdminUser();
