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

        try {
            // ✅ Loop through all file inputs and upload to Cloudinary
            for (let i = 0; i < files.length; i++) {
                const fileInput = files[i];
                const file = fileInput.files[0];

                if (file) {
                    const url = await uploadToCloudinary(file); // ✅ Uses the global Cloudinary function
                    uploadedFiles.push(url);
                }
            }

            if (uploadedFiles.length === 0) {
                return alert("❗ Please upload at least one proof image.");
            }

            // ✅ Prepare data for Firestore
            const submissionData = {
                taskId: jobId,
                userId: user.uid,
                proofText,
                proofImages: uploadedFiles,
                submittedAt: firebase.firestore.FieldValue.serverTimestamp(),
                status: "on review",
                workerEarn: jobData.workerEarn || 0
            };

            // ✅ Save to Firestore
            await firebase.firestore().collection("task_submissions").add(submissionData);

            alert("✅ Task submitted for review!");
            fullScreen.remove();

        } catch (err) {
            console.error("Error during submission:", err);
            alert("❗ Failed to submit task. Please try again.");
        }
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


		

	







	
                                    //AFFILIATE 





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








































































