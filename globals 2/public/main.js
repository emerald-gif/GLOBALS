console.log("main.js is working");




// Firebase config & inits
const firebaseConfig = {
  apiKey: "AIzaSyCuI_Nw4HMbDWa6wR3FhHJMHOUgx53E40c",
  authDomain: "globals-17bf7.firebaseapp.com",
  projectId: "globals-17bf7",
  storageBucket: "globals-17bf7.appspot.com",
  messagingSenderId: "603274362994",
  appId: "1:603274362994:web:c312c10cf0a42938e882eb"
};

firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore(); 








// Handle tab switching
const tabBtns = document.querySelectorAll('.tab-btn');
const tabContents = document.querySelectorAll('.tab-content');

tabBtns.forEach((btn) => {
  btn.addEventListener('click', () => {
    tabBtns.forEach(b => b.classList.remove('active'));
    tabContents.forEach(tc => tc.classList.add('hidden'));

    btn.classList.add('active');
    document.getElementById(btn.dataset.tab).classList.remove('hidden');
  });
});






                                           // AUTH CHECK AND DISPLAY USER INFO / ME NAV BAR INFO

auth.onAuthStateChanged(async (user) => {
  if (!user) return window.location.href = "login.html";

  const uid = user.uid;
  const userDoc = await db.collection("users").doc(uid).get();
  const data = userDoc.data();

  // Display data
  document.getElementById("userId").value = uid;
  document.getElementById("editUsername").value = data.username || "";
  document.getElementById("fullName").value = data.fullName || "";
  document.getElementById("editEmail").value = data.email || "";
  document.getElementById("phoneNumber").value = data.phone || "";
  document.getElementById("refLinkDisplay").value = `https://globalstasks.name.ng/signup.html?ref=${data.username}`;
  document.getElementById("joinDate").value = new Date(user.metadata.creationTime).toLocaleDateString();

  // Profile picture
  const pic = document.getElementById("profilePicPreview");
  if (data.profilePicture) pic.src = data.profilePicture;
});

// Copy to clipboard helper
window.copyToClipboard = function (id) {
  const input = document.getElementById(id);
  if (!input) return;
  navigator.clipboard.writeText(input.value).then(() => alert("Copied!"));
};





// ✅ TOP NAV FUNCTION USERNAMES (reactive)
// ✅ TOP NAV FUNCTION USERNAMES (NO LIVE FETCH, one-time load)
firebase.auth().onAuthStateChanged(async function (user) {
  const navbarGreeting = document.getElementById("navbarGreeting");
  if (!navbarGreeting) return;

  if (!user) {
    navbarGreeting.textContent = "Hello Guest 👋";
    return;
  }

  const uid = user.uid;

  try {
    const doc = await firebase.firestore().collection("users").doc(uid).get();

    if (!doc.exists) {
      navbarGreeting.textContent = "Hello Guest 👋";
      return;
    }

    const userData = doc.data();
    const username = (typeof userData.username === "string" && userData.username.trim().length > 0)
      ? userData.username.trim()
      : "Guest";

    // ✅ Clear old content first
    navbarGreeting.textContent = "";

    // "Hello " text
    navbarGreeting.appendChild(document.createTextNode("Hello "));

    // Bold username
    const nameSpan = document.createElement("span");
    nameSpan.className = "font-semibold";
    nameSpan.textContent = username;
    navbarGreeting.appendChild(nameSpan);

    // ✅ Show verified badge or 👋 emoji
    if (userData.is_Premium === true) {
      const img = document.createElement("img");
      img.src = "VERIFIED.jpg";
      img.alt = "Verified";
      img.className = "w-4 h-4 ml-1 inline-block align-middle object-contain";
      img.onerror = () => { img.style.display = "none"; };
      navbarGreeting.appendChild(img);
    } else {
      navbarGreeting.appendChild(document.createTextNode(" 👋"));
    }

  } catch (err) {
    console.error("Error fetching user data:", err);
    navbarGreeting.textContent = "Hello Guest 👋";
  }
});

























		


     // ✅ GLOBALS GENERAL ALERT


(function(){
  const modal = document.getElementById("globalsModal");
  const titleEl = document.getElementById("globalsModalTitle");
  const msgEl = document.getElementById("globalsModalMessage");
  const actionsEl = document.getElementById("globalsModalActions");

  function openModal(title, message, buttons) {
    titleEl.textContent = title || "Notice";
    msgEl.textContent = message || "";
    actionsEl.innerHTML = "";
    buttons.forEach(btn => {
      const b = document.createElement("button");
      b.textContent = btn.label;
      b.style.cssText = `
        background: linear-gradient(135deg, #FFC107, #FF9800);
        border: none; color: #fff; font-weight: 600; border-radius: 10px;
        padding: 8px 18px; cursor: pointer; font-size: 14px;
        box-shadow: 0 3px 8px rgba(0,0,0,0.2);
      `;
      b.onclick = () => { modal.style.display="none"; btn.action(); };
      actionsEl.appendChild(b);
    });
    modal.style.display = "flex";
  }

  // Override default alert
  window.alert = function(message) {
    return new Promise(resolve => {
      openModal("Notice", message, [{label:"OK", action:resolve}]);
    });
  };

  // Override default confirm
  window.confirm = function(message) {
    return new Promise(resolve => {
      openModal("Confirm", message, [
        {label:"Cancel", action:()=>resolve(false)},
        {label:"OK", action:()=>resolve(true)}
      ]);
    });
  };

  // Override default prompt
  window.prompt = function(message, defaultValue="") {
    return new Promise(resolve => {
      msgEl.innerHTML = `<div style="margin-bottom:12px;">${message}</div>
        <input id='globalsPromptInput' value='${defaultValue}' style="
          width: 100%; padding: 8px; border:1px solid #ccc; border-radius:8px;" />`;
      actionsEl.innerHTML = "";
      const inputBox = () => document.getElementById("globalsPromptInput").value;
      actionsEl.appendChild(Object.assign(document.createElement("button"), {
        textContent: "Cancel",
        style: "background:#ccc;color:#000;padding:8px 18px;border:none;border-radius:8px;cursor:pointer;",
        onclick: ()=>{ modal.style.display="none"; resolve(null); }
      }));
      actionsEl.appendChild(Object.assign(document.createElement("button"), {
        textContent: "OK",
        style: "background: linear-gradient(135deg, #FFC107, #FF9800);color:#fff;padding:8px 18px;border:none;border-radius:8px;cursor:pointer;",
        onclick: ()=>{ modal.style.display="none"; resolve(inputBox()); }
      }));
      modal.style.display="flex";
    });
  };

})();








// ==== Cloudinary Global Config ====
const CLOUD_NAME = "dyquovrg3"; // Your Cloudinary cloud name
const UPLOAD_PRESET = "globals_tasks_proofs"; // Default upload preset

