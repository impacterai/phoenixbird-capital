// Check authentication and load investments on page load
document.addEventListener('DOMContentLoaded', async () => {
    try {
        // Authentication check moved to navigation.js
        if (typeof loadInvestments === 'function') {
            await loadInvestments();
        } else {
            console.error('loadInvestments function not defined');
        }
        
        // Set up event listeners for the investment modal
        const modal = document.getElementById('investmentModal');
        if (modal) {
            window.onclick = function(event) {
                if (event.target === modal) {
                    closeModal();
                }
            };
        }
    } catch (error) {
        console.error('Error during page initialization:', error);
    }
});

let currentInvestment = null;

function showInvestmentModal(fundId, fundName, minAmount) {
    try {
        // For non-module environments, check if isAuthenticated exists before calling
        if (typeof isAuthenticated === 'function' && !isAuthenticated()) {
            window.location.href = '/login.html';
            return;
        }

        currentInvestment = {
            id: fundId,
            name: fundName,
            minAmount: minAmount
        };

        const modalTitle = document.getElementById('modalInvestmentTitle');
        const amountInput = document.getElementById('investmentAmount');
        const modal = document.getElementById('investmentModal');
        
        if (modalTitle) modalTitle.textContent = fundName;
        if (amountInput) {
            amountInput.min = minAmount;
            amountInput.value = minAmount;
        }
        if (modal) modal.classList.remove('hidden');
    } catch (error) {
        console.error('Error showing investment modal:', error);
        alert(`Error showing investment details. Please try again later.`);
    }
}

function closeModal() {
    try {
        const modal = document.getElementById('investmentModal');
        if (modal) {
            modal.classList.add('hidden');
        }
        currentInvestment = null;
    } catch (error) {
        console.error('Error closing modal:', error);
    }
}

async function submitInvestmentForm(event) {
    event.preventDefault();
    const amount = parseFloat(document.getElementById('investmentAmount').value);
    const paymentMethod = document.getElementById('paymentMethod').value;

    if (amount < currentInvestment.minAmount) {
        showError(`Minimum investment amount is $${currentInvestment.minAmount.toLocaleString()}`);
        return;
    }

    try {
        // First show a loading indicator
        const submitButton = event.target.querySelector('button[type="submit"]');
        if (submitButton) {
            const originalText = submitButton.textContent;
            submitButton.disabled = true;
            submitButton.textContent = 'Processing...';
        }

        // In a real app, you would submit the investment to the server
        // const investmentResult = await submitInvestment(currentInvestment.id, amount, paymentMethod);
        
        // Prepare investment details for email
        const investmentDetails = {
            id: currentInvestment.id,
            name: currentInvestment.name,
            amount: amount,
            paymentMethod: paymentMethod,
            date: new Date().toISOString()
        };
        
        // Send confirmation email through SendGrid API
        const emailResult = await sendInvestmentConfirmationEmail(investmentDetails);
        
        if (emailResult.success) {
            // Display success message with the email confirmation info
            let message = 'Investment confirmed! We have sent a confirmation email to your registered email address.';
            
            // If email was simulated (dev environment), show different message
            if (emailResult.data && emailResult.data.simulated) {
                message = 'Investment confirmed! A confirmation email would be sent in production. (Currently in development mode)';
                console.log('Note: Email sending was simulated because SendGrid API key is not configured.');
            }
            
            showSuccessWithEmail(message);
            
            // Close the modal
            closeModal();
        } else {
            // Handle email sending failure
            console.error('Failed to send confirmation email:', emailResult.error);
            showError('Your investment was recorded, but we couldn\'t send a confirmation email. Our team will contact you shortly.');
            
            // Close the modal anyway since the investment was recorded
            closeModal();
        }
    } catch (error) {
        console.error('Error submitting investment:', error);
        showError('Failed to submit investment. Please try again later.');
        
        // Reset the button
        const submitButton = event.target.querySelector('button[type="submit"]');
        if (submitButton) {
            submitButton.disabled = false;
            submitButton.textContent = 'Confirm Investment';
        }
    }
}

