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







                                                           // affiliate task section function
 function openTaskDrawer(drawerId, taskLink) {
  const drawer = document.getElementById(drawerId);
  drawer.classList.remove('translate-y-full');

  const button = drawer.querySelector('button[id^="doTaskBtn"]');
  if (button) {
    button.onclick = () => window.open(taskLink, '_blank');
  }
}

function closeTaskDrawer(drawerId) {
  const drawer = document.getElementById(drawerId);
  drawer.classList.add('translate-y-full');
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





                                                       
														 



                                                              // EARNING Swiper Function





async function submitWithdrawal() {
  const accNum = document.getElementById("withdrawAccountNumber").value;
  const bankCode = document.getElementById("withdrawBankSelect").value;
  const amount = document.getElementById("withdrawAmount").value;
  const password = document.getElementById("withdrawPassword").value;

  if (!accNum || !bankCode || !amount || !password) {
    alert("Please fill in all fields.");
    return;
  }

  // Show loading
  const statusDiv = document.getElementById("accountNameStatus");
  const nameDiv = document.getElementById("accountNameDisplay");
  statusDiv.classList.remove("hidden");
  nameDiv.classList.add("hidden");

  // Fetch account name from Paystack
  try {
    const res = await fetch("/api/verify-account", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ accNum, bankCode }),
    });

    const data = await res.json();

    if (data.status === "success") {
      statusDiv.classList.add("hidden");
      nameDiv.innerText = `✅ Account: ${data.account_name}`;
      nameDiv.classList.remove("hidden");

      // Proceed to actual withdrawal call (optional)
      // sendToPaystack({accNum, bankCode, amount, password})
    } else {
      alert("Invalid account or bank.");
      statusDiv.classList.add("hidden");
    }
  } catch (err) {
    alert("Error verifying account.");
    statusDiv.classList.add("hidden");
  }
}



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

  const showNavTabs = ['dashboard','games', 'payment', 'transaction' ];

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

    // Upload screenshot
    const fileRef = storage.ref(`job_examples/${Date.now()}_${screenshotExample.name}`);
    const fileSnapshot = await fileRef.put(screenshotExample);
    const screenshotURL = await fileSnapshot.ref.getDownloadURL();

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
  const useVideo = document.getElementById("videoAdCheck").checked;
  const usePicture = document.getElementById("pictureAdCheck").checked;

  const videoFee = useVideo ? 1000 : 0;
  const pictureFee = usePicture ? 500 : 0;
  const companyFee = 300;

  const total = (numWorkers * workerPay) + videoFee + pictureFee + companyFee;

  const totalDisplay = document.getElementById("affiliateJobTotal");
  if (totalDisplay) {
    totalDisplay.innerText = `₦${total}`;
  }
}

// 🔁 Trigger Total Update When Inputs Change
document.getElementById("numWorkers").addEventListener("input", updateAffiliateJobTotal);
document.getElementById("workerPay").addEventListener("input", updateAffiliateJobTotal);
document.getElementById("videoAdCheck").addEventListener("change", updateAffiliateJobTotal);
document.getElementById("pictureAdCheck").addEventListener("change", updateAffiliateJobTotal);

