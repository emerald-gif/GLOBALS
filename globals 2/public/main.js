console.log("main.js is working");




// Firebase config & init
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

  

  // ✅ ME SECTION: Show Profile Username & Picture
  const profileUsername = document.getElementById("profileUsername");
  const profilePicPreview = document.getElementById("profilePicPreview");
  if (profileUsername) profileUsername.textContent = `@${data.username || ""}`;
  if (profilePicPreview && data.profilePicture) profilePicPreview.src = data.profilePicture;

  // ✅ MY PROFILE FORM SECTION
  if (document.getElementById("userId")) {
    document.getElementById("userId").value = uid;
    document.getElementById("editUsername").value = data.username || "";
    document.getElementById("editEmail").value = data.email || "";
    document.getElementById("fullName").value = data.fullName || "";
    document.getElementById("phoneNumber").value = data.phone || "";
    document.getElementById("refLinkDisplay").value = `https://globals.com/signup.html?ref=${data.username}`;
    document.getElementById("joinDate").value = new Date(user.metadata.creationTime).toLocaleDateString();
  }

  


	// ✅ Upload profile picture
  const profilePicUpload = document.getElementById("profilePicUpload");
  if (profilePicUpload) {
    profilePicUpload.onchange = async (e) => {
      const file = e.target.files[0];
      if (!file) return;

      const storageRef = firebase.storage().ref(`profilePics/${uid}`);
      await storageRef.put(file);
      const url = await storageRef.getDownloadURL();

      await db.collection("users").doc(uid).update({ profilePicture: url });
      if (profilePicPreview) profilePicPreview.src = url;
      alert("Profile picture updated successfully!");
    };
  }
});



// ✅ Save Profile Button Function
window.saveProfile = async function () {
  const user = auth.currentUser;
  if (!user) return;

  const updated = {
    username: document.getElementById("editUsername").value.trim(),
    email: document.getElementById("editEmail").value.trim(),
    fullName: document.getElementById("fullName").value.trim(),
    phone: document.getElementById("phoneNumber").value.trim(),
  };

  await db.collection("users").doc(user.uid).update(updated);
  alert("Profile updated successfully!");
  location.reload();
};




     // ✅ TOP NAV FUNCTION USERNAMES
	
  firebase.auth().onAuthStateChanged(function(user) {
    const navbarUsername = document.getElementById("navbarUsername");

    if (user) {
      // Use displayName if set, otherwise fall back to email prefix
      const name = user.displayName || user.email.split("@")[0];
      navbarUsername.textContent = "@" + name;
    } else {
      navbarUsername.textContent = "@guest";
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

// -----------------------------
// Robust Transactions Listener
// -----------------------------
// Works with firebase v8 (namespaced): firebase.auth(), firebase.firestore()

let transactionsCache = [];
let txUnsubscribe = null; // hold unsubscribe for current listener
let activeCollectionName = null; // which collection we ended up using

// DOM helpers
const txListEl = document.getElementById("transactions-list");
const txEmptyEl = document.getElementById("transactions-empty");
const categoryEl = document.getElementById("category-filter");
const statusEl = document.getElementById("status-filter");

function safeLog(...args) { console.log("[TX-HISTORY]", ...args); }

/* ----------------------
   Timestamp helper
   Accepts Firestore Timestamp, Date, number (ms), or string
   ---------------------- */
function parseTimestamp(val) {
  if (!val) return null;
  // Firestore Timestamp (has toDate)
  if (typeof val === "object" && typeof val.toDate === "function") return val.toDate();
  if (val instanceof Date) return val;
  if (typeof val === "number") return new Date(val); // ms
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
  const abs = Math.abs(n).toFixed(2);
  const sign = n > 0 ? "+" : n < 0 ? "-" : "";
  return `${sign}₦${abs}`;
}

/* ----------------------
   Render single card HTML (Opay-like)
   ---------------------- */
function cardHtml(tx) {
  const tsFields = tx.timestamp || tx.createdAt || tx.time || tx.created_at || null;
  const date = parseTimestamp(tsFields);
  const amountClass = tx.status === "successful" ? "text-green-600" : tx.status === "failed" ? "text-red-600" : "text-yellow-600";
  const amountText = formatAmount(tx.amount);
  const statusText = (tx.status || "unknown").toLowerCase();

  // description fallback
  const desc = tx.description || tx.meta?.desc || "";

  return `
    <div class="flex justify-between items-center p-4 border-b">
      <div>
        <div class="text-sm font-semibold text-gray-900">${tx.type || "Unknown"}</div>
        <div class="text-xs text-gray-500 mt-1">${desc}</div>
        <div class="text-xs text-gray-400 mt-1">${formatDatePretty(date)}</div>
      </div>

      <div class="text-right">
        <div class="text-lg font-bold ${amountClass}">${amountText}</div>
        <div class="text-xs ${amountClass} mt-1 capitalize">${statusText}</div>
      </div>
    </div>
  `;
}

/* ----------------------
Render list (with empty state)
---------------------- */
function renderTransactions(transactions) {
  const list = document.getElementById("transactions-list");
  const empty = document.getElementById("transactions-empty");

  if (!transactions.length) {
    list.innerHTML = "";
    empty.classList.remove("hidden");
    return;
  }

  empty.classList.add("hidden");

  list.innerHTML = transactions.map(tx => {
    const date = tx.timestamp?.toDate
      ? tx.timestamp.toDate().toLocaleString()
      : "—";

    let statusColor =
      tx.status === "successful"
        ? "bg-green-100 text-green-700"
        : tx.status === "failed"
        ? "bg-red-100 text-red-700"
        : "bg-yellow-100 text-yellow-700";

    return `
      <div class="flex items-center justify-between px-4 py-3 hover:bg-gray-50">
        <!-- Left: Type + Time -->
        <div>
          <p class="text-sm font-medium text-gray-800">${tx.type || "Unknown"}</p>
          <p class="text-xs text-gray-500">${date}</p>
        </div>

        <!-- Right: Amount + Status -->
        <div class="text-right">
          <p class="text-sm font-semibold text-gray-900">₦${tx.amount?.toLocaleString() || "0"}</p>
          <span class="inline-block mt-1 px-2 py-0.5 text-xs rounded-full ${statusColor}">
            ${tx.status || "—"}
          </span>
        </div>
      </div>
    `;
  }).join("");
}

/* ----------------------
   Client-side sort by best timestamp available (desc)
   ---------------------- */
function sortByTimestampDesc(arr) {
  return arr.slice().sort((a, b) => {
    const ta = parseTimestamp(a.timestamp || a.createdAt || a.time || a.created_at) || new Date(0);
    const tb = parseTimestamp(b.timestamp || b.createdAt || b.time || b.created_at) || new Date(0);
    return tb - ta;
  });
}

/* ----------------------
   Apply Category/Status filters (client-side)
   ---------------------- */
function applyFiltersClient(category, status) {
  safeLog("Applying filters", { category, status });
  let filtered = transactionsCache.slice();

  if (category && category !== "All" && category !== "all") {
    filtered = filtered.filter(tx => (tx.type || "").toLowerCase() === category.toLowerCase());
  }
  if (status && status !== "All" && status !== "all") {
    filtered = filtered.filter(tx => (tx.status || "").toLowerCase() === status.toLowerCase());
  }

  // sort before render
  filtered = sortByTimestampDesc(filtered);
  renderTransactions(filtered);
}

/* ----------------------
   Stop current listener if any
   ---------------------- */
function stopTransactionsListener() {
  if (txUnsubscribe) {
    try { txUnsubscribe(); } catch (e) { /* ignore */ }
    txUnsubscribe = null;
    safeLog("Stopped previous transactions listener.");
  }
}

/* ----------------------
   Try to attach onSnapshot to one collection name. 
   Handles orderBy error by falling back to no orderBy.
   ---------------------- */
function tryListenToCollection(collName, uid) {
  return new Promise((resolve) => {
    safeLog(`Attempting listener on collection "${collName}" (with orderBy timestamp) for UID:`, uid);

    const baseRef = firebase.firestore().collection(collName).where("userId", "==", uid);

    // try with orderBy 'timestamp' first
    try {
      const q = baseRef.orderBy("timestamp", "desc");
      const unsub = q.onSnapshot(snapshot => {
        safeLog(`Snapshot from "${collName}" (with orderBy timestamp). docs:`, snapshot.size);
        transactionsCache = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
        // client sort just in case
        transactionsCache = sortByTimestampDesc(transactionsCache);
        applyFiltersClient(categoryEl?.value || "All", statusEl?.value || "All");
      }, error => {
        console.error(`[TX-HISTORY] onSnapshot error for ${collName} (with orderBy):`, error.message || error);
        // fallback: unsubscribe and try without orderBy
        try { unsub(); } catch (e) {}
        safeLog(`FALLBACK: trying "${collName}" without orderBy`);
        // try without orderBy
        const unsub2 = firebase.firestore().collection(collName).where("userId", "==", uid)
          .onSnapshot(snap2 => {
            safeLog(`Snapshot from "${collName}" (no orderBy). docs:`, snap2.size);
            transactionsCache = snap2.docs.map(d => ({ id: d.id, ...d.data() }));
            transactionsCache = sortByTimestampDesc(transactionsCache);
            applyFiltersClient(categoryEl?.value || "All", statusEl?.value || "All");
          }, err2 => {
            console.error(`[TX-HISTORY] onSnapshot fallback error for ${collName}:`, err2.message || err2);
          });

        // resolve with unsub2
        resolve(unsub2);
      });

      // if no immediate error thrown, resolve with unsub
      resolve(unsub);
    } catch (err) {
      console.error(`[TX-HISTORY] Exception trying onSnapshot with orderBy for ${collName}:`, err);
      // try straight without orderBy
      try {
        const unsub3 = firebase.firestore().collection(collName).where("userId", "==", uid)
          .onSnapshot(snap3 => {
            safeLog(`Snapshot from "${collName}" (no orderBy, exception path). docs:`, snap3.size);
            transactionsCache = snap3.docs.map(d => ({ id: d.id, ...d.data() }));
            transactionsCache = sortByTimestampDesc(transactionsCache);
            applyFiltersClient(categoryEl?.value || "All", statusEl?.value || "All");
          }, err3 => {
            console.error(`[TX-HISTORY] onSnapshot error (no orderBy) for ${collName}:`, err3.message || err3);
          });
        resolve(unsub3);
      } catch (e2) {
        console.error(`[TX-HISTORY] Failed to attach listener to ${collName}:`, e2);
        resolve(null);
      }
    }
  });
}

/* ----------------------
   Start transactions listener, tries multiple collection names
   ---------------------- */
async function startTransactionsListenerForUser(uid) {
  stopTransactionsListener();
  activeCollectionName = null;

  // try preferred names in order
  const candidates = ["Transaction", "transaction", "transactions", "Transactions"];

  for (const collName of candidates) {
    // small delay to avoid race on error handling
    try {
      const unsub = await tryListenToCollection(collName, uid);
      if (typeof unsub === "function") {
        txUnsubscribe = unsub;
        activeCollectionName = collName;
        safeLog(`✅ Listening to transactions collection: "${collName}"`);
        return;
      } else {
        safeLog(`No listener attached for "${collName}", trying next...`);
      }
    } catch (e) {
      console.error("Error trying collection", collName, e);
    }
  }

  // if we get here, none worked
  console.error("[TX-HISTORY] Could not attach transactions listener to any collection (tried multiple names).");
  if (txListEl) txListEl.innerHTML = `<p class="text-center p-6 text-red-500">Could not load transactions. Check console for errors.</p>`;
}

/* ----------------------
   Public init: call this when user is available (after auth)
   ---------------------- */
function initTransactionsForCurrentUser() {
  const user = firebase.auth().currentUser;
  if (!user) {
    safeLog("initTransactionsForCurrentUser: no user currently signed in. Waiting for auth.");
    return;
  }
  safeLog("initTransactionsForCurrentUser -> uid:", user.uid);
  startTransactionsListenerForUser(user.uid);
}

/* ----------------------
   Auth hook: start once user logs in
   ---------------------- */
firebase.auth().onAuthStateChanged(user => {
  if (user) {
    safeLog("Auth state changed: user signed in:", user.uid);
    initTransactionsForCurrentUser();
  } else {
    safeLog("Auth state changed: no user.");
    stopTransactionsListener();
    transactionsCache = [];
    renderTransactions([]); // show empty state
  }
});

/* ----------------------
   Wire filter selects to client-side filter
   ---------------------- */
if (categoryEl) {
  categoryEl.addEventListener("change", (e) => {
    applyFiltersClient(e.target.value, statusEl?.value || "All");
  });
}
if (statusEl) {
  statusEl.addEventListener("change", (e) => {
    applyFiltersClient(categoryEl?.value || "All", e.target.value);
  });
}

/* ----------------------
   Debug helpers you can run in browser console:
   - window.tx_debug_listAllUserDocs()
   - window.tx_debug_showUID()
   ---------------------- */
window.tx_debug_showUID = function() {
  const u = firebase.auth().currentUser;
  console.log("[TX-HISTORY DEBUG] currentUser:", u ? u.uid : null, u || "(no user)");
};

window.tx_debug_listAllUserDocs = async function(collName) {
  collName = collName || activeCollectionName || "Transaction";
  try {
    const snap = await firebase.firestore().collection(collName).get();
    console.log(`[TX-HISTORY DEBUG] All docs in ${collName}: count=${snap.size}`);
    snap.forEach(d => console.log(d.id, d.data()));
  } catch (err) {
    console.error(`[TX-HISTORY DEBUG] Error listing docs in ${collName}:`, err);
  }
};

safeLog("Transactions module loaded. Waiting for auth to start listener.");
	



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




document.addEventListener("DOMContentLoaded", function () {
  // Show charts only when Overview tab is active
  if (document.getElementById("overview")) {

    // 📈 Line Chart
    new Chart(document.getElementById("earningsChart"), {
      type: "line",
      data: {
        labels: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
        datasets: [{
          label: "₦ Earned",
          data: [1200, 1500, 800, 1900, 2200, 1700, 2000],
          borderColor: "#3b82f6",
          backgroundColor: "rgba(59,130,246,0.1)",
          tension: 0.3,
          fill: true
        }]
      },
      options: {
        responsive: true,
        plugins: { legend: { display: false } },
        scales: { y: { beginAtZero: true } }
      }
    });

    // 🥧 Pie Chart
    new Chart(document.getElementById("pieChart"), {
      type: "pie",
      data: {
        labels: ["Normal", "Sales", "NFT"],
        datasets: [{
          data: [8200, 5500, 2300],
          backgroundColor: ["#10b981", "#8b5cf6", "#3b82f6"]
        }]
      },
      options: { responsive: true }
    });

    // 📊 Bar Chart
    new Chart(document.getElementById("barChart"), {
      type: "bar",
      data: {
        labels: ["App Tasks", "Affiliate", "Login Streak", "Videos"],
        datasets: [{
          label: "Completed Tasks",
          data: [10, 5, 7, 4],
          backgroundColor: "#6366f1"
        }]
      },
      options: {
        responsive: true,
        plugins: { legend: { display: false } },
        scales: { y: { beginAtZero: true } }
      }
    });
  }
});







                                                            // GLOBALS CHAT ASSISTANT LOGIC




/* ---------- CONFIG ---------- */
/* IMPORTANT: For temporary local assistant we leave the API key empty.
   Do NOT store a secret OpenAI API key in client-side JS for production.
*/
const OPENAI_API_KEY = ""; // <-- leave empty for local fallback

/* ---------- GUIDE CONTENT (HTML strings) ---------- */
const GUIDES = {
  paymentHelp: `
    <h3 class="font-semibold text-lg mb-2">💵 Payment Steps</h3>
    <ol class="list-decimal ml-5 space-y-1 text-sm">
      <li>Open Dashboard → Payment → Deposit.</li>
      <li>Choose a payment method (Card, Bank transfer, USSD).</li>
      <li>Enter the amount and follow the payment provider UI.</li>
      <li>After payment, your funds should reflect in your balance. If not, upload proof or contact support with the transaction ID.</li>
    </ol>
    <p class="mt-2 text-xs text-gray-500">Tip: Double-check the account details shown on the deposit screen before sending money.</p>
  `,
  withdrawalHelp: `
    <h3 class="font-semibold text-lg mb-2">🏧 Withdrawal Steps</h3>
    <ol class="list-decimal ml-5 space-y-1 text-sm">
      <li>Open Dashboard → Withdraw.</li>
      <li>Enter withdrawal amount and choose the saved bank account.</li>
      <li>Confirm with your withdrawal PIN (set one in Settings if you haven't).</li>
      <li>Processing time: usually 1-3 business days depending on bank.</li>
    </ol>
    <p class="mt-2 text-xs text-gray-500">If a withdrawal fails, check your account details and try again or contact support.</p>
  `,
  taskHelp: `
    <h3 class="font-semibold text-lg mb-2">✅ Task Guide</h3>
    <ol class="list-decimal ml-5 space-y-1 text-sm">
      <li>Open the Tasks page and read the full instruction for each task.</li>
      <li>Complete the task exactly as described (attach proof/screenshots if required).</li>
      <li>Submit proof and wait for verification (approvals may take some hours).</li>
      <li>Approved tasks credit your balance automatically.</li>
    </ol>
    <p class="mt-2 text-xs text-gray-500">Make sure screenshots include your Globals username where required.</p>
  `,
  ebookHelp: `
    <h3 class="font-semibold text-lg mb-2">📚 Buy eBook Steps</h3>
    <ol class="list-decimal ml-5 space-y-1 text-sm">
      <li>Go to the eBook store page in the app.</li>
      <li>Select the eBook and press Buy.</li>
      <li>Complete payment through the payment modal.</li>
      <li>After payment, a download link or "My Purchases" entry will appear.</li>
    </ol>
    <p class="mt-2 text-xs text-gray-500">If the download isn't available, check "My Purchases" or contact support.</p>
  `,
  aiContent: `
    <h3 class="font-semibold text-lg mb-2">🧠 AI Content (What it can do)</h3>
    <ul class="list-disc ml-5 space-y-1 text-sm">
      <li>Write captions, summarize text, or suggest task ideas related to Globals.</li>
      <li>Answer how-to questions about Payments, Withdrawals, Tasks, Referrals and eBooks.</li>
      <li>Will NOT answer unrelated general knowledge questions in this temporary mode.</li>
    </ul>
  `,
  referralHelp: `
    <h3 class="font-semibold text-lg mb-2">👥 Referral & Team</h3>
    <ul class="list-disc ml-5 space-y-1 text-sm">
      <li>1st level commission: ₦1,700 per referred user.</li>
      <li>2nd level commission: ₦500 per referred user.</li>
      <li>Share your referral link from the Team / Referral screen.</li>
    </ul>
  `
};



function showElement(id) { const el = document.getElementById(id); if (el) el.classList.remove('hidden'); }
function hideElement(id) { const el = document.getElementById(id); if (el) el.classList.add('hidden'); }

/* ---------- Chat UI functions ---------- */
function appendUserBubble(msg) {
  const chat = document.getElementById("chatMessages");
  const safe = escapeHtml(msg).replace(/\n/g, '<br/>');
  chat.insertAdjacentHTML('beforeend',
    `<div class="flex justify-end">
       <div class="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-3 rounded-2xl max-w-xs text-sm shadow-md">${safe}</div>
     </div>`);
  chat.scrollTop = chat.scrollHeight;
}

function appendAssistantBubble(html) {
  const chat = document.getElementById("chatMessages");
  // html is expected to be safe or a sanitized string (we sanitize AI replies before passing)
  chat.insertAdjacentHTML('beforeend',
    `<div class="flex justify-start">
       <div class="bg-white border p-3 rounded-2xl max-w-xs text-sm shadow-md">${html}</div>
     </div>`);
  chat.scrollTop = chat.scrollHeight;
}

function showTypingIndicator() {
  const chat = document.getElementById("chatMessages");
  const typingId = "typing-indicator";
  if (document.getElementById(typingId)) return; // prevent duplicates
  chat.insertAdjacentHTML('beforeend',
    `<div id="${typingId}" class="flex justify-start">
       <div class="bg-white border px-4 py-2 rounded-2xl max-w-xs text-sm shadow-md flex gap-1">
         <span class="dot w-2 h-2 bg-gray-500 rounded-full animate-bounce"></span>
         <span class="dot w-2 h-2 bg-gray-500 rounded-full animate-bounce delay-150"></span>
         <span class="dot w-2 h-2 bg-gray-500 rounded-full animate-bounce delay-300"></span>
       </div>
     </div>`);
  chat.scrollTop = chat.scrollHeight;
}

function hideTypingIndicator() {
  const el = document.getElementById("typing-indicator");
  if (el) el.remove();
}

/* ---------- Tab activation (keeps your nav hiding logic) ---------- */
function activateTab(tabId) {
  document.querySelectorAll('.tab-section').forEach(t => t.classList.add('hidden'));
  const currentTab = document.getElementById(tabId);
  if (currentTab) currentTab.classList.remove('hidden');

  const topNavbar = document.getElementById("topNavbar");
  const bottomNav = document.getElementById("bottomNav");
  const backArrowBar = document.getElementById("backArrowBar");

  const hideAllNav = (tabId === "aiHelpCenter");
  if (topNavbar) topNavbar.style.display = hideAllNav ? "none" : "flex";
  if (bottomNav) bottomNav.style.display = hideAllNav ? "none" : "flex";
  if (backArrowBar) backArrowBar.classList.toggle("hidden", !hideAllNav);
}

/* ---------- Open a topic (chat or static guides) ---------- */
function openAiTopic(topic) {
  hideElement("guideContainer");
  hideElement("chatContainer");
  const chatMessages = document.getElementById("chatMessages");
  if (chatMessages) chatMessages.innerHTML = "";

  if (topic === "chat") {
    showElement("chatContainer");
    const defaultHTML = `
      <div>
        <div class="font-medium mb-2">Hi — I'm the Globals assistant. I can help with Payments, Withdrawals, Tasks, eBooks and Referrals.</div>
        <div class="text-sm mb-2">Try typing a question, or tap one of these quick topics:</div>
        <div class="flex gap-2 flex-wrap">
          <button class="px-3 py-1 rounded-lg border text-sm" onclick="suggestionClick('paymentHelp')">Payment Steps</button>
          <button class="px-3 py-1 rounded-lg border text-sm" onclick="suggestionClick('withdrawalHelp')">Withdrawal Steps</button>
          <button class="px-3 py-1 rounded-lg border text-sm" onclick="suggestionClick('taskHelp')">Task Guide</button>
          <button class="px-3 py-1 rounded-lg border text-sm" onclick="suggestionClick('ebookHelp')">Buy eBook</button>
        </div>
      </div>`;
    appendAssistantBubble(defaultHTML);
    document.getElementById("userMessage")?.focus();
    return;
  }

  const html = GUIDES[topic] || "<div class='text-sm'>No guide available.</div>";
  const container = document.getElementById("guideContainer");
  if (container) {
    container.innerHTML = `<div class="bg-white p-4 rounded-lg shadow">${html}</div>`;
    showElement("guideContainer");
  }
}

/* ---------- Suggestion click ---------- */
function suggestionClick(topic) {
  appendUserBubble(topicLabel(topic));
  const html = GUIDES[topic] || "<div class='text-sm'>No guide available.</div>";
  appendAssistantBubble(html);
}

function topicLabel(topic) {
  switch (topic) {
    case 'paymentHelp': return "Payment Steps";
    case 'withdrawalHelp': return "Withdrawal Steps";
    case 'taskHelp': return "Task Guide";
    case 'ebookHelp': return "Buy eBook Steps";
    case 'aiContent': return "AI Content";
    default: return topic;
  }
}

/* ---------- Send message ---------- */
async function sendMessage() {
  const input = document.getElementById("userMessage");
  const msg = input ? input.value.trim() : '';
  if (!msg) return;
  if (input) input.value = "";

  appendUserBubble(msg);
  showTypingIndicator();

  const delay = Math.floor(Math.random() * (5000 - 3000 + 1)) + 3000;

  setTimeout(async () => {
    hideTypingIndicator();

    if (!OPENAI_API_KEY) {
      const replyHtml = localAssistantResponse(msg);
      appendAssistantBubble(replyHtml);
      return;
    }

    try {
      const systemPrompt = "You are the Globals support assistant. Only answer platform-related questions: Payments, Withdrawals, Tasks, eBooks, Referrals. If the user's question is unrelated, ask them if they meant one of those topics.";

      const res = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${OPENAI_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: msg }
          ],
          max_tokens: 400
        }),
      });

      const data = await res.json();
      const reply = data?.choices?.[0]?.message?.content || "I couldn't understand that.";
      // sanitize AI reply before inserting into DOM
      appendAssistantBubble( escapeHtml(reply).replace(/\n/g, '<br/>') );
    } catch (err) {
      appendAssistantBubble(`<div class="text-red-500">❌ Error contacting AI. Showing local help instead.</div>`);
      appendAssistantBubble(localAssistantResponse(msg));
    }

  }, delay);
}

