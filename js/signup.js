function nextStep() {
    const accreditedStatus = document.querySelector('input[name="accredited"]:checked');
    
    if (!accreditedStatus) {
        alert('Please select your investor status');
        return;
    }

    // Hide step 1 and show step 2
    document.getElementById('step1').classList.add('hidden');
    document.getElementById('step2').classList.remove('hidden');
}

async function handleSignup(e) {
    e.preventDefault();
    console.log('Handling signup submission...');
    
    const formData = {
        accredited: document.querySelector('input[name="accredited"]:checked').value,
        firstName: document.getElementById('firstName').value,
        lastName: document.getElementById('lastName').value,
        email: document.getElementById('email').value,
        phone: document.getElementById('phone').value,
        password: document.getElementById('password').value
    };

    console.log('Form data collected:', { ...formData, password: '***' });

    try {
        // Get existing users or initialize empty array
        const existingUsers = JSON.parse(localStorage.getItem('registeredUsers') || '[]');
        console.log('Current registered users:', existingUsers.length);
        
        // Check if email already exists
        if (existingUsers.some(user => user.email === formData.email)) {
            throw new Error('An account with this email already exists');
        }

        // Create new user object
        const newUser = {
            id: Date.now(),
            email: formData.email,
            password: formData.password,
            firstName: formData.firstName,
            lastName: formData.lastName,
            phone: formData.phone,
            accreditedStatus: formData.accredited,
            isAuthenticated: true
        };

        // Add to registered users
        existingUsers.push(newUser);
        localStorage.setItem('registeredUsers', JSON.stringify(existingUsers));
        console.log('User registered successfully');

        // Set current user session
        const safeUser = { ...newUser };
        delete safeUser.password; // Don't store password in session
        localStorage.setItem('user', JSON.stringify(safeUser));
        console.log('User session created');
        
        // Redirect to investments page
        console.log('Redirecting to investments page...');
        window.location.href = 'investments.html';
    } catch (error) {
        console.error('Signup error:', error);
        alert(error.message || 'An error occurred during signup. Please try again.');
    }
}
