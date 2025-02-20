document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('newPasswordForm');
    const messageBox = document.getElementById('messageBox');

    // Get token from URL query parameters
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');

    if (!token) {
        showMessage('error', 'Invalid or missing reset token. Please request a new password reset link.');
        form.style.display = 'none';
        return;
    }

    form.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const newPassword = document.getElementById('newPassword').value;
        const confirmPassword = document.getElementById('confirmPassword').value;

        // Validate passwords match
        if (newPassword !== confirmPassword) {
            showMessage('error', 'Passwords do not match');
            return;
        }

        // Validate password length
        if (newPassword.length < 8) {
            showMessage('error', 'Password must be at least 8 characters long');
            return;
        }
        
        try {
            const response = await fetch('/api/auth/reset-password', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    token,
                    newPassword
                })
            });

            const data = await response.json();

            if (response.ok) {
                showMessage('success', 'Password has been reset successfully. Redirecting to login...');
                form.reset();
                // Redirect to login page after 3 seconds
                setTimeout(() => {
                    window.location.href = '/login.html';
                }, 3000);
            } else {
                showMessage('error', data.error || 'Failed to reset password. Please try again.');
            }
        } catch (error) {
            console.error('Error:', error);
            showMessage('error', 'An error occurred. Please try again later.');
        }
    });

    function showMessage(type, message) {
        messageBox.className = `message-box ${type}`;
        messageBox.textContent = message;
        messageBox.style.display = 'block';
    }
});
