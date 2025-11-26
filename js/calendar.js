const postsData = {
    '2025-03-05': [
        { text: 'Had an amazing coffee date with friends today!', time: '14:30', image: 'https://via.placeholder.com/300x200' }
    ],
    '2025-03-12': [
        { text: 'Finished my project! Feeling accomplished 💪', time: '18:00' }
    ],
    '2025-03-18': [
        { text: 'Beautiful sunset at the beach', time: '19:45', image: 'https://via.placeholder.com/300x200' },
        { text: 'Dinner was delicious!', time: '21:00' }
    ],
    '2025-03-25': [
        { text: 'Started reading a new book today', time: '10:00' }
    ],
    '2025-04-03': [
        { text: 'Spring flowers are blooming everywhere 🌸', time: '09:30', image: 'https://via.placeholder.com/300x200' }
    ],
    '2025-04-10': [
        { text: 'Movie night with besties!', time: '20:00' }
    ],
    '2025-04-22': [
        { text: 'Tried a new recipe and it turned out great!', time: '13:00' }
    ]
};

function getDaysInMonth(year, month) {
    return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year, month) {
    return new Date(year, month, 1).getDay();
}

function formatDate(year, month, day) {
    const m = String(month + 1).padStart(2, '0');
    const d = String(day).padStart(2, '0');
    return `${year}-${m}-${d}`;
}

function hasPost(dateString) {
    return postsData[dateString] && postsData[dateString].length > 0;
}

function createMonthCalendar(year, month, monthName) {
    const daysInMonth = getDaysInMonth(year, month);
    const firstDay = getFirstDayOfMonth(year, month);
    
    const monthSection = document.createElement('div');
    monthSection.className = 'month-section';
    
    const monthTitle = document.createElement('div');
    monthTitle.className = 'month-title';
    monthTitle.textContent = monthName;
    
    const weekdays = document.createElement('div');
    weekdays.className = 'weekdays';
    const dayNames = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];
    dayNames.forEach(day => {
        const weekday = document.createElement('div');
        weekday.className = 'weekday';
        weekday.textContent = day;
        weekdays.appendChild(weekday);
    });
    
    const daysGrid = document.createElement('div');
    daysGrid.className = 'days-grid';
    
    for (let i = 0; i < firstDay; i++) {
        const emptyCell = document.createElement('div');
        emptyCell.className = 'day-cell empty';
        daysGrid.appendChild(emptyCell);
    }
    
    for (let day = 1; day <= daysInMonth; day++) {
        const dayCell = document.createElement('div');
        dayCell.className = 'day-cell';
        dayCell.textContent = day;
        
        const dateString = formatDate(year, month, day);
        
        if (hasPost(dateString)) {
            dayCell.classList.add('has-post');
            dayCell.addEventListener('click', () => openPostModal(dateString));
        }
        
        daysGrid.appendChild(dayCell);
    }
    
    monthSection.appendChild(monthTitle);
    monthSection.appendChild(weekdays);
    monthSection.appendChild(daysGrid);
    
    return monthSection;
}

function openPostModal(dateString) {
    const modal = document.getElementById('postModal');
    const modalDate = document.getElementById('modalDate');
    const modalBody = document.getElementById('modalBody');
    
    const date = new Date(dateString);
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    modalDate.textContent = date.toLocaleDateString('en-US', options);
    
    const posts = postsData[dateString] || [];
    
    modalBody.innerHTML = posts.map(post => `
        <div class="post-item">
            ${post.image ? `<img src="${post.image}" alt="Post image" class="post-image">` : ''}
            <div class="post-text">${post.text}</div>
            <div class="post-time">${post.time}</div>
        </div>
    `).join('');
    
    modal.classList.add('active');
}

function closePostModal() {
    const modal = document.getElementById('postModal');
    modal.classList.remove('active');
}

function initCalendar() {
    const calendarContainer = document.getElementById('calendarContainer');
    
    const march = createMonthCalendar(2025, 2, 'MARCH 2025');
    const april = createMonthCalendar(2025, 3, 'APRIL 2025');
    
    calendarContainer.appendChild(march);
    calendarContainer.appendChild(april);
}

document.getElementById('backBtn').addEventListener('click', () => {
    window.location.href = 'profile.html';
});

document.getElementById('closeModal').addEventListener('click', closePostModal);

document.getElementById('postModal').addEventListener('click', (e) => {
    if (e.target.id === 'postModal') {
        closePostModal();
    }
});

initCalendar();