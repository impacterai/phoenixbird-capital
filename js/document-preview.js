// Function to generate PDF preview using PDF.js
async function generatePDFPreview(pdfPath, previewImg) {
    try {
        // Load the PDF document
        const loadingTask = pdfjsLib.getDocument(pdfPath);
        const pdf = await loadingTask.promise;

        // Get the first page
        const page = await pdf.getPage(1);

        // Set the scale to fit our preview size while maintaining quality
        const viewport = page.getViewport({ scale: 2 });
        
        // Create a canvas element
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        canvas.width = viewport.width;
        canvas.height = viewport.height;

        // Render the PDF page to the canvas
        const renderContext = {
            canvasContext: context,
            viewport: viewport
        };
        await page.render(renderContext).promise;

        // Convert the canvas to a data URL and set it as the preview image source
        previewImg.src = canvas.toDataURL();
        
    } catch (error) {
        console.error('Error generating PDF preview:', error);
        // If preview fails, show a fallback PDF icon
        previewImg.src = 'images/pdf-icon.svg';
    }
}

// Initialize previews when the page loads
document.addEventListener('DOMContentLoaded', () => {
    // Load PDF.js library
    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
    script.onload = () => {
        // Set worker path
        pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
        
        // Get all preview images
        const previewImages = document.querySelectorAll('.preview-img');
        
        // Generate preview for each PDF
        previewImages.forEach(img => {
            const pdfPath = img.getAttribute('src');
            generatePDFPreview(pdfPath, img);
        });
    };
    document.head.appendChild(script);
});
