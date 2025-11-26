const API_BASE = "http://localhost:3000";
const currentUserId = localStorage.getItem("uid");

const friendsListEl = document.getElementById("friendsList");
const suggestionsListEl = document.getElementById("suggestionsList");
const requestsListEl = document.getElementById("requestsList");
const friendCountEl = document.getElementById("friendCount");
const searchInput = document.getElementById("searchInput");

function convertAvatar(url) {
    if (!url) return "/image.png";
    if (url.startsWith("http")) return url;
    if (url.startsWith("data:")) return url;
    if (url.length > 100) return `data:image/jpeg;base64,${url}`;
    return "/image.png";
}

async function loadFriends() {
    const resp = await fetch(`${API_BASE}/friends/${currentUserId}`);
    const data = await resp.json();

    if (!data.success) return;

    friendCountEl.textContent = data.friends.length;

    friendsListEl.innerHTML = data.friends.map(friend => `
        <div class="friend-item">
            <div class="avatar">
                <img src="${convertAvatar(friend.avatarUrl)}" alt="${friend.username}">
            </div>
            <span class="friend-name">${friend.username}</span>
            <button class="unfriend-btn" onclick="removeFriend('${friend.uid}')">✕ Unfriend</button>
        </div>
    `).join("");
}

async function loadSuggestions() {
    const resp = await fetch(`${API_BASE}/friends/suggestions/${currentUserId}`);
    const data = await resp.json();

    if (!data.success) return;

    suggestionsListEl.innerHTML = data.suggestions.map(user => `
        <div class="suggestion-item">
            <div class="avatar">
                <img src="${convertAvatar(user.avatarUrl)}" alt="${user.username}">
            </div>
            <span class="friend-name">${user.username}</span>
            <button class="add-btn" onclick="sendRequest('${user.uid}')">+ Add</button>
        </div>
    `).join("");
}

async function loadRequests() {
    const resp = await fetch(`${API_BASE}/friends/requests/${currentUserId}`);
    const data = await resp.json();

    if (!data.success) return;

    if (data.requests.length === 0) {
        requestsListEl.innerHTML = `<p style="color:#ffb3d1; font-size:13px;">No pending requests</p>`;
        return;
    }

    requestsListEl.innerHTML = data.requests.map(user => `
        <div class="friend-item">
            <div class="avatar">
                <img src="${convertAvatar(user.avatarUrl)}" alt="${user.username}">
            </div>
            <span class="friend-name">${user.username}</span>
            <button class="add-btn" onclick="acceptRequest('${user.uid}')">Accept</button>
            <button class="unfriend-btn" onclick="declineRequest('${user.uid}')">Decline</button>
        </div>
    `).join("");
}

async function sendRequest(friendId) {
    await fetch(`${API_BASE}/friends/add`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: currentUserId, friendId })
    });

    loadSuggestions();
    loadRequests();
}

async function acceptRequest(fromId) {
    await fetch(`${API_BASE}/friends/accept`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: currentUserId, fromId })
    });

    loadFriends();
    loadRequests();
}

async function declineRequest(fromId) {
    await fetch(`${API_BASE}/friends/decline`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: currentUserId, fromId })
    });

    loadRequests();
    loadSuggestions();
}
async function removeFriend(friendId) {
    await fetch(`${API_BASE}/friends/remove`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: currentUserId, friendId })
    });

    loadFriends();
    loadSuggestions();
}

document.getElementById("backBtn").addEventListener("click", () => {
    window.history.back();
});

loadFriends();
loadSuggestions();
loadRequests();
