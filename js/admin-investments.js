let currentInvestment = null;
let uploadedImages = [];
let maxImageUploadSize = 5 * 1024 * 1024; // 5MB
let validImageTypes = ['image/jpeg', 'image/png', 'image/webp'];

document.addEventListener('DOMContentLoaded', async () => {
    try {
        // Check if user is logged in
        const token = localStorage.getItem('token');
        if (!token) {
            window.location.href = '/login.html';
            return;
        }

        // Check if user is admin
        const user = JSON.parse(atob(token.split('.')[1]));
        if (!user.isAdmin) {
            window.location.href = '/dashboard.html';
            return;
        }

        await loadInvestments();
        
        // Add event listeners
        document.getElementById('newInvestmentBtn').addEventListener('click', openNewInvestmentModal);
        document.getElementById('investmentForm').addEventListener('submit', handleInvestmentSubmit);
        document.querySelector('.close-modal').addEventListener('click', closeInvestmentModal);
        
        // Setup numeric input fields for auto-formatting
        setupNumericInputFormatting();
        
        // Image upload event listener
        document.getElementById('imageUpload').addEventListener('change', handleImageUpload);
        console.log('Added event listener for image upload');
        
        // Search and filter event listeners
        document.getElementById('searchInput').addEventListener('input', debounce(handleSearch, 300));
        document.getElementById('statusFilter').addEventListener('change', handleFilters);
        document.getElementById('propertyTypeFilter').addEventListener('change', handleFilters);
        
        console.log('Admin investments page initialized');
    } catch (error) {
        console.error('Error initializing admin page:', error);
        window.location.href = '/login.html'
    }
});

function setupEventListeners() {
    // Search and filter
    document.getElementById('searchInput').addEventListener('input', debounce(handleSearch, 300));
    document.getElementById('statusFilter').addEventListener('change', handleFilters);
    document.getElementById('propertyTypeFilter').addEventListener('change', handleFilters);

    // Image upload
    document.getElementById('imageUpload').addEventListener('change', handleImageUpload);

    // Form submission
    document.getElementById('investmentForm').addEventListener('submit', handleInvestmentSubmit);

    // Modal close
    document.querySelector('.close-modal').addEventListener('click', closeInvestmentModal);
}

async function loadInvestments() {
    try {
        const investments = await getAllInvestments();
        displayInvestments(investments);
    } catch (error) {
        console.error('Error loading investments:', error);
        showError('Failed to load investments');
    }
}

function displayInvestments(investments) {
    const grid = document.getElementById('investmentsGrid');
    grid.innerHTML = '';

    if (!investments || investments.length === 0) {
        grid.innerHTML = '<p class="no-data">No investments found</p>';
        return;
    }

    investments.forEach(investment => {
        const card = document.createElement('div');
        card.className = 'investment-card';
        card.innerHTML = `
            <div class="investment-image">
                <img src="${investment.images?.[0]?.url || 'images/placeholder-property.jpg'}" alt="${investment.title}">
                <span class="status-badge ${investment.status.toLowerCase()}">${investment.status}</span>
            </div>
            <div class="investment-info">
                <h3>${investment.title}</h3>
                <p class="location">${investment.location.city}, ${investment.location.state}</p>
                <div class="investment-stats">
                    <div class="stat">
                        <label>Target</label>
                        <span>$${investment.targetAmount.toLocaleString()}</span>
                    </div>
                    <div class="stat">
                        <label>Return</label>
                        <span>${investment.expectedReturn}%</span>
                    </div>
                    <div class="stat">
                        <label>Type</label>
                        <span>${investment.propertyType}</span>
                    </div>
                </div>
                <div class="action-buttons">
                    <button onclick="editInvestment('${investment._id}')" class="btn btn-secondary">
                        <i class="fas fa-edit"></i> Edit
                    </button>
                    <button onclick="manageImages('${investment._id}')" class="btn btn-primary">
                        <i class="fas fa-images"></i> Manage Images ${investment.images?.length ? `(${investment.images.length})` : ''}
                    </button>
                </div>
            </div>
        `;
        grid.appendChild(card);
    });
}

