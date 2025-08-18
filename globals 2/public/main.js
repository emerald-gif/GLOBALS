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
  

  const premiumRequiredSections = ["whatsapp-task", "tiktok-task", "affiliate-tasks",
								   "myJobsSection", "adminJobsSwiperContainer", "nftSection"];

  firebase.auth().onAuthStateChanged((user) => {
    if (!user) return;
    const currentUserId = user.uid;
    const userRef = firebase.firestore().collection("users").doc(currentUserId);

    const goPremiumBtn = document.querySelector(".go-premium-btn");

    // live check for premium status
    userRef.onSnapshot((doc) => {
      if (!doc.exists) return;
      const userData = doc.data();

      if (userData.is_Premium) {
        goPremiumBtn.innerText = "👑 Premium Active";
        goPremiumBtn.disabled = true;
        goPremiumBtn.style.opacity = "0.7";
      } else {
        goPremiumBtn.innerText = "👑 Go Premium";
        goPremiumBtn.disabled = false;
        goPremiumBtn.style.opacity = "1";
      }
    });

    // upgrade flow
    document.querySelector(".go-premium-btn").addEventListener("click", async () => {
  const user = firebase.auth().currentUser;
  if (!user) return;

  const userRef = db.collection("users").doc(user.uid);
  const snap = await userRef.get();
  if (!snap.exists) return;

  const data = snap.data();
  const balance = data.balance || 0;

  if (balance < 1000) {
    // insufficient funds
    showAlert("⚠️ Insufficient balance. Please deposit at least ₦1,000.", () => {
      showSection("depositSection"); 
    });
    return;
  }

  // deduct and upgrade
  await userRef.update({
    balance: balance - 1000,
    is_Premium: true
  });

  // success
  showAlert("🎉 Your account has been upgraded to Premium!", () => {
    showSection("dashboard");
    const btn = document.querySelector(".go-premium-btn");
    if (btn) {
      btn.innerText = "✅ Premium Active";
      btn.disabled = true;
    }
  });
});

// === PREMIUM SECTION PROTECTION ===
const premiumRequiredSections = ["whatsapp-section", "instagram-section", "nft-badge-section"];

premiumRequiredSections.forEach(sectionId => {
  const trigger = document.querySelector(`[data-section='${sectionId}']`);
  if (!trigger) return;

  trigger.addEventListener("click", async (e) => {
    e.preventDefault();

    const user = firebase.auth().currentUser;
    if (!user) return;

    const snap = await db.collection("users").doc(user.uid).get();
    if (!snap.exists) return;

    const { is_Premium = false } = snap.data();

    if (!is_Premium) {
      showAlert("🔒 This feature is for Premium users only.", () => {
        showSection("premium-section");
      });
      return;
    }

    // ✅ allow only Premium users
    showSection(sectionId);
  });
});






function showAlert(message, callback) {
  const alertBox = document.getElementById("globalAlert");
  const alertMessage = document.getElementById("alertMessage");
  const okBtn = document.getElementById("alertOkBtn");

  alertMessage.innerText = message;
  alertBox.classList.remove("hidden");

  // Reset old listeners
  const newOkBtn = okBtn.cloneNode(true);
  okBtn.parentNode.replaceChild(newOkBtn, okBtn);

  newOkBtn.addEventListener("click", () => {
    alertBox.classList.add("hidden");
    if (callback) callback();
  });
}






                                                                        //INSTALL AND EARN FUCTION

















firebase.firestore().collection("tasks")
  .where("status", "==", "approved")
  .onSnapshot(snapshot => {
    const taskContainer = document.getElementById("task-jobs");
    const searchInput = document.getElementById("taskSearch");
    const filterSelect = document.getElementById("taskCategoryFilter");

    let tasks = [];

    snapshot.forEach(doc => {
      const jobData = doc.data();
      tasks.push({ id: doc.id, ...jobData });
    });

    function renderTasks() {
      const keyword = searchInput.value.toLowerCase();
      const selectedCategory = filterSelect.value;

      taskContainer.innerHTML = "";

      tasks
        .filter(task => {
          const matchesCategory = selectedCategory === "" || task.category === selectedCategory;
          const matchesSearch = task.title.toLowerCase().includes(keyword);
          return matchesCategory && matchesSearch;
        })
        .forEach(task => {
          createTaskCard(task.id, task);
        });
    }

    searchInput.addEventListener("input", renderTasks);
    filterSelect.addEventListener("change", renderTasks);

    renderTasks(); // initial render
  });


 


function createTaskCard(jobId, jobData) {
  const taskContainer = document.getElementById("task-jobs");

  // Create the base card
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
  meta.textContent = `${jobData.category} • ${jobData.subCategory}`;

  const earn = document.createElement("p");
  earn.textContent = `Earn: ₦${jobData.workerEarn || 0}`;
  earn.className = "text-sm text-green-600 font-semibold mt-1";
  
  
  
  const rate = document.createElement("p");
rate.className = "text-xs text-gray-500";
rate.textContent = `Progress: loading...`; // placeholder

const total = jobData.numWorkers || 0;

firebase.firestore()
  .collection("task_submissions")
  .where("taskId", "==", jobId)
  .where("status", "==", "approved")
  .get()
  .then(querySnapshot => {
    const done = querySnapshot.size;
    const progress = `${done} / ${total}`;
    rate.textContent = `Progress: ${progress}`;
  });


	

  const button = document.createElement("button");
  button.textContent = "View Task";
  button.className = `
    mt-3 bg-blue-600 hover:bg-blue-700 text-white text-xs px-4 py-2
    rounded-lg shadow-sm transition
  `;
  button.addEventListener("click", () => {
    showTaskDetails(jobId, jobData);
  });

  content.appendChild(title);
  content.appendChild(meta);
  content.appendChild(earn);
  content.appendChild(rate);
  content.appendChild(button);

  card.appendChild(image);
  card.appendChild(content);

  taskContainer.appendChild(card);
}


function showTaskDetails(jobId, jobData) {
  const fullScreen = document.createElement("div");
  fullScreen.className = `
    fixed inset-0 bg-white z-50 overflow-y-auto p-6
  `;

  fullScreen.innerHTML = `
    <div class="max-w-2xl mx-auto space-y-6">
      <button onclick="this.parentElement.parentElement.remove()"
        class="text-blue-600 font-bold text-sm underline">← Back to Tasks</button>

      <h1 class="text-2xl font-bold text-gray-800">${jobData.title}</h1>
      <p class="text-sm text-gray-500">${jobData.category} • ${jobData.subCategory}</p>

      <img src="${jobData.screenshotURL || 'https://via.placeholder.com/400'}"
        alt="Task Preview"
        class="w-full h-64 object-cover rounded-xl border"
      />

      <div>
        <h2 class="text-lg font-semibold text-gray-800 mb-2">Task Description</h2>
        <p class="text-gray-700 text-sm whitespace-pre-line">${jobData.description || "No description provided"}</p>
      </div>

      <div>
        <h2 class="text-lg font-semibold text-gray-800 mb-2">Proof Required</h2>
        <p class="text-sm text-gray-700">${jobData.proof || "Provide the necessary screenshot or details."}</p>
      </div>

      <div class="mt-6">
        <h2 class="text-lg font-bold text-gray-800 mb-4">Proof</h2>
        ${generateProofUploadFields(jobData.proofFileCount || 1)}

        <input type="text" placeholder="Enter email/username used (if needed)"
          class="w-full p-2 border border-gray-300 rounded-lg text-sm mt-2"
        />
      </div>

      <button id="submitTaskBtn" class="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm mt-4">
        Submit Task
      </button>
    </div>
  `;

  document.body.appendChild(fullScreen);

  // ✅ Add event listener after DOM is added
const button = fullScreen.querySelector("#submitTaskBtn");

if (button) {
    button.addEventListener("click", async () => {
        const user = firebase.auth().currentUser;
        if (!user) return alert("Please log in to submit task.");

        const proofText = fullScreen.querySelector('input[type="text"]').value.trim();
        const files = fullScreen.querySelectorAll('input[type="file"]');
        const uploadedFiles = [];

        // Loop through all file inputs
        for (let i = 0; i < files.length; i++) {
            const fileInput = files[i];
            const file = fileInput.files[0];

            if (file) {
                try {
                    // Use the universal Cloudinary function
                    await new Promise((resolve, reject) => {
                        uploadToCloudinary(file, (url) => {
                            if (url) {
                                uploadedFiles.push(url);
                                resolve();
                            } else {
                                reject("Upload failed");
                            }
                        });
                    });
                } catch (err) {
                    console.error("Cloudinary upload error:", err);
                    alert("❗ Failed to upload image. Please try again.");
                    return;
                }
            }
        }

        if (uploadedFiles.length === 0) {
            return alert("❗ Please upload at least one proof image.");
        }

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
});
}







function generateProofUploadFields(count) {
  let html = '';
  for (let i = 1; i <= count; i++) {
    html += `
      <div class="mb-4">
        <label class="block text-sm font-medium text-gray-700 mb-1">Upload Proof ${i}</label>
        <input type="file" class="w-full p-2 border border-gray-300 rounded-lg text-sm" />
      </div>
    `;
  }
  return html;
}


}








                                    //AFFILIATE 


// ---- Firestore alias ----
// const db = firebase.firestore(); // Removed duplicate declaration, already declared at the top

// ---- Small util ----
function escapeHtml(s = "") {
  return String(s).replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[m]));
}

