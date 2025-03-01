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
        
        const loginBox = document.querySelector('.login-box');
        if (loginBox && loginBox.firstChild) {
            loginBox.insertBefore(messageElement, loginBox.firstChild);
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
        localStorage.setItem('user', JSON.stringify({
            id: data.user._id,
            email: data.user.email,
            firstName: data.user.firstName,
            lastName: data.user.lastName,
            role: data.user.role,
            isAuthenticated: true
        }));

        // Check if there's a redirect parameter
        const urlParams = new URLSearchParams(window.location.search);
        const redirectParam = urlParams.get('redirect');
        
        // Redirect based on role or redirect parameter
        if (redirectParam) {
            window.location.href = redirectParam;
        } else if (data.user.role === 'admin') {
            window.location.href = '/admin-dashboard.html';
        } else {
            window.location.href = '/dashboard.html';
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
