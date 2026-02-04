(function () {
  const STORAGE_KEY = "valentineAccepted";

  function showToast(el, message) {
    if (!el) return;
    el.textContent = message;
    el.classList.add("show");
    clearTimeout(showToast._t);
    showToast._t = setTimeout(() => el.classList.remove("show"), 1600);
  }

  function isAccepted() {
    return localStorage.getItem(STORAGE_KEY) === "true";
  }

  function acceptValentine() {
    localStorage.setItem(STORAGE_KEY, "true");
  }

  // -----------------------------
  // PAGE GUARD
  // -----------------------------
  const guardEnabled = document.body?.dataset?.guard === "true";
  if (guardEnabled && !isAccepted()) {
    window.location.replace("index.html");
    return;
  }

  // Optional reset link support (if you use it)
  const resetLink = document.getElementById("resetGate");
  if (resetLink) {
    resetLink.addEventListener("click", (e) => {
      e.preventDefault();
      localStorage.removeItem(STORAGE_KEY);
      window.location.replace("index.html");
    });
  }

  // -----------------------------
  // LANDING PAGE LOGIC (only if buttons exist)
  // -----------------------------
  const yesBtn = document.getElementById("yesBtn");
  let noBtn = document.getElementById("noBtn");
  const toast = document.getElementById("toast");

  // Detect “mobile-ish” (coarse pointer / touch)
  const isMobile = window.matchMedia("(pointer: coarse)").matches;

  const TOASTS_DESKTOP = [
    "Wrong answer. Try again 😌",
    "Nope.",
    "Absolutely not 💅",
    "Nice try 😈",
    "We both know the answer.",
    "Stop that 😂",
    "Try the green button, baby.",
  ];

  const TOASTS_MOBILE_TAPS = [
    "No? Interesting choice 😌",
    "Wrong button 😈",
    "Try again 👀",
    "Final answer? …nope 💅",
  ];

  let desktopIndex = 0;
  function desktopMessage() {
    const msg = TOASTS_DESKTOP[desktopIndex % TOASTS_DESKTOP.length];
    desktopIndex += 1;
    return msg;
  }

  function enterSite() {
    acceptValentine();
    showToast(toast, "Correct ✅ Entering...");
    setTimeout(() => {
      window.location.href = "message.html";
    }, 450);
  }

  // Only bind landing behaviour if the elements exist on this page
  if (yesBtn && noBtn && toast) {
    // ---- keep NO perfectly anchored (prevents “sliding” on mobile) ----
    const NO_ANCHOR = {
      left: "50%",
      top: "50%",
      transform: "translate(-50%, -50%)",
    };

    function anchorNo() {
      noBtn.style.position = "absolute";
      noBtn.style.left = NO_ANCHOR.left;
      noBtn.style.top = NO_ANCHOR.top;
      noBtn.style.transform = NO_ANCHOR.transform;
      noBtn.style.transformOrigin = "center";
    }

    function setNoVisible(visible) {
      if (visible) {
        noBtn.style.opacity = "1";
        noBtn.style.visibility = "visible";
        noBtn.style.pointerEvents = "auto";
        anchorNo();
      } else {
        noBtn.style.opacity = "0";
        noBtn.style.visibility = "hidden";
        noBtn.style.pointerEvents = "none";
      }
    }

    // Convert NO -> YES (mobile)
    function convertNoToYes() {
      setNoVisible(true);

      noBtn.textContent = "Yes 🖤";
      noBtn.classList.remove("btn-no");
      noBtn.classList.add("btn-yes");

      // Clone to drop old handlers cleanly
      const clone = noBtn.cloneNode(true);
      noBtn.parentNode.replaceChild(clone, noBtn);
      noBtn = clone;

      // Keep it anchored in the same spot (no movement)
      anchorNo();

      // Wire as YES
      noBtn.addEventListener("click", (e) => {
        e.preventDefault();
        enterSite();
      });
      noBtn.addEventListener("pointerdown", (e) => {
        e.preventDefault();
        enterSite();
      });

      showToast(toast, "Okay fine. YES it is 🖤");
    }

    // -----------------------------
    // DESKTOP: NO vanishes when approached
    // -----------------------------
    if (!isMobile) {
      const SAFE_DISTANCE = 170;
      const MOVE_COOLDOWN_MS = 60;
      let lastMove = 0;
      let hidden = false;

      function setNoVisibleDesktop(visible) {
        if (visible) {
          noBtn.style.opacity = "1";
          noBtn.style.visibility = "visible";
          noBtn.style.pointerEvents = "auto";
          hidden = false;
        } else {
          noBtn.style.opacity = "0";
          noBtn.style.visibility = "hidden";
          noBtn.style.pointerEvents = "none";
          hidden = true;
        }
      }

      function escapeNo() {
        setNoVisibleDesktop(false);
        showToast(toast, desktopMessage());
      }

      function tryReappear(e) {
        if (!hidden) return;
        const r = noBtn.getBoundingClientRect();
        const buffer = 18;
        const over =
          e.clientX >= r.left - buffer &&
          e.clientX <= r.right + buffer &&
          e.clientY >= r.top - buffer &&
          e.clientY <= r.bottom + buffer;

        if (!over) setNoVisibleDesktop(true);
      }

      document.addEventListener("mousemove", (e) => {
        const now = Date.now();
        if (now - lastMove < MOVE_COOLDOWN_MS) return;
        lastMove = now;

        if (hidden) {
          tryReappear(e);
          return;
        }

        const rect = noBtn.getBoundingClientRect();
        const cx = rect.left + rect.width / 2;
        const cy = rect.top + rect.height / 2;
        const dx = e.clientX - cx;
        const dy = e.clientY - cy;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < SAFE_DISTANCE) escapeNo();
      });

      noBtn.addEventListener("mouseenter", escapeNo);
      noBtn.addEventListener("click", (e) => {
        e.preventDefault();
        escapeNo();
      });
    }

    // -----------------------------
    // MOBILE: allow 4 taps, NO disappears briefly, then returns;
    // on tap 4 converts to YES.
    // -----------------------------
    if (isMobile) {
      let noTaps = 0;
      let coolingDown = false;
      const DISAPPEAR_MS = 650;

      window.addEventListener("load", () => {
        anchorNo();
        setNoVisible(true);
      });

      noBtn.addEventListener("pointerdown", (e) => {
        e.preventDefault();
        e.stopPropagation();

        if (coolingDown) return;
        coolingDown = true;

        try { noBtn.blur(); } catch (_) {}

        setNoVisible(false);

        noTaps += 1;

        showToast(
          toast,
          TOASTS_MOBILE_TAPS[Math.min(noTaps - 1, TOASTS_MOBILE_TAPS.length - 1)]
        );

        setTimeout(() => {
          if (noTaps >= 4) {
            convertNoToYes();
          } else {
            setNoVisible(true);
          }
          coolingDown = false;
        }, DISAPPEAR_MS);
      });

      noBtn.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
      });
    }

    // -----------------------------
    // YES: always enters
    // -----------------------------
    yesBtn.addEventListener("click", (e) => {
      e.preventDefault();
      enterSite();
    });

    yesBtn.addEventListener("pointerdown", (e) => {
      if (isMobile) {
        e.preventDefault();
        enterSite();
      }
    });
  }

  // =========================================================
  // GALLERY: Build carousel slides + indicators (01.jpeg -> 40.jpeg)
  // Runs ONLY if gallery elements exist (no inline JS needed)
  // =========================================================
  const carouselInner = document.getElementById("carouselInner");
  const carouselIndicators = document.getElementById("carouselIndicators");

  if (carouselInner && carouselIndicators) {
    const photos = Array.from({ length: 40 }, (_, i) => {
      const n = String(i + 1).padStart(2, "0");
      return `assets/images/${n}.jpeg`;
    });

    photos.forEach((src, i) => {
      const ind = document.createElement("button");
      ind.type = "button";
      ind.dataset.bsTarget = "#photoCarousel";
      ind.dataset.bsSlideTo = String(i);
      ind.setAttribute("aria-label", `Slide ${i + 1}`);
      if (i === 0) ind.classList.add("active");
      carouselIndicators.appendChild(ind);

      const item = document.createElement("div");
      item.className = `carousel-item${i === 0 ? " active" : ""}`;

      const img = document.createElement("img");
      img.src = src;
      img.alt = `Photo ${i + 1}`;
      img.loading = i < 2 ? "eager" : "lazy";
      img.className = "d-block w-100";

      item.appendChild(img);
      carouselInner.appendChild(item);
    });
  }
})();
