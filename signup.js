// Set up script to run after the document is fully loaded
document.addEventListener('DOMContentLoaded', function() {
    const loginLink = document.querySelector('.login-link');
    const signupButton = document.querySelector('.signup-button');

    if (loginLink) {
        loginLink.addEventListener('click', function(event) {
            event.preventDefault();

            const originalHref = this.getAttribute('href');

            const newUrl = originalHref + '?skip_loading=true';

            window.location.href = newUrl;
        });
    }

    // --- Sign up Button Functionality (with Validation) ---
    if (signupButton) {
        signupButton.addEventListener('click', function() {
            // Get all input values
            const email = document.querySelectorAll('.input-field')[0].value;
            const username = document.querySelectorAll('.input-field')[1].value;
            const password = document.querySelectorAll('.input-field')[2].value;
            const confirmPassword = document.querySelectorAll('.input-field')[3].value;

            if (!email || !username || !password || !confirmPassword) {
                alert('Validation Error: Please fill in all fields');
                return;
            }

            if (password !== confirmPassword) {
                alert('Validation Error: Passwords do not match');
                return;
            }

            if (password.length < 6) {
                alert('Validation Error: Password must be at least 6 characters long');
                return;
            }

            alert('Sign up successful! Email:', email, 'Username:', username);
            
            window.location.href = 'onboarding.html';
        });
    }
});
