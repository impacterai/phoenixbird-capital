// Check authentication on page load
document.addEventListener('DOMContentLoaded', async () => {
    if (!isAuthenticated()) {
        window.location.href = '/login.html';
        return;
    }
});

async function downloadDocument(filename) {
    if (!isAuthenticated()) {
        window.location.href = '/login.html';
        return;
    }

    try {
        // Here you would typically make an API call to get the document
        // For now, we'll just show a message
        console.log(`Downloading ${filename}...`);
        alert('Document download will be implemented in the next phase.');
    } catch (error) {
        console.error('Error downloading document:', error);
        alert('Failed to download document. Please try again later.');
    }
}
