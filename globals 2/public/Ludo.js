/**
 * GLOBALS LUDO - Complete Game Engine
 * File: Ludo.js
 * All game logic, Firebase integration, AI, Multiplayer, Betting
 */

'use strict';

// ════════════════════════════════════════════════════════════
//  CONSTANTS
// ════════════════════════════════════════════════════════════

const CELL = 32; // cell size px
const COLS = 15;
const BOARD_PX = CELL * COLS; // 480px

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

// Where each color enters the main path (absolute index in MAIN_PATH)
const ENTRY_IDX = { red: 0, green: 13, yellow: 26, blue: 39 };

// Home base token start positions within corners
const HOME_BASE = {
  red:    [[1.5,1.5],[1.5,3.5],[3.5,1.5],[3.5,3.5]],
  green:  [[1.5,10.5],[1.5,12.5],[3.5,10.5],[3.5,12.5]],
  yellow: [[10.5,10.5],[10.5,12.5],[12.5,10.5],[12.5,12.5]],
  blue:   [[10.5,1.5],[10.5,3.5],[12.5,1.5],[12.5,3.5]]
};

// Safe squares (absolute path index) — star markers
const SAFE_ABS = new Set([0, 8, 13, 21, 26, 34, 39, 47]);

// Color theme
const CLR = {
  red:    { fill:'#EF4444', light:'#FECACA', dark:'#991B1B', label:'Red' },
  green:  { fill:'#22C55E', light:'#BBF7D0', dark:'#15803D', label:'Green' },
  yellow: { fill:'#EAB308', light:'#FEF08A', dark:'#92400E', label:'Yellow' },
  blue:   { fill:'#3B82F6', light:'#BFDBFE', dark:'#1D4ED8', label:'Blue' }
};

const TURN_TIME = 30; // seconds per turn

// ════════════════════════════════════════════════════════════
//  STATE
// ════════════════════════════════════════════════════════════

let currentUser = null;
let userBalance = 0;
let username = 'Player';
let settings = { sound: true, music: false, anim: true };
let unsubBalance = null;

// Game state
let GS = {}; // game state object — reset per game

// Firestore listeners
let roomListener = null;
let matchListener = null;

// AudioContext
let audioCtx = null;

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
});

function startLoading() {
  const fill = document.getElementById('progressFill');
  const pct = document.getElementById('progressPct');
  let p = 0;
  const interval = setInterval(() => {
    p += Math.random() * 8 + 2;
    if (p >= 100) { p = 100; clearInterval(interval); setTimeout(checkAuth, 300); }
    fill.style.width = p + '%';
    pct.textContent = Math.floor(p) + '%';
  }, 80);
}

function checkAuth() {
  auth.onAuthStateChanged(user => {
    if (user) {
      currentUser = user;
      loadUserData().then(() => showScreen('main'));
    } else {
      // Redirect to Globals main login
      showToast('Please log in to Globals first.', 'error');
      setTimeout(() => { window.location.href = '/index.html'; }, 2000);
    }
  });
}

async function loadUserData() {
  if (!currentUser) return;
  try {
    // Get username
    const profileSnap = await db.collection('users').doc(currentUser.uid).get();
    if (profileSnap.exists) {
      username = profileSnap.data().username || currentUser.displayName || 'Player';
    }
    document.getElementById('usernameDisplay').textContent = username;
    document.getElementById('userAvatarMain').textContent = username[0].toUpperCase();
    // Subscribe to balance
    subscribeBalance();
  } catch(e) { console.error(e); }
}

function subscribeBalance() {
  if (unsubBalance) unsubBalance();
  unsubBalance = db.collection('balance').doc(currentUser.uid).onSnapshot(snap => {
    if (snap.exists) {
      userBalance = snap.data().amount || 0;
      document.getElementById('mainBalance').textContent = formatMoney(userBalance);
    }
  }, err => console.error(err));
}

// ════════════════════════════════════════════════════════════
//  SCREEN MANAGEMENT
// ════════════════════════════════════════════════════════════

function showScreen(id) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById(id).classList.add('active');
}

function openModal(id) {
  document.getElementById(id).classList.add('open');
}

function closeModal(id) {
  document.getElementById(id).classList.remove('open');
}

// ════════════════════════════════════════════════════════════
//  LOADING BOARD ANIMATION (mini canvas on loading screen)
// ════════════════════════════════════════════════════════════

function animateLoadingBoard() {
  const c = document.getElementById('ludominiCanvas');
  if (!c) return;
  const ctx = c.getContext('2d');
  const colors = ['#EF4444','#22C55E','#EAB308','#3B82F6'];
  let frame = 0;
  function draw() {
    ctx.clearRect(0,0,90,90);
    ctx.fillStyle = '#1a2235';
    roundRect(ctx, 0, 0, 90, 90, 16);
    ctx.fill();
    // 4 colored squares
    const rects = [[5,5,37,37],[48,5,37,37],[5,48,37,37],[48,48,37,37]];
    rects.forEach(([x,y,w,h], i) => {
      ctx.fillStyle = colors[i] + '33';
      ctx.beginPath();
      ctx.roundRect ? ctx.roundRect(x,y,w,h,6) : ctx.rect(x,y,w,h);
      ctx.fill();
      // Token circle bouncing
      const offset = Math.sin(frame * 0.08 + i * Math.PI/2) * 4;
      ctx.fillStyle = colors[i];
      ctx.beginPath();
      ctx.arc(x+w/2, y+h/2 + offset, 10, 0, Math.PI*2);
      ctx.fill();
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 2;
      ctx.stroke();
    });
    frame++;
    requestAnimationFrame(draw);
  }
  draw();
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x+r, y);
  ctx.lineTo(x+w-r, y); ctx.quadraticCurveTo(x+w, y, x+w, y+r);
  ctx.lineTo(x+w, y+h-r); ctx.quadraticCurveTo(x+w, y+h, x+w-r, y+h);
  ctx.lineTo(x+r, y+h); ctx.quadraticCurveTo(x, y+h, x, y+h-r);
  ctx.lineTo(x, y+r); ctx.quadraticCurveTo(x, y, x+r, y);
  ctx.closePath();
}

// ════════════════════════════════════════════════════════════
//  UI SETUP
// ════════════════════════════════════════════════════════════

