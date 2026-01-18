// Firebase config & inits
const firebaseConfig = {
    apiKey: "AIzaSyCuI_Nw4HMbDWa6wR3FhHJMHOUgx53E40c",
    authDomain: "globals-17bf7.firebaseapp.com",
    projectId: "globals-17bf7",
    storageBucket: "globals-17bf7.appspot.com",
    messagingSenderId: "603274362994",
    appId: "1:603274362994:web:c312c10cf0a42938e882eb"
};

// Initialize only if not already initialized
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}
const auth = firebase.auth();
const db = firebase.firestore();

// AFFILIATE — Robust single-file module (Live Snapshots + Upgraded UI)
(function() {
    'use strict';

    if (window.AFF2_COMPLETE_FINAL) {
        console.warn('[AFF2] already present');
        return;
    }
    window.AFF2_COMPLETE_FINAL = true;

    /* ---------- Helpers ---------- */
    const el = id => document.getElementById(id);
    const safeText = s => String(s || '')
        .replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;').replaceAll("'", '&#039;');
    const formatNaira = n => (n == null || isNaN(Number(n))) ? '₦0' : '₦' + Number(n).toLocaleString('en-NG');

    /* ---------- Module State & Listeners ---------- */
    const state = {
        handlers: [],
        activeListeners: {}, // Stores unsubscribe functions
        currentJobId: null
    };

    // Helper to clear listeners when switching screens
    function clearListener(key) {
        if (state.activeListeners[key]) {
            state.activeListeners[key](); // Unsubscribe
            delete state.activeListeners[key];
        }
    }

    function clearAllListeners() {
        Object.keys(state.activeListeners).forEach(key => clearListener(key));
    }

    /* ---------- Upload Helper ---------- */
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
        throw new Error('No upload helper available.');
    }

    /* ---------- Job Card ---------- */
    function makeJobCard(job, occupancy = 0, approved = 0) {
        const wrap = document.createElement('div');
        wrap.className = 'aff2-job-card bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-300 mb-4 border border-gray-100';

        const img = job.campaignLogoURL || job.image || '/assets/default-thumb.jpg';
        const numWorkers = Number(job.numWorkers || 0);
        const percent = numWorkers > 0 ? Math.min(100, Math.round((occupancy / numWorkers) * 100)) : 0;

        wrap.innerHTML = `
        <div class="flex flex-col sm:flex-row h-full">
            <div class="w-full sm:w-40 h-40 sm:h-auto relative bg-gray-100">
                <img src="${safeText(img)}" alt="${safeText(job.title)}" class="w-full h-full object-cover"/>
                ${job.category ? `<span class="absolute top-2 left-2 text-[10px] uppercase font-bold px-2 py-1 bg-white/90 text-blue-700 rounded-md shadow-sm">${safeText(job.category)}</span>` : ''}
            </div>
            <div class="p-4 flex-1 flex flex-col justify-between">
                <div>
                    <h4 class="font-bold text-gray-800 text-lg leading-tight line-clamp-2">${safeText(job.title || 'Untitled Task')}</h4>
                    <div class="mt-2 flex items-center gap-3">
                         <span class="text-blue-700 font-extrabold text-lg">${formatNaira(job.workerPay)}</span>
                         <span class="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">Per Task</span>
                    </div>
                </div>
                
                <div class="mt-4">
                    <div class="flex justify-between text-xs text-gray-500 mb-1">
                        <span>Slots Filled</span>
                        <span>${occupancy}/${numWorkers}</span>
                    </div>
                    <div class="w-full bg-gray-200 rounded-full h-2">
                        <div class="bg-blue-600 h-2 rounded-full" style="width: ${percent}%"></div>
                    </div>
                    
                    <div class="mt-4 flex justify-end">
                        <button class="aff2-btn-view px-5 py-2 bg-gray-900 hover:bg-black text-white text-sm font-medium rounded-lg transition-colors" data-id="${safeText(job.id)}">
                            View Details
                        </button>
                    </div>
                </div>
            </div>
        </div>
        `;
        return wrap;
    }

    /* ---------- Load Jobs (LIVE SNAPSHOT) ---------- */
    function loadAndRenderJobs() {
        const grid = el('aff2_grid') || el('aff2_jobsList') || el('aff2_jobsContainer');
        if (!grid) {
            console.warn('[AFF2] jobs container missing');
            return;
        }

        // Clear previous list listeners to avoid duplicates
        clearListener('jobsList');

        grid.innerHTML = `
            <div class="flex flex-col items-center justify-center py-12">
                <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <p class="text-gray-400 mt-3 text-sm">Syncing live tasks...</p>
            </div>
        `;

        let q = db.collection('affiliateJobs').where('status', '==', 'approved');
        try { q = q.orderBy('postedAt', 'desc'); } catch (_) {}

        // LIVE LISTENER
        state.activeListeners['jobsList'] = q.onSnapshot(async (snap) => {
            if (snap.empty) {
                grid.innerHTML = `
                    <div class="text-center py-12 bg-white rounded-xl shadow-sm border border-dashed border-gray-300">
                        <p class="text-gray-500 font-medium">No affiliate tasks available right now.</p>
                        <p class="text-gray-400 text-sm mt-1">Check back soon!</p>
                    </div>`;
                return;
            }

            const jobs = snap.docs.map(d => ({
                id: d.id,
                ...d.data()
            }));

            // We still fetch counts manually here to save reads, or we could listen. 
            // For the main list, a one-time fetch per snapshot update is safer for quota than listening to 10 subcollections.
            const counts = await Promise.all(jobs.map(job => (async () => {
                const jobId = job.id;
                let occupancy = 0,
                    approved = 0;
                try {
                    const occSnap = await db.collection('affiliate_submissions')
                        .where('jobId', '==', jobId)
                        .get();
                    occSnap.forEach(doc => {
                        const s = (doc.data().status || '').toLowerCase();
                        if (s === 'on review' || s === 'approved') occupancy++;
                        if (s === 'approved') approved++;
                    });
                } catch (e) {}
                return {
                    jobId,
                    occupancy,
                    approved
                };
            })()));

            const map = {};
            counts.forEach(c => map[c.jobId] = c);

            grid.innerHTML = '';
            let visibleCount = 0;

            for (const job of jobs) {
                const c = map[job.id] || {
                    occupancy: 0,
                    approved: 0
                };
                const numWorkers = Number(job.numWorkers || 0);
                // Hide if fully approved
                if (numWorkers > 0 && c.approved >= numWorkers) continue;
                
                grid.appendChild(makeJobCard(job, c.occupancy, c.approved));
                visibleCount++;
            }
            
            if(visibleCount === 0) {
                 grid.innerHTML = `<p class="text-gray-500 p-6 text-center">All active tasks are currently full.</p>`;
            }

        }, (err) => {
            console.error('[AFF2] Jobs List Error', err);
            grid.innerHTML = '<p class="text-red-500 p-6">Live connection lost. Refresh page.</p>';
        });
    }

    /* ---------- Open Job Detail (LIVE UI) ---------- */
    function openJobDetail(jobId) {
        state.currentJobId = jobId;
        const content = el('aff2_jobDetailContent');
        if (!content) return alert('Detail container missing');

        // Switch Screens
        el('aff2_jobsContainer')?.classList.add('aff2-hidden');
        el('aff2_finishedScreen')?.classList.add('aff2-hidden');
        el('aff2_jobDetailScreen')?.classList.remove('aff2-hidden');

        content.innerHTML = `
            <div class="flex flex-col items-center justify-center h-64">
                <div class="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
            </div>
        `;

        // Clear previous detail listeners
        clearListener('jobDetail');
        clearListener('jobOccupancy');
        clearListener('userSubmission');

        // 1. Listen to Job Data (Live)
        state.activeListeners['jobDetail'] = db.collection('affiliateJobs').doc(jobId).onSnapshot((doc) => {
            if (!doc.exists) {
                content.innerHTML = '<p class="text-red-500 p-6">Job no longer exists.</p>';
                return;
            }
            const job = {
                id: doc.id,
                ...doc.data()
            };
            renderJobDetailUI(job, content);
            
            // Trigger occupancy calculation after render
            initOccupancyListener(job);
            // Trigger user submission check after render
            initUserSubmissionListener(job);

        }, (err) => {
            console.error(err);
            content.innerHTML = '<p class="text-red-500">Error loading job details.</p>';
        });
    }

    /* ---------- Render Detail UI Skeleton ---------- */
    function renderJobDetailUI(job, container) {
        // Prevent re-rendering everything if only occupancy changes? 
        // For simplicity, we re-render structure but input values might be lost. 
        // Better: Check if structure exists, if so only update text.
        // For this V2, we will re-render structure to ensure data is fresh, 
        // but we'll try to preserve input states if we were doing granular updates. 
        // Since this is a full render, inputs reset.
        
        // However, standard Snapshots trigger on any field change. 
        // We will build the layout once, then helper functions update specific DOM elements.
        
        if(document.getElementById(`aff2_detail_wrapper_${job.id}`)) {
            // Already rendered, just update static texts if needed
            return; 
        }

        const bannerImg = job.image || job.campaignLogoURL || '/assets/default-banner.jpg';
        const numWorkers = Number(job.numWorkers || 0);

        container.innerHTML = '';
        
        const wrapper = document.createElement('div');
        wrapper.id = `aff2_detail_wrapper_${job.id}`;
        wrapper.className = 'bg-white rounded-2xl shadow-xl overflow-hidden max-w-4xl mx-auto my-4 border border-gray-100';

        wrapper.innerHTML = `
            <!-- Hero Section -->
            <div class="relative h-64 bg-gray-900 group">
                <img src="${safeText(bannerImg)}" class="w-full h-full object-cover opacity-80 group-hover:opacity-60 transition-opacity" alt="Banner">
                <div class="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent"></div>
                <div class="absolute bottom-0 left-0 p-6 w-full">
                     ${job.category ? `<span class="inline-block text-[10px] font-bold px-2 py-1 bg-blue-600 text-white rounded mb-2 uppercase tracking-wide">
                        ${safeText(job.category)}
                     </span>` : ''}
                    <h2 class="text-2xl md:text-3xl font-bold text-white leading-tight mb-2">${safeText(job.title)}</h2>
                    <div class="flex items-center gap-4 text-white/90 text-sm">
                        <span class="flex items-center gap-1"><svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg> Posted ${job.postedAt && job.postedAt.toDate ? job.postedAt.toDate().toLocaleDateString() : 'Recently'}</span>
                    </div>
                </div>
            </div>

            <div class="flex flex-col md:flex-row">
                <!-- Left: Info -->
                <div class="flex-1 p-6 space-y-6 border-r border-gray-100">
                    
                    <!-- Stats Grid -->
                    <div class="grid grid-cols-2 gap-4">
                        <div class="bg-blue-50 p-4 rounded-xl border border-blue-100">
                            <p class="text-xs text-blue-500 font-semibold uppercase">Pay per Task</p>
                            <p class="text-xl font-bold text-blue-700 mt-1">${formatNaira(job.workerPay)}</p>
                        </div>
                        <div class="bg-gray-50 p-4 rounded-xl border border-gray-100">
                            <p class="text-xs text-gray-500 font-semibold uppercase">Availability</p>
                            <div class="flex items-baseline gap-1 mt-1">
                                <span id="aff2_live_occupancy" class="text-xl font-bold text-gray-800">0</span>
                                <span class="text-sm text-gray-500">/ ${numWorkers}</span>
                            </div>
                            <div class="w-full bg-gray-200 h-1.5 rounded-full mt-2 overflow-hidden">
                                <div id="aff2_live_progress" class="bg-green-500 h-full transition-all duration-500" style="width: 0%"></div>
                            </div>
                        </div>
                    </div>

                    <!-- Instructions -->
                    <div>
                        <h3 class="font-bold text-gray-900 mb-2 flex items-center gap-2">
                            📝 Task Instructions
                        </h3>
                        <div class="text-gray-600 text-sm leading-relaxed bg-gray-50 p-4 rounded-xl border border-gray-100">
                            ${job.instructions ? safeText(job.instructions).replace(/\n/g, '<br>') : 'No specific instructions.'}
                        </div>
                    </div>

                    <!-- Link -->
                    ${job.targetLink ? `
                    <div>
                        <h3 class="font-bold text-gray-900 mb-2">🔗 Target Link</h3>
                        <a href="${safeText(job.targetLink)}" target="_blank" class="flex items-center justify-between p-4 bg-blue-50 border border-blue-100 rounded-xl text-blue-700 hover:bg-blue-100 transition-colors group">
                            <span class="truncate text-sm font-medium pr-4">${safeText(job.targetLink)}</span>
                            <svg class="w-5 h-5 flex-shrink-0 transform group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"></path></svg>
                        </a>
                    </div>` : ''}

                    <!-- Proof Requirements -->
                    ${job.proofRequired ? `
                    <div>
                        <h3 class="font-bold text-gray-900 mb-2">📸 Proof Required</h3>
                        <div class="text-gray-600 text-sm bg-yellow-50 p-3 rounded-lg border border-yellow-100 border-l-4 border-l-yellow-400">
                            ${safeText(job.proofRequired)}
                        </div>
                    </div>` : ''}

                </div>

                <!-- Right: Submission -->
                <div class="w-full md:w-[400px] bg-gray-50 p-6 flex flex-col">
                    <div id="aff2_submitArea_Container" class="bg-white p-5 rounded-xl shadow-sm border border-gray-200 flex-1 flex flex-col">
                        <h3 class="font-bold text-gray-900 mb-4 border-b pb-2">Submit Proof</h3>
                        
                        <div id="aff2_submitForm_Inner" class="space-y-4 flex-1">
                            <!-- Dynamic Content Here -->
                            <p class="text-sm text-gray-500 text-center py-4">Checking eligibility...</p>
                        </div>
                    </div>
                </div>
            </div>
        `;

        container.appendChild(wrapper);
    }

    /* ---------- Live Occupancy & User Status Logic ---------- */
    function initOccupancyListener(job) {
        // Listen to all submissions for this job to count occupancy live
        state.activeListeners['jobOccupancy'] = db.collection('affiliate_submissions')
            .where('jobId', '==', job.id)
            .onSnapshot(snap => {
                let occupancy = 0, approved = 0;
                snap.forEach(d => {
                    const s = (d.data().status || '').toLowerCase();
                    if (s === 'on review' || s === 'approved') occupancy++;
                    if (s === 'approved') approved++;
                });

                // Update DOM
                const occEl = el('aff2_live_occupancy');
                const progEl = el('aff2_live_progress');
                const numWorkers = Number(job.numWorkers || 0);
                
                if (occEl) occEl.textContent = occupancy;
                if (progEl) progEl.style.width = (numWorkers > 0 ? Math.min(100, (occupancy / numWorkers) * 100) : 0) + '%';

                state.currentJobOccupancy = occupancy;
                state.currentJobApproved = approved;

                // Re-evaluate form state based on new counts
                updateSubmitFormState(job);

            }, err => console.error(err));
    }

    function initUserSubmissionListener(job) {
        if (!auth.currentUser) {
            updateSubmitFormState(job);
            return;
        }

        const uid = auth.currentUser.uid;
        state.activeListeners['userSubmission'] = db.collection('affiliate_submissions')
            .where('jobId', '==', job.id)
            .where('userId', '==', uid)
            .onSnapshot(snap => {
                state.userSubmission = snap.empty ? null : { id: snap.docs[0].id, ...snap.docs[0].data() };
                updateSubmitFormState(job);
            });
    }

    /* ---------- Smart Form State Manager ---------- */
    function updateSubmitFormState(job) {
        const container = el('aff2_submitForm_Inner');
        if (!container) return;

        // 1. If User has submitted (Live Update)
        if (state.userSubmission) {
            renderSubmittedView(container, state.userSubmission);
            return;
        }

        // 2. If Not Logged In
        if (!auth.currentUser) {
            container.innerHTML = `
                <div class="text-center py-6">
                    <div class="bg-gray-100 p-3 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-3">🔒</div>
                    <p class="text-gray-600 text-sm mb-4">You must be logged in to submit tasks.</p>
                </div>
            `;
            // Note: In a real app, you'd trigger a login modal here
            return;
        }

        // 3. If Job is Full (Approved Limit)
        const approved = state.currentJobApproved || 0;
        const numWorkers = Number(job.numWorkers || 0);
        if (numWorkers > 0 && approved >= numWorkers) {
            container.innerHTML = `
                <div class="text-center py-6 bg-red-50 rounded-lg border border-red-100">
                    <div class="text-red-500 font-bold mb-1">Task Closed</div>
                    <p class="text-xs text-red-400">All slots have been approved.</p>
                </div>
            `;
            return;
        }

        // 4. If Job is Busy (Occupancy Limit)
        const occupancy = state.currentJobOccupancy || 0;
        if (numWorkers > 0 && occupancy >= numWorkers) {
             container.innerHTML = `
                <div class="text-center py-6 bg-yellow-50 rounded-lg border border-yellow-100">
                    <div class="text-yellow-600 font-bold mb-1">Slots Full</div>
                    <p class="text-xs text-yellow-500">Submissions are currently under review. Check back later.</p>
                </div>
            `;
            return;
        }

        // 5. Render Open Submission Form
        renderActiveSubmitForm(container, job);
    }

    /* ---------- Render Helpers ---------- */
    function renderSubmittedView(container, sub) {
        const statusColors = {
            'approved': 'bg-green-100 text-green-700 border-green-200',
            'rejected': 'bg-red-100 text-red-700 border-red-200',
            'on review': 'bg-blue-50 text-blue-600 border-blue-100'
        };
        const sClass = statusColors[sub.status?.toLowerCase()] || statusColors['on review'];
        const urls = sub.proofFiles || sub.proofURLs || [];

        container.innerHTML = `
            <div class="flex flex-col h-full">
                <div class="p-4 rounded-lg border ${sClass} mb-4 text-center">
                    <div class="font-bold uppercase text-xs tracking-wider mb-1">Submission Status</div>
                    <div class="text-lg font-extrabold capitalize">${safeText(sub.status)}</div>
                </div>

                <div class="flex-1 overflow-y-auto space-y-2 mb-4 custom-scrollbar">
                    ${urls.length ? urls.map(u => 
                        `<a href="${u}" target="_blank" class="block group relative rounded-lg overflow-hidden border border-gray-200 hover:border-blue-400 transition-colors">
                            <img src="${u}" class="w-full h-24 object-cover" />
                            <div class="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors"></div>
                         </a>`
                    ).join('') : '<p class="text-xs text-gray-400 text-center">No images</p>'}
                </div>
                
                ${sub.note ? `<div class="text-xs text-gray-500 bg-gray-50 p-3 rounded border">Note: ${safeText(sub.note)}</div>` : ''}
                
                <p class="text-[10px] text-center text-gray-400 mt-4">Submitted: ${sub.createdAt?.toDate ? sub.createdAt.toDate().toLocaleString() : 'Just now'}</p>
            </div>
        `;
    }

    function renderActiveSubmitForm(container, job) {
        // Only re-render if it's not already the form to prevent clearing inputs on snapshot update
        if(container.querySelector('form')) return; 

        container.innerHTML = `
            <form id="aff2_real_form" class="flex flex-col gap-3 h-full">
                
                <div class="space-y-2">
                    <label class="text-xs font-bold text-gray-700 uppercase">Upload Proofs</label>
                    
                    <div class="grid grid-cols-3 gap-2">
                        ${[1,2,3].map(i => `
                        <label class="cursor-pointer group relative flex flex-col items-center justify-center h-20 bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg hover:bg-blue-50 hover:border-blue-300 transition-all">
                            <input type="file" id="proofFile${i}" accept="image/*" class="hidden" onchange="this.nextElementSibling.classList.remove('hidden'); this.parentElement.classList.add('border-solid','border-blue-500')">
                            <svg class="w-6 h-6 text-gray-400 group-hover:text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path></svg>
                            <div class="hidden absolute top-1 right-1 w-2 h-2 bg-green-500 rounded-full"></div>
                        </label>
                        `).join('')}
                    </div>
                </div>

                <div class="flex-1">
                    <label class="text-xs font-bold text-gray-700 uppercase">Note (Optional)</label>
                    <textarea id="aff2_detailSubmissionNote" class="w-full h-24 p-3 mt-1 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-none" placeholder="Add comments here..."></textarea>
                </div>

                <button type="button" id="aff2_detailSubmitBtn" class="w-full py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg shadow-blue-600/30 transition-all transform active:scale-95 flex items-center justify-center gap-2">
                    <span>Submit Work</span>
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
                </button>
            </form>
        `;

        el('aff2_detailSubmitBtn').onclick = () => handleSubmission(job);
    }

    /* ---------- Handle Submission ---------- */
    async function handleSubmission(job) {
        const btn = el('aff2_detailSubmitBtn');
        if(!btn) return;

        if (!auth.currentUser) { alert('Please log in.'); return; }
        const uid = auth.currentUser.uid;

        // Collect files
        const fEls = [el('proofFile1'), el('proofFile2'), el('proofFile3')];
        const files = fEls.map(i => i?.files?.[0]).filter(Boolean);
        if (files.length < 1) { alert('Please upload at least one proof image.'); return; }

        btn.disabled = true;
        const originalText = btn.innerHTML;
        btn.innerHTML = `<svg class="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>`;

        try {
            // Check double submit again
            const check = await db.collection('affiliate_submissions')
                .where('jobId', '==', job.id)
                .where('userId', '==', uid).get();
            
            if (!check.empty) {
                alert('Already submitted.');
                return;
            }

            // Upload
            const uploaded = [];
            for (const f of files) {
                uploaded.push(await uploadFileHelper(f));
            }

            const payload = {
                jobId: job.id,
                userId: uid,
                userName: auth.currentUser.displayName || auth.currentUser.email || 'Anonymous',
                proofFiles: uploaded,
                note: (el('aff2_detailSubmissionNote')?.value || '').trim(),
                status: 'on review',
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            };

            await db.collection('affiliate_submissions').add(payload);
            
            // Note: No need to manually update UI here. 
            // The active onSnapshot listener 'userSubmission' will detect the new doc and trigger renderSubmittedView automatically.

        } catch (err) {
            console.error(err);
            alert('Error submitting. Try again.');
            btn.disabled = false;
            btn.innerHTML = originalText;
        }
    }

    /* ---------- Finished Tasks (Standard Get) ---------- */
    async function loadAndRenderFinished() {
        // This screen remains standard fetch for performance (pagination usually needed here later)
        const listEl = el('aff2_finishedList');
        if (!listEl) return;
        
        listEl.innerHTML = '<div class="text-center p-8"><div class="animate-spin h-6 w-6 border-2 border-blue-600 rounded-full border-t-transparent mx-auto"></div></div>';
        
        const user = auth.currentUser;
        if(!user) { listEl.innerHTML = '<p class="text-center p-4">Login required.</p>'; return; }

        try {
            const snap = await db.collection('affiliate_submissions')
                .where('userId', '==', user.uid)
                .orderBy('createdAt', 'desc')
                .limit(20)
                .get();

            if(snap.empty) {
                listEl.innerHTML = '<div class="text-center p-8 text-gray-400">No submissions found.</div>';
                return;
            }

            // Fetch Job details for titles
            const jobIds = [...new Set(snap.docs.map(d => d.data().jobId))];
            const jobMap = {};
            // Chunking
            for (let i = 0; i < jobIds.length; i += 10) {
                const chunk = jobIds.slice(i, i + 10);
                if(chunk.length) {
                    const js = await db.collection('affiliateJobs').where(firebase.firestore.FieldPath.documentId(), 'in', chunk).get();
                    js.forEach(j => jobMap[j.id] = j.data());
                }
            }

            listEl.innerHTML = '';
            snap.forEach(doc => {
                const sub = doc.data();
                const job = jobMap[sub.jobId] || {};
                listEl.appendChild(makeFinishedCard(doc.id, sub, job));
            });

        } catch(e) {
            console.error(e);
            listEl.innerHTML = '<p class="text-red-500 text-center">Error loading history.</p>';
        }
    }

    function makeFinishedCard(id, sub, job) {
        const wrap = document.createElement('div');
        const statusColor = sub.status === 'approved' ? 'text-green-600 bg-green-50 border-green-100' : 
                            sub.status === 'rejected' ? 'text-red-600 bg-red-50 border-red-100' : 'text-blue-600 bg-blue-50 border-blue-100';
        
        wrap.className = 'bg-white rounded-xl p-4 mb-3 border border-gray-100 shadow-sm flex justify-between items-center';
        wrap.innerHTML = `
            <div>
                <h4 class="font-bold text-gray-800">${safeText(job.title || 'Unknown Task')}</h4>
                <div class="text-xs text-gray-500 mt-1">${sub.createdAt?.toDate ? sub.createdAt.toDate().toLocaleDateString() : ''}</div>
            </div>
            <div class="text-right">
                <span class="inline-block px-3 py-1 rounded-full text-xs font-bold uppercase ${statusColor}">
                    ${safeText(sub.status)}
                </span>
                <div class="mt-2">
                    <button class="aff2-view-submission-btn text-blue-600 text-xs hover:underline" data-id="${id}">View</button>
                </div>
            </div>
        `;
        return wrap;
    }

    /* ---------- Modal for Finished ---------- */
    async function openSubmissionModal(subId) {
        const doc = await db.collection('affiliate_submissions').doc(subId).get();
        if(!doc.exists) return;
        const sub = doc.data();
        const modal = document.createElement('div');
        modal.className = 'fixed inset-0 z-[9999] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4';
        modal.innerHTML = `
            <div class="bg-white rounded-2xl max-w-lg w-full overflow-hidden shadow-2xl transform transition-all">
                <div class="p-4 border-b flex justify-between items-center bg-gray-50">
                    <h3 class="font-bold">Submission Details</h3>
                    <button id="aff2_close_modal" class="text-gray-500 hover:text-black">✕</button>
                </div>
                <div class="p-6 overflow-y-auto max-h-[70vh]">
                     <div class="grid grid-cols-2 gap-2 mb-4">
                        ${(sub.proofFiles||[]).map(u => `<img src="${u}" class="rounded-lg w-full h-32 object-cover bg-gray-100">`).join('')}
                     </div>
                     ${sub.note ? `<p class="text-sm text-gray-600 bg-gray-50 p-3 rounded">"${safeText(sub.note)}"</p>` : ''}
                </div>
            </div>
        `;
        document.body.appendChild(modal);
        modal.onclick = (e) => { if(e.target === modal || e.target.id === 'aff2_close_modal') modal.remove(); }
    }

    /* ---------- Events ---------- */
    function onDocClick(e) {
        const t = e.target;
        // View Task
        const btnView = t.closest('.aff2-btn-view');
        if (btnView) return openJobDetail(btnView.dataset.id);

        // Navigation
        if (t.closest('#aff2_backToListBtn') || t.closest('#aff2_backToMainBtn')) {
            clearListener('jobDetail');
            clearListener('jobOccupancy');
            clearListener('userSubmission');
            el('aff2_jobDetailScreen')?.classList.add('aff2-hidden');
            el('aff2_finishedScreen')?.classList.add('aff2-hidden');
            el('aff2_jobsContainer')?.classList.remove('aff2-hidden');
            loadAndRenderJobs();
            return;
        }

        if (t.closest('#aff2_openFinishedBtn')) {
            clearAllListeners(); // Stop listening to live jobs to save resources
            el('aff2_jobsContainer')?.classList.add('aff2-hidden');
            el('aff2_jobDetailScreen')?.classList.add('aff2-hidden');
            el('aff2_finishedScreen')?.classList.remove('aff2-hidden');
            loadAndRenderFinished();
            return;
        }
        
        const viewSub = t.closest('.aff2-view-submission-btn');
        if(viewSub) return openSubmissionModal(viewSub.dataset.id);
    }

    /* ---------- Init ---------- */
    function init() {
        document.addEventListener('click', onDocClick);
        state.handlers.push({ el: document, ev: 'click', fn: onDocClick });
        
        // Inject Search Logic
        const sMain = el('aff2_searchMain');
        if(sMain) {
            sMain.addEventListener('input', (e) => {
                const q = e.target.value.toLowerCase();
                const grid = el('aff2_grid') || el('aff2_jobsList');
                if(!grid) return;
                [...grid.children].forEach(c => c.style.display = c.innerText.toLowerCase().includes(q) ? '' : 'none');
            });
        }

        loadAndRenderJobs();
    }

    /* ---------- Destroy (Cleanup) ---------- */
    function destroy() {
        clearAllListeners();
        state.handlers.forEach(h => h.el.removeEventListener(h.ev, h.fn));
        window.AFF2_COMPLETE_FINAL = null;
    }

    window.AFF2 = { init, destroy, loadAndRenderJobs };
    setTimeout(init, 50);

})();