// ==== Universal Upload Function ====
async function uploadToCloudinary(file, preset = UPLOAD_PRESET) {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", preset);

    try {
        const cloudRes = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`, {
            method: "POST",
            body: formData
        });
        const cloudData = await cloudRes.json();
        if (cloudData.secure_url) {
            return cloudData.secure_url;
        } else {
            throw new Error(cloudData.error?.message || "Unknown Cloudinary error");
        }
    } catch (error) {
        console.error("Cloudinary upload error:", error);
        throw error;
    }
}







// ---------- TRANSACTION HISTORY ----------




/* ==========================
   TRANSACTIONS (Static One-Time Fetch Version)
   ========================== */




/* ==========================
   TRANSACTIONS (Static Fetch Only)
   ========================== */

let transactionsCache = [];
let activeCollectionName = null;

const txListEl = document.getElementById("transactions-list");
const txEmptyEl = document.getElementById("transactions-empty");
const categoryEl = document.getElementById("category-filter");
const statusEl = document.getElementById("status-filter");

/* ---------- Helpers ---------- */
function parseTimestamp(val) {
  if (!val) return null;
  if (typeof val === "object" && typeof val.toDate === "function") return val.toDate();
  if (val instanceof Date) return val;
  if (typeof val === "number") return new Date(val);
  if (typeof val === "string") {
    const d = new Date(val);
    return isNaN(d.getTime()) ? null : d;
  }
  return null;
}

function formatDatePretty(d) {
  if (!d) return "No Timestamp";
  return d.toLocaleString();
}

function formatAmount(amount) {
  const n = Number(amount || 0);
  return `₦${n.toFixed(2)}`;
}

/* ---------- Render Cards ---------- */
function cardHtml(tx) {
  const ts = parseTimestamp(tx.timestamp || tx.createdAt || tx.time);
  const amountClass =
    tx.status === "successful"
      ? "text-green-600"
      : tx.status === "failed"
      ? "text-red-600"
      : "text-yellow-600";

  return `
    <div class="cursor-pointer bg-white rounded-2xl p-4 shadow-sm hover:shadow-md transition"
         onclick="openTransactionDetails('${tx.id || ""}')">
      <div class="flex items-center justify-between">
        <div>
          <p class="text-sm font-semibold text-gray-900">${tx.type || "Unknown"}</p>
          <p class="text-xs text-gray-400 mt-1">${formatDatePretty(ts)}</p>
        </div>
        <div class="text-right">
          <p class="text-base font-bold ${amountClass}">${formatAmount(tx.amount)}</p>
          <span class="inline-block mt-1 px-2 py-0.5 text-xs rounded-full ${amountClass} bg-opacity-10">
            ${tx.status || "—"}
          </span>
        </div>
      </div>
    </div>
  `;
}

function renderTransactions(list) {
  if (!txListEl || !txEmptyEl) return;
  if (!list.length) {
    txListEl.innerHTML = "";
    txEmptyEl.classList.remove("hidden");
    return;
  }
  txEmptyEl.classList.add("hidden");
  txListEl.innerHTML = list.map(tx => cardHtml(tx)).join("");
}

/* ---------- Open Details ---------- */
function openTransactionDetails(id) {
  const tx = transactionsCache.find(t => t.id === id);
  if (!tx) return;

  const ts = parseTimestamp(tx.timestamp || tx.createdAt || tx.time);
  const amountClass =
    tx.status === "successful"
      ? "text-green-600"
      : tx.status === "failed"
      ? "text-red-600"
      : "text-yellow-600";

  // Extra info for Withdraw type
  let extraHTML = "";
  if ((tx.type || "").toLowerCase() === "withdraw") {
    extraHTML = `
      <div class="border-t pt-4 mt-4 space-y-2">
        <h3 class="font-semibold text-gray-800 text-sm">Bank Details</h3>
        <div class="flex justify-between text-sm"><span>Bank:</span><span>${tx.bankName || "—"}</span></div>
        <div class="flex justify-between text-sm"><span>Account Name:</span><span>${tx.account_name || "—"}</span></div>
        <div class="flex justify-between text-sm"><span>Account Number:</span><span>${tx.accNum || "—"}</span></div>
      </div>
    `;
  }

  document.getElementById("transaction-details-content").innerHTML = `
    <div class="bg-white rounded-2xl p-6 shadow space-y-3 border-t-4 border-blue-600">
      <div class="flex justify-between"><span class="font-medium text-gray-700">Type</span><span>${tx.type}</span></div>
      <div class="flex justify-between"><span class="font-medium text-gray-700">Amount</span><span class="font-semibold ${amountClass}">${formatAmount(tx.amount)}</span></div>
      <div class="flex justify-between"><span class="font-medium text-gray-700">Status</span><span>${tx.status}</span></div>
      <div class="flex justify-between"><span class="font-medium text-gray-700">Date</span><span>${formatDatePretty(ts)}</span></div>
      <div class="flex justify-between"><span class="font-medium text-gray-700">Transaction ID</span><span>${tx.id}</span></div>
      ${extraHTML}
    </div>
  `;

  activateTab("transaction-details-screen");
}

/* ---------- Fetch once ---------- */
async function fetchTransactionsOnce(uid) {
  const candidates = ["Transaction", "transaction", "transactions", "Transactions"];
  for (const coll of candidates) {
    try {
      const snap = await firebase.firestore()
        .collection(coll)
        .where("userId", "==", uid)
        .orderBy("timestamp", "desc")
        .get();

      if (!snap.empty) {
        activeCollectionName = coll;
        transactionsCache = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        renderTransactions(transactionsCache);
        return;
      }
    } catch (e) {
      console.error("Failed for", coll, e);
    }
  }
  txListEl.innerHTML = `<p class="text-center p-6 text-red-500">No transactions found.</p>`;
}

/* ---------- Filters ---------- */
function applyFiltersClient(category, status) {
  let filtered = transactionsCache.slice();
  if (category && category !== "All") {
    filtered = filtered.filter(tx => (tx.type || "").toLowerCase() === category.toLowerCase());
  }
  if (status && status !== "All") {
    filtered = filtered.filter(tx => (tx.status || "").toLowerCase() === status.toLowerCase());
  }
  renderTransactions(filtered);
}

/* ---------- Init ---------- */
function initTransactionSection() {
  const user = firebase.auth().currentUser;
  if (!user) {
    firebase.auth().onAuthStateChanged(u => u && fetchTransactionsOnce(u.uid));
  } else {
    fetchTransactionsOnce(user.uid);
  }

  if (categoryEl) categoryEl.onchange = () =>
    applyFiltersClient(categoryEl.value, statusEl?.value || "All");
  if (statusEl) statusEl.onchange = () =>
    applyFiltersClient(categoryEl?.value || "All", statusEl.value);
}

if (window.registerPage) {
  window.registerPage("transactions-screen", initTransactionSection);
} else {
  initTransactionSection();
}











                             // PAYMENT PIN 





/* ---------- PIN MODULE (drop into main.js, remove old pin code) ---------- */

let currentInput = "new"; // old | new | confirm
let pinValues = { old: "", new: "", confirm: "" };

// We'll keep a global unsubscribe so we don't attach many listeners by accident
window.__pinUnsub = window.__pinUnsub || null;

// ---------- Helper: update DOM based on server doc ----------
function updatePinUIFromDoc(data) {
  const hasPin = data && typeof data.pin === "string" && data.pin.length === 6;
  const titleEl = document.getElementById("pinTabTitle");
  const oldGroup = document.getElementById("oldPinGroup");
  const actionBtn = document.getElementById("pinActionBtn");

  if (!titleEl || !actionBtn) {
    console.warn("[PIN] Missing required DOM elements (pinTabTitle / pinActionBtn).");
    return;
  }

  if (hasPin) {
    titleEl.innerText = "Change Payment PIN";
    if (oldGroup) oldGroup.classList.remove("hidden");
    actionBtn.innerText = "Update PIN";

    // If user hasn't started typing anything, default focus to old PIN
    if (!pinValues.old && !pinValues.new && !pinValues.confirm) {
      setInput("old");
    }
  } else {
    titleEl.innerText = "Set Payment PIN";
    if (oldGroup) oldGroup.classList.add("hidden");
    actionBtn.innerText = "Set PIN";

    if (!pinValues.new && !pinValues.confirm) setInput("new");
  }

  // Update the dots to reflect whatever the local pinValues currently are.
  updatePinDisplay();
}

// ---------- Attach auth + real-time listener ----------
firebase.auth().onAuthStateChanged(async (user) => {
  // detach old listener if any
  if (window.__pinUnsub) {
    try { window.__pinUnsub(); } catch(e){/* ignore */ }
    window.__pinUnsub = null;
  }

  if (!user) {
    console.log("[PIN] No user logged in.");
    return;
  }

  window.userRef = db.collection("users").doc(user.uid);

  // Attach snapshot so UI ALWAYS reflects server doc changes immediately
  window.__pinUnsub = window.userRef.onSnapshot(doc => {
    console.log("[PIN] onSnapshot:", doc.exists ? doc.data() : null);
    updatePinUIFromDoc(doc.exists ? doc.data() : null);
  }, err => {
    console.error("[PIN] snapshot error:", err);
  });

  // Quick initial fetch (onSnapshot usually calls immediately but do this for safety)
  const doc = await window.userRef.get();
  updatePinUIFromDoc(doc.exists ? doc.data() : null);
});

// ---------- Save (uses transaction to prevent race/stale old-pin checks) ----------
async function savePin() {
  if (!window.userRef) { alert("User not ready. Try again."); return; }

  const oldPin = pinValues.old;
  const newPin = pinValues.new;
  const confirmPin = pinValues.confirm;

  if (newPin.length < 6) { alert("PIN must be 6 digits"); return; }
  if (newPin !== confirmPin) { alert("PINs do not match"); return; }

  try {
    await db.runTransaction(async (transaction) => {
      const snap = await transaction.get(window.userRef);
      const data = snap.exists ? snap.data() : {};
      const hasPin = data && typeof data.pin === "string" && data.pin.length === 6;

      if (hasPin) {
        // verify old pin inside transaction (atomic)
        if (oldPin !== data.pin) {
          // Throw a specific error we can catch below
          const err = new Error("OLD_PIN_MISMATCH");
          err.code = "OLD_PIN_MISMATCH";
          throw err;
        }
        transaction.update(window.userRef, { pin: newPin });
      } else {
        transaction.set(window.userRef, { pin: newPin }, { merge: true });
      }
    });

    console.log("[PIN] Transaction saved.");

    // clear local inputs (UI will reflect server via snapshot)
    pinValues = { old: "", new: "", confirm: "" };
    updatePinDisplay();

    // Ensure UI shows Change mode immediately
    setInput("old");
    // go back to Me tab
    activateTab('me');

    alert("PIN saved successfully!");
  } catch (err) {
    console.error("[PIN] save error:", err);
    if (err && err.code === "OLD_PIN_MISMATCH") {
      alert("Old PIN is incorrect");
    } else {
      alert("Failed to save PIN. Try again.");
    }
  }
}

// ---------- Keypad handlers (single, canonical definitions) ----------
function pressKey(num) {
  if (!currentInput) return;
  if (pinValues[currentInput].length < 6) {
    pinValues[currentInput] += num;
    updatePinDisplay();

    // Auto-advance when field is full
    if (pinValues[currentInput].length === 6) {
      if (currentInput === "old") setInput("new");
      else if (currentInput === "new") setInput("confirm");
      else if (currentInput === "confirm") {
        // optional: auto-save when confirm completes
        // savePin();
      }
    }
  }
}

function deleteKey() {
  if (!currentInput) return;
  if (pinValues[currentInput].length > 0) {
    pinValues[currentInput] = pinValues[currentInput].slice(0, -1);
    updatePinDisplay();
  } else {
    // If empty, move focus back to previous field
    if (currentInput === "confirm") setInput("new");
    else if (currentInput === "new") setInput("old");
  }
}

// ---------- Visual dots update ----------
function updatePinDisplay() {
  ["old", "new", "confirm"].forEach(type => {
    const display = document.getElementById(type + "PinDisplay");
    if (!display) return;
    [...display.children].forEach((dot, i) => {
      dot.classList.remove("bg-gray-800", "bg-gray-200");
      dot.classList.add("rounded-full");
      if (pinValues[type][i]) {
        dot.classList.add("bg-gray-800");
      } else {
        dot.classList.add("bg-gray-200");
      }
    });
  });
}

// ---------- focus / highlight a field ----------
function setInput(type) {
  currentInput = type;
  ["old", "new", "confirm"].forEach(t => {
    const el = document.getElementById(t + "PinDisplay");
    if (!el) return;
    if (t === type) {
      el.classList.add("border-blue-500", "bg-blue-50", "shadow-sm");
    } else {
      el.classList.remove("border-blue-500", "bg-blue-50", "shadow-sm");
    }
  });
}

// ---------- open tab helper ----------
function openPinTab() {
  // Activate tab UI
  activateTab('pinTab');

  // Force a one-time read so UI is correct immediately
  if (window.userRef) {
    window.userRef.get().then(doc => updatePinUIFromDoc(doc.exists ? doc.data() : null));
  }
}

/* ---------- End PIN MODULE ---------- */







// PAYMENT Detect user on reload FUNCTION

// Detect user on reload
firebase.auth().onAuthStateChanged(async (user) => {
  if (user) {
    const userId = user.uid;
    const userRef = db.collection("users").doc(userId);
    const doc = await userRef.get();

    // If no PIN → show intro sheet
    if (!doc.exists || !doc.data().pin) {
      showPinIntro();
    }
  }
});

// Show sheet function
function showPinIntro() {
  const overlay = document.getElementById("pinIntroSheet");
  const drawer = document.getElementById("pinIntroDrawer");
  overlay.classList.remove("hidden");
  setTimeout(() => {
    drawer.classList.remove("translate-y-full");
  }, 50);
}

// Hide sheet function
function closePinIntro() {
  const overlay = document.getElementById("pinIntroSheet");
  const drawer = document.getElementById("pinIntroDrawer");
  drawer.classList.add("translate-y-full");
  setTimeout(() => {
    overlay.classList.add("hidden");
  }, 300);
}

// Hide + go to pin tab
function goToPinSetup() {
  closePinIntro();
  setTimeout(() => openPinTab(), 300); // 🚀 send to PIN setup screen
}







                    /* main.js — Upload Drawer auto-integration */


/* Robust drawer integration — aggressive trigger + debug
   Paste into main.js. Requires the drawer HTML to exist (ids used below).
*/
(function () {
  const DEBUG = true; // set false to silence logs
  const log = (...args) => { if (DEBUG) console.log('[drawer]', ...args); };

  // Elements (must match your HTML)
  const overlay = document.getElementById('uploadOverlay');
  const sheet = overlay?.querySelector('.upload-sheet');
  const closeBtn = document.getElementById('uploadCloseBtn');
  const cameraBtn = document.getElementById('uploadCameraBtn');
  const galleryBtn = document.getElementById('uploadGalleryBtn');
  const fileInputCamera = document.getElementById('fileInputCamera');
  const fileInputGallery = document.getElementById('fileInputGallery');

  if (!overlay || !sheet || !fileInputCamera || !fileInputGallery) {
    console.error('[drawer] Required drawer DOM nodes missing. Make sure HTML snippet is present.');
    return;
  }

  let currentOriginalInput = null;
  let previouslyFocused = null;

  function openUploadDrawer(originalInput = null) {
    currentOriginalInput = originalInput;
    previouslyFocused = document.activeElement;
    overlay.setAttribute('data-open', 'true');
    overlay.setAttribute('aria-hidden', 'false');
    // focus first focusable for a11y
    setTimeout(() => {
      const btn = sheet.querySelector('button, [tabindex]:not([tabindex="-1"])');
      if (btn) btn.focus();
    }, 50);
    document.documentElement.style.overflow = 'hidden';
    document.body.style.overflow = 'hidden';
    log('opened drawer for', originalInput);
  }

  function closeUploadDrawer() {
    overlay.setAttribute('data-open', 'false');
    overlay.setAttribute('aria-hidden', 'true');
    document.documentElement.style.overflow = '';
    document.body.style.overflow = '';
    if (previouslyFocused && previouslyFocused.focus) previouslyFocused.focus();
    log('closed drawer');
  }

  // close handlers
  closeBtn.addEventListener('click', closeUploadDrawer);
  overlay.addEventListener('pointerdown', (e) => { if (e.target === overlay) closeUploadDrawer(); });

  // when camera/gallery buttons pressed — open hidden inputs
  cameraBtn.addEventListener('click', () => { fileInputCamera.value = ''; fileInputCamera.click(); });
  galleryBtn.addEventListener('click', () => { fileInputGallery.value = ''; fileInputGallery.click(); });

  // Helper: dispatch native + jQuery events
  function dispatchEventsOnInput(input) {
    if (!input) return;
    try {
      input.dispatchEvent(new Event('input', { bubbles: true }));
      input.dispatchEvent(new Event('change', { bubbles: true }));
      log('dispatched input & change events on original input');
    } catch (err) {
      log('error dispatching standard events', err);
    }
    try {
      if (window.jQuery) {
        window.jQuery(input).trigger('input').trigger('change');
        log('triggered jQuery input/change');
      }
    } catch (e) { /* ignore */ }
  }

  // Attempt: find and click an "upload" button related to original input
  function tryClickUploadButton(originalInput) {
    if (!originalInput) return false;
    try {
      // 1) search within same form
      const form = originalInput.closest('form');
      if (form) {
        // common selectors
        const selectors = [
          'button[type=submit]',
          'input[type=submit]',
          '.upload-btn',
          '.btn-upload',
          '.submit-upload',
          '[data-upload]',
          '[data-action="upload"]'
        ];
        for (const sel of selectors) {
          const btn = form.querySelector(sel);
          if (btn) { btn.click(); log('clicked upload button inside form', btn); return true; }
        }
      }

      // 2) search nearby siblings / parent container
      const container = originalInput.closest('[data-upload-area]') || originalInput.parentElement;
      if (container) {
        const btn = container.querySelector('.upload-btn, .btn-upload, button[data-upload], [data-upload]');
        if (btn) { btn.click(); log('clicked nearby upload button', btn); return true; }
      }

      // 3) global fallback: look for first button with matching text
      const textRegex = /(upload|send|submit|save|post|attach)/i;
      const candidates = Array.from(document.querySelectorAll('button, input[type=button], a'))
        .filter(el => el.innerText && textRegex.test(el.innerText));
      if (candidates.length) {
        candidates[0].click();
        log('clicked global text-match upload button', candidates[0]);
        return true;
      }
    } catch (err) {
      log('error trying to click upload button', err);
    }
    return false;
  }

  // Attempt to call common global upload helpers
  function tryCallGlobalUploadHelpers(file, originalInput) {
    const names = [
      'uploadToCloudinary','cloudinaryUpload','uploadImage','uploadFile',
      'handleFileUpload','onFileSelected','sendFile','startUpload'
    ];
    let called = false;
    for (const name of names) {
      try {
        const fn = window[name];
        if (typeof fn === 'function') {
          try {
            fn(file, originalInput);
            log('called global upload helper', name);
            called = true;
            // don't break — there may be multiple helpers in some apps
          } catch (err) {
            log('error calling global helper', name, err);
          }
        }
      } catch (e) { /* ignore */ }
    }
    return called;
  }

  // Core handler when user picks a file in the drawer hidden inputs
  async function handleFileSelection(ev, source) {
    const file = ev.target.files && ev.target.files[0];
    if (!file) { log('no file selected'); return; }
    log('file chosen from', source, file);

    // Close UI
    closeUploadDrawer();

    // 1) Try DataTransfer injection (best effort)
    let injected = false;
    if (currentOriginalInput && currentOriginalInput.tagName === 'INPUT' && currentOriginalInput.type === 'file') {
      try {
        const dt = new DataTransfer();
        dt.items.add(file);
        currentOriginalInput.files = dt.files;
        injected = true;
        log('DataTransfer injection success');
      } catch (err) {
        log('DataTransfer injection failed', err);
      }
    } else {
      log('No suitable original file input to inject into (currentOriginalInput)', currentOriginalInput);
    }

    // 2) Always attach handy references so app code can read them if needed
    try {
      if (currentOriginalInput) {
        currentOriginalInput._drawerFile = file;
        currentOriginalInput.dataset.drawerBlobUrl = URL.createObjectURL(file);
        log('attached _drawerFile and dataset.drawerBlobUrl to original input');
      }
    } catch (e) { /* ignore */ }

    // 3) Dispatch input & change (and jQuery) so normal listeners run
    if (injected) {
      dispatchEventsOnInput(currentOriginalInput);
    } else {
      // If injection failed, still dispatch events (some libraries don't require input.files)
      dispatchEventsOnInput(currentOriginalInput);
    }

    // 4) Try to click a likely upload/submit button in the form/container
    const clicked = tryClickUploadButton(currentOriginalInput);
    if (clicked) { log('attempted click on upload button to kickstart uploader'); }

    // 5) Try calling any global upload helper functions (if your app exposes them)
    const calledHelper = tryCallGlobalUploadHelpers(file, currentOriginalInput);
    if (calledHelper) log('called one or more global helper functions');

    // 6) Emit a custom event to allow your code to listen specifically for drawer selections
    const detail = { file, source, originalInput: currentOriginalInput, injected };
    try {
      if (currentOriginalInput) {
        currentOriginalInput.dispatchEvent(new CustomEvent('drawer-file-selected', { detail, bubbles: true }));
        log('dispatched drawer-file-selected on original input');
      }
      window.dispatchEvent(new CustomEvent('drawer-file-selected', { detail }));
      log('dispatched drawer-file-selected on window');
    } catch (err) { log('error dispatching custom events', err); }

    // 7) If none of the above seemed to trigger uploader, print guidance
    setTimeout(() => {
      log('DONE: if your uploader did not start, please copy console logs and send them. ' +
          'Also paste the snippet of your Cloudinary upload function and I will wire it directly.');
    }, 60);
  }

  fileInputCamera.addEventListener('change', (e) => handleFileSelection(e, 'camera'));
  fileInputGallery.addEventListener('change', (e) => handleFileSelection(e, 'gallery'));

  /* Intercept clicks on file inputs, labels, and common upload triggers.
     This attempts to find the "real" input when clicking labels/buttons.
  */
  const CLICK_SELECTOR = [
    'input[type=file]',
    'label[for]',
    '.browse-file-btn',
    '.custom-upload-trigger',
    '.upload-trigger',
    '.choose-file',
    '.btn-choose-file',
    '[data-upload-trigger]'
  ].join(',');

  document.addEventListener('click', (ev) => {
    // skip inside drawer
    if (overlay.contains(ev.target)) return;

    const trigger = ev.target.closest(CLICK_SELECTOR);
    if (!trigger) return;

    ev.preventDefault();
    ev.stopPropagation();

    // try to resolve the original <input type=file>
    let originalInput = null;
    if (trigger.matches('input[type=file]')) originalInput = trigger;
    else if (trigger.matches('label[for]')) {
      const id = trigger.getAttribute('for');
      if (id) originalInput = document.getElementById(id);
    } else {
      originalInput = trigger.querySelector('input[type=file]') || trigger.closest('form')?.querySelector('input[type=file]') || document.querySelector('input[type=file]');
      // also support data-target
      if (!originalInput) {
        const targetSel = trigger.dataset.target || trigger.getAttribute('data-target');
        if (targetSel) {
          originalInput = document.querySelector(targetSel) || document.getElementById(targetSel.replace('#', ''));
        }
      }
    }

    openUploadDrawer(originalInput);
  });

  // Expose open/close to global in case you want to open programmatically
  window.openUploadDrawer = openUploadDrawer;
  window.closeUploadDrawer = closeUploadDrawer;

  // Helpful: quick bridge you can paste in console if you want:
  // window.addEventListener('drawer-file-selected', e => console.log('drawer-file-selected detail:', e.detail));

  log('drawer integration loaded');
})();



                                                                 //OVERVIEW SECTION (ME SECTION) FUNCTION










                                                            // GLOBALS CHAT ASSISTANT LOGIC


















                                              // 🔄 Load and display selected language on page load(LANGUAGE SECTION)











                                                                    //MYSTERY BOX FUCTION

















                                   // PREMIUM FUNCTION 1






                      
                                   // PREMIUM FUNCTION 2

// IDs of sections that require premium




/* ==========================
   PREMIUM UPGRADE MODULE (One-Time Fetch Version)
   ========================== */

const premiumRequiredSections = [
  "whatsapp-task",
  "tiktok-task",
  "checkin-btn",
  "aiHelpCenter",
  "taskSection"
];

firebase.auth().onAuthStateChanged(async (user) => {
  if (!user) return;
  const currentUserId = user.uid;
  const userRef = firebase.firestore().collection("users").doc(currentUserId);
  const goPremiumBtn = document.querySelector(".go-premium-btn");

  /* ---------- Check & Set Button State Once ---------- */
  try {
    const docSnap = await userRef.get();
    if (docSnap.exists) {
      const userData = docSnap.data();
      if (userData.is_Premium) {
        if (goPremiumBtn) {
          goPremiumBtn.innerText = "👑 Premium Active";
          goPremiumBtn.disabled = true;
          goPremiumBtn.style.opacity = "0.7";
        }
      } else {
        if (goPremiumBtn) {
          goPremiumBtn.innerText = "👑 Go Premium";
          goPremiumBtn.disabled = false;
          goPremiumBtn.style.opacity = "1";
        }
      }
    }
  } catch (err) {
    console.error("Error checking premium state:", err);
  }

  /* ---------- Handle Go Premium Button ---------- */
  if (goPremiumBtn) {
    goPremiumBtn.addEventListener("click", async () => {
      try {
        const userSnap = await userRef.get();
        if (!userSnap.exists) {
          alert("User not found!");
          return;
        }

        const userData = userSnap.data();
        const balance = userData.balance || 0;
        const isPremium = userData.is_Premium || false;

        // Already premium
        if (isPremium) {
          alert("✅ You are already Premium!");
          return;
        }

        // Not enough balance
        if (balance < 1000) {
          alert("⚠️ Insufficient balance.\nYou need ₦1,000 to upgrade.");
          return;
        }

        // Deduct ₦1000 and upgrade
        await userRef.update({
          is_Premium: true,
          balance: balance - 1000,
        });

        alert("🎉 Congratulations! Your account has been upgraded to Premium 🚀");

        // Update button immediately after upgrade
        goPremiumBtn.innerText = "👑 Premium Active";
        goPremiumBtn.disabled = true;
        goPremiumBtn.style.opacity = "0.7";

      } catch (error) {
        console.error("Error upgrading to Premium:", error);
        alert("Something went wrong. Please try again.");
      }
    });
  }

  /* ---------- Premium Access Control Wrappers ---------- */
  const _activateTab = window.activateTab;
  const _switchTab = window.switchTab;
  const _showTask = window.showTask;

  async function isPremiumAllowed(sectionId) {
    try {
      const snap = await userRef.get();
      if (!snap.exists) return false;
      const userData = snap.data();
      return userData.is_Premium || !premiumRequiredSections.includes(sectionId);
    } catch {
      return false;
    }
  }

  if (_activateTab) {
    window.activateTab = async function (sectionId) {
      if (await isPremiumAllowed(sectionId)) {
        _activateTab(sectionId);
      } else {
        alert("🔒 This feature is for Premium users only.\n\n👉 Upgrade to access!");
        _activateTab("premium-section");
      }
    };
  }

  if (_switchTab) {
    window.switchTab = async function (sectionId) {
      if (await isPremiumAllowed(sectionId)) {
        _switchTab(sectionId);
      } else {
        alert("🔒 This feature is for Premium users only.\n\n👉 Upgrade to access!");
        _activateTab("premium-section");
      }
    };
  }

  if (_showTask) {
    window.showTask = async function (sectionId) {
      if (await isPremiumAllowed(sectionId)) {
        _showTask(sectionId);
      } else {
        alert("🔒 This feature is for Premium users only.\n\n👉 Upgrade to access!");
        _activateTab("premium-section");
      }
    };
  }
});






// Robust Task Section Module (fixed)
// Usage: call window.initTaskSection() once (e.g., from activateTab('tasks'))
// Requires: firebase (auth + firestore) and uploadToCloudinary(file) available globally

function initTaskSectionModule() {
  'use strict';
  // ---------- Guard against double init ----------
  if (window.__TASK_SECTION_INITIALIZED__) {
    console.warn('[TASK] initTaskSectionModule already initialized - skipping.');
    return;
  }
  window.__TASK_SECTION_INITIALIZED__ = true;

  // ---------- Small runtime helpers ----------
  function safeLog(...args) { try { console.log(...args); } catch (_) { } }
  function safeWarn(...args) { try { console.warn(...args); } catch (_) { } }
  function safeError(...args) { try { console.error(...args); } catch (_) { } }
  function escapeHtml(str) {
    if (str == null) return "";
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }
  function el(id) { return document.getElementById(id); }
  function hasFirebase() { return (typeof firebase !== 'undefined') && firebase.firestore && firebase.auth; }

  // ---------- Wait helpers ----------
  async function waitForReady(timeoutMs = 5000) {
    if (document.readyState === 'loading') {
      await new Promise(res => document.addEventListener('DOMContentLoaded', res, { once: true }));
    }
    const start = Date.now();
    while (!hasFirebase() && Date.now() - start < timeoutMs) {
      await new Promise(r => setTimeout(r, 100));
    }
    return hasFirebase();
  }
  function waitForAuthReady(timeout = 4000) {
    return new Promise((resolve) => {
      if (!hasFirebase()) return resolve(null);
      let done = false;
      const t = setTimeout(() => {
        if (done) return;
        done = true;
        resolve(firebase.auth().currentUser || null);
      }, timeout);
      const unsub = firebase.auth().onAuthStateChanged((user) => {
        if (done) return;
        done = true;
        clearTimeout(t);
        try { unsub(); } catch (e) { }
        resolve(user || null);
      });
    });
  }

  // ---------- Firestore transaction helpers ----------
  async function applyTaskDeltas(taskId, { deltaFilled = 0, deltaApproved = 0 } = {}) {
    if (!taskId) throw new Error('taskId required');
    if (!hasFirebase()) throw new Error('Firebase not initialized');
    const db = firebase.firestore();
    const ref = db.collection('tasks').doc(taskId);
    await db.runTransaction(async (tx) => {
      const snap = await tx.get(ref);
      if (!snap.exists) {
        const init = {
          filledWorkers: Math.max(0, Number(deltaFilled || 0)),
          approvedWorkers: Math.max(0, Number(deltaApproved || 0))
        };
        tx.set(ref, init, { merge: true });
        return;
      }
      const data = snap.data() || {};
      const curFilled = Number(data.filledWorkers || 0);
      const curApproved = Number(data.approvedWorkers || 0);
      const newFilled = Math.max(0, curFilled + Number(deltaFilled || 0));
      const newApproved = Math.max(0, curApproved + Number(deltaApproved || 0));
      tx.update(ref, { filledWorkers: newFilled, approvedWorkers: newApproved });
    });
  }
  async function increaseTaskOccupancy(taskId) { return applyTaskDeltas(taskId, { deltaFilled: +1 }); }
  async function decreaseTaskOccupancy(taskId) { return applyTaskDeltas(taskId, { deltaFilled: -1 }); }
  async function changeTaskApprovedCount(taskId, delta) { return applyTaskDeltas(taskId, { deltaApproved: delta }); }

  // ---------- Reconcile tasks from submissions (authoritative) ----------
  async function reconcileTaskCounters(taskId) {
    if (!taskId) throw new Error('taskId required');
    if (!hasFirebase()) throw new Error('Firebase not initialized');
    const db = firebase.firestore();
    const occSnap = await db.collection('task_submissions').where('taskId', '==', taskId).get();
    let filled = 0, approved = 0;
    occSnap.forEach(d => {
      const s = String(d.data().status || '').toLowerCase();
      if (s === 'approved') { filled += 1; approved += 1; }
      else if (s === 'on review') { filled += 1; }
    });
    await db.runTransaction(async (tx) => {
      const ref = db.collection('tasks').doc(taskId);
      const snap = await tx.get(ref);
      if (!snap.exists) {
        tx.set(ref, { filledWorkers: filled, approvedWorkers: approved }, { merge: true });
      } else {
        tx.update(ref, { filledWorkers: filled, approvedWorkers: approved });
      }
    });
    return { filled, approved };
  }
  async function reconcileAllTasks() {
    if (!hasFirebase()) throw new Error('Firebase not initialized');
    const db = firebase.firestore();
    const tasksSnap = await db.collection('tasks').get();
    for (const tdoc of tasksSnap.docs) {
      await reconcileTaskCounters(tdoc.id);
    }
  }

  // ---------- Admin status handler (transactional, robust) ----------
  // submissionId: doc id of task_submissions; newStatus: 'approved' | 'rejected' | 'on review' | etc.
  async function handleSubmissionStatusChange(submissionId, newStatus) {
    if (!submissionId) throw new Error('submissionId required');
    if (typeof newStatus !== 'string') throw new Error('newStatus string required');
    if (!hasFirebase()) throw new Error('Firebase not initialized');
    const db = firebase.firestore();
    const subRef = db.collection('task_submissions').doc(submissionId);
    await db.runTransaction(async (tx) => {
      const subSnap = await tx.get(subRef);
      if (!subSnap.exists) throw new Error('Submission not found');
      const sub = subSnap.data() || {};
      const prev = (sub.status || '').toLowerCase();
      const next = newStatus.toLowerCase();
      if (prev === next) return;
      const taskId = sub.taskId;
      if (!taskId) throw new Error('Submission missing taskId');
      // Counted statuses for occupancy: 'on review' and 'approved' count as occupying
      const prevIsCounted = ['on review', 'approved'].includes(prev);
      const nextIsCounted = ['on review', 'approved'].includes(next);
      const deltaFilled = (nextIsCounted ? 1 : 0) - (prevIsCounted ? 1 : 0);
      const prevApproved = (prev === 'approved') ? 1 : 0;
      const nextApproved = (next === 'approved') ? 1 : 0;
      const deltaApproved = nextApproved - prevApproved;
      // update submission status
      tx.update(subRef, { status: newStatus });
      // update task counters
      const taskRef = db.collection('tasks').doc(taskId);
      const taskSnap = await tx.get(taskRef);
      if (!taskSnap.exists) {
        const initial = { filledWorkers: Math.max(0, deltaFilled), approvedWorkers: Math.max(0, deltaApproved) };
        tx.set(taskRef, initial, { merge: true });
      } else {
        const t = taskSnap.data() || {};
        const curFilled = Number(t.filledWorkers || 0);
        const curApproved = Number(t.approvedWorkers || 0);
        const newFilled = Math.max(0, curFilled + deltaFilled);
        const newApproved = Math.max(0, curApproved + deltaApproved);
        tx.update(taskRef, { filledWorkers: newFilled, approvedWorkers: newApproved });
      }
    });
  }

  // ---------- UI helpers ----------
  function generateProofUploadFields(count) {
    let html = "";
    for (let i = 1; i <= count; i++) {
      html += `
      <div class="mb-4">
        <label class="block text-sm font-medium text-gray-700 mb-1">Upload Proof ${i}</label>
        <input id="proof-file-${i}" type="file" accept="image/*" class="w-full p-2 border border-gray-300 rounded-lg text-sm" />
      </div>`;
    }
    return html;
  }

  // ---------- Show Task Details & Submission Flow ----------
  async function showTaskDetails(jobId, jobData) {
    try {
      if (!jobId) throw new Error('jobId missing');
      if (!jobData || typeof jobData !== 'object') {
        if (!hasFirebase()) throw new Error('jobData missing and Firebase not available to load it');
        const tdoc = await firebase.firestore().collection('tasks').doc(jobId).get();
        if (tdoc.exists) jobData = Object.assign({}, jobData || {}, tdoc.data());
      }
      if (!jobData || typeof jobData !== 'object') throw new Error('jobData missing or invalid');
    } catch (err) {
      safeError('showTaskDetails early check failed', err);
      alert('Failed to open task details: ' + (err && err.message ? err.message : err));
      return;
    }

    const fullScreen = document.createElement('div');
    fullScreen.className = "fixed inset-0 bg-white z-50 overflow-y-auto p-6";
    const proofCount = jobData.proofFileCount || 1;
    const safeTitle = escapeHtml(jobData.title || 'Untitled Task');
    const safeCategory = escapeHtml(jobData.category || '');
    const safeSub = escapeHtml(jobData.subCategory || '');
    const safeDesc = escapeHtml(jobData.description || 'No description provided');
    const safeProofText = escapeHtml(jobData.proof || 'Provide the necessary screenshot or details.');
    const screenshot = escapeHtml(jobData.screenshotURL || 'https://via.placeholder.com/400');
    fullScreen.innerHTML = `
      <div class="max-w-2xl mx-auto space-y-6">
        <button id="closeTaskBtn" class="text-blue-600 font-bold text-sm underline">← Back to Tasks</button>
        <h1 class="text-2xl font-bold text-gray-800">${safeTitle}</h1>
        <p class="text-sm text-gray-500">${safeCategory} • ${safeSub}</p>

	<div class="relative w-full h-64 bg-gray-100 rounded-xl border flex items-center justify-center overflow-hidden">
  <img 
    src="${screenshot}" 
    alt="Task Image" 
    class="max-w-full max-h-full object-contain rounded-lg"
  />
</div>

		<div>
          <h2 class="text-lg font-semibold text-gray-800 mb-2">Task Description</h2>
          <p class="text-gray-700 text-sm whitespace-pre-line">${safeDesc}</p>
        </div>
        <div>
          <h2 class="text-lg font-semibold text-gray-800 mb-2">Proof Required</h2>
          <p class="text-sm text-gray-700">${safeProofText}</p>
        </div>
        <div id="proofSection" class="mt-6">
          <h3 class="text-base font-semibold text-gray-800 mb-3">Submit Proof</h3>
          <div id="proofInputs">${generateProofUploadFields(proofCount)}</div>
          <textarea id="taskProofNote" placeholder="Optional note..." class="w-full border rounded-md p-3 mt-3 h-24"></textarea>
          <div class="mt-3">
            <button id="taskSubmitBtn" class="w-full py-3 bg-blue-600 text-white rounded-xl">Submit Proof</button>
          </div>
          <p class="text-xs text-gray-400 mt-2">Job is Running.</p>
        </div>
      </div>
    `;
    document.body.appendChild(fullScreen);
	  
    fullScreen.querySelector('#closeTaskBtn')?.addEventListener('click', () => fullScreen.remove());



    // Get authoritative counts (best-effort)
    let filled = 0, approved = 0, total = Number(jobData.numWorkers || 0);
    try {
      if (hasFirebase()) {
        const r = await reconcileTaskCounters(jobId);
        filled = r.filled; approved = r.approved;
      }
    } catch (err) { safeWarn('reconcile failed', err); }

    const submitArea = fullScreen.querySelector('#proofSection');
    // If all approved => closed and show user's submission if exists
    if (total > 0 && approved >= total) {
      submitArea.innerHTML = `<div style="padding:12px;background:#f8fafc;border-radius:12px;text-align:center"><strong>All slots fully approved. This job is closed.</strong></div>`;
      await showUserSubmissionIfExists(jobId, fullScreen);
      return;
    }
    // If slots are filled but not all approved => no new submissions allowed, but keep job visible
    if (total > 0 && filled >= total && approved < total) {
      submitArea.innerHTML = `
        <div style="padding:12px;background:#fffbeb;border-radius:12px;text-align:center">
          <strong>All slots are filled (pending reviews). You can view your submission but cannot submit new proofs right now.</strong>
        </div>
      `;
      
    }

    // Otherwise allow submit flow (or show existing submission)
    const user = await waitForAuthReady();
    if (!user) {
      const btn = fullScreen.querySelector('#taskSubmitBtn');
      if (btn) btn.onclick = () => alert('Please log in to submit proof.');
      return;
    }

    try {
      if (hasFirebase()) {
        const existingSnap = await firebase.firestore().collection('task_submissions')
          .where('taskId', '==', jobId)
          .where('userId', '==', user.uid)
          .limit(1)
          .get();
        if (!existingSnap.empty) {
          const s = existingSnap.docs[0].data();
          replaceSubmitAreaWithSubmitted(s, submitArea);
          return;
        }
      }
    } catch (err) { safeWarn('Error checking existing submission', err); }

    attachSubmitHandler(fullScreen, jobId, jobData);
  }

  // ---------- Show user's submission if exists ----------
  async function showUserSubmissionIfExists(jobId, containerEl) {
    try {
      if (!hasFirebase()) return;
      const user = firebase.auth().currentUser;
      if (!user) return;
      const snap = await firebase.firestore().collection('task_submissions')
        .where('taskId', '==', jobId)
        .where('userId', '==', user.uid)
        .limit(1)
        .get();
      if (!snap.empty) {
        const sub = snap.docs[0].data();
        replaceSubmitAreaWithSubmitted(sub, containerEl);
      }
    } catch (err) { safeWarn('showUserSubmissionIfExists error', err); }
  }

  function replaceSubmitAreaWithSubmitted(sub, containerEl) {
    const proofs = (sub.proofImages || []).map(u => `<img src="${escapeHtml(u)}" style="width:100%;max-height:220px;object-fit:contain;border-radius:8px;margin-bottom:8px">`).join('');
    const note = sub.proofText ? `<div style="margin-top:8px;color:#374151"><strong>Note:</strong> ${escapeHtml(sub.proofText)}</div>` : '';
    const status = escapeHtml(sub.status || 'on review');
    const html = `
      <div style="background:#f8fafc;padding:14px;border-radius:12px;text-align:center">
        <div style="color:#16a34a;font-weight:600;margin-bottom:6px">✅ Your submission</div>
        <div style="font-size:13px;color:#6b7280;margin-bottom:8px">Status: <strong style="color:#111827">${status}</strong></div>
        ${proofs || '<div style="color:#9ca3af;font-size:13px">No proof images</div>'}
        ${note}
      </div>
    `;
    if (containerEl) containerEl.innerHTML = html;
  }

  // ---------- Submit handler (transaction-safe) ----------
  function attachSubmitHandler(fullScreen, jobId, jobData) {
    const submitBtn = fullScreen.querySelector('#taskSubmitBtn');
    if (!submitBtn) return;
    if (submitBtn._attached) return; // avoid double attach
    submitBtn._attached = true;

    submitBtn.addEventListener('click', async () => {
      submitBtn.disabled = true;
      try {
        const user = await waitForAuthReady();
        if (!user) { alert('Please log in to submit task.'); submitBtn.disabled = false; return; }

        // Duplicate check pre
        if (hasFirebase()) {
          const pre = await firebase.firestore().collection('task_submissions')
            .where('taskId', '==', jobId)
            .where('userId', '==', user.uid)
            .limit(1)
            .get();
          if (!pre.empty) { alert('You have already submitted this task.'); submitBtn.disabled = false; return; }
        }

        const fileInputs = Array.from(fullScreen.querySelectorAll('input[type="file"]'));
        const anyFile = fileInputs.some(i => i.files && i.files[0]);
        if (!anyFile) { alert('Please upload at least one proof image.'); submitBtn.disabled = false; return; }

        // cheap pre-check slots
        let totalSlots = Number(jobData.numWorkers || 0);
        let curFilled = 0;
        if (hasFirebase()) {
          try {
            const taskRef = firebase.firestore().collection('tasks').doc(jobId);
            const taskSnap = await taskRef.get();
            totalSlots = Number(jobData.numWorkers || (taskSnap.exists ? (taskSnap.data().numWorkers || 0) : 0));
            curFilled = taskSnap.exists ? Number(taskSnap.data().filledWorkers || 0) : 0;
          } catch (e) { safeWarn('Failed reading task doc for pre-check', e); }
        }
        if (totalSlots > 0 && curFilled >= totalSlots) {
          alert('No open submission slots right now. Please check back later.');
          submitBtn.disabled = false;
          return;
        }

        // upload files (Cloudinary) -> normalize to strings
        const uploaded = [];
        for (let i = 0; i < fileInputs.length; i++) {
          const fEl = fileInputs[i];
          if (!fEl.files || !fEl.files[0]) continue;
          if (typeof uploadToCloudinary !== 'function') throw new Error('uploadToCloudinary(file) not available');
          const res = await uploadToCloudinary(fEl.files[0]);
          // normalize common Cloudinary responses and ensure string URL is stored
          let url = null;
          if (typeof res === 'string') url = res;
          else if (res && typeof res.secure_url === 'string') url = res.secure_url;
          else if (res && typeof res.url === 'string') url = res.url;
          else if (res && typeof res.data === 'string') url = res.data;
          else throw new Error('uploadToCloudinary did not return a URL string');
          uploaded.push(url);
        }

        const payload = {
          taskId: jobId,
          userId: user.uid,
          proofImages: uploaded,
          proofText: (fullScreen.querySelector('#taskProofNote')?.value || '').trim(),
          status: 'on review',
          workerEarn: jobData.workerEarn || 0
        };

        if (!hasFirebase()) throw new Error('Firebase not initialized');
        const db = firebase.firestore();
        const submissionsCol = db.collection('task_submissions');
        const newSubRef = submissionsCol.doc();

        // transaction: create submission + bump counters
        await db.runTransaction(async (tx) => {
          const taskRef = db.collection('tasks').doc(jobId);
          const tSnap = await tx.get(taskRef);
          const tData = tSnap.exists ? (tSnap.data() || {}) : {};
          const curFilledTx = Number(tData.filledWorkers || 0);
          const totalSlotsTx = Number(jobData.numWorkers || (tData.numWorkers || 0)) || 0;

          // race-safe check
          if (totalSlotsTx > 0 && curFilledTx >= totalSlotsTx) {
            throw new Error('NO_SLOTS');
          }

          // create submission doc
          const toWrite = Object.assign({}, payload, {
            submittedAt: firebase.firestore.FieldValue.serverTimestamp()
          });
          tx.set(newSubRef, toWrite);

          if (!tSnap.exists) {
            const init = { filledWorkers: 1, approvedWorkers: 0 };
            if (jobData.numWorkers != null) init.numWorkers = Number(jobData.numWorkers);
            tx.set(taskRef, init, { merge: true });
          } else {
            const newFilled = Math.max(0, curFilledTx + 1);
            const curApproved = Number(tData.approvedWorkers || 0);
            tx.update(taskRef, { filledWorkers: newFilled, approvedWorkers: curApproved });
          }
        });

        // reconcile as best-effort
        try { await reconcileTaskCounters(jobId); } catch (e) { safeWarn('reconcile after submit failed', e); }

        // update finished tasks cache for UI
        window.finishedTasksCache = window.finishedTasksCache || [];
        const localCopy = Object.assign({}, payload, { id: newSubRef.id, submittedAt: new Date() });
        window.finishedTasksCache.unshift(localCopy);

        alert('✅ Task submitted for review!');
        fullScreen.remove();
      } catch (err) {
        safeError('Submit error', err);
        if (err && err.message === 'NO_SLOTS') {
          alert('Sorry — by the time you tried to submit the slots were taken. Please check later.');
        } else if (err && err.message === 'ALREADY_SUBMITTED') {
          alert('You have already submitted this task.');
        } else {
          alert('❗ Failed to submit task: ' + (err && err.message ? err.message : String(err)));
        }
        submitBtn.disabled = false;
      }
    });
  }

  // ---------- Task card renderer ----------
  function createTaskCard(jobId, jobData) {
    try {
      const taskContainer = el('task-jobs');
      if (!taskContainer) return;
      const card = document.createElement('div');
      card.className = "flex gap-4 p-4 rounded-2xl shadow-md border border-gray-200 bg-white hover:shadow-lg transition duration-300 mb-4 items-center";
      card.dataset.jobId = jobId;
      const image = document.createElement('img');
      image.src = jobData.screenshotURL || 'https://via.placeholder.com/80';
      image.alt = "Task Preview";
      image.className = "w-20 h-20 rounded-xl object-cover";
      const content = document.createElement('div');
      content.className = "flex-1 task-content";
      const title = document.createElement('h2');
      title.textContent = jobData.title || "Untitled Task";
      title.className = "text-lg font-semibold text-gray-800";
      const meta = document.createElement('p');
      meta.className = "text-sm text-gray-500 mt-1";
      meta.textContent = `${jobData.category || ""} • ${jobData.subCategory || ""}`;
      const earn = document.createElement('p');
      earn.textContent = `Earn: ₦${jobData.workerEarn || 0}`;
      earn.className = "text-sm text-green-600 font-semibold mt-1";
      const rate = document.createElement('p');
      rate.className = "text-xs text-gray-500 task-rate";
      rate.textContent = "Progress: loading...";
      const total = Number(jobData.numWorkers || 0);
      card.dataset.total = String(total);

      (async () => {
        try {
          if (hasFirebase()) await reconcileTaskCounters(jobId).catch(() => null);
          if (hasFirebase()) {
            const tdoc = await firebase.firestore().collection('tasks').doc(jobId).get();
            if (tdoc.exists) {
              const td = tdoc.data() || {};
              const filled = Number(td.filledWorkers || 0);
              const approved = Number(td.approvedWorkers || 0);
              rate.textContent = `Progress: ${filled} / ${total} (approved ${approved})`;
              if (total > 0 && approved >= total) { card.remove(); return; }
              else if (total > 0 && filled >= total && approved < total) {
                card.classList.add('opacity-90');
                if (!content.querySelector('.pending-note')) {
                  const note = document.createElement('div');
                  note.textContent = "All slots filled, pending reviews";
                  note.className = "text-xs text-amber-500 mt-1 pending-note";
                  content.appendChild(note);
                }
              }
            } else {
              const aprSnap = await firebase.firestore().collection('task_submissions')
                .where('taskId', '==', jobId)
                .where('status', '==', 'approved')
                .get();
              const done = aprSnap.size;
              rate.textContent = `Progress: ${done} / ${total}`;
              if (total > 0 && done >= total) { card.remove(); return; }
            }
          } else {
            rate.textContent = `Progress: ? / ${total}`;
          }
        } catch (err) { safeWarn('progress read failed', err); rate.textContent = `Progress: 0 / ${total}`; }
      })();

      const button = document.createElement('button');
      button.textContent = "View Task";
      button.className = "mt-3 bg-blue-600 hover:bg-blue-700 text-white text-xs px-4 py-2 rounded-lg shadow-sm transition";
      button.addEventListener('click', async (ev) => {
        try { ev.preventDefault(); await showTaskDetails(jobId, jobData); }
        catch (err) { safeError('Failed to open task details for', jobId, err); alert('Failed to open task details: ' + (err && err.message ? err.message : err)); }
      });

      content.appendChild(title);
      content.appendChild(meta);
      content.appendChild(earn);
      content.appendChild(rate);
      content.appendChild(button);
      card.appendChild(image);
      card.appendChild(content);
      taskContainer.appendChild(card);
    } catch (err) { safeWarn('createTaskCard error', err); }
  }

  // ---------- Fetch tasks once (safe) ----------
  async function fetchTasksOnce() {
    try {
      const taskContainer = el('task-jobs');
      if (!taskContainer) return;
      const searchInput = el('taskSearch');
      const filterSelect = el('taskCategoryFilter');
      taskContainer.innerHTML = `<p class="p-4 text-gray-400 text-sm">Loading tasks...</p>`;
      if (!hasFirebase()) { taskContainer.innerHTML = `<p class="p-4 text-gray-400 text-sm">Firebase not initialized.</p>`; return; }
      const snap = await firebase.firestore().collection('tasks').where('status', '==', 'approved').get();
      const tasks = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      taskContainer.innerHTML = "";
      function renderTasks() {
        const keyword = (searchInput && searchInput.value) ? searchInput.value.toLowerCase() : "";
        const selectedCategory = (filterSelect && filterSelect.value) ? filterSelect.value.toLowerCase() : "";
        taskContainer.innerHTML = "";
        tasks
          .filter(task => {
            const taskCategory = (task.category || "").toLowerCase();
            const matchesCategory = selectedCategory === "" || taskCategory === selectedCategory;
            const matchesSearch = (task.title || "").toLowerCase().includes(keyword);
            return matchesCategory && matchesSearch;
          })
          .forEach(task => createTaskCard(task.id, task));
      }
      if (searchInput) searchInput.addEventListener("input", renderTasks);
      if (filterSelect) filterSelect.addEventListener("change", renderTasks);
      renderTasks();
    } catch (err) { safeError("Failed to fetch tasks:", err); const taskContainer = el("task-jobs"); if (taskContainer) { taskContainer.innerHTML = `<p class="p-4 text-red-500 text-sm">Failed to load tasks. Please reload.</p>`; } }
  }

  // ---------- Finished tasks UI (user) ----------
  window.finishedTasksCache = window.finishedTasksCache || [];
  async function initFinishedTasksSectionUser() {
    try {
      const btnOpen = el("finishedTaskBtnUser");
      const btnBack = el("backToMainBtnUser");
      if (btnOpen) {
        btnOpen.addEventListener("click", () => {
          el("taskSection")?.classList.add("hidden");
          el("finishedTasksScreenUser")?.classList.remove("hidden");
          renderFinishedTasksUser();
        });
      }
      if (btnBack) {
        btnBack.addEventListener("click", () => {
          el("finishedTasksScreenUser")?.classList.add("hidden");
          el("taskSection")?.classList.remove("hidden");
        });
      }
      if (hasFirebase()) {
        firebase.auth().onAuthStateChanged(async user => {
          if (!user) return;
          await fetchFinishedTasksOnce(user.uid);
        });
      }
    } catch (err) { safeWarn('initFinishedTasksSectionUser error', err); }
  }

  async function fetchFinishedTasksOnce(uid) {
    try {
      const listEl = el("finishedTasksListUser");
      const pendingCountEl = el("pendingCountUser");
      const approvedCountEl = el("approvedCountUser");
      if (!uid || !hasFirebase() || !listEl) return;
      listEl.innerHTML = `<p class="text-center text-gray-500">Loading...</p>`;
      const snap = await firebase.firestore().collection("task_submissions").where("userId", "==", uid).get();
      window.finishedTasksCache = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      window.finishedTasksCache.sort((a, b) => {
        const t1 = a.submittedAt?.toDate?.() || new Date(0);
        const t2 = b.submittedAt?.toDate?.() || new Date(0);
        return t2 - t1;
      });
      const taskIds = [...new Set(window.finishedTasksCache.map(s => s.taskId).filter(Boolean))];
      await Promise.all(taskIds.map(id => reconcileTaskCounters(id).catch(() => null)));
      renderFinishedTasksUser();
      let pending = window.finishedTasksCache.filter(d => (d.status || '').toLowerCase() === "on review").length;
      let approved = window.finishedTasksCache.filter(d => (d.status || '').toLowerCase() === "approved").length;
      if (pendingCountEl) pendingCountEl.textContent = pending;
      if (approvedCountEl) approvedCountEl.textContent = approved;
    } catch (err) { safeError("Error fetching finished tasks:", err); const listEl = el("finishedTasksListUser"); if (listEl) listEl.innerHTML = `<p class="text-center text-red-500">Failed to load tasks. Reload page.</p>`; }
  }

  function renderFinishedTasksUser() {
    const listEl = el("finishedTasksListUser");
    const pendingCountEl = el("pendingCountUser");
    const approvedCountEl = el("approvedCountUser");
    if (!listEl) return;
    listEl.innerHTML = "";
    if (!window.finishedTasksCache.length) {
      listEl.innerHTML = `<p class="text-center text-gray-500">No finished tasks yet.</p>`;
      if (pendingCountEl) pendingCountEl.textContent = "0";
      if (approvedCountEl) approvedCountEl.textContent = "0";
      return;
    }
    let pending = 0, approved = 0;
    for (const data of window.finishedTasksCache) {
      const statusKey = (data.status || '').toLowerCase();
      if (statusKey === "on review") pending++;
      if (statusKey === "approved") approved++;
      const jobTitle = data.cachedTitle || data.taskTitle || "Loading...";
      const card = document.createElement("div");
      card.className = "p-4 bg-white shadow rounded-xl flex items-center justify-between mb-3";
      card.innerHTML = `
        <div>
          <h3 class="font-semibold text-gray-900">${escapeHtml(jobTitle)}</h3>
          <p class="text-sm text-gray-600">Earn: ₦${data.workerEarn || 0}</p>
          <p class="text-xs text-gray-400">${data.submittedAt?.toDate?.().toLocaleString() || ""}</p>
          <span class="inline-block mt-1 px-2 py-0.5 text-xs rounded ${
            (statusKey === "approved")
              ? "bg-green-100 text-green-700"
              : (statusKey === "rejected")
                ? "bg-red-100 text-red-700"
                : "bg-yellow-100 text-yellow-700"
          }">${escapeHtml(data.status)}</span>
        </div>
        <button
          class="px-3 py-1 text-sm font-medium bg-blue-600 text-white rounded-lg details-btn-user"
          data-id="${escapeHtml(data.id)}"
        >Details</button>
      `;
      listEl.appendChild(card);
    }
    if (pendingCountEl) pendingCountEl.textContent = pending;
    if (approvedCountEl) approvedCountEl.textContent = approved;
    listEl.querySelectorAll(".details-btn-user").forEach(btn => {
      btn.addEventListener("click", () => showTaskSubmissionDetailsUser(btn.dataset.id));
    });
    preloadTaskTitles();
  }

  async function preloadTaskTitles() {
    try {
      const ids = [...new Set(window.finishedTasksCache.map(t => t.taskId).filter(Boolean))];
      if (!ids.length || !hasFirebase()) return;
      for (let i = 0; i < ids.length; i += 10) {
        const slice = ids.slice(i, i + 10);
        const snap = await firebase.firestore().collection('tasks').where(firebase.firestore.FieldPath.documentId(), "in", slice).get();
        for (const d of snap.docs) {
          const task = { id: d.id, ...d.data() };
          window.finishedTasksCache.forEach(sub => { if (sub.taskId === task.id) sub.cachedTitle = task.title || 'Untitled Task'; });
        }
      }
      try { renderFinishedTasksUser(); } catch (_) { }
    } catch (err) { safeWarn('preloadTaskTitles error', err); }
  }

  async function showTaskSubmissionDetailsUser(submissionId) {
    const sub = window.finishedTasksCache.find(d => d.id === submissionId);
    if (!sub) return alert("Submission not found in memory. Reload page.");
    const title = sub.cachedTitle || "Untitled Task";
    const modal = document.createElement("div");
    modal.className = "fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50";
    modal.innerHTML = `
      <div class="bg-white rounded-xl shadow-lg p-6 w-96 max-h-[90vh] overflow-y-auto relative">
        <h2 class="text-lg font-bold mb-3">Submission Details</h2>
        <p class="text-sm"><strong>Job Title:</strong> ${escapeHtml(title)}</p>
        <p class="text-sm"><strong>Status:</strong> ${escapeHtml(sub.status)}</p>
        <p class="text-sm"><strong>Earned:</strong> ₦${sub.workerEarn || 0}</p>
        <p class="text-sm"><strong>Submitted At:</strong> ${sub.submittedAt?.toDate?.().toLocaleString() || "—"}</p>
        <p class="text-sm"><strong>Extra Proof:</strong> ${escapeHtml(sub.extraProof || "—")}</p>
        ${(sub.proofImages || []).map(url => `
          <div class="mt-3">
            <p class="text-sm font-medium text-gray-700 mb-1">Uploaded Proof:</p>
            <img src="${escapeHtml(url)}" alt="Proof" class="rounded-lg border w-full max-h-60 object-contain mb-2" />
          </div>
        `).join("")}
        <div class="mt-4 flex justify-end sticky bottom-0 bg-white pt-3">
          <button class="closeModalUser px-4 py-2 bg-blue-600 text-white rounded-lg shadow hover:bg-blue-700">Close</button>
        </div>
      </div>
    `;
    document.body.appendChild(modal);
    modal.querySelector(".closeModalUser").addEventListener("click", () => modal.remove());
  }

  // ---------- Expose small API + start init ----------
  window.TaskProgress = window.TaskProgress || {};
  window.TaskProgress.increaseTaskOccupancy = increaseTaskOccupancy;
  window.TaskProgress.decreaseTaskOccupancy = decreaseTaskOccupancy;
  window.TaskProgress.changeTaskApprovedCount = changeTaskApprovedCount;
  window.TaskProgress.handleSubmissionStatusChange = handleSubmissionStatusChange;
  window.TaskProgress.reconcileTaskCounters = reconcileTaskCounters;
  window.TaskProgress.reconcileAllTasks = reconcileAllTasks;
  window.TaskProgress.startAutoReconcile = function(taskId, ms = 60_000) {
    if (!taskId) throw new Error('taskId required');
    const iid = setInterval(() => reconcileTaskCounters(taskId).catch(() => null), ms);
    return () => clearInterval(iid);
  };

  // ---------- Initial UI bindings (non-blocking) ----------
  (async () => {
    const firebaseReady = await waitForReady(4000);
    if (!firebaseReady) safeWarn('Firebase not detected or slow to initialize — module will still run but Firestore features disabled until firebase loads.');
    try {
      // Initialize finished tasks UI handlers
      initFinishedTasksSectionUser();
      // Load task cards if the placeholder container exists
      fetchTasksOnce().catch(e => safeWarn('fetchTasksOnce failed', e));
    } catch (err) { safeWarn('module init failed', err); }
  })();
}

// end initTaskSectionModule

// -------------------------
// Public initializer
// -------------------------
window.initTaskSection = function() {
  // idempotent
  if (window.__TASK_SECTION_INITIALIZED__) {
    try { console.log('[TASK] initTaskSection called — already initialized'); } catch (_) { }
    return;
  }
  try { initTaskSectionModule(); } catch (e) { console.error('[TASK] initTaskSection error', e); }
};

// Optional: auto-run if you want (commented by default)
// window.initTaskSection();











                                    //AFFILIATE 


// AFFILIATE — Robust single-file module (no snapshots)
// Paste after firebase is initialized
(function(){
  'use strict';

  if (window.AFF2_COMPLETE_FINAL) { console.warn('[AFF2] already present'); return; }
  window.AFF2_COMPLETE_FINAL = true;

  /* ---------- helpers ---------- */
  const el = id => document.getElementById(id);
  const safeText = s => String(s || '')
    .replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;')
    .replaceAll('"','&quot;').replaceAll("'", '&#39;');
  const formatNaira = n => (n==null||isNaN(Number(n))) ? '₦0' : '₦'+Number(n).toLocaleString('en-NG');

  /* ---------- firebase refs ---------- */
  const firebaseAvailable = !!(window.firebase && window.firebase.firestore);
  const db = firebaseAvailable ? window.firebase.firestore() : null;
  const auth = (window.firebase && window.firebase.auth) ? window.firebase.auth() : null;

  /* ---------- module state ---------- */
  const state = {
    handlers: [],
    currentJobId: null,
    // used to reflect instant local updates in the details screen
    localOccupancyIncrement: 0
  };

  /* ---------- upload helper (Cloudinary or Firebase Storage) ---------- */
  async function uploadFileHelper(file) {
    if (!file) throw new Error('No file provided');
    if (typeof window.uploadToCloudinary === 'function') {
      return await window.uploadToCloudinary(file);
    }
    if (window.firebase && window.firebase.storage && auth && auth.currentUser) {
      const storageRef = window.firebase.storage().ref();
      const path = `affiliate_proofs/${auth.currentUser.uid}_${Date.now()}_${file.name}`;
      const ref = storageRef.child(path);
      await ref.put(file);
      return await ref.getDownloadURL();
    }
    throw new Error('No upload helper available. Provide uploadToCloudinary(file) or enable firebase.storage.');
  }

  /* ---------- Job Card (with category + rate) ---------- */
  function makeJobCard(job, occupancy = 0, approved = 0) {
  const wrap = document.createElement('div');
  wrap.className = 'aff2-job-card bg-white rounded-xl p-3 shadow-sm mb-4';

  const img = job.campaignLogoURL || job.image || '/assets/default-thumb.jpg';
  const numWorkers = Number(job.numWorkers || 0);
  const remaining = Math.max(0, numWorkers - occupancy);

  wrap.innerHTML = `
    <div class="overflow-hidden rounded-lg">
      <img src="${safeText(img)}" alt="${safeText(job.title||'')}" class="w-full h-36 object-cover rounded-lg"/>
    </div>

    <div class="mt-3">
      <h4 class="font-semibold text-md">${safeText(job.title || 'Untitled')}</h4>

      ${job.category ? `<div class="mt-1">
        <span class="inline-block text-xs px-2 py-1 bg-blue-100 text-blue-600 rounded">
          ${safeText(job.category)}
        </span>
      </div>` : ''}

      <div class="text-sm text-blue-600 mt-1 font-medium">${formatNaira(job.workerPay)}</div>
      <div class="text-sm text-gray-500 mt-1">${occupancy}/${numWorkers} workers</div>

      <div class="mt-3 flex items-center justify-between">
        
        <button class="aff2-btn-view px-3 py-1.5 bg-blue-600 text-white text-sm rounded-lg" data-id="${safeText(job.id)}">
          View Task
        </button>
      </div>
    </div>
  `;

  return wrap;
}

  /* ---------- Load jobs (explicit get, compute occupancy & approved) ---------- */
  async function loadAndRenderJobs() {
    const grid = el('aff2_grid') || el('aff2_jobsList') || el('aff2_jobsContainer');
    if (!grid) { console.warn('[AFF2] jobs container missing'); return; }
    try {
      grid.innerHTML = '<p class="text-gray-500 p-6 text-center">Loading tasks...</p>';
      if (!db) throw new Error('Database not available');

      let q = db.collection('affiliateJobs').where('status','==','approved');
      try { q = q.orderBy('postedAt','desc'); } catch (_) {}
      const snap = await q.get();
      if (snap.empty) { grid.innerHTML = '<p class="text-gray-500 p-6 text-center">No affiliate tasks right now.</p>'; return; }

      const jobs = snap.docs.map(d => ({ id: d.id, ...d.data() }));

      // gather counts in parallel
      const counts = await Promise.all(jobs.map(job => (async ()=>{
        const jobId = job.id;
        // occupancy = on review + approved
        let occupancy = 0, approved = 0;
        try {
          // best-effort: try to use 'in' style combined statuses through two queries
          const occSnap = await db.collection('affiliate_submissions')
            .where('jobId','==',jobId)
            .get();
          occSnap.forEach(doc => {
            const s = (doc.data().status || '').toLowerCase();
            if (s === 'on review' || s === 'approved') occupancy++;
            if (s === 'approved') approved++;
          });
        } catch (e) {
          console.error('[AFF2] count fallback error', e);
        }
        return { jobId, occupancy, approved };
      })()));

      const map = {};
      counts.forEach(c => map[c.jobId] = c);

      grid.innerHTML = '';
      for (const job of jobs) {
        const c = map[job.id] || { occupancy: 0, approved: 0 };
        const numWorkers = Number(job.numWorkers || 0);
        // if approved >= numWorkers -> job leaves the list (do not show)
        if (numWorkers > 0 && c.approved >= numWorkers) continue;
        grid.appendChild(makeJobCard(job, c.occupancy, c.approved));
      }

    } catch (err) {
      console.error('[AFF2] loadAndRenderJobs', err);
      grid.innerHTML = '<p class="text-red-500 p-6">Failed to load tasks.</p>';
    }
  }

  /* ---------- Open Job Detail (get only) ---------- */
async function openJobDetail(jobId) {
  if (!db) { 
    alert('Database not ready'); 
    return; 
  }

  try {
    const doc = await db.collection('affiliateJobs').doc(jobId).get();
    if (!doc.exists) { 
      alert('Job not found'); 
      return; 
    }

    const job = { id: doc.id, ...doc.data() };
    state.currentJobId = job.id;
    state.localOccupancyIncrement = 0;

    const content = el('aff2_jobDetailContent');
    if (!content) { 
      alert('Detail container missing'); 
      return; 
    }

    content.innerHTML = '';

    // build UI
    const wrapper = document.createElement('div');
    wrapper.className = 'bg-white rounded-2xl shadow-md overflow-hidden max-w-3xl mx-auto my-6';

    const bannerWrapper = document.createElement('div');
bannerWrapper.className = 'relative w-full h-56 bg-gray-100 rounded-xl overflow-hidden flex items-center justify-center border';

const banner = document.createElement('img');
banner.src = job.image || job.campaignLogoURL || '/assets/default-banner.jpg';
banner.className = 'max-w-full max-h-full object-contain rounded-lg';

bannerWrapper.appendChild(banner);
wrapper.appendChild(bannerWrapper);



	  
    const body = document.createElement('div');
    body.className = 'p-6 space-y-4';
    body.innerHTML = `
      <div>
        <h2 class="text-2xl font-bold">${safeText(job.title || 'Untitled')}</h2>
        <div class="mt-1">
          ${job.category 
            ? `<span class="inline-block text-xs px-2 py-1 bg-blue-100 text-blue-600 rounded">${safeText(job.category)}</span>` 
            : ''
          }
        </div>
        <p class="text-sm text-gray-500 mt-2">
          ${formatNaira(job.workerPay)} · ${Number(job.numWorkers || 0)} workers
        </p>
      </div>

      ${job.instructions 
        ? `<div class="text-gray-700 text-sm"><strong>Instructions:</strong><br>${safeText(job.instructions)}</div>` 
        : ''
      }

      ${job.targetLink 
        ? `<div><strong class="text-sm text-gray-700">Target Link:</strong> 
            <a href="${safeText(job.targetLink)}" target="_blank" class="text-blue-600 underline break-all">
              ${safeText(job.targetLink)}
            </a>
           </div>` 
        : ''
      }

      ${job.proofRequired 
        ? `<div class="text-gray-700 text-sm"><strong>Proof Required:</strong><br>${safeText(job.proofRequired)}</div>` 
        : ''
      }

      <div id="aff2_submitArea" class="mt-6 border-t pt-4">
        <h3 class="text-base font-semibold text-gray-800 mb-3">Submit Proof</h3>
        <div class="space-y-3">
          <div>
            <label class="text-sm text-gray-700">Proof File 1</label>
            <input type="file" id="proofFile1" accept="image/*" class="block w-full border rounded-md p-2">
          </div>
          <div>
            <label class="text-sm text-gray-700">Proof File 2</label>
            <input type="file" id="proofFile2" accept="image/*" class="block w-full border rounded-md p-2">
          </div>
          <div>
            <label class="text-sm text-gray-700">Proof File 3</label>
            <input type="file" id="proofFile3" accept="image/*" class="block w-full border rounded-md p-2">
          </div>
        </div>

        <textarea 
          id="aff2_detailSubmissionNote" 
          placeholder="Optional note..." 
          class="w-full border rounded-md p-3 mt-3 h-28">
        </textarea>

        <div class="mt-3">
          <button id="aff2_detailSubmitBtn" class="w-full py-3 bg-blue-600 text-white rounded-xl">
            Submit Proof
          </button>
        </div>

        <p class="text-xs text-gray-400 mt-2">Job is Running.</p>
      </div>
    `;

    wrapper.appendChild(body);
    content.appendChild(wrapper);
  	  
	  // show/hide screens
      el('aff2_jobsContainer')?.classList.add('aff2-hidden');
      el('aff2_finishedScreen')?.classList.add('aff2-hidden');
      el('aff2_jobDetailScreen')?.classList.remove('aff2-hidden');

      // compute occupancy & approved
      const { occupancy, approved } = await computeCountsForJob(job.id);
      // reflect to UI
      state.currentApproved = approved;
      state.currentOccupancy = occupancy;
      updateDetailProgressUI(job.numWorkers || 0);

      // if approved >= slots: close submissions
      const numWorkers = Number(job.numWorkers || 0);
      if (numWorkers > 0 && approved >= numWorkers) {
        const area = el('aff2_submitArea');
        if (area) {
          area.innerHTML = `<div style="padding:12px;background:#f8fafc;border-radius:12px;text-align:center"><strong>All slots fully approved. This job is closed.</strong></div>`;
        }
        // still try show user's own submission if exists
        await showUserSubmissionIfExists(job.id);
        return;
      }

      // if occupancy >= slots (on review + approved fill slots): hide submit inputs but show user's own if present
      if (numWorkers > 0 && occupancy >= numWorkers) {
        const area = el('aff2_submitArea');
        if (area) {
          area.innerHTML = `<div style="padding:12px;background:#fffbeb;border-radius:12px;text-align:center"><strong>No open submission slots right now. Please check back later.</strong></div>`;
        }
        await showUserSubmissionIfExists(job.id);
        return;
      }

      // if user already submitted -> show their submission
      const user = auth.currentUser;
      if (!user) {
        const submitBtn = el('aff2_detailSubmitBtn');
        if (submitBtn) submitBtn.onclick = () => alert('Please log in to submit proof.');
        return;
      }

      const uid = user.uid;
      const existingSnap = await db.collection('affiliate_submissions')
        .where('jobId','==', job.id)
        .where('userId','==', uid)
        .get();

      if (!existingSnap.empty) {
        const doc = existingSnap.docs[0];
        const sub = { id: doc.id, ...doc.data() };
        replaceSubmitAreaWithSubmitted(sub);
        return;
      }

      // otherwise attach submit handler
      attachSubmitHandler(job);

    } catch (err) {
      console.error('[AFF2] openJobDetail', err);
      alert('Failed to load job details.');
    }
  }

  /* ---------- compute counts helper ---------- */
  async function computeCountsForJob(jobId) {
    let occupancy = 0, approved = 0;
    try {
      const snap = await db.collection('affiliate_submissions').where('jobId','==',jobId).get();
      snap.forEach(d => {
        const s = String((d.data().status||'').toLowerCase());
        if (s === 'on review' || s === 'approved') occupancy++;
        if (s === 'approved') approved++;
      });
    } catch (err) {
      console.error('[AFF2] computeCountsForJob', err);
    }
    return { occupancy, approved };
  }

  /* ---------- update detail progress UI ---------- */
  function updateDetailProgressUI(numWorkersOrZero) {
    const bar = el('aff2_detailProgressBar');
    const txt = el('aff2_detailProgressText');
    const total = Number(typeof numWorkersOrZero === 'number' ? numWorkersOrZero : (state.currentNumWorkers || 0)) || 1;
    // occupancy includes local increment (optimistic)
    const occ = (Number(state.currentOccupancy || 0) + Number(state.localOccupancyIncrement || 0));
    const approved = Number(state.currentApproved || 0);
    const pct = Math.min(100, Math.round((occ / total) * 100));
    if (bar) bar.style.width = pct + '%';
    if (txt) txt.textContent = `${occ}/${total} · Approved: ${approved}`;
  }

  /* ---------- show user's own submission if exists ---------- */
  async function showUserSubmissionIfExists(jobId) {
    if (!auth || !auth.currentUser) return;
    try {
      const uid = auth.currentUser.uid;
      const snap = await db.collection('affiliate_submissions')
        .where('jobId','==', jobId)
        .where('userId','==', uid)
        .get();
      if (!snap.empty) {
        const doc = snap.docs[0];
        const sub = { id: doc.id, ...doc.data() };
        replaceSubmitAreaWithSubmitted(sub);
      }
    } catch (err) {
      console.error('[AFF2] showUserSubmissionIfExists', err);
    }
  }

  /* ---------- replace submit area with submitted view ---------- */
  function replaceSubmitAreaWithSubmitted(sub) {
    const area = el('aff2_submitArea');
    if (!area) return;
    const urls = (sub.proofFiles || sub.proofURLs || []);
    const imagesHtml = urls.length ? urls.map(u => `<img src="${safeText(u)}" style="width:100%;max-height:220px;object-fit:contain;border-radius:8px;margin-bottom:8px">`).join('') : `<div style="color:#9ca3af">No proof images</div>`;
    const noteHtml = sub.note ? `<div style="margin-top:8px;color:#374151"><strong>Note:</strong> ${safeText(sub.note)}</div>` : '';
    const statusSafe = safeText(sub.status || 'on review');

    area.innerHTML = `
      <div style="background:#f8fafc;padding:14px;border-radius:12px;text-align:center">
        <div style="color:#16a34a;font-weight:600;margin-bottom:6px">✅ Your submission</div>
        <div style="font-size:13px;color:#6b7280;margin-bottom:8px">Status: <strong style="color:#111827">${statusSafe}</strong></div>
        ${imagesHtml}
        ${noteHtml}
      </div>
    `;

    // if this was a local optimistic submission, reflect occupancy increment
    if (sub && sub._localIncrement) {
      state.localOccupancyIncrement = (state.localOccupancyIncrement || 0) + 1;
      updateDetailProgressUI(Number(state.currentNumWorkers || 0));
    }
  }

  /* ---------- attach submit handler (prevents double submits) ---------- */
  function attachSubmitHandler(job) {
    const submitBtn = el('aff2_detailSubmitBtn');
    if (!submitBtn) return;
    submitBtn.onclick = null;

    submitBtn.onclick = async function() {
      // ensure logged in
      if (!auth || !auth.currentUser) { alert('Please log in to submit proof.'); return; }
      const uid = auth.currentUser.uid;

      // collect files: 3 inputs, at least 1 required
      const fEls = [el('proofFile1'), el('proofFile2'), el('proofFile3')];
      const files = fEls.map(i => i?.files?.[0]).filter(Boolean);
      if (files.length < 1) { alert('Please upload at least one proof file.'); return; }

      // disable button to avoid double submit
      submitBtn.disabled = true;
      const prevText = submitBtn.textContent;
      submitBtn.textContent = 'Submitting...';

      try {
        // final duplicate check
        const check = await db.collection('affiliate_submissions')
          .where('jobId','==', job.id)
          .where('userId','==', uid)
          .get();
        if (!check.empty) {
          // already submitted — show existing doc and do nothing else
          const doc = check.docs[0];
          replaceSubmitAreaWithSubmitted({ id: doc.id, ...doc.data() });
          alert('You have already submitted for this job.');
          return;
        }

        // upload files sequentially (cloudinary or firebase storage)
        const uploaded = [];
        for (let i = 0; i < files.length; i++) {
          const url = await uploadFileHelper(files[i]);
          uploaded.push(url);
        }

        // prepare payload
        const payload = {
          jobId: job.id,
          userId: uid,
          userName: auth.currentUser.displayName || auth.currentUser.email || '',
          proofFiles: uploaded,
          note: (el('aff2_detailSubmissionNote')?.value || '').trim(),
          status: 'on review',
          createdAt: firebase.firestore.FieldValue.serverTimestamp()
        };

        // write to DB
        await db.collection('affiliate_submissions').add(payload);

        // optimistic UI: show submitted and increment local occupancy
        replaceSubmitAreaWithSubmitted({ ...payload, _localIncrement: true });
        alert('✅ Submission successful! It will be reviewed by admin.');

      } catch (err) {
        console.error('[AFF2] submit error', err);
        alert('Submission failed. Please try again.');
        // re-enable
        submitBtn.disabled = false;
        submitBtn.textContent = prevText;
      }
    };
  }

  /* ---------- Finished tasks: load & render (counts & cards) ---------- */
  async function loadAndRenderFinished() {
    const listEl = el('aff2_finishedList');
    const pendingCountEl = el('aff2_pendingCount');
    const approvedCountEl = el('aff2_approvedCount');

    if (!listEl) { console.warn('[AFF2] finished list missing'); return; }
    listEl.innerHTML = '<p class="text-gray-500 p-6 text-center">Loading finished tasks...</p>';

    try {
      // ensure user is available
      const user = auth.currentUser || await new Promise(resolve => {
        const off = auth.onAuthStateChanged(u => { off(); resolve(u); });
      });
      if (!user) {
        listEl.innerHTML = '<p class="text-gray-500 p-6 text-center">Please sign in to see your finished tasks.</p>';
        if (pendingCountEl) pendingCountEl.textContent = '0';
        if (approvedCountEl) approvedCountEl.textContent = '0';
        return;
      }

      const snap = await db.collection('affiliate_submissions')
        .where('userId','==', user.uid)
        .orderBy('createdAt','desc')
        .get();

      if (snap.empty) {
        listEl.innerHTML = '<p class="text-gray-500 p-6 text-center">You have no finished tasks yet.</p>';
        if (pendingCountEl) pendingCountEl.textContent = '0';
        if (approvedCountEl) approvedCountEl.textContent = '0';
        return;
      }

      // gather job titles
      const jobIds = [...new Set(snap.docs.map(d => d.data().jobId).filter(Boolean))];
      const jobMap = {};
      for (let i = 0; i < jobIds.length; i += 10) {
        const chunk = jobIds.slice(i, i + 10);
        const jobsSnap = await db.collection('affiliateJobs')
          .where(firebase.firestore.FieldPath.documentId(), 'in', chunk)
          .get();
        jobsSnap.forEach(jd => jobMap[jd.id] = jd.data());
      }

      // render cards and compute counts
      let pending = 0, approved = 0;
      listEl.innerHTML = '';
      snap.forEach(doc => {
        const sub = doc.data();
        const job = jobMap[sub.jobId] || {};
        if (sub.status === 'approved') approved++;
        else if (sub.status === 'on review') pending++;
        listEl.appendChild(makeFinishedCard(doc.id, sub, job));
      });

      if (pendingCountEl) pendingCountEl.textContent = String(pending);
      if (approvedCountEl) approvedCountEl.textContent = String(approved);

    } catch (err) {
      console.error('[AFF2] loadAndRenderFinished', err);
      listEl.innerHTML = '<p class="text-red-500 p-6">Failed to load submissions.</p>';
    }
  }

  /* ---------- finished card (redesigned) ---------- */
  function makeFinishedCard(id, sub, job) {
    const date = (sub.createdAt && typeof sub.createdAt.toDate === 'function') ? sub.createdAt.toDate().toLocaleString() : '';
    const title = safeText(job.title || 'Affiliate Job');
    const status = (sub.status || 'on review').toLowerCase();
    const statusColor = status === 'approved' ? '#10b981' : status === 'rejected' ? '#ef4444' : '#f59e0b';
    const urls = (sub.proofFiles || sub.proofURLs || []);
    const wrapper = document.createElement('div');
    wrapper.className = 'aff2-finished-card bg-white rounded-2xl p-4 mb-4 shadow-sm';
    wrapper.style.borderLeft = `6px solid ${statusColor}`;

    const inner = document.createElement('div');
    inner.innerHTML = `
      <div style="display:flex;justify-content:space-between;align-items:flex-start">
        <div style="flex:1;padding-right:12px">
          <div style="font-weight:700;color:#111827">${title}</div>
          <div style="font-size:13px;color:#6b7280;margin-top:6px">Status: <strong style="color:${statusColor}">${safeText(sub.status || 'on review')}</strong></div>
          <div style="font-size:12px;color:#9ca3af;margin-top:6px">${safeText(date)}</div>
        </div>
        <div style="flex-shrink:0">
          <button class="aff2-view-submission-btn" data-id="${safeText(id)}" style="background:#2563eb;color:#fff;border:none;padding:8px 10px;border-radius:8px;cursor:pointer">View</button>
        </div>
      </div>
    `;
    wrapper.appendChild(inner);

    // images grid
    const grid = document.createElement('div');
    grid.style.cssText = 'display:grid;grid-template-columns:repeat(auto-fit,minmax(120px,1fr));gap:8px;margin-top:10px';
    if (urls.length) {
      urls.forEach(u => {
        const img = document.createElement('img');
        img.src = u;
        img.style.cssText = 'width:100%;max-height:200px;object-fit:contain;border-radius:8px';
        grid.appendChild(img);
      });
    } else {
      const p = document.createElement('div');
      p.textContent = 'No proof images';
      p.style.cssText = 'color:#9ca3af';
      grid.appendChild(p);
    }
    wrapper.appendChild(grid);

    if (sub.note) {
      const note = document.createElement('div');
      note.style.cssText = 'margin-top:10px;color:#374151';
      note.innerHTML = `<strong>Note:</strong> ${safeText(sub.note)}`;
      wrapper.appendChild(note);
    }

    return wrapper;
  }

  /* ---------- open submission modal (fetch by id) ---------- */
  async function openSubmissionModal(subId) {
    try {
      const doc = await db.collection('affiliate_submissions').doc(subId).get();
      if (!doc.exists) return alert('Submission not found.');
      const sub = { id: doc.id, ...doc.data() };
      const jobDoc = sub.jobId ? await db.collection('affiliateJobs').doc(sub.jobId).get() : null;
      const job = jobDoc && jobDoc.exists ? jobDoc.data() : {};

      const modal = document.createElement('div');
      modal.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.5);display:flex;align-items:center;justify-content:center;z-index:9999;padding:16px';
      const box = document.createElement('div');
      box.style.cssText = 'max-width:900px;width:100%;max-height:90vh;overflow:auto;background:#fff;border-radius:12px;padding:20px';
      box.innerHTML = `
        <div style="display:flex;justify-content:space-between;align-items:center">
          <h3 style="margin:0">${safeText(job.title || 'Submission')}</h3>
          <button id="aff2_modal_close" style="background:#ef4444;color:#fff;border:none;padding:6px 10px;border-radius:8px;cursor:pointer">Close</button>
        </div>
        <div style="margin-top:8px;color:#6b7280"><strong>Status:</strong> ${safeText(sub.status || 'on review')}</div>
        <div style="font-size:13px;color:#9ca3af;margin-top:6px">${(sub.createdAt && sub.createdAt.toDate) ? sub.createdAt.toDate().toLocaleString() : ''}</div>
        <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:12px;margin-top:12px">
          ${(sub.proofFiles||sub.proofURLs||[]).map(u => `<img src="${safeText(u)}" style="width:100%;max-height:400px;object-fit:contain;border-radius:8px">`).join('') || '<div style="color:#9ca3af">No proof images</div>'}
        </div>
        ${sub.note ? `<div style="margin-top:12px;color:#374151"><strong>Note:</strong> ${safeText(sub.note)}</div>` : ''}
      `;
      modal.appendChild(box);
      document.body.appendChild(modal);
      box.querySelector('#aff2_modal_close').addEventListener('click', ()=> modal.remove());
      modal.addEventListener('click', (ev)=> { if (ev.target === modal) modal.remove(); });

    } catch (err) {
      console.error('[AFF2] openSubmissionModal', err);
      alert('Failed to load submission.');
    }
  }

  /* ---------- delegation handler ---------- */
  function onDocClick(e) {
    const t = e.target;

    // view task button on card
    const jobBtn = t.closest && t.closest('.aff2-btn-view');
    if (jobBtn) {
      const id = jobBtn.dataset.id;
      if (id) openJobDetail(id);
      return;
    }

    // view finished submission
    const viewSub = t.closest && t.closest('.aff2-view-submission-btn');
    if (viewSub) {
      const id = viewSub.dataset.id;
      if (id) openSubmissionModal(id);
      return;
    }

    // open finished
    if (t.id === 'aff2_openFinishedBtn' || (t.closest && t.closest('#aff2_openFinishedBtn'))) {
      el('aff2_jobsContainer')?.classList.add('aff2-hidden');
      el('aff2_jobDetailScreen')?.classList.add('aff2-hidden');
      el('aff2_finishedScreen')?.classList.remove('aff2-hidden');
      loadAndRenderFinished();
      return;
    }

    // back to list
    if (t.id === 'aff2_backToListBtn' || t.id === 'aff2_backToMainBtn' || (t.closest && t.closest('#aff2_backToListBtn'))) {
      el('aff2_jobDetailScreen')?.classList.add('aff2-hidden');
      el('aff2_finishedScreen')?.classList.add('aff2-hidden');
      el('aff2_jobsContainer')?.classList.remove('aff2-hidden');
      loadAndRenderJobs();
      return;
    }

    // search main input (optional)
    const sMain = el('aff2_searchMain');
    if (sMain && (t === sMain || t.closest && t.closest('#aff2_searchMain'))) {
      // handled by input event below
    }
  }

  /* ---------- search hookups ---------- */
  function hookSearchInputs() {
    const sMain = el('aff2_searchMain');
    if (sMain) {
      let to = null;
      sMain.addEventListener('input', () => {
        clearTimeout(to);
        to = setTimeout(() => {
          const q = sMain.value.trim().toLowerCase();
          const grid = el('aff2_grid') || el('aff2_jobsList');
          if (!grid) return;
          [...grid.children].forEach(card => {
            const txt = (card.innerText || '').toLowerCase();
            card.style.display = txt.includes(q) ? '' : 'none';
          });
        }, 160);
      });
    }

    const sFinished = el('aff2_searchFinished');
    if (sFinished) {
      sFinished.addEventListener('input', () => {
        const q = sFinished.value.trim().toLowerCase();
        const list = el('aff2_finishedList');
        if (!list) return;
        [...list.children].forEach(card => {
          const txt = (card.innerText || '').toLowerCase();
          card.style.display = txt.includes(q) ? '' : 'none';
        });
      });
    }
  }

  /* ---------- init / destroy ---------- */
  function init() {
    // delegation
    document.addEventListener('click', onDocClick);
    state.handlers.push({ el: document, ev: 'click', fn: onDocClick });

    // hook search
    hookSearchInputs();

    // initial load
    loadAndRenderJobs();
  }

  function destroy() {
    for (const h of state.handlers) {
      try { h.el.removeEventListener(h.ev, h.fn); } catch(_) {}
    }
    state.handlers = [];
    try { if (el('aff2_jobDetailContent')) el('aff2_jobDetailContent').innerHTML = ''; } catch(_) {}
    try { if (el('aff2_grid')) el('aff2_grid').innerHTML = ''; } catch(_) {}
    try { if (el('aff2_finishedList')) el('aff2_finishedList').innerHTML = ''; } catch(_) {}
    try { delete window.AFF2_COMPLETE_FINAL; } catch(_) { window.AFF2_COMPLETE_FINAL = null; }
  }

  // export
  window.AFF2 = { init, destroy, loadAndRenderJobs, loadAndRenderFinished, openJobDetail };

  // auto init
  setTimeout(()=>{ try{ init(); } catch(e){ console.error(e); } }, 10);

})();



                                                 //SOCIAL TASK FUNCTION



function copyToClipboard(id) {
  const text = document.getElementById(id).innerText;
  navigator.clipboard.writeText(text).then(() => {
    alert("Text copied to clipboard!");
  });
}

function showTask(taskId) {
  // Hide all task screens
  document.getElementById('social-tasks-main').classList.add('hidden');
  document.querySelectorAll('.tab-section').forEach(el => el.classList.add('hidden'));

  // Show selected task screen
  const selected = document.getElementById(taskId);
  if (selected) {
    selected.classList.remove('hidden');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  } else {
    console.error(`No element with ID '${taskId}' found.`);
  }
}

function submitTikTok() {
  document.getElementById('tiktok-confirmation').classList.remove('hidden');
}
function submitWhatsApp() {
  document.getElementById('whatsapp-confirmation').classList.remove('hidden');
}
function submitTelegram() {
  document.getElementById('telegram-confirmation').classList.remove('hidden');
}









                                    // TikTok Instagram function



// ---------- TikTok/Instagram Task Helpers ----------
let uploadedScreenshotUrl = "";
let isUploadingScreenshot = false;
const TIKTOK_SUBMIT_KEY = "tiktokTaskSubmitted"; // localStorage key

function previewAsset(src) {
  const img = document.getElementById("assetPreviewImg");
  const modal = document.getElementById("assetPreviewModal");
  if (img && modal) {
    img.src = src;
    modal.classList.remove("hidden");
  }
}
function closePreview() {
  const modal = document.getElementById("assetPreviewModal");
  if (modal) modal.classList.add("hidden");
}

// Upload screenshot using global uploader (from main.js)
async function handleScreenshotUpload(e) {
  const statusEl = document.getElementById("uploadStatus");
  const previewEl = document.getElementById("uploadedPreview");
  const submitBtn = document.querySelector("#tiktok-task [data-submit]");
  const file = e.target.files && e.target.files[0];

  if (!file) return;

  uploadedScreenshotUrl = "";
  isUploadingScreenshot = true;
  if (submitBtn) submitBtn.disabled = true;
  if (statusEl) statusEl.textContent = "Uploading...";

  try {
    const url = await window.uploadToCloudinary(file);
    uploadedScreenshotUrl = url;
    if (statusEl) statusEl.textContent = "✅ Upload successful";
    if (previewEl) {
      previewEl.src = url;
      previewEl.classList.remove("hidden");
    }
  } catch (err) {
    console.error("Cloudinary upload error:", err);
    if (statusEl) statusEl.textContent = "❌ Upload failed: " + (err?.message || "Unknown error");
  } finally {
    isUploadingScreenshot = false;
    if (submitBtn) submitBtn.disabled = false;
  }
}

// Submit to Firestore -> TiktokInstagram
async function submitTikTokTask() {
  const profileLink = document.getElementById("profileLink")?.value.trim();
  const videoLink   = document.getElementById("videoLink")?.value.trim();
  const username    = document.getElementById("username")?.value.trim();
  const submitBtn   = document.querySelector("#tiktok-task [data-submit]");

  if (isUploadingScreenshot) {
    alert("Please wait — screenshot is still uploading.");
    return;
  }
  if (!profileLink || !videoLink || !username || !uploadedScreenshotUrl) {
    alert("⚠️ Please fill in all fields and upload a screenshot.");
    return;
  }
  const looksLikeUrl = (s) => /^https?:\/\/\S+\.\S+/.test(s);
  if (!looksLikeUrl(profileLink) || !looksLikeUrl(videoLink)) {
    alert("⚠️ Please enter valid links (must start with http/https).");
    return;
  }

  const _auth = window.auth || firebase?.auth?.();
  const _db   = window.db   || firebase?.firestore?.();

  if (!_auth || !_db) {
    alert("Firebase not initialized on this page.");
    return;
  }

  const user = _auth.currentUser;
  if (!user) {
    alert("Please log in to submit.");
    return;
  }

  try {
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.textContent = "Submitting...";
    }

    // 🔑 store with user.uid as doc ID (1 per user)
    await _db.collection("TiktokInstagram").doc(user.uid).set({
      profileLink,
      videoLink,
      username,
      screenshot: uploadedScreenshotUrl,
      status: "on review",
      followerRequirement: ">=1000",
      submittedAt: firebase.firestore.FieldValue.serverTimestamp(),
      submittedBy: user.uid
    });

    // ✅ Save local flag
    localStorage.setItem(TIKTOK_SUBMIT_KEY, "true");

    // ✅ Alert + redirect
    alert("✅ Your TikTok/Instagram task has been submitted and is awaiting admin approval.");
    location.hash = "#dashboard";

    // reset
    uploadedScreenshotUrl = "";
  } catch (err) {
    console.error("Submit error:", err);
    alert("❌ Failed to submit: " + (err?.message || "Unknown error"));
  } finally {
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.textContent = "🚀 Submit for Review";
      applyTikTokSubmitState();
    }
  }
}

// 🔄 Keep button blurred after reload if already submitted
async function applyTikTokSubmitState() {
  const submitBtn = document.querySelector("#tiktok-task [data-submit]");
  if (!submitBtn) return;

  const _auth = window.auth || firebase?.auth?.();
  const _db   = window.db   || firebase?.firestore?.();
  const user  = _auth?.currentUser;
  if (!user || !_db) return;

  try {
    const doc = await _db.collection("TiktokInstagram").doc(user.uid).get();

    if (doc.exists) {
      // ✅ Already submitted
      submitBtn.disabled = true;
      submitBtn.classList.add("opacity-50", "cursor-not-allowed");
      submitBtn.textContent = "✅ Already Submitted";
      localStorage.setItem(TIKTOK_SUBMIT_KEY, "true");
    } else {
      // ❌ Reset
      submitBtn.disabled = false;
      submitBtn.classList.remove("opacity-50", "cursor-not-allowed");
      submitBtn.textContent = "🚀 Submit for Review";
      localStorage.removeItem(TIKTOK_SUBMIT_KEY);
    }
  } catch (err) {
    console.error("State check error:", err);
  }
}

// Run on load
document.addEventListener("DOMContentLoaded", () => {
  firebase.auth().onAuthStateChanged(() => applyTikTokSubmitState());
});

// expose globally
window.previewAsset = previewAsset;
window.closePreview = closePreview;
window.handleScreenshotUpload = handleScreenshotUpload;
window.submitTikTokTask = submitTikTokTask;









            

// ---------- WhatsApp Task Helpers ----------
let whatsappProofs = [];
let isUploadingProof = false;
const SUBMIT_KEY = "whatsappTaskSubmitted"; // 🔑 localStorage key



async function handleProofUpload(input, previewId) {
  const file = input.files && input.files[0];
  const previewEl = document.getElementById(previewId);

  if (!file) return;

  isUploadingProof = true;
  if (previewEl) {
    previewEl.classList.remove("hidden");
    previewEl.src = "";
  }

  try {
    // 👇 use global uploadToCloudinary from main.js
    const url = await window.uploadToCloudinary(file);
    whatsappProofs.push(url);

    if (previewEl) {
      previewEl.src = url;
      previewEl.classList.remove("hidden");
    }
  } catch (err) {
    console.error("Cloudinary upload error:", err);
    alert("❌ Upload failed: " + (err?.message || "Unknown error"));
  } finally {
    isUploadingProof = false;
  }
}

async function submitWhatsAppTask() {
  const number = document.getElementById("whatsappNumber")?.value.trim();
  const submitBtn = document.querySelector("#whatsapp-task button[onclick*='submitWhatsAppTask']");

  if (isUploadingProof) {
    alert("Please wait — proof is still uploading.");
    return;
  }
  if (!number || whatsappProofs.length < 4) {
    alert("⚠️ Enter your WhatsApp number and upload at least 4 screenshots.");
    return;
  }

  const _auth = window.auth || firebase?.auth?.();
  const _db   = window.db   || firebase?.firestore?.();

  if (!_auth || !_db) {
    alert("Firebase not initialized.");
    return;
  }

  const user = _auth.currentUser;
  if (!user) {
    alert("Please log in to submit.");
    return;
  }

  try {
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.textContent = "Submitting...";
    }

    await _db.collection("Whatsapp").doc(user.uid).set({
      whatsappNumber: number,
      proofs: whatsappProofs,
      status: "on review",
      submittedAt: firebase.firestore.FieldValue.serverTimestamp(),
      submittedBy: user.uid
    });

    // ✅ Save state to localStorage
    localStorage.setItem(SUBMIT_KEY, "true");

    // ✅ Alert + redirect to dashboard
    alert("✅ Your WhatsApp task has been submitted and is awaiting admin approval.");
    location.hash = "#dashboard"; // jump to section with id="dashboard"

    whatsappProofs = []; // reset after success
  } catch (err) {
    console.error("Submit error:", err);
    alert("❌ Failed to submit: " + (err?.message || "Unknown error"));
  } finally {
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.textContent = "🚀 Submit for Review";
      applySubmitState(); // refresh button state
    }
  }
}

// 🔄 Keep button blurred after reload if already submitted
async function applySubmitState() {
  const submitBtn = document.querySelector("#whatsapp-task button[onclick*='submitWhatsAppTask']");
  if (!submitBtn) return;

  const _auth = window.auth || firebase?.auth?.();
  const _db   = window.db   || firebase?.firestore?.();

  const user = _auth?.currentUser;
  if (!user || !_db) return;

  try {
    const doc = await _db.collection("Whatsapp").doc(user.uid).get();

    if (doc.exists) {
      // ✅ Already submitted
      submitBtn.disabled = true;
      submitBtn.classList.add("opacity-50", "cursor-not-allowed");
      submitBtn.textContent = "✅ Already Submitted";
      localStorage.setItem(SUBMIT_KEY, "true");
    } else {
      // ❌ No submission found → reset
      submitBtn.disabled = false;
      submitBtn.classList.remove("opacity-50", "cursor-not-allowed");
      submitBtn.textContent = "🚀 Submit for Review";
      localStorage.removeItem(SUBMIT_KEY);
    }
  } catch (err) {
    console.error("State check error:", err);
  }
}

// Run on load
document.addEventListener("DOMContentLoaded", () => {
  // wait for firebase auth to be ready
  firebase.auth().onAuthStateChanged(() => applySubmitState());
});

// expose globally
window.handleProofUpload = handleProofUpload;
window.submitWhatsAppTask = submitWhatsAppTask;



















 // ---------- Telegram Task Helpers ----------






// ---------- Telegram Task Helpers ----------
let telegramProofs = [];
let isUploadingTelegram = false;
const TELEGRAM_SUBMIT_KEY = "telegramTaskSubmitted";

// 📋 Copy promo message
function copyTelegramMessage() {
  const msg = document.getElementById("telegramMessage").innerText;
  navigator.clipboard.writeText(msg).then(() => {
    alert("📋 Message copied! Paste it in 3 Telegram groups.");
  });
}

// 📤 Upload screenshot
async function handleTelegramUpload(input, index) {
  const file = input.files && input.files[0];
  const previewEl = document.getElementById(`tgPreview${index + 1}`);

  if (!file) return;

  isUploadingTelegram = true;
  if (previewEl) {
    previewEl.classList.remove("hidden");
    previewEl.src = "";
  }

  try {
    const url = await window.uploadToCloudinary(file);
    telegramProofs[index] = url;

    if (previewEl) {
      previewEl.src = url;
      previewEl.classList.remove("hidden");
    }
  } catch (err) {
    console.error("Cloudinary upload error:", err);
    alert("❌ Upload failed: " + (err?.message || "Unknown error"));
  } finally {
    isUploadingTelegram = false;
  }
}

// 🚀 Submit Telegram Task
async function submitTelegramTask() {
  const username = document.getElementById("telegramUsername")?.value.trim();
  const g1 = document.getElementById("tgGroup1")?.value.trim();
  const g2 = document.getElementById("tgGroup2")?.value.trim();
  const g3 = document.getElementById("tgGroup3")?.value.trim();
  const submitBtn = document.querySelector("#telegram-task [data-submit]");
  const tgPattern = /^https?:\/\/t\.me\/.+/;

  if (isUploadingTelegram) {
    alert("Please wait — screenshots are still uploading.");
    return;
  }
  if (!username || !g1 || !g2 || !g3 || telegramProofs.filter(Boolean).length < 3) {
    alert("⚠️ Please fill all fields, add 3 links, and upload 3 screenshots.");
    return;
  }
  if (!tgPattern.test(g1) || !tgPattern.test(g2) || !tgPattern.test(g3)) {
    alert("⚠️ Invalid group links. They must start with https://t.me/");
    return;
  }

  const _auth = window.auth || firebase?.auth?.();
  const _db   = window.db   || firebase?.firestore?.();
  if (!_auth || !_db) {
    alert("Firebase not initialized.");
    return;
  }
  const user = _auth.currentUser;
  if (!user) {
    alert("Please log in to submit.");
    return;
  }

  try {
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.textContent = "Submitting...";
    }

    await _db.collection("Telegram").doc(user.uid).set({
      username,
      groupLinks: [g1, g2, g3],
      proofs: telegramProofs,
      status: "on review",
      submittedAt: firebase.firestore.FieldValue.serverTimestamp(),
      submittedBy: user.uid
    });

    // ✅ Save to localStorage
    localStorage.setItem(TELEGRAM_SUBMIT_KEY, "true");

    alert("✅ Telegram task submitted successfully!");
    location.hash = "#dashboard";

    document.getElementById("telegram-confirmation")?.classList.remove("hidden");

    telegramProofs = []; // reset after success
  } catch (err) {
    console.error("Submit error:", err);
    alert("❌ Failed to submit: " + (err?.message || "Unknown error"));
  } finally {
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.textContent = "🚀 Submit for Review";
      applyTelegramSubmitState();
    }
  }
}

// 🔄 Keep button disabled after reload if already submitted
async function applyTelegramSubmitState() {
  const submitBtn = document.querySelector("#telegram-task [data-submit]");
  if (!submitBtn) return;

  const _auth = window.auth || firebase?.auth?.();
  const _db   = window.db   || firebase?.firestore?.();
  const user  = _auth?.currentUser;
  if (!user || !_db) return;

  try {
    const doc = await _db.collection("Telegram").doc(user.uid).get();

    if (doc.exists) {
      submitBtn.disabled = true;
      submitBtn.classList.add("opacity-50", "cursor-not-allowed");
      submitBtn.textContent = "✅ Already Submitted";
      localStorage.setItem(TELEGRAM_SUBMIT_KEY, "true");
    } else {
      submitBtn.disabled = false;
      submitBtn.classList.remove("opacity-50", "cursor-not-allowed");
      submitBtn.textContent = "🚀 Submit for Review";
      localStorage.removeItem(TELEGRAM_SUBMIT_KEY);
    }
  } catch (err) {
    console.error("State check error:", err);
  }
}

// Run on load
document.addEventListener("DOMContentLoaded", () => {
  firebase.auth().onAuthStateChanged(() => applyTelegramSubmitState());
});

// 🌍 expose globally
window.handleTelegramUpload = handleTelegramUpload;
window.submitTelegramTask = submitTelegramTask;
window.copyTelegramMessage = copyTelegramMessage;






















                                                              // LOGOUT
															  

  // 🔐 Global Logout Function (works for both button & sidebar link)
window.logoutUser = function logoutUser() {
  const loader = document.getElementById("pageLoader");
  if (loader) loader.classList.add("show");

  firebase.auth().signOut()
    .then(() => {
      setTimeout(() => {
        if (loader) loader.classList.remove("show");
        alert("Logged out successfully");
        window.location.href = "/"; // redirect to login/landing
      }, 400);
    })
    .catch((error) => {
      console.error("Logout Error:", error);
      if (loader) loader.classList.remove("show");
      alert("Error logging out. Try again.");
    });
};








// EARNING Swiper Function



(function (w, d) {
  // Prevent multiple instances
  if (w.__balanceCtrl && typeof w.__balanceCtrl.stop === "function") w.__balanceCtrl.stop();

  // Helpers
  function fmtNaira(n) {
    return "₦" + (Number(n) || 0).toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  }

  function coerceNumber(val) {
    if (val == null) return 0;
    if (typeof val === "number") return isFinite(val) ? val : 0;
    let s = String(val).replace(/[₦,\s]/g, "");
    let n = parseFloat(s);
    return isFinite(n) ? n : 0;
  }

  function animateNumber(el, from, to, duration = 600) {
    if (!el) return;
    if (from === to) {
      el.textContent = fmtNaira(to);
      return;
    }
    const start = performance.now();
    const diff = to - from;
    cancelAnimationFrame(el.__rafId);
    const step = (t) => {
      const p = Math.min((t - start) / duration, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      const val = from + diff * eased;
      el.textContent = fmtNaira(val);
      if (p < 1) el.__rafId = requestAnimationFrame(step);
    };
    el.__rafId = requestAnimationFrame(step);
  }

  const ctrl = {
    auth: null,
    db: null,
    unsubUser: null,
    balanceEl: null,
    currentValue: 0,
    lastShownValue: 0,
    isHidden: JSON.parse(localStorage.getItem("balanceHidden") || "false"),

    init() {
      this.balanceEl = d.getElementById("balance");
      const toggleBtn = d.getElementById("toggleBalanceBtn");
      if (toggleBtn && !toggleBtn.__bound) {
        toggleBtn.addEventListener("click", () => this.toggleHidden(), { passive: true });
        toggleBtn.__bound = true;
      }

      // seed initial balance
      if (this.balanceEl) {
        const seed = coerceNumber(this.balanceEl.dataset.value || this.balanceEl.textContent);
        this.currentValue = this.lastShownValue = seed;
        this.balanceEl.textContent = this.isHidden ? "₦****" : fmtNaira(seed);
      }
    },

    start() {
      this.init();
      if (!w.firebase || !firebase.apps.length) {
        console.warn("Firebase not ready for balance listener");
        return;
      }
      this.auth = firebase.auth();
      this.db = firebase.firestore();

      this.auth.onAuthStateChanged((user) => {
        if (this.unsubUser) this.unsubUser();
        if (!user) return;

        const ref = this.db.collection("users").doc(user.uid);
        this.unsubUser = ref.onSnapshot((snap) => {
          if (!snap.exists) return;
          const next = coerceNumber(snap.data().balance);
          if (next === this.currentValue || !this.balanceEl) return;

          const from = this.lastShownValue || this.currentValue;
          this.currentValue = next;
          this.lastShownValue = next;
          if (this.isHidden) {
            this.balanceEl.textContent = "₦****";
          } else {
            animateNumber(this.balanceEl, from, next, 700);
          }
        });
      });
    },

    toggleHidden() {
      this.isHidden = !this.isHidden;
      localStorage.setItem("balanceHidden", JSON.stringify(this.isHidden));
      if (!this.balanceEl) return;
      if (this.isHidden) {
        this.balanceEl.textContent = "₦****";
      } else {
        animateNumber(this.balanceEl, 0, this.currentValue, 400);
      }
    },

    stop() {
      if (this.unsubUser) this.unsubUser();
      this.unsubUser = null;
      cancelAnimationFrame(this.balanceEl?.__rafId);
    }
  };

  w.__balanceCtrl = ctrl;

  // Auto start on DOM ready
  if (d.readyState === "loading") {
    d.addEventListener("DOMContentLoaded", () => ctrl.start(), { once: true });
  } else {
    ctrl.start();
  }

  w.addEventListener("beforeunload", () => ctrl.stop(), { passive: true });
})(window, document);


                                                       
														 





   












                                                                                    // Active Tab






                                                                                    // Active Tab
															  



// ---------- NAV HELPERS (drop-in replacement) ----------

    

// ---------- NAV HELPERS ----------
function getNavElems() {
  return {
    topNavbar: document.getElementById('topNavbar'),
    bottomNavbar: document.getElementById('bottomNavbar') || document.getElementById('bottomNav'),
    backArrowBar: document.getElementById('backArrowBar') || document.getElementById('backArrow')
  };
}

/**
 * Top nav only on dashboard
 */
function updateNavbarVisibility(tabId) {
  const { topNavbar, backArrowBar } = getNavElems();
  const showTop = tabId === 'dashboard';

  if (topNavbar) {
    topNavbar.classList.toggle('hidden', !showTop);
    topNavbar.style.removeProperty('display');
  }
  if (backArrowBar) {
    backArrowBar.classList.toggle('hidden', showTop);
  }

  window.currentActiveTab = tabId;
}

// ---------- switchTab ----------
window.switchTab = function(tabId) {
  // hide all tab sections
  document.querySelectorAll('.tab-section').forEach(sec => sec.classList.add('hidden'));

  // show active section
  const active = document.getElementById(tabId);
  if (active) {
    active.classList.remove('hidden');
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  const bottomNav = document.getElementById('bottomNavbar') || document.getElementById('bottomNav');
  const backArrow = document.getElementById('backArrowBar') || document.getElementById('backArrow');

  // tabs where bottom nav should appear
  const allowedTabs = ['dashboard','games','transactions-screen','checkin-section','team'];

  if (bottomNav) {
    if (allowedTabs.includes(tabId)) bottomNav.classList.remove('hidden');
    else bottomNav.classList.add('hidden');
  }

  if (backArrow) {
    if (allowedTabs.includes(tabId)) backArrow.classList.add('hidden');
    else backArrow.classList.remove('hidden');
  }

  // keep top nav consistent
  updateNavbarVisibility(tabId);
};

// ---------- activateTab ----------
// ---------- activateTab ----------
window.activateTab = function(tabId) {
  switchTab(tabId);

  // highlight nav-btn
  const allNavBtns = document.querySelectorAll('.nav-btn');
  allNavBtns.forEach(btn => btn.classList.remove('active-nav'));
  const activeBtn = document.getElementById(`nav-${tabId}`);
  if (activeBtn) activeBtn.classList.add('active-nav');

  // ---------- LAZY INIT ----------
  const activeSection = document.getElementById(tabId);
  if (!activeSection.dataset.loaded) {
    switch(tabId) {
      

      case 'payment':
        initPaymentSection();
        break;

      case 'taskSection':
        initTaskSection();
        break;

      case 'team':
        initReferralTab(); // only run referral logic when tab opens
        break;

      case 'aff2_root':
        AffiliateV2.init(); // only initialize when the tab is active
        break;

      


			case 'checkin-screen':
                  initCheckinSection();
              break;


			case 'transactions-screen':
  initTransactionSection();
  break;

      // add other tabs here as you wrap them
    }
    activeSection.dataset.loaded = "true";
  }
};

// ---------- Sidebar close ----------
function closeSidebar(fromLink = false) {
  const sidebar = document.getElementById("sidebar");
  const hamburgerIcon = document.getElementById("hamburgerIcon");
  const bottomNavbar = document.getElementById('bottomNavbar') || document.getElementById('bottomNav');

  if (sidebar) sidebar.classList.add("-translate-x-full");
  if (hamburgerIcon) hamburgerIcon.classList.remove("rotate-90");
  const blurOverlay = document.getElementById("blurOverlay");
  if (blurOverlay) blurOverlay.classList.add("hidden");

  const topNavbar = document.getElementById("topNavbar");
  if (topNavbar) topNavbar.classList.remove("z-10");
  if (bottomNavbar) bottomNavbar.classList.remove("z-10");
}

// ---------- Hamburger toggle ----------
const hamburgerBtn = document.getElementById("hamburgerBtn");
const sidebar = document.getElementById("sidebar");
const hamburgerIcon = document.getElementById("hamburgerIcon");
const blurOverlay = document.getElementById("blurOverlay") || (() => {
  const el = document.createElement("div");
  el.id = "blurOverlay";
  el.className = "fixed inset-0 bg-black bg-opacity-40 backdrop-blur-sm z-40 hidden";
  document.body.appendChild(el);
  return el;
})();

if (hamburgerBtn) {
  hamburgerBtn.addEventListener("click", () => {
    const isOpening = sidebar.classList.contains("-translate-x-full");

    sidebar.classList.toggle("-translate-x-full");
    hamburgerIcon.classList.toggle("rotate-90");
    blurOverlay.classList.toggle("hidden");

    const { topNavbar, bottomNavbar } = getNavElems();
    if (isOpening) {
      if (topNavbar) topNavbar.classList.add("z-10");
      if (bottomNavbar) bottomNavbar.classList.add("z-10");
    } else {
      if (topNavbar && !topNavbar.classList.contains("hidden")) topNavbar.classList.remove("z-10");
      if (bottomNavbar) bottomNavbar.classList.remove("z-10");
    }
  });
}

// ---------- Close sidebar when clicking overlay ----------
document.addEventListener("click", (event) => {
  if (!sidebar || !hamburgerBtn || !blurOverlay) return;

  const isClickInsideSidebar = sidebar.contains(event.target);
  const isClickOnHamburger = hamburgerBtn.contains(event.target);
  const isClickOnOverlay = blurOverlay.contains(event.target);

  if (!isClickInsideSidebar && !isClickOnHamburger && isClickOnOverlay) {
    closeSidebar();
  }
});

// ---------- Sidebar link clicks ----------
if (sidebar) {
  const sidebarLinks = sidebar.querySelectorAll("a");
  sidebarLinks.forEach((link) => {
    link.addEventListener("click", (e) => {
      const href = link.getAttribute('href') || '';
      const dataTarget = link.dataset.target;
      const target = dataTarget || (href.startsWith('#') ? href.slice(1) : null);

      if (target) {
        e.preventDefault();
        activateTab(target);
      }
      closeSidebar(true);
    });
  });
}

// ---------- Initialize ----------
document.addEventListener('DOMContentLoaded', () => {
  const initial = window.currentActiveTab || 'dashboard';
  switchTab(initial);
});

// ---------- SIDEBAR USER INFO ----------
firebase.auth().onAuthStateChanged(async (user) => {
  if (!user) {
    document.getElementById("userFullName").innerText = "Guest";
    document.getElementById("userEmail").innerText = "";
    document.getElementById("profilePicPreview").src = "profile-placeholder.png";
    return;
  }

  try {
    const userDoc = await firebase.firestore().collection("users").doc(user.uid).get();
    const data = userDoc.exists ? userDoc.data() : {};

    const fullname = data.fullname || data.fullName || user.displayName || "No Name";
    const email = data.email || user.email || "No Email";
    const profilePic = data.profilePic || user.photoURL || "profile-placeholder.png";

    document.getElementById("userFullName").innerText = fullname;
    document.getElementById("userEmail").innerText = email;
    document.getElementById("profilePicPreview").src = profilePic;
  } catch (err) {
    console.error("❌ Sidebar fetch error:", err);
    document.getElementById("userFullName").innerText = "Guest";
    document.getElementById("userEmail").innerText = "";
    document.getElementById("profilePicPreview").src = "profile-placeholder.png";
  }
});




  








                                                                                  // 🌀 Swiper Setup
																				  
document.addEventListener("DOMContentLoaded", function () {
  new Swiper('.tab-swiper', {
    slidesPerView: 3,
    spaceBetween: 10,
    freeMode: true,
    grabCursor: true,
  });

  new Swiper('.settings-swiper', {
    loop: true,
    pagination: {
      el: '.swiper-pagination',
      clickable: true,
    },
    autoplay: {
      delay: 5000,
      disableOnInteraction: false,
    },
  });

  new Swiper('.competition-swiper', {
    slidesPerView: 1.1,
    spaceBetween: 20,
    pagination: {
      el: '.swiper-pagination',
      clickable: true,
    },
    breakpoints: {
      768: {
        slidesPerView: 2.5,
      },
    }
  });
});










                                                           // TEAM FUNCTION





// ========================
// CONFIG
// ========================
const BASE_URL = "https://globalstasks.name.ng"; // your root link

// ========================
// HELPERS
// ========================
function money(n){ return `₦${Number(n).toLocaleString()}`; }

// Web Share API
async function shareReferral() {
  try {
    const el = document.getElementById("teamRefLinkVisible") || document.getElementById("teamRefLink");
    const link = el?.value || "";
    if (!link) return;

    if (navigator.share) {
      await navigator.share({
        title: "Join GLOBALS",
        text: "Sign up on GLOBALS with my link and get started.",
        url: link
      });
    } else {
      await navigator.clipboard.writeText(link);
      alert("Share not supported on this device. Link copied instead.");
    }
  } catch (e) {}
}

// Copy link
window.copyTeamRefLink = async function () {
  const el = document.getElementById("teamRefLinkVisible") || document.getElementById("teamRefLink");
  const link = el?.value || "";
  if (!link) return;

  await navigator.clipboard.writeText(link);
  const msg = document.getElementById("teamCopyMsg");
  if (msg) {
    msg.classList.remove("hidden");
    setTimeout(()=>msg.classList.add("hidden"), 1800);
  }
}

// Open T&C
function openTerms() {
  const el = document.getElementById("termsScreen");
  if (el) {
    el.scrollIntoView({ behavior: "smooth", block: "start" });
  } else {
    location.hash = "#termsScreen";
  }
}

// ========================
// FIREBASE BINDINGS
// ========================



// ========================
// REFERRAL INIT (runs only once per reload)
// ========================
let referralTabLoaded = false; // ✅ Added flag

function initReferralTab() {
  if (referralTabLoaded) {
    console.log("Referral tab already loaded, skipping reload");
    return; // 🚫 Prevent auto re-fetching again
  }
  referralTabLoaded = true; // ✅ Mark as loaded once

  auth.onAuthStateChanged(async (user) => {
    if (!user) return;

    // get current user's username (referrer)
    const userDoc = await db.collection("users").doc(user.uid).get();
    const data = userDoc.data() || {};
    const username = (data.username || "user").toString();

    // Build referral link
    const referralLink = `${BASE_URL}/signup.html?ref=${encodeURIComponent(username)}`;
    const inputA = document.getElementById("teamRefLink");
    const inputB = document.getElementById("teamRefLinkVisible");
    if (inputA) inputA.value = referralLink;
    if (inputB) inputB.value = referralLink;

    // Load referrals (one-time snapshot)
    const invitedSnap = await db.collection("users").where("referrer", "==", username).get();

    let invitedCount = 0;
    let rewardedCount = 0;
    const container = document.getElementById("referralList");
    if (container) container.innerHTML = "";

    const creditTasks = [];
    invitedSnap.forEach((docSnap) => {
      const u = docSnap.data();
      invitedCount += 1;
      const isPremium = !!u.is_Premium;
      const alreadyCredited = !!u.referralBonusCredited;
      if (isPremium) rewardedCount += 1;

      if (container) {
        container.innerHTML += generateReferralCard({
          username: u.username || (u.name || "User"),
          email: u.email || "",
          profile: u.profile || "",
          premium: isPremium,
        });
      }

      if (isPremium && !alreadyCredited) {
        creditTasks.push(processReferralCreditTx(docSnap.id, user.uid));
      }
    });

    if (creditTasks.length) {
      try {
        await Promise.all(creditTasks);
      } catch (e) {
        console.error("Credit errors:", e);
      }
    }

    // Update counters
    const invitedCountEl = document.getElementById("invitedCount");
    const rewardedCountEl = document.getElementById("rewardedCount");
    if (invitedCountEl) invitedCountEl.innerText = invitedCount;
    if (rewardedCountEl) rewardedCountEl.innerText = rewardedCount;

    console.log("Referral data loaded once");
  });
}

		
// ========================
// CARD UI
// ========================
function generateReferralCard(user) {
  const initials = (user.username || "U").slice(0, 1).toUpperCase();
  const amount = user.premium ? 500 : 0;

  return `
    <div class="bg-white/80 backdrop-blur-md rounded-3xl shadow-lg p-4 flex items-center justify-between gap-4 hover:shadow-2xl transition duration-300 ease-in-out">
      <!-- Left: Avatar & Info -->
      <div class="flex items-center gap-4">
        ${user.profile
          ? `<img src="${user.profile}" class="w-12 h-12 rounded-full object-cover border-2 border-indigo-500" alt="${user.username}">`
          : `<div class="w-12 h-12 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-lg border-2 border-indigo-300">${initials}</div>`
        }
        <div class="flex flex-col">
          <p class="font-semibold text-gray-900 text-sm md:text-base">${user.username}</p>
          <span class="inline-flex items-center gap-1 text-xs md:text-sm font-medium ${
            user.premium ? "text-indigo-600" : "text-gray-500"
          }">
            ${user.premium 
              ? `<svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 md:h-5 md:w-5 text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/></svg> Premium` 
              : "Signed up"
            }
          </span>
        </div>
      </div>

      <!-- Right: Commission -->
      <div class="flex flex-col items-end justify-center gap-1">
        <span class="px-3 py-1 rounded-full text-sm md:text-base font-semibold ${
          amount > 0 ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-400"
        } transition-all duration-300">
          ${money(amount)}
        </span>
        <span class="text-[10px] md:text-xs text-gray-400">Commission</span>
      </div>
    </div>
  `;
}

/**
 * ✅ Atomic + idempotent credit:
 * - Reads referred doc and referrer doc in a transaction
 * - If referred.is_Premium === true AND not yet credited:
 *      - increments referrer.balance by ₦500 (coerces to number)
 *      - sets referred.referralBonusCredited = true
 * This prevents double credits and fixes type issues ("0" -> 0).
 */
async function processReferralCreditTx(referredUserDocId, referrerUid) {
  return db.runTransaction(async (tx) => {
    const referredRef  = db.collection("users").doc(referredUserDocId);
    const referrerRef  = db.collection("users").doc(referrerUid);

    const [referredSnap, referrerSnap] = await Promise.all([
      tx.get(referredRef),
      tx.get(referrerRef)
    ]);

    if (!referredSnap.exists) return; // no-op
    const r = referredSnap.data() || {};
    if (!r.is_Premium) return; // only credit premium upgrades
    if (r.referralBonusCredited) return; // already credited -> no-op

    const cur = referrerSnap.exists ? referrerSnap.data().balance : 0;
    const currentBalance = typeof cur === "number" && isFinite(cur) ? cur : Number(cur) || 0;
    const newBalance = currentBalance + 500;

    tx.update(referrerRef, { balance: newBalance });         // write numeric balance
    tx.update(referredRef, { referralBonusCredited: true }); // mark as credited
  }).catch(err => {
    console.error("processReferralCreditTx error:", err);
    throw err;
  });
}










                                                // POST A JOB FUNCTION Subcategory mapping





  // ----- subcategory options remain the same (user kept them as-is) -----
  const subcategoryOptions = {
    whatsapp: {
      "WhatsApp group join": 15,
      "WhatsApp status post": 50,
      "WhatsApp contact add": 15,
      "Share to 3 WhatsApp group": 50,
      "WhatsApp channel follow": 20,
      "Community join": 30,
      "WhatsApp linking": 500
    },
    telegram: {
      "Telegram group join": 15,
      "Share to 3 Telegram group": 50,
      "Telegram bot": 30,
      "Telegram story post": 50
    },
    instagram: {
      "Follow": 8,
      "Like": 8,
      "Comment": 8,
      "Follow+like": 15,
      "Like + comment": 15,
      "Follow+ like + comment": 25,
      "Use sound": 20,
      "Share post": 25
    },
    tiktok: {
      "Follow": 8,
      "Like": 8,
      "Comment": 8,
      "Follow+like": 15,
      "Like + comment": 15,
      "Follow+ like + comment": 25,
      "Use sound": 20,
      "Share post": 25
    },
    app: {
      "Download Only": 50,
      "Download + Install": 80,
      "Download + Register": 100,
      "Download + Register + KYC": 150,
      "Download + Install + Word review": 150
    },
    youtube: {
      "Like": 6,
      "Comment": 8,
      "Channel subscribe": 10,
      "Like + comment": 10,
      "Subscribe+like + comment": 20
    },
    facebook: {
      "Like": 10,
      "Follow": 10,
      "Comment": 15,
      "Follow+ like": 20,
      "Follow + like + comment": 25,
      "Add a friend": 10,
      "Join a group": 15,
      "Share to story": 15
    },
    twitter: {
      "Like": 5,
      "Comment": 8,
      "Like + comment": 15,
      "Post": 10,
      "Follow": 5,
      "Retweet": 8
    },
    website: {
      "View/ traffic": 5,
      "Simple sign up": 20,
      "Complex sign up": 75,
      "Signup + kyc": 150,
      "Online Survey": 100
    },
    vote: { "Vote me": 30 },
    music: {
      "Music like": 10,
      "Page follow": 15,
      "Stream music": 30
    }
  };

  // current default price for chosen subcategory
  let defaultEarn = 0;
  // guard against double submission
  let isSubmitting = false;

  function populateSubcategories() {
    const category = document.getElementById("category").value;
    const subcategory = document.getElementById("subcategory");
    subcategory.innerHTML = '<option value="">Select subcategory</option>';
    if (subcategoryOptions[category]) {
      for (const [key, value] of Object.entries(subcategoryOptions[category])) {
        const opt = document.createElement("option");
        // store numeric price in value (base 10)
        opt.value = String(value);
        opt.textContent = `${key} (₦${value})`;
        subcategory.appendChild(opt);
      }
    }
  }

  // when user chooses a subcategory we set the workerEarn and defaultEarn
  function updateWorkerEarn() {
    const subVal = parseInt(document.getElementById("subcategory").value, 10);
    const workerEarnEl = document.getElementById("workerEarn");
    if (!isNaN(subVal)) {
      // set the suggested value, but allow the user to change it
      if (workerEarnEl) workerEarnEl.value = subVal;
      defaultEarn = subVal;
    } else {
      defaultEarn = 0;
    }
    // show/hide warning and update totals
    validateWorkerEarn();
    updateTotal();
  }

  function validateWorkerEarn() {
    const inputEl = document.getElementById("workerEarn");
    const warning = document.getElementById("earnWarning");
    const inputVal = parseInt(inputEl.value, 10);
    if (!isNaN(inputVal) && defaultEarn > 0 && inputVal < defaultEarn) {
      warning.classList.remove("hidden");
      // Do NOT update totals when worker pay is below default (keeps UX clear)
    } else {
      warning.classList.add("hidden");
      updateTotal();
    }
  }

  // fix: accept event param and use it
  function limitProofFiles(e) {
    const checkboxes = document.querySelectorAll("input[name='proofFile']");
    const checked = Array.from(checkboxes).filter(i => i.checked);
    if (checked.length > 3) {
      alert("You can only select up to 3 proof files");
      if (e && e.target) e.target.checked = false;
    }
  }

  function updateTotal() {
    const earn = Number(document.getElementById("workerEarn").value) || 0;
    const count = Number(document.getElementById("workerCount").value) || 0;
    // premium removed per request
    const approvalFee = 200;
    const total = (earn * count) + approvalFee;
    document.getElementById("totalCost").textContent = `₦${total}`;
  }

  // ----- Fix for missing functions that caused console errors -----
  function switchTab(sectionId) {
    if (typeof activateTab === "function") {
      try { activateTab(sectionId); } catch (err) { console.warn('activateTab call failed, falling back', err); }
      return;
    }
    document.querySelectorAll('.tab-section').forEach(s => s.classList.add('hidden'));
    const target = document.getElementById(sectionId);
    if (target) target.classList.remove('hidden');
  }

  function activeTab(el) {
    if (!el) return;
    const container = el.closest('ul') || document;
    container.querySelectorAll('a').forEach(a => {
      a.classList.remove('bg-green-50', 'text-green-600');
    });
    el.classList.add('bg-green-50', 'text-green-600');
  }

  // ----- submitTask: single-submit safe, validation for min workers and price floor -----
  async function submitTask() {
    if (isSubmitting) return; // protect against double click
    const submitBtn = document.getElementById('postJobBtn');
    const originalBtnText = submitBtn ? submitBtn.textContent : null;
    try {
      isSubmitting = true;
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = 'Posting...';
      }

      const category = document.getElementById("category")?.value || "";
      const subCategory = document.getElementById("subcategory")?.value || "";
      const taskTitle = document.getElementById("taskTitle")?.value.trim() || "";
      const description = document.getElementById("description")?.value.trim() || "";
      const proof = document.getElementById("proof")?.value.trim() || "";
      const screenshotInput = document.getElementById("screenshotInput");
      const screenshotExample = screenshotInput && screenshotInput.files ? screenshotInput.files[0] : null;
      const numWorkers = parseInt(document.getElementById("workerCount")?.value, 10) || 0;
      const workerEarn = parseInt(document.getElementById("workerEarn")?.value, 10) || 0;
      const proofFileCountEl = document.getElementById("proofFileCount");
      const proofFileCount = proofFileCountEl ? parseInt(proofFileCountEl.value, 10) || 1 : 1;

      const missing = [];
      if (!taskTitle) missing.push("Task title");
      if (!category) missing.push("Category");
      if (!subCategory) missing.push("Subcategory");
      if (!description) missing.push("Description");
      if (!proof) missing.push("Proof instructions");
      if (!screenshotExample) missing.push("Screenshot example (upload)");
      // enforce min workers = 20
      if (!numWorkers || numWorkers < 20) missing.push("Number of workers (minimum 20)");
      if (!workerEarn || workerEarn < 1) missing.push("Worker earn (₦)");

      if (missing.length) {
        alert(`⚠️ Please fill required fields: ${missing.join(', ')}`);
        return;
      }

      // disallow workerEarn lower than default subcategory price
      if (defaultEarn > 0 && workerEarn < defaultEarn) {
        alert(`⚠️ Worker earn cannot be less than the subcategory price (₦${defaultEarn}). Increase the amount or pick a different subcategory.`);
        return;
      }

      // firebase auth guard
      if (typeof auth === 'undefined' || !auth.currentUser) {
        alert("⚠️ You must be logged in to post a job.");
        return;
      }

      // fetch user profile
      const user = auth.currentUser;
      const userDocRef = db.collection("users").doc(user.uid);
      const userDoc = await userDocRef.get();
      if (!userDoc.exists) {
        alert("⚠️ User profile not found.");
        return;
      }
      const userProfile = userDoc.data();

      const reviewFee = 200;
      const total = (numWorkers * workerEarn) + reviewFee;
      const currentBalance = userProfile.balance || 0;

      if (currentBalance < total) {
        alert(`⚠️ Insufficient balance. Required ₦${total}, available ₦${currentBalance}.`);
        return;
      }

      // Upload screenshot (if your uploadToCloudinary exists)
      let screenshotURL = "";
      if (screenshotExample) {
        try {
          if (typeof uploadToCloudinary !== "function") {
            // uploader missing — we accept the local file but skip uploading (add your uploader in production)
            console.warn("uploadToCloudinary helper not found — skipping upload (add your uploader).");
            screenshotURL = ""; // no remote url
          } else {
            screenshotURL = await uploadToCloudinary(screenshotExample);
          }
        } catch (err) {
          console.error("Screenshot upload failed:", err);
          alert("❌ Screenshot upload failed. Try again.");
          return;
        }
      }

      const jobData = {
        title: taskTitle,
        category,
        subCategory,
        description,
        proof,
        screenshotURL,
        numWorkers,
        workerEarn,
        total,
        proofFileCount,
        status: "on review",
        postedAt: firebase.firestore.FieldValue.serverTimestamp(),
        postedBy: {
          uid: user.uid,
          name: userProfile.name || "",
          email: userProfile.email || "",
          phone: userProfile.phone || "",
          photo: userProfile.photo || ""
        }
      };

      // Transaction: re-read and deduct balance inside transaction to avoid races
    await db.runTransaction(async (transaction) => {
        const userSnap = await transaction.get(userDocRef);
        if (!userSnap.exists) {
          throw new Error("User not found during transaction");
        }
        const bal = (userSnap.data().balance || 0);
        if (bal < total) {
          throw new Error("Insufficient balance during transaction");
        }
        transaction.update(userDocRef, { balance: bal - total });
        const taskRef = db.collection("tasks").doc();
        transaction.set(taskRef, jobData);
      });

      alert("✅ Task successfully posted! Awaiting Admins Approval.Check Jobs in MyJobs section");
      // reset form in-place (no reload)
      resetPostTaskForm();
      updateTotal();

    } catch (err) {
      console.error("🔥 Error posting task:", err);
      // show friendlier messages for known transaction errors
      if (err && err.message && err.message.toLowerCase().includes('insufficient')) {
        alert("⚠️ Transaction failed: insufficient balance (someone may have spent from your account). Try again after topping up.");
      } else {
        alert("❌ Something went wrong. Try again later.");
      }
    } finally {
      isSubmitting = false;
      if (submitBtn) {
        submitBtn.disabled = false;
        if (originalBtnText) submitBtn.textContent = originalBtnText;
      }
    }
  }

  function resetPostTaskForm() {
    const categoryEl = document.getElementById('category');
    if (categoryEl) categoryEl.selectedIndex = 0;
    const sub = document.getElementById('subcategory');
    if (sub) sub.innerHTML = '<option value="">Select subcategory</option>';
    const fields = ['taskTitle', 'description', 'proof', 'workerCount', 'workerEarn'];
    fields.forEach(id => {
      const el = document.getElementById(id);
      if (el) el.value = '';
    });
    const screenshotInput = document.getElementById('screenshotInput');
    if (screenshotInput) screenshotInput.value = '';
    const proofFileCountEl = document.getElementById('proofFileCount');
    if (proofFileCountEl) proofFileCountEl.value = '1';
    defaultEarn = 0;
    const warn = document.getElementById('earnWarning');
    if (warn) warn.classList.add('hidden');
    const totalCost = document.getElementById('totalCost');
    if (totalCost) totalCost.textContent = '₦0';
  }






      






		  

// AFFILIATE  Update Total When Inputs Change
                          
                          

  // ---- config / state ----
  const AFF_COMPANY_FEE = 300;
  let isSubmittingAff = false;

  function updateAffiliateJobTotal() {
    const numWorkersEl = document.getElementById("numWorkers");
    const workerPayEl = document.getElementById("workerPay");
    const count = parseInt(numWorkersEl?.value, 10) || 0;
    const pay = parseInt(workerPayEl?.value, 10) || 0;

    const countWarning = document.getElementById("affiliateCountWarning");
    const payWarning = document.getElementById("affiliatePayWarning");
    // show warnings but do not allow submit until fixed
    if (count > 0 && count < 20) {
      if (countWarning) countWarning.classList.remove("hidden");
    } else if (countWarning) {
      countWarning.classList.add("hidden");
    }

    if (pay > 0 && pay < 100) {
      if (payWarning) payWarning.classList.remove("hidden");
    } else if (payWarning) {
      payWarning.classList.add("hidden");
    }

    // only update the shown total when values meet minimums
    const totalDisplay = document.getElementById("affiliateJobTotal");
    if (count >= 20 && pay >= 100) {
      const total = (count * pay) + AFF_COMPANY_FEE;
      if (totalDisplay) totalDisplay.innerText = `₦${total}`;
    } else {
      // still show a helpful preview if either input is set (but not valid)
      const previewTotal = (count * pay) + AFF_COMPANY_FEE;
      if (totalDisplay) totalDisplay.innerText = `₦${previewTotal}`; // shows preview but submit will be blocked
    }
  }

  // safe hookup for inputs if they already exist
  (function attachAffiliateListeners() {
    const n = document.getElementById("numWorkers");
    const p = document.getElementById("workerPay");
    if (n) n.addEventListener("input", updateAffiliateJobTotal);
    if (p) p.addEventListener("input", updateAffiliateJobTotal);
  })();


// === Campaign Logo Upload Handling ===
// === Campaign Logo Upload Handling (simplified version) ===
document.getElementById("campaignLogoFile").addEventListener("change", async (e) => {
  const file = e.target.files[0];
  const statusEl = document.getElementById("campaignLogoStatus");
  if (!file) return;

  statusEl.classList.remove("hidden");
  statusEl.style.color = "#2563eb";
  statusEl.innerText = "⏳ Uploading... please wait";

  try {
    const uploadedURL = await uploadToCloudinary(file);
    statusEl.style.color = "#059669"; // green
    statusEl.innerText = "✅ Upload Successful!";
    e.target.dataset.uploadedUrl = uploadedURL; // keep for submission use
  } catch (err) {
    console.error("Upload failed:", err);
    statusEl.style.color = "#dc2626"; // red
    statusEl.innerText = "❌ Upload failed. Try again.";
  }
});


  // ---- submitAffiliateJob (single-submit safe, required logo, atomic balance update) ----
  async function submitAffiliateJob() {
    if (isSubmittingAff) return;
    const submitBtn = document.getElementById("postAffiliateBtn");
    const originalBtnText = submitBtn ? submitBtn.textContent : null;

    try {
      isSubmittingAff = true;
      if (submitBtn) { submitBtn.disabled = true; submitBtn.textContent = "Posting..."; }

      const formRoot = document.getElementById("afffiliateJobFormSection") || document;
      const category = (formRoot.querySelector("#affiliateCategory") || {}).value || "";
      const title = (formRoot.querySelector("#campaignTitle") || {}).value?.trim() || "";
      const instructions = (formRoot.querySelector("#workerInstructions") || {}).value?.trim() || "";
      const targetLink = (formRoot.querySelector("#targetLink") || {}).value?.trim() || "";
      const proofRequired = (formRoot.querySelector("#proofRequired") || {}).value?.trim() || "";
      const numWorkers = parseInt((formRoot.querySelector("#numWorkers") || {}).value, 10) || 0;
      const workerPay = parseInt((formRoot.querySelector("#workerPay") || {}).value, 10) || 0;
      const proofSelect = formRoot.querySelector("#affiliateProofFileCount") || document.getElementById("affiliateProofFileCount");
      const proofFileCount = proofSelect ? parseInt(proofSelect.value, 10) || 1 : 1;
      const logoFile = (formRoot.querySelector("#campaignLogoFile") || {}).files?.[0] || null;

      // inline warnings elements
      const logoWarn = document.getElementById("affiliateLogoWarning");
      const countWarn = document.getElementById("affiliateCountWarning");
      const payWarn = document.getElementById("affiliatePayWarning");

      // BASIC validation: every field required
      const missing = [];
      if (!category) missing.push("Category");
      if (!title) missing.push("Campaign Title");
      if (!instructions) missing.push("Instructions");
      if (!targetLink) missing.push("Target Link");
      if (!proofRequired) missing.push("Proof Required");
      if (!numWorkers || numWorkers < 20) {
        missing.push("Number of workers (minimum 20)");
        if (countWarn) countWarn.classList.remove("hidden");
      } else if (countWarn) {
        countWarn.classList.add("hidden");
      }
      if (!workerPay || workerPay < 100) {
        missing.push("Worker pay (minimum ₦100)");
        if (payWarn) payWarn.classList.remove("hidden");
      } else if (payWarn) {
        payWarn.classList.add("hidden");
      }
      if (!logoFile) {
        missing.push("Campaign logo (required)");
        if (logoWarn) logoWarn.classList.remove("hidden");
      } else if (logoWarn) {
        logoWarn.classList.add("hidden");
      }

      if (missing.length) {
        alert(`⚠️ Please fix the following: ${missing.join(", ")}`);
        return;
      }

      // auth guard
      if (typeof auth === "undefined" || !auth.currentUser) {
        alert("⚠️ You must be logged in to post a campaign.");
        return;
      }

      // fetch user (will re-check inside transaction)
      const user = auth.currentUser;
      const userDocRef = db.collection("users").doc(user.uid);
      const userSnap = await userDocRef.get();
      if (!userSnap.exists) {
        alert("⚠️ User profile not found.");
        return;
      }
      const userProfile = userSnap.data();

      const total = (numWorkers * workerPay) + AFF_COMPANY_FEE;

      // ✅ Use already-uploaded URL from the file input
const logoInput = document.getElementById("campaignLogoFile");
let campaignLogoURL = logoInput?.dataset?.uploadedUrl || "";

if (!campaignLogoURL) {
  alert("⚠️ Please upload a campaign logo before submitting.");
  return;
}
      const jobData = {
        jobType: "affiliate",
        category,
        title,
        instructions,
        targetLink,
        proofRequired,
        numWorkers,
        workerPay,
        total,
        proofFileCount,
        campaignLogoURL,
        companyFee: AFF_COMPANY_FEE,
        status: "on review",
        pinned: false,
        pinnedStart: null,
        postedAt: firebase.firestore.FieldValue.serverTimestamp(),
        postedBy: {
          uid: user.uid,
          name: userProfile.name || "",
          email: userProfile.email || "",
          phone: userProfile.phone || "",
          photo: userProfile.photo || ""
        }
      };

      // Atomic transaction: re-read balance inside transaction to avoid races
      await db.runTransaction(async (transaction) => {
        const snap = await transaction.get(userDocRef);
        if (!snap.exists) throw new Error("User not found during transaction");
        const currentBal = snap.data().balance || 0;
        if (currentBal < total) throw new Error("Insufficient balance during transaction");
        transaction.update(userDocRef, { balance: currentBal - total });
        const jobRef = db.collection("affiliateJobs").doc();
        transaction.set(jobRef, jobData);
      });

      alert("✅ Affiliate campaign submitted successfully! Awaiting Admins approval .Check Jobs in MyJobs section");
      resetAffiliateForm();
      updateAffiliateJobTotal();

    } catch (err) {
      console.error("🔥 Error submitting affiliate job:", err);
      if (err && err.message && err.message.toLowerCase().includes("insufficient")) {
        alert("⚠️ Transaction failed: insufficient balance (someone may have spent from your account). Top up and try again.");
      } else {
        alert("❌ Something went wrong. Try again.");
      }
    } finally {
      isSubmittingAff = false;
      if (submitBtn) {
        submitBtn.disabled = false;
        if (originalBtnText) submitBtn.textContent = originalBtnText;
      }
    }
  }

  // reset the affiliate form in-place (no reload)
  // reset the affiliate form in-place (no reload)
function resetAffiliateForm() {
  const root = document.getElementById("afffiliateJobFormSection") || document;

  // clear simple fields
  const fields = ['affiliateCategory','campaignTitle','workerInstructions','targetLink','proofRequired','numWorkers','workerPay'];
  fields.forEach(id => {
    const el = root.querySelector("#" + id) || document.getElementById(id);
    if (!el) return;
    if (el.tagName === "SELECT" || el.tagName === "INPUT" || el.tagName === "TEXTAREA") {
      el.value = "";
    }
  });

  // reset proof select to 1
  const proofSel = root.querySelector("#affiliateProofFileCount") || document.getElementById("affiliateProofFileCount");
  if (proofSel) proofSel.value = "1";

  // clear file input AND remove uploaded URL stored in dataset
  const logo = root.querySelector("#campaignLogoFile") || document.getElementById("campaignLogoFile");
  if (logo) {
    // clear selected file
    try { logo.value = ""; } catch (e) { /* ignore */ }

    // remove dataset property if present (so submit won't find an uploaded URL)
    try {
      if (logo.dataset && logo.dataset.uploadedUrl) delete logo.dataset.uploadedUrl;
      // remove HTML attribute too (defensive)
      logo.removeAttribute && logo.removeAttribute('data-uploaded-url');
    } catch (e) { /* ignore */ }
  }

  // hide & clear upload status message
  const statusEl = root.querySelector("#campaignLogoStatus") || document.getElementById("campaignLogoStatus");
  if (statusEl) {
    statusEl.classList.add("hidden");
    statusEl.innerText = "";
    statusEl.style.color = "";
  }

  // hide warnings
  const warnIds = ['affiliateLogoWarning','affiliateCountWarning','affiliatePayWarning'];
  warnIds.forEach(id => {
    const w = root.querySelector("#" + id) || document.getElementById(id);
    if (w) w.classList.add("hidden");
  });

  // reset total display
  const totalDisplay = root.querySelector("#affiliateJobTotal") || document.getElementById("affiliateJobTotal");
  if (totalDisplay) totalDisplay.innerText = "₦0";

  // (optional) ensure submit button is enabled and shows default text
  const submitBtn = root.querySelector("#postAffiliateBtn") || document.getElementById("postAffiliateBtn");
  if (submitBtn) {
    submitBtn.disabled = false;
    // keep label consistent
    submitBtn.textContent = "Post Job";
  }
}














                                                                  // MY JOB POST FUNCTION





// === Fetch & Display User Jobs ===
async function fetchAndDisplayUserJobs() {
  const jobList = document.getElementById("jobList");
  jobList.innerHTML = "<p class='text-center text-gray-500'>Loading your jobs...</p>";

  try {
    const user =
      firebase.auth().currentUser ||
      (await new Promise((resolve) => firebase.auth().onAuthStateChanged(resolve)));

    if (!user) {
      jobList.innerHTML =
        '<p class="text-center text-gray-500">Please log in to see your posted jobs.</p>';
      return;
    }

    const uid = user.uid;
    let allJobs = [];

    // 🔥 Smart Progress Counter (counts approved + on review)
    async function getProgressCount(collection, jobId, jobType) {
      try {
        const fieldName = jobType === "task" ? "taskId" : "jobId";
        const statuses = ["approved", "on review"];
        const snap = await firebase
          .firestore()
          .collection(collection)
          .where(fieldName, "==", jobId)
          .where("status", "in", statuses)
          .get();

        const count = snap.size || 0;
        console.log(`[ProgressCount] ${collection} (${jobId}) = ${count}`);
        return count;
      } catch (e) {
        console.error("getProgressCount error:", e);
        return 0;
      }
    }

    // Render Job Cards
    function renderJobs(jobs, append = false) {
      if (!append) jobList.innerHTML = "";
      if (!jobs.length && !append) {
        jobList.innerHTML =
          '<p class="text-center text-gray-500">You haven\'t posted any jobs yet.</p>';
        return;
      }
      const html = jobs.map((job) => renderJobCard(job)).join("");
      jobList.insertAdjacentHTML(append ? "beforeend" : "afterbegin", html);
    }

    // === STEP 1: Fetch Task Jobs ===
    const taskSnap = await firebase
      .firestore()
      .collection("tasks")
      .where("postedBy.uid", "==", uid)
      .orderBy("postedAt", "desc")
      .get();

    const taskJobs = await Promise.all(
      taskSnap.docs.map(async (doc) => {
        const data = doc.data();
        const job = { ...data, id: doc.id, type: "task" };
        job.completed = await getProgressCount("task_submissions", job.id, "task");
        return job;
      })
    );

    allJobs.push(...taskJobs);
    renderJobs(taskJobs);

    // === STEP 2: Fetch Affiliate Jobs ===
    setTimeout(async () => {
      const affiliateSnap = await firebase
        .firestore()
        .collection("affiliateJobs")
        .where("postedBy.uid", "==", uid)
        .orderBy("postedAt", "desc")
        .get();

      const affiliateJobs = await Promise.all(
        affiliateSnap.docs.map(async (doc) => {
          const data = doc.data();
          const job = { ...data, id: doc.id, type: "affiliate" };
          job.completed = await getProgressCount("affiliate_submissions", job.id, "affiliate");
          return job;
        })
      );

      allJobs.push(...affiliateJobs);

      // Sort all combined by date
      allJobs.sort(
        (a, b) =>
          (b.postedAt?.toMillis?.() || 0) - (a.postedAt?.toMillis?.() || 0)
      );

      renderJobs(allJobs);
    }, 300);

  } catch (error) {
    console.error("fetchAndDisplayUserJobs Error:", error);
    jobList.innerHTML =
      '<p class="text-center text-red-500">Failed to load jobs. Please try again later.</p>';
  }
}

// === Render Job Card ===
function renderJobCard(job) {
  const status = job.status || "on review";
  const statusColor =
    status === "approved"
      ? "bg-green-100 text-green-700"
      : status === "rejected"
      ? "bg-red-100 text-red-700"
      : "bg-yellow-100 text-yellow-700";
  const jobTypeLabel = job.type === "task" ? "Task" : "Affiliate";
  const logo =
    job.type === "affiliate" ? job.campaignLogoURL : job.screenshotURL;
  const totalWorkers = job.numWorkers || 0;
  const completed = job.completed || 0;
  const progress = totalWorkers
    ? Math.round((completed / totalWorkers) * 100)
    : 0;

  return `
  <div class="p-5 rounded-2xl bg-white shadow-md border border-gray-200 hover:shadow-lg transition">
    <div class="flex justify-between items-center">
      <h3 class="text-lg font-semibold text-blue-900">${job.title || "Untitled Job"}</h3>
      <span class="px-3 py-1 rounded-full text-xs font-bold ${statusColor}">
        ${status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    </div>
    <div class="flex items-center gap-4 mt-3">
      ${
        logo
          ? `<img src="${logo}" class="w-14 h-14 rounded-lg object-cover border" />`
          : ""
      }
      <div>
        <p class="text-sm text-gray-500">${jobTypeLabel} • ${job.category || "Uncategorized"}</p>
        <p class="text-sm text-gray-700"><span class="font-semibold">Workers:</span> ${completed}/${totalWorkers}</p>
      </div>
    </div>
    <div class="w-full bg-gray-200 rounded-full h-2 mt-2">
      <div class="bg-blue-600 h-2 rounded-full transition-all duration-300" style="width:${progress}%;"></div>
    </div>
    <p class="text-xs text-gray-500 mt-1">${progress}% completed</p>
    <div class="grid grid-cols-2 gap-4 text-sm text-gray-700 mt-3">
      <div><span class="font-semibold">Cost:</span> ₦${job.total || 0}</div>
      <div><span class="font-semibold">Worker Pay:</span> ₦${job.workerEarn || job.workerPay || 0}</div>
      <div><span class="font-semibold">Posted:</span> ${job.postedAt?.toDate().toLocaleDateString() || "—"}</div>
    </div>
    <div class="mt-4">
      <button onclick="checkJobDetails('${job.id}', '${job.type}')"
        class="w-full py-2 px-4 rounded-lg bg-blue-600 text-white font-bold hover:bg-blue-700 transition">
        View Details
      </button>
    </div>
  </div>`;
}

// === Check Job Details ===
async function checkJobDetails(jobId, jobType) {
  try {
    const collection = jobType === "task" ? "tasks" : "affiliateJobs";
    const subCollection =
      jobType === "task" ? "task_submissions" : "affiliate_submissions";
    const fieldName = jobType === "task" ? "taskId" : "jobId";

    const doc = await firebase.firestore().collection(collection).doc(jobId).get();
    if (!doc.exists) return;
    const job = { ...doc.data(), id: doc.id, type: jobType };

    const snap = await firebase
      .firestore()
      .collection(subCollection)
      .where(fieldName, "==", job.id)
      .where("status", "in", ["approved", "on review"])
      .get();

    job.completed = snap.size;
    renderJobDetails(job);
    attachJobDetailActions(job);
    activateTab("jobDetailsSection");
  } catch (err) {
    console.error("checkJobDetails error:", err);
    alert("Failed to load job details.");
  }
}

// === Render Job Details ===
function renderJobDetails(job) {
  const totalWorkers = job.numWorkers || 0;
  const completed = job.completed || 0;
  const progress = totalWorkers ? Math.round((completed / totalWorkers) * 100) : 0;

  let content = `
    ${
      job.campaignLogoURL || job.screenshotURL
        ? `<div class="relative w-full h-48 bg-gray-100 rounded-xl overflow-hidden flex items-center justify-center border">
  <img 
    src="${job.campaignLogoURL || job.screenshotURL}" 
    alt="Job Image" 
    class="max-w-full max-h-full object-contain rounded-lg"
  />
</div>`
        : ""
    }
    <h4 class="text-lg font-bold text-blue-900 mt-3">${job.title || "Untitled Job"}</h4>
    <p class="text-gray-600 text-sm">${job.category || "Uncategorized"}</p>
    <div class="mt-3 grid grid-cols-2 gap-4 text-sm text-gray-700">
      <div><span class="font-semibold">Cost:</span> ₦${job.total || 0}</div>
      <div><span class="font-semibold">Worker Pay:</span> ₦${job.workerEarn || job.workerPay || 0}</div>
      <div><span class="font-semibold">Completed:</span> ${completed}/${totalWorkers}</div>
      <div><span class="font-semibold">Posted:</span> ${job.postedAt?.toDate().toLocaleString() || "—"}</div>
    </div>
    <div class="mt-3">
      <div class="w-full bg-gray-200 rounded-full h-2">
        <div class="bg-blue-600 h-2 rounded-full transition-all duration-300" style="width: ${progress}%"></div>
      </div>
      <p class="text-xs text-gray-500 mt-1">${progress}% completed</p>
    </div>
  `;

  if (job.type === "affiliate") {
    content += `
      <div class="mt-4 space-y-2">
        <p><span class="font-semibold">Target Link:</span> <a href="${job.targetLink || "#"}" class="text-blue-600 underline">${job.targetLink || "—"}</a></p>
        <p><span class="font-semibold">Proof Required:</span> ${job.proofRequired || "—"}</p>
      </div>
    `;
  } else {
    content += `
      <div class="mt-4 space-y-2">
        <p><span class="font-semibold">Description:</span> ${job.description || "—"}</p>
        <p><span class="font-semibold">Proof:</span> ${job.proof || "—"}</p>
      </div>
    `;
  }

  document.getElementById("jobDetailsContent").innerHTML = content;
}

// === Back Button ===
function goBackToJobs() {
  activateTab("myJobsSection");
}

// === Init ===
document.addEventListener("DOMContentLoaded", fetchAndDisplayUserJobs);













/* =================== JOB DETAIL ACTIONS =================== */
async function attachJobDetailActions(job) {
  try {
    console.log("[attachJobDetailActions] job =>", job);
    const container = document.getElementById("jobDetailsContent");
    if (!container) {
      console.warn("jobDetailsContent not found");
      return;
    }

    const existingBar = document.getElementById("jobActionsBar");
    if (existingBar) existingBar.remove();

    const actionsBar = document.createElement("div");
    actionsBar.id = "jobActionsBar";
    actionsBar.className = "mt-4 flex gap-3";

    // Delete button (only active if status === 'on review')
    const deleteBtn = document.createElement("button");
    deleteBtn.className = "job-action-btn primary";
    deleteBtn.innerText = "Delete Job";

    const status = (job.status || "on review").toLowerCase();
    if (status !== "on review") {
      deleteBtn.classList.add("opacity-40", "cursor-not-allowed");
      deleteBtn.disabled = true;
      deleteBtn.title = "Can only delete jobs that are still on review";
    } else {
      deleteBtn.onclick = async () => {
        if (!confirm("Delete this job and refund poster? This action cannot be undone.")) return;
        await deleteJob(job.id, job.type);
      };
    }

    // View submissions button
    const viewSubBtn = document.createElement("button");
    viewSubBtn.className = "job-action-btn secondary";
    viewSubBtn.innerText = "View Submissions";
    viewSubBtn.onclick = () => viewSubmissions(job.id, job.type, job);

    actionsBar.appendChild(deleteBtn);
    actionsBar.appendChild(viewSubBtn);
    container.appendChild(actionsBar);

    console.log("[attachJobDetailActions] attached action buttons");
  } catch (err) {
    console.error("[attachJobDetailActions] error:", err);
  }
}

/* =================== DELETE JOB =================== */
async function deleteJob(jobId, jobType) {
  console.log("[deleteJob] start", jobId, jobType);
  const collection = jobType === "task" ? "tasks" : "affiliateJobs";
  const docRef = firebase.firestore().collection(collection).doc(jobId);

  try {
    await firebase.firestore().runTransaction(async (tx) => {
      const jobDoc = await tx.get(docRef);
      if (!jobDoc.exists) throw new Error("Job not found");
      const job = jobDoc.data();
      if ((job.status || "on review").toLowerCase() !== "on review")
        throw new Error("Job status is not on review - cannot delete");

      const posterUid = job.postedBy?.uid || job.postedByUid || job.ownerUid;
      const refundAmount = Number(job.total || 0);

      if (!posterUid) throw new Error("Poster UID not found on job doc");

      const userRef = firebase.firestore().collection("users").doc(posterUid);
      const userSnap = await tx.get(userRef);
      if (!userSnap.exists) throw new Error("Poster user doc missing");

      const prevBalance = Number(userSnap.data().balance || 0);
      const newBalance = prevBalance + refundAmount;
      console.log(`[deleteJob] refunding ₦${refundAmount} to ${posterUid} (prev ${prevBalance} => ${newBalance})`);

      tx.update(userRef, { balance: newBalance });
      tx.delete(docRef);
    });

    alert("Job deleted and poster refunded successfully.");
    console.log("[deleteJob] success");
    if (typeof fetchAndDisplayUserJobs === "function") fetchAndDisplayUserJobs();
    activateTab("myJobsSection");
  } catch (err) {
    console.error("[deleteJob] transaction failed:", err);
    alert("Failed to delete job: " + (err.message || err));
  }
}

/* =================== VIEW SUBMISSIONS =================== */
let currentSubTab = "onreview";
let currentSubJob = null;

async function viewSubmissions(jobId, jobType, jobObj = null) {
  try {
    console.log("[viewSubmissions] loading", jobId, jobType);
    currentSubJob = jobObj || { id: jobId, type: jobType };

    document.getElementById("submissionsJobTitle").innerText = jobObj?.title || "Submissions";
    document.getElementById("submissionsJobMeta").innerText = `${jobType === "task" ? "Task" : "Affiliate"} • Job ID: ${jobId}`;

    await loadSubmissions(jobId, jobType);
    activateTab("jobSubmissionsSection");
  } catch (err) {
    console.error("[viewSubmissions] error:", err);
    alert("Failed to open submissions.");
  }
}

/* =================== LOAD SUBMISSIONS =================== */
async function loadSubmissions(jobId, jobType) {
  console.log("[loadSubmissions] fetching for", jobId, jobType);

  const collection = jobType === "task" ? "task_submissions" : "affiliate_submissions";
  const fieldName = jobType === "task" ? "taskId" : "jobId"; // ✅ Corrected
  const orderField = jobType === "task" ? "submittedAt" : "createdAt"; // ✅ Corrected

  try {
    const colRef = firebase.firestore()
      .collection(collection)
      .where(fieldName, "==", jobId)
      .orderBy(orderField, "desc");

    const snap = await colRef.get();
    const docs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    console.log(`[loadSubmissions] total ${collection}:`, docs.length);

    const onReview = docs.filter(d => ["on review", "pending"].includes((d.status || "").toLowerCase()));
    const completed = docs.filter(d => ["approved", "rejected", "completed"].includes((d.status || "").toLowerCase()));

    document.getElementById("subOnReviewBtn").innerText = `On review (${onReview.length})`;
    document.getElementById("subCompletedBtn").innerText = `Completed (${completed.length})`;

    renderSubmissionList(currentSubTab === "onreview" ? onReview : completed, jobType);
  } catch (err) {
    console.error("[loadSubmissions] error:", err);
    document.getElementById("submissionsList").innerHTML =
      `<p class="text-center text-red-500">Failed to load submissions.</p>`;
  }
}

function switchSubTab(tab) {
  currentSubTab = tab;
  if (!currentSubJob) return;
  loadSubmissions(currentSubJob.id, currentSubJob.type);
}

/* =================== RENDER SUBMISSIONS =================== */
function renderSubmissionList(list, jobType) {
  console.log("[renderSubmissionList] rendering", list.length, "items for", jobType);
  const container = document.getElementById("submissionsList");
  container.innerHTML = "";

  if (!list.length) {
    container.innerHTML = `<p class="text-center text-gray-500">No submissions in this tab.</p>`;
    return;
  }

  list.forEach(item => {
    const card = document.createElement("div");
    card.className = "p-4 bg-white rounded-xl shadow-sm border hover:shadow-md transition";

    let inner = `<div class="flex justify-between items-start">
      <div>
        <div class="text-sm text-gray-700"><strong>User:</strong> ${item.userName || item.userId || "Unknown"}</div>
        <div class="text-xs text-gray-500 mt-1"><strong>Submitted:</strong> ${
          item.submittedAt?.toDate
            ? item.submittedAt.toDate().toLocaleString()
            : item.createdAt?.toDate
            ? item.createdAt.toDate().toLocaleString()
            : "—"
        }</div>
        <div class="text-xs text-gray-500 mt-1"><strong>Status:</strong> ${(item.status || "on review")}</div>
      </div>
      <div class="text-right">`;

    const isOnReview = ["on review", "pending", ""].includes((item.status || "").toLowerCase());
    const currentUser = firebase.auth().currentUser;
    const isOwner =
      currentSubJob &&
      (currentSubJob.postedBy?.uid === currentUser?.uid ||
        currentSubJob.postedByUid === currentUser?.uid ||
        currentSubJob.ownerUid === currentUser?.uid);

    if (isOnReview && isOwner) {
      inner += `<div class="flex flex-col gap-2">
        <button class="job-action-btn bg-gradient-to-r from-green-500 to-green-600 text-white rounded-sm py-1.5 text-sm font-semibold hover:scale-[1.03] transition"
          data-action="approve" data-id="${item.id}">✅ Approve</button>
        <button class="job-action-btn bg-gradient-to-r from-red-500 to-red-600 text-white rounded-sm py-1.5 text-sm font-semibold hover:scale-[1.03] transition"
          data-action="reject" data-id="${item.id}">❌ Reject</button>
      </div>`;
    } else {
      inner += `<div class="text-xs text-gray-500"></div>`;
    }

    inner += `</div></div>`;

    // ===== Proof Section =====
    if (jobType === "task") {
      inner += `<div class="mt-3 text-sm text-gray-600"><strong>Proof text:</strong> ${item.proofText ? escapeHtml(item.proofText).slice(0, 300) : "—"}</div>`;
      if (Array.isArray(item.proofImages) && item.proofImages.length) {
        inner += `<div class="mt-2 flex gap-2 overflow-x-auto">${item.proofImages
          .map(url => `<img src="${url}" onclick="openImagePreview('${url}')" class="w-20 h-20 rounded-lg object-cover border cursor-pointer hover:opacity-80 transition">`)
          .join("")}</div>`;
      }
      inner += `<div class="mt-2 text-xs text-gray-500"><strong>Worker Earn:</strong> ₦${item.workerEarn || "0"}</div>`;
    } else {
      inner += `<div class="mt-3 text-sm text-gray-600"><strong>Note:</strong> ${item.note ? escapeHtml(item.note).slice(0, 300) : "—"}</div>`;
      if (Array.isArray(item.proofFiles) && item.proofFiles.length) {
        inner += `<div class="mt-2 flex gap-2 overflow-x-auto">${item.proofFiles
          .map(url => {
            const isImage = /\.(png|jpg|jpeg|gif|webp)$/i.test(url);
            return isImage
              ? `<img src="${url}" onclick="openImagePreview('${url}')" class="w-20 h-20 rounded-lg object-cover border cursor-pointer hover:opacity-80 transition">`
              : `<a href="${url}" target="_blank" class="text-xs underline text-blue-600 break-all">${url.split("/").pop()}</a>`;
          })
          .join("")}</div>`;
      }
    }

    card.innerHTML = inner;
    container.appendChild(card);

    const approveBtn = card.querySelector('button[data-action="approve"]');
    const rejectBtn = card.querySelector('button[data-action="reject"]');
    if (approveBtn) approveBtn.onclick = () => approveSubmission(item.id, currentSubJob.id, jobType, item);
    if (rejectBtn) rejectBtn.onclick = () => rejectSubmission(item.id, currentSubJob.id, jobType, item);
  });
}

/* ============ IMAGE PREVIEW OVERLAY ============ */
function openImagePreview(url) {
  let overlay = document.getElementById("imgPreviewOverlay");
  if (!overlay) {
    overlay = document.createElement("div");
    overlay.id = "imgPreviewOverlay";
    overlay.className = "fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4";
    overlay.innerHTML = `
      <img id="previewImg" src="" class="max-h-[90vh] max-w-[90vw] rounded-lg shadow-lg border border-gray-300">
      <button id="closePreviewBtn" class="absolute top-5 right-5 text-white text-2xl font-bold">×</button>
    `;
    document.body.appendChild(overlay);

    overlay.querySelector("#closePreviewBtn").onclick = () => overlay.remove();
    overlay.onclick = (e) => { if (e.target === overlay) overlay.remove(); };
  }
  overlay.querySelector("#previewImg").src = url;
  overlay.style.display = "flex";
}
/* =================== APPROVE SUBMISSION =================== */
async function approveSubmission(submissionId, jobId, jobType, submissionObj = null) {
  console.log("[approveSubmission] start", submissionId, jobId, jobType);
  const subCol = jobType === "task" ? "task_submissions" : "affiliate_submissions";
  const subRef = firebase.firestore().collection(subCol).doc(submissionId);
  const jobRef = firebase.firestore().collection(jobType === "task" ? "tasks" : "affiliateJobs").doc(jobId);

  try {
    await firebase.firestore().runTransaction(async (tx) => {
      const subSnap = await tx.get(subRef);
      if (!subSnap.exists) throw new Error("Submission not found");
      const submission = subSnap.data();
      if (["approved", "rejected"].includes((submission.status || "").toLowerCase()))
        throw new Error("Submission already reviewed");

      const jobSnap = await tx.get(jobRef);
      if (!jobSnap.exists) throw new Error("Job not found");
      const job = jobSnap.data();

      const workerId = submission.userId;
      if (!workerId) throw new Error("Submission worker userId missing");

      let amount = Number(submission.workerEarn || 0);
      if (jobType !== "task") amount = 0; // ✅ Fix for affiliate
      if (!amount) amount = Number(job.workerEarn || job.workerPay || 0);
      amount = isNaN(amount) ? 0 : amount;

      const workerRef = firebase.firestore().collection("users").doc(workerId);
      const workerSnap = await tx.get(workerRef);
      if (!workerSnap.exists) throw new Error("Worker user doc missing");

      const prevBal = Number(workerSnap.data().balance || 0);
      const newBal = prevBal + amount;
      console.log(`[approveSubmission] crediting ₦${amount} to ${workerId} (prev ${prevBal} => ${newBal})`);

      tx.update(workerRef, { balance: newBal });
      tx.update(subRef, {
        status: "approved",
        reviewedAt: firebase.firestore.FieldValue.serverTimestamp(),
        reviewedBy: firebase.auth().currentUser?.uid || null,
      });

      if (job.completedCount !== undefined) {
        tx.update(jobRef, { completedCount: (job.completedCount || 0) + 1 });
      }
    });

    alert("Submission approved and worker credited.");
    console.log("[approveSubmission] success");
    loadSubmissions(jobId, jobType);
  } catch (err) {
    console.error("[approveSubmission] failed:", err);
    alert("Failed to approve submission: " + (err.message || err));
  }
}

/* =================== REJECT SUBMISSION =================== */
async function rejectSubmission(submissionId, jobId, jobType) {
  console.log("[rejectSubmission] start", submissionId, jobId, jobType);
  const subCol = jobType === "task" ? "task_submissions" : "affiliate_submissions";
  const subRef = firebase.firestore().collection(subCol).doc(submissionId);

  try {
    const subSnap = await subRef.get();
    if (!subSnap.exists) throw new Error("Submission not found");
    const submission = subSnap.data();
    if (["approved", "rejected"].includes((submission.status || "").toLowerCase()))
      throw new Error("Submission already reviewed");

    await subRef.update({
      status: "rejected",
      reviewedAt: firebase.firestore.FieldValue.serverTimestamp(),
      reviewedBy: firebase.auth().currentUser?.uid || null,
    });

    alert("Submission rejected.");
    console.log("[rejectSubmission] success");
    loadSubmissions(jobId, jobType);
  } catch (err) {
    console.error("[rejectSubmission] error:", err);
    alert("Failed to reject: " + (err.message || err));
  }
}

/* =================== UTILITIES =================== */
function escapeHtml(str) {
  if (!str) return "";
  return String(str).replace(/[&<>"'=\/]/g, (s) =>
    ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
      "/": "&#x2F;",
    }[s])
  );
}

















// ✅ Upload profile picture
// === PROFILE PICTURE UPLOAD / FETCH / REMOVE ===
const profilePicInputs = [
document.getElementById("profilePicInput"),
document.getElementById("profilePicUpload")
].filter(Boolean);

const removeProfilePicBtn = document.getElementById("removeProfilePicBtn");
const placeholderPic = "profile-placeholder.png"; // fallback

// Function to update all previews at once
function updateAllProfilePreviews(url) {
document.querySelectorAll("#profilePicPreview").forEach(img => {
img.src = url;
});
}

//  Reusable upload handler
async function handleProfilePicUpload(file) {
if (!file) return;

// Local preview first
const reader = new FileReader();
reader.onload = (event) => updateAllProfilePreviews(event.target.result);
reader.readAsDataURL(file);

try {
// Upload using your general Cloudinary function
const imageUrl = await uploadToCloudinary(file);

updateAllProfilePreviews(imageUrl);  

// Save to Firestore  
const user = firebase.auth().currentUser;  
if (user) {  
  await firebase.firestore().collection("users").doc(user.uid).update({  
    profilePic: imageUrl  
  });  
  console.log("✅ Profile picture saved to Firestore");  
}

} catch (err) {
console.error("❌ Upload error:", err);
updateAllProfilePreviews(placeholderPic);
}
}

// Attach change listener to BOTH inputs
profilePicInputs.forEach(input => {
input.addEventListener("change", (e) => {
handleProfilePicUpload(e.target.files[0]);
});
});

// Remove profile picture
if (removeProfilePicBtn) {
removeProfilePicBtn.addEventListener("click", async () => {
updateAllProfilePreviews(placeholderPic);

const user = firebase.auth().currentUser;  
if (user) {  
  try {  
    await firebase.firestore().collection("users").doc(user.uid).update({  
      profilePic: placeholderPic  
    });  
    console.log("✅ Profile picture reset to placeholder");  
  } catch (err) {  
    console.error("❌ Error resetting profile pic:", err);  
  }  
}

});
}

// Auto-fetch profile pic on login
firebase.auth().onAuthStateChanged(async (user) => {
if (user) {
try {
const doc = await firebase.firestore().collection("users").doc(user.uid).get();
if (doc.exists && doc.data().profilePic) {
updateAllProfilePreviews(doc.data().profilePic);
} else {
updateAllProfilePreviews(placeholderPic);
}
} catch (err) {
console.error("❌ Error fetching profile pic:", err);
updateAllProfilePreviews(placeholderPic);
}
} else {
updateAllProfilePreviews(placeholderPic);
}
});






// --- Add Premium Badge to Sidebar Profile Picture ---
async function addSidebarPremiumBadge() {
  const wrapper = document.querySelector("#profilePicPreview").parentElement;
  if (!wrapper) return;

  // Remove old badge if exists
  const oldBadge = wrapper.querySelector(".premium-badge");
  if (oldBadge) oldBadge.remove();

  // Check if current user is premium
  const user = firebase.auth().currentUser;
  let isPremium = false;
  if (user) {
    try {
      const doc = await firebase.firestore().collection("users").doc(user.uid).get();
      if (doc.exists && doc.data().is_Premium === true) {
        isPremium = true;
      }
    } catch (err) {
      console.error("❌ Error checking premium status:", err);
    }
  }

  // Add badge if premium
  if (isPremium) {
    const badge = document.createElement("img");
    badge.src = "VERIFIED.jpg";
    badge.className =
      "premium-badge absolute bottom-0 right-0 w-5 h-5 rounded-full border-2 border-white shadow-md";
    badge.style.transform = "translate(20%, 20%)";
    badge.style.boxShadow = "0 0 10px rgba(59,130,246,0.5)"; // fintech glow
    wrapper.appendChild(badge);
  }
}

// --- Call this after profile pic updates ---
firebase.auth().onAuthStateChanged(async (user) => {
  if (user) {
    try {
      const doc = await firebase.firestore().collection("users").doc(user.uid).get();
      const profilePic = (doc.exists && doc.data().profilePic) ? doc.data().profilePic : "profile-placeholder.png";
      // Make sure sidebar image is updated first
      sidebarImg.src = profilePic;
      // Then add badge if premium
      addSidebarPremiumBadge();
    } catch (err) {
      console.error("❌ Error fetching sidebar info:", err);
      addSidebarPremiumBadge();
    }
  } else {
    addSidebarPremiumBadge();
  }
});










// NOTIFICATION
// ---------- Notifications JS (updated) ----------


// ---------- Notifications JS (Option B: Clear = hide/delete for user) ----------
let unsubscribeNotif = null;
let lastReadAtOverride = null;     // client-side override for marking read instantly
let lastClearedAtOverride = null;  // client-side override when user clears (instant hide)
let lastUnreadCount = 0;


// time-ago helper
function timeAgo(date) {
  if (!date) return '';
  const diff = Math.floor((Date.now() - date.getTime()) / 1000);
  if (diff < 10) return 'Just now';
  if (diff < 60) return `${diff}s`;
  const mins = Math.floor(diff / 60);
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  const days = Math.floor(hrs / 24);
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days}d`;
  return date.toLocaleDateString();
}

