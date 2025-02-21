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

        // Helper functions for number formatting
        const formatCurrency = (value) => (value || 0).toLocaleString();
        const formatPercentage = (value) => (value || 0).toString();
        const formatNumber = (value) => (value || 0).toString();

        investments.forEach(investment => {
            const card = document.createElement('div');
            card.className = 'offerings-card';
            card.innerHTML = `
                <img src="images/phoenix-bird-logo.png" alt="PhoenixBird Logo" class="investment-logo">
                <div class="offerings-content">
                    <h2 class="offerings-title">${investment.title}</h2>
                    <div class="offerings-details">
                        <p>${investment.description}</p>
                        <ul class="investment-highlights">
                            <li>Minimum Investment: $${formatCurrency(investment.minimumInvestment)}</li>
                            <li>Target Return: ${formatPercentage(investment.targetReturn)}%</li>
                            <li>Duration: ${formatNumber(investment.duration)} months</li>
                            <li>Risk Level: ${investment.riskLevel || 'N/A'}</li>
                            <li>Fund Size: $${formatCurrency(investment.totalFundSize)}</li>
                            <li>Number of Investors: ${formatNumber(investment.numberOfInvestors)}</li>
                            <li>Percentage Raised: ${formatPercentage(investment.percentageRaised)}%</li>
                            <li>Target Raise: $${formatCurrency(investment.targetRaise)}</li>
                            <li>Current Raise: $${formatCurrency(investment.currentRaise)}</li>
                        </ul>
                        ${investment.highlights ? `
                        <div class="highlights">
                            <h4>Highlights:</h4>
                            <ul>
                                ${investment.highlights.map(h => `<li>${h}</li>`).join('')}
                            </ul>
                        </div>
                        ` : ''}
                    </div>
                    <button class="invest-btn" onclick="showInvestmentModal('${investment._id}', '${investment.title}', ${investment.minimumInvestment || 0})">
                        Invest Now
                    </button>
                </div>
            `;
            container.appendChild(card);
        });
    } catch (error) {
        console.error('Error loading investments:', error);
        const container = document.querySelector('.offerings-grid');
        container.innerHTML = '<p class="error">Failed to load investments. Please try again later.</p>';
    }
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
