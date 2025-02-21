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
        getInvestments()
            .then(investments => {
                console.log('Investments loaded:', investments);
                if (!Array.isArray(investments)) {
                    console.error('Expected array of investments but got:', investments);
                    throw new Error('Invalid investment data format');
                }
                investmentList.innerHTML = '';
                investments.forEach(investment => {
                    const investmentElement = createInvestmentElement(investment);
                    investmentList.appendChild(investmentElement);
                });
            })
            .catch(error => {
                console.error('Error loading investments:', error);
                alert('Failed to load investments. Please try again.');
            });
    }

    // Create investment element
    function createInvestmentElement(investment) {
        const div = document.createElement('div');
        div.className = 'investment-item';
        div.innerHTML = `
            <div class="investment-info">
                <h3>${investment.title}</h3>
                <p>${investment.description}</p>
                <p>Minimum Investment: $${investment.minimumInvestment.toLocaleString()}</p>
                <p>Target Return: ${investment.targetReturn}%</p>
                <p>Status: ${investment.status}</p>
                <p>Type: ${investment.type}</p>
                <p>Duration: ${investment.duration} months</p>
                <p>Fund Size: $${investment.totalFundSize.toLocaleString()}</p>
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
    investmentForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const formData = {
            title: document.getElementById('investmentTitle').value,
            description: document.getElementById('investmentDescription').value,
            minimumInvestment: parseFloat(document.getElementById('minimumInvestment').value),
            totalFundSize: parseFloat(document.getElementById('totalFundSize').value),
            targetReturn: parseFloat(document.getElementById('targetReturn').value),
            duration: parseInt(document.getElementById('duration').value),
            type: document.getElementById('investmentType').value,
            riskLevel: document.getElementById('riskLevel').value,
            status: document.getElementById('investmentStatus').value,
            highlights: document.getElementById('highlights').value
                .split('\n')
                .map(line => line.trim())
                .filter(line => line.length > 0)
        };

        console.log('Submitting investment:', formData);

        const method = investmentForm.dataset.mode === 'edit' ? 'PUT' : 'POST';
        const endpoint = method === 'PUT' 
            ? `/investments/${investmentForm.dataset.editId}`
            : '/investments';

        apiCall(endpoint, method, formData, token)
            .then(data => {
                console.log('Investment saved:', data);
                loadInvestments();
                investmentForm.reset();
                investmentForm.classList.add('hidden');
                addInvestmentBtn.classList.remove('hidden');
                investmentForm.dataset.mode = '';
                investmentForm.dataset.editId = '';
                alert(method === 'PUT' ? 'Investment updated successfully!' : 'Investment created successfully!');
            })
            .catch(error => {
                console.error('Error saving investment:', error);
                alert('Failed to save investment. Please try again.');
            });
    });

    // Edit investment
    function editInvestment(id) {
        console.log('Editing investment:', id);
        apiCall(`/investments/${id}`, 'GET', null, token)
            .then(investment => {
                console.log('Investment details loaded:', investment);
                document.getElementById('investmentTitle').value = investment.title;
                document.getElementById('investmentDescription').value = investment.description;
                document.getElementById('minimumInvestment').value = investment.minimumInvestment;
                document.getElementById('totalFundSize').value = investment.totalFundSize;
                document.getElementById('targetReturn').value = investment.targetReturn;
                document.getElementById('duration').value = investment.duration;
                document.getElementById('investmentType').value = investment.type;
                document.getElementById('riskLevel').value = investment.riskLevel;
                document.getElementById('investmentStatus').value = investment.status;
                document.getElementById('highlights').value = investment.highlights ? investment.highlights.join('\n') : '';
                
                investmentForm.classList.remove('hidden');
                addInvestmentBtn.classList.add('hidden');
                investmentForm.dataset.mode = 'edit';
                investmentForm.dataset.editId = id;
            })
            .catch(error => {
                console.error('Error loading investment:', error);
                alert('Failed to load investment details. Please try again.');
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

    // Initial load
    loadInvestments();
});