/* ---------- Local assistant (fallback rules) ---------- */
function localAssistantResponse(userText) {
  const t = (userText || '').toLowerCase();
  const payKeywords = ["pay", "payment", "deposit", "card", "transfer", "ussd"];
  const withKeywords = ["withdraw", "withdrawal", "cash out", "payout", "bank"];
  const taskKeywords = ["task", "tasks", "earn", "complete", "job", "install"];
  const ebookKeywords = ["ebook", "book", "buy ebook", "download ebook"];
  const referralKeywords = ["referral", "refer", "referal", "team", "commission"];

  if (payKeywords.some(k => t.includes(k))) return GUIDES.paymentHelp;
  if (withKeywords.some(k => t.includes(k))) return GUIDES.withdrawalHelp;
  if (taskKeywords.some(k => t.includes(k))) return GUIDES.taskHelp;
  if (ebookKeywords.some(k => t.includes(k))) return GUIDES.ebookHelp;
  if (referralKeywords.some(k => t.includes(k))) return GUIDES.referralHelp;

  const suggestHtml = `
    <div class="text-sm">
      I couldn't find an exact match for that. Did you mean one of these?
      <div class="mt-2 flex gap-2 flex-wrap">
        <button class="px-3 py-1 rounded-lg border text-sm" onclick="suggestionClick('paymentHelp')">Payment Steps</button>
        <button class="px-3 py-1 rounded-lg border text-sm" onclick="suggestionClick('withdrawalHelp')">Withdrawal Steps</button>
        <button class="px-3 py-1 rounded-lg border text-sm" onclick="suggestionClick('taskHelp')">Task Guide</button>
        <button class="px-3 py-1 rounded-lg border text-sm" onclick="suggestionClick('ebookHelp')">Buy eBook Steps</button>
      </div>
    </div>`;
  return suggestHtml;
}

/* ---------- extra UX: Enter to send ---------- */
document.addEventListener('DOMContentLoaded', () => {
  const input = document.getElementById("userMessage");
  if (input) {
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        sendMessage();
      }
    });
  }
});








                                              // 🔄 Load and display selected language on page load(LANGUAGE SECTION)

document.addEventListener("DOMContentLoaded", () => {
  const storedLang = localStorage.getItem("preferredLanguage") || "English";
  document.getElementById("currentLanguage").textContent = storedLang;
});

// 🌐 Select Language
window.selectLanguage = function(language) {
  localStorage.setItem("preferredLanguage", language);
  document.getElementById("currentLanguage").textContent = language;
  alert(`Language changed to ${language}.`);
};










                                                                    //MYSTERY BOX FUCTION


function startMysteryBoxPlay() {
  // You can add payment or balance check here later
  alert("Payment logic will go here. Proceeding to pick a box.");
}

function openBox(boxNumber) {
  const rewards = [0, 200, 300, 500];
  const reward = rewards[Math.floor(Math.random() * rewards.length)];
  document.getElementById("rewardAmount").textContent = `₦${reward}`;
  document.getElementById("boxResultPopup").classList.remove("hidden");
}

function closeBoxPopup() {
  document.getElementById("boxResultPopup").classList.add("hidden");
}







                      
                                   // IDs of sections that require PREMIUM FUNCTION 

// IDs of sections that require premium
const premiumRequiredSections = [
  "whatsapp-task",
  "tiktok-task",
  "affiliate-tasks",
  "task-nft",
  "myJobsSection",
  "taskSection"
];

// Get current logged-in user from Firebase Auth
firebase.auth().onAuthStateChanged((user) => {
  if (!user) return; // no logged-in user
  const currentUserId = user.uid;
  const userRef = firebase.firestore().collection("users").doc(currentUserId);

  const goPremiumBtn = document.querySelector(".go-premium-btn");

  // 🔹 Check user status on load
  userRef.onSnapshot((doc) => {
    if (!doc.exists) return;
    const userData = doc.data();

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
  });

  // 🔹 Handle Go Premium button click
  if (goPremiumBtn) {
    goPremiumBtn.addEventListener("click", async () => {
      try {
        const userSnap = await userRef.get();

        if (!userSnap.exists) {  
          await alert("User not found!");  
          return;  
        }  

        const userData = userSnap.data();  
        const balance = userData.balance || 0;  
        const isPremium = userData.is_Premium || false;  

        // Already premium  
        if (isPremium) {  
          await alert("✅ You are already Premium!");  
          return;  
        }  

        // Not enough balance  
        if (balance < 1000) {  
          await alert("⚠️ Insufficient balance.\nYou need ₦1,000 to upgrade.");  
          return;  
        }  

        // Deduct 1000 and upgrade user  
        await userRef.update({  
          is_Premium: true,  
          balance: balance - 1000,  
        });  

        await alert("🎉 Congratulations! Your account has been upgraded to Premium 🚀");  

      } catch (error) {  
        console.error("Error upgrading to Premium:", error);  
        await alert("Something went wrong. Please try again.");  
      }  
    });
  }

  // 🔹 Premium Wrapper: intercept activateTab, switchTab, showTask
  const _activateTab = window.activateTab;
  const _switchTab = window.switchTab;
  const _showTask = window.showTask;

  async function isPremiumAllowed(sectionId) {
    const snap = await userRef.get();
    if (!snap.exists) return false;
    const userData = snap.data();
    return userData.is_Premium || !premiumRequiredSections.includes(sectionId);
  }

  // Wrap activateTab
  if (_activateTab) {
    window.activateTab = async function (sectionId) {
      if (await isPremiumAllowed(sectionId)) {
        _activateTab(sectionId);
      } else {
        await alert("🔒 This feature is for Premium users only.\n\n👉 Upgrade to access!");
        _activateTab("premium-section"); // ✅ stays as you had
      }
    };
  }

  // Wrap switchTab
  if (_switchTab) {
    window.switchTab = async function (sectionId) {
      if (await isPremiumAllowed(sectionId)) {
        _switchTab(sectionId);
      } else {
        await alert("🔒 This feature is for Premium users only.\n\n👉 Upgrade to access!");
        _activateTab("premium-section"); // ✅ stays as you had
      }
    };
  }

  // Wrap showTask
  if (_showTask) {
    window.showTask = async function (sectionId) {
      if (await isPremiumAllowed(sectionId)) {
        _showTask(sectionId);
      } else {
        await alert("🔒 This feature is for Premium users only.\n\n👉 Upgrade to access!");
        _activateTab("premium-section"); // ✅ stays as you had
      }
    };
  }
});
	
	
	
	
	
	
	//INSTALL AND EARN FUNCTION 