function setupUI() {
  // Main menu buttons
  document.getElementById('vsComputerBtn').onclick = () => openModal('computerModal');
  document.getElementById('vsFriendBtn').onclick = () => openModal('friendModal');
  document.getElementById('betModeBtn').onclick = () => openModal('betModal');
  document.getElementById('settingsBtn').onclick = () => openModal('settingsModal');
  document.getElementById('mainChatBtn').onclick = () => openModal('chatModal');
  document.getElementById('tutorialBtn').onclick = () => openModal('tutorialModal');
  document.getElementById('termsBtn').onclick = () => openModal('termsModal');
  document.getElementById('privacyBtn').onclick = () => openModal('privacyModal');

  // Computer modal
  setupOptionGrid('difficultyGrid');
  setupOptionGrid('boardStyleGrid');
  document.getElementById('startComputerGame').onclick = startComputerGame;

  // Friend modal
  setupOptionGrid('friendModeGrid', v => {
    document.getElementById('hostSection').style.display = v==='host'?'':'none';
    document.getElementById('joinSection').style.display = v==='join'?'':'none';
  });
  setupOptionGrid('friendBoardStyleGrid');
  document.getElementById('hostGameBtn').onclick = hostGame;
  document.getElementById('joinGameBtn').onclick = joinGame;
  document.getElementById('cancelRoomBtn').onclick = cancelRoom;

  // Bet modal
  document.querySelectorAll('.bet-card').forEach(card => {
    card.onclick = () => {
      document.querySelectorAll('.bet-card').forEach(c => c.classList.remove('selected'));
      card.classList.add('selected');
      const s = card.dataset.stake, w = card.dataset.win;
      GS.betStake = parseInt(s); GS.betWin = parseInt(w);
      document.getElementById('selectedBetInfo').innerHTML = `Stake ₦${s} → Win ₦<strong style="color:var(--green)">${w}</strong>`;
      document.getElementById('startSearchBtn').disabled = false;
    };
  });
  document.getElementById('startSearchBtn').onclick = startBetSearch;
  document.getElementById('cancelMatchBtn').onclick = cancelBetSearch;

  // Game controls
  document.getElementById('rollBtn').onclick = handleRoll;
  document.getElementById('quitBtn').onclick = () => openModal('quitConfirmModal');
  document.getElementById('quitGameBtn').onclick = () => openModal('quitConfirmModal');
  document.getElementById('gameSettingsBtn').onclick = () => openModal('settingsModal');
  document.getElementById('gameChatBtn').onclick = () => openModal('chatModal');
  document.getElementById('confirmQuitBtn').onclick = confirmQuit;
  document.getElementById('cancelQuitBtn').onclick = () => closeModal('quitConfirmModal');

  // Win screen
  document.getElementById('winPlayAgain').onclick = playAgain;
  document.getElementById('winMainMenu').onclick = () => { showScreen('main'); closeWinScreen(); };

  // Settings
  ['soundToggle','musicToggle','animToggle'].forEach(id => {
    document.getElementById(id).onclick = function() {
      this.classList.toggle('on');
      const k = id.replace('Toggle','');
      settings[k] = this.classList.contains('on');
      saveSettings();
      if (k === 'music') handleMusicToggle();
    };
  });
  document.getElementById('settingsClose').onclick = () => closeModal('settingsModal');
  document.getElementById('termsSettingsBtn').onclick = () => { closeModal('settingsModal'); openModal('termsModal'); };
  document.getElementById('privacySettingsBtn').onclick = () => { closeModal('settingsModal'); openModal('privacyModal'); };

  // Modals close
  ['termsClose','privacyClose','tutorialClose','chatClose'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.onclick = () => {
      const map = { termsClose:'termsModal', privacyClose:'privacyModal', tutorialClose:'tutorialModal', chatClose:'chatModal' };
      closeModal(map[id]);
    };
  });

  // Chat
  document.getElementById('chatSendBtn').onclick = handleChatSend;
  document.getElementById('chatInput').onkeypress = e => { if (e.key==='Enter') handleChatSend(); };

  // Network retry
  document.getElementById('retryConnectionBtn').onclick = () => {
    if (navigator.onLine) closeModal('noInternetModal');
    else showToast('Still offline. Please check your connection.', 'error');
  };

  // Canvas click
  document.getElementById('gameCanvas').onclick = handleBoardClick;

  // Apply settings
  applySettings();
}

function setupOptionGrid(gridId, callback) {
  const grid = document.getElementById(gridId);
  if (!grid) return;
  grid.querySelectorAll('.option-item').forEach(item => {
    item.onclick = () => {
      grid.querySelectorAll('.option-item').forEach(i => i.classList.remove('selected'));
      item.classList.add('selected');
      if (callback) callback(item.dataset[Object.keys(item.dataset)[0]]);
    };
  });
}

// ════════════════════════════════════════════════════════════
//  SETTINGS
// ════════════════════════════════════════════════════════════

function loadSettings() {
  try {
    const s = JSON.parse(localStorage.getItem('ludoSettings') || '{}');
    settings = { sound: s.sound !== false, music: s.music || false, anim: s.anim !== false };
  } catch(e) {}
}
function saveSettings() { localStorage.setItem('ludoSettings', JSON.stringify(settings)); }
function applySettings() {
  document.getElementById('soundToggle').classList.toggle('on', settings.sound);
  document.getElementById('musicToggle').classList.toggle('on', settings.music);
  document.getElementById('animToggle').classList.toggle('on', settings.anim);
}
function handleMusicToggle() {
  if (settings.music) startBGMusic();
  else stopBGMusic();
}

// ════════════════════════════════════════════════════════════
//  AUDIO
// ════════════════════════════════════════════════════════════

let bgOscillator = null;
function getAudioCtx() {
  if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  return audioCtx;
}

function playSound(type) {
  if (!settings.sound) return;
  try {
    const ctx = getAudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain); gain.connect(ctx.destination);
    const sounds = {
      dice: { freq: [200, 400, 300], dur: 0.15 },
      move: { freq: [440, 550], dur: 0.1 },
      capture: { freq: [300, 150, 100], dur: 0.3 },
      win: { freq: [523, 659, 784, 1047], dur: 0.5 },
      safe: { freq: [440, 880], dur: 0.15 },
      enter: { freq: [330, 660, 990], dur: 0.3 },
      tick: { freq: [800], dur: 0.05 }
    };
    const s = sounds[type] || sounds.move;
    osc.type = 'sine';
    s.freq.forEach((f, i) => {
      osc.frequency.setValueAtTime(f, ctx.currentTime + i * (s.dur / s.freq.length));
    });
    gain.gain.setValueAtTime(0.2, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + s.dur);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + s.dur);
  } catch(e) {}
}

function startBGMusic() {
  stopBGMusic();
  try {
    const ctx = getAudioCtx();
    // Simple ambient music with oscillators
    bgOscillator = ctx.createOscillator();
    const gain = ctx.createGain();
    bgOscillator.connect(gain); gain.connect(ctx.destination);
    bgOscillator.type = 'triangle';
    bgOscillator.frequency.value = 220;
    gain.gain.value = 0.03;
    bgOscillator.start();
  } catch(e) {}
}

function stopBGMusic() {
  if (bgOscillator) { try { bgOscillator.stop(); } catch(e) {} bgOscillator = null; }
}

// ════════════════════════════════════════════════════════════
//  NETWORK DETECTION
// ════════════════════════════════════════════════════════════

function checkNetwork() {
  if (!navigator.onLine) openModal('noInternetModal');
}
function setupNetworkDetection() {
  window.addEventListener('offline', () => openModal('noInternetModal'));
  window.addEventListener('online', () => closeModal('noInternetModal'));
}

// ════════════════════════════════════════════════════════════
//  TOAST
// ════════════════════════════════════════════════════════════

let toastTimeout;
function showToast(msg, type = '') {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.className = 'toast show' + (type ? ' ' + type : '');
  clearTimeout(toastTimeout);
  toastTimeout = setTimeout(() => t.classList.remove('show'), 3000);
}

// ════════════════════════════════════════════════════════════
//  FORMAT HELPERS
// ════════════════════════════════════════════════════════════

function formatMoney(n) { return Number(n).toLocaleString('en-NG', { minimumFractionDigits: 2 }); }
function randInt(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }
function rollDice() { return randInt(1, 6); }

// ════════════════════════════════════════════════════════════
//  GAME STATE RESET
// ════════════════════════════════════════════════════════════

function createToken(color, id) {
  return { color, id, state: 'home', relPos: -1, homeStep: -1 };
  // state: 'home' | 'active' | 'homestretch' | 'finished'
  // relPos: -1 = home, 0-51 = main path (relative to entry)
  // homeStep: 0-4 = home stretch, 5 = finished (center)
}