// ensure user state document exists (we create clearedAt as serverTimestamp for new users so they don't see old global notifications)
async function ensureUserState(uid) {
  try {
    const ref = db.collection('notification_user_state').doc(uid);
    const doc = await ref.get();
    if (!doc.exists) {
      await ref.set({
        joinedAt: firebase.firestore.FieldValue.serverTimestamp(),
        lastReadAt: firebase.firestore.FieldValue.serverTimestamp(),
        clearedAt: firebase.firestore.FieldValue.serverTimestamp()
      }, { merge: true });
      return await ref.get();
    }
    return doc;
  } catch (err) {
    console.error("ensureUserState error:", err);
    throw err;
  }
}

// Listen realtime and FILTER OUT notifications with timestamp <= clearedAt
// Fetch notifications once — on reload only
async function fetchNotificationsOnce(uid) {
  await ensureUserState(uid);

  try {
    const stateDoc = await db.collection('notification_user_state').doc(uid).get();

    const joinedAtServer = (stateDoc.exists && stateDoc.data().joinedAt)
      ? stateDoc.data().joinedAt.toDate()
      : new Date();
    const lastReadAtServer = (stateDoc.exists && stateDoc.data().lastReadAt)
      ? stateDoc.data().lastReadAt.toDate()
      : new Date(0);
    const clearedAtServer = (stateDoc.exists && stateDoc.data().clearedAt)
      ? stateDoc.data().clearedAt.toDate()
      : new Date(0);

    const effectiveLastReadAt = lastReadAtOverride || lastReadAtServer || new Date(0);
    const effectiveClearedAt = lastClearedAtOverride || clearedAtServer || new Date(0);

    const notifDot = document.getElementById('notifDot');
    const notifPopup = document.getElementById('notifPopup');
    const notifMessage = document.getElementById('notifMessage');
    const notifList = document.getElementById('notificationList');
    const banner = document.getElementById('notifBanner');
    const bannerText = document.getElementById('notifBannerText');

    let unreadCount = 0;
    if (notifList) notifList.innerHTML = '';

    // ✅ Fetch notifications from Firestore
    const snapshot = await db.collection('notifications')
      .orderBy('timestamp', 'desc')
      .get();

    snapshot.forEach(doc => {
      const data = doc.data();
      const ts = data.timestamp;
      const tsDate = ts ? ts.toDate() : null; // ✅ now tsDate exists

      // Filter old or cleared notifications
      if (tsDate && tsDate <= joinedAtServer) return;
      if (tsDate && tsDate <= effectiveClearedAt) return;

      const isUnread = tsDate ? (tsDate > effectiveLastReadAt) : false;
      if (isUnread) unreadCount++;

      // ✅ Build notification card safely
      if (notifList) {
        const dateStr = tsDate ? timeAgo(tsDate) : 'Just now';

        const card = document.createElement('div');
card.className = `notification-card border-l-4 ${
  isUnread ? 'border-blue-400' : 'border-gray-200'
}`;

        const titleEl = document.createElement('p');
        titleEl.className = 'text-gray-800 font-semibold truncate';
        titleEl.textContent = data.title || 'No Title';

        const msgEl = document.createElement('p');
        msgEl.className = 'text-sm text-gray-600 mt-1 truncate';
        msgEl.textContent = data.message || '';

        const dateEl = document.createElement('p');
        dateEl.className = 'text-xs text-gray-500 mt-2';
        dateEl.textContent = dateStr;

        card.appendChild(titleEl);
        card.appendChild(msgEl);
        card.appendChild(dateEl);

        notifList.appendChild(card);
      }
    });

    // ✅ Update unread count UI
    lastUnreadCount = unreadCount;

    if (notifDot) notifDot.classList.toggle('hidden', unreadCount === 0);

    if (notifPopup && notifMessage) {
      if (unreadCount > 0) {
        notifMessage.textContent = `You have ${unreadCount} new notification${unreadCount > 1 ? 's' : ''}`;
        notifPopup.classList.remove('hidden');
      } else {
        notifPopup.classList.add('hidden');
      }
    }

    if (banner && bannerText) {
      if (unreadCount > 0) {
        bannerText.textContent = `You have ${unreadCount} unread message${unreadCount > 1 ? 's' : ''}`;
        banner.classList.remove('hidden');
      } else {
        banner.classList.add('hidden');
      }
    }

    if (notifList && notifList.children.length === 0) {
      notifList.innerHTML = `<p class="text-gray-400 text-center py-8">No notifications yet.</p>`;
    }

  } catch (err) {
    console.error("fetchNotificationsOnce error:", err);
  }
}

	