// 🚀 Submit Affiliate Job
async function submitAffiliateJob() {
  const category = document.getElementById("affiliateCategory").value;
  const title = document.getElementById("campaignTitle").value.trim();
  const instructions = document.getElementById("workerInstructions").value.trim();
  const targetLink = document.getElementById("targetLink").value.trim();
  const proofRequired = document.getElementById("proofRequired").value.trim();
  const numWorkers = parseInt(document.getElementById("numWorkers").value);
  const workerPay = parseInt(document.getElementById("workerPay").value);
  const videoAdFile = document.getElementById("videoAdFile").files[0];
  const pictureAdFile = document.getElementById("pictureAdFile").files[0];
  const useVideo = document.getElementById("videoAdCheck").checked;
  const usePicture = document.getElementById("pictureAdCheck").checked;

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
    const videoFee = useVideo ? 1000 : 0;
    const pictureFee = usePicture ? 500 : 0;
    const companyFee = 300;
    const total = (numWorkers * workerPay) + videoFee + pictureFee + companyFee;

    const userBalance = userProfile.balance || 0;
    if (userBalance < total) {
      alert(`⚠️ Insufficient balance. Required ₦${total}, available ₦${userBalance}.`);
      return;
    }

    // 📤 Upload Files (if any)
    let videoURL = "";
    let pictureURL = "";

    if (useVideo && videoAdFile) {
      const videoRef = storage.ref(`affiliate_videos/${Date.now()}_${videoAdFile.name}`);
      const videoSnap = await videoRef.put(videoAdFile);
      videoURL = await videoSnap.ref.getDownloadURL();
    }

    if (usePicture && pictureAdFile) {
      const picRef = storage.ref(`affiliate_pictures/${Date.now()}_${pictureAdFile.name}`);
      const picSnap = await picRef.put(pictureAdFile);
      pictureURL = await picSnap.ref.getDownloadURL();
    }

    // 🧾 Prepare Job Data
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
      videoURL,
      pictureURL,
      companyFee,
      videoFee,
      pictureFee,
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
  
  
  // Fetch banks on load
async function loadBanks() {
  const res = await fetch("http://localhost:4000/api/get-banks"); // or your deployed backend URL
  const data = await res.json();
  const select = document.getElementById("withdrawBankSelect");
  select.innerHTML = "";
  data.forEach(bank => {
    const opt = document.createElement("option");
    opt.value = bank.code;
    opt.text = bank.name;
    select.appendChild(opt);
  });
}

window.onload = loadBanks;

// Example for verifying account (you can call this on a button click)
async function verifyAccount() {
  const accNum = document.getElementById("accountNumberInput").value;
  const bankCode = document.getElementById("withdrawBankSelect").value;

  const res = await fetch("http://localhost:4000/api/verify-account", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ accNum, bankCode })
  });

  const data = await res.json();
  console.log("Verified:", data);
}

// Example to initiate withdrawal
async function initiateWithdrawal() {
  const accNum = document.getElementById("accountNumberInput").value;
  const bankCode = document.getElementById("withdrawBankSelect").value;
  const amount = parseFloat(document.getElementById("amountInput").value);
  const account_name = document.getElementById("accountNameInput").value;

  const res = await fetch("http://localhost:4000/api/initiate-transfer", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ accNum, bankCode, account_name, amount })
  });

  const data = await res.json();
  console.log("Transfer response:", data);
}

  
  






                                                                 // SERVICE FUNCTION

function openService(serviceName) {
    alert("Open " + serviceName + " screen");
    // Here, you’ll route to the corresponding screen
  }

   function openAllCategories() {
    document.getElementById("all-categories-screen").classList.remove("hidden");
  }

  function closeAllCategories() {
    document.getElementById("all-categories-screen").classList.add("hidden");
  }


                    
					
					
					
					                                          // AIRTIME SERVICE FUNCTION






	
// When airtime card is clicked
document.getElementById("card-airtime").addEventListener("click", () => {
  switchTab("airtime-screen");
});





  function setAmount(amount) {
    document.getElementById("airtime-amount").value = amount;
  }