async function handleImageUpload(event) {
    const files = Array.from(event.target.files);
    const previewGrid = document.getElementById('imagePreviewGrid');
    
    // Validate files
    const validFiles = files.filter(file => {
        if (!validImageTypes.includes(file.type)) {
            showError(`Invalid file type: ${file.name}. Only JPEG, PNG, and WebP are allowed.`);
            return false;
        }
        
        if (file.size > maxImageUploadSize) {
            showError(`File too large: ${file.name}. Maximum size is 5MB.`);
            return false;
        }
        
        return true;
    });
    
    if (validFiles.length === 0) return;
    
    // Add to uploaded images array
    uploadedImages = [...uploadedImages, ...validFiles];
    
    // Create previews
    validFiles.forEach(file => {
        const reader = new FileReader();
        reader.onload = function(e) {
            const preview = document.createElement('div');
            preview.className = 'image-preview';
            preview.innerHTML = `
                <img src="${e.target.result}" alt="Property Image">
                <button type="button" class="btn-remove" onclick="removePreview(this)">
                    <i class="fas fa-times"></i>
                </button>
                <div class="image-preview-overlay">
                    <input type="text" placeholder="Add caption" class="image-caption">
                </div>
            `;
            previewGrid.appendChild(preview);
        };
        reader.readAsDataURL(file);
    });
}

async function handleInvestmentSubmit(event) {
    event.preventDefault();
    
    try {
        const formData = new FormData(event.target);
        const investment = Object.fromEntries(formData.entries());

        // Function to parse formatted number input
        function parseFormattedNumber(value) {
            // Remove all commas and convert periods to decimal separator
            return parseFloat(value.replace(/,/g, '').replace(/\.(\d{3})+(?!\d)/g, '$1'));
        }

        // Format the numeric data
        investment.targetAmount = parseFormattedNumber(investment.targetAmount);
        investment.minimumInvestment = parseFormattedNumber(investment.minimumInvestment);
        investment.expectedReturn = parseFloat(investment.expectedReturn);
        investment.location = {
            address: investment['location.address'],
            city: investment['location.city'],
            state: investment['location.state'],
            zipCode: investment['location.zipCode']
        };

        // Process date fields
        if (investment.startDate) {
            investment.startDate = new Date(investment.startDate);
        }
        
        if (investment.endDate) {
            investment.endDate = new Date(investment.endDate);
        }

        // Remove the flattened location properties
        delete investment['location.address'];
        delete investment['location.city'];
        delete investment['location.state'];
        delete investment['location.zipCode'];

        // Create or update the investment
        const savedInvestment = currentInvestment
            ? await updateInvestment(currentInvestment._id, investment)
            : await createInvestment(investment);

        // Upload images if any
        if (uploadedImages.length > 0) {
            await uploadInvestmentImages(savedInvestment._id, uploadedImages);
        }

        await loadInvestments();
        closeInvestmentModal();
        showSuccess('Investment saved successfully');
    } catch (error) {
        console.error('Error saving investment:', error);
        showError('Failed to save investment');
    }
}

