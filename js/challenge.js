// Challenge page functionality
const themes = [
    'Retro',
    'Minimalist',
    'Hip-Hop',
    'Y2K',
    'Coquette',
    'Floral',
    'Athleisure',
    'Pastels'
];

let canvas, ctx;
let isSpinning = false;
let currentRotation = 0;
let selectedTheme = '';

document.addEventListener('DOMContentLoaded', function() {
    canvas = document.getElementById('wheelCanvas');
    ctx = canvas.getContext('2d');
    
    // Draw initial wheel
    drawWheel();
    
    // Setup spin button
    const spinButton = document.getElementById('spinButton');
    spinButton.addEventListener('click', spinWheel);
    
    // Setup timer countdown
    startTimer();
    
    // Check if already spun today and show appropriate screen
    checkDailyChallenge();
});

// Draw the wheel
function drawWheel() {
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const radius = 180;
    const sliceAngle = (2 * Math.PI) / themes.length;
    
    // Colors for wheel sections
    const colors = ['#FFB6C1', '#FFC0CB', '#FFB6C1', '#FFC0CB', '#FFB6C1', '#FFC0CB', '#FFB6C1', '#FFC0CB'];
    
    ctx.save();
    ctx.translate(centerX, centerY);
    ctx.rotate(currentRotation);
    
    // Draw wheel sections
    for (let i = 0; i < themes.length; i++) {
        const startAngle = i * sliceAngle;
        const endAngle = (i + 1) * sliceAngle;
        
        // Draw slice
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.arc(0, 0, radius, startAngle, endAngle);
        ctx.closePath();
        ctx.fillStyle = colors[i];
        ctx.fill();
        
        // Draw white border
        ctx.strokeStyle = 'white';
        ctx.lineWidth = 3;
        ctx.stroke();
        
        // Draw text
        ctx.save();
        ctx.rotate(startAngle + sliceAngle / 2);
        ctx.textAlign = 'center';
        ctx.fillStyle = 'white';
        ctx.font = 'bold 16px Arial';
        ctx.fillText(themes[i], radius * 0.65, 5);
        ctx.restore();
    }
    
    ctx.restore();
}

// Spin the wheel
function spinWheel() {
    if (isSpinning) return;
    
    isSpinning = true;
    const spinButton = document.getElementById('spinButton');
    spinButton.disabled = true;
    spinButton.textContent = 'SPINNING...';
    
    // Random spins between 5-8 full rotations plus random offset
    const minSpins = 5;
    const maxSpins = 8;
    const spins = Math.random() * (maxSpins - minSpins) + minSpins;
    const extraDegrees = Math.random() * 360;
    const totalRotation = (spins * 360) + extraDegrees;
    
    // Animation duration
    const duration = 4000;
    const startTime = Date.now();
    const startRotation = currentRotation;
    
    function animate() {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        // Easing function for smooth deceleration
        const easeOut = 1 - Math.pow(1 - progress, 3);
        
        currentRotation = startRotation + (totalRotation * Math.PI / 180) * easeOut;
        
        // Clear and redraw
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        drawWheel();
        
        if (progress < 1) {
            requestAnimationFrame(animate);
        } else {
            // Spinning complete
            isSpinning = false;
            determineWinner();
            
            // Save today's challenge
            saveDailyChallenge(selectedTheme);
            
            // Show result screen after a brief delay
            setTimeout(() => {
                showResultScreen();
            }, 500);
        }
    }
    
    animate();
}

// Determine which theme won
function determineWinner() {
    const sliceAngle = (2 * Math.PI) / themes.length;
    const normalizedRotation = currentRotation % (2 * Math.PI);
    const adjustedRotation = (2 * Math.PI - normalizedRotation + Math.PI / 2) % (2 * Math.PI);
    const winningIndex = Math.floor(adjustedRotation / sliceAngle);
    
    selectedTheme = themes[winningIndex];
    console.log('Selected theme:', selectedTheme);
}

// Show result screen
function showResultScreen() {
    document.getElementById('wheelScreen').style.display = 'none';
    document.getElementById('resultScreen').style.display = 'flex';
    document.getElementById('resultThemeMain').textContent = selectedTheme;
}

// Show wheel screen
function showWheelScreen() {
    document.getElementById('wheelScreen').style.display = 'flex';
    document.getElementById('resultScreen').style.display = 'none';
}

// Timer countdown
function startTimer() {
    updateTimer();
    setInterval(updateTimer, 1000);
}

function updateTimer() {
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    
    const diff = tomorrow - now;
    
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);
    
    const timerDisplay = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    
    document.getElementById('timer').textContent = timerDisplay;
    const timerBottom = document.getElementById('timerBottom');
    if (timerBottom) {
        timerBottom.textContent = timerDisplay;
    }
    
    // Check if it's a new day and reset
    if (hours === 23 && minutes === 59 && seconds === 59) {
        setTimeout(() => {
            resetDailyChallenge();
        }, 1000);
    }
}

// Check if already spun today
function checkDailyChallenge() {
    const today = new Date().toDateString();
    const savedDate = localStorage.getItem('challengeDate');
    const savedTheme = localStorage.getItem('challengeTheme');
    
    if (savedDate === today && savedTheme) {
        // Already spun today - show result screen
        selectedTheme = savedTheme;
        showResultScreen();
    } else {
        // Not spun yet - show wheel screen
        showWheelScreen();
    }
}

// Save daily challenge
function saveDailyChallenge(theme) {
    const today = new Date().toDateString();
    localStorage.setItem('challengeDate', today);
    localStorage.setItem('challengeTheme', theme);
}

// Reset daily challenge (called at midnight)
function resetDailyChallenge() {
    localStorage.removeItem('challengeDate');
    localStorage.removeItem('challengeTheme');
    
    // Reset the wheel
    currentRotation = 0;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawWheel();
    
    // Show wheel screen
    showWheelScreen();
    
    // Enable spin button
    const spinButton = document.getElementById('spinButton');
    spinButton.disabled = false;
    spinButton.textContent = 'SPIN';
    
    console.log('Daily challenge reset!');
}

// Upload button
const uploadBtn = document.getElementById('uploadBtn');
if (uploadBtn) {
    uploadBtn.addEventListener('click', function() {
        alert('Upload functionality coming soon!');
    });
}