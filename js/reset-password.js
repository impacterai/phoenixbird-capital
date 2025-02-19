document.addEventListener('DOMContentLoaded', () => {
    const resetPasswordForm = document.getElementById('resetPasswordForm');
    const messageBox = document.getElementById('messageBox');

    resetPasswordForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const email = document.getElementById('email').value;
        
        try {
            const response = await fetch('/api/auth/reset-password', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email })
            });

            const data = await response.json();

            if (response.ok) {
                // Show success message
                messageBox.textContent = data.message;
                messageBox.className = 'message-box success';
                
                // In a real application, we would redirect to a "check your email" page
                // For demo purposes, if we have a reset token, show it
                if (data.resetToken) {
                    const resetLink = document.createElement('p');
                    resetLink.innerHTML = `For demo purposes, here's your reset link: <br>
                        <a href="/reset-password-confirm.html?token=${data.resetToken}">
                            Click here to reset your password
                        </a>`;
                    messageBox.appendChild(resetLink);
                }
            } else {
                throw new Error(data.error || 'Failed to process reset password request');
            }
        } catch (error) {
            // Show error message
            messageBox.textContent = error.message;
            messageBox.className = 'message-box error';
        }
    });

    function showMessage(message, type) {
        messageBox.textContent = message;
        messageBox.className = `message-box ${type}`;
        messageBox.classList.remove('hidden');
        
        setTimeout(() => {
            messageBox.classList.add('hidden');
        }, 5000);
    }
});
