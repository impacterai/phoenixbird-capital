document.addEventListener('DOMContentLoaded', function() {
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = '/login.html';
        return;
    }

    // Setup numeric input fields for auto-formatting
    setupNumericInputFormatting();

    // Check if user is admin
    apiCall('/api/auth/check-admin', 'GET', null, token)
        .then(data => {
            if (data.user) {
                document.getElementById('adminName').textContent = `${data.user.firstName} ${data.user.lastName}`;
            }
        })
        .catch((error) => {
            console.error('Admin check failed:', error);
            window.location.href = '/login.html';
        });

    // Handle logout
    document.getElementById('logoutBtn').addEventListener('click', function(e) {
        e.preventDefault();
        logout();
        window.location.href = '/login.html';
    });

    // Investment form handling
    const investmentForm = document.getElementById('investmentForm');
    const addInvestmentBtn = document.getElementById('addInvestmentBtn');
    const cancelInvestmentBtn = document.getElementById('cancelInvestmentBtn');
    const investmentList = document.getElementById('investmentList');

    // Global variables for image handling
    let uploadedImages = [];
    let currentInvestment = null;

    // Set up image upload listener
    const imageUpload = document.getElementById('imageUpload');
    if (imageUpload) {
        imageUpload.addEventListener('change', handleImageUpload);
        console.log('Added event listener for image upload');
    }

    addInvestmentBtn.addEventListener('click', function() {
        investmentForm.dataset.mode = 'create';
        investmentForm.classList.remove('hidden');
        addInvestmentBtn.classList.add('hidden');
        
        // Clear previous images
        const previewGrid = document.getElementById('imagePreviewGrid');
        if (previewGrid) {
            previewGrid.innerHTML = '';
        }
    });

    cancelInvestmentBtn.addEventListener('click', function() {
        investmentForm.classList.add('hidden');
        addInvestmentBtn.classList.remove('hidden');
        investmentForm.reset();
        investmentForm.dataset.mode = '';
        investmentForm.dataset.editId = '';
        
        // Clear image uploads
        const previewGrid = document.getElementById('imagePreviewGrid');
        if (previewGrid) {
            previewGrid.innerHTML = '';
        }
        uploadedImages = [];
    });

    // Load investments
    async function loadInvestments() {
        console.log('Loading investments');
        try {
            const investments = await apiCall('/api/investments', 'GET', null, token);
            
            if (!investments || !Array.isArray(investments)) {
                throw new Error('Failed to load investments data');
            }
            
            const investmentList = document.getElementById('investmentList');
            
            // Clear the list
            investmentList.innerHTML = '';
            
            if (investments.length === 0) {
                investmentList.innerHTML = '<div class="error">No investments found</div>';
                return;
            }
            
            // Add each investment to the list
            investments.forEach(investment => {
                investmentList.appendChild(createInvestmentElement(investment));
            });
        } catch (error) {
            console.error('Error loading investments:', error);
            const investmentList = document.getElementById('investmentList');
            investmentList.innerHTML = '<div class="error">Failed to load investments. Please try again.</div>';
        }
    }

    // Create investment element
    function createInvestmentElement(investment) {
        const item = document.createElement('div');
        item.className = 'investment-item';
        
        // Format investment details
        item.innerHTML = `
            <div class="investment-details">
                <h3>${investment.title || 'Untitled Investment'}</h3>
                <p class="investment-description">${(investment.description || '').substring(0, 100)}${investment.description && investment.description.length > 100 ? '...' : ''}</p>
            </div>
            <div class="investment-actions">
                <button class="admin-btn edit-btn" data-id="${investment._id}">Edit</button>
                <button class="admin-btn manage-images-btn" data-id="${investment._id}">Images</button>
                <button class="admin-btn delete-btn" data-id="${investment._id}">Delete</button>
            </div>
        `;
        
        // Add event listeners
        const editBtn = item.querySelector('.edit-btn');
        editBtn.addEventListener('click', function() {
            editInvestment(this.dataset.id);
        });
        
        const manageImagesBtn = item.querySelector('.manage-images-btn');
        manageImagesBtn.addEventListener('click', function() {
            manageImages(this.dataset.id);
        });
        
        const deleteBtn = item.querySelector('.delete-btn');
        deleteBtn.addEventListener('click', function() {
            if (confirm('Are you sure you want to delete this investment?')) {
                deleteInvestment(this.dataset.id);
            }
        });
        
        return item;
    }

    // Helper function to format status
    function formatStatus(status) {
        switch (status) {
            case 'active':
                return 'Active';
            case 'inactive':
                return 'Inactive';
            case 'pending':
                return 'Pending';
            default:
                return 'Unknown';
        }
    }

    // Handle investment form submission
    investmentForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        // Validate form
        const requiredFields = ['investmentTitle', 'investmentDescription', 'minimumInvestment', 
            'totalFundSize', 'targetReturn', 'investmentType', 'riskLevel', 'investmentStatus'];
        
        const invalidFields = requiredFields.filter(field => {
            const input = document.getElementById(field);
            return !input.value.trim();
        });

        if (invalidFields.length > 0) {
            alert('Please fill in all required fields');
            document.getElementById(invalidFields[0]).focus();
            return;
        }

        // Validate numeric fields
        const numericFields = {
            'minimumInvestment': 'Minimum Investment',
            'totalFundSize': 'Total Fund Size',
            'targetReturn': 'Target Return',
            'duration': 'Duration',
            'targetRaise': 'Target Raise',
            'currentRaise': 'Current Raise',
            'numberOfInvestors': 'Number of Investors',
            'percentageRaised': 'Percentage Raised'
        };

        // Function to parse formatted number input
        function parseFormattedNumber(value) {
            // Remove all commas and convert periods to decimal separator
            return parseFloat(value.replace(/,/g, '').replace(/\.(\d{3})/g, '$1'));
        }

        for (const [fieldId, fieldName] of Object.entries(numericFields)) {
            const input = document.getElementById(fieldId);
            const rawValue = input.value.trim();
            
            if (fieldId !== 'duration' && !rawValue) {
                alert(`${fieldName} is required`);
                input.focus();
                return;
            }
            
            // If the user did enter a value for 'duration', validate it
            if (fieldId === 'duration' && rawValue) {
                const value = parseFormattedNumber(rawValue);
                if (isNaN(value) || value <= 0) {
                  alert(`${fieldName} must be a positive number`);
                  input.focus();
                  return;
                }
              }
        }

        const durationElement = document.getElementById('duration');
        const durationValue = durationElement ? durationElement.value.trim() : '';
        let parsedDuration;
        if (durationValue && durationValue.toLowerCase() !== "null") {
        parsedDuration = parseInt(durationValue, 10);
        // Only set duration if it's a valid number
        if (isNaN(parsedDuration)) {
            parsedDuration = null;
        }
        }
        
        const formData = {
            title: document.getElementById('investmentTitle').value.trim(),
            description: document.getElementById('investmentDescription').value.trim(),
            minimumInvestment: parseFormattedNumber(document.getElementById('minimumInvestment').value),
            totalFundSize: parseFormattedNumber(document.getElementById('totalFundSize').value),
            targetReturn: parseFloat(document.getElementById('targetReturn').value),
            ...(parsedDuration ? { duration: parsedDuration } : {}),
            type: document.getElementById('investmentType').value,
            riskLevel: document.getElementById('riskLevel').value,
            status: document.getElementById('investmentStatus').value,
            targetRaise: parseFormattedNumber(document.getElementById('targetRaise').value),
            currentRaise: parseFormattedNumber(document.getElementById('currentRaise').value),
            numberOfInvestors: parseInt(document.getElementById('numberOfInvestors').value),
            percentageRaised: parseFloat(document.getElementById('percentageRaised').value),
            highlights: document.getElementById('highlights').value
                .split('\n')
                .map(line => line.trim())
                .filter(line => line.length > 0)
        };

        const isEdit = investmentForm.dataset.mode === 'edit';
        const confirmMessage = isEdit 
            ? 'Are you sure you want to update this investment?' 
            : 'Are you sure you want to create this investment?';

        if (!confirm(confirmMessage)) {
            return;
        }

        // Disable form and show loading state
        const submitBtn = investmentForm.querySelector('button[type="submit"]');
        const originalButtonText = submitBtn.textContent;
        submitBtn.disabled = true;
        submitBtn.textContent = 'Saving...';
        
        try {
            const method = isEdit ? 'PUT' : 'POST';
            const endpoint = isEdit 
                ? `/api/investments/${investmentForm.dataset.editId}`
                : '/api/investments';

            const data = await apiCall(endpoint, method, formData, token);
            console.log('Investment saved:', data);
            
            // Upload images
            if (uploadedImages.length > 0) {
                const imageUploadResult = await uploadInvestmentImages(data._id);
                if (!imageUploadResult.success) {
                    throw new Error(imageUploadResult.error);
                }
            }
            
            // Show success message
            const successMessage = isEdit ? 'Investment updated successfully!' : 'Investment created successfully!';
            const messageDiv = document.createElement('div');
            messageDiv.className = 'alert alert-success';
            messageDiv.textContent = successMessage;
            investmentForm.insertBefore(messageDiv, investmentForm.firstChild);
            
            // Remove message after 3 seconds
            setTimeout(() => messageDiv.remove(), 3000);
            
            // Reset form and refresh list
            await loadInvestments();
            investmentForm.reset();
            investmentForm.classList.add('hidden');
            addInvestmentBtn.classList.remove('hidden');
            investmentForm.dataset.mode = '';
            investmentForm.dataset.editId = '';
        } catch (error) {
            console.error('Error saving investment:', error);
            const errorMessage = error.message || 'Failed to save investment. Please try again.';
            
            const messageDiv = document.createElement('div');
            messageDiv.className = 'alert alert-error';
            messageDiv.textContent = errorMessage;
            investmentForm.insertBefore(messageDiv, investmentForm.firstChild);
            
            // Remove error message after 5 seconds
            setTimeout(() => messageDiv.remove(), 5000);
        } finally {
            // Re-enable form
            submitBtn.disabled = false;
            submitBtn.textContent = originalButtonText;
        }
    });

    // Upload investment images
    async function uploadInvestmentImages(investmentId) {
        console.log('Uploading investment images', investmentId);
        try {
            // Prepare the image data
            const imageData = [];
            const contentType = [];
            const captions = [];
            
            // Extract data from uploadedImages
            uploadedImages.forEach(image => {
                imageData.push(image.data);
                contentType.push(image.contentType);
                captions.push(image.caption || '');
            });
            
            console.log(`Preparing to upload ${imageData.length} images`);
            
            // Make the API call
            const url = `/api/investments/${investmentId}/images`;
            console.log('Calling API at:', url);
            
            const response = await fetch(url, {
                method: 'POST',
                body: JSON.stringify({
                    imageData,
                    contentType,
                    captions
                }),
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                }
            });
            
            if (!response.ok) {
                console.error('Error uploading images:', response.status, response.statusText);
                const errorText = await response.text();
                console.error('Error response:', errorText);
                throw new Error(`Upload failed with status ${response.status}`);
            }
            
            const result = await response.json();
            console.log('Images uploaded successfully:', result);
            
            // Clear uploaded images array
            uploadedImages = [];
            
            return result;
        } catch (error) {
            console.error('Error uploading images:', error);
            throw error;
        }
    }

    // API call helper function
    async function apiCall(url, method = 'GET', data = null, token = null) {
        console.log(`Making API call to ${url} with method ${method}`);
        
        try {
            const options = {
                method: method,
                headers: {
                    'Content-Type': 'application/json'
                }
            };
            
            if (token) {
                options.headers['Authorization'] = `Bearer ${token}`;
            }
            
            if (data) {
                options.body = JSON.stringify(data);
            }
            
            const response = await fetch(url, options);
            
            // Try to parse the response as JSON regardless of status
            let responseData;
            const responseText = await response.text();
            
            try {
                responseData = JSON.parse(responseText);
            } catch (e) {
                // If it's not valid JSON, just use the text
                responseData = { error: responseText };
            }
            
            // Now handle the status
            if (!response.ok) {
                const errorMessage = responseData.error || `Request failed with status ${response.status}`;
                console.error(`API call error (${url}):`, errorMessage);
                throw new Error(errorMessage);
            }
            
            return responseData;
        } catch (error) {
            console.error(`API call error (${url}):`, error);
            throw error;
        }
    }

    // Fetch investment by ID
    async function getInvestment(id) {
        console.log('Fetching investment:', id);
        try {
            const investment = await apiCall(`/api/investments/${id}`, 'GET', null, token);
            if (!investment) {
                throw new Error('Investment not found');
            }
            return investment;
        } catch (error) {
            console.error('Error fetching investment:', error);
            throw error;
        }
    }

    // Edit investment
    async function editInvestment(id) {
        console.log('Editing investment:', id);
        try {
            const investment = await getInvestment(id);
            
            currentInvestment = investment;
            
            // Populate form with investment data
            document.getElementById('investmentTitle').value = investment.title || '';
            document.getElementById('investmentDescription').value = investment.description || '';
            document.getElementById('minimumInvestment').value = investment.minimumInvestment || '';
            document.getElementById('totalFundSize').value = investment.totalFundSize || '';
            document.getElementById('targetReturn').value = investment.targetReturn || '';
            document.getElementById('duration').value = investment.duration || '';
            document.getElementById('targetRaise').value = investment.targetRaise || '';
            document.getElementById('currentRaise').value = investment.currentRaise || '';
            document.getElementById('numberOfInvestors').value = investment.numberOfInvestors || '';
            document.getElementById('percentageRaised').value = investment.percentageRaised || '';
            document.getElementById('investmentType').value = investment.type || '';
            document.getElementById('riskLevel').value = investment.riskLevel || '';
            document.getElementById('investmentStatus').value = investment.status || '';
            
            // Populate highlights
            if (investment.highlights && Array.isArray(investment.highlights)) {
                document.getElementById('highlights').value = investment.highlights.join('\n');
            } else {
                document.getElementById('highlights').value = '';
            }
            
            // Display existing images
            const previewGrid = document.getElementById('imagePreviewGrid');
            if (previewGrid) {
                previewGrid.innerHTML = ''; // Clear any previous images
                
                if (investment.images && investment.images.length > 0) {
                    const imageContainer = document.createElement('div');
                    imageContainer.id = 'imageContainer';
                    previewGrid.appendChild(imageContainer);
                    
                    investment.images.forEach((image, index) => {
                        const preview = document.createElement('div');
                        preview.className = 'image-preview';
                        preview.dataset.id = image._id || index;
                        preview.dataset.index = index;
                        
                        // Convert URL to absolute if needed
                        const imageUrl = image.url.startsWith('http') ? image.url : `${window.location.origin}${image.url}`;
                        
                        preview.innerHTML = `
                            <img src="${imageUrl}" alt="Investment Image ${index + 1}" onerror="this.src='/images/placeholder.png'; this.onerror=null;">
                            <button type="button" class="btn-remove" data-id="${image._id || index}" data-index="${index}">
                                <i class="fas fa-times"></i>
                            </button>
                            <div class="image-preview-overlay">
                                <input type="text" value="${image.caption || ''}" class="image-caption" placeholder="Add caption">
                            </div>
                        `;
                        
                        // Find the delete button and add click event
                        const deleteButton = preview.querySelector('.btn-remove');
                        deleteButton.addEventListener('click', async function() {
                            if (confirm('Are you sure you want to remove this image?')) {
                                try {
                                    console.log(`Attempting to delete image at index ${this.dataset.index} from investment ${id}`);
                                    
                                    // Get the current number of images
                                    const currentImages = document.querySelectorAll('#imageContainer .image-preview');
                                    const currentIndex = Array.from(currentImages).indexOf(preview);
                                    
                                    console.log(`Current index in DOM: ${currentIndex} vs stored index: ${this.dataset.index}`);
                                    
                                    // Use the current position in the DOM rather than the stored index
                                    await apiCall(`/api/investments/${id}/images/${currentIndex}`, 'DELETE', null, token);
                                    preview.remove();
                                    
                                    // Update indices for remaining images
                                    document.querySelectorAll('#imageContainer .image-preview').forEach((item, idx) => {
                                        item.dataset.index = idx;
                                        const btn = item.querySelector('.btn-remove');
                                        if (btn) btn.dataset.index = idx;
                                    });
                                } catch (error) {
                                    console.error('Error deleting image:', error);
                                    alert('Failed to delete image. Please try again.');
                                }
                            }
                        });
                        
                        // Add caption change event listener
                        const captionInput = preview.querySelector('.image-caption');
                        if (captionInput) {
                            captionInput.addEventListener('input', function() {
                                // We'll update captions when saving the form
                                console.log('Caption changed for image', index, 'to', this.value);
                            });
                        }
                        
                        // Add delete button to preview
                        preview.appendChild(deleteButton);
                        
                        // Add to preview grid
                        imageContainer.appendChild(preview);
                    });
                } else {
                    console.log('No images found for this investment');
                }
            } else {
                console.warn('Image preview grid not found in the DOM');
            }
            
            // Set form mode to edit
            investmentForm.dataset.mode = 'edit';
            investmentForm.dataset.editId = id;
            
            // Show form and hide add button
            investmentForm.classList.remove('hidden');
            addInvestmentBtn.classList.add('hidden');
            
            // Clear any previously uploaded new images
            uploadedImages = [];
            
        } catch (error) {
            console.error('Error fetching investment:', error);
            alert('Failed to load investment data. Please try again.');
        }
    }

    // Delete investment
    function deleteInvestment(id) {
        if (confirm('Are you sure you want to delete this investment? This action cannot be undone.')) {
            console.log('Deleting investment:', id);
            const token = localStorage.getItem('token');
            
            apiCall(`/api/investments/${id}`, 'DELETE', null, token)
                .then(() => {
                    console.log('Investment deleted successfully');
                    loadInvestments();
                    alert('Investment deleted successfully!');
                })
                .catch(error => {
                    console.error('Error deleting investment:', error);
                    alert('Failed to delete investment. Please try again.');
                });
        }
    }

    // Manage images for an investment
    async function manageImages(investmentId) {
        console.log('Managing images for investment:', investmentId);
        
        // Create modal container
        const modalContainer = document.createElement('div');
        modalContainer.className = 'modal-container';
        
        // Add to body
        document.body.appendChild(modalContainer);
        
        try {
            const investment = await getInvestment(investmentId);
            console.log('Investment data loaded:', investment.title);
            
            // Create modal HTML
            const modalHtml = `
                <div class="modal-overlay">
                    <div class="modal-content image-manager-modal">
                        <div class="modal-header">
                            <h2>Manage Images for ${investment.title || 'Investment'}</h2>
                            <span class="close-modal">&times;</span>
                        </div>
                        <div class="modal-body">
                            <div class="existing-images-container">
                                <h3>Current Images</h3>
                                <div class="image-preview-grid" id="existingImagesGrid">
                                    ${investment.images && investment.images.length > 0 
                                        ? '<div id="imageContainer"></div>'
                                        : '<p class="no-images">No images yet. Upload your first image below.</p>'
                                    }
                                </div>
                            </div>
                            
                            <div class="upload-new-container">
                                <h3>Upload New Images</h3>
                                <input type="file" id="modalImageUpload" accept="image/*" multiple style="display: none">
                                <button type="button" class="admin-btn" onclick="document.getElementById('modalImageUpload').click()">
                                    <i class="fas fa-upload"></i> Select Images
                                </button>
                                <div class="image-preview-grid" id="newImagesGrid"></div>
                            </div>
                            
                            <div class="modal-actions">
                                <button type="button" class="admin-btn" id="saveImagesBtn">Save Changes</button>
                                <button type="button" class="admin-btn cancel" id="cancelImagesBtn">Cancel</button>
                            </div>
                        </div>
                    </div>
                </div>
            `;
            
            modalContainer.innerHTML = modalHtml;
            
            // Show modal
            modalContainer.querySelector('.modal-overlay').classList.add('active');
            
            // Close modal
            const closeBtn = modalContainer.querySelector('.close-modal');
            closeBtn.addEventListener('click', function() {
                modalContainer.remove();
            });
            
            // Cancel button
            const cancelBtn = modalContainer.querySelector('#cancelImagesBtn');
            cancelBtn.addEventListener('click', function() {
                modalContainer.remove();
            });
            
            // Remove existing image
            const existingImagesGrid = document.getElementById('existingImagesGrid');
            if (existingImagesGrid) {
                const imageContainer = document.getElementById('imageContainer');
                if (imageContainer) {
                    investment.images.forEach((image, index) => {
                        const preview = document.createElement('div');
                        preview.className = 'image-preview existing-image';
                        preview.dataset.id = image._id || index;
                        preview.dataset.index = index;
                        
                        // Convert URL to absolute if needed
                        const imageUrl = image.url.startsWith('http') ? image.url : `${window.location.origin}${image.url}`;
                        
                        preview.innerHTML = `
                            <img src="${imageUrl}" alt="Investment Image ${index + 1}" onerror="this.src='/images/placeholder.png'; this.onerror=null;">
                            <div class="image-preview-overlay">
                            </div>
                        `;
                        
                        // Create delete button with explicit styling
                        const deleteButton = document.createElement('button');
                        deleteButton.type = 'button';
                        deleteButton.className = 'btn-remove';
                        deleteButton.dataset.id = image._id || index;
                        deleteButton.dataset.index = index;
                        deleteButton.innerHTML = '<i class="fas fa-times"></i>';
                        
                        // Add event listener
                        deleteButton.addEventListener('click', async function() {
                            if (confirm('Are you sure you want to remove this image?')) {
                                try {
                                    console.log(`Attempting to delete image at index ${this.dataset.index} from investment ${investmentId}`);
                                    
                                    // Get the current number of images
                                    const currentImages = document.querySelectorAll('#imageContainer .image-preview');
                                    const currentIndex = Array.from(currentImages).indexOf(preview);
                                    
                                    console.log(`Current index in DOM: ${currentIndex} vs stored index: ${this.dataset.index}`);
                                    
                                    // Use the current position in the DOM rather than the stored index
                                    await apiCall(`/api/investments/${investmentId}/images/${currentIndex}`, 'DELETE', null, token);
                                    preview.remove();
                                    
                                    // Update indices for remaining images
                                    document.querySelectorAll('#imageContainer .image-preview').forEach((item, idx) => {
                                        item.dataset.index = idx;
                                        const btn = item.querySelector('.btn-remove');
                                        if (btn) btn.dataset.index = idx;
                                    });
                                    
                                    // Show message if no images left
                                    if (document.querySelectorAll('#imageContainer .image-preview').length === 0) {
                                        imageContainer.innerHTML = '<p class="no-images">No images yet. Upload your first image below.</p>';
                                    }
                                } catch (error) {
                                    console.error('Error deleting image:', error);
                                    alert('Failed to delete image. Please try again.');
                                }
                            }
                        });
                        
                        // Add caption change event listener
                        const captionInput = preview.querySelector('.image-caption');
                        if (captionInput) {
                            captionInput.addEventListener('input', function() {
                                // We'll update captions when saving the form
                                console.log('Caption changed for image', index, 'to', this.value);
                            });
                        }
                        
                        // Add delete button to preview
                        preview.appendChild(deleteButton);
                        
                        // Add to preview grid
                        imageContainer.appendChild(preview);
                    });
                }
            }
            
            // Upload new images
            const modalImageUpload = document.getElementById('modalImageUpload');
            if (modalImageUpload) {
                modalImageUpload.addEventListener('change', async (event) => {
                    handleModalImageUpload(event, 'newImagesGrid');
                });
            }
            
            // Save changes
            const saveButton = modalContainer.querySelector('#saveImagesBtn');
            if (saveButton) {
                saveButton.addEventListener('click', async () => {
                    try {
                        // Update captions for existing images
                        const existingImages = Array.from(modalContainer.querySelectorAll('.existing-image'));
                        const captionUpdates = existingImages.map(img => {
                            return {
                                id: img.dataset.id,
                                caption: img.querySelector('.image-caption')?.value || ''
                            };
                        });
                        
                        if (captionUpdates.length > 0) {
                            await apiCall(`/api/investments/${investmentId}/images`, 'PUT', { captions: captionUpdates }, token);
                        }
                        
                        // Upload new images
                        if (uploadedImages.length > 0) {
                            await uploadInvestmentImages(investmentId);
                        }
                        
                        alert('Images updated successfully');
                        modalContainer.remove();
                        loadInvestments(); // Refresh the list
                    } catch (error) {
                        console.error('Error saving images:', error);
                        alert('Failed to save changes. Please try again.');
                    }
                });
            }
        } catch (error) {
            console.error('Error fetching investment:', error);
            alert('Failed to fetch investment details. Please try again.');
        }
    }
    
    // Handle modal image upload
    function handleModalImageUpload(event, gridId) {
        console.log('Modal image upload triggered');
        const files = Array.from(event.target.files);
        
        if (files.length === 0) return;
        
        const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
        const maxSize = 5 * 1024 * 1024; // 5MB
        
        // Validate files
        const invalidFiles = files.filter(file => {
            if (!validTypes.includes(file.type)) {
                alert(`Invalid file type: ${file.name}. Only JPEG, PNG, and WebP are allowed.`);
                return true;
            }
            if (file.size > maxSize) {
                alert(`File too large: ${file.name}. Maximum size is 5MB.`);
                return true;
            }
            return false;
        });
        
        if (invalidFiles.length > 0) {
            // Reset input
            event.target.value = '';
            return;
        }
        
        // Get the preview grid
        const previewGrid = document.getElementById(gridId);
        if (!previewGrid) {
            console.error('Preview grid not found');
            return;
        }
        
        // Process valid files
        const validFiles = files.filter(file => !invalidFiles.includes(file));
        console.log('Valid files:', validFiles);
        
        // Process each file
        validFiles.forEach(file => {
            const reader = new FileReader();
            reader.onload = function(e) {
                // Create a unique ID for this image
                const imageId = `modal-img-${Date.now()}-${Math.random().toString(36).substring(2, 10)}`;
                
                // Create preview element
                const preview = document.createElement('div');
                preview.className = 'image-preview new-image';
                preview.dataset.id = imageId;
                
                preview.innerHTML = `
                    <img src="${e.target.result}" alt="Preview Image">
                    <button type="button" class="btn-remove" data-id="${imageId}">
                        <i class="fas fa-times"></i>
                    </button>
                    <div class="image-preview-overlay">
                        <input type="text" placeholder="Add caption" class="image-caption">
                    </div>
                `;
                
                // Find the delete button and add click event
                const deleteButton = preview.querySelector('.btn-remove');
                deleteButton.addEventListener('click', function() {
                    preview.remove();
                });
                
                // Add to preview grid
                previewGrid.appendChild(preview);
                
                console.log('Added image preview with ID:', imageId);
            };
            
            // Read the file as data URL
            reader.readAsDataURL(file);
        });
        
        // Reset input
        event.target.value = '';
    }

    // Remove image from uploaded list
    function removeUploadedImage(previewElement) {
        console.log('Removing uploaded image:', previewElement.dataset.id);
        
        const imageId = previewElement.dataset.id;
        
        // Remove from uploadedImages array
        const imageIndex = uploadedImages.findIndex(img => img.id === imageId);
        if (imageIndex !== -1) {
            uploadedImages.splice(imageIndex, 1);
            console.log('Removed image from uploaded images array');
        }
        
        // Remove preview element from DOM
        previewElement.remove();
    }

    // Handle image upload
    async function handleImageUpload(event) {
        console.log('Image upload triggered');
        const files = Array.from(event.target.files);
        
        if (files.length === 0) return;
        
        const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
        const maxSize = 5 * 1024 * 1024; // 5MB
        
        // Validate files
        const invalidFiles = files.filter(file => {
            if (!validTypes.includes(file.type)) {
                alert(`Invalid file type: ${file.name}. Only JPEG, PNG, and WebP are allowed.`);
                return true;
            }
            if (file.size > maxSize) {
                alert(`File too large: ${file.name}. Maximum size is 5MB.`);
                return true;
            }
            return false;
        });
        
        if (invalidFiles.length > 0) {
            // Reset input
            event.target.value = '';
            return;
        }
        
        // Get the preview grid
        const previewGrid = document.getElementById('imagePreviewGrid');
        if (!previewGrid) {
            console.error('Preview grid not found');
            return;
        }
        
        // Process valid files
        const validFiles = files.filter(file => !invalidFiles.includes(file));
        console.log('Valid files:', validFiles);
        
        // Add to uploaded images array
        validFiles.forEach(file => {
            const reader = new FileReader();
            reader.onload = function(e) {
                // Create a unique ID for this image
                const imageId = `img-${Date.now()}-${Math.random().toString(36).substring(2, 10)}`;
                
                // Get the Base64 data
                const base64Data = e.target.result.split(',')[1]; // Remove the data:image/jpeg;base64, part
                
                // Add to uploadedImages array
                uploadedImages.push({
                    id: imageId,
                    file: file,
                    data: base64Data,
                    contentType: file.type,
                    url: e.target.result, // Keep for preview
                    caption: ''
                });
                
                // Create preview element
                const preview = document.createElement('div');
                preview.className = 'image-preview';
                preview.dataset.id = imageId;
                
                preview.innerHTML = `
                    <img src="${e.target.result}" alt="Preview Image">
                    <button type="button" class="btn-remove" data-id="${imageId}">
                        <i class="fas fa-times"></i>
                    </button>
                    <div class="image-preview-overlay">
                        <input type="text" placeholder="Add caption" class="image-caption">
                    </div>
                `;
                
                // Find the delete button and add click event
                const deleteButton = preview.querySelector('.btn-remove');
                deleteButton.addEventListener('click', function() {
                    console.log('Delete button clicked for image ID:', imageId);
                    removeUploadedImage(preview);
                });
                
                // Add preview to grid
                previewGrid.appendChild(preview);
                
                console.log('Added image preview with ID:', imageId);
            };
            
            // Read the file as data URL
            reader.readAsDataURL(file);
        });
        
        // Reset input
        event.target.value = '';
    }

    // Setup auto-formatting for number inputs
    function setupNumericInputFormatting() {
        const numericInputs = [
            'minimumInvestment', 
            'totalFundSize', 
            'targetRaise', 
            'currentRaise'
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

    // Mobile sidebar toggle
    document.getElementById('sidebarToggle').addEventListener('click', () => {
        document.querySelector('.admin-sidebar').classList.toggle('active');
    });

    // Close sidebar when clicking outside on mobile
    document.addEventListener('click', (e) => {
        const sidebar = document.querySelector('.admin-sidebar');
        const toggle = document.getElementById('sidebarToggle');
        
        if (window.innerWidth <= 768 && 
            sidebar.classList.contains('active') && 
            !sidebar.contains(e.target) && 
            !toggle.contains(e.target)) {
            sidebar.classList.remove('active');
        }
    });

    // Initial load
    loadInvestments();
});
