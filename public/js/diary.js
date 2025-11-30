const API_BASE = "https://oudi-web-devons-projects-8b9164ea.vercel.app";

function getToken() {
    return localStorage.getItem('token') || localStorage.getItem('authToken') || null;
}
function authHeaders() {
    const headers = { 'Content-Type': 'application/json' };
    const token = getToken();
    if (token) headers['Authorization'] = `Bearer ${token}`;
    return headers;
}

// ⭐️ GLOBAL VARIABLES for calendar navigation and post data ⭐️
let postsCache = {}; 
let currentStartMonth = new Date().getMonth(); 
let currentYear = new Date().getFullYear();
let selectedDate = null;
let currentUid = localStorage.getItem('uid'); 

// ⭐️ GLOBAL VARIABLES for Pinning Logic (Must be consistent with profile.js) ⭐️
const LOCAL_PIN_KEY = 'userPinnedPostIds_' + currentUid; 

const monthNames = [
    'JANUARY', 'FEBRUARY', 'MARCH', 'APRIL', 'MAY', 'JUNE',
    'JULY', 'AUGUST', 'SEPTEMBER', 'OCTOBER', 'NOVEMBER', 'DECEMBER'
];

function getLocalPinnedIds() {
    try {
        const ids = localStorage.getItem(LOCAL_PIN_KEY);
        return ids ? new Set(JSON.parse(ids)) : new Set();
    } catch (e) {
        return new Set();
    }
}

function setLocalPinnedIds(pinnedIdsSet) {
    try {
        localStorage.setItem(LOCAL_PIN_KEY, JSON.stringify(Array.from(pinnedIdsSet)));
    } catch (e) {
        console.error("Error writing pinned IDs to localStorage:", e);
    }
}

function togglePinStatus(postId) {
    const pinnedIds = getLocalPinnedIds();
    const isPinned = pinnedIds.has(postId);
    if (isPinned) {
        pinnedIds.delete(postId);
    } else {
        pinnedIds.add(postId);
    }
    setLocalPinnedIds(pinnedIds);
    return !isPinned;
}

function handlePinToggle(event) {
    const postId = event.currentTarget.dataset.postId;
    const isNowPinned = togglePinStatus(postId); 

    alert(`Post is now ${isNowPinned ? 'PINNED' : 'UNPINNED'}. You will see it on your Profile Pins section.`);
    
    // Refresh the post display to update the button text/style
    const dateString = event.currentTarget.dataset.date;
    displayPosts(dateString);
    
    console.log(`Post ${postId} is now ${isNowPinned ? 'pinned' : 'unpinned'}`);
}

function ensureFullUrl(url) {
    if (!url || typeof url !== 'string') return '';
    // Check if the URL already starts with http:// or https://
    if (url.startsWith('http://') || url.startsWith('https://')) {
        return url;
    }
    // Prepend https:// as a default for external links
    return 'https://' + url; 
}

function getDaysInMonth(year, month) {
    return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year, month) {
    // getDay() returns 0 for Sunday, 1 for Monday... We adjust to 0 for Monday.
    const day = new Date(year, month, 1).getDay();
    return day === 0 ? 6 : day - 1; 
}

function formatDate(year, month, day) {
    const y = year;
    const m = String(month + 1).padStart(2, '0');
    const d = String(day).padStart(2, '0');
    return `${y}-${m}-${d}`;
}

/** Fetches posts for a given date range from the server. */
async function fetchPostsForMonths(year1, month1, year2, month2) {
    if (!currentUid) return {};

    const startDate = `${year1}-${String(month1 + 1).padStart(2, '0')}-01`;
    const endDateObj = new Date(year2, month2 + 1, 0); 
    const endDate = formatDate(year2, month2, endDateObj.getDate()); 

    try {
        const resp = await fetch(`${API_BASE}/posts/user/${currentUid}?startDate=${startDate}&endDate=${endDate}`, {
            method: 'GET',
            headers: authHeaders()
        });

        const body = await resp.json();
        if (!resp.ok) throw new Error(body.error || 'Failed to fetch diary posts.');

        const postsArray = body.posts || [];
        const postsByDate = {};

        postsArray.forEach(post => {
            const date = new Date(post.date || post.timestamp);
            const dateString = formatDate(date.getFullYear(), date.getMonth(), date.getDate());
            
            if (!postsByDate[dateString]) {
                postsByDate[dateString] = [];
            }
            postsByDate[dateString].push(post);
        });

        postsCache = { ...postsCache, ...postsByDate };
        
        return postsByDate;

    } catch (err) {
        console.error('Error fetching posts:', err);
        return {};
    }
}

function getPostsForDate(dateString) {
     return postsCache[dateString] || [];
}