// ---------- Helpers ----------
const escapeHtml = s => String(s || '')
  .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
  .replace(/"/g,'&quot;').replace(/'/g,'&#39;');

function generateProofUploadFields(count) {
  let html = '';
  for (let i = 1; i <= count; i++) {
    html += `
      <div class="mb-4">
        <label class="block text-sm font-medium text-gray-700 mb-1">Upload Proof ${i}</label>
        <input id="proof-file-${i}" type="file" accept="image/*" class="w-full p-2 border border-gray-300 rounded-lg text-sm" />
      </div>
    `;
  }
  return html;
}

function waitForAuthReady(timeout = 4000) {
  return new Promise(resolve => {
    if (typeof firebase === "undefined" || !firebase.auth) return resolve(null);
    let done = false;
    const t = setTimeout(() => {
      if (done) return;
      done = true;
      resolve(firebase.auth().currentUser || null);
    }, timeout);

    const unsub = firebase.auth().onAuthStateChanged(user => {
      if (done) return;
      done = true;
      clearTimeout(t);
      try { unsub(); } catch (e) {}
      resolve(user || null);
    });
  });
}

// ---------- Modal / Submit logic ----------
async function showTaskDetails(jobId, jobData) {
  if (!jobId || !jobData) {
    console.error("showTaskDetails missing jobId or jobData", { jobId, jobData });
    alert("Internal error: missing job data. Refresh and try again.");
    return;
  }

  const fullScreen = document.createElement("div");
  fullScreen.className = "fixed inset-0 bg-white z-50 overflow-y-auto p-6";

  const proofCount = jobData.proofFileCount || 1;
  const safeTitle = escapeHtml(jobData.title);
  const safeCategory = escapeHtml(jobData.category || '');
  const safeSub = escapeHtml(jobData.subCategory || '');
  const safeDesc = escapeHtml(jobData.description || 'No description provided');
  const safeProofText = escapeHtml(jobData.proof || 'Provide the necessary screenshot or details.');

  // Initial UI (we’ll replace proof area later if already submitted)
  fullScreen.innerHTML = `
    <div class="max-w-2xl mx-auto space-y-6">
      <button id="closeTaskBtn" class="text-blue-600 font-bold text-sm underline">← Back to Tasks</button>

      <h1 class="text-2xl font-bold text-gray-800">${safeTitle}</h1>
      <p class="text-sm text-gray-500">${safeCategory} • ${safeSub}</p>

      <img src="${jobData.screenshotURL || 'https://via.placeholder.com/400'}"
        alt="Task Preview"
        class="w-full h-64 object-cover rounded-xl border"
      />

      <div>
        <h2 class="text-lg font-semibold text-gray-800 mb-2">Task Description</h2>
        <p class="text-gray-700 text-sm whitespace-pre-line">${safeDesc}</p>
      </div>

      <div>
        <h2 class="text-lg font-semibold text-gray-800 mb-2">Proof Required</h2>
        <p class="text-sm text-gray-700">${safeProofText}</p>
      </div>

      <div id="proofSection" class="mt-6">
        <h2 class="text-lg font-bold text-gray-800 mb-4">Proof</h2>
        <div id="proofFields">${generateProofUploadFields(proofCount)}</div>
        <input id="proofTextInput" type="text" placeholder="Enter email/username used (if needed)"
          class="w-full p-2 border border-gray-300 rounded-lg text-sm mt-2"
        />

        <div class="flex items-center gap-3 mt-4">
          <button id="submitTaskBtn" class="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm">
            Submit Task
          </button>
          <div id="submitStatus" class="text-sm text-gray-600"></div>
        </div>
      </div>
    </div>
  `;

  document.body.appendChild(fullScreen);

  // close
  fullScreen.querySelector("#closeTaskBtn").addEventListener("click", () => fullScreen.remove());

  // ✅ Check if already submitted by this user
  const user = await waitForAuthReady();
  if (user) {
    const snap = await firebase.firestore()
      .collection("task_submissions")
      .where("taskId", "==", jobId)
      .where("userId", "==", user.uid)
      .limit(1)
      .get();

    if (!snap.empty) {
      const sub = snap.docs[0].data();

      // Replace proofSection with submitted proof
      const proofSection = fullScreen.querySelector("#proofSection");
      proofSection.innerHTML = `
        <h2 class="text-lg font-bold text-gray-800 mb-4">Your Submission</h2>
        <p class="text-sm text-gray-700 mb-2"><strong>Submitted Text:</strong> ${escapeHtml(sub.proofText || "—")}</p>
        <div class="grid grid-cols-2 gap-2">
          ${(sub.proofImages || []).map(url => `
            <img src="${url}" class="w-full h-32 object-cover rounded-lg border" />
          `).join("")}
        </div>
        <p class="mt-3 text-green-600 font-semibold">✅ Submitted</p>
      `;
    } else {
      // attach submit handler only if not submitted yet
      attachSubmitHandler(fullScreen, jobId, jobData);
    }
  } else {
    attachSubmitHandler(fullScreen, jobId, jobData); // allow guest to try, will block later
  }
}


// 🔗 Extracted submit handler
function attachSubmitHandler(fullScreen, jobId, jobData) {
  const submitBtn = fullScreen.querySelector("#submitTaskBtn");
  const status = fullScreen.querySelector("#submitStatus");

  submitBtn.addEventListener("click", async () => {
    submitBtn.disabled = true;
    status.textContent = "Checking auth...";

    try {
      const user = await waitForAuthReady();
      if (!user) {
        alert("Please log in to submit task.");
        submitBtn.disabled = false;
        status.textContent = "";
        return;
      }

      // collect text + files
      const proofText = fullScreen.querySelector("#proofTextInput")?.value.trim() || "";
      const fileInputs = fullScreen.querySelectorAll('input[type="file"]');
      const uploadedFiles = [];

      for (let i = 0; i < fileInputs.length; i++) {
        const fEl = fileInputs[i];
        const file = fEl.files[0];
        if (file) {
          status.textContent = `Uploading ${i + 1}/${fileInputs.length}...`;
          const url = await uploadToCloudinary(file);
          uploadedFiles.push(url);
          status.textContent = `Uploaded ${uploadedFiles.length}/${fileInputs.length}`;
        }
      }

      if (uploadedFiles.length === 0) {
        alert("❗ Please upload at least one proof image.");
        submitBtn.disabled = false;
        status.textContent = "";
        return;
      }

      status.textContent = "Saving submission...";

      const submissionData = {
        taskId: jobId,
        userId: user.uid,
        proofText,
        proofImages: uploadedFiles,
        submittedAt: firebase.firestore.FieldValue.serverTimestamp(),
        status: "on review",
        workerEarn: jobData.workerEarn || 0
      };

      await firebase.firestore().collection("task_submissions").add(submissionData);

      alert("✅ Task submitted for review!");
      fullScreen.remove();
    } catch (err) {
      console.error("Submit error:", err);
      alert("❗ Failed to submit task: " + (err?.message || err));
      submitBtn.disabled = false;
      status.textContent = "";
    }
  });
}


		  
// ---------- Card rendering + live feed ----------
function createTaskCard(jobId, jobData) {
  const taskContainer = document.getElementById("task-jobs");
  if (!taskContainer) {
    console.error("No #task-jobs element found — createTaskCard aborted");
    return;
  }

  const card = document.createElement("div");
  card.className = `
    flex gap-4 p-4 rounded-2xl shadow-md border border-gray-200 bg-white
    hover:shadow-lg transition duration-300 mb-4 items-center
  `;

  const image = document.createElement("img");
  image.src = jobData.screenshotURL || "https://via.placeholder.com/80";
  image.alt = "Task Preview";
  image.className = "w-20 h-20 rounded-xl object-cover";

  const content = document.createElement("div");
  content.className = "flex-1";

  const title = document.createElement("h2");
  title.textContent = jobData.title || "Untitled Task";
  title.className = "text-lg font-semibold text-gray-800";

  const meta = document.createElement("p");
  meta.className = "text-sm text-gray-500 mt-1";
  meta.textContent = `${jobData.category || ""} • ${jobData.subCategory || ""}`;

  const earn = document.createElement("p");
  earn.textContent = `Earn: ₦${jobData.workerEarn || 0}`;
  earn.className = "text-sm text-green-600 font-semibold mt-1";

  const rate = document.createElement("p");
  rate.className = "text-xs text-gray-500";
  rate.textContent = `Progress: loading...`;

  const total = jobData.numWorkers || 0;

  firebase.firestore()
    .collection("task_submissions")
    .where("taskId", "==", jobId)
    .where("status", "==", "approved")
    .get()
    .then(querySnapshot => {
      const done = querySnapshot.size;
      rate.textContent = `Progress: ${done} / ${total}`;
    })
    .catch(err => {
      console.error("Failed to read progress for", jobId, err);
      rate.textContent = `Progress: 0 / ${total}`;
    });

  const button = document.createElement("button");
  button.textContent = "View Task";
  button.className = `
    mt-3 bg-blue-600 hover:bg-blue-700 text-white text-xs px-4 py-2
    rounded-lg shadow-sm transition
  `;
  button.addEventListener("click", () => showTaskDetails(jobId, jobData));

  content.appendChild(title);
  content.appendChild(meta);
  content.appendChild(earn);
  content.appendChild(rate);
  content.appendChild(button);

  card.appendChild(image);
  card.appendChild(content);

  taskContainer.appendChild(card);
}

// ---------- Live tasks listener ----------
firebase.firestore().collection("tasks")
  .where("status", "==", "approved")
  .onSnapshot(snapshot => {
    const taskContainer = document.getElementById("task-jobs");
    const searchInput = document.getElementById("taskSearch");
    const filterSelect = document.getElementById("taskCategoryFilter");

    if (!taskContainer) {
      console.error("No #task-jobs element found — snapshot handler aborted");
      return;
    }

    let tasks = [];
    snapshot.forEach(doc => {
      const jobData = doc.data();
      tasks.push({ id: doc.id, ...jobData });
    });

    function renderTasks() {
      const keyword = (searchInput && searchInput.value) ? searchInput.value.toLowerCase() : "";
      const selectedCategory = (filterSelect && filterSelect.value) ? filterSelect.value : "";

      taskContainer.innerHTML = "";

      tasks
        .filter(task => {
          const matchesCategory = selectedCategory === "" || (task.category === selectedCategory);
          const matchesSearch = (task.title || "").toLowerCase().includes(keyword);
          return matchesCategory && matchesSearch;
        })
        .forEach(task => createTaskCard(task.id, task));
    }

    if (searchInput) searchInput.addEventListener("input", renderTasks);
    if (filterSelect) filterSelect.addEventListener("change", renderTasks);

    renderTasks();
  }, err => {
    console.error("Failed to listen to tasks collection:", err);
  });









// ================= Finished Task Submissions Logic =================

// Open finished tasks screen
document.getElementById("finishedTaskBtnUser").addEventListener("click", () => {
  document.getElementById("taskSection").classList.add("hidden");
  document.getElementById("finishedTasksScreenUser").classList.remove("hidden");
  loadFinishedTaskSubmissionsUser();
});

// Back button
document.getElementById("backToMainBtnUser").addEventListener("click", () => {
  document.getElementById("finishedTasksScreenUser").classList.add("hidden");
  document.getElementById("taskSection").classList.remove("hidden");
});

// Load finished task submissions
async function loadFinishedTaskSubmissionsUser() {
  const listEl = document.getElementById("finishedTasksListUser");
  const pendingCountEl = document.getElementById("pendingCountUser");
  const approvedCountEl = document.getElementById("approvedCountUser");

  const userId = firebase.auth().currentUser?.uid;
  if (!userId) return;

  try {
    const snapshot = await firebase.firestore()
      .collection("task_submissions")
      .where("userId", "==", userId)
      .get();

    let docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    // Sort by submittedAt descending
    docs.sort((a, b) => {
      const t1 = a.submittedAt?.toDate?.() || new Date(0);
      const t2 = b.submittedAt?.toDate?.() || new Date(0);
      return t2 - t1;
    });

    listEl.innerHTML = "";
    let pending = 0, approved = 0;

    if (!docs.length) {
      listEl.innerHTML = `<p class="text-center text-gray-500">No finished tasks yet.</p>`;
    }

    for (const data of docs) {
      if (data.status === "on review") pending++;
      if (data.status === "approved") approved++;

      // ✅ use taskId (not jobId)
      let jobTitle = "Untitled Task";
      if (data.taskId) {
        const jobDoc = await firebase.firestore()
          .collection("tasks")
          .doc(data.taskId)
          .get();
        if (jobDoc.exists) {
          jobTitle = jobDoc.data().title || "Untitled Task";
        }
      }

      const card = document.createElement("div");
      card.className = "p-4 bg-white shadow rounded-xl flex items-center justify-between";

      card.innerHTML = `
        <div>
          <h3 class="font-semibold text-gray-900">${jobTitle}</h3>
          <p class="text-sm text-gray-600">Earn: ₦${data.workerEarn || 0}</p>
          <p class="text-xs text-gray-400">${data.submittedAt?.toDate().toLocaleString() || ""}</p>
          <span class="inline-block mt-1 px-2 py-0.5 text-xs rounded ${
            data.status === "approved"
              ? "bg-green-100 text-green-700"
              : "bg-yellow-100 text-yellow-700"
          }">${data.status}</span>
        </div>
        <button
          class="px-3 py-1 text-sm font-medium bg-blue-600 text-white rounded-lg details-btn-user"
          data-id="${data.id}"
        >
          Details
        </button>
      `;
      listEl.appendChild(card);
    }

    // Update counters
    pendingCountEl.textContent = pending;
    approvedCountEl.textContent = approved;

    // Attach details button events
    listEl.querySelectorAll(".details-btn-user").forEach(btn => {
      btn.addEventListener("click", () => {
        showTaskSubmissionDetailsUser(btn.dataset.id);
      });
    });

  } catch (err) {
    console.error("Error loading finished tasks:", err);
    listEl.innerHTML = `<p class="text-center text-red-500">Error loading tasks. Try again later.</p>`;
  }
}

// Show task submission details
async function showTaskSubmissionDetailsUser(submissionId) {
  try {
    const subDoc = await firebase.firestore()
      .collection("task_submissions")
      .doc(submissionId)
      .get();

    if (!subDoc.exists) return;
    const data = subDoc.data();

    // ✅ use taskId (not jobId)
    let jobData = {};
    if (data.taskId) {
      const jobDoc = await firebase.firestore()
        .collection("tasks")
        .doc(data.taskId)
        .get();
      if (jobDoc.exists) jobData = jobDoc.data();
    }

    const jobTitle = jobData.title || "Untitled Task";
    const proofImage = data.proofImage || data.extraProofImage || null;

    const modal = document.createElement("div");
    modal.className = "fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50";
    modal.innerHTML = `
      <div class="bg-white rounded-xl shadow-lg p-6 w-96 max-h-[90vh] overflow-y-auto">
        <h2 class="text-lg font-bold mb-3">Submission Details</h2>
        
        <p class="text-sm"><strong>Job Title:</strong> ${jobTitle}</p>
        <p class="text-sm"><strong>Status:</strong> ${data.status}</p>
        <p class="text-sm"><strong>Earned:</strong> ₦${data.workerEarn || 0}</p>
        <p class="text-sm"><strong>Submitted At:</strong> ${data.submittedAt?.toDate().toLocaleString() || "—"}</p>
        <p class="text-sm"><strong>Extra Proof:</strong> ${data.extraProof || "—"}</p>

        ${proofImage ? `
          <div class="mt-3">
            <p class="text-sm font-medium text-gray-700 mb-1">Uploaded Proof:</p>
            <img src="${proofImage}" alt="Proof" class="rounded-lg border w-full">
          </div>
        ` : ""}

        <div class="mt-4 flex justify-end">
          <button class="closeModalUser px-4 py-2 bg-blue-600 text-white rounded-lg">Close</button>
        </div>
      </div>
    `;

    document.body.appendChild(modal);
    modal.querySelector(".closeModalUser").addEventListener("click", () => modal.remove());

  } catch (err) {
    console.error("Error showing task submission details:", err);
  }
}




	
                                    //AFFILIATE 





// AFFILIATE - single-file script (fixed + live submission counts + Cloudinary + search)
(function () {
  // run after DOM ready so elements exist
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', main);
  } else {
    main();
  }

  function main() {
    // ensure firebase is available
    if (typeof firebase === 'undefined' || !firebase.firestore) {
      console.warn('Firebase not found - affiliate script aborted.');
      return;
    }
    const db = firebase.firestore();

    // ---------------- Cloudinary config (use your values) ----------------
    // You said earlier you have these values; leaving defaults you gave me.
    const CLOUD_NAME = "dyquovrg3";           // replace if needed
    const UPLOAD_PRESET = "globals_tasks_proofs"; // replace if needed

    // Universal upload function (returns secure_url)
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
        if (cloudData.secure_url) return cloudData.secure_url;
        throw new Error(cloudData.error?.message || "Cloudinary upload failed");
      } catch (err) {
        console.error("Cloudinary upload error:", err);
        throw err;
      }
    }

    // ---- small util ----
    function escapeHtml(s = "") {
      return String(s)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");
    }

    // ---- inject modal + collapsible styles once ----
    function ensureDetailStyles() {
      if (document.getElementById("affiliate-detail-styles")) return;
      const style = document.createElement("style");
      style.id = "affiliate-detail-styles";
      style.textContent = `
/* Modal / overlay styles */
.aff-overlay { position:fixed; inset:0; z-index:9999; display:flex; align-items:flex-start; justify-content:center; overflow:auto; padding:24px; background:rgba(2,6,23,.56); backdrop-filter: blur(6px); }
.aff-sheet { width:min(720px, 100%); background:#fff; border-radius:20px; overflow:hidden; box-shadow:0 30px 80px rgba(2,6,23,.25); position:relative; }
.aff-head { background: linear-gradient(135deg, #facc15 0%, #3b82f6 100%); padding:18px 20px; color:#fff; }
.aff-close { position:absolute; right:14px; top:14px; background:rgba(255,255,255,.12); border:1px solid rgba(255,255,255,.16); width:36px; height:36px; border-radius:10px; display:grid; place-items:center; color:#fff; cursor:pointer; }
.aff-close:hover { background:rgba(255,255,255,.18); }

/* Collapsible instructions */
.collapsible { overflow:hidden; transition:max-height .32s ease; line-height:1.6; position:relative; }
.collapsible.is-collapsed { max-height: 6.5em; } /* ≈ 4 lines */
.collapsible .fade-edge { content:""; position:absolute; left:0; right:0; bottom:0; height:2.2em; background: linear-gradient(to bottom, rgba(255,255,255,0), #ffffff 70%); pointer-events:none; transition:opacity .2s; }
.collapsible:not(.is-collapsed) .fade-edge { opacity:0; }

/* small helper for progress bar inside card (if used) */
.job-progress-bar { width:100%; height:8px; border-radius:999px; background:#eef2ff; overflow:hidden; margin-top:8px; }
.job-progress-bar > i { display:block; height:100%; border-radius:999px; background: linear-gradient(90deg,#facc15,#3b82f6); width:0%; transition:width .4s ease; }
`;
      document.head.appendChild(style);
    }

    // helper to create or return detail overlay
    function ensureDetailScreen() {
      let el = document.getElementById("affiliate-detail-screen");
      if (!el) {
        el = document.createElement("div");
        el.id = "affiliate-detail-screen";
        el.style.display = "none";
        el.className = "aff-overlay";
        const anchor = document.getElementById("affiliate-tasks");
        if (anchor && anchor.parentNode) anchor.parentNode.insertBefore(el, anchor.nextSibling);
        else document.body.appendChild(el);
      }
      return el;
    }

    // --- main DOM refs & cache ---
    const affiliateTasksContainer = document.getElementById("affiliate-tasks");
    const jobCache = new Map(); // id -> jobData

    // submissionCountsUnsub will hold the single global submissions listener unsubscribe
    let submissionCountsUnsub = null;

    // render a single job card (keeps your job-card style classes)
    function renderAffiliateCard({ id, job, approvedCount = 0 }) {
      const total = job.numWorkers || 0;
      const percent = total ? Math.min(100, Math.round((approvedCount / total) * 100)) : 0;

      const card = document.createElement('div');
      card.className = 'job-card';
      // allow quick search text (optional) - keep it small and useful
      const dataSearch = [
        job.title, job.category, String(job.workerPay), String(job.numWorkers)
      ].filter(Boolean).join(' | ');

      card.setAttribute('data-search', dataSearch.toLowerCase());

      card.innerHTML = `
        <img class="job-image" src="${escapeHtml(job.campaignLogoURL || job.screenshotURL || 'https://via.placeholder.com/400x200')}" alt="${escapeHtml(job.title || 'Job image')}">
        <div class="job-body">
          <h3 class="job-title">${escapeHtml(job.title || 'Untitled')}</h3>
          <div class="job-price">₦${escapeHtml(String(job.workerPay || 0))}</div>
          <div class="job-progress">${escapeHtml(String(approvedCount || 0))}/${escapeHtml(String(total))} workers • ${percent}%</div>
          <div class="job-progress-bar"><i style="width:${percent}%;"></i></div>
          <button class="view-btn" data-id="${escapeHtml(id)}">View Task</button>
        </div>
      `;
      return card;
    }

    // ---------- SEARCH ----------
    function initTaskSearch() {
      const searchInput = document.getElementById("taskSearchInput");
      const taskGrid = document.getElementById("affiliate-tasks");
      if (!searchInput || !taskGrid) return;

      // show/hide no-results helper
      function showEmpty(show) {
        let empty = document.getElementById("taskSearchEmpty");
        if (show) {
          if (!empty) {
            empty = document.createElement("div");
            empty.id = "taskSearchEmpty";
            empty.className = "text-sm text-slate-500 py-6 text-center";
            empty.textContent = "No tasks match your search.";
            taskGrid.parentElement.appendChild(empty);
          }
          empty.style.display = "";
        } else if (empty) {
          empty.style.display = "none";
        }
      }

      searchInput.addEventListener("input", () => {
        const q = searchInput.value.trim().toLowerCase();
        const cards = taskGrid.querySelectorAll(".job-card");
        if (!q) {
          cards.forEach(c => c.style.display = "");
          showEmpty(false);
          return;
        }
        let any = false;
        cards.forEach(card => {
          const preset = card.getAttribute("data-search") || "";
          const fallback = (card.textContent || "").toLowerCase();
          const text = preset.length ? preset : fallback;
          const match = text.includes(q);
          card.style.display = match ? "" : "none";
          if (match) any = true;
        });
        showEmpty(!any);
      });
    }

    // ---------- LISTENERS & RENDERING ----------
    // start Firestore listener for affiliateJobs (grid) — single submissions listener approach (robust)
    function startAffiliateJobsListener() {
      if (!affiliateTasksContainer) {
        console.warn("#affiliate-tasks container not found. Affiliate tasks will not render.");
        return;
      }
      ensureDetailStyles();

      db.collection("affiliateJobs")
        .where("status", "==", "approved")
        .onSnapshot(async (snap) => {
          // prepare job list
          const jobs = snap.docs.map(d => ({ id: d.id, ...d.data() }));

          // clear grid & cache then render cards (counts will update immediately when submissions snapshot arrives)
          affiliateTasksContainer.innerHTML = '';
          jobCache.clear();
          jobs.forEach(j => {
            jobCache.set(j.id, j);
            affiliateTasksContainer.appendChild(renderAffiliateCard({ id: j.id, job: j, approvedCount: 0 }));
          });

          // unsubscribe previous global submissions listener if any
          try { if (submissionCountsUnsub) submissionCountsUnsub(); } catch (e) { /* ignore */ }
          submissionCountsUnsub = null;

          // attach one realtime listener to approved submissions
          submissionCountsUnsub = db.collection("affiliate_submissions")
            .where("status", "==", "approved")
            .onSnapshot(subSnap => {
              // build counts map
              const counts = Object.create(null);
              subSnap.forEach(doc => {
                const d = doc.data();
                if (!d || !d.jobId) return;
                counts[d.jobId] = (counts[d.jobId] || 0) + 1;
              });

              // update each rendered job card
              jobs.forEach(job => {
                const approvedCount = counts[job.id] || 0;
                const total = job.numWorkers || 0;
                const percent = total ? Math.min(100, Math.round((approvedCount / total) * 100)) : 0;

                // find the card via view button dataset
                const btn = affiliateTasksContainer.querySelector(`.view-btn[data-id="${job.id}"]`);
                const jobCardEl = btn ? btn.closest('.job-card') : null;
                if (jobCardEl) {
                  const progText = jobCardEl.querySelector(".job-progress");
                  const progBar = jobCardEl.querySelector(".job-progress-bar > i");
                  if (progText) progText.textContent = `${approvedCount}/${total} workers • ${percent}%`;
                  if (progBar) progBar.style.width = percent + "%";
                }

                // update cache
                const cached = jobCache.get(job.id) || {};
                cached.approvedCount = approvedCount;
                jobCache.set(job.id, cached);
              });
            }, err => {
              console.error("affiliate_submissions listener error:", err);
            });

        }, err => {
          console.error("affiliateJobs listener error:", err);
        });
    }

    // delegate clicks on the grid to open modal
    function attachGridClickHandler() {
      if (!affiliateTasksContainer) return;
      affiliateTasksContainer.addEventListener('click', (e) => {
        const btn = e.target.closest('.view-btn');
        if (!btn) return;
        const id = btn.dataset.id;
        const job = jobCache.get(id);
        if (job) showAffiliateJobDetails(id, job);
      });
    }

    // show job details in modal overlay (only when view clicked)
    async function showAffiliateJobDetails(jobId, jobData) {
      ensureDetailStyles();
      const detailsSection = ensureDetailScreen();

      // hide grid and show modal
      if (affiliateTasksContainer) affiliateTasksContainer.style.display = 'none';
      detailsSection.style.display = 'flex';

      // try to detect existing submission by current user
      const currentUser = firebase.auth().currentUser;
      let existingSubmission = null;
      const proofFileCount = jobData.proofFileCount || 1;

      if (currentUser) {
        try {
          const subSnap = await db.collection('affiliate_submissions')
            .where('jobId', '==', jobId)
            .where('userId', '==', currentUser.uid)
            .limit(1)
            .get();
          if (!subSnap.empty) {
            existingSubmission = { id: subSnap.docs[0].id, ...subSnap.docs[0].data() };
          }
        } catch (err) {
          console.warn('Error checking existing submission', err);
        }
      }

      function safeHtmlText(s) {
        return escapeHtml(s || '').replace(/\n/g, '<br>');
      }

      const targetLinkHtml = jobData.targetLink
        ? `<a href="${escapeHtml(jobData.targetLink)}" target="_blank" rel="noopener noreferrer" class="text-blue-600 break-words">${escapeHtml(jobData.targetLink)}</a>`
        : `<span class="text-gray-500">No link provided</span>`;

      const proofHtml = safeHtmlText(jobData.proofRequired || 'Proof details not provided');
      const instructionsHtml = safeHtmlText(jobData.instructions || 'No instructions provided');

      // Build modal, with a single #proofContainer we can replace after submit
      detailsSection.innerHTML = `
        <div class="aff-sheet">
          <button class="aff-close" title="Back">←</button>
          <div class="aff-head">
            <div style="display:flex;align-items:center;gap:12px">
              <div style="width:48px;height:48px;border-radius:12px;overflow:hidden;background:#fff44c">
                <img src="${escapeHtml(jobData.campaignLogoURL || jobData.screenshotURL || 'https://via.placeholder.com/96')}" class="w-full h-full" style="width:100%;height:100%;object-fit:cover" alt="">
              </div>
              <div>
                <div style="font-weight:700;font-size:1rem">${escapeHtml(jobData.title || 'Affiliate Job')}</div>
                <div style="font-size:12px;opacity:.95">${escapeHtml(jobData.category || 'Affiliate Campaign')}</div>
              </div>
            </div>
          </div>

          <div style="padding:18px;display:block;gap:16px">
            <!-- Worker Pay & Total Workers -->
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:12px">
              <div style="padding:12px;border-radius:12px;border:1px solid #f1f5f9">
                <div style="font-size:11px;color:#64748b">Worker Pay</div>
                <div style="font-weight:800;font-size:20px">₦${escapeHtml(String(jobData.workerPay || 0))}</div>
              </div>
              <div style="padding:12px;border-radius:12px;border:1px solid #f1f5f9">
                <div style="font-size:11px;color:#64748b">Total Workers</div>
                <div style="font-weight:800;font-size:20px">${escapeHtml(String(jobData.numWorkers || 0))}</div>
              </div>

              <!-- modal progress (spans full width) -->
              <div style="grid-column:1 / -1; margin-top:8px">
                <div id="modalProgressText" style="font-size:13px;color:#64748b;margin-bottom:6px">0/0 workers • 0%</div>
                <div class="job-progress-bar" id="modalProgressBar"><i style="width:0%"></i></div>
              </div>
            </div>

            <!-- Instructions -->
            <div style="padding:12px;border-radius:12px;border:1px solid #f1f5f9;margin-bottom:12px">
              <div style="display:flex;justify-content:space-between;align-items:center">
                <div style="font-weight:600">Instructions</div>
                <button id="toggleInstr" style="background:none;border:0;color:#1e40af;font-weight:600;cursor:pointer">
                  <span>Show more</span>
                  <svg style="width:14px;height:14px;transform:rotate(0deg);transition:transform .2s" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>
                  </svg>
                </button>
              </div>
              <div id="instructionsPanel" class="collapsible is-collapsed" style="margin-top:10px;color:#334155">
                ${instructionsHtml}
                <div class="fade-edge"></div>
              </div>
            </div>

            <!-- Target Link -->
            <div style="padding:12px;border-radius:12px;border:1px solid #f1f5f9;margin-bottom:12px">
              <div style="font-weight:600;margin-bottom:6px">Target Link</div>
              ${targetLinkHtml}
            </div>

            <!-- Proof Required -->
            <div style="padding:12px;border-radius:12px;border:1px solid #f1f5f9;margin-bottom:12px">
              <div style="font-weight:600;margin-bottom:6px">Proof Required</div>
              <div style="color:#374151">${proofHtml}</div>
            </div>

            <!-- PROOF CONTAINER (will show form OR submitted info) -->
            <div id="proofContainer">
              ${ existingSubmission ? (
                `
                <div id="submissionProofSection" style="padding:12px;border-radius:12px;border:1px solid #bbf7d0;background:#ecfdf5;margin-bottom:16px;">
                  <div style="font-weight:700;margin-bottom:10px;color:#065f46">Your Submission</div>
                  ${ (existingSubmission.files && existingSubmission.files.length > 0) ? (`<div style="display:grid;grid-template-columns:repeat(2,1fr);gap:8px">` + existingSubmission.files.map(u=>`<img src="${escapeHtml(u)}" style="width:100%;height:80px;object-fit:cover;border-radius:8px;border:1px solid #e6fffa;" />`).join('') + `</div>`) : `<p class="text-sm text-gray-500">No proof images uploaded.</p>` }
                  <p style="margin-top:8px;font-size:13px"><strong>Extra Proof:</strong> ${escapeHtml(existingSubmission.extraProof || existingSubmission.proofText || '—')}</p>
                  <p style="margin-top:8px;color:#065f46;font-weight:700">✅ Submitted</p>
                </div>
                `
              ) : (
                `
                <div style="padding:12px;border-radius:12px;border:1px solid #dbeafe;background:#f8fafc;margin-bottom:16px">
                  <div style="font-weight:700;margin-bottom:10px;color:#1e3a8a">Submit Proof</div>
                  <form id="proofForm" style="display:flex;flex-direction:column;gap:10px">
                    ${Array.from({ length: proofFileCount }).map((_, i) => `
                      <div>
                        <label style="font-size:13px;font-weight:600;display:block;margin-bottom:4px">Upload File ${i+1}</label>
                        <input type="file" name="proofFile${i+1}" accept="image/*" style="border:1px solid #cbd5e1;border-radius:8px;padding:6px;width:100%">
                      </div>
                    `).join('')}
                    <div>
                      <label style="font-size:13px;font-weight:600;display:block;margin-bottom:4px">Extra Proof (e.g email/phone)</label>
                      <textarea name="extraProof" rows="3" placeholder="Enter additional proof..." style="border:1px solid #cbd5e1;border-radius:8px;padding:8px;width:100%"></textarea>
                    </div>
                    <button id="submitTaskBtn" class="btn-primary" style="width:100%;padding:10px;border-radius:10px;font-weight:600">Submit Task</button>
                  </form>
                  <div id="submitStatus" style="margin-top:8px;color:#334155;font-size:13px"></div>
                </div>
                `
              ) }
            </div>

          </div>
        </div>
      `;

      // populate modal progress from cache (if available)
      (function updateModalProgress() {
        const cached = jobCache.get(jobId) || {};
        const approvedCount = cached.approvedCount || 0;
        const total = jobData.numWorkers || 0;
        const percent = total ? Math.min(100, Math.round((approvedCount / total) * 100)) : 0;
        const txt = detailsSection.querySelector('#modalProgressText');
        const bar = detailsSection.querySelector('#modalProgressBar > i');
        if (txt) txt.textContent = `${approvedCount}/${total} workers • ${percent}%`;
        if (bar) bar.style.width = percent + '%';
      })();

      // back/close logic
      const backBtn = detailsSection.querySelector('.aff-close');
      if (backBtn) {
        backBtn.addEventListener('click', () => {
          detailsSection.style.display = 'none';
          detailsSection.innerHTML = '';
          if (affiliateTasksContainer) {
            affiliateTasksContainer.style.display = '';
            try { affiliateTasksContainer.scrollIntoView({ behavior: 'smooth', block: 'start' }); } catch (e) {}
          }
        });
      }

      // collapsible toggle
      const panel = detailsSection.querySelector('#instructionsPanel');
      const toggle = detailsSection.querySelector('#toggleInstr');
      if (toggle && panel) {
        const label = toggle.querySelector('span');
        const icon = toggle.querySelector('svg');
        toggle.addEventListener('click', () => {
          const collapsed = panel.classList.contains('is-collapsed');
          if (collapsed) {
            panel.style.maxHeight = panel.scrollHeight + 'px';
            panel.classList.remove('is-collapsed');
            if (label) label.textContent = 'Show less';
            if (icon) icon.style.transform = 'rotate(180deg)';
            setTimeout(() => { panel.style.maxHeight = ''; }, 320);
          } else {
            panel.style.maxHeight = panel.scrollHeight + 'px';
            requestAnimationFrame(() => {
              panel.classList.add('is-collapsed');
              requestAnimationFrame(() => { panel.style.maxHeight = ''; });
            });
            if (label) label.textContent = 'Show more';
            if (icon) icon.style.transform = 'rotate(0deg)';
          }
        });
      }

      // If the proof form exists (user hasn't submitted) attach handler
      const proofContainer = detailsSection.querySelector('#proofContainer');
      if (proofContainer && !existingSubmission) {
        const form = proofContainer.querySelector('#proofForm');
        const submitStatus = proofContainer.querySelector('#submitStatus');
        const submitBtn = proofContainer.querySelector('#submitTaskBtn');

        if (form) {
          form.addEventListener('submit', async (e) => {
            e.preventDefault();
            const user = firebase.auth().currentUser;
            if (!user) return alert("You must be logged in.");

            // disable and show submitting
            submitBtn.disabled = true;
            const prevText = submitBtn.textContent;
            submitBtn.textContent = 'Submitting...';
            submitStatus.textContent = 'Uploading files...';

            const proofData = {
              jobId,
              userId: user.uid,
              submittedAt: firebase.firestore.FieldValue.serverTimestamp(),
              extraProof: form.extraProof.value || "",
              files: [],
              status: "on review",
              workerEarn: jobData.workerPay || 0
            };

            // upload files to Cloudinary
            try {
              for (let i = 0; i < proofFileCount; i++) {
                const fileInput = form[`proofFile${i+1}`];
                if (fileInput && fileInput.files.length > 0) {
                  const url = await uploadToCloudinary(fileInput.files[0]);
                  proofData.files.push(url);
                }
              }
            } catch (err) {
              console.error("Cloudinary upload failed", err);
              alert("File upload failed. Please try again.");
              submitBtn.disabled = false;
              submitBtn.textContent = prevText;
              submitStatus.textContent = '';
              return;
            }

            // check duplicate submission again
            try {
              const existing = await db.collection('affiliate_submissions')
                .where('jobId', '==', jobId)
                .where('userId', '==', user.uid)
                .limit(1)
                .get();

              if (!existing.empty) {
                alert('You have already submitted this task.');
                // replace form with the existing submission data
                const doc = existing.docs[0];
                const d = doc.data();
                proofContainer.innerHTML = `\n                  <div id="submissionProofSection" style="padding:12px;border-radius:12px;border:1px solid #bbf7d0;background:#ecfdf5;margin-bottom:16px;">\n                    <div style="font-weight:700;margin-bottom:10px;color:#065f46">Your Submission</div>\n                    ${ (d.files && d.files.length > 0) ? (`<div style="display:grid;grid-template-columns:repeat(2,1fr);gap:8px">` + d.files.map(u=>`<img src="${escapeHtml(u)}" style="width:100%;height:80px;object-fit:cover;border-radius:8px;border:1px solid #e6fffa;" />`).join('') + `</div>`) : `<p class="text-sm text-gray-500">No proof images uploaded.</p>` }\n                    <p style="margin-top:8px;font-size:13px"><strong>Extra Proof:</strong> ${escapeHtml(d.extraProof || d.proofText || '—')}</p>\n                    <p style="margin-top:8px;color:#065f46;font-weight:700">✅ Submitted</p>\n                  </div>\n                `;
                return;
              }
            } catch (err) {
              console.warn('Duplicate check failed', err);
            }

            // save submission
            try {
              await db.collection('affiliate_submissions').add(proofData);
            } catch (err) {
              console.error('Saving submission failed', err);
              alert('Failed to save submission. Try again.');
              submitBtn.disabled = false;
              submitBtn.textContent = prevText;
              submitStatus.textContent = '';
              return;
            }

            // success — replace UI with submitted view
            proofContainer.innerHTML = `
              <div id="submissionProofSection" style="padding:12px;border-radius:12px;border:1px solid #bbf7d0;background:#ecfdf5;margin-bottom:16px;">
                <div style="font-weight:700;margin-bottom:10px;color:#065f46">Your Submission</div>
                ${ proofData.files && proofData.files.length > 0 ? (`<div style="display:grid;grid-template-columns:repeat(2,1fr);gap:8px">` + proofData.files.map(u=>`<img src="${escapeHtml(u)}" style="width:100%;height:80px;object-fit:cover;border-radius:8px;border:1px solid #e6fffa;" />`).join('') + `</div>`) : `<p class="text-sm text-gray-500">No proof images uploaded.</p>` }
                <p style="margin-top:8px;font-size:13px"><strong>Extra Proof:</strong> ${escapeHtml(proofData.extraProof || '—')}</p>
                <p style="margin-top:8px;color:#065f46;font-weight:700">✅ Submitted</p>
              </div>
            `;

            submitStatus.textContent = '✅ You have submitted your proof. Awaiting review.';
          });
        }
      }
    }



	  

    // --- ADMIN SWIPER (kept guarded) ---
    function initAdminSwiper() {
      if (typeof Swiper === 'undefined') return; // not loaded
      try {
        const swiper = new Swiper('.myAffiliateTasksSwiper', {
          slidesPerView: 'auto',
          centeredSlides: true,
          centeredSlidesBounds: true,
          spaceBetween: 18,
          loop: true,
          autoplay: { delay: 4000, disableOnInteraction: false },
          pagination: { el: '.swiper-pagination', clickable: true },
        });

        const container = document.getElementById('affiliateTasksSwiperContainer');
        if (!container) return;

        // Firestore listener to render slides
        db.collection("adminJobs").orderBy("postedAt", "desc").limit(5)
          .onSnapshot(snapshot => {
            container.innerHTML = '';
            snapshot.forEach(doc => {
              const job = doc.data();
              const slide = document.createElement('div');
              slide.className = 'swiper-slide';

              slide.innerHTML = `
                <div class="job-card" style="max-width:420px;">
                  <img class="job-image"
                       src="${escapeHtml(job.screenshotURL || job.campaignLogoURL || 'https://via.placeholder.com/800x400')}"
                       alt="${escapeHtml(job.title || '')}">
                  <div class="job-info">
                    <div class="job-leading">
                      <img class="job-brand"
                           src="${escapeHtml(job.campaignLogoURL || job.screenshotURL || 'https://via.placeholder.com/72')}"
                           alt="${escapeHtml(job.title || '')}">
                      <div class="job-text">
                        <div class="title">${escapeHtml(job.title || '')}</div>
                        <div class="meta">₦${escapeHtml(String(job.workerPay || 0))} • ${escapeHtml(String(job.numWorkers || 0))} workers</div>
                      </div>
                    </div>
                    <button class="view-btn" data-id="${escapeHtml(doc.id)}">View</button>
                  </div>
                </div>
              `;
              container.appendChild(slide);
            });
            try { swiper.update(); } catch (e) { /* ignore */ }
          }, err => console.error('adminJobs listener error', err));

        // Robust delegated listener (attached once) — catches clicks on cloned slides too
        if (!initAdminSwiper._delegatedClickAttached) {
          document.addEventListener('click', function (e) {
            const btn = e.target.closest('.view-btn');
            if (!btn) return;
            const id = btn.dataset.id;
            if (!id) return;
            // fetch job doc and open modal
            db.collection("adminJobs").doc(id).get().then(d => {
              if (!d.exists) return;
              const job = d.data();
              try { showAffiliateJobDetails(id, job); }
              catch (err) { console.error('showAffiliateJobDetails failed', err); }
            }).catch(err => console.error(err));
          }, { passive: true });

          initAdminSwiper._delegatedClickAttached = true;
        }

      } catch (err) {
        console.warn('Swiper init failed:', err);
      }
    }

    // ---- start everything ----
    startAffiliateJobsListener();
    attachGridClickHandler();
    initAdminSwiper();
    initTaskSearch();
  } // end main
})(); // end IIFE




 // AFFILIATE SERCH JOB FUNCTION 


