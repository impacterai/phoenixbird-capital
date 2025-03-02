// About page JavaScript

document.addEventListener('DOMContentLoaded', function() {
    console.log('About page loaded');
    
    // Any about page specific functionality can be added here
    const teamMembers = document.querySelectorAll('.team-member');
    
    // Add hover effects or animations if needed
    teamMembers.forEach(member => {
        member.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-10px)';
        });
        
        member.addEventListener('mouseleave', function() {
            this.style.transform = 'translateY(0)';
        });
    });
});

document.addEventListener('DOMContentLoaded', function() {
    // Wait for components to load
    setTimeout(function() {
        // Set up mobile navigation toggle
        const navToggle = document.getElementById('navToggle');
        const navLinks = document.querySelector('.nav-links');
        
        if (navToggle && navLinks) {
            // Toggle menu when clicking the button
            navToggle.addEventListener('click', function(e) {
                e.stopPropagation();
                navLinks.classList.toggle('active');
            });
            
            // Close menu when clicking outside
            document.addEventListener('click', function(e) {
                if (window.innerWidth <= 768 && 
                    navLinks.classList.contains('active') && 
                    !navLinks.contains(e.target) && 
                    !navToggle.contains(e.target)) {
                    navLinks.classList.remove('active');
                }
            });
        }
    }, 500); // Give components time to load
});

// Function to check authentication before redirecting to investments page
function redirectToInvestments() {
    // Check if user is authenticated
    const token = localStorage.getItem('token');
    
    if (!token) {
        // If not authenticated, redirect to login page with a return URL
        window.location.href = '/login.html?redirect=investments.html';
    } else {
        // Check if token is valid/not expired
        try {
            const payload = JSON.parse(atob(token.split('.')[1]));
            if (payload.exp > Date.now() / 1000) {
                // Token is valid, redirect to investments page
                window.location.href = '/investments.html';
            } else {
                // Token is expired, redirect to login
                localStorage.removeItem('token'); // Clear invalid token
                window.location.href = '/login.html?redirect=investments.html';
            }
        } catch (error) {
            // Token is invalid, redirect to login
            localStorage.removeItem('token'); // Clear invalid token
            window.location.href = '/login.html?redirect=investments.html';
        }
    }
}

// Function to check authentication status
function checkAuth() {
    const token = localStorage.getItem('token');
    if (token) {
        try {
            const payload = JSON.parse(atob(token.split('.')[1]));
            return payload.exp > Date.now() / 1000;
        } catch (error) {
            return false;
        }
    }
    return false;
}

// Function to update user name in the UI
function updateUserName() {
    if (checkAuth()) {
        // If user is authenticated, show their name
        const userData = JSON.parse(localStorage.getItem('userData') || '{}');
        const navLinks = document.querySelector('.nav-links');
        
        if (navLinks && userData.firstName) {
            // Check if we need to update the navigation links
            if (!document.querySelector('.nav-account')) {
                // Add investment link and user account info
                navLinks.innerHTML = `
                    <a href="index.html">Home</a>
                    <a href="contact.html">Contact</a>
                    <a href="investments.html">Investments</a>
                    <div class="nav-account">
                        <span>Welcome, ${userData.firstName}</span>
                        <button onclick="logout()" class="logout-btn">Logout</button>
                    </div>
                `;
            }
        }
    }
}