// ---- Inject CSS once for overlay + collapsible instructions ----
function ensureDetailStyles() {
  if (document.getElementById("affiliate-detail-styles")) return;
  const style = document.createElement("style");
  style.id = "affiliate-detail-styles";
  style.textContent = `
    /* Card look */
    .aff-card { background:#fff; border-radius:18px; border:1px solid rgba(0,0,0,.06); box-shadow:0 6px 26px rgba(16,24,40,.06); transition:transform .2s, box-shadow .2s; }
    .aff-card:hover { transform:translateY(-2px); box-shadow:0 10px 28px rgba(16,24,40,.10); }

    /* Overlay */
    .aff-overlay { position:fixed; inset:0; z-index:9999; display:flex; align-items:flex-start; justify-content:center; overflow:auto; padding:24px; background:rgba(2,6,23,.56); backdrop-filter: blur(6px);}
    .aff-sheet { width:min(720px, 100%); background:#fff; border-radius:20px; overflow:hidden; box-shadow:0 30px 80px rgba(2,6,23,.25);}
    .aff-head { background: linear-gradient(135deg, #facc15 0%, #3b82f6 100%); padding:22px 24px; color:#fff; }
    .aff-close { position:absolute; right:18px; top:18px; background:rgba(255,255,255,.15); border:1px solid rgba(255,255,255,.2); width:36px; height:36px; border-radius:10px; display:grid; place-items:center; color:#fff; }
    .aff-close:hover { background:rgba(255,255,255,.25); }

    /* Collapsible instructions */
    .collapsible { overflow:hidden; transition:max-height .32s ease; line-height:1.625; position:relative; }
    .collapsible.is-collapsed { max-height: 6.5em; } /* ≈ 4 lines */
    .collapsible .fade-edge { content:""; position:absolute; left:0; right:0; bottom:0; height:2.2em;
      background: linear-gradient(to bottom, rgba(255,255,255,0), #ffffff 70%); pointer-events:none; transition:opacity .2s; }
    .collapsible:not(.is-collapsed) .fade-edge { opacity:0; }

    .grad-bar { height:8px; border-radius:999px; background:linear-gradient(90deg,#facc15,#3b82f6); }
    .chip { font-size:.72rem; background:#f1f5f9; color:#475569; padding:.25rem .5rem; border-radius:999px; }
    .btn-primary {
      background:linear-gradient(135deg,#facc15,#3b82f6);
      color:#fff; border:none; border-radius:12px; padding:.75rem 1rem; font-weight:600;
      box-shadow:0 6px 18px rgba(59,130,246,.25); transition:transform .1s, filter .2s;
    }
    .btn-primary:hover { filter:saturate(1.1) brightness(1.02); }
    .btn-primary:active { transform:translateY(1px) scale(.99); }
  `;
  document.head.appendChild(style);
}


