// Check if user is authenticated
function checkAuth() {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    if (!user.isAuthenticated) {
        window.location.href = 'signup.html';
    }
    return user;
}

// Handle logout
function logout() {
    localStorage.removeItem('user');
    window.location.href = 'index.html';
}

// Update UI based on auth status
function updateAuthUI() {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const accountLink = document.querySelector('.nav-account');
    
    if (user.isAuthenticated) {
        accountLink.textContent = `${user.firstName}'s Account`;
        accountLink.onclick = logout;
    } else {
        accountLink.textContent = 'Sign Up';
        accountLink.href = 'signup.html';
    }
}
