let currentPage = 1;
const usersPerPage = 10;
let totalUsers = 0;
let users = [];

document.addEventListener('DOMContentLoaded', async () => {
    try {
        // Check if user is admin
        const token = localStorage.getItem('token');
        if (!token) {
            window.location.href = '/login.html';
            return;
        }

        const response = await fetch('/api/auth/check-admin', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            const error = await response.json();
            console.error('Admin check failed:', error);
            window.location.href = '/login.html';
            return;
        }

        // Create modal container if it doesn't exist
        if (!document.getElementById('userModal')) {
            const modal = document.createElement('div');
            modal.id = 'userModal';
            modal.className = 'modal';
            modal.innerHTML = `
                <div class="modal-content">
                    <span class="close-modal">&times;</span>
                    <div id="userDetails"></div>
                </div>
            `;
            document.body.appendChild(modal);

            // Close modal when clicking outside
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    closeUserModal();
                }
            });

            // Close modal when clicking the close button
            modal.querySelector('.close-modal').addEventListener('click', closeUserModal);
        }

        await loadUsers();
        setupEventListeners();
    } catch (error) {
        console.error('Error initializing admin page:', error);
        window.location.href = '/login.html';
    }
});

function setupEventListeners() {
    // Search functionality
    const searchInput = document.getElementById('userSearch');
    searchInput.addEventListener('input', debounce(handleSearch, 300));

    // Export button
    document.getElementById('exportUsersBtn').addEventListener('click', exportUsersData);

    // Pagination
    document.getElementById('prevPage').addEventListener('click', () => changePage(-1));
    document.getElementById('nextPage').addEventListener('click', () => changePage(1));

    // Modal close button
    document.querySelector('.close').addEventListener('click', closeUserModal);
}

async function loadUsers(searchQuery = '') {
    try {
        const data = await getUsers(currentPage, usersPerPage, searchQuery);
        users = data.users || [];
        totalUsers = data.total || 0;
        
        displayUsers(users);
        updatePagination();
    } catch (error) {
        console.error('Error loading users:', error);
        showError('Failed to load users. Please try again later.');
    }
}

