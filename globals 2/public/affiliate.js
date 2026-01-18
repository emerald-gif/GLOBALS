// ==========================================
// 1. FIREBASE CONFIGURATION & INITIALIZATION
// ==========================================
const firebaseConfig = {
    apiKey: "AIzaSyCuI_Nw4HMbDWa6wR3FhHJMHOUgx53E40c",
    authDomain: "globals-17bf7.firebaseapp.com",
    projectId: "globals-17bf7",
    storageBucket: "globals-17bf7.appspot.com",
    messagingSenderId: "603274362994",
    appId: "1:603274362994:web:c312c10cf0a42938e882eb"
};

// Initialize Firebase only if not already done
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}

// ==========================================
// 2. AFFILIATE MODULE (COMPLETE & LIVE)
// ==========================================
(function(){
    'use strict';

    // Prevent double-loading the script
    if (window.AFF2_COMPLETE_FINAL) { console.warn('[AFF2] Module already running'); return; }
    window.AFF2_COMPLETE_FINAL = true;

    /* ---------- Helpers ---------- */
    const el = id => document.getElementById(id);
    const safeText = s => String(s || '')
        .replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;')
        .replaceAll('"','&quot;').replaceAll("'", '&#039;');
    const formatNaira = n => (n==null||isNaN(Number(n))) ? '₦0' : '₦'+Number(n).toLocaleString('en-NG');

    /* ---------- Firebase References ---------- */
    const db = firebase.firestore();
    const auth = firebase.auth();
    const storage = firebase.storage ? firebase.storage() : null;

    /* ---------- Module State ---------- */
    const state = {
        handlers: [],
        currentJobId: null,
        jobsListener: null, // Stores the live snapshot unsubscribe function
        localOccupancyIncrement: 0
    };

    /* ---------- Upload Helper ---------- */
    async function uploadFileHelper(file) {
        if (!file) throw new Error('No file provided');
        
        // Priority 1: Cloudinary (if available in window)
        if (typeof window.uploadToCloudinary === 'function') {
            return await window.uploadToCloudinary(file);
        }
        
        // Priority 2: Firebase Storage
        if (storage && auth.currentUser) {
            const path = `affiliate_proofs/${auth.currentUser.uid}_${Date.now()}_${file.name}`;
            const ref = storage.ref().child(path);
            await ref.put(file);
            return await ref.getDownloadURL();
        }
        
        throw new Error('No upload method available (Cloudinary or Firebase Storage missing).');
    }

    /* ---------- Job Card Creator (Renders Immediately) ---------- */
    function makeJobCard(job) {
        const wrap = document.createElement('div');
        wrap.className = 'aff2-job-card bg-white rounded-xl p-3 shadow-sm mb-4';
        wrap.id = `job-card-${job.id}`; // Unique ID for DOM manipulation

        const img = job.campaignLogoURL || job.image || '/assets/default-thumb.jpg';
        
        wrap.innerHTML = `
        <div class="overflow-hidden rounded-lg">
            <img src="${safeText(img)}" loading="lazy" alt="${safeText(job.title||'')}" class="w-full h-36 object-cover rounded-lg"/>
        </div>

        <div class="mt-3">
            <h4 class="font-semibold text-md leading-tight">${safeText(job.title || 'Untitled Task')}</h4>

            ${job.category ? `<div class="mt-1">
                <span class="inline-block text-xs px-2 py-1 bg-blue-100 text-blue-600 rounded">
                ${safeText(job.category)}
                </span>
            </div>` : ''}

            <div class="text-sm text-blue-600 mt-2 font-bold">${formatNaira(job.workerPay)}</div>
            
            <!-- This ID allows us to update the count asynchronously later -->
            <div class="text-sm text-gray-500 mt-1" id="job-stats-${job.id}">
                <span class="inline-block w-4 h-4 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin align-middle mr-1"></span>
                <span class="align-middle">Checking slots...</span>
            </div>

            <div class="mt-3 flex items-center justify-between">
                <button class="aff2-btn-view px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg w-full transition-colors" data-id="${safeText(job.id)}">
                View Task
                </button>
            </div>
        </div>
        `;
        return wrap;
    }

    /* ---------- Main Function: Real-time Job Loader ---------- */
    function initRealtimeJobs() {
        const grid = el('aff2_grid') || el('aff2_jobsList') || el('aff2_jobsContainer');
        if (!grid) { console.warn('[AFF2] Job container missing in HTML'); return; }
        
        // If there is an existing listener, unsubscribe first (clean up)
        if (state.jobsListener) {
            state.jobsListener();
        }

        // Show a loader only if the screen is totally empty
        if(grid.children.length === 0) {
            grid.innerHTML = '<p class="text-gray-500 p-6 text-center">Loading tasks...</p>';
        }

        let q = db.collection('affiliateJobs').where('status','==','approved');
        try { q = q.orderBy('postedAt','desc'); } catch (_) {}

        // --- THE LIVE SNAPSHOT ---
        state.jobsListener = q.onSnapshot(async (snapshot) => {
            if (snapshot.empty) {
                grid.innerHTML = '<div class="col-span-full text-gray-500 p-10 text-center flex flex-col items-center"><span class="text-2xl mb-2">📂</span><p>No active tasks available right now.</p></div>';
                return;
            }

            // 1. Render Structure Immediately (Don't wait for counts)
            grid.innerHTML = ''; 

            const jobs = [];
            snapshot.forEach(doc => {
                jobs.push({ id: doc.id, ...doc.data() });
            });

            // 2. Append all cards instantly
            jobs.forEach(job => {
                grid.appendChild(makeJobCard(job));
                // 3. Trigger background fetch for counts
                fetchAndRenderCounts(job);
            });

        }, (err) => {
            console.error('[AFF2] Snapshot error', err);
            grid.innerHTML = '<p class="text-red-500 p-6 text-center">Live connection interrupted.</p>';
        });
    }

    /* ---------- Background Worker: Count Slots ---------- */
    async function fetchAndRenderCounts(job) {
        const statsEl = document.getElementById(`job-stats-${job.id}`);
        const cardEl = document.getElementById(`job-card-${job.id}`);
        if (!statsEl) return;

        try {
            let occupancy = 0, approved = 0;
            
            // We use .get() here to save reads. We don't need a live listener for *every single card's count*.
            const occSnap = await db.collection('affiliate_submissions')
                .where('jobId', '==', job.id)
                .get();
            
            occSnap.forEach(doc => {
                const s = (doc.data().status || '').toLowerCase();
                if (s === 'on review' || s === 'approved') occupancy++;
                if (s === 'approved') approved++;
            });

            const numWorkers = Number(job.numWorkers || 0);
            
            // Update Text
            statsEl.innerHTML = `<strong>${occupancy}/${numWorkers}</strong> workers applied`;

            // LOGIC: If job is fully approved, remove it from list
            if (numWorkers > 0 && approved >= numWorkers) {
                if (cardEl) {
                    cardEl.style.display = 'none'; // Hide instead of remove to avoid layout shifts
                }
            }

        } catch (e) {
            console.warn('Count fetch error', e);
            statsEl.textContent = '-/- workers';
        }
    }

    /* ---------- Job Detail View ---------- */
    async function openJobDetail(jobId) {
        // Switch screens immediately for responsiveness
        el('aff2_jobsContainer')?.classList.add('aff2-hidden');
        el('aff2_finishedScreen')?.classList.add('aff2-hidden');
        el('aff2_jobDetailScreen')?.classList.remove('aff2-hidden');
        
        const content = el('aff2_jobDetailContent');
        if (content) content.innerHTML = '<div class="p-10 text-center text-gray-500"><span class="animate-spin inline-block w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full"></span> Loading details...</div>';

        try {
            const doc = await db.collection('affiliateJobs').doc(jobId).get();
            if (!doc.exists) { alert('Job not found or deleted'); initRealtimeJobs(); return; }

            const job = { id: doc.id, ...doc.data() };
            state.currentJobId = job.id;
            state.localOccupancyIncrement = 0;

            // Render Detail UI
            const wrapper = document.createElement('div');
            wrapper.className = 'bg-white rounded-2xl shadow-sm overflow-hidden max-w-3xl mx-auto my-6 border border-gray-100';

            // Banner
            const bannerWrapper = document.createElement('div');
            bannerWrapper.className = 'relative w-full h-64 bg-gray-50 flex items-center justify-center border-b';
            const banner = document.createElement('img');
            banner.src = job.image || job.campaignLogoURL || '/assets/default-banner.jpg';
            banner.className = 'max-w-full max-h-full object-contain';
            bannerWrapper.appendChild(banner);
            wrapper.appendChild(bannerWrapper);

            // Content Body
            const body = document.createElement('div');
            body.className = 'p-6 space-y-5';
            body.innerHTML = `
            <div>
                <h2 class="text-2xl font-bold text-gray-900">${safeText(job.title || 'Untitled')}</h2>
                <div class="flex items-center gap-2 mt-2">
                    ${job.category ? `<span class="text-xs px-2.5 py-1 bg-blue-100 text-blue-700 font-medium rounded-full">${safeText(job.category)}</span>` : ''}
                    <span class="text-xs px-2.5 py-1 bg-green-100 text-green-700 font-medium rounded-full">${formatNaira(job.workerPay)} Pay</span>
                </div>
                
                <!-- Progress Bar -->
                <div class="mt-4">
                    <div class="flex justify-between text-xs text-gray-500 mb-1">
                        <span>Slots filled</span>
                        <span id="aff2_detailProgressText">Loading stats...</span>
                    </div>
                    <div class="w-full bg-gray-100 rounded-full h-2">
                        <div id="aff2_detailProgressBar" class="bg-blue-600 h-2 rounded-full transition-all duration-500" style="width: 0%"></div>
                    </div>
                </div>
            </div>

            <hr class="border-gray-100">

            ${job.instructions ? `
                <div class="bg-blue-50 p-4 rounded-xl border border-blue-100">
                    <h3 class="text-sm font-bold text-blue-800 mb-1">Instructions</h3>
                    <div class="text-sm text-gray-700 whitespace-pre-line">${safeText(job.instructions)}</div>
                </div>
            ` : ''}

            ${job.targetLink ? `
                <div>
                    <h3 class="text-sm font-bold text-gray-800 mb-1">Target Link</h3>
                    <a href="${safeText(job.targetLink)}" target="_blank" class="block w-full p-3 bg-gray-50 border border-gray-200 rounded-lg text-blue-600 underline break-all hover:bg-gray-100 transition">
                        ${safeText(job.targetLink)} ↗
                    </a>
                </div>
            ` : ''}

            ${job.proofRequired ? `
                <div>
                    <h3 class="text-sm font-bold text-gray-800 mb-1">Proof Required</h3>
                    <div class="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg border">${safeText(job.proofRequired)}</div>
                </div>
            ` : ''}

            <!-- Submission Area -->
            <div id="aff2_submitArea" class="mt-8 border-t pt-6">
                <h3 class="text-lg font-bold text-gray-900 mb-4">Submit Proof</h3>
                
                <div class="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
                    <div>
                        <label class="block text-xs font-medium text-gray-700 mb-1">Screenshot 1 *</label>
                        <input type="file" id="proofFile1" accept="image/*" class="block w-full text-xs text-gray-500 file:mr-2 file:py-2 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 border rounded-lg">
                    </div>
                    <div>
                        <label class="block text-xs font-medium text-gray-700 mb-1">Screenshot 2</label>
                        <input type="file" id="proofFile2" accept="image/*" class="block w-full text-xs text-gray-500 file:mr-2 file:py-2 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 border rounded-lg">
                    </div>
                    <div>
                        <label class="block text-xs font-medium text-gray-700 mb-1">Screenshot 3</label>
                        <input type="file" id="proofFile3" accept="image/*" class="block w-full text-xs text-gray-500 file:mr-2 file:py-2 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 border rounded-lg">
                    </div>
                </div>

                <textarea id="aff2_detailSubmissionNote" placeholder="Add a note (optional)..." class="w-full border border-gray-300 rounded-xl p-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none h-24 resize-none"></textarea>

                <div class="mt-4">
                    <button id="aff2_detailSubmitBtn" class="w-full py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl shadow-lg shadow-blue-600/30 transition-all active:scale-[0.98]">
                        Submit Proof
                    </button>
                </div>
                <p class="text-center text-xs text-gray-400 mt-3">By submitting, you confirm you have completed the task.</p>
            </div>
            `;

            wrapper.appendChild(body);
            content.innerHTML = ''; // clear loader
            content.appendChild(wrapper);

            // --- Logic: Check Status & Counts ---
            const { occupancy, approved } = await computeCountsForJob(job.id);
            
            // Save state for UI updates
            state.currentApproved = approved;
            state.currentOccupancy = occupancy;
            state.currentNumWorkers = Number(job.numWorkers || 0);
            
            updateDetailProgressUI(job.numWorkers || 0);

            const numWorkers = Number(job.numWorkers || 0);
            const area = el('aff2_submitArea');

            // 1. Check if Closed (Approved >= Total)
            if (numWorkers > 0 && approved >= numWorkers) {
                if (area) area.innerHTML = `<div class="bg-gray-100 text-gray-600 p-4 rounded-xl text-center font-medium border border-gray-200">🔒 Job Closed: All slots have been approved.</div>`;
                await showUserSubmissionIfExists(job.id);
                return;
            }

            // 2. Check if Full (On Review + Approved >= Total)
            if (numWorkers > 0 && occupancy >= numWorkers) {
                if (area) area.innerHTML = `<div class="bg-yellow-50 text-yellow-700 p-4 rounded-xl text-center font-medium border border-yellow-200">⏳ Job Temporarily Full: All slots are under review. Check back later.</div>`;
                await showUserSubmissionIfExists(job.id);
                return;
            }

            // 3. Check if User Not Logged In
            const user = auth.currentUser;
            if (!user) {
                const submitBtn = el('aff2_detailSubmitBtn');
                if (submitBtn) {
                    submitBtn.textContent = 'Log in to Submit';
                    submitBtn.onclick = () => alert('Please log in/register to perform tasks.');
                }
                return;
            }

            // 4. Check if User Already Submitted
            const existingSnap = await db.collection('affiliate_submissions')
                .where('jobId','==', job.id)
                .where('userId','==', user.uid)
                .get();

            if (!existingSnap.empty) {
                const doc = existingSnap.docs[0];
                const sub = { id: doc.id, ...doc.data() };
                replaceSubmitAreaWithSubmitted(sub);
                return;
            }

            // 5. Ready to Submit
            attachSubmitHandler(job);

        } catch (err) {
            console.error('[AFF2] openJobDetail', err);
            if(content) content.innerHTML = '<p class="text-red-500 text-center p-6">Failed to load details. Check internet connection.</p>';
        }
    }

    /* ---------- Helper: Get exact counts for a single job ---------- */
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

    /* ---------- UI: Update Progress Bar ---------- */
    function updateDetailProgressUI() {
        const bar = el('aff2_detailProgressBar');
        const txt = el('aff2_detailProgressText');
        const total = Number(state.currentNumWorkers || 0) || 1;
        
        // Optimistic count: DB count + Local submission (if any)
        const occ = (Number(state.currentOccupancy || 0) + Number(state.localOccupancyIncrement || 0));
        const approved = Number(state.currentApproved || 0);
        
        const pct = Math.min(100, Math.round((occ / total) * 100));
        
        if (bar) bar.style.width = pct + '%';
        if (txt) txt.textContent = `${occ} of ${total} applied (Approved: ${approved})`;
    }

    /* ---------- Check if user submitted (Background) ---------- */
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
                replaceSubmitAreaWithSubmitted({ id: doc.id, ...doc.data() });
            }
        } catch (err) { /* silent fail */ }
    }

    /* ---------- Replace Form with "Submitted" Card ---------- */
    function replaceSubmitAreaWithSubmitted(sub) {
        const area = el('aff2_submitArea');
        if (!area) return;
        const urls = (sub.proofFiles || sub.proofURLs || []);
        const imagesHtml = urls.length 
            ? `<div class="flex gap-2 overflow-x-auto pb-2 mt-2">
                ${urls.map(u => `<img src="${safeText(u)}" class="h-20 w-auto rounded-lg border object-cover">`).join('')}
               </div>` 
            : '<div class="text-xs text-gray-400 italic">No proof images</div>';
        
        const statusSafe = safeText(sub.status || 'on review');
        const statusColor = statusSafe === 'approved' ? 'text-green-600 bg-green-50 border-green-200' : 
                            statusSafe === 'rejected' ? 'text-red-600 bg-red-50 border-red-200' : 
                            'text-amber-600 bg-amber-50 border-amber-200';

        area.innerHTML = `
        <div class="mt-6 p-5 rounded-xl border ${statusColor} text-center">
            <div class="text-lg font-bold mb-1">✅ Submission Received</div>
            <div class="text-sm font-medium opacity-90 mb-3">Status: ${statusSafe.toUpperCase()}</div>
            ${imagesHtml}
            ${sub.note ? `<div class="mt-3 text-sm text-gray-700 bg-white/50 p-2 rounded text-left"><strong>Note:</strong> ${safeText(sub.note)}</div>` : ''}
        </div>
        `;
        
        // If this call came from a fresh submit, update progress bar locally
        if (sub && sub._localIncrement) {
            state.localOccupancyIncrement = 1;
            updateDetailProgressUI();
        }
    }

    /* ---------- Submit Logic ---------- */
    function attachSubmitHandler(job) {
        const submitBtn = el('aff2_detailSubmitBtn');
        if (!submitBtn) return;
        
        // Remove old listeners
        const newBtn = submitBtn.cloneNode(true);
        submitBtn.parentNode.replaceChild(newBtn, submitBtn);

        newBtn.onclick = async function() {
            if (!auth || !auth.currentUser) { alert('Please log in.'); return; }
            const uid = auth.currentUser.uid;

            // Collect Files
            const fEls = [el('proofFile1'), el('proofFile2'), el('proofFile3')];
            const files = fEls.map(i => i?.files?.[0]).filter(Boolean);
            
            if (files.length < 1) { 
                alert('⚠️ Please upload at least one screenshot proof.'); 
                return; 
            }

            // UI Loading State
            newBtn.disabled = true;
            newBtn.innerHTML = '<span class="animate-spin inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2"></span> Uploading...';

            try {
                // Double check duplicate
                const check = await db.collection('affiliate_submissions')
                    .where('jobId','==', job.id)
                    .where('userId','==', uid)
                    .get();
                
                if (!check.empty) {
                    replaceSubmitAreaWithSubmitted({ id: check.docs[0].id, ...check.docs[0].data() });
                    alert('You have already submitted this task.');
                    return;
                }

                // Upload Files
                const uploadedUrls = [];
                for (let i = 0; i < files.length; i++) {
                    const url = await uploadFileHelper(files[i]);
                    uploadedUrls.push(url);
                }

                // Create DB Entry
                const payload = {
                    jobId: job.id,
                    userId: uid,
                    userName: auth.currentUser.displayName || auth.currentUser.email || 'Anonymous',
                    proofFiles: uploadedUrls,
                    note: (el('aff2_detailSubmissionNote')?.value || '').trim(),
                    status: 'on review',
                    createdAt: firebase.firestore.FieldValue.serverTimestamp()
                };

                await db.collection('affiliate_submissions').add(payload);

                // Success UI
                replaceSubmitAreaWithSubmitted({ ...payload, _localIncrement: true });
                window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
                alert('✅ Submission Successful! Admin will review shortly.');

            } catch (err) {
                console.error('[AFF2] Submit error', err);
                alert('Submission failed. Please try again.');
                newBtn.disabled = false;
                newBtn.innerHTML = 'Submit Proof';
            }
        };
    }

    /* ---------- Finished Tasks History ---------- */
    async function loadAndRenderFinished() {
        const listEl = el('aff2_finishedList');
        const pendingCountEl = el('aff2_pendingCount');
        const approvedCountEl = el('aff2_approvedCount');

        if (!listEl) return;
        listEl.innerHTML = '<p class="text-gray-400 p-6 text-center italic">Loading history...</p>';

        try {
            const user = auth.currentUser || await new Promise(r => { const u = auth.onAuthStateChanged(x => { u(); r(x); }); });
            
            if (!user) {
                listEl.innerHTML = '<p class="text-gray-500 p-6 text-center">Please sign in to view history.</p>';
                return;
            }

            const snap = await db.collection('affiliate_submissions')
                .where('userId','==', user.uid)
                .orderBy('createdAt','desc')
                .limit(50)
                .get();

            if (snap.empty) {
                listEl.innerHTML = '<div class="text-center p-8 text-gray-500">You haven\'t submitted any tasks yet.</div>';
                if(pendingCountEl) pendingCountEl.textContent = '0';
                if(approvedCountEl) approvedCountEl.textContent = '0';
                return;
            }

            // Get Job Titles efficiently
            const jobIds = [...new Set(snap.docs.map(d => d.data().jobId).filter(Boolean))];
            const jobMap = {};
            
            // Batched fetch for job titles (chunks of 10)
            for (let i = 0; i < jobIds.length; i += 10) {
                const chunk = jobIds.slice(i, i + 10);
                if(chunk.length) {
                    const jobsSnap = await db.collection('affiliateJobs')
                        .where(firebase.firestore.FieldPath.documentId(), 'in', chunk)
                        .get();
                    jobsSnap.forEach(jd => jobMap[jd.id] = jd.data());
                }
            }

            let pending = 0, approved = 0;
            listEl.innerHTML = '';

            snap.forEach(doc => {
                const sub = doc.data();
                const job = jobMap[sub.jobId] || {};
                
                const status = (sub.status || 'on review').toLowerCase();
                if (status === 'approved') approved++;
                else if (status === 'on review') pending++;

                // Render History Card
                const card = document.createElement('div');
                const statusColor = status === 'approved' ? 'border-l-green-500' : status === 'rejected' ? 'border-l-red-500' : 'border-l-amber-500';
                const statusText = status === 'approved' ? 'text-green-600' : status === 'rejected' ? 'text-red-600' : 'text-amber-600';
                const dateStr = sub.createdAt?.toDate ? sub.createdAt.toDate().toLocaleDateString() : 'Just now';

                card.className = `bg-white rounded-lg p-4 mb-3 shadow-sm border-l-4 ${statusColor}`;
                card.innerHTML = `
                    <div class="flex justify-between items-start">
                        <div>
                            <h4 class="font-bold text-gray-800 text-sm">${safeText(job.title || 'Task Unavailable')}</h4>
                            <div class="text-xs font-semibold mt-1 uppercase ${statusText}">${status}</div>
                            <div class="text-xs text-gray-400 mt-1">${dateStr}</div>
                        </div>
                        <button class="aff2-view-submission-btn text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1.5 rounded transition" data-id="${doc.id}">Details</button>
                    </div>
                `;
                listEl.appendChild(card);
            });

            if (pendingCountEl) pendingCountEl.textContent = String(pending);
            if (approvedCountEl) approvedCountEl.textContent = String(approved);

        } catch (err) {
            console.error('[AFF2] History error', err);
            listEl.innerHTML = '<p class="text-red-400 p-4 text-center">Could not load history.</p>';
        }
    }

    /* ---------- Modal: View Submission Details ---------- */
    async function openSubmissionModal(subId) {
        try {
            const doc = await db.collection('affiliate_submissions').doc(subId).get();
            if (!doc.exists) return;
            const sub = doc.data();
            
            const modal = document.createElement('div');
            modal.className = 'fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200';
            
            const imagesHtml = (sub.proofFiles || sub.proofURLs || [])
                .map(u => `<a href="${safeText(u)}" target="_blank"><img src="${safeText(u)}" class="w-full h-32 object-cover rounded-lg border hover:opacity-90 transition"></a>`).join('') || '<p class="text-gray-400 text-sm">No images</p>';

            modal.innerHTML = `
                <div class="bg-white w-full max-w-md rounded-2xl overflow-hidden shadow-2xl transform transition-all scale-100">
                    <div class="p-4 border-b flex justify-between items-center bg-gray-50">
                        <h3 class="font-bold text-gray-700">Submission Details</h3>
                        <button id="aff2_modal_close" class="text-gray-400 hover:text-gray-600 font-bold text-xl">&times;</button>
                    </div>
                    <div class="p-5 max-h-[70vh] overflow-y-auto">
                        <div class="mb-4">
                            <label class="text-xs font-bold text-gray-500 uppercase">Status</label>
                            <div class="font-medium text-gray-800">${safeText(sub.status)}</div>
                        </div>
                        <div class="mb-4">
                            <label class="text-xs font-bold text-gray-500 uppercase">Proofs</label>
                            <div class="grid grid-cols-2 gap-2 mt-1">
                                ${imagesHtml}
                            </div>
                        </div>
                        ${sub.note ? `
                        <div>
                            <label class="text-xs font-bold text-gray-500 uppercase">Your Note</label>
                            <div class="text-sm text-gray-700 bg-gray-50 p-2 rounded mt-1">${safeText(sub.note)}</div>
                        </div>` : ''}
                    </div>
                </div>
            `;
            
            document.body.appendChild(modal);
            
            const close = () => modal.remove();
            modal.querySelector('#aff2_modal_close').onclick = close;
            modal.onclick = (e) => { if(e.target === modal) close(); };

        } catch (e) { alert('Error opening details'); }
    }

    /* ---------- Event Delegation (Clicks) ---------- */
    function onDocClick(e) {
        const t = e.target;

        // View Task
        const jobBtn = t.closest('.aff2-btn-view');
        if (jobBtn) {
            const id = jobBtn.dataset.id;
            if (id) openJobDetail(id);
            return;
        }

        // View History Item
        const viewSub = t.closest('.aff2-view-submission-btn');
        if (viewSub) {
            const id = viewSub.dataset.id;
            openSubmissionModal(id);
            return;
        }

        // Navigation: To History
        if (t.id === 'aff2_openFinishedBtn' || t.closest('#aff2_openFinishedBtn')) {
            el('aff2_jobsContainer')?.classList.add('aff2-hidden');
            el('aff2_jobDetailScreen')?.classList.add('aff2-hidden');
            el('aff2_finishedScreen')?.classList.remove('aff2-hidden');
            loadAndRenderFinished();
            return;
        }

        // Navigation: Back to Home
        if (t.id === 'aff2_backToListBtn' || t.id === 'aff2_backToMainBtn' || t.closest('#aff2_backToListBtn')) {
            el('aff2_jobDetailScreen')?.classList.add('aff2-hidden');
            el('aff2_finishedScreen')?.classList.add('aff2-hidden');
            el('aff2_jobsContainer')?.classList.remove('aff2-hidden');
            // Ensure listener is active
            if (!state.jobsListener) initRealtimeJobs();
            return;
        }
    }

    /* ---------- Search Filters ---------- */
    function hookSearchInputs() {
        const sMain = el('aff2_searchMain');
        if (sMain) {
            sMain.addEventListener('input', (e) => {
                const q = e.target.value.toLowerCase();
                const grid = el('aff2_grid') || el('aff2_jobsList');
                if(!grid) return;
                Array.from(grid.children).forEach(card => {
                    card.style.display = card.innerText.toLowerCase().includes(q) ? '' : 'none';
                });
            });
        }
    }

    /* ---------- Initialization ---------- */
    function init() {
        document.addEventListener('click', onDocClick);
        state.handlers.push({ el: document, ev: 'click', fn: onDocClick });
        hookSearchInputs();
        
        // Start the live listener immediately
        initRealtimeJobs();
    }

    // Auto-run
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        setTimeout(init, 50);
    }

    // Export for debugging
    window.AFF2 = { init, initRealtimeJobs, openJobDetail };

})();
