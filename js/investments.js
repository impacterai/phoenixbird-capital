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
            const card = document.createElement('div');
            card.className = 'offerings-card';
            card.innerHTML = `
                <img src="images/phoenix-bird-logo.png" alt="PhoenixBird Logo" class="investment-logo">
                <div class="offerings-content">
                    <h2 class="offerings-title">${investment.title}</h2>
                    <div class="offerings-details">
                        <p>${investment.description}</p>
                        <ul class="investment-highlights">
                            <li>Minimum Investment: $${investment.minimumInvestment.toLocaleString()}</li>
                            <li>Target Return: ${investment.targetReturn}%</li>
                            <li>Duration: ${investment.duration} months</li>
                            <li>Risk Level: ${investment.riskLevel}</li>
                            <li>Fund Size: $${investment.totalFundSize.toLocaleString()}</li>
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
                    <button class="invest-btn" onclick="showInvestmentModal('${investment._id}', '${investment.title}', ${investment.minimumInvestment})">
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
