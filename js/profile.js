// Profile page functionality
document.addEventListener('DOMContentLoaded', function() {
    // Load user data (in real app, fetch from backend)
    loadUserProfile();
    
    // Setup diary days interaction
    setupDiaryDays();
    
    // Setup pins interaction
    setupPins();
    
    // Upload button
    const uploadBtn = document.getElementById('uploadBtn');
    if (uploadBtn) {
        uploadBtn.addEventListener('click', function() {
            alert('Upload functionality coming soon!');
        });
    }
});

// Load user profile data
function loadUserProfile() {
    // In real app, fetch from backend or localStorage
    const userData = {
        username: 'Daniel The Batman',
        height: '157 cm',
        weight: '50 kg',
        profilePicture: 'batman.jpg'
    };
    
    // Update profile elements
    document.querySelector('.username').textContent = userData.username;
    document.querySelector('.user-stats').textContent = `${userData.height} • ${userData.weight}`;
    
    console.log('Profile loaded:', userData);
}

// Setup diary days
function setupDiaryDays() {
    const diaryDays = document.querySelectorAll('.diary-day');
    
    // Randomly mark some days as filled (for demo)
    diaryDays.forEach((day, index) => {
        day.addEventListener('click', function() {
            this.classList.toggle('filled');
            console.log(`Day ${index + 1} toggled`);
        });
        
        // Random fill for demo
        if (Math.random() > 0.7) {
            day.classList.add('filled');
        }
    });
}

// Setup pins
function setupPins() {
    const pins = document.querySelectorAll('.pin-item');
    
    pins.forEach((pin, index) => {
        pin.addEventListener('click', function() {
            console.log(`Pin ${index + 1} clicked`);
            alert(`Pin ${index + 1} - Saved outfit details would appear here`);
        });
    });
}

// View diary button
const viewDiaryBtn = document.querySelector('.view-diary-btn');
if (viewDiaryBtn) {
    viewDiaryBtn.addEventListener('click', function() {
        console.log('View full diary clicked');
        // In real app, navigate to full diary page
    });
}

// Settings button
const settingsBtn = document.querySelector('.settings-btn');
if (settingsBtn) {
    settingsBtn.addEventListener('click', function() {
        console.log('Settings clicked');
    });
}

// Navigation buttons
const navBtns = document.querySelectorAll('.nav-btn');
navBtns.forEach(btn => {
    btn.addEventListener('click', function(e) {
        // Don't prevent default if it's a link
        if (this.tagName !== 'A') {
            navBtns.forEach(b => b.classList.remove('active'));
            this.classList.add('active');
        }
    });
});

window.handleLogout = function () {
    window.location.href = "login.html";
};