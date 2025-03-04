document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }
    
    // Check if there's a redirect parameter in the URL
    const urlParams = new URLSearchParams(window.location.search);
    const redirectParam = urlParams.get('redirect');
    
    if (redirectParam) {
        const messageElement = document.createElement('div');
        messageElement.className = 'login-message';
        messageElement.textContent = 'Please log in to access the investments page.';
        
        // Make sure the message is inserted into the appropriate container
        const loginContainer = document.querySelector('.login-container');
        if (loginContainer) {
            loginContainer.insertBefore(messageElement, loginContainer.firstChild);
        }
    }
});

async function handleLogin(event) {
    event.preventDefault();
    
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    
    try {
        const response = await fetch('/api/auth/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email, password })
        });

        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.error || 'Login failed');
        }

        // Store the token and user data
        localStorage.setItem('token', data.token);
        localStorage.setItem('userData', JSON.stringify({
            id: data.user.id,
            email: data.user.email,
            firstName: data.user.firstName,
            lastName: data.user.lastName,
            role: data.user.role,
            emailVerified: data.user.emailVerified,
            isAuthenticated: true
        }));

        // Check if email is verified
        if (!data.user.emailVerified) {
            window.location.href = '/verification-pending.html';
            return;
        }

        // Check if there's a redirect parameter
        const urlParams = new URLSearchParams(window.location.search);
        const redirectParam = urlParams.get('redirect');
        
        // Redirect based on role or redirect parameter
        if (redirectParam) {
            window.location.href = redirectParam;
        } else if (data.user.role === 'admin') {
            window.location.href = '/admin-dashboard.html';
        } else {
            window.location.href = '/investments.html';
        }
    } catch (error) {
        console.error('Login error:', error);
        const errorElement = document.getElementById('loginError');
        if (errorElement) {
            errorElement.textContent = error.message;
            errorElement.style.display = 'block';
        }
    }
}
