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
    
    const formData = {
        accredited: document.querySelector('input[name="accredited"]:checked').value,
        firstName: document.getElementById('firstName').value,
        lastName: document.getElementById('lastName').value,
        email: document.getElementById('email').value,
        phone: document.getElementById('phone').value
    };

    try {
        // Here you would typically send the data to your backend
        console.log('Form submitted:', formData);
        
        // Store user data in localStorage (temporary solution)
        localStorage.setItem('user', JSON.stringify({
            ...formData,
            isAuthenticated: true
        }));
        
        // Redirect to investments page
        window.location.href = 'investments.html';
    } catch (error) {
        console.error('Signup error:', error);
        alert('An error occurred during signup. Please try again.');
    }
}
