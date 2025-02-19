// API base URL - change this when deploying
const API_URL = window.location.origin + '/api';

// Helper function for making API calls
async function apiCall(endpoint, method = 'GET', data = null, token = null) {
    const headers = {
        'Content-Type': 'application/json'
    };

    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    const config = {
        method,
        headers
    };

    if (data) {
        config.body = JSON.stringify(data);
    }

    try {
        const response = await fetch(`${API_URL}${endpoint}`, config);
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Request failed');
        }
        return await response.json();
    } catch (error) {
        console.error('API call error:', error);
        throw error;
    }
}

// Store token in localStorage
function setToken(token) {
    localStorage.setItem('token', token);
};

// Get token from localStorage
function getToken() {
    return localStorage.getItem('token');
};

// Remove token from localStorage
function removeToken() {
    localStorage.removeItem('token');
};

// Store user data in localStorage
function setUserData(data) {
    localStorage.setItem('userData', JSON.stringify(data));
}

// Get user data from localStorage
function getUserData() {
    const userData = localStorage.getItem('userData');
    return userData ? JSON.parse(userData) : null;
}

// Remove user data from localStorage
function removeUserData() {
    localStorage.removeItem('userData');
}

// Register new user
async function register(userData) {
    try {
        const data = await apiCall('/auth/register', 'POST', userData);
        if (data.token) {
            setToken(data.token);
            setUserData(data.user);
        }
        return data;
    } catch (error) {
        console.error('Registration error:', error);
        throw error;
    }
}

// Login user
async function login(email, password) {
    try {
        const data = await apiCall('/auth/login', 'POST', { email, password });
        if (data.token) {
            setToken(data.token);
            setUserData(data.user);
        }
        return data;
    } catch (error) {
        console.error('Login error:', error);
        throw error;
    }
}

// Reset password
async function resetPassword(email) {
    try {
        const response = await fetch(`${API_URL}/auth/reset-password`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email })
        });

        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.error || 'Password reset failed');
        }

        return data;
    } catch (error) {
        throw error;
    }
}

// Get list of investments
async function getInvestments() {
    try {
        const response = await fetch(`${API_URL}/investments`, {
            headers: {
                'Authorization': `Bearer ${getToken()}`
            }
        });

        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.error || 'Failed to fetch investments');
        }

        return data.investments;
    } catch (error) {
        throw error;
    }
}

// Submit investment
async function submitInvestment(investmentId, amount) {
    try {
        const response = await fetch(`${API_URL}/investments/invest`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${getToken()}`
            },
            body: JSON.stringify({ investmentId, amount })
        });

        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.error || 'Failed to submit investment');
        }

        return data;
    } catch (error) {
        throw error;
    }
}

// Get user's investments
async function getMyInvestments() {
    try {
        const response = await fetch(`${API_URL}/investments/my-investments`, {
            headers: {
                'Authorization': `Bearer ${getToken()}`
            }
        });

        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.error || 'Failed to fetch investments');
        }

        return data.investments;
    } catch (error) {
        throw error;
    }
}

// Logout user
async function logout() {
    removeToken();
    removeUserData();
    window.location.href = '/login.html';
}

// Check if user is authenticated
function isAuthenticated() {
    const token = getToken();
    if (!token) return false;

    // Check if token is expired
    try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        return payload.exp > Date.now() / 1000;
    } catch (error) {
        return false;
    }
}

// Get current user
function getCurrentUser() {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
}

// Update user name
async function updateUserName(name) {
    try {
        const response = await fetch(`${API_URL}/auth/update-name`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${getToken()}`
            },
            body: JSON.stringify({ name })
        });

        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.error || 'Failed to update user name');
        }

        const userData = getUserData();
        userData.name = name;
        setUserData(userData);

        return data;
    } catch (error) {
        throw error;
    }
}

// Update user name display
function updateUserNameDisplay() {
    const userData = getUserData();
    const accountLink = document.getElementById('userAccountLink');
    if (userData && userData.name) {
        accountLink.textContent = `${userData.name}'s Account`;
    }
}