// Upload images for an investment
async function uploadInvestmentImages(investmentId, images) {
    try {
        const token = localStorage.getItem('token');
        const imageFormData = new FormData();
        
        // Add all images to form data
        images.forEach((file, index) => {
            imageFormData.append('images', file);
        });
        
        const response = await fetch(`/api/investments/${investmentId}/images`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`
            },
            body: imageFormData
        });
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to upload images');
        }
        
        const data = await response.json();
        uploadedImages = []; // Clear uploaded images array
        return data;
    } catch (error) {
        console.error('Error uploading images:', error);
        showError('Failed to upload images');
        throw error;
    }
}

function openNewInvestmentModal() {
    currentInvestment = null;
    document.getElementById('modalTitle').textContent = 'New Investment';
    document.getElementById('investmentForm').reset();
    document.getElementById('imagePreviewGrid').innerHTML = '';
    uploadedImages = [];
    document.getElementById('investmentModal').style.display = 'block';
}

async function editInvestment(investmentId) {
    try {
        // Fetch investment details
        const investment = await getInvestmentById(investmentId);
        if (!investment) {
            console.error('Investment not found');
            return;
        }
        
        currentInvestment = investment;
        
        // Clear previous form data and images
        document.getElementById('investmentForm').reset();
        uploadedImages = [];
        clearImagePreviews();
        
        // Set modal title
        document.getElementById('modalTitle').textContent = 'Edit Investment';
        
        // Function to format number with commas
        function formatWithCommas(number) {
            return number.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
        }
        
        // Populate form
        document.getElementById('title').value = investment.title || '';
        document.getElementById('status').value = investment.status || 'Draft';
        document.getElementById('propertyType').value = investment.propertyType || '';
        document.getElementById('description').value = investment.description || '';
        
        // Location fields
        if (investment.location) {
            document.getElementById('address').value = investment.location.address || '';
            document.getElementById('city').value = investment.location.city || '';
            document.getElementById('state').value = investment.location.state || '';
            document.getElementById('zipCode').value = investment.location.zipCode || '';
        }
        
        // Financial details - use formatted values
        document.getElementById('targetAmount').value = investment.targetAmount ? formatWithCommas(investment.targetAmount) : '';
        document.getElementById('minimumInvestment').value = investment.minimumInvestment ? formatWithCommas(investment.minimumInvestment) : '';
        document.getElementById('expectedReturn').value = investment.expectedReturn || '';
        document.getElementById('riskLevel').value = investment.riskLevel || '';
        
        // Format dates
        if (investment.startDate) {
            document.getElementById('startDate').value = new Date(investment.startDate).toISOString().split('T')[0];
        }
        if (investment.endDate) {
            document.getElementById('endDate').value = new Date(investment.endDate).toISOString().split('T')[0];
        }
        
        // Display current images
        const previewGrid = document.getElementById('imagePreviewGrid');
        previewGrid.innerHTML = '';
        currentInvestment.images?.forEach(image => {
            const preview = document.createElement('div');
            preview.className = 'image-preview';
            preview.innerHTML = `
                <img src="${image.url}" alt="Property Image">
                <button type="button" class="btn-remove" onclick="removeExistingImage('${currentInvestment._id}', '${image._id}')">
                    <i class="fas fa-times"></i>
                </button>
                <div class="image-preview-overlay">
                    <input type="text" value="${image.caption || ''}" class="image-caption" readonly>
                </div>
            `;
            previewGrid.appendChild(preview);
        });
        
        document.getElementById('investmentModal').style.display = 'block';
    } catch (error) {
        console.error('Error loading investment:', error);
        showError('Failed to load investment details');
    }
}

async function removeExistingImage(investmentId, imageId) {
    if (!confirm('Are you sure you want to remove this image?')) {
        return;
    }
    
    try {
        await deleteInvestmentImage(investmentId, imageId);
        // Refresh the form
        await editInvestment(investmentId);
    } catch (error) {
        console.error('Error removing image:', error);
    }
}

function closeInvestmentModal() {
    document.getElementById('investmentModal').style.display = 'none';
    currentInvestment = null;
    uploadedImages = [];
}

function removePreview(button) {
    const preview = button.closest('.image-preview');
    const index = Array.from(preview.parentElement.children).indexOf(preview);
    uploadedImages.splice(index, 1);
    preview.remove();
}

async function deleteInvestmentImage(investmentId, imageId) {
    if (!confirm('Are you sure you want to delete this image?')) {
        return;
    }
    
    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`/api/investments/${investmentId}/images/${imageId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to delete image');
        }
        
        const data = await response.json();
        showSuccess('Image deleted successfully');
        return data;
    } catch (error) {
        console.error('Error deleting image:', error);
        showError('Failed to delete image');
        throw error;
    }
}

// Manage images for an investment
async function manageImages(investmentId) {
    console.log('Managing images for investment:', investmentId);
    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`/api/investments/${investmentId}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to fetch investment');
        }
        
        const investment = await response.json();
        console.log('Investment data:', investment);
        
        // Create a modal for image management
        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.id = 'imageManagerModal';
        modal.style.display = 'block';
        
        let imagesHtml = '';
        if (investment.images && investment.images.length > 0) {
            imagesHtml = investment.images.map((image, index) => `
                <div class="image-manager-item" data-index="${index}" data-id="${image._id || ''}">
                    <img src="${image.url}" alt="${image.caption || 'Investment image'}">
                    <div class="image-manager-controls">
                        <input type="text" class="image-caption" value="${image.caption || ''}" placeholder="Add caption">
                        <div class="image-manager-buttons">
                            <button type="button" class="btn btn-icon" onclick="moveImageUp(this.parentNode.parentNode.parentNode)">
                                <i class="fas fa-arrow-up"></i>
                            </button>
                            <button type="button" class="btn btn-icon" onclick="moveImageDown(this.parentNode.parentNode.parentNode)">
                                <i class="fas fa-arrow-down"></i>
                            </button>
                            <button type="button" class="btn btn-icon btn-danger" onclick="deleteInvestmentImage('${investmentId}', '${image._id || index}')">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </div>
                </div>
            `).join('');
        } else {
            imagesHtml = '<p class="no-images">No images uploaded yet. Use the button below to add images.</p>';
        }
        
        modal.innerHTML = `
            <div class="modal-content image-manager-modal">
                <span class="close-modal" onclick="closeImageModal()">&times;</span>
                <h2>Manage Images - ${investment.title}</h2>
                
                <div class="image-manager-grid">
                    ${imagesHtml}
                </div>
                
                <div class="image-upload-container">
                    <div class="upload-controls">
                        <input type="file" id="additionalImageUpload" accept="image/*" multiple style="display: none">
                        <button type="button" class="btn btn-primary" onclick="document.getElementById('additionalImageUpload').click()">
                            <i class="fas fa-upload"></i> Upload New Images
                        </button>
                        <p class="upload-info">Upload up to 10 images (JPEG, PNG, WebP). Max 5MB each.</p>
                    </div>
                </div>
                
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" onclick="closeImageModal()">Close</button>
                    <button type="button" class="btn btn-primary" onclick="saveImageChanges('${investmentId}')">Save Changes</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Add event listener for additional image uploads
        document.getElementById('additionalImageUpload').addEventListener('change', async function(event) {
            console.log('Additional image upload triggered');
            const files = Array.from(event.target.files);
            if (files.length > 0) {
                try {
                    await uploadInvestmentImages(investmentId, files);
                    // Refresh the image manager
                    closeImageModal();
                    manageImages(investmentId);
                } catch (error) {
                    console.error('Error uploading additional images:', error);
                }
            }
        });
        
    } catch (error) {
        console.error('Error managing images:', error);
        showError('Failed to manage images');
    }
}

