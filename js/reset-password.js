document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('resetPasswordForm');
    const messageBox = document.getElementById('messageBox');

    form.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const email = document.getElementById('email').value;
        
        try {
            const response = await fetch('/api/auth/forgot-password', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email })
            });

            const data = await response.json();

            if (response.ok) {
                showMessage('success', 'Password reset link has been sent to your email. Please check your inbox.');
                form.reset();
            } else {
                showMessage('error', data.error || 'Failed to send reset link. Please try again.');
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
