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

    if (signupButton) {
        signupButton.addEventListener('click', async function() {

            const email = document.querySelectorAll('.input-field')[0].value;
            const username = document.querySelectorAll('.input-field')[1].value;
            const password = document.querySelectorAll('.input-field')[2].value;
            const confirmPassword = document.querySelectorAll('.input-field')[3].value;

            // Basic validation
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

            try {
                // Send signup request to Express API
                const response = await fetch("http://localhost:3000/signup", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        email,
                        password,
                        username   // <-- included but not stored yet
                    })
                });

                const data = await response.json();

                if (!response.ok) {
                    alert("Signup Failed: " + data.error);
                    return;
                }

                alert("Signup successful! Welcome, " + username);

                // Redirect after success
                window.location.href = "onboarding.html";

            } catch (error) {
                console.error("Error:", error);
                alert("Network Error: Could not connect to server");
            }
        });
    }
});