// Function to show success message with email notification
function showSuccessWithEmail(message) {
    const successElement = document.createElement('div');
    successElement.className = 'notification success';
    successElement.innerHTML = `
        <i class="fas fa-check-circle"></i>
        <div class="notification-content">
            <p>${message}</p>
            <p class="email-message">Thank you for your interest in investing. Your investment amount has been confirmed, and we will follow up shortly with the legal documents.</p>
        </div>
        <button class="close-notification" onclick="this.parentElement.remove()">×</button>
    `;
    document.body.appendChild(successElement);
    
    // Remove notification after 10 seconds
    setTimeout(() => {
        if (document.body.contains(successElement)) {
            successElement.remove();
        }
    }, 10000);
}

function showError(message) {
    const errorElement = document.createElement('div');
    errorElement.className = 'notification error';
    errorElement.innerHTML = `
        <i class="fas fa-exclamation-circle"></i>
        <div class="notification-content">
            <p>Error</p>
            <p>${message}</p>
        </div>
        <button class="close-notification" onclick="this.parentElement.remove()">×</button>
    `;
    document.body.appendChild(errorElement);
    
    // Remove notification after 7 seconds
    setTimeout(() => {
        if (document.body.contains(errorElement)) {
            errorElement.remove();
        }
    }, 7000);
}

