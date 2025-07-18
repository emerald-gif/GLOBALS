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

tabBtns.forEach(btn => {
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

  // ✅ DASHBOARD: Show Welcome + Referral Link
  const dashboardUsername = document.getElementById("usernameDisplay");
  const referralInput = document.getElementById("refLink");
  if (dashboardUsername) dashboardUsername.textContent = `Welcome, @${data.username || "user"}`;
  if (referralInput) referralInput.value = `https://globals.com/signup.html?ref=${data.username}`;

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
















                                                                        //INSTALL AND EARN FUCTION





 const dummyTasks = [
    {
      id: 1,
      title: "Install TikTok & Earn",
      category: "Install",
      company: "OGAds",
      logo: "https://cdn-icons-png.flaticon.com/512/732/732200.png",
      trusted: true,
      location: "Nigeria",
      monthly: "₦700 per task",
      description: "Install and register to earn reward.",
      link: "YOUR_LINK_HERE_1"
    },
	
	
    {
      id: 2,
      title: "Play Game & Win ₦800",
      category: "Games",
      company: "OGAds",
      logo: "https://cdn-icons-png.flaticon.com/512/732/732200.png",
      trusted: true,
      location: "Global",
      monthly: "₦800 per task",
      description: "Play the game for 3 minutes to qualify.",
      link: "YOUR_LINK_HERE_2"
    },
	
	
    {
      id: 3,
      title: "Signup Bonus App",
      category: "Bonus",
      company: "OGAds",
      logo: "https://cdn-icons-png.flaticon.com/512/732/732200.png",
      trusted: true,
      location: "Nigeria",
      monthly: "₦600 per task",
      description: "Register and stay active for at least 2 minutes.",
      link: "YOUR_LINK_HERE_3"
    }
  ];



  let currentFilter = "All";

  function toggleFilterDropdown() {
    const dropdown = document.getElementById("filterDropdown");
    dropdown.classList.toggle("hidden");
  }

  function filterTasks(category) {
    currentFilter = category;
    document.getElementById("filterDropdown").classList.add("hidden");
    renderTasks();
  }

  function renderTasks() {
  const container = document.getElementById("ogadsTaskList");
  const searchInput = document.getElementById("searchTasks");
  const term = (searchInput?.value || "").toLowerCase();

  const filteredTasks = dummyTasks.filter(task => {
    const matchesSearch = task.title.toLowerCase().includes(term);
    const matchesCategory = currentFilter === "All" || task.category === currentFilter;
    return matchesSearch && matchesCategory;
  });

  container.innerHTML = "";

  filteredTasks.forEach(task => {
    const el = document.createElement("div");
    el.className = "bg-white rounded-2xl shadow-md p-4 flex justify-between items-center";

    el.innerHTML = `
      <div class="flex items-center gap-3">
        <img src="${task.logo}" alt="Logo" class="w-10 h-10 rounded-xl">
        <div>
          <h3 class="font-semibold text-md">${task.title}</h3>
          <p class="text-sm text-gray-500">${task.company} · ${task.location}</p>
          ${task.trusted ? `<span class="text-green-600 text-sm font-medium">✔ Trusted</span>` : ""}
          <p class="text-blue-600 text-sm mt-1">${task.monthly}</p>
        </div>
      </div>
      <button onclick="showTaskDetail(${task.id})" class="flex items-center gap-1 text-white bg-blue-600 hover:bg-blue-700 px-3 py-1.5 rounded-lg text-xs font-medium transition ml-4">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12H9m0 0H5m4 0h6" />
        </svg>
        View Task
      </button>
    `;

    container.appendChild(el);
  });
}

  function showTaskDetail(id) {
    const task = dummyTasks.find(t => t.id === id);
    if (!task) return;

    document.getElementById("taskLogo").src = task.logo;
    document.getElementById("taskTitle").textContent = task.title;
    document.getElementById("taskCompany").textContent = task.company + " · " + task.location;
    document.getElementById("taskDescription").textContent = task.description;
    document.getElementById("taskLink").href = task.link;

    document.getElementById("taskDetailModal").classList.remove("hidden");
  }

  function closeTaskModal() {
    document.getElementById("taskDetailModal").classList.add("hidden");
  }

  document.addEventListener("DOMContentLoaded", () => {
    renderTasks();
    document.getElementById("searchTasks").addEventListener("input", renderTasks);
  });




const taskRecords = [
  {
    id: 1,
    title: "TikTok App Install",
    status: "pending",
    amount: "₦500",
    date: "July 12, 2025"
  },
  {
    id: 2,
    title: "Play Game & Win",
    status: "approved",
    amount: "₦700",
    date: "July 11, 2025"
  },
  {
    id: 3,
    title: "Earn With App A",
    status: "pending",
    amount: "₦400",
    date: "July 13, 2025"
  }
];

function renderTaskStatusSection() {
  const pendingBox = document.getElementById("pendingTasks");
  const approvedBox = document.getElementById("approvedTasks");

  pendingBox.innerHTML = "";
  approvedBox.innerHTML = "";

  taskRecords.forEach(task => {
    const card = document.createElement("div");
    card.className = `bg-white p-4 rounded-xl shadow-sm border-l-4 ${
      task.status === "approved" ? "border-green-500" : "border-yellow-500"
    }`;

    card.innerHTML = `
      <h3 class="font-semibold text-gray-800">${task.title}</h3>
      <div class="flex justify-between text-sm text-gray-500 mt-1">
        <span>Status: <strong class="${task.status === "approved" ? "text-green-600" : "text-yellow-600"}">${task.status}</strong></span>
        <span>Reward: ${task.amount}</span>
      </div>
      <p class="text-xs text-gray-400 mt-1">Date: ${task.date}</p>
    `;

    if (task.status === "pending") {
      pendingBox.appendChild(card);
    } else {
      approvedBox.appendChild(card);
    }
  });
}

function showTaskCategory(tab) {
  document.getElementById("pendingTasks").classList.add("hidden");
  document.getElementById("approvedTasks").classList.add("hidden");

  document.getElementById("pendingTab").classList.remove("bg-blue-600", "text-white");
  document.getElementById("approvedTab").classList.remove("bg-green-600", "text-white");

  if (tab === "pending") {
    document.getElementById("pendingTasks").classList.remove("hidden");
    document.getElementById("pendingTab").classList.add("bg-blue-600", "text-white");
  } else {
    document.getElementById("approvedTasks").classList.remove("hidden");
    document.getElementById("approvedTab").classList.add("bg-green-600", "text-white");
  }
}

document.addEventListener("DOMContentLoaded", renderTaskStatusSection);










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





                                                         // Copy referral link
														 
const copyBtn = document.getElementById('copyBtn');
if (copyBtn) {
  copyBtn.addEventListener('click', () => {
    const input = document.getElementById('refLink');
    input.select();
    document.execCommand('copy');
    const copyMsg = document.getElementById('copyMsg');
    copyMsg.classList.remove('hidden');
    setTimeout(() => {
      copyMsg.classList.add('hidden');
    }, 2000);
  });
}


                                                              // Swiper Function
new Swiper('.earnings-swiper', {
  loop: true,
  pagination: {
    el: '.swiper-pagination',
    clickable: true,
  },
  autoplay: {
    delay: 4000,
    disableOnInteraction: false,
  },
  effect: 'slide',
  speed: 500,
});




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

  const showNavTabs = ['dashboard','games', 'payment', 'transaction', 'me'];

  if (showNavTabs.includes(tabId)) {
    bottomNav.classList.remove('hidden');
    backArrow.classList.add('hidden');
  } else {
    bottomNav.classList.add('hidden');
    backArrow.classList.remove('hidden');
  }
};



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
