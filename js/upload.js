document.addEventListener("DOMContentLoaded", () => {
  const API_BASE = "http://localhost:3000";

  const stateUpload = document.getElementById("state-upload");
  const stateEditor = document.getElementById("state-editor");

  const selectPhotoBtn = document.getElementById("selectPhotoBtn");
  const photoInput = document.getElementById("photoInput");
  const placeholderFrame = document.getElementById("placeholderFrame");

  const editorImage = document.getElementById("editorImage");
  const bioInput = document.getElementById("bioInput");
  const locationBtn = document.getElementById("locationBtn");

  const cancelBtn = document.getElementById("cancelBtn");
  const postBtn = document.getElementById("postBtn");
  const linksBtn = document.getElementById("linksBtn");

  const locationModal = document.getElementById("locationModal");
  const locToggle = document.getElementById("locToggle");
  const locInput = document.getElementById("locInput");
  const locCancel = document.getElementById("locCancel");
  const locSave = document.getElementById("locSave");

  const linksModal = document.getElementById("linksModal");
  const linkInput = document.getElementById("linkInput");
  const linksList = document.getElementById("linksList");
  const linksCancel = document.getElementById("linksCancel");
  const linksAdd = document.getElementById("linksAdd");
  const linksDone = document.getElementById("linksDone");

  const backBtn = document.getElementById("backBtn");

  // THEME ELEMENTS
  const themeInput = document.getElementById("themeInput");
  const themeDropdown = document.getElementById("themeDropdown");

  let selectedFile = null;
  let shopLinks = [];
  let tempLinks = [];
  let locationState = { enabled: true, text: "" };
  let themeValue = "";

  const uid = localStorage.getItem("uid");

  const THEME_SUGGESTIONS = [
    "Retro", "Hip Hop", "Minimalist", "Floral", "Y2K",
    "Coquette", "Athleisure", "Pastels",

    // Extra high-quality fashion themes
    "Korean", "Korean Minimal", "Streetwear", "Soft Girl", "Grunge",
    "Vintage", "Indie", "E-girl", "Dark Academia", "Light Academia",
    "Techwear", "Cottagecore", "Harajuku", "Sporty", "Denim",
    "Classic", "Monochrome", "Aesthetic Casual"
  ];

  async function getUserDetails() {
    if (!uid) return null;

    try {
      const res = await fetch(`${API_BASE}/profile/${uid}`);
      const data = await res.json();

      if (data.success) {
        return {
          username: data.profile.username || "Unknown",
          avatarUrl: data.profile.avatarUrl || ""
        };
      }
    } catch (e) {
      console.error("Failed to fetch user details:", e);
    }

    return null;
  }

  function showUploadState() {
    stateUpload.classList.add("active");
    stateEditor.classList.remove("active");

    editorImage.src = "";
    editorImage.style.display = "none";
    selectedFile = null;
    placeholderFrame.style.display = "flex";
  }

  function showEditorState() {
    stateUpload.classList.remove("active");
    stateEditor.classList.add("active");

    editorImage.src = selectedFile;
    editorImage.style.display = "block";
    placeholderFrame.style.display = "none";

    locToggle.checked = locationState.enabled;
    locInput.value = locationState.enabled ? locationState.text : "";
    locInput.style.display = locationState.enabled ? "block" : "none";
  }

  selectPhotoBtn.onclick = () => photoInput.click();
  placeholderFrame.onclick = () => photoInput.click();

  photoInput.addEventListener("change", (e) => {
    const file = e.target.files[0];
    if (!file || !file.type.startsWith("image/")) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
      selectedFile = ev.target.result;
      showEditorState();
    };
    reader.readAsDataURL(file);
  });

  locationBtn.onclick = () => {
    if (!selectedFile) return alert("Upload an image first.");
    showModal(locationModal);
  };

  locToggle.onchange = () => {
    locInput.style.display = locToggle.checked ? "block" : "none";
  };

  locCancel.onclick = () => hideModal(locationModal);

  locSave.onclick = () => {
    locationState.enabled = locToggle.checked;
    locationState.text = locToggle.checked
      ? locInput.value.trim() || "Jakarta"
      : null;
    hideModal(locationModal);
  };

  linksBtn.onclick = () => {
    if (!selectedFile) return alert("Upload an image first.");
    tempLinks = [...shopLinks];
    renderLinks();
    showModal(linksModal);
  };

  linksCancel.onclick = () => hideModal(linksModal);

  linksAdd.onclick = addLink;

  linkInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addLink();
    }
  });

  function addLink() {
    const v = linkInput.value.trim();
    if (!v) return alert("Enter a link.");
    tempLinks.push(v);
    linkInput.value = "";
    renderLinks();
  }

  linksDone.onclick = () => {
    shopLinks = [...tempLinks];
    hideModal(linksModal);
  };

  function renderLinks() {
    linksList.innerHTML = "";
    if (tempLinks.length === 0) {
      linksList.innerHTML = `<div style="padding:8px;color:#999">No links yet</div>`;
      return;
    }
    tempLinks.forEach((l, i) => {
      const row = document.createElement("div");
      row.className = "link-item";
      row.innerHTML = `
        <span>${l}</span>
        <button class="btn btn-secondary" data-index="${i}">Remove</button>
      `;
      row.querySelector("button").onclick = () => {
        tempLinks.splice(i, 1);
        renderLinks();
      };
      linksList.appendChild(row);
    });
  }

themeInput.addEventListener("input", () => {
  if (!themeDropdown) return;

  const query = themeInput.value.toLowerCase();
  themeDropdown.innerHTML = "";

  if (!query) {
    themeDropdown.style.display = "none";
    return;
  }

  const matches = THEME_SUGGESTIONS.filter(t =>
    t.toLowerCase().includes(query)
  );

  if (matches.length === 0) {
    themeDropdown.style.display = "none";
    return;
  }

  matches.forEach(theme => {
    const item = document.createElement("div");
    item.className = "theme-suggestion";
    item.textContent = theme;
    item.onclick = () => {
      themeInput.value = theme;
      themeValue = theme;
      themeDropdown.style.display = "none";
    };
    themeDropdown.appendChild(item);
  });

  themeDropdown.style.display = "block";
});

document.addEventListener("click", (e) => {
  if (!themeDropdown) return; // prevent null errors
  if (e.target !== themeInput && !themeDropdown.contains(e.target)) {
    themeDropdown.style.display = "none";
  }
});

  postBtn.onclick = async () => {
    if (!selectedFile) return alert("Please choose an image first.");

    const caption = bioInput.value.trim();
    const theme = themeInput.value.trim();

    const user = await getUserDetails();
    if (!user) return alert("Failed to fetch user info.");

    const payload = {
      userId: uid,
      username: user.username,
      userAvatar: user.avatarUrl,
      imageBase64: selectedFile,
      caption,
      theme,
      location: locationState.enabled ? locationState.text : null,
      shoppingLinks: shopLinks
    };

    try {
      const res = await fetch(`${API_BASE}/posts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      const data = await res.json();

      if (data.success) {
        alert("Post uploaded!");
        window.location.href = "/html/dashboard.html";
      } else {
        alert("Failed: " + data.error);
      }
    } catch (err) {
      console.error("Upload error:", err);
      alert("Upload error, see console.");
    }
  };

  cancelBtn.onclick = () => {
    if (confirm("Cancel upload?")) {
      showUploadState();
    }
  };

  function showModal(m) {
    m.classList.add("show");
  }

  function hideModal(m) {
    m.classList.remove("show");
  }

  backBtn.onclick = () => {
    window.location.href = "/html/dashboard.html";
  };

  showUploadState();
});
