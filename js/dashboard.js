document.addEventListener("DOMContentLoaded", async function () {
  const API_BASE = "http://localhost:3000";
  const currentUserId = localStorage.getItem("uid");
  const feedContainer = document.querySelector(".feed-container");

  // Fetch posts
  async function fetchPosts() {
    try {
      const resp = await fetch(`${API_BASE}/posts`);
      const data = await resp.json();
      if (data.success && Array.isArray(data.posts)) {
        renderPosts(data.posts);
      } else {
        console.error("Failed to load posts: Invalid data format");
      }
    } catch (err) {
      console.error("Failed to load posts:", err);
    }
  }

  // Render posts
  function renderPosts(posts) {
    feedContainer.innerHTML = "";
    posts.forEach((post) => feedContainer.appendChild(createPostElement(post)));
  }

  // Create post element
  function createPostElement(data) {
    const post = document.createElement("div");
    post.className = "post-card";

    post.innerHTML = `
      <div class="post-header">
        <img src="${data.userAvatar || '/batman.jpg'}" class="post-profile">
        <div class="post-user-info">
          <h3 class="username">${data.username}</h3>
          <p class="location">Location unknown • ${new Date(data.timestamp).toLocaleDateString()}</p>
        </div>
      </div>
      <div class="post-image">
        <img src="${data.imageUrl}" alt="Post Image">
        <div class="theme-tag">${data.theme || ''}</div>
        <button class="shopping-btn">🛍️</button>
        <div class="shopping-popup">
          ${data.shoppingLink ? data.shoppingLink : "No links"}
        </div>
      </div>
      <div class="post-actions">
        <button class="like-btn">
          <svg viewBox="0 0 24 24" width="28" height="28" fill="${data.likedBy.includes(currentUserId) ? '#F08080' : 'none'}" stroke="#F08080" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M20.8 4.6c-1.5-1.4-3.7-1.4-5.2 0l-1.3 1.3-1.3-1.3c-1.5-1.4-3.7-1.4-5.2 0-1.5 1.5-1.5 3.9 0 5.4l6.5 6.6 6.5-6.6c1.5-1.5 1.5-3.9 0-5.4z"></path>
          </svg>
        </button>
        <span class="like-count">${data.likedBy.length}</span>
      </div>
      <div class="post-caption"><p>${data.caption}</p></div>
      <div class="rating-section">
        <div class="stars">
          ${[1,2,3,4,5].map(i => `<span class="star ${data.ratings?.[currentUserId] >= i ? "filled" : ""}">☆</span>`).join('')}
        </div>
        <p class="rating-text">Rate the look!</p>
      </div>
    `;

    // Like button
    const likeBtn = post.querySelector(".like-btn");
    const likeSvg = likeBtn.querySelector("svg");
    const likeCountSpan = post.querySelector(".like-count");
    likeBtn.addEventListener("click", async () => {
      try {
        const resp = await fetch(`${API_BASE}/posts/${data.id}/like`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId: currentUserId })
        });
        const result = await resp.json();
        if (result.success) {
          data.likedBy = data.likedBy.includes(currentUserId)
            ? data.likedBy.filter(id => id !== currentUserId)
            : [...data.likedBy, currentUserId];
          likeSvg.setAttribute("fill", data.likedBy.includes(currentUserId) ? "#F08080" : "none");
          likeCountSpan.textContent = data.likedBy.length;
        }
      } catch (err) { console.error("Failed to like post:", err); }
    });

    // Rating stars
    const stars = post.querySelectorAll(".star");
    stars.forEach((star, index) => {
      star.addEventListener("mouseenter", () => highlightStars(stars, index + 1));
      star.addEventListener("click", async () => {
        try {
          const resp = await fetch(`${API_BASE}/posts/${data.id}/rate`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ userId: currentUserId, rating: index + 1 })
          });
          const result = await resp.json();
          if (result.success) fillStars(stars, index + 1);
        } catch (err) { console.error("Failed to rate post:", err); }
      });
      star.addEventListener("mouseleave", () => fillStars(stars, data.ratings?.[currentUserId] || 0));
    });

    function highlightStars(stars, count) { stars.forEach((s, i) => s.textContent = i < count ? "★" : "☆"); }
    function fillStars(stars, count) { stars.forEach((s, i) => { s.textContent = i < count ? "★" : "☆"; s.classList.toggle("filled", i < count); }); }

    // Shopping popup
    const shopBtn = post.querySelector(".shopping-btn");
    const shopPopup = post.querySelector(".shopping-popup");
    shopBtn.addEventListener("click", () => shopPopup.classList.toggle("show"));

    return post;
  }

  await fetchPosts();
});
