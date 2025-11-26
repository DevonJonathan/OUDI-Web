const API_BASE = "http://localhost:3000";

function getToken() {
  return localStorage.getItem('token') || localStorage.getItem('authToken') || null;
}
function authHeaders() {
  const headers = { 'Content-Type': 'application/json' };
  const token = getToken();
  if (token) headers['Authorization'] = `Bearer ${token}`;
  return headers;
}

document.addEventListener('DOMContentLoaded', () => {
  // find uid from localStorage
  const uid = localStorage.getItem('uid');
  if (!uid) {
    console.warn('No uid in localStorage — redirecting to login.');
    window.location.href = 'login.html';
  } else {
    loadUserProfile(uid);
  }

  // Setup simple UI bits
  setupDiaryDays();
  setupPins();

  // Upload avatar
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
        const dataUrl = reader.result; // contains data:...;base64,...

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

          // server returns avatarUrl
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

  // Settings modal: open/close/save
  const openSettingsBtn = document.getElementById('openSettingsBtn');
  const settingsModal = document.getElementById('settingsModal');
  const closeSettingsBtn = document.getElementById('closeSettingsBtn');
  const cancelSettingsBtn = document.getElementById('cancelSettingsBtn');
  const saveSettingsBtn = document.getElementById('saveSettingsBtn');
  const modalBackdrop = document.getElementById('modalBackdrop');

  function openModal() {
    settingsModal.setAttribute('aria-hidden', 'false');
    // populate inputs with current values (if profile loaded)
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
      // preferencesCompleted could be set if useful; not required
      if (Object.keys(preferences).length === 0) {
        // send only username/bio if no preferences changed
      }

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

        // refresh profile from server to reflect saved values (or patch UI locally)
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

  // Logout handler available globally
  window.handleLogout = function () {
    localStorage.removeItem('uid');
    localStorage.removeItem('token');
    localStorage.removeItem('authToken');
    window.location.href = "login.html";
  };
});

async function loadUserProfile(uid) {
  try {
    const resp = await fetch(`${API_BASE}/profile/${uid}`, {
      method: 'GET',
      headers: authHeaders()
    });

    if (!resp.ok) {
      // server may return 404 "User not found"
      console.warn('Profile fetch failed, server responded:', resp.status);
      const body = await resp.json().catch(() => ({}));
      console.warn(body);
      // show defaults
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
    // server merged user + preferences into profile: profile has user fields + preferences property
    const user = {};
    // copy all top-level fields except preferences into user object
    for (const k in profile) {
      if (k !== 'preferences') user[k] = profile[k];
    }
    const preferences = profile.preferences || {};

    // cache globally for modal usage
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

  // username
  usernameEl.textContent = user.username || '—';

  // bio
    bioEl.textContent = user.bio || "";
    bioInput.value = user.bio || "";

  // height/weight (show -- when missing)
  const height = (preferences && typeof preferences.heightCm !== 'undefined' && preferences.heightCm !== null)
    ? preferences.heightCm
    : null;
  const weight = (preferences && typeof preferences.weightKg !== 'undefined' && preferences.weightKg !== null)
    ? preferences.weightKg
    : null;

  const heightText = height ? `${height} cm` : '--';
  const weightText = weight ? `${weight} kg` : '--';

  statsEl.textContent = `${heightText} • ${weightText}`;

  // avatar
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

  // assume raw base64 (like /9j/...)
  const candidate = trimmed.replace(/\s+/g, '');
  if (candidate.length > 100 && /^[A-Za-z0-9+/=]+$/.test(candidate)) {
    img.src = 'data:image/jpeg;base64,' + candidate;
    return;
  }

  // fallback
  img.src = '/image.png';
}

function setupDiaryDays() {
  const diaryDays = document.querySelectorAll('.diary-day');
  diaryDays.forEach((day, index) => {
      day.addEventListener('click', function() {
          this.classList.toggle('filled');
          console.log(`Day ${index + 1} toggled`);
      });

      if (Math.random() > 0.7) {
          day.classList.add('filled');
      }
  });
}

function setupPins() {
  const pins = document.querySelectorAll('.pin-item');

  pins.forEach((pin, index) => {
      pin.addEventListener('click', function() {
          console.log(`Pin ${index + 1} clicked`);
          alert(`Pin ${index + 1} - Saved outfit details would appear here`);
      });
  });
}
