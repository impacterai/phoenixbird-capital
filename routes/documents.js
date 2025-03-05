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
        
        // Set headers to force download instead of display in browser
        res.setHeader('Content-Type', 'application/octet-stream');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        res.setHeader('Content-Transfer-Encoding', 'binary');
        
        // Send the file
        const fileStream = fs.createReadStream(filePath);
        fileStream.pipe(res);
        
        fileStream.on('error', (err) => {
            console.error('Error streaming file:', err);
            if (!res.headersSent) {
                res.status(500).json({ error: 'Error downloading document' });
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