function initGameState(mode, opts = {}) {
  // Determine player colors
  let p1Colors, p2Colors;
  if (opts.boardStyle === 'double') {
    p1Colors = ['red', 'blue'];
    p2Colors = ['green', 'yellow'];
  } else {
    p1Colors = ['red'];
    p2Colors = ['green'];
  }

  const tokens = {};
  [...p1Colors, ...p2Colors].forEach(color => {
    tokens[color] = [0,1,2,3].map(i => createToken(color, i));
  });

  GS = {
    mode, // 'computer' | 'friend' | 'bet'
    boardStyle: opts.boardStyle || 'classic',
    difficulty: opts.difficulty || 'medium',
    p1Colors,
    p2Colors,
    tokens,
    currentTurn: 'p1', // 'p1' | 'p2'
    currentColorIdx: 0, // which color in current player's list
    diceVal: null,
    diceRolled: false,
    extraTurn: false,
    selectedToken: null,
    timer: null,
    timerVal: TURN_TIME,
    gameOver: false,
    winner: null,
    roomId: opts.roomId || null,
    betStake: opts.betStake || 0,
    betWin: opts.betWin || 0,
    isHost: opts.isHost || false,
    myRole: opts.myRole || 'p1', // my role in multiplayer
    opponentUid: opts.opponentUid || null,
    p1Name: opts.p1Name || username,
    p2Name: opts.p2Name || (mode === 'computer' ? 'AI Opponent' : 'Opponent'),
    animating: false
  };
}

// ════════════════════════════════════════════════════════════
//  START GAME MODES
// ════════════════════════════════════════════════════════════

function startComputerGame() {
  const diff = document.querySelector('#difficultyGrid .option-item.selected')?.dataset.diff || 'medium';
  const style = document.querySelector('#boardStyleGrid .option-item.selected')?.dataset.style || 'classic';
  closeModal('computerModal');
  initGameState('computer', { difficulty: diff, boardStyle: style });
  setupGameScreen();
  showScreen('game');
  if (settings.music) startBGMusic();
  startTurn();
}

async function hostGame() {
  if (!currentUser) return;
  const style = document.querySelector('#friendBoardStyleGrid .option-item.selected')?.dataset.style || 'classic';
  const code = String(randInt(1000, 9999));
  document.getElementById('displayRoomCode').textContent = code;
  document.getElementById('hostSection').style.display = 'none';
  document.getElementById('roomWaiting').style.display = '';

  const roomData = {
    code,
    host: currentUser.uid,
    hostName: username,
    guest: null,
    guestName: null,
    boardStyle: style,
    status: 'waiting',
    createdAt: firebase.firestore.FieldValue.serverTimestamp()
  };
  try {
    await db.collection('ludo_rooms').doc(code).set(roomData);
    GS.roomId = code;
    GS.isHost = true;

    // Listen for guest to join
    roomListener = db.collection('ludo_rooms').doc(code).onSnapshot(snap => {
      const d = snap.data();
      if (d && d.guest && d.status === 'ready') {
        document.getElementById('guestSlot').innerHTML = `<div class="slot-icon" style="color:var(--green)">✓</div>${d.guestName || 'Guest'}`;
        document.getElementById('guestSlot').classList.add('filled');
        if (roomListener) { roomListener(); roomListener = null; }
        closeModal('friendModal');
        // Start game as p1 (host = red)
        initGameState('friend', {
          boardStyle: style,
          roomId: code,
          isHost: true,
          myRole: 'p1',
          p2Name: d.guestName || 'Guest',
          opponentUid: d.guest
        });
        setupGameScreen();
        showScreen('game');
        startTurn();
        // Update room to playing
        db.collection('ludo_rooms').doc(code).update({ status: 'playing' });
      }
    });
  } catch(e) { showToast('Error creating room: ' + e.message, 'error'); }
}

async function joinGame() {
  if (!currentUser) return;
  const code = document.getElementById('joinCodeInput').value.trim();
  if (code.length !== 4) { showToast('Enter a valid 4-digit code', 'error'); return; }
  try {
    const snap = await db.collection('ludo_rooms').doc(code).get();
    if (!snap.exists) { showToast('Room not found', 'error'); return; }
    const d = snap.data();
    if (d.status !== 'waiting') { showToast('Room already started or full', 'error'); return; }
    if (d.host === currentUser.uid) { showToast("Can't join your own room", 'error'); return; }
    // Join the room
    await db.collection('ludo_rooms').doc(code).update({
      guest: currentUser.uid, guestName: username, status: 'ready'
    });
    closeModal('friendModal');
    initGameState('friend', {
      boardStyle: d.boardStyle || 'classic',
      roomId: code,
      isHost: false,
      myRole: 'p2',
      p1Name: d.hostName || 'Host',
      opponentUid: d.host
    });
    setupGameScreen();
    showScreen('game');
    startTurn();
    // Listen for game updates
    startRoomListener(code);
  } catch(e) { showToast('Error joining room: ' + e.message, 'error'); }
}

async function cancelRoom() {
  if (GS.roomId) {
    await db.collection('ludo_rooms').doc(GS.roomId).delete();
    if (roomListener) { roomListener(); roomListener = null; }
    GS.roomId = null;
  }
  document.getElementById('hostSection').style.display = '';
  document.getElementById('roomWaiting').style.display = 'none';
}

// ════════════════════════════════════════════════════════════
//  BET MATCHMAKING
// ════════════════════════════════════════════════════════════

let matchSearchInterval = null;
let matchSearchElapsed = 0;

async function startBetSearch() {
  if (!currentUser) return;
  const stake = GS.betStake;
  if (!stake) { showToast('Select a stake amount', 'error'); return; }
  if (userBalance < stake) { showToast('Insufficient balance. Deposit via Globals app.', 'error'); return; }

  closeModal('betModal');
  document.getElementById('matchStakeDisplay').textContent = `₦${stake} Stake`;
  document.getElementById('matchDesc').textContent = `Searching for a player with ₦${stake} stake...`;
  openModal('matchmakingModal');
  matchSearchElapsed = 0;

  try {
    // Deduct balance via Firestore transaction
    await db.runTransaction(async tx => {
      const balRef = db.collection('balance').doc(currentUser.uid);
      const balSnap = await tx.get(balRef);
      const bal = balSnap.data()?.amount || 0;
      if (bal < stake) throw new Error('Insufficient balance');
      tx.update(balRef, { amount: firebase.firestore.FieldValue.increment(-stake) });
    });

    // Add to matchmaking queue
    await db.collection('ludo_matchmaking').doc(currentUser.uid).set({
      uid: currentUser.uid,
      username,
      stake,
      status: 'searching',
      createdAt: firebase.firestore.FieldValue.serverTimestamp(),
      roomId: null
    });

    // Listen for match
    matchListener = db.collection('ludo_matchmaking').doc(currentUser.uid).onSnapshot(snap => {
      const d = snap.data();
      if (d && d.status === 'matched' && d.roomId) {
        clearInterval(matchSearchInterval);
        if (matchListener) { matchListener(); matchListener = null; }
        closeModal('matchmakingModal');
        joinBetRoom(d.roomId, d.stake, d.winAmount, d.role);
      }
    });

    // Server-side matchmaking via polling
    matchSearchInterval = setInterval(() => {
      matchSearchElapsed++;
      document.getElementById('matchTimer').textContent = matchSearchElapsed + 's';
      if (matchSearchElapsed >= 60) {
        // No match found — refund
        cancelBetSearch(true);
      }
    }, 1000);

    // Try to find an existing searcher
    tryMatchmaking(stake);

  } catch(e) {
    showToast(e.message || 'Error starting search', 'error');
    closeModal('matchmakingModal');
  }
}

