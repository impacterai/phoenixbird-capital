/**
 * Components.js
 * This file provides utility functions to dynamically load HTML components
 * like the navbar and footer across the site.
 */

// Load components CSS file if not already loaded
function loadComponentsCSS() {
    if (!document.querySelector('link[href*="components.css"]')) {
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = '/css/components.css';
        document.head.appendChild(link);
    }
}

// Function to load HTML components
function loadComponent(elementId, componentPath) {
    return fetch(componentPath)
        .then(response => {
            if (!response.ok) {
                throw new Error(`Failed to load component: ${componentPath}`);
            }
            return response.text();
        })
        .then(html => {
            document.getElementById(elementId).innerHTML = html;
            
            // Mark the active navigation item based on current page
            if (elementId === 'navbar-container') {
                markActiveNavItem();
                
                // Hide navbar links on login and signup pages
                const currentPath = window.location.pathname;
                const filename = currentPath.split('/').pop() || 'index.html';
                
                if (filename.includes('login') || filename.includes('signup')) {
                    // Hide all nav links on login/signup pages
                    const navLinks = document.querySelector('.nav-links');
                    if (navLinks) {
                        navLinks.style.display = 'none';
                    }
                }
                
                // Hide main navigation links when investor is logged in (password-protected area)
                const isLoggedIn = !!localStorage.getItem('token');
                if (isLoggedIn) {
                    // Hide the public navigation links but leave authentication elements
                    const publicNavLinks = document.querySelectorAll('.public-nav-link');
                    publicNavLinks.forEach(link => {
                        link.style.display = 'none';
                    });
                }

                adjustNavigation();
            }
            
            return html;
        })
        .catch(error => {
            console.error('Error loading component:', error);
        });
}

// Function to check if current page is the home page
function isHomePage() {
    const currentPath = window.location.pathname;
    const hostname = window.location.hostname;
    
    return currentPath === '/' || 
           currentPath.endsWith('/index.html') ||
           currentPath.endsWith('/index') ||
           currentPath === '' ||
           currentPath.endsWith('/') ||
           (hostname === 'phoenixbirdcapital.com' && currentPath === '/') ||
           window.location.href.endsWith('/index.html');
}

// Function to adjust navigation based on the current page
function adjustNavigation() {
    if (isHomePage()) {
        console.log('Home page detected, hiding investments and documents links');
        
        // Target using both href and class for more reliable selection
        document.querySelectorAll('.public-nav-link').forEach(link => {
            if (link.getAttribute('href') === 'investments.html' || 
                link.getAttribute('href') === 'documents.html') {
                link.style.display = 'none';
                console.log(`${link.textContent} link hidden`);
            }
        });
    }
}

// Function to mark the active navigation item based on current URL
function markActiveNavItem() {
    const currentPath = window.location.pathname;
    const filename = currentPath.split('/').pop() || 'index.html';
    
    // Remove any existing 'active' classes
    const navLinks = document.querySelectorAll('.nav-links a');
    navLinks.forEach(link => link.classList.remove('active'));
    
    // Determine which nav link to mark as active
    if (filename === 'index.html' || filename === '') {
        document.getElementById('nav-home')?.classList.add('active');
    } else if (filename.includes('about')) {
        document.getElementById('nav-about')?.classList.add('active');
    } else if (filename.includes('investment')) {
        document.getElementById('nav-investments')?.classList.add('active');
    } else if (filename.includes('document')) {
        document.getElementById('nav-documents')?.classList.add('active');
    } else if (filename.includes('contact')) {
        document.getElementById('nav-contact')?.classList.add('active');
    } else if (filename.includes('login')) {
        document.getElementById('nav-login')?.classList.add('active');
    } else if (filename.includes('signup')) {
        document.getElementById('nav-signup')?.classList.add('active');
    }
    
    // Show/hide auth elements based on authentication status
    updateAuthVisibility();
}

