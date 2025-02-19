document.addEventListener('DOMContentLoaded', () => {
    const resetPasswordForm = document.getElementById('resetPasswordForm');
    const messageBox = document.getElementById('messageBox');

    resetPasswordForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const email = document.getElementById('email').value;
        
        try {
            // Get registered users from localStorage
            const registeredUsers = JSON.parse(localStorage.getItem('registeredUsers') || '[]');
            
            // Check if the email exists in the registered users
            const userExists = registeredUsers.some(user => user.email === email);
            
            if (userExists) {
                // In a real application, this would trigger an API call to send a reset email
                // For this demo, we'll simulate a successful password reset request
                showMessage('If an account exists with this email, you will receive password reset instructions.', 'success');
                
                // Clear the form
                resetPasswordForm.reset();
            } else {
                // For security reasons, show the same message even if user doesn't exist
                showMessage('If an account exists with this email, you will receive password reset instructions.', 'success');
            }
            
        } catch (error) {
            showMessage('An error occurred while processing your request. Please try again later.', 'error');
            console.error('Reset password error:', error);
        }
    });

    function showMessage(message, type) {
        messageBox.textContent = message;
        messageBox.className = `message-box ${type}`;
        messageBox.classList.remove('hidden');
        
        // Clear message after 5 seconds
        setTimeout(() => {
            messageBox.classList.add('hidden');
        }, 5000);
    }
});