function initTaskSearch() {
  const searchInput = document.getElementById("taskSearchInput");
  const taskGrid = document.getElementById("affiliate-tasks");
  if (!searchInput || !taskGrid) return;

  // Helper: build searchable text for a card
  const getSearchText = (card) => {
    // Prefer developer-provided data-search if you add it later
    const preset = card.getAttribute("data-search");
    if (preset) return preset;

    const bits = [
      card.querySelector(".job-title")?.textContent,
      card.querySelector(".job-price")?.textContent,
      card.querySelector(".job-progress")?.textContent,
      card.querySelector(".title")?.textContent, // fallback if you ever used .title
      card.querySelector(".meta")?.textContent   // fallback if you ever used .meta
    ].filter(Boolean).join(" ");

    const text = (bits || card.textContent || "").toLowerCase();
    return text;
  };

  // Optional: small “no results” helper
  const showEmpty = (show) => {
    let empty = document.getElementById("taskSearchEmpty");
    if (show) {
      if (!empty) {
        empty = document.createElement("div");
        empty.id = "taskSearchEmpty";
        empty.className = "text-sm text-slate-500 py-6 text-center";
        empty.textContent = "No tasks match your search.";
        // place right under the grid
        taskGrid.parentElement.appendChild(empty);
      }
      empty.style.display = "";
    } else if (empty) {
      empty.style.display = "none";
    }
  };

  // Filter as you type
  searchInput.addEventListener("input", () => {
    const q = searchInput.value.trim().toLowerCase();
    const cards = taskGrid.querySelectorAll(".job-card");
    if (!q) {
      cards.forEach(c => c.style.display = "");
      showEmpty(false);
      return;
    }

    let any = false;
    cards.forEach(card => {
      const match = getSearchText(card).includes(q);
      card.style.display = match ? "" : "none";
      if (match) any = true;
    });
    showEmpty(!any);
  });
}





