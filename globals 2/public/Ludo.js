/**
 * GLOBALS LUDO — Game Engine v3.0
 * All fixes: balance, board size, username titles, timer bar,
 * room logic, calm status, challenge language, chat, loader
 */
'use strict';

const COLS      = 15;
const TURN_TIME = 10;

// Main path (52 cells)
const MAIN_PATH = [
  [6,1],[6,2],[6,3],[6,4],[6,5],[5,6],[4,6],[3,6],[2,6],[1,6],
  [0,6],[0,7],[0,8],[1,8],[2,8],[3,8],[4,8],[5,8],[6,9],[6,10],
  [6,11],[6,12],[6,13],[6,14],[7,14],[8,14],[8,13],[8,12],[8,11],[8,10],
  [8,9],[9,8],[10,8],[11,8],[12,8],[13,8],[14,8],[14,7],[14,6],[13,6],
  [12,6],[11,6],[10,6],[9,6],[8,5],[8,4],[8,3],[8,2],[8,1],[8,0],
  [7,0],[6,0]
];

const HOME_STRETCH = {
  red:    [[7,1],[7,2],[7,3],[7,4],[7,5]],
  green:  [[1,7],[2,7],[3,7],[4,7],[5,7]],
  yellow: [[7,13],[7,12],[7,11],[7,10],[7,9]],
  blue:   [[13,7],[12,7],[11,7],[10,7],[9,7]]
};

const ENTRY_IDX = { red:0, green:13, yellow:26, blue:39 };

const HOME_BASE = {
  red:    [[1.5,1.5],[1.5,3.5],[3.5,1.5],[3.5,3.5]],
  green:  [[1.5,10.5],[1.5,12.5],[3.5,10.5],[3.5,12.5]],
  yellow: [[10.5,10.5],[10.5,12.5],[12.5,10.5],[12.5,12.5]],
  blue:   [[10.5,1.5],[10.5,3.5],[12.5,1.5],[12.5,3.5]]
};

const SAFE_ABS = new Set([0,8,13,21,26,34,39,47]);

const CLR = {
  red:    { fill:'#e53935', light:'#ffcdd2', dark:'#b71c1c', label:'Red',    bg:'#ffebee' },
  green:  { fill:'#43a047', light:'#c8e6c9', dark:'#1b5e20', label:'Green',  bg:'#e8f5e9' },
  yellow: { fill:'#f9a825', light:'#fff9c4', dark:'#e65100', label:'Yellow', bg:'#fffde7' },
  blue:   { fill:'#1e88e5', light:'#bbdefb', dark:'#0d47a1', label:'Blue',   bg:'#e3f2fd' }
};

// ════════════════════════════════
//  STATE
// ════════════════════════════════
let currentUser  = null;
let userBalance  = 0;
let username     = 'Player';
let settings     = { sound:true, music:false, anim:true };
let unsubBalance = null;
let GS           = {};
let roomListener  = null;
let matchListener = null;
let audioCtx      = null;
let bgMusicInterval = null;
let bgBeat        = 0;
let animLoop      = null;
let animPulse     = 0;

// ════════════════════════════════
//  INIT
// ════════════════════════════════
window.addEventListener('DOMContentLoaded', () => {
  loadSettings();
  animateLoadingBoard();
  startLoading();
  checkNetwork();
  setupNetworkDetection();
  setupUI();
  setupCodeInput();
  setupPageVisibility();
});

function startLoading() {
  const fill = document.getElementById('progressFill');
  const pct  = document.getElementById('progressPct');
  const tips = [
    'Roll a 6 to bring a token out of base! 🎯',
    'Land on opponents to capture them! 💥',
    'Safe squares (⭐) protect your tokens!',
    'Rolling 6 gives you another turn! 🎲',
    'Get all tokens home to win! 🏆'
  ];
  let tipIdx = 0, p = 0;
  const tipEl = document.getElementById('loadTip');
  const tipIv = setInterval(() => {
    tipIdx = (tipIdx+1) % tips.length;
    if (tipEl) tipEl.textContent = tips[tipIdx];
  }, 1400);
  const iv = setInterval(() => {
    p += Math.random() * 8 + 3;
    if (p >= 100) {
      p = 100; clearInterval(iv); clearInterval(tipIv);
      if (fill) fill.style.width = '100%';
      if (pct)  pct.textContent  = '100%';
      setTimeout(checkAuth, 350);
      return;
    }
    if (fill) fill.style.width = p + '%';
    if (pct)  pct.textContent  = Math.floor(p) + '%';
  }, 80);
}

function checkAuth() {
  auth.onAuthStateChanged(user => {
    if (user) {
      currentUser = user;
      loadUserData().then(() => showScreen('main'));
    } else {
      showToast('Please log in to Globals first.', 'error');
      setTimeout(() => { window.location.href = '/index.html'; }, 2200);
    }
  });
}

async function loadUserData() {
  if (!currentUser) return;
  try {
    // Try 'users' collection first, then 'accounts'
    let snap = await db.collection('users').doc(currentUser.uid).get();
    if (!snap.exists) snap = await db.collection('accounts').doc(currentUser.uid).get();
    if (snap.exists) {
      const d = snap.data();
      username = d.username || d.displayName || currentUser.displayName || 'Player';
    } else {
      username = currentUser.displayName || 'Player';
    }
    const el = document.getElementById('usernameDisplay');
    const av = document.getElementById('userAvatarMain');
    if (el) el.textContent = username;
    if (av) av.textContent = username[0].toUpperCase();
    subscribeBalance();
    loadUserStats();
    loadLeaderboard();
  } catch(e) { console.error('loadUserData:', e); }
}

// ── Balance — tries multiple collection paths ──
function subscribeBalance() {
  if (unsubBalance) { unsubBalance(); unsubBalance = null; }

  // Primary: 'balance' collection
  const tryBalance = () => {
    unsubBalance = db.collection('balance').doc(currentUser.uid).onSnapshot(snap => {
      if (snap.exists) {
        const raw = snap.data();
        userBalance = raw.amount ?? raw.balance ?? raw.coins ?? 0;
        updateBalanceUI();
      } else {
        // Fallback: try 'users' document field
        tryUserField();
      }
    }, err => {
      console.warn('balance collection:', err);
      tryUserField();
    });
  };

  const tryUserField = () => {
    if (unsubBalance) { unsubBalance(); }
    unsubBalance = db.collection('users').doc(currentUser.uid).onSnapshot(snap => {
      if (snap.exists) {
        const d = snap.data();
        userBalance = d.balance ?? d.amount ?? d.coins ?? d.wallet ?? 0;
        updateBalanceUI();
      }
    }, err => console.warn('users balance fallback:', err));
  };

  tryBalance();
}

function updateBalanceUI() {
  const el = document.getElementById('mainBalance');
  if (el) el.textContent = formatMoney(userBalance);
  updateXP();
}

function updateXP() {
  const wins = parseInt(document.getElementById('statWins')?.textContent || '0');
  const level = Math.floor(wins / 5) + 1;
  const xpPct = ((wins % 5) / 5) * 100;
  const xpEl   = document.getElementById('xpVal');
  const xpFill = document.getElementById('xpFill');
  if (xpEl)   xpEl.textContent   = 'Level ' + level;
  if (xpFill) xpFill.style.width = Math.min(xpPct, 100) + '%';
}

async function loadUserStats() {
  try {
    // Try ludo_transactions
    const snaps = await db.collection('ludo_transactions')
      .where('uid','==',currentUser.uid).get();
    let wins=0, earned=0, games=0;
    snaps.forEach(d => {
      const data = d.data();
      games++;
      if (data.type==='win'||data.type==='ludo_win'||data.type==='ludo_win_forfeit') {
        wins++;
        earned += data.amount || 0;
      }
    });
    // Also count from ludo_bet_rooms wins
    const betSnaps = await db.collection('ludo_bet_rooms')
      .where('winnerUid','==',currentUser.uid).get();
    betSnaps.forEach(() => wins++);

    const sw = document.getElementById('statWins');
    const sg = document.getElementById('statGames');
    const se = document.getElementById('statEarned');
    if (sw) sw.textContent = wins;
    if (sg) sg.textContent = Math.max(games, wins);
    if (se) se.textContent = '₦' + (earned >= 1000 ? (earned/1000).toFixed(1)+'k' : earned);
    updateXP();
  } catch(e) { console.warn('Stats:', e); }
}

async function loadLeaderboard() {
  try {
    const snap = await db.collection('ludo_transactions')
      .where('type','==','win')
      .orderBy('amount','desc').limit(5).get();
    const rows = document.getElementById('leaderRows');
    if (!rows) return;
    if (snap.empty) {
      rows.innerHTML = '<div class="lrow" style="justify-content:center;color:var(--muted);font-size:.73rem;">No winners yet — be the first! 🏆</div>';
      return;
    }
    const medals = ['🥇','🥈','🥉','4️⃣','5️⃣'];
    rows.innerHTML = snap.docs.map((d,i) => {
      const dat = d.data();
      const nm  = dat.username || 'Anonymous';
      return `<div class="lrow">
        <div class="lrnk">${medals[i]||i+1}</div>
        <div class="lava">${nm[0].toUpperCase()}</div>
        <div class="lnm">${nm}</div>
        <div class="lamt">₦${formatMoney(dat.amount)}</div>
      </div>`;
    }).join('');
  } catch(e) { console.warn('Leaderboard:', e); }
}

// ════════════════════════════════
//  PAGE VISIBILITY
// ════════════════════════════════
function setupPageVisibility() {
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      if (GS.timer && isMyTurn() && !GS.gameOver) {
        GS._hiddenAt = Date.now();
        GS._hiddenTimerVal = GS.timerVal;
      }
    } else {
      if (GS._hiddenAt && !GS.gameOver && GS.timer) {
        const elapsed = Math.floor((Date.now() - GS._hiddenAt) / 1000);
        GS.timerVal = Math.max(0, (GS._hiddenTimerVal||TURN_TIME) - elapsed);
        GS._hiddenAt = null;
        if (GS.timerVal <= 0) {
          clearTimer();
          showToast("Time's up!", 'warning');
          nextTurn();
        } else {
          updateTimerDisplay();
        }
      }
      if (GS.roomId && !roomListener && !GS.gameOver) {
        startRoomListener(GS.roomId, GS.mode==='bet');
      }
    }
  });
  window.addEventListener('beforeunload', () => {
    if (GS.roomId && !GS.gameOver) {
      localStorage.setItem('ludoActiveRoom', JSON.stringify({
        roomId:GS.roomId, mode:GS.mode, myRole:GS.myRole, ts:Date.now()
      }));
    } else {
      localStorage.removeItem('ludoActiveRoom');
    }
  });
}

