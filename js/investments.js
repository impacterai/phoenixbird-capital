// Check authentication and load investments on page load
document.addEventListener('DOMContentLoaded', async () => {
    if (!isAuthenticated()) {
        window.location.href = '/login.html';
        return;
    }
    await loadInvestments();
});

let currentInvestment = null;

function showInvestmentModal(fundId, fundName, minAmount) {
    if (!isAuthenticated()) {
        window.location.href = '/login.html';
        return;
    }

    currentInvestment = {
        id: fundId,
        name: fundName,
        minAmount: minAmount
    };

    document.getElementById('modalInvestmentTitle').textContent = fundName;
    document.getElementById('investmentAmount').min = minAmount;
    document.getElementById('investmentAmount').value = minAmount;
    document.getElementById('investmentModal').classList.remove('hidden');
}

function closeModal() {
    document.getElementById('investmentModal').classList.add('hidden');
    currentInvestment = null;
}

async function submitInvestmentForm(event) {
    event.preventDefault();
    const amount = document.getElementById('investmentAmount').value;
    const paymentMethod = document.getElementById('paymentMethod').value;

    if (amount < currentInvestment.minAmount) {
        showError(`Minimum investment amount is $${currentInvestment.minAmount.toLocaleString()}`);
        return;
    }

    try {
        // Here you would typically make an API call to process the investment
        showSuccess('Investment submitted successfully!');
        closeModal();
    } catch (error) {
        console.error('Error submitting investment:', error);
        showError('Failed to submit investment. Please try again later.');
    }
}

// Close modal when clicking outside
window.onclick = function(event) {
    const modal = document.getElementById('investmentModal');
    if (event.target === modal) {
        closeModal();
    }
}

function showError(message) {
    // Implement error notification
    console.error(message);
}

function showSuccess(message) {
    // Implement success notification
    console.log(message);
}

// Load and display all available investments
async function loadInvestments() {
    try {
        const investments = await getInvestments();
        const container = document.querySelector('.offerings-grid');
        container.innerHTML = ''; // Clear existing content

        if (investments.length === 0) {
            container.innerHTML = '<p class="no-investments">No active investments available at this time.</p>';
            return;
        }

        investments.forEach(investment => {
            const card = createInvestmentCard(investment);
            container.appendChild(card);
        });
    } catch (error) {
        console.error('Error loading investments:', error);
        const container = document.querySelector('.offerings-grid');
        container.innerHTML = '<p class="error">Failed to load investments. Please try again later.</p>';
    }
}

function createInvestmentCard(investment) {
    const card = document.createElement('div');
    card.className = 'offerings-card';

    // Format currency values
    const formatCurrency = (value) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(value);
    };

    // Format percentage values
    const formatPercentage = (value) => {
        return value + '%';
    };

    const details = [
        { label: 'Minimum Investment', value: formatCurrency(investment.minimumInvestment) },
        { label: 'Target Return', value: formatPercentage(investment.targetReturn) },
        { label: 'Duration', value: investment.duration + ' months' },
        { label: 'Risk Level', value: investment.riskLevel },
        { label: 'Fund Size', value: formatCurrency(investment.fundSize) },
        { label: 'Number of Investors', value: investment.numberOfInvestors },
        { label: 'Percentage Raised', value: formatPercentage(investment.percentageRaised) },
        { label: 'Target Raise', value: formatCurrency(investment.targetRaise) },
        { label: 'Current Raise', value: formatCurrency(investment.currentRaise) }
    ];

    card.innerHTML = `
        <img src="images/phoenix-bird-logo.png" alt="PhoenixBird Logo" class="investment-logo">    
        <div class="offerings-content">
        <h2 class="offerings-title">${investment.title}</h2>
            <p class="offerings-description">${investment.description}</p>
            <div class="investment-details">
                ${details.map(detail => `
                    <div class="investment-detail-item">
                        <span class="detail-label">${detail.label}</span>
                        <span class="detail-value">${detail.value}</span>
                    </div>
                `).join('')}
            </div>
            ${investment.highlights ? `
                <div class="highlights">
                    <h4>Highlights:</h4>
                    <ul>
                        ${investment.highlights.map(h => `<li>${h}</li>`).join('')}
                    </ul>
                </div>
                ` : ''}
            <div class="investment-footer">
                <button onclick="viewInvestment('${investment._id}')" class="invest-btn">View Details</button>
                ${investment.status === 'Open' ? 
                    `<button onclick="showInvestmentModal('${investment._id}', '${investment.title}', ${investment.minimumInvestment || 0})" class="invest-btn">Invest Now</button>` : 
                    ''}
            </div>
        </div>
    `;

    return card;
}

function viewInvestment(investmentId) {
    window.location.href = `investment-details.html?id=${investmentId}`;
}

// Mobile navigation toggle
document.getElementById('navToggle').addEventListener('click', () => {
    document.querySelector('.nav-links').classList.toggle('active');
});

// Close mobile nav when clicking outside
document.addEventListener('click', (e) => {
    const navLinks = document.querySelector('.nav-links');
    const navToggle = document.getElementById('navToggle');
    
    if (window.innerWidth <= 768 && 
        navLinks.classList.contains('active') && 
        !navLinks.contains(e.target) && 
        !navToggle.contains(e.target)) {
        navLinks.classList.remove('active');
    }
});
