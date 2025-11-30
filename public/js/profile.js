const API_BASE = "https://oudi-web-devons-projects-8b9164ea.vercel.app";

const currentUid = localStorage.getItem('uid');
const LOCAL_PIN_KEY = 'userPinnedPostIds_' + currentUid; 
let allUserPostsCache = [];

function getToken() {
  return localStorage.getItem('token') || localStorage.getItem('authToken') || null;
}
function authHeaders() {
  const headers = { 'Content-Type': 'application/json' };
  const token = getToken();
  if (token) headers['Authorization'] = `Bearer ${token}`;
  return headers;
}

function getLocalPinnedIds() {
    try {
        const ids = localStorage.getItem(LOCAL_PIN_KEY);
        return ids ? new Set(JSON.parse(ids)) : new Set();
    } catch (e) {
        console.error("Error reading pinned IDs from localStorage:", e);
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
    event.stopPropagation();
    const button = event.currentTarget;
    const postId = button.dataset.postId;
    
    const isNowPinned = togglePinStatus(postId); 

    const pinnedIds = getLocalPinnedIds();
    const newPinnedPosts = allUserPostsCache.filter(post => pinnedIds.has(post.id));
    
    renderPins(newPinnedPosts); 
    
    alert(`Post is now ${isNowPinned ? 'PINNED' : 'UNPINNED'}.`);
    console.log(`Post ${postId} is now ${isNowPinned ? 'pinned' : 'unpinned'}`);
}

document.addEventListener('DOMContentLoaded', () => {

    loadUserProfile(currentUid);
    loadUserPosts(currentUid);
    loadRecentDiary(currentUid);

  const uploadBtn = document.getElementById('uploadBtn');
  const avatarFile = document.getElementById('avatarFile');
  if (uploadBtn && avatarFile) {
    uploadBtn.addEventListener('click', async () => {
      const uidLocal = localStorage.getItem('uid');
      if (!uidLocal) return alert('Not signed in.');
      if (!avatarFile.files || avatarFile.files.length === 0) return alert('Select an image first.');
      const file = avatarFile.files[0];

      const reader = new FileReader();
      reader.onload = async () => {
        const dataUrl = reader.result;

        try {
          uploadBtn.disabled = true;
          uploadBtn.textContent = 'Uploading...';

          const resp = await fetch(`${API_BASE}/profile/avatar/${uidLocal}`, {
            method: 'PUT',
            headers: authHeaders(),
            body: JSON.stringify({ avatarUrl: dataUrl })
          });

          const body = await resp.json();
          if (!resp.ok) throw new Error(body.error || 'Upload failed');

          const newUrl = body.avatarUrl || (body.profile && body.profile.avatarUrl) || null;
          if (newUrl) renderAvatar(newUrl);
          alert('Profile picture updated!');
        } catch (err) {
          console.error('Upload error:', err);
          alert('Upload failed: ' + (err.message || err));
        } finally {
          uploadBtn.disabled = false;
          uploadBtn.textContent = 'Upload';
        }
      };
      reader.readAsDataURL(file);
    });
  }

  const openSettingsBtn = document.getElementById('openSettingsBtn');
  const settingsModal = document.getElementById('settingsModal');
  const closeSettingsBtn = document.getElementById('closeSettingsBtn');
  const cancelSettingsBtn = document.getElementById('cancelSettingsBtn');
  const saveSettingsBtn = document.getElementById('saveSettingsBtn');
  const modalBackdrop = document.getElementById('modalBackdrop');

  function openModal() {
    settingsModal.setAttribute('aria-hidden', 'false');
    const user = window.__profile_user || {};
    const prefs = window.__profile_prefs || {};
    document.getElementById('usernameInput').value = user.username || '';
    document.getElementById('bioInput').value = user.bio || '';
    document.getElementById('heightInput').value = prefs.heightCm || '';
    document.getElementById('weightInput').value = prefs.weightKg || '';
  }
  function closeModal() {
    settingsModal.setAttribute('aria-hidden', 'true');
  }

  if (openSettingsBtn) openSettingsBtn.addEventListener('click', openModal);
  if (closeSettingsBtn) closeSettingsBtn.addEventListener('click', closeModal);
  if (cancelSettingsBtn) cancelSettingsBtn.addEventListener('click', closeModal);
  if (modalBackdrop) modalBackdrop.addEventListener('click', closeModal);

  if (saveSettingsBtn) {
    saveSettingsBtn.addEventListener('click', async () => {
      const uidLocal = localStorage.getItem('uid');
      if (!uidLocal) return alert('Not signed in.');

      const username = document.getElementById('usernameInput').value.trim();
      const bio = document.getElementById('bioInput').value.trim();
      const heightVal = document.getElementById('heightInput').value;
      const weightVal = document.getElementById('weightInput').value;

      const preferences = {};
      if (heightVal !== '') preferences.heightCm = parseInt(heightVal, 10);
      if (weightVal !== '') preferences.weightKg = parseInt(weightVal, 10);
      
      const payload = {};
      if (username !== '') payload.username = username;
      if (bio !== '') payload.bio = bio;
      if (Object.keys(preferences).length > 0) payload.preferences = preferences;

      try {
        saveSettingsBtn.disabled = true;
        saveSettingsBtn.textContent = 'Saving...';

        const resp = await fetch(`${API_BASE}/profile/${uidLocal}`, {
          method: 'PUT',
          headers: authHeaders(),
          body: JSON.stringify(payload)
        });

        const body = await resp.json();
        if (!resp.ok) throw new Error(body.error || 'Save failed');

        await loadUserProfile(uidLocal);

        alert('Profile saved');
        closeModal();
      } catch (err) {
        console.error('Save error:', err);
        alert('Save failed: ' + (err.message || err));
      } finally {
        saveSettingsBtn.disabled = false;
        saveSettingsBtn.textContent = 'Save';
      }
    });
  }

  window.handleLogout = function () {
    localStorage.removeItem('uid');
    localStorage.removeItem('token');
    localStorage.removeItem('authToken');
    window.location.href = "/html/login.html";
  };
});

async function loadUserProfile(uid) {
  try {
    const resp = await fetch(`${API_BASE}/profile/${uid}`, {
      method: 'GET',
      headers: authHeaders()
    });

    if (!resp.ok) {
      console.warn('Profile fetch failed, server responded:', resp.status);
      const body = await resp.json().catch(() => ({}));
      console.warn(body);
      applyUserToUI({}, {});
      return;
    }

    const body = await resp.json();
    if (!body.success || !body.profile) {
      console.warn('Profile returned unexpected body', body);
      applyUserToUI({}, {});
      return;
    }

    const profile = body.profile;
    const user = {};
    for (const k in profile) {
      if (k !== 'preferences') user[k] = profile[k];
    }
    const preferences = profile.preferences || {};

    window.__profile_user = user;
    window.__profile_prefs = preferences;

    applyUserToUI(user, preferences);
  } catch (err) {
    console.error('Failed to load profile', err);
    applyUserToUI({}, {});
  }
}

function applyUserToUI(user = {}, preferences = {}) {
  const usernameEl = document.querySelector('.username');
  const statsEl = document.querySelector('.user-stats');
  const bioEl = document.querySelector(".user-bio");
  const bioInput = document.getElementById("bioInput");

  usernameEl.textContent = user.username || '—';

  bioEl.textContent = user.bio || "";
  if (bioInput) bioInput.value = user.bio || ""; 

  const height = (preferences && typeof preferences.heightCm !== 'undefined' && preferences.heightCm !== null)
    ? preferences.heightCm
    : null;
  const weight = (preferences && typeof preferences.weightKg !== 'undefined' && preferences.weightKg !== null)
    ? preferences.weightKg
    : null;

  const heightText = height ? `${height} cm` : '--';
  const weightText = weight ? `${weight} kg` : '--';

  statsEl.textContent = `${heightText} • ${weightText}`;

  const avatarUrl = user.avatarUrl || user.avatar || '';
  renderAvatar(avatarUrl);
}

function renderAvatar(avatarUrl) {
  const img = document.getElementById('profileImage');
  if (!img) return;

  if (!avatarUrl) {
    img.src = '/image.png';
    return;
  }
  if (typeof avatarUrl !== 'string') {
    img.src = '/image.png';
    return;
  }

  const trimmed = avatarUrl.trim();
  if (trimmed === '') {
    img.src = '/image.png';
    return;
  }
  if (/^https?:\/\//i.test(trimmed)) {
    img.src = trimmed;
    return;
  }
  if (trimmed.startsWith('data:')) {
    img.src = trimmed;
    return;
  }

  const candidate = trimmed.replace(/\s+/g, '');
  if (candidate.length > 100 && /^[A-Za-z0-9+/=]+$/.test(candidate)) {
    img.src = 'data:image/jpeg;base64,' + candidate;
    return;
  }

  img.src = '/image.png';
}

async function loadUserPosts(uid) {
    const pinsGrid = document.getElementById('pinsGrid');
    if (!pinsGrid) return console.error('Missing #pinsGrid element.');
    
    pinsGrid.innerHTML = '<p class="loading-message">Loading posts...</p>';

    try {
        const resp = await fetch(`${API_BASE}/posts/user/${uid}`, { 
            method: 'GET',
            headers: authHeaders()
        });

        const body = await resp.json();
        if (!resp.ok) throw new Error(body.error || 'Failed to fetch user posts.');

        const allPosts = body.posts || [];
        allUserPostsCache = allPosts;
        
        const pinnedIds = getLocalPinnedIds();
        
        const userPins = allPosts.filter(post => pinnedIds.has(post.id));

        renderPins(userPins);

    } catch (err) {
        console.error('Error loading user pins:', err);
        pinsGrid.innerHTML = `<p class="error-message">Could not load pins: ${err.message}.</p>`;
    }
}

function renderPins(pinnedPosts = []) {
  const pinsGrid = document.getElementById('pinsGrid');
  if (!pinsGrid) return;

  pinsGrid.innerHTML = '';

  if (pinnedPosts.length === 0) {
    pinsGrid.innerHTML = '<p class="no-pins">No posts pinned yet. Pin a post to see it here.</p>';
    return;
  }

  pinnedPosts.forEach(post => {
    const pinItem = document.createElement('div');
    pinItem.className = 'pin-item';
    pinItem.style.backgroundImage = `url('${post.imageUrl || '/image.png'}')`; 
    pinItem.dataset.postId = post.id;
    
    pinItem.innerHTML = `
        <div class="pin-overlay">
            <button class="unpin-btn" data-post-id="${post.id}" title="Unpin Post">
                <span class="pin-icon">📍</span>
            </button>
            <span class="pin-rating">${post.rating || 'N/A'}⭐️</span>
            <span class="pin-likes">${post.likes || 0} ❤️</span>
        </div>
    `;

    pinItem.addEventListener('click', function(e) {
        if (e.target.closest('.unpin-btn')) {
            return; 
        }
        showPostDetails(post);
    });

    pinsGrid.appendChild(pinItem);
  });
  
  document.querySelectorAll('.unpin-btn').forEach(button => {
        button.addEventListener('click', handlePinToggle);
  });
}

function showPostDetails(post) {
    const isCurrentlyPinned = getLocalPinnedIds().has(post.id);
    const pinText = isCurrentlyPinned ? "UNPIN THIS POST" : "PIN THIS POST";

    const details = `
        **Theme**: ${post.theme || 'N/A'}
        **Link**: ${post.link || 'No Link'}
        **Rating**: ${post.rating || 'N/A'} ⭐️
        **Likes**: ${post.likes || 0} ❤️
        **Date**: ${new Date(post.date || post.timestamp).toLocaleDateString()}
    `;
    
    const confirmed = confirm(`Post Details:\n\n${details}\n\n[ ${pinText} ]`);

    if (confirmed) {
        togglePinStatus(post.id);
        
        loadUserPosts(currentUid); 
    }
}

async function loadRecentDiary(uid) {
  const diaryDays = document.querySelectorAll('.diary-day');
  if (diaryDays.length === 0) return;

  try {
    const limit = diaryDays.length;
    const resp = await fetch(`${API_BASE}/posts/user/${uid}?limit=${limit}`, {
      method: 'GET',
      headers: authHeaders()
    });

    const body = await resp.json();
    if (!resp.ok) throw new Error(body.error || 'Failed to fetch recent diary.');

    const recentPosts = body.posts || [];
    
    applyRecentDatesToDiary(recentPosts, diaryDays);

  } catch (err) {
    console.error('Error loading recent diary dates:', err);
  }
}

function showDayPostsList(dateString, posts) {
    let listMessage = `Multiple posts found for ${dateString}:\n\n`;
    
    posts.forEach((post, index) => {
        const theme = post.theme || `Post #${index + 1}`;
        const status = getLocalPinnedIds().has(post.id) ? " (PINNED)" : "";
        listMessage += `${index + 1}. ${theme}${status}\n`;
    });

    listMessage += `\nEnter the number of the post you want to view/pin (1 to ${posts.length}):`;

    const selection = prompt(listMessage);

    const index = parseInt(selection, 10);

    if (!isNaN(index) && index >= 1 && index <= posts.length) {
        showPostDetails(posts[index - 1]);
    } else if (selection !== null && selection !== "") {
        alert("Invalid selection. Please enter a number from the list.");
    }
}

function applyRecentDatesToDiary(posts, diaryDayElements) {
  diaryDayElements.forEach(day => {
    day.classList.remove('filled');
    day.textContent = '';
    const newDay = day.cloneNode(true);
    day.parentNode.replaceChild(newDay, day);
  });
  
  const updatedDiaryDays = document.querySelectorAll('.diary-day');

  const postDates = new Set();
  const postMap = {};

  posts.forEach(post => {
    const date = new Date(post.date || post.timestamp); 
    const dateKey = `${date.getDate()}/${date.getMonth() + 1}`;
    postDates.add(dateKey);
    const dateString = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    if (!postMap[dateString]) postMap[dateString] = [];
    postMap[dateString].push(post);
  });

  const today = new Date();

  for (let i = 0; i < updatedDiaryDays.length; i++) {
    const checkDate = new Date();
    const daysBack = updatedDiaryDays.length - 1 - i;
    checkDate.setDate(today.getDate() - daysBack); 

    const dateKey = `${checkDate.getDate()}/${checkDate.getMonth() + 1}`;
    const dateText = `${checkDate.getDate()}`; 
    
    const dayEl = updatedDiaryDays[i];
    if (!dayEl) break;

    dayEl.textContent = dateText;
    
    if (postDates.has(dateKey)) {
        dayEl.classList.add('filled'); 
    }
    
    dayEl.addEventListener('click', function() {
        const dateString = `${checkDate.getFullYear()}-${String(checkDate.getMonth() + 1).padStart(2, '0')}-${String(checkDate.getDate()).padStart(2, '0')}`;
        const postsForDay = postMap[dateString];

        if (dayEl.classList.contains('filled')) {
             if (postsForDay && postsForDay.length === 1) {
                showPostDetails(postsForDay[0]);
             } else if (postsForDay && postsForDay.length > 1) {
                showDayPostsList(dateString, postsForDay);
             }
        } else {
            alert(`No posts for ${dateString}.`);
        }
    });
  }
}