// --- Add this helper near the top of your affiliate script ---
function ensureDetailScreen() {
  // returns an existing #affiliate-detail-screen or creates it
  let el = document.getElementById("affiliate-detail-screen");
  if (!el) {
    el = document.createElement("div");
    el.id = "affiliate-detail-screen";
    el.style.display = "none";
    // Put it immediately after the affiliateTasksContainer if available
    if (typeof affiliateTasksContainer !== "undefined" && affiliateTasksContainer && affiliateTasksContainer.parentNode) {
      affiliateTasksContainer.parentNode.insertBefore(el, affiliateTasksContainer.nextSibling);
    } else {
      document.body.appendChild(el);
    }
  }
  return el;
}



// ---- Card rendering + live data ----
const affiliateTasksContainer = document.getElementById("affiliate-tasks");
const jobCache = new Map(); // id -> jobData

function renderAffiliateCard({ id, job, approvedCount }) {
  const total = job.numWorkers || 0;
  const percent = total ? Math.min(100, Math.round((approvedCount / total) * 100)) : 0;

  const card = document.createElement("div");
  card.className = `
    aff-card flex flex-col w-[calc(50%-0.5rem)] rounded-2xl overflow-hidden shadow-md bg-white
  `;

  card.innerHTML = `
    <!-- Top Image -->
    <div class="h-32 w-full overflow-hidden">
      <img src="${job.campaignLogoURL || job.screenshotURL || 'https://via.placeholder.com/300x200'}"
           alt="${escapeHtml(job.title)}"
           class="w-full h-full object-cover" />
    </div>

    <!-- Card Content -->
    <div class="p-3 flex flex-col flex-1">
      <h3 class="text-sm font-semibold text-gray-900 line-clamp-2">
        ${escapeHtml(job.title || "Untitled")}
      </h3>

      <!-- Pay above progress -->
      <p class="text-[11px] text-blue-600 font-medium mt-1">
        Pay: ₦${job.workerPay || 0}
      </p>

      <div class="mt-1">
        <div class="flex justify-between text-xs text-gray-500 mb-1">
          <span>${approvedCount}/${total} workers</span>
          <span>${percent}%</span>
        </div>
        <div class="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
          <div class="grad-bar" style="width:${percent}%;"></div>
        </div>
      </div>

      <!-- View Job -->
      <button class="view-job-btn mt-3 py-1 px-2 text-xs bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
              data-id="${id}">
        View Job
      </button>
    </div>
  `;

  return card;
}

