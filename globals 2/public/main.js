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









                                                                 // PAYMENT PIN FUNCTION 



  let currentInput = "new"; // "old" | "new" | "confirm"
  let pinValues = { old: "", new: "", confirm: "" };

  // ✅ Detect logged in user automatically
  firebase.auth().onAuthStateChanged(async (user) => {
    if (user) {
      const userId = user.uid;
      window.userRef = db.collection("users").doc(userId); // store globally
      await setupPinTab();
    } else {
      console.log("No user logged in");
    }
  });

  // 🔹 Setup PIN Tab when opened
  async function setupPinTab() {
    const doc = await userRef.get();
    const hasPin = doc.exists && doc.data().pin;

    if (hasPin) {
      // Change PIN flow
      document.getElementById("pinTabTitle").innerText = "Change Payment PIN";
      document.getElementById("oldPinGroup").classList.remove("hidden");
      document.getElementById("pinActionBtn").innerText = "Update PIN";
      document.getElementById("pinLabel").innerText = "Change Payment PIN";
      currentInput = "old";
    } else {
      // Set PIN flow
      document.getElementById("pinTabTitle").innerText = "Set Payment PIN";
      document.getElementById("oldPinGroup").classList.add("hidden");
      document.getElementById("pinActionBtn").innerText = "Set PIN";
      document.getElementById("pinLabel").innerText = "Set Payment PIN";
      currentInput = "new";
    }

    // reset pins
    pinValues = { old: "", new: "", confirm: "" };
    updatePinDisplay();
  }

  // 🔹 Save or Update PIN
  async function savePin() {
    const doc = await userRef.get();
    const hasPin = doc.exists && doc.data().pin;

    const oldPin = pinValues.old;
    const newPin = pinValues.new;
    const confirmPin = pinValues.confirm;

    if (newPin.length < 6) {
      alert("PIN must be 6 digits");
      return;
    }

    if (newPin !== confirmPin) {
      alert("PINs do not match");
      return;
    }

    if (hasPin) {
      if (oldPin !== doc.data().pin) {
        alert("Old PIN is incorrect");
        return;
      }
      await userRef.update({ pin: newPin });
      alert("PIN updated successfully!");
    } else {
      await userRef.set({ pin: newPin }, { merge: true });
      alert("PIN set successfully!");
    }

    // ✅ Reset pins
    pinValues = { old: "", new: "", confirm: "" };
    updatePinDisplay();

    // ✅ Auto redirect back to Me tab
    activateTab('me');
    setupPinTab(); // refresh button label
  }

  // 🔹 Keypad functions
  function pressKey(num) {
    if (pinValues[currentInput].length < 6) {
      pinValues[currentInput] += num;
      updatePinDisplay();
    }
  }

  function deleteKey() {
    if (pinValues[currentInput].length > 0) {
      pinValues[currentInput] = pinValues[currentInput].slice(0, -1);
      updatePinDisplay();
    }
  }

  function updatePinDisplay() {
    ["old", "new", "confirm"].forEach(type => {
      const display = document.getElementById(type + "PinDisplay");
      if (display) {
        [...display.children].forEach((dot, i) => {
          dot.classList.remove("bg-gray-800", "rounded-full");
          if (pinValues[type][i]) {
            dot.classList.add("bg-gray-800", "rounded-full");
          }
        });
      }
    });
  }


// 🔹 set input and highlights 

  function setInput(type) {
  currentInput = type;

  ["old", "new", "confirm"].forEach(t => {
    const el = document.getElementById(t + "PinDisplay");
    if (el) {
      if (t === type) {
        el.classList.add("border-blue-500", "bg-blue-50", "shadow-sm");
      } else {
        el.classList.remove("border-blue-500", "bg-blue-50", "shadow-sm");
      }
    }
  });
}

  // 🔹 When opening the tab
  function openPinTab() {
    setupPinTab();
    activateTab('pinTab');
  }



function pressKey(num) {
  if (pinValues[currentInput].length < 6) {
    pinValues[currentInput] += num;
    updatePinDisplay();

    // ✅ Auto move to next field if full
    if (pinValues[currentInput].length === 6) {
      if (currentInput === "old") {
        currentInput = "new";
      } else if (currentInput === "new") {
        currentInput = "confirm";
      } else if (currentInput === "confirm") {
        // optional: auto save
        // savePin();
      }
    }
  }
}








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

  // Show sheet
  function showPinIntro() {
    const overlay = document.getElementById("pinIntroSheet");
    const drawer = document.getElementById("pinIntroDrawer");
    overlay.classList.remove("hidden");
    setTimeout(() => {
      drawer.classList.remove("translate-y-full");
    }, 50);
  }

  // Hide sheet
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


