document.getElementById('contactForm').addEventListener('submit', function(e) {
    e.preventDefault();
    
    // Form data collection
    const formData = {
        name: document.getElementById('name').value,
        email: document.getElementById('email').value,
        interest: document.getElementById('interest').value,
        amount: document.getElementById('amount').value,
        message: document.getElementById('message').value
    };
    
    // Here you would typically send the data to your backend
    console.log('Form submitted:', formData);
    
    // Show success message
    alert('Thank you for your message! We will get back to you soon.');
    
    // Clear form
    this.reset();
});

document.addEventListener('DOMContentLoaded', function() {
// Check for authentication (for example, a token in localStorage)
const token = localStorage.getItem('token');

// Get both containers
const desktopNav = document.querySelector('.desktop-nav-links');
const mobileNav = document.querySelector('.mobile-nav-links');

// Define the markup for signed-in and not signed-in states
let desktopHTML, mobileHTML;
if (token) {
    // For authenticated users, show "Invest", "IRA", and a Logout button
    desktopHTML = `
    <a href="/investments.html">Investments</a>
    <a href="https://midlandtrust.com/phoenixbird" target="_blank">IRA</a>
    <button onclick="logout()" class="logout-btn">Logout</button>
    `;
    mobileHTML = `
    <a href="/investments.html" class="mobile-nav-link">Investments</a>
    <a href="https://midlandtrust.com/phoenixbird" target="_blank" class="mobile-nav-link">IRA</a>
    <div class="mobile-login-btns">
        <button onclick="logout()" class="login-btn">Logout</button>
    </div>
    `;
} else {
    // For non-authenticated users, show "Home", "About", "IRA", and Sign In/Join buttons
    desktopHTML = `
    <a href="/index.html">Home</a>
    <a href="/about.html">About</a>
    <a href="https://midlandtrust.com/phoenixbird" target="_blank">IRA</a>
    <a href="/login.html" class="login-btn">Sign In</a>
    <a href="/signup.html" class="login-btn">Join</a>
    `;
    mobileHTML = `
    <a href="/index.html" class="mobile-nav-link">Home</a>
    <a href="/about.html" class="mobile-nav-link">About</a>
    <a href="https://midlandtrust.com/phoenixbird" target="_blank" class="mobile-nav-link">IRA</a>
    <div class="mobile-login-btns">
        <a href="/login.html" class="login-btn">Sign In</a>
        <a href="/signup.html" class="login-btn">Join</a>
    </div>
    `;
}

// Update the containers if they exist
if (desktopNav) desktopNav.innerHTML = desktopHTML;
if (mobileNav) mobileNav.innerHTML = mobileHTML;

// Mobile navigation toggle behavior:
const navToggle = document.getElementById('navToggle');
const navContainer = document.querySelector('.nav-links');
if (navToggle && navContainer) {
    navToggle.addEventListener('click', function(e) {
    e.stopPropagation();
    navContainer.classList.toggle('active');
    });

    document.addEventListener('click', function(e) {
    if (window.innerWidth <= 768 &&
        navContainer.classList.contains('active') &&
        !navContainer.contains(e.target) &&
        !navToggle.contains(e.target)) {
        navContainer.classList.remove('active');
    }
    });
}
});