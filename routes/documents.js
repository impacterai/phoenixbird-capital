const express = require('express');
const router = express.Router();
const path = require('path');
const auth = require('../middleware/auth');
const fs = require('fs');

// Route to download a document
router.get('/download/:filename', auth, (req, res) => {
    try {
        const filename = req.params.filename;
        const filePath = path.join(__dirname, '..', 'documents', filename);
        
        // Check if file exists
        if (!fs.existsSync(filePath)) {
            console.error(`File not found: ${filePath}`);
            return res.status(404).json({ error: 'Document not found' });
        }

        console.log(`Attempting to download file: ${filePath}`);
        
        // Send the file
        res.download(filePath, filename, (err) => {
            if (err) {
                console.error('Error downloading file:', err);
                console.error('File path:', filePath);
                console.error('Error details:', {
                    code: err.code,
                    message: err.message,
                    stack: err.stack
                });
                
                // Check if headers have already been sent
                if (!res.headersSent) {
                    res.status(500).json({ error: 'Error downloading document' });
                }
            }
        });
    } catch (error) {
        console.error('Error in document download:', error);
        console.error('Request details:', {
            filename: req.params.filename,
            headers: req.headers,
            user: req.user
        });
        
        // Check if headers have already been sent
        if (!res.headersSent) {
            res.status(500).json({ error: 'Error downloading document' });
        }
    }
});

module.exports = router;
