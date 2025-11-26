const themes = [
    "Minimalist",
    "Vintage",
    "Streetwear",
    "Boho",
    "Indie",
    "Sporty",
    "Floral",
    "Casual"
];

const wheelCanvas = document.getElementById("wheelCanvas");
const spinButton = document.getElementById("spinButton");
const resultPreview = document.getElementById("resultPreview");
const resultTheme = document.getElementById("resultTheme");
const resultScreen = document.getElementById("resultScreen");
const resultThemeMain = document.getElementById("resultThemeMain");
const wheelScreen = document.getElementById("wheelScreen");
const timerTop = document.getElementById("timer");
const timerBottom = document.getElementById("timerBottom");

const ctx = wheelCanvas.getContext("2d");

let spinning = false;
let wheelAngle = 0;



const uid = localStorage.getItem("uid"); // per-user lock
  if (!uid) {
    console.warn('No uid in localStorage — redirecting to login.');
    window.location.href = 'login.html';
  } else {
    loadUserProfile(uid);
  }
function drawWheel() {
    const numSlices = themes.length;
    const sliceAngle = (2 * Math.PI) / numSlices;

    for (let i = 0; i < numSlices; i++) {
        ctx.beginPath();
        ctx.moveTo(200, 200);
        ctx.arc(200, 200, 200, sliceAngle * i, sliceAngle * (i + 1));
        ctx.closePath();

        ctx.fillStyle = i % 2 === 0 ? "#F8BBD0" : "#F48FB1";
        ctx.fill();

        ctx.save();
        ctx.translate(200, 200);
        ctx.rotate(sliceAngle * (i + 0.5));
        ctx.textAlign = "right";
        ctx.fillStyle = "#fff";
        ctx.font = "bold 16px Arial";
        ctx.fillText(themes[i], 180, 5);
        ctx.restore();
    }
}

drawWheel();

function getThemeFromAngle(angle) {
    const normalized = (angle % 360 + 360) % 360;
    const sliceSize = 360 / themes.length;
    const index = Math.floor((normalized) / sliceSize);
    return themes[themes.length - 1 - index];
}

function saveSpinResult(theme) {
    const data = {
        theme,
        timestamp: Date.now()
    };
    localStorage.setItem(`challenge_${uid}`, JSON.stringify(data));
}

function loadSpinResult() {
    const saved = localStorage.getItem(`challenge_${uid}`);
    if (!saved) return null;

    const data = JSON.parse(saved);
    const now = Date.now();

    // Reset at midnight
    const savedDay = new Date(data.timestamp).toDateString();
    const todayDay = new Date().toDateString();

    if (savedDay !== todayDay) {
        localStorage.removeItem(`challenge_${uid}`);
        return null;
    }

    return data;
}

function showResult(theme) {
    wheelScreen.style.display = "none";
    resultScreen.style.display = "flex";
    resultThemeMain.textContent = theme;
}

function startTimer(savedTimestamp) {
    function updateTimer() {
        const now = new Date();
        const midnight = new Date();
        midnight.setHours(24, 0, 0, 0);

        const diff = midnight - now;

        let hours = Math.floor(diff / 1000 / 3600);
        let minutes = Math.floor((diff / 1000 % 3600) / 60);
        let seconds = Math.floor(diff / 1000 % 60);

        const formatted = `${String(hours).padStart(2,"0")}:${String(minutes).padStart(2,"0")}:${String(seconds).padStart(2,"0")}`;

        timerTop.textContent = formatted;
        timerBottom.textContent = formatted;
    }

    updateTimer();
    setInterval(updateTimer, 1000);
}

spinButton.addEventListener("click", () => {
    if (spinning) return;

    spinning = true;
    spinButton.disabled = true;

    let spinTime = 3000;
    const targetAngle = Math.floor(Math.random() * 360) + 360 * 5;

    const start = performance.now();

    function animate(now) {
        const progress = (now - start) / spinTime;

        if (progress < 1) {
            wheelAngle = targetAngle * easeOut(progress);
            drawWheelRotation();
            requestAnimationFrame(animate);
        } else {
            spinning = false;
            finalizeSpin();
        }
    }

    requestAnimationFrame(animate);
});

function drawWheelRotation() {
    ctx.save();
    ctx.clearRect(0, 0, 400, 400);
    ctx.translate(200, 200);
    ctx.rotate(wheelAngle * Math.PI / 180);
    ctx.translate(-200, -200);
    drawWheel();
    ctx.restore();
}

function finalizeSpin() {
    const theme = getThemeFromAngle(wheelAngle);

    resultPreview.style.display = "block";
    resultTheme.textContent = theme;

    // Save result
    saveSpinResult(theme);

    // Switch screens after short delay
    setTimeout(() => {
        showResult(theme);
    }, 1500);

    startTimer();
}

function easeOut(t) {
    return 1 - Math.pow(1 - t, 3);
}

const saved = loadSpinResult();
if (saved) {
    showResult(saved.theme);
    startTimer(saved.timestamp);
}