function activateTab(tabId) {
  document.querySelectorAll('.tab-section').forEach(t => t.classList.add('hidden'));
  const currentTab = document.getElementById(tabId);
  if (currentTab) currentTab.classList.remove('hidden');

  

  // Hide navbars for AI Help Center
  const topNavbar = document.getElementById("topNavbar");
  const bottomNav = document.getElementById("bottomNav");
  const backArrowBar = document.getElementById("backArrowBar");

  const hideAllNav = (tabId === "aiHelpCenter");
  if (topNavbar) topNavbar.style.display = hideAllNav ? "none" : "flex";
  if (bottomNav) bottomNav.style.display = hideAllNav ? "none" : "flex";
  if (backArrowBar) backArrowBar.classList.toggle("hidden", !hideAllNav);
}

// Handle Help Topics
function openAiTopic(topic) {
  const chatContainer = document.getElementById("chatContainer");
  const chatMessages = document.getElementById("chatMessages");
  chatMessages.innerHTML = "";

  chatContainer.classList.remove("hidden");

  let preset = "";
  if (topic === "aiContent") preset = "What can I do on this platform?";
  else if (topic === "paymentHelp") preset = "How do I make a payment on Globals?";
  else if (topic === "withdrawalHelp") preset = "How can I withdraw my earnings?";
  else if (topic === "taskHelp") preset = "How do I complete tasks and earn?";
  else if (topic === "ebookHelp") preset = "How do I buy an eBook on Globals?";
  else preset = "";

  if (preset) {
    document.getElementById("userMessage").value = preset;
    sendMessage();
  }
}

// 🔑 Replace this with your OpenAI API key
const OPENAI_API_KEY = "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";

