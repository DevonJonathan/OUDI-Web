let currentScreen = 1;
const totalScreens = 4;

document.addEventListener('DOMContentLoaded', function() {
    setupHeightSlider();
    setupWeightSlider();
});

function nextScreen() {
    if (currentScreen < totalScreens) {
        document.getElementById(`screen${currentScreen}`).classList.remove('active');
        currentScreen++;
        document.getElementById(`screen${currentScreen}`).classList.add('active');
    }
}

function prevScreen() {
    if (currentScreen > 1) {
        document.getElementById(`screen${currentScreen}`).classList.remove('active');
        currentScreen--;
        document.getElementById(`screen${currentScreen}`).classList.add('active');
    }
}

function setupHeightSlider() {
    const slider = document.getElementById('heightSlider');
    const indicator = document.getElementById('heightIndicator');
    const valueDisplay = document.getElementById('heightValue');
    
    slider.addEventListener('input', function() {
        const value = this.value;
        valueDisplay.textContent = `${value} cm`;
        
        const min = parseInt(this.min);
        const max = parseInt(this.max);
        const percentage = ((value - min) / (max - min)) * 100;
        
        const topPosition = 100 - percentage;
        indicator.style.top = `${topPosition}%`;
    });
    
    slider.dispatchEvent(new Event('input'));
}

function setupWeightSlider() {
    const slider = document.getElementById('weightSlider');
    const indicator = document.getElementById('weightIndicator');
    const valueDisplay = document.getElementById('weightValue');
    
    slider.addEventListener('input', function() {
        const value = this.value;
        valueDisplay.textContent = `${value} kg`;
        
        const min = parseInt(this.min);
        const max = parseInt(this.max);
        const percentage = ((value - min) / (max - min)) * 100;
        
        const topPosition = 100 - percentage;
        indicator.style.top = `${topPosition}%`;
    });
    
    slider.dispatchEvent(new Event('input'));
}

function completeOnboarding() {
    const selectedStyles = [];
    const checkboxes = document.querySelectorAll('input[name="style"]:checked');
    checkboxes.forEach(checkbox => {
        if (checkbox.value === 'Other') {
            const otherInput = document.querySelector('.other-input').value;
            if (otherInput) {
                selectedStyles.push(otherInput);
            }
        } else {
            selectedStyles.push(checkbox.value);
        }
    });
    
    const height = document.getElementById('heightSlider').value;
    const weight = document.getElementById('weightSlider').value;
    
    const userPreferences = {
        styles: selectedStyles,
        height: height,
        weight: weight
    };
    
    console.log('User Preferences:', userPreferences);
    
    window.location.href = 'dashboard.html';
}

document.addEventListener('keydown', function(e) {
    if (e.key === 'ArrowRight') {
        nextScreen();
    } else if (e.key === 'ArrowLeft') {
        prevScreen();
    }
});