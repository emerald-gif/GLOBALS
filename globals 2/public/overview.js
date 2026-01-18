
                                                                 //OVERVIEW SECTION (ME SECTION) FUNCTION


/* ========== Overview (upgraded, hooked to your transactionsCache & user doc) ========== */

/* ======= Overview (Realtime KPIs + Success Rate) =======
   Replace old Overview/chart code with this block.
   Relies on collections: users, affiliateJobs, tasks,
   task_submissions, affiliate_submissions, TiktokInstagram, Whatsapp, Telegram.
================================================================= */
(function () {
  if (!window.firebase) {
    console.warn('Overview: Firebase not ready');
    return;
  }
  const db = firebase.firestore();

  // DOM helpers
  const $ = id => document.getElementById(id);
  const fmtNaira = (n) => {
    try { if (typeof window.fmtNaira === 'function') return window.fmtNaira(n); } catch (e) {}
    const v = Number(n || 0);
    return '₦' + v.toLocaleString();
  };
  const setText = (id, txt) => { const el = $(id); if (el) el.innerText = txt; };

  // state & unsub map
  const unsubs = {};
  let currentUserUid = null;
  let currentUsername = null;
  let currentIsPremium = false;

  // social task prices (as you specified)
  const SOCIAL_PRICES = { tiktok: 2000, whatsapp: 300, telegram: 300 };

  // helper to unsubscribe safely
  function safeUnsub(key) {
    try { if (unsubs[key]) { unsubs[key](); } } catch (e) {}
    unsubs[key] = null;
  }

  // main recompute (updates success ui)
  function updateSuccessUI(state) {
  const approvedCount = state.approvedSubmissionsCount || 0;
  const isPremium = !!state.isPremium;
  const social = state.social || { tiktok: 0, whatsapp: 0, telegram: 0 };

  const condA = approvedCount >= 200;
  const condB = isPremium;
  const condC = (social.tiktok >= 1 && social.whatsapp >= 1 && social.telegram >= 1);

  const met = (condA?1:0) + (condB?1:0) + (condC?1:0);
  const percent = Math.round((met / 3) * 100);

  // update circle
  const ring = document.getElementById('successRing');
  if (ring) {
    const dash = Math.max(0, Math.min(100, percent)) / 100 * 94;
    ring.setAttribute('stroke-dasharray', `${dash} 100`);
  }
  const sp = document.getElementById('successPercent');
  if (sp) sp.innerText = `${percent}%`;
}

  // utility: small animator for numeric KPIs (lightweight)
  function animateKPI(el, newVal, opts = {}) {
    if (!el) return;
    const duration = opts.duration || 400;
    const start = Number(el.dataset._num || el.innerText.replace(/[₦,\s]/g,'') || 0);
    const end = Number(newVal || 0);
    el.dataset._num = start;
    const t0 = performance.now();
    function step(t) {
      const p = Math.min(1, (t - t0) / duration);
      const cur = Math.round(start + (end - start) * p);
      el.dataset._num = cur;
      el.innerText = opts.currency ? fmtNaira(cur) : cur.toLocaleString();
      if (p < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }

  // update all KPI DOM fields from aggregated counters
  function renderKPIs(agg) {
    // agg keys: balance, jobsTotal, jobsApproved, jobsRejected, jobsOnreview
    // tasksTotal, tasksApproved, tasksRejected, tasksOnreview
    // referralsTotal, referralsPremium
    // social counts + paid
    // approvedSubmissionsCount (for success)
    agg = agg || {};

    // Balance
    const balEl = $('kpiBalance');
    if (balEl) {
      animateKPI(balEl, agg.balance || 0, { currency: true, duration: 700 });
    }

    // Jobs
    setText('kpiJobsTotal', (agg.jobsTotal || 0).toLocaleString());
    setText('kpiJobsApproved', (agg.jobsApproved || 0).toLocaleString());
    setText('kpiJobsRejected', (agg.jobsRejected || 0).toLocaleString());
    setText('kpiJobsOnreview', (agg.jobsOnreview || 0).toLocaleString());

    // Tasks
    setText('kpiTasksTotal', (agg.tasksTotal || 0).toLocaleString());
    setText('kpiTasksApproved', (agg.tasksApproved || 0).toLocaleString());
    setText('kpiTasksRejected', (agg.tasksRejected || 0).toLocaleString());
    setText('kpiTasksOnreview', (agg.tasksOnreview || 0).toLocaleString());

    // Referrals
    setText('kpiReferralsTotal', (agg.referralsTotal || 0).toLocaleString());
    setText('kpiReferralsTotalSmall', (agg.referralsTotal || 0).toLocaleString());
    setText('kpiReferralsPremium', (agg.referralsPremium || 0).toLocaleString());

    // Social tasks
    setText('socialTiktokCount', (agg.socialTiktok || 0).toLocaleString());
    setText('socialWhatsappCount', (agg.socialWhatsapp || 0).toLocaleString());
    setText('socialTelegramCount', (agg.socialTelegram || 0).toLocaleString());

    setText('socialTiktokPaid', fmtNaira((agg.socialTiktok || 0) * SOCIAL_PRICES.tiktok));
    setText('socialWhatsappPaid', fmtNaira((agg.socialWhatsapp || 0) * SOCIAL_PRICES.whatsapp));
    setText('socialTelegramPaid', fmtNaira((agg.socialTelegram || 0) * SOCIAL_PRICES.telegram));

    setText('socialTotalPaid', fmtNaira(((agg.socialTiktok || 0) * SOCIAL_PRICES.tiktok) + ((agg.socialWhatsapp || 0) * SOCIAL_PRICES.whatsapp) + ((agg.socialTelegram || 0) * SOCIAL_PRICES.telegram)));

    // success
    updateSuccessUI({
      approvedSubmissionsCount: agg.tasksApproved || 0,
      isPremium: agg.isPremium || false,
      social: { tiktok: agg.socialTiktok || 0, whatsapp: agg.socialWhatsapp || 0, telegram: agg.socialTelegram || 0 }
    });
  }

  // state aggregator
  const AGG = {
    balance: 0,
    jobsTotal: 0, jobsApproved: 0, jobsRejected: 0, jobsOnreview: 0,
    tasksTotal: 0, tasksApproved: 0, tasksRejected: 0, tasksOnreview: 0,
    referralsTotal: 0, referralsPremium: 0,
    socialTiktok: 0, socialWhatsapp: 0, socialTelegram: 0,
    isPremium: false
  };

  // ---------- LISTENERS per collection ----------
  function attachUserDocListener(uid) {
    safeUnsub('userDoc');
    try {
      const ref = db.collection('users').doc(uid);
      unsubs.userDoc = ref.onSnapshot(doc => {
        if (!doc.exists) return;
        const d = doc.data() || {};
        AGG.balance = Number(d.balance || 0);
        AGG.isPremium = !!d.is_Premium;
        currentIsPremium = AGG.isPremium;

        // username used to find referrals (if available)
        const newUsername = d.username || d.name || null;
        if (newUsername && newUsername !== currentUsername) {
          currentUsername = newUsername;
          attachReferralsListener(newUsername);
        } else if (!newUsername) {
          // fallback: check users where referrer == uid too (someone might have stored uid instead)
          attachReferralsListenerFallback(uid);
        }

        renderKPIs(AGG);
      }, err => console.warn('userDoc onSnapshot err', err));
    } catch (e) { console.warn('attachUserDocListener failed', e); }
  }

  function attachReferralsListener(username) {
    safeUnsub('referrals');
    if (!username) return;
    try {
      const q = db.collection('users').where('referrer', '==', username);
      unsubs.referrals = q.onSnapshot(snap => {
        AGG.referralsTotal = snap.size || 0;
        AGG.referralsPremium = snap.docs.filter(d => !!d.data().is_Premium).length;
        renderKPIs(AGG);
      }, err => console.warn('referrals listener err', err));
    } catch (e) { console.warn('attachReferralsListener err', e); }
  }

  // fallback: users who set referrer == uid (rare, but safe)
  function attachReferralsListenerFallback(uid) {
    safeUnsub('referrals');
    try {
      const q = db.collection('users').where('referrer', '==', uid);
      unsubs.referrals = q.onSnapshot(snap => {
        AGG.referralsTotal = snap.size || 0;
        AGG.referralsPremium = snap.docs.filter(d => !!d.data().is_Premium).length;
        renderKPIs(AGG);
      }, err => console.warn('referrals fallback err', err));
    } catch (e) { console.warn('attachReferralsListenerFallback err', e); }
  }

  // jobs posted by user (affiliateJobs + tasks)
  function attachJobsListeners(uid) {
    safeUnsub('affJobs'); safeUnsub('taskJobs');
    try {
      unsubs.affJobs = db.collection('affiliateJobs').where('postedBy.uid', '==', uid).onSnapshot(snap => {
        const docs = snap.docs.map(d => d.data() || {});
        const approved = docs.filter(d => (d.status || '').toLowerCase() === 'approved').length;
        const rejected = docs.filter(d => (d.status || '').toLowerCase() === 'rejected').length;
        const onreview = snap.size - approved - rejected;
        AGG.jobsApproved_aff = approved;
        AGG.jobsRejected_aff = rejected;
        AGG.jobsOnreview_aff = onreview;
        recomputeJobsTotals();
      }, err => console.warn('affiliateJobs listener', err));
    } catch (e) { console.warn('attach affJobs err', e); }

    try {
      unsubs.taskJobs = db.collection('tasks').where('postedBy.uid', '==', uid).onSnapshot(snap => {
        const docs = snap.docs.map(d => d.data() || {});
        const approved = docs.filter(d => (d.status || '').toLowerCase() === 'approved').length;
        const rejected = docs.filter(d => (d.status || '').toLowerCase() === 'rejected').length;
        const onreview = snap.size - approved - rejected;
        AGG.jobsApproved_task = approved;
        AGG.jobsRejected_task = rejected;
        AGG.jobsOnreview_task = onreview;
        recomputeJobsTotals();
      }, err => console.warn('tasks (posted) listener', err));
    } catch (e) { console.warn('attach taskJobs err', e); }
  }

  function recomputeJobsTotals() {
    const affTotal = (AGG.jobsApproved_aff || 0) + (AGG.jobsRejected_aff || 0) + (AGG.jobsOnreview_aff || 0);
    const taskTotal = (AGG.jobsApproved_task || 0) + (AGG.jobsRejected_task || 0) + (AGG.jobsOnreview_task || 0);
    AGG.jobsTotal = affTotal + taskTotal;
    AGG.jobsApproved = (AGG.jobsApproved_aff || 0) + (AGG.jobsApproved_task || 0);
    AGG.jobsRejected = (AGG.jobsRejected_aff || 0) + (AGG.jobsRejected_task || 0);
    AGG.jobsOnreview = (AGG.jobsOnreview_aff || 0) + (AGG.jobsOnreview_task || 0);
    renderKPIs(AGG);
  }

  // task submissions by user (task_submissions + affiliate_submissions)
  function attachTaskSubmissionListeners(uid) {
    safeUnsub('taskSub'); safeUnsub('affSub');

    try {
      unsubs.taskSub = db.collection('task_submissions').where('userId', '==', uid).onSnapshot(snap => {
        const docs = snap.docs.map(d => d.data() || {});
        const approved = docs.filter(d => (d.status || '').toLowerCase() === 'approved').length;
        const rejected = docs.filter(d => (d.status || '').toLowerCase() === 'rejected').length;
        const onreview = snap.size - approved - rejected;
        AGG.tasks_task_sub_total = snap.size;
        AGG.tasks_task_sub_approved = approved;
        AGG.tasks_task_sub_rejected = rejected;
        AGG.tasks_task_sub_onreview = onreview;
        recomputeTasksTotals();
      }, err => console.warn('task_submissions listener', err));
    } catch (e) { console.warn('attach task_sub err', e); }

    try {
      unsubs.affSub = db.collection('affiliate_submissions').where('userId', '==', uid).onSnapshot(snap => {
        const docs = snap.docs.map(d => d.data() || {});
        const approved = docs.filter(d => (d.status || '').toLowerCase() === 'approved').length;
        const rejected = docs.filter(d => (d.status || '').toLowerCase() === 'rejected').length;
        const onreview = snap.size - approved - rejected;
        AGG.tasks_aff_sub_total = snap.size;
        AGG.tasks_aff_sub_approved = approved;
        AGG.tasks_aff_sub_rejected = rejected;
        AGG.tasks_aff_sub_onreview = onreview;
        recomputeTasksTotals();
      }, err => console.warn('affiliate_submissions listener', err));
    } catch (e) { console.warn('attach affiliate_sub err', e); }
  }

  function recomputeTasksTotals() {
    AGG.tasksTotal = (AGG.tasks_task_sub_total || 0) + (AGG.tasks_aff_sub_total || 0);
    AGG.tasksApproved = (AGG.tasks_task_sub_approved || 0) + (AGG.tasks_aff_sub_approved || 0);
    AGG.tasksRejected = (AGG.tasks_task_sub_rejected || 0) + (AGG.tasks_aff_sub_rejected || 0);
    AGG.tasksOnreview = (AGG.tasks_task_sub_onreview || 0) + (AGG.tasks_aff_sub_onreview || 0);
    renderKPIs(AGG);
  }

  // Social tasks — these are saved per-user with doc id = uid in your code
  function attachSocialListeners(uid) {
    safeUnsub('tiktokDoc'); safeUnsub('whatsappDoc'); safeUnsub('telegramDoc');

    try {
      unsubs.tiktokDoc = db.collection('TiktokInstagram').doc(uid).onSnapshot(doc => {
        AGG.socialTiktok = (doc.exists && (doc.data().status || '').toLowerCase() === 'approved') ? 1 : 0;
        renderKPIs(AGG);
      }, err => console.warn('TiktokInstagram onSnapshot', err));
    } catch (e) { console.warn('attach tiktok err', e); }

    try {
      unsubs.whatsappDoc = db.collection('Whatsapp').doc(uid).onSnapshot(doc => {
        AGG.socialWhatsapp = (doc.exists && (doc.data().status || '').toLowerCase() === 'approved') ? 1 : 0;
        renderKPIs(AGG);
      }, err => console.warn('Whatsapp onSnapshot', err));
    } catch (e) { console.warn('attach whatsapp err', e); }

    try {
      unsubs.telegramDoc = db.collection('Telegram').doc(uid).onSnapshot(doc => {
        AGG.socialTelegram = (doc.exists && (doc.data().status || '').toLowerCase() === 'approved') ? 1 : 0;
        renderKPIs(AGG);
      }, err => console.warn('Telegram onSnapshot', err));
    } catch (e) { console.warn('attach telegram err', e); }
  }

  // call this to detach everything (on sign-out)
  function detachAll() {
    ['userDoc','referrals','affJobs','taskJobs','taskSub','affSub','tiktokDoc','whatsappDoc','telegramDoc'].forEach(k => safeUnsub(k));
  }

  // Auth hook: start listeners when user signs in
  firebase.auth().onAuthStateChanged(user => {
    if (!user) {
      detachAll();
      currentUserUid = null;
      currentUsername = null;
      // reset UI to zeros
      renderKPIs({
        balance: 0, jobsTotal:0, jobsApproved:0, jobsRejected:0, jobsOnreview:0,
        tasksTotal:0, tasksApproved:0, tasksRejected:0, tasksOnreview:0,
        referralsTotal:0, referralsPremium:0,
        socialTiktok:0, socialWhatsapp:0, socialTelegram:0,
        isPremium:false
      });
      return;
    }

    currentUserUid = user.uid;
    // attach user doc listener which will trigger referrals setting once username resolved
    attachUserDocListener(user.uid);

    // attach jobs listeners
    attachJobsListeners(user.uid);

    // attach task submission listeners
    attachTaskSubmissionListeners(user.uid);

    // attach social doc listeners
    attachSocialListeners(user.uid);
  });

  // manual refresh button (re-reads caches by re-attaching listeners quickly)
  const refreshBtn = $('overviewRefreshBtn');
  if (refreshBtn) refreshBtn.addEventListener('click', () => {
    if (!currentUserUid) return;
    // simply reattach listeners to force a fresh snapshot read
    attachUserDocListener(currentUserUid);
    attachJobsListeners(currentUserUid);
    attachTaskSubmissionListeners(currentUserUid);
    attachSocialListeners(currentUserUid);
  });

  // initial render (in case DOM ready)
  renderKPIs(AGG);
})();