// ================= Finished Tasks Logic =================
// ================= Finished Tasks Logic =================

// Open finished tasks screen
document.getElementById("finishedTasksBtn").addEventListener("click", () => {
  document.getElementById("mainAffiliateScreen").style.display = "none";
  document.getElementById("finishedTasksScreen").style.display = "block";
  loadFinishedTasks();
});

// Back button
document.getElementById("backToMainBtn").addEventListener("click", () => {
  document.getElementById("finishedTasksScreen").style.display = "none";
  document.getElementById("mainAffiliateScreen").style.display = "block";
});

// Load finished tasks from Firestore
async function loadFinishedTasks() {
  const listEl = document.getElementById("finishedTasksList");
  const pendingCountEl = document.getElementById("pendingCount");
  const approvedCountEl = document.getElementById("approvedCount");

  const userId = firebase.auth().currentUser?.uid;
  if (!userId) return;

  try {
    const snapshot = await firebase.firestore()
      .collection("affiliate_submissions")
      .where("userId", "==", userId)
      .get();

    let docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));  

    // sort client-side by submittedAt desc  
    docs.sort((a, b) => {  
      const t1 = a.submittedAt?.toDate?.() || new Date(0);  
      const t2 = b.submittedAt?.toDate?.() || new Date(0);  
      return t2 - t1;  
    });  

    listEl.innerHTML = "";  
    let pending = 0, approved = 0;  

    if (!docs.length) {  
      listEl.innerHTML = `<p class="text-center text-gray-500">No finished tasks yet.</p>`;  
    }  

    for (const data of docs) {  
      if (data.status === "on review") pending++;  
      if (data.status === "approved") approved++;  

      // ✅ Detect job type using jobType field
      let jobTitle = "Untitled Task";
      if (data.jobId) {
        try {
          // Try affiliateJobs first
          let jobDoc = await firebase.firestore()
            .collection("affiliateJobs")
            .doc(data.jobId)
            .get();

          if (jobDoc.exists) {
            jobTitle = jobDoc.data().title || jobTitle;
          } else {
            // If not in affiliateJobs, check adminJobs
            let adminDoc = await firebase.firestore()
              .collection("adminJobs")
              .doc(data.jobId)
              .get();

            if (adminDoc.exists && adminDoc.data().jobType === "admin") {
              jobTitle = adminDoc.data().title || jobTitle;
            }
          }
        } catch (err) {
          console.warn("Error fetching job for", data.jobId, err);
        }
      }

      const card = document.createElement("div");  
      card.className = "p-4 bg-white shadow rounded-xl flex items-center justify-between";  

      card.innerHTML = `  
        <div>  
          <h3 class="font-semibold text-gray-900">${jobTitle}</h3>  
          <p class="text-sm text-gray-600">Earn: ₦${data.workerEarn || 0}</p>  
          <p class="text-xs text-gray-400">${data.submittedAt?.toDate().toLocaleString() || ""}</p>  
          <span class="inline-block mt-1 px-2 py-0.5 text-xs rounded ${  
            data.status === "approved"  
              ? "bg-green-100 text-green-700"  
              : "bg-yellow-100 text-yellow-700"  
          }">${data.status}</span>  
        </div>  
        <button  
          class="px-3 py-1 text-sm font-medium bg-blue-600 text-white rounded-lg details-btn"  
          data-id="${data.id}"  
        >  
          Details  
        </button>  
      `;  
      listEl.appendChild(card);  
    }  

    // Update counts  
    pendingCountEl.textContent = pending;  
    approvedCountEl.textContent = approved;  

    // Attach details button events  
    listEl.querySelectorAll(".details-btn").forEach(btn => {  
      btn.addEventListener("click", () => {  
        showSubmissionDetails(btn.dataset.id);  
      });  
    });

  } catch (err) {
    console.error("Error loading finished tasks:", err);
    listEl.innerHTML = `<p class="text-center text-red-500">Error loading tasks. Try again later.</p>`;
  }
}

// Show submission details (fetch from affiliateJobs or adminJobs)
async function showSubmissionDetails(submissionId) {
  try {
    const subDoc = await firebase.firestore()
      .collection("affiliate_submissions")
      .doc(submissionId)
      .get();

    if (!subDoc.exists) return;  
    const data = subDoc.data();  

    // ✅ Fetch job title from correct collection
    let jobData = {};
    if (data.jobId) {  
      // Check affiliateJobs first
      let jobDoc = await firebase.firestore()
        .collection("affiliateJobs")
        .doc(data.jobId)
        .get();

      if (jobDoc.exists) {
        jobData = jobDoc.data();
      } else {
        // Then check adminJobs
        let adminDoc = await firebase.firestore()
          .collection("adminJobs")
          .doc(data.jobId)
          .get();

        if (adminDoc.exists && adminDoc.data().jobType === "admin") {
          jobData = adminDoc.data();
        }
      }
    }  

    const jobTitle = jobData.title || "Untitled Task";  
    const proofImage = data.proofImage || data.extraProofImage || null;  

    const modal = document.createElement("div");  
    modal.className = "fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50";  
    modal.innerHTML = `  
      <div class="bg-white rounded-xl shadow-lg p-6 w-96 max-h-[90vh] overflow-y-auto">  
        <h2 class="text-lg font-bold mb-3">Submission Details</h2>  
          
        <p class="text-sm"><strong>Job Title:</strong> ${jobTitle}</p>  
        <p class="text-sm"><strong>Status:</strong> ${data.status}</p>  
        <p class="text-sm"><strong>Earned:</strong> ₦${data.workerEarn || 0}</p>  
        <p class="text-sm"><strong>Submitted At:</strong> ${data.submittedAt?.toDate().toLocaleString() || "—"}</p>  
        <p class="text-sm"><strong>Extra Proof:</strong> ${data.extraProof || "—"}</p>  

        ${proofImage ? `  
          <div class="mt-3">  
            <p class="text-sm font-medium text-gray-700 mb-1">Uploaded Proof:</p>  
            <img src="${proofImage}" alt="Proof" class="rounded-lg border w-full">  
          </div>  
        ` : ""}  

        <div class="mt-4 flex justify-end">  
          <button class="closeModal px-4 py-2 bg-blue-600 text-white rounded-lg">Close</button>  
        </div>  
      </div>  
    `;  

    document.body.appendChild(modal);  
    modal.querySelector(".closeModal").addEventListener("click", () => modal.remove());

  } catch (err) {
    console.error("Error showing submission details:", err);
  }
}


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












                                                 // GLOBALS TAP FUNCTION
												 
												 

let coinCount = 0;
let coinValue = 0.01;

function handleTap() {
  const coinImg = document.getElementById('tap-coin');
  coinImg.classList.add('shake');

  setTimeout(() => {
    coinImg.classList.remove('shake');
  }, 400);

  coinCount++;
  document.getElementById('coin-count').innerText = coinCount;
  document.getElementById('naira-value').innerText = (coinCount * coinValue).toFixed(2);
}

function toggleExchange() {
  const exchangeBox = document.getElementById('exchange-options');
  exchangeBox.classList.toggle('hidden');
}
function openExchangeModal() {
  document.getElementById('exchangeModal').classList.remove('hidden');
}

function closeExchangeModal() {
  document.getElementById('exchangeModal').classList.add('hidden');
}

function exchangeCoins(amount) {
  if (coinCount >= amount) {
    coinCount -= amount;
    const nairaGained = (amount / 20).toFixed(2); // Example conversion
    alert(`✅ You’ve exchanged ${amount} coins for ₦${nairaGained}!`);
    document.getElementById('coin-count').innerText = coinCount;
    document.getElementById('naira-value').innerText = (coinCount * coinValue).toFixed(2);
    closeExchangeModal();
  } else {
    alert("❌ Not enough coins to exchange!");
  }
}

function showTapSection(tab) {
  const sections = ['tasks', 'skill', 'boost', 'ranking'];
  sections.forEach(id => {
    document.getElementById(`tap-section-${id}`).classList.add('hidden');
  });
  document.getElementById(`tap-section-${tab}`).classList.remove('hidden');
}











                                                              // LOGOUT
															  
const logoutBtn = document.getElementById('logoutBtn');
if (logoutBtn) {
  logoutBtn.addEventListener('click', async () => {
    await auth.signOut();
    window.location.href = "login.html";
  });
}





                                                       
														 



                                                              // EARNING Swiper Function




   