// Live listener; rebuild grid on changes
function startAffiliateJobsListener() {
  ensureDetailStyles();
  // (Re)subscribe
  db.collection("affiliateJobs")
    .where("status", "==", "approved")
    .onSnapshot(async (snap) => {
      affiliateTasksContainer.innerHTML = "";
      jobCache.clear();

      // Build an array of jobs + parallel fetch of approved submission counts
      const jobs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      // store cache
      jobs.forEach(j => jobCache.set(j.id, j));

      // Parallel counts
      const countPromises = jobs.map(j =>
        db.collection("affiliate_submissions")
          .where("jobId", "==", j.id)
          .where("status", "==", "approved")
          .get()
          .then(q => ({ id: j.id, count: q.size }))
      );
      const counts = await Promise.all(countPromises);
      const countById = Object.fromEntries(counts.map(x => [x.id, x.count]));

      // Render
      const frag = document.createDocumentFragment();
      jobs.forEach(j => {
        const card = renderAffiliateCard({ id: j.id, job: j, approvedCount: countById[j.id] || 0 });
        frag.appendChild(card);
      });
      affiliateTasksContainer.appendChild(frag);
    });
}
startAffiliateJobsListener();

// Delegate clicks for "View Job"
affiliateTasksContainer.addEventListener("click", (e) => {
  const btn = e.target.closest(".view-job-btn");
  if (!btn) return;
  const id = btn.dataset.id;
  const job = jobCache.get(id);
  if (job) showAffiliateJobDetails(id, job);
});




