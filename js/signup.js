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

document.getElementById('signupForm').addEventListener('submit', function(e) {
    e.preventDefault();
    
    const formData = {
        accredited: document.querySelector('input[name="accredited"]:checked').value,
        firstName: document.getElementById('firstName').value,
        lastName: document.getElementById('lastName').value,
        email: document.getElementById('email').value,
        phone: document.getElementById('phone').value
    };

    // Here you would typically send the data to your backend
    console.log('Form submitted:', formData);
    
    // For now, just show a success message
    alert('Thank you for signing up! We will contact you soon.');
});
