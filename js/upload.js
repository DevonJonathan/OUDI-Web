// upload.js - updated to match CSS .show modal behavior + fixes
document.addEventListener('DOMContentLoaded', () => {
  // DOM refs
  const stateUpload = document.getElementById('state-upload');
  const stateEditor = document.getElementById('state-editor');

  const selectPhotoBtn = document.getElementById('selectPhotoBtn');
  const photoInput = document.getElementById('photoInput');
  const placeholderFrame = document.getElementById('placeholderFrame');

  const editorPreview = document.getElementById('editorPreview');
  const editorImage = document.getElementById('editorImage');
  const bioInput = document.getElementById('bioInput');
  const locationBtn = document.getElementById('locationBtn');

  const cancelBtn = document.getElementById('cancelBtn');
  const postBtn = document.getElementById('postBtn');
  const linksBtn = document.getElementById('linksBtn');

  const locationModal = document.getElementById('locationModal');
  const locToggle = document.getElementById('locToggle');
  const locInput = document.getElementById('locInput');
  const locCancel = document.getElementById('locCancel');
  const locSave = document.getElementById('locSave');

  const linksModal = document.getElementById('linksModal');
  const linkInput = document.getElementById('linkInput');
  const linksList = document.getElementById('linksList');
  const linksCancel = document.getElementById('linksCancel');
  const linksAdd = document.getElementById('linksAdd');
  const backBtn = document.getElementById('backBtn');

  // state
  let selectedFile = null;
  let shopLinks = [];
  let tempLinks = [];
  let locationState = { enabled: true, text: 'Jakarta' };

  // initialize
  function init() {
    // start on upload state
    showStateUpload();
    // ensure modals hidden
    hideModal(locationModal);
    hideModal(linksModal);
    // disable links until image chosen (optional)
    linksBtn.disabled = true;
    linksBtn.style.opacity = '0.55';
    linksBtn.style.cursor = 'not-allowed';
  }

  // state helpers
  function showStateUpload() {
    stateEditor.classList.remove('active'); stateEditor.setAttribute('aria-hidden','true');
    stateUpload.classList.add('active'); stateUpload.setAttribute('aria-hidden','false');
    editorImage.src = ''; editorImage.style.display = 'none';
    placeholderFrame.style.display = 'flex';
    bioInput.value = '';
    linksBtn.disabled = true; linksBtn.style.opacity = '0.55'; linksBtn.style.cursor = 'not-allowed';
  }
  function showStateEditor() {
    stateUpload.classList.remove('active'); stateUpload.setAttribute('aria-hidden','true');
    stateEditor.classList.add('active'); stateEditor.setAttribute('aria-hidden','false');
    if (selectedFile) {
      editorImage.src = selectedFile;
      editorImage.style.display = 'block';
      placeholderFrame.style.display = 'none';
    }
    // populate location
    locToggle.checked = !!locationState.enabled;
    if (locationState.enabled) { locInput.style.display = 'block'; locInput.value = locationState.text || ''; } else { locInput.style.display = 'none'; locInput.value = ''; }
    renderLinksCommitted();
    // enable links button now that image exists
    linksBtn.disabled = false;
    linksBtn.style.opacity = '';
    linksBtn.style.cursor = '';
  }

  // file selection
  selectPhotoBtn.addEventListener('click', () => photoInput.click());
  placeholderFrame.addEventListener('click', () => photoInput.click());
  photoInput.addEventListener('change', (e) => {
    const f = e.target.files && e.target.files[0];
    if (!f) return;
    if (!f.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      selectedFile = ev.target.result;
      showStateEditor();
      // scroll to editor area (small UX tweak)
      setTimeout(()=> window.scrollTo({ top: 0, behavior: 'smooth' }), 80);
    };
    reader.readAsDataURL(f);
  });

  // cancel / reset
  cancelBtn.addEventListener('click', () => {
    if (!selectedFile) { showStateUpload(); return; }
    if (confirm('Cancel upload? Your photo will be discarded.')) {
      selectedFile = null; shopLinks = []; tempLinks = []; locationState = { enabled:true, text:'Jakarta' };
      photoInput.value = ''; showStateUpload(); clearLinksList();
    }
  });

  // post/save
  postBtn.addEventListener('click', () => {
    if (!selectedFile) { alert('Please select a photo first.'); return; }
    const postData = { image: selectedFile, caption: bioInput.value.trim(), links: shopLinks.slice(), location: locationState.enabled ? (locationState.text || null) : null, createdAt: new Date().toISOString() };
    const posts = JSON.parse(localStorage.getItem('oudiPosts') || '[]');
    posts.unshift(postData);
    localStorage.setItem('oudiPosts', JSON.stringify(posts));
    alert('Uploaded');
    window.location.href = '/html/dashboard.html';
  });

  /* -------------------- LINKS MODAL (add multiple) -------------------- */
  linksBtn.addEventListener('click', () => {
    if (!selectedFile) { alert('Please upload a photo first.'); return; }
    tempLinks = shopLinks.slice(); renderLinksTemp();
    linkInput.value = '';
    showModal(linksModal);
    setTimeout(()=> linkInput.focus(), 60);
  });

  linksCancel.addEventListener('click', () => {
    tempLinks = shopLinks.slice(); hideModal(linksModal);
  });

  linksAdd.addEventListener('click', addLinkFromInput);
  linkInput.addEventListener('keypress', (e) => { if (e.key === 'Enter') { e.preventDefault(); addLinkFromInput(); } });

  function addLinkFromInput() {
    const v = linkInput.value.trim();
    if (!v) { alert('Please enter a link'); return; }
    tempLinks.push(v);
    linkInput.value = '';
    renderLinksTemp();
  }

  linksDone.addEventListener('click', () => {
    shopLinks = tempLinks.slice();
    renderLinksCommitted();
    hideModal(linksModal);
  });

  function renderLinksTemp() {
    linksList.innerHTML = '';
    tempLinks.forEach((l,i) => {
      const row = document.createElement('div');
      row.className = 'link-item';
      row.innerHTML = `<span>${escapeHtml(l)}</span><button class="btn btn-secondary remove-temp" data-i="${i}">Remove</button>`;
      linksList.appendChild(row);
      row.querySelector('.remove-temp').addEventListener('click', (ev) => {
        const idx = Number(ev.currentTarget.dataset.i);
        tempLinks.splice(idx,1); renderLinksTemp();
      });
    });
    if (tempLinks.length === 0) linksList.innerHTML = `<div style="padding:8px;color:#999">No links yet</div>`;
  }

  function renderLinksCommitted() {
    // optionally show badge/count on editor; leaving minimal for now
  }

  function clearLinksList() { shopLinks = []; tempLinks = []; linksList.innerHTML = ''; }

  /* -------------------- LOCATION MODAL -------------------- */
  locationBtn.addEventListener('click', () => {
    if (!selectedFile) { alert('Please upload a photo first.'); return; }
    locToggle.checked = !!locationState.enabled;
    locInput.style.display = locationState.enabled ? 'block' : 'none';
    locInput.value = locationState.text || '';
    showModal(locationModal);
  });

  locCancel.addEventListener('click', () => { hideModal(locationModal); });
  locSave.addEventListener('click', () => {
    const enabled = !!locToggle.checked;
    locationState.enabled = enabled;
    locationState.text = enabled ? (locInput.value.trim() || 'Jakarta') : null;
    hideModal(locationModal);
  });

  locToggle.addEventListener('change', () => {
    if (locToggle.checked) locInput.style.display = 'block'; else locInput.style.display = 'none';
  });

  // helper: show/hide modal by toggling .show class (matches CSS)
  function showModal(el) {
    el.classList.add('show');
  }
  function hideModal(el) {
    el.classList.remove('show');
  }

  // back button
  backBtn.addEventListener('click', () => window.location.href = '/html/dashboard.html');

  // escape to close
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      hideModal(locationModal); hideModal(linksModal);
    }
  });

  // small HTML-escape
  function escapeHtml(str) {
    return String(str).replace(/[&<>"']/g, s => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[s]));
  }

  // initial run
  init();
});
