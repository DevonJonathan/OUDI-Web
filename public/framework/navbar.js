class BottomNav extends HTMLElement {
    constructor() {
        super();

        const shadow = this.attachShadow({ mode: "open" });

        const wrapper = document.createElement("nav");
        wrapper.classList.add("bottom-nav");

        const active = this.getAttribute("active");

        wrapper.innerHTML = `
            <a href="/html/dashboard.html" class="nav-btn ${active === "dashboard" ? "active" : ""}">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#F08080" stroke-width="2">
                    <rect x="3" y="3" width="7" height="7" rx="1"></rect>
                    <rect x="14" y="3" width="7" height="7" rx="1"></rect>
                    <rect x="14" y="14" width="7" height="7" rx="1"></rect>
                    <rect x="3" y="14" width="7" height="7" rx="1"></rect>
                </svg>
            </a>

            <button class="nav-btn" id="uploadBtn">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#F08080" stroke-width="2">
                    <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path>
                    <circle cx="12" cy="13" r="4"></circle>
                </svg>
            </button>

            <a href="/html/challenge.html" class="nav-btn ${active === "challenge" ? "active" : ""}">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#F08080" stroke-width="2">
                    <circle cx="12" cy="12" r="10"></circle>
                    <circle cx="12" cy="12" r="6"></circle>
                    <circle cx="12" cy="12" r="2"></circle>
                </svg>
            </a>
        `;

        const style = document.createElement("style");
        style.textContent = `
            .bottom-nav {
                position: fixed;
                bottom: 0;
                left: 0;
                right: 0;
                background: white;
                display: flex;
                justify-content: space-around;
                align-items: center;
                padding: 15px 0;
                box-shadow: 0 -2px 8px rgba(0,0,0,0.1);
                z-index: 100;
                border-radius: 25px 25px 0 0;
            }

            .nav-btn {
                background: none;
                border: none;
                cursor: pointer;
                padding: 10px 20px;
                transition: transform 0.2s;
                text-decoration: none;
                display: flex;
                align-items: center;
                justify-content: center;
            }

            .nav-btn:hover {
                transform: scale(1.1);
            }

            .nav-btn.active svg circle:last-child {
                fill: #F08080;
            }
        `;

        shadow.appendChild(style);
        shadow.appendChild(wrapper);
    }

    connectedCallback() {
        const uploadBtn = this.shadowRoot.querySelector("#uploadBtn");
        if (uploadBtn) {
            uploadBtn.addEventListener("click", () => {
                // direct to upload page
                window.location.href = "/html/upload.html";
            });
        }
    }
}

customElements.define("bottom-nav", BottomNav);