// Mark as read (keeps functionality for opening the tab) — does NOT clear/hide
async function markNotificationsAsRead(uid) {
  try {
    const now = new Date();
    lastReadAtOverride = now;

    // immediate UI hide of unread indicators
    const notifDot = document.getElementById('notifDot');
    const notifPopup = document.getElementById('notifPopup');
    const banner = document.getElementById('notifBanner');
    if (notifDot) notifDot.classList.add('hidden');
    if (notifPopup) notifPopup.classList.add('hidden');
    if (banner) banner.classList.add('hidden');

    // optimistically mark visible items as read
    document.querySelectorAll('#notificationList > .border-blue-400').forEach(el => {
      el.classList.remove('border-blue-400');
      el.classList.add('border-gray-200');
    });

    // persist
    await db.collection('notification_user_state').doc(uid).set({
      lastReadAt: firebase.firestore.FieldValue.serverTimestamp()
    }, { merge: true });

    // try to read back server value and sync override
    try {
      const doc = await db.collection('notification_user_state').doc(uid).get();
      if (doc.exists && doc.data().lastReadAt) {
        lastReadAtOverride = doc.data().lastReadAt.toDate();
      }
    } catch (e) { /* no-op */ }

  } catch (err) {
    console.error("markNotificationsAsRead error:", err);
    throw err;
  }
}

