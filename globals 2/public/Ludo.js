/**
 * GLOBALS LUDO - Complete Game Engine v2.0
 * File: Ludo.js
 * Enhanced: Board, Timer (10s), Room logic, AI, Music, Background persistence
 */

'use strict';

// ════════════════════════════════════════════════════════════
//  CONSTANTS
// ════════════════════════════════════════════════════════════

const COLS = 15;
const TURN_TIME = 10; // 10 seconds per turn

// Main outer path (52 cells) — [row, col]
const MAIN_PATH = [
  [6,1],[6,2],[6,3],[6,4],[6,5],[5,6],[4,6],[3,6],[2,6],[1,6],
  [0,6],[0,7],[0,8],[1,8],[2,8],[3,8],[4,8],[5,8],[6,9],[6,10],
  [6,11],[6,12],[6,13],[6,14],[7,14],[8,14],[8,13],[8,12],[8,11],[8,10],
  [8,9],[9,8],[10,8],[11,8],[12,8],[13,8],[14,8],[14,7],[14,6],[13,6],
  [12,6],[11,6],[10,6],[9,6],[8,5],[8,4],[8,3],[8,2],[8,1],[8,0],
  [7,0],[6,0]
];

// Home stretch paths (5 cells → center)
const HOME_STRETCH = {
  red:    [[7,1],[7,2],[7,3],[7,4],[7,5]],
  green:  [[1,7],[2,7],[3,7],[4,7],[5,7]],
  yellow: [[7,13],[7,12],[7,11],[7,10],[7,9]],
  blue:   [[13,7],[12,7],[11,7],[10,7],[9,7]]
};

// Entry index in MAIN_PATH for each color
const ENTRY_IDX = { red:0, green:13, yellow:26, blue:39 };

// Home base token positions [row,col] (fractional = center within cell)
const HOME_BASE = {
  red:    [[1.5,1.5],[1.5,3.5],[3.5,1.5],[3.5,3.5]],
  green:  [[1.5,10.5],[1.5,12.5],[3.5,10.5],[3.5,12.5]],
  yellow: [[10.5,10.5],[10.5,12.5],[12.5,10.5],[12.5,12.5]],
  blue:   [[10.5,1.5],[10.5,3.5],[12.5,1.5],[12.5,3.5]]
};

// Safe square absolute indices
const SAFE_ABS = new Set([0,8,13,21,26,34,39,47]);

// Color definitions
const CLR = {
  red:    { fill:'#e53935', light:'#ffcdd2', dark:'#b71c1c', label:'Red',    safe:'#ef9a9a' },
  green:  { fill:'#43a047', light:'#c8e6c9', dark:'#1b5e20', label:'Green',  safe:'#a5d6a7' },
  yellow: { fill:'#fdd835', light:'#fff9c4', dark:'#f57f17', label:'Yellow', safe:'#fff176' },
  blue:   { fill:'#1e88e5', light:'#bbdefb', dark:'#0d47a1', label:'Blue',   safe:'#90caf9' }
};

// ════════════════════════════════════════════════════════════
//  STATE
// ════════════════════════════════════════════════════════════

let currentUser = null;
let userBalance  = 0;
let username     = 'Player';
let settings     = { sound:true, music:false, anim:true };
let unsubBalance = null;
let GS = {};
let roomListener  = null;
let matchListener = null;
let audioCtx      = null;
let bgNodes       = [];
let bgScheduled   = false;
let animLoop      = null;
let animPulse     = 0;
let userStats     = { wins:0, games:0, earned:0 };

// ════════════════════════════════════════════════════════════
//  INIT
// ════════════════════════════════════════════════════════════

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
  let p = 0;
  const iv = setInterval(() => {
    p += Math.random() * 9 + 3;
    if (p >= 100) { p = 100; clearInterval(iv); setTimeout(checkAuth, 300); }
    fill.style.width = p + '%';
    pct.textContent  = Math.floor(p) + '%';
  }, 80);
}

function checkAuth() {
  auth.onAuthStateChanged(user => {
    if (user) {
      currentUser = user;
      loadUserData().then(() => showScreen('main'));
    } else {
      showToast('Please log in to Globals first.', 'error');
      setTimeout(() => { window.location.href = '/index.html'; }, 2000);
    }
  });
}

async function loadUserData() {
  if (!currentUser) return;
  try {
    const snap = await db.collection('users').doc(currentUser.uid).get();
    if (snap.exists) {
      username = snap.data().username || currentUser.displayName || 'Player';
    }
    document.getElementById('usernameDisplay').textContent = username;
    document.getElementById('userAvatarMain').textContent = username[0].toUpperCase();
    subscribeBalance();
    loadUserStats();
    loadLeaderboard();
  } catch(e) { console.error(e); }
}

function subscribeBalance() {
  if (unsubBalance) unsubBalance();
  unsubBalance = db.collection('balance').doc(currentUser.uid).onSnapshot(snap => {
    if (snap.exists) {
      userBalance = snap.data().amount || 0;
      const el = document.getElementById('mainBalance');
      if (el) el.textContent = formatMoney(userBalance);
    }
  }, err => console.error(err));
}

async function loadUserStats() {
  try {
    const snaps = await db.collection('ludo_transactions')
      .where('uid','==',currentUser.uid).get();
    let wins = 0, earned = 0, games = 0;
    snaps.forEach(d => {
      const data = d.data();
      if (data.type === 'win' || data.type === 'ludo_win' || data.type === 'ludo_win_forfeit') {
        wins++;
        earned += data.amount || 0;
      }
    });
    // Count games from rooms
    userStats = { wins, games: wins, earned };
    const sw = document.getElementById('statWins');
    const se = document.getElementById('statEarned');
    const sg = document.getElementById('statGames');
    if (sw) sw.textContent = wins;
    if (sg) sg.textContent = wins;
    if (se) se.textContent = '₦' + (earned >= 1000 ? (earned/1000).toFixed(1) + 'k' : earned);
  } catch(e) {}
}

async function loadLeaderboard() {
  try {
    const snap = await db.collection('ludo_transactions')
      .where('type','==','win')
      .orderBy('amount','desc').limit(5).get();
    const rows = document.getElementById('leaderRows');
    if (!rows) return;
    if (snap.empty) { rows.innerHTML = '<div class="leader-row" style="justify-content:center;color:var(--muted);font-size:.78rem;">No wins yet. Be first!</div>'; return; }
    const medals = ['🥇','🥈','🥉','4️⃣','5️⃣'];
    rows.innerHTML = snap.docs.map((d,i) => {
      const data = d.data();
      const n = data.username || 'Anonymous';
      return `<div class="leader-row">
        <div class="leader-rank">${medals[i]||i+1}</div>
        <div class="leader-ava">${n[0].toUpperCase()}</div>
        <div class="leader-uname">${n}</div>
        <div class="leader-amt">₦${formatMoney(data.amount)}</div>
      </div>`;
    }).join('');
  } catch(e) {}
}

// ════════════════════════════════════════════════════════════
//  PAGE VISIBILITY (game persists when user switches tabs)
// ════════════════════════════════════════════════════════════

function setupPageVisibility() {
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      // Tab hidden — pause timer if it's my turn (auto-pass handled server-side in future)
      // Firebase listeners keep running regardless
      if (GS.timer && isMyTurn() && !GS.gameOver) {
        // Store time when hidden
        GS._hiddenAt = Date.now();
        GS._hiddenTimerVal = GS.timerVal;
      }
    } else {
      // Tab visible again — sync timer
      if (GS._hiddenAt && !GS.gameOver && GS.timer) {
        const elapsed = Math.floor((Date.now() - GS._hiddenAt) / 1000);
        GS.timerVal = Math.max(0, (GS._hiddenTimerVal || TURN_TIME) - elapsed);
        GS._hiddenAt = null;
        if (GS.timerVal <= 0 && GS.timer) {
          clearTimer();
          showToast("Time's up!", 'warning');
          nextTurn();
        } else {
          updateTimerDisplay();
        }
      }
      // Reconnect to active game if needed
      if (GS.roomId && !roomListener && !GS.gameOver) {
        const isBet = GS.mode === 'bet';
        startRoomListener(GS.roomId, isBet);
      }
    }
  });

  // Save active game to localStorage for reconnect
  window.addEventListener('beforeunload', () => {
    if (GS.roomId && !GS.gameOver) {
      localStorage.setItem('ludoActiveRoom', JSON.stringify({
        roomId: GS.roomId, mode: GS.mode, myRole: GS.myRole, ts: Date.now()
      }));
    } else {
      localStorage.removeItem('ludoActiveRoom');
    }
  });
}

// ════════════════════════════════════════════════════════════
//  SCREEN / MODAL
// ════════════════════════════════════════════════════════════

function showScreen(id) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById(id).classList.add('active');
}
function openModal(id) { document.getElementById(id).classList.add('open'); }
function closeModal(id) { document.getElementById(id).classList.remove('open'); }

// ════════════════════════════════════════════════════════════
//  LOADING BOARD ANIMATION (mini canvas)
// ════════════════════════════════════════════════════════════

function animateLoadingBoard() {
  const c = document.getElementById('ludominiCanvas');
  if (!c) return;
  const ctx = c.getContext('2d');
  const colors = ['#e53935','#43a047','#fdd835','#1e88e5'];
  const positions = [[5,5],[54,5],[5,54],[54,54]];
  let frame = 0;
  function draw() {
    ctx.clearRect(0,0,100,100);
    // Board bg
    ctx.fillStyle = '#1a2d4a';
    roundRect(ctx,0,0,100,100,12); ctx.fill();
    // Center cross
    ctx.fillStyle = 'rgba(255,255,255,0.06)';
    ctx.fillRect(38,0,24,100); ctx.fillRect(0,38,100,24);
    // 4 corners
    positions.forEach(([x,y],i) => {
      ctx.fillStyle = colors[i] + '33';
      roundRect(ctx,x,y,36,36,8); ctx.fill();
      ctx.fillStyle = '#fff2';
      roundRect(ctx,x+4,y+4,28,28,5); ctx.fill();
      // Bouncing token
      const off = Math.sin(frame*0.1 + i*Math.PI/2) * 5;
      ctx.beginPath();
      ctx.arc(x+18, y+18+off, 9, 0, Math.PI*2);
      ctx.fillStyle = colors[i];
      ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,0.4)';
      ctx.lineWidth = 1.5;
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(x+14, y+13+off, 3, 0, Math.PI*2);
      ctx.fillStyle = 'rgba(255,255,255,0.5)';
      ctx.fill();
    });
    frame++;
    requestAnimationFrame(draw);
  }
  draw();
}

function roundRect(ctx, x,y,w,h,r) {
  ctx.beginPath();
  ctx.moveTo(x+r,y);
  ctx.lineTo(x+w-r,y); ctx.quadraticCurveTo(x+w,y,x+w,y+r);
  ctx.lineTo(x+w,y+h-r); ctx.quadraticCurveTo(x+w,y+h,x+w-r,y+h);
  ctx.lineTo(x+r,y+h); ctx.quadraticCurveTo(x,y+h,x,y+h-r);
  ctx.lineTo(x,y+r); ctx.quadraticCurveTo(x,y,x+r,y);
  ctx.closePath();
}

// ════════════════════════════════════════════════════════════
//  4-DIGIT CODE INPUT (friend room join)
// ════════════════════════════════════════════════════════════

function setupCodeInput() {
  const hidden = document.getElementById('joinCodeInputHidden');
  const boxes  = [0,1,2,3].map(i => document.getElementById('cb'+i));
  const codeWrap = document.getElementById('codeInputs');

  function updateBoxes(val) {
    for (let i=0;i<4;i++) {
      boxes[i].textContent = val[i] || '_';
      boxes[i].className = 'code-box' + (val[i] ? ' filled' : '');
    }
  }

  if (codeWrap) {
    codeWrap.addEventListener('click', () => {
      hidden.focus();
    });
  }
  if (hidden) {
    hidden.addEventListener('input', () => {
      const v = hidden.value.replace(/\D/g,'').slice(0,4);
      hidden.value = v;
      updateBoxes(v);
    });
  }
}

// ════════════════════════════════════════════════════════════
//  UI SETUP
// ════════════════════════════════════════════════════════════

function setupUI() {
  // Main menu
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

  // Bet modal
  document.querySelectorAll('.bet-card').forEach(card => {
    card.onclick = () => {
      document.querySelectorAll('.bet-card').forEach(c => c.classList.remove('sel'));
      card.classList.add('sel');
      const s = card.dataset.stake, w = card.dataset.win;
      GS.betStake = parseInt(s); GS.betWin = parseInt(w);
      document.getElementById('selectedBetInfo').innerHTML =
        `Stake <strong>₦${s}</strong> → Win <strong style="color:var(--green)">₦${w}</strong>`;
      document.getElementById('startSearchBtn').disabled = false;
    };
  });
  document.getElementById('startSearchBtn').onclick = startBetSearch;
  document.getElementById('cancelMatchBtn').onclick = cancelBetSearch;

  // Game controls
  document.getElementById('rollBtn').onclick     = handleRoll;
  document.getElementById('quitBtn').onclick     = () => openModal('quitConfirmModal');
  document.getElementById('quitGameBtn').onclick = () => openModal('quitConfirmModal');
  document.getElementById('gameSettingsBtn').onclick = () => openModal('settingsModal');
  document.getElementById('gameChatBtn').onclick     = () => openModal('chatModal');
  document.getElementById('confirmQuitBtn').onclick  = confirmQuit;
  document.getElementById('cancelQuitBtn').onclick   = () => closeModal('quitConfirmModal');
  document.getElementById('gameCanvas').onclick      = handleBoardClick;

  // Win screen
  document.getElementById('winPlayAgain').onclick = playAgain;
  document.getElementById('winMainMenu').onclick  = () => { closeWinScreen(); showScreen('main'); };

  // Settings toggles
  ['sound','music','anim'].forEach(k => {
    document.getElementById(k+'Toggle').onclick = function() {
      this.classList.toggle('on');
      settings[k] = this.classList.contains('on');
      saveSettings();
      if (k === 'music') settings.music ? startBGMusic() : stopBGMusic();
    };
  });
  document.getElementById('settingsClose').onclick = () => closeModal('settingsModal');
  document.getElementById('termsSettingsBtn').onclick = () => { closeModal('settingsModal'); openModal('termsModal'); };
  document.getElementById('privacySettingsBtn').onclick = () => { closeModal('settingsModal'); openModal('privacyModal'); };

  // Modal closes
  const modalClosePairs = {
    termsClose:'termsModal', privacyClose:'privacyModal',
    tutorialClose:'tutorialModal', chatClose:'chatModal'
  };
  Object.entries(modalClosePairs).forEach(([btnId,modalId]) => {
    const el = document.getElementById(btnId);
    if (el) el.onclick = () => closeModal(modalId);
  });

  // Chat
  document.getElementById('chatSendBtn').onclick    = handleChatSend;
  document.getElementById('chatInput').onkeypress   = e => { if(e.key==='Enter') handleChatSend(); };

  // Network
  document.getElementById('retryConnectionBtn').onclick = () => {
    if (navigator.onLine) closeModal('noInternetModal');
    else showToast('Still offline. Check your connection.', 'error');
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

// ════════════════════════════════════════════════════════════
//  SETTINGS
// ════════════════════════════════════════════════════════════

function loadSettings() {
  try {
    const s = JSON.parse(localStorage.getItem('ludoSettings') || '{}');
    settings = { sound: s.sound!==false, music: s.music||false, anim: s.anim!==false };
  } catch(e) {}
}
function saveSettings() { localStorage.setItem('ludoSettings', JSON.stringify(settings)); }
function applySettings() {
  document.getElementById('soundToggle').classList.toggle('on', settings.sound);
  document.getElementById('musicToggle').classList.toggle('on', settings.music);
  document.getElementById('animToggle').classList.toggle('on', settings.anim);
}

// ════════════════════════════════════════════════════════════
//  ADVANCED AUDIO ENGINE
// ════════════════════════════════════════════════════════════

function getAC() {
  if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  if (audioCtx.state === 'suspended') audioCtx.resume();
  return audioCtx;
}

function playSound(type) {
  if (!settings.sound) return;
  try {
    const ac = getAC();
    const now = ac.currentTime;
    const sounds = {
      dice:    { notes:[220,440,330],   dur:0.12, type:'square',   vol:0.15 },
      move:    { notes:[523,659],       dur:0.1,  type:'sine',     vol:0.12 },
      capture: { notes:[300,200,150],   dur:0.25, type:'sawtooth', vol:0.18 },
      win:     { notes:[523,659,784,1047,1318], dur:0.45, type:'sine', vol:0.15 },
      safe:    { notes:[440,880],       dur:0.12, type:'sine',     vol:0.1  },
      enter:   { notes:[330,660,990],   dur:0.25, type:'sine',     vol:0.13 },
      tick:    { notes:[1200],          dur:0.04, type:'square',   vol:0.08 }
    };
    const s = sounds[type] || sounds.move;
    const gain = ac.createGain();
    gain.connect(ac.destination);
    gain.gain.setValueAtTime(s.vol, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + s.dur * s.notes.length + 0.1);

    s.notes.forEach((freq, i) => {
      const osc = ac.createOscillator();
      osc.connect(gain);
      osc.type = s.type;
      osc.frequency.setValueAtTime(freq, now + i * (s.dur / s.notes.length));
      osc.start(now + i * (s.dur / s.notes.length));
      osc.stop(now  + (i+1) * (s.dur / s.notes.length) + 0.05);
    });
  } catch(e) {}
}

// Advanced background music: rhythm + melody
let bgMusicInterval = null;
let bgBeat = 0;

function startBGMusic() {
  stopBGMusic();
  if (!settings.music) return;
  try {
    const ac = getAC();
    const melody = [523,587,659,698,784,880,987,880,784,698,659,587];
    const drums  = [1,0,0,1,0,1,0,0,1,0,1,0];
    const BPM = 128;
    const sixteenth = 60 / BPM / 4;

    function scheduleBeat() {
      if (!settings.music) return;
      const now = ac.currentTime;
      const idx = bgBeat % melody.length;

      // Kick drum
      if (drums[idx]) {
        const kick = ac.createOscillator();
        const kg = ac.createGain();
        kick.connect(kg); kg.connect(ac.destination);
        kick.frequency.setValueAtTime(150, now);
        kick.frequency.exponentialRampToValueAtTime(40, now + 0.15);
        kg.gain.setValueAtTime(0.3, now);
        kg.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
        kick.start(now); kick.stop(now + 0.2);
      }

      // Hi-hat (every beat)
      {
        const hh = ac.createOscillator();
        const hg = ac.createGain();
        const filter = ac.createBiquadFilter();
        filter.type = 'highpass'; filter.frequency.value = 8000;
        hh.connect(filter); filter.connect(hg); hg.connect(ac.destination);
        hh.type = 'square';
        hh.frequency.value = 400 + Math.random()*100;
        hg.gain.setValueAtTime(bgBeat%2===0 ? 0.03 : 0.015, now);
        hg.gain.exponentialRampToValueAtTime(0.001, now + sixteenth*0.8);
        hh.start(now); hh.stop(now + sixteenth*0.8);
      }

      // Melody note (every 2 beats)
      if (bgBeat % 2 === 0) {
        const noteFreq = melody[Math.floor(idx/2) % melody.length];
        const osc = ac.createOscillator();
        const og = ac.createGain();
        osc.connect(og); og.connect(ac.destination);
        osc.type = 'triangle';
        osc.frequency.value = noteFreq * 0.5;
        og.gain.setValueAtTime(0.04, now);
        og.gain.exponentialRampToValueAtTime(0.001, now + sixteenth*1.8);
        osc.start(now); osc.stop(now + sixteenth*2);
      }

      // Bass on beats 1 and 3
      if (bgBeat % 4 === 0 || bgBeat % 4 === 2) {
        const bass = ac.createOscillator();
        const bg2 = ac.createGain();
        bass.connect(bg2); bg2.connect(ac.destination);
        bass.type = 'sine';
        bass.frequency.value = 65 + (bgBeat%4===2 ? 12 : 0);
        bg2.gain.setValueAtTime(0.12, now);
        bg2.gain.exponentialRampToValueAtTime(0.001, now + sixteenth*1.5);
        bass.start(now); bass.stop(now + sixteenth*1.5);
      }

      bgBeat++;
    }

    scheduleBeat();
    bgMusicInterval = setInterval(() => {
      if (settings.music && audioCtx) scheduleBeat();
      else stopBGMusic();
    }, Math.round(sixteenth * 1000));
  } catch(e) { console.error('Music error', e); }
}

function stopBGMusic() {
  if (bgMusicInterval) { clearInterval(bgMusicInterval); bgMusicInterval = null; }
  bgBeat = 0;
}

// ════════════════════════════════════════════════════════════
//  NETWORK
// ════════════════════════════════════════════════════════════

function checkNetwork() { if (!navigator.onLine) openModal('noInternetModal'); }
function setupNetworkDetection() {
  window.addEventListener('offline', () => openModal('noInternetModal'));
  window.addEventListener('online',  () => closeModal('noInternetModal'));
}

// ════════════════════════════════════════════════════════════
//  TOAST
// ════════════════════════════════════════════════════════════

let _toastTimeout;
function showToast(msg, type='') {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.className = 'toast show' + (type ? ' '+type : '');
  clearTimeout(_toastTimeout);
  _toastTimeout = setTimeout(() => t.classList.remove('show'), 3200);
}

// ════════════════════════════════════════════════════════════
//  HELPERS
// ════════════════════════════════════════════════════════════

function formatMoney(n) { return Number(n).toLocaleString('en-NG',{minimumFractionDigits:2}); }
function randInt(mn,mx) { return Math.floor(Math.random()*(mx-mn+1))+mn; }
function rollDice()     { return randInt(1,6); }

// ════════════════════════════════════════════════════════════
//  GAME STATE
// ════════════════════════════════════════════════════════════

function createToken(color, id) {
  return { color, id, state:'home', relPos:-1, homeStep:-1 };
}

function initGameState(mode, opts={}) {
  let p1Colors, p2Colors;
  if (opts.boardStyle === 'double') {
    p1Colors = ['red','blue'];
    p2Colors = ['green','yellow'];
  } else {
    p1Colors = ['red'];
    p2Colors = ['green'];
  }

  const tokens = {};
  [...p1Colors,...p2Colors].forEach(color => {
    tokens[color] = [0,1,2,3].map(i => createToken(color,i));
  });

  GS = {
    mode,
    boardStyle: opts.boardStyle || 'classic',
    difficulty: opts.difficulty || 'medium',
    p1Colors, p2Colors, tokens,
    currentTurn: 'p1',
    diceVal: null,
    diceRolled: false,
    selectedToken: null,
    timer: null, timerVal: TURN_TIME,
    gameOver: false,
    winner: null,
    roomId:      opts.roomId || null,
    betStake:    opts.betStake || 0,
    betWin:      opts.betWin  || 0,
    isHost:      opts.isHost  || false,
    myRole:      opts.myRole  || 'p1',
    opponentUid: opts.opponentUid || null,
    p1Name:      opts.p1Name || username,
    p2Name:      opts.p2Name || (mode==='computer' ? 'AI Opponent' : 'Opponent'),
    animating:   false,
    _hiddenAt:   null, _hiddenTimerVal: null
  };
}

// ════════════════════════════════════════════════════════════
//  START GAME MODES
// ════════════════════════════════════════════════════════════

function startComputerGame() {
  const diff  = document.querySelector('#difficultyGrid .opt-item.sel')?.dataset.diff || 'medium';
  const style = document.querySelector('#boardStyleGrid .opt-item.sel')?.dataset.style || 'classic';
  closeModal('computerModal');
  initGameState('computer', { difficulty:diff, boardStyle:style });
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
    createdAt: firebase.firestore.FieldValue.serverTimestamp()
  };

  try {
    await db.collection('ludo_rooms').doc(code).set(roomData);
    GS.roomId = code;
    GS.isHost = true;

    // Listen for guest joining
    roomListener = db.collection('ludo_rooms').doc(code).onSnapshot(snap => {
      const d = snap.data();
      if (!d) return;
      if (d.guest && (d.status==='ready'||d.status==='playing')) {
        document.getElementById('guestSlot').innerHTML = `<div class="rp-icon" style="color:var(--green)">✅</div><div>${d.guestName||'Guest'}</div>`;
        document.getElementById('guestSlot').classList.add('rp-filled');

        if (d.status === 'ready') {
          if (roomListener) { roomListener(); roomListener=null; }
          closeModal('friendModal');

          initGameState('friend', {
            boardStyle: style, roomId: code,
            isHost: true, myRole: 'p1',
            p2Name: d.guestName || 'Guest',
            opponentUid: d.guest
          });
          setupGameScreen();
          showScreen('game');
          if (settings.music) startBGMusic();

          // Update to playing and start room listener for game sync
          db.collection('ludo_rooms').doc(code).update({ status:'playing' });
          startRoomListener(code, false);
          startTurn();
        }
      }
    }, e => showToast('Room error: '+e.message,'error'));
  } catch(e) { showToast('Error creating room: '+e.message,'error'); }
}

async function joinGame() {
  if (!currentUser) return;
  const hidden = document.getElementById('joinCodeInputHidden');
  const code   = (hidden ? hidden.value : '').trim().replace(/\D/g,'');
  if (code.length !== 4) { showToast('Enter a valid 4-digit code','error'); return; }

  try {
    const snap = await db.collection('ludo_rooms').doc(code).get();
    if (!snap.exists)          { showToast('Room not found','error'); return; }
    const d = snap.data();
    if (d.status !== 'waiting') { showToast('Room already started or full','error'); return; }
    if (d.host === currentUser.uid) { showToast("Can't join your own room",'error'); return; }

    await db.collection('ludo_rooms').doc(code).update({
      guest: currentUser.uid, guestName: username, status:'ready'
    });

    closeModal('friendModal');
    initGameState('friend', {
      boardStyle: d.boardStyle||'classic', roomId:code,
      isHost:false, myRole:'p2',
      p1Name: d.hostName||'Host', opponentUid:d.host
    });
    setupGameScreen();
    showScreen('game');
    if (settings.music) startBGMusic();
    startTurn();
    startRoomListener(code, false);
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

// ════════════════════════════════════════════════════════════
//  BET MATCHMAKING
// ════════════════════════════════════════════════════════════

let matchSearchInterval = null;
let matchSearchElapsed  = 0;

async function startBetSearch() {
  if (!currentUser) return;
  const stake = GS.betStake;
  if (!stake) { showToast('Select a stake amount','error'); return; }
  if (userBalance < stake) { showToast('Insufficient balance. Deposit via Globals app.','error'); return; }

  closeModal('betModal');
  document.getElementById('matchStakeDisplay').textContent = `₦${stake} Stake`;
  document.getElementById('matchDesc').textContent = `Searching for ₦${stake} opponent...`;
  openModal('matchmakingModal');
  matchSearchElapsed = 0;

  try {
    await db.runTransaction(async tx => {
      const ref = db.collection('balance').doc(currentUser.uid);
      const snap = await tx.get(ref);
      const bal = snap.data()?.amount || 0;
      if (bal < stake) throw new Error('Insufficient balance');
      tx.update(ref, { amount: firebase.firestore.FieldValue.increment(-stake) });
    });

    await db.collection('ludo_matchmaking').doc(currentUser.uid).set({
      uid:currentUser.uid, username, stake,
      status:'searching',
      createdAt: firebase.firestore.FieldValue.serverTimestamp(),
      roomId:null
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
      document.getElementById('matchTimer').textContent = matchSearchElapsed+'s';
      if (matchSearchElapsed >= 60) cancelBetSearch(true);
    }, 1000);

    tryMatchmaking(stake);
  } catch(e) {
    showToast(e.message || 'Search error','error');
    closeModal('matchmakingModal');
  }
}

async function tryMatchmaking(stake) {
  try {
    const cutoff = new Date(Date.now() - 60000);
    const snap = await db.collection('ludo_matchmaking')
      .where('stake','==',stake)
      .where('status','==','searching')
      .orderBy('createdAt','asc').get();

    const candidates = snap.docs.filter(d =>
      d.id !== currentUser.uid && d.data().createdAt?.toDate() > cutoff
    );

    if (candidates.length > 0) {
      const opponent = candidates[0];
      const oppData  = opponent.data();
      const roomId   = 'bet_' + Date.now();
      const winAmount = GS.betWin;

      await db.runTransaction(async tx => {
        const myRef  = db.collection('ludo_matchmaking').doc(currentUser.uid);
        const oppRef = db.collection('ludo_matchmaking').doc(opponent.id);
        const oppSnap = await tx.get(oppRef);
        if (!oppSnap.exists || oppSnap.data().status !== 'searching') return;

        const roomRef = db.collection('ludo_bet_rooms').doc(roomId);
        tx.set(roomRef, {
          p1:opponent.id, p1Name:oppData.username,
          p2:currentUser.uid, p2Name:username,
          stake, winAmount, status:'playing',
          createdAt: firebase.firestore.FieldValue.serverTimestamp(),
          gameState:null, winner:null
        });
        tx.update(oppRef, { status:'matched', roomId, role:'p1', winAmount });
        tx.update(myRef,  { status:'matched', roomId, role:'p2', winAmount });
      });
    }
  } catch(e) { console.error('Matchmaking error:', e); }
}

async function cancelBetSearch(refund=true) {
  clearInterval(matchSearchInterval);
  if (matchListener) { matchListener(); matchListener=null; }
  closeModal('matchmakingModal');

  if (currentUser) {
    try {
      const doc = await db.collection('ludo_matchmaking').doc(currentUser.uid).get();
      if (doc.exists && doc.data().status === 'searching') {
        await db.collection('ludo_matchmaking').doc(currentUser.uid).delete();
        if (refund) {
          await db.collection('balance').doc(currentUser.uid).update({
            amount: firebase.firestore.FieldValue.increment(GS.betStake||0)
          });
          showToast('No match found. Stake refunded ✓','warning');
        }
      }
    } catch(e) { console.error(e); }
  }
}

async function joinBetRoom(roomId, stake, winAmount, role) {
  try {
    const snap = await db.collection('ludo_bet_rooms').doc(roomId).get();
    const d = snap.data();
    initGameState('bet', {
      boardStyle:'classic', roomId, isHost:role==='p1', myRole:role,
      betStake:stake, betWin:winAmount,
      p1Name:d.p1Name, p2Name:d.p2Name,
      opponentUid: role==='p1' ? d.p2 : d.p1
    });
    setupGameScreen();
    showScreen('game');
    if (settings.music) startBGMusic();
    startTurn();
    startRoomListener(roomId, true);
  } catch(e) { showToast('Error joining bet room','error'); }
}

// ════════════════════════════════════════════════════════════
//  ROOM LISTENER (multiplayer sync)
// ════════════════════════════════════════════════════════════

function startRoomListener(roomId, isBet=false) {
  if (roomListener) { roomListener(); roomListener=null; }
  const col = isBet ? 'ludo_bet_rooms' : 'ludo_rooms';
  roomListener = db.collection(col).doc(roomId).onSnapshot(snap => {
    if (!snap.exists) return;
    const d = snap.data();
    if (d.gameState && GS.myRole !== d.gameState.lastActor) {
      syncRemoteState(d.gameState);
    }
    if (d.winner && !GS.gameOver) {
      handleRemoteWin(d.winner, isBet);
    }
  }, e => console.error('Room listen error:', e));
}

function syncRemoteState(remote) {
  if (!remote || GS.gameOver) return;
  GS.tokens       = remote.tokens;
  GS.currentTurn  = remote.currentTurn;
  GS.diceVal      = remote.diceVal;
  GS.diceRolled   = false;
  clearTimer();
  drawBoard();
  drawDice(remote.diceVal);
  updatePanels();
  if (remote.currentTurn === GS.myRole) {
    enableMyTurn();
  } else {
    document.getElementById('rollBtn').disabled = true;
    document.getElementById('rollBtn').textContent = 'Waiting...';
    updateStatus();
  }
}

async function pushGameState(lastActor) {
  if (!GS.roomId) return;
  const col = GS.mode==='bet' ? 'ludo_bet_rooms' : 'ludo_rooms';
  await db.collection(col).doc(GS.roomId).update({
    gameState: { tokens:GS.tokens, currentTurn:GS.currentTurn, diceVal:GS.diceVal, lastActor }
  }).catch(e => console.error('Push error:', e));
}

// ════════════════════════════════════════════════════════════
//  GAME SCREEN SETUP
// ════════════════════════════════════════════════════════════

function setupGameScreen() {
  resizeCanvas();

  const modeLbl = { computer:'vs AI', friend:'vs Friend', bet:'Bet Match' };
  const modeClass = { computer:'badge-ai', friend:'badge-friend', bet:'badge-bet' };
  const badge = document.getElementById('gameModeLabel');
  badge.textContent = modeLbl[GS.mode]||'Game';
  badge.className = 'gh-badge ' + (modeClass[GS.mode]||'badge-ai');

  document.getElementById('pp1name').textContent = GS.p1Name;
  document.getElementById('pp2name').textContent = GS.p2Name;

  const qNote = document.getElementById('quitNote');
  if (qNote) qNote.textContent = GS.mode==='bet'
    ? '(Opponent wins & you forfeit stake.)'
    : GS.mode==='friend' ? '(Opponent wins.)' : '';

  drawBoard();
  drawDice(null);
  updatePanels();
}

function resizeCanvas() {
  const wrap = document.querySelector('.board-wrap');
  if (!wrap) return;
  const available = Math.min(wrap.clientWidth-16, wrap.clientHeight-8);
  const size = Math.min(available, 480);
  const canvas = document.getElementById('gameCanvas');
  canvas.width  = size;
  canvas.height = size;
}

window.addEventListener('resize', () => {
  if (document.getElementById('game').classList.contains('active')) {
    resizeCanvas();
    drawBoard();
  }
});

// ════════════════════════════════════════════════════════════
//  ═══ BOARD DRAWING — Authentic Ludo Style ═══
// ════════════════════════════════════════════════════════════

function drawBoard() {
  const canvas = document.getElementById('gameCanvas');
  const ctx    = canvas.getContext('2d');
  const W = canvas.width;
  const cs = W / COLS;

  ctx.clearRect(0,0,W,W);

  // Board background (cream/white like a real Ludo board)
  ctx.fillStyle = '#f5f0e8';
  ctx.fillRect(0,0,W,W);

  // Draw all cells
  for (let r=0;r<COLS;r++) {
    for (let c=0;c<COLS;c++) {
      drawCell(ctx, r, c, cs);
    }
  }

  // Draw center
  drawCenter(ctx, cs);

  // Draw grid lines over the path
  for (let r=0;r<COLS;r++) {
    for (let c=0;c<COLS;c++) {
      const info = getCellType(r,c);
      if (info.type==='path' || info.type==='safe' || info.type==='stretch' || info.type.startsWith('start')) {
        ctx.strokeStyle = 'rgba(0,0,0,0.12)';
        ctx.lineWidth   = 0.5;
        ctx.strokeRect(c*cs, r*cs, cs, cs);
      }
    }
  }

  // Board outer border
  ctx.strokeStyle = 'rgba(0,0,0,0.3)';
  ctx.lineWidth   = 2;
  ctx.strokeRect(1,1,W-2,W-2);

  // Draw tokens on top
  drawAllTokens(ctx, cs);
}

function getCellType(r,c) {
  // Corners
  if (r<=5 && c<=5) return {type:'corner', color:'red'};
  if (r<=5 && c>=9) return {type:'corner', color:'green'};
  if (r>=9 && c>=9) return {type:'corner', color:'yellow'};
  if (r>=9 && c<=5) return {type:'corner', color:'blue'};

  // Center
  if (r>=6&&r<=8&&c>=6&&c<=8) return {type:'center'};

  // Home stretches
  for (const [color, cells] of Object.entries(HOME_STRETCH)) {
    if (cells.some(([hr,hc]) => hr===r && hc===c)) {
      const stepIdx = cells.findIndex(([hr,hc]) => hr===r && hc===c);
      return {type:'stretch', color, stepIdx};
    }
  }

  // Main path
  const pathIdx = MAIN_PATH.findIndex(([pr,pc]) => pr===r && pc===c);
  if (pathIdx !== -1) {
    if (pathIdx===0)  return {type:'start_red',    pathIdx, safe:true};
    if (pathIdx===13) return {type:'start_green',  pathIdx, safe:true};
    if (pathIdx===26) return {type:'start_yellow', pathIdx, safe:true};
    if (pathIdx===39) return {type:'start_blue',   pathIdx, safe:true};
    if (SAFE_ABS.has(pathIdx)) return {type:'safe', pathIdx, safe:true};
    return {type:'path', pathIdx};
  }

  return {type:'inactive'};
}

function drawCell(ctx, r, c, cs) {
  const info = getCellType(r,c);
  const x=c*cs, y=r*cs;

  if (info.type === 'center') return;
  if (info.type === 'inactive') {
    // Small filler area between corners
    ctx.fillStyle = '#e8e3d8';
    ctx.fillRect(x,y,cs,cs);
    return;
  }

  if (info.type === 'corner') {
    drawCornerCell(ctx, r, c, cs, info.color);
    return;
  }

  if (info.type === 'stretch') {
    ctx.fillStyle = CLR[info.color].fill;
    ctx.fillRect(x,y,cs,cs);
    // Draw arrow toward center
    if (info.stepIdx === 4) {
      // Last stretch cell - star to indicate goal
      drawBoardStar(ctx, x+cs/2, y+cs/2, cs*0.32, '#fff', 0.5);
    } else {
      drawStretchArrow(ctx, r, c, cs, info.color);
    }
    return;
  }

  if (info.type.startsWith('start_')) {
    const color = info.type.replace('start_','');
    ctx.fillStyle = CLR[color].fill;
    ctx.fillRect(x,y,cs,cs);
    // Star on starting cell
    drawBoardStar(ctx, x+cs/2, y+cs/2, cs*0.32, '#fff', 0.55);
    return;
  }

  if (info.type === 'safe') {
    ctx.fillStyle = '#fffde7';
    ctx.fillRect(x,y,cs,cs);
    // Star marker
    drawBoardStar(ctx, x+cs/2, y+cs/2, cs*0.3, '#f9a825', 0.45);
    return;
  }

  // Normal path cell
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(x,y,cs,cs);

  // Highlight if token can move here
  if (GS.diceRolled && isMyTurn() && !GS.gameOver) {
    const isMovable = checkCellMovable(r,c);
    if (isMovable) {
      ctx.fillStyle = 'rgba(249,115,22,0.06)';
      ctx.fillRect(x,y,cs,cs);
    }
  }
}

function checkCellMovable(r,c) {
  const myColors = GS.currentTurn==='p1' ? GS.p1Colors : GS.p2Colors;
  return myColors.some(color =>
    GS.tokens[color].some(t => {
      const pos = getTokenCanvasPos(t, document.getElementById('gameCanvas').width/COLS);
      if (!pos) return false;
      const cs2 = document.getElementById('gameCanvas').width/COLS;
      const [pr,pc] = [Math.round(pos.y/cs2-0.5), Math.round(pos.x/cs2-0.5)];
      return pr===r && pc===c && canTokenMove(t);
    })
  );
}

function drawCornerCell(ctx, r, c, cs, color) {
  const x=c*cs, y=r*cs;
  // Corner background fill
  ctx.fillStyle = CLR[color].fill;
  ctx.fillRect(x,y,cs,cs);

  // Inner white home box (rows 1-4, cols 1-4 pattern)
  const inCorner = isInnerHomebox(r,c,color);
  if (inCorner) {
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(x+1,y+1,cs-2,cs-2);
  }
}

function isInnerHomebox(r,c,color) {
  const boxes = {
    red:    {r:[1,4],c:[1,4]},
    green:  {r:[1,4],c:[10,13]},
    yellow: {r:[10,13],c:[10,13]},
    blue:   {r:[10,13],c:[1,4]}
  };
  const b = boxes[color];
  return r>=b.r[0] && r<=b.r[1] && c>=b.c[0] && c<=b.c[1];
}

function drawStretchArrow(ctx, r, c, cs, color) {
  const x=c*cs, y=r*cs;
  ctx.fillStyle = 'rgba(255,255,255,0.25)';
  ctx.beginPath();
  // Arrow direction based on color
  const dirs = {red:'right', green:'down', yellow:'left', blue:'up'};
  const dir  = dirs[color];
  const mx=x+cs/2, my=y+cs/2, hw=cs*0.22, hl=cs*0.32;
  switch(dir) {
    case 'right': drawArrow(ctx,mx-hl,my,mx+hl,my,hw); break;
    case 'left':  drawArrow(ctx,mx+hl,my,mx-hl,my,hw); break;
    case 'down':  drawArrow(ctx,mx,my-hl,mx,my+hl,hw); break;
    case 'up':    drawArrow(ctx,mx,my+hl,mx,my-hl,hw); break;
  }
  ctx.fill();
}

function drawArrow(ctx,x1,y1,x2,y2,hw) {
  const dx=x2-x1, dy=y2-y1, len=Math.sqrt(dx*dx+dy*dy);
  const ux=dx/len, uy=dy/len;
  const px=-uy, py=ux;
  ctx.beginPath();
  ctx.moveTo(x1+px*hw/2, y1+py*hw/2);
  ctx.lineTo(x2-ux*hw, y2-uy*hw);
  ctx.lineTo(x2-ux*hw+px*hw, y2-uy*hw+py*hw);
  ctx.lineTo(x2, y2);
  ctx.lineTo(x2-ux*hw-px*hw, y2-uy*hw-py*hw);
  ctx.lineTo(x2-ux*hw, y2-uy*hw);
  ctx.lineTo(x1-px*hw/2, y1-py*hw/2);
  ctx.closePath();
}

function drawBoardStar(ctx, cx, cy, outerR, fillColor, innerRatio) {
  const innerR = outerR * innerRatio;
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

  // White background
  ctx.fillStyle = '#f5f0e8';
  ctx.fillRect(x,y,size,size);

  // 4 triangles — red(top-left), green(top-right), yellow(bottom-right), blue(bottom-left)
  const tris = [
    {corners:[[x,y],[x+size,y]],       color:CLR.red.fill},
    {corners:[[x+size,y],[x+size,y+size]], color:CLR.green.fill},
    {corners:[[x+size,y+size],[x,y+size]], color:CLR.yellow.fill},
    {corners:[[x,y+size],[x,y]],           color:CLR.blue.fill}
  ];

  tris.forEach(({corners,color}) => {
    ctx.beginPath();
    ctx.moveTo(cx,cy);
    ctx.lineTo(corners[0][0],corners[0][1]);
    ctx.lineTo(corners[1][0],corners[1][1]);
    ctx.closePath();
    ctx.fillStyle = color;
    ctx.fill();
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 1;
    ctx.stroke();
  });

  // Center circle
  ctx.beginPath();
  ctx.arc(cx,cy,cs*0.62,0,Math.PI*2);
  ctx.fillStyle = '#f5f0e8';
  ctx.fill();
  ctx.strokeStyle = 'rgba(0,0,0,0.1)';
  ctx.lineWidth = 1;
  ctx.stroke();

  // Center star
  drawBoardStar(ctx,cx,cy,cs*0.38,'rgba(0,0,0,0.06)',0.5);
}

// ── Draw token placeholders in home boxes ──
function drawAllTokens(ctx, cs) {
  // Draw home box token circles (empty placeholders)
  const homeBoxes = {
    red:    {r:[1,4],c:[1,4]},
    green:  {r:[1,4],c:[10,13]},
    yellow: {r:[10,13],c:[10,13]},
    blue:   {r:[10,13],c:[1,4]}
  };
  Object.entries(homeBoxes).forEach(([color,{r,c}]) => {
    const midR = (r[0]+r[1])/2, midC = (c[0]+c[1])/2;
    const offsets = [[-1,-1],[-1,1],[1,-1],[1,1]];
    offsets.forEach(([dr,dc]) => {
      const px = (midC+dc*0.7)*cs;
      const py = (midR+dr*0.7)*cs;
      const rad = cs*0.28;
      // Outer ring
      ctx.beginPath(); ctx.arc(px,py,rad,0,Math.PI*2);
      ctx.fillStyle = CLR[color].light; ctx.fill();
      ctx.strokeStyle = 'rgba(0,0,0,0.2)'; ctx.lineWidth=1; ctx.stroke();
      // Inner circle
      ctx.beginPath(); ctx.arc(px,py,rad*0.6,0,Math.PI*2);
      ctx.fillStyle = CLR[color].fill+'55'; ctx.fill();
    });
  });

  // Draw actual tokens
  if (!GS.tokens) return;
  // Collect positions to handle stacking
  const cellCount = {};
  Object.values(GS.tokens).forEach(colorTokens => {
    colorTokens.forEach(token => {
      if (token.state === 'finished') return;
      const pos = getTokenCanvasPos(token, cs);
      if (!pos) return;
      const key = Math.round(pos.x/cs)+','+Math.round(pos.y/cs);
      cellCount[key] = (cellCount[key]||0)+1;
    });
  });
  const cellIdx = {};
  Object.values(GS.tokens).forEach(colorTokens => {
    colorTokens.forEach(token => drawToken(ctx, token, cs, cellIdx, cellCount));
  });
}

function drawToken(ctx, token, cs, cellIdx, cellCount) {
  if (token.state === 'finished') return;
  const pos = getTokenCanvasPos(token, cs);
  if (!pos) return;

  const {x,y} = pos;
  const key = Math.round(x/cs)+','+Math.round(y/cs);
  cellIdx[key] = (cellIdx[key]||0);
  const count  = cellCount[key] || 1;
  const idx    = cellIdx[key];
  cellIdx[key]++;

  // Offset tokens in same cell
  let ox=0, oy=0;
  if (count > 1) {
    const offsets = [[0,0],[-6,0],[6,0],[0,-6]];
    const off = offsets[Math.min(idx,3)];
    ox=off[0]; oy=off[1];
  }

  const fx=x+ox, fy=y+oy;
  const r = cs * (token.state==='home' ? 0.28 : 0.32);

  ctx.shadowColor='rgba(0,0,0,0.35)';
  ctx.shadowBlur=4; ctx.shadowOffsetY=2;

  // Outer dark ring
  ctx.beginPath(); ctx.arc(fx,fy,r,0,Math.PI*2);
  ctx.fillStyle = CLR[token.color].dark; ctx.fill();

  // Inner colored fill
  ctx.beginPath(); ctx.arc(fx,fy,r*0.78,0,Math.PI*2);
  ctx.fillStyle = CLR[token.color].fill; ctx.fill();

  // Inner white ring
  ctx.beginPath(); ctx.arc(fx,fy,r*0.55,0,Math.PI*2);
  ctx.strokeStyle='rgba(255,255,255,0.5)'; ctx.lineWidth=1; ctx.stroke();

  // Gloss highlight
  ctx.beginPath(); ctx.arc(fx-r*0.22,fy-r*0.22,r*0.22,0,Math.PI*2);
  ctx.fillStyle='rgba(255,255,255,0.55)'; ctx.fill();

  ctx.shadowColor='transparent'; ctx.shadowBlur=0; ctx.shadowOffsetY=0;

  // Token number
  ctx.fillStyle='#fff';
  ctx.font = `bold ${Math.round(r*0.65)}px Nunito, sans-serif`;
  ctx.textAlign='center'; ctx.textBaseline='middle';
  ctx.fillText(token.id+1, fx, fy+0.5);

  // Selected glow
  if (GS.selectedToken?.color===token.color && GS.selectedToken?.id===token.id) {
    ctx.beginPath(); ctx.arc(fx,fy,r+3,0,Math.PI*2);
    ctx.strokeStyle='#f97316'; ctx.lineWidth=2.5; ctx.stroke();
    ctx.beginPath(); ctx.arc(fx,fy,r+7,0,Math.PI*2);
    ctx.strokeStyle='rgba(249,115,22,0.3)'; ctx.lineWidth=4; ctx.stroke();
  }

  // Pulsing moveable indicator
  if (GS.diceRolled && isMyTurn() && !GS.gameOver && canTokenMove(token)) {
    const pulse = 0.6 + 0.4*Math.sin(animPulse*0.18);
    ctx.beginPath(); ctx.arc(fx,fy,r+2,0,Math.PI*2);
    ctx.strokeStyle=`rgba(249,115,22,${pulse})`; ctx.lineWidth=2; ctx.stroke();
  }
}

function getTokenCanvasPos(token, cs) {
  if (!cs) cs = document.getElementById('gameCanvas').width/COLS;
  const color = token.color;

  if (token.state==='home') {
    const [row,col] = HOME_BASE[color][token.id];
    return { x:col*cs, y:row*cs, color };
  }
  if (token.state==='finished') return null;

  if (token.state==='active') {
    const absIdx = (ENTRY_IDX[color]+token.relPos) % 52;
    const [row,col] = MAIN_PATH[absIdx];
    return { x:(col+0.5)*cs, y:(row+0.5)*cs, color };
  }
  if (token.state==='homestretch') {
    const [row,col] = HOME_STRETCH[color][token.homeStep];
    return { x:(col+0.5)*cs, y:(row+0.5)*cs, color };
  }
  return null;
}

// ════════════════════════════════════════════════════════════
//  DICE DRAWING
// ════════════════════════════════════════════════════════════

function drawDice(val) {
  const canvas = document.getElementById('diceCanvas');
  const ctx    = canvas.getContext('2d');
  const W=64, pad=4;
  ctx.clearRect(0,0,W,W);

  // Body
  ctx.fillStyle = val ? '#ffffff' : '#f0f0f0';
  roundRect(ctx,pad,pad,W-2*pad,W-2*pad,10); ctx.fill();
  ctx.strokeStyle = val ? '#1a2d4a' : 'rgba(0,0,0,0.15)';
  ctx.lineWidth = val ? 2 : 1;
  roundRect(ctx,pad,pad,W-2*pad,W-2*pad,10); ctx.stroke();

  if (!val) {
    ctx.fillStyle='rgba(0,0,0,0.12)';
    ctx.beginPath(); ctx.arc(32,32,5,0,Math.PI*2); ctx.fill();
    return;
  }

  const dotPositions = {
    1:[[32,32]],
    2:[[20,20],[44,44]],
    3:[[20,20],[32,32],[44,44]],
    4:[[20,20],[44,20],[20,44],[44,44]],
    5:[[20,20],[44,20],[32,32],[20,44],[44,44]],
    6:[[20,18],[44,18],[20,32],[44,32],[20,46],[44,46]]
  };

  ctx.fillStyle = '#1a2d4a';
  (dotPositions[val]||[]).forEach(([dx,dy]) => {
    ctx.beginPath(); ctx.arc(dx,dy,4.5,0,Math.PI*2); ctx.fill();
  });
}

let diceAnimFrame=null;
function animateDice(finalVal, cb) {
  if (!settings.anim) { drawDice(finalVal); if(cb) cb(); return; }
  let count=0, total=12;
  function frame() {
    drawDice(randInt(1,6));
    count++;
    if (count<total) {
      diceAnimFrame = setTimeout(frame, count<8?55:count<11?95:145);
    } else {
      drawDice(finalVal);
      if (cb) cb();
    }
  }
  frame();
}

// ════════════════════════════════════════════════════════════
//  TURN MANAGEMENT
// ════════════════════════════════════════════════════════════

function startTurn() {
  if (GS.gameOver) return;
  GS.diceVal    = null;
  GS.diceRolled = false;
  GS.selectedToken = null;
  clearTimer();
  updateStatus();
  updatePanels();

  const myTurn  = isMyTurn();
  const rollBtn = document.getElementById('rollBtn');

  if (myTurn) {
    rollBtn.disabled = false;
    rollBtn.textContent = '🎲 ROLL DICE';
    document.getElementById('diceLabel').textContent = 'Your turn!';
    startTimer();
  } else {
    rollBtn.disabled = true;
    rollBtn.textContent = '⏳ Waiting...';
    document.getElementById('diceLabel').textContent = "Opponent's turn";
    if (GS.mode==='computer') setTimeout(computerTurn, 900);
  }
  drawBoard();
}

function isMyTurn() {
  if (GS.mode==='computer') return GS.currentTurn==='p1';
  return GS.currentTurn===GS.myRole;
}

function enableMyTurn() {
  GS.diceRolled = false;
  const btn = document.getElementById('rollBtn');
  btn.disabled  = false;
  btn.textContent = '🎲 ROLL DICE';
  document.getElementById('diceLabel').textContent = 'Your turn!';
  startTimer();
  updateStatus();
}

function startTimer() {
  GS.timerVal = TURN_TIME;
  updateTimerDisplay();
  GS.timer = setInterval(() => {
    GS.timerVal--;
    updateTimerDisplay();
    if (GS.timerVal <= 3) playSound('tick');
    if (GS.timerVal <= 0) {
      clearTimer();
      showToast("Time's up! Turn passed.", 'warning');
      nextTurn();
    }
  }, 1000);
}

function clearTimer() {
  if (GS.timer) { clearInterval(GS.timer); GS.timer=null; }
  // Hide both timer rings
  ['pp1timerWrap','pp2timerWrap'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.style.display = 'none';
  });
}

function updateTimerDisplay() {
  const myTurn = isMyTurn();
  const wrap1  = document.getElementById('pp1timerWrap');
  const wrap2  = document.getElementById('pp2timerWrap');
  const num1   = document.getElementById('pp1timerNum');
  const num2   = document.getElementById('pp2timerNum');
  const arc1   = document.getElementById('timerArc1');
  const arc2   = document.getElementById('timerArc2');

  const circumference = 94.2; // 2π × 15
  const pct   = GS.timerVal / TURN_TIME;
  const offset = circumference * (1 - pct);
  const urgent = GS.timerVal <= 3;

  if (myTurn || (GS.mode==='computer' && GS.currentTurn==='p1')) {
    if (wrap1) wrap1.style.display = '';
    if (wrap2) wrap2.style.display = 'none';
    if (num1)  { num1.textContent = GS.timerVal; num1.className='pp-timer-num'+(urgent?' urgent':''); }
    if (arc1)  { arc1.style.strokeDashoffset = offset; arc1.className='timer-arc'+(urgent?' urgent':''); }
  } else if (GS.mode !== 'computer') {
    if (wrap2) wrap2.style.display = '';
    if (wrap1) wrap1.style.display = 'none';
    if (num2)  { num2.textContent = GS.timerVal; num2.className='pp-timer-num'+(urgent?' urgent':''); }
    if (arc2)  { arc2.style.strokeDashoffset = offset; arc2.className='timer-arc'+(urgent?' urgent':''); }
  }
}

function handleRoll() {
  if (!isMyTurn() || GS.diceRolled || GS.gameOver || GS.animating) return;
  clearTimer();
  const val = rollDice();
  GS.diceVal = val;
  playSound('dice');
  document.getElementById('rollBtn').disabled = true;
  document.getElementById('diceLabel').textContent = 'Rolling...';

  animateDice(val, () => {
    GS.diceRolled = true;
    document.getElementById('diceLabel').textContent = `Rolled: ${val}`;
    updateStatus(`Rolled ${val}! ${val===6 ? '🎲 Pick a token' : 'Pick a token'}`);
    checkMovableTokens();
  });
}

function checkMovableTokens() {
  const myColors = GS.currentTurn==='p1' ? GS.p1Colors : GS.p2Colors;
  const movable  = [];
  myColors.forEach(color => {
    GS.tokens[color].forEach(t => { if (canTokenMove(t)) movable.push(t); });
  });

  if (movable.length===0) {
    updateStatus('No moves available — turn skipped');
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
  const dice = GS.diceVal;
  if (!dice) return false;
  const myColors = GS.currentTurn==='p1' ? GS.p1Colors : GS.p2Colors;
  if (!myColors.includes(token.color)) return false;
  if (token.state==='finished') return false;
  if (token.state==='home') return dice===6;
  if (token.state==='homestretch') return token.homeStep+dice <= 4;
  if (token.state==='active') {
    const newRelPos = token.relPos + dice;
    if (newRelPos >= 52) return (newRelPos-52) <= 4;
    return true;
  }
  return false;
}

function handleBoardClick(e) {
  if (!GS.diceRolled || !isMyTurn() || GS.gameOver || GS.animating) return;
  const canvas = document.getElementById('gameCanvas');
  const rect   = canvas.getBoundingClientRect();
  const scaleX = canvas.width / rect.width;
  const scaleY = canvas.height / rect.height;
  const mx = (e.clientX - rect.left) * scaleX;
  const my = (e.clientY - rect.top)  * scaleY;
  const cs = canvas.width / COLS;

  const myColors = GS.currentTurn==='p1' ? GS.p1Colors : GS.p2Colors;
  let clicked = null;
  let minDist = cs * 0.6;

  myColors.forEach(color => {
    GS.tokens[color].forEach(token => {
      const pos = getTokenCanvasPos(token, cs);
      if (!pos) return;
      const dist = Math.hypot(pos.x - mx, pos.y - my);
      if (dist < minDist && canTokenMove(token)) {
        minDist = dist;
        clicked = token;
      }
    });
  });

  if (clicked) {
    GS.selectedToken = clicked;
    drawBoard();
    setTimeout(() => moveToken(clicked), 150);
  }
}

// ════════════════════════════════════════════════════════════
//  MOVE TOKEN
// ════════════════════════════════════════════════════════════

function moveToken(token) {
  if (GS.animating) return;
  GS.animating = true;
  GS.selectedToken = null;
  clearTimer();
  const dice = GS.diceVal;

  if (token.state==='home') {
    token.state  = 'active';
    token.relPos = 0;
    playSound('enter');
    updateStatus(`${CLR[token.color].label} enters the board!`);
  } else if (token.state==='active') {
    const newRelPos = token.relPos + dice;
    if (newRelPos >= 52) {
      token.state    = 'homestretch';
      token.homeStep = newRelPos - 52;
      token.relPos   = 52;
      playSound('safe');
      updateStatus(`${CLR[token.color].label} enters home stretch!`, 'safe');
    } else {
      token.relPos = newRelPos;
      playSound('move');
    }
  } else if (token.state==='homestretch') {
    token.homeStep += dice;
    if (token.homeStep >= 5) {
      token.homeStep = 5;
      token.state    = 'finished';
      playSound('safe');
      updateStatus(`🏠 ${CLR[token.color].label} reached HOME!`, 'safe');
    } else {
      playSound('move');
    }
  }

  if (token.state==='active') checkCaptures(token);

  if (GS.mode !== 'computer') {
    pushGameState(GS.myRole).catch(console.error);
  }

  drawBoard();
  drawDice(dice);

  setTimeout(() => {
    GS.animating = false;
    if (checkWin()) return;

    if (dice===6) {
      updateStatus('🎲 Rolled 6 — roll again!');
      GS.diceRolled = false;
      GS.diceVal    = null;
      drawDice(null);
      document.getElementById('rollBtn').disabled  = false;
      document.getElementById('rollBtn').textContent = '🎲 ROLL AGAIN';
      document.getElementById('diceLabel').textContent = 'Roll again!';
      startTimer();
    } else {
      nextTurn();
    }
  }, settings.anim ? 380 : 50);
}

function checkCaptures(movedToken) {
  const absIdx = (ENTRY_IDX[movedToken.color]+movedToken.relPos) % 52;
  if (SAFE_ABS.has(absIdx)) return;

  const opColors = GS.currentTurn==='p1' ? GS.p2Colors : GS.p1Colors;
  opColors.forEach(color => {
    GS.tokens[color].forEach(token => {
      if (token.state!=='active') return;
      const tokenAbs = (ENTRY_IDX[color]+token.relPos) % 52;
      if (tokenAbs===absIdx && !SAFE_ABS.has(tokenAbs)) {
        token.state  = 'home';
        token.relPos = -1;
        playSound('capture');
        updateStatus(`💥 ${CLR[movedToken.color].label} captured ${CLR[color].label}!`, 'capture');
        showToast(`Captured! ${CLR[movedToken.color].label} → ${CLR[color].label}`,'success');
      }
    });
  });
}

function checkWin() {
  const p1Done = GS.p1Colors.every(color => GS.tokens[color].every(t => t.state==='finished'));
  const p2Done = GS.p2Colors.every(color => GS.tokens[color].every(t => t.state==='finished'));

  if (p1Done||p2Done) {
    GS.gameOver = true;
    clearTimer();
    const winner   = p1Done ? 'p1' : 'p2';
    GS.winner      = winner;
    const winName  = winner==='p1' ? GS.p1Name : GS.p2Name;
    const isMyWin  = (GS.mode==='computer' && winner==='p1') ||
                     (GS.mode!=='computer' && winner===GS.myRole);

    localStorage.removeItem('ludoActiveRoom');

    setTimeout(() => {
      showWinScreen(winName, isMyWin);
      if (isMyWin && GS.mode==='bet') creditWinnings();
      if (GS.mode!=='computer') recordBetResult(winner);
    }, 600);
    return true;
  }
  return false;
}

function nextTurn() {
  GS.currentTurn = GS.currentTurn==='p1' ? 'p2' : 'p1';
  GS.diceVal     = null;
  GS.diceRolled  = false;
  drawDice(null);
  updatePanels();
  startTurn();
}

function updatePanels() {
  const p1 = GS.currentTurn==='p1';
  document.getElementById('panel1').classList.toggle('active-turn',  p1);
  document.getElementById('panel2').classList.toggle('active-turn', !p1);

  const p1Fin  = GS.p1Colors.reduce((a,c)=>a+GS.tokens[c].filter(t=>t.state==='finished').length,0);
  const p2Fin  = GS.p2Colors.reduce((a,c)=>a+GS.tokens[c].filter(t=>t.state==='finished').length,0);
  const p1Tot  = GS.p1Colors.length * 4;
  const p2Tot  = GS.p2Colors.length * 4;
  document.getElementById('pp1score').textContent = p1Fin+' / '+p1Tot;
  document.getElementById('pp2score').textContent = p2Fin+' / '+p2Tot;
}

function updateStatus(msg, type='') {
  if (!msg) {
    const myTurn = isMyTurn();
    msg = myTurn
      ? 'Your turn — roll the dice!'
      : `${GS.currentTurn==='p1' ? GS.p1Name : GS.p2Name}'s turn...`;
    type = myTurn ? 'my-turn' : '';
  }
  const el = document.getElementById('statusText');
  el.textContent = msg;
  el.className   = 'status-msg' + (type ? ' '+type : '');
}

// ════════════════════════════════════════════════════════════
//  COMPUTER AI — Enhanced
// ════════════════════════════════════════════════════════════

function computerTurn() {
  if (GS.currentTurn!=='p2' || GS.gameOver) return;

  const val = rollDice();
  GS.diceVal = val;
  playSound('dice');

  document.getElementById('diceLabel').textContent = `AI rolled: ${val}`;
  updateStatus(`AI rolled ${val}...`);

  animateDice(val, () => {
    GS.diceRolled = true;
    const delay = GS.difficulty==='easy' ? 600 : GS.difficulty==='expert' ? 1200 : 800;
    setTimeout(() => {
      const token = chooseBestMove(val);
      if (token) {
        GS.selectedToken = token;
        drawBoard();
        setTimeout(() => moveToken(token), 250);
      } else {
        updateStatus('AI has no moves — skipping');
        setTimeout(nextTurn, 1000);
      }
    }, delay);
  });
}

function chooseBestMove(dice) {
  const diff = GS.difficulty || 'medium';
  const myColors  = GS.p2Colors;
  const oppColors = GS.p1Colors;

  const movable = [];
  myColors.forEach(color => {
    GS.tokens[color].forEach(t => { if (canTokenMove(t)) movable.push(t); });
  });
  if (!movable.length) return null;
  if (diff==='easy') return movable[randInt(0,movable.length-1)];

  const scored = movable.map(t => ({ t, score:scoreMove(t,dice,diff,oppColors) }));
  scored.sort((a,b) => b.score-a.score);

  if (diff==='medium' && Math.random()<0.2) return movable[randInt(0,movable.length-1)];
  return scored[0].t;
}

function scoreMove(token, dice, diff, oppColors) {
  let score = 0;

  if (token.state==='homestretch') score += 600 + token.homeStep*60;
  if (token.state==='active')      score += token.relPos * 6;
  if (token.state==='home' && dice===6) score += 120;

  if (token.state==='active') {
    const newRelPos  = token.relPos + dice;
    const newAbsIdx  = (ENTRY_IDX[token.color] + newRelPos) % 52;

    // Capture bonus
    oppColors.forEach(color => {
      GS.tokens[color].forEach(opp => {
        if (opp.state==='active') {
          const oppAbs = (ENTRY_IDX[color]+opp.relPos) % 52;
          if (oppAbs===newAbsIdx && !SAFE_ABS.has(newAbsIdx)) {
            score += 350 + (diff==='expert'?250:0);
          }
        }
      });
    });

    // Safe square preference
    if (SAFE_ABS.has(newAbsIdx)) score += 90;

    // Avoid danger (hard/expert)
    if (diff==='hard'||diff==='expert') {
      if (!SAFE_ABS.has(newAbsIdx)) {
        oppColors.forEach(color => {
          GS.tokens[color].forEach(opp => {
            if (opp.state==='active') {
              for (let d=1;d<=6;d++) {
                if ((ENTRY_IDX[color]+opp.relPos+d)%52 === newAbsIdx) {
                  score -= 130 + (diff==='expert'?70:0);
                }
              }
            }
          });
        });
      }
    }
  }

  return score;
}

// ════════════════════════════════════════════════════════════
//  WIN SCREEN
// ════════════════════════════════════════════════════════════

function showWinScreen(winnerName, isLocalWin) {
  playSound('win');
  document.getElementById('winTitle').textContent = isLocalWin ? '🏆 YOU WIN!' : winnerName+' Wins!';
  document.getElementById('winSubtitle').textContent = isLocalWin
    ? 'Outstanding strategy! You crushed it!'
    : 'Better luck next time. Keep practicing!';

  const winAmt = document.getElementById('winAmount');
  const winNum = document.getElementById('winAmountNum');
  if (isLocalWin && GS.mode==='bet') {
    winAmt.style.display = '';
    winNum.textContent   = formatMoney(GS.betWin);
  } else {
    winAmt.style.display = 'none';
  }

  showScreen('winScreen');
  if (isLocalWin) spawnConfetti();
  stopBGMusic();
}

function spawnConfetti() {
  const c = document.getElementById('confettiContainer');
  c.innerHTML = '';
  const colors = ['#f97316','#ef4444','#22c55e','#3b82f6','#f59e0b','#8b5cf6'];
  for (let i=0;i<90;i++) {
    const el = document.createElement('div');
    el.style.cssText = `
      position:absolute; border-radius:${Math.random()>.5?'50%':'3px'};
      width:${randInt(6,14)}px; height:${randInt(6,14)}px;
      background:${colors[randInt(0,colors.length-1)]};
      left:${randInt(0,100)}%; top:-20px; opacity:.9;
      animation:confetti-fall ${1.5+Math.random()*2}s ${Math.random()*1.5}s ease-in forwards;
    `;
    c.appendChild(el);
  }
}

function closeWinScreen() { document.getElementById('confettiContainer').innerHTML=''; }

function playAgain() {
  closeWinScreen();
  if (GS.mode==='computer') {
    startComputerGame();
  } else {
    showScreen('main');
  }
}

// ════════════════════════════════════════════════════════════
//  FIRESTORE: CREDIT & RECORD
// ════════════════════════════════════════════════════════════

async function creditWinnings() {
  if (!currentUser || !GS.betWin) return;
  try {
    await db.runTransaction(async tx => {
      const ref = db.collection('balance').doc(currentUser.uid);
      tx.update(ref, { amount: firebase.firestore.FieldValue.increment(GS.betWin) });
    });
    await db.collection('ludo_transactions').add({
      uid:currentUser.uid, username, type:'win',
      stake:GS.betStake, amount:GS.betWin,
      roomId:GS.roomId,
      timestamp: firebase.firestore.FieldValue.serverTimestamp()
    });
    showToast(`₦${formatMoney(GS.betWin)} added to your balance!`,'success');
    loadUserStats();
  } catch(e) { console.error('Credit error:', e); }
}

async function recordBetResult(winner) {
  if (!GS.roomId || GS.mode!=='bet') return;
  try {
    const winnerUid = winner==='p1' ? GS.opponentUid : currentUser.uid;
    if (winner!==GS.myRole && winnerUid) {
      await db.collection('balance').doc(winnerUid).update({
        amount: firebase.firestore.FieldValue.increment(GS.betWin)
      });
    }
    await db.collection('ludo_bet_rooms').doc(GS.roomId).update({
      winner, winnerUid, status:'completed',
      endedAt: firebase.firestore.FieldValue.serverTimestamp()
    });
  } catch(e) { console.error(e); }
}

// ════════════════════════════════════════════════════════════
//  QUIT
// ════════════════════════════════════════════════════════════

async function confirmQuit() {
  closeModal('quitConfirmModal');
  clearTimer();
  GS.gameOver = true;
  localStorage.removeItem('ludoActiveRoom');

  if (GS.mode==='bet' && GS.roomId) {
    const oppRole = GS.myRole==='p1' ? 'p2' : 'p1';
    try {
      await db.collection('ludo_bet_rooms').doc(GS.roomId).update({
        winner:oppRole, status:'forfeit',
        endedAt: firebase.firestore.FieldValue.serverTimestamp()
      });
      if (GS.opponentUid) {
        await db.collection('balance').doc(GS.opponentUid).update({
          amount: firebase.firestore.FieldValue.increment(GS.betWin)
        });
      }
      showToast('You forfeited. Opponent wins.','error');
    } catch(e) { console.error(e); }
  } else if (GS.mode==='friend' && GS.roomId) {
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
  GS.gameOver = true;
  clearTimer();
  const isMyWin   = winner===GS.myRole;
  const winName   = winner==='p1' ? GS.p1Name : GS.p2Name;
  showWinScreen(winName, isMyWin);
  if (isMyWin && isBet) creditWinnings();
  localStorage.removeItem('ludoActiveRoom');
}

// ════════════════════════════════════════════════════════════
//  AI CHAT SUPPORT — Enhanced
// ════════════════════════════════════════════════════════════

const FAQ = [
  { q:['roll','dice','how to roll'],
    a:'Tap the 🎲 ROLL DICE button when it\'s your turn. You MUST roll a 6 to bring a token out of your home base.' },
  { q:['6','six','extra turn','roll again'],
    a:'Rolling a 6 gives you an extra turn! Use it to bring more tokens out or move further ahead.' },
  { q:['safe','star','capture','protect','safe square'],
    a:'⭐ Safe squares protect tokens from capture. Your token\'s entry square is also safe. When on a safe square, opponents cannot send you home!' },
  { q:['bet','stake','money','win prize','wager'],
    a:'In Bet Mode, choose your stake (₦50–₦2000). You\'re matched with someone staking the same. Winner takes the full prize!' },
  { q:['balance','deposit','add money','fund'],
    a:'Your balance is funded via the main Globals platform. It shows here in real-time. Tap "+ Add Money" to go deposit.' },
  { q:['friend','room','code','join room','host room'],
    a:'Host a room to get a 4-digit code. Share it with your friend. They enter the code under "Join." Once they join, the game starts automatically!' },
  { q:['computer','ai','difficulty','vs ai'],
    a:'vs Computer has 4 levels: Easy (random), Medium (strategic), Hard (aggressive), Expert (nearly unbeatable with threat avoidance!).' },
  { q:['timer','time','10 seconds','countdown','turn limit'],
    a:'Each turn has a 10-second countdown shown as a ring on your player panel. When it hits zero, your turn passes automatically!' },
  { q:['quit','forfeit','leave game','exit'],
    a:'If you quit a bet game, your stake goes to the opponent. In friend mode, they win too. The game also continues if you just switch tabs!' },
  { q:['win','home','finish','reach center'],
    a:'Get ALL 4 (or 8 in Double mode) tokens to the center home to win! Tokens enter the colored home stretch from their entry column.' },
  { q:['capture','send back','knocked'],
    a:'Land exactly on an opponent\'s token to send them back home! Captured tokens lose all progress. But safe squares protect you.' },
  { q:['music','sound','mute','audio'],
    a:'Go to Settings (⚙️) to toggle Sound Effects and Background Music independently. The music uses an advanced game beat system!' },
  { q:['double','classic','board style'],
    a:'Classic = 4 tokens each (1 color). Double = 8 tokens each (2 colors). Double mode is longer but more exciting!' },
  { q:['refund','cancel search','no match'],
    a:'If no opponent is found within 60 seconds, your stake is automatically refunded. You can also cancel manually.' },
  { q:['background','tab','minimize','chrome'],
    a:'The game keeps running even if you switch Chrome tabs or minimize! Your turn timer continues and Firebase stays connected.' }
];

function handleChatSend() {
  const input = document.getElementById('chatInput');
  const msg   = input.value.trim();
  if (!msg) return;
  input.value = '';
  addChatMsg(msg,'user');
  setTimeout(() => addChatMsg(getChatReply(msg.toLowerCase()),'ai'), 350);
}

function getChatReply(msg) {
  for (const faq of FAQ) {
    if (faq.q.some(k => msg.includes(k))) return faq.a;
  }
  if (msg.includes('hello')||msg.includes('hi')||msg.includes('hey')) {
    return `Hey there, ${username}! 👋 I'm your Globals Ludo assistant. Ask me about game rules, bet mode, timers, or anything else!`;
  }
  if (msg.includes('help')||msg.includes('support')) {
    return `Sure! I can help with: rolling dice, 6s & extra turns, safe squares, bet mode, room codes, the 10-second timer, or winning strategies. What do you need? 🎮`;
  }
  if (msg.includes('cheat')||msg.includes('hack')) {
    return `😄 No cheats here! Globals Ludo is powered by fair randomness. The best strategy is to spread tokens, aim for safe squares, and always try to capture when possible!`;
  }
  if (msg.includes('thank')||msg.includes('thanks')) {
    return `You're welcome! Good luck on your next game! 🍀🎲`;
  }
  return `Good question! Try asking about: dice rules, the 10-second timer, bet mode, room codes, safe squares, or how to win. I'm here to help! 🎮`;
}

function addChatMsg(text, who) {
  const msgs = document.getElementById('chatMessages');
  const div  = document.createElement('div');
  div.className = 'chat-msg '+who;
  div.innerHTML = `<div class="chat-bubble">${text}</div>`;
  msgs.appendChild(div);
  msgs.scrollTop = msgs.scrollHeight;
}

// ════════════════════════════════════════════════════════════
//  ANIMATION LOOP
// ════════════════════════════════════════════════════════════

function startAnimLoop() {
  function frame() {
    animPulse = (animPulse+1) % 120;
    if (GS.diceRolled && isMyTurn() && !GS.gameOver && document.getElementById('game').classList.contains('active')) {
      drawBoard();
    }
    animLoop = requestAnimationFrame(frame);
  }
  if (!animLoop) frame();
}

window.addEventListener('load', () => { startAnimLoop(); });

