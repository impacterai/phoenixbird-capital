/**
 * Components.js
 * This file provides utility functions to dynamically load HTML components
 * like the navbar and footer across the site.
 */

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
            }
            
            return html;
        })
        .catch(error => {
            console.error('Error loading component:', error);
        });
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
    
    // Elements to show when logged in
    document.getElementById('nav-logout')?.style.setProperty('display', isLoggedIn ? 'block' : 'none');
    document.getElementById('userAccountLink')?.style.setProperty('display', isLoggedIn ? 'block' : 'none');
    
    // Elements to show when logged out
    document.getElementById('nav-login')?.style.setProperty('display', isLoggedIn ? 'none' : 'block');
    document.getElementById('nav-signup')?.style.setProperty('display', isLoggedIn ? 'none' : 'block');
}

// Load components when DOM is fully loaded
document.addEventListener('DOMContentLoaded', () => {
    // Load navbar if container exists
    const navbarContainer = document.getElementById('navbar-container');
    if (navbarContainer) {
        loadComponent('navbar-container', '/components/navbar.html');
    }
    
    // Load footer if container exists
    const footerContainer = document.getElementById('footer-container');
    if (footerContainer) {
        loadComponent('footer-container', '/components/footer.html');
    }
});
