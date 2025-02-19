document.addEventListener('DOMContentLoaded', () => {
    // Get token from URL
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');

    if (!token) {
        showMessage('Invalid reset link. Please request a new password reset.', 'error');
        return;
    }

    const form = document.getElementById('resetPasswordConfirmForm');
    const messageBox = document.getElementById('messageBox');

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const password = document.getElementById('password').value;
        const confirmPassword = document.getElementById('confirmPassword').value;

        // Validate passwords
        if (password !== confirmPassword) {
            showMessage('Passwords do not match', 'error');
            return;
        }

        if (password.length < 8) {
            showMessage('Password must be at least 8 characters long', 'error');
            return;
        }

        try {
            const response = await fetch(`/api/auth/reset-password/${token}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ password })
            });

            const data = await response.json();

            if (response.ok) {
                showMessage('Password has been reset successfully. Redirecting to login...', 'success');
                setTimeout(() => {
                    window.location.href = '/login.html';
                }, 2000);
            } else {
                throw new Error(data.error || 'Failed to reset password');
            }
        } catch (error) {
            showMessage(error.message, 'error');
        }
    });
});

function showMessage(message, type) {
    const messageBox = document.getElementById('messageBox');
    messageBox.textContent = message;
    messageBox.className = `message-box ${type}`;
    messageBox.style.display = 'block';
}