function displayUsers(users) {
    const tbody = document.getElementById('usersTableBody');
    tbody.innerHTML = '';

    if (!users || users.length === 0) {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td colspan="7" class="text-center">
                <p>No users found</p>
            </td>
        `;
        tbody.appendChild(tr);
        return;
    }

    users.forEach(user => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>
                <div class="user-info">
                    <img src="${user.avatar || 'images/favicon.ico'}" alt="Avatar" class="user-avatar">
                    <span>${user.name}</span>
                </div>
            </td>
            <td>${user.email}</td>
            <td><span class="role-badge ${user.role.toLowerCase()}">${user.role}</span></td>
            <td><span class="status-badge ${user.status.toLowerCase()}">${user.status}</span></td>
            <td>${new Date(user.joinedDate).toLocaleDateString()}</td>
            <td>${user.lastLogin ? new Date(user.lastLogin).toLocaleDateString() : 'Never'}</td>
            <td>
                <div class="action-buttons">
                    <button onclick="viewUser('${user._id}')" class="action-btn view-btn" title="View Details">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button onclick="editUser('${user._id}')" class="action-btn edit-btn" title="Edit User">
                        <i class="fas fa-edit"></i>
                    </button>
                    ${user.status === 'Active' ?
                        `<button onclick="deactivateUser('${user._id}')" class="action-btn deactivate-btn" title="Deactivate User">
                            <i class="fas fa-user-slash"></i>
                        </button>` :
                        `<button onclick="activateUser('${user._id}')" class="action-btn activate-btn" title="Activate User">
                            <i class="fas fa-user-check"></i>
                        </button>`
                    }
                </div>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

function updatePagination() {
    const totalPages = Math.ceil(totalUsers / usersPerPage) || 1;
    document.getElementById('pageInfo').textContent = `Page ${currentPage} of ${totalPages}`;
    document.getElementById('prevPage').disabled = currentPage === 1;
    document.getElementById('nextPage').disabled = currentPage === totalPages || totalUsers === 0;
}

function changePage(delta) {
    currentPage += delta;
    loadUsers(document.getElementById('userSearch').value);
}

function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

function handleSearch(event) {
    currentPage = 1;
    loadUsers(event.target.value);
}

async function exportUsersData() {
    try {
        const blob = await exportUsers();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'users.csv';
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        a.remove();
    } catch (error) {
        console.error('Error exporting users:', error);
        showError('Failed to export users. Please try again later.');
    }
}

async function viewUser(userId) {
    try {
        const user = await getUserById(userId);
        
        // Format the dates with a fallback
        const joinedDate = user.joinedDate ? new Date(user.joinedDate).toLocaleDateString() : 'Not available';
        const lastLoginDate = user.lastLogin ? new Date(user.lastLogin).toLocaleDateString() : 'Never';
        
        const userDetails = document.getElementById('userDetails');
        userDetails.innerHTML = `
            <div class="user-profile">
                <img src="${user.avatar || 'images/favicon.ico'}" alt="Avatar" class="large-avatar">
                <h3>${user.firstName || ''} ${user.lastName || ''}</h3>
                <p class="user-email">${user.email}</p>
                <span class="role-badge ${user.role?.toLowerCase()}">${user.role || 'User'}</span>
            </div>
            <div class="user-info-grid">
                <div class="info-item">
                    <label>Status</label>
                    <span class="status-badge ${user.status?.toLowerCase()}">${user.status || 'Unknown'}</span>
                </div>
                <div class="info-item">
                    <label>Joined Date</label>
                    <span>${joinedDate}</span>
                </div>
                <div class="info-item">
                    <label>Last Login</label>
                    <span>${lastLoginDate}</span>
                </div>
                <div class="info-item">
                    <label>Phone</label>
                    <span>${user.phone || 'Not provided'}</span>
                </div>
            </div>
            <div class="user-stats">
                <h4>Investment Statistics</h4>
                <div class="stats-grid">
                    <div class="stat-item">
                        <label>Total Investments</label>
                        <span>${user.statistics?.totalInvestments || 0}</span>
                    </div>
                    <div class="stat-item">
                        <label>Total Amount Invested</label>
                        <span>$${(user.statistics?.totalAmountInvested || 0).toLocaleString()}</span>
                    </div>
                    <div class="stat-item">
                        <label>Active Investments</label>
                        <span>${user.statistics?.activeInvestments || 0}</span>
                    </div>
                </div>
            </div>
        `;
        
        document.getElementById('userModal').style.display = 'block';
    } catch (error) {
        console.error('Error loading user details:', error);
        showError('Failed to load user details. Please try again later.');
    }
}

function closeUserModal() {
    document.getElementById('userModal').style.display = 'none';
}

function showError(message) {
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message';
    errorDiv.textContent = message;
    
    const container = document.querySelector('.container');
    container.insertBefore(errorDiv, container.firstChild);
    
    setTimeout(() => {
        errorDiv.remove();
    }, 5000);
}

function showSuccess(message) {
    const successDiv = document.createElement('div');
    successDiv.className = 'success-message';
    successDiv.textContent = message;
    
    const container = document.querySelector('.container');
    container.insertBefore(successDiv, container.firstChild);
    
    setTimeout(() => {
        successDiv.remove();
    }, 5000);
}

async function editUser(userId) {
    // Implement edit user functionality
    console.log('Edit user:', userId);
}

async function deactivateUser(userId) {
    if (confirm('Are you sure you want to deactivate this user?')) {
        try {
            await deactivateUserApi(userId);
            loadUsers(document.getElementById('userSearch').value);
            showSuccess('User deactivated successfully');
        } catch (error) {
            console.error('Error deactivating user:', error);
            showError('Failed to deactivate user. Please try again later.');
        }
    }
}

async function activateUser(userId) {
    try {
        await activateUserApi(userId);
        loadUsers(document.getElementById('userSearch').value);
        showSuccess('User activated successfully');
    } catch (error) {
        console.error('Error activating user:', error);
        showError('Failed to activate user. Please try again later.');
    }
}

// New API functions
async function getUsers(page, limit, search) {
    const token = localStorage.getItem('token');
    const response = await fetch('/api/users', {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${token}`
        },
        params: {
            page,
            limit,
            search
        }
    });
    return response.json();
}

async function getUserById(userId) {
    const token = localStorage.getItem('token');
    const response = await fetch(`/api/users/${userId}`, {
        headers: {
            'Authorization': `Bearer ${token}`
        }
    });
    return response.json();
}

async function exportUsers() {
    const token = localStorage.getItem('token');
    const response = await fetch('/api/users/export', {
        headers: {
            'Authorization': `Bearer ${token}`
        }
    });
    return response.blob();
}

async function deactivateUserApi(userId) {
    const token = localStorage.getItem('token');
    const response = await fetch(`/api/users/${userId}/deactivate`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`
        }
    });
    return response.json();
}

async function activateUserApi(userId) {
    const token = localStorage.getItem('token');
    const response = await fetch(`/api/users/${userId}/activate`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`
        }
    });
    return response.json();
}