// Option B: Clear all notifications FOR USER (persist clearedAt)
// This hides all existing notifications for the user (they will not re-appear)
async function clearAllNotificationsForUser(uid) {
  try {
    // optimistic client-side hide
    const now = new Date();
    lastClearedAtOverride = now;
    lastReadAtOverride = now;

    const notifDot = document.getElementById('notifDot');
    const notifPopup = document.getElementById('notifPopup');
    const banner = document.getElementById('notifBanner');
    const notifList = document.getElementById('notificationList');

    if (notifDot) notifDot.classList.add('hidden');
    if (notifPopup) notifPopup.classList.add('hidden');
    if (banner) banner.classList.add('hidden');
    if (notifList) notifList.innerHTML = `<p class="text-gray-400 text-center py-8">No notifications yet.</p>`;

    // persist clearedAt + lastReadAt so server knows these are hidden/read
    await db.collection('notification_user_state').doc(uid).set({
      clearedAt: firebase.firestore.FieldValue.serverTimestamp(),
      lastReadAt: firebase.firestore.FieldValue.serverTimestamp()
    }, { merge: true });

    // read back server time if available and sync
    try {
      const doc = await db.collection('notification_user_state').doc(uid).get();
      if (doc.exists) {
        if (doc.data().clearedAt) lastClearedAtOverride = doc.data().clearedAt.toDate();
        if (doc.data().lastReadAt) lastReadAtOverride = doc.data().lastReadAt.toDate();
      }
    } catch (e) { /* ignore */ }

    lastUnreadCount = 0;
    showNotifToast('All notifications cleared');

  } catch (err) {
    console.error("clearAllNotificationsForUser error:", err);
    showNotifToast('Failed to clear notifications');
    throw err;
  }
}