async function buyAirtime() {
  const phone = document.getElementById('airtime-phone').value;
  const amount = document.getElementById('airtime-amount').value;
  const network = document.getElementById('airtime-network').value;
  const responseBox = document.getElementById('airtime-response');

  const request_id = 'airtime_' + Date.now(); // Unique ID

  const payload = {
    request_id,
    serviceID: network,
    amount,
    phone
  };

  try {
    const res = await fetch('https://vtpass.com/api/pay', {
      method: 'POST',
      headers: {
        'api-key': 'YOUR_API_KEY_HERE',
        'public-key': 'YOUR_EMAIL_HERE',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const result = await res.json();
    if (result.code === '000') {
      responseBox.innerText = '✅ Airtime purchase successful!';
    } else {
      responseBox.innerText = '❌ ' + result.response_description;
    }
  } catch (err) {
    responseBox.innerText = '⚠️ Error: ' + err.message;
  }
}






                                                                // DATA SERVICE FUNCTION

 const VT_API_KEY = 'YOUR_VTPASS_API_KEY';
const VT_PUBLIC_KEY = 'YOUR_PUBLIC_KEY';

const headers = {
  'api-key': VT_API_KEY,
  'public-key': VT_PUBLIC_KEY,
  'Content-Type': 'application/json'
};

// Show packages when a network is selected
document.getElementById('data-network').addEventListener('change', async function () {
  const network = this.value;
  const networkMap = {
    mtn: 'mtn-data',
    glo: 'glo-data',
    airtel: 'airtel-data',
    '9mobile': 'etisalat-data'
  };
  const serviceID = networkMap[network];

  const packageBox = document.getElementById('data-packages');
  packageBox.innerHTML = '';
  packageBox.classList.add('hidden');

  if (!serviceID) return;

  try {
    const response = await fetch(`https://vtpass.com/api/service-variations?serviceID=${serviceID}`, {
      headers
    });
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

// Submit purchase
async function buyData() {
  const phone = document.getElementById('data-phone').value;
  const variation_code = document.getElementById('selected-package').value;
  const network = document.getElementById('data-network')?.value || 'mtn';
  const networkMap = {
    mtn: 'mtn-data',
    glo: 'glo-data',
    airtel: 'airtel-data',
    '9mobile': 'etisalat-data'
  };
  const serviceID = networkMap[network];
  const request_id = 'data_' + Date.now();
  const responseBox = document.getElementById('data-response');

  const payload = {
    request_id,
    serviceID,
    variation_code,
    phone
  };

  try {
    const res = await fetch('https://vtpass.com/api/pay', {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
    });

    const result = await res.json();
    if (result.code === '000') {
      responseBox.innerText = '✅ Data purchase successful!';
    } else {
      responseBox.innerText = '❌ ' + result.response_description;
    }
  } catch (err) {
    responseBox.innerText = '⚠️ Error: ' + err.message;
  }
}








let paymentAmount = 100;
let paymentType = "airtime"; // "airtime" or "data"

function openPaymentDrawer(amount) {
  document.getElementById("amountToPay").textContent = `₦${amount}`;
  document.getElementById("paymentDrawer").classList.remove("hidden");


  const user = firebase.auth().currentUser;
  if (user) {
    firebase.firestore().collection("users").doc(user.uid).get().then((doc) => {
      const balance = doc.data().normalEarnings || 0;
      document.getElementById("availableBalance").textContent = `₦${balance}`;
      document.getElementById("payNowBtn").disabled = false;
    });
  }
}

function closePaymentDrawer() {
  document.getElementById("paymentDrawer").classList.add("hidden");
}

function openPasswordPrompt() {
  document.getElementById("passwordPopup").classList.remove("hidden");
}

function verifyAndProcessPayment() {
  const password = document.getElementById("paymentPassword").value;
  const user = firebase.auth().currentUser;

  firebase.auth().signInWithEmailAndPassword(user.email, password)
    .then(() => {
      const userRef = firebase.firestore().collection("users").doc(user.uid);
      userRef.get().then(doc => {
        const balance = doc.data().normalEarnings || 0;
        if (balance < paymentAmount) return alert("Insufficient balance");

        userRef.update({
          normalEarnings: balance - paymentAmount
        }).then(() => {
          // Call the right VTpass function based on type
          if (paymentType === "airtime") {
            sendAirtimeToVTpass();
          } else if (paymentType === "data") {
            sendDataToVTpass();
          }

          document.getElementById("passwordPopup").classList.add("hidden");
          closePaymentDrawer();
          alert("Payment successful!");
        });
      });
    })
    .catch(() => {
      alert("Incorrect password. Try again.");
    });
}






function continueAirtimePurchase() {
  const amount = parseFloat(document.getElementById("airtime-amount").value);
  if (!amount || amount < 100) return alert("Enter valid amount");
  openPaymentDrawer(amount); // ✅ Pass the amount correctly here
}




function continueDataPurchase() {
  const selected = document.getElementById("selected-package").value;

  if (!selected) {
    return alert("Please select a data plan first.");
  }

  // Extract the amount from the selected package
  try {
    const selectedPackage = JSON.parse(selected);
    const amount = parseFloat(selectedPackage.amount);

    if (!amount || amount < 100) {
      return alert("Invalid data plan selected.");
    }

    openPaymentDrawer(amount); // ✅ Triggers payment drawer with correct amount
  } catch (err) {
    alert("Something went wrong. Please reselect your data plan.");
  }
}
















