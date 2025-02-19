async function handleSignup(event) {
    event.preventDefault();
    
    const formData = {
        firstName: document.getElementById('firstName').value,
        lastName: document.getElementById('lastName').value,
        email: document.getElementById('email').value,
        password: document.getElementById('password').value,
        phone: document.getElementById('phone').value,
        isAccredited: document.querySelector('input[name="accredited"]:checked').value === 'yes'
    };

    try {
        const result = await register(formData);
        if (result.success) {
            // After successful registration, log the user in
            const loginResult = await login(formData.email, formData.password);
            if (loginResult.success) {
                window.location.href = 'investments.html';
            }
        }
    } catch (error) {
        alert('Registration failed. ' + (error.message || 'Please try again.'));
        console.error('Signup error:', error);
    }
}
