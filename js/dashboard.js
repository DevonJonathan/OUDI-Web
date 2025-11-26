document.addEventListener("DOMContentLoaded", async function () {
  const API_BASE = "http://localhost:3000";
  const currentUserId = localStorage.getItem("uid");
  const feedContainer = document.querySelector(".feed-container");

  document.addEventListener("click", () => {
    document.querySelectorAll(".shopping-popup.show").forEach(p => p.classList.remove("show"));
  });

  async function loadCurrentUserAvatar() {
    if (!currentUserId) return;

    try {
      const resp = await fetch(`${API_BASE}/profile/${currentUserId}`);
      const data = await resp.json();

      if (!data.success) return;

      const avatar = convertAvatar(data.profile.avatarUrl || "");
      const headerImg = document.querySelector(".header-profile");
      if (headerImg) headerImg.src = avatar;
    } catch (err) {
      console.error("Header avatar error:", err);
    }
  }

  function convertAvatar(url) {
    if (!url || typeof url !== "string") return "/image.png";

    const t = url.trim();
    if (t.startsWith("http")) return t;
    if (t.startsWith("data:")) return t;
    if (t.length > 100) return `data:image/jpeg;base64,${t}`;

    return "/image.png";
  }

  await loadCurrentUserAvatar();

  async function fetchPosts() {
    try {
      const resp = await fetch(`${API_BASE}/posts`);
      const data = await resp.json();

      if (!data.success || !Array.isArray(data.posts)) {
        console.error("Invalid posts response", data);
        return;
      }

      const sorted = data.posts.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
      await renderPosts(sorted);

    } catch (err) {
      console.error("Post fetch error:", err);
    }
  }

  function resolveImage(post) {
    if (post.imageUrl && typeof post.imageUrl === "string" && post.imageUrl.startsWith("http")) return post.imageUrl;
    if (post.imageURL && typeof post.imageURL === "string" && post.imageURL.startsWith("http")) return post.imageURL;

    if (post.imageBase64 && typeof post.imageBase64 === "string" && post.imageBase64.startsWith("data:image"))
      return post.imageBase64;

    if (post.imageBase64 && typeof post.imageBase64 === "string" && post.imageBase64.length > 100)
      return "data:image/jpeg;base64," + post.imageBase64;

    return "/image-placeholder.png";
  }

  async function renderPosts(posts) {
    feedContainer.innerHTML = "";
    for (const p of posts) {
      try {
        const node = await createPostElement(p);
        if (node && node instanceof Node) feedContainer.appendChild(node);
      } catch (err) {
        console.error("Error creating post element:", err);
      }
    }
  }

  async function createPostElement(data) {
    // defensive defaults
    data.likedBy = Array.isArray(data.likedBy) ? data.likedBy : [];
    data.ratings = data.ratings && typeof data.ratings === "object" ? data.ratings : {};

    const post = document.createElement("div");
    post.className = "post-card";

    let liveAvatar = "/image.png";
    if (data.userId) {
      try {
        const profileRes = await fetch(`${API_BASE}/profile/${data.userId}`);
        const profileJson = await profileRes.json();
        if (profileJson && profileJson.success) {
          liveAvatar = convertAvatar(profileJson.profile.avatarUrl || "");
        }
      } catch (e) {
        // fallback to avatar in post object (if present) or default
        liveAvatar = convertAvatar(data.userAvatar || "/image.png");
      }
    } else {
      liveAvatar = convertAvatar(data.userAvatar || "/image.png");
    }

    const userRating = Number(data.ratings?.[currentUserId] || 0);
    const ratingValues = Object.values(data.ratings || {}).map(Number).filter(v => !isNaN(v));
    const avgRating = ratingValues.length === 0 ? 0 : ratingValues.reduce((a, b) => a + b, 0) / ratingValues.length;

    const locationText =
      typeof data.location === "string" && data.location.trim() !== ""
        ? data.location
        : "Location unknown";

    let shoppingList = [];
    if (Array.isArray(data.shoppingLinks)) {
      shoppingList = data.shoppingLinks.filter((l) => typeof l === "string" && l.trim());
    } else if (typeof data.shoppingLinks === "string" && data.shoppingLinks.trim()) {
      shoppingList = [data.shoppingLinks.trim()];
    }
    shoppingList = shoppingList.filter((l) => l !== "null" && l !== null);

    post.innerHTML = `
      <div class="post-header">
        <img src="${liveAvatar}" class="post-profile" alt="pfp">
        <div class="post-user-info">
          <h3 class="username">${escapeHtml(String(data.username || "Unknown"))}</h3>
          <p class="location">${escapeHtml(locationText)} • ${new Date(data.timestamp || Date.now()).toLocaleDateString()}</p>
        </div>
      </div>

      <div class="post-image">
        <img src="${escapeAttr(resolveImage(data))}" alt="Post Image">
        <div class="theme-tag">${escapeHtml(String(data.theme || ""))}</div>

        <button class="shopping-btn" aria-label="Shop links">🛍️</button>
        <div class="shopping-popup">
          ${
            shoppingList.length > 0
              ? shoppingList.map((l) => `<a href="${escapeAttr(l)}" target="_blank" rel="noopener noreferrer">${escapeHtml(l)}</a>`).join("<br>")
              : "No links"
          }
        </div>
      </div>

      <div class="post-actions">
        <div class="left-actions">
          <button class="like-btn" aria-label="Like">
            <svg viewBox="0 0 24 24" width="28" height="28"
              fill="${data.likedBy.includes(currentUserId) ? "#F08080" : "none"}"
              stroke="#F08080" stroke-width="2">
              <path d="M20.8 4.6c-1.5-1.4-3.7-1.4-5.2 0l-1.3 1.3-1.3-1.3c-1.5-1.4-3.7-1.4-5.2 0-1.5 1.5-1.5 3.9 0 5.4l6.5 6.6 6.5-6.6c1.5-1.5 1.5-3.9 0-5.4z"/>
            </svg>
          </button>
          <span class="like-count">${data.likedBy.length}</span>
        </div>

        <div class="rating-counter">⭐ ${avgRating.toFixed(1)}</div>
      </div>

      <div class="post-caption">
        <p>${escapeHtml(String(data.caption || ""))}</p>
      </div>

      <div class="rating-section">
        <div class="stars">
          ${[1,2,3,4,5].map(i => `<span class="star ${userRating >= i ? "filled" : ""}">${userRating >= i ? "★" : "☆"}</span>`).join("")}
        </div>
        <p class="rating-text">Rate the look!</p>
      </div>
    `;

    const likeBtn = post.querySelector(".like-btn");
    const likeSvg = likeBtn.querySelector("svg");
    const likeCountSpan = post.querySelector(".like-count");

    likeBtn.addEventListener("click", async (e) => {
      e.stopPropagation();
      try {
        const resp = await fetch(`${API_BASE}/posts/${data.id}/like`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId: currentUserId }),
        });

        const result = await resp.json();
        if (!result.success) return;

        if (data.likedBy.includes(currentUserId)) {
          data.likedBy = data.likedBy.filter((id) => id !== currentUserId);
        } else {
          data.likedBy.push(currentUserId);
        }

        likeSvg.setAttribute("fill", data.likedBy.includes(currentUserId) ? "#F08080" : "none");
        likeCountSpan.textContent = data.likedBy.length;
      } catch (err) {
        console.error("Like error:", err);
      }
    });

    const stars = post.querySelectorAll(".star");
    const ratingCounterEl = post.querySelector(".rating-counter");

    function updateAvgDisplay() {
      const vals = Object.values(data.ratings || {}).map(Number).filter(v => !isNaN(v));
      const avg = vals.length === 0 ? 0 : vals.reduce((a,b)=>a+b,0) / vals.length;
      if (ratingCounterEl) ratingCounterEl.textContent = `⭐ ${avg.toFixed(1)}`;
    }

    stars.forEach((star, index) => {
      const ratingValue = index + 1;

      star.addEventListener("mouseenter", (ev) => {
        ev.stopPropagation();
        stars.forEach((s, i) => s.textContent = i < ratingValue ? "★" : "☆");
      });

      star.addEventListener("mouseleave", (ev) => {
        ev.stopPropagation();
        const current = Number(data.ratings?.[currentUserId] || 0);
        stars.forEach((s, i) => s.textContent = i < current ? "★" : "☆");
      });

      star.addEventListener("click", async (ev) => {
        ev.stopPropagation();
        try {
          const resp = await fetch(`${API_BASE}/posts/${data.id}/rate`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ userId: currentUserId, rating: ratingValue }),
          });
          const result = await resp.json();
          if (!result.success) return;

          if (!data.ratings) data.ratings = {};
          data.ratings[currentUserId] = ratingValue;

          stars.forEach((s, i) => {
            s.textContent = i < ratingValue ? "★" : "☆";
            s.classList.toggle("filled", i < ratingValue);
          });

          updateAvgDisplay();
        } catch (err) {
          console.error("Rating error:", err);
        }
      });
    });

    updateAvgDisplay();

    const shopBtn = post.querySelector(".shopping-btn");
    const shopPopup = post.querySelector(".shopping-popup");

    shopBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      document.querySelectorAll(".shopping-popup.show").forEach(p => {
        if (p !== shopPopup) p.classList.remove("show");
      });
      shopPopup.classList.toggle("show");
    });

    if (shopPopup) shopPopup.addEventListener("click", (e) => e.stopPropagation());

    return post;
  }

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function escapeAttr(s) {
    return String(s).replace(/"/g, "&quot;").replace(/'/g, "&#39;");
  }

  await fetchPosts();
});
