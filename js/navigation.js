// Mobile navigation toggle
document.addEventListener('DOMContentLoaded', () => {
    console.log('Navigation script loaded');
    
    // Get navigation elements
    const navToggle = document.getElementById('navToggle');
    const navClose = document.getElementById('navClose');
    const navLinks = document.querySelector('.nav-links');
    const body = document.body;

    if (navToggle && navLinks) {
        console.log('Navigation elements found');
        
        // Toggle menu when clicking the button
        navToggle.addEventListener('click', (e) => {
            e.stopPropagation();
            console.log('Toggle button clicked');
            navLinks.classList.add('active');
            body.style.overflow = 'hidden'; // Prevent scrolling when menu is open
        });

        // Close menu when clicking the close button
        if (navClose) {
            console.log('Close button found');
            navClose.addEventListener('click', (e) => {
                e.stopPropagation();
                console.log('Close button clicked');
                navLinks.classList.remove('active');
                body.style.overflow = ''; // Restore scrolling
            });
        } else {
            console.warn('Close button not found');
        }

        // Close menu when clicking outside
        document.addEventListener('click', (e) => {
            if (window.innerWidth <= 768 && 
                navLinks.classList.contains('active') && 
                !navLinks.contains(e.target) && 
                !navToggle.contains(e.target)) {
                console.log('Clicked outside menu');
                navLinks.classList.remove('active');
                body.style.overflow = ''; // Restore scrolling
            }
        });

        // Close menu when clicking on a mobile nav link
        const mobileNavLinks = document.querySelectorAll('.mobile-nav-link');
        if (mobileNavLinks.length > 0) {
            console.log(`Found ${mobileNavLinks.length} mobile nav links`);
            mobileNavLinks.forEach(link => {
                link.addEventListener('click', () => {
                    console.log('Mobile nav link clicked');
                    navLinks.classList.remove('active');
                    body.style.overflow = ''; // Restore scrolling
                });
            });
        } else {
            console.warn('No mobile nav links found');
        }

        // Close menu when window is resized above mobile breakpoint
        window.addEventListener('resize', () => {
            if (window.innerWidth > 768) {
                navLinks.classList.remove('active');
                body.style.overflow = ''; // Restore scrolling
            }
        });
    } else {
        console.warn('Navigation elements not found');
    }
});