// small toast helper
function showNotifToast(message, ms = 3000) {
  const wrap = document.getElementById('notifToastWrap');
  if (!wrap) return;
  const t = document.createElement('div');
  t.className = 'mb-2 rounded-lg px-4 py-2 shadow-md bg-gray-800 text-white text-sm';
  t.textContent = message;
  wrap.appendChild(t);
  setTimeout(() => {
    t.classList.add('opacity-0', 'transition', 'duration-300');
    setTimeout(() => t.remove(), 300);
  }, ms);
}

// Activate tab behavior — opening notifications marks as read (not clear)
function activateTab(tabId) {
  document.querySelectorAll('.tab-section').forEach(el => el.classList.add('hidden'));
  const el = document.getElementById(tabId);
  if (el) el.classList.remove('hidden');

  if (tabId === 'notifications') {
    const user = auth.currentUser;
    if (user) {
      lastReadAtOverride = new Date(); // instant
      // persist read state
      markNotificationsAsRead(user.uid).catch(console.error);
    }
  }
}

// Wire up UI menu + confirm modal (IDs must exist in your HTML)
document.addEventListener('DOMContentLoaded', () => {
  const confirmModal = document.getElementById('confirmClearModal');
  const confirmBtn = document.getElementById('confirmClearBtn');
  const cancelBtn = document.getElementById('cancelClearBtn');
  const menuBtn = document.getElementById('notifMenuBtn');
  const menu = document.getElementById('notifMenu');
  const closeMenuBtn = document.getElementById('closeMenuBtn');

  // open/close menu
  if (menuBtn && menu) {
    menuBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      menu.classList.toggle('hidden');
    });
    document.addEventListener('click', (e) => {
      if (!menu.contains(e.target) && !menuBtn.contains(e.target)) menu.classList.add('hidden');
    });
  }
  if (closeMenuBtn) closeMenuBtn.addEventListener('click', () => menu.classList.add('hidden'));

  // Clear flow: open modal when 'Clear all' clicked (menu already wired)
  const clearAllBtn = document.getElementById('clearAllBtn');
  if (clearAllBtn) {
    clearAllBtn.addEventListener('click', () => {
      if (menu) menu.classList.add('hidden');
      if (confirmModal) confirmModal.classList.remove('hidden');
    });
  }
  if (cancelBtn) cancelBtn.addEventListener('click', () => {
    if (confirmModal) confirmModal.classList.add('hidden');
  });

  if (confirmBtn) {
    confirmBtn.addEventListener('click', async () => {
      confirmBtn.disabled = true;
      const user = auth.currentUser;
      if (!user) {
        showNotifToast('Please sign in to clear notifications');
        confirmBtn.disabled = false;
        return;
      }
      try {
        await clearAllNotificationsForUser(user.uid);
        if (confirmModal) confirmModal.classList.add('hidden');
      } catch (e) {
        console.error(e);
      } finally {
        confirmBtn.disabled = false;
      }
    });
  }

  // bell click opens notifications (keeps previous behaviour)
  const bell = document.getElementById('notifBell');
  if (bell) {
    bell.addEventListener('click', (e) => {
      activateTab('notifications');
      const user = auth.currentUser;
      if (user) markNotificationsAsRead(user.uid).catch(console.error);
    });
  }

  // popup close button
  const popupClose = document.getElementById('notifPopupClose');
  if (popupClose) {
    popupClose.addEventListener('click', () => {
      const notifPopup = document.getElementById('notifPopup');
      if (notifPopup) notifPopup.classList.add('hidden');
    });
  }
});

// Auth state: start/stop listeners and reset overrides on sign-out
auth.onAuthStateChanged(async user => {
  if (user) {
    try {
      await ensureUserState(user.uid);
      await fetchNotificationsOnce(user.uid);  // ✅ Fetch once on reload
    } catch (err) {
      console.error("Error initializing notifications for user:", err);
    }
  } else {
    lastReadAtOverride = null;
    lastClearedAtOverride = null;
  }
});












                                                                       //PAYMENTfunction









  (function () {
    // formatting helper
    function fmtNaira(n) {
      return '₦' + (Number(n) || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    }

    // simple animation for fallback
    function animateNumber(el, from, to, duration = 700) {
      if (!el) return;
      const start = performance.now();
      const diff = to - from;
      cancelAnimationFrame(el.__rafId);
      const step = (t) => {
        const p = Math.min((t - start) / duration, 1);
        const eased = 1 - Math.pow(1 - p, 3);
        el.textContent = fmtNaira(from + diff * eased);
        if (p < 1) el.__rafId = requestAnimationFrame(step);
      };
      el.__rafId = requestAnimationFrame(step);
    }

    function fallbackFetchOnce() {
      if (!window.firebase || !firebase.auth || !firebase.firestore) return;
      const el = document.getElementById('balance');
      if (!el) return;

      function applyVal(n) {
        const prev = Number(el.dataset._last || 0);
        animateNumber(el, prev, Number(n || 0), 700);
        el.dataset._last = String(Number(n || 0));
      }

      const user = firebase.auth().currentUser;
      if (user) {
        firebase.firestore().collection('users').doc(user.uid).get()
          .then(doc => { if (doc.exists) applyVal(doc.data().balance ?? 0); })
          .catch(e => console.error('balance fetch error', e));
      } else {
        firebase.auth().onAuthStateChanged(u => {
          if (!u) return;
          firebase.firestore().collection('users').doc(u.uid).get()
            .then(doc => { if (doc.exists) applyVal(doc.data().balance ?? 0); })
            .catch(e => console.error('balance fetch error', e));
        });
      }
    }

    // Start or fallback. Keeps your existing __balanceCtrl behavior.
    function ensureBalance() {
      const el = document.getElementById('balance');
      if (!el) return;
      try {
        if (window.__balanceCtrl && typeof window.__balanceCtrl.start === 'function') {
          // re-init then start to ensure element binding
          window.__balanceCtrl.init && window.__balanceCtrl.init();
          window.__balanceCtrl.start && window.__balanceCtrl.start();
          return;
        }
      } catch (e) {
        console.warn('__balanceCtrl start failed', e);
      }
      // fallback
      fallbackFetchOnce();
    }

    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', ensureBalance, { once: true });
    } else ensureBalance();
  })();











// deposit_withdraw_client.js
// Place this after Firebase SDK in your HTML (or import into main bundle)

const PAYSTACK_PUBLIC_KEY = "pk_live_795c60d1769a1ebef31e9705886a91f84de3144d";

function debugLog(...args) { try { console.log('[CLIENT]', ...args); } catch (e) {} }

function loadPaystackScript(timeoutMs = 7000) {
  if (window.PaystackPop) return Promise.resolve(window.PaystackPop);
  return new Promise((resolve, reject) => {
    const existing = Array.from(document.getElementsByTagName('script'))
      .find(s => s.src && s.src.includes('js.paystack.co/v1/inline.js'));
    if (existing) {
      if (window.PaystackPop) return resolve(window.PaystackPop);
      existing.addEventListener('load', () => resolve(window.PaystackPop));
      existing.addEventListener('error', () => reject(new Error('Paystack script failed to load')));
      setTimeout(() => (window.PaystackPop ? resolve(window.PaystackPop) : reject(new Error('Paystack load timeout'))), timeoutMs);
      return;
    }
    const s = document.createElement('script');
    s.src = 'https://js.paystack.co/v1/inline.js';
    s.async = true;
    s.onload = () => resolve(window.PaystackPop);
    s.onerror = () => reject(new Error('Paystack script failed to load'));
    document.head.appendChild(s);
    setTimeout(() => {
      if (window.PaystackPop) return;
      reject(new Error('Paystack load timeout'));
    }, timeoutMs);
  });
}

function waitForFirebaseAuth(timeoutMs = 7000) {
  return new Promise(resolve => {
    const start = Date.now();
    (function poll() {
      if (window.firebase && firebase.auth && typeof firebase.auth === 'function') return resolve(firebase.auth());
      if (Date.now() - start > timeoutMs) return resolve(null);
      setTimeout(poll, 200);
    })();
  });
}

function ensureFirebaseUser(timeoutMs = 5000) {
  return new Promise(resolve => {
    const cur = (window.firebase && firebase.auth) ? firebase.auth().currentUser : null;
    if (cur) return resolve(cur);
    if (!window.firebase || !firebase.auth) return resolve(null);
    const unsub = firebase.auth().onAuthStateChanged(user => {
      try { unsub(); } catch (e) {}
      resolve(user);
    });
    setTimeout(() => {
      try { unsub(); } catch (e) {}
      resolve(firebase.auth().currentUser || null);
    }, timeoutMs);
  });
}

/* Deposit helpers */
function _getDepositBtn() {
  return document.getElementById('depositBtn') || document.querySelector('#depositSection button[onclick="handleDeposit()"]');
}
function setDepositLoading(isLoading, text = 'Processing...') {
  const btn = _getDepositBtn();
  if (!btn) return;
  if (isLoading) {
    btn.dataset.prevHtml = btn.innerHTML;
    btn.disabled = true;
    btn.innerHTML = `<span>${text}</span>`;
  } else {
    btn.disabled = false;
    btn.innerHTML = btn.dataset.prevHtml || 'Proceed to Paystack Checkout';
    delete btn.dataset.prevHtml;
  }
}

async function payWithPaystack(amount) {
  debugLog('payWithPaystack called with', amount);
  setDepositLoading(true, 'Opening checkout...');
  const amtNum = Number(amount);
  if (!isFinite(amtNum) || amtNum <= 0) {
    setDepositLoading(false);
    alert('Invalid amount.');
    return;
  }
  if (PAYSTACK_PUBLIC_KEY.startsWith('pk_live') && location.protocol !== 'https:') {
    setDepositLoading(false);
    const msg = 'Live Paystack key requires HTTPS. Deploy to an https:// URL.';
    console.error(msg);
    alert(msg);
    return;
  }

  const user = await ensureFirebaseUser();
  debugLog('firebase user:', !!user, user && user.email);
  if (!user) {
    setDepositLoading(false);
    alert('You must be signed in to make a deposit.');
    return;
  }

  // save fresh idToken to sessionStorage before checkout (fallback)
  try {
    const idToken = await user.getIdToken(true);
    try { sessionStorage.setItem('globals_id_token', idToken); } catch (e) {}
  } catch (err) {
    console.warn('Could not obtain idToken before checkout', err);
  }

  try {
    await loadPaystackScript();
  } catch (err) {
    setDepositLoading(false);
    console.error('Failed to load Paystack library:', err);
    alert('Payment library failed to load. Refresh the page and try again.');
    return;
  }

  const email = user.email || document.getElementById('depositEmail')?.value;
  if (!email) { setDepositLoading(false); alert('Could not determine your account email. Sign in again.'); return; }

  try {
    const handler = PaystackPop.setup({
      key: PAYSTACK_PUBLIC_KEY,
      email,
      amount: Math.round(amtNum * 100),
      currency: 'NGN',
      label: 'Globals Deposit',
      metadata: { uid: user.uid },
      callback: function (response) {
        (async () => {
          debugLog('Paystack callback', response);
          setDepositLoading(true, 'Verifying payment...');
          try {
            // prefer fresh token; fallback to sessionStorage saved token
            let usedToken = null;
            try { usedToken = await user.getIdToken(true); } catch (e) {}
            if (!usedToken) usedToken = sessionStorage.getItem('globals_id_token') || null;

            const verifyRes = await fetch('/api/verify-payment', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                ...(usedToken ? { 'Authorization': 'Bearer ' + usedToken } : {})
              },
              body: JSON.stringify({ reference: response.reference, amount: amtNum, idToken: usedToken || null })
            });

            let data = null;
            try { data = await verifyRes.json(); } catch (e) {}
            debugLog('verify-payment response', verifyRes.status, data);
            if (verifyRes.ok && data && data.status === 'success') {
              setDepositLoading(false);
              alert('Deposit successful!');
              try { sessionStorage.removeItem('globals_id_token'); } catch (e) {}
              window.location.reload();
            } else {
              setDepositLoading(false);
              const msg = data && data.message ? data.message : `Verification failed (HTTP ${verifyRes.status})`;
              alert('Deposit verification failed: ' + msg);
              console.warn('verify-payment failure', data);
            }
          } catch (err) {
            setDepositLoading(false);
            console.error('Error verifying payment', err);
            alert('An error occurred verifying the deposit.');
          }
        })();
      },
      onClose: function() { setDepositLoading(false); debugLog('Paystack checkout closed by user'); }
    });
    handler.openIframe();
    debugLog('opened Paystack iframe');
  } catch (err) {
    setDepositLoading(false);
    console.error('Could not set up Paystack handler:', err);
    alert('Could not start payment flow. Check console for details.');
  }
}