// Function to update authentication-related elements visibility
function updateAuthVisibility() {
    const token = localStorage.getItem('token');
    const isLoggedIn = !!token;
    
    // IRA link handling - always show for logged in users
    const iraLink = document.getElementById('IRAlink');
    if (iraLink) {
        iraLink.style.display = isLoggedIn ? 'block' : 'none';
        
        // Set IRA link properties if logged in
        if (isLoggedIn) {
            iraLink.textContent = 'IRA';
            iraLink.href = 'https://midlandtrust.com/phoenixbird';
            iraLink.target = '_blank';
        }
    }
    
    // Elements to show when logged in
    document.getElementById('nav-logout')?.style.setProperty('display', isLoggedIn ? 'block' : 'none');
    
    // Elements to show when logged out
    document.getElementById('nav-login')?.style.setProperty('display', isLoggedIn ? 'none' : 'block');
    document.getElementById('nav-signup')?.style.setProperty('display', isLoggedIn ? 'none' : 'block');
    
    // Toggle visibility of public navigation links
    const publicNavLinks = document.querySelectorAll('.public-nav-link');
    publicNavLinks.forEach(link => {
        link.style.display = isLoggedIn ? 'none' : 'block';
    });
    
    // Add contact link if logged in, remove if logged out
    if (isLoggedIn) {
        addContactLinkForLoggedInUsers();
    } else {
        // Remove contact link if it exists
        const contactLink = document.querySelector('.contact-link');
        if (contactLink) {
            contactLink.remove();
        }
    }
}

// Function to check if user is logged in and update UI accordingly
function checkAuthStatus() {
    const token = localStorage.getItem('token');
    if (token) {
        try {
            // Get IRA link element
            const iraElement = document.getElementById('IRAlink');
            
            if (iraElement) {
                // Always show IRA link for any logged-in user
                iraElement.textContent = 'IRA';
                iraElement.href = 'https://midlandtrust.com/phoenixbird';
                iraElement.target = '_blank'; // Open in new tab
                iraElement.style.display = 'block';
            }
            
            // Hide public navigation
            document.querySelectorAll('.public-nav-link').forEach(link => {
                link.style.display = 'none';
            });
            
            // Add Contact link for logged-in users
            addContactLinkForLoggedInUsers();
            
            return true;
        } catch (error) {
            console.error('Error parsing token:', error);
            localStorage.removeItem('token');
            return false;
        }
    }
    return false;
}

// Function to add Contact link for logged-in users
function addContactLinkForLoggedInUsers() {
    const navLinks = document.querySelector('.nav-links');
    const navAccount = document.querySelector('.nav-account');
    
    if (navLinks && navAccount) {
        // Check if Contact link already exists
        if (!document.querySelector('.nav-links .contact-link')) {
            // Create Contact link
            const contactLink = document.createElement('a');
            contactLink.href = 'contact.html';
            contactLink.textContent = 'Contact';
            contactLink.className = 'contact-link';
            
            // Insert before the nav-account div
            navLinks.insertBefore(contactLink, navAccount);
            console.log('Contact link added for logged-in user');
        }
    }
}

// Logout function
function logout() {
    localStorage.removeItem('token');
    window.location.href = 'index.html';
}

// Load components when DOM is fully loaded
document.addEventListener('DOMContentLoaded', () => {
    loadComponentsCSS();
    
    // Load navbar if container exists
    const navbarContainer = document.getElementById('navbar-container');
    if (navbarContainer) {
        loadComponent('navbar-container', '/components/navbar.html')
            .then(() => {
                // Check authentication after navbar is loaded
                checkAuthStatus();
                // Adjust navigation based on current page
                adjustNavigation();
                // Mark active navigation item
                markActiveNavItem();
            });
    }
    
    // Load footer if container exists
    const footerContainer = document.getElementById('footer-container');
    if (footerContainer) {
        loadComponent('footer-container', '/components/footer.html');
    }
});
