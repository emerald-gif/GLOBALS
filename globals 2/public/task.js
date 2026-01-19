



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




// Robust Task Section Module (fixed)
// Usage: call window.initTaskSection() once (e.g., from activateTab('tasks'))
// Requires: firebase (auth + firestore) and uploadToCloudinary(file) available globally

function initTaskSectionModule() {
  'use strict';
  // ---------- Guard against double init ----------
  if (window.__TASK_SECTION_INITIALIZED__) {
    console.warn('[TASK] initTaskSectionModule already initialized - skipping.');
    return;
  }
  window.__TASK_SECTION_INITIALIZED__ = true;

  // ---------- Small runtime helpers ----------
  function safeLog(...args) { try { console.log(...args); } catch (_) { } }
  function safeWarn(...args) { try { console.warn(...args); } catch (_) { } }
  function safeError(...args) { try { console.error(...args); } catch (_) { } }
  function escapeHtml(str) {
    if (str == null) return "";
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }
  function el(id) { return document.getElementById(id); }
  function hasFirebase() { return (typeof firebase !== 'undefined') && firebase.firestore && firebase.auth; }

  // ---------- Wait helpers ----------
  async function waitForReady(timeoutMs = 5000) {
    if (document.readyState === 'loading') {
      await new Promise(res => document.addEventListener('DOMContentLoaded', res, { once: true }));
    }
    const start = Date.now();
    while (!hasFirebase() && Date.now() - start < timeoutMs) {
      await new Promise(r => setTimeout(r, 100));
    }
    return hasFirebase();
  }
  function waitForAuthReady(timeout = 4000) {
    return new Promise((resolve) => {
      if (!hasFirebase()) return resolve(null);
      let done = false;
      const t = setTimeout(() => {
        if (done) return;
        done = true;
        resolve(firebase.auth().currentUser || null);
      }, timeout);
      const unsub = firebase.auth().onAuthStateChanged((user) => {
        if (done) return;
        done = true;
        clearTimeout(t);
        try { unsub(); } catch (e) { }
        resolve(user || null);
      });
    });
  }

  // ---------- Firestore transaction helpers ----------
  async function applyTaskDeltas(taskId, { deltaFilled = 0, deltaApproved = 0 } = {}) {
    if (!taskId) throw new Error('taskId required');
    if (!hasFirebase()) throw new Error('Firebase not initialized');
    const db = firebase.firestore();
    const ref = db.collection('tasks').doc(taskId);
    await db.runTransaction(async (tx) => {
      const snap = await tx.get(ref);
      if (!snap.exists) {
        const init = {
          filledWorkers: Math.max(0, Number(deltaFilled || 0)),
          approvedWorkers: Math.max(0, Number(deltaApproved || 0))
        };
        tx.set(ref, init, { merge: true });
        return;
      }
      const data = snap.data() || {};
      const curFilled = Number(data.filledWorkers || 0);
      const curApproved = Number(data.approvedWorkers || 0);
      const newFilled = Math.max(0, curFilled + Number(deltaFilled || 0));
      const newApproved = Math.max(0, curApproved + Number(deltaApproved || 0));
      tx.update(ref, { filledWorkers: newFilled, approvedWorkers: newApproved });
    });
  }
  async function increaseTaskOccupancy(taskId) { return applyTaskDeltas(taskId, { deltaFilled: +1 }); }
  async function decreaseTaskOccupancy(taskId) { return applyTaskDeltas(taskId, { deltaFilled: -1 }); }
  async function changeTaskApprovedCount(taskId, delta) { return applyTaskDeltas(taskId, { deltaApproved: delta }); }

  // ---------- Reconcile tasks from submissions (authoritative) ----------
  async function reconcileTaskCounters(taskId) {
    if (!taskId) throw new Error('taskId required');
    if (!hasFirebase()) throw new Error('Firebase not initialized');
    const db = firebase.firestore();
    const occSnap = await db.collection('task_submissions').where('taskId', '==', taskId).get();
    let filled = 0, approved = 0;
    occSnap.forEach(d => {
      const s = String(d.data().status || '').toLowerCase();
      if (s === 'approved') { filled += 1; approved += 1; }
      else if (s === 'on review') { filled += 1; }
    });
    await db.runTransaction(async (tx) => {
      const ref = db.collection('tasks').doc(taskId);
      const snap = await tx.get(ref);
      if (!snap.exists) {
        tx.set(ref, { filledWorkers: filled, approvedWorkers: approved }, { merge: true });
      } else {
        tx.update(ref, { filledWorkers: filled, approvedWorkers: approved });
      }
    });
    return { filled, approved };
  }
  async function reconcileAllTasks() {
    if (!hasFirebase()) throw new Error('Firebase not initialized');
    const db = firebase.firestore();
    const tasksSnap = await db.collection('tasks').get();
    for (const tdoc of tasksSnap.docs) {
      await reconcileTaskCounters(tdoc.id);
    }
  }

  // ---------- Admin status handler (transactional, robust) ----------
  // submissionId: doc id of task_submissions; newStatus: 'approved' | 'rejected' | 'on review' | etc.
  async function handleSubmissionStatusChange(submissionId, newStatus) {
    if (!submissionId) throw new Error('submissionId required');
    if (typeof newStatus !== 'string') throw new Error('newStatus string required');
    if (!hasFirebase()) throw new Error('Firebase not initialized');
    const db = firebase.firestore();
    const subRef = db.collection('task_submissions').doc(submissionId);
    await db.runTransaction(async (tx) => {
      const subSnap = await tx.get(subRef);
      if (!subSnap.exists) throw new Error('Submission not found');
      const sub = subSnap.data() || {};
      const prev = (sub.status || '').toLowerCase();
      const next = newStatus.toLowerCase();
      if (prev === next) return;
      const taskId = sub.taskId;
      if (!taskId) throw new Error('Submission missing taskId');
      // Counted statuses for occupancy: 'on review' and 'approved' count as occupying
      const prevIsCounted = ['on review', 'approved'].includes(prev);
      const nextIsCounted = ['on review', 'approved'].includes(next);
      const deltaFilled = (nextIsCounted ? 1 : 0) - (prevIsCounted ? 1 : 0);
      const prevApproved = (prev === 'approved') ? 1 : 0;
      const nextApproved = (next === 'approved') ? 1 : 0;
      const deltaApproved = nextApproved - prevApproved;
      // update submission status
      tx.update(subRef, { status: newStatus });
      // update task counters
      const taskRef = db.collection('tasks').doc(taskId);
      const taskSnap = await tx.get(taskRef);
      if (!taskSnap.exists) {
        const initial = { filledWorkers: Math.max(0, deltaFilled), approvedWorkers: Math.max(0, deltaApproved) };
        tx.set(taskRef, initial, { merge: true });
      } else {
        const t = taskSnap.data() || {};
        const curFilled = Number(t.filledWorkers || 0);
        const curApproved = Number(t.approvedWorkers || 0);
        const newFilled = Math.max(0, curFilled + deltaFilled);
        const newApproved = Math.max(0, curApproved + deltaApproved);
        tx.update(taskRef, { filledWorkers: newFilled, approvedWorkers: newApproved });
      }
    });
  }

  // ---------- UI helpers ----------
  function generateProofUploadFields(count) {
    let html = "";
    for (let i = 1; i <= count; i++) {
      html += `
      <div class="mb-4">
        <label class="block text-sm font-medium text-gray-700 mb-1">Upload Proof ${i}</label>
        <input id="proof-file-${i}" type="file" accept="image/*" class="w-full p-2 border border-gray-300 rounded-lg text-sm" />
      </div>`;
    }
    return html;
  }

  // ---------- Show Task Details & Submission Flow ----------
  async function showTaskDetails(jobId, jobData) {
    try {
      if (!jobId) throw new Error('jobId missing');
      if (!jobData || typeof jobData !== 'object') {
        if (!hasFirebase()) throw new Error('jobData missing and Firebase not available to load it');
        const tdoc = await firebase.firestore().collection('tasks').doc(jobId).get();
        if (tdoc.exists) jobData = Object.assign({}, jobData || {}, tdoc.data());
      }
      if (!jobData || typeof jobData !== 'object') throw new Error('jobData missing or invalid');
    } catch (err) {
      safeError('showTaskDetails early check failed', err);
      alert('Failed to open task details: ' + (err && err.message ? err.message : err));
      return;
    }

    const fullScreen = document.createElement('div');
    fullScreen.className = "fixed inset-0 bg-white z-50 overflow-y-auto p-6";
    const proofCount = jobData.proofFileCount || 1;
    const safeTitle = escapeHtml(jobData.title || 'Untitled Task');
    const safeCategory = escapeHtml(jobData.category || '');
    const safeSub = escapeHtml(jobData.subCategory || '');
    const safeDesc = escapeHtml(jobData.description || 'No description provided');
    const safeProofText = escapeHtml(jobData.proof || 'Provide the necessary screenshot or details.');
    const screenshot = escapeHtml(jobData.screenshotURL || 'https://via.placeholder.com/400');
    fullScreen.innerHTML = `
      <div class="max-w-2xl mx-auto space-y-6">
        <button id="closeTaskBtn" class="text-blue-600 font-bold text-sm underline">← Back to Tasks</button>
        <h1 class="text-2xl font-bold text-gray-800">${safeTitle}</h1>
        <p class="text-sm text-gray-500">${safeCategory} • ${safeSub}</p>

	<div class="relative w-full h-64 bg-gray-100 rounded-xl border flex items-center justify-center overflow-hidden">
  <img 
    src="${screenshot}" 
    alt="Task Image" 
    class="max-w-full max-h-full object-contain rounded-lg"
  />
</div>

		<div>
          <h2 class="text-lg font-semibold text-gray-800 mb-2">Task Description</h2>
          <p class="text-gray-700 text-sm whitespace-pre-line">${safeDesc}</p>
        </div>
        <div>
          <h2 class="text-lg font-semibold text-gray-800 mb-2">Proof Required</h2>
          <p class="text-sm text-gray-700">${safeProofText}</p>
        </div>
        <div id="proofSection" class="mt-6">
          <h3 class="text-base font-semibold text-gray-800 mb-3">Submit Proof</h3>
          <div id="proofInputs">${generateProofUploadFields(proofCount)}</div>
          <textarea id="taskProofNote" placeholder="Optional note..." class="w-full border rounded-md p-3 mt-3 h-24"></textarea>
          <div class="mt-3">
            <button id="taskSubmitBtn" class="w-full py-3 bg-blue-600 text-white rounded-xl">Submit Proof</button>
          </div>
          <p class="text-xs text-gray-400 mt-2">Job is Running.</p>
        </div>
      </div>
    `;
    document.body.appendChild(fullScreen);
	  
    fullScreen.querySelector('#closeTaskBtn')?.addEventListener('click', () => fullScreen.remove());



    // Get authoritative counts (best-effort)
    let filled = 0, approved = 0, total = Number(jobData.numWorkers || 0);
    try {
      if (hasFirebase()) {
        const r = await reconcileTaskCounters(jobId);
        filled = r.filled; approved = r.approved;
      }
    } catch (err) { safeWarn('reconcile failed', err); }

    const submitArea = fullScreen.querySelector('#proofSection');
    // If all approved => closed and show user's submission if exists
    if (total > 0 && approved >= total) {
      submitArea.innerHTML = `<div style="padding:12px;background:#f8fafc;border-radius:12px;text-align:center"><strong>All slots fully approved. This job is closed.</strong></div>`;
      await showUserSubmissionIfExists(jobId, fullScreen);
      return;
    }
    // If slots are filled but not all approved => no new submissions allowed, but keep job visible
    if (total > 0 && filled >= total && approved < total) {
      submitArea.innerHTML = `
        <div style="padding:12px;background:#fffbeb;border-radius:12px;text-align:center">
          <strong>All slots are filled (pending reviews). You can view your submission but cannot submit new proofs right now.</strong>
        </div>
      `;
      
    }

    // Otherwise allow submit flow (or show existing submission)
    const user = await waitForAuthReady();
    if (!user) {
      const btn = fullScreen.querySelector('#taskSubmitBtn');
      if (btn) btn.onclick = () => alert('Please log in to submit proof.');
      return;
    }

    try {
      if (hasFirebase()) {
        const existingSnap = await firebase.firestore().collection('task_submissions')
          .where('taskId', '==', jobId)
          .where('userId', '==', user.uid)
          .limit(1)
          .get();
        if (!existingSnap.empty) {
          const s = existingSnap.docs[0].data();
          replaceSubmitAreaWithSubmitted(s, submitArea);
          return;
        }
      }
    } catch (err) { safeWarn('Error checking existing submission', err); }

    attachSubmitHandler(fullScreen, jobId, jobData);
  }

  // ---------- Show user's submission if exists ----------
  async function showUserSubmissionIfExists(jobId, containerEl) {
    try {
      if (!hasFirebase()) return;
      const user = firebase.auth().currentUser;
      if (!user) return;
      const snap = await firebase.firestore().collection('task_submissions')
        .where('taskId', '==', jobId)
        .where('userId', '==', user.uid)
        .limit(1)
        .get();
      if (!snap.empty) {
        const sub = snap.docs[0].data();
        replaceSubmitAreaWithSubmitted(sub, containerEl);
      }
    } catch (err) { safeWarn('showUserSubmissionIfExists error', err); }
  }

  function replaceSubmitAreaWithSubmitted(sub, containerEl) {
    const proofs = (sub.proofImages || []).map(u => `<img src="${escapeHtml(u)}" style="width:100%;max-height:220px;object-fit:contain;border-radius:8px;margin-bottom:8px">`).join('');
    const note = sub.proofText ? `<div style="margin-top:8px;color:#374151"><strong>Note:</strong> ${escapeHtml(sub.proofText)}</div>` : '';
    const status = escapeHtml(sub.status || 'on review');
    const html = `
      <div style="background:#f8fafc;padding:14px;border-radius:12px;text-align:center">
        <div style="color:#16a34a;font-weight:600;margin-bottom:6px">✅ Your submission</div>
        <div style="font-size:13px;color:#6b7280;margin-bottom:8px">Status: <strong style="color:#111827">${status}</strong></div>
        ${proofs || '<div style="color:#9ca3af;font-size:13px">No proof images</div>'}
        ${note}
      </div>
    `;
    if (containerEl) containerEl.innerHTML = html;
  }

  // ---------- Submit handler (transaction-safe) ----------
  function attachSubmitHandler(fullScreen, jobId, jobData) {
    const submitBtn = fullScreen.querySelector('#taskSubmitBtn');
    if (!submitBtn) return;
    if (submitBtn._attached) return; // avoid double attach
    submitBtn._attached = true;

    submitBtn.addEventListener('click', async () => {
      submitBtn.disabled = true;
      try {
        const user = await waitForAuthReady();
        if (!user) { alert('Please log in to submit task.'); submitBtn.disabled = false; return; }

        // Duplicate check pre
        if (hasFirebase()) {
          const pre = await firebase.firestore().collection('task_submissions')
            .where('taskId', '==', jobId)
            .where('userId', '==', user.uid)
            .limit(1)
            .get();
          if (!pre.empty) { alert('You have already submitted this task.'); submitBtn.disabled = false; return; }
        }

        const fileInputs = Array.from(fullScreen.querySelectorAll('input[type="file"]'));
        const anyFile = fileInputs.some(i => i.files && i.files[0]);
        if (!anyFile) { alert('Please upload at least one proof image.'); submitBtn.disabled = false; return; }

        // cheap pre-check slots
        let totalSlots = Number(jobData.numWorkers || 0);
        let curFilled = 0;
        if (hasFirebase()) {
          try {
            const taskRef = firebase.firestore().collection('tasks').doc(jobId);
            const taskSnap = await taskRef.get();
            totalSlots = Number(jobData.numWorkers || (taskSnap.exists ? (taskSnap.data().numWorkers || 0) : 0));
            curFilled = taskSnap.exists ? Number(taskSnap.data().filledWorkers || 0) : 0;
          } catch (e) { safeWarn('Failed reading task doc for pre-check', e); }
        }
        if (totalSlots > 0 && curFilled >= totalSlots) {
          alert('No open submission slots right now. Please check back later.');
          submitBtn.disabled = false;
          return;
        }

        // upload files (Cloudinary) -> normalize to strings
        const uploaded = [];
        for (let i = 0; i < fileInputs.length; i++) {
          const fEl = fileInputs[i];
          if (!fEl.files || !fEl.files[0]) continue;
          if (typeof uploadToCloudinary !== 'function') throw new Error('uploadToCloudinary(file) not available');
          const res = await uploadToCloudinary(fEl.files[0]);
          // normalize common Cloudinary responses and ensure string URL is stored
          let url = null;
          if (typeof res === 'string') url = res;
          else if (res && typeof res.secure_url === 'string') url = res.secure_url;
          else if (res && typeof res.url === 'string') url = res.url;
          else if (res && typeof res.data === 'string') url = res.data;
          else throw new Error('uploadToCloudinary did not return a URL string');
          uploaded.push(url);
        }

        const payload = {
          taskId: jobId,
          userId: user.uid,
          proofImages: uploaded,
          proofText: (fullScreen.querySelector('#taskProofNote')?.value || '').trim(),
          status: 'on review',
          workerEarn: jobData.workerEarn || 0
        };

        if (!hasFirebase()) throw new Error('Firebase not initialized');
        const db = firebase.firestore();
        const submissionsCol = db.collection('task_submissions');
        const newSubRef = submissionsCol.doc();

        // transaction: create submission + bump counters
        await db.runTransaction(async (tx) => {
          const taskRef = db.collection('tasks').doc(jobId);
          const tSnap = await tx.get(taskRef);
          const tData = tSnap.exists ? (tSnap.data() || {}) : {};
          const curFilledTx = Number(tData.filledWorkers || 0);
          const totalSlotsTx = Number(jobData.numWorkers || (tData.numWorkers || 0)) || 0;

          // race-safe check
          if (totalSlotsTx > 0 && curFilledTx >= totalSlotsTx) {
            throw new Error('NO_SLOTS');
          }

          // create submission doc
          const toWrite = Object.assign({}, payload, {
            submittedAt: firebase.firestore.FieldValue.serverTimestamp()
          });
          tx.set(newSubRef, toWrite);

          if (!tSnap.exists) {
            const init = { filledWorkers: 1, approvedWorkers: 0 };
            if (jobData.numWorkers != null) init.numWorkers = Number(jobData.numWorkers);
            tx.set(taskRef, init, { merge: true });
          } else {
            const newFilled = Math.max(0, curFilledTx + 1);
            const curApproved = Number(tData.approvedWorkers || 0);
            tx.update(taskRef, { filledWorkers: newFilled, approvedWorkers: curApproved });
          }
        });

        // reconcile as best-effort
        try { await reconcileTaskCounters(jobId); } catch (e) { safeWarn('reconcile after submit failed', e); }

        // update finished tasks cache for UI
        window.finishedTasksCache = window.finishedTasksCache || [];
        const localCopy = Object.assign({}, payload, { id: newSubRef.id, submittedAt: new Date() });
        window.finishedTasksCache.unshift(localCopy);

        alert('✅ Task submitted for review!');
        fullScreen.remove();
      } catch (err) {
        safeError('Submit error', err);
        if (err && err.message === 'NO_SLOTS') {
          alert('Sorry — by the time you tried to submit the slots were taken. Please check later.');
        } else if (err && err.message === 'ALREADY_SUBMITTED') {
          alert('You have already submitted this task.');
        } else {
          alert('❗ Failed to submit task: ' + (err && err.message ? err.message : String(err)));
        }
        submitBtn.disabled = false;
      }
    });
  }




   function getCategoryLogo(category = '') {
  const c = category.toLowerCase();

  // Messaging
  if (c.includes('whatsapp'))
    return 'https://upload.wikimedia.org/wikipedia/commons/6/6b/WhatsApp.svg';

  if (c.includes('telegram'))
    return 'https://upload.wikimedia.org/wikipedia/commons/8/82/Telegram_logo.svg';

  // Social Media
  if (c.includes('instagram'))
    return 'https://upload.wikimedia.org/wikipedia/commons/e/e7/Instagram_logo_2016.svg';

  if (c.includes('tiktok'))
    return 'https://upload.wikimedia.org/wikipedia/commons/a/a9/TikTok_logo.svg';

  if (c.includes('facebook'))
    return 'https://upload.wikimedia.org/wikipedia/commons/1/1b/Facebook_icon.svg';

  if (c.includes('twitter') || c.includes('x'))
    return 'https://upload.wikimedia.org/wikipedia/commons/5/53/X_logo_2023.svg';

  if (c.includes('youtube'))
    return 'https://upload.wikimedia.org/wikipedia/commons/b/b8/YouTube_Logo_2017.svg';

  // Platforms / Web
  if (c.includes('website'))
    return 'https://upload.wikimedia.org/wikipedia/commons/8/87/Google_Chrome_icon_%282011%29.png';

  if (c.includes('app'))
    return 'https://upload.wikimedia.org/wikipedia/commons/d/d7/Android_robot.svg';

  // Engagement / Actions
  if (c.includes('vote'))
    return 'https://cdn-icons-png.flaticon.com/512/2910/2910791.png';

  // Music
  if (c.includes('music'))
    return 'https://upload.wikimedia.org/wikipedia/commons/8/84/Spotify_icon.svg';

  // Default fallback
  return 'https://cdn-icons-png.flaticon.com/512/841/841364.png';
}
	
  // ---------- Task card renderer ----------
  function createTaskCard(jobId, jobData) {
  try {
    const taskContainer = el('task-jobs');
    if (!taskContainer) return;

    const total = Number(jobData.numWorkers || 0);

    const card = document.createElement('div');
    card.className =
      "flex items-center gap-3 p-3 rounded-xl border border-gray-200 bg-white shadow-sm hover:shadow-md transition mb-3";
    card.dataset.jobId = jobId;
    card.dataset.total = String(total);

    // Logo (category-based)
    const logoWrap = document.createElement('div');
    logoWrap.className =
      "w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center";

    const logo = document.createElement('img');
    logo.src = getCategoryLogo(jobData.category);
    logo.className = "w-6 h-6 object-contain";
    logo.alt = jobData.category || "Task";

    logoWrap.appendChild(logo);

    // Content
    const content = document.createElement('div');
    content.className = "flex-1";

    const title = document.createElement('h2');
    title.textContent = jobData.title || "Untitled Task";
    title.className = "text-sm font-semibold text-gray-800 leading-tight";

    const meta = document.createElement('div');
    meta.className = "flex items-center gap-2 mt-1";

    const category = document.createElement('span');
    category.textContent = jobData.category || "Social Task";
    category.className =
      "text-[10px] px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 font-medium";

    const earn = document.createElement('span');
    earn.textContent = `₦${jobData.workerEarn || 0}`;
    earn.className = "text-xs font-semibold text-green-600";

    meta.appendChild(category);
    meta.appendChild(earn);

    const rate = document.createElement('p');
    rate.className = "text-[11px] text-gray-500 mt-1";
    rate.textContent = "Progress: loading...";

    // Button
    const button = document.createElement('button');
    button.textContent = "View";
    button.className =
      "text-xs px-3 py-1.5 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition";

    button.addEventListener('click', async (e) => {
      e.preventDefault();
      try {
        await showTaskDetails(jobId, jobData);
      } catch (err) {
        safeError('Failed to open task', err);
        alert('Failed to open task');
      }
    });

    // Progress logic
    (async () => {
      try {
        if (!hasFirebase()) {
          rate.textContent = `Progress: ? / ${total}`;
          return;
        }

        await reconcileTaskCounters(jobId).catch(() => null);
        const tdoc = await firebase.firestore()
          .collection('tasks')
          .doc(jobId)
          .get();

        if (!tdoc.exists) return;

        const td = tdoc.data() || {};
        const filled = Number(td.filledWorkers || 0);
        const approved = Number(td.approvedWorkers || 0);

        rate.textContent = `Progress: ${filled}/${total} • Approved ${approved}`;

        if (total > 0 && approved >= total) {
          card.remove();
        }
      } catch {
        rate.textContent = `Progress: 0 / ${total}`;
      }
    })();

    content.appendChild(title);
    content.appendChild(meta);
    content.appendChild(rate);

    card.appendChild(logoWrap);
    card.appendChild(content);
    card.appendChild(button);

    taskContainer.appendChild(card);

  } catch (err) {
    safeWarn('createTaskCard error', err);
  }
}
	
  // ---------- Fetch tasks once (safe) ----------
  async function fetchTasksOnce() {
    try {
      const taskContainer = el('task-jobs');
      if (!taskContainer) return;
      const searchInput = el('taskSearch');
      const filterSelect = el('taskCategoryFilter');
      taskContainer.innerHTML = `<p class="p-4 text-gray-400 text-sm">Loading tasks...</p>`;
      if (!hasFirebase()) { taskContainer.innerHTML = `<p class="p-4 text-gray-400 text-sm">Firebase not initialized.</p>`; return; }
      const snap = await firebase.firestore().collection('tasks').where('status', '==', 'approved').get();
      const tasks = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      taskContainer.innerHTML = "";
      function renderTasks() {
        const keyword = (searchInput && searchInput.value) ? searchInput.value.toLowerCase() : "";
        const selectedCategory = (filterSelect && filterSelect.value) ? filterSelect.value.toLowerCase() : "";
        taskContainer.innerHTML = "";
        tasks
          .filter(task => {
            const taskCategory = (task.category || "").toLowerCase();
            const matchesCategory = selectedCategory === "" || taskCategory === selectedCategory;
            const matchesSearch = (task.title || "").toLowerCase().includes(keyword);
            return matchesCategory && matchesSearch;
          })
          .forEach(task => createTaskCard(task.id, task));
      }
      if (searchInput) searchInput.addEventListener("input", renderTasks);
      if (filterSelect) filterSelect.addEventListener("change", renderTasks);
      renderTasks();
    } catch (err) { safeError("Failed to fetch tasks:", err); const taskContainer = el("task-jobs"); if (taskContainer) { taskContainer.innerHTML = `<p class="p-4 text-red-500 text-sm">Failed to load tasks. Please reload.</p>`; } }
  }

  // ---------- Finished tasks UI (user) ----------
  window.finishedTasksCache = window.finishedTasksCache || [];
  async function initFinishedTasksSectionUser() {
    try {
      const btnOpen = el("finishedTaskBtnUser");
      const btnBack = el("backToMainBtnUser");
      if (btnOpen) {
        btnOpen.addEventListener("click", () => {
          el("taskSection")?.classList.add("hidden");
          el("finishedTasksScreenUser")?.classList.remove("hidden");
          renderFinishedTasksUser();
        });
      }
      if (btnBack) {
        btnBack.addEventListener("click", () => {
          el("finishedTasksScreenUser")?.classList.add("hidden");
          el("taskSection")?.classList.remove("hidden");
        });
      }
      if (hasFirebase()) {
        firebase.auth().onAuthStateChanged(async user => {
          if (!user) return;
          await fetchFinishedTasksOnce(user.uid);
        });
      }
    } catch (err) { safeWarn('initFinishedTasksSectionUser error', err); }
  }

  async function fetchFinishedTasksOnce(uid) {
    try {
      const listEl = el("finishedTasksListUser");
      const pendingCountEl = el("pendingCountUser");
      const approvedCountEl = el("approvedCountUser");
      if (!uid || !hasFirebase() || !listEl) return;
      listEl.innerHTML = `<p class="text-center text-gray-500">Loading...</p>`;
      const snap = await firebase.firestore().collection("task_submissions").where("userId", "==", uid).get();
      window.finishedTasksCache = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      window.finishedTasksCache.sort((a, b) => {
        const t1 = a.submittedAt?.toDate?.() || new Date(0);
        const t2 = b.submittedAt?.toDate?.() || new Date(0);
        return t2 - t1;
      });
      const taskIds = [...new Set(window.finishedTasksCache.map(s => s.taskId).filter(Boolean))];
      await Promise.all(taskIds.map(id => reconcileTaskCounters(id).catch(() => null)));
      renderFinishedTasksUser();
      let pending = window.finishedTasksCache.filter(d => (d.status || '').toLowerCase() === "on review").length;
      let approved = window.finishedTasksCache.filter(d => (d.status || '').toLowerCase() === "approved").length;
      if (pendingCountEl) pendingCountEl.textContent = pending;
      if (approvedCountEl) approvedCountEl.textContent = approved;
    } catch (err) { safeError("Error fetching finished tasks:", err); const listEl = el("finishedTasksListUser"); if (listEl) listEl.innerHTML = `<p class="text-center text-red-500">Failed to load tasks. Reload page.</p>`; }
  }

  function renderFinishedTasksUser() {
    const listEl = el("finishedTasksListUser");
    const pendingCountEl = el("pendingCountUser");
    const approvedCountEl = el("approvedCountUser");
    if (!listEl) return;
    listEl.innerHTML = "";
    if (!window.finishedTasksCache.length) {
      listEl.innerHTML = `<p class="text-center text-gray-500">No finished tasks yet.</p>`;
      if (pendingCountEl) pendingCountEl.textContent = "0";
      if (approvedCountEl) approvedCountEl.textContent = "0";
      return;
    }
    let pending = 0, approved = 0;
    for (const data of window.finishedTasksCache) {
      const statusKey = (data.status || '').toLowerCase();
      if (statusKey === "on review") pending++;
      if (statusKey === "approved") approved++;
      const jobTitle = data.cachedTitle || data.taskTitle || "Loading...";
      const card = document.createElement("div");
      card.className = "p-4 bg-white shadow rounded-xl flex items-center justify-between mb-3";
      card.innerHTML = `
        <div>
          <h3 class="font-semibold text-gray-900">${escapeHtml(jobTitle)}</h3>
          <p class="text-sm text-gray-600">Earn: ₦${data.workerEarn || 0}</p>
          <p class="text-xs text-gray-400">${data.submittedAt?.toDate?.().toLocaleString() || ""}</p>
          <span class="inline-block mt-1 px-2 py-0.5 text-xs rounded ${
            (statusKey === "approved")
              ? "bg-green-100 text-green-700"
              : (statusKey === "rejected")
                ? "bg-red-100 text-red-700"
                : "bg-yellow-100 text-yellow-700"
          }">${escapeHtml(data.status)}</span>
        </div>
        <button
          class="px-3 py-1 text-sm font-medium bg-blue-600 text-white rounded-lg details-btn-user"
          data-id="${escapeHtml(data.id)}"
        >Details</button>
      `;
      listEl.appendChild(card);
    }
    if (pendingCountEl) pendingCountEl.textContent = pending;
    if (approvedCountEl) approvedCountEl.textContent = approved;
    listEl.querySelectorAll(".details-btn-user").forEach(btn => {
      btn.addEventListener("click", () => showTaskSubmissionDetailsUser(btn.dataset.id));
    });
    preloadTaskTitles();
  }

  async function preloadTaskTitles() {
    try {
      const ids = [...new Set(window.finishedTasksCache.map(t => t.taskId).filter(Boolean))];
      if (!ids.length || !hasFirebase()) return;
      for (let i = 0; i < ids.length; i += 10) {
        const slice = ids.slice(i, i + 10);
        const snap = await firebase.firestore().collection('tasks').where(firebase.firestore.FieldPath.documentId(), "in", slice).get();
        for (const d of snap.docs) {
          const task = { id: d.id, ...d.data() };
          window.finishedTasksCache.forEach(sub => { if (sub.taskId === task.id) sub.cachedTitle = task.title || 'Untitled Task'; });
        }
      }
      try { renderFinishedTasksUser(); } catch (_) { }
    } catch (err) { safeWarn('preloadTaskTitles error', err); }
  }

  async function showTaskSubmissionDetailsUser(submissionId) {
    const sub = window.finishedTasksCache.find(d => d.id === submissionId);
    if (!sub) return alert("Submission not found in memory. Reload page.");
    const title = sub.cachedTitle || "Untitled Task";
    const modal = document.createElement("div");
    modal.className = "fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50";
    modal.innerHTML = `
      <div class="bg-white rounded-xl shadow-lg p-6 w-96 max-h-[90vh] overflow-y-auto relative">
        <h2 class="text-lg font-bold mb-3">Submission Details</h2>
        <p class="text-sm"><strong>Job Title:</strong> ${escapeHtml(title)}</p>
        <p class="text-sm"><strong>Status:</strong> ${escapeHtml(sub.status)}</p>
        <p class="text-sm"><strong>Earned:</strong> ₦${sub.workerEarn || 0}</p>
        <p class="text-sm"><strong>Submitted At:</strong> ${sub.submittedAt?.toDate?.().toLocaleString() || "—"}</p>
        <p class="text-sm"><strong>Extra Proof:</strong> ${escapeHtml(sub.extraProof || "—")}</p>
        ${(sub.proofImages || []).map(url => `
          <div class="mt-3">
            <p class="text-sm font-medium text-gray-700 mb-1">Uploaded Proof:</p>
            <img src="${escapeHtml(url)}" alt="Proof" class="rounded-lg border w-full max-h-60 object-contain mb-2" />
          </div>
        `).join("")}
        <div class="mt-4 flex justify-end sticky bottom-0 bg-white pt-3">
          <button class="closeModalUser px-4 py-2 bg-blue-600 text-white rounded-lg shadow hover:bg-blue-700">Close</button>
        </div>
      </div>
    `;
    document.body.appendChild(modal);
    modal.querySelector(".closeModalUser").addEventListener("click", () => modal.remove());
  }

  // ---------- Expose small API + start init ----------
  window.TaskProgress = window.TaskProgress || {};
  window.TaskProgress.increaseTaskOccupancy = increaseTaskOccupancy;
  window.TaskProgress.decreaseTaskOccupancy = decreaseTaskOccupancy;
  window.TaskProgress.changeTaskApprovedCount = changeTaskApprovedCount;
  window.TaskProgress.handleSubmissionStatusChange = handleSubmissionStatusChange;
  window.TaskProgress.reconcileTaskCounters = reconcileTaskCounters;
  window.TaskProgress.reconcileAllTasks = reconcileAllTasks;
  window.TaskProgress.startAutoReconcile = function(taskId, ms = 60_000) {
    if (!taskId) throw new Error('taskId required');
    const iid = setInterval(() => reconcileTaskCounters(taskId).catch(() => null), ms);
    return () => clearInterval(iid);
  };

  // ---------- Initial UI bindings (non-blocking) ----------
  (async () => {
    const firebaseReady = await waitForReady(4000);
    if (!firebaseReady) safeWarn('Firebase not detected or slow to initialize — module will still run but Firestore features disabled until firebase loads.');
    try {
      // Initialize finished tasks UI handlers
      initFinishedTasksSectionUser();
      // Load task cards if the placeholder container exists
      fetchTasksOnce().catch(e => safeWarn('fetchTasksOnce failed', e));
    } catch (err) { safeWarn('module init failed', err); }
  })();
}

// end initTaskSectionModule

// -------------------------
// Public initializer
// -------------------------
window.initTaskSection = function() {
  // idempotent
  if (window.__TASK_SECTION_INITIALIZED__) {
    try { console.log('[TASK] initTaskSection called — already initialized'); } catch (_) { }
    return;
  }
  try { initTaskSectionModule(); } catch (e) { console.error('[TASK] initTaskSection error', e); }
};

// Optional: auto-run if you want (commented by default)
// window.initTaskSection();






document.addEventListener("DOMContentLoaded", () => {
  if (window.initTaskSection) {
    window.initTaskSection();
  } else {
    console.error("initTaskSection not found");
  }
});