function handleDeposit() {
  const raw = document.getElementById('depositAmount')?.value;
  debugLog('handleDeposit raw', raw);
  const amount = parseFloat((raw || '').toString().trim());
  const amountErrorEl = document.getElementById('amountError');
  if (!amount || amount < 100) {
    if (amountErrorEl) amountErrorEl.classList.remove('hidden');
    return;
  } else {
    if (amountErrorEl) amountErrorEl.classList.add('hidden');
  }
  payWithPaystack(amount).catch(err => { console.error('Unhandled payWithPaystack error', err); setDepositLoading(false); });
}


	

/* BANKS & ACCOUNT VERIFY */




/* BANKS & ACCOUNT VERIFY */
async function loadBanks() {
  const bankSelect = document.getElementById('withdrawBankSelect');
  if (!bankSelect) return;
  bankSelect.disabled = true;
  bankSelect.innerHTML = `<option>Loading Banks...</option>`;

  const urls = ['/api/get-banks', location.origin + '/api/get-banks', 'https://globalstasks.name.ng/api/get-banks'];
  let banks = null;
  for (const url of urls) {
    try {
      const res = await fetch(url, { cache: 'no-store' });
      if (!res.ok) { debugLog('banks fetch non-ok', url, res.status); continue; }
      const json = await res.json().catch(()=>null);
      if (Array.isArray(json)) banks = json;
      else if (json && Array.isArray(json.data)) banks = json.data;
      if (banks && banks.length) { debugLog('banks loaded from', url, banks.length); break; }
    } catch (err) { debugLog('banks fetch error', url, err); }
  }

  if (!banks) {
    bankSelect.innerHTML = `<option>Error loading banks</option>`;
    bankSelect.disabled = false;
    console.error('All bank fetch attempts failed.');
    return;
  }

  bankSelect.innerHTML = `<option value="">Select Bank</option>`;
  banks.forEach(bank => {
    const option = document.createElement('option');
    option.value = bank.code;
    option.text = bank.name || bank.bank_name || 'Unknown';
    bankSelect.appendChild(option);
  });
  bankSelect.disabled = false;
}

let _verifyAccountTimer = null;
async function verifyAccount() {
  const accEl = document.getElementById('withdrawAccountNumber');
  const bankEl = document.getElementById('withdrawBankSelect');
  const nameStatus = document.getElementById('accountNameStatus');
  const nameDisplay = document.getElementById('accountNameDisplay');
  if (!accEl || !bankEl || !nameStatus || !nameDisplay) return;

  const accNum = (accEl.value || '').toString().trim();
  const bankCode = (bankEl.value || '').toString().trim();
  if (accNum.length < 10 || !bankCode) { nameStatus.classList.add('hidden'); nameDisplay.classList.add('hidden'); return; }

  nameStatus.classList.remove('hidden');
  nameDisplay.classList.add('hidden');

  const candidates = ['/api/verify-account', location.origin + '/api/verify-account', 'https://globalstasks.name.ng/api/verify-account'];
  let ok = false;
  for (const url of candidates) {
    try {
      const res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ accNum, bankCode }) });
      if (!res.ok) { debugLog('verify-account non-ok', url, res.status); continue; }
      const data = await res.json().catch(()=>null);
      if (!data) { debugLog('verify-account empty json', url); continue; }
      if (data.status === 'success' && data.account_name) {
        nameDisplay.innerText = `✅ ${data.account_name}`;
        nameDisplay.classList.remove('hidden'); ok = true; break;
      } else {
        nameDisplay.innerText = '❌ Account not found'; nameDisplay.classList.remove('hidden'); ok = true; break;
      }
    } catch (err) { debugLog('verify-account fetch error', url, err); continue; }
  }

  if (!ok) { nameDisplay.innerText = '❌ Error verifying account'; nameDisplay.classList.remove('hidden'); debugLog('verify-account: all attempts failed'); }
  nameStatus.classList.add('hidden');
}

/* SUBMIT WITHDRAWAL */
async function submitWithdrawal() {
  const accNum = (document.getElementById('withdrawAccountNumber')?.value || '').trim();
const bankSelect = document.getElementById('withdrawBankSelect');
const bankCode = (bankSelect?.value || '').trim();
const bankName = bankSelect?.options[bankSelect.selectedIndex]?.text || '';

const accountName = (document.getElementById('accountNameDisplay')?.innerText || '')
  .replace('✅ ', '')
  .trim();
const amount = parseInt(document.getElementById('withdrawAmount')?.value || '0', 10);
const pinEl = document.getElementById('withdrawPin') || document.getElementById('withdrawPassword');
const pin = (pinEl?.value || '').trim();

if (!accNum || !bankName || !accountName || !amount || amount < 500 || !pin) {
  alert('⚠️ Please fill all fields correctly (min ₦500)');
  return;
}
  const user = await ensureFirebaseUser();
  if (!user) { alert('You must be signed in to withdraw.'); return; }

  let idToken = null;
  try { idToken = await user.getIdToken(true); } catch (err) { console.warn('Could not get idToken', err); }
  if (!idToken) { alert('Authentication failed. Please sign out and sign in again.'); return; }

  const withdrawBtn = document.querySelector('#withdrawFundsSection button[onclick="submitWithdrawal()"]') || document.querySelector('#withdrawFundsSection button');
  if (withdrawBtn) { withdrawBtn.disabled = true; withdrawBtn.dataset.prev = withdrawBtn.innerHTML; withdrawBtn.innerHTML = 'Processing...'; }

  try {
    const resp = await fetch('/api/request-withdrawal', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + idToken },
      body: JSON.stringify({ accNum, bankCode, bankName, account_name: accountName, amount, pin })
    });
    const data = await resp.json().catch(()=>null);
    debugLog('request-withdrawal response', resp.status, data);
    if (resp.ok && data && data.status === 'success') {
      alert('✅ Withdrawal successful! The transfer was initiated.');
      window.location.reload();
    } else {
      const msg = (data && (data.message || data.error)) ? (data.message || data.error) : `Withdrawal failed (HTTP ${resp.status})`;
      alert('❌ Withdrawal failed: ' + msg);
    }
  } catch (err) {
    console.error('submitWithdrawal error', err);
    alert('❌ Error submitting withdrawal. Try again later.');
  } finally {
    if (withdrawBtn) { withdrawBtn.disabled = false; withdrawBtn.innerHTML = withdrawBtn.dataset.prev || 'Withdraw Now'; }
  }
}

/* DOM listeners */
document.addEventListener('DOMContentLoaded', async () => {
  try { await loadBanks(); } catch(e) { debugLog('loadBanks threw', e); }

  // auto-fill deposit email
  const auth = await waitForFirebaseAuth(7000);
  const depositEl = () => document.getElementById('depositEmail');
  if (auth) {
    try {
      auth.onAuthStateChanged(user => { const el = depositEl(); if (el) el.value = user ? (user.email || '') : ''; });
      const cur = auth.currentUser; if (cur && depositEl()) depositEl().value = cur.email || '';
    } catch(e) { debugLog('auth attach error', e); }
  } else {
    // fallback attempt
    setTimeout(async () => {
      const a = await waitForFirebaseAuth(7000);
      if (a) {
        a.onAuthStateChanged(user => { const el = depositEl(); if (el) el.value = user ? (user.email || '') : ''; });
        try { const cur = a.currentUser; if (cur && depositEl()) depositEl().value = cur.email || ''; } catch(e){}
      }
    }, 1000);
  }

  // attach verify listeners
  const accEl = document.getElementById('withdrawAccountNumber');
  const bankEl = document.getElementById('withdrawBankSelect');
  if (accEl) {
    accEl.addEventListener('blur', verifyAccount);
    accEl.addEventListener('input', () => { if (_verifyAccountTimer) clearTimeout(_verifyAccountTimer); _verifyAccountTimer = setTimeout(verifyAccount, 700); });
  }
  if (bankEl) bankEl.addEventListener('change', verifyAccount);
});

/* expose functions used by inline onclick attributes */
window.handleDeposit = handleDeposit;
window.submitWithdrawal = submitWithdrawal;
window.verifyAccount = verifyAccount;
window.loadBanks = loadBanks;



									 














 // Service FUNCTION FOR CARD


window.addEventListener('load', () => {
  const icons = ["AIRTIME1.jpg", "DATA1.jpg", "ELECTRICITY1.jpg", "TV1.jpg"];
  icons.forEach(src => {
    const img = new Image();
    img.src = src;
  });
});








// Optimized drawer JS FUNCTION 

// Optimized drawer JS (attach once)
(function () {
  const drawer = document.getElementById('servicesDrawer');
  if (!drawer) return;

  const backdrop = drawer.querySelector('[data-backdrop]');
  const panel = drawer.querySelector('.drawer-panel');
  const closeBtnArea = drawer.querySelector('[data-close]');
  const serviceButtons = drawer.querySelectorAll('[data-action]');

  // internal timers to stagger image loads
  let _staggerTimers = [];

  // open drawer
  window.openServicesDrawer = function openServicesDrawer() {
    // quick guard
    if (!drawer.classList.contains('hidden')) return;

    // show overlay
    drawer.classList.remove('hidden');
    drawer.setAttribute('aria-hidden', 'false');

    // lock body scroll
    document.body.style.overflow = 'hidden';

    // small rAF to ensure the class transition fires
    requestAnimationFrame(() => {
      backdrop.classList.add('opacity-100');
      panel.classList.add('open'); // we rely on CSS .open -> transform: translateY(0)
      panel.style.transform = 'translateY(0)';
    });

    // load icons/images in a staggered way to avoid main-thread spikes
    staggerLoadDrawerImages();
  };

  // close drawer
  window.closeServicesDrawer = function closeServicesDrawer() {
    if (drawer.classList.contains('hidden')) return;

    // hide overlay with transition
    backdrop.classList.remove('opacity-100');

    // animate panel down
    panel.classList.remove('open');
    panel.style.transform = 'translateY(100%)';

    // after animation completes, hide the wrapper and restore body scroll
    const onEnd = () => {
      drawer.classList.add('hidden');
      drawer.setAttribute('aria-hidden', 'true');
      document.body.style.overflow = '';
      panel.removeEventListener('transitionend', onEnd);
      // clear any stagger timers and optionally unload images
      clearStaggerTimers();
      unloadDrawerImages(); // optional (saves memory / avoids background refs)
    };
    panel.addEventListener('transitionend', onEnd, { once: true });
  };

  // close when backdrop or handle clicked
  backdrop.addEventListener('click', closeServicesDrawer);
  if (closeBtnArea) closeBtnArea.addEventListener('click', closeServicesDrawer);

  // delegate service buttons to actions (keeps event count low)
  serviceButtons.forEach(btn => {
    btn.addEventListener('click', (ev) => {
      const action = btn.dataset.action;
      // close first for snappy UX
      closeServicesDrawer();
      // small timeout to allow close animation, then call the action
      setTimeout(() => {
        // call existing functions by mapping - keep safe checks
        if (action === 'airtime' && typeof airtimeOpen === 'function') airtimeOpen();
        if (action === 'data' && typeof dataOpen === 'function') dataOpen();
        if (action === 'electricity' && typeof activateTab === 'function') activateTab('electricity-screen');
        if (action === 'betting' && typeof activateTab === 'function') activateTab('betting-screen');
        if (action === 'tv' && typeof activateTab === 'function') activateTab('tv-screen');
      }, 260); // slightly after panel transition
    });
  });

  // ---------- lazy load / stagger helpers ----------
  function staggerLoadDrawerImages() {
    clearStaggerTimers();
    const imgs = drawer.querySelectorAll('img.lazy[data-src]');
    imgs.forEach((img, i) => {
      // stagger by 60-90ms per image
      const t = setTimeout(() => {
        if (img.dataset.src && (!img.src || img.src.indexOf('data:') === 0)) {
          img.src = img.dataset.src;
        }
      }, i * 70);
      _staggerTimers.push(t);
    });
  }

  function clearStaggerTimers() {
    _staggerTimers.forEach(id => clearTimeout(id));
    _staggerTimers = [];
  }

  function unloadDrawerImages() {
    // remove src to free memory and avoid background decoding
    const imgs = drawer.querySelectorAll('img.lazy');
    imgs.forEach(img => {
      try {
        // keep data-src for next open, but remove live src
        img.removeAttribute('src');
      } catch (e) { /* noop */ }
    });
  }

  // ensure panel CSS open state is applied via class too (for graceful degrade)
  // CSS rule we rely on: .drawer-panel { transform: translateY(100%); } .drawer-panel.open { transform: translateY(0); }
})();










// ===== Airtime UI State (namespaced, no conflict) =====

(() => {
  // Expose these for onclick attributes (safe namespace)
  window.airtimeOpen = airtimeOpen;
  window.airtimeClose = airtimeClose;
  window.airtimeSelectNetwork = airtimeSelectNetwork;
  window.airtimeSetAmount = airtimeSetAmount;
  window.airtimeGoToConfirm = airtimeGoToConfirm;
  window.airtimePay = airtimePay;
  window.airtimeReset = airtimeReset;

  // State
  let airtimeSelectedAmount = 0;
  let airtimeSelectedNetwork = '';
  let airtimeCurrentUser = null;
  let airtimeUserRef = null;

  const AIRTIME_SCREENS = ['airtime-screen','confirm-airtime-screen','success-screen'];
  const AIRTIME_NETWORKS = {
    '01': { label: 'MTN', logo: 'MTN.jpg' },
    '02': { label: 'GLO', logo: 'GLO.jpg' },
    '04': { label: 'Airtel', logo: 'AIRTEL.jpg' },
    '03': { label: '9mobile', logo: '9MOBILE.jpg' }
  };

  function fmt(n){ return Number(n).toLocaleString(); }

  // Show/hide utilities
  function _showScreen(id){
    AIRTIME_SCREENS.forEach(s => {
      const el = document.getElementById(s);
      if (!el) return;
      if (s === id) { el.classList.remove('hidden'); el.setAttribute('aria-hidden','false'); }
      else { el.classList.add('hidden'); el.setAttribute('aria-hidden','true'); }
    });
    // add scroll lock when any airtime overlay visible
    document.body.classList.add('overflow-hidden');
  }
  function _hideAll(){
    AIRTIME_SCREENS.forEach(s => {
      const el = document.getElementById(s);
      if (!el) return;
      el.classList.add('hidden');
      el.setAttribute('aria-hidden','true');
    });
    document.body.classList.remove('overflow-hidden');
  }

  // Public open/close
  function airtimeOpen(){
    _showScreen('airtime-screen');
    // focus phone input
    setTimeout(()=>{ const i = document.getElementById('airtime-phone'); if(i) i.focus(); }, 80);
  }
  function airtimeClose(){
    // just hide overlays and return to dashboard if possible
    _hideAll();
    // If your dashboard uses showScreen('home'), call it safely
    if (typeof window.showScreen === 'function') {
      try { window.showScreen('home'); } catch(e){ /* ignore */ }
    }
  }

  // Initialize firebase user ref if present
  if (typeof firebase !== 'undefined' && typeof db !== 'undefined') {
    firebase.auth().onAuthStateChanged(u => {
      airtimeCurrentUser = u;
      airtimeUserRef = u ? db.collection('users').doc(u.uid) : null;
    });
  } else {
    // don't throw — we'll show friendly error when user tries to transact
    console.warn('[Airtime] firebase/db not available');
  }

  // Interaction helpers
  function airtimeSelectNetwork(code, btn){
    airtimeSelectedNetwork = code;
    document.querySelectorAll('#network-grid button').forEach(b=>{
      if (b.dataset.code === code) b.classList.add('ring','ring-indigo-500');
      else b.classList.remove('ring','ring-indigo-500');
    });
  }
  function airtimeSetAmount(v){
    airtimeSelectedAmount = v;
    const inp = document.getElementById('airtime-amount'); if(inp) inp.value = v;
  }

  // messages
  function showAirtimeMsg(id, text){
    const e = document.getElementById(id);
    if(!e) return;
    e.textContent = text; e.classList.remove('hidden');
  }
  function hideAirtimeMsg(id){
    const e = document.getElementById(id);
    if(!e) return;
    e.classList.add('hidden');
  }

  // Continue => populate confirm overlay values and show it
  async function airtimeGoToConfirm(){
    hideAirtimeMsg('airtime-error');

    const network = airtimeSelectedNetwork;
    const phone = (document.getElementById('airtime-phone')?.value || '').trim();
    const raw = document.getElementById('airtime-amount')?.value;
    const amount = parseInt(raw || airtimeSelectedAmount || 0, 10);

    if(!network){ showAirtimeMsg('airtime-error','Please select a network.'); return; }
    if(!phone || !/^0\d{10}$/.test(phone)){ showAirtimeMsg('airtime-error','Enter a valid 11-digit phone number.'); return; }
    if(!amount || amount < 50){ showAirtimeMsg('airtime-error','Amount must be at least ₦50.'); return; }
    if(!airtimeCurrentUser || !airtimeUserRef){ showAirtimeMsg('airtime-error','You must be signed in.'); return; }

    try {
      // guard if airtimeUserRef is not a firestore doc ref
      if (!airtimeUserRef || typeof airtimeUserRef.get !== 'function') {
        showAirtimeMsg('airtime-error','Service temporarily unavailable.'); return;
      }
      const doc = await airtimeUserRef.get();
      if(!doc.exists){ showAirtimeMsg('airtime-error','User record not found.'); return; }
      const u = doc.data();
      if(!u || !u.pin){ showAirtimeMsg('airtime-error','Payment PIN not set.'); return; }

      const net = AIRTIME_NETWORKS[network] || { label: network, logo: '' };

      document.getElementById('confirm-network').innerText = net.label;
      document.getElementById('confirm-phone').innerText = phone;
      document.getElementById('confirm-amount').innerText = '₦' + fmt(amount);
      document.getElementById('confirm-balance').innerText = '₦' + fmt(u.balance || 0);
      document.getElementById('confirm-network-logo').src = net.logo || '';

      const confirmEl = document.getElementById('confirm-airtime-screen');
      confirmEl.dataset.networkCode = network;
      confirmEl.dataset.phone = phone;
      confirmEl.dataset.amount = amount;

      _showScreen('confirm-airtime-screen');
    } catch (err) {
      console.error('[Airtime] goToConfirm error', err);
      showAirtimeMsg('airtime-error','Could not read account. Try again later.');
    }
  }

  // Pay flow (safe guards for missing db)
  async function airtimePay(){
    hideAirtimeMsg('confirm-error');
    const pinInput = (document.getElementById('confirm-pin')?.value || '').trim();
    const btn = document.getElementById('pay-btn');
    if(!pinInput){ showAirtimeMsg('confirm-error','Enter your payment PIN'); return; }
    if(!airtimeCurrentUser || !airtimeUserRef){ showAirtimeMsg('confirm-error','You must be signed in.'); return; }

    const confirmEl = document.getElementById('confirm-airtime-screen');
    const networkCode = confirmEl?.dataset.networkCode;
    const phone = confirmEl?.dataset.phone;
    const amount = parseInt(confirmEl?.dataset.amount || 0, 10);
    if(!networkCode || !phone || !amount){ showAirtimeMsg('confirm-error','Missing transaction details.'); return; }

    // ensure db.runTransaction available
    if (typeof db === 'undefined' || typeof db.runTransaction !== 'function') {
      showAirtimeMsg('confirm-error','Service temporarily unavailable.'); return;
    }

    btn.disabled = true;
    const orig = btn.innerHTML;
    btn.innerHTML = 'Processing...';

    try {
      await db.runTransaction(async (tx) => {
        const uSnap = await tx.get(airtimeUserRef);
        if(!uSnap.exists) throw new Error('USER_NOT_FOUND');
        const u = uSnap.data();
        if(!u.pin) throw new Error('PIN_NOT_SET');
        if(String(u.pin) !== String(pinInput)) throw new Error('INCORRECT_PIN');
        const currentBalance = Number(u.balance || 0);
        if(currentBalance < amount) throw new Error('INSUFFICIENT_BALANCE');

        tx.update(airtimeUserRef, { balance: currentBalance - amount });

        const billsRef = db.collection('bill_submissions');
        const newBill = billsRef.doc();
        tx.set(newBill, {
          userId: airtimeCurrentUser.uid,
          networkCode,
          network: AIRTIME_NETWORKS[networkCode] ? AIRTIME_NETWORKS[networkCode].label : networkCode,
          phone,
          amount,
          status: 'submitted',
          processed: false,
          createdAt: firebase.firestore.FieldValue.serverTimestamp()
        });
      });


		
      _showScreen('success-screen');

// 👉 Add transaction record
try {
  if (airtimeCurrentUser && db) {
    await db.collection("Transaction").add({
      userId: airtimeCurrentUser.uid,
      type: "Airtime",
      amount: amount,
      status: "processing",
      timestamp: firebase.firestore.FieldValue.serverTimestamp()
    });
    console.log("[Airtime] Transaction added");
  }
} catch (err) {
  console.error("[Airtime] Failed to add transaction:", err);
}


		
    } catch (err) {
      console.error('[Airtime] pay error', err);
      if(err.message === 'USER_NOT_FOUND'){ showAirtimeMsg('confirm-error','User record not found.'); }
      else if(err.message === 'PIN_NOT_SET'){ showAirtimeMsg('confirm-error','Payment PIN not set.'); }
      else if(err.message === 'INCORRECT_PIN'){ showAirtimeMsg('confirm-error','Incorrect PIN.'); }
      else if(err.message === 'INSUFFICIENT_BALANCE'){ showAirtimeMsg('confirm-error','Insufficient balance.'); }
      else showAirtimeMsg('confirm-error','Transaction failed. Try again later.');
    } finally {
      btn.disabled = false;
      btn.innerHTML = orig;
    }
  }

  // Reset and return to airtime form
  function airtimeReset(){
    document.getElementById("airtime-phone").value = "";
    document.getElementById("airtime-amount").value = "";
    const pin = document.getElementById("confirm-pin"); if (pin) pin.value = "";
    airtimeSelectedNetwork = '';
    airtimeSelectedAmount = 0;
    document.querySelectorAll('#network-grid button').forEach(b => b.classList.remove('ring','ring-indigo-500'));
    _showScreen('airtime-screen');
  }

  // Expose debug helper
  window.airtimeDebug = function(){
    return {
      open: !!(document.getElementById('airtime-screen') && !document.getElementById('airtime-screen').classList.contains('hidden')),
      user: !!airtimeCurrentUser,
      airtimeUserRefExists: !!airtimeUserRef
    };
  };

})(); // IIFE end




// DATA FUNCTIONS


(() => {
  // Expose globally
  window.dataOpen = dataOpen;
  window.dataClose = dataClose;
  window.dataSelectNetwork = dataSelectNetwork;
  window.dataSelectPlan = dataSelectPlan;
  window.dataGoToConfirm = dataGoToConfirm;
  window.dataPay = dataPay;
  window.dataReset = dataReset;

  // State
  let dataSelectedNetwork = '';
  let dataSelectedPlan = null;
  let dataCurrentUser = null;
  let dataUserRef = null;

  const DATA_SCREENS = ['data-screen','confirm-data-screen','data-success-screen'];
  const DATA_NETWORKS = {
    '01': { label: 'MTN', logo: 'MTN.jpg' },
    '02': { label: 'GLO', logo: 'GLO.jpg' },
    '04': { label: 'Airtel', logo: 'AIRTEL.jpg' },
    '03': { label: '9mobile', logo: '9MOBILE.jpg' }
  };

  // Example Data Bundles (you can expand later or fetch from DB)
 
 const DATA_PLANS = {


   
 '01': [
 
   
  { id:'m1', label:'110MB - ₦100', amount:100 }, 
   
  { id:'m2', label:'500MB - ₦350', amount:350 },
	 
  { id:'m3', label:'1GB - ₦500', amount:500 },

  { id:'m4', label:'1.5GB - ₦600', amount:600 },
 
   
  { id:'m5', label:'2.5GB - ₦750', amount:750 },
 
    
  { id:'m6', label:'2GB - ₦750', amount:750 }, 

  { id:'m7', label:'2.5GB - ₦900', amount:900 },

  { id:'m8', label:'3.2GB - ₦1000', amount:1000 }

  
  ],


   

 '02': [

    
  { id:'g1', label:'1GB - ₦300', amount:300 },
 
  
  { id:'g2', label:'1GB - ₦350', amount:350 },


  { id:'g3', label:'3GB - ₦900', amount:900 },
 
  
  { id:'g4', label:'3GB - ₦1000', amount:1000 },


  { id:'g5', label:'5GB - ₦1500', amount:1500 },
  
 
  { id:'g6', label:'5GB - ₦1700', amount:1700 },


  { id:'g7', label:'500MB - ₦250', amount:250 },
 
  
  { id:'g8', label:'1GB - ₦500', amount:500 }

  
  ],


   

 '04': [
 
   
  { id:'a1', label:'75MB - ₦75', amount:75 },
 
  
  { id:'a2', label:'250MB - ₦50', amount:50 },

  { id:'a3', label:'110MB - ₦100', amount:100 },

   
  { id:'a4', label:'230MB - ₦200', amount:200 },

  { id:'a5', label:'300MB - ₦300', amount:300 },

   
  { id:'a6', label:'1.5GB - ₦500', amount:500 },

  { id:'a7', label:'2GB - ₦600', amount:600 },
 
  
  { id:'a8', label:'3GB - ₦750', amount:750 },

  { id:'a9', label:'3.2GB - ₦1000', amount:1000 },

   
  { id:'a10', label:'5GB - ₦1500', amount:1500 }

   
 ],
 

   

'03': [

   
   { id:'9a', label:'150MB - ₦150', amount:150 },
   
  
   { id:'9b', label:'250MB - ₦200', amount:200 }
,

   { id:'9c', label:'650MB - ₦500', amount:500 },
  
   
   { id:'9d', label:'83MB - ₦100', amount:100 },

 
   { id:'9e', label:'40MB - ₦50', amount:50 },
 
    
   { id:'9f', label:'2GB - ₦1000', amount:1000 },

 
   { id:'9g', label:'2.3GB - ₦1200', amount:1200 },

     
   { id:'9h', label:'3.4GB - ₦1500', amount:1500 },

   { id:'9i', label:'4.5GB - ₦2000', amount:2000 }
  
 ]
 };

  function fmt(n){ return Number(n).toLocaleString(); }

  function _showScreen(id){
    DATA_SCREENS.forEach(s=>{
      const el = document.getElementById(s);
      if(!el) return;
      if(s===id){ el.classList.remove('hidden'); el.setAttribute('aria-hidden','false'); }
      else { el.classList.add('hidden'); el.setAttribute('aria-hidden','true'); }
    });
    document.body.classList.add('overflow-hidden');
  }
  function _hideAll(){
    DATA_SCREENS.forEach(s=>{
      const el=document.getElementById(s);
      if(el){ el.classList.add('hidden'); el.setAttribute('aria-hidden','true'); }
    });
    document.body.classList.remove('overflow-hidden');
  }

  function dataOpen(){
    _showScreen('data-screen');
    setTimeout(()=>{ const i=document.getElementById('data-phone'); if(i) i.focus(); },80);
  }
  function dataClose(){ _hideAll(); if(window.showScreen) try{showScreen('home')}catch{} }

  // Firebase
  if(typeof firebase!=='undefined' && typeof db!=='undefined'){
    firebase.auth().onAuthStateChanged(u=>{
      dataCurrentUser=u;
      dataUserRef=u? db.collection('users').doc(u.uid):null;
    });
  }

  function dataSelectNetwork(code){
    dataSelectedNetwork=code;
    document.querySelectorAll('#data-network-grid button').forEach(b=>{
      if(b.dataset.code===code) b.classList.add('ring','ring-indigo-500');
      else b.classList.remove('ring','ring-indigo-500');
    });
    // load plans
    const planWrap=document.getElementById('data-plans');
    planWrap.innerHTML='';
    (DATA_PLANS[code]||[]).forEach(plan=>{
      const btn=document.createElement('button');
      btn.className='plan-btn';
      btn.textContent=plan.label;
      btn.onclick=()=>dataSelectPlan(plan);
      planWrap.appendChild(btn);
    });
  }

  function dataSelectPlan(plan){
    dataSelectedPlan=plan;
    document.querySelectorAll('#data-plans button').forEach(b=>{
      if(b.textContent===plan.label) b.classList.add('ring','ring-indigo-500');
      else b.classList.remove('ring','ring-indigo-500');
    });
  }

  function showDataMsg(id,text){ const e=document.getElementById(id); if(e){ e.textContent=text; e.classList.remove('hidden'); } }
  function hideDataMsg(id){ const e=document.getElementById(id); if(e) e.classList.add('hidden'); }

  async function dataGoToConfirm(){
    hideDataMsg('data-error');
    const network=dataSelectedNetwork;
    const phone=(document.getElementById('data-phone')?.value||'').trim();
    const plan=dataSelectedPlan;

    if(!network){ showDataMsg('data-error','Select a network.'); return; }
    if(!plan){ showDataMsg('data-error','Select a data plan.'); return; }
    if(!phone||!/^0\d{10}$/.test(phone)){ showDataMsg('data-error','Enter valid 11-digit number.'); return; }
    if(!dataCurrentUser||!dataUserRef){ showDataMsg('data-error','Sign in required.'); return; }

    try{
      const doc=await dataUserRef.get();
      if(!doc.exists){ showDataMsg('data-error','User record missing'); return; }
      const u=doc.data();
      if(!u||!u.pin){ showDataMsg('data-error','Set your PIN first'); return; }

      const net=DATA_NETWORKS[network];
      document.getElementById('confirm-data-network').innerText=net.label;
      document.getElementById('confirm-data-phone').innerText=phone;
      document.getElementById('confirm-data-plan').innerText=plan.label;
      document.getElementById('confirm-data-amount').innerText='₦'+fmt(plan.amount);
      document.getElementById('confirm-data-balance').innerText='₦'+fmt(u.balance||0);
      document.getElementById('confirm-data-logo').src=net.logo;

      const c=document.getElementById('confirm-data-screen');
      c.dataset.network=network;
      c.dataset.phone=phone;
      c.dataset.planId=plan.id;
      c.dataset.amount=plan.amount;

      _showScreen('confirm-data-screen');
    }catch(e){ console.error(e); showDataMsg('data-error','Could not fetch account'); }
  }

  async function dataPay(){
    hideDataMsg('confirm-data-error');
    const pin=(document.getElementById('confirm-data-pin')?.value||'').trim();
    if(!pin){ showDataMsg('confirm-data-error','Enter PIN'); return; }

    const c=document.getElementById('confirm-data-screen');
    const network=c?.dataset.network;
    const phone=c?.dataset.phone;
    const amount=parseInt(c?.dataset.amount||0,10);

    if(!dataUserRef||!dataCurrentUser){ showDataMsg('confirm-data-error','Sign in required'); return; }
    if(!network||!phone||!amount){ showDataMsg('confirm-data-error','Missing transaction details'); return; }

    const btn=document.getElementById('data-pay-btn');
    btn.disabled=true; const orig=btn.innerHTML; btn.innerHTML='Processing...';

    try{
      await db.runTransaction(async tx=>{
        const uSnap=await tx.get(dataUserRef);
        if(!uSnap.exists) throw new Error('USER_NOT_FOUND');
        const u=uSnap.data();
        if(String(u.pin)!==String(pin)) throw new Error('INCORRECT_PIN');
        if((u.balance||0)<amount) throw new Error('INSUFFICIENT_BAL');
        tx.update(dataUserRef,{balance:(u.balance||0)-amount});

        const billsRef=db.collection('bill_submissions');
        const newBill=billsRef.doc();
		  
        const net = DATA_NETWORKS[network]; // ✅ get network info
const planId = c?.dataset.planId || null;
const planLabel = document.getElementById("confirm-data-plan")?.innerText || "";

tx.set(newBill,{  
  userId: dataCurrentUser.uid,  
  type: 'data',  
  networkCode: network, // e.g. "01"
  networkLabel: net?.label || "", // e.g. "MTN"
  phone,  
  planId: planId, // e.g. "m3"
  planLabel: planLabel, // e.g. "1GB - ₦500"
  amount,  
  status: 'submitted',  
  processed: false,  
  createdAt: firebase.firestore.FieldValue.serverTimestamp()  
});
      });


		
      _showScreen('data-success-screen');

// 👉 Add transaction record
try {
  if (dataCurrentUser && db) {
    await db.collection("Transaction").add({
      userId: dataCurrentUser.uid,
      type: "Data",
      amount: amount,
      status: "processing",
      timestamp: firebase.firestore.FieldValue.serverTimestamp()
    });
    console.log("[Data] Transaction added");
  }
} catch (err) {
  console.error("[Data] Failed to add transaction:", err);
}

		
    }catch(err){
      console.error(err);
      if(err.message==='INCORRECT_PIN') showDataMsg('confirm-data-error','Incorrect PIN');
      else if(err.message==='INSUFFICIENT_BAL') showDataMsg('confirm-data-error','Insufficient balance');
      else showDataMsg('confirm-data-error','Transaction failed');
    }finally{ btn.disabled=false; btn.innerHTML=orig; }
  }

  function dataReset(){
    document.getElementById("data-phone").value="";
    const pin=document.getElementById("confirm-data-pin"); if(pin) pin.value="";
    dataSelectedPlan=null; dataSelectedNetwork='';
    document.getElementById("data-plans").innerHTML='';
    _showScreen('data-screen');
  }

})();







