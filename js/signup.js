async function handleSignup(event) {
    event.preventDefault();
    
    const messageBox = document.createElement('div');
    messageBox.className = 'message-box';
    const form = document.getElementById('signupForm');
    
    // Remove any existing message box
    const existingMessage = form.querySelector('.message-box');
    if (existingMessage) {
        existingMessage.remove();
    }
    
    try {
        // Validate form data
        const formData = {
            firstName: document.getElementById('firstName').value.trim(),
            lastName: document.getElementById('lastName').value.trim(),
            email: document.getElementById('email').value.trim(),
            password: document.getElementById('password').value,
            phone: document.getElementById('phone').value.trim(),
            isAccredited: document.querySelector('input[name="accredited"]:checked').value === 'yes'
        };

        // Basic validation
        if (!formData.firstName || !formData.lastName) {
            throw new Error('Please enter your full name');
        }

        if (!formData.email || !formData.email.includes('@')) {
            throw new Error('Please enter a valid email address');
        }

        if (!formData.password || formData.password.length < 8) {
            throw new Error('Password must be at least 8 characters long');
        }

        if (!formData.phone) {
            throw new Error('Please enter your phone number');
        }

        // Show loading state
        const submitButton = form.querySelector('button[type="submit"]');
        const originalButtonText = submitButton.textContent;
        submitButton.textContent = 'Creating Account...';
        submitButton.disabled = true;

        // Attempt registration
        const result = await register(formData);
        
        if (result.success) {
            messageBox.className = 'message-box success';
            messageBox.textContent = 'Account created successfully! Redirecting...';
            form.appendChild(messageBox);

            // Log the user in
            await login(formData.email, formData.password);
            
            // Redirect to investments page
            setTimeout(() => {
                window.location.href = 'investments.html';
            }, 1500);
        }
    } catch (error) {
        console.error('Signup error:', error);
        messageBox.className = 'message-box error';
        messageBox.textContent = error.message || 'Registration failed. Please try again.';
        form.appendChild(messageBox);
        
        // Reset button state
        const submitButton = form.querySelector('button[type="submit"]');
        if (submitButton) {
            submitButton.textContent = 'Create Account';
            submitButton.disabled = false;
        }
    }
}
