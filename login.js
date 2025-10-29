const urlParams = new URLSearchParams(window.location.search);
const skipLoading = urlParams.get('skip_loading') === 'true';

const loadingScreen = document.getElementById('loadingScreen');
const loginContainer = document.getElementById('loginContainer');

if (skipLoading) {
    if (loadingScreen) {
        loadingScreen.style.display = 'none';
    }
    if (loginContainer) {
        loginContainer.classList.add('show');
    }
} else {
    setTimeout(() => {
        // Start fade out
        if (loadingScreen) {
            loadingScreen.classList.add('fade-out');
        }
        
        // After fade completes, hide loading and show login
        setTimeout(() => {
            if (loadingScreen) {
                loadingScreen.classList.add('hidden');
            }
            if (loginContainer) {
                loginContainer.classList.add('show');
            }
        }, 1000);
    }, 3500);
}

// Login button functionality
document.addEventListener('DOMContentLoaded', function() {
    const loginButton = document.querySelector('.login-button');

    if (loginButton) {
        loginButton.addEventListener('click', function() {
            const email = document.querySelectorAll('.input-field')[0].value;
            const password = document.querySelectorAll('.input-field')[1].value;
            
            if (email && password) {
                alert('Welcome:', email);
                window.location.href = 'dashboard.html';
            } else {
                alert('Validation Error: Please fill in both fields');
            }
        });
    }
});
