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

// Download document
async function downloadDocument(filename) {
    const token = getToken();
    if (!token) {
        throw new Error('Authentication required');
    }

    try {
        const response = await fetch(`${API_URL}/documents/download/${filename}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            throw new Error('Failed to download document');
        }

        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
    } catch (error) {
        console.error('Download error:', error);
        throw error;
    }
}

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
        const response = await fetch(`${API_URL}/investments/public`, {
            headers: {
                'Authorization': `Bearer ${getToken()}`
            }
        });

        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.error || 'Failed to fetch investments');
        }

        return data; // Return the data directly since server returns array
    } catch (error) {
        console.error('Error in getInvestments:', error);
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
function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/index.html';
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

function updateUserName() {
    const userAccountLink = document.getElementById('userAccountLink');
    if (userAccountLink) {
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        if (user.firstName) {
            userAccountLink.textContent = `${user.firstName}`;
        }
    }
}

// Get investment by ID (admin)
async function getInvestmentById(id) {
    try {
        const response = await fetch(`${API_URL}/investments/${id}/details`, {
            headers: {
                'Authorization': `Bearer ${getToken()}`
            }
        });

        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.error || 'Failed to fetch investment');
        }

        // The API returns { investment, userInvestments }
        // We only need the investment data for editing
        return data.investment;
    } catch (error) {
        console.error('Error in getInvestmentById:', error);
        throw error;
    }
}

// Get all investments (admin)
async function getAllInvestments() {
    try {
        const token = getToken();
        const response = await fetch(`${API_URL}/investments`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        // First try to parse as JSON
        let data;
        const responseText = await response.text();
        try {
            data = JSON.parse(responseText);
        } catch (e) {
            console.error('Failed to parse JSON:', responseText.substring(0, 150));
            throw new Error(`Failed to parse response as JSON: ${e.message}`);
        }
        
        if (!response.ok) {
            throw new Error(data.error || `Failed to fetch investments: ${response.status}`);
        }

        return data;
    } catch (error) {
        console.error('Error in getAllInvestments:', error);
        throw error;
    }
}

// User Management API Functions
async function getUsers(page = 1, limit = 10, search = '') {
    const token = getToken();
    if (!token) {
        throw new Error('Authentication required');
    }

    return await apiCall(`/users?page=${page}&limit=${limit}&search=${search}`, 'GET', null, token);
}

async function getUserById(userId) {
    const token = getToken();
    if (!token) {
        throw new Error('Authentication required');
    }

    return await apiCall(`/users/${userId}`, 'GET', null, token);
}

async function activateUser(userId) {
    const token = getToken();
    if (!token) {
        throw new Error('Authentication required');
    }

    return await apiCall(`/users/${userId}/activate`, 'POST', null, token);
}

async function deactivateUser(userId) {
    const token = getToken();
    if (!token) {
        throw new Error('Authentication required');
    }

    return await apiCall(`/users/${userId}/deactivate`, 'POST', null, token);
}

async function exportUsers() {
    const token = getToken();
    if (!token) {
        throw new Error('Authentication required');
    }

    const response = await fetch(`${API_URL}/users/export`, {
        headers: {
            'Authorization': `Bearer ${token}`
        }
    });

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Export failed');
    }

    return await response.blob();
}