async function tryMatchmaking(stake) {
  try {
    const now = new Date();
    const cutoff = new Date(now.getTime() - 60000);
    const snap = await db.collection('ludo_matchmaking')
      .where('stake', '==', stake)
      .where('status', '==', 'searching')
      .orderBy('createdAt', 'asc')
      .get();

    const candidates = snap.docs.filter(d =>
      d.id !== currentUser.uid && d.data().createdAt?.toDate() > cutoff
    );

    if (candidates.length > 0) {
      const opponent = candidates[0];
      const oppData = opponent.data();
      const roomId = 'bet_' + Date.now();
      const winAmount = GS.betWin;

      // Create bet game room
      await db.runTransaction(async tx => {
        const myRef = db.collection('ludo_matchmaking').doc(currentUser.uid);
        const oppRef = db.collection('ludo_matchmaking').doc(opponent.id);
        const oppSnap = await tx.get(oppRef);
        if (!oppSnap.exists || oppSnap.data().status !== 'searching') return;

        const roomRef = db.collection('ludo_bet_rooms').doc(roomId);
        tx.set(roomRef, {
          p1: opponent.id, p1Name: oppData.username,
          p2: currentUser.uid, p2Name: username,
          stake, winAmount,
          status: 'playing',
          createdAt: firebase.firestore.FieldValue.serverTimestamp(),
          gameState: null, winner: null
        });
        tx.update(oppRef, { status: 'matched', roomId, role: 'p1', winAmount });
        tx.update(myRef, { status: 'matched', roomId, role: 'p2', winAmount });
      });
    }
  } catch(e) { console.error('Matchmaking error:', e); }
}

