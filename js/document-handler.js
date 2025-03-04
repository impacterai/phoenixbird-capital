// Function to handle document downloads
async function downloadDocument(filename) {
    const token = getToken();
    
    // Check if we're in a local development environment
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
        // Force download the local file
        const url = `documents/${filename}`;
        const link = document.createElement('a');
        link.href = url;
        link.download = filename; // Force download instead of opening in new tab
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        return;
    }
    
    // Make API request to download endpoint
    const response = await fetch(`/api/documents/download/${filename}`, {
        headers: {
            'Authorization': `Bearer ${token}`
        }
    });
    
    if (!response.ok) {
        throw new Error('Failed to download document');
    }
    
    // Get the blob from the response
    const blob = await response.blob();
    
    // Create a URL for the blob
    const url = window.URL.createObjectURL(blob);
    
    // Create a temporary link and click it
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    
    // Clean up
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
}

// Function to handle document downloads
async function handleDocumentDownload(documentPath) {
    try {
        const filename = documentPath.split('/').pop();
        await downloadDocument(filename);
    } catch (error) {
        console.error('Error downloading document:', error);
        if (error.message === 'Authentication required') {
            alert('Please log in to download documents.');
            window.location.href = '/login.html';
        } else {
            alert('Sorry, there was an error downloading the document. Please try again later.');
        }
    }
}

// Function to check if user has access to document
function hasDocumentAccess() {
    return !!getToken();
}

// Add click handlers to all download buttons
document.addEventListener('DOMContentLoaded', () => {
    const downloadButtons = document.querySelectorAll('.download-btn');
    
    downloadButtons.forEach(button => {
        button.addEventListener('click', (e) => {
            e.preventDefault();
            
            const documentPath = button.getAttribute('data-document');
            
            if (hasDocumentAccess()) {
                handleDocumentDownload(documentPath);
            } else {
                alert('Please log in to download documents.');
                window.location.href = '/login.html';
            }
        });
    });
});
