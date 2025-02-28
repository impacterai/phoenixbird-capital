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
