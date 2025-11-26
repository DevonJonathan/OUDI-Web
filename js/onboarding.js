let currentScreen = 1;
const totalScreens = 4;

document.addEventListener("DOMContentLoaded", function () {
    setupHeightSlider();
    setupWeightSlider();
});

const currentUserId = localStorage.getItem("uid");

if (!currentUserId) {
    alert("User not logged in!");
    window.location.href = "login.html";
}

function nextScreen() {
    if (currentScreen < totalScreens) {
        document.getElementById(`screen${currentScreen}`).classList.remove("active");
        currentScreen++;
        document.getElementById(`screen${currentScreen}`).classList.add("active");
    }
}

function prevScreen() {
    if (currentScreen > 1) {
        document.getElementById(`screen${currentScreen}`).classList.remove("active");
        currentScreen--;
        document.getElementById(`screen${currentScreen}`).classList.add("active");
    }
}

function setupHeightSlider() {
    const slider = document.getElementById("heightSlider");
    const indicator = document.getElementById("heightIndicator");
    const valueDisplay = document.getElementById("heightValue");

    slider.addEventListener("input", function () {
        const value = this.value;
        valueDisplay.textContent = `${value} cm`;

        const percentage = ((value - this.min) / (this.max - this.min)) * 100;
        indicator.style.top = `${100 - percentage}%`;
    });

    slider.dispatchEvent(new Event("input"));
}

function setupWeightSlider() {
    const slider = document.getElementById("weightSlider");
    const indicator = document.getElementById("weightIndicator");
    const valueDisplay = document.getElementById("weightValue");

    slider.addEventListener("input", function () {
        const value = this.value;
        valueDisplay.textContent = `${value} kg`;

        const percentage = ((value - this.min) / (this.max - this.min)) * 100;
        indicator.style.top = `${100 - percentage}%`;
    });

    slider.dispatchEvent(new Event("input"));
}

async function completeOnboarding() {

    const selectedStyles = [];
    const checkboxes = document.querySelectorAll('input[name="style"]:checked');

    checkboxes.forEach(checkbox => {
        if (checkbox.value === "Other") {
            const otherInput = document.querySelector(".other-input").value;
            if (otherInput) selectedStyles.push(otherInput);
        } else {
            selectedStyles.push(checkbox.value);
        }
    });

    const height = document.getElementById("heightSlider").value;
    const weight = document.getElementById("weightSlider").value;

    const payload = {
        userId: currentUserId,
        styles: selectedStyles,
        heightCm: Number(height),
        weightKg: Number(weight),
        preferencesCompleted: true
    };

    try {
        const resp = await fetch("http://localhost:3000/onboarding", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        });

        const data = await resp.json();

        if (!data.success) {
            alert("Error saving preferences: " + data.error);
            return;
        }

        localStorage.setItem("preferencesCompleted", "true");

        window.location.href = "dashboard.html";

    } catch (error) {
        console.error("Network Error:", error);
        alert("Network error while saving preferences.");
    }
}

document.addEventListener("keydown", function (e) {
    if (e.key === "ArrowRight") nextScreen();
    if (e.key === "ArrowLeft") prevScreen();
});
