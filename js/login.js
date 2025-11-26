const urlParams = new URLSearchParams(window.location.search);
const skipLoading = urlParams.get('skip_loading') === 'true';

const loadingScreen = document.getElementById('loadingScreen');
const loginContainer = document.getElementById('loginContainer');

if (skipLoading) {
    if (loadingScreen) loadingScreen.style.display = 'none';
    if (loginContainer) loginContainer.classList.add('show');
} else {
    setTimeout(() => {
        if (loadingScreen) loadingScreen.classList.add('fade-out');

        setTimeout(() => {
            if (loadingScreen) loadingScreen.classList.add('hidden');
            if (loginContainer) loginContainer.classList.add('show');
        }, 1000);
    }, 3500);
}

document.addEventListener("DOMContentLoaded", function () {
    const loginButton = document.querySelector(".login-button");

    if (loginButton) {
        loginButton.addEventListener("click", async function () {
            const email = document.querySelectorAll(".input-field")[0].value;
            const password = document.querySelectorAll(".input-field")[1].value;

            if (!email || !password) {
                alert("Validation Error: Please fill in both fields");
                return;
            }

            try {
                const response = await fetch("http://localhost:3000/login", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({ email, password })
                });

                const data = await response.json();

                if (!response.ok || !data.success) {
                    alert("Login Failed: " + data.error);
                    return;
                }

                // Save token + UID for profile/dashboard
                localStorage.setItem("authToken", data.token);
                localStorage.setItem("uid", data.uid);

                alert("Welcome, " + email);
                window.location.href = "dashboard.html";

            } catch (error) {
                console.error("Error:", error);
                alert("Wrong Credentials!");
            }
        });
    }
});