// Load and display all available investments
async function loadInvestments() {
    try {
        // Check if getInvestments exists
        if (typeof getInvestments !== 'function') {
            console.error('getInvestments function not available');
            const container = document.querySelector('.offerings-grid');
            if (container) {
                container.innerHTML = '<p class="no-investments">Unable to load investments at this time.</p>';
            }
            return;
        }
        
        const investments = await getInvestments();
        const container = document.querySelector('.offerings-grid');
        
        if (!container) {
            console.error('Offerings grid container not found');
            return;
        }
        
        container.innerHTML = ''; // Clear existing content

        if (!investments || investments.length === 0) {
            container.innerHTML = '<p class="no-investments">No investments available at this time.</p>';
            return;
        }

        investments.forEach(investment => {
            const card = createInvestmentCard(investment);
            container.appendChild(card);
        });
    } catch (error) {
        console.error('Error loading investments:', error);
        const container = document.querySelector('.offerings-grid');
        if (container) {
            container.innerHTML = '<p class="no-investments">Error loading investments. Please try again later.</p>';
        }
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

    // Get status badge color
    function getStatusBadgeClass(status) {
        switch(status.toLowerCase()) {
            case 'active':
                return 'status-active';
            case 'draft':
                return 'status-draft';
            case 'funding':
                return 'status-funding';
            case 'closed':
                return 'status-closed';
            default:
                return 'status-default';
        }
    }

    const details = [
        { label: 'Minimum Investment', value: formatCurrency(investment.minimumInvestment) },
        { label: 'Target Return', value: formatPercentage(investment.targetReturn) },
        ...(investment.duration ? [{ label: 'Duration', value: investment.duration + ' months' }] : []),
        { label: 'Risk Level', value: investment.riskLevel },
        { label: 'Fund Size', value: formatCurrency(investment.fundSize) },
        { label: 'Number of Investors', value: investment.numberOfInvestors },
        { label: 'Percentage Raised', value: formatPercentage(investment.percentageRaised) },
        { label: 'Target Raise', value: formatCurrency(investment.targetRaise) },
        { label: 'Current Raise', value: formatCurrency(investment.currentRaise) }
    ];

    // Create carousel HTML if images exist
    let carouselHtml = '';
    if (investment.images && investment.images.length > 0) {
        const slides = investment.images.map((image, index) => `
            <div class="carousel-slide ${index === 0 ? 'active' : ''}">
                <img src="${image.url}" alt="${image.caption || investment.title}">
                ${image.caption ? `<div class="carousel-caption">${image.caption}</div>` : ''}
            </div>
        `).join('');

        const indicators = investment.images.map((_, index) => `
            <div class="carousel-indicator ${index === 0 ? 'active' : ''}" data-slide="${index}"></div>
        `).join('');

        carouselHtml = `
            <div class="carousel">
                <div class="carousel-container">
                    ${slides}
                </div>
                <button class="carousel-control prev" aria-label="Previous slide">
                    <i class="fas fa-chevron-left"></i>
                </button>
                <button class="carousel-control next" aria-label="Next slide">
                    <i class="fas fa-chevron-right"></i>
                </button>
                <div class="carousel-indicators">
                    ${indicators}
                </div>
            </div>
        `;
    } else {
        carouselHtml = `<img src="images/phoenix-bird-logo.png" alt="PhoenixBird Logo" class="investment-logo">`;
    }

    card.innerHTML = `
        ${carouselHtml}
        <div class="offerings-content">
            <div class="offerings-header">
                <h2 class="offerings-title">${investment.title}</h2>
            </div>
            <div class="status-badge ${getStatusBadgeClass(investment.status)}">${investment.status}</div>
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
                ${(investment.status.toLowerCase() === 'active' || investment.status.toLowerCase() === 'funding') ? 
                    `<button onclick="showInvestmentModal('${investment._id}', '${investment.title}', ${investment.minimumInvestment || 0})" class="invest-btn">Invest Now</button>` : 
                    ''}
            </div>
        </div>
    `;

    // Add carousel functionality
    if (investment.images && investment.images.length > 0) {
        const carousel = card.querySelector('.carousel');
        const slides = carousel.querySelectorAll('.carousel-slide');
        const prevBtn = carousel.querySelector('.prev');
        const nextBtn = carousel.querySelector('.next');
        const indicators = carousel.querySelectorAll('.carousel-indicator');
        
        // Initialize current slide index
        let currentSlide = 0;
        
        // Function to show a specific slide
        const showSlide = (index) => {
            // Hide all slides
            slides.forEach(slide => slide.classList.remove('active'));
            indicators.forEach(indicator => indicator.classList.remove('active'));
            
            // Show the selected slide
            slides[index].classList.add('active');
            indicators[index].classList.add('active');
            currentSlide = index;
        };
        
        // Event listeners for controls
        prevBtn.addEventListener('click', () => {
            const newIndex = (currentSlide - 1 + slides.length) % slides.length;
            showSlide(newIndex);
        });
        
        nextBtn.addEventListener('click', () => {
            const newIndex = (currentSlide + 1) % slides.length;
            showSlide(newIndex);
        });
        
        // Event listeners for indicators
        indicators.forEach((indicator, index) => {
            indicator.addEventListener('click', () => {
                showSlide(index);
            });
        });
        
        // Auto-advance slides every 5 seconds
        let slideInterval = setInterval(() => {
            const newIndex = (currentSlide + 1) % slides.length;
            showSlide(newIndex);
        }, 5000);
        
        // Pause auto-advance on hover
        carousel.addEventListener('mouseenter', () => {
            clearInterval(slideInterval);
        });
        
        // Resume auto-advance when mouse leaves
        carousel.addEventListener('mouseleave', () => {
            slideInterval = setInterval(() => {
                const newIndex = (currentSlide + 1) % slides.length;
                showSlide(newIndex);
            }, 5000);
        });
    }

    return card;
}

function viewInvestment(investmentId) {
    window.location.href = `investment-details.html?id=${investmentId}`;
}

// Mobile navigation toggle - Check if element exists first
const navToggle = document.getElementById('navToggle');
if (navToggle) {
    navToggle.addEventListener('click', () => {
        const navLinks = document.querySelector('.nav-links');
        if (navLinks) {
            navLinks.classList.toggle('active');
        }
    });
}

// Close mobile nav when clicking outside
document.addEventListener('click', (e) => {
    const navLinks = document.querySelector('.nav-links');
    const navToggle = document.getElementById('navToggle');
    
    if (window.innerWidth <= 768 && 
        navLinks && navLinks.classList.contains('active') && 
        !navLinks.contains(e.target) && 
        navToggle && !navToggle.contains(e.target)) {
        navLinks.classList.remove('active');
    }
});
