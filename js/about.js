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