// --- Replace your existing showAffiliateJobDetails with this (keeps your styles/collapsible logic) ---
function showAffiliateJobDetails(jobId, jobData) {
  ensureDetailStyles();
  const detailsSection = ensureDetailScreen();

  // hide the grid, show the details "screen"
  if (affiliateTasksContainer) affiliateTasksContainer.style.display = "none";
  detailsSection.style.display = "block";

  // Safe escaped values are used (you already have escapeHtml)
  detailsSection.innerHTML = `
    <div class="max-w-2xl mx-auto">
      <button class="aff-close mt-4 mb-4 inline-flex items-center gap-2 text-blue-700 font-semibold">
        ← Back to jobs
      </button>

      <div class="aff-sheet relative overflow-hidden">
        <div class="aff-head">
          <div class="flex items-center gap-3">
            <div class="w-11 h-11 rounded-xl overflow-hidden ring-1 ring-white/30 bg-white/20 backdrop-blur">
              <img src="${jobData.campaignLogoURL || jobData.screenshotURL || 'https://via.placeholder.com/96'}"
                   class="w-full h-full object-cover" alt="">
            </div>
            <div>
              <h3 class="text-lg font-bold leading-tight">${escapeHtml(jobData.title || "Affiliate Job")}</h3>
              <p class="text-xs opacity-90">${escapeHtml(jobData.category || "Affiliate Campaign")}</p>
            </div>
          </div>
        </div>

        <div class="p-6 space-y-6">
          <div class="grid grid-cols-2 gap-4">
            <div class="p-4 rounded-xl border border-gray-100">
              <div class="text-[11px] text-gray-500">Worker Pay</div>
              <div class="text-2xl font-extrabold text-gray-900">₦${jobData.workerPay || 0}</div>
            </div>
            <div class="p-4 rounded-xl border border-gray-100">
              <div class="text-[11px] text-gray-500">Total Workers</div>
              <div class="text-2xl font-extrabold text-gray-900">${jobData.numWorkers || 0}</div>
            </div>
          </div>

          <div class="rounded-xl border border-gray-100 p-4">
            <div class="flex items-center justify-between">
              <h2 class="font-semibold text-gray-800">Instructions</h2>
              <button id="toggleInstr" class="inline-flex items-center gap-1 text-sm font-medium text-blue-700">
                <span>Show more</span>
                <svg class="w-4 h-4 transition-transform duration-300" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>
                </svg>
              </button>
            </div>
            <div id="instructionsPanel" class="collapsible is-collapsed text-[15px] leading-relaxed text-gray-700 mt-2">
              ${escapeHtml(jobData.instructions || "No instructions provided")}
              <div class="fade-edge"></div>
            </div>
          </div>

          <div class="rounded-xl border border-gray-100 p-4">
            <h2 class="font-semibold text-gray-800 mb-1">Target Link</h2>
            ${
              jobData.targetLink
                ? `<a href="${jobData.targetLink}" target="_blank" class="text-blue-700 underline break-all">${escapeHtml(jobData.targetLink)}</a>`
                : `<p class="text-gray-500 text-sm">No link provided</p>`
            }
          </div>

          <div class="rounded-xl border border-gray-100 p-4">
            <h2 class="font-semibold text-gray-800 mb-1">Proof Required</h2>
            <p class="text-gray-700 text-sm">${escapeHtml(jobData.proofRequired || "Proof details not provided")}</p>
          </div>

          <button class="btn-primary w-full">Submit Task</button>
        </div>
      </div>
    </div>
  `;

  // Back button returns to the list (same section)
  const backBtn = detailsSection.querySelector(".aff-close");
  if (backBtn) {
    backBtn.addEventListener("click", () => {
      // hide and clean details screen
      detailsSection.style.display = "none";
      detailsSection.innerHTML = "";
      if (affiliateTasksContainer) {
        affiliateTasksContainer.style.display = "";
        // scroll user to top of the affiliate grid smoothly
        try { affiliateTasksContainer.scrollIntoView({ behavior: "smooth", block: "start" }); } catch(e) {}
      }
    });
  }

  // Collapsible toggle (safe-guarded)
  const panel = detailsSection.querySelector("#instructionsPanel");
  const toggle = detailsSection.querySelector("#toggleInstr");
  if (toggle && panel) {
    const label = toggle.querySelector("span");
    const icon = toggle.querySelector("svg");

    toggle.addEventListener("click", () => {
      const collapsed = panel.classList.contains("is-collapsed");
      if (collapsed) {
        panel.style.maxHeight = panel.scrollHeight + "px";
        panel.classList.remove("is-collapsed");
        if (label) label.textContent = "Show less";
        if (icon) icon.style.transform = "rotate(180deg)";
        setTimeout(() => { panel.style.maxHeight = ""; }, 320);
      } else {
        panel.style.maxHeight = panel.scrollHeight + "px";
        requestAnimationFrame(() => {
          panel.classList.add("is-collapsed");
          requestAnimationFrame(() => { panel.style.maxHeight = ""; });
        });
        if (label) label.textContent = "Show more";
        if (icon) icon.style.transform = "rotate(0deg)";
      }
    });
  }
}



                   
                    //ADMIN SWIPER 