// ════════════════════════════════
//  SCREEN / MODAL
// ════════════════════════════════
function showScreen(id) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById(id).classList.add('active');
  if (id === 'game') {
    // Ensure canvas is sized after paint
    requestAnimationFrame(() => { requestAnimationFrame(() => { resizeCanvas(); drawBoard(); }); });
  }
}

function openModal(id)  { document.getElementById(id).classList.add('open');    }
function closeModal(id) { document.getElementById(id).classList.remove('open'); }

// ════════════════════════════════
//  LOADING BOARD ANIMATION
// ════════════════════════════════
function animateLoadingBoard() {
  const c = document.getElementById('ludominiCanvas');
  if (!c) return;
  const ctx = c.getContext('2d');
  const W = c.width;
  const colors = ['#e53935','#43a047','#f9a825','#1e88e5'];
  const corners = [[4,4],[W-4-32,4],[4,W-4-32],[W-4-32,W-4-32]];
  let frame = 0;

  function draw() {
    ctx.clearRect(0,0,W,W);

    // Board bg
    ctx.fillStyle = '#f5f0e8';
    rr(ctx,0,0,W,W,10); ctx.fill();

    // Cross paths
    const cs = W/5;
    ctx.fillStyle = '#fff';
    ctx.fillRect(cs*2,0,cs,W);
    ctx.fillRect(0,cs*2,W,cs);
    ctx.strokeStyle='rgba(0,0,0,0.08)'; ctx.lineWidth=1;
    ctx.strokeRect(cs*2,0,cs,W);
    ctx.strokeRect(0,cs*2,W,cs);

    // Corner squares
    colors.forEach((col,i) => {
      const [cx,cy] = corners[i];
      ctx.fillStyle = col + '33';
      rr(ctx,cx,cy,32,32,6); ctx.fill();
      ctx.fillStyle='rgba(255,255,255,0.7)';
      rr(ctx,cx+4,cy+4,24,24,4); ctx.fill();

      // Bouncing token
      const off = Math.sin(frame*0.12 + i*1.57) * 6;
      ctx.beginPath();
      ctx.arc(cx+16, cy+16+off, 8, 0, Math.PI*2);
      ctx.fillStyle = col; ctx.fill();
      ctx.strokeStyle='rgba(255,255,255,0.5)'; ctx.lineWidth=1.5; ctx.stroke();

      // Gloss
      ctx.beginPath();
      ctx.arc(cx+12, cy+12+off, 2.5, 0, Math.PI*2);
      ctx.fillStyle='rgba(255,255,255,0.55)'; ctx.fill();
    });

    // Center
    ctx.beginPath();
    ctx.arc(W/2,W/2,9,0,Math.PI*2);
    ctx.fillStyle='#e8e3d8'; ctx.fill();
    ctx.strokeStyle='rgba(0,0,0,0.1)'; ctx.lineWidth=1; ctx.stroke();

    frame++;
    requestAnimationFrame(draw);
  }
  draw();
}

function rr(ctx,x,y,w,h,r) {
  ctx.beginPath();
  ctx.moveTo(x+r,y);
  ctx.lineTo(x+w-r,y); ctx.quadraticCurveTo(x+w,y,x+w,y+r);
  ctx.lineTo(x+w,y+h-r); ctx.quadraticCurveTo(x+w,y+h,x+w-r,y+h);
  ctx.lineTo(x+r,y+h); ctx.quadraticCurveTo(x,y+h,x,y+h-r);
  ctx.lineTo(x,y+r); ctx.quadraticCurveTo(x,y,x+r,y);
  ctx.closePath();
}
// Alias for existing code
const roundRect = rr;

// ════════════════════════════════
//  CODE INPUT (4 boxes)
// ════════════════════════════════
function setupCodeInput() {
  const hidden = document.getElementById('joinCodeHidden');
  const boxes  = [0,1,2,3].map(i => document.getElementById('cb'+i));

  function updateBoxes(val) {
    for (let i=0;i<4;i++) {
      boxes[i].textContent = val[i] || '_';
      boxes[i].className   = 'c-box' + (val[i] ? ' filled' : '');
    }
  }

  const wrap = document.getElementById('codeBoxes');
  if (wrap) wrap.addEventListener('click', () => { if(hidden) hidden.focus(); });

  if (hidden) {
    hidden.addEventListener('input', () => {
      const v = hidden.value.replace(/\D/g,'').slice(0,4);
      hidden.value = v;
      updateBoxes(v);
    });
  }
}

// ════════════════════════════════
//  UI SETUP
// ════════════════════════════════
function setupUI() {
  // Main
  document.getElementById('vsComputerBtn').onclick = () => openModal('computerModal');
  document.getElementById('vsFriendBtn').onclick   = () => openModal('friendModal');
  document.getElementById('betModeBtn').onclick    = () => openModal('betModal');
  document.getElementById('settingsBtn').onclick   = () => openModal('settingsModal');
  document.getElementById('mainChatBtn').onclick   = () => openModal('chatModal');
  document.getElementById('tutorialBtn').onclick   = () => openModal('tutorialModal');
  document.getElementById('termsBtn').onclick      = () => openModal('termsModal');
  document.getElementById('privacyBtn').onclick    = () => openModal('privacyModal');

  // Computer modal
  setupOptionGrid('difficultyGrid');
  setupOptionGrid('boardStyleGrid');
  document.getElementById('startComputerGame').onclick = startComputerGame;

  // Friend modal
  setupOptionGrid('friendModeGrid', v => {
    document.getElementById('hostSection').style.display = v==='host' ? '' : 'none';
    document.getElementById('joinSection').style.display = v==='join' ? '' : 'none';
  });
  setupOptionGrid('friendBoardStyleGrid');
  document.getElementById('hostGameBtn').onclick   = hostGame;
  document.getElementById('joinGameBtn').onclick   = joinGame;
  document.getElementById('cancelRoomBtn').onclick = cancelRoom;

  const shareBtn = document.getElementById('shareCodeBtn');
  if (shareBtn) shareBtn.onclick = () => {
    const code = document.getElementById('displayRoomCode').textContent;
    if (navigator.clipboard) navigator.clipboard.writeText(code).then(() => showToast('Code copied! ' + code, 'success'));
    else showToast('Room code: ' + code, 'success');
  };

  // Challenge (bet) cards
  document.querySelectorAll('.ch-card').forEach(card => {
    card.onclick = () => {
      document.querySelectorAll('.ch-card').forEach(c => c.classList.remove('sel'));
      card.classList.add('sel');
      const s = card.dataset.stake, w = card.dataset.win;
      GS.betStake = parseInt(s); GS.betWin = parseInt(w);
      document.getElementById('selectedBetInfo').innerHTML =
        `Entry <strong>₦${s}</strong> → Prize <strong style="color:var(--green)">₦${w}</strong>`;
      document.getElementById('startSearchBtn').disabled = false;
    };
  });
  document.getElementById('startSearchBtn').onclick = startBetSearch;
  document.getElementById('cancelMatchBtn').onclick = cancelBetSearch;

  // Game controls
  document.getElementById('rollBtn').onclick        = handleRoll;
  document.getElementById('quitBtn').onclick        = () => openModal('quitConfirmModal');
  document.getElementById('quitGameBtn').onclick    = () => openModal('quitConfirmModal');
  document.getElementById('gameSettingsBtn').onclick= () => openModal('settingsModal');
  document.getElementById('gameChatBtn').onclick    = () => openModal('chatModal');
  document.getElementById('gameChatBtn2').onclick   = () => openModal('chatModal');
  document.getElementById('confirmQuitBtn').onclick = confirmQuit;
  document.getElementById('cancelQuitBtn').onclick  = () => closeModal('quitConfirmModal');
  document.getElementById('gameCanvas').onclick     = handleBoardClick;

  // Win
  document.getElementById('winPlayAgain').onclick = playAgain;
  document.getElementById('winMainMenu').onclick  = () => { closeWinScreen(); showScreen('main'); };

  // Settings
  ['sound','music','anim'].forEach(k => {
    document.getElementById(k+'Toggle').onclick = function() {
      this.classList.toggle('on');
      settings[k] = this.classList.contains('on');
      saveSettings();
      if (k==='music') settings.music ? startBGMusic() : stopBGMusic();
    };
  });
  document.getElementById('settingsClose').onclick     = () => closeModal('settingsModal');
  document.getElementById('termsSettingsBtn').onclick  = () => { closeModal('settingsModal'); openModal('termsModal'); };
  document.getElementById('privacySettingsBtn').onclick= () => { closeModal('settingsModal'); openModal('privacyModal'); };

  // Misc closes
  const closes = {
    termsClose:'termsModal', privacyClose:'privacyModal',
    tutorialClose:'tutorialModal', chatClose:'chatModal'
  };
  Object.entries(closes).forEach(([btn,modal]) => {
    const el = document.getElementById(btn);
    if (el) el.onclick = () => closeModal(modal);
  });

  // Chat
  document.getElementById('chatSendBtn').onclick  = handleChatSend;
  document.getElementById('chatInput').onkeypress = e => { if(e.key==='Enter') handleChatSend(); };

  // Network
  document.getElementById('retryConnectionBtn').onclick = () => {
    if (navigator.onLine) closeModal('noInternetModal');
    else showToast('Still offline — check your connection.','error');
  };

  applySettings();
}

function setupOptionGrid(gridId, cb) {
  const grid = document.getElementById(gridId);
  if (!grid) return;
  grid.querySelectorAll('.opt-item').forEach(item => {
    item.onclick = () => {
      grid.querySelectorAll('.opt-item').forEach(i => i.classList.remove('sel'));
      item.classList.add('sel');
      if (cb) cb(item.dataset[Object.keys(item.dataset)[0]]);
    };
  });
}

// ════════════════════════════════
//  SETTINGS
// ════════════════════════════════
function loadSettings() {
  try {
    const s = JSON.parse(localStorage.getItem('ludoSettings')||'{}');
    settings = { sound:s.sound!==false, music:s.music||false, anim:s.anim!==false };
  } catch(e) {}
}
function saveSettings() { localStorage.setItem('ludoSettings', JSON.stringify(settings)); }
function applySettings() {
  ['sound','music','anim'].forEach(k => {
    document.getElementById(k+'Toggle')?.classList.toggle('on', settings[k]);
  });
}

// ════════════════════════════════
//  AUDIO ENGINE
// ════════════════════════════════
function getAC() {
  if (!audioCtx) audioCtx = new (window.AudioContext||window.webkitAudioContext)();
  if (audioCtx.state==='suspended') audioCtx.resume();
  return audioCtx;
}

function playSound(type) {
  if (!settings.sound) return;
  try {
    const ac = getAC(), now = ac.currentTime;
    const sounds = {
      dice:    {notes:[220,440,330], dur:0.12, type:'square',   vol:0.14},
      move:    {notes:[523,659],     dur:0.1,  type:'sine',     vol:0.1},
      capture: {notes:[300,200,150], dur:0.25, type:'sawtooth', vol:0.16},
      win:     {notes:[523,659,784,1047,1318], dur:0.45, type:'sine', vol:0.14},
      safe:    {notes:[440,880],     dur:0.12, type:'sine',     vol:0.09},
      enter:   {notes:[330,660,990], dur:0.25, type:'sine',     vol:0.11},
      tick:    {notes:[1200],        dur:0.04, type:'square',   vol:0.07}
    };
    const s = sounds[type]||sounds.move;
    const gain = ac.createGain();
    gain.connect(ac.destination);
    gain.gain.setValueAtTime(s.vol, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + s.dur*s.notes.length + 0.1);
    s.notes.forEach((freq,i) => {
      const osc = ac.createOscillator();
      osc.connect(gain); osc.type = s.type;
      osc.frequency.setValueAtTime(freq, now + i*(s.dur/s.notes.length));
      osc.start(now + i*(s.dur/s.notes.length));
      osc.stop(now + (i+1)*(s.dur/s.notes.length) + 0.05);
    });
  } catch(e) {}
}

function startBGMusic() {
  stopBGMusic();
  if (!settings.music) return;
  try {
    const ac = getAC();
    const melody = [523,587,659,698,784,880,987,880,784,698,659,587];
    const drums  = [1,0,0,1,0,1,0,0,1,0,1,0];
    const BPM = 128;
    const sixteenth = 60/BPM/4;
    function scheduleBeat() {
      if (!settings.music) return;
      const now = ac.currentTime;
      const idx = bgBeat % melody.length;
      if (drums[idx]) {
        const kick = ac.createOscillator(), kg = ac.createGain();
        kick.connect(kg); kg.connect(ac.destination);
        kick.frequency.setValueAtTime(150,now); kick.frequency.exponentialRampToValueAtTime(40,now+0.15);
        kg.gain.setValueAtTime(0.28,now); kg.gain.exponentialRampToValueAtTime(0.001,now+0.2);
        kick.start(now); kick.stop(now+0.2);
      }
      { // hi-hat
        const hh = ac.createOscillator(), hg = ac.createGain();
        const flt = ac.createBiquadFilter(); flt.type='highpass'; flt.frequency.value=8000;
        hh.connect(flt); flt.connect(hg); hg.connect(ac.destination);
        hh.type='square'; hh.frequency.value = 400+Math.random()*100;
        hg.gain.setValueAtTime(bgBeat%2===0?0.028:0.014,now);
        hg.gain.exponentialRampToValueAtTime(0.001,now+sixteenth*0.8);
        hh.start(now); hh.stop(now+sixteenth*0.8);
      }
      if (bgBeat%2===0) {
        const osc = ac.createOscillator(), og = ac.createGain();
        osc.connect(og); og.connect(ac.destination); osc.type='triangle';
        osc.frequency.value = melody[Math.floor(idx/2)%melody.length]*0.5;
        og.gain.setValueAtTime(0.035,now); og.gain.exponentialRampToValueAtTime(0.001,now+sixteenth*1.8);
        osc.start(now); osc.stop(now+sixteenth*2);
      }
      if (bgBeat%4===0||bgBeat%4===2) {
        const bass = ac.createOscillator(), bg2 = ac.createGain();
        bass.connect(bg2); bg2.connect(ac.destination); bass.type='sine';
        bass.frequency.value = 65+(bgBeat%4===2?12:0);
        bg2.gain.setValueAtTime(0.1,now); bg2.gain.exponentialRampToValueAtTime(0.001,now+sixteenth*1.5);
        bass.start(now); bass.stop(now+sixteenth*1.5);
      }
      bgBeat++;
    }
    scheduleBeat();
    bgMusicInterval = setInterval(() => {
      if (settings.music && audioCtx) scheduleBeat(); else stopBGMusic();
    }, Math.round(sixteenth*1000));
  } catch(e) {}
}

function stopBGMusic() {
  if (bgMusicInterval) { clearInterval(bgMusicInterval); bgMusicInterval=null; }
  bgBeat = 0;
}

// ════════════════════════════════
//  NETWORK
// ════════════════════════════════
function checkNetwork() { if (!navigator.onLine) openModal('noInternetModal'); }
function setupNetworkDetection() {
  window.addEventListener('offline', () => openModal('noInternetModal'));
  window.addEventListener('online',  () => closeModal('noInternetModal'));
}

// ════════════════════════════════
//  TOAST
// ════════════════════════════════
let _toastTO;
function showToast(msg, type='') {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.className = 'toast show' + (type ? ' '+type : '');
  clearTimeout(_toastTO);
  _toastTO = setTimeout(() => t.classList.remove('show'), 3200);
}

// ════════════════════════════════
//  HELPERS
// ════════════════════════════════
function formatMoney(n) {
  const num = Number(n);
  if (isNaN(num)) return '0.00';
  return num.toLocaleString('en-NG', {minimumFractionDigits:2, maximumFractionDigits:2});
}
function randInt(mn,mx) { return Math.floor(Math.random()*(mx-mn+1))+mn; }
function rollDice()     { return randInt(1,6); }

// ════════════════════════════════
//  GAME STATE
// ════════════════════════════════
function createToken(color,id) {
  return { color, id, state:'home', relPos:-1, homeStep:-1 };
}

function initGameState(mode, opts={}) {
  let p1Colors, p2Colors;
  if (opts.boardStyle==='double') {
    p1Colors=['red','blue']; p2Colors=['green','yellow'];
  } else {
    p1Colors=['red']; p2Colors=['green'];
  }
  const tokens = {};
  [...p1Colors,...p2Colors].forEach(color => {
    tokens[color] = [0,1,2,3].map(i => createToken(color,i));
  });
  GS = {
    mode, boardStyle:opts.boardStyle||'classic',
    difficulty:opts.difficulty||'medium',
    p1Colors, p2Colors, tokens,
    currentTurn:'p1', diceVal:null, diceRolled:false,
    selectedToken:null, timer:null, timerVal:TURN_TIME,
    gameOver:false, winner:null,
    roomId:opts.roomId||null, betStake:opts.betStake||0, betWin:opts.betWin||0,
    isHost:opts.isHost||false, myRole:opts.myRole||'p1',
    opponentUid:opts.opponentUid||null,
    p1Name:opts.p1Name||username,
    p2Name:opts.p2Name||(mode==='computer'?'AI Opponent':'Opponent'),
    animating:false,
    _hiddenAt:null, _hiddenTimerVal:null
  };
}

// ════════════════════════════════
//  GAME MODES
// ════════════════════════════════
function startComputerGame() {
  const diff  = document.querySelector('#difficultyGrid .opt-item.sel')?.dataset.diff  || 'medium';
  const style = document.querySelector('#boardStyleGrid .opt-item.sel')?.dataset.style || 'classic';
  closeModal('computerModal');
  initGameState('computer', {difficulty:diff, boardStyle:style});
  setupGameScreen();
  showScreen('game');
  if (settings.music) startBGMusic();
  startTurn();
}

async function hostGame() {
  if (!currentUser) return;
  const style = document.querySelector('#friendBoardStyleGrid .opt-item.sel')?.dataset.style || 'classic';
  const code  = String(randInt(1000,9999));

  document.getElementById('displayRoomCode').textContent = code;
  document.getElementById('hostSection').style.display   = 'none';
  document.getElementById('roomWaiting').style.display   = '';

  const roomData = {
    code, host:currentUser.uid, hostName:username,
    guest:null, guestName:null, boardStyle:style,
    status:'waiting',
    createdAt:firebase.firestore.FieldValue.serverTimestamp()
  };

  try {
    await db.collection('ludo_rooms').doc(code).set(roomData);
    GS.roomId = code; GS.isHost = true;

    roomListener = db.collection('ludo_rooms').doc(code).onSnapshot(snap => {
      const d = snap.data();
      if (!d) return;
      if (d.guest && (d.status==='ready'||d.status==='playing')) {
        const gs = document.getElementById('guestSlot');
        if (gs) gs.innerHTML = `<div class="rp-ico" style="color:var(--green)">✅</div><div>${d.guestName||'Guest'}</div>`;
        if (gs) gs.classList.add('rp-on');

        if (d.status==='ready') {
          if (roomListener) { roomListener(); roomListener=null; }
          closeModal('friendModal');
          initGameState('friend', {
            boardStyle:style, roomId:code,
            isHost:true, myRole:'p1',
            p2Name:d.guestName||'Guest',
            opponentUid:d.guest
          });
          setupGameScreen();
          showScreen('game');
          if (settings.music) startBGMusic();
          db.collection('ludo_rooms').doc(code).update({status:'playing'});
          startRoomListener(code, false);
          startTurn();
        }
      }
    }, e => showToast('Room error: '+e.message,'error'));
  } catch(e) { showToast('Error creating room: '+e.message,'error'); }
}

async function joinGame() {
  if (!currentUser) return;
  const hidden = document.getElementById('joinCodeHidden');
  const code   = (hidden ? hidden.value : '').trim().replace(/\D/g,'');
  if (code.length!==4) { showToast('Enter a valid 4-digit code','error'); return; }

  try {
    const snap = await db.collection('ludo_rooms').doc(code).get();
    if (!snap.exists) { showToast('Room not found','error'); return; }
    const d = snap.data();
    if (d.status!=='waiting') { showToast('Room already started or full','error'); return; }
    if (d.host===currentUser.uid) { showToast("Can't join your own room",'error'); return; }

    await db.collection('ludo_rooms').doc(code).update({
      guest:currentUser.uid, guestName:username, status:'ready'
    });
    closeModal('friendModal');
    initGameState('friend', {
      boardStyle:d.boardStyle||'classic', roomId:code,
      isHost:false, myRole:'p2',
      p1Name:d.hostName||'Host', opponentUid:d.host
    });
    setupGameScreen();
    showScreen('game');
    if (settings.music) startBGMusic();
    startRoomListener(code, false);
    startTurn();
  } catch(e) { showToast('Error joining: '+e.message,'error'); }
}

async function cancelRoom() {
  if (GS.roomId) {
    await db.collection('ludo_rooms').doc(GS.roomId).delete().catch(()=>{});
    if (roomListener) { roomListener(); roomListener=null; }
    GS.roomId = null;
  }
  document.getElementById('hostSection').style.display = '';
  document.getElementById('roomWaiting').style.display = 'none';
}

// ════════════════════════════════
//  BET / MATCHMAKING
// ════════════════════════════════
let matchSearchInterval = null;
let matchSearchElapsed  = 0;

async function startBetSearch() {
  if (!currentUser) return;
  const stake = GS.betStake;
  if (!stake) { showToast('Select an entry amount','error'); return; }
  if (userBalance < stake) { showToast('Insufficient balance. Please top up via Globals.','error'); return; }

  closeModal('betModal');
  document.getElementById('matchStakeDisplay').textContent = `₦${stake} Entry`;
  document.getElementById('matchDesc').textContent         = `Finding an opponent for ₦${stake}...`;
  openModal('matchmakingModal');
  matchSearchElapsed = 0;

  try {
    await db.runTransaction(async tx => {
      const ref  = db.collection('balance').doc(currentUser.uid);
      const snap = await tx.get(ref);
      const bal  = snap.data()?.amount ?? snap.data()?.balance ?? 0;
      if (bal < stake) throw new Error('Insufficient balance');
      tx.update(ref, {amount:firebase.firestore.FieldValue.increment(-stake)});
    });

    await db.collection('ludo_matchmaking').doc(currentUser.uid).set({
      uid:currentUser.uid, username, stake, status:'searching',
      createdAt:firebase.firestore.FieldValue.serverTimestamp(), roomId:null
    });

    matchListener = db.collection('ludo_matchmaking').doc(currentUser.uid).onSnapshot(snap => {
      const d = snap.data();
      if (d && d.status==='matched' && d.roomId) {
        clearInterval(matchSearchInterval);
        if (matchListener) { matchListener(); matchListener=null; }
        closeModal('matchmakingModal');
        joinBetRoom(d.roomId, d.stake, d.winAmount, d.role);
      }
    });

    matchSearchInterval = setInterval(() => {
      matchSearchElapsed++;
      const el = document.getElementById('matchTimer');
      if (el) el.textContent = matchSearchElapsed+'s';
      if (matchSearchElapsed>=60) cancelBetSearch(true);
    }, 1000);

    tryMatchmaking(stake);
  } catch(e) {
    showToast(e.message||'Search error','error');
    closeModal('matchmakingModal');
  }
}

async function tryMatchmaking(stake) {
  try {
    const cutoff = new Date(Date.now()-60000);
    const snap = await db.collection('ludo_matchmaking')
      .where('stake','==',stake).where('status','==','searching')
      .orderBy('createdAt','asc').get();
    const candidates = snap.docs.filter(d =>
      d.id!==currentUser.uid && d.data().createdAt?.toDate()>cutoff
    );
    if (candidates.length>0) {
      const opp = candidates[0], oppData = opp.data();
      const roomId = 'bet_'+Date.now();
      const winAmount = GS.betWin;
      await db.runTransaction(async tx => {
        const myRef  = db.collection('ludo_matchmaking').doc(currentUser.uid);
        const oppRef = db.collection('ludo_matchmaking').doc(opp.id);
        const oppSnap = await tx.get(oppRef);
        if (!oppSnap.exists||oppSnap.data().status!=='searching') return;
        const roomRef = db.collection('ludo_bet_rooms').doc(roomId);
        tx.set(roomRef, {
          p1:opp.id, p1Name:oppData.username,
          p2:currentUser.uid, p2Name:username,
          stake, winAmount, status:'playing',
          createdAt:firebase.firestore.FieldValue.serverTimestamp(),
          gameState:null, winner:null
        });
        tx.update(oppRef, {status:'matched', roomId, role:'p1', winAmount});
        tx.update(myRef,  {status:'matched', roomId, role:'p2', winAmount});
      });
    }
  } catch(e) { console.error('Matchmaking:', e); }
}

async function cancelBetSearch(refund=true) {
  clearInterval(matchSearchInterval);
  if (matchListener) { matchListener(); matchListener=null; }
  closeModal('matchmakingModal');
  if (!currentUser) return;
  try {
    const doc = await db.collection('ludo_matchmaking').doc(currentUser.uid).get();
    if (doc.exists && doc.data().status==='searching') {
      await db.collection('ludo_matchmaking').doc(currentUser.uid).delete();
      if (refund) {
        await db.collection('balance').doc(currentUser.uid).update({
          amount:firebase.firestore.FieldValue.increment(GS.betStake||0)
        });
        showToast('No match found. Entry returned ✓','warning');
      }
    }
  } catch(e) { console.error(e); }
}

async function joinBetRoom(roomId, stake, winAmount, role) {
  try {
    const snap = await db.collection('ludo_bet_rooms').doc(roomId).get();
    const d = snap.data();
    initGameState('bet', {
      boardStyle:'classic', roomId, isHost:role==='p1', myRole:role,
      betStake:stake, betWin:winAmount,
      p1Name:d.p1Name, p2Name:d.p2Name,
      opponentUid:role==='p1'?d.p2:d.p1
    });
    setupGameScreen();
    showScreen('game');
    if (settings.music) startBGMusic();
    startTurn();
    startRoomListener(roomId, true);
  } catch(e) { showToast('Error joining match','error'); }
}

// ════════════════════════════════
//  ROOM LISTENER
// ════════════════════════════════
function startRoomListener(roomId, isBet=false) {
  if (roomListener) { roomListener(); roomListener=null; }
  const col = isBet ? 'ludo_bet_rooms' : 'ludo_rooms';
  roomListener = db.collection(col).doc(roomId).onSnapshot(snap => {
    if (!snap.exists) return;
    const d = snap.data();
    if (d.gameState && GS.myRole!==d.gameState.lastActor) {
      syncRemoteState(d.gameState);
    }
    if (d.winner && !GS.gameOver) {
      handleRemoteWin(d.winner, isBet);
    }
  }, e => console.error('Room listener:', e));
}

function syncRemoteState(remote) {
  if (!remote||GS.gameOver) return;
  GS.tokens      = remote.tokens;
  GS.currentTurn = remote.currentTurn;
  GS.diceVal     = remote.diceVal;
  GS.diceRolled  = false;
  clearTimer();
  drawBoard();
  drawDice(remote.diceVal);
  updatePanels();
  if (remote.currentTurn===GS.myRole) {
    enableMyTurn();
  } else {
    document.getElementById('rollBtn').disabled  = true;
    document.getElementById('rollBtn').textContent = '⏳ Waiting...';
    updateStatus();
  }
}

async function pushGameState(lastActor) {
  if (!GS.roomId) return;
  const col = GS.mode==='bet' ? 'ludo_bet_rooms' : 'ludo_rooms';
  await db.collection(col).doc(GS.roomId).update({
    gameState:{tokens:GS.tokens, currentTurn:GS.currentTurn, diceVal:GS.diceVal, lastActor}
  }).catch(e => console.error('Push:', e));
}

// ════════════════════════════════
//  GAME SCREEN SETUP
// ════════════════════════════════
function setupGameScreen() {
  // Resize first
  resizeCanvas();

  // ── FIX 4: Use username in title ──
  const modeTitles = {
    computer: `${username} vs AI`,
    friend:   `${username} vs ${GS.p2Name||'Friend'}`,
    bet:      `${username} vs ${GS.p2Name||'Opponent'}`
  };
  const modeClass = { computer:'badge-ai', friend:'badge-friend', bet:'badge-bet' };
  const modeLabel = { computer:'vs AI', friend:'vs Friend', bet:'Challenge' };

  const titleHd = document.getElementById('gameTitleHd');
  const badge   = document.getElementById('gameModeLabel');
  if (titleHd) titleHd.textContent = modeTitles[GS.mode] || 'Globals Ludo';
  if (badge)   { badge.textContent = modeLabel[GS.mode]||''; badge.className = 'gh-badge '+(modeClass[GS.mode]||'badge-ai'); }

  document.getElementById('pp1name').textContent = GS.p1Name;
  document.getElementById('pp2name').textContent = GS.p2Name;

  const qNote = document.getElementById('quitNote');
  if (qNote) qNote.textContent = GS.mode==='bet'
    ? '(Your opponent wins the full prize.)'
    : GS.mode==='friend' ? '(Your opponent wins the match.)' : '';

  drawBoard();
  drawDice(null);
  updatePanels();
}

// ── CRITICAL FIX: board always fills the available space ──
function resizeCanvas() {
  const canvas = document.getElementById('gameCanvas');
  const wrap   = document.querySelector('.board-wrap');
  if (!canvas || !wrap) return;

  const ww = wrap.clientWidth  || wrap.offsetWidth;
  const wh = wrap.clientHeight || wrap.offsetHeight;

  // Use the smaller dimension, subtract small padding
  const size = Math.floor(Math.min(ww - 12, wh - 8, 480));
  if (size < 100) return; // not ready yet

  canvas.width  = size;
  canvas.height = size;
  canvas.style.width  = size + 'px';
  canvas.style.height = size + 'px';
}

window.addEventListener('resize', () => {
  if (document.getElementById('game').classList.contains('active')) {
    resizeCanvas();
    drawBoard();
  }
});

// ════════════════════════════════
//  BOARD DRAWING — Bright authentic Ludo
// ════════════════════════════════
function drawBoard() {
  const canvas = document.getElementById('gameCanvas');
  if (!canvas.width) return;
  const ctx = canvas.getContext('2d');
  const W   = canvas.width;
  const cs  = W / COLS;

  ctx.clearRect(0,0,W,W);

  // Bright cream background
  ctx.fillStyle = '#faf6ee';
  ctx.fillRect(0,0,W,W);

  // Draw cells
  for (let r=0;r<COLS;r++) {
    for (let c=0;c<COLS;c++) {
      drawCell(ctx, r, c, cs);
    }
  }

  // Grid lines on path
  ctx.strokeStyle = 'rgba(0,0,0,0.14)';
  ctx.lineWidth   = 0.6;
  for (let r=0;r<COLS;r++) {
    for (let c=0;c<COLS;c++) {
      const info = getCellType(r,c);
      if (info.type!=='inactive' && info.type!=='corner' && info.type!=='center') {
        ctx.strokeRect(c*cs, r*cs, cs, cs);
      }
    }
  }

  drawCenter(ctx, cs);

  // Board outer border
  ctx.strokeStyle = 'rgba(0,0,0,0.35)';
  ctx.lineWidth   = 2.5;
  ctx.strokeRect(1,1,W-2,W-2);

  // Corner borders
  ['red','green','yellow','blue'].forEach(color => {
    const {r,c} = cornerBounds(color);
    ctx.strokeStyle = CLR[color].dark;
    ctx.lineWidth   = 1.5;
    ctx.strokeRect(c[0]*cs, r[0]*cs, 6*cs, 6*cs);
  });

  drawAllTokens(ctx, cs);
}

function cornerBounds(color) {
  return {
    red:    {r:[0,5],c:[0,5]},
    green:  {r:[0,5],c:[9,14]},
    yellow: {r:[9,14],c:[9,14]},
    blue:   {r:[9,14],c:[0,5]}
  }[color];
}

function getCellType(r,c) {
  if (r<=5&&c<=5) return {type:'corner',color:'red'};
  if (r<=5&&c>=9) return {type:'corner',color:'green'};
  if (r>=9&&c>=9) return {type:'corner',color:'yellow'};
  if (r>=9&&c<=5) return {type:'corner',color:'blue'};
  if (r>=6&&r<=8&&c>=6&&c<=8) return {type:'center'};

  for (const [color,cells] of Object.entries(HOME_STRETCH)) {
    const stepIdx = cells.findIndex(([hr,hc]) => hr===r&&hc===c);
    if (stepIdx!==-1) return {type:'stretch',color,stepIdx};
  }

  const pathIdx = MAIN_PATH.findIndex(([pr,pc]) => pr===r&&pc===c);
  if (pathIdx!==-1) {
    if (pathIdx===0)  return {type:'start',color:'red',   pathIdx,safe:true};
    if (pathIdx===13) return {type:'start',color:'green', pathIdx,safe:true};
    if (pathIdx===26) return {type:'start',color:'yellow',pathIdx,safe:true};
    if (pathIdx===39) return {type:'start',color:'blue',  pathIdx,safe:true};
    if (SAFE_ABS.has(pathIdx)) return {type:'safe',pathIdx,safe:true};
    return {type:'path',pathIdx};
  }
  return {type:'inactive'};
}

function drawCell(ctx, r, c, cs) {
  const info = getCellType(r,c);
  const x=c*cs, y=r*cs;

  if (info.type==='center' || info.type==='inactive') {
    if (info.type==='inactive') { ctx.fillStyle='#e9e4d8'; ctx.fillRect(x,y,cs,cs); }
    return;
  }

  if (info.type==='corner') {
    drawCornerCell(ctx, r, c, cs, info.color);
    return;
  }

  if (info.type==='stretch') {
    ctx.fillStyle = CLR[info.color].fill;
    ctx.fillRect(x,y,cs,cs);
    if (info.stepIdx===4) {
      // goal marker
      drawStar(ctx,x+cs/2,y+cs/2,cs*0.3,'#fff',0.48);
    } else {
      drawStretchArrow(ctx,r,c,cs,info.color);
    }
    return;
  }

  if (info.type==='start') {
    ctx.fillStyle = CLR[info.color].fill;
    ctx.fillRect(x,y,cs,cs);
    drawStar(ctx,x+cs/2,y+cs/2,cs*0.3,'#fff',0.5);
    return;
  }

  if (info.type==='safe') {
    ctx.fillStyle = '#fffde7';
    ctx.fillRect(x,y,cs,cs);
    drawStar(ctx,x+cs/2,y+cs/2,cs*0.28,'#f9a825',0.44);
    return;
  }

  // Normal path
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(x,y,cs,cs);

  // Highlight moveable cells
  if (GS.diceRolled && isMyTurn() && !GS.gameOver) {
    if (checkCellMovable(r,c)) {
      ctx.fillStyle='rgba(249,115,22,0.07)';
      ctx.fillRect(x,y,cs,cs);
    }
  }
}

function checkCellMovable(r,c) {
  if (!GS.tokens) return false;
  const myColors = GS.currentTurn==='p1' ? GS.p1Colors : GS.p2Colors;
  const cs2 = document.getElementById('gameCanvas').width/COLS;
  return myColors.some(color =>
    GS.tokens[color].some(t => {
      const pos = getTokenCanvasPos(t, cs2);
      if (!pos) return false;
      const tr = Math.floor(pos.y/cs2), tc = Math.floor(pos.x/cs2);
      return tr===r && tc===c && canTokenMove(t);
    })
  );
}

function drawCornerCell(ctx, r, c, cs, color) {
  const x=c*cs, y=r*cs;
  ctx.fillStyle = CLR[color].fill;
  ctx.fillRect(x,y,cs,cs);

  // Inner white home box
  if (isInnerHome(r,c,color)) {
    ctx.fillStyle = '#fff';
    ctx.fillRect(x+1.5,y+1.5,cs-3,cs-3);
    // Inner circle placeholder
    ctx.beginPath();
    ctx.arc(x+cs/2, y+cs/2, cs*0.28, 0, Math.PI*2);
    ctx.strokeStyle = CLR[color].fill + '60';
    ctx.lineWidth   = 1;
    ctx.stroke();
  }
}

function isInnerHome(r,c,color) {
  const boxes = {
    red:    {r:[1,4],c:[1,4]},
    green:  {r:[1,4],c:[10,13]},
    yellow: {r:[10,13],c:[10,13]},
    blue:   {r:[10,13],c:[1,4]}
  };
  const b = boxes[color];
  return r>=b.r[0]&&r<=b.r[1]&&c>=b.c[0]&&c<=b.c[1];
}

function drawStretchArrow(ctx, r, c, cs, color) {
  const x=c*cs, y=r*cs;
  ctx.fillStyle='rgba(255,255,255,0.28)';
  const dirs={red:'right',green:'down',yellow:'left',blue:'up'};
  const dir=dirs[color];
  const mx=x+cs/2, my=y+cs/2, hw=cs*0.2, hl=cs*0.3;
  switch(dir) {
    case 'right': drawArrow(ctx,mx-hl,my,mx+hl,my,hw); break;
    case 'left':  drawArrow(ctx,mx+hl,my,mx-hl,my,hw); break;
    case 'down':  drawArrow(ctx,mx,my-hl,mx,my+hl,hw); break;
    case 'up':    drawArrow(ctx,mx,my+hl,mx,my-hl,hw); break;
  }
  ctx.fill();
}

function drawArrow(ctx,x1,y1,x2,y2,hw) {
  const dx=x2-x1,dy=y2-y1,len=Math.sqrt(dx*dx+dy*dy);
  const ux=dx/len,uy=dy/len,px=-uy,py=ux;
  ctx.beginPath();
  ctx.moveTo(x1+px*hw/2, y1+py*hw/2);
  ctx.lineTo(x2-ux*hw,   y2-uy*hw);
  ctx.lineTo(x2-ux*hw+px*hw, y2-uy*hw+py*hw);
  ctx.lineTo(x2, y2);
  ctx.lineTo(x2-ux*hw-px*hw, y2-uy*hw-py*hw);
  ctx.lineTo(x2-ux*hw, y2-uy*hw);
  ctx.lineTo(x1-px*hw/2, y1-py*hw/2);
  ctx.closePath();
}

function drawStar(ctx,cx,cy,outerR,fillColor,innerRatio) {
  const innerR = outerR*innerRatio;
  ctx.beginPath();
  for (let i=0;i<10;i++) {
    const angle = (i*Math.PI)/5 - Math.PI/2;
    const r = i%2===0 ? outerR : innerR;
    i===0 ? ctx.moveTo(cx+r*Math.cos(angle),cy+r*Math.sin(angle))
          : ctx.lineTo(cx+r*Math.cos(angle),cy+r*Math.sin(angle));
  }
  ctx.closePath();
  ctx.fillStyle = fillColor;
  ctx.fill();
}

function drawCenter(ctx, cs) {
  const x=6*cs, y=6*cs, size=3*cs;
  const cx=x+size/2, cy=y+size/2;

  ctx.fillStyle='#faf6ee';
  ctx.fillRect(x,y,size,size);

  // 4 triangles
  const tris = [
    {c1:[x,y],     c2:[x+size,y],       col:CLR.red.fill},
    {c1:[x+size,y],c2:[x+size,y+size],  col:CLR.green.fill},
    {c1:[x+size,y+size],c2:[x,y+size],  col:CLR.yellow.fill},
    {c1:[x,y+size],c2:[x,y],            col:CLR.blue.fill}
  ];
  tris.forEach(({c1,c2,col}) => {
    ctx.beginPath();
    ctx.moveTo(cx,cy);
    ctx.lineTo(c1[0],c1[1]);
    ctx.lineTo(c2[0],c2[1]);
    ctx.closePath();
    ctx.fillStyle=col; ctx.fill();
    ctx.strokeStyle='rgba(255,255,255,0.6)'; ctx.lineWidth=1; ctx.stroke();
  });

  // Center glow circle
  const grad = ctx.createRadialGradient(cx,cy,0,cx,cy,cs*0.65);
  grad.addColorStop(0,'#fff');
  grad.addColorStop(1,'#f5f0e8');
  ctx.beginPath(); ctx.arc(cx,cy,cs*0.62,0,Math.PI*2);
  ctx.fillStyle=grad; ctx.fill();
  ctx.strokeStyle='rgba(0,0,0,0.1)'; ctx.lineWidth=1; ctx.stroke();

  // Center star
  drawStar(ctx,cx,cy,cs*0.35,'rgba(0,0,0,0.07)',0.5);
}

// ════════════════════════════════
//  TOKEN DRAWING
// ════════════════════════════════
function drawAllTokens(ctx, cs) {
  // Draw home placeholders
  const homeBoxes = {
    red:    {r:[1,4],c:[1,4]},
    green:  {r:[1,4],c:[10,13]},
    yellow: {r:[10,13],c:[10,13]},
    blue:   {r:[10,13],c:[1,4]}
  };
  Object.entries(homeBoxes).forEach(([color,{r,c}]) => {
    const midR=(r[0]+r[1])/2, midC=(c[0]+c[1])/2;
    [[-1,-1],[-1,1],[1,-1],[1,1]].forEach(([dr,dc]) => {
      const px=(midC+dc*0.72)*cs, py=(midR+dr*0.72)*cs, rad=cs*0.27;
      ctx.beginPath(); ctx.arc(px,py,rad,0,Math.PI*2);
      ctx.fillStyle=CLR[color].light; ctx.fill();
      ctx.strokeStyle=CLR[color].dark+'55'; ctx.lineWidth=1; ctx.stroke();
      ctx.beginPath(); ctx.arc(px,py,rad*0.55,0,Math.PI*2);
      ctx.fillStyle=CLR[color].fill+'40'; ctx.fill();
    });
  });

  if (!GS.tokens) return;

  const cellCount={}, cellIdx={};
  Object.values(GS.tokens).forEach(colorTokens => {
    colorTokens.forEach(token => {
      if (token.state==='finished') return;
      const pos = getTokenCanvasPos(token, cs);
      if (!pos) return;
      const key = Math.round(pos.x/cs)+','+Math.round(pos.y/cs);
      cellCount[key] = (cellCount[key]||0)+1;
    });
  });

  Object.values(GS.tokens).forEach(colorTokens => {
    colorTokens.forEach(token => drawToken(ctx, token, cs, cellIdx, cellCount));
  });
}

function drawToken(ctx, token, cs, cellIdx, cellCount) {
  if (token.state==='finished') return;
  const pos = getTokenCanvasPos(token, cs);
  if (!pos) return;

  const {x,y} = pos;
  const key = Math.round(x/cs)+','+Math.round(y/cs);
  cellIdx[key] = cellIdx[key]||0;
  const count  = cellCount[key]||1;
  const idx    = cellIdx[key]++;

  let ox=0, oy=0;
  if (count>1) {
    const offs=[[0,0],[-5,0],[5,0],[0,-5]];
    const off=offs[Math.min(idx,3)]; ox=off[0]; oy=off[1];
  }

  const fx=x+ox, fy=y+oy;
  const r = cs*(token.state==='home'?0.27:0.31);

  ctx.shadowColor='rgba(0,0,0,0.4)';
  ctx.shadowBlur=4; ctx.shadowOffsetY=2;

  // Outer dark ring
  ctx.beginPath(); ctx.arc(fx,fy,r,0,Math.PI*2);
  ctx.fillStyle=CLR[token.color].dark; ctx.fill();

  // Colored body
  ctx.beginPath(); ctx.arc(fx,fy,r*0.8,0,Math.PI*2);
  ctx.fillStyle=CLR[token.color].fill; ctx.fill();

  // Inner ring
  ctx.beginPath(); ctx.arc(fx,fy,r*0.56,0,Math.PI*2);
  ctx.strokeStyle='rgba(255,255,255,0.55)'; ctx.lineWidth=1; ctx.stroke();

  // Gloss
  ctx.beginPath(); ctx.arc(fx-r*0.22,fy-r*0.22,r*0.22,0,Math.PI*2);
  ctx.fillStyle='rgba(255,255,255,0.6)'; ctx.fill();

  ctx.shadowColor='transparent'; ctx.shadowBlur=0; ctx.shadowOffsetY=0;

  // Number label
  ctx.fillStyle='#fff';
  ctx.font=`bold ${Math.round(r*0.68)}px Nunito,sans-serif`;
  ctx.textAlign='center'; ctx.textBaseline='middle';
  ctx.fillText(token.id+1, fx, fy+0.5);

  // Selected glow
  if (GS.selectedToken?.color===token.color && GS.selectedToken?.id===token.id) {
    ctx.beginPath(); ctx.arc(fx,fy,r+3,0,Math.PI*2);
    ctx.strokeStyle='#f97316'; ctx.lineWidth=2.5; ctx.stroke();
    ctx.beginPath(); ctx.arc(fx,fy,r+7,0,Math.PI*2);
    ctx.strokeStyle='rgba(249,115,22,0.28)'; ctx.lineWidth=4; ctx.stroke();
  }

  // Moveable pulse
  if (GS.diceRolled && isMyTurn() && !GS.gameOver && canTokenMove(token)) {
    const pulse = 0.55 + 0.45*Math.sin(animPulse*0.18);
    ctx.beginPath(); ctx.arc(fx,fy,r+2.5,0,Math.PI*2);
    ctx.strokeStyle=`rgba(249,115,22,${pulse})`; ctx.lineWidth=2; ctx.stroke();
  }
}

function getTokenCanvasPos(token, cs) {
  if (!cs) cs=document.getElementById('gameCanvas').width/COLS;
  const color=token.color;
  if (token.state==='home') {
    const [row,col]=HOME_BASE[color][token.id];
    return {x:col*cs, y:row*cs, color};
  }
  if (token.state==='finished') return null;
  if (token.state==='active') {
    const absIdx=(ENTRY_IDX[color]+token.relPos)%52;
    const [row,col]=MAIN_PATH[absIdx];
    return {x:(col+0.5)*cs, y:(row+0.5)*cs, color};
  }
  if (token.state==='homestretch') {
    const [row,col]=HOME_STRETCH[color][token.homeStep];
    return {x:(col+0.5)*cs, y:(row+0.5)*cs, color};
  }
  return null;
}

// ════════════════════════════════
//  DICE
// ════════════════════════════════
function drawDice(val) {
  const canvas=document.getElementById('diceCanvas');
  const ctx=canvas.getContext('2d');
  const W=64, pad=4;
  ctx.clearRect(0,0,W,W);
  ctx.fillStyle=val?'#ffffff':'#f5f2ec';
  rr(ctx,pad,pad,W-2*pad,W-2*pad,10); ctx.fill();
  ctx.strokeStyle=val?'#1a2d4a':'rgba(0,0,0,0.12)';
  ctx.lineWidth=val?2:1;
  rr(ctx,pad,pad,W-2*pad,W-2*pad,10); ctx.stroke();
  if (!val) {
    ctx.fillStyle='rgba(0,0,0,0.1)';
    ctx.beginPath(); ctx.arc(32,32,4.5,0,Math.PI*2); ctx.fill();
    return;
  }
  const dots={1:[[32,32]],2:[[20,20],[44,44]],3:[[20,20],[32,32],[44,44]],
    4:[[20,20],[44,20],[20,44],[44,44]],5:[[20,20],[44,20],[32,32],[20,44],[44,44]],
    6:[[20,18],[44,18],[20,32],[44,32],[20,46],[44,46]]};
  ctx.fillStyle='#1a2d4a';
  (dots[val]||[]).forEach(([dx,dy]) => {
    ctx.beginPath(); ctx.arc(dx,dy,4.5,0,Math.PI*2); ctx.fill();
  });
}

let diceAnimFrame=null;
function animateDice(finalVal, cb) {
  if (!settings.anim) { drawDice(finalVal); if(cb)cb(); return; }
  let count=0, total=12;
  function frame() {
    drawDice(randInt(1,6)); count++;
    if (count<total) {
      diceAnimFrame=setTimeout(frame, count<8?55:count<11?95:145);
    } else { drawDice(finalVal); if(cb)cb(); }
  }
  frame();
}

// ════════════════════════════════
//  TURN MANAGEMENT
// ════════════════════════════════
function startTurn() {
  if (GS.gameOver) return;
  GS.diceVal=null; GS.diceRolled=false; GS.selectedToken=null;
  clearTimer();
  updateStatus();
  updatePanels();

  const myTurn=isMyTurn();
  const rollBtn=document.getElementById('rollBtn');

  if (myTurn) {
    rollBtn.disabled=false;
    rollBtn.textContent='🎲 ROLL DICE';
    document.getElementById('diceLabel').textContent='Your turn!';
    startTimer();
  } else {
    rollBtn.disabled=true;
    rollBtn.textContent='⏳ Waiting...';
    document.getElementById('diceLabel').textContent="Opponent's turn";
    if (GS.mode==='computer') setTimeout(computerTurn, 900);
  }
  drawBoard();
}

function isMyTurn() {
  if (GS.mode==='computer') return GS.currentTurn==='p1';
  return GS.currentTurn===GS.myRole;
}

function enableMyTurn() {
  GS.diceRolled=false;
  const btn=document.getElementById('rollBtn');
  btn.disabled=false;
  btn.textContent='🎲 ROLL DICE';
  document.getElementById('diceLabel').textContent='Your turn!';
  startTimer();
  updateStatus();
}

// ── FIX 6: Timer as shrinking bar on player panel ──
function startTimer() {
  GS.timerVal=TURN_TIME;
  updateTimerDisplay();
  GS.timer=setInterval(() => {
    GS.timerVal--;
    updateTimerDisplay();
    if (GS.timerVal<=3) playSound('tick');
    if (GS.timerVal<=0) {
      clearTimer();
      showToast("Time's up! Turn passed.", 'warning');
      nextTurn();
    }
  }, 1000);
}

function clearTimer() {
  if (GS.timer) { clearInterval(GS.timer); GS.timer=null; }
  // Hide both bars
  const w1=document.getElementById('pp1barWrap');
  const w2=document.getElementById('pp2barWrap');
  if (w1) w1.style.display='none';
  if (w2) w2.style.display='none';
}

// ── Timer bar: shows on the ACTIVE player's panel, shrinks over 10s ──
function updateTimerDisplay() {
  const myTurn = isMyTurn();
  const pct    = GS.timerVal / TURN_TIME; // 1.0 → 0.0
  const urgent = GS.timerVal<=3;

  // Which panel is active?
  const activePanel = (GS.mode==='computer' && GS.currentTurn==='p1') || myTurn ? 'p1' : 'p2';

  const w1=document.getElementById('pp1barWrap');
  const b1=document.getElementById('pp1bar');
  const w2=document.getElementById('pp2barWrap');
  const b2=document.getElementById('pp2bar');

  if (activePanel==='p1') {
    if (w1) { w1.style.display=''; }
    if (b1) { b1.style.width=(pct*100)+'%'; b1.className='pp-bar'+(urgent?' urgent':''); }
    if (w2) w2.style.display='none';
  } else {
    if (w2) { w2.style.display=''; }
    if (b2) { b2.style.width=(pct*100)+'%'; b2.className='pp-bar'+(urgent?' urgent':''); }
    if (w1) w1.style.display='none';
  }
}

function handleRoll() {
  if (!isMyTurn()||GS.diceRolled||GS.gameOver||GS.animating) return;
  clearTimer();
  const val=rollDice();
  GS.diceVal=val;
  playSound('dice');
  document.getElementById('rollBtn').disabled=true;
  document.getElementById('diceLabel').textContent='Rolling...';

  animateDice(val, () => {
    GS.diceRolled=true;
    document.getElementById('diceLabel').textContent=`Rolled: ${val}`;
    updateStatus(`Rolled ${val}! ${val===6?'🎲 Bonus roll':'Select a token'}`);
    checkMovableTokens();
  });
}

function checkMovableTokens() {
  const myColors=GS.currentTurn==='p1'?GS.p1Colors:GS.p2Colors;
  const movable=[];
  myColors.forEach(color => GS.tokens[color].forEach(t => { if(canTokenMove(t)) movable.push(t); }));
  if (movable.length===0) {
    updateStatus('No moves available');
    showToast('No moves!','warning');
    setTimeout(nextTurn, 1200);
  } else if (movable.length===1) {
    moveToken(movable[0]);
  } else {
    updateStatus('Select a token to move');
    drawBoard();
  }
}

function canTokenMove(token) {
  const dice=GS.diceVal;
  if (!dice) return false;
  const myColors=GS.currentTurn==='p1'?GS.p1Colors:GS.p2Colors;
  if (!myColors.includes(token.color)) return false;
  if (token.state==='finished') return false;
  if (token.state==='home') return dice===6;
  if (token.state==='homestretch') return token.homeStep+dice<=4;
  if (token.state==='active') {
    const newRelPos=token.relPos+dice;
    if (newRelPos>=52) return (newRelPos-52)<=4;
    return true;
  }
  return false;
}

function handleBoardClick(e) {
  if (!GS.diceRolled||!isMyTurn()||GS.gameOver||GS.animating) return;
  const canvas=document.getElementById('gameCanvas');
  const rect=canvas.getBoundingClientRect();
  const scaleX=canvas.width/rect.width, scaleY=canvas.height/rect.height;
  const mx=(e.clientX-rect.left)*scaleX, my=(e.clientY-rect.top)*scaleY;
  const cs=canvas.width/COLS;

  const myColors=GS.currentTurn==='p1'?GS.p1Colors:GS.p2Colors;
  let clicked=null, minDist=cs*0.65;
  myColors.forEach(color => {
    GS.tokens[color].forEach(token => {
      const pos=getTokenCanvasPos(token,cs);
      if (!pos) return;
      const dist=Math.hypot(pos.x-mx,pos.y-my);
      if (dist<minDist&&canTokenMove(token)) { minDist=dist; clicked=token; }
    });
  });

  if (clicked) {
    GS.selectedToken=clicked;
    drawBoard();
    setTimeout(()=>moveToken(clicked),150);
  }
}

// ════════════════════════════════
//  MOVE TOKEN
// ════════════════════════════════
function moveToken(token) {
  if (GS.animating) return;
  GS.animating=true; GS.selectedToken=null;
  clearTimer();
  const dice=GS.diceVal;

  if (token.state==='home') {
    token.state='active'; token.relPos=0;
    playSound('enter');
    updateStatus(`${CLR[token.color].label} enters the board!`);
  } else if (token.state==='active') {
    const newRelPos=token.relPos+dice;
    if (newRelPos>=52) {
      token.state='homestretch';
      token.homeStep=newRelPos-52;
      token.relPos=52;
      playSound('safe');
      updateStatus(`${CLR[token.color].label} in home stretch!`,'safe');
    } else {
      token.relPos=newRelPos;
      playSound('move');
    }
  } else if (token.state==='homestretch') {
    token.homeStep+=dice;
    if (token.homeStep>=5) {
      token.homeStep=5; token.state='finished';
      playSound('safe');
      updateStatus(`🏠 ${CLR[token.color].label} reached HOME!`,'safe');
    } else { playSound('move'); }
  }

  if (token.state==='active') checkCaptures(token);
  if (GS.mode!=='computer') pushGameState(GS.myRole).catch(console.error);

  drawBoard(); drawDice(dice);

  setTimeout(() => {
    GS.animating=false;
    if (checkWin()) return;
    if (dice===6) {
      updateStatus('🎲 Rolled 6 — roll again!');
      GS.diceRolled=false; GS.diceVal=null;
      drawDice(null);
      document.getElementById('rollBtn').disabled=false;
      document.getElementById('rollBtn').textContent='🎲 ROLL AGAIN';
      document.getElementById('diceLabel').textContent='Roll again!';
      startTimer();
    } else {
      nextTurn();
    }
  }, settings.anim?380:50);
}

function checkCaptures(movedToken) {
  const absIdx=(ENTRY_IDX[movedToken.color]+movedToken.relPos)%52;
  if (SAFE_ABS.has(absIdx)) return;
  const opColors=GS.currentTurn==='p1'?GS.p2Colors:GS.p1Colors;
  opColors.forEach(color => {
    GS.tokens[color].forEach(token => {
      if (token.state!=='active') return;
      const tokenAbs=(ENTRY_IDX[color]+token.relPos)%52;
      if (tokenAbs===absIdx && !SAFE_ABS.has(tokenAbs)) {
        token.state='home'; token.relPos=-1;
        playSound('capture');
        updateStatus(`💥 ${CLR[movedToken.color].label} captured ${CLR[color].label}!`,'cap');
        showToast(`Captured! ${CLR[movedToken.color].label} → home`,'success');
      }
    });
  });
}

function checkWin() {
  const p1Done=GS.p1Colors.every(c=>GS.tokens[c].every(t=>t.state==='finished'));
  const p2Done=GS.p2Colors.every(c=>GS.tokens[c].every(t=>t.state==='finished'));
  if (p1Done||p2Done) {
    GS.gameOver=true; clearTimer();
    const winner=p1Done?'p1':'p2';
    GS.winner=winner;
    const winName=winner==='p1'?GS.p1Name:GS.p2Name;
    const isMyWin=(GS.mode==='computer'&&winner==='p1')||(GS.mode!=='computer'&&winner===GS.myRole);
    localStorage.removeItem('ludoActiveRoom');
    setTimeout(()=>{ showWinScreen(winName,isMyWin); if(isMyWin&&GS.mode==='bet')creditWinnings(); if(GS.mode!=='computer')recordBetResult(winner); },600);
    return true;
  }
  return false;
}

function nextTurn() {
  GS.currentTurn=GS.currentTurn==='p1'?'p2':'p1';
  GS.diceVal=null; GS.diceRolled=false;
  drawDice(null); updatePanels(); startTurn();
}

function updatePanels() {
  const p1=GS.currentTurn==='p1';
  document.getElementById('panel1').classList.toggle('act', p1);
  document.getElementById('panel2').classList.toggle('act',!p1);

  const p1Fin=GS.p1Colors.reduce((a,c)=>a+GS.tokens[c].filter(t=>t.state==='finished').length,0);
  const p2Fin=GS.p2Colors.reduce((a,c)=>a+GS.tokens[c].filter(t=>t.state==='finished').length,0);
  const p1Tot=GS.p1Colors.length*4, p2Tot=GS.p2Colors.length*4;
  document.getElementById('pp1score').textContent=p1Fin+' / '+p1Tot;
  document.getElementById('pp2score').textContent=p2Fin+' / '+p2Tot;
}

// ── FIX 9: Calm, unhurried status messages ──
function updateStatus(msg, type='') {
  if (!msg) {
    const myTurn=isMyTurn();
    if (myTurn) {
      msg='Your turn — roll when ready';
      type='myturn';
    } else {
      const oppName=GS.currentTurn==='p1'?GS.p1Name:GS.p2Name;
      msg=`${oppName} is playing...`;
      type='';
    }
  }
  const el=document.getElementById('statusText');
  el.textContent=msg;
  el.className='status-pill'+(type?' '+type:'');
}

// ════════════════════════════════
//  COMPUTER AI
// ════════════════════════════════
function computerTurn() {
  if (GS.currentTurn!=='p2'||GS.gameOver) return;
  const val=rollDice();
  GS.diceVal=val;
  playSound('dice');
  document.getElementById('diceLabel').textContent=`AI rolled: ${val}`;
  updateStatus(`AI thinking...`);

  animateDice(val, () => {
    GS.diceRolled=true;
    const delay=GS.difficulty==='easy'?600:GS.difficulty==='expert'?1200:900;
    setTimeout(() => {
      const token=chooseBestMove(val);
      if (token) { GS.selectedToken=token; drawBoard(); setTimeout(()=>moveToken(token),280); }
      else { updateStatus('AI skips turn'); setTimeout(nextTurn, 1100); }
    }, delay);
  });
}

function chooseBestMove(dice) {
  const diff=GS.difficulty||'medium';
  const myColors=GS.p2Colors, oppColors=GS.p1Colors;
  const movable=[];
  myColors.forEach(color => GS.tokens[color].forEach(t=>{ if(canTokenMove(t)) movable.push(t); }));
  if (!movable.length) return null;
  if (diff==='easy') return movable[randInt(0,movable.length-1)];
  const scored=movable.map(t=>({t,score:scoreMove(t,dice,diff,oppColors)}));
  scored.sort((a,b)=>b.score-a.score);
  if (diff==='medium'&&Math.random()<0.2) return movable[randInt(0,movable.length-1)];
  return scored[0].t;
}

function scoreMove(token, dice, diff, oppColors) {
  let score=0;
  if (token.state==='homestretch') score+=600+token.homeStep*60;
  if (token.state==='active') score+=token.relPos*6;
  if (token.state==='home'&&dice===6) score+=120;
  if (token.state==='active') {
    const newRelPos=token.relPos+dice;
    const newAbsIdx=(ENTRY_IDX[token.color]+newRelPos)%52;
    oppColors.forEach(color => GS.tokens[color].forEach(opp => {
      if (opp.state==='active') {
        const oppAbs=(ENTRY_IDX[color]+opp.relPos)%52;
        if (oppAbs===newAbsIdx&&!SAFE_ABS.has(newAbsIdx)) score+=350+(diff==='expert'?250:0);
      }
    }));
    if (SAFE_ABS.has(newAbsIdx)) score+=90;
    if (diff==='hard'||diff==='expert') {
      if (!SAFE_ABS.has(newAbsIdx)) {
        oppColors.forEach(color => GS.tokens[color].forEach(opp => {
          if (opp.state==='active') {
            for (let d=1;d<=6;d++) {
              if ((ENTRY_IDX[color]+opp.relPos+d)%52===newAbsIdx) score-=130+(diff==='expert'?70:0);
            }
          }
        }));
      }
    }
  }
  return score;
}

// ════════════════════════════════
//  WIN SCREEN
// ════════════════════════════════
function showWinScreen(winnerName, isLocalWin) {
  playSound('win');
  document.getElementById('winTitle').textContent =
    isLocalWin ? '🏆 YOU WIN!' : winnerName+' Wins!';
  document.getElementById('winSubtitle').textContent =
    isLocalWin ? 'Outstanding! You crushed it!' : 'Better luck next time. Keep it up!';
  const winAmt=document.getElementById('winAmount');
  const winNum=document.getElementById('winAmountNum');
  if (isLocalWin&&GS.mode==='bet') {
    winAmt.style.display='';
    winNum.textContent=formatMoney(GS.betWin);
  } else {
    winAmt.style.display='none';
  }
  showScreen('winScreen');
  if (isLocalWin) spawnConfetti();
  stopBGMusic();
}

function spawnConfetti() {
  const c=document.getElementById('confettiContainer');
  c.innerHTML='';
  const cols=['#f97316','#ef4444','#22c55e','#3b82f6','#f59e0b','#8b5cf6'];
  for (let i=0;i<90;i++) {
    const el=document.createElement('div');
    el.style.cssText=`position:absolute;border-radius:${Math.random()>.5?'50%':'3px'};width:${randInt(6,14)}px;height:${randInt(6,14)}px;background:${cols[randInt(0,cols.length-1)]};left:${randInt(0,100)}%;top:-20px;opacity:.9;animation:confetti-fall ${1.5+Math.random()*2}s ${Math.random()*1.5}s ease-in forwards;`;
    c.appendChild(el);
  }
}

function closeWinScreen() { document.getElementById('confettiContainer').innerHTML=''; }

function playAgain() {
  closeWinScreen();
  if (GS.mode==='computer') startComputerGame();
  else showScreen('main');
}

// ════════════════════════════════
//  FIRESTORE: CREDIT & RECORD
// ════════════════════════════════
async function creditWinnings() {
  if (!currentUser||!GS.betWin) return;
  try {
    await db.runTransaction(async tx => {
      const ref=db.collection('balance').doc(currentUser.uid);
      tx.update(ref, {amount:firebase.firestore.FieldValue.increment(GS.betWin)});
    });
    await db.collection('ludo_transactions').add({
      uid:currentUser.uid, username, type:'win',
      stake:GS.betStake, amount:GS.betWin,
      roomId:GS.roomId,
      timestamp:firebase.firestore.FieldValue.serverTimestamp()
    });
    showToast(`₦${formatMoney(GS.betWin)} added to your balance!`,'success');
    loadUserStats();
  } catch(e) { console.error('Credit:', e); }
}

async function recordBetResult(winner) {
  if (!GS.roomId||GS.mode!=='bet') return;
  try {
    const winnerUid=winner==='p1'?GS.opponentUid:currentUser.uid;
    if (winner!==GS.myRole&&winnerUid) {
      await db.collection('balance').doc(winnerUid).update({
        amount:firebase.firestore.FieldValue.increment(GS.betWin)
      });
    }
    await db.collection('ludo_bet_rooms').doc(GS.roomId).update({
      winner, winnerUid, status:'completed',
      endedAt:firebase.firestore.FieldValue.serverTimestamp()
    });
  } catch(e) { console.error(e); }
}

// ════════════════════════════════
//  QUIT
// ════════════════════════════════
async function confirmQuit() {
  closeModal('quitConfirmModal');
  clearTimer();
  GS.gameOver=true;
  localStorage.removeItem('ludoActiveRoom');

  if (GS.mode==='bet'&&GS.roomId) {
    const oppRole=GS.myRole==='p1'?'p2':'p1';
    try {
      await db.collection('ludo_bet_rooms').doc(GS.roomId).update({
        winner:oppRole, status:'forfeit',
        endedAt:firebase.firestore.FieldValue.serverTimestamp()
      });
      if (GS.opponentUid) {
        await db.collection('balance').doc(GS.opponentUid).update({
          amount:firebase.firestore.FieldValue.increment(GS.betWin)
        });
      }
      showToast('You forfeited. Opponent wins the prize.','error');
    } catch(e) { console.error(e); }
  } else if (GS.mode==='friend'&&GS.roomId) {
    await db.collection('ludo_rooms').doc(GS.roomId).update({
      status:'forfeit', quitter:currentUser.uid
    }).catch(()=>{});
  }

  if (roomListener) { roomListener(); roomListener=null; }
  stopBGMusic();
  showScreen('main');
}

function handleRemoteWin(winner, isBet) {
  if (GS.gameOver) return;
  GS.gameOver=true; clearTimer();
  const isMyWin=winner===GS.myRole;
  const winName=winner==='p1'?GS.p1Name:GS.p2Name;
  showWinScreen(winName, isMyWin);
  if (isMyWin&&isBet) creditWinnings();
  localStorage.removeItem('ludoActiveRoom');
}

// ════════════════════════════════
//  AI CHAT SUPPORT — Advanced
// ════════════════════════════════
const FAQ = [
  { q:['how to roll','roll dice','rolling'],
    a:'Tap the 🎲 ROLL DICE button when it\'s your turn. The timer bar on your panel starts shrinking — you have 10 seconds!' },
  { q:['six','6','extra turn','roll again','bonus roll'],
    a:'Rolling a 6 gives you a bonus turn! Use it wisely — enter a new token, or push an active one forward. Three 6s in a row auto-passes.' },
  { q:['safe','star','⭐','protect'],
    a:'⭐ Safe squares protect your tokens. No opponent can capture you there. Your token\'s starting square is always safe.' },
  { q:['capture','knock','send back','kicked out'],
    a:'Land exactly on an opponent\'s token to send them back to base! They lose all progress. Can\'t capture on safe squares though.' },
  { q:['challenge','win','entry','prize','money','stake','wager','bet'],
    a:'In Challenge & Win mode, pay an entry fee and get matched with a real opponent. Winner takes the full prize! Choose from ₦50 to ₦2,000 entries.' },
  { q:['balance','coins','wallet','fund'],
    a:'Your balance syncs live from Globals. Top up via the main Globals platform. Ludo shows your real balance — no separate wallet needed.' },
  { q:['friend','room','code','join','host'],
    a:'Host a room to get a 4-digit code, share with your friend. They tap "vs Friend → Join" and type your code. Game starts instantly when they join!' },
  { q:['computer','ai','difficulty','easy','hard','expert'],
    a:'vs Computer has 4 levels:\n😊 Easy = random moves\n🤔 Medium = strategic\n🔥 Hard = aggressive, threat-aware\n👹 Expert = near-unbeatable!' },
  { q:['timer','10 seconds','countdown','time','time out'],
    a:'After rolling, a bar shrinks on your player panel — 10 seconds. Hit zero and your turn passes. You can still move tokens quickly during that time!' },
  { q:['quit','forfeit','leave'],
    a:'In Challenge mode, quitting forfeits your entry and the opponent wins. In friend games, your opponent wins. Free play? No stakes, quit anytime.' },
  { q:['win','finish','home','reach center','all tokens'],
    a:'Get ALL 4 tokens around the board and into the center home to win. Home stretch is the colored corridor leading inward. Need exact rolls for last steps!' },
  { q:['music','sound','mute','audio','beat'],
    a:'In Settings (⚙️), toggle Sound Effects and Background Music separately. Music uses a real drum-and-melody rhythm engine at 128 BPM!' },
  { q:['double','classic','board style','tokens'],
    a:'Classic = 4 tokens each (1 color). Double = 8 tokens each (2 colors). Double games take longer but are way more exciting!' },
  { q:['refund','cancel','no opponent'],
    a:'No match in 60 seconds? Your entry is fully refunded automatically. Or cancel anytime manually.' },
  { q:['tab','background','minimize','switch'],
    a:'The game keeps running even if you switch tabs or minimize the browser! Firebase stays connected. Just come back before the timer runs out.' },
  { q:['what is xp','level','experience','xp'],
    a:'Your XP level on the balance card grows with wins. Each 5 wins = next level. Just showing off your dedication 😄' }
];

function handleChatSend() {
  const input=document.getElementById('chatInput');
  const msg=input.value.trim();
  if (!msg) return;
  input.value='';
  addChatMsg(msg,'usr');
  setTimeout(() => addChatMsg(getChatReply(msg.toLowerCase()),'ai'), 350);
}

function getChatReply(msg) {
  for (const faq of FAQ) {
    if (faq.q.some(k=>msg.includes(k))) return faq.a;
  }
  if (msg.match(/^(hi|hey|hello|sup|yo)/)) {
    return `Hey ${username}! 👋 I'm your Globals Ludo guide. Ask me about rules, timers, challenge mode, room codes, or anything game-related!`;
  }
  if (msg.includes('help')||msg.includes('support')) {
    return `Sure thing! I cover: dice rules, the 10-second timer, challenge mode & prizes, room codes, safe squares, AI difficulty, music, and more. What's your question?`;
  }
  if (msg.includes('cheat')||msg.includes('hack')) {
    return `😄 No tricks here! Your best real advantage: spread your tokens early, always aim for safe squares, and capture aggressively. That's real skill!`;
  }
  if (msg.includes('thank')||msg.includes('thanks')||msg.includes('thx')) {
    return `Anytime! Good luck in your next game, ${username}! 🍀🎲`;
  }
  if (msg.includes('boring')||msg.includes('hard')) {
    return `Games can be tough! Try Easy mode to warm up, or invite a friend for some real competition. It gets way more fun when stakes are on!`;
  }
  return `Hmm, not sure about that one! Try asking about: timer, dice rules, challenge prizes, room codes, safe squares, capturing, or music. I'm here! 🎮`;
}

function addChatMsg(text, who) {
  const msgs=document.getElementById('chatMessages');
  const div=document.createElement('div');
  div.className='chat-msg '+who;
  div.innerHTML=`<div class="chat-bub">${text.replace(/\n/g,'<br>')}</div>`;
  msgs.appendChild(div);
  msgs.scrollTop=msgs.scrollHeight;
}

// ════════════════════════════════
//  ANIMATION LOOP
// ════════════════════════════════
function startAnimLoop() {
  function frame() {
    animPulse=(animPulse+1)%120;
    if (GS.diceRolled&&isMyTurn()&&!GS.gameOver&&document.getElementById('game').classList.contains('active')) {
      drawBoard();
    }
    animLoop=requestAnimationFrame(frame);
  }
  if (!animLoop) frame();
}

window.addEventListener('load', startAnimLoop);
