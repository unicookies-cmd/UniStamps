/* UniStamps — UI-first app.js (local only, event safe) */

(function () {
  const CFG = window.UNISTAMPS_CONFIG || {};
  const staffPin = String(CFG.staffPin || "0000");
  const maxStamps = Number(CFG.maxStamps || 10);
  const milestones = CFG.milestones || {};

  // Elements
  const screenWelcome = el("screenWelcome");
  const screenWallet = el("screenWallet");
  const screenClaim = el("screenClaim");

  const phoneInput = el("phoneInput");
  const continueBtn = el("continueBtn");
  const changePhoneBtn = el("changePhoneBtn");

  const phoneBadge = el("phoneBadge");
  const stampBtn = el("stampBtn");
  const shareBtn = el("shareBtn");
  const resetBtn = el("resetBtn");

  const stampGrid = el("stampGrid");
  const progressText = el("progressText");
  const dailyLockText = el("dailyLockText");

  const claimHeadline = el("claimHeadline");
  const claimBody = el("claimBody");
  const claimMeta = el("claimMeta");
  const verifyBtn = el("verifyBtn");
  const claimButtons = el("claimButtons");
  const claimCtaA = el("claimCtaA");
  const claimCtaB = el("claimCtaB");
  const backToWalletBtn = el("backToWalletBtn");

  const modal = el("modal");
  const pinInput = el("pinInput");
  const pinCancel = el("pinCancel");
  const pinConfirm = el("pinConfirm");
  const pinError = el("pinError");

  const toast = el("toast");

  // Storage keys (per device)
  const LS_PHONE = "unistamps_phone";
  const LS_STAMPS = "unistamps_count";
  const LS_LAST_STAMP_DATE = "unistamps_last_stamp_date"; // YYYY-MM-DD
  const LS_CLAIMS = "unistamps_claims"; // json object { "3": "YYYY-MM-DD", ... }

  // State
  let state = loadState();
  let pendingMilestone = null;

  // Init
  render();

  // ---------- Events ----------
  continueBtn.addEventListener("click", () => {
    const p = normalizePhone(phoneInput.value);
    if (!p) {
      flashToast("Enter a valid phone");
      phoneInput.focus();
      return;
    }
    state.phone = p;
    saveState();
    if (navigator.vibrate) navigator.vibrate(20);
    flashToast("Saved");
    showWallet();
  });

  changePhoneBtn.addEventListener("click", () => {
    showWelcome(true);
  });

  stampBtn.addEventListener("click", () => {
    // daily lock
    const today = todayKey();
    if (state.lastStampDate === today) {
      flashToast("Today’s stamp already received");
      if (navigator.vibrate) navigator.vibrate(12);
      return;
    }

    // increment (10 is virtual milestone; grid shows 9)
    state.stamps = clamp(state.stamps + 1, 0, maxStamps);
    state.lastStampDate = today;

    saveState();
    if (navigator.vibrate) navigator.vibrate(20);

    // Check milestone
    if (milestones[state.stamps]) {
      showClaim(state.stamps);
      return;
    }

    flashToast("Stamp received");
    renderWallet();
  });

  shareBtn.addEventListener("click", async () => {
    const msg = shareText();
    if (navigator.vibrate) navigator.vibrate(20);

    try {
      if (navigator.share) {
        await navigator.share({
          title: "UniStamps",
          text: msg,
          url: location.href
        });
        flashToast("Shared");
      } else {
        await navigator.clipboard.writeText(msg);
        flashToast("Copied");
      }
    } catch (e) {
      // silent cancel
    }
  });

  resetBtn.addEventListener("click", () => {
    const ok = confirm("Reset this device’s UniStamps? This cannot be undone.");
    if (!ok) return;
    localStorage.removeItem(LS_PHONE);
    localStorage.removeItem(LS_STAMPS);
    localStorage.removeItem(LS_LAST_STAMP_DATE);
    localStorage.removeItem(LS_CLAIMS);
    state = loadState();
    render();
    flashToast("Reset");
  });

  backToWalletBtn.addEventListener("click", () => {
    showWallet();
  });

  verifyBtn.addEventListener("click", () => {
    openPinModal();
  });

  pinCancel.addEventListener("click", closePinModal);
  modal.addEventListener("click", (e) => {
    if (e.target === modal) closePinModal();
  });

  pinConfirm.addEventListener("click", () => {
    const val = String(pinInput.value || "").trim();
    if (val !== staffPin) {
      pinError.classList.remove("hidden");
      if (navigator.vibrate) navigator.vibrate(40);
      return;
    }

    // Mark claim as verified for today (prevents repeat claim same day)
    const m = pendingMilestone;
    if (m) {
      state.claims[m] = todayKey();
      saveState();
    }

    if (navigator.vibrate) navigator.vibrate(20);
    flashToast("Confirmed");
    closePinModal();

    // If milestone is 10, reset stamps after staff confirms
    if (pendingMilestone === 10) {
      state.stamps = 0;
      state.lastStampDate = ""; // allow stamping again tomorrow
      saveState();
      showWallet();
      return;
    }

    // Return to wallet after confirmation
    showWallet();
  });

  // Optional CTA buttons for milestone 3 (UniCircle invite)
  claimCtaA.addEventListener("click", () => {
    if (navigator.vibrate) navigator.vibrate(20);
    // Placeholders: you can wire these later (Klaviyo form / signup page / QR)
    flashToast("We’ll link this later");
  });
  claimCtaB.addEventListener("click", () => {
    if (navigator.vibrate) navigator.vibrate(12);
    showWallet();
  });

  // ---------- Render ----------
  function render() {
    if (!state.phone) {
      showWelcome(false);
      return;
    }
    showWallet();
  }

  function showWelcome(prefill) {
    screenWelcome.classList.remove("hidden");
    screenWallet.classList.add("hidden");
    screenClaim.classList.add("hidden");

    // header text
    setHeader("A Moment, Just for You", "Market-only. No account. No pressure.");

    phoneInput.value = prefill ? prettyPhone(state.phone) : "";
    setTimeout(() => phoneInput.focus(), 50);
  }

  function showWallet() {
    screenWelcome.classList.add("hidden");
    screenWallet.classList.remove("hidden");
    screenClaim.classList.add("hidden");

    setHeader("A Moment, Just for You", "Market-only. No account. No pressure.");

    renderWallet();
  }

  function renderWallet() {
    phoneBadge.textContent = prettyPhone(state.phone);

    // Grid: show 9 visible stamps, while total can be 10
    stampGrid.innerHTML = "";
    const visible = 9;
    for (let i = 1; i <= visible; i++) {
      const d = document.createElement("div");
      d.className = "stamp" + (state.stamps >= i ? " on" : "");
      stampGrid.appendChild(d);
    }

    progressText.textContent = `${state.stamps} / ${maxStamps}`;

    // daily lock label + button state
    const today = todayKey();
    const locked = state.lastStampDate === today;

    dailyLockText.textContent = locked ? "Today’s stamp received" : "Return tomorrow for a new stamp";
    stampBtn.textContent = locked ? "Today’s stamp received" : "Get today’s stamp";
    stampBtn.disabled = locked;

    // If current stamps hit a milestone and not yet claimed today, gently route to claim
    if (milestones[state.stamps]) {
      const claimedDate = state.claims[state.stamps];
      if (claimedDate !== today) {
        // show claim immediately (but still needs staff verify)
        showClaim(state.stamps);
      }
    }
  }

  function showClaim(m) {
    pendingMilestone = m;

    screenWelcome.classList.add("hidden");
    screenWallet.classList.add("hidden");
    screenClaim.classList.remove("hidden");

    const data = milestones[m] || {};
    setHeader("Unlocked", "Show staff to claim this moment.");

    claimHeadline.textContent = data.title || "Unlocked";
    claimBody.textContent = (data.body || "").trim();
    claimMeta.textContent = data.rewardLabel ? data.rewardLabel : "";

    // Only show the UniCircle CTA buttons for milestone 3
    if (m === 3) {
      claimButtons.classList.remove("hidden");
      claimCtaA.textContent = data.ctaA || "I want UniCircle";
      claimCtaB.textContent = data.ctaB || "Just today’s stamp";
    } else {
      claimButtons.classList.add("hidden");
    }

    // If already verified today, don’t allow re-verify
    const today = todayKey();
    const already = state.claims[m] === today;
    verifyBtn.disabled = already;
    verifyBtn.textContent = already ? "Already confirmed today" : "Show staff to claim";
  }

  function setHeader(headline, sub) {
    const h = document.getElementById("headlineText");
    const s = document.getElementById("subheadText");
    if (h) h.textContent = headline;
    if (s) s.textContent = sub;
  }

  // ---------- Modal ----------
  function openPinModal() {
    pinError.classList.add("hidden");
    pinInput.value = "";
    modal.classList.remove("hidden");
    modal.setAttribute("aria-hidden", "false");
    setTimeout(() => pinInput.focus(), 50);
  }

  function closePinModal() {
    modal.classList.add("hidden");
    modal.setAttribute("aria-hidden", "true");
  }

  // ---------- Helpers ----------
  function el(id) {
    return document.getElementById(id);
  }

  function loadState() {
    const phone = localStorage.getItem(LS_PHONE) || "";
    const stamps = Number(localStorage.getItem(LS_STAMPS) || "0");
    const lastStampDate = localStorage.getItem(LS_LAST_STAMP_DATE) || "";
    const claimsRaw = localStorage.getItem(LS_CLAIMS) || "{}";
    let claims = {};
    try { claims = JSON.parse(claimsRaw) || {}; } catch { claims = {}; }

    return {
      phone,
      stamps: clamp(stamps, 0, maxStamps),
      lastStampDate,
      claims
    };
  }

  function saveState() {
    localStorage.setItem(LS_PHONE, state.phone || "");
    localStorage.setItem(LS_STAMPS, String(state.stamps || 0));
    localStorage.setItem(LS_LAST_STAMP_DATE, String(state.lastStampDate || ""));
    localStorage.setItem(LS_CLAIMS, JSON.stringify(state.claims || {}));
  }

  function todayKey() {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  }

  function clamp(n, a, b) {
    return Math.max(a, Math.min(b, n));
  }

  function normalizePhone(raw) {
    const digits = String(raw || "").replace(/\D/g, "");
    if (digits.length < 10) return "";
    // Keep last 10 digits for US
    return digits.slice(-10);
  }

  function prettyPhone(digits10) {
    const s = String(digits10 || "");
    if (s.length !== 10) return s;
    return `(${s.slice(0,3)}) ${s.slice(3,6)}-${s.slice(6)}`;
  }

  function flashToast(msg) {
    toast.textContent = msg;
    toast.classList.add("show");
    clearTimeout(flashToast._t);
    flashToast._t = setTimeout(() => toast.classList.remove("show"), 1400);
  }

  function shareText() {
    const c = state.stamps || 0;
    return `I just collected a UniStamp (${c}/${maxStamps}). A little moment of sweetness. Tag ${CFG.brandHandle || "@eatunicookies"}.`;
  }
})();