/* ====== FIRESTORE REF ====== */


function initCheckinSection() {

function cyclesRef(uid) {
  return db.collection('checkins').doc(uid).collection('cycles');
}

/* ====== UTILITIES ====== */
// local YYYY-MM-DD string
function todayStrLocal() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}
function dayDiff(startDateStr, dateStr) {
  if (!startDateStr || !dateStr) return 0;
  const [sy, sm, sd] = startDateStr.split('-').map(Number);
  const [ty, tm, td] = dateStr.split('-').map(Number);
  const s = new Date(sy, sm - 1, sd);
  const t = new Date(ty, tm - 1, td);
  return Math.floor((t - s) / (1000 * 60 * 60 * 24));
}
function ordinal(n) {
  return ['1st','2nd','3rd','4th','5th','6th','7th'][n-1] || `${n}th`;
}

/* ====== CARD BUILDER (2059 look) ====== */
function makeCard({ status='future', day=1, isLast=false }) {
  const card = document.createElement('div');
  card.className = `flex flex-col items-center justify-center rounded-xl p-2 bg-white text-gray-800 shadow-md`;
  card.style.width = '60px';
  card.style.height = '80px';
  card.style.fontSize = '12px';

  // determine amount
  const amount = (day <= 2) ? 0 : (day === 7 ? 200 : 50);
  const amountLabel = amount > 0 ? `₦${amount}` : '₦0';

  if (status === 'checked') {
    card.style.background = '#dcfce7';
    card.style.color = '#065f46';
  } else if (status === 'missed') {
    card.style.background = '#fee2e2';
    card.style.color = '#991b1b';
  } else if (status === 'today') {
    card.style.background = '#3b82f6';
    card.style.color = 'white';
  } else {
    card.style.background = '#f1f5f9';
    card.style.color = '#475569';
  }

  const amt = document.createElement('div');
  amt.className = 'text-xs font-bold';
  amt.textContent = amountLabel;

  const circle = document.createElement('div');
  circle.style.width = '20px';
  circle.style.height = '20px';
  circle.style.borderRadius = '999px';
  circle.style.display = 'flex';
  circle.style.alignItems = 'center';
  circle.style.justifyContent = 'center';
  circle.style.margin = '4px 0';

  if (status === 'checked') {
    circle.style.background = '#10b981';
    circle.innerHTML = `<svg width="10" height="10" viewBox="0 0 24 24" fill="none">
      <path d="M20 6L9 17L4 12" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
  } else if (status === 'missed') {
    circle.style.background = '#ef4444';
    circle.innerHTML = `<svg width="10" height="10" viewBox="0 0 24 24" fill="none">
      <path d="M18 6L6 18M6 6L18 18" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
  } else if (status === 'today') {
    circle.style.background = '#facc15';
    circle.innerHTML = `<div style="width:6px;height:6px;border-radius:999px;background:white"></div>`;
  } else {
    circle.style.background = '#cbd5e1';
  }

  const dayLabel = document.createElement('div');
  dayLabel.className = 'text-xs font-medium';
  dayLabel.textContent = `Day ${day}`;

  card.appendChild(amt);
  card.appendChild(circle);
  card.appendChild(dayLabel);
  return card;
}

/* ====== RENDER CHECK-IN (single function) ====== */
function renderCheckin(cycleDocSnap) {
  const cardsDiv = document.getElementById('checkin-cards');
  const btn = document.getElementById('checkin-btn');
  if (!cardsDiv || !btn) return;

  if (!cycleDocSnap) {
    cardsDiv.innerHTML = '';
    btn.disabled = true;
    btn.textContent = 'Loading...';
    btn.classList.add('opacity-50', 'cursor-not-allowed');
    return;
  }

  const d = cycleDocSnap.data();
  const start = d && d.cycleStartDate ? d.cycleStartDate : todayStrLocal();
  const daysArr = Array.isArray(d.days) ? d.days.concat() : Array(7).fill(false);
  const status = d.status || 'processing';
  const today = todayStrLocal();
  const diff = dayDiff(start, today);

  cardsDiv.innerHTML = '';

  for (let i = 0; i < 7; i++) {
    let s = 'future';
    if (i < diff) s = (daysArr[i] === true) ? 'checked' : 'missed';
    else if (i === diff) s = (daysArr[i] === true) ? 'checked' : 'today';
    // if cycle is not processing and diff > 6, mark appropriately (already settled)
    if (diff > 6 && status !== 'processing') {
      s = (daysArr[i] === true) ? 'checked' : 'missed';
    }
    const isLast = (i === 6);
    cardsDiv.appendChild(makeCard({
      status: s,
      day: i + 1,
      amountLabel: isLast ? '₦300' : '₦50',
      isLast
    }));
  }

  // button logic: only active when within cycle (0..6), processing, and not already checked today
  const isWithinCycle = (diff >= 0 && diff <= 6 && status === 'processing');
  const alreadyCheckedToday = (diff >= 0 && diff <= 6 && daysArr[diff] === true);
  const shouldEnable = (isWithinCycle && !alreadyCheckedToday);

  btn.disabled = !shouldEnable;
  btn.classList.toggle('opacity-50', btn.disabled);
  btn.classList.toggle('cursor-not-allowed', btn.disabled);
  btn.textContent = btn.disabled ? (status === 'processing' && alreadyCheckedToday ? 'Checked' : 'Unavailable') : 'Check In';

  // Note: button handler is wired in the snapshot listener so we avoid re-binding here repeatedly
}

/* ====== HISTORY LIST RENDER (many received cycles) ====== */
function renderHistoryList(items) {
  const hist = document.getElementById('history-list');
  if (!hist) return;
  hist.innerHTML = '';
  if (!items || items.length === 0) {
    hist.innerHTML = '<p class="text-gray-400 italic">No history yet</p>';
    return;
  }
  items.forEach(item => {
    const div = document.createElement('div');
    div.className = `      p-4 rounded-2xl shadow-xl backdrop-blur-lg bg-white/6 border border-green-400/20      flex items-center justify-between animate-slide-in    `;
    div.innerHTML = `      <div>        <div style="font-weight:700;color:#bbf7d0">₦${item.rewardAmount}</div>        <div style="font-size:12px;color:#94a3b8">${item.date}</div>      </div>      <div style="font-weight:700;color:#10b981">RECEIVED</div>    `;
    hist.appendChild(div);
  });
}

/* ====== HISTORY LISTENER ====== */
function startHistoryListener(uid) {
  if (!uid) return;
  cyclesRef(uid).orderBy('cycleStartDate','desc')
    .onSnapshot(qs => {
      const items = [];
      qs.forEach(doc => {
        const d = doc.data();
        if (d.status === 'received') {
          items.push({
            rewardAmount: d.rewardAmount || 300,
            date: d.updatedAt && d.updatedAt.toDate ? d.updatedAt.toDate().toLocaleString() : (d.cycleStartDate || todayStrLocal())
          });
        }
      });
      renderHistoryList(items);
    }, err => {
      console.error('History listener error:', err);
    });
}

/* ====== ENSURE CYCLE EXISTS (used on login) ====== */
async function ensureCycleExists(uid) {
  if (!uid) return;
  // order by cycleStartDate deterministically
  const snap = await cyclesRef(uid).orderBy('cycleStartDate','desc').limit(1).get();
  if (snap.empty) {
    // create one starting today using deterministic doc id so we don't create duplicates
    const today = todayStrLocal();
    const docRef = cyclesRef(uid).doc(today);
    await docRef.set({
      cycleStartDate: today,
      days: Array(7).fill(false),
      status: 'processing',
      rewardAmount: 200,
      createdAt: firebase.firestore.FieldValue.serverTimestamp(),
      updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    }, { merge: false });
    return;
  }
  const doc = snap.docs[0];
  const d = doc.data();
  // if last cycle finished and it's been >=7 days since its start -> create new cycle for today
  const today = todayStrLocal();
  if (d.status !== 'processing' && dayDiff(d.cycleStartDate, today) >= 7) {
    const newDocRef = cyclesRef(uid).doc(today);
    // set deterministically (upsert) — multiple clients writing same doc id is safe
    await newDocRef.set({
      cycleStartDate: today,
      days: Array(7).fill(false),
      status: 'processing',
      rewardAmount: 200,
      createdAt: firebase.firestore.FieldValue.serverTimestamp(),
      updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    }, { merge: false });
  }
}

/* ====== FINALIZE CYCLE ====== */
async function finalizeCycle(uid, cycleId) {
  try {
    if (!uid || !cycleId) return;
    const ref = cyclesRef(uid).doc(cycleId);
    await db.runTransaction(async t => {
      const snap = await t.get(ref);
      if (!snap.exists) return;
      const d = snap.data();
      const success = Array.isArray(d.days) && d.days.every(x => x === true);
      if (success) {
        const userRef = db.collection('users').doc(uid);
        const userSnap = await t.get(userRef);
        const oldBal = (userSnap.exists && userSnap.data().balance) ? userSnap.data().balance : 0;
        const newBal = oldBal + (d.rewardAmount || 300);
        t.update(userRef, { balance: newBal, updatedAt: firebase.firestore.FieldValue.serverTimestamp() });
        t.update(ref, { status: 'received', updatedAt: firebase.firestore.FieldValue.serverTimestamp() });
        // UI: update balance elements immediately if they exist
        const balEl1 = document.getElementById('balance-display');
        const balEl2 = document.getElementById('balance-amount');
        if (balEl1) balEl1.textContent = `₦${newBal}`;
        if (balEl2) balEl2.textContent = `₦${newBal}`;
      } else {
        t.update(ref, { status: 'failed', updatedAt: firebase.firestore.FieldValue.serverTimestamp() });
      }
      // IMPORTANT: do NOT create next cycle here — next cycle must start at local midnight.
    });
  } catch (err) {
    console.error('finalizeCycle error', err);
  }
}

/* ====== HANDLE CHECK-IN BUTTON ====== */
async function handleCheckInPress(cycleDocSnap) {
  if (!cycleDocSnap) return;
  try {
    const uid = firebase.auth().currentUser && firebase.auth().currentUser.uid;
    if (!uid) return;
    const d = cycleDocSnap.data();
    const diff = dayDiff(d.cycleStartDate, todayStrLocal());
    if (diff < 0 || diff > 6) return;
    if (d.days && d.days[diff]) return;

    // immediate UI feedback
    const btn = document.getElementById('checkin-btn');
    if (btn) {
      btn.disabled = true;
      btn.classList.add('opacity-50', 'cursor-not-allowed');
      btn.textContent = 'Checking...';
    }

    const arr = Array.isArray(d.days) ? [...d.days] : Array(7).fill(false);
    arr[diff] = true;

    // update days atomically (simple update)
    await cyclesRef(uid).doc(cycleDocSnap.id).update({
      days: arr,
      updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    });

    // optional user alert
    try { alert('✅ Check-in Successful'); } catch (e) { /* ignore alerts failing in headless */ }

    // If last day -> finalize (award or fail)
    if (diff === 6) {
      await finalizeCycle(uid, cycleDocSnap.id);
    }
  } catch (err) {
    console.error('handleCheckInPress error', err);
    // try to re-enable button on failure so user can retry
    const btn = document.getElementById('checkin-btn');
    if (btn) {
      btn.disabled = false;
      btn.classList.remove('opacity-50', 'cursor-not-allowed');
      btn.textContent = 'Check In';
    }
  }
}

/* ====== Auto-create next cycle at local midnight (15s poll) ====== */
let _autoCycleInterval = null;
let _creatingTodayCycle = false;
async function createNextCycleIfNeeded(uid) {
  if (!uid) return;
  if (_creatingTodayCycle) return;
  try {
    const qs = await cyclesRef(uid).orderBy('cycleStartDate', 'desc').limit(1).get();
    const today = todayStrLocal();

    if (qs.empty) {
      const docRef = cyclesRef(uid).doc(today);
      await docRef.set({
        cycleStartDate: today,
        days: Array(7).fill(false),
        status: 'processing',
        rewardAmount: 200,
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
      });
      return;
    }

    const doc = qs.docs[0];
    const d = doc.data();
    const diff = dayDiff(d.cycleStartDate, today);

    // ✅ if stuck processing for 7+ days, close it and start new
    if (d.status === 'processing' && diff >= 7) {
      await cyclesRef(uid).doc(doc.id).update({
        status: 'failed',
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
      });
    }

    // ✅ if no active processing cycle and at least 7 days passed since last start — new one
    const hasProcessing = (d.status === 'processing');
    if (!hasProcessing && diff >= 7) {
      const newDocRef = cyclesRef(uid).doc(today);
      await newDocRef.set({
        cycleStartDate: today,
        days: Array(7).fill(false),
        status: 'processing',
        rewardAmount: 200,
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
      }, { merge: false });
    }
  } catch (err) {
    console.error('createNextCycleIfNeeded error', err);
  } finally {
    _creatingTodayCycle = false;
  }
}

/* ====== START ALL LISTENERS ====== */
function startCheckinListener() {
  // clear prior interval if any
  if (_autoCycleInterval) {
    clearInterval(_autoCycleInterval);
    _autoCycleInterval = null;
  }
  firebase.auth().onAuthStateChanged(async user => {
    if (!user) {
      // stop polling if logged out
      if (_autoCycleInterval) { clearInterval(_autoCycleInterval); _autoCycleInterval = null; }
      return;
    }
    const uid = user.uid;
    // ensure at least one cycle exists on login
    try { await ensureCycleExists(uid); } catch (err) { console.error('ensureCycleExists error', err); }

    // latest-cycle listener for UI + button
    cyclesRef(uid).orderBy('cycleStartDate','desc').limit(1)
      .onSnapshot(async qs => {
        if (qs.empty) return;
        const doc = qs.docs[0];
        renderCheckin(doc);

        // update balance immediately if received (sync)
        const dd = doc.data();
        if (dd.status === 'received') {
          db.collection('users').doc(uid).get().then(u => {
            const balance = u.exists && u.data().balance ? u.data().balance : 0;
            const balEl1 = document.getElementById('balance-display');
            const balEl2 = document.getElementById('balance-amount');
            if (balEl1) balEl1.textContent = `₦${balance}`;
            if (balEl2) balEl2.textContent = `₦${balance}`;
          }).catch(e => console.error('balance fetch error', e));
        }

        // wire button (pass snapshot). Use onclick assignment to avoid multiple listeners
        const btn = document.getElementById('checkin-btn');
        if (btn) {
          btn.onclick = () => handleCheckInPress(doc);
        }
      }, err => {
        console.error('latest-cycle listener error:', err);
      });

    // history listener for all past received cycles
    startHistoryListener(uid);

    // start polling to auto-create next cycle at local midnight (checks every 15s)
    _autoCycleInterval = setInterval(() => createNextCycleIfNeeded(uid), 15 * 1000);
    // also trigger a check immediately
    createNextCycleIfNeeded(uid);
  });
}

/* initialize */
  startCheckinListener();
}







/* ===== GLOBALS: robust tab-persistence wrapper =====
   Paste this at the VERY END of main.js (after every other code block).
   This will:
   - capture any existing tab functions (global and window.*),
   - wrap them to persist the active tab to localStorage,
   - restore the last tab on load by calling activateTab + switchTab.
*/
(function () {
  const STORAGE_KEY = "globals_active_tab_final_v1";

  function validTabId(id) {
    return !!(id && document.getElementById(id));
  }

  // capture any existing implementations (global function or window property)
  const orig_window_switch = (typeof window !== "undefined") ? window.switchTab : undefined;
  const orig_global_switch = (typeof switchTab === "function") ? switchTab : undefined;

  const orig_window_activate = (typeof window !== "undefined") ? window.activateTab : undefined;
  const orig_global_activate = (typeof activateTab === "function") ? activateTab : undefined;

  // helper to call a possible async original function safely
  async function callOriginal(origFn, tabId) {
    if (!origFn) return;
    try {
      const r = origFn(tabId);
      if (r && typeof r.then === "function") await r;
    } catch (err) {
      // don't break main flow if original fails
      console.error("[TAB PERSIST] original function threw:", err);
    }
  }

  // persist to localStorage + update hash
  function persist(tabId) {
    try {
      if (!validTabId(tabId)) return;
      localStorage.setItem(STORAGE_KEY, tabId);
      try { history.replaceState(null, "", `#${tabId}`); } catch (e) { /* ignore */ }
    } catch (e) {
      console.warn("[TAB PERSIST] cannot save tab:", e);
    }
  }

  // OVERRIDE global function switchTab(sectionId)
  // Keep a reference to any existing implementations to avoid recursion
  const _origGlobalSwitch = orig_global_switch || orig_window_switch || null;
  window.switchTab = async function (sectionId) {
    // if there was a global function (declaration), call that first
    await callOriginal(_origGlobalSwitch, sectionId);
    // persist the tab id
    persist(sectionId);
  };
  // also ensure the global named function (non-window) calls our wrapper
  // this ensures calls to `switchTab('x')` (without window.) hit our wrapper too.
  window.switchTab = window.switchTab; // keep assignment for safety
  try {
    // replace global function name too (if declared with function switchTab(...))
    // this creates/replaces the global function symbol to forward to our wrapper
    if (typeof window.switchTab === "function") {
      // eslint-disable-next-line no-unused-vars
      function switchTab(sectionId) { return window.switchTab(sectionId); }
    }
  } catch (e) {
    // ignore if strict mode or other env blocks
  }

  // OVERRIDE activateTab similarly
  const _origGlobalActivate = orig_global_activate || orig_window_activate || null;
  window.activateTab = async function (sectionId) {
    // call original
    await callOriginal(_origGlobalActivate, sectionId);
    // persist
    persist(sectionId);
  };
  window.activateTab = window.activateTab;
  try {
    if (typeof window.activateTab === "function") {
      // eslint-disable-next-line no-unused-vars
      function activateTab(sectionId) { return window.activateTab(sectionId); }
    }
  } catch (e) { /* ignore */ }

  // Extra safety: listen for clicks on nav buttons (class 'nav-btn' or data-tab) and persist
  document.addEventListener("click", (ev) => {
    try {
      const btn = ev.target.closest && ev.target.closest('.nav-btn, [data-tab]');
      if (!btn) return;
      const tid = btn.getAttribute('data-tab') || btn.id && btn.id.replace(/^nav-/, '') || btn.getAttribute('href') && btn.getAttribute('href').replace(/^#/, '');
      if (tid && validTabId(tid)) {
        // give the normal handlers a tick to run, then persist (avoids racing)
        setTimeout(() => persist(tid), 50);
      }
    } catch (e) { /* ignore */ }
  }, { passive: true });

  // On DOMContentLoaded (registered last so this handler runs after earlier initializers),
  // restore preference: prefer location.hash, then saved localStorage, then fallback.
  document.addEventListener("DOMContentLoaded", async () => {
    try {
      let candidate = null;
      const hash = (location.hash || "").replace(/^#/, "");
      if (validTabId(hash)) candidate = hash;

      if (!candidate) {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (validTabId(saved)) candidate = saved;
      }

      if (!candidate) {
        if (window.currentActiveTab && validTabId(window.currentActiveTab)) candidate = window.currentActiveTab;
        else if (validTabId('dashboard')) candidate = 'dashboard';
        else {
          const first = document.querySelector('.tab-section');
          if (first && first.id) candidate = first.id;
        }
      }

      if (candidate) {
        // call activateTab then switchTab to ensure UI highlight + content are consistent
        if (typeof window.activateTab === "function") await window.activateTab(candidate);
        if (typeof window.switchTab === "function") await window.switchTab(candidate);
        // small delay to let any lazy init run
        setTimeout(() => persist(candidate), 150);
      }
    } catch (err) {
      console.error("[TAB PERSIST] restore failed:", err);
    }
  }, { once: true });

  // debug helper (remove if you want silence)
  window.__globals_tab_persist = {
    storageKey: STORAGE_KEY,
    getSaved() { try { return localStorage.getItem(STORAGE_KEY); } catch (e) { return null; } },
    validTabId
  };

})();










/* ============================
   Visibility & Suspend Managers
   (Paste after firebase init and db available)
   ============================ */
const VisibilityManager = (function () {
  console.log("[VM] VisibilityManager loaded");

  // Polyfill requestIdleCallback
  const ric = window.requestIdleCallback || function (cb) { return setTimeout(() => cb({ timeRemaining: () => 0 }), 1); };
  const cancelRic = window.cancelIdleCallback || function (id) { clearTimeout(id); };

  // Internal collections
  const _suspendCallbacks = new Set(); // functions to call when suspending
  const _resumeCallbacks = new Set();  // functions to call when resuming
  const _unsubscribers = new Set();    // functions that stop listeners (usually unsub functions)
  const _resumeTimeouts = new Map();   // cycle id -> timeout id (for cleanup)

  let _isSuspended = false;
  let _loaderEl = null;
  let _resumeInProgress = false;
  const RESUME_FALLBACK_MS = 12000; // 12 seconds fallback

  // Quick loader DOM (very lightweight)
  function ensureLoader() {
    if (_loaderEl) return _loaderEl;
    const el = document.createElement("div");
    el.id = "vm-quick-loader";
    // Minimal inline style - blue spinner + translucent backdrop but NOT fully blocking
    el.style.position = "fixed";
    el.style.inset = "0";
    el.style.display = "none";
    el.style.alignItems = "center";
    el.style.justifyContent = "center";
    el.style.zIndex = 9999;
    el.style.pointerEvents = "none"; // let clicks pass through if needed
    // backdrop (subtle)
    el.innerHTML = `
      <div style="pointer-events:none; display:flex; align-items:center; justify-content:center; width:100%; height:100%;">
        <div style="backdrop-filter: blur(2px); background: rgba(255,255,255,0.35); padding:18px; border-radius:12px; box-shadow:0 6px 24px rgba(2,6,23,0.08); display:flex; gap:12px; align-items:center;">
          <svg class="vm-spinner" width="20" height="20" viewBox="0 0 50 50" style="flex:0 0 auto;">
            <circle cx="25" cy="25" r="20" stroke="#3b82f6" stroke-width="5" fill="none" stroke-linecap="round" stroke-dasharray="31.4 31.4"></circle>
          </svg>
          <div style="font-size:14px;color:#0f172a; font-weight:600;">Reconnecting...</div>
        </div>
      </div>
    `;
    // small CSS animation (inserted inline)
    const style = document.createElement("style");
    style.textContent = `
      @keyframes vm-rot { to { transform: rotate(360deg); } }
      #vm-quick-loader .vm-spinner { animation: vm-rot 1s linear infinite; transform-origin: center; }
    `;
    document.head.appendChild(style);
    document.body.appendChild(el);
    _loaderEl = el;
    return el;
  }

  function showLoader() {
    ensureLoader();
    // show quickly on next animation frame
    requestAnimationFrame(() => {
      if (_loaderEl) {
        _loaderEl.style.display = "flex";
      }
    });
  }
  function hideLoader() {
    if (_loaderEl) {
      _loaderEl.style.display = "none";
    }
  }

  // Register/unregister helpers
  function registerSuspend(fn) {
    if (typeof fn === "function") _suspendCallbacks.add(fn);
    return () => _suspendCallbacks.delete(fn);
  }
  function registerResume(fn) {
    if (typeof fn === "function") _resumeCallbacks.add(fn);
    return () => _resumeCallbacks.delete(fn);
  }
  function registerUnsubscriber(fn) {
    // Accept either a function or an unsubscribe function or a wrapper returning an unsubscribe
    if (typeof fn === "function") _unsubscribers.add(fn);
    return () => { if (typeof fn === "function") _unsubscribers.delete(fn); };
  }

  // Clear and call all unsubscribe functions
  function runUnsubscribers() {
    _unsubscribers.forEach(un => {
      try { un(); } catch (e) { console.error("[VM] unsub error", e); }
    });
    _unsubscribers.clear();
  }

  // Suspend: run suspend callbacks, clear intervals/listeners etc.
  function suspendApp(reason = "hidden") {
    if (_isSuspended) return;
    console.log("[VM] Suspending app (reason):", reason);
    _isSuspended = true;
    _resumeInProgress = false;
    // Call suspend callbacks (fast)
    _suspendCallbacks.forEach(cb => {
      try { cb(); } catch (e) { console.error("[VM] suspend cb error", e); }
    });
    // Call unsubscribers to stop firebase listeners / intervals
    runUnsubscribers();
    // keep loader hidden while suspended (we only show loader on return)
    hideLoader();
  }

  // Resume: show loader immediately, run resume callbacks (re-attach minimal listeners)
  async function resumeApp() {
    if (!_isSuspended && !_resumeInProgress) {
      // If not suspended, nothing to do
      return;
    }
    if (_resumeInProgress) {
      console.log("[VM] Resume already in progress");
      return;
    }
    console.log("[VM] Resuming app (start)");
    _resumeInProgress = true;
    showLoader();

    // A safety/fallback timeout in case resume hangs
    const fallbackId = setTimeout(() => {
      console.warn("[VM] Resume fallback timeout reached - hiding loader");
      hideLoader();
      _resumeInProgress = false;
      _isSuspended = false;
    }, RESUME_FALLBACK_MS);

    // Call resume callbacks (they should re-create listeners and return a Promise if async)
    const promises = [];
    _resumeCallbacks.forEach(cb => {
      try {
        const ret = cb();
        if (ret && typeof ret.then === "function") promises.push(ret);
      } catch (e) { console.error("[VM] resume cb error", e); }
    });

    try {
      // Wait for all resume promises or a short idle window
      if (promises.length) {
        await Promise.race([ Promise.all(promises), new Promise(res => setTimeout(res, 750)) ]);
      } else {
        // give a tiny idle frame for sync reattachment (avoid long blocking)
        await new Promise(res => ric(res));
      }
    } catch (e) {
      console.error("[VM] Error during resume wait:", e);
    } finally {
      clearTimeout(fallbackId);
      hideLoader();
      _resumeInProgress = false;
      _isSuspended = false;
      console.log("[VM] Resumed");
    }
  }

  // Visibility handlers
  function onVisibilityChange() {
    if (document.hidden) {
      suspendApp("visibility:hidden");
    } else {
      // very quick detection start
      // we schedule resume on next RAF to allow DOM to paint loader
      requestAnimationFrame(() => resumeApp());
    }
  }
  function onWindowBlur() { suspendApp("window:blur"); }
  function onWindowFocus() {
    // resume on focus too (some browsers may not fire visibilitychange consistently)
    requestAnimationFrame(() => resumeApp());
  }

  // Wrappers for typical APIs

  // wrapInterval(fn, ms) => returns { id, stop } and registers unsubscriber automatically
  function wrapInterval(fn, ms) {
    if (typeof fn !== "function") throw new Error("wrapInterval requires function");
    const id = setInterval(fn, ms);
    const stop = () => clearInterval(id);
    registerUnsubscriber(stop);
    // also register suspend callback to clear it (in case unregister wasn't called)
    registerSuspend(() => { try { clearInterval(id); } catch (e) {} });
    return { id, stop };
  }

  // wrapSnapshot: wraps firebase onSnapshot query and registers its unsubscribe automatically.
  // qFactory is a function that returns a Query (db => db.collection(...))
  // onChange receives snapshot; returns the unsubscribe function.
  function wrapSnapshot(qFactory, onChange, onError) {
    if (typeof qFactory !== "function") throw new Error("wrapSnapshot requires qFactory");
    // The resume callback must re-create the snapshot and capture unsubscribe
    let unsub = null;
    function attachOnce() {
      try {
        const q = qFactory(db); // assumes `db` available in outer scope (your app has it)
        if (!q || typeof q.onSnapshot !== "function") {
          console.warn("[VM] Invalid query returned by qFactory");
          return;
        }
        unsub = q.onSnapshot(snapshot => {
          try { onChange(snapshot); } catch (e) { console.error("[VM] snapshot onChange error", e); }
        }, err => {
          console.error("[VM] snapshot error:", err);
          if (typeof onError === "function") onError(err);
        });
        // register to unsubscriber set so that suspendApp clears it
        registerUnsubscriber(() => { try { unsub && unsub(); } catch (e) {} });
      } catch (e) {
        console.error("[VM] wrapSnapshot attach error", e);
      }
    }

    // Register resume callback: attaches snapshot and returns a promise that resolves when attached (sync)
    const resumeCB = () => {
      // If there's already an active unsub (maybe someone else created it), run it first to ensure fresh
      try { if (unsub) { try { unsub(); } catch (e){} unsub = null; } } catch (e) {}
      attachOnce();
      // no async work needed from our resume point of view; return undefined or a resolved promise.
      return Promise.resolve();
    };
    // Register suspend callback to call unsub
    registerSuspend(() => { try { unsub && unsub(); } catch (e) { console.error(e); } unsub = null; });

    registerResume(resumeCB);

    // Initially attach if not suspended
    if (!document.hidden && !window._vm_initial_attach_done) {
      attachOnce();
      window._vm_initial_attach_done = true;
    }
    return () => { try { unsub && unsub(); } catch (e){} unsub = null; };
  }

  // wrapRAF: a requestAnimationFrame loop that will be paused/resumed automatically
  function wrapRAF(loopFn) {
    if (typeof loopFn !== "function") throw new Error("wrapRAF requires function");
    let rafId = null;
    let running = false;
    function frame(time) {
      try { loopFn(time); } catch (e) { console.error("[VM] RAF loop error", e); }
      if (running) rafId = requestAnimationFrame(frame);
    }
    function start() {
      if (running) return;
      running = true;
      rafId = requestAnimationFrame(frame);
      registerUnsubscriber(stop);
    }
    function stop() {
      running = false;
      if (rafId !== null) { try { cancelAnimationFrame(rafId); } catch (e) {} rafId = null; }
    }
    // Register suspend/resume automatic handlers
    registerSuspend(() => stop());
    registerResume(() => { start(); return Promise.resolve(); });
    // Start immediately if visible
    if (!document.hidden) start();
    return { start, stop };
  }

  // Utility: schedule heavyWork via requestIdleCallback, fallback to setTimeout
  function scheduleHeavyWork(fn) {
    if (typeof fn !== "function") return;
    const id = ric(deadline => {
      try { fn(deadline); } catch (e) { console.error("[VM] heavy work error", e); }
    });
    return () => cancelRic(id);
  }

  // Public API
  function init() {
    // attach handlers only once
    if (init._done) return;
    init._done = true;
    document.addEventListener("visibilitychange", onVisibilityChange, { passive: true });
    window.addEventListener("blur", onWindowBlur, { passive: true });
    window.addEventListener("focus", onWindowFocus, { passive: true });
    console.log("[VM] Visibility listeners attached");
    // If page starts hidden, we immediately suspend
    if (document.hidden) suspendApp("initial-hidden");
  }

  function destroy() {
    document.removeEventListener("visibilitychange", onVisibilityChange);
    window.removeEventListener("blur", onWindowBlur);
    window.removeEventListener("focus", onWindowFocus);
    runUnsubscribers();
    _suspendCallbacks.clear();
    _resumeCallbacks.clear();
    hideLoader();
    console.log("[VM] destroyed");
  }

  // Expose API
  return {
    init,
    destroy,
    registerSuspend,      // registerSuspend(fn) -> called when suspending
    registerResume,       // registerResume(fn) -> called when resuming; may return Promise
    registerUnsubscriber, // registerUnsubscriber(fn) -> fn will be invoked to stop listeners
    wrapInterval,
    wrapSnapshot,
    wrapRAF,
    scheduleHeavyWork,
    showLoader,
    hideLoader,
    isSuspended: () => _isSuspended,
  };
})();

// auto-init (safe)
if (document.readyState === "complete" || document.readyState === "interactive") {
  try { VisibilityManager.init(); } catch(e) { console.error("[VM] init error", e); }
} else {
  document.addEventListener("DOMContentLoaded", () => { try { VisibilityManager.init(); } catch(e) { console.error("[VM] init error", e); } });
}

/* ============================
   USAGE EXAMPLES (convert your code to use these)
   - Replace plain setInterval with wrapInterval
   - Replace firebase onSnapshot direct attaches with wrapSnapshot
   - Replace RAF loops with wrapRAF
   - Register any heavy long-running tasks to be scheduled with scheduleHeavyWork
   ============================ */

// Example: convert an interval you had
// const { id, stop } = wrapInterval(()=>{ console.log('tick'); }, 15000);
// -> previously you used setInterval(...)

// Example for firebase snapshot:
// const stopListener = VisibilityManager.wrapSnapshot(
//   (dbLocal) => dbLocal.collection('checkins').doc(uid).collection('cycles').orderBy('cycleStartDate','desc').limit(1),
//   (snapshot) => { /* render ... */ },
//   (err) => console.error(err)
// );
// // stopListener() can be called manually too

// Example for RAF loops:
// const loop = VisibilityManager.wrapRAF((t) => { /* animation frame work */ });
// // loop.start() & loop.stop() available if you need to control manually

// Example: register a custom suspend/resume callback if you have special teardown/attach logic
// VisibilityManager.registerSuspend(()=>{ console.log('custom suspend'); });
// VisibilityManager.registerResume(()=>{ console.log('custom resume'); return Promise.resolve(); });









	
