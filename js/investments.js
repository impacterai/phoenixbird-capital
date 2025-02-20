// Check authentication on page load
document.addEventListener('DOMContentLoaded', async () => {
    if (!isAuthenticated()) {
        window.location.href = '/login.html';
        return;
    }
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