/* ====== Safe Balance Listener (no imports, no side effects) ====== */
(function (w, d) {
  // If already running (e.g., script included twice), stop the old one cleanly.
  if (w.__balanceCtrl && typeof w.__balanceCtrl.stop === "function") {
    w.__balanceCtrl.stop();
  }

  function fmtNaira(n) {
    var v = Number(n) || 0;
    return "₦" + v.toLocaleString();
  }

  function coerceNumber(val) {
    if (val == null) return 0;
    if (typeof val === "number") return isFinite(val) ? val : 0;
    // strip commas/spaces/naira symbol if string
    var s = String(val).replace(/[₦,\s]/g, "");
    var n = Number(s);
    return isFinite(n) ? n : 0;
  }

  function isVisible(el) {
    if (!el || !d.contains(el)) return false;
    // visible if it has a box on screen
    return el.getClientRects().length > 0 && !(d.hidden);
  }

  function animateNumber(el, from, to, duration) {
    // If hidden or duration tiny, just set directly (prevents layout churn)
    if (!isVisible(el) || duration <= 0) {
      el.textContent = fmtNaira(to);
      return;
    }
    // Cancel any previous animation on this element
    if (el.__rafId) cancelAnimationFrame(el.__rafId);

    var start = performance.now();
    var diff = to - from;
    var D = Math.max(200, duration || 800);

    function step(t) {
      var p = Math.min((t - start) / D, 1);
      // ease-out cubic
      var eased = 1 - Math.pow(1 - p, 3);
      var val = Math.round(from + diff * eased);
      el.textContent = fmtNaira(val);
      if (p < 1) {
        el.__rafId = requestAnimationFrame(step);
      } else {
        el.__rafId = null;
      }
    }
    el.__rafId = requestAnimationFrame(step);
  }

  // Controller to manage lifecycle safely
  var ctrl = {
    auth: null,
    db: null,
    unsubUser: null,
    balanceEl: null,
    currentValue: 0,
    started: false,
    observer: null,

    findEl: function () {
      return d.getElementById("balance"); // <- your element ID
    },

    attachEl: function () {
      var el = this.findEl();
      if (el === this.balanceEl) return;
      // cancel anim on old el if any
      if (this.balanceEl && this.balanceEl.__rafId) {
        cancelAnimationFrame(this.balanceEl.__rafId);
        this.balanceEl.__rafId = null;
      }
      this.balanceEl = el;
      if (el) {
        // seed current from DOM (number if already rendered)
        var seed = coerceNumber(el.dataset.value || el.textContent);
        this.currentValue = seed;
        el.textContent = fmtNaira(seed);
      }
    },

    startObserver: function () {
      var self = this;
      if (this.observer) return;
      this.observer = new MutationObserver(function () {
        self.attachEl();
      });
      this.observer.observe(d.documentElement, { childList: true, subtree: true });
    },

    stopObserver: function () {
      if (this.observer) {
        this.observer.disconnect();
        this.observer = null;
      }
    },

    waitForFirebase: function (cb, tries) {
      tries = tries || 0;
      if (w.firebase && firebase.apps && firebase.apps.length) return cb();
      if (tries > 40) { console.warn("[balance] Firebase not ready."); return; }
      setTimeout(this.waitForFirebase.bind(this, cb, tries + 1), 250);
    },

    start: function () {
      if (this.started) return;
      this.started = true;

      this.attachEl();
      this.startObserver();

      var self = this;
      this.waitForFirebase(function () {
        try {
          self.auth = firebase.auth();
          self.db = firebase.firestore();
        } catch (e) {
          console.error("[balance] Firebase SDK error:", e);
          return;
        }

        self.auth.onAuthStateChanged(function (user) {
          // clean previous doc listener
          if (self.unsubUser) { self.unsubUser(); self.unsubUser = null; }

          if (!user) return;

          var ref = self.db.collection("users").doc(user.uid);
          self.unsubUser = ref.onSnapshot(function (snap) {
            if (!snap.exists) return;
            var next = coerceNumber(snap.data().balance);
            if (!isFinite(next)) return;

            // If element missing, just cache and wait
            if (!self.balanceEl) {
              self.currentValue = next;
              return;
            }

            // Avoid re-animating same value
            if (next === self.currentValue) return;

            // Store numeric value on element (helpful if DOM replaces it later)
            self.balanceEl.dataset.value = String(next);

            // Animate only when visible, else set silently
            if (isVisible(self.balanceEl)) {
              animateNumber(self.balanceEl, self.currentValue, next, 800);
            } else {
              self.balanceEl.textContent = fmtNaira(next);
            }

            self.currentValue = next;
          }, function (err) {
            console.error("[balance] onSnapshot error:", err);
          });
        });
      });
    },

    stop: function () {
      if (this.unsubUser) { this.unsubUser(); this.unsubUser = null; }
      if (this.balanceEl && this.balanceEl.__rafId) {
        cancelAnimationFrame(this.balanceEl.__rafId);
        this.balanceEl.__rafId = null;
      }
      this.stopObserver();
      this.started = false;
    }
  };

  // expose for diagnostics / hot-reload safety
  w.__balanceCtrl = ctrl;

  // Start when DOM ready (prevents element-not-found issues)
  if (d.readyState === "loading") {
    d.addEventListener("DOMContentLoaded", function () { ctrl.start(); }, { once: true });
  } else {
    ctrl.start();
  }

  // Clean up on unload
  w.addEventListener("beforeunload", function () { ctrl.stop(); });
})(window, document);










                                                                                    // Active Tab
															  
window.activateTab = function(tabId) {
  switchTab(tabId); // Show the right screen content

  // 🔵 Update navbar active states visually
  const allNavBtns = document.querySelectorAll('.nav-btn');
  allNavBtns.forEach(btn => btn.classList.remove('active-nav'));

  const activeBtn = document.getElementById(`nav-${tabId}`);
  if (activeBtn) activeBtn.classList.add('active-nav');

  // 🧭 Show/hide top/bottom navbars and back arrow
  const topNavbar = document.getElementById("topNavbar");
  const bottomNav = document.getElementById("bottomNav");
  const backArrowBar = document.getElementById("backArrowBar");

  const showFullNav = tabId === "dashboard";

  if (showFullNav) {
    topNavbar.style.display = "flex";
    bottomNav.style.display = "flex";
    backArrowBar.classList.add("hidden");
  } else {
    topNavbar.style.display = "none";
    bottomNav.style.display = "flex"; // keep bottom nav visible for all tabs
    backArrowBar.classList.remove("hidden");
  }
};






// 💸 Switch between Withdraw Tabs
function switchWithdrawTab(tab) {
  const tabs = document.querySelectorAll('.withdraw-tab');
  const buttons = document.querySelectorAll('.withdraw-tab-btn');
  tabs.forEach(t => t.classList.add('hidden'));
  document.getElementById(`withdraw-${tab}`).classList.remove('hidden');
  buttons.forEach(btn => btn.classList.remove('active'));
  document.querySelector(`.withdraw-tab-btn[onclick*="${tab}"]`).classList.add('active');
}

// 🚀 Swiper Init
document.addEventListener("DOMContentLoaded", function () {
  // Withdraw swiper
  new Swiper('.tab-swiper', {
    slidesPerView: 3,
    spaceBetween: 10,
    freeMode: true,
    grabCursor: true,
  });

  // Settings swiper
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
});







                                                                         // 📺 Tab Switching Function (General)

