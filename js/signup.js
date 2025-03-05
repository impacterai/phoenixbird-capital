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

        // Check if user is an accredited investor
        if (!formData.isAccredited) {
            // Show the non-accredited investor modal
            const nonAccreditedPopup = document.getElementById('nonAccreditedPopup');
            if (nonAccreditedPopup) {
                nonAccreditedPopup.classList.add('active');
                
                // Register the user but don't redirect to investments page
                const result = await register(formData);
                
                if (result.success) {
                    // Log the user in but don't redirect
                    await login(formData.email, formData.password);
                }
                
                return; // Stop execution here
            }
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
            messageBox.innerHTML = `
                Account created successfully! 
                ${result.message ? `<br>${result.message}` : ''}
                <br>Redirecting...
            `;
            form.appendChild(messageBox);

            // Log the user in
            const loginResult = await login(formData.email, formData.password);
            
            // Redirect to verification pending page instead of investments
            setTimeout(() => {
                window.location.href = 'verification-pending.html';
            }, 2000);
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

document.addEventListener("DOMContentLoaded", function () {
    // Accredited investor popup
    const accreditedPopup = document.getElementById("accreditedPopup");
    const accreditedInfoLink = document.getElementById("accreditedInfoLink");
    const accreditedCloseBtn = document.querySelector("#accreditedPopup .close-btn");

    if (accreditedInfoLink && accreditedPopup) {
        // Make sure popup is hidden initially
        accreditedPopup.classList.remove("active");
        
        // Open the popup
        accreditedInfoLink.addEventListener("click", function (event) {
            event.preventDefault();
            accreditedPopup.classList.add("active");
        });

        // Close the popup when clicking the close button
        if (accreditedCloseBtn) {
            accreditedCloseBtn.addEventListener("click", function () {
                accreditedPopup.classList.remove("active");
            });
        }

        // Close popup when clicking outside the content area
        window.addEventListener("click", function (event) {
            if (event.target === accreditedPopup) {
                accreditedPopup.classList.remove("active");
            }
        });
    }
    
    // Non-accredited investor popup
    const nonAccreditedPopup = document.getElementById("nonAccreditedPopup");
    const nonAccreditedCloseBtn = document.getElementById("nonAccreditedCloseBtn");
    const nonAccreditedOkBtn = document.getElementById("nonAccreditedOkBtn");
    
    if (nonAccreditedPopup) {
        // Make sure popup is hidden initially
        nonAccreditedPopup.classList.remove("active");
        
        // Close the popup when clicking the close button or OK button
        if (nonAccreditedCloseBtn) {
            nonAccreditedCloseBtn.addEventListener("click", function () {
                nonAccreditedPopup.classList.remove("active");
                // Redirect to home page
                window.location.href = 'index.html';
            });
        }
        
        if (nonAccreditedOkBtn) {
            nonAccreditedOkBtn.addEventListener("click", function () {
                nonAccreditedPopup.classList.remove("active");
                // Redirect to home page
                window.location.href = 'index.html';
            });
        }
        
        // Close popup when clicking outside the content area
        window.addEventListener("click", function (event) {
            if (event.target === nonAccreditedPopup) {
                nonAccreditedPopup.classList.remove("active");
                // Redirect to home page
                window.location.href = 'index.html';
            }
        });
    }
});
