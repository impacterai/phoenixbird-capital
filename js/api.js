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
        // Check if we're in a local development environment
        if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
            // Force download the local file
            const url = `documents/${filename}`;
            const link = document.createElement('a');
            link.href = url;
            link.download = filename; // Force download instead of opening in new tab
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            return;
        }

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
            
            // Store email verification status
            if (data.emailVerificationStatus) {
                localStorage.setItem('emailVerificationStatus', data.emailVerificationStatus);
            }
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
        const token = getToken();
        if (!token) {
            throw new Error('Authentication required');
        }
        
        const response = await fetch(`${API_URL}/investments/public`, {
            headers: {
                'Authorization': `Bearer ${token}`
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

// Submit investment and send confirmation email
async function submitInvestment(investmentId, amount, paymentMethod = 'bank_transfer') {
    try {
        const response = await fetch(`${API_URL}/investments/invest`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${getToken()}`
            },
            body: JSON.stringify({ investmentId, amount, paymentMethod })
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

// Send investment confirmation email
async function sendInvestmentConfirmationEmail(investmentDetails) {
    try {
        const user = getUserData();
        if (!user || !user.email) {
            console.error('User email not found');
            return { success: false, error: 'User email not found' };
        }
        
        // Make an API call to send the email
        const response = await fetch(`${API_URL}/email/send-confirmation`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${getToken()}`
            },
            body: JSON.stringify({
                email: user.email,
                investmentDetails: investmentDetails
            })
        });

        const data = await response.json();
        
        if (!response.ok) {
            console.error('Failed to send confirmation email:', data.error);
            return { success: false, error: data.error };
        }

        return { success: true, data };
    } catch (error) {
        console.error('Error sending confirmation email:', error);
        return { success: false, error: error.message };
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
    // No longer needed since IRA link is always displayed as "IRA"
    return;
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

// Get investment by ID (public)
async function getPublicInvestmentById(id) {
    try {
        // First try to find the investment in the list of all public investments
        const allInvestments = await getInvestments();
        const investment = allInvestments.find(inv => inv._id === id);
        
        if (investment) {
            return investment;
        }
        
        // If not found, throw an error
        throw new Error('Investment not found');
    } catch (error) {
        console.error('Error in getPublicInvestmentById:', error);
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

// We're not using modules, so no need for export statements
/* export {
    apiCall,
    setToken,
    getToken,
    removeToken,
    downloadDocument,
    setUserData,
    getUserData,
    removeUserData,
    register,
    login,
    resetPassword,
    getInvestments,
    submitInvestment,
    sendInvestmentConfirmationEmail,
    getMyInvestments,
    logout,
    isAuthenticated,
    getCurrentUser,
    updateUserName,
    updateUserNameDisplay,
    getInvestmentById,
    getPublicInvestmentById,
    getAllInvestments,
    getUsers,
    getUserById,
    activateUser,
    deactivateUser,
    exportUsers
}; */