// Swiper init
const adminJobsSwiper = new Swiper('.myAdminJobsSwiper', {
  slidesPerView: 'auto',
  centeredSlides: true,
  centeredSlidesBounds: true,
  spaceBetween: 18,
  loop: true,
  autoplay: { delay: 4000, disableOnInteraction: false },
  pagination: { el: '.swiper-pagination', clickable: true },
});

// Live listener
db.collection("adminJobs").orderBy("postedAt", "desc").limit(5)
  .onSnapshot(snapshot => {
    const container = document.getElementById("adminJobsSwiperContainer");
    container.innerHTML = "";

    snapshot.forEach(doc => {
      const job = doc.data();
      const slide = document.createElement("div");
      slide.className = "swiper-slide";

      slide.innerHTML = `
        <div class="job-card shadow-md h-56">
          <img src="${job.campaignLogoURL || 'https://via.placeholder.com/800x400'}"
               class="w-full h-full object-cover" />

          <!-- Bottom overlay -->
          <div class="absolute bottom-0 left-0 right-0 bg-black/50 text-white p-3">
            <div class="font-bold text-sm">${job.title || ''}</div>

            <div class="mt-2 pr-20 flex items-center">
              <img src="${job.campaignLogoURL || 'https://via.placeholder.com/40'}"
                   class="w-8 h-8 rounded-full object-cover mr-2" />
              <div class="text-xs leading-tight">
                <div>₦${job.workerPay || 0} • ${job.numWorkers || 0} workers</div>
                <div class="text-gray-300">${job.category || ''}</div>
              </div>
            </div>
          </div>

          <!-- Blue View Job button -->
          <button
            class="absolute right-3 bottom-3 bg-blue-500 text-white px-3 py-1 rounded text-xs font-semibold view-job-btn"
            data-id="${doc.id}">
            View Job
          </button>
        </div>
      `;
      container.appendChild(slide);
    });

    adminJobsSwiper.update();
  });

// Handle clicks
document.getElementById("adminJobsSwiperContainer").addEventListener("click", (e) => {
  const btn = e.target.closest(".view-job-btn");
  if (!btn) return;
  const id = btn.dataset.id;
  db.collection("adminJobs").doc(id).get().then(d => {
    if (!d.exists) return;
    const job = d.data();
    alert(`Viewing: ${job.title}\nPay: ₦${job.workerPay}\nCategory: ${job.category}`);
  });
});

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


// 🔁 Show Referral Link inside Team Section
auth.onAuthStateChanged(async user => {
  if (!user) return;
  const doc = await db.collection("users").doc(user.uid).get();
  const data = doc.data();
  const username = data?.username || "user";
  document.getElementById("teamRefLink").value = `https://globals.com/signup.html?ref=${username}`;
});

// 📋 Copy referral link (Team Section)
window.copyTeamRefLink = function () {
  const input = document.getElementById("teamRefLink");
  input.select();
  document.execCommand("copy");
  document.getElementById("teamCopyMsg").classList.remove("hidden");
  setTimeout(() => {
    document.getElementById("teamCopyMsg").classList.add("hidden");
  }, 2000);
};