function closeImageModal() {
    const modal = document.getElementById('imageManagerModal');
    if (modal) {
        modal.remove();
    }
}

// Move image up in order
function moveImageUp(imageItem) {
    const index = parseInt(imageItem.dataset.index);
    if (index === 0) return; // Already at the top
    
    const imageGrid = imageItem.parentNode;
    const items = Array.from(imageGrid.children);
    
    // Swap with previous item
    imageGrid.insertBefore(imageItem, items[index - 1]);
    
    // Update data-index attributes
    updateImageIndices(imageGrid);
}

// Move image down in order
function moveImageDown(imageItem) {
    const index = parseInt(imageItem.dataset.index);
    const imageGrid = imageItem.parentNode;
    const items = Array.from(imageGrid.children);
    
    if (index === items.length - 1) return; // Already at the bottom
    
    // Swap with next item
    imageGrid.insertBefore(items[index + 1], imageItem);
    
    // Update data-index attributes
    updateImageIndices(imageGrid);
}

// Update image indices after reordering
function updateImageIndices(imageGrid) {
    const items = Array.from(imageGrid.children);
    items.forEach((item, index) => {
        item.dataset.index = index;
    });
}

// Save image changes (order and captions)
async function saveImageChanges(investmentId) {
    try {
        const imageGrid = document.querySelector('.image-manager-grid');
        const imageItems = Array.from(imageGrid.querySelectorAll('.image-manager-item'));
        
        if (imageItems.length === 0) {
            document.querySelector('.modal').remove();
            return;
        }
        
        const updatedImages = imageItems.map((item, index) => {
            const caption = item.querySelector('.image-caption').value || '';
            const imageId = item.dataset.id || null;
            const imageUrl = item.querySelector('img').src;
            
            return {
                _id: imageId,
                url: imageUrl,
                caption: caption,
                order: index
            };
        });
        
        const token = localStorage.getItem('token');
        const response = await fetch(`/api/investments/${investmentId}/images/reorder`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ images: updatedImages })
        });
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to update images');
        }
        
        showSuccess('Images updated successfully');
        document.querySelector('.modal').remove();
        await loadInvestments();
    } catch (error) {
        console.error('Error saving image changes:', error);
        showError('Failed to save image changes');
    }
}