window.switchTab = function(tabId) {
  const sections = document.querySelectorAll('.tab-section');
  sections.forEach(section => section.classList.add('hidden'));

  const activeSection = document.getElementById(tabId);
  if (activeSection) {
    activeSection.classList.remove('hidden');
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  // Handle bottom nav and back arrow
  const bottomNav = document.getElementById('bottomNavbar');
  const backArrow = document.getElementById('backArrowBar');

  const showNavTabs = ['dashboard','games',  'transaction' ];

  if (showNavTabs.includes(tabId)) {
    bottomNav.classList.remove('hidden');
    backArrow.classList.add('hidden');
  } else {
    bottomNav.classList.add('hidden');
    backArrow.classList.remove('hidden');
  }
};

   



                                                                                 //SIDEBAR FUNCTION
																				 

const hamburgerBtn = document.getElementById("hamburgerBtn");
const sidebar = document.getElementById("sidebar");
const hamburgerIcon = document.getElementById("hamburgerIcon");
const topNavbar = document.getElementById("topNavbar");
const bottomNavbar = document.getElementById("bottomNavbar");

// Create overlay blur background
let blurOverlay = document.createElement("div");
blurOverlay.id = "blurOverlay";
blurOverlay.className = "fixed inset-0 bg-black bg-opacity-40 backdrop-blur-sm z-40 hidden";
document.body.appendChild(blurOverlay);

// Toggle sidebar on hamburger click
hamburgerBtn.addEventListener("click", () => {
  const isOpening = sidebar.classList.contains("-translate-x-full");

  sidebar.classList.toggle("-translate-x-full");
  hamburgerIcon.classList.toggle("rotate-90");
  blurOverlay.classList.toggle("hidden");

  if (isOpening) {
    // Sidebar is opening, push navbars behind
    topNavbar?.classList.add("z-10");
    bottomNavbar?.classList.add("z-10");
  } else {
    // Sidebar is closing, restore navbars if needed
    if (!topNavbar.classList.contains("hidden")) {
      topNavbar?.classList.remove("z-10");
    }
    bottomNavbar?.classList.remove("z-10");
  }
});

// Close sidebar when clicking outside
document.addEventListener("click", (event) => {
  const isClickInsideSidebar = sidebar.contains(event.target);
  const isClickOnHamburger = hamburgerBtn.contains(event.target);
  const isClickOnOverlay = blurOverlay.contains(event.target);

  if (!isClickInsideSidebar && !isClickOnHamburger && isClickOnOverlay) {
    closeSidebar();
  }
});

// Close sidebar & hide top navbar permanently on link click
const sidebarLinks = sidebar.querySelectorAll("a");
sidebarLinks.forEach((link) => {
  link.addEventListener("click", () => {
    closeSidebar(true); // true = coming from sidebar content
  });
});

function closeSidebar(fromLink = false) {
  sidebar.classList.add("-translate-x-full");
  hamburgerIcon.classList.remove("rotate-90");
  blurOverlay.classList.add("hidden");

  topNavbar?.classList.remove("z-10");
  bottomNavbar?.classList.remove("z-10");

  if (fromLink) {
    // Hide topNavbar permanently
    topNavbar?.classList.add("hidden");
    topNavbar?.classList.remove("z-10");
  }
}



// ✅ Auto-fetch profile data on login
firebase.auth().onAuthStateChanged(async (user) => {
  if (user) {
    try {
      const doc = await firebase.firestore().collection("users").doc(user.uid).get();

      // Profile Pic
      if (doc.exists && doc.data().profilePic) {
        updateAllProfilePreviews(doc.data().profilePic);
      } else {
        updateAllProfilePreviews(placeholderPic);
      }

      // Full Name
      if (doc.exists && doc.data().fullName) {
        document.getElementById("userFullName").innerText = doc.data().fullName;
      } else {
        document.getElementById("userFullName").innerText = user.displayName || "No Name";
      }

      // Email
      document.getElementById("userEmail").innerText = user.email || "No Email";

    } catch (err) {
      console.error("❌ Error fetching user data:", err);
      updateAllProfilePreviews(placeholderPic);
      document.getElementById("userFullName").innerText = "Guest";
      document.getElementById("userEmail").innerText = "";
    }
  } else {
    // Logged out
    updateAllProfilePreviews(placeholderPic);
    document.getElementById("userFullName").innerText = "Guest";
    document.getElementById("userEmail").innerText = "";
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
const BASE_URL = "https://globals-myzv.onrender.com"; // your root link

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
auth.onAuthStateChanged(async user => {
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

  // Load referrals
  const invitedSnap = await db.collection("users").where("referrer", "==", username).get();

  let invitedCount = 0;
  let rewardedCount = 0;

  const container = document.getElementById("referralList");
  if (container) container.innerHTML = "";

  // Process each referral
  const creditTasks = [];
  invitedSnap.forEach((docSnap) => {
    const u = docSnap.data();
    invitedCount += 1;

    const isPremium = !!u.is_Premium;
    const alreadyCredited = !!u.referralBonusCredited;

    if (isPremium) rewardedCount += 1;

    // UI card (purely visual; not tied to balance)
    if (container) {
      container.innerHTML += generateReferralCard({
        username: u.username || (u.name || "User"),
        email: u.email || "",
        profile: u.profile || "",
        premium: isPremium
      });
    }

    // 👇 Credit in a single transaction (atomic + idempotent)
    if (isPremium && !alreadyCredited) {
      creditTasks.push(processReferralCreditTx(docSnap.id, user.uid));
    }
  });

  // Wait for all credits to finish
  if (creditTasks.length) {
    try { await Promise.all(creditTasks); } catch(e) { console.error("Credit errors:", e); }
  }

  // Update counters
  const invitedCountEl = document.getElementById("invitedCount");
  const rewardedCountEl = document.getElementById("rewardedCount");
  if (invitedCountEl) invitedCountEl.innerText = invitedCount;
  if (rewardedCountEl) rewardedCountEl.innerText = rewardedCount;
});

// ========================
// CARD UI
// ========================
function generateReferralCard(user){
  const initials = (user.username || "U").slice(0,1).toUpperCase();
  const amount = user.premium ? 500 : 0;

  return `
    <div class="bg-white rounded-2xl shadow-md p-4 flex items-center justify-between hover:shadow-lg transition">
      <div class="flex items-center gap-3">
        ${
          user.profile
            ? `<img src="${user.profile}" class="w-10 h-10 rounded-full object-cover" alt="${user.username}">`
            : `<div class="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 font-semibold">${initials}</div>`
        }
        <div>
          <p class="font-semibold text-sm">${user.username}</p>
          <p class="text-[11px] text-gray-500">${user.premium ? "Premium" : "Signed up"}</p>
        </div>
      </div>
      <div class="text-right">
        <p class="font-bold ${amount>0 ? "text-green-600" : "text-gray-400"}">${money(amount)}</p>
        <p class="text-[11px] text-gray-400">Commission</p>
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
const subcategoryOptions = {
  whatsapp: {
    "WhatsApp/telegram group join": 15,
    "Whatsapp status post": 50,
    "Whatsapp contact add": 15,
    "Share to 3 WhatsApp group": 50,
    "Whatsapp/telegram channel follow": 20,
    "Community join": 30,
    "Whatsapp linking": 500,
    "Telegram bot": 30
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

let defaultEarn = 0;

function populateSubcategories() {
  const category = document.getElementById("category").value;
  const subcategory = document.getElementById("subcategory");
  subcategory.innerHTML = '<option value="">Select subcategory</option>';
  if (subcategoryOptions[category]) {
    for (const [key, value] of Object.entries(subcategoryOptions[category])) {
      const opt = document.createElement("option");
      opt.value = value;
      opt.textContent = `${key} (₦${value})`;
      subcategory.appendChild(opt);
    }
  }
}

function updateWorkerEarn() {
  const subVal = parseInt(document.getElementById("subcategory").value);
  if (!isNaN(subVal)) {
    document.getElementById("workerEarn").value = subVal;
    defaultEarn = subVal;
    updateTotal();
  }
}

function validateWorkerEarn() {
  const inputVal = parseInt(document.getElementById("workerEarn").value);
  const warning = document.getElementById("earnWarning");
  if (inputVal < defaultEarn) {
    warning.classList.remove("hidden");
  } else {
    warning.classList.add("hidden");
    updateTotal();
  }
}

function limitProofFiles() {
  const checkboxes = document.querySelectorAll("input[name='proofFile']");
  const checked = Array.from(checkboxes).filter(i => i.checked);
  if (checked.length > 3) {
    alert("You can only select up to 3 proof files");
    event.target.checked = false;
  }
}

function updateTotal() {
  const earn = parseInt(document.getElementById("workerEarn").value);
  const count = parseInt(document.getElementById("workerCount").value);
  const premium = document.getElementById("makePremium").checked ? 100 : 0;
  const approvalFee = 200;
  if (!isNaN(earn) && !isNaN(count)) {
    const total = (earn * count) + premium + approvalFee;
    document.getElementById("totalCost").textContent = `₦${total}`;
  }
}

async function submitTask() {
  const category = document.getElementById("category").value;
  const subCategory = document.getElementById("subcategory").value;
  const taskTitle = document.getElementById("taskTitle").value.trim();
  const description = document.querySelector("textarea[placeholder*='Describe']").value.trim();
  const proof = document.querySelector("textarea[placeholder*='Write out']").value.trim();
  const screenshotExample = document.querySelector("input[type='file']").files[0];
  const numWorkers = parseInt(document.getElementById("workerCount").value);
  const workerEarn = parseInt(document.getElementById("workerEarn").value);
  const makePremium = document.getElementById("makePremium")?.checked || false;
  const proofFileCount = parseInt(document.getElementById("affiliateProofFileCount").value || "1");
  
  

  // Validation
  if (!taskTitle || !category || !subCategory || !description || !proof || !screenshotExample || !numWorkers || !workerEarn) {
    alert("⚠️ Please fill in all required fields.");
    return;
  }

  const user = auth.currentUser;
  if (!user) {
    alert("⚠️ You must be logged in to post a job.");
    return;
  }

  try {
    // Fetch user profile
    const userDocRef = db.collection("users").doc(user.uid);
    const userDoc = await userDocRef.get();

    if (!userDoc.exists) {
      alert("⚠️ User profile not found.");
      return;
    }

    const userProfile = userDoc.data();

    // Calculate costs
    const reviewFee = 200;
    const premiumFee = makePremium ? 100 : 0;
    const total = (numWorkers * workerEarn) + reviewFee + premiumFee;
    const currentBalance = userProfile.balance || 0;

    if (currentBalance < total) {
      alert(`⚠️ Insufficient balance. Required ₦${total}, available ₦${currentBalance}.`);
      return;
    }

    // 📤 Upload logo if provided (uses your uploadToCloudinary helper)
        let screenshotURL = "";
        if (screenshotExample) {
            try {
                screenshotURL = await uploadToCloudinary(screenshotExample);
            } catch (err) {
                console.error("Screenshot upload failed:", err);
                alert("❌ Screenshot upload failed. Try again.");
                return;
            }
        }

    // Prepare job data
    const jobData = {
      title: taskTitle,
      category,
      subCategory,
      description,
      proof,
      screenshotURL,
      numWorkers,
      workerEarn,
      makePremium,
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

    // Submit job & deduct balance
    await db.runTransaction(async (transaction) => {
      transaction.update(userDocRef, { balance: currentBalance - total });
      const taskRef = db.collection("tasks").doc();
      transaction.set(taskRef, jobData);
    });

    alert("✅ Task successfully posted!");
  } catch (err) {
    console.error("🔥 Error posting task:", err);
    alert("❌ Something went wrong. Try again later.");
  }
}












// AFFILIATE  Update Total When Inputs Change
                          
                          
function updateAffiliateJobTotal() {
  const numWorkers = parseInt(document.getElementById("numWorkers").value) || 0;
  const workerPay = parseInt(document.getElementById("workerPay").value) || 0;
  

  
  const companyFee = 300;

  const total = (numWorkers * workerPay) + companyFee;

  const totalDisplay = document.getElementById("affiliateJobTotal");
  if (totalDisplay) {
    totalDisplay.innerText = `₦${total}`;
  }
}

// 🔁 Trigger Total Update When Inputs Change
document.getElementById("numWorkers").addEventListener("input", updateAffiliateJobTotal);
document.getElementById("workerPay").addEventListener("input", updateAffiliateJobTotal);


// 🚀 Submit Affiliate Job
// 🚀 Replace your existing submitAffiliateJob() with this exact function
async function submitAffiliateJob() {
  try {
    // Get the affiliate form container (note: your HTML uses id "afffiliateJobFormSection")
    const formSection = document.getElementById("afffiliateJobFormSection") || document;

    // Read inputs (prefer to query inside the affiliate form to avoid duplicate-id problems)
    const category = (formSection.querySelector("#affiliateCategory") || document.getElementById("affiliateCategory"))?.value || "";
    const title = (formSection.querySelector("#campaignTitle") || document.getElementById("campaignTitle"))?.value.trim() || "";
    const instructions = (formSection.querySelector("#workerInstructions") || document.getElementById("workerInstructions"))?.value.trim() || "";
    const targetLink = (formSection.querySelector("#targetLink") || document.getElementById("targetLink"))?.value.trim() || "";
    const proofRequired = (formSection.querySelector("#proofRequired") || document.getElementById("proofRequired"))?.value.trim() || "";
    const numWorkers = parseInt((formSection.querySelector("#numWorkers") || document.getElementById("numWorkers"))?.value, 10) || 0;
    const workerPay = parseInt((formSection.querySelector("#workerPay") || document.getElementById("workerPay"))?.value, 10) || 0;
    const campaignLogoFile = (formSection.querySelector("#campaignLogoFile") || document.getElementById("campaignLogoFile"))?.files?.[0] || null;

    // --- ROBUST proofFileCount reading ---
    // Prefer the select inside affiliate form, fall back to id anywhere
    const proofSelect =
      formSection.querySelector("#affiliateProofFileCount") ||
      document.getElementById("affiliateProofFileCount") ||
      document.getElementById("proofFileCount"); // last fallback if you still have old id

    const proofFileCountRaw = proofSelect ? proofSelect.value : null;
    const proofFileCount = parseInt(proofFileCountRaw, 10) || 1;

    // --- DEBUG INFO (open browser console to see) ---
    console.log("DEBUG submitAffiliateJob: proofSelect element:", proofSelect);
    console.log("DEBUG submitAffiliateJob: proofFileCountRaw =", proofFileCountRaw, "parsed =", proofFileCount);

    // Check for duplicate IDs that could cause wrong reads
    const dup_old = document.querySelectorAll("#proofFileCount");
    const dup_aff = document.querySelectorAll("#affiliateProofFileCount");
    if (dup_old.length > 0) {
      console.warn("WARNING: Found", dup_old.length, "elements with id 'proofFileCount'. Rename them to avoid conflicts.");
    }
    if (dup_aff.length > 1) {
      console.warn("WARNING: Found", dup_aff.length, "elements with id 'affiliateProofFileCount' (should be 1).");
    }

    // Basic validation
    if (!category || !title || !instructions || !targetLink || !proofRequired || numWorkers <= 0 || workerPay <= 0) {
      alert("⚠️ Please fill in all required fields.");
      return;
    }

    const user = auth.currentUser;
    if (!user) {
      alert("⚠️ You must be logged in.");
      return;
    }

    // Fetch user profile
    const userDocRef = db.collection("users").doc(user.uid);
    const userSnap = await userDocRef.get();
    if (!userSnap.exists) {
      alert("⚠️ User profile not found.");
      return;
    }
    const userProfile = userSnap.data();

    // Calculate total
    const companyFee = 300;
    const total = (numWorkers * workerPay) + companyFee;

    const userBalance = userProfile.balance || 0;
    if (userBalance < total) {
      alert(`⚠️ Insufficient balance. Required ₦${total}, available ₦${userBalance}.`);
      return;
    }

    // Upload logo if provided
    let campaignLogoURL = "";
    if (campaignLogoFile) {
      try {
        campaignLogoURL = await uploadToCloudinary(campaignLogoFile);
      } catch (err) {
        console.error("Logo upload failed:", err);
        alert("❌ Campaign logo upload failed. Try again.");
        return;
      }
    }

    // Prepare job data — using proofFileCount variable (number)
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
      proofFileCount,        // <-- correct numeric value stored here
      campaignLogoURL,
      companyFee,
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

    // Final debug print before saving
    console.log("DEBUG submitAffiliateJob: jobData about to save ->", jobData);

    // Save job & deduct balance atomically
    await db.runTransaction(async (transaction) => {
      transaction.update(userDocRef, { balance: userBalance - total });
      const jobRef = db.collection("affiliateJobs").doc();
      transaction.set(jobRef, jobData);
    });

    alert("✅ Affiliate job submitted successfully!");
    window.location.reload();

  } catch (error) {
    console.error("🔥 Error submitting affiliate job:", error);
    alert("❌ Something went wrong. Try again.");
  }
}








                                                                  // MY JOB POST FUNCTION

// --- Start of Corrected MY JOB POST FUNCTION ---

// This function will fetch and display the user's jobs.
// It's wrapped in an async function to use await.
async function fetchAndDisplayUserJobs() {
  const jobList = document.getElementById("jobList");
  if (!jobList) {
    console.error("Error: 'jobList' element not found in the DOM. Please ensure your HTML has an element with id='jobList'.");
    return;
  }
  jobList.innerHTML = "<p class='text-center text-gray-500'>Loading your jobs...</p>"; // Initial loading message

  // Use Firebase's onAuthStateChanged observer for reliable user detection
  // This listener will fire immediately with the current user state,
  // and again if the user logs in or out.
  firebase.auth().onAuthStateChanged(async (user) => {
    if (user) {
      // User is logged in, proceed to fetch their jobs
      const uid = user.uid;
      console.log(`User ${uid} is logged in. Fetching their posted jobs.`);

      try {
        const allJobs = [];

        // 1. Fetch Tasks Posted by the User
        const taskQuerySnapshot = await firebase.firestore()
          .collection("tasks")
          .where("postedBy.uid", "==", uid)
          .orderBy("postedAt", "desc")
          .get();

        taskQuerySnapshot.forEach(doc => {
          const job = doc.data();
          job.id = doc.id; // Add document ID
          job.type = "task"; // Identify job type
          allJobs.push(job);
        });
        console.log(`Fetched ${taskQuerySnapshot.size} tasks.`);

        // 2. Fetch Affiliate Jobs Posted by the User
        // !!! CRITICAL FIX: Corrected collection name from "affiliateJobsaffiliateJobs"
        const affiliateQuerySnapshot = await firebase.firestore()
          .collection("affiliateJobs") // <--- THIS WAS THE TYPO! Corrected.
          .where("postedBy.uid", "==", uid)
          .orderBy("postedAt", "desc")
          .get();

        affiliateQuerySnapshot.forEach(doc => {
          const job = doc.data();
          job.id = doc.id; // Add document ID
          job.type = "affiliate"; // Identify job type
          allJobs.push(job);
        });
        console.log(`Fetched ${affiliateQuerySnapshot.size} affiliate jobs.`);

        // If no jobs found after both queries
        if (allJobs.length === 0) {
          jobList.innerHTML = '<p class="text-center text-gray-500">You haven\'t posted any jobs yet.</p>';
          return;
        }

        // Sort all jobs by 'postedAt' date (most recent first)
        // Using optional chaining and toMillis() for robustness with Firebase Timestamps
        allJobs.sort((a, b) => {
          const aTime = a.postedAt?.toMillis() || 0;
          const bTime = b.postedAt?.toMillis() || 0;
          return bTime - aTime; // Descending order
        });

        // Clear loading message and render job cards
        jobList.innerHTML = "";
        allJobs.forEach(job => {
          // Determine status color, defaulting to 'on review' if status is missing
          const status = job.status || 'on review';
          const statusColor = status === 'approved' ? 'bg-green-100 text-green-700' :
                              status === 'rejected' ? 'bg-red-100 text-red-700' :
                              'bg-yellow-100 text-yellow-700'; // Default for 'on review'

          const jobCard = `
            <div class="p-4 rounded-xl bg-white shadow-md border border-gray-200">
              <div class="flex justify-between items-center">
                <h3 class="text-lg font-semibold text-blue-900">${job.title || 'Untitled Job'}</h3>
                <span class="px-2 py-1 rounded-full text-xs font-bold ${statusColor}">
                  ${status.charAt(0).toUpperCase() + status.slice(1)}
                </span>
              </div>

              <div class="grid grid-cols-2 gap-4 text-sm text-gray-700 mt-4">
                <div><span class="font-semibold">Cost:</span> ₦${job.total || 0}</div>
                <div><span class="font-semibold">Worker Earn:</span> ₦${job.workerEarn || job.workerPay || 0}</div>
                <div><span class="font-semibold">Completed:</span> ${job.completed || 0}/${job.numWorkers || 0}</div>
                <div><span class="font-semibold">Date:</span> ${job.postedAt?.toDate().toLocaleDateString() || '—'}</div>
              </div>

              <div class="mt-4">
                <!-- Pass both job ID and type to checkJobDetails for specific handling -->
                <button onclick="checkJobDetails('${job.id}', '${job.type}')" class="w-full py-2 px-4 rounded-lg bg-blue-600 text-white font-bold hover:bg-blue-700 transition">
                  View Details
                </button>
              </div>
            </div>
          `;
          jobList.innerHTML += jobCard;
        });

      } catch (err) {
        console.error("🔥 Error loading jobs:", err);
        jobList.innerHTML = '<p class="text-center text-red-500">Failed to load jobs. Please try again later.</p>';
      }
    } else {
      // User is not logged in
      console.log("No user logged in. Displaying login message.");
      jobList.innerHTML = '<p class="text-center text-gray-500">Please log in to see your posted jobs.</p>';
    }
  });
}

// Call the main function to fetch and display jobs once the DOM is fully loaded
document.addEventListener('DOMContentLoaded', fetchAndDisplayUserJobs);

// Define your checkJobDetails function globally so it can be called from HTML
// You'll want to implement the actual details display logic here.
function checkJobDetails(jobId, jobType) {
    console.log(`Clicked View Details for Job ID: ${jobId}, Type: ${jobType}`);
    // Example: You might redirect to a job details page:
    // window.location.href = `/job_details.html?id=${jobId}&type=${jobType}`;
    // Or open a modal with more info.
    alert(`Showing details for ${jobType === 'task' ? 'Task' : 'Affiliate Job'} ID: ${jobId}`);
}

// --- End of Corrected MY JOB POST FUNCTION ---





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



// ---------- Notifications JS (replace your broken JS with this) ----------



let unsubscribeNotif = null; // holds the notifications listener

// Ensure the notification_user_state doc exists for the user (new users won't see old notifications)
async function ensureUserState(uid) {
  try {
    const ref = db.collection('notification_user_state').doc(uid);
    const doc = await ref.get();
    if (!doc.exists) {
      // create joinedAt + lastReadAt as serverTimestamp so new users start from "now"
      await ref.set({
        joinedAt: firebase.firestore.FieldValue.serverTimestamp(),
        lastReadAt: firebase.firestore.FieldValue.serverTimestamp()
      }, { merge: true });

      // re-read so later reads get the server timestamp value
      return await ref.get();
    }
    return doc;
  } catch (err) {
    console.error("ensureUserState error:", err);
    throw err;
  }
}

// Start listening to notifications realtime and update UI (dot, popup, dashboard banner, list)
async function listenForNotifications(uid) {
  // detach previous listener if any
  if (unsubscribeNotif) {
    unsubscribeNotif();
    unsubscribeNotif = null;
  }

  // make sure user's state exists before listening
  await ensureUserState(uid);

  // attach realtime listener to notifications (most recent first)
  unsubscribeNotif = db.collection('notifications')
    .orderBy('timestamp', 'desc')
    .onSnapshot(async snapshot => {
      try {
        // read the user's lastReadAt each time (keeps accurate after mark-as-read)
        const stateDoc = await db.collection('notification_user_state').doc(uid).get();
        const lastReadAt = (stateDoc.exists && stateDoc.data().lastReadAt)
          ? stateDoc.data().lastReadAt.toDate()
          : new Date(0);

        // UI elements (may or may not exist depending on page)
        const notifDot = document.getElementById('notifDot');
        const notifPopup = document.getElementById('notifPopup');
        const notifMessage = document.getElementById('notifMessage');
        const notifList = document.getElementById('notificationList');
        const banner = document.getElementById('notifBanner');
        const bannerText = document.getElementById('notifBannerText');

        // Count unread and render list
        let unreadCount = 0;
        // Build HTML for notifications list (if element exists)
        if (notifList) notifList.innerHTML = '';

        snapshot.forEach(doc => {
          const data = doc.data();
          const ts = data.timestamp;
          const tsDate = ts ? ts.toDate() : null;
          const isUnread = tsDate ? (tsDate > lastReadAt) : false;
          if (isUnread) unreadCount++;

          // render into notifications list (notifications tab)
          if (notifList) {
            const dateStr = tsDate ? tsDate.toLocaleString() : 'Just now';
            // Keep your style: rounded card, left blue border for emphasis
            const card = document.createElement('div');
            card.className = `bg-white rounded-xl p-4 shadow-md border-l-4 ${isUnread ? 'border-blue-400' : 'border-gray-200'} animate-fade-in`;
            card.innerHTML = `
              <p class="text-gray-800 font-semibold">${escapeHtml(data.title || 'No Title')}</p>
              <p class="text-sm text-gray-600 mt-1">${escapeHtml(data.message || '')}</p>
              <p class="text-xs text-gray-500 mt-2">${escapeHtml(dateStr)}</p>
            `;
            notifList.appendChild(card);
          }
        });

        // Update red dot (nav)
        if (notifDot) {
          notifDot.classList.toggle('hidden', unreadCount === 0);
        }

        // Update popup (small blue popup under bell)
        if (notifPopup && notifMessage) {
          if (unreadCount > 0) {
            notifMessage.textContent = `You have ${unreadCount} new notification${unreadCount > 1 ? 's' : ''}`;
            notifPopup.classList.remove('hidden');
          } else {
            notifPopup.classList.add('hidden');
          }
        }

        // Update dashboard banner (only visible on dashboard)
        if (banner && bannerText) {
          if (unreadCount > 0) {
            bannerText.textContent = `You have ${unreadCount} unread message${unreadCount > 1 ? 's' : ''}`;
            banner.classList.remove('hidden');
          } else {
            banner.classList.add('hidden');
          }
        }
      } catch (err) {
        console.error("onSnapshot processing error:", err);
      }
    }, err => {
      console.error("notifications onSnapshot error:", err);
    });
}

// Mark all notifications as read for this user (update lastReadAt)
async function markNotificationsAsRead(uid) {
  try {
    await db.collection('notification_user_state').doc(uid).set({
      lastReadAt: firebase.firestore.FieldValue.serverTimestamp()
    }, { merge: true });

    // hide UI elements immediately for best UX
    const notifDot = document.getElementById('notifDot');
    const notifPopup = document.getElementById('notifPopup');
    const banner = document.getElementById('notifBanner');
    if (notifDot) notifDot.classList.add('hidden');
    if (notifPopup) notifPopup.classList.add('hidden');
    if (banner) banner.classList.add('hidden');
  } catch (err) {
    console.error("markNotificationsAsRead error:", err);
  }
}

// Close popup without marking as read
function closeNotifPopup() {
  const notifPopup = document.getElementById('notifPopup');
  if (notifPopup) notifPopup.classList.add('hidden');
}

// Basic activateTab that won't break clicks — ensures tab switching works
function activateTab(tabId) {
  document.querySelectorAll('.tab-section').forEach(el => el.classList.add('hidden'));
  const el = document.getElementById(tabId);
  if (el) el.classList.remove('hidden');

  // if opening the notifications tab, load / mark as read
  if (tabId === 'notifications') {
    const user = auth.currentUser;
    if (user) {
      // mark read & ensure latest list shown
      markNotificationsAsRead(user.uid).catch(console.error);
      // loadNotifications not required because the realtime listener already populates #notificationList
    }
  }
}

// OPTIONAL: on-demand load (one-time) if you need it elsewhere — fallback if realtime hasn't triggered
async function loadNotificationsOnce() {
  try {
    const notifList = document.getElementById('notificationList');
    if (notifList) notifList.innerHTML = `<p class="text-gray-500 text-center">Loading...</p>`;
    const snapshot = await db.collection('notifications').orderBy('timestamp','desc').get();
    if (notifList) notifList.innerHTML = '';
    snapshot.forEach(doc => {
      const data = doc.data();
      const date = data.timestamp ? data.timestamp.toDate().toLocaleString() : 'Just now';
      if (notifList) {
        notifList.innerHTML += `
          <div class="bg-white rounded-xl p-4 shadow-md border-l-4 border-blue-400 animate-fade-in">
            <p class="text-gray-800 font-semibold">${escapeHtml(data.title || 'No Title')}</p>
            <p class="text-sm text-gray-600">${escapeHtml(data.message || '')}</p>
            <p class="text-xs text-gray-500 mt-1">${escapeHtml(date)}</p>
          </div>`;
      }
    });
    if (notifList && snapshot.empty) notifList.innerHTML = `<p class="text-gray-400 text-center">No notifications yet.</p>`;
  } catch (err) {
    console.error("loadNotificationsOnce error:", err);
    const notifList = document.getElementById('notificationList');
    if (notifList) notifList.innerHTML = `<p class="text-red-500 text-center">Failed to load notifications</p>`;
  }
}



// Wire up click handling for the bell if element exists (keeps inline onclick safe or redundant)
document.addEventListener('DOMContentLoaded', () => {
  const bell = document.getElementById('notifBell');
  if (bell) {
    bell.addEventListener('click', (e) => {
      // default activateTab might already be called inline; call it to be safe
      activateTab('notifications');

      // mark as read when user intentionally opens notifications
      const user = auth.currentUser;
      if (user) markNotificationsAsRead(user.uid).catch(console.error);
    });
  }

  const closeBtn = document.getElementById('notifPopupClose'); // optional close button id
  if (closeBtn) closeBtn.addEventListener('click', closeNotifPopup);
});

// Auth state: start/stop listeners
auth.onAuthStateChanged(async user => {
  if (user) {
    try {
      await ensureUserState(user.uid);   // make sure user state doc exists and uses serverTimestamp
      listenForNotifications(user.uid); // start realtime listener (updates dot/banner/popup/list)
    } catch (err) {
      console.error("Error initializing notifications for user:", err);
    }
  } else {
    // cleanup
    if (unsubscribeNotif) {
      unsubscribeNotif();
      unsubscribeNotif = null;
    }
  }
});






  // PAYMENT FUNCTION 

(function(w, d) {
  const PAGE_SIZE = 5;
  let lastDoc = null, unsub = null;

  function formatAmount(n, type) {
    let v = Number(n) || 0;
    let f = "₦" + v.toLocaleString();
    return type === "debit" ? "−" + f : "+" + f;
  }

  function renderTx(doc) {
    const data = doc.data();
    const type = data.type || "credit";
    const amount = formatAmount(data.amount, type);
    const status = data.status || "pending";
    const date = data.date ? new Date(data.date.seconds*1000).toLocaleDateString() : "";

    const statusMap = {
      successful: "text-green-500",
      pending: "text-yellow-500",
      failed: "text-red-500"
    };

    const amountColor = type === "debit" ? "text-red-500" : "text-green-600";

    return `
      <div class="flex items-center justify-between bg-gray-50 px-4 py-3 rounded-xl shadow-sm tx-card" data-status="${status}">
        <div>
          <h3 class="font-medium text-sm text-gray-700">${data.title || "Transaction"}</h3>
          <p class="text-xs text-gray-400">${date}</p>
        </div>
        <div class="text-right">
          <p class="font-bold ${amountColor} text-sm">${amount}</p>
          <span class="text-xs ${statusMap[status] || 'text-gray-400'} font-medium">
            ${status === "successful" ? "✅ Successful" : status === "failed" ? "❌ Failed" : "⏳ Pending"}
          </span>
        </div>
      </div>`;
  }

  function startTransactions() {
    const auth = firebase.auth();
    const db = firebase.firestore();
    const listEl = d.getElementById("transactionList");
    const filterEl = d.getElementById("transactionFilter");
    const loadBtn = d.getElementById("loadMoreTx");

    function load(user) {
      if (unsub) { unsub(); unsub = null; }
      if (!user) { listEl.innerHTML = "<p class='text-sm text-gray-500'>No user signed in.</p>"; return; }

      const q = db.collection("Transaction")
        .where("uid", "==", user.uid)
        .orderBy("date", "desc")
        .limit(PAGE_SIZE);

      unsub = q.onSnapshot(snap => {
        listEl.innerHTML = "";
        if (snap.empty) {
          listEl.innerHTML = "<p class='text-sm text-gray-500'>No transactions found.</p>";
          return;
        }
        lastDoc = snap.docs[snap.docs.length-1];
        snap.forEach(doc => listEl.insertAdjacentHTML("beforeend", renderTx(doc)));
        loadBtn.classList.toggle("hidden", snap.size < PAGE_SIZE);
      });
    }

    // filter
    filterEl.addEventListener("change", () => {
      const val = filterEl.value;
      listEl.querySelectorAll(".tx-card").forEach(c => {
        if (val === "all" || c.dataset.status === val) c.classList.remove("hidden");
        else c.classList.add("hidden");
      });
    });

    // load more
    loadBtn.addEventListener("click", () => {
      if (!lastDoc) return;
      db.collection("Transaction")
        .where("uid", "==", auth.currentUser.uid)
        .orderBy("date", "desc")
        .startAfter(lastDoc)
        .limit(PAGE_SIZE)
        .get()
        .then(snap => {
          if (!snap.empty) {
            lastDoc = snap.docs[snap.docs.length-1];
            snap.forEach(doc => listEl.insertAdjacentHTML("beforeend", renderTx(doc)));
            if (snap.size < PAGE_SIZE) loadBtn.classList.add("hidden");
          } else {
            loadBtn.classList.add("hidden");
          }
        });
    });

    auth.onAuthStateChanged(load);
  }

  if (d.readyState === "loading") {
    d.addEventListener("DOMContentLoaded", startTransactions, { once: true });
  } else {
    startTransactions();
  }
})(window, document);











                                                                              //  DPOSIT'WITHDRAW



// ✅ DEPOSIT FUNCTION (FIXED CALLBACK)
// ---------- Replace your old deposit script with this ----------



function debugLog(...args) { try { console.log('[DEPOSIT]', ...args); } catch(e){} }

// Load Paystack inline script (safely)
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
    s.src = "https://js.paystack.co/v1/inline.js";
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

// Ensure firebase user is ready
function ensureFirebaseUser(timeoutMs = 5000) {
  return new Promise(resolve => {
    const cur = (window.firebase && firebase.auth) ? firebase.auth().currentUser : null;
    if (cur) return resolve(cur);

    if (!window.firebase || !firebase.auth) return resolve(null);

    const unsub = firebase.auth().onAuthStateChanged(user => {
      try { unsub(); } catch(e) {}
      resolve(user);
    });

    setTimeout(() => {
      try { unsub(); } catch(e) {}
      resolve(firebase.auth().currentUser || null);
    }, timeoutMs);
  });
}

// Button loading UI
function _getDepositBtn() {
  return document.getElementById('depositBtn') ||
         document.querySelector('#depositSection button[onclick="handleDeposit()"]');
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

// Auto-fill depositEmail when user logs in
if (window.firebase && firebase.auth) {
  firebase.auth().onAuthStateChanged(user => {
    const el = document.getElementById('depositEmail');
    if (el) el.value = user ? (user.email || '') : '';
  });
}

// Main payWithPaystack function
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

  try {
    await loadPaystackScript();
    debugLog('Paystack library ready');
  } catch (err) {
    setDepositLoading(false);
    console.error('Failed to load Paystack library:', err);
    alert('Payment library failed to load. Refresh the page and try again.');
    return;
  }

  const email = user.email || document.getElementById('depositEmail')?.value;
  if (!email) {
    setDepositLoading(false);
    alert('Could not determine your account email. Sign in again.');
    return;
  }

  try {
    const handler = PaystackPop.setup({
      key: PAYSTACK_PUBLIC_KEY,
      email,
      amount: Math.round(amtNum * 100),
      currency: "NGN",
      label: "Globals Deposit",
      metadata: { uid: user.uid },
      callback: function(response) {   // ✅ FIXED (no async here)
        (async () => {
          debugLog('Paystack callback', response);
          setDepositLoading(true, 'Verifying payment...');

          try {
            const idToken = await user.getIdToken(true);
            const verifyRes = await fetch('/api/verify-payment', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + idToken
              },
              body: JSON.stringify({ reference: response.reference, amount: amtNum })
            });

            let data = null;
            try { data = await verifyRes.json(); } catch (e) {}

            debugLog('verify-payment response', verifyRes.status, data);
            if (verifyRes.ok && data && data.status === 'success') {
              setDepositLoading(false);
              alert('Deposit successful!');
              // Optionally refresh balance UI
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
      onClose: function() {
        setDepositLoading(false);
        debugLog('Paystack checkout closed by user');
      }
    });

    handler.openIframe();
    debugLog('opened Paystack iframe');
  } catch (err) {
    setDepositLoading(false);
    console.error('Could not set up Paystack handler:', err);
    alert('Could not start payment flow. Check console for details.');
  }
}

// handleDeposit (validation then pay)
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

  payWithPaystack(amount).catch(err => {
    console.error('Unhandled payWithPaystack error', err);
    setDepositLoading(false);
  });
}







  
  
                                                                        //WITHDRAW FUNCTION(also check SERVER)
  
  
async function loadBanks() {
  const bankSelect = document.getElementById("withdrawBankSelect");
  bankSelect.innerHTML = `<option>Loading Banks...</option>`;

  try {
    const res = await fetch("https://globals-myzv.onrender.com/api/get-banks"); // 🔁 Replace with your actual Render backend URL
    const banks = await res.json();

    bankSelect.innerHTML = `<option value="">Select Bank</option>`;
    banks.forEach(bank => {
      const option = document.createElement("option");
      option.value = bank.code;
      option.text = bank.name;
      bankSelect.appendChild(option);
    });
  } catch (err) {
    console.error("Error loading banks:", err);
    bankSelect.innerHTML = `<option>Error loading banks</option>`;
  }
}

window.addEventListener("DOMContentLoaded", loadBanks);




document.getElementById("withdrawAccountNumber").addEventListener("blur", verifyAccount);

async function verifyAccount() {
  const accNum = document.getElementById("withdrawAccountNumber").value;
  const bankCode = document.getElementById("withdrawBankSelect").value;
  const nameStatus = document.getElementById("accountNameStatus");
  const nameDisplay = document.getElementById("accountNameDisplay");

  if (accNum.length < 10 || !bankCode) return;

  nameStatus.classList.remove("hidden");
  nameDisplay.classList.add("hidden");

  try {
    const res = await fetch("https://globals-myzv.onrender.com/api/verify-account", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ accNum, bankCode })
    });

    const data = await res.json();

    if (data.status === "success") {
      nameDisplay.innerText = `✅ ${data.account_name}`;
      nameDisplay.classList.remove("hidden");
    } else {
      nameDisplay.innerText = "❌ Account not found";
      nameDisplay.classList.remove("hidden");
    }

  } catch (err) {
    nameDisplay.innerText = "❌ Error verifying account";
    nameDisplay.classList.remove("hidden");
  } finally {
    nameStatus.classList.add("hidden");
  }
}



async function submitWithdrawal() {
  const accNum = document.getElementById("withdrawAccountNumber").value;
  const bankCode = document.getElementById("withdrawBankSelect").value;
  const accountName = document.getElementById("accountNameDisplay").innerText.replace("✅ ", "");
  const amount = parseInt(document.getElementById("withdrawAmount").value);
  const password = document.getElementById("withdrawPassword").value;

  if (!accNum || !bankCode || !amount || !password || amount < 1000) {
    alert("Please fill all fields correctly");
    return;
  }

  try {
    const res = await fetch("https://globals-myzv.onrender.com/api/initiate-transfer", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ accNum, bankCode, account_name: accountName, amount })
    });

    const data = await res.json();

    if (data.status === "success") {
      alert("✅ Withdrawal request successful!");
    } else {
      alert("❌ Withdrawal failed: " + (data.message || "Unknown error"));
    }
  } catch (err) {
    alert("❌ Error submitting withdrawal.");
  }
}







// ✅ DEPOSIT FUNCTION (ALSO CHECK SERVER)
// ---------- Paste/replace existing deposit functions with this ----------
// ---------- Robust deposit code (replace your old deposit block) ----------

// PUBLIC (live) key — keep this public key on client
const PAYSTACK_PUBLIC_KEY = "pk_live_8490c2179be3d6cb47b027152bdc2e04b774d22d";

function debugLog(...args) { try { console.log('[DEPOSIT]', ...args); } catch(e){} }

// Load Paystack inline script (safely)
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
    s.src = "https://js.paystack.co/v1/inline.js";
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

// Ensure firebase user is ready (handles race)
function ensureFirebaseUser(timeoutMs = 5000) {
  return new Promise(resolve => {
    const cur = (window.firebase && firebase.auth) ? firebase.auth().currentUser : null;
    if (cur) return resolve(cur);

    if (!window.firebase || !firebase.auth) return resolve(null);

    const unsub = firebase.auth().onAuthStateChanged(user => {
      try { unsub(); } catch(e) {}
      resolve(user);
    });

    setTimeout(() => {
      try { unsub(); } catch(e) {}
      resolve(firebase.auth().currentUser || null);
    }, timeoutMs);
  });
}

// Button loading UI
function _getDepositBtn() {
  return document.getElementById('depositBtn') ||
         document.querySelector('#depositSection button[onclick="handleDeposit()"]');
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

// Auto-fill depositEmail when user logs in
if (window.firebase && firebase.auth) {
  firebase.auth().onAuthStateChanged(user => {
    const el = document.getElementById('depositEmail');
    if (el) el.value = user ? (user.email || '') : '';
  });
}

// Main payWithPaystack function
async function payWithPaystack(amount) {
  debugLog('payWithPaystack called with', amount);
  setDepositLoading(true, 'Opening checkout...');

  const amtNum = Number(amount);
  if (!isFinite(amtNum) || amtNum <= 0) {
    setDepositLoading(false);
    alert('Invalid amount.');
    return;
  }

  // Live key requires HTTPS
  if (PAYSTACK_PUBLIC_KEY.startsWith('pk_live') && location.protocol !== 'https:') {
    setDepositLoading(false);
    const msg = 'Live Paystack key requires HTTPS. Deploy to an https:// URL.';
    console.error(msg);
    alert(msg);
    return;
  }

  // Ensure firebase user exists
  const user = await ensureFirebaseUser();
  debugLog('firebase user:', !!user, user && user.email);
  if (!user) {
    setDepositLoading(false);
    alert('You must be signed in to make a deposit.');
    return;
  }

  // Load Paystack library (if not already)
  try {
    await loadPaystackScript();
    debugLog('Paystack library ready');
  } catch (err) {
    setDepositLoading(false);
    console.error('Failed to load Paystack library:', err);
    alert('Payment library failed to load. Refresh the page and try again.');
    return;
  }

  // Validate email
  const email = user.email || document.getElementById('depositEmail')?.value;
  if (!email) {
    setDepositLoading(false);
    alert('Could not determine your account email. Sign in again.');
    return;
  }

  // Setup Paystack
  try {
    const handler = PaystackPop.setup({
      key: PAYSTACK_PUBLIC_KEY,
      email,
      amount: Math.round(amtNum * 100), // kobo
      currency: "NGN",
      label: "Globals Deposit",
      metadata: { uid: user.uid }, 

      // ✅ FIXED CALLBACK (no async here)
      callback: function(response) {
        (async () => {
          debugLog('Paystack callback', response);
          setDepositLoading(true, 'Verifying payment...');

          try {
            const idToken = await user.getIdToken(true);
            const verifyRes = await fetch('/api/verify-payment', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + idToken
              },
              body: JSON.stringify({ reference: response.reference, amount: amtNum })
            });

            let data = null;
            try { data = await verifyRes.json(); } catch (e) {}

            debugLog('verify-payment response', verifyRes.status, data);
            if (verifyRes.ok && data && data.status === 'success') {
              setDepositLoading(false);
              alert('Deposit successful!');
              // Optionally refresh balance UI
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

      onClose: function() {
        setDepositLoading(false);
        debugLog('Paystack checkout closed by user');
      }
    });

    // open iframe
    try {
      handler.openIframe();
      debugLog('opened Paystack iframe');
    } catch (openErr) {
      setDepositLoading(false);
      console.error('handler.openIframe error', openErr);
      alert('Could not start payment flow. Check console for details.');
    }

  } catch (err) {
    setDepositLoading(false);
    console.error('Could not set up Paystack handler:', err);
    alert('Could not start payment flow. Check console for details.');
  }
}

// handleDeposit (validation then pay)
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

  payWithPaystack(amount).catch(err => {
    console.error('Unhandled payWithPaystack error', err);
    setDepositLoading(false);
  });
}


                                                                 // SERVICE FUNCTION  

function openService(serviceName) {
    alert("Open " + serviceName + " screen");
    // Here, you’ll route to the corresponding screen
  }

   function openAllCategories() {
    document.getElementById("all-categories-screen").classList.remove("hidden");
  }

 







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
      { id:'m1', label:'500MB - ₦200', amount:200 },
      { id:'m2', label:'1.5GB - ₦1000', amount:1000 },
      { id:'m3', label:'3GB - ₦1500', amount:1500 }
    ],
    '02': [
      { id:'g1', label:'1GB - ₦500', amount:500 },
      { id:'g2', label:'2.9GB - ₦1000', amount:1000 }
    ],
    '04': [
      { id:'a1', label:'1.5GB - ₦1000', amount:1000 },
      { id:'a2', label:'3GB - ₦1500', amount:1500 }
    ],
    '03': [
      { id:'9a', label:'1GB - ₦500', amount:500 },
      { id:'9b', label:'2GB - ₦1000', amount:1000 }
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
        tx.set(newBill,{
          userId:dataCurrentUser.uid,
          type:'data',
          networkCode:network,
          phone, amount,
          status:'submitted',
          processed:false,
          createdAt:firebase.firestore.FieldValue.serverTimestamp()
        });
      });
      _showScreen('data-success-screen');
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























