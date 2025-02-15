document.addEventListener('DOMContentLoaded', () => {
    // Sample activity data
    const activities = [
        {
            type: 'investment',
            description: 'New investment in Office Complex A',
            amount: '$100,000',
            date: '2025-02-14'
        },
        {
            type: 'return',
            description: 'Quarterly return from Retail Center B',
            amount: '$5,250',
            date: '2025-02-10'
        },
        {
            type: 'document',
            description: 'Q4 2024 Investment Report available',
            date: '2025-02-01'
        }
    ];

    // Sample documents data
    const documents = [
        {
            name: 'Q4 2024 Investment Report',
            type: 'PDF',
            date: '2025-02-01'
        },
        {
            name: 'Property A Investment Agreement',
            type: 'PDF',
            date: '2024-12-15'
        },
        {
            name: 'Tax Documents 2024',
            type: 'ZIP',
            date: '2025-01-30'
        }
    ];

    // Initialize dashboard
    initializeDashboard();

    // Handle newsletter subscription
    const newsletterForm = document.getElementById('newsletter-form');
    if (newsletterForm) {
        newsletterForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const email = document.getElementById('newsletter-email').value;
            
            // Show success message
            const button = this.querySelector('button');
            const originalText = button.textContent;
            button.textContent = 'Subscribed!';
            button.style.backgroundColor = '#28a745';
            
            // Reset form after delay
            setTimeout(() => {
                this.reset();
                button.textContent = originalText;
                button.style.backgroundColor = '';
            }, 3000);
        });
    }

    // Dashboard functionality
    function initializeDashboard() {
        const dashboardTabs = document.querySelectorAll('.dashboard-tab');
        const dashboardPanels = document.querySelectorAll('.dashboard-panel');

        // Tab switching
        dashboardTabs.forEach(tab => {
            tab.addEventListener('click', () => {
                const targetPanel = tab.getAttribute('data-tab');
                
                // Update active tab
                dashboardTabs.forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                
                // Update active panel
                dashboardPanels.forEach(panel => {
                    panel.classList.remove('active');
                    if (panel.id === `${targetPanel}-panel`) {
                        panel.classList.add('active');
                    }
                });
            });
        });

        // Load activity list
        const activityList = document.querySelector('.activity-list');
        if (activityList) {
            activities.forEach(activity => {
                const activityItem = document.createElement('div');
                activityItem.className = 'activity-item';
                activityItem.innerHTML = `
                    <div class="activity-icon ${activity.type}"></div>
                    <div class="activity-details">
                        <p>${activity.description}</p>
                        ${activity.amount ? `<p class="activity-amount">${activity.amount}</p>` : ''}
                        <small>${formatDate(activity.date)}</small>
                    </div>
                `;
                activityList.appendChild(activityItem);
            });
        }

        // Load documents list
        const documentsList = document.querySelector('.documents-list');
        if (documentsList) {
            documents.forEach(doc => {
                const docItem = document.createElement('div');
                docItem.className = 'document-item';
                docItem.innerHTML = `
                    <div class="document-icon ${doc.type.toLowerCase()}"></div>
                    <div class="document-details">
                        <p>${doc.name}</p>
                        <small>${formatDate(doc.date)}</small>
                    </div>
                    <button class="download-btn">Download</button>
                `;
                documentsList.appendChild(docItem);
            });
        }

        // Handle profile form
        const profileForm = document.getElementById('profile-form');
        if (profileForm) {
            profileForm.addEventListener('submit', function(e) {
                e.preventDefault();
                const button = this.querySelector('.save-profile-btn');
                button.textContent = 'Saved!';
                setTimeout(() => {
                    button.textContent = 'Save Changes';
                }, 2000);
            });
        }
    }

    // Utility function to format dates
    function formatDate(dateStr) {
        const options = { year: 'numeric', month: 'short', day: 'numeric' };
        return new Date(dateStr).toLocaleDateString('en-US', options);
    }
    // Mobile menu functionality
    const mobileMenuBtn = document.querySelector('.mobile-menu');
    const navLinks = document.querySelector('.nav-links');

    mobileMenuBtn.addEventListener('click', () => {
        navLinks.style.display = navLinks.style.display === 'flex' ? 'none' : 'flex';
    });

    // Sample investment opportunities data
    const investments = [
        {
            title: 'Premium Office Complex',
            location: 'Downtown Financial District',
            return: '8-12% Annual ROI',
            minInvestment: '$50,000',
            totalValue: '$25M',
            occupancy: '95%',
            propertyType: 'Class A Office',
            squareFeet: '125,000',
            tenants: '15 Premium Corporate Tenants',
            highlights: [
                'Prime Downtown Location',
                'Recently Renovated',
                'LEED Certified',
                'Long-term Leases'
            ],
            image: 'https://images.unsplash.com/photo-1497366216548-37526070297c',
            status: 'Open for Investment'
        },
        {
            title: 'Luxury Residential Tower',
            location: 'Waterfront District',
            return: '10-15% Annual ROI',
            minInvestment: '$75,000',
            totalValue: '$40M',
            occupancy: '98%',
            propertyType: 'Multi-family Luxury',
            squareFeet: '200,000',
            units: '120 Premium Units',
            highlights: [
                'Ocean Views',
                'Premium Amenities',
                'Smart Home Technology',
                'High Rental Demand'
            ],
            image: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00',
            status: 'Filling Fast'
        },
        {
            title: 'Retail Shopping Center',
            location: 'Urban Core',
            return: '7-10% Annual ROI',
            minInvestment: '$100,000',
            totalValue: '$30M',
            occupancy: '92%',
            propertyType: 'Retail Complex',
            squareFeet: '175,000',
            tenants: '25 Premium Retail Spaces',
            highlights: [
                'Anchor Tenants Secured',
                'High Foot Traffic',
                'Recent Expansion',
                'Strong Demographics'
            ],
            image: 'https://images.unsplash.com/photo-1519074069444-1ba4fff66d16',
            status: '60% Funded'
        }
    ];

    // Investment Calculator Functions
    const calculateInvestmentReturns = (amount, years, returnRate) => {
        const monthlyRate = returnRate / 12 / 100;
        const months = years * 12;
        let totalValue = amount;
        let monthlyIncome = (amount * monthlyRate);
        
        return {
            totalValue: totalValue * Math.pow(1 + returnRate / 100, years),
            monthlyIncome: monthlyIncome,
            annualIncome: monthlyIncome * 12,
            totalReturn: (totalValue * Math.pow(1 + returnRate / 100, years)) - amount
        };
    };

    // Populate investment opportunities
    const opportunitiesGrid = document.querySelector('.opportunities-grid');
    
    investments.forEach(investment => {
        const card = document.createElement('div');
        card.className = 'investment-card';
        card.innerHTML = `
            <div class="investment-image" style="background-image: url(${investment.image})">
                <div class="investment-status">${investment.status}</div>
            </div>
            <div class="investment-details">
                <h3>${investment.title}</h3>
                
                <div class="investment-meta">
                    <div class="meta-item">
                        <i class="fas fa-map-marker-alt"></i>
                        <span>${investment.location}</span>
                    </div>
                    <div class="meta-item">
                        <i class="fas fa-chart-line"></i>
                        <span>${investment.return}</span>
                    </div>
                    <div class="meta-item">
                        <i class="fas fa-dollar-sign"></i>
                        <span>Min: ${investment.minInvestment}</span>
                    </div>
                    <div class="meta-item">
                        <i class="fas fa-building"></i>
                        <span>${investment.propertyType}</span>
                    </div>
                    <div class="meta-item">
                        <i class="fas fa-chart-pie"></i>
                        <span>${investment.occupancy} Occupied</span>
                    </div>
                    <div class="meta-item">
                        <i class="fas fa-expand-alt"></i>
                        <span>${investment.squareFeet} sq ft</span>
                    </div>
                </div>

                <div class="investment-highlights">
                    <h4>Property Highlights</h4>
                    <div class="highlight-list">
                        ${investment.highlights.map(highlight => `
                            <div class="highlight-item">
                                <i class="fas fa-check-circle"></i>
                                <span>${highlight}</span>
                            </div>
                        `).join('')}
                    </div>
                </div>

                <button class="invest-btn">Learn More</button>
            </div>
        `;
        opportunitiesGrid.appendChild(card);
    });

    // Initialize calculator
    const calculator = {
        amount: document.getElementById('calc-investment-amount'),
        duration: document.getElementById('calc-investment-duration'),
        returnRate: document.getElementById('calc-expected-return'),
        calculateBtn: document.getElementById('calculate-btn'),
        totalValue: document.getElementById('total-value'),
        monthlyIncome: document.getElementById('monthly-income'),
        annualIncome: document.getElementById('annual-income'),
        totalReturn: document.getElementById('total-return')
    };

    if (calculator.calculateBtn) {
        calculator.calculateBtn.addEventListener('click', () => {
            const amount = parseFloat(calculator.amount.value);
            const years = parseFloat(calculator.duration.value);
            const returnRate = parseFloat(calculator.returnRate.value);

            const results = calculateInvestmentReturns(amount, years, returnRate);

            // Format and display results
            calculator.totalValue.textContent = formatCurrency(results.totalValue);
            calculator.monthlyIncome.textContent = formatCurrency(results.monthlyIncome);
            calculator.annualIncome.textContent = formatCurrency(results.annualIncome);
            calculator.totalReturn.textContent = formatCurrency(results.totalReturn);

            // Animate results
            document.querySelectorAll('.result-card').forEach(card => {
                card.style.animation = 'none';
                card.offsetHeight; // Trigger reflow
                card.style.animation = 'pulse 0.5s';
            });
        });
    }

    // Utility function to format currency
    function formatCurrency(value) {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(value);
    }

    // Smooth scrolling for navigation links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth'
                });
            }
        });
    });

    // Add investment card hover effects
    const style = document.createElement('style');
    style.textContent = `
        .investment-card {
            background: white;
            border-radius: 10px;
            overflow: hidden;
            box-shadow: 0 5px 15px rgba(0,0,0,0.1);
            transition: transform 0.3s ease;
        }

        .investment-card:hover {
            transform: translateY(-5px);
        }

        .investment-image {
            height: 200px;
            background-size: cover;
            background-position: center;
        }

        .investment-details {
            padding: 1.5rem;
        }

        .investment-details h3 {
            color: var(--primary-color);
            margin-bottom: 1rem;
        }

        .investment-details p {
            margin-bottom: 0.5rem;
        }

        .investment-details i {
            color: var(--accent-color);
            margin-right: 0.5rem;
        }

        .invest-btn {
            background-color: var(--primary-color);
            color: white;
            border: none;
            padding: 0.75rem 1.5rem;
            border-radius: 5px;
            margin-top: 1rem;
            cursor: pointer;
            transition: background-color 0.3s ease;
        }

        .invest-btn:hover {
            background-color: var(--secondary-color);
        }
    `;
    document.head.appendChild(style);

    // Contact form handling
    const contactForm = document.getElementById('contact-form');
    if (contactForm) {
        contactForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            // Get form data
            const formData = {
                name: document.getElementById('name').value,
                email: document.getElementById('email').value,
                investmentInterest: document.getElementById('investment-interest').value,
                investmentAmount: document.getElementById('investment-amount').value,
                message: document.getElementById('message').value
            };

            // Show success message
            const submitBtn = contactForm.querySelector('.submit-btn');
            const originalText = submitBtn.textContent;
            submitBtn.textContent = 'Message Sent!';
            submitBtn.style.backgroundColor = '#28a745';
            submitBtn.disabled = true;

            // Reset form after delay
            setTimeout(() => {
                contactForm.reset();
                submitBtn.textContent = originalText;
                submitBtn.style.backgroundColor = '';
                submitBtn.disabled = false;
            }, 3000);

            // Log form data (replace with actual form submission)
            console.log('Form submitted:', formData);
        });
    }
});