function showError(message) {
    const alert = document.createElement('div');
    alert.className = 'alert alert-error';
    alert.innerHTML = `
        <span class="alert-icon"><i class="fas fa-exclamation-circle"></i></span>
        <span class="alert-message">${message}</span>
        <button class="alert-close" onclick="this.parentNode.remove()">&times;</button>
    `;
    document.body.appendChild(alert);
    
    setTimeout(() => {
        alert.classList.add('fade-out');
        setTimeout(() => alert.remove(), 500);
    }, 5000);
}

function showSuccess(message) {
    const alert = document.createElement('div');
    alert.className = 'alert alert-success';
    alert.innerHTML = `
        <span class="alert-icon"><i class="fas fa-check-circle"></i></span>
        <span class="alert-message">${message}</span>
        <button class="alert-close" onclick="this.parentNode.remove()">&times;</button>
    `;
    document.body.appendChild(alert);
    
    setTimeout(() => {
        alert.classList.add('fade-out');
        setTimeout(() => alert.remove(), 500);
    }, 5000);
}

function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

function handleSearch(event) {
    // Implement search functionality
    console.log('Searching:', event.target.value);
}

function handleFilters() {
    // Implement filter functionality
    const status = document.getElementById('statusFilter').value;
    const propertyType = document.getElementById('propertyTypeFilter').value;
    console.log('Filters:', { status, propertyType });
}

// API Functions
async function getAllInvestments() {
    try {
        const token = localStorage.getItem('token');
        const response = await fetch('/api/investments', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to fetch investments');
        }
        
        return await response.json();
    } catch (error) {
        console.error('Error fetching investments:', error);
        throw error;
    }
}

async function createInvestment(data) {
    try {
        const token = localStorage.getItem('token');
        const response = await fetch('/api/investments', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to create investment');
        }
        
        return await response.json();
    } catch (error) {
        console.error('Error creating investment:', error);
        throw error;
    }
}

async function updateInvestment(id, data) {
    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`/api/investments/${id}`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to update investment');
        }
        
        return await response.json();
    } catch (error) {
        console.error('Error updating investment:', error);
        throw error;
    }
}

async function getInvestmentById(id) {
    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`/api/investments/${id}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to fetch investment');
        }
        
        return await response.json();
    } catch (error) {
        console.error('Error fetching investment:', error);
        throw error;
    }
}

// Setup auto-formatting for number inputs
function setupNumericInputFormatting() {
    const numericInputs = [
        'targetAmount', 
        'minimumInvestment'
    ];
    
    numericInputs.forEach(id => {
        const input = document.getElementById(id);
        if (input) {
            // Add input event listener for auto-formatting
            input.addEventListener('input', function(e) {
                // Get input value and remove all non-numeric characters except commas and periods
                let value = e.target.value.replace(/[^\d,.]/g, '');
                
                // Format the number with commas
                if (value) {
                    // Remove all commas first
                    value = value.replace(/,/g, '');
                    
                    // Format with commas for thousand separators
                    value = value.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
                }
                
                // Update the input value
                e.target.value = value;
            });
        }
    });
}