// 👥 Load Team Referrals
auth.onAuthStateChanged(async user => {
  if (!user) return;
  const userDoc = await db.collection("users").doc(user.uid).get();
  const username = userDoc.data()?.username;

  const level1Snap = await db.collection("users").where("referrer", "==", username).get();
  const level1Container = document.getElementById("level1Referrals");
  level1Container.innerHTML = "";
  level1Snap.forEach(doc => {
    const user = doc.data();
    level1Container.innerHTML += generateReferralCard(user, 1700);
  });

  // 2nd level
  const level2Container = document.getElementById("level2Referrals");
  level2Container.innerHTML = "";

  for (const doc of level1Snap.docs) {
    const lvl1Username = doc.data().username;
    const level2Snap = await db.collection("users").where("referrer", "==", lvl1Username).get();
    level2Snap.forEach(lvl2doc => {
      const user = lvl2doc.data();
      level2Container.innerHTML += generateReferralCard(user, 500);
    });
  }
});

// 🎴 Create referral card
function generateReferralCard(user, amount) {
  return `
    <div class="bg-gray-50 rounded-xl p-4 shadow-md flex items-center gap-4 hover:bg-blue-50 transition-all duration-300">
      <img src="${user.profile || 'https://ui-avatars.com/api/?name=' + user.username}" alt="User" class="w-12 h-12 rounded-full object-cover border-2 border-blue-400" />
      <div>
        <p class="text-sm font-semibold text-gray-800">@${user.username}</p>
        <p class="text-xs text-gray-600">Commission Earned: ₦${amount}</p>
      </div>
    </div>
  `;
}

