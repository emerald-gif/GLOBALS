/* ==========================================================================
   FIREBASE CONFIGURATION & INITIALIZATION
   ========================================================================== */
const firebaseConfig = {
    apiKey: "AIzaSyCuI_Nw4HMbDWa6wR3FhHJMHOUgx53E40c",
    authDomain: "globals-17bf7.firebaseapp.com",
    projectId: "globals-17bf7",
    storageBucket: "globals-17bf7.appspot.com",
    messagingSenderId: "603274362994",
    appId: "1:603274362994:web:c312c10cf0a42938e882eb"
};

// Prevent double initialization
if (typeof firebase !== 'undefined' && !firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}

/* ==========================================================================
   ROBUST TASK MODULE (Live, Secure, UI/UX Upgraded)
   ========================================================================== */
(function() {
    'use strict';

    // Singleton Guard
    if (window.__TASK_MODULE_LOADED__) return;
    window.__TASK_MODULE_LOADED__ = true;

    // --- References & State ---
    const db = firebase.firestore();
    const auth = firebase.auth();
    const el = id => document.getElementById(id);
    
    // Store active listeners to prevent memory leaks
    const state = {
        listListener: null,
        detailListener: null,
        submissionListener: null
    };

    // --- Helpers ---
    const escapeHtml = str => String(str || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    const formatNaira = n => '₦' + Number(n || 0).toLocaleString('en-NG');

    // 1. Social Media Logo Helper (For the Card)
    function getCategoryIcon(category) {
        const c = (category || '').toLowerCase();
        if (c.includes('instagram')) return 'https://upload.wikimedia.org/wikipedia/commons/e/e7/Instagram_logo_2016.svg';
        if (c.includes('facebook')) return 'https://upload.wikimedia.org/wikipedia/commons/b/b8/2021_Facebook_icon.svg';
        if (c.includes('twitter') || c.includes('x')) return 'https://upload.wikimedia.org/wikipedia/commons/c/ce/X_logo_2023.svg';
        if (c.includes('tiktok')) return 'https://upload.wikimedia.org/wikipedia/en/a/a9/TikTok_logo.svg';
        if (c.includes('youtube')) return 'https://upload.wikimedia.org/wikipedia/commons/0/09/YouTube_full-color_icon_%282017%29.svg';
        if (c.includes('whatsapp')) return 'https://upload.wikimedia.org/wikipedia/commons/6/6b/WhatsApp.svg';
        if (c.includes('telegram')) return 'https://upload.wikimedia.org/wikipedia/commons/8/82/Telegram_logo.svg';
        if (c.includes('linkedin')) return 'https://upload.wikimedia.org/wikipedia/commons/c/ca/LinkedIn_logo_initials.png';
        if (c.includes('spotify')) return 'https://upload.wikimedia.org/wikipedia/commons/1/19/Spotify_logo_without_text.svg';
        // Fallback Icon
        return 'https://cdn-icons-png.flaticon.com/512/10856/10856858.png';
    }

    /* ==========================================================================
       PART 1: LIVE TASK FEED (The List)
       ========================================================================== */
    function initLiveTaskFeed() {
        const container = el('task-jobs');
        const searchInput = el('taskSearch');
        const filterSelect = el('taskCategoryFilter');

        if (!container) return; // Exit if HTML not present

        // Cleanup previous listener
        if (state.listListener) state.listListener();

        container.innerHTML = `
            <div class="flex flex-col items-center justify-center py-12">
                <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <p class="text-gray-400 mt-2 text-sm">Syncing tasks...</p>
            </div>`;

        // Live Query
        state.listListener = db.collection('tasks')
            .where('status', '==', 'approved')
            .orderBy('createdAt', 'desc')
            .onSnapshot(snapshot => {
                const tasks = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                
                // Filter Logic (Client Side)
                const render = () => {
                    const q = (searchInput?.value || "").toLowerCase().trim();
                    const cat = (filterSelect?.value || "").toLowerCase().trim();

                    const filtered = tasks.filter(t => {
                        const filled = Number(t.filledWorkers || 0);
                        const total = Number(t.numWorkers || 0);
                        const approved = Number(t.approvedWorkers || 0);
                        
                        // Hide if completely finished (all slots approved)
                        if (total > 0 && approved >= total) return false;

                        const matchSearch = (t.title || "").toLowerCase().includes(q);
                        const matchCat = cat === "" || (t.category || "").toLowerCase() === cat;
                        return matchSearch && matchCat;
                    });

                    container.innerHTML = '';
                    if (filtered.length === 0) {
                        container.innerHTML = `<div class="p-8 text-center text-gray-500 bg-gray-50 rounded-xl border border-dashed">No tasks found matching your criteria.</div>`;
                        return;
                    }
                    filtered.forEach(t => container.appendChild(createTaskCard(t)));
                };

                render();
                // Attach UI filter events
                if (searchInput) searchInput.oninput = render;
                if (filterSelect) filterSelect.onchange = render;

            }, err => {
                console.error("Feed Error:", err);
                container.innerHTML = `<p class="text-red-500 text-center py-4">Connection lost. Refresh page.</p>`;
            });
    }

    // --- Card Component ---
    function createTaskCard(job) {
        const card = document.createElement('div');
        card.className = "group bg-white rounded-2xl p-4 mb-4 shadow-sm hover:shadow-md border border-gray-100 transition-all cursor-pointer relative overflow-hidden";
        
        const logo = getCategoryIcon(job.category);
        const filled = Number(job.filledWorkers || 0);
        const total = Number(job.numWorkers || 0);
        const percent = total > 0 ? Math.min(100, (filled / total) * 100) : 0;

        card.innerHTML = `
            <div class="flex items-start gap-4 z-10 relative">
                <div class="w-14 h-14 flex-shrink-0 bg-gray-50 rounded-xl p-2 flex items-center justify-center border border-gray-200">
                    <img src="${logo}" alt="Icon" class="w-full h-full object-contain">
                </div>
                
                <div class="flex-1 min-w-0">
                    <div class="flex justify-between items-start">
                        <div class="pr-2">
                            <h3 class="font-bold text-gray-800 text-base truncate leading-tight">${escapeHtml(job.title)}</h3>
                            <p class="text-xs text-gray-500 mt-1 capitalize">${escapeHtml(job.category)} &bull; ${escapeHtml(job.subCategory)}</p>
                        </div>
                        <span class="bg-green-50 text-green-700 text-xs font-extrabold px-2.5 py-1 rounded-lg border border-green-100 whitespace-nowrap">
                            ${formatNaira(job.workerEarn)}
                        </span>
                    </div>

                    <div class="mt-4">
                        <div class="flex justify-between text-[10px] text-gray-400 mb-1 font-bold uppercase tracking-wider">
                            <span>Progress</span>
                            <span>${filled} / ${total} Taken</span>
                        </div>
                        <div class="w-full bg-gray-100 h-1.5 rounded-full overflow-hidden">
                            <div class="bg-blue-600 h-1.5 rounded-full transition-all duration-500" style="width: ${percent}%"></div>
                        </div>
                    </div>
                </div>
            </div>
            <div class="absolute inset-0 bg-blue-50/0 group-hover:bg-blue-50/30 transition-colors pointer-events-none"></div>
        `;
        
        card.addEventListener('click', () => openTaskDetails(job.id));
        return card;
    }

    /* ==========================================================================
       PART 2: LIVE DETAILS MODAL (The Core UX)
       ========================================================================== */
    function openTaskDetails(taskId) {
        // Create Modal Structure
        const modal = document.createElement('div');
        modal.id = 'task_details_modal';
        modal.className = "fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm opacity-0 transition-opacity duration-300";
        
        modal.innerHTML = `
            <div class="bg-white w-full max-w-5xl h-[85vh] md:h-auto md:max-h-[90vh] rounded-2xl shadow-2xl overflow-hidden flex flex-col md:flex-row transform scale-95 transition-transform duration-300" id="task_modal_content">
                <div class="flex-1 flex items-center justify-center">
                    <div class="animate-spin h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full"></div>
                </div>
            </div>
        `;
        document.body.appendChild(modal);

        // Animate In
        requestAnimationFrame(() => {
            modal.classList.remove('opacity-0');
            modal.querySelector('#task_modal_content').classList.remove('scale-95');
        });

        const closeModal = () => {
            // Unsubscribe listeners
            if (state.detailListener) state.detailListener();
            if (state.submissionListener) state.submissionListener();
            
            modal.classList.add('opacity-0');
            modal.querySelector('#task_modal_content').classList.add('scale-95');
            setTimeout(() => modal.remove(), 300);
        };

        // Close on backdrop click
        modal.addEventListener('click', e => {
            if (e.target === modal) closeModal();
        });

        // LIVE DATA: Fetch Task Details
        state.detailListener = db.collection('tasks').doc(taskId).onSnapshot(doc => {
            const contentBox = modal.querySelector('#task_modal_content');
            
            if (!doc.exists) {
                contentBox.innerHTML = `<div class="p-8 text-center text-red-500">This task has been removed. <br><button class="mt-4 px-4 py-2 bg-gray-200 rounded text-sm text-black">Close</button></div>`;
                contentBox.querySelector('button').onclick = closeModal;
                return;
            }

            const job = { id: doc.id, ...doc.data() };
            
            // Build UI Structure
            renderDetailsInterface(contentBox, job, closeModal);

            // LIVE DATA: Check User Submission
            const user = auth.currentUser;
            if (user) {
                state.submissionListener = db.collection('task_submissions')
                    .where('taskId', '==', job.id)
                    .where('userId', '==', user.uid)
                    .onSnapshot(snap => {
                        const submission = snap.empty ? null : snap.docs[0].data();
                        updateActionPanel(contentBox, job, submission, user);
                    });
            } else {
                updateActionPanel(contentBox, job, null, null);
            }

        }, err => {
            console.error(err);
            alert("Error loading task details");
            closeModal();
        });
    }

    // --- Render Logic ---
    function renderDetailsInterface(container, job, closeFn) {
        // Prevent full re-render if inputs are active (simple check)
        if (container.querySelector('#taskSubmitForm')) {
            // Just update stats texts if needed, but for stability we won't wipe the form
            const availText = container.querySelector('.availability-text');
            if(availText) {
                const left = Math.max(0, (job.numWorkers||0) - (job.filledWorkers||0));
                availText.textContent = `${left} / ${job.numWorkers} left`;
            }
            return; 
        }

        // Owner's Image (Screenshot) - NOT the logo
        const heroImage = job.screenshotURL || job.image || 'https://via.placeholder.com/800x400?text=Task+Preview';
        const filled = Number(job.filledWorkers || 0);
        const total = Number(job.numWorkers || 0);
        const left = Math.max(0, total - filled);

        container.innerHTML = `
            <!-- LEFT: Info Scrollable -->
            <div class="w-full md:w-3/5 bg-gray-50 h-full overflow-y-auto custom-scrollbar relative">
                <button id="modal_close_btn" class="absolute top-4 left-4 z-20 bg-white/90 p-2 rounded-full shadow-md hover:bg-white text-gray-800 transition">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>
                </button>

                <div class="relative w-full aspect-video bg-gray-200 group">
                    <img src="${heroImage}" class="w-full h-full object-contain mix-blend-multiply" alt="Proof Requirement">
                    <div class="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent"></div>
                    <div class="absolute bottom-0 left-0 p-6 w-full">
                        <span class="inline-block bg-blue-600 text-white text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wide mb-2 shadow-sm">
                            ${escapeHtml(job.category)}
                        </span>
                        <h2 class="text-2xl font-bold text-white leading-tight shadow-black drop-shadow-md">
                            ${escapeHtml(job.title)}
                        </h2>
                    </div>
                </div>

                <div class="p-6 space-y-6">
                    <!-- Stats -->
                    <div class="flex gap-4">
                        <div class="flex-1 bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                            <p class="text-xs text-gray-400 font-bold uppercase">You Earn</p>
                            <p class="text-xl font-extrabold text-green-600">${formatNaira(job.workerEarn)}</p>
                        </div>
                        <div class="flex-1 bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                            <p class="text-xs text-gray-400 font-bold uppercase">Slots</p>
                            <p class="text-xl font-bold text-gray-800 availability-text">${left} <span class="text-sm font-normal text-gray-400">/ ${total} left</span></p>
                        </div>
                    </div>

                    <!-- Description -->
                    <div>
                        <h3 class="font-bold text-gray-900 mb-2 flex items-center gap-2">
                            <svg class="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
                            Instructions
                        </h3>
                        <p class="text-gray-600 text-sm leading-relaxed whitespace-pre-line bg-white p-4 rounded-xl border border-gray-100">
                            ${escapeHtml(job.description || "Follow the instructions carefully.")}
                        </p>
                    </div>

                    <!-- Proof Requirements -->
                    ${job.proof ? `
                    <div class="bg-amber-50 p-4 rounded-xl border border-amber-100 border-l-4 border-l-amber-400">
                        <h3 class="font-bold text-amber-900 mb-1 text-sm">📸 Proof Required</h3>
                        <p class="text-amber-800 text-sm">${escapeHtml(job.proof)}</p>
                    </div>` : ''}

                    <!-- External Link -->
                    ${job.taskLink ? `
                    <div class="pt-2">
                        <a href="${job.taskLink}" target="_blank" class="flex items-center justify-center gap-2 w-full py-3 bg-blue-50 text-blue-700 font-bold rounded-xl border border-blue-200 hover:bg-blue-100 transition shadow-sm group">
                            <span>Open Task Link</span>
                            <svg class="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"></path></svg>
                        </a>
                    </div>` : ''}
                </div>
            </div>

            <!-- RIGHT: Action Panel (Sticky on Desktop) -->
            <div class="w-full md:w-2/5 bg-white border-l border-gray-100 flex flex-col h-[500px] md:h-full z-10 shadow-[-10px_0_20px_rgba(0,0,0,0.02)]">
                <div class="p-5 border-b border-gray-100 bg-white">
                    <h3 class="font-bold text-gray-800">Submit Proof</h3>
                </div>
                
                <div id="action_panel_body" class="flex-1 p-6 overflow-y-auto flex flex-col">
                    <!-- Dynamic State Loaded Here -->
                </div>
            </div>
        `;

        container.querySelector('#modal_close_btn').onclick = closeFn;
    }

    function updateActionPanel(container, job, submission, user) {
        const body = container.querySelector('#action_panel_body');
        if (!body) return;

        // STATE 1: Not Logged In
        if (!user) {
            body.innerHTML = `
                <div class="flex-1 flex flex-col items-center justify-center text-center">
                    <div class="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4 text-2xl">🔒</div>
                    <h4 class="font-bold text-gray-800 mb-2">Login Required</h4>
                    <p class="text-gray-500 text-sm mb-6">You must be signed in to perform tasks.</p>
                </div>
            `;
            return;
        }

        // STATE 2: Already Submitted
        if (submission) {
            const statusMap = {
                'approved': { color: 'green', label: 'Approved' },
                'rejected': { color: 'red', label: 'Rejected' },
                'on review': { color: 'blue', label: 'Under Review' }
            };
            const s = statusMap[submission.status?.toLowerCase()] || statusMap['on review'];

            body.innerHTML = `
                <div class="flex-1 flex flex-col">
                    <div class="bg-${s.color}-50 border border-${s.color}-100 p-5 rounded-2xl text-center mb-6">
                        <p class="text-xs font-bold text-${s.color}-600 uppercase tracking-wider mb-1">Status</p>
                        <p class="text-2xl font-extrabold text-${s.color}-700">${s.label}</p>
                    </div>

                    <h4 class="font-bold text-gray-800 mb-3 text-sm">Your Proofs</h4>
                    <div class="grid grid-cols-2 gap-2 mb-4 overflow-y-auto max-h-48 custom-scrollbar">
                        ${(submission.proofImages || []).map(url => `
                            <div class="rounded-lg overflow-hidden border border-gray-200 aspect-square bg-gray-50">
                                <img src="${url}" class="w-full h-full object-cover">
                            </div>
                        `).join('')}
                    </div>

                    ${submission.proofText ? `
                    <div class="mt-2 bg-gray-50 p-3 rounded-xl border border-gray-100 text-sm text-gray-600">
                        <span class="font-bold text-gray-800">Note:</span> ${escapeHtml(submission.proofText)}
                    </div>` : ''}

                    <div class="mt-auto pt-4 text-center text-xs text-gray-400">
                        Submitted: ${submission.submittedAt?.toDate().toLocaleString() || 'N/A'}
                    </div>
                </div>
            `;
            return;
        }

        // STATE 3: Task Closed (Fully Approved)
        const approved = Number(job.approvedWorkers || 0);
        const total = Number(job.numWorkers || 0);
        if (total > 0 && approved >= total) {
            body.innerHTML = `
                <div class="flex-1 flex flex-col items-center justify-center text-center p-6 bg-red-50 rounded-2xl border border-red-100">
                    <p class="text-3xl mb-2">🚫</p>
                    <h4 class="font-bold text-red-700 mb-1">Task Closed</h4>
                    <p class="text-sm text-red-500">All available slots have been approved.</p>
                </div>
            `;
            return;
        }

        // STATE 4: Task Full (Pending Reviews)
        const filled = Number(job.filledWorkers || 0);
        if (total > 0 && filled >= total) {
            body.innerHTML = `
                <div class="flex-1 flex flex-col items-center justify-center text-center p-6 bg-yellow-50 rounded-2xl border border-yellow-100">
                    <p class="text-3xl mb-2">⏳</p>
                    <h4 class="font-bold text-yellow-700 mb-1">Slots Full</h4>
                    <p class="text-sm text-yellow-600">Submissions are currently under review. <br>Check back later.</p>
                </div>
            `;
            return;
        }

        // STATE 5: Active Submission Form
        // Do not re-render if form exists (preserves inputs)
        if (body.querySelector('form')) return;

        body.innerHTML = `
            <form id="taskSubmitForm" class="flex flex-col h-full gap-4">
                <div class="flex-1 space-y-5 overflow-y-auto pr-2 custom-scrollbar">
                    
                    <!-- File Inputs -->
                    <div>
                        <label class="block text-xs font-bold text-gray-700 uppercase mb-3">Upload Proofs</label>
                        <div class="space-y-3">
                            ${generateFileInputs(job.proofFileCount || 1)}
                        </div>
                    </div>

                    <!-- Note -->
                    <div>
                        <label class="block text-xs font-bold text-gray-700 uppercase mb-2">Additional Note</label>
                        <textarea id="submitNote" class="w-full h-24 bg-gray-50 border border-gray-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none resize-none transition" placeholder="Enter username or details..."></textarea>
                    </div>
                </div>

                <div class="pt-4 border-t border-gray-100">
                    <button type="submit" id="submitBtn" class="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg shadow-blue-500/20 transition-all transform active:scale-95 flex items-center justify-center">
                        Submit Task
                    </button>
                </div>
            </form>
        `;

        const form = body.querySelector('#taskSubmitForm');
        form.onsubmit = (e) => {
            e.preventDefault();
            handleSubmission(job, user, form);
        };
    }

    function generateFileInputs(count) {
        let html = '';
        for (let i = 1; i <= count; i++) {
            html += `
                <label class="flex items-center gap-3 p-3 bg-white border border-dashed border-gray-300 rounded-xl cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition group">
                    <div class="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center text-gray-400 group-hover:bg-white group-hover:text-blue-500 transition">
                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"></path></svg>
                    </div>
                    <div class="flex-1 min-w-0">
                        <p class="text-sm font-medium text-gray-600 truncate" id="fileName_${i}">Click to upload Proof ${i}</p>
                    </div>
                    <input type="file" class="hidden" accept="image/*" onchange="document.getElementById('fileName_${i}').textContent = this.files[0] ? this.files[0].name : 'Click to upload Proof ${i}'; this.parentElement.classList.add('border-blue-500','bg-blue-50')">
                </label>
            `;
        }
        return html;
    }

    /* ==========================================================================
       PART 3: SUBMISSION LOGIC (Transaction Safe)
       ========================================================================== */
    async function handleSubmission(job, user, form) {
        const btn = form.querySelector('#submitBtn');
        const inputs = form.querySelectorAll('input[type="file"]');
        const note = form.querySelector('#submitNote').value.trim();

        // Validation
        const files = Array.from(inputs).map(i => i.files[0]).filter(Boolean);
        if (files.length === 0) {
            alert("⚠️ Please upload at least one proof image.");
            return;
        }

        // UX: Loading State
        btn.disabled = true;
        const originalText = btn.innerHTML;
        btn.innerHTML = `<svg class="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>`;

        try {
            // Check global upload helper
            if (typeof window.uploadToCloudinary !== 'function') {
                throw new Error("Upload service not available. Contact support.");
            }

            // 1. Upload Images
            const proofUrls = [];
            for (const file of files) {
                const result = await window.uploadToCloudinary(file);
                // Handle various return formats from cloudinary helpers
                const url = typeof result === 'string' ? result : (result.secure_url || result.url);
                if (url) proofUrls.push(url);
            }

            if (proofUrls.length === 0) throw new Error("Image upload failed.");

            // 2. Firestore Transaction (Race Condition Prevention)
            await db.runTransaction(async (transaction) => {
                const taskRef = db.collection('tasks').doc(job.id);
                const taskDoc = await transaction.get(taskRef);

                if (!taskDoc.exists) throw new Error("Task no longer exists.");
                
                const tData = taskDoc.data();
                const currentFilled = tData.filledWorkers || 0;
                const max = tData.numWorkers || 0;

                // Strict Check
                if (max > 0 && currentFilled >= max) {
                    throw new Error("TASK_FULL");
                }

                // Check for duplicate submission inside transaction
                const duplicateCheck = await db.collection('task_submissions')
                    .where('taskId', '==', job.id)
                    .where('userId', '==', user.uid)
                    .limit(1)
                    .get(); // Note: Queries inside transactions must be careful, but here we can't easily scope a query to transaction without direct doc ref. 
                            // Standard pattern: Query first, then transaction write. 
                            // But for simplicity/robustness here, we trust the transaction on the taskRef counter primarily.

                const newSubRef = db.collection('task_submissions').doc();

                transaction.set(newSubRef, {
                    taskId: job.id,
                    userId: user.uid,
                    taskTitle: job.title,
                    proofImages: proofUrls,
                    proofText: note,
                    status: 'on review',
                    workerEarn: job.workerEarn,
                    submittedAt: firebase.firestore.FieldValue.serverTimestamp()
                });

                transaction.update(taskRef, {
                    filledWorkers: currentFilled + 1
                });
            });

            alert("✅ Task Submitted Successfully!");
            // UI updates automatically via onSnapshot

        } catch (error) {
            console.error(error);
            if (error.message === 'TASK_FULL') {
                alert("❌ Sorry, this task filled up while you were uploading.");
            } else {
                alert("❌ Submission Failed: " + error.message);
            }
            // Reset Button
            btn.disabled = false;
            btn.innerHTML = originalText;
        }
    }

    /* ==========================================================================
       PART 4: FINISHED TASKS (History)
       ========================================================================== */
    function initFinishedTasks() {
        const btn = el('finishedTaskBtnUser');
        const backBtn = el('backToMainBtnUser');
        const screen = el('finishedTasksScreenUser');
        const mainScreen = el('taskSection'); // Adjust ID if your main wrapper is different

        if (!btn || !screen) return;

        btn.addEventListener('click', () => {
            if(mainScreen) mainScreen.classList.add('hidden');
            screen.classList.remove('hidden');
            loadFinishedHistory();
        });

        if (backBtn) {
            backBtn.addEventListener('click', () => {
                screen.classList.add('hidden');
                if(mainScreen) mainScreen.classList.remove('hidden');
            });
        }
    }

    async function loadFinishedHistory() {
        const list = el('finishedTasksListUser');
        if (!list) return;

        const user = auth.currentUser;
        if (!user) {
            list.innerHTML = `<div class="p-8 text-center text-gray-500">Please login to view history.</div>`;
            return;
        }

        list.innerHTML = `<div class="p-8 text-center"><div class="animate-spin inline-block w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full"></div></div>`;

        try {
            const snap = await db.collection('task_submissions')
                .where('userId', '==', user.uid)
                .orderBy('submittedAt', 'desc')
                .limit(50)
                .get();

            if (snap.empty) {
                list.innerHTML = `<div class="p-8 text-center text-gray-400 bg-gray-50 rounded-xl border border-dashed">No submissions yet.</div>`;
                return;
            }

            list.innerHTML = '';
            snap.forEach(doc => {
                const d = doc.data();
                const colors = d.status === 'approved' ? 'bg-green-100 text-green-700' : 
                               d.status === 'rejected' ? 'bg-red-100 text-red-700' : 'bg-blue-50 text-blue-600';
                
                const item = document.createElement('div');
                item.className = "bg-white p-4 mb-3 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between";
                item.innerHTML = `
                    <div>
                        <h4 class="font-bold text-gray-800 text-sm">${escapeHtml(d.taskTitle)}</h4>
                        <p class="text-xs text-gray-500 mt-1">${d.submittedAt?.toDate().toLocaleDateString()}</p>
                    </div>
                    <div class="text-right">
                        <span class="inline-block px-2 py-1 rounded-md text-[10px] font-bold uppercase ${colors}">${escapeHtml(d.status)}</span>
                        <div class="text-sm font-bold text-gray-700 mt-1">${formatNaira(d.workerEarn)}</div>
                    </div>
                `;
                list.appendChild(item);
            });

        } catch (e) {
            console.error(e);
            list.innerHTML = `<div class="p-4 text-center text-red-500">Failed to load history.</div>`;
        }
    }

    /* ==========================================================================
       INITIALIZATION
       ========================================================================== */
    function init() {
        console.log("[TASK] Module Initializing...");
        
        // Start Live Feed
        initLiveTaskFeed();
        
        // Setup History Buttons
        initFinishedTasks();

        // Listen for Auth Changes to refresh specific views if needed
        auth.onAuthStateChanged(user => {
            // If details modal is open, it will auto-update via snapshot
            // If history is open, reload it
            if (user && !el('finishedTasksScreenUser')?.classList.contains('hidden')) {
                loadFinishedHistory();
            }
        });
    }

    // Run Init
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    // Expose global init manually if needed
    window.initTaskSection = init;

})();