// Check authentication on page load
document.addEventListener('DOMContentLoaded', async () => {
    if (!isAuthenticated()) {
        window.location.href = '/login.html';
        return;
    }

    await loadInvestments();
    await loadMyInvestments();
});

async function loadInvestments() {
    try {
        const investments = await getInvestments();
        const container = document.getElementById('investmentsList');
        container.innerHTML = ''; // Clear existing content

        investments.forEach(investment => {
            const card = createInvestmentCard(investment);
            container.appendChild(card);
        });
    } catch (error) {
        console.error('Error loading investments:', error);
        showError('Failed to load investments. Please try again later.');
    }
}

async function loadMyInvestments() {
    try {
        const investments = await getMyInvestments();
        const container = document.getElementById('myInvestmentsList');
        container.innerHTML = ''; // Clear existing content

        investments.forEach(investment => {
            const card = createMyInvestmentCard(investment);
            container.appendChild(card);
        });
    } catch (error) {
        console.error('Error loading my investments:', error);
        showError('Failed to load your investments. Please try again later.');
    }
}

function createInvestmentCard(investment) {
    const card = document.createElement('div');
    card.className = 'investment-card';
    
    card.innerHTML = `
        <h3>${investment.title}</h3>
        <p>${investment.description}</p>
        <div class="investment-details">
            <p><strong>Minimum Investment:</strong> $${investment.minimumInvestment.toLocaleString()}</p>
            <p><strong>Target Return:</strong> ${investment.targetReturn}%</p>
        </div>
        <button onclick="showInvestmentModal('${investment.id}', '${investment.title}', ${investment.minimumInvestment})" class="invest-btn">
            Invest Now
        </button>
    `;
    
    return card;
}

function createMyInvestmentCard(investment) {
    const card = document.createElement('div');
    card.className = 'my-investment-card';
    
    card.innerHTML = `
        <h3>${investment.investment.title}</h3>
        <div class="investment-details">
            <p><strong>Amount Invested:</strong> $${investment.amount.toLocaleString()}</p>
            <p><strong>Status:</strong> <span class="status-${investment.status.toLowerCase()}">${investment.status}</span></p>
            <p><strong>Date:</strong> ${new Date(investment.createdAt).toLocaleDateString()}</p>
        </div>
    `;
    
    return card;
}

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

    if (!currentInvestment) {
        alert('Please select an investment first');
        return;
    }

    const amount = document.getElementById('investmentAmount').value;
    
    if (amount < currentInvestment.minAmount) {
        alert(`Minimum investment amount is $${currentInvestment.minAmount}`);
        return;
    }

    try {
        const response = await fetch('/api/investments/submit', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${getToken()}`
            },
            body: JSON.stringify({
                fundId: currentInvestment.id,
                amount: parseFloat(amount)
            })
        });

        const data = await response.json();

        if (response.ok) {
            alert('Investment submitted successfully!');
            closeModal();
        } else {
            throw new Error(data.message || 'Failed to submit investment');
        }
    } catch (error) {
        alert(error.message);
    }
}

// Close modal when clicking outside
window.onclick = function(event) {
    const modal = document.getElementById('investmentModal');
    if (event.target === modal) {
        closeModal();
    }
};

function showError(message) {
    const alert = document.createElement('div');
    alert.className = 'alert alert-error';
    alert.textContent = message;
    
    document.body.appendChild(alert);
    setTimeout(() => alert.remove(), 5000);
}

function showSuccess(message) {
    const alert = document.createElement('div');
    alert.className = 'alert alert-success';
    alert.textContent = message;
    
    document.body.appendChild(alert);
    setTimeout(() => alert.remove(), 5000);
}