// 🌀 Swiper for Team
document.addEventListener("DOMContentLoaded", function () {
  new Swiper('.team-swiper', {
    loop: false,
    slidesPerView: 1.1,
    spaceBetween: 20,
    pagination: {
      el: '.swiper-pagination',
      clickable: true
    },
    breakpoints: {
      768: { slidesPerView: 2.2 }
    }
  });
});
















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
  const proofFileCount = parseInt(document.getElementById("proofFileCount").value || "1");
  
  

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
async function submitAffiliateJob() {
  const category = document.getElementById("affiliateCategory").value;
  const title = document.getElementById("campaignTitle").value.trim();
  const instructions = document.getElementById("workerInstructions").value.trim();
  const targetLink = document.getElementById("targetLink").value.trim();
  const proofRequired = document.getElementById("proofRequired").value.trim();
  const numWorkers = parseInt(document.getElementById("numWorkers").value);
  const workerPay = parseInt(document.getElementById("workerPay").value);  
  const proofFileCount = parseInt(document.getElementById("proofFileCount").value || "1");
  const campaignLogoFile = document.getElementById("campaignLogoFile").files[0];
  

  if (!category || !title || !instructions || !targetLink || !proofRequired || !numWorkers || !workerPay) {
    alert("⚠️ Please fill in all required fields.");
    return;
  }

  const user = auth.currentUser;
  if (!user) {
    alert("⚠️ You must be logged in.");
    return;
  }

  try {
    const userDocRef = db.collection("users").doc(user.uid);
    const userSnap = await userDocRef.get();
    if (!userSnap.exists) {
      alert("⚠️ User profile not found.");
      return;
    }

    const userProfile = userSnap.data();

    // 🔢 Calculate Total
    
    const companyFee = 300;
    const total = (numWorkers * workerPay) + companyFee;

    const userBalance = userProfile.balance || 0;
    if (userBalance < total) {
      alert(`⚠️ Insufficient balance. Required ₦${total}, available ₦${userBalance}.`);
      return;
    }



    // 📤 Upload logo if provided
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




    // 🧾 Job Data
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
    companyFee,
    
    status: "on review", // Waiting for admin approval
    pinned: false,       // Only admin can change to true later
    pinnedStart: null,   // Admin will set this when they pin it

    postedAt: firebase.firestore.FieldValue.serverTimestamp(),

    postedBy: {
        uid: user.uid,
        name: userProfile.name || "",
        email: userProfile.email || "",
        phone: userProfile.phone || "",
        photo: userProfile.photo || ""
    }
};

    // 🔁 Save Job & Deduct Balance Atomically
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








//DEPOSIT FUNCTION(also check SERVER)

function validateEmail(email) {
  const re = /\S+@\S+\.\S+/;
  return re.test(email);
}

function handleDeposit() {
  const email = document.getElementById("depositEmail").value.trim();
  const amount = parseInt(document.getElementById("depositAmount").value.trim());

  const amountError = document.getElementById("amountError");

  // Reset error
  amountError.classList.add("hidden");

  if (!amount || amount < 100) {
    amountError.classList.remove("hidden");
    return;
  }

  // Ensure user is signed in
  const user = firebase.auth().currentUser;
  if (!user) {
    alert("You must be signed in to make a deposit.");
    return;
  }

  // Proceed to Paystack
  payWithPaystack(email, amount);
}


function payWithPaystack(email, amount) {
  var handler = PaystackPop.setup({
    key: "pk_live_8490c2179be3d6cb47b027152bdc2e04b774d22d", // <-- Replace with your REAL Paystack Public Key
    email: email,
    amount: amount * 100, // Convert to Kobo
    currency: "NGN",
    label: "Globals Deposit",
    callback: function (response) {
      alert("Payment successful! Ref: " + response.reference);
      // TODO: Save to Firebase here (we'll handle this next)
    },
    onClose: function () {
      alert("Transaction was cancelled");
    }
  });
  handler.openIframe();
}




firebase.auth().onAuthStateChanged(function (user) {
  if (user) {
    document.getElementById("depositEmail").value = user.email;
  } else {
    document.getElementById("depositEmail").value = "";
  }
});






                                                                 // SERVICE FUNCTION  

function openService(serviceName) {
    alert("Open " + serviceName + " screen");
    // Here, you’ll route to the corresponding screen
  }

   function openAllCategories() {
    document.getElementById("all-categories-screen").classList.remove("hidden");
  }

 


                    













const networkMap = {
  mtn: 'mtn-data',
  glo: 'glo-data',
  airtel: 'airtel-data',
  '9mobile': 'etisalat-data'
};

document.getElementById('data-network').addEventListener('change', async function () {
  const network = this.value;
  const serviceID = networkMap[network];
  const packageBox = document.getElementById('data-packages');

  packageBox.innerHTML = '';
  packageBox.classList.add('hidden');

  if (!serviceID) return;

  try {
    const response = await fetch(`/api/data-packages?serviceID=${serviceID}`);
    const result = await response.json();

    if (result && result.variations) {
      packageBox.classList.remove('hidden');

      result.variations.forEach(pkg => {
        const div = document.createElement('div');
        div.className = 'bg-gray-100 p-3 rounded-xl text-sm text-center cursor-pointer hover:bg-green-200 transition';
        div.innerText = `${pkg.name} - ₦${pkg.amount}`;
        div.setAttribute('data-code', pkg.variation_code);
        div.onclick = function () {
          document.getElementById('selected-package').value = pkg.variation_code;
          document.getElementById('data-amount').value = pkg.amount;
        };
        packageBox.appendChild(div);
      });
    } else {
      alert('No packages available');
    }

  } catch (error) {
    console.error('Failed to load VTpass packages:', error);
    alert('Could not fetch packages. Try again.');
  }
});







async function sendAirtimeToVTpass() {
  const phone = document.getElementById('airtime-phone').value;
  const amount = document.getElementById('airtime-amount').value;
  const network = document.getElementById('airtime-network').value;

  try {
    const res = await fetch('/api/airtime', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        phone,
        amount,
        serviceID: network
      })
    });

    const result = await res.json();
    document.getElementById('airtime-response').innerText =
      result.code === '000'
        ? '✅ Airtime purchase successful!'
        : '❌ ' + result.response_description;

  } catch (err) {
    document.getElementById('airtime-response').innerText = '⚠️ Error: ' + err.message;
  }
}























