document.addEventListener('DOMContentLoaded', function() {
    // Contact form submission
    const contactForm = document.getElementById('contactForm');
    if (contactForm) {
        contactForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            // Form data collection
            const formData = {
                firstName: document.getElementById('firstName').value,
                lastName: document.getElementById('lastName').value,
                phone: document.getElementById('phone').value,
                email: document.getElementById('email').value,
                message: document.getElementById('message').value
            };
            
            // Here you would typically send the data to your backend
            console.log('Form submitted:', formData);
            
            // Instead of hiding the form, we leave it visible
            // Clear the form
            contactForm.reset();
            
            // Create and show thank you message at the top of the page
            const thankYouMessage = document.createElement('div');
            thankYouMessage.className = 'thank-you-message';
            thankYouMessage.innerHTML = `
                <h3>Thank you for reaching out! <br> We will review and get back to you.</h3>
            `;
            
            // Insert the thank you message at the top of the body
            document.body.insertBefore(thankYouMessage, document.body.firstChild);
            
            // Scroll to the thank you message smoothly
            thankYouMessage.scrollIntoView({ behavior: 'smooth' });
            
            // Optionally, remove the thank you message after a few seconds (e.g., 5 seconds)
            setTimeout(() => {
                thankYouMessage.remove();
            }, 3000);
        });
    }

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