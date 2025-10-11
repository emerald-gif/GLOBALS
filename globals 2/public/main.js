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
firebase.auth().onAuthStateChanged(function (user) {
  const navbarGreeting = document.getElementById("navbarGreeting");

  if (!navbarGreeting) return;

  if (!user) {
    navbarGreeting.textContent = "Hello Guest 👋";
    return;
  }

  const uid = user.uid;

  // Listen for real-time changes in the user's document
  firebase.firestore().collection("users").doc(uid)
    .onSnapshot((doc) => {
      if (!doc.exists) {
        navbarGreeting.textContent = "Hello Guest 👋";
        return;
      }

      const userData = doc.data();
      const username = (typeof userData.username === "string" && userData.username.trim().length > 0)
        ? userData.username.trim()
        : "Guest";

      // Clear old content
      navbarGreeting.textContent = "";

      // "Hello " text
      navbarGreeting.appendChild(document.createTextNode("Hello "));

      // Bold username
      const nameSpan = document.createElement("span");
      nameSpan.className = "font-semibold";
      nameSpan.textContent = username;
      navbarGreeting.appendChild(nameSpan);

      // Wave or Verified badge
      if (userData.is_Premium === true) {
        const img = document.createElement("img");
        img.src = "VERIFIED.jpg"; // exact path
        img.alt = "Verified";
        img.className = "w-4 h-4 ml-1 inline-block align-middle object-contain";
        img.onerror = () => { img.style.display = "none"; };
        navbarGreeting.appendChild(img);
      } else {
        navbarGreeting.appendChild(document.createTextNode(" 👋"));
      }

    }, (err) => {
      console.error("Error listening to user doc:", err);
      navbarGreeting.textContent = "Hello Guest 👋";
    });
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

// Format Amount (clean, no plus/minus sign)
function formatAmount(amount) {
  const n = Number(amount || 0);
  return `₦${n.toFixed(2)}`;
}

/* ----------------------
   Render single card HTML (Fintech 2025 style)
   ---------------------- */
function cardHtml(tx) {
  const tsFields = tx.timestamp || tx.createdAt || tx.time || tx.created_at || null;
  const date = parseTimestamp(tsFields);
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
          <p class="text-xs text-gray-400 mt-1">${formatDatePretty(date)}</p>
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

/* ----------------------
   Render list (with empty state)
   ---------------------- */
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

/* ----------------------
   Open Transaction Details Screen
   ---------------------- */
function openTransactionDetails(id) {
  console.log("🔍 Opening details for ID:", id);

  const tx = transactionsCache.find(t => t.id === id);
  if (!tx) {
    console.error("❌ Transaction not found in cache", transactionsCache);
    return;
  }

  const tsFields = tx.timestamp || tx.createdAt || tx.time || tx.created_at || null;
  const date = parseTimestamp(tsFields);

  document.getElementById("transaction-details-content").innerHTML = `
    <div class="bg-white rounded-2xl p-6 shadow-sm space-y-4">
      <div class="flex justify-between">
        <span class="text-sm text-gray-500">Type</span>
        <span class="text-base font-semibold text-gray-900">${tx.type}</span>
      </div>
      <div class="flex justify-between">
        <span class="text-sm text-gray-500">Amount</span>
        <span class="text-base font-semibold">${formatAmount(tx.amount)}</span>
      </div>
      <div class="flex justify-between">
        <span class="text-sm text-gray-500">Status</span>
        <span class="capitalize">${tx.status}</span>
      </div>
      <div class="flex justify-between">
        <span class="text-sm text-gray-500">Date</span>
        <span>${formatDatePretty(date)}</span>
      </div>
      <div class="flex justify-between">
        <span class="text-sm text-gray-500">Transaction ID</span>
        <span class="text-xs">${tx.id}</span>
      </div>
    </div>
  `;

  activateTab("transaction-details-screen");
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

  filtered = sortByTimestampDesc(filtered);
  renderTransactions(filtered);
}

/* ----------------------
   Stop current listener if any
   ---------------------- */
function stopTransactionsListener() {
  if (txUnsubscribe) {
    try { txUnsubscribe(); } catch (e) { }
    txUnsubscribe = null;
    safeLog("Stopped previous transactions listener.");
  }
}

/* ----------------------
   Update red dot helper
   ---------------------- */
function updateTxRedDot() {
  const txDot = document.getElementById('txDot');
  const user = firebase.auth().currentUser;
  if (!txDot || !user) return;

  firebase.firestore().collection('users').doc(user.uid).get()
    .then(doc => {
      const lastRead = doc.data()?.lastTxReadAt?.toDate() || new Date(0);
      const showDot = transactionsCache.some(tx => {
        const txTime = parseTimestamp(tx.timestamp || tx.createdAt || tx.time || tx.created_at);
        return txTime && txTime > lastRead;
      });
      txDot.classList.toggle('hidden', !showDot);
    })
    .catch(console.error);
}

/* ----------------------
   Try to attach onSnapshot to one collection name
   ---------------------- */
function tryListenToCollection(collName, uid) {
  return new Promise((resolve) => {
    safeLog(`Attempting listener on collection "${collName}" (with orderBy timestamp) for UID:`, uid);
    const baseRef = firebase.firestore().collection(collName).where("userId", "==", uid);

    try {
      const q = baseRef.orderBy("timestamp", "desc");
      const unsub = q.onSnapshot(snapshot => {
        safeLog(`Snapshot from "${collName}" (with orderBy timestamp). docs:`, snapshot.size);

        transactionsCache = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        }));

        renderTransactions(transactionsCache);
        updateTxRedDot(); // ✅ ensure red dot updates
      }, error => {
        console.error(`[TX-HISTORY] onSnapshot error for ${collName} (with orderBy):`, error.message || error);

        try { unsub(); } catch (e) {}
        const unsub2 = firebase.firestore().collection(collName).where("userId", "==", uid)
          .onSnapshot(snap2 => {
            transactionsCache = snap2.docs.map(doc => ({
              id: doc.id,
              ...doc.data(),
            }));
            renderTransactions(transactionsCache);
            updateTxRedDot(); // ✅ ensure red dot updates
          }, err2 => console.error(`[TX-HISTORY] fallback error for ${collName}:`, err2));
        resolve(unsub2);
      });

      resolve(unsub);
    } catch (err) {
      console.error(`[TX-HISTORY] Exception for ${collName}:`, err);
      try {
        const unsub3 = firebase.firestore().collection(collName).where("userId", "==", uid)
          .onSnapshot(snap3 => {
            transactionsCache = snap3.docs.map(doc => ({
              id: doc.id,
              ...doc.data(),
            }));
            renderTransactions(transactionsCache);
            updateTxRedDot(); // ✅ ensure red dot updates
          }, err3 => console.error(`[TX-HISTORY] no orderBy error:`, err3));
        resolve(unsub3);
      } catch (e2) { resolve(null); }
    }
  });
}

/* ----------------------
   Start transactions listener, tries multiple collection names
   ---------------------- */
async function startTransactionsListenerForUser(uid) {
  stopTransactionsListener();
  activeCollectionName = null;

  const candidates = ["Transaction", "transaction", "transactions", "Transactions"];

  for (const collName of candidates) {
    try {
      const unsub = await tryListenToCollection(collName, uid);
      if (typeof unsub === "function") {
        txUnsubscribe = unsub;
        activeCollectionName = collName;
        safeLog(`✅ Listening to transactions collection: "${collName}"`);
        return;
      } else safeLog(`No listener attached for "${collName}"`);
    } catch (e) { console.error("Error trying collection", collName, e); }
  }

  console.error("[TX-HISTORY] Could not attach transactions listener to any collection.");
  if (txListEl) txListEl.innerHTML = `<p class="text-center p-6 text-red-500">Could not load transactions. Check console for errors.</p>`;
}

/* ----------------------
   Public init: call this when user is available (after auth)
   ---------------------- */
function initTransactionsForCurrentUser() {
  const user = firebase.auth().currentUser;
  if (!user) return safeLog("initTransactionsForCurrentUser: no user signed in.");
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
    stopTransactionsListener();
    transactionsCache = [];
    renderTransactions([]);
  }
});

/* ----------------------
   Wire filter selects to client-side filter
   ---------------------- */
if (categoryEl) categoryEl.addEventListener("change", (e) => applyFiltersClient(e.target.value, statusEl?.value || "All"));
if (statusEl) statusEl.addEventListener("change", (e) => applyFiltersClient(categoryEl?.value || "All", e.target.value));

/* ----------------------
   Debug helpers
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
  } catch (err) { console.error(`[TX-HISTORY DEBUG] Error listing docs:`, err); }
};
safeLog("Transactions module loaded. Waiting for auth to start listener.");

/* ----------------------
   Live transaction helper
   ---------------------- */
function addTransactionLive(tx) {
  transactionsCache.unshift(tx);
  renderTransactions(transactionsCache);
  updateTxRedDot(); // ✅ check red dot
}

/* ----------------------
   Transaction nav click to hide red dot
   ---------------------- */
document.addEventListener("DOMContentLoaded", () => {
document.getElementById("nav-transaction")?.addEventListener("click", () => {
    const txDot = document.getElementById("txDot");
    if (txDot) txDot.classList.add("hidden");

    const user = firebase.auth().currentUser;
    if (user) {
      firebase.firestore().collection('users').doc(user.uid)
        .update({ lastTxReadAt: firebase.firestore.FieldValue.serverTimestamp() })
        .catch(console.error);
    }
  });
});



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


/* ========== Overview (upgraded, hooked to your transactionsCache & user doc) ========== */

/* ======= Overview (Realtime KPIs + Success Rate) =======
   Replace old Overview/chart code with this block.
   Relies on collections: users, affiliateJobs, tasks,
   task_submissions, affiliate_submissions, TiktokInstagram, Whatsapp, Telegram.
================================================================= */
(function () {
  if (!window.firebase) {
    console.warn('Overview: Firebase not ready');
    return;
  }
  const db = firebase.firestore();

  // DOM helpers
  const $ = id => document.getElementById(id);
  const fmtNaira = (n) => {
    try { if (typeof window.fmtNaira === 'function') return window.fmtNaira(n); } catch (e) {}
    const v = Number(n || 0);
    return '₦' + v.toLocaleString();
  };
  const setText = (id, txt) => { const el = $(id); if (el) el.innerText = txt; };

  // state & unsub map
  const unsubs = {};
  let currentUserUid = null;
  let currentUsername = null;
  let currentIsPremium = false;

  // social task prices (as you specified)
  const SOCIAL_PRICES = { tiktok: 2000, whatsapp: 300, telegram: 300 };

  // helper to unsubscribe safely
  function safeUnsub(key) {
    try { if (unsubs[key]) { unsubs[key](); } } catch (e) {}
    unsubs[key] = null;
  }

  // main recompute (updates success ui)
  function updateSuccessUI(state) {
  const approvedCount = state.approvedSubmissionsCount || 0;
  const isPremium = !!state.isPremium;
  const social = state.social || { tiktok: 0, whatsapp: 0, telegram: 0 };

  const condA = approvedCount >= 200;
  const condB = isPremium;
  const condC = (social.tiktok >= 1 && social.whatsapp >= 1 && social.telegram >= 1);

  const met = (condA?1:0) + (condB?1:0) + (condC?1:0);
  const percent = Math.round((met / 3) * 100);

  // update circle
  const ring = document.getElementById('successRing');
  if (ring) {
    const dash = Math.max(0, Math.min(100, percent)) / 100 * 94;
    ring.setAttribute('stroke-dasharray', `${dash} 100`);
  }
  const sp = document.getElementById('successPercent');
  if (sp) sp.innerText = `${percent}%`;
}

  // utility: small animator for numeric KPIs (lightweight)
  function animateKPI(el, newVal, opts = {}) {
    if (!el) return;
    const duration = opts.duration || 400;
    const start = Number(el.dataset._num || el.innerText.replace(/[₦,\s]/g,'') || 0);
    const end = Number(newVal || 0);
    el.dataset._num = start;
    const t0 = performance.now();
    function step(t) {
      const p = Math.min(1, (t - t0) / duration);
      const cur = Math.round(start + (end - start) * p);
      el.dataset._num = cur;
      el.innerText = opts.currency ? fmtNaira(cur) : cur.toLocaleString();
      if (p < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }

  // update all KPI DOM fields from aggregated counters
  function renderKPIs(agg) {
    // agg keys: balance, jobsTotal, jobsApproved, jobsRejected, jobsOnreview
    // tasksTotal, tasksApproved, tasksRejected, tasksOnreview
    // referralsTotal, referralsPremium
    // social counts + paid
    // approvedSubmissionsCount (for success)
    agg = agg || {};

    // Balance
    const balEl = $('kpiBalance');
    if (balEl) {
      animateKPI(balEl, agg.balance || 0, { currency: true, duration: 700 });
    }

    // Jobs
    setText('kpiJobsTotal', (agg.jobsTotal || 0).toLocaleString());
    setText('kpiJobsApproved', (agg.jobsApproved || 0).toLocaleString());
    setText('kpiJobsRejected', (agg.jobsRejected || 0).toLocaleString());
    setText('kpiJobsOnreview', (agg.jobsOnreview || 0).toLocaleString());

    // Tasks
    setText('kpiTasksTotal', (agg.tasksTotal || 0).toLocaleString());
    setText('kpiTasksApproved', (agg.tasksApproved || 0).toLocaleString());
    setText('kpiTasksRejected', (agg.tasksRejected || 0).toLocaleString());
    setText('kpiTasksOnreview', (agg.tasksOnreview || 0).toLocaleString());

    // Referrals
    setText('kpiReferralsTotal', (agg.referralsTotal || 0).toLocaleString());
    setText('kpiReferralsTotalSmall', (agg.referralsTotal || 0).toLocaleString());
    setText('kpiReferralsPremium', (agg.referralsPremium || 0).toLocaleString());

    // Social tasks
    setText('socialTiktokCount', (agg.socialTiktok || 0).toLocaleString());
    setText('socialWhatsappCount', (agg.socialWhatsapp || 0).toLocaleString());
    setText('socialTelegramCount', (agg.socialTelegram || 0).toLocaleString());

    setText('socialTiktokPaid', fmtNaira((agg.socialTiktok || 0) * SOCIAL_PRICES.tiktok));
    setText('socialWhatsappPaid', fmtNaira((agg.socialWhatsapp || 0) * SOCIAL_PRICES.whatsapp));
    setText('socialTelegramPaid', fmtNaira((agg.socialTelegram || 0) * SOCIAL_PRICES.telegram));

    setText('socialTotalPaid', fmtNaira(((agg.socialTiktok || 0) * SOCIAL_PRICES.tiktok) + ((agg.socialWhatsapp || 0) * SOCIAL_PRICES.whatsapp) + ((agg.socialTelegram || 0) * SOCIAL_PRICES.telegram)));

    // success
    updateSuccessUI({
      approvedSubmissionsCount: agg.tasksApproved || 0,
      isPremium: agg.isPremium || false,
      social: { tiktok: agg.socialTiktok || 0, whatsapp: agg.socialWhatsapp || 0, telegram: agg.socialTelegram || 0 }
    });
  }

  // state aggregator
  const AGG = {
    balance: 0,
    jobsTotal: 0, jobsApproved: 0, jobsRejected: 0, jobsOnreview: 0,
    tasksTotal: 0, tasksApproved: 0, tasksRejected: 0, tasksOnreview: 0,
    referralsTotal: 0, referralsPremium: 0,
    socialTiktok: 0, socialWhatsapp: 0, socialTelegram: 0,
    isPremium: false
  };

  // ---------- LISTENERS per collection ----------
  function attachUserDocListener(uid) {
    safeUnsub('userDoc');
    try {
      const ref = db.collection('users').doc(uid);
      unsubs.userDoc = ref.onSnapshot(doc => {
        if (!doc.exists) return;
        const d = doc.data() || {};
        AGG.balance = Number(d.balance || 0);
        AGG.isPremium = !!d.is_Premium;
        currentIsPremium = AGG.isPremium;

        // username used to find referrals (if available)
        const newUsername = d.username || d.name || null;
        if (newUsername && newUsername !== currentUsername) {
          currentUsername = newUsername;
          attachReferralsListener(newUsername);
        } else if (!newUsername) {
          // fallback: check users where referrer == uid too (someone might have stored uid instead)
          attachReferralsListenerFallback(uid);
        }

        renderKPIs(AGG);
      }, err => console.warn('userDoc onSnapshot err', err));
    } catch (e) { console.warn('attachUserDocListener failed', e); }
  }

  function attachReferralsListener(username) {
    safeUnsub('referrals');
    if (!username) return;
    try {
      const q = db.collection('users').where('referrer', '==', username);
      unsubs.referrals = q.onSnapshot(snap => {
        AGG.referralsTotal = snap.size || 0;
        AGG.referralsPremium = snap.docs.filter(d => !!d.data().is_Premium).length;
        renderKPIs(AGG);
      }, err => console.warn('referrals listener err', err));
    } catch (e) { console.warn('attachReferralsListener err', e); }
  }

  // fallback: users who set referrer == uid (rare, but safe)
  function attachReferralsListenerFallback(uid) {
    safeUnsub('referrals');
    try {
      const q = db.collection('users').where('referrer', '==', uid);
      unsubs.referrals = q.onSnapshot(snap => {
        AGG.referralsTotal = snap.size || 0;
        AGG.referralsPremium = snap.docs.filter(d => !!d.data().is_Premium).length;
        renderKPIs(AGG);
      }, err => console.warn('referrals fallback err', err));
    } catch (e) { console.warn('attachReferralsListenerFallback err', e); }
  }

  // jobs posted by user (affiliateJobs + tasks)
  function attachJobsListeners(uid) {
    safeUnsub('affJobs'); safeUnsub('taskJobs');
    try {
      unsubs.affJobs = db.collection('affiliateJobs').where('postedBy.uid', '==', uid).onSnapshot(snap => {
        const docs = snap.docs.map(d => d.data() || {});
        const approved = docs.filter(d => (d.status || '').toLowerCase() === 'approved').length;
        const rejected = docs.filter(d => (d.status || '').toLowerCase() === 'rejected').length;
        const onreview = snap.size - approved - rejected;
        AGG.jobsApproved_aff = approved;
        AGG.jobsRejected_aff = rejected;
        AGG.jobsOnreview_aff = onreview;
        recomputeJobsTotals();
      }, err => console.warn('affiliateJobs listener', err));
    } catch (e) { console.warn('attach affJobs err', e); }

    try {
      unsubs.taskJobs = db.collection('tasks').where('postedBy.uid', '==', uid).onSnapshot(snap => {
        const docs = snap.docs.map(d => d.data() || {});
        const approved = docs.filter(d => (d.status || '').toLowerCase() === 'approved').length;
        const rejected = docs.filter(d => (d.status || '').toLowerCase() === 'rejected').length;
        const onreview = snap.size - approved - rejected;
        AGG.jobsApproved_task = approved;
        AGG.jobsRejected_task = rejected;
        AGG.jobsOnreview_task = onreview;
        recomputeJobsTotals();
      }, err => console.warn('tasks (posted) listener', err));
    } catch (e) { console.warn('attach taskJobs err', e); }
  }

  function recomputeJobsTotals() {
    const affTotal = (AGG.jobsApproved_aff || 0) + (AGG.jobsRejected_aff || 0) + (AGG.jobsOnreview_aff || 0);
    const taskTotal = (AGG.jobsApproved_task || 0) + (AGG.jobsRejected_task || 0) + (AGG.jobsOnreview_task || 0);
    AGG.jobsTotal = affTotal + taskTotal;
    AGG.jobsApproved = (AGG.jobsApproved_aff || 0) + (AGG.jobsApproved_task || 0);
    AGG.jobsRejected = (AGG.jobsRejected_aff || 0) + (AGG.jobsRejected_task || 0);
    AGG.jobsOnreview = (AGG.jobsOnreview_aff || 0) + (AGG.jobsOnreview_task || 0);
    renderKPIs(AGG);
  }

  // task submissions by user (task_submissions + affiliate_submissions)
  function attachTaskSubmissionListeners(uid) {
    safeUnsub('taskSub'); safeUnsub('affSub');

    try {
      unsubs.taskSub = db.collection('task_submissions').where('userId', '==', uid).onSnapshot(snap => {
        const docs = snap.docs.map(d => d.data() || {});
        const approved = docs.filter(d => (d.status || '').toLowerCase() === 'approved').length;
        const rejected = docs.filter(d => (d.status || '').toLowerCase() === 'rejected').length;
        const onreview = snap.size - approved - rejected;
        AGG.tasks_task_sub_total = snap.size;
        AGG.tasks_task_sub_approved = approved;
        AGG.tasks_task_sub_rejected = rejected;
        AGG.tasks_task_sub_onreview = onreview;
        recomputeTasksTotals();
      }, err => console.warn('task_submissions listener', err));
    } catch (e) { console.warn('attach task_sub err', e); }

    try {
      unsubs.affSub = db.collection('affiliate_submissions').where('userId', '==', uid).onSnapshot(snap => {
        const docs = snap.docs.map(d => d.data() || {});
        const approved = docs.filter(d => (d.status || '').toLowerCase() === 'approved').length;
        const rejected = docs.filter(d => (d.status || '').toLowerCase() === 'rejected').length;
        const onreview = snap.size - approved - rejected;
        AGG.tasks_aff_sub_total = snap.size;
        AGG.tasks_aff_sub_approved = approved;
        AGG.tasks_aff_sub_rejected = rejected;
        AGG.tasks_aff_sub_onreview = onreview;
        recomputeTasksTotals();
      }, err => console.warn('affiliate_submissions listener', err));
    } catch (e) { console.warn('attach affiliate_sub err', e); }
  }

  function recomputeTasksTotals() {
    AGG.tasksTotal = (AGG.tasks_task_sub_total || 0) + (AGG.tasks_aff_sub_total || 0);
    AGG.tasksApproved = (AGG.tasks_task_sub_approved || 0) + (AGG.tasks_aff_sub_approved || 0);
    AGG.tasksRejected = (AGG.tasks_task_sub_rejected || 0) + (AGG.tasks_aff_sub_rejected || 0);
    AGG.tasksOnreview = (AGG.tasks_task_sub_onreview || 0) + (AGG.tasks_aff_sub_onreview || 0);
    renderKPIs(AGG);
  }

  // Social tasks — these are saved per-user with doc id = uid in your code
  function attachSocialListeners(uid) {
    safeUnsub('tiktokDoc'); safeUnsub('whatsappDoc'); safeUnsub('telegramDoc');

    try {
      unsubs.tiktokDoc = db.collection('TiktokInstagram').doc(uid).onSnapshot(doc => {
        AGG.socialTiktok = (doc.exists && (doc.data().status || '').toLowerCase() === 'approved') ? 1 : 0;
        renderKPIs(AGG);
      }, err => console.warn('TiktokInstagram onSnapshot', err));
    } catch (e) { console.warn('attach tiktok err', e); }

    try {
      unsubs.whatsappDoc = db.collection('Whatsapp').doc(uid).onSnapshot(doc => {
        AGG.socialWhatsapp = (doc.exists && (doc.data().status || '').toLowerCase() === 'approved') ? 1 : 0;
        renderKPIs(AGG);
      }, err => console.warn('Whatsapp onSnapshot', err));
    } catch (e) { console.warn('attach whatsapp err', e); }

    try {
      unsubs.telegramDoc = db.collection('Telegram').doc(uid).onSnapshot(doc => {
        AGG.socialTelegram = (doc.exists && (doc.data().status || '').toLowerCase() === 'approved') ? 1 : 0;
        renderKPIs(AGG);
      }, err => console.warn('Telegram onSnapshot', err));
    } catch (e) { console.warn('attach telegram err', e); }
  }

  // call this to detach everything (on sign-out)
  function detachAll() {
    ['userDoc','referrals','affJobs','taskJobs','taskSub','affSub','tiktokDoc','whatsappDoc','telegramDoc'].forEach(k => safeUnsub(k));
  }

  // Auth hook: start listeners when user signs in
  firebase.auth().onAuthStateChanged(user => {
    if (!user) {
      detachAll();
      currentUserUid = null;
      currentUsername = null;
      // reset UI to zeros
      renderKPIs({
        balance: 0, jobsTotal:0, jobsApproved:0, jobsRejected:0, jobsOnreview:0,
        tasksTotal:0, tasksApproved:0, tasksRejected:0, tasksOnreview:0,
        referralsTotal:0, referralsPremium:0,
        socialTiktok:0, socialWhatsapp:0, socialTelegram:0,
        isPremium:false
      });
      return;
    }

    currentUserUid = user.uid;
    // attach user doc listener which will trigger referrals setting once username resolved
    attachUserDocListener(user.uid);

    // attach jobs listeners
    attachJobsListeners(user.uid);

    // attach task submission listeners
    attachTaskSubmissionListeners(user.uid);

    // attach social doc listeners
    attachSocialListeners(user.uid);
  });

  // manual refresh button (re-reads caches by re-attaching listeners quickly)
  const refreshBtn = $('overviewRefreshBtn');
  if (refreshBtn) refreshBtn.addEventListener('click', () => {
    if (!currentUserUid) return;
    // simply reattach listeners to force a fresh snapshot read
    attachUserDocListener(currentUserUid);
    attachJobsListeners(currentUserUid);
    attachTaskSubmissionListeners(currentUserUid);
    attachSocialListeners(currentUserUid);
  });

  // initial render (in case DOM ready)
  renderKPIs(AGG);
})();









                                                            // GLOBALS CHAT ASSISTANT LOGIC








		  
<!-- Chat + guide script (Replace any old script block) -->

/* Globals AI Chat v2 - frontend
   - Server proxy at /api/ai-chat
   - Local fallback if server fails
*/

const CHAT_API = '/api/ai-chat'; // server-side proxy
const chatHistory = [];         // small local history (kept short)

// GUIDES (ebook removed)
const GUIDES = {
  paymentHelp: `
    <h3 class="font-semibold text-lg mb-2">💵 Payment Steps</h3>
    <ol class="list-decimal ml-5 space-y-1 text-sm">
      <li>Open Dashboard → Payment → Deposit.</li>
      <li>Choose your method (Card, Bank transfer, USSD).</li>
      <li>Enter amount and follow the payment provider UI.</li>
      <li>If funds don't reflect: upload proof or contact support (Transactions → Upload proof).</li>
    </ol>
    <p class="mt-2 text-xs text-gray-500">Tip: Double-check account details before sending money.</p>
  `,
  withdrawalHelp: `
    <h3 class="font-semibold text-lg mb-2">🏧 Withdrawal Steps</h3>
    <ol class="list-decimal ml-5 space-y-1 text-sm">
      <li>Open Dashboard → Withdraw.</li>
      <li>Enter amount and choose a saved bank account.</li>
      <li>Confirm with your PIN.</li>
      <li>Processing usually 1–3 business days.</li>
    </ol>
    <p class="mt-2 text-xs text-gray-500">If it fails, check account details or contact support with transaction ID.</p>
  `,
  taskHelp: `
    <h3 class="font-semibold text-lg mb-2">✅ Task Guide</h3>
    <ol class="list-decimal ml-5 space-y-1 text-sm">
      <li>Go to Tasks → Read instructions carefully.</li>
      <li>Complete exactly as described and submit proof if required.</li>
      <li>Wait for approval — approved tasks credit automatically.</li>
    </ol>
  `,
  referralHelp: `
    <h3 class="font-semibold text-lg mb-2">👥 Referral & Team</h3>
    <ul class="list-disc ml-5 space-y-1 text-sm">
      <li>1st level commission: ₦1,700 per referred user.</li>
      <li>2nd level: ₦500 per referred user.</li>
      <li>Share your referral link from the Team page.</li>
    </ul>
  `,
  aiContent: `
    <h3 class="font-semibold text-lg mb-2">🧠 AI Support</h3>
    <p class="text-sm">Ask about Payments, Withdrawals, Tasks, Referrals, Account issues, Transactions, Watch Ads, Spin, or Premium.</p>
    <div class="mt-3 text-sm">
      <p><strong>Quick FAQ</strong></p>
      <ul class="list-disc ml-5 mt-2">
        <li>How to deposit? — Dashboard → Payment → Deposit.</li>
        <li>Why didn't my withdrawal go through? — Check account details & transaction history.</li>
        <li>How many ads can I watch? — Ads reset per policy; watch page shows limits.</li>
      </ul>
    </div>
  `,
  accountHelp: `
    <h3 class="font-semibold text-lg mb-2">🔐 Account & Login</h3>
    <ul class="list-disc ml-5 space-y-1 text-sm">
      <li>Forgot password? Use the "Forgot password" link on login to reset via email/phone.</li>
      <li>To update profile picture or name: My Profile → Edit.</li>
      <li>For PIN issues, go to Settings → Security.</li>
    </ul>
  `,
  transactionsHelp: `
    <h3 class="font-semibold text-lg mb-2">📂 Transactions</h3>
    <p class="text-sm">Go to Transactions to see deposits, withdrawals, and purchases. Tap any item to see details and upload proofs.</p>
  `,
  adsHelp: `
    <h3 class="font-semibold text-lg mb-2">🎬 Watch Ads</h3>
    <ul class="list-disc ml-5 space-y-1 text-sm">
      <li>If a video doesn't play, try switching network or clear cache and retry.</li>
      <li>Ad credits appear after completion; if missing, tap "report" on the ad card with a screenshot.</li>
    </ul>
  `,
  spinHelp: `
    <h3 class="font-semibold text-lg mb-2">🎡 Spin & Rewards</h3>
    <p class="text-sm">Daily spin resets per user policy. Boosts or extra spins come from packages or promotions.</p>
  `,
  premiumHelp: `
    <h3 class="font-semibold text-lg mb-2">👑 Premium</h3>
    <p class="text-sm">Go Premium to unlock boosted tasks, more ads, priority support, and deposit bonuses.</p>
  `,
  errorsHelp: `
    <h3 class="font-semibold text-lg mb-2">🛠 Troubleshooting</h3>
    <ul class="list-disc ml-5 space-y-1 text-sm">
      <li>App not responding? Clear cache or reload the page.</li>
      <li>Payment failed? Verify your bank details & transaction ID, then contact support.</li>
      <li>Still stuck? Send a message in chat and include screenshots (attach via Upload button).</li>
    </ul>
  `
};

// DOM helpers
function appendUserBubble(msg){
  const chat = document.getElementById("chatMessages");
  const safe = escapeHtml(msg).replace(/\n/g,'<br/>');
  chat.insertAdjacentHTML('beforeend', `<div class="flex justify-end mb-3 animate-fade-in"><div class="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-3 rounded-2xl max-w-xs text-sm shadow">${safe}</div></div>`);
  chat.scrollTop = chat.scrollHeight;
}
function appendAssistantBubble(html){
  const chat = document.getElementById("chatMessages");
  chat.insertAdjacentHTML('beforeend', `<div class="flex justify-start mb-3 animate-fade-in"><div class="bg-white border p-3 rounded-2xl max-w-xs text-sm shadow text-gray-800">${html}</div></div>`);
  chat.scrollTop = chat.scrollHeight;
}
function showTypingIndicator(){
  const chat = document.getElementById("chatMessages");
  if (document.getElementById("typing-indicator")) return;
  chat.insertAdjacentHTML('beforeend', `<div id="typing-indicator" class="flex justify-start mb-3"><div class="bg-white border p-3 rounded-2xl shadow flex gap-1"><span class="dot w-2 h-2 bg-gray-400 rounded-full animate-bounce"></span><span class="dot w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-150"></span><span class="dot w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-300"></span></div></div>`);
  chat.scrollTop = chat.scrollHeight;
}
function hideTypingIndicator(){ const el = document.getElementById("typing-indicator"); if (el) el.remove(); }
function escapeHtml(t){ const div = document.createElement('div'); div.innerText = t; return div.innerHTML; }

// small local fallback responder
function localAssistantResponse(text){
  const t = (text || '').toLowerCase();
  if (["hi","hello","hey"].some(x=>t.startsWith(x))) {
    return `
      👋 Hi! How can I help? <br/>
      <div class="mt-2 flex gap-2 flex-wrap">
        <button onclick="suggestionClick('paymentHelp')" class="px-3 py-1 rounded-lg border text-sm">Payments</button>
        <button onclick="suggestionClick('withdrawalHelp')" class="px-3 py-1 rounded-lg border text-sm">Withdrawals</button>
        <button onclick="suggestionClick('taskHelp')" class="px-3 py-1 rounded-lg border text-sm">Tasks</button>
        <button onclick="suggestionClick('referralHelp')" class="px-3 py-1 rounded-lg border text-sm">Referral</button>
      </div>
    `;
  }

  const map = {
    paymentHelp: ["pay","payment","deposit","topup"],
    withdrawalHelp: ["withdraw","withdrawal","bank"],
    taskHelp: ["task","earn","complete"],
    referralHelp: ["refer","referral","team","invite"],
    adsHelp: ["ad","ads","watch"],
    spinHelp: ["spin","wheel"],
    premiumHelp: ["premium","go premium"],
    accountHelp: ["login","password","account","pin"],
    transactionsHelp: ["transaction","transactions","receipt","history"],
    errorsHelp: ["error","bug","issue","problem"]
  };

  for (const [key, kws] of Object.entries(map)) {
    if (kws.some(k => t.includes(k))) return GUIDES[key];
  }

  return `
    I didn't find that topic. Try one of these:
    <div class="mt-2 flex gap-2 flex-wrap">
      <button onclick="suggestionClick('paymentHelp')" class="px-3 py-1 rounded-lg border text-sm">Payments</button>
      <button onclick="suggestionClick('withdrawalHelp')" class="px-3 py-1 rounded-lg border text-sm">Withdrawals</button>
      <button onclick="suggestionClick('taskHelp')" class="px-3 py-1 rounded-lg border text-sm">Tasks</button>
    </div>
  `;
}

// show static guides
function suggestionClick(topic){
  appendUserBubble(topicLabel(topic));
  appendAssistantBubble(GUIDES[topic] || "No info found.");
}
function topicLabel(topic){
  const labels = {
    paymentHelp: "Payment Steps",
    withdrawalHelp: "Withdrawal Steps",
    taskHelp: "Task Guide",
    referralHelp: "Referral & Team",
    accountHelp: "Account Help",
    transactionsHelp: "Transactions",
    adsHelp: "Watch Ads",
    spinHelp: "Spin & Rewards",
    premiumHelp: "Premium",
    errorsHelp: "Troubleshooting",
    aiContent: "AI Support"
  };
  return labels[topic] || topic;
}

/* ---------- Chat send (server proxy) ---------- */
async function sendMessage() {
  const input = document.getElementById("userMessage");
  const msg = (input?.value || '').trim();
  if (!msg) return;
  input.value = '';
  appendUserBubble(msg);
  showTypingIndicator();

  // push to local history (keep last ~8)
  chatHistory.push({ role: 'user', content: msg });
  if (chatHistory.length > 16) chatHistory.splice(0, chatHistory.length - 16);

  try {
    const res = await fetch(CHAT_API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: msg, history: chatHistory })
    });

    const payload = await res.json();
    hideTypingIndicator();

    if (!res.ok) {
      console.warn('AI service error', payload);
      throw new Error(payload?.error || 'AI service error');
    }

    const reply = payload?.reply || payload?.message || '';
    if (!reply) {
      throw new Error('Empty AI reply');
    }

    appendAssistantBubble(escapeHtml(reply).replace(/\n/g,'<br/>'));
    chatHistory.push({ role: 'assistant', content: reply });
    if (chatHistory.length > 16) chatHistory.splice(0, chatHistory.length - 16);

  } catch (err) {
    console.error('Chat error', err);
    hideTypingIndicator();
    appendAssistantBubble(`<div class='text-red-500 text-sm'>⚠️ AI unavailable — showing local help.</div>`);
    const fallback = localAssistantResponse(msg);
    appendAssistantBubble(fallback);
    chatHistory.push({ role: 'assistant', content: fallback });
  }
}

/* ---------- Open topic / guide / chat overlay helpers ---------- */
(function(){
  const guideKeys = Object.keys(GUIDES);

  window.openAiTopic = function(topic){
    const guideContainer = document.getElementById('guideContainer');
    const chatContainer = document.getElementById('chatContainer');

    if (topic === 'chat') {
      if (!chatContainer) return;
      chatContainer.classList.remove('hidden');
      setTimeout(()=> {
        chatContainer.classList.remove('translate-y-full');
        chatContainer.classList.add('translate-y-0');
      }, 10);
      setTimeout(()=> {
        const input = document.getElementById('userMessage');
        if (input) input.focus();
        appendAssistantBubble(localAssistantResponse('hi'));
      }, 120);
      return;
    }

    if (guideKeys.includes(topic) && guideContainer) {
      guideContainer.innerHTML = GUIDES[topic] || 'No info found.';
      guideContainer.classList.remove('hidden');
      if (chatContainer && !chatContainer.classList.contains('hidden')) {
        chatContainer.classList.add('translate-y-full');
        setTimeout(()=> chatContainer.classList.add('hidden'), 300);
      }
      setTimeout(()=> guideContainer.scrollIntoView({behavior:'smooth'}), 40);
      return;
    }

    // fallback open chat
    openAiTopic('chat');
  };

  window.closeChat = function(){
    const chatContainer = document.getElementById('chatContainer');
    if (!chatContainer) return;
    chatContainer.classList.add('translate-y-full');
    setTimeout(()=> chatContainer.classList.add('hidden'), 300);
  };

  // minimal activateTab fallback if not present
  if (typeof window.activateTab === 'undefined') {
    window.activateTab = function(tabId){
      document.querySelectorAll('.tab-section').forEach(el=>el.classList.add('hidden'));
      const el = document.getElementById(tabId);
      if (el) el.classList.remove('hidden');
    };
  }

  // attach UI handlers
  document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('sendBtn')?.addEventListener('click', sendMessage);
    const input = document.getElementById('userMessage');
    input?.addEventListener('keydown', e => {
      if (e.key === 'Enter') { e.preventDefault(); sendMessage(); }
    });
  });
})();
 















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

















                                   // PREMIUM FUNCTION 1


document.addEventListener("DOMContentLoaded", async () => {
  
  const premiumBanner = document.querySelector(".go-premium-banner");

  // Hide the banner immediately until we confirm user state
  if (premiumBanner) premiumBanner.style.display = "none";

  auth.onAuthStateChanged(async (user) => {
    if (!user) return; // Not logged in

    try {
      const userRef = db.collection("users").doc(user.uid);
      const userSnap = await userRef.get();

      if (userSnap.exists) {
        const userData = userSnap.data();

        if (userData.is_Premium === true) {
          // User is premium — never show banner
          if (premiumBanner) premiumBanner.remove();
        } else {
          // Not premium — show banner immediately (no flicker)
          if (premiumBanner) premiumBanner.style.display = "block";
        }
      } else {
        // If no user data found, still show banner safely
        if (premiumBanner) premiumBanner.style.display = "block";
      }
    } catch (error) {
      console.error("Error checking premium status:", error);
      if (premiumBanner) premiumBanner.style.display = "block"; // Fallback
    }
  });
});





                      
                                   // PREMIUM FUNCTION 2

// IDs of sections that require premium
const premiumRequiredSections = [
  "whatsapp-task",
  "tiktok-task",
  "checkin-btn",
  "aiHelpCenter",
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

function initTaskSection() {
	
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
  const selectedCategoryRaw = (filterSelect && filterSelect.value) ? filterSelect.value : "";
  const selectedCategory = selectedCategoryRaw.toString().trim().toLowerCase();

  taskContainer.innerHTML = "";

  tasks
    .filter(task => {
      const taskCategory = (task.category || "").toString().trim().toLowerCase();
      const matchesCategory = selectedCategory === "" || taskCategory === selectedCategory;
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

}









	
                                    //AFFILIATE 

(function(){
  'use strict';

  // Single-instance guard
  if (window.__AFF2_INSTANCE__) { console.warn('[AFF2] Instance already present — skipping second init.'); return; }

  // tiny helpers
  const safeText = s => String(s||'')
    .replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'","&#39;");
  const formatNaira = n => (n==null||isNaN(Number(n))) ? '₦0' : '₦'+Number(n).toLocaleString('en-NG');
  const el = id => document.getElementById(id);

  // Defensive firebase pick
  const firebaseAvailable = !!(window.firebase && window.firebase.firestore);
  const db = firebaseAvailable ? window.firebase.firestore() : null;
  const auth = (window.firebase && window.firebase.auth) ? window.firebase.auth() : null;

  // Realtime multiplexer: coalesces identical queries so we don't attach duplicate onSnapshots
  function RealtimeMultiplexer(db) {
    const registry = new Map();
    return {
      subscribe(key, buildQueryFn, onUpdate) {
        if (!db) return () => {};
        if (registry.has(key)) {
          const entry = registry.get(key);
          entry.subs.add(onUpdate);
          // call immediately with latest snapshot if available
          if (entry.latest) try{ onUpdate(entry.latest);}catch(e){console.error(e)}
          return () => {
            entry.subs.delete(onUpdate);
            if (entry.subs.size===0) {
              try{ entry.unsub && entry.unsub(); }catch(_){}
              registry.delete(key);
            }
          };
        }
        // create new listener
        const subs = new Set([onUpdate]);
        let latest = null;
        let unsub = null;
        try {
          const q = buildQueryFn(db);
          unsub = q.onSnapshot(snap => {
            const arr = [];
            snap.forEach(d => arr.push({ id: d.id, ...d.data() }));
            latest = arr;
            for (const s of subs) try{ s(arr);}catch(e){console.error(e)}
          }, err => { console.error('[AFF2] multiplexer snapshot error', err); });
        } catch (err) { console.error('[AFF2] multiplexer build error', err); }
        registry.set(key, { subs, unsub, latest });
        return () => {
          const entry = registry.get(key);
          if (!entry) return;
          entry.subs.delete(onUpdate);
          if (entry.subs.size===0) { try{ entry.unsub && entry.unsub(); }catch(_){} registry.delete(key); }
        };
      }
    };
  }

  const multiplexer = db ? RealtimeMultiplexer(db) : null;

  // Module state
  const state = {
    instanceId: 'aff2_' + Math.random().toString(36).slice(2,9),
    unsubscribers: [],
    listeners: [],
    currentDetailJobId: null
  };

  // ======= RENDERERS (use DOM API, minimal innerHTML) =======
  function makeJobCard(job) {
    const accepted = Number(job.filledWorkers || 0);
    const total = Number(job.numWorkers || 0);
    const percent = total>0 ? Math.min(100, Math.round((accepted/total)*100)) : 0;
    const img = job.campaignLogoURL || job.image || '/assets/default-thumb.jpg';

    const wrap = document.createElement('div');
    wrap.className = 'bg-white rounded-2xl aff2-card p-3';

    const inner = document.createElement('div');
    inner.innerHTML = `
      <div class="overflow-hidden rounded-xl">
        <img src="${safeText(img)}" alt="${safeText(job.title||'')}" class="w-full h-36 object-cover rounded-xl" />
      </div>
      <div class="mt-3">
        <h4 class="font-semibold text-md">${safeText(job.title||'')}</h4>
        <div class="text-sm text-gray-500 mt-1">${formatNaira(job.workerPay)}</div>
        <div class="text-sm text-gray-500 mt-1">${accepted}/${total} workers · ${percent}%</div>
        <div class="w-full bg-gray-100 rounded-full h-2 overflow-hidden mt-3">
          <div style="width:${percent}%" class="h-2 rounded-full bg-blue-300 transition-all duration-300"></div>
        </div>
        <div class="mt-4 flex gap-2">
          <button class="flex-1 py-2 rounded-xl bg-blue-600 text-white font-semibold aff2_view_task aff2-clickable" data-id="${safeText(job.id)}">View Task</button>
        </div>
      </div>
    `;

    wrap.appendChild(inner);
    return wrap;
  }

  function renderGrid(jobs) {
    const grid = el('aff2_grid');
    if (!grid) return;
    // diff approach: simple replace for now to keep code robust and deterministic
    grid.innerHTML = '';
    if (!jobs || !jobs.length) {
      const empty = document.createElement('div');
      empty.className = 'col-span-2 p-6 bg-white rounded-xl aff2-card text-center';
      empty.textContent = 'No affiliate tasks right now.';
      grid.appendChild(empty);
      return;
    }
    const frag = document.createDocumentFragment();
    for (const j of jobs) frag.appendChild(makeJobCard(j));
    grid.appendChild(frag);
  }

  function makeFinishedCard(sub, jobTitle) {
    const wrap = document.createElement('div');
    wrap.className = 'p-4 bg-white rounded-xl shadow-sm flex items-center justify-between hover:shadow-md';
    const left = document.createElement('div');
    const h = document.createElement('h3'); h.className = 'font-semibold text-gray-900'; h.textContent = jobTitle || 'Affiliate Job';
    const p1 = document.createElement('p'); p1.className='text-sm text-gray-600'; p1.textContent = sub.status || '';
    const p2 = document.createElement('p'); p2.className='text-xs text-gray-400'; p2.textContent = (sub.postedAt && sub.postedAt.toDate) ? sub.postedAt.toDate().toLocaleString() : '';
    left.appendChild(h); left.appendChild(p1); left.appendChild(p2);

    const right = document.createElement('div'); right.className='flex flex-col gap-2 items-end';
    const btn = document.createElement('button'); btn.className='px-3 py-1 text-sm font-medium bg-blue-600 text-white rounded-lg aff2_view_finished aff2-clickable'; btn.dataset.id = sub.id; btn.textContent = 'View';
    right.appendChild(btn);

    wrap.appendChild(left); wrap.appendChild(right);
    return wrap;
  }

  function renderFinishedList(items, jobMap) {
    const listEl = el('aff2_finishedList'); if (!listEl) return;
    listEl.innerHTML = '';
    if (!items || items.length===0) { listEl.innerHTML = '<p class="text-center text-gray-500">You have no finished tasks.</p>'; return; }
    const frag = document.createDocumentFragment();
    let pending=0, approved=0;
    items.sort((a,b)=>((b.postedAt&&b.postedAt.seconds)||0)-((a.postedAt&&a.postedAt.seconds)||0));
    for (const it of items) {
      const s = (it.status||'').toLowerCase(); if (s==='approved') approved++; else pending++;
      frag.appendChild(makeFinishedCard(it, jobMap[it.jobId]?.title));
    }
    listEl.appendChild(frag);
    el('aff2_pendingCount') && (el('aff2_pendingCount').textContent = String(pending));
    el('aff2_approvedCount') && (el('aff2_approvedCount').textContent = String(approved));
  }

  // ======= SUBSCRIPTIONS =======
  // Jobs grid subscription (shared via multiplexer)
  function startJobsListener() {
    if (!multiplexer) return;
    const unsub = multiplexer.subscribe('aff2_jobs_approved', db=> db.collection('affiliateJobs').where('status','==','approved'), (jobs)=>{
      // sort for stable order by postedAt
      jobs.sort((a,b)=>((b.postedAt&&b.postedAt.seconds)||0)-((a.postedAt&&a.postedAt.seconds)||0));
      renderGrid(jobs);
    });
    state.unsubscribers.push(unsub);
  }

  // Finished tasks subscription for current user
  let finishedLocalUnsub = null;
  function startFinishedListenerForUser(uid) {
    if (!multiplexer || !uid) return;
    // factory returns a Query
    const key = 'aff2_finished_user_'+uid;
    // keep a short-lived local jobMap cache to render job titles
    const jobMapCache = {};
    const fetchJobMap = async (jobsIds) => {
      if (!db) return {};
      const unique = [...new Set(jobsIds||[])];
      if (!unique.length) return {};
      try {
        // Firestore doesn't allow >10 in where-in; chunk if needed
        const map = {};
        for (let i=0;i<unique.length;i+=10) {
          const chunk = unique.slice(i,i+10);
          const snap = await db.collection('affiliateJobs').where(window.firebase.firestore.FieldPath.documentId(), 'in', chunk).get();
          snap.forEach(d=> map[d.id] = d.data());
        }
        return map;
      } catch(err){ console.error('[AFF2] fetchJobMap',err); return {}; }
    };

    finishedLocalUnsub = multiplexer.subscribe(key, db=> db.collection('affiliate_submissions').where('userId','==',uid), async (items)=>{
      const jobIds = items.map(i=>i.jobId).filter(Boolean);
      const jm = await fetchJobMap(jobIds);
      renderFinishedList(items, jm);
    });
    state.unsubscribers.push(()=>{ finishedLocalUnsub && finishedLocalUnsub(); finishedLocalUnsub=null; });
  }

  // Job detail: subscribe for approved count
  let jobDetailUnsub = null;
  async function openJobDetail(jobId) {
    if (!db) { alert('Database not ready'); return; }
    try {
      const doc = await db.collection('affiliateJobs').doc(jobId).get();
      if (!doc.exists) { alert('Job not found'); return; }
      const job = { id: doc.id, ...doc.data() };
      state.currentDetailJobId = job.id;

      // render detail content (innerHTML for complex layout is ok here but safely encoded values)
      const container = el('aff2_jobDetailContent'); if (!container) return;
      container.innerHTML = '';
      const wrapper = document.createElement('div'); wrapper.className='bg-white rounded-2xl aff2-card overflow-hidden';
      const imgWrap = document.createElement('div'); imgWrap.className='relative';
      const banner = document.createElement('img'); banner.src = job.campaignLogoURL||job.image||'/assets/default-banner.jpg'; banner.className='w-full h-44 object-cover';
      const thumb = document.createElement('img'); thumb.src = job.campaignLogoURL||job.image||'/assets/default-thumb.jpg'; thumb.className='absolute -bottom-6 left-6 w-14 h-14 rounded-full border-4 border-white object-cover shadow';
      imgWrap.appendChild(banner); imgWrap.appendChild(thumb);
      wrapper.appendChild(imgWrap);

      const body = document.createElement('div'); body.className='p-5';
      body.innerHTML = `
        <div class="flex justify-between items-start"><div><h3 class="text-xl font-bold">${safeText(job.title||'Untitled')}</h3><p class="text-sm text-gray-500">${formatNaira(job.workerPay)} · ${Number(job.numWorkers||0)} workers</p></div></div>
        <div class="mt-3 text-gray-700">${safeText(job.instructions||'')}</div>
        <div class="mt-4"><div class="text-sm text-gray-500">Progress</div><div class="w-full bg-gray-100 rounded-full h-2 overflow-hidden mt-2"><div id="aff2_detailProgressBar" class="h-2 rounded-full bg-blue-400" style="width:0%"></div></div><div id="aff2_detailProgressText" class="text-sm text-gray-500 mt-2">0/0 (0%)</div></div>
        <hr class="my-4"/>
        <div><p class="text-sm text-gray-500 mb-2">Proofs required: <strong id="aff2_detailProofCount">${Number(job.proofFileCount||1)}</strong></p>
        <input id="aff2_detailProofFiles" type="file" multiple accept="image/*" class="mb-2 block w-full" />
        <textarea id="aff2_detailSubmissionNote" placeholder="Optional note..." class="w-full border rounded-md p-2 mb-2"></textarea>
        <div class="flex gap-2"><button id="aff2_detailSubmitBtn" data-job-id="${safeText(job.id)}" data-proof-count="${Number(job.proofFileCount||1)}" class="flex-1 py-3 rounded-xl bg-blue-600 text-white font-semibold">Submit Proof</button><button id="aff2_detailCancelBtn" class="py-3 px-4 rounded-xl bg-gray-100">Cancel</button></div>
        <p class="text-xs text-gray-400 mt-2">Submissions are reviewed by admin. Approved submissions will reflect here and in Finished Tasks.</p></div>
      `;

      wrapper.appendChild(body);
      container.appendChild(wrapper);

      // show/hide screens
      el('aff2_jobsContainer') && el('aff2_jobsContainer').classList.add('aff2-hidden');
      el('aff2_finishedScreen') && el('aff2_finishedScreen').classList.add('aff2-hidden');
      el('aff2_jobDetailScreen') && el('aff2_jobDetailScreen').classList.remove('aff2-hidden');

      // subscribe to approved count via multiplexer
      if (jobDetailUnsub) { jobDetailUnsub(); jobDetailUnsub = null; }
      jobDetailUnsub = multiplexer.subscribe('aff2_job_approved_'+job.id, d=> d.collection('affiliate_submissions').where('jobId','==',job.id).where('status','==','approved'), snap => {}); // NOTE: incorrect; factory must accept db; fixed below

    } catch (err) { console.error('[AFF2] openJobDetail error',err); alert('Failed to open job. Check console.'); }
  }

  // Because we need the multiplexer factory to receive db, re-define the approved subscription correctly
  async function openJobDetail_correct(jobId) {
    if (!db) { alert('Database not ready'); return; }
    try {
      const doc = await db.collection('affiliateJobs').doc(jobId).get();
      if (!doc.exists) { alert('Job not found'); return; }
      const job = { id: doc.id, ...doc.data() };
      state.currentDetailJobId = job.id;

      const container = el('aff2_jobDetailContent'); if (!container) return;
      // build UI (we call the same helper as above but avoid repeating too much)
      container.innerHTML = '';
      const wrapper = document.createElement('div'); wrapper.className='bg-white rounded-2xl aff2-card overflow-hidden';
      const imgWrap = document.createElement('div'); imgWrap.className='relative';
      const banner = document.createElement('img'); banner.src = job.campaignLogoURL||job.image||'/assets/default-banner.jpg'; banner.className='w-full h-44 object-cover';
      const thumb = document.createElement('img'); thumb.src = job.campaignLogoURL||job.image||'/assets/default-thumb.jpg'; thumb.className='absolute -bottom-6 left-6 w-14 h-14 rounded-full border-4 border-white object-cover shadow';
      imgWrap.appendChild(banner); imgWrap.appendChild(thumb);
      wrapper.appendChild(imgWrap);
      const body = document.createElement('div'); body.className='p-5';
      body.innerHTML = `
        <div class="flex justify-between items-start"><div><h3 class="text-xl font-bold">${safeText(job.title||'Untitled')}</h3><p class="text-sm text-gray-500">${formatNaira(job.workerPay)} · ${Number(job.numWorkers||0)} workers</p></div></div>
        <div class="mt-3 text-gray-700">${safeText(job.instructions||'')}</div>
        <div class="mt-4"><div class="text-sm text-gray-500">Progress</div><div class="w-full bg-gray-100 rounded-full h-2 overflow-hidden mt-2"><div id="aff2_detailProgressBar" class="h-2 rounded-full bg-blue-400" style="width:0%"></div></div><div id="aff2_detailProgressText" class="text-sm text-gray-500 mt-2">0/0 (0%)</div></div>
        <hr class="my-4"/>
        <div><p class="text-sm text-gray-500 mb-2">Proofs required: <strong id="aff2_detailProofCount">${Number(job.proofFileCount||1)}</strong></p>
        <input id="aff2_detailProofFiles" type="file" multiple accept="image/*" class="mb-2 block w-full" />
        <textarea id="aff2_detailSubmissionNote" placeholder="Optional note..." class="w-full border rounded-md p-2 mb-2"></textarea>
        <div class="flex gap-2"><button id="aff2_detailSubmitBtn" data-job-id="${safeText(job.id)}" data-proof-count="${Number(job.proofFileCount||1)}" class="flex-1 py-3 rounded-xl bg-blue-600 text-white font-semibold">Submit Proof</button><button id="aff2_detailCancelBtn" class="py-3 px-4 rounded-xl bg-gray-100">Cancel</button></div>
        <p class="text-xs text-gray-400 mt-2">Submissions are reviewed by admin. Approved submissions will reflect here and in Finished Tasks.</p></div>
      `;
      wrapper.appendChild(body);
      container.appendChild(wrapper);

      el('aff2_jobsContainer')?.classList.add('aff2-hidden');
      el('aff2_finishedScreen')?.classList.add('aff2-hidden');
      el('aff2_jobDetailScreen')?.classList.remove('aff2-hidden');

      // previously subscribed detail listener
      if (jobDetailUnsub) { try{ jobDetailUnsub(); }catch(_){} jobDetailUnsub=null; }

      // New subscription to count approved submissions. We use the multiplexer so if other modules subscribe to the same query they reuse the snapshot.
      jobDetailUnsub = multiplexer.subscribe('aff2_job_approved_'+job.id, (dbLocal)=> dbLocal.collection('affiliate_submissions').where('jobId','==',job.id).where('status','==','approved'), (arr)=>{
        const approvedCount = arr.length;
        const totalWorkers = Number(job.numWorkers||0);
        const percent = totalWorkers>0?Math.min(100, Math.round((approvedCount/totalWorkers)*100)):0;
        const bar = el('aff2_detailProgressBar'); if (bar && bar.style) bar.style.width = percent + '%';
        const tEl = el('aff2_detailProgressText'); if (tEl) tEl.textContent = `${approvedCount}/${totalWorkers} (${percent}%)`;
      });
      state.unsubscribers.push(jobDetailUnsub);

    } catch (err) { console.error('[AFF2] openJobDetail_correct',err); alert('Failed to open job. See console.'); }
  }

  // ======= UPLOAD helper (keeps identical behaviour to older module) =======
  async function uploadFileHelper(file) {
    if (!file) throw new Error('No file provided');
    if (typeof window.uploadToCloudinary === 'function') return await window.uploadToCloudinary(file);
    if (window.firebase && window.firebase.storage && auth && auth.currentUser) {
      const storageRef = window.firebase.storage().ref();
      const path = `affiliate_submissions/${auth.currentUser.uid}_${Date.now()}_${file.name}`;
      const ref = storageRef.child(path);
      await ref.put(file);
      return await ref.getDownloadURL();
    }
    throw new Error('No upload helper available. Add uploadToCloudinary(file) or enable firebase.storage.');
  }

  // ======= EVENT BINDINGS (container-scoped) =======
  const handlers = [];

  function bindEvents() {
    // Grid clicks
    const grid = el('aff2_grid');
    if (grid) {
      const onGridClick = (ev) => {
        const btn = ev.target.closest && ev.target.closest('.aff2_view_task');
        if (btn) {
          const id = btn.dataset.id;
          if (id) openJobDetail_correct(id);
        }
      };
      grid.addEventListener('click', onGridClick);
      handlers.push(()=>grid.removeEventListener('click', onGridClick));
    }

    // Finished list clicks
    const finList = el('aff2_finishedList');
    if (finList) {
      const onFinClick = (ev) => {
        const btn = ev.target.closest && ev.target.closest('.aff2_view_finished');
        if (!btn) return;
        const subId = btn.dataset.id;
        if (!subId) return;
        // open modal for submission details
        if (!db) { alert('Database not ready'); return; }
        db.collection('affiliate_submissions').doc(subId).get().then(doc=>{
          if (!doc.exists) { alert('Submission not found'); return; }
          const d = doc.data();
          const images = (d.proofURLs||[]).map(u=>{ const img=document.createElement('img'); img.src=u; img.className='w-full rounded-md mb-2'; return img; });
          const modal = document.createElement('div'); modal.className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4';
          const box = document.createElement('div'); box.className='bg-white rounded-xl shadow-lg p-4 w-full max-w-md max-h-[90vh] overflow-y-auto';
          const h = document.createElement('h3'); h.className='text-lg font-bold mb-2'; h.textContent='Submission Details';
          box.appendChild(h);
          const p1 = document.createElement('p'); p1.className='text-sm'; p1.innerHTML = `<strong>Status:</strong> ${safeText(d.status||'')}`;
          const p2 = document.createElement('p'); p2.className='text-sm'; p2.innerHTML = `<strong>Note:</strong> ${safeText(d.note||'')}`;
          box.appendChild(p1); box.appendChild(p2);
          const imagesWrap = document.createElement('div'); imagesWrap.className='mt-3';
          if (images.length) images.forEach(i=>imagesWrap.appendChild(i)); else imagesWrap.innerHTML='<p class="text-sm text-gray-400">No proof images</p>';
          box.appendChild(imagesWrap);
          const foot = document.createElement('div'); foot.className='mt-4 flex justify-end';
          const closeBtn = document.createElement('button'); closeBtn.className='closeFinishedBtn px-4 py-2 bg-blue-600 text-white rounded-lg'; closeBtn.textContent='Close';
          closeBtn.addEventListener('click', ()=>modal.remove());
          foot.appendChild(closeBtn); box.appendChild(foot);
          modal.appendChild(box); document.body.appendChild(modal);
        }).catch(err=>{ console.error('[AFF2] load submission',err); alert('Failed to load details'); });
      };
      finList.addEventListener('click', onFinClick);
      handlers.push(()=>finList.removeEventListener('click', onFinClick));
    }

    // top buttons
    const openFin = el('aff2_openFinishedBtn'); if (openFin) { const fn=()=>{ if (auth && auth.currentUser) startFinishedListenerForUser(auth.currentUser.uid); el('aff2_jobsContainer')?.classList.add('aff2-hidden'); el('aff2_jobDetailScreen')?.classList.add('aff2-hidden'); el('aff2_finishedScreen')?.classList.remove('aff2-hidden'); }; openFin.addEventListener('click', fn); handlers.push(()=>openFin.removeEventListener('click', fn)); }
    const backMain = el('aff2_backToMainBtn'); if (backMain) { const fn=()=>{ el('aff2_finishedScreen')?.classList.add('aff2-hidden'); el('aff2_jobsContainer')?.classList.remove('aff2-hidden'); if (typeof finishedLocalUnsub==='function') { finishedLocalUnsub(); finishedLocalUnsub=null; } }; backMain.addEventListener('click', fn); handlers.push(()=>backMain.removeEventListener('click', fn)); }
    const backToList = el('aff2_backToListBtn'); if (backToList) { const fn=()=>{ el('aff2_jobDetailScreen')?.classList.add('aff2-hidden'); el('aff2_jobsContainer')?.classList.remove('aff2-hidden'); if (jobDetailUnsub) { try{ jobDetailUnsub(); }catch(_){} jobDetailUnsub=null; } }; backToList.addEventListener('click', fn); handlers.push(()=>backToList.removeEventListener('click', fn)); }

    // Submit proof and cancel are in detail screen; use delegated listener on detail screen container
    const detailScreen = el('aff2_jobDetailContent');
    const onDetailClick = async (ev) => {
      const submitBtn = ev.target.closest && ev.target.closest('#aff2_detailSubmitBtn');
      if (submitBtn) {
        const jobId = submitBtn.dataset.jobId; if (!jobId) { alert('Job ID missing'); return; }
        if (!auth || !auth.currentUser) { alert('Login to submit proof.'); return; }
        const proofRequired = Number(submitBtn.dataset.proofCount||1);
        const filesInput = el('aff2_detailProofFiles'); const files = filesInput?.files || [];
        if (files.length !== proofRequired) { alert(`This job requires exactly ${proofRequired} file(s). You provided ${files.length}.`); return; }
        submitBtn.disabled = true; const prev = submitBtn.textContent; submitBtn.textContent = 'Uploading...';
        try {
          const uploads = [];
          for (let i=0;i<files.length;i++) uploads.push(uploadFileHelper(files[i]));
          const urls = await Promise.all(uploads);
          const payload = { jobId, userId: auth.currentUser.uid, userName: auth.currentUser.displayName || auth.currentUser.email || '', postedAt: (window.firebase&&window.firebase.firestore)?window.firebase.firestore.FieldValue.serverTimestamp():new Date(), proofURLs: urls, note: el('aff2_detailSubmissionNote')?.value||'', status: 'on review' };
          await db.collection('affiliate_submissions').add(payload);
          alert('✅ Proof submitted! It will be reviewed by admin.');
          el('aff2_backToListBtn')?.click();
        } catch (err) { console.error('[AFF2] submit',err); alert('Failed to submit proof. See console.'); }
        finally { submitBtn.disabled=false; submitBtn.textContent = prev; }
      }
      const cancelBtn = ev.target.closest && ev.target.closest('#aff2_detailCancelBtn');
      if (cancelBtn) { el('aff2_backToListBtn')?.click(); }
    };
    // attach even if detail container not present yet; delegate at root (safe and localized)
    const root = el('aff2_root'); if (root) { root.addEventListener('click', onDetailClick); handlers.push(()=>root.removeEventListener('click', onDetailClick)); }

    // search inputs
    const sInput = el('aff2_searchMain'); if (sInput) {
      let to=null; sInput.addEventListener('input', ()=>{ clearTimeout(to); to = setTimeout(()=>{ const q=sInput.value.trim().toLowerCase(); const grid = el('aff2_grid'); if (!grid) return; [...grid.children].forEach(card=>{ const txt=(card.innerText||'').toLowerCase(); card.style.display = txt.includes(q)?'':'none'; }); },170); }); handlers.push(()=>sInput.removeEventListener('input',null)); }
    const sf = el('aff2_searchFinished'); if (sf) { sf.addEventListener('input', ()=>{ const q=sf.value.trim().toLowerCase(); const list=el('aff2_finishedList'); if(!list) return; [...list.children].forEach(card=>{ const txt=(card.innerText||'').toLowerCase(); card.style.display = txt.includes(q)?'':'none'; }); }); handlers.push(()=>sf.removeEventListener('input',null)); }
  }

  // ======= AUTH CHANGES =======
  function attachAuthWatcher() {
    if (!auth) return;
    const onAuth = (u)=>{
      if (u) { startFinishedListenerForUser(u.uid); }
      else { if (typeof finishedLocalUnsub==='function') { finishedLocalUnsub(); finishedLocalUnsub=null; } const listEl=el('aff2_finishedList'); if (listEl) listEl.innerHTML='<p class="text-center text-gray-500">Login to see your finished tasks.</p>'; }
    };
    auth.onAuthStateChanged(onAuth);
    state.unsubscribers.push(()=>{/* no easy way to remove onAuthStateChanged callback in firebase v8-style; safe to leave */});
  }

  // ======= INIT / DESTROY =======
  function init() {
    // attach events
    bindEvents();
    // start jobs stream
    if (multiplexer) startJobsListener();
    // attach auth watcher (to start finished tasks listener when user logs in)
    attachAuthWatcher();
    console.log('[AFF2] initialized (id: '+state.instanceId+')');
  }

  function destroy() {
    // remove event handlers
    handlers.splice(0).forEach(un => { try{ un(); }catch(_){} });
    // unsubscribe realtime listeners
    state.unsubscribers.splice(0).forEach(un => { try{ un(); }catch(_){} });
    // reset UI (optional)
    const rootEl = el('aff2_root'); if (rootEl) rootEl.querySelectorAll('*').forEach(n=>n.removeEventListener && n.removeEventListener());
    // clear root sections back to initial state
    el('aff2_grid') && (el('aff2_grid').innerHTML='');
    el('aff2_finishedList') && (el('aff2_finishedList').innerHTML='');
    // clear module reference
    try{ delete window.__AFF2_INSTANCE__; }catch(_){ window.__AFF2_INSTANCE__ = null; }
    console.log('[AFF2] destroyed');
  }

  // auto-init on DOM ready
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();

  // expose a tiny API for control/debug
  const api = { init, destroy, openJob: openJobDetail_correct, id: state.instanceId };
  window.__AFF2_INSTANCE__ = api; // single global reference
  window.AffiliateV2 = api; // small convenience alias
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
															  

  lucide.createIcons();

  // 🔐 Logout functionality
  function logoutUser() {
    firebase.auth().signOut().then(() => {
      alert("Logged out successfully");
      window.location.href = "/"; // redirect to landing/login page
    }).catch((error) => {
      console.error("Logout Error:", error);
      alert("Error logging out. Try again.");
    });
  }







                                                       
														 



                                                              // EARNING Swiper Function




   

/* ====== Safe Balance Listener (no imports, no side effects) ====== */






(function (w, d) {
  // prevent double init
  if (w.__balanceCtrl && typeof w.__balanceCtrl.stop === "function") {
    w.__balanceCtrl.stop();
  }

  // small helpers
  function fmtNaira(n) {
    n = Number(n) || 0;
    return "₦" + n.toLocaleString();
  }
  function coerceNumber(val) {
  if (val == null) return 0;
  if (typeof val === "number") return isFinite(val) ? val : 0;
  var s = String(val).replace(/[₦,\s]/g, "");
  var n = parseFloat(s);   // <-- parseFloat to preserve decimals
  return isFinite(n) ? n : 0;
}
  function isVisible(el) {
    if (!el || !d.contains(el)) return false;
    return el.getClientRects().length > 0 && !(d.hidden);
  }

  // animateNumber (cancellable)
  function animateNumber(el, from, to, duration) {
  if (!el) return;
  if (!isVisible(el) || duration <= 0) {
    el.textContent = fmtNaira(to);
    return;
  }
  if (el.__rafId) cancelAnimationFrame(el.__rafId);
  var start = performance.now();
  var diff = to - from;
  var D = Math.max(200, duration || 800);

  function step(t) {
    var p = Math.min((t - start) / D, 1);
    var eased = 1 - Math.pow(1 - p, 3);
    // preserve 2 decimals
    var val = from + diff * eased;
    el.textContent = "₦" + val.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    if (p < 1) {
      el.__rafId = requestAnimationFrame(step);
    } else {
      el.__rafId = null;
    }
  }

  el.__rafId = requestAnimationFrame(step);
}

  // controller
  var ctrl = {
    auth: null,
    db: null,
    unsubUser: null,
    balanceEl: null,
    currentValue: 0,       // numeric: latest known balance from Firebase
    lastShownValue: 0,     // numeric: last numeric value that was displayed (used for animation-from)
    started: false,
    observer: null,
    isHidden: JSON.parse(localStorage.getItem('balanceHidden') || "false"),

    findEl: function () {
      return d.getElementById("balance");
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
        // seed currentValue from data-value or DOM text
        var seed = coerceNumber(el.dataset.value || el.textContent);
        this.currentValue = seed;
        this.lastShownValue = seed;
        // set element text to a formatted seed (but respect hidden state)
        if (this.isHidden) {
          el.textContent = "₦****";
        } else {
          el.textContent = fmtNaira(seed);
        }
      }
      // attach toggle button listener (if present)
      var toggleBtn = d.getElementById("toggleBalanceBtn");
      if (toggleBtn && !toggleBtn.__attached) {
        var self = this;
        toggleBtn.addEventListener('click', function () {
          self.toggleHidden();
        });
        toggleBtn.__attached = true;
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

    // core start
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
          if (self.unsubUser) { self.unsubUser(); self.unsubUser = null; }

          if (!user) {
            // clear UI if needed
            // keep last currentValue but hide UI
            return;
          }

          var ref = self.db.collection("users").doc(user.uid);
          self.unsubUser = ref.onSnapshot(function (snap) {
            if (!snap.exists) return;
            var next = coerceNumber(snap.data().balance);
            if (!isFinite(next)) return;

            // always store numeric value on dataset for other scripts
            if (self.balanceEl) self.balanceEl.dataset.value = String(next);

            // If element missing, cache value and wait
            if (!self.balanceEl) {
              self.currentValue = next;
              return;
            }

            // If value same, do nothing
            if (next === self.currentValue) return;

            // update currentValue (always)
            var oldValue = self.currentValue;
            self.currentValue = next;

            // If currently hidden -> do not animate visible change; just set masked text
            if (self.isHidden) {
              // update stored lastShownValue so when unhidden we animate correctly
              self.lastShownValue = next;
              self.balanceEl.textContent = "₦****";
            } else {
              // visible: animate from lastShownValue (or oldValue) -> next
              var from = self.lastShownValue || oldValue || 0;
              animateNumber(self.balanceEl, from, next, 700);
              self.lastShownValue = next;
            }
          }, function (err) {
            console.error("[balance] onSnapshot error:", err);
          });
        });
      });
    },

    // toggle hidden state
    toggleHidden: function () {
      this.isHidden = !this.isHidden;
      localStorage.setItem('balanceHidden', JSON.stringify(this.isHidden));
      // re-render element according to new state
      if (!this.balanceEl) return;
      if (this.isHidden) {
        // hide immediately
        this.balanceEl.textContent = "₦****";
      } else {
        // show: animate from lastShownValue (may equal currentValue already)
        var from = this.lastShownValue || 0;
        var to = this.currentValue || 0;
        animateNumber(this.balanceEl, from, to, 700);
        this.lastShownValue = to;
      }
      // update toggle icon (if present)
      var eye = d.getElementById('eyeIcon');
      if (eye) {
        if (this.isHidden) {
          eye.innerHTML = '<path stroke-linecap="round" stroke-linejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.269-2.943-9.543-7a10.05 10.05 0 012.037-3.368m3.226-2.335A9.953 9.953 0 0112 5c4.478 0 8.269 2.943 9.543 7a10.03 10.03 0 01-4.107 5.067M3 3l18 18"/>';
        } else {
          eye.innerHTML = '<path stroke-linecap="round" stroke-linejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.477 0 8.268 2.943 9.542 7-1.274 4.057-5.065 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/><circle cx="12" cy="12" r="3"/>';
        }
      }
      // update aria-pressed
      var tbtn = d.getElementById('toggleBalanceBtn');
      if (tbtn) tbtn.setAttribute('aria-pressed', this.isHidden ? 'true' : 'false');
    },

    // public setter (useful if you want to set value manually)
    setBalance: function (amount) {
      var n = coerceNumber(amount);
      this.currentValue = n;
      this.lastShownValue = n;
      if (this.balanceEl) {
        this.balanceEl.dataset.value = String(n);
        if (this.isHidden) {
          this.balanceEl.textContent = "₦****";
        } else {
          this.balanceEl.textContent = fmtNaira(n);
        }
      }
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

  // expose controller
  w.__balanceCtrl = ctrl;

  // init
  function boot() {
    ctrl.attachEl();
    ctrl.start();
    // ensure toggle button shows correct icon for startup state
    ctrl.toggleHidden();           // toggleHidden flips state, so flip twice to re-render correctly
    ctrl.toggleHidden();
    // expose convenience functions
    w.toggleBalance = function () { ctrl.toggleHidden(); };
    w.setBalance = function (amt) { ctrl.setBalance(amt); };
  }

  if (d.readyState === "loading") {
    d.addEventListener("DOMContentLoaded", boot, { once: true });
  } else {
    boot();
  }

  // cleanup
  w.addEventListener("beforeunload", function () { ctrl.stop(); });

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
      case 'watchAdsSection':   // match the ID in your HTML
  initWatchAdsSection();
  break;
      case 'payment':
        initPaymentSection();
        break;
      case 'taskSection':
        initTaskSection();
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








// === Fetch and Display Jobs (same as before) ===






// === Fetch and Display Jobs (FAST + LIVE) ===
function fetchAndDisplayUserJobs() {
  const jobList = document.getElementById("jobList");
  jobList.innerHTML = "<p class='text-center text-gray-500'>Loading your jobs...</p>";

  firebase.auth().onAuthStateChanged((user) => {
    if (!user) {
      jobList.innerHTML = '<p class="text-center text-gray-500">Please log in to see your posted jobs.</p>';
      return;
    }

    const uid = user.uid;
    let allJobs = [];

    // --- 🔹 Render Function
    function renderJobs() {
      if (!allJobs.length) {
        jobList.innerHTML = '<p class="text-center text-gray-500">You haven\'t posted any jobs yet.</p>';
        return;
      }
      allJobs.sort((a, b) => (b.postedAt?.toMillis?.() || 0) - (a.postedAt?.toMillis?.() || 0));
      jobList.innerHTML = allJobs.map(job => renderJobCard(job)).join("");
    }

    // --- 🔹 Helper to add/replace job in array
    function upsertJob(job) {
      const i = allJobs.findIndex(j => j.id === job.id && j.type === job.type);
      if (i > -1) {
        allJobs[i] = job;
      } else {
        allJobs.push(job);
      }
    }

    // --- 🔹 Watch Completed Submissions
    function watchCompletedCount(collection, job) {
      firebase.firestore().collection(collection)
        .where("jobId", "==", job.id)
        .onSnapshot(subSnap => {
          job.completed = subSnap.size;
          upsertJob(job);
          renderJobs();
        });
    }

    // --- 🔹 Listen to Tasks (live)
    firebase.firestore().collection("tasks")
      .where("postedBy.uid", "==", uid)
      .orderBy("postedAt", "desc")
      .onSnapshot(snapshot => {
        snapshot.docChanges().forEach(change => {
          if (change.type === "added" || change.type === "modified") {
            const job = { ...change.doc.data(), id: change.doc.id, type: "task" };
            watchCompletedCount("task_submissions", job);
            upsertJob(job);
          } else if (change.type === "removed") {
            allJobs = allJobs.filter(j => !(j.id === change.doc.id && j.type === "task"));
          }
        });
        renderJobs();
      });

    // --- 🔹 Listen to Affiliate Jobs (live)
    firebase.firestore().collection("affiliateJobs")
      .where("postedBy.uid", "==", uid)
      .orderBy("postedAt", "desc")
      .onSnapshot(snapshot => {
        snapshot.docChanges().forEach(change => {
          if (change.type === "added" || change.type === "modified") {
            const job = { ...change.doc.data(), id: change.doc.id, type: "affiliate" };
            watchCompletedCount("affiliate_submissions", job);
            upsertJob(job);
          } else if (change.type === "removed") {
            allJobs = allJobs.filter(j => !(j.id === change.doc.id && j.type === "affiliate"));
          }
        });
        renderJobs();
      });
  });
}

// === Job Card ===
function renderJobCard(job) {
  const status = job.status || "on review";
  const statusColor = status === "approved" ? "bg-green-100 text-green-700"
                   : status === "rejected" ? "bg-red-100 text-red-700"
                   : "bg-yellow-100 text-yellow-700";

  const jobTypeLabel = job.type === "task" ? "Task" : "Affiliate";
  const logo = job.type === "affiliate" ? job.campaignLogoURL : job.screenshotURL;

  return `
    <div class="p-5 rounded-2xl bg-white shadow-md border border-gray-200 hover:shadow-lg transition">
      <div class="flex justify-between items-center">
        <h3 class="text-lg font-semibold text-blue-900">${job.title || "Untitled Job"}</h3>
        <span class="px-3 py-1 rounded-full text-xs font-bold ${statusColor}">
          ${status.charAt(0).toUpperCase() + status.slice(1)}
        </span>
      </div>

      <div class="flex items-center gap-4 mt-3">
        ${logo ? `<img src="${logo}" class="w-14 h-14 rounded-lg object-cover border" />` : ""}
        <div>
          <p class="text-sm text-gray-500">${jobTypeLabel} • ${job.category || "Uncategorized"}</p>
          <p class="text-sm text-gray-700"><span class="font-semibold">Workers:</span> ${job.completed || 0}/${job.numWorkers || 0}</p>
        </div>
      </div>

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
    </div>
  `;
}

// === Job Details Page (LIVE) ===
function checkJobDetails(jobId, jobType) {
  const collection = jobType === "task" ? "tasks" : "affiliateJobs";

  firebase.firestore().collection(collection).doc(jobId)
    .onSnapshot(doc => {
      if (!doc.exists) return;

      const job = { ...doc.data(), id: doc.id, type: jobType };

      // watch completed count live
      firebase.firestore().collection(jobType === "task" ? "task_submissions" : "affiliate_submissions")
        .where("jobId", "==", job.id)
        .onSnapshot(subSnap => {
          job.completed = subSnap.size;
          renderJobDetails(job);
        });
    });

  activateTab("jobDetailsSection");
}

// === Render Job Details ===
function renderJobDetails(job) {
  const progress = job.numWorkers ? Math.round((job.completed / job.numWorkers) * 100) : 0;

  let content = `
    ${job.campaignLogoURL || job.screenshotURL ? `<img src="${job.campaignLogoURL || job.screenshotURL}" class="w-full h-48 object-cover rounded-xl" />` : ""}
    <h4 class="text-lg font-bold text-blue-900 mt-3">${job.title || "Untitled Job"}</h4>
    <p class="text-gray-600 text-sm">${job.category || "Uncategorized"}</p>

    <div class="mt-3 grid grid-cols-2 gap-4 text-sm text-gray-700">
      <div><span class="font-semibold">Cost:</span> ₦${job.total || 0}</div>
      <div><span class="font-semibold">Worker Pay:</span> ₦${job.workerEarn || job.workerPay || 0}</div>
      <div><span class="font-semibold">Completed:</span> ${job.completed}/${job.numWorkers || 0}</div>
      <div><span class="font-semibold">Posted:</span> ${job.postedAt?.toDate().toLocaleString() || "—"}</div>
    </div>

    <div class="mt-3">
      <div class="w-full bg-gray-200 rounded-full h-2">
        <div class="bg-blue-600 h-2 rounded-full" style="width: ${progress}%"></div>
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

// === Go Back to Jobs List ===
function goBackToJobs() {
  activateTab("myJobsSection");
}

document.addEventListener("DOMContentLoaded", fetchAndDisplayUserJobs);









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
async function listenForNotifications(uid) {
  if (unsubscribeNotif) {
    unsubscribeNotif();
    unsubscribeNotif = null;
  }

  await ensureUserState(uid);

  unsubscribeNotif = db.collection('notifications')
    .orderBy('timestamp', 'desc')
    .onSnapshot(async snapshot => {
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

        // effective times prefer client-side override (instant UX), fallback to server values
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

        snapshot.forEach(doc => {
          const data = doc.data();
          const ts = data.timestamp;
          const tsDate = ts ? ts.toDate() : null;

          // skip notifications older than the user's join time
          if (tsDate && tsDate <= joinedAtServer) return;

          // Option B: skip notifications that are <= effectiveClearedAt (they are hidden/deleted for this user)
          if (tsDate && tsDate <= effectiveClearedAt) return;

          // unread = newer than lastReadAt (effective)
          const isUnread = tsDate ? (tsDate > effectiveLastReadAt) : false;
          if (isUnread) unreadCount++;

          // render simple card (no profile pic)
          if (notifList) {
            const dateStr = tsDate ? timeAgo(tsDate) : 'Just now';
            const card = document.createElement('div');
            card.className = `bg-white rounded-xl p-4 shadow-md border-l-4 ${isUnread ? 'border-blue-400' : 'border-gray-200'} animate-fade-in`;
            card.innerHTML = `
              <p class="text-gray-800 font-semibold truncate">${escapeHtml(data.title || 'No Title')}</p>
              <p class="text-sm text-gray-600 mt-1 truncate">${escapeHtml(data.message || '')}</p>
              <p class="text-xs text-gray-500 mt-2">${escapeHtml(dateStr)}</p>
            `;
            notifList.appendChild(card);
          }
        });

        lastUnreadCount = unreadCount;

        // nav dot
        if (notifDot) notifDot.classList.toggle('hidden', unreadCount === 0);

        // popup under bell
        if (notifPopup && notifMessage) {
          if (unreadCount > 0) {
            notifMessage.textContent = `You have ${unreadCount} new notification${unreadCount > 1 ? 's' : ''}`;
            notifPopup.classList.remove('hidden');
          } else {
            notifPopup.classList.add('hidden');
          }
        }

        // banner on dashboard
        if (banner && bannerText) {
          if (unreadCount > 0) {
            bannerText.textContent = `You have ${unreadCount} unread message${unreadCount > 1 ? 's' : ''}`;
            banner.classList.remove('hidden');
          } else {
            banner.classList.add('hidden');
          }
        }

        // empty state
        if (notifList && notifList.children.length === 0) {
          notifList.innerHTML = `<p class="text-gray-400 text-center py-8">No notifications yet.</p>`;
        }

      } catch (err) {
        console.error("onSnapshot processing error:", err);
      }
    }, err => {
      console.error("notifications onSnapshot error:", err);
    });
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
      listenForNotifications(user.uid);
    } catch (err) {
      console.error("Error initializing notifications for user:", err);
    }
  } else {
    if (unsubscribeNotif) {
      unsubscribeNotif();
      unsubscribeNotif = null;
    }
    lastReadAtOverride = null;
    lastClearedAtOverride = null;
  }
});













                                                                       //PAYMENTfunction



// ----------------------
// Payment Section Module
// ----------------------

// DOM elements
const paymentTxListEl = document.getElementById("transactionList");
const paymentTxFilterEl = document.getElementById("transactionFilter");

// State
let paymentTransactions = [];
let paymentRenderedCount = 0;
const PAYMENT_PAGE_SIZE = 10;

// ----------------------
// Format helpers
// ----------------------
function fmtNaira(n) { return "₦" + Number(n||0).toLocaleString(); }

function parseTimestamp(val){
  if(!val) return null;
  if(typeof val.toDate==="function") return val.toDate();
  if(val instanceof Date) return val;
  if(typeof val==="number") return new Date(val);
  if(typeof val==="string"){const d=new Date(val);return isNaN(d.getTime())?null:d;}
  return null;
}

function formatAmount(amount){ return fmtNaira(amount); }
function formatDatePretty(d){ return d?d.toLocaleString():"—"; }

// ----------------------
// Render single transaction card
// ----------------------
function paymentCardHtml(tx){
  const date=parseTimestamp(tx.timestamp||tx.createdAt||tx.time||tx.created_at);
  const amountClass = tx.status==="successful"?"text-green-600":tx.status==="failed"?"text-red-600":"text-yellow-600";
  return `<div class="cursor-pointer bg-white rounded-2xl p-4 shadow-sm hover:shadow-md transition">
    <div class="flex items-center justify-between">
      <div>
        <p class="text-sm font-semibold text-gray-900">${tx.type||"Unknown"}</p>
        <p class="text-xs text-gray-400 mt-1">${formatDatePretty(date)}</p>
      </div>
      <div class="text-right">
        <p class="text-base font-bold ${amountClass}">${formatAmount(tx.amount)}</p>
        <span class="inline-block mt-1 px-2 py-0.5 text-xs rounded-full ${amountClass} bg-opacity-10">
          ${tx.status||"—"}
        </span>
      </div>
    </div>
  </div>`;  
}

// ----------------------
// Render transactions in Payment section
// ----------------------
function renderPaymentTransactions(reset=true){
  if(!paymentTxListEl) return;
  if(reset){ paymentTxListEl.innerHTML=""; paymentRenderedCount=0; }

  const filtered = paymentTransactions.slice(paymentRenderedCount, paymentRenderedCount+PAYMENT_PAGE_SIZE);
  filtered.forEach(tx=>{
    paymentTxListEl.insertAdjacentHTML("beforeend", paymentCardHtml(tx));
  });
  paymentRenderedCount += filtered.length;
}

// ----------------------
// Filter by status dropdown
// ----------------------
function applyPaymentFilter(){
  const status = paymentTxFilterEl?.value || "all";
  const filtered = paymentTransactions.filter(tx=>{
    const okType = ["deposit","withdraw"].includes((tx.type||"").toLowerCase());
    const okStatus = status==="all" || (tx.status||"").toLowerCase()===status.toLowerCase();
    return okType && okStatus;
  }).sort((a,b)=>{
    const ta=parseTimestamp(a.timestamp||a.createdAt||a.time||a.created_at)||0;
    const tb=parseTimestamp(b.timestamp||b.createdAt||b.time||b.created_at)||0;
    return tb-ta;
  });

  paymentRenderedCount=0;
  paymentTxListEl.innerHTML="";
  paymentTransactions=filtered;
  renderPaymentTransactions();
}

// ----------------------
// Listen to Payment transaction collection
// ----------------------
function startPaymentListener(){
  const user = firebase.auth().currentUser;
  if(!user) return;

  const collNames=["Transaction","transaction","transactions","Transactions"];
  let attached=false;

  collNames.forEach(collName=>{
    if(attached) return;
    try{
      const ref=firebase.firestore().collection(collName).where("userId","==",user.uid).orderBy("timestamp","desc");
      ref.onSnapshot(snap=>{
        paymentTransactions = snap.docs.map(doc=>({id:doc.id,...doc.data()}))
          .filter(tx=>["deposit","withdraw"].includes((tx.type||"").toLowerCase()));
        applyPaymentFilter();
      });
      attached=true;
    }catch(e){console.error("Payment listener error:",e);}
  });
}

// ----------------------
// Init Payment section (lazy load)
// ----------------------
function initPaymentSection(){
  const user = firebase.auth().currentUser;
  if(!user) return; // exit if no user

  startPaymentListener();
  paymentTxFilterEl?.addEventListener("change",applyPaymentFilter);

  console.log("Payment section initialized");
}

// Expose globally so activateTab can call it
window.initPaymentSection = initPaymentSection;




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
  const accNum = (document.getElementById('withdrawAccountNumber')?.value || '').toString().trim();
  const bankCode = (document.getElementById('withdrawBankSelect')?.value || '').toString().trim();
  const rawName = (document.getElementById('accountNameDisplay')?.innerText || '').replace('✅ ', '');
  const accountName = rawName.trim();
  const amount = parseInt(document.getElementById('withdrawAmount')?.value || '0', 10);
  // support both withdrawPin or withdrawPassword id (legacy)
  const pinEl = document.getElementById('withdrawPin') || document.getElementById('withdrawPassword');
  const pin = (pinEl?.value || '').toString().trim();

  if (!accNum || !bankCode || !amount || !pin || amount < 1000) { alert('Please fill all fields correctly (min ₦1000)'); return; }

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
      body: JSON.stringify({ accNum, bankCode, account_name: accountName, amount, pin })
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











<!-- ====== spin and earn function ====== -->




<!-- ====== spin and earn function ====== -->
/* ====== Spin Wheel + Daily Challenge Script (Firebase compat) ====== */
(() => {  
  // ---------- CONFIG ----------  
  const COIN_IMG = 'COIN.jpg';  
  const VERIFIED_IMG = 'VERIFIED.jpg';  
  const PRIZES = [10, 30, 20, 200, 5, 0, 100, 1000];   // wheel order  
  const WEIGHTS = [18, 12, 14, 2, 18, 20, 5, 1];  
  const SEGMENTS = PRIZES.length;  
  const ROTATIONS = 6;  
  const TIMESTAMP_CANDIDATES = ['createdAt','submittedAt','timestamp','time','submittedOn','created_on'];  
  // Map challenge key -> prize index (so a completed challenge can queue a guaranteed spin)  
  const CHALLENGE_TO_PRIZE_INDEX = {    
    affiliateApproved: 0, // ₦10    
    taskApproved: 2,      // ₦10    
    dataAmount: 1,        // ₦0    
    airtimeAmount: 6      // ₦0  
  };  
  // ---------- DOM ----------  
  const canvas = document.getElementById('spin-canvas');  
  if (!canvas) { console.error('Spin canvas not found'); return; }  
  const ctx = canvas.getContext('2d');  
  const spinBtn = document.getElementById('spin-btn');  
  const spinCountEl = document.getElementById('spin-count');  
  const liveText = document.getElementById('live-text');  
  const liveFeedEl = document.getElementById('live-feed-items');  
  const winModal = document.getElementById('win-modal');  
  const winAmountEl = document.getElementById('win-amount');  
  const winVerifiedImg = document.getElementById('win-verified');  
  const winCloseBtn = document.getElementById('win-close');  
  const noSpinModal = document.getElementById('no-spin-modal');  
  const noSpinClose = document.getElementById('no-spin-close');  
  const toastEl = document.getElementById('spin-toast');  
  const toastTextEl = document.getElementById('spin-toast-text');  
  const challengeCards = Array.from(document.querySelectorAll('#daily-challenges .challenge-card'));  
  // ---------- STATE ----------  
  let DPR = window.devicePixelRatio || 1;  
  let lastRotation = 0;               // degrees  
  let spinning = false;  
  let currentUser = null;  
  let userDocCached = null;  
  let spinsAvailable = 0;  
  let progressState = { affiliateApproved:0, taskApproved:0, dataAmount:0, airtimeAmount:0 };  
  let prevProgress = { ...progressState };  
  let unsubs = [];  
  let liveInterval = null;  
  let guaranteedPrizes = []; // queue of prize indices to force next spin to land on  
  // ---------- HELPERS ----------  
  const todayKey = () => new Date().toISOString().slice(0,10);  
  const startOfToday = () => { const d = new Date(); d.setHours(0,0,0,0); return d; };  
  const endOfToday = () => { const d = new Date(); d.setHours(23,59,59,999); return d; };  
  function dateFromMaybe(v) {    
    if (v == null) return null;    
    if (typeof v.toDate === 'function') { try { return v.toDate(); } catch(e) { return null; } }    
    if (v && typeof v.seconds === 'number') return new Date(v.seconds * 1000);    
    if (typeof v === 'number') return new Date(v);    
    try { return new Date(v); } catch(e) { return null; }  
  }  
  function docIsToday(data){    
    if (!data) return false;    
    for (const f of TIMESTAMP_CANDIDATES) {      
      if (!data[f]) continue;      
      const dt = dateFromMaybe(data[f]);      
      if (!dt || isNaN(dt.getTime())) continue;      
      if (dt >= startOfToday() && dt <= endOfToday()) return true;    
    }    
    return false;  
  }  
  function weightedRandomIndex(weights){    
    const sum = weights.reduce((a,b)=>a+b,0);    
    let r = Math.random() * sum;    
    for (let i=0;i<weights.length;i++){      
      if (r < weights[i]) return i;      
      r -= weights[i];    
    }    
    return weights.length - 1;  
  }  
  function showToast(msg){    
    if (toastEl && toastTextEl) {      
      toastTextEl.textContent = msg;      
      toastEl.style.display = 'block';      
      clearTimeout(toastEl._hideTO);      
      toastEl._hideTO = setTimeout(()=> { toastEl.style.display = 'none'; }, 3200);    
    } else { alert(msg); }  
  }  
  // ---------- preload images ----------  
  const coinImg = new Image(); coinImg.src = COIN_IMG;  
  const verifiedImg = new Image(); verifiedImg.src = VERIFIED_IMG;  
  // ---------- responsive HD canvas setup ----------  
  function setupCanvasHD() {    
    DPR = window.devicePixelRatio || 1;    
    // match plate size (canvas.parentElement is .wheel-plate)    
    const plate = canvas.parentElement;    
    const rect = plate.getBoundingClientRect();    
    const css = Math.max(220, Math.min(rect.width, rect.height));    
    canvas.style.width = css + 'px';    
    canvas.style.height = css + 'px';    
    canvas.width = Math.round(css * DPR);    
    canvas.height = Math.round(css * DPR);    
    // make drawing coordinates match CSS pixels    
    ctx.setTransform(DPR,0,0,DPR,0,0);    
    drawWheel(lastRotation);  
  }  
  // ---------- draw wheel ----------  
  function drawWheel(rotationDeg = 0) {    
    // use CSS pixels for layout    
    const cssW = canvas.clientWidth || parseInt(canvas.style.width || '320',10);    
    const cx = cssW / 2, cy = cssW / 2, r = Math.min(cssW, cssW)/2 - 12;    
    ctx.clearRect(0,0,cssW,cssW);    
    ctx.save();    
    // rotate wheel around center    
    ctx.translate(cx,cy);    
    ctx.rotate(rotationDeg * Math.PI/180);    
    ctx.translate(-cx,-cy);    
    const segAngle = 2 * Math.PI / SEGMENTS;    
    const colors = ['#ecfeff','#e6f7ff','#fff8e1','#f3f5ff','#fff0f6','#eef6ff','#fbfbfd','#f0fbff'];    
    for (let i=0;i<SEGMENTS;i++){      
      const start = -Math.PI/2 + i*segAngle;      
      const end = start + segAngle;      
      // slice      
      ctx.beginPath();      
      ctx.moveTo(cx,cy);      
      ctx.arc(cx,cy,r,start,end);      
      ctx.closePath();      
      ctx.fillStyle = colors[i % colors.length];      
      ctx.fill();      
      ctx.strokeStyle = 'rgba(2,6,23,0.04)';      
      ctx.lineWidth = 1;      
      ctx.stroke();      
      // amount label near rim      
      const mid = (start + end) / 2;      
      const labelR = r * 0.78;      
      const lx = cx + Math.cos(mid) * labelR;      
      const ly = cy + Math.sin(mid) * labelR;      
      ctx.save();      
      ctx.translate(lx, ly);      
      ctx.rotate(mid + Math.PI/2);      
      ctx.fillStyle = '#0f172a';      
      ctx.font = `${Math.max(11, Math.round(cssW * 0.035))}px Inter, system-ui`;      
      ctx.textAlign = 'center';      
      ctx.textBaseline = 'middle';      
      ctx.fillText(`₦${PRIZES[i]}`, 0, 0);      
      ctx.restore();      
      // coin image (upright)      
      if (coinImg && coinImg.complete) {        
        const imgR = r * 0.56;        
        const ix = cx + Math.cos(mid) * imgR;        
        const iy = cy + Math.sin(mid) * imgR;        
        ctx.save();        
        ctx.translate(ix, iy);        
        ctx.rotate(-(rotationDeg * Math.PI/180)); // keep upright        
        const coinSize = Math.max(28, Math.round(cssW * 0.12));        
        ctx.drawImage(coinImg, -coinSize/2, -coinSize/2, coinSize, coinSize);        
        // verified badge for 1000        
        if (PRIZES[i] === 1000 && verifiedImg.complete) {          
          const b = Math.round(coinSize * 0.45);          
          ctx.drawImage(verifiedImg, coinSize/4, coinSize/4, b, b);        
        }        
        ctx.restore();      
      }    
    }    
    // bold outer edge ring    
    ctx.beginPath();    
    ctx.arc(cx, cy, r + 6, 0, Math.PI*2);    
    ctx.strokeStyle = 'rgba(15,23,42,0.06)';    
    ctx.lineWidth = 10;    
    ctx.stroke();    
    // center button    
    ctx.beginPath();    
    ctx.arc(cx, cy, 48, 0, Math.PI*2);    
    ctx.fillStyle = '#fff';    
    ctx.fill();    
    ctx.lineWidth = 2;    
    ctx.strokeStyle = 'rgba(15,23,42,0.06)';    
    ctx.stroke();    
    ctx.fillStyle = '#0f172a';    
    ctx.font = '700 14px Inter, system-ui';    
    ctx.textAlign = 'center';    
    ctx.textBaseline = 'middle';    
    ctx.fillText('SPIN', cx, cy - 6);    
    ctx.font = '600 12px Inter, system-ui';    
    ctx.fillText('NOW', cx, cy + 12);    
    ctx.restore();  
  }  
  
  // ---------- easing animation ----------  
  function animateTo(targetAbsolute, duration = 5200) {    
    return new Promise(resolve => {      
      const start = performance.now();      
      const from = lastRotation;      
      const diff = targetAbsolute - from;      
      function easeOutCubic(t){ return 1 - Math.pow(1 - t, 3); }      
      function frame(now){        
        const t = Math.min(1, (now - start) / duration);        
        const v = from + diff * easeOutCubic(t);        
        drawWheel(v);        
        if (t < 1) requestAnimationFrame(frame);        
        else {          
          lastRotation = ((targetAbsolute % 360) + 360) % 360;          
          drawWheel(lastRotation);          
          resolve();        
        }      
      }      
      requestAnimationFrame(frame);    
    });  
  }  
  
  // ---------- compute available spins & update UI ----------  
  function recomputeSpinsUI(){    
    const goals = {      
      affiliateApproved: Number(document.querySelector('.challenge-card[data-key="affiliateApproved"]')?.dataset.goal || 10),      
      taskApproved: Number(document.querySelector('.challenge-card[data-key="taskApproved"]')?.dataset.goal || 10),      
      dataAmount: Number(document.querySelector('.challenge-card[data-key="dataAmount"]')?.dataset.goal || 1000),      
      airtimeAmount: Number(document.querySelector('.challenge-card[data-key="airtimeAmount"]')?.dataset.goal || 500)    
    };    
    const flags = [      
      (progressState.affiliateApproved || 0) >= goals.affiliateApproved,      
      (progressState.taskApproved || 0) >= goals.taskApproved,      
      (progressState.dataAmount || 0) >= goals.dataAmount,      
      (progressState.airtimeAmount || 0) >= goals.airtimeAmount    
    ];    
    const completedCount = flags.filter(Boolean).length;    
    const base = 1;    
    let used = 0;    
    let usedDateKey = null;    
    if (userDocCached) {      
      used = Number(userDocCached.spinsUsedCount || 0);      
      const prev = userDocCached.spinsUsedDate || null;      
      if (prev) {        
        try { usedDateKey = (typeof prev.toDate === 'function') ? prev.toDate().toISOString().slice(0,10) : new Date(prev).toISOString().slice(0,10); }        
        catch(e){ usedDateKey = prev; }      
      }      
      if (usedDateKey !== todayKey()) used = 0;    
    }    
    const newAvailable = Math.max(0, base + completedCount - used);    
    if (newAvailable !== spinsAvailable) {      
      spinsAvailable = newAvailable;      
      if (spinCountEl) spinCountEl.textContent = `${spinsAvailable}`;      
      if (spinCountEl) {        
        spinCountEl.animate([{ transform:'scale(1)'},{ transform:'scale(1.18)'},{ transform:'scale(1)'}], { duration:350, easing:'ease-out' });      
      }    
    }    
    challengeCards.forEach(card => {      
      const key = card.dataset.key;      
      const goal = Number(card.dataset.goal || 1);      
      let val = 0;      
      if (key === 'affiliateApproved') val = progressState.affiliateApproved || 0;      
      else if (key === 'taskApproved') val = progressState.taskApproved || 0;      
      else if (key === 'dataAmount') val = progressState.dataAmount || 0;      
      else if (key === 'airtimeAmount') val = progressState.airtimeAmount || 0;      
      const percent = Math.min(100, (val / goal) * 100);      
      const bar = card.querySelector('.progress-bar');      
      const status = card.querySelector('.status-text');      
      if (bar) bar.style.width = percent + '%';      
      if (status) {        
        if (val >= goal) { status.textContent = 'Completed'; status.classList.remove('not-completed'); status.classList.add('completed'); }        
        else { status.textContent = 'Not completed'; status.classList.remove('completed'); status.classList.add('not-completed'); }      
      }    
    });  
  }  

  // ---------- debug helpers ----------  
  window.__spinDebug = { drawWheel, setupCanvasHD, recomputeSpinsUI, progressState, PRIZES, lastRotation, guaranteedPrizes };
})();









	

/* ====================== WATCH ADS SETTINGS ====================== */

      


/*
  Robust Watch-Ads script
  - Shows progress + time (read-only)
  - Prevents seeking / keyboard seeking / context menu
  - Daily reset: clears watchedAds + adEarningsToday only
  - Keeps adEarningsTotal persistent
  - No redirect / no smartlink fallback
  - Graceful HLS and MP4 handling with longer load allowance
  - Safe if Firebase isn't initialized (localStorage fallback)
*/

function initWatchAdsSection() {
  'use strict';

  // ====== CONFIG ======
  const REWARD_NAIRA = 0.5;
  const NUM_CARDS = 20;
  const VAST_LINK = 'https://silkyspite.com/dFm.FkzMdRGUN/vPZhGFUX/geYmX9Su/Z-UKluk/PWTvYb2gNEzHAo2/N/zaQ/tBNNj/YB3rMaDXYw3kNAQr';
  const HLS_JS_SRC = 'https://cdn.jsdelivr.net/npm/hls.js@latest';

  // ====== SAFE FIREBASE ACCESS ======
  const auth = (window.firebase && typeof firebase.auth === 'function') ? firebase.auth() : null;
  const db = (window.firebase && typeof firebase.firestore === 'function') ? firebase.firestore() : null;

  // ====== DOM READY ======
  document.addEventListener('DOMContentLoaded', () => {

    // ====== ELEMENTS (guarded) ======
    const adsGrid = document.getElementById('adsGrid');
    const statClicked = document.getElementById('statClicked');
    const statCompleted = document.getElementById('statCompleted');
    const statAbandoned = document.getElementById('statAbandoned');
    const statIncome = document.getElementById('statIncome');
    const statAdTotal = document.getElementById('statAdTotal');

    const adModal = document.getElementById('adModal');
    const adPlayer = document.getElementById('adPlayer'); // <video>
    const closeAd = document.getElementById('closeAd');

    if (!adsGrid || !adModal || !adPlayer) {
      console.warn('Watch Ads: required DOM elements missing. Script will not run fully.');
      return;
    }

    // create a fallback message area inside modal for cases when no ad is available
    let adFallbackMsg = document.getElementById('adFallbackMessage');
    if (!adFallbackMsg) {
      adFallbackMsg = document.createElement('div');
      adFallbackMsg.id = 'adFallbackMessage';
      adFallbackMsg.style.padding = '12px 18px';
      adFallbackMsg.style.display = 'none';
      adFallbackMsg.style.textAlign = 'center';
      adFallbackMsg.style.color = '#0f172a';
      adFallbackMsg.style.fontSize = '14px';
      adFallbackMsg.className = 'animate-fadeIn';
      // insert before video
      const videoWrap = adPlayer.parentElement;
      videoWrap.insertBefore(adFallbackMsg, adPlayer);
    }

    // ====== STATE ======
    let currentUser = null;
    let inProgress = {};      // cardId -> boolean
    let cardStatus = {};      // cardId -> 'available' | 'completed' | 'abandoned'
    let userStats = { adsClicked: 0, adsCompleted: 0, adsAbandoned: 0, balance: 0, adEarningsToday: 0, adEarningsTotal: 0 };
    let currentPlayingCard = null;
    let hlsLoaded = false;

    // ====== UTIL ======
    function formatNaira(v) { return '₦' + Number(v).toFixed(2); }
    function todayString() { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`; }
    function formatTime(t) {
      if (!isFinite(t) || t <= 0) return '00:00';
      t = Math.floor(t);
      const m = Math.floor(t / 60);
      const s = t % 60;
      return `${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
    }

    // ====== RENDER CARDS ======
    function renderCards() {
      adsGrid.innerHTML = '';
      for (let i = 1; i <= NUM_CARDS; i++) {
        const status = cardStatus[i] || 'available';
        const disabled = (status === 'completed' || status === 'abandoned');
        const card = document.createElement('div');
        card.dataset.cardId = i;
        card.className = `relative group rounded-2xl p-4 bg-white/80 backdrop-blur border border-indigo-100 ${disabled ? 'opacity-60 pointer-events-none' : 'hover:-translate-y-1 hover:shadow-lg transition'}`;
        card.innerHTML = `
          <div class="flex items-start gap-4">
            <div class="w-14 h-14 rounded-xl overflow-hidden">
              <img src="GLOBALS.jpg" alt="globals" class="w-full h-full object-cover">
            </div>
            <div class="flex-1">
              <div class="flex items-center justify-between">
                <div>
                  <div class="text-sm font-semibold text-slate-900">Global Ad #${i}</div>
                  <div class="text-xs text-slate-500 mt-0.5">Watch video to earn</div>
                </div>
                <div class="text-right">
                  <div class="text-sm font-semibold text-emerald-600">${formatNaira(REWARD_NAIRA)}</div>
                  <div class="text-xs text-slate-400">Globals Ads</div>
                </div>
              </div>
              <div class="mt-3 flex items-center gap-2">
                <button class="watch-btn inline-flex items-center gap-2 px-3 py-2 bg-indigo-600 text-white rounded-xl text-sm" aria-label="Watch Ad ${i}">
                  <i data-lucide="play" class="w-4 h-4"></i>
                  Watch
                </button>
                <div class="status-pill ml-2 text-xs px-2 py-1 rounded-full bg-slate-100 text-slate-600">${status === 'available' ? 'Available' : (status === 'completed' ? 'Completed' : 'Skipped')}</div>
              </div>
            </div>
          </div>
        `;
        adsGrid.appendChild(card);
      }
      // render lucide icons if available
      setTimeout(() => { if (window.lucide) lucide.createIcons(); }, 30);
    }

    // ====== FIRESTORE / FALLBACK HELPERS ======
    async function ensureUserDoc(uid) {
      if (!db) {
        // local fallback
        const key = `watched_user_${uid}`;
        const raw = localStorage.getItem(key);
        if (!raw) {
          const obj = { balance: 0, adEarningsToday: 0, adEarningsTotal: 0, adsClicked: 0, adsCompleted: 0, adsAbandoned: 0, watchedAds: {}, lastDailyReset: todayString() };
          localStorage.setItem(key, JSON.stringify(obj));
          return obj;
        }
        return JSON.parse(raw);
      }
      const docRef = db.collection('users').doc(uid);
      const doc = await docRef.get();
      const today = todayString();
      if (!doc.exists) {
        await docRef.set({ balance: 0, adEarningsToday: 0, adEarningsTotal: 0, adsClicked: 0, adsCompleted: 0, adsAbandoned: 0, watchedAds: {}, lastDailyReset: today });
        return { balance: 0, adEarningsToday: 0, adEarningsTotal: 0, adsClicked: 0, adsCompleted: 0, adsAbandoned: 0, watchedAds: {}, lastDailyReset: today };
      }
      return doc.data();
    }

    async function dailyResetIfNeeded(uid, userDoc) {
      const today = todayString();
      if (!userDoc) return;
      const last = userDoc.lastDailyReset || '';
      if (last !== today) {
        if (db) {
          await db.collection('users').doc(uid).set({ watchedAds: {}, lastDailyReset: today, adEarningsToday: 0 }, { merge: true });
        } else {
          // local fallback
          const key = `watched_user_${uid}`;
          const raw = localStorage.getItem(key) || '{}';
          const obj = JSON.parse(raw);
          obj.watchedAds = {};
          obj.lastDailyReset = today;
          obj.adEarningsToday = 0;
          localStorage.setItem(key, JSON.stringify(obj));
        }
        cardStatus = {};
        renderCards();
      }
    }

    async function loadUserData(uid) {
      try {
        const docSnap = db ? await db.collection('users').doc(uid).get() : null;
        let data = docSnap && docSnap.exists ? docSnap.data() : await ensureUserDoc(uid);
        await dailyResetIfNeeded(uid, data);

        const fresh = db ? (await db.collection('users').doc(uid).get()).data() : JSON.parse(localStorage.getItem(`watched_user_${uid}`) || '{}');

        // defensive mapping
        userStats.adsClicked = fresh.adsClicked || 0;
        userStats.adsCompleted = fresh.adsCompleted || 0;
        userStats.adsAbandoned = fresh.adsAbandoned || 0;
        userStats.balance = fresh.balance || 0;
        userStats.adEarningsToday = (typeof fresh.adEarningsToday !== 'undefined') ? fresh.adEarningsToday : (typeof fresh.adEarnings !== 'undefined' ? fresh.adEarnings : 0);
        userStats.adEarningsTotal = (typeof fresh.adEarningsTotal !== 'undefined') ? fresh.adEarningsTotal : (typeof fresh.adEarnings !== 'undefined' ? fresh.adEarnings : 0);

        // watchedAds -> cardStatus
        cardStatus = {};
        const watched = fresh.watchedAds || {};
        Object.keys(watched).forEach(k => {
          const id = Number(k);
          if (id >= 1 && id <= NUM_CARDS) cardStatus[id] = watched[k];
        });

        updateStatsUI();
        renderCards();

        // process in-progress flag left from previous load
        const inProg = localStorage.getItem('ad_in_progress');
        if (inProg) {
          const cid = Number(inProg);
          if (cid >= 1 && cid <= NUM_CARDS && (!cardStatus[cid] || cardStatus[cid] === 'available')) {
            try { await recordAbandoned(uid, cid); } catch (err) { console.warn('failed mark abandoned on load', err); }
          }
          localStorage.removeItem('ad_in_progress');
        }
      } catch (err) {
        console.error('loadUserData err', err);
      }
    }

    function updateStatsUI() {
      if (statClicked) statClicked.textContent = userStats.adsClicked || 0;
      if (statCompleted) statCompleted.textContent = userStats.adsCompleted || 0;
      if (statAbandoned) statAbandoned.textContent = userStats.adsAbandoned || 0;
      if (statIncome) statIncome.textContent = formatNaira(userStats.adEarningsToday || 0);
      if (statAdTotal) statAdTotal.textContent = formatNaira(userStats.adEarningsTotal || 0);
    }

/* ====================== TOAST FUNCTION ====================== */
function showToast(message, type='success', duration=3000){
    let container = document.getElementById('toastContainer');
    if(!container){
        container = document.createElement('div');
        container.id = 'toastContainer';
        container.className = 'fixed top-6 right-6 z-50 flex flex-col gap-2';
        document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    toast.className = `
        px-4 py-2 rounded-lg shadow-lg text-sm font-medium
        ${type==='success'? 'bg-green-600 text-white':'bg-rose-500 text-white'}
        animate-fadeIn
    `;
    toast.textContent = message;
    container.appendChild(toast);

    setTimeout(() => { toast.remove(); }, duration);
}

/* ====================== WATCH ADS HELPERS ====================== */
async function recordClickOnly(uid, cardId) {
  if (db) {
    await db.collection('users').doc(uid).set({
      adsClicked: firebase.firestore.FieldValue.increment(1)
    }, { merge: true });
  } else {
    const key = `watched_user_${uid}`;
    const obj = JSON.parse(localStorage.getItem(key) || '{}');
    obj.adsClicked = (obj.adsClicked || 0) + 1;
    localStorage.setItem(key, JSON.stringify(obj));
  }

  userStats.adsClicked++;
  updateStatsUI();
}

async function recordAbandoned(uid, cardId) {
  const field = `watchedAds.${cardId}`;
  if (db) {
    await db.collection('users').doc(uid).set({
      adsAbandoned: firebase.firestore.FieldValue.increment(1),
      [field]: 'abandoned'
    }, { merge: true });
  } else {
    const key = `watched_user_${uid}`;
    const obj = JSON.parse(localStorage.getItem(key) || '{}');
    obj.adsAbandoned = (obj.adsAbandoned || 0) + 1;
    obj.watchedAds = obj.watchedAds || {};
    obj.watchedAds[cardId] = 'abandoned';
    localStorage.setItem(key, JSON.stringify(obj));
  }

  userStats.adsAbandoned++;
  cardStatus[cardId] = 'abandoned';
  updateStatsUI();
  renderCards();

  // Show toast when ad is skipped
  showToast('⚠️ Ad skipped — no reward', 'error');
}

async function rewardUser(uid, cardId) {
  const field = `watchedAds.${cardId}`;
  if (db) {
    await db.collection('users').doc(uid).set({
      balance: firebase.firestore.FieldValue.increment(REWARD_NAIRA),
      adEarningsToday: firebase.firestore.FieldValue.increment(REWARD_NAIRA),
      adEarningsTotal: firebase.firestore.FieldValue.increment(REWARD_NAIRA),
      adsCompleted: firebase.firestore.FieldValue.increment(1),
      [field]: 'completed'
    }, { merge: true });
  } else {
    const key = `watched_user_${uid}`;
    const obj = JSON.parse(localStorage.getItem(key) || '{}');
    obj.balance = (obj.balance || 0) + REWARD_NAIRA;
    obj.adEarningsToday = (obj.adEarningsToday || 0) + REWARD_NAIRA;
    obj.adEarningsTotal = (obj.adEarningsTotal || 0) + REWARD_NAIRA;
    obj.adsCompleted = (obj.adsCompleted || 0) + 1;
    obj.watchedAds = obj.watchedAds || {};
    obj.watchedAds[cardId] = 'completed';
    localStorage.setItem(key, JSON.stringify(obj));
  }

  userStats.balance = (Number(userStats.balance) || 0) + Number(REWARD_NAIRA);
  userStats.adEarningsToday = (Number(userStats.adEarningsToday) || 0) + Number(REWARD_NAIRA);
  userStats.adEarningsTotal = (Number(userStats.adEarningsTotal) || 0) + Number(REWARD_NAIRA);
  userStats.adsCompleted++;
  cardStatus[cardId] = 'completed';
  updateStatsUI();
  renderCards();

  // Show toast when reward is earned
  showToast(`🎉 You earned ₦${REWARD_NAIRA} added to your balance!`, 'success');
}

    // ====== VAST RESOLUTION & HLS LOAD ======
    async function fetchText(url) {
      const res = await fetch(url, { method: 'GET', mode: 'cors' });
      if (!res.ok) throw new Error('fetch failed ' + res.status);
      return res.text();
    }
    function parseXML(text) {
      try { return (new DOMParser()).parseFromString(text, 'application/xml'); } catch (e) { return null; }
    }
    async function resolveVast(url, depth = 0) {
      if (!url || depth > 3) return null;
      try {
        const text = await fetchText(url);
        const xml = parseXML(text);
        if (!xml) return null;
        const wrapper = xml.querySelector('Wrapper > VASTAdTagURI, VASTAdTagURI');
        if (wrapper && wrapper.textContent && wrapper.textContent.trim()) {
          const next = wrapper.textContent.trim();
          return await resolveVast(next, depth + 1);
        }
        const mediaFiles = Array.from(xml.querySelectorAll('MediaFile'))
          .map(node => ({ url: (node.textContent || '').trim(), type: node.getAttribute('type') || '' }))
          .filter(m => m.url && !/javascript|vpaid/i.test(m.url));
        const mp4 = mediaFiles.find(c => /mp4|video\/mp4/i.test(c.type) || /\.mp4(\?|$)/i.test(c.url));
        if (mp4) return { kind: 'mp4', url: mp4.url };
        const hls = mediaFiles.find(c => /\.m3u8(\?|$)/i.test(c.url) || /application\/x-mpegURL/i.test(c.type));
        if (hls) return { kind: 'hls', url: hls.url };
        return null;
      } catch (e) {
        console.warn('resolveVast err', e);
        return null;
      }
    }
    function loadHlsJs() {
      return new Promise((resolve, reject) => {
        if (hlsLoaded) return resolve(window.Hls);
        const s = document.createElement('script');
        s.src = HLS_JS_SRC;
        s.onload = () => { hlsLoaded = true; resolve(window.Hls); };
        s.onerror = reject;
        document.head.appendChild(s);
      });
    }

    // ====== NO-SEEK PROTECTION + PROGRESS UI ======
    let modalKeyBlockHandler = null;
    function blockModalSeekKeys() {
      modalKeyBlockHandler = (e) => {
        const blocked = ['ArrowLeft', 'ArrowRight', 'Home', 'End', 'PageUp', 'PageDown'];
        if (blocked.includes(e.code)) e.preventDefault();
      };
      window.addEventListener('keydown', modalKeyBlockHandler, { capture: true });
    }
    function unblockModalSeekKeys() {
      if (modalKeyBlockHandler) { window.removeEventListener('keydown', modalKeyBlockHandler, { capture: true }); modalKeyBlockHandler = null; }
    }

    function updateProgress(video) {
      const progressEl = document.getElementById('videoProgress');
      const label = document.getElementById('videoTimeLabel');
      const rem = document.getElementById('videoRemainingLabel');
      if (!label) return;
      const dur = isFinite(video.duration) ? video.duration : 0;
      const cur = isFinite(video.currentTime) ? video.currentTime : 0;
      const pct = dur > 0 ? Math.min(100, Math.max(0, (cur / dur) * 100)) : 0;
      if (progressEl) progressEl.style.width = pct + '%';
      label.textContent = `${formatTime(cur)} / ${formatTime(dur)}`;
      if (rem) rem.textContent = dur > 0 ? `-${formatTime(Math.max(0, dur - cur))}` : '';
    }

    function attachNoSeekProtection(video) {
      let lastTime = 0;
      const onTime = () => { lastTime = Math.max(lastTime, video.currentTime); updateProgress(video); };
      const onSeeking = () => { if (Math.abs(video.currentTime - lastTime) > 0.2) video.currentTime = lastTime; };
      const onLoaded = () => { updateProgress(video); };
      const onContext = (e) => e.preventDefault();
      video.addEventListener('timeupdate', onTime);
      video.addEventListener('seeking', onSeeking);
      video.addEventListener('loadedmetadata', onLoaded);
      video.addEventListener('contextmenu', onContext);
      blockModalSeekKeys();
      return () => {
        video.removeEventListener('timeupdate', onTime);
        video.removeEventListener('seeking', onSeeking);
        video.removeEventListener('loadedmetadata', onLoaded);
        video.removeEventListener('contextmenu', onContext);
        unblockModalSeekKeys();
      };
    }

    // ====== HANDLE WATCH CLICK ======
    async function handleWatchClick(cardId, cardEl) {
      try {
        if (!auth || !auth.currentUser) { alert('Please sign in to watch ads and earn.'); return; }
        if (inProgress[cardId]) return;
        if (cardStatus[cardId] === 'completed' || cardStatus[cardId] === 'abandoned') return;

        // state
        inProgress[cardId] = true;
        currentPlayingCard = cardId;
        try { localStorage.setItem('ad_in_progress', String(cardId)); } catch (e) { }

        // record click
        try { await recordClickOnly(auth.currentUser.uid, cardId); } catch (e) { console.warn('recordClickOnly failed', e); }

        // modal UI
        adFallbackMsg.style.display = 'none';
        adPlayer.style.display = 'block';
        adPlayer.pause();
        // ensure adPlayer has no native controls
        adPlayer.removeAttribute('controls');
        adPlayer.setAttribute('playsinline', ''); // mobile inline
        try { adPlayer.removeAttribute('controlsList'); } catch (_) { }
        // hide poster, clear src
        adPlayer.removeAttribute('poster');
        adPlayer.src = '';
        // reset progress labels immediately
        const progressEl = document.getElementById('videoProgress'); if (progressEl) progressEl.style.width = '0%';
        const timeLabel = document.getElementById('videoTimeLabel'); if (timeLabel) timeLabel.textContent = '00:00 / 00:00';
        const remLabel = document.getElementById('videoRemainingLabel'); if (remLabel) remLabel.textContent = '';

        adModal.classList.remove('hidden');

        // resolve VAST to get playable media
        let resolved = null;
        try { resolved = await resolveVast(VAST_LINK); } catch (e) { resolved = null; }

        if (!resolved) {
          // NO redirect: show friendly message and allow retry/close
          adPlayer.style.display = 'none';
          adFallbackMsg.textContent = 'No playable ad available right now. Try again later.';
          adFallbackMsg.style.display = 'block';
          inProgress[cardId] = false;
          currentPlayingCard = null;
          localStorage.removeItem('ad_in_progress');
          return;
        }

        // setup protection + playback
        const cleanup = attachNoSeekProtection(adPlayer);

        // allow longer buffering in slow networks: 15 seconds before showing fallback
        const failTimeout = setTimeout(() => {
          if (adPlayer.readyState === 0) {
            cleanup();
            adPlayer.style.display = 'none';
            adFallbackMsg.textContent = 'Failed to load ad (slow connection). Please try again.';
            adFallbackMsg.style.display = 'block';
            adModal.classList.remove('hidden');
            inProgress[cardId] = false;
            currentPlayingCard = null;
            localStorage.removeItem('ad_in_progress');
          }
        }, 15000);

        // play paths
        if (resolved.kind === 'mp4') {
          adPlayer.src = resolved.url;
          adPlayer.load();
          try {
            await adPlayer.play();
          } catch (err) {
            // play failed (rare if user gesture), but keep modal open and show message
            console.warn('adPlayer.play() failed', err);
          }
          adPlayer.onended = async () => {
            clearTimeout(failTimeout);
            cleanup();
            adModal.classList.add('hidden');
            try { await rewardUser(auth.currentUser.uid, cardId); } catch (e) { console.error('rewardUser err', e); }
            inProgress[cardId] = false;
            currentPlayingCard = null;
            localStorage.removeItem('ad_in_progress');
          };
        } else if (resolved.kind === 'hls') {
          const Hls = await loadHlsJs().catch(() => null);
          if (Hls && Hls.isSupported()) {
            const hls = new Hls();
            hls.loadSource(resolved.url);
            hls.attachMedia(adPlayer);
            adPlayer.load();
            try { await adPlayer.play(); } catch (err) { /* ignore play error */ }
            adPlayer.onended = async () => {
              clearTimeout(failTimeout);
              cleanup();
              adModal.classList.add('hidden');
              try { await rewardUser(auth.currentUser.uid, cardId); } catch (e) { console.error('rewardUser err', e); }
              inProgress[cardId] = false;
              currentPlayingCard = null;
              localStorage.removeItem('ad_in_progress');
            };
          } else {
            // HLS lib not available or unsupported
            clearTimeout(failTimeout);
            cleanup();
            adPlayer.style.display = 'none';
            adFallbackMsg.textContent = 'Video format not supported by your browser.';
            adFallbackMsg.style.display = 'block';
            inProgress[cardId] = false;
            currentPlayingCard = null;
            localStorage.removeItem('ad_in_progress');
          }
        } else {
          clearTimeout(failTimeout);
          cleanup();
          adPlayer.style.display = 'none';
          adFallbackMsg.textContent = 'Unsupported ad format.';
          adFallbackMsg.style.display = 'block';
          inProgress[cardId] = false;
          currentPlayingCard = null;
          localStorage.removeItem('ad_in_progress');
        }

      } catch (err) {
        console.error('handleWatchClick err', err);
        // best effort cleanup
        try { adPlayer.pause(); } catch (e) { /* ignore */ }
        adModal.classList.add('hidden');
        inProgress[cardId] = false;
        currentPlayingCard = null;
        localStorage.removeItem('ad_in_progress');
      }
    }

    // ====== CLOSE MODAL HANDLER ======
    closeAd.addEventListener('click', async () => {
      if (currentPlayingCard && auth && auth.currentUser) {
        try { await recordAbandoned(auth.currentUser.uid, Number(currentPlayingCard)); } catch (e) { console.warn(e); }
      }
      try { adPlayer.pause(); } catch (e) { /* ignore */ }
      adModal.classList.add('hidden');
      if (currentPlayingCard) inProgress[currentPlayingCard] = false;
      localStorage.removeItem('ad_in_progress');
      currentPlayingCard = null;
      // reset progress visuals
      const progressEl = document.getElementById('videoProgress'); if (progressEl) progressEl.style.width = '0%';
      const timeLabel = document.getElementById('videoTimeLabel'); if (timeLabel) timeLabel.textContent = '00:00 / 00:00';
      const remLabel = document.getElementById('videoRemainingLabel'); if (remLabel) remLabel.textContent = '';
      adFallbackMsg.style.display = 'none';
    });

    // ====== BUTTON DELEGATION ON GRID ======
    adsGrid.addEventListener('click', (e) => {
      const btn = e.target.closest('.watch-btn'); if (!btn) return;
      const cardEl = e.target.closest('[data-card-id]'); if (!cardEl) return;
      const cardId = Number(cardEl.dataset.cardId);
      if (btn.disabled) return;
      btn.setAttribute('disabled', 'true');
      setTimeout(() => btn.removeAttribute('disabled'), 900);
      handleWatchClick(cardId, cardEl);
    });

    // ====== PROCESS IN-PROGRESS ON LOAD ======
    async function processInProgressOnLoad() {
      try {
        const inProg = localStorage.getItem('ad_in_progress');
        if (!inProg) return;
        const cid = Number(inProg);
        if (!auth || !auth.currentUser) return;
        // if that ad hasn't already been recorded, mark abandoned
        if (db) {
          const doc = await db.collection('users').doc(auth.currentUser.uid).get();
          const watched = (doc.exists && doc.data().watchedAds) ? doc.data().watchedAds : {};
          if (!watched || !watched[cid]) await recordAbandoned(auth.currentUser.uid, cid);
        } else {
          // local fallback
          const key = `watched_user_${auth.currentUser.uid}`;
          const obj = JSON.parse(localStorage.getItem(key) || '{}');
          const watched = obj.watchedAds || {};
          if (!watched || !watched[cid]) await recordAbandoned(auth.currentUser.uid, cid);
        }
        localStorage.removeItem('ad_in_progress');
      } catch (e) { console.warn('processInProgressOnLoad err', e); }
    }

    // ====== AUTH WATCHER ======
    if (auth) {
      auth.onAuthStateChanged(async (u) => {
        currentUser = u;
        if (u) {
          await loadUserData(u.uid);
          await processInProgressOnLoad();
        } else {
          // guest fallback
          userStats = { adsClicked: 0, adsCompleted: 0, adsAbandoned: 0, balance: 0, adEarningsToday: 0, adEarningsTotal: 0 };
          try {
            cardStatus = JSON.parse(localStorage.getItem('watchedAdsFallback') || '{}') || {};
          } catch (e) { cardStatus = {}; }
          updateStatsUI();
          renderCards();
        }
      });
    } else {
      // No Firebase: load fallback state from localStorage (optional)
      try {
        const fallback = JSON.parse(localStorage.getItem('watchedAdsFallback') || '{}') || {};
        cardStatus = fallback;
      } catch (_) { cardStatus = {}; }
      updateStatsUI();
      renderCards();
    }

    // ====== PERIODIC LOCAL FALLBACK SAVE ======
    setInterval(() => {
      try { localStorage.setItem('watchedAdsFallback', JSON.stringify(cardStatus)); } catch (e) { /* ignore */ }
    }, 5000);

    // ====== INIT UI ======
    renderCards();
    setTimeout(() => { if (window.lucide) lucide.createIcons(); }, 50);

    // expose a small API for debugging (optional)
    window.watchAdsDebug = {
      renderCards,
      loadUserData,
      cardStatus,
      userStats,
      handleWatchClick
    };

   // DOMContentLoaded end


}
window.initWatchAdsSection = initWatchAdsSection;









									 














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


/* ===============================   DAILY CHECK-IN SCRIPT (single block)   - Paste to replace old check-in JS  ================================ */
/* ====== FIRESTORE REF ====== */
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
function makeCard({status='future', day=1, amountLabel='', isLast=false}) {
  const card = document.createElement('div');
  card.className = `    flex flex-col items-center justify-center rounded-xl p-2    bg-white text-gray-800 shadow-md  `;
  card.style.width = '60px';
  card.style.height = '80px';
  card.style.fontSize = '12px';
  // status styles
  if (status === 'checked') {
    card.style.background = '#dcfce7'; // light green
    card.style.color = '#065f46';
  } else if (status === 'missed') {
    card.style.background = '#fee2e2'; // light red
    card.style.color = '#991b1b';
  } else if (status === 'today') {
    card.style.background = '#3b82f6'; // blue
    card.style.color = 'white';
  } else {
    card.style.background = '#f1f5f9'; // light gray
    card.style.color = '#475569';
  }
  // amount
  const amt = document.createElement('div');
  amt.className = 'text-xs font-bold';
  amt.textContent = amountLabel;
  // circle
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
    circle.innerHTML = `<svg width="10" height="10" viewBox="0 0 24 24" fill="none"><path d="M20 6L9 17L4 12" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
  } else if (status === 'missed') {
    circle.style.background = '#ef4444';
    circle.innerHTML = `<svg width="10" height="10" viewBox="0 0 24 24" fill="none"><path d="M18 6L6 18M6 6L18 18" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
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
      rewardAmount: 300,
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
      rewardAmount: 300,
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
  if (_creatingTodayCycle) return; // small client-side guard
  try {
    const qs = await cyclesRef(uid).orderBy('cycleStartDate','desc').limit(1).get();
    if (qs.empty) {
      // create fresh with deterministic id
      const today = todayStrLocal();
      const docRef = cyclesRef(uid).doc(today);
      _creatingTodayCycle = true;
      await docRef.set({
        cycleStartDate: today,
        days: Array(7).fill(false),
        status: 'processing',
        rewardAmount: 300,
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
      }, { merge: false });
      _creatingTodayCycle = false;
      return;
    }
    const doc = qs.docs[0];
    const d = doc.data();
    const today = todayStrLocal();
    // if last cycle finished and at least 7 days passed since its start -> start new one today
    if (d.status !== 'processing' && dayDiff(d.cycleStartDate, today) >= 7) {
      // create deterministic doc for today's date; set() with same id is idempotent across clients
      const newDocRef = cyclesRef(uid).doc(today);
      // final guard to avoid race: check for a processing cycle quickly
      const proc = await cyclesRef(uid).where('status', '==', 'processing').limit(1).get();
      if (!proc.empty) return;
      _creatingTodayCycle = true;
      await newDocRef.set({
        cycleStartDate: today,
        days: Array(7).fill(false),
        status: 'processing',
        rewardAmount: 300,
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
      }, { merge: false });
      _creatingTodayCycle = false;
    }
  } catch (err) {
    console.error('createNextCycleIfNeeded error', err);
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



























    

