// Check if user is authenticated
function checkAuth() {
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    
    if (!token || !user.isAuthenticated) {
        window.location.href = '/login.html';
        return null;
    }
    return user;
}

// Check if user is admin
function checkAdmin() {
    const user = checkAuth();
    if (!user || user.role !== 'admin') {
        window.location.href = '/login.html';
        return false;
    }
    return true;
}

// Handle logout
function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/login.html';
}

// Update UI based on auth status
function updateAuthUI() {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const token = localStorage.getItem('token');
    const accountLink = document.querySelector('.nav-account');
    
    if (token && user.isAuthenticated) {
        if (accountLink) {
            accountLink.textContent = `${user.firstName}'s Account`;
            accountLink.onclick = logout;
        }
        
        // Update admin-specific UI elements
        const adminElements = document.querySelectorAll('.admin-only');
        adminElements.forEach(element => {
            element.style.display = user.role === 'admin' ? 'block' : 'none';
        });
    } else {
        if (accountLink) {
            accountLink.textContent = 'Sign Up';
            accountLink.href = '/signup.html';
        }
    }
}

// Initialize auth state
document.addEventListener('DOMContentLoaded', () => {
    updateAuthUI();
});
