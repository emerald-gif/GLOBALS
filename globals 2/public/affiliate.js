     

       


// Firebase config & inits
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






                                    //AFFILIATE 


// AFFILIATE — Robust single-file module (no snapshots)
// Paste after firebase is initialized
(function(){
  'use strict';

  if (window.AFF2_COMPLETE_FINAL) { console.warn('[AFF2] already present'); return; }
  window.AFF2_COMPLETE_FINAL = true;

  /* ---------- helpers ---------- */
  const el = id => document.getElementById(id);
  const safeText = s => String(s || '')
    .replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;')
    .replaceAll('"','&quot;').replaceAll("'", '&#39;');
  const formatNaira = n => (n==null||isNaN(Number(n))) ? '₦0' : '₦'+Number(n).toLocaleString('en-NG');

  /* ---------- firebase refs ---------- */
  const firebaseAvailable = !!(window.firebase && window.firebase.firestore);
  const db = firebaseAvailable ? window.firebase.firestore() : null;
  const auth = (window.firebase && window.firebase.auth) ? window.firebase.auth() : null;

  /* ---------- module state ---------- */
  const state = {
    handlers: [],
    currentJobId: null,
    // used to reflect instant local updates in the details screen
    localOccupancyIncrement: 0
  };

  /* ---------- upload helper (Cloudinary or Firebase Storage) ---------- */
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
    throw new Error('No upload helper available. Provide uploadToCloudinary(file) or enable firebase.storage.');
  }

  /* ---------- Job Card (with category + rate) ---------- */
  function makeJobCard(job, occupancy = 0, approved = 0) {
  const wrap = document.createElement('div');
  wrap.className = 'aff2-job-card bg-white rounded-xl p-3 shadow-sm mb-4';

  const img = job.campaignLogoURL || job.image || '/assets/default-thumb.jpg';
  const numWorkers = Number(job.numWorkers || 0);
  const remaining = Math.max(0, numWorkers - occupancy);

  wrap.innerHTML = `
    <div class="overflow-hidden rounded-lg">
      <img src="${safeText(img)}" alt="${safeText(job.title||'')}" class="w-full h-36 object-cover rounded-lg"/>
    </div>

    <div class="mt-3">
      <h4 class="font-semibold text-md">${safeText(job.title || 'Untitled')}</h4>

      ${job.category ? `<div class="mt-1">
        <span class="inline-block text-xs px-2 py-1 bg-blue-100 text-blue-600 rounded">
          ${safeText(job.category)}
        </span>
      </div>` : ''}

      <div class="text-sm text-blue-600 mt-1 font-medium">${formatNaira(job.workerPay)}</div>
      <div class="text-sm text-gray-500 mt-1">${occupancy}/${numWorkers} workers</div>

      <div class="mt-3 flex items-center justify-between">
        
        <button class="aff2-btn-view px-3 py-1.5 bg-blue-600 text-white text-sm rounded-lg" data-id="${safeText(job.id)}">
          View Task
        </button>
      </div>
    </div>
  `;

  return wrap;
}

  /* ---------- Load jobs (explicit get, compute occupancy & approved) ---------- */
  async function loadAndRenderJobs() {
    const grid = el('aff2_grid') || el('aff2_jobsList') || el('aff2_jobsContainer');
    if (!grid) { console.warn('[AFF2] jobs container missing'); return; }
    try {
      grid.innerHTML = '<p class="text-gray-500 p-6 text-center">Loading tasks...</p>';
      if (!db) throw new Error('Database not available');

      let q = db.collection('affiliateJobs').where('status','==','approved');
      try { q = q.orderBy('postedAt','desc'); } catch (_) {}
      const snap = await q.get();
      if (snap.empty) { grid.innerHTML = '<p class="text-gray-500 p-6 text-center">No affiliate tasks right now.</p>'; return; }

      const jobs = snap.docs.map(d => ({ id: d.id, ...d.data() }));

      // gather counts in parallel
      const counts = await Promise.all(jobs.map(job => (async ()=>{
        const jobId = job.id;
        // occupancy = on review + approved
        let occupancy = 0, approved = 0;
        try {
          // best-effort: try to use 'in' style combined statuses through two queries
          const occSnap = await db.collection('affiliate_submissions')
            .where('jobId','==',jobId)
            .get();
          occSnap.forEach(doc => {
            const s = (doc.data().status || '').toLowerCase();
            if (s === 'on review' || s === 'approved') occupancy++;
            if (s === 'approved') approved++;
          });
        } catch (e) {
          console.error('[AFF2] count fallback error', e);
        }
        return { jobId, occupancy, approved };
      })()));

      const map = {};
      counts.forEach(c => map[c.jobId] = c);

      grid.innerHTML = '';
      for (const job of jobs) {
        const c = map[job.id] || { occupancy: 0, approved: 0 };
        const numWorkers = Number(job.numWorkers || 0);
        // if approved >= numWorkers -> job leaves the list (do not show)
        if (numWorkers > 0 && c.approved >= numWorkers) continue;
        grid.appendChild(makeJobCard(job, c.occupancy, c.approved));
      }

    } catch (err) {
      console.error('[AFF2] loadAndRenderJobs', err);
      grid.innerHTML = '<p class="text-red-500 p-6">Failed to load tasks.</p>';
    }
  }

  /* ---------- Open Job Detail (get only) ---------- */
async function openJobDetail(jobId) {
  if (!db) { 
    alert('Database not ready'); 
    return; 
  }

  try {
    const doc = await db.collection('affiliateJobs').doc(jobId).get();
    if (!doc.exists) { 
      alert('Job not found'); 
      return; 
    }

    const job = { id: doc.id, ...doc.data() };
    state.currentJobId = job.id;
    state.localOccupancyIncrement = 0;

    const content = el('aff2_jobDetailContent');
    if (!content) { 
      alert('Detail container missing'); 
      return; 
    }

    content.innerHTML = '';

    // build UI
    const wrapper = document.createElement('div');
    wrapper.className = 'bg-white rounded-2xl shadow-md overflow-hidden max-w-3xl mx-auto my-6';

    const bannerWrapper = document.createElement('div');
bannerWrapper.className = 'relative w-full h-56 bg-gray-100 rounded-xl overflow-hidden flex items-center justify-center border';

const banner = document.createElement('img');
banner.src = job.image || job.campaignLogoURL || '/assets/default-banner.jpg';
banner.className = 'max-w-full max-h-full object-contain rounded-lg';

bannerWrapper.appendChild(banner);
wrapper.appendChild(bannerWrapper);



	  
    const body = document.createElement('div');
    body.className = 'p-6 space-y-4';
    body.innerHTML = `
      <div>
        <h2 class="text-2xl font-bold">${safeText(job.title || 'Untitled')}</h2>
        <div class="mt-1">
          ${job.category 
            ? `<span class="inline-block text-xs px-2 py-1 bg-blue-100 text-blue-600 rounded">${safeText(job.category)}</span>` 
            : ''
          }
        </div>
        <p class="text-sm text-gray-500 mt-2">
          ${formatNaira(job.workerPay)} · ${Number(job.numWorkers || 0)} workers
        </p>
      </div>

      ${job.instructions 
        ? `<div class="text-gray-700 text-sm"><strong>Instructions:</strong><br>${safeText(job.instructions)}</div>` 
        : ''
      }

      ${job.targetLink 
        ? `<div><strong class="text-sm text-gray-700">Target Link:</strong> 
            <a href="${safeText(job.targetLink)}" target="_blank" class="text-blue-600 underline break-all">
              ${safeText(job.targetLink)}
            </a>
           </div>` 
        : ''
      }

      ${job.proofRequired 
        ? `<div class="text-gray-700 text-sm"><strong>Proof Required:</strong><br>${safeText(job.proofRequired)}</div>` 
        : ''
      }

      <div id="aff2_submitArea" class="mt-6 border-t pt-4">
        <h3 class="text-base font-semibold text-gray-800 mb-3">Submit Proof</h3>
        <div class="space-y-3">
          <div>
            <label class="text-sm text-gray-700">Proof File 1</label>
            <input type="file" id="proofFile1" accept="image/*" class="block w-full border rounded-md p-2">
          </div>
          <div>
            <label class="text-sm text-gray-700">Proof File 2</label>
            <input type="file" id="proofFile2" accept="image/*" class="block w-full border rounded-md p-2">
          </div>
          <div>
            <label class="text-sm text-gray-700">Proof File 3</label>
            <input type="file" id="proofFile3" accept="image/*" class="block w-full border rounded-md p-2">
          </div>
        </div>

        <textarea 
          id="aff2_detailSubmissionNote" 
          placeholder="Optional note..." 
          class="w-full border rounded-md p-3 mt-3 h-28">
        </textarea>

        <div class="mt-3">
          <button id="aff2_detailSubmitBtn" class="w-full py-3 bg-blue-600 text-white rounded-xl">
            Submit Proof
          </button>
        </div>

        <p class="text-xs text-gray-400 mt-2">Job is Running.</p>
      </div>
    `;

    wrapper.appendChild(body);
    content.appendChild(wrapper);
  	  
	  // show/hide screens
      el('aff2_jobsContainer')?.classList.add('aff2-hidden');
      el('aff2_finishedScreen')?.classList.add('aff2-hidden');
      el('aff2_jobDetailScreen')?.classList.remove('aff2-hidden');

      // compute occupancy & approved
      const { occupancy, approved } = await computeCountsForJob(job.id);
      // reflect to UI
      state.currentApproved = approved;
      state.currentOccupancy = occupancy;
      updateDetailProgressUI(job.numWorkers || 0);

      // if approved >= slots: close submissions
      const numWorkers = Number(job.numWorkers || 0);
      if (numWorkers > 0 && approved >= numWorkers) {
        const area = el('aff2_submitArea');
        if (area) {
          area.innerHTML = `<div style="padding:12px;background:#f8fafc;border-radius:12px;text-align:center"><strong>All slots fully approved. This job is closed.</strong></div>`;
        }
        // still try show user's own submission if exists
        await showUserSubmissionIfExists(job.id);
        return;
      }

      // if occupancy >= slots (on review + approved fill slots): hide submit inputs but show user's own if present
      if (numWorkers > 0 && occupancy >= numWorkers) {
        const area = el('aff2_submitArea');
        if (area) {
          area.innerHTML = `<div style="padding:12px;background:#fffbeb;border-radius:12px;text-align:center"><strong>No open submission slots right now. Please check back later.</strong></div>`;
        }
        await showUserSubmissionIfExists(job.id);
        return;
      }

      // if user already submitted -> show their submission
      const user = auth.currentUser;
      if (!user) {
        const submitBtn = el('aff2_detailSubmitBtn');
        if (submitBtn) submitBtn.onclick = () => alert('Please log in to submit proof.');
        return;
      }

      const uid = user.uid;
      const existingSnap = await db.collection('affiliate_submissions')
        .where('jobId','==', job.id)
        .where('userId','==', uid)
        .get();

      if (!existingSnap.empty) {
        const doc = existingSnap.docs[0];
        const sub = { id: doc.id, ...doc.data() };
        replaceSubmitAreaWithSubmitted(sub);
        return;
      }

      // otherwise attach submit handler
      attachSubmitHandler(job);

    } catch (err) {
      console.error('[AFF2] openJobDetail', err);
      alert('Failed to load job details.');
    }
  }

  /* ---------- compute counts helper ---------- */
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

  /* ---------- update detail progress UI ---------- */
  function updateDetailProgressUI(numWorkersOrZero) {
    const bar = el('aff2_detailProgressBar');
    const txt = el('aff2_detailProgressText');
    const total = Number(typeof numWorkersOrZero === 'number' ? numWorkersOrZero : (state.currentNumWorkers || 0)) || 1;
    // occupancy includes local increment (optimistic)
    const occ = (Number(state.currentOccupancy || 0) + Number(state.localOccupancyIncrement || 0));
    const approved = Number(state.currentApproved || 0);
    const pct = Math.min(100, Math.round((occ / total) * 100));
    if (bar) bar.style.width = pct + '%';
    if (txt) txt.textContent = `${occ}/${total} · Approved: ${approved}`;
  }

  /* ---------- show user's own submission if exists ---------- */
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
        const sub = { id: doc.id, ...doc.data() };
        replaceSubmitAreaWithSubmitted(sub);
      }
    } catch (err) {
      console.error('[AFF2] showUserSubmissionIfExists', err);
    }
  }

  /* ---------- replace submit area with submitted view ---------- */
  function replaceSubmitAreaWithSubmitted(sub) {
    const area = el('aff2_submitArea');
    if (!area) return;
    const urls = (sub.proofFiles || sub.proofURLs || []);
    const imagesHtml = urls.length ? urls.map(u => `<img src="${safeText(u)}" style="width:100%;max-height:220px;object-fit:contain;border-radius:8px;margin-bottom:8px">`).join('') : `<div style="color:#9ca3af">No proof images</div>`;
    const noteHtml = sub.note ? `<div style="margin-top:8px;color:#374151"><strong>Note:</strong> ${safeText(sub.note)}</div>` : '';
    const statusSafe = safeText(sub.status || 'on review');

    area.innerHTML = `
      <div style="background:#f8fafc;padding:14px;border-radius:12px;text-align:center">
        <div style="color:#16a34a;font-weight:600;margin-bottom:6px">✅ Your submission</div>
        <div style="font-size:13px;color:#6b7280;margin-bottom:8px">Status: <strong style="color:#111827">${statusSafe}</strong></div>
        ${imagesHtml}
        ${noteHtml}
      </div>
    `;

    // if this was a local optimistic submission, reflect occupancy increment
    if (sub && sub._localIncrement) {
      state.localOccupancyIncrement = (state.localOccupancyIncrement || 0) + 1;
      updateDetailProgressUI(Number(state.currentNumWorkers || 0));
    }
  }

  /* ---------- attach submit handler (prevents double submits) ---------- */
  function attachSubmitHandler(job) {
    const submitBtn = el('aff2_detailSubmitBtn');
    if (!submitBtn) return;
    submitBtn.onclick = null;

    submitBtn.onclick = async function() {
      // ensure logged in
      if (!auth || !auth.currentUser) { alert('Please log in to submit proof.'); return; }
      const uid = auth.currentUser.uid;

      // collect files: 3 inputs, at least 1 required
      const fEls = [el('proofFile1'), el('proofFile2'), el('proofFile3')];
      const files = fEls.map(i => i?.files?.[0]).filter(Boolean);
      if (files.length < 1) { alert('Please upload at least one proof file.'); return; }

      // disable button to avoid double submit
      submitBtn.disabled = true;
      const prevText = submitBtn.textContent;
      submitBtn.textContent = 'Submitting...';

      try {
        // final duplicate check
        const check = await db.collection('affiliate_submissions')
          .where('jobId','==', job.id)
          .where('userId','==', uid)
          .get();
        if (!check.empty) {
          // already submitted — show existing doc and do nothing else
          const doc = check.docs[0];
          replaceSubmitAreaWithSubmitted({ id: doc.id, ...doc.data() });
          alert('You have already submitted for this job.');
          return;
        }

        // upload files sequentially (cloudinary or firebase storage)
        const uploaded = [];
        for (let i = 0; i < files.length; i++) {
          const url = await uploadFileHelper(files[i]);
          uploaded.push(url);
        }

        // prepare payload
        const payload = {
          jobId: job.id,
          userId: uid,
          userName: auth.currentUser.displayName || auth.currentUser.email || '',
          proofFiles: uploaded,
          note: (el('aff2_detailSubmissionNote')?.value || '').trim(),
          status: 'on review',
          createdAt: firebase.firestore.FieldValue.serverTimestamp()
        };

        // write to DB
        await db.collection('affiliate_submissions').add(payload);

        // optimistic UI: show submitted and increment local occupancy
        replaceSubmitAreaWithSubmitted({ ...payload, _localIncrement: true });
        alert('✅ Submission successful! It will be reviewed by admin.');

      } catch (err) {
        console.error('[AFF2] submit error', err);
        alert('Submission failed. Please try again.');
        // re-enable
        submitBtn.disabled = false;
        submitBtn.textContent = prevText;
      }
    };
  }

  /* ---------- Finished tasks: load & render (counts & cards) ---------- */
  async function loadAndRenderFinished() {
    const listEl = el('aff2_finishedList');
    const pendingCountEl = el('aff2_pendingCount');
    const approvedCountEl = el('aff2_approvedCount');

    if (!listEl) { console.warn('[AFF2] finished list missing'); return; }
    listEl.innerHTML = '<p class="text-gray-500 p-6 text-center">Loading finished tasks...</p>';

    try {
      // ensure user is available
      const user = auth.currentUser || await new Promise(resolve => {
        const off = auth.onAuthStateChanged(u => { off(); resolve(u); });
      });
      if (!user) {
        listEl.innerHTML = '<p class="text-gray-500 p-6 text-center">Please sign in to see your finished tasks.</p>';
        if (pendingCountEl) pendingCountEl.textContent = '0';
        if (approvedCountEl) approvedCountEl.textContent = '0';
        return;
      }

      const snap = await db.collection('affiliate_submissions')
        .where('userId','==', user.uid)
        .orderBy('createdAt','desc')
        .get();

      if (snap.empty) {
        listEl.innerHTML = '<p class="text-gray-500 p-6 text-center">You have no finished tasks yet.</p>';
        if (pendingCountEl) pendingCountEl.textContent = '0';
        if (approvedCountEl) approvedCountEl.textContent = '0';
        return;
      }

      // gather job titles
      const jobIds = [...new Set(snap.docs.map(d => d.data().jobId).filter(Boolean))];
      const jobMap = {};
      for (let i = 0; i < jobIds.length; i += 10) {
        const chunk = jobIds.slice(i, i + 10);
        const jobsSnap = await db.collection('affiliateJobs')
          .where(firebase.firestore.FieldPath.documentId(), 'in', chunk)
          .get();
        jobsSnap.forEach(jd => jobMap[jd.id] = jd.data());
      }

      // render cards and compute counts
      let pending = 0, approved = 0;
      listEl.innerHTML = '';
      snap.forEach(doc => {
        const sub = doc.data();
        const job = jobMap[sub.jobId] || {};
        if (sub.status === 'approved') approved++;
        else if (sub.status === 'on review') pending++;
        listEl.appendChild(makeFinishedCard(doc.id, sub, job));
      });

      if (pendingCountEl) pendingCountEl.textContent = String(pending);
      if (approvedCountEl) approvedCountEl.textContent = String(approved);

    } catch (err) {
      console.error('[AFF2] loadAndRenderFinished', err);
      listEl.innerHTML = '<p class="text-red-500 p-6">Failed to load submissions.</p>';
    }
  }

  /* ---------- finished card (redesigned) ---------- */
  function makeFinishedCard(id, sub, job) {
    const date = (sub.createdAt && typeof sub.createdAt.toDate === 'function') ? sub.createdAt.toDate().toLocaleString() : '';
    const title = safeText(job.title || 'Affiliate Job');
    const status = (sub.status || 'on review').toLowerCase();
    const statusColor = status === 'approved' ? '#10b981' : status === 'rejected' ? '#ef4444' : '#f59e0b';
    const urls = (sub.proofFiles || sub.proofURLs || []);
    const wrapper = document.createElement('div');
    wrapper.className = 'aff2-finished-card bg-white rounded-2xl p-4 mb-4 shadow-sm';
    wrapper.style.borderLeft = `6px solid ${statusColor}`;

    const inner = document.createElement('div');
    inner.innerHTML = `
      <div style="display:flex;justify-content:space-between;align-items:flex-start">
        <div style="flex:1;padding-right:12px">
          <div style="font-weight:700;color:#111827">${title}</div>
          <div style="font-size:13px;color:#6b7280;margin-top:6px">Status: <strong style="color:${statusColor}">${safeText(sub.status || 'on review')}</strong></div>
          <div style="font-size:12px;color:#9ca3af;margin-top:6px">${safeText(date)}</div>
        </div>
        <div style="flex-shrink:0">
          <button class="aff2-view-submission-btn" data-id="${safeText(id)}" style="background:#2563eb;color:#fff;border:none;padding:8px 10px;border-radius:8px;cursor:pointer">View</button>
        </div>
      </div>
    `;
    wrapper.appendChild(inner);

    // images grid
    const grid = document.createElement('div');
    grid.style.cssText = 'display:grid;grid-template-columns:repeat(auto-fit,minmax(120px,1fr));gap:8px;margin-top:10px';
    if (urls.length) {
      urls.forEach(u => {
        const img = document.createElement('img');
        img.src = u;
        img.style.cssText = 'width:100%;max-height:200px;object-fit:contain;border-radius:8px';
        grid.appendChild(img);
      });
    } else {
      const p = document.createElement('div');
      p.textContent = 'No proof images';
      p.style.cssText = 'color:#9ca3af';
      grid.appendChild(p);
    }
    wrapper.appendChild(grid);

    if (sub.note) {
      const note = document.createElement('div');
      note.style.cssText = 'margin-top:10px;color:#374151';
      note.innerHTML = `<strong>Note:</strong> ${safeText(sub.note)}`;
      wrapper.appendChild(note);
    }

    return wrapper;
  }

  /* ---------- open submission modal (fetch by id) ---------- */
  async function openSubmissionModal(subId) {
    try {
      const doc = await db.collection('affiliate_submissions').doc(subId).get();
      if (!doc.exists) return alert('Submission not found.');
      const sub = { id: doc.id, ...doc.data() };
      const jobDoc = sub.jobId ? await db.collection('affiliateJobs').doc(sub.jobId).get() : null;
      const job = jobDoc && jobDoc.exists ? jobDoc.data() : {};

      const modal = document.createElement('div');
      modal.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.5);display:flex;align-items:center;justify-content:center;z-index:9999;padding:16px';
      const box = document.createElement('div');
      box.style.cssText = 'max-width:900px;width:100%;max-height:90vh;overflow:auto;background:#fff;border-radius:12px;padding:20px';
      box.innerHTML = `
        <div style="display:flex;justify-content:space-between;align-items:center">
          <h3 style="margin:0">${safeText(job.title || 'Submission')}</h3>
          <button id="aff2_modal_close" style="background:#ef4444;color:#fff;border:none;padding:6px 10px;border-radius:8px;cursor:pointer">Close</button>
        </div>
        <div style="margin-top:8px;color:#6b7280"><strong>Status:</strong> ${safeText(sub.status || 'on review')}</div>
        <div style="font-size:13px;color:#9ca3af;margin-top:6px">${(sub.createdAt && sub.createdAt.toDate) ? sub.createdAt.toDate().toLocaleString() : ''}</div>
        <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:12px;margin-top:12px">
          ${(sub.proofFiles||sub.proofURLs||[]).map(u => `<img src="${safeText(u)}" style="width:100%;max-height:400px;object-fit:contain;border-radius:8px">`).join('') || '<div style="color:#9ca3af">No proof images</div>'}
        </div>
        ${sub.note ? `<div style="margin-top:12px;color:#374151"><strong>Note:</strong> ${safeText(sub.note)}</div>` : ''}
      `;
      modal.appendChild(box);
      document.body.appendChild(modal);
      box.querySelector('#aff2_modal_close').addEventListener('click', ()=> modal.remove());
      modal.addEventListener('click', (ev)=> { if (ev.target === modal) modal.remove(); });

    } catch (err) {
      console.error('[AFF2] openSubmissionModal', err);
      alert('Failed to load submission.');
    }
  }

  /* ---------- delegation handler ---------- */
  function onDocClick(e) {
    const t = e.target;

    // view task button on card
    const jobBtn = t.closest && t.closest('.aff2-btn-view');
    if (jobBtn) {
      const id = jobBtn.dataset.id;
      if (id) openJobDetail(id);
      return;
    }

    // view finished submission
    const viewSub = t.closest && t.closest('.aff2-view-submission-btn');
    if (viewSub) {
      const id = viewSub.dataset.id;
      if (id) openSubmissionModal(id);
      return;
    }

    // open finished
    if (t.id === 'aff2_openFinishedBtn' || (t.closest && t.closest('#aff2_openFinishedBtn'))) {
      el('aff2_jobsContainer')?.classList.add('aff2-hidden');
      el('aff2_jobDetailScreen')?.classList.add('aff2-hidden');
      el('aff2_finishedScreen')?.classList.remove('aff2-hidden');
      loadAndRenderFinished();
      return;
    }

    // back to list
    if (t.id === 'aff2_backToListBtn' || t.id === 'aff2_backToMainBtn' || (t.closest && t.closest('#aff2_backToListBtn'))) {
      el('aff2_jobDetailScreen')?.classList.add('aff2-hidden');
      el('aff2_finishedScreen')?.classList.add('aff2-hidden');
      el('aff2_jobsContainer')?.classList.remove('aff2-hidden');
      loadAndRenderJobs();
      return;
    }

    // search main input (optional)
    const sMain = el('aff2_searchMain');
    if (sMain && (t === sMain || t.closest && t.closest('#aff2_searchMain'))) {
      // handled by input event below
    }
  }

  /* ---------- search hookups ---------- */
  function hookSearchInputs() {
    const sMain = el('aff2_searchMain');
    if (sMain) {
      let to = null;
      sMain.addEventListener('input', () => {
        clearTimeout(to);
        to = setTimeout(() => {
          const q = sMain.value.trim().toLowerCase();
          const grid = el('aff2_grid') || el('aff2_jobsList');
          if (!grid) return;
          [...grid.children].forEach(card => {
            const txt = (card.innerText || '').toLowerCase();
            card.style.display = txt.includes(q) ? '' : 'none';
          });
        }, 160);
      });
    }

    const sFinished = el('aff2_searchFinished');
    if (sFinished) {
      sFinished.addEventListener('input', () => {
        const q = sFinished.value.trim().toLowerCase();
        const list = el('aff2_finishedList');
        if (!list) return;
        [...list.children].forEach(card => {
          const txt = (card.innerText || '').toLowerCase();
          card.style.display = txt.includes(q) ? '' : 'none';
        });
      });
    }
  }

  /* ---------- init / destroy ---------- */
  function init() {
    // delegation
    document.addEventListener('click', onDocClick);
    state.handlers.push({ el: document, ev: 'click', fn: onDocClick });

    // hook search
    hookSearchInputs();

    // initial load
    loadAndRenderJobs();
  }

  function destroy() {
    for (const h of state.handlers) {
      try { h.el.removeEventListener(h.ev, h.fn); } catch(_) {}
    }
    state.handlers = [];
    try { if (el('aff2_jobDetailContent')) el('aff2_jobDetailContent').innerHTML = ''; } catch(_) {}
    try { if (el('aff2_grid')) el('aff2_grid').innerHTML = ''; } catch(_) {}
    try { if (el('aff2_finishedList')) el('aff2_finishedList').innerHTML = ''; } catch(_) {}
    try { delete window.AFF2_COMPLETE_FINAL; } catch(_) { window.AFF2_COMPLETE_FINAL = null; }
  }

  // export
  window.AFF2 = { init, destroy, loadAndRenderJobs, loadAndRenderFinished, openJobDetail };

  // auto init
  setTimeout(()=>{ try{ init(); } catch(e){ console.error(e); } }, 10);

})();