// Send message to ChatGPT API
async function sendMessage() {
  const msg = document.getElementById("userMessage").value.trim();
  if (!msg) return;

  const chatBox = document.getElementById("chatMessages");
  chatBox.innerHTML += `<div class="bg-gray-100 p-3 rounded-lg w-fit max-w-xs ml-auto text-right">${msg}</div>`;
  document.getElementById("userMessage").value = "";

  // Loading indicator
  chatBox.innerHTML += `<div id="loading" class="text-sm text-gray-400">Typing...</div>`;

  try {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-3.5-turbo",
        messages: [{ role: "user", content: msg }],
      }),
    });

    const data = await res.json();
    document.getElementById("loading").remove();

    const reply = data.choices?.[0]?.message?.content || "I couldn't understand that.";
    chatBox.innerHTML += `<div class="bg-white border p-3 rounded-lg w-fit max-w-xs text-left">${reply}</div>`;
    chatBox.scrollTop = chatBox.scrollHeight;

  } catch (err) {
    document.getElementById("loading").remove();
    chatBox.innerHTML += `<div class="text-red-500">❌ Error connecting to AI.</div>`;
  }
}






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
function showTaskDetails(jobId, jobData) {
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

      <div class="mt-6">
        <h2 class="text-lg font-bold text-gray-800 mb-4">Proof</h2>
        <div id="proofFields">${generateProofUploadFields(proofCount)}</div>
        <input id="proofTextInput" type="text" placeholder="Enter email/username used (if needed)"
          class="w-full p-2 border border-gray-300 rounded-lg text-sm mt-2"
        />
      </div>

      <div class="flex items-center gap-3 mt-4">
        <button id="submitTaskBtn" class="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm">
          Submit Task
        </button>
        <div id="submitStatus" class="text-sm text-gray-600"></div>
      </div>
    </div>
  `;

  document.body.appendChild(fullScreen);

  // close
  fullScreen.querySelector("#closeTaskBtn").addEventListener("click", () => fullScreen.remove());

  // submit
  const submitBtn = fullScreen.querySelector("#submitTaskBtn");
  const status = fullScreen.querySelector("#submitStatus");

  submitBtn.addEventListener("click", async () => {
    submitBtn.disabled = true;
    status.textContent = "Checking auth...";

    try {
      const user = await waitForAuthReady();
      console.log("submit: currentUser ->", user);
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

      // upload files sequentially so we can show progress
      for (let i = 0; i < fileInputs.length; i++) {
        const fEl = fileInputs[i];
        const file = fEl.files[0];
        if (file) {
          status.textContent = `Uploading ${i + 1}/${fileInputs.length}...`;
          console.log("Uploading file:", file.name, file.size);
          // uses your global uploadToCloudinary(file) that returns a Promise with URL
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

      // ensure job data exists
      if (!jobId || !jobData) {
        console.error("Missing jobId/jobData at submit time");
        alert("❗ Missing job info. Refresh and try again.");
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

      const docRef = await firebase.firestore().collection("task_submissions").add(submissionData);
      console.log("Submission saved:", docRef.id);

      alert("✅ Task submitted for review!");
      fullScreen.remove();
    } catch (err) {
      console.error("Submit error:", err);
      alert("❗ Failed to submit task: " + (err && err.message ? err.message : String(err)));
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
    function showAffiliateJobDetails(jobId, jobData) {
      ensureDetailStyles();
      const detailsSection = ensureDetailScreen();

      if (affiliateTasksContainer) affiliateTasksContainer.style.display = 'none';
      detailsSection.style.display = 'flex';

      function safeHtmlText(s) {
        return escapeHtml(s || '').replace(/\n/g, '<br>');
      }

      const targetLinkHtml = jobData.targetLink
        ? `<a href="${escapeHtml(jobData.targetLink)}" target="_blank" rel="noopener noreferrer" class="text-blue-600 break-words">${escapeHtml(jobData.targetLink)}</a>`
        : `<span class="text-gray-500">No link provided</span>`;

      const proofHtml = safeHtmlText(jobData.proofRequired || 'Proof details not provided');
      const instructionsHtml = safeHtmlText(jobData.instructions || 'No instructions provided');

      const proofFileCount = jobData.proofFileCount || 1;

      // Template includes a small modal progress area (modalProgressText + modalProgressBar) which we'll populate below
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

            <!-- Submit Proof Section -->
            <div style="padding:12px;border-radius:12px;border:1px solid #dbeafe;background:#f8fafc;margin-bottom:16px">
              <div style="font-weight:700;margin-bottom:10px;color:#1e3a8a">Submit Proof</div>
              <form id="proofForm" style="display:flex;flex-direction:column;gap:10px">
                ${Array.from({ length: proofFileCount }).map((_, i) => `
                  <div>
                    <label style="font-size:13px;font-weight:600;display:block;margin-bottom:4px">Upload File ${i+1}</label>
                    <input type="file" name="proofFile${i+1}" accept="image/*" style="border:1px solid #cbd5e1;border-radius:8px;padding:6px;width:100%">
                  </div>
                `).join("")}
                <div>
                  <label style="font-size:13px;font-weight:600;display:block;margin-bottom:4px">Extra Proof (e.g email/phone)</label>
                  <textarea name="extraProof" rows="3" placeholder="Enter additional proof..." style="border:1px solid #cbd5e1;border-radius:8px;padding:8px;width:100%"></textarea>
                </div>
                <button id="submitTaskBtn" class="btn-primary" style="width:100%;padding:10px;border-radius:10px;font-weight:600">Submit Task</button>
              </form>
            </div>

            <!-- Submitted Info -->
            <div id="submittedInfo" style="display:none;padding:12px;border-radius:12px;border:1px solid #bbf7d0;background:#ecfdf5;color:#065f46"></div>
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

      // handle proof submission
      const form = detailsSection.querySelector('#proofForm');
      const submitInfo = detailsSection.querySelector('#submittedInfo');
      if (form) {
        form.addEventListener('submit', async (e) => {
          e.preventDefault();
          const user = firebase.auth().currentUser;
          if (!user) return alert("You must be logged in.");

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
          for (let i = 0; i < proofFileCount; i++) {
            const fileInput = form[`proofFile${i+1}`];
            if (fileInput && fileInput.files.length > 0) {
              try {
                const url = await uploadToCloudinary(fileInput.files[0]);
                proofData.files.push(url);
              } catch (err) {
                console.error("Cloudinary upload failed", err);
                alert("File upload failed. Please try again.");
                return;
              }
            }
          }

          // check if user already submitted
          const existing = await db.collection("affiliate_submissions")
            .where("jobId", "==", jobId)
            .where("userId", "==", user.uid)
            .get();

          if (!existing.empty) {
            alert("You have already submitted this task.");
            return;
          }

          await db.collection("affiliate_submissions").add(proofData);

          form.style.display = "none";
          submitInfo.style.display = "block";
          submitInfo.textContent = "✅ You have submitted your proof. Awaiting review.";

          // update modal progress (the global submissions listener will update the grid; we reflect locally too)
          const cached = jobCache.get(jobId) || {};
          const newApproved = cached.approvedCount || 0; // still requires admin approval to increment approvedCount
          const total = jobData.numWorkers || 0;
          const percent = total ? Math.min(100, Math.round((newApproved / total) * 100)) : 0;
          const txt = detailsSection.querySelector('#modalProgressText');
          const bar = detailsSection.querySelector('#modalProgressBar > i');
          if (txt) txt.textContent = `${newApproved}/${total} workers • ${percent}%`;
          if (bar) bar.style.width = percent + '%';
        });
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

function loadNotifications() {
    const notifList = document.getElementById("notificationList");
    notifList.innerHTML = `<p class="text-gray-500 text-center">Loading...</p>`;

    firebase.firestore().collection("notifications")
      .orderBy("timestamp", "desc")
      .get()
      .then(snapshot => {
        notifList.innerHTML = "";
        if (snapshot.empty) {
          notifList.innerHTML = `<p class="text-gray-400 text-center">No notifications yet.</p>`;
        } else {
          snapshot.forEach(doc => {
            const data = doc.data();
            const date = data.timestamp?.toDate().toLocaleString() || "Just now";
            notifList.innerHTML += `
              <div class="bg-white rounded-xl p-4 shadow-md border-l-4 border-blue-400 animate-fade-in">
                <p class="text-gray-800 font-semibold">${data.title}</p>
                <p class="text-sm text-gray-600">${data.message}</p>
                <p class="text-xs text-gray-500 mt-1">${date}</p>
              </div>`;
          });
        }
      })
      .catch(err => {
        notifList.innerHTML = `<p class="text-red-500 text-center">Failed to load notifications</p>`;
        console.error(err);
      });
  }

  // Call this on page/tab load
  loadNotifications();







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

document.getElementById('transactionFilter').addEventListener('change', function () {
  const status = this.value;
  const items = document.querySelectorAll('#transactionList > div');

  items.forEach(item => {
    const text = item.innerText.toLowerCase();
    if (status === 'all' || text.includes(status)) {
      item.style.display = 'flex';
    } else {
      item.style.display = 'none';
    }
  });
});


var swiper = new Swiper(".mySwiper", {
    slidesPerView: 1.4,
    spaceBetween: 12,
    freeMode: true,
  });
  
  
  
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
      metadata: { uid: user.uid }, // will help server/webhook map transaction to user
      callback: async function(response) {
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

 


                    



// Set the amount for airtime purchase
function setAmount(amount) {
  document.getElementById('airtime-amount').value = amount;
}

// Navigate to the confirmation screen
function goToConfirmScreen() {
  const network = document.getElementById('airtime-network').value;
  const phone = document.getElementById('airtime-phone').value;
  const amount = document.getElementById('airtime-amount').value;

  if (!network || !phone || !amount) {
    alert('Please fill in all fields');
    return;
  }

  // Fetch user balance from Firebase
  fetch('/get-balance')
    .then(response => response.json())
    .then(data => {
      if (data.balance < amount) {
        alert('Insufficient balance');
        return;
      }

      // Update confirmation screen
      document.getElementById('confirm-network').textContent = network;
      document.getElementById('confirm-phone').textContent = phone;
      document.getElementById('confirm-amount').textContent = amount;
      document.getElementById('confirm-balance').textContent = data.balance;

      // Show confirmation screen
      document.getElementById('airtime-screen').classList.add('hidden');
      document.getElementById('confirm-airtime-screen').classList.remove('hidden');
    });
}

// Handle airtime payment
function payAirtime() {
  const network = document.getElementById('confirm-network').textContent;
  const phone = document.getElementById('confirm-phone').textContent;
  const amount = document.getElementById('confirm-amount').textContent;
  const pin = document.getElementById('confirm-pin').value;

  if (!pin) {
    alert('Please enter your PIN');
    return;
  }

  // Send payment request to server
  fetch('/purchase-airtime', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      network,
      phone,
      amount,
      pin,
    }),
  })
    .then(response => response.json())
    .then(data => {
      if (data.success) {
        alert('Airtime purchase successful');
        // Navigate back to dashboard
        activateTab('dashboard');
      } else {
        alert('Airtime purchase failed');
      }
    });
}

