function displayPosts(dateString) {
    const postsDate = document.getElementById('postsDate');
    const postsContent = document.getElementById('postsContent');
    const pinnedIds = getLocalPinnedIds(); // Get current pinned IDs

    const date = new Date(dateString + 'T12:00:00'); 
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    postsDate.textContent = date.toLocaleDateString('en-US', options);
    
    const posts = getPostsForDate(dateString);
    
    if (posts.length > 0) {
        postsContent.innerHTML = posts.map(post => {
            const isPinned = pinnedIds.has(post.id);
            const pinText = isPinned ? 'UNPINNED' : 'PIN POST';
            const pinClass = isPinned ? 'pinned' : 'unpinned';
            const postTime = new Date(post.date || post.timestamp).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

                return `
                    <div class="post-item">
                    <div class="post-header">
                        <h3 class="post-theme">${post.theme || 'Untitled Post'}</h3>
                            <span class="post-rating">${post.rating || 'N/A'} ⭐️</span>
                        </div>
                            ${post.imageUrl ? `<img src="${post.imageUrl}" alt="Post image" class="post-image">` : ''}
                            <p class="post-text">${post.caption || 'No description provided.'}</p>
                            <div class="post-footer">
                         ${
                            (Array.isArray(post.shoppingLink) && post.shoppingLink.length > 0)
                                ? post.shoppingLink.filter(Boolean).map((link, index) => 
                                    // Use the helper function and display an index for multiple links
                                    `<a href="${ensureFullUrl(link)}" target="_blank" class="post-link">View Link ${index + 1}</a>`
                                  ).join('')
                                : `<span class="post-link no-link-label">No Shop Links</span>`
                        }
                         <span class="post-likes">${post.likes || 0} ❤️</span>
                        <span class="post-time">${postTime}</span>
                    </div>
                    
                    <button class="pin-action-btn ${pinClass}" data-post-id="${post.id}" data-date="${dateString}">
                        ${pinText}
                    </button>
                </div>
            `;
        }).join('');

        // ⭐️ Attach event listeners to the new pin buttons
        postsContent.querySelectorAll('.pin-action-btn').forEach(btn => {
            btn.addEventListener('click', handlePinToggle);
        });

    } else {
        postsContent.innerHTML = '<p class="no-posts">No activity on this date</p>';
    }
}

function createMonthCalendar(year, month, allPostsByDate) {
    const daysInMonth = getDaysInMonth(year, month);
    const firstDay = getFirstDayOfMonth(year, month);
 
    const monthSection = document.createElement('div');
    monthSection.className = 'month-section';
    
    const monthTitle = document.createElement('div');
    monthTitle.className = 'month-title';
    monthTitle.textContent = `${monthNames[month]} ${year}`;

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

        // Add 'has-post' class for the pink circle indicator
        if (allPostsByDate[dateString] && allPostsByDate[dateString].length > 0) {
            dayCell.classList.add('has-post'); 
        }

         if (selectedDate === dateString) {
            dayCell.classList.add('selected');
        }

        dayCell.addEventListener('click', () => {
            // Deselect previous cell
            document.querySelectorAll('.day-cell.selected').forEach(cell => {
                cell.classList.remove('selected');
            });
            dayCell.classList.add('selected');
            selectedDate = dateString;
            displayPosts(dateString);
        });

        daysGrid.appendChild(dayCell);
    }

    monthSection.appendChild(monthTitle);
    monthSection.appendChild(weekdays);
    monthSection.appendChild(daysGrid);

    return monthSection;
}

/** Async to fetch posts before rendering the calendar. */
async function renderCalendar() {
    const calendarContainer = document.getElementById('calendarContainer');
    calendarContainer.innerHTML = '<p class="loading-message">Loading calendar data...</p>';

    let firstMonth = currentStartMonth;
    let firstYear = currentYear;
    let secondMonth = currentStartMonth + 1;
    let secondYear = currentYear;
 
    if (secondMonth > 11) {
        secondMonth = 0;
        secondYear++;
    }
 
    // Fetch the posts for the current two months
    const allPostsByDate = await fetchPostsForMonths(firstYear, firstMonth, secondYear, secondMonth);
    calendarContainer.innerHTML = ''; // Clear loading message

    const firstMonthCalendar = createMonthCalendar(firstYear, firstMonth, allPostsByDate);
     const secondMonthCalendar = createMonthCalendar(secondYear, secondMonth, allPostsByDate);

    calendarContainer.appendChild(firstMonthCalendar);
    calendarContainer.appendChild(secondMonthCalendar);

    // If a date was selected previously, ensure posts are displayed on re-render
    if (selectedDate) {
        displayPosts(selectedDate);
    } else {
        // Default text if no date is selected
        document.getElementById('postsDate').textContent = 'Select a date';
        document.getElementById('postsContent').innerHTML = '<p class="no-posts">Click on a date to view posts</p>';
    }
}

function goToPreviousPage() {
    currentStartMonth -= 2;

    if (currentStartMonth < 0) {
        currentStartMonth += 12;
        currentYear--;
    }

    renderCalendar();
}

function goToNextPage() {
    currentStartMonth += 2; 
    if (currentStartMonth > 11) {
        currentStartMonth -= 12;
        currentYear++;
    }
     renderCalendar();
}

document.getElementById('backBtn').addEventListener('click', () => {
     console.log('Back button clicked');
     window.history.back();
});

document.getElementById('prevBtn').addEventListener('click', goToPreviousPage);
document.getElementById('nextBtn').addEventListener('click', goToNextPage);

document.addEventListener('DOMContentLoaded', () => {
    // Set the calendar to the current month by default
    const today = new Date();
    currentStartMonth = today.getMonth();
    currentYear = today.getFullYear();
    renderCalendar();
});