async function cancelBetSearch(refund = true) {
  clearInterval(matchSearchInterval);
  if (matchListener) { matchListener(); matchListener = null; }
  closeModal('matchmakingModal');

  if (currentUser) {
    try {
      const doc = await db.collection('ludo_matchmaking').doc(currentUser.uid).get();
      if (doc.exists && doc.data().status === 'searching') {
        await db.collection('ludo_matchmaking').doc(currentUser.uid).delete();
        if (refund) {
          await db.collection('balance').doc(currentUser.uid).update({
            amount: firebase.firestore.FieldValue.increment(GS.betStake || 0)
          });
          showToast('No match found. Stake refunded ✓', 'warning');
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
      boardStyle: 'double',
      roomId,
      isHost: role === 'p1',
      myRole: role,
      betStake: stake,
      betWin: winAmount,
      p1Name: d.p1Name,
      p2Name: d.p2Name,
      opponentUid: role === 'p1' ? d.p2 : d.p1
    });
    setupGameScreen();
    showScreen('game');
    startTurn();
    startRoomListener(roomId, true);
  } catch(e) { showToast('Error joining bet room', 'error'); }
}

// ════════════════════════════════════════════════════════════
//  ROOM LISTENER (multiplayer sync)
// ════════════════════════════════════════════════════════════

function startRoomListener(roomId, isBet = false) {
  const col = isBet ? 'ludo_bet_rooms' : 'ludo_rooms';
  roomListener = db.collection(col).doc(roomId).onSnapshot(snap => {
    if (!snap.exists) return;
    const d = snap.data();
    // Sync remote game state
    if (d.gameState && GS.myRole !== d.gameState.lastActor) {
      syncRemoteState(d.gameState);
    }
    if (d.winner) {
      handleRemoteWin(d.winner, isBet);
    }
  });
}

function syncRemoteState(remoteGS) {
  if (!remoteGS || GS.gameOver) return;
  // Apply opponent's move
  GS.tokens = remoteGS.tokens;
  GS.currentTurn = remoteGS.currentTurn;
  GS.diceVal = remoteGS.diceVal;
  GS.diceRolled = false;
  drawBoard();
  drawDice(remoteGS.diceVal);
  updatePanels();
  if (remoteGS.currentTurn === GS.myRole) {
    enableMyTurn();
  }
}

async function pushGameState(lastActor) {
  if (!GS.roomId) return;
  const col = GS.mode === 'bet' ? 'ludo_bet_rooms' : 'ludo_rooms';
  const state = {
    tokens: GS.tokens,
    currentTurn: GS.currentTurn,
    diceVal: GS.diceVal,
    lastActor
  };
  await db.collection(col).doc(GS.roomId).update({ gameState: state });
}

// ════════════════════════════════════════════════════════════
//  GAME SCREEN SETUP
// ════════════════════════════════════════════════════════════

function setupGameScreen() {
  // Resize canvas
  const wrap = document.querySelector('.board-wrap');
  const size = Math.min(wrap.clientWidth - 16, wrap.clientHeight - 8, 480);
  const canvas = document.getElementById('gameCanvas');
  canvas.width = size;
  canvas.height = size;

  // Header
  const modeLabels = { computer: 'vs AI', friend: 'vs Friend', bet: 'Bet Match' };
  const modeBadge = document.getElementById('gameModeLabel');
  modeBadge.textContent = modeLabels[GS.mode] || 'Game';
  modeBadge.className = 'game-mode-badge ' + (GS.mode === 'bet' ? 'badge-gold' : GS.mode === 'friend' ? 'badge-blue' : 'badge-red');

  // Player names
  document.getElementById('pp1name').textContent = GS.p1Name;
  document.getElementById('pp2name').textContent = GS.p2Name;

  // Quit note
  const qNote = document.getElementById('quitNote');
  qNote.textContent = GS.mode === 'bet' ? '(Your opponent wins & you forfeit your stake.)' :
    GS.mode === 'friend' ? '(Your opponent wins.)' : '';

  drawBoard();
  drawDice(null);
  updatePanels();
}

// ════════════════════════════════════════════════════════════
//  BOARD DRAWING
// ════════════════════════════════════════════════════════════

function drawBoard() {
  const canvas = document.getElementById('gameCanvas');
  const ctx = canvas.getContext('2d');
  const W = canvas.width;
  const cs = W / COLS;

  ctx.clearRect(0, 0, W, W);

  // Background
  ctx.fillStyle = '#1a2235';
  ctx.fillRect(0, 0, W, W);

  // Draw each cell
  for (let r = 0; r < COLS; r++) {
    for (let c = 0; c < COLS; c++) {
      drawCell(ctx, r, c, cs);
    }
  }

  // Draw center star
  drawCenter(ctx, cs);

  // Draw tokens
  drawAllTokens(ctx, cs);
}

function getCellColor(r, c) {
  // Corner home bases
  if (r <= 5 && c <= 5) return { bg: CLR.red.light, type: 'corner_red' };
  if (r <= 5 && c >= 9) return { bg: CLR.green.light, type: 'corner_green' };
  if (r >= 9 && c >= 9) return { bg: CLR.yellow.light, type: 'corner_yellow' };
  if (r >= 9 && c <= 5) return { bg: CLR.blue.light, type: 'corner_blue' };

  // Inner white home box within corners
  if (r>=1&&r<=4&&c>=1&&c<=4) return { bg: '#fff', type: 'home_box_red' };
  if (r>=1&&r<=4&&c>=10&&c<=13) return { bg: '#fff', type: 'home_box_green' };
  if (r>=10&&r<=13&&c>=10&&c<=13) return { bg: '#fff', type: 'home_box_yellow' };
  if (r>=10&&r<=13&&c>=1&&c<=4) return { bg: '#fff', type: 'home_box_blue' };

  // Center
  if (r>=6&&r<=8&&c>=6&&c<=8) return { bg: null, type: 'center' };

  // Home stretches
  const hs = HOME_STRETCH;
  for (const [color, cells] of Object.entries(hs)) {
    if (cells.some(([hr,hc]) => hr===r && hc===c)) return { bg: CLR[color].fill, type: 'home_stretch_' + color };
  }

  // Main path
  const pathIdx = MAIN_PATH.findIndex(([pr,pc]) => pr===r && pc===c);
  if (pathIdx !== -1) {
    // Colored starting cells
    if (pathIdx === 0) return { bg: CLR.red.fill, type: 'start_red', pathIdx, safe: true };
    if (pathIdx === 13) return { bg: CLR.green.fill, type: 'start_green', pathIdx, safe: true };
    if (pathIdx === 26) return { bg: CLR.yellow.fill, type: 'start_yellow', pathIdx, safe: true };
    if (pathIdx === 39) return { bg: CLR.blue.fill, type: 'start_blue', pathIdx, safe: true };
    if (SAFE_ABS.has(pathIdx)) return { bg: '#FFF8E1', type: 'safe', pathIdx, safe: true };
    return { bg: '#FFFFFF', type: 'path', pathIdx };
  }

  return { bg: '#e5e7eb', type: 'inactive' };
}

function drawCell(ctx, r, c, cs) {
  const x = c * cs, y = r * cs;
  const info = getCellColor(r, c);

  if (info.type === 'center') return; // drawn separately

  ctx.fillStyle = info.bg || '#e5e7eb';
  ctx.fillRect(x, y, cs, cs);

  // Grid lines
  ctx.strokeStyle = 'rgba(0,0,0,0.12)';
  ctx.lineWidth = 0.5;
  ctx.strokeRect(x, y, cs, cs);

  // Safe star marker
  if (info.safe && !info.type.startsWith('start')) {
    drawStar(ctx, x + cs/2, y + cs/2, cs * 0.35, 5, 0.5);
    ctx.fillStyle = '#F59E0B';
    ctx.fill();
  }

  // Starting cell indicator (arrow or circle)
  if (info.type && info.type.startsWith('start_')) {
    const color = info.type.replace('start_','');
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(x + cs/2, y + cs/2, cs * 0.3, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = CLR[color].fill;
    ctx.beginPath();
    ctx.arc(x + cs/2, y + cs/2, cs * 0.2, 0, Math.PI * 2);
    ctx.fill();
  }

  // Home box inner circles (token placeholders)
  const homeBoxMap = {
    home_box_red: [[1,1],[1,3],[3,1],[3,3]],
    home_box_green: [[1,10],[1,12],[3,10],[3,12]],
    home_box_yellow: [[10,10],[10,12],[12,10],[12,12]],
    home_box_blue: [[10,1],[10,3],[12,1],[12,3]]
  };
  // These are drawn by drawAllTokens for occupied spots
}

function drawStar(ctx, cx, cy, outerR, points, innerRatio) {
  const innerR = outerR * innerRatio;
  ctx.beginPath();
  for (let i = 0; i < points * 2; i++) {
    const angle = (i * Math.PI) / points - Math.PI / 2;
    const r = i % 2 === 0 ? outerR : innerR;
    i === 0 ? ctx.moveTo(cx + r * Math.cos(angle), cy + r * Math.sin(angle)) :
               ctx.lineTo(cx + r * Math.cos(angle), cy + r * Math.sin(angle));
  }
  ctx.closePath();
}

function drawCenter(ctx, cs) {
  const x = 6 * cs, y = 6 * cs, size = 3 * cs;
  // White background
  ctx.fillStyle = '#fff';
  ctx.fillRect(x, y, size, size);
  // 4 colored triangles
  const cx = x + size/2, cy = y + size/2;
  const corners = [
    [x, y],   [x+size, y],   [x+size, y+size],   [x, y+size]
  ];
  const triColors = [CLR.red.fill, CLR.green.fill, CLR.yellow.fill, CLR.blue.fill];
  corners.forEach(([cx2, cy2], i) => {
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(cx2, cy2);
    const next = corners[(i+1) % 4];
    ctx.lineTo(next[0], next[1]);
    ctx.closePath();
    ctx.fillStyle = triColors[i];
    ctx.fill();
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 1;
    ctx.stroke();
  });
  // Center circle
  ctx.beginPath();
  ctx.arc(cx, cy, cs * 0.6, 0, Math.PI * 2);
  ctx.fillStyle = '#fff';
  ctx.fill();
  ctx.strokeStyle = 'rgba(0,0,0,0.1)';
  ctx.lineWidth = 1;
  ctx.stroke();
}

function drawAllTokens(ctx, cs) {
  if (!GS.tokens) return;
  Object.values(GS.tokens).forEach(colorTokens => {
    colorTokens.forEach(token => drawToken(ctx, token, cs));
  });
}

function drawToken(ctx, token, cs) {
  const pos = getTokenCanvasPos(token, cs);
  if (!pos) return;

  const r = cs * 0.33;
  const { x, y, color } = pos;

  // Shadow
  ctx.shadowColor = 'rgba(0,0,0,0.4)';
  ctx.shadowBlur = 4;
  ctx.shadowOffsetY = 2;

  // Outer ring
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fillStyle = CLR[color].dark;
  ctx.fill();

  // Inner circle
  ctx.beginPath();
  ctx.arc(x, y, r * 0.75, 0, Math.PI * 2);
  ctx.fillStyle = CLR[color].fill;
  ctx.fill();

  // White dot
  ctx.beginPath();
  ctx.arc(x - r*0.2, y - r*0.2, r * 0.25, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(255,255,255,0.7)';
  ctx.fill();

  ctx.shadowColor = 'transparent'; ctx.shadowBlur = 0; ctx.shadowOffsetY = 0;

  // Selected highlight
  if (GS.selectedToken && GS.selectedToken.color === token.color && GS.selectedToken.id === token.id) {
    ctx.beginPath();
    ctx.arc(x, y, r + 3, 0, Math.PI * 2);
    ctx.strokeStyle = '#FFD700';
    ctx.lineWidth = 2.5;
    ctx.stroke();
    // Glow
    ctx.beginPath();
    ctx.arc(x, y, r + 6, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(255,215,0,0.3)';
    ctx.lineWidth = 4;
    ctx.stroke();
  }

  // Moveable hint (pulsing handled via redraw)
  if (GS.diceRolled && !GS.gameOver && isMyTurn() && canTokenMove(token)) {
    ctx.beginPath();
    ctx.arc(x, y, r + 2, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(255,255,255,0.5)';
    ctx.lineWidth = 1.5;
    ctx.stroke();
  }

  // Token number
  ctx.fillStyle = '#fff';
  ctx.font = `bold ${r * 0.7}px Rajdhani, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(token.id + 1, x, y + 0.5);
}

function getTokenCanvasPos(token, cs) {
  const color = token.color;
  if (!cs) cs = document.getElementById('gameCanvas').width / COLS;

  if (token.state === 'home') {
    const homePositions = HOME_BASE[color];
    const [row, col] = homePositions[token.id];
    return { x: col * cs, y: row * cs, color };
  }
  if (token.state === 'finished') return null; // don't draw

  if (token.state === 'active') {
    const absIdx = (ENTRY_IDX[color] + token.relPos) % 52;
    const [row, col] = MAIN_PATH[absIdx];
    // Offset tokens that share a cell
    const offset = getTokenOffset(token, absIdx);
    return { x: col * cs + offset.x, y: row * cs + offset.y, color };
  }
  if (token.state === 'homestretch') {
    const [row, col] = HOME_STRETCH[color][token.homeStep];
    return { x: col * cs, y: row * cs, color };
  }
  return null;
}

function getTokenOffset(token, absIdx) {
  // Small offset for multiple tokens on same cell
  const offsets = [[0,0],[6,-6],[-6,6],[6,6]];
  const o = offsets[token.id] || [0,0];
  return { x: o[0], y: o[1] };
}

// ════════════════════════════════════════════════════════════
//  DICE DRAWING
// ════════════════════════════════════════════════════════════

function drawDice(val) {
  const canvas = document.getElementById('diceCanvas');
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, 60, 60);

  // Background
  const grad = ctx.createLinearGradient(0, 0, 60, 60);
  grad.addColorStop(0, '#1a2235');
  grad.addColorStop(1, '#0a0e1a');
  ctx.fillStyle = grad;
  roundRect(ctx, 2, 2, 56, 56, 10);
  ctx.fill();

  ctx.strokeStyle = val ? '#FFD700' : 'rgba(255,255,255,0.15)';
  ctx.lineWidth = 1.5;
  roundRect(ctx, 2, 2, 56, 56, 10);
  ctx.stroke();

  if (!val) {
    // Dice face dots placeholder
    ctx.fillStyle = 'rgba(255,255,255,0.2)';
    ctx.beginPath(); ctx.arc(30, 30, 6, 0, Math.PI*2); ctx.fill();
    return;
  }

  // Dot positions for 1-6
  const dotMaps = {
    1: [[30,30]],
    2: [[20,20],[40,40]],
    3: [[20,20],[30,30],[40,40]],
    4: [[20,20],[40,20],[20,40],[40,40]],
    5: [[20,20],[40,20],[30,30],[20,40],[40,40]],
    6: [[20,18],[40,18],[20,30],[40,30],[20,42],[40,42]]
  };

  ctx.fillStyle = '#FFD700';
  (dotMaps[val] || []).forEach(([dx, dy]) => {
    ctx.beginPath(); ctx.arc(dx, dy, 5, 0, Math.PI*2); ctx.fill();
  });
}

let diceAnimFrame = null;
function animateDice(finalVal, cb) {
  if (!settings.anim) { drawDice(finalVal); if(cb) cb(); return; }
  let count = 0;
  const total = 12;
  function frame() {
    drawDice(randInt(1,6));
    count++;
    if (count < total) {
      diceAnimFrame = setTimeout(frame, count < 8 ? 60 : count < 11 ? 100 : 150);
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
  GS.diceVal = null;
  GS.diceRolled = false;
  GS.selectedToken = null;
  GS.extraTurn = false;
  clearTimer();
  updateStatus();
  updatePanels();

  const myTurn = isMyTurn();
  const rollBtn = document.getElementById('rollBtn');

  if (myTurn) {
    rollBtn.disabled = false;
    rollBtn.textContent = '🎲 ROLL DICE';
    document.getElementById('diceLabel').textContent = 'Tap to roll';
    startTimer();
  } else {
    rollBtn.disabled = true;
    rollBtn.textContent = 'Waiting...';
    document.getElementById('diceLabel').textContent = 'Opponent\'s turn';
    if (GS.mode === 'computer') {
      setTimeout(computerTurn, 1000);
    }
  }
  drawBoard();
}

function isMyTurn() {
  if (GS.mode === 'computer') return GS.currentTurn === 'p1';
  return GS.currentTurn === GS.myRole;
}

function enableMyTurn() {
  GS.diceRolled = false;
  document.getElementById('rollBtn').disabled = false;
  document.getElementById('rollBtn').textContent = '🎲 ROLL DICE';
  startTimer();
}

function startTimer() {
  GS.timerVal = TURN_TIME;
  updateTimerDisplay();
  GS.timer = setInterval(() => {
    GS.timerVal--;
    updateTimerDisplay();
    if (GS.timerVal <= 5) playSound('tick');
    if (GS.timerVal <= 0) {
      clearTimer();
      showToast('Time\'s up! Turn passed.', 'warning');
      nextTurn();
    }
  }, 1000);
}

function clearTimer() {
  if (GS.timer) { clearInterval(GS.timer); GS.timer = null; }
}

function updateTimerDisplay() {
  const turn = GS.currentTurn;
  const myTurn = isMyTurn();
  const panel1 = document.getElementById('pp1timer');
  const panel2 = document.getElementById('pp2timer');

  if (myTurn) {
    panel1.style.display = '';
    panel1.textContent = GS.timerVal;
    panel1.className = 'pp-timer' + (GS.timerVal <= 5 ? ' urgent' : '');
    panel2.style.display = 'none';
  } else if (GS.mode !== 'computer') {
    panel2.style.display = '';
    panel2.textContent = GS.timerVal;
    panel2.className = 'pp-timer' + (GS.timerVal <= 5 ? ' urgent' : '');
    panel1.style.display = 'none';
  }
}

function handleRoll() {
  if (!isMyTurn() || GS.diceRolled || GS.gameOver || GS.animating) return;
  clearTimer();
  const val = rollDice();
  GS.diceVal = val;
  playSound('dice');
  document.getElementById('rollBtn').disabled = true;

  animateDice(val, () => {
    GS.diceRolled = true;
    document.getElementById('diceLabel').textContent = `Rolled: ${val}`;
    checkMovableTokens();
  });
}

function checkMovableTokens() {
  const myColors = GS.currentTurn === 'p1' ? GS.p1Colors : GS.p2Colors;
  const movable = [];
  myColors.forEach(color => {
    GS.tokens[color].forEach(token => {
      if (canTokenMove(token)) movable.push(token);
    });
  });

  if (movable.length === 0) {
    updateStatus('No moves available — turn skipped');
    setTimeout(nextTurn, 1200);
  } else if (movable.length === 1) {
    // Auto-select if only one movable token
    moveToken(movable[0]);
  } else {
    updateStatus('Select a token to move');
    drawBoard();
  }
}

function canTokenMove(token) {
  const dice = GS.diceVal;
  if (!dice) return false;
  const myColors = GS.currentTurn === 'p1' ? GS.p1Colors : GS.p2Colors;
  if (!myColors.includes(token.color)) return false;
  if (token.state === 'finished') return false;
  if (token.state === 'home') return dice === 6;
  if (token.state === 'homestretch') {
    return token.homeStep + dice <= 4; // 5 steps (0-4) in homestretch
  }
  if (token.state === 'active') {
    const newRelPos = token.relPos + dice;
    if (newRelPos >= 52) {
      // Would enter home stretch
      return (newRelPos - 52) <= 4;
    }
    return true;
  }
  return false;
}

function handleBoardClick(e) {
  if (!GS.diceRolled || !isMyTurn() || GS.gameOver || GS.animating) return;
  const canvas = document.getElementById('gameCanvas');
  const rect = canvas.getBoundingClientRect();
  const scaleX = canvas.width / rect.width;
  const scaleY = canvas.height / rect.height;
  const mx = (e.clientX - rect.left) * scaleX;
  const my = (e.clientY - rect.top) * scaleY;
  const cs = canvas.width / COLS;

  const myColors = GS.currentTurn === 'p1' ? GS.p1Colors : GS.p2Colors;
  let clicked = null;

  myColors.forEach(color => {
    GS.tokens[color].forEach(token => {
      const pos = getTokenCanvasPos(token, cs);
      if (!pos) return;
      const dist = Math.hypot(pos.x - mx, pos.y - my);
      if (dist < cs * 0.45 && canTokenMove(token)) clicked = token;
    });
  });

  if (clicked) moveToken(clicked);
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

  if (token.state === 'home') {
    // Enter main path
    token.state = 'active';
    token.relPos = 0;
    playSound('enter');
    updateStatus(`${CLR[token.color].label} token enters the board!`);
  } else if (token.state === 'active') {
    const newRelPos = token.relPos + dice;
    if (newRelPos >= 52) {
      // Enter home stretch
      token.state = 'homestretch';
      token.homeStep = newRelPos - 52;
      token.relPos = 52;
      playSound('safe');
      updateStatus(`${CLR[token.color].label} enters the home stretch!`);
    } else {
      token.relPos = newRelPos;
      playSound('move');
    }
  } else if (token.state === 'homestretch') {
    token.homeStep += dice;
    if (token.homeStep >= 5) {
      token.homeStep = 5;
      token.state = 'finished';
      playSound('safe');
      updateStatus(`🏠 ${CLR[token.color].label} token reached HOME!`);
    } else {
      playSound('move');
    }
  }

  // Check captures (only on main path)
  if (token.state === 'active') checkCaptures(token);

  // Sync multiplayer
  if (GS.mode !== 'computer') {
    pushGameState(GS.myRole).catch(console.error);
  }

  drawBoard();

  setTimeout(() => {
    GS.animating = false;
    // Check win
    if (checkWin()) return;
    // Extra turn on 6 or capture
    if (dice === 6) {
      updateStatus('🎲 Rolled 6 — roll again!');
      GS.diceRolled = false;
      GS.diceVal = null;
      drawDice(null);
      document.getElementById('rollBtn').disabled = false;
      document.getElementById('diceLabel').textContent = 'Roll again!';
      startTimer();
    } else {
      nextTurn();
    }
  }, settings.anim ? 400 : 50);
}

function checkCaptures(movedToken) {
  const absIdx = (ENTRY_IDX[movedToken.color] + movedToken.relPos) % 52;
  if (SAFE_ABS.has(absIdx)) return; // Can't capture on safe squares

  const opponentColors = GS.currentTurn === 'p1' ? GS.p2Colors : GS.p1Colors;
  opponentColors.forEach(color => {
    GS.tokens[color].forEach(token => {
      if (token.state !== 'active') return;
      const tokenAbsIdx = (ENTRY_IDX[color] + token.relPos) % 52;
      if (tokenAbsIdx === absIdx) {
        // Check if it's actually their starting safe square
        if (SAFE_ABS.has(tokenAbsIdx)) return;
        // Capture!
        token.state = 'home';
        token.relPos = -1;
        playSound('capture');
        updateStatus(`💥 ${CLR[movedToken.color].label} captured ${CLR[color].label}!`);
        showToast(`${CLR[movedToken.color].label} captured ${CLR[color].label}!`, 'success');
      }
    });
  });
}

function checkWin() {
  const p1Done = GS.p1Colors.every(color =>
    GS.tokens[color].every(t => t.state === 'finished')
  );
  const p2Done = GS.p2Colors.every(color =>
    GS.tokens[color].every(t => t.state === 'finished')
  );

  if (p1Done || p2Done) {
    GS.gameOver = true;
    clearTimer();
    const winner = p1Done ? 'p1' : 'p2';
    GS.winner = winner;
    const winnerName = winner === 'p1' ? GS.p1Name : GS.p2Name;
    const isLocalWin = (GS.mode === 'computer' && winner === 'p1') ||
                       (GS.mode !== 'computer' && winner === GS.myRole);

    setTimeout(() => {
      showWinScreen(winnerName, isLocalWin);
      if (isLocalWin && GS.mode === 'bet') {
        creditWinnings();
      }
      if (GS.mode !== 'computer') {
        recordBetResult(winner);
      }
    }, 500);
    return true;
  }
  return false;
}

function nextTurn() {
  GS.currentTurn = GS.currentTurn === 'p1' ? 'p2' : 'p1';
  GS.diceVal = null;
  GS.diceRolled = false;
  drawDice(null);
  updatePanels();
  startTurn();
}

function updatePanels() {
  const p1 = GS.currentTurn === 'p1';
  document.getElementById('panel1').classList.toggle('active-turn', p1);
  document.getElementById('panel2').classList.toggle('active-turn', !p1);

  // Count finished tokens
  const p1Fin = GS.p1Colors.reduce((a, c) => a + GS.tokens[c].filter(t=>t.state==='finished').length, 0);
  const p2Fin = GS.p2Colors.reduce((a, c) => a + GS.tokens[c].filter(t=>t.state==='finished').length, 0);
  const p1Total = GS.p1Colors.length * 4;
  const p2Total = GS.p2Colors.length * 4;
  document.getElementById('pp1score').textContent = p1Fin + ' / ' + p1Total;
  document.getElementById('pp2score').textContent = p2Fin + ' / ' + p2Total;
}

function updateStatus(msg) {
  if (!msg) {
    const myTurn = isMyTurn();
    msg = myTurn ? 'Your turn — roll the dice!' : `${GS.currentTurn === 'p1' ? GS.p1Name : GS.p2Name}'s turn...`;
  }
  const el = document.getElementById('statusText');
  el.textContent = msg;
  el.className = 'status-text' + (isMyTurn() ? ' highlight' : '');
}

// ════════════════════════════════════════════════════════════
//  COMPUTER AI
// ════════════════════════════════════════════════════════════

function computerTurn() {
  if (GS.currentTurn !== 'p2' || GS.gameOver) return;

  const val = rollDice();
  GS.diceVal = val;
  playSound('dice');
  animateDice(val, () => {
    GS.diceRolled = true;
    document.getElementById('diceLabel').textContent = `AI rolled: ${val}`;

    setTimeout(() => {
      const token = chooseBestMove(val);
      if (token) {
        moveToken(token);
      } else {
        updateStatus('AI has no moves — passing turn');
        setTimeout(nextTurn, 1000);
      }
    }, 800);
  });
}

function chooseBestMove(dice) {
  const difficulty = GS.difficulty || 'medium';
  const myColors = GS.p2Colors;
  const oppColors = GS.p1Colors;

  // Get all movable tokens
  const movable = [];
  myColors.forEach(color => {
    GS.tokens[color].forEach(token => {
      if (canTokenMove(token)) movable.push(token);
    });
  });
  if (movable.length === 0) return null;

  // Easy: random
  if (difficulty === 'easy') {
    return movable[randInt(0, movable.length - 1)];
  }

  // Score each move
  const scored = movable.map(token => ({
    token,
    score: scoreMove(token, dice, difficulty, oppColors)
  }));
  scored.sort((a, b) => b.score - a.score);

  // Expert/hard: always best. Medium: sometimes random
  if (difficulty === 'medium' && Math.random() < 0.25) {
    return movable[randInt(0, movable.length - 1)];
  }
  return scored[0].token;
}

function scoreMove(token, dice, difficulty, oppColors) {
  let score = 0;

  // Prefer tokens closer to finishing
  if (token.state === 'homestretch') score += 500 + token.homeStep * 50;
  if (token.state === 'active') score += token.relPos * 5;

  // Prefer entering the board
  if (token.state === 'home' && dice === 6) score += 100;

  // Prefer captures
  if (token.state === 'active') {
    const newRelPos = token.relPos + dice;
    const newAbsIdx = (ENTRY_IDX[token.color] + newRelPos) % 52;
    oppColors.forEach(color => {
      GS.tokens[color].forEach(opp => {
        if (opp.state === 'active') {
          const oppAbsIdx = (ENTRY_IDX[color] + opp.relPos) % 52;
          if (oppAbsIdx === newAbsIdx && !SAFE_ABS.has(newAbsIdx)) {
            score += 300 + (difficulty === 'expert' ? 200 : 0);
          }
        }
      });
    });
  }

  // Prefer safe squares
  if (token.state === 'active') {
    const newAbsIdx = (ENTRY_IDX[token.color] + token.relPos + dice) % 52;
    if (SAFE_ABS.has(newAbsIdx)) score += 80;
  }

  // Avoid danger (expert)
  if (difficulty === 'expert' && token.state === 'active') {
    const newAbsIdx = (ENTRY_IDX[token.color] + token.relPos + dice) % 52;
    if (!SAFE_ABS.has(newAbsIdx)) {
      oppColors.forEach(color => {
        GS.tokens[color].forEach(opp => {
          if (opp.state === 'active') {
            const threatRange = [1,2,3,4,5,6].map(d => (ENTRY_IDX[color] + opp.relPos + d) % 52);
            if (threatRange.includes(newAbsIdx)) score -= 150;
          }
        });
      });
    }
  }

  return score;
}

// ════════════════════════════════════════════════════════════
//  WIN SCREEN
// ════════════════════════════════════════════════════════════

function showWinScreen(winnerName, isLocalWin) {
  playSound('win');
  document.getElementById('winTitle').textContent = isLocalWin ? 'YOU WIN! 🏆' : winnerName + ' Wins!';
  document.getElementById('winSubtitle').textContent = isLocalWin
    ? 'Brilliant strategy! You crushed it!' : 'Better luck next time. Keep practicing!';

  const winAmountEl = document.getElementById('winAmount');
  const winAmountNum = document.getElementById('winAmountNum');
  if (isLocalWin && GS.mode === 'bet') {
    winAmountEl.style.display = '';
    winAmountNum.textContent = formatMoney(GS.betWin);
  } else {
    winAmountEl.style.display = 'none';
  }

  showScreen('winScreen');
  if (isLocalWin) spawnConfetti();
}

function spawnConfetti() {
  const container = document.getElementById('confettiContainer');
  container.innerHTML = '';
  const colors = ['#FFD700','#EF4444','#22C55E','#3B82F6','#8B5CF6','#FF6B00'];
  for (let i = 0; i < 80; i++) {
    const el = document.createElement('div');
    el.style.cssText = `
      position:absolute;
      width:${randInt(6,14)}px;height:${randInt(6,14)}px;
      background:${colors[randInt(0,colors.length-1)]};
      left:${randInt(0,100)}%;
      top:-20px;
      border-radius:${Math.random()>0.5?'50%':'2px'};
      animation: confettiDrop ${1.5+Math.random()*2}s ${Math.random()*1.5}s ease-in forwards;
      opacity:0.9;
    `;
    container.appendChild(el);
  }
}

function closeWinScreen() {
  document.getElementById('confettiContainer').innerHTML = '';
  showScreen('main');
}

function playAgain() {
  document.getElementById('confettiContainer').innerHTML = '';
  if (GS.mode === 'computer') {
    closeModal('computerModal');
    startComputerGame();
  } else {
    showScreen('main');
  }
}

// ════════════════════════════════════════════════════════════
//  FIRESTORE: CREDIT WINNINGS & RECORD BET
// ════════════════════════════════════════════════════════════

async function creditWinnings() {
  if (!currentUser || !GS.betWin) return;
  try {
    await db.runTransaction(async tx => {
      const ref = db.collection('balance').doc(currentUser.uid);
      tx.update(ref, { amount: firebase.firestore.FieldValue.increment(GS.betWin) });
    });
    // Record in ludo_transactions
    await db.collection('ludo_transactions').add({
      uid: currentUser.uid,
      username,
      type: 'win',
      stake: GS.betStake,
      amount: GS.betWin,
      roomId: GS.roomId,
      timestamp: firebase.firestore.FieldValue.serverTimestamp()
    });
    showToast(`₦${formatMoney(GS.betWin)} added to your balance!`, 'success');
  } catch(e) { console.error('Error crediting:', e); }
}

async function recordBetResult(winner) {
  if (!GS.roomId || GS.mode !== 'bet') return;
  try {
    const col = 'ludo_bet_rooms';
    const winnerUid = winner === 'p1' ? GS.opponentUid : currentUser.uid;
    if (GS.isHost && winner === 'p1') {
      // host is p1, they won — already handled by creditWinnings for host
    }
    await db.collection(col).doc(GS.roomId).update({
      winner, winnerUid, status: 'completed', endedAt: firebase.firestore.FieldValue.serverTimestamp()
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

  // If bet mode and opponent wins
  if (GS.mode === 'bet' && GS.roomId) {
    const opponentRole = GS.myRole === 'p1' ? 'p2' : 'p1';
    try {
      await db.collection('ludo_bet_rooms').doc(GS.roomId).update({
        winner: opponentRole,
        status: 'forfeit',
        endedAt: firebase.firestore.FieldValue.serverTimestamp()
      });
      // Credit opponent
      if (GS.opponentUid) {
        await db.collection('balance').doc(GS.opponentUid).update({
          amount: firebase.firestore.FieldValue.increment(GS.betWin)
        });
      }
      showToast('You forfeited. Opponent wins.', 'error');
    } catch(e) { console.error(e); }
  } else if (GS.mode === 'friend' && GS.roomId) {
    await db.collection('ludo_rooms').doc(GS.roomId).update({ status: 'forfeit', quitter: currentUser.uid });
  }

  if (roomListener) { roomListener(); roomListener = null; }
  stopBGMusic();
  showScreen('main');
}

function handleRemoteWin(winner, isBet) {
  if (GS.gameOver) return;
  GS.gameOver = true;
  clearTimer();
  const isLocalWin = winner === GS.myRole;
  const winnerName = winner === 'p1' ? GS.p1Name : GS.p2Name;
  showWinScreen(winnerName, isLocalWin);
  if (isLocalWin && isBet) creditWinnings();
}

// ════════════════════════════════════════════════════════════
//  CHAT AI SUPPORT
// ════════════════════════════════════════════════════════════

const FAQ = [
  { q: ['roll', 'dice', 'how to roll'], a: 'Tap the "Roll Dice" button when it\'s your turn. You must roll a 6 to move a token out of home.' },
  { q: ['6', 'six', 'extra turn', 'again'], a: 'Rolling a 6 gives you an extra roll! Also, you can use a 6 to bring a new token onto the board.' },
  { q: ['safe', 'star', 'capture', 'protect'], a: 'Starred squares are safe — tokens there can\'t be captured. The entry square for each color is also safe.' },
  { q: ['bet', 'stake', 'money', 'win'], a: 'In Bet Mode, choose a stake (₦50 to ₦2000). You\'re matched with a player staking the same amount. Winner takes the prize!' },
  { q: ['deposit', 'add money', 'balance'], a: 'Deposits are made on the main Globals platform. Your balance shows here in real-time.' },
  { q: ['friend', 'room', 'code', 'join'], a: 'Host a room to get a 4-digit code. Share it with your friend. They enter it on the "Join" tab.' },
  { q: ['computer', 'ai', 'difficulty'], a: 'In vs Computer mode, pick Easy, Medium, Hard, or Expert. The AI uses strategic scoring to choose the best moves.' },
  { q: ['time', 'timer', 'turn'], a: 'You have 30 seconds per turn. If time runs out, your turn is skipped automatically.' },
  { q: ['quit', 'forfeit', 'leave'], a: 'If you quit a bet game, your opponent wins automatically and receives the prize.' },
  { q: ['win', 'home', 'finish'], a: 'Get all your tokens to the center "home" to win. Tokens enter the home stretch from their colored column.' }
];

function handleChatSend() {
  const input = document.getElementById('chatInput');
  const msg = input.value.trim();
  if (!msg) return;
  input.value = '';
  addChatMsg(msg, 'user');

  setTimeout(() => {
    const reply = getChatReply(msg.toLowerCase());
    addChatMsg(reply, 'ai');
  }, 400);
}

function getChatReply(msg) {
  for (const faq of FAQ) {
    if (faq.q.some(k => msg.includes(k))) return faq.a;
  }
  if (msg.includes('help') || msg.includes('support')) return 'I can help with rules, betting, multiplayer, and more. What would you like to know about Globals Ludo?';
  return 'Great question! Try asking about: dice rolling, bet mode, room codes, the timer, or how to win. I\'m here to help! 🎮';
}

function addChatMsg(text, who) {
  const msgs = document.getElementById('chatMessages');
  const div = document.createElement('div');
  div.className = 'chat-msg ' + who;
  div.innerHTML = `<div class="chat-bubble">${text}</div>`;
  msgs.appendChild(div);
  msgs.scrollTop = msgs.scrollHeight;
}

// ════════════════════════════════════════════════════════════
//  ANIMATION LOOP (for pulsing highlight)
// ════════════════════════════════════════════════════════════

let animLoop = null;
let animPulse = 0;

function startAnimLoop() {
  function frame() {
    animPulse = (animPulse + 1) % 60;
    if (GS.diceRolled && isMyTurn() && !GS.gameOver && document.getElementById('game').classList.contains('active')) {
      drawBoard();
    }
    animLoop = requestAnimationFrame(frame);
  }
  if (!animLoop) frame();
}

// ════════════════════════════════════════════════════════════
//  BOOT COMPLETE
// ════════════════════════════════════════════════════════════

window.addEventListener('load', () => {
  startAnimLoop();
});

// Handle window resize
window.addEventListener('resize', () => {
  if (document.getElementById('game').classList.contains('active')) {
    const wrap = document.querySelector('.board-wrap');
    const size = Math.min(wrap.clientWidth - 16, wrap.clientHeight - 8, 480);
    const canvas = document.getElementById('gameCanvas');
    canvas.width = size;
    canvas.height = size;
    drawBoard();
  }
});
