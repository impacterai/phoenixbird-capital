document.addEventListener('DOMContentLoaded', function() {
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = '/login.html';
        return;
    }

    // Check if user is admin
    apiCall('/auth/check-admin', 'GET', null, token)
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

    addInvestmentBtn.addEventListener('click', function() {
        investmentForm.dataset.mode = 'create';
        investmentForm.classList.remove('hidden');
        addInvestmentBtn.classList.add('hidden');
    });

    cancelInvestmentBtn.addEventListener('click', function() {
        investmentForm.classList.add('hidden');
        addInvestmentBtn.classList.remove('hidden');
        investmentForm.reset();
        investmentForm.dataset.mode = '';
        investmentForm.dataset.editId = '';
    });

    // Load investments
    function loadInvestments() {
        console.log('Loading investments...');
        getAllInvestments()
            .then(investments => {
                console.log('Investments loaded:', investments);
                const investmentList = document.getElementById('investmentList');
                investmentList.innerHTML = '';
                investments.forEach(investment => {
                    investmentList.appendChild(createInvestmentElement(investment));
                });
            })
            .catch(error => {
                console.error('Error loading investments:', error);
                const investmentList = document.getElementById('investmentList');
                investmentList.innerHTML = '<div class="error">Failed to load investments. Please try again.</div>';
            });
    }

    // Create investment element
    function createInvestmentElement(investment) {
        const div = document.createElement('div');
        div.className = 'investment-item';
        
        // Helper function to format numbers
        const formatCurrency = (value) => {
            return (value || 0).toLocaleString();
        };
        
        // Helper function to format percentages
        const formatPercentage = (value) => {
            return (value || 0).toString();
        };
        
        div.innerHTML = `
            <div class="investment-info">
                <h3>${investment.title}</h3>
                <p>${investment.description}</p>
                <p>Minimum Investment: $${formatCurrency(investment.minimumInvestment)}</p>
                <p>Target Return: ${formatPercentage(investment.targetReturn)}%</p>
                <p>Target Raise: $${formatCurrency(investment.targetRaise)}</p>
                <p>Current Raise: $${formatCurrency(investment.currentRaise)}</p>
                <p>Number of Investors: ${investment.numberOfInvestors || 0}</p>
                <p>Percentage Raised: ${formatPercentage(investment.percentageRaised)}%</p>
                <p>Status: ${investment.status}</p>
                <p>Type: ${investment.type}</p>
                <p>Duration: ${investment.duration} months</p>
                <p>Fund Size: $${formatCurrency(investment.totalFundSize)}</p>
                <p>Risk Level: ${investment.riskLevel}</p>
                ${investment.highlights ? `
                <div class="highlights">
                    <h4>Highlights:</h4>
                    <ul>
                        ${investment.highlights.map(h => `<li>${h}</li>`).join('')}
                    </ul>
                </div>
                ` : ''}
            </div>
            <div class="investment-actions">
                <button class="admin-btn edit-btn" data-id="${investment._id}">
                    <i class="fas fa-edit"></i> Edit
                </button>
                <button class="admin-btn delete-btn" data-id="${investment._id}">
                    <i class="fas fa-trash"></i> Delete
                </button>
            </div>
        `;

        // Add event listeners
        div.querySelector('.edit-btn').addEventListener('click', function() {
            editInvestment(this.dataset.id);
        });

        div.querySelector('.delete-btn').addEventListener('click', function() {
            deleteInvestment(this.dataset.id);
        });

        return div;
    }

    // Handle investment form submission
    investmentForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        // Validate form
        const requiredFields = ['investmentTitle', 'investmentDescription', 'minimumInvestment', 
            'totalFundSize', 'targetReturn', 'duration', 'investmentType', 'riskLevel', 'investmentStatus'];
        
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

        for (const [fieldId, fieldName] of Object.entries(numericFields)) {
            const value = parseFloat(document.getElementById(fieldId).value);
            if (isNaN(value) || value <= 0) {
                alert(`${fieldName} must be a positive number`);
                document.getElementById(fieldId).focus();
                return;
            }
        }
        
        const formData = {
            title: document.getElementById('investmentTitle').value.trim(),
            description: document.getElementById('investmentDescription').value.trim(),
            minimumInvestment: parseFloat(document.getElementById('minimumInvestment').value),
            totalFundSize: parseFloat(document.getElementById('totalFundSize').value),
            targetReturn: parseFloat(document.getElementById('targetReturn').value),
            duration: parseInt(document.getElementById('duration').value),
            type: document.getElementById('investmentType').value,
            riskLevel: document.getElementById('riskLevel').value,
            status: document.getElementById('investmentStatus').value,
            targetRaise: parseFloat(document.getElementById('targetRaise').value),
            currentRaise: parseFloat(document.getElementById('currentRaise').value),
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
                ? `/investments/${investmentForm.dataset.editId}`
                : '/investments';

            const data = await apiCall(endpoint, method, formData, token);
            console.log('Investment saved:', data);
            
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

    // Edit investment
    function editInvestment(id) {
        console.log('Editing investment:', id);
        getInvestmentById(id)
            .then(investment => {
                console.log('Investment details loaded:', investment);
                
                // Map investment data to form fields
                const mappings = {
                    'investmentTitle': investment.title || '',
                    'investmentDescription': investment.description || '',
                    'minimumInvestment': investment.minimumInvestment || 0,
                    'totalFundSize': investment.totalFundSize || 0,
                    'targetReturn': investment.targetReturn || 0,
                    'duration': investment.duration || 1,
                    'investmentType': investment.type || 'real_estate',
                    'riskLevel': investment.riskLevel || 'low',
                    'investmentStatus': investment.status || 'draft',
                    'targetRaise': investment.targetRaise || 0,
                    'currentRaise': investment.currentRaise || 0,
                    'numberOfInvestors': investment.numberOfInvestors || 0,
                    'percentageRaised': investment.percentageRaised || 0,
                    'highlights': investment.highlights ? investment.highlights.join('\n') : ''
                };

                // Set form values with fallbacks
                Object.entries(mappings).forEach(([fieldId, value]) => {
                    const field = document.getElementById(fieldId);
                    if (field) {
                        field.value = value;
                    } else {
                        console.warn(`Field ${fieldId} not found in form`);
                    }
                });
                
                investmentForm.classList.remove('hidden');
                addInvestmentBtn.classList.add('hidden');
                investmentForm.dataset.mode = 'edit';
                investmentForm.dataset.editId = id;
            })
            .catch(error => {
                console.error('Error loading investment:', error);
                const messageDiv = document.createElement('div');
                messageDiv.className = 'alert alert-error';
                messageDiv.textContent = error.message || 'Failed to load investment details. Please try again.';
                document.getElementById('adminContent').insertBefore(messageDiv, document.getElementById('adminContent').firstChild);
                setTimeout(() => messageDiv.remove(), 5000);
            });
    }

    // Delete investment
    function deleteInvestment(id) {
        if (confirm('Are you sure you want to delete this investment? This action cannot be undone.')) {
            console.log('Deleting investment:', id);
            apiCall(`/investments/${id}`, 'DELETE', null, token)
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
