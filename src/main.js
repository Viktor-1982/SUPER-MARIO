(function () {
  'use strict';

  const canvas = document.getElementById('game-canvas');
  const cabinet = document.querySelector('.cabinet');
  const engine = new window.MarioEngine(canvas);
  const audio = window.MarioAudio;

  const btnMute = document.getElementById('btn-mute');
  const btnAspect = document.getElementById('btn-aspect');
  const btnCrt = document.getElementById('btn-crt');
  const btnPause = document.getElementById('btn-pause');
  const btnRestart = document.getElementById('btn-restart');
  const btnFullscreen = document.getElementById('btn-fullscreen');
  const screenBezel = document.getElementById('screen-bezel');
  const crtOverlay = document.getElementById('crt-overlay');
  const toolbarFeedback = document.getElementById('toolbar-feedback');

  function setPressed(button, pressed) {
    button.classList.toggle('active', pressed);
    button.setAttribute('aria-pressed', String(pressed));
  }

  function toggleMute() {
    audio.init();
    const muted = audio.toggleMute();
    btnMute.textContent = muted ? '🔇' : '🔊';
    setPressed(btnMute, muted);
  }

  const RENDER_SCALE = 4;

  function syncViewport() {
    const classic = screenBezel.classList.contains('aspect-classic');
    let targetW = 256;
    if (!classic) {
      const rect = screenBezel.getBoundingClientRect();
      const aspect = rect.height > 0 ? (rect.width / rect.height) : (window.innerWidth / window.innerHeight);
      targetW = Math.max(256, Math.min(512, Math.round(240 * aspect)));
    }
    const pxW = targetW * RENDER_SCALE;
    const pxH = 240 * RENDER_SCALE;
    if (canvas.width !== pxW || canvas.height !== pxH) {
      canvas.width = pxW;
      canvas.height = pxH;
      engine.setScreenWidth(targetW, RENDER_SCALE);
    }
  }

  function toggleAspect() {
    const classic = screenBezel.classList.toggle('aspect-classic');
    btnAspect.textContent = classic ? '↔ 4:3' : '↔ 16:9';
    setPressed(btnAspect, classic);
    syncViewport();
  }

  window.addEventListener('resize', syncViewport);
  document.addEventListener('fullscreenchange', () => setTimeout(syncViewport, 50));
  syncViewport();

  function toggleCrt() {
    setPressed(btnCrt, crtOverlay.classList.toggle('enabled'));
  }

  btnMute.addEventListener('click', toggleMute);
  btnAspect.addEventListener('click', toggleAspect);
  btnCrt.addEventListener('click', toggleCrt);
  btnPause.addEventListener('click', () => engine.togglePause());
  btnRestart.addEventListener('click', restartLevel);

  async function toggleFullscreen() {
    toolbarFeedback.textContent = '';
    try {
      if (document.fullscreenElement === cabinet) {
        await document.exitFullscreen();
      } else {
        await cabinet.requestFullscreen();
      }
    } catch {
      toolbarFeedback.textContent = 'Полноэкранный режим недоступен.';
    }
  }

  btnFullscreen.disabled = !document.fullscreenEnabled;
  btnFullscreen.addEventListener('click', toggleFullscreen);
  document.addEventListener('fullscreenchange', () => {
    setPressed(btnFullscreen, document.fullscreenElement === cabinet);
  });

  const bindings = {
    ArrowLeft: 'left', KeyA: 'left',
    ArrowRight: 'right', KeyD: 'right',
    ArrowDown: 'down', KeyS: 'down',
    ArrowUp: 'jump', KeyW: 'jump', Space: 'jump', KeyZ: 'jump', KeyK: 'jump',
    ShiftLeft: 'run', ShiftRight: 'run', KeyX: 'run', KeyJ: 'run',
  };

  const held = {
    left: new Set(), right: new Set(), down: new Set(), jump: new Set(), run: new Set(),
  };

  function clearInputs() {
    for (const [action, sources] of Object.entries(held)) {
      sources.clear();
      engine.input[action] = false;
    }
    engine.input.jumpPressed = false;
    engine.input.firePressed = false;
  }

  function restartLevel() {
    if (btnRestart.disabled) return;
    clearInputs();
    engine.restartCurrentLevel();
  }

  function activateMenu() {
    if (engine.state === 'title') {
      audio.init();
      clearInputs();
      engine.startNewGame(engine.selectedLevelIdx || 0);
    } else if (engine.state === 'gameOver' || engine.state === 'victory') {
      clearInputs();
      engine.input.jumpPressed = true;
    }
  }

  function shiftTitleWorld(delta) {
    if (engine.state !== 'title') return;
    audio.init();
    const count = window.MarioLevels.LEVEL_ORDER.length;
    engine.selectedLevelIdx = ((engine.selectedLevelIdx || 0) + delta + count) % count;
    audio.playSfx('beep');
  }

  function pressAction(action, source) {
    const sources = held[action];
    if (sources.has(source)) return;
    if (!sources.size) {
      if (action === 'jump') engine.input.jumpPressed = true;
      if (action === 'run') engine.input.firePressed = true;
    }
    sources.add(source);
    engine.input[action] = true;
  }

  function releaseAction(action, source) {
    held[action].delete(source);
    engine.input[action] = held[action].size > 0;
  }

  window.addEventListener('keydown', (event) => {
    const { code, target } = event;
    if (event.ctrlKey || event.altKey || event.metaKey ||
        target?.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(target?.tagName)) return;
    if (target?.tagName === 'BUTTON' && (code === 'Enter' || code === 'Space')) return;

    const action = bindings[code];
    if (action || code === 'Enter') event.preventDefault();
    if (event.repeat) return;

    if (code === 'Enter') {
      activateMenu();
      return;
    }
    if (engine.state === 'gameOver' || engine.state === 'victory') {
      if (code === 'Space' || code === 'KeyZ' || code === 'KeyK') activateMenu();
      return;
    }
    if (engine.state === 'title' && action) {
      if (code === 'Space' || code === 'KeyZ' || code === 'KeyK') activateMenu();
      else if (action === 'left') shiftTitleWorld(-1);
      else if (action === 'right') shiftTitleWorld(1);
      else if (code === 'ArrowUp' || code === 'KeyW') shiftTitleWorld(4);
      else if (action === 'down') shiftTitleWorld(-4);
      return;
    }

    switch (code) {
      case 'KeyP': engine.togglePause(); return;
      case 'Escape':
        if (gpModal && !gpModal.hidden) { closeGpModal(); return; }
        if (!document.fullscreenElement) engine.togglePause();
        return;
      case 'KeyM': toggleMute(); return;
      case 'KeyV': toggleAspect(); return;
      case 'KeyC': toggleCrt(); return;
      case 'KeyF': if (!btnFullscreen.disabled) toggleFullscreen(); return;
      case 'KeyR': restartLevel(); return;
    }

    if (action) {
      audio.init();
      pressAction(action, code);
    }
  });

  window.addEventListener('keyup', ({ code }) => {
    const action = bindings[code];
    if (action) releaseAction(action, code);
  });

  function onFocusLost() {
    clearInputs();
    if (engine.state === 'playing') engine.togglePause();
  }

  window.addEventListener('blur', onFocusLost);
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) onFocusLost();
  });

  canvas.addEventListener('click', activateMenu);

  for (const button of document.querySelectorAll('[data-control]')) {
    const action = button.dataset.control;

    function startControl(source) {
      if (engine.state === 'title' || engine.state === 'gameOver' || engine.state === 'victory') {
        if (action === 'jump') activateMenu();
      } else {
        audio.init();
        pressAction(action, source);
      }
    }

    button.addEventListener('pointerdown', (event) => {
      if (event.button !== 0) return;
      button.setPointerCapture(event.pointerId);
      startControl('pointer-' + event.pointerId);
    });

    for (const type of ['pointerup', 'pointercancel', 'lostpointercapture']) {
      button.addEventListener(type, (event) => releaseAction(action, 'pointer-' + event.pointerId));
    }

    button.addEventListener('click', (event) => {
      // Keyboard and assistive input do not go through pointerdown.
      if (event.detail !== 0) return;
      startControl('activate-' + action);
      releaseAction(action, 'activate-' + action);
    });
  }

  const STEP = 1000 / 60;
  let lastTime = performance.now();
  let accumulator = 0;
  let lastUiState;

  function syncToolbar() {
    const state = engine.state;
    if (state === lastUiState) return;
    lastUiState = state;
    const paused = state === 'paused';
    btnPause.disabled = state !== 'playing' && !paused;
    btnPause.textContent = paused ? '▶' : '⏸';
    setPressed(btnPause, paused);
    btnRestart.disabled = state !== 'playing' && !paused;
  }

  // ---- Universal Plug-and-Play Gamepad / Joystick Support (Xbox, PlayStation, Switch, USB NES, DirectInput) ----
  const btnGamepad = document.getElementById('btn-gamepad');
  const gpModal = document.getElementById('gamepad-modal');
  const gpClose = document.getElementById('gp-close');
  const gpDone = document.getElementById('gp-done');
  const gpReset = document.getElementById('gp-reset');
  const gpStatus = document.getElementById('gp-status');
  const gpLive = document.getElementById('gp-live');
  const gpUpJump = document.getElementById('gp-up-jump');
  const gpBindButtons = Array.from(document.querySelectorAll('[data-gp-bind]'));

  const DEFAULT_GP_CFG = {
    jump: [0, 3],
    run: [1, 2, 4, 5, 6, 7],
    start: [9],
    select: [8],
    upToJump: false
  };

  function loadGpCfg() {
    try {
      const raw = localStorage.getItem('smb_gamepad_cfg');
      if (raw) {
        const parsed = JSON.parse(raw);
        return {
          jump: Array.isArray(parsed.jump) && parsed.jump.length ? parsed.jump : DEFAULT_GP_CFG.jump.slice(),
          run: Array.isArray(parsed.run) && parsed.run.length ? parsed.run : DEFAULT_GP_CFG.run.slice(),
          start: Array.isArray(parsed.start) && parsed.start.length ? parsed.start : DEFAULT_GP_CFG.start.slice(),
          select: Array.isArray(parsed.select) && parsed.select.length ? parsed.select : DEFAULT_GP_CFG.select.slice(),
          upToJump: !!parsed.upToJump
        };
      }
    } catch { /* ignore storage errors */ }
    return {
      jump: DEFAULT_GP_CFG.jump.slice(),
      run: DEFAULT_GP_CFG.run.slice(),
      start: DEFAULT_GP_CFG.start.slice(),
      select: DEFAULT_GP_CFG.select.slice(),
      upToJump: DEFAULT_GP_CFG.upToJump
    };
  }

  let gpCfg = loadGpCfg();
  let gpListeningAction = null;
  let gpModalPausedGame = false;
  let gpHadPad = false;
  let gpToastTimer = 0;

  function saveGpCfg() {
    try { localStorage.setItem('smb_gamepad_cfg', JSON.stringify(gpCfg)); } catch { /* ignore */ }
  }

  function formatBtnList(arr) {
    return arr.slice(0, 3).map(i => 'B' + i).join(' / ');
  }

  function renderGpConfigUi() {
    if (gpUpJump) gpUpJump.checked = !!gpCfg.upToJump;
    for (const b of gpBindButtons) {
      const act = b.dataset.gpBind;
      const isListen = gpListeningAction === act;
      b.classList.toggle('listening', isListen);
      b.textContent = isListen ? 'Нажмите кнопку...' : formatBtnList(gpCfg[act]);
    }
  }

  function openGpModal() {
    if (!gpModal) return;
    gpListeningAction = null;
    if (engine.state === 'playing') {
      engine.togglePause();
      gpModalPausedGame = true;
    } else {
      gpModalPausedGame = false;
    }
    gpModal.hidden = false;
    setPressed(btnGamepad, true);
    renderGpConfigUi();
    updateGamepadStatusUi();
  }

  function closeGpModal() {
    if (!gpModal || gpModal.hidden) return;
    gpListeningAction = null;
    gpModal.hidden = true;
    setPressed(btnGamepad, false);
    if (gpModalPausedGame && engine.state === 'paused') {
      engine.togglePause();
    }
    gpModalPausedGame = false;
  }

  if (btnGamepad) btnGamepad.addEventListener('click', () => (gpModal && !gpModal.hidden) ? closeGpModal() : openGpModal());
  if (gpClose) gpClose.addEventListener('click', closeGpModal);
  if (gpDone) gpDone.addEventListener('click', closeGpModal);
  if (gpModal) gpModal.addEventListener('click', (e) => { if (e.target === gpModal) closeGpModal(); });
  if (gpUpJump) gpUpJump.addEventListener('change', () => { gpCfg.upToJump = gpUpJump.checked; saveGpCfg(); });
  if (gpReset) gpReset.addEventListener('click', () => {
    gpCfg = {
      jump: DEFAULT_GP_CFG.jump.slice(),
      run: DEFAULT_GP_CFG.run.slice(),
      start: DEFAULT_GP_CFG.start.slice(),
      select: DEFAULT_GP_CFG.select.slice(),
      upToJump: false
    };
    gpListeningAction = null;
    saveGpCfg();
    renderGpConfigUi();
  });
  for (const b of gpBindButtons) {
    b.addEventListener('click', () => {
      const act = b.dataset.gpBind;
      gpListeningAction = (gpListeningAction === act) ? null : act;
      renderGpConfigUi();
    });
  }

  function showGpToast(msg) {
    if (!toolbarFeedback) return;
    toolbarFeedback.textContent = msg;
    clearTimeout(gpToastTimer);
    gpToastTimer = setTimeout(() => {
      if (toolbarFeedback.textContent === msg) toolbarFeedback.textContent = '';
    }, 3200);
  }

  const gpPrev = {
    start: false, select: false,
    left: false, right: false, up: false, down: false,
    jump: false, run: false,
    rawButtons: new Set()
  };

  function getConnectedPads() {
    if (!navigator.getGamepads) return [];
    const raw = navigator.getGamepads();
    const out = [];
    for (let i = 0; i < raw.length; i++) {
      if (raw[i] && raw[i].connected) out.push(raw[i]);
    }
    return out;
  }

  function updateGamepadStatusUi() {
    const pads = getConnectedPads();
    if (btnGamepad) {
      btnGamepad.classList.toggle('connected', pads.length > 0);
      btnGamepad.title = pads.length > 0
        ? `Джойстик подключён: ${pads[0].id} (нажмите для настройки)`
        : 'Джойстик / Геймпад — нажмите любую кнопку на нём или кликните для настройки';
    }
    if (gpStatus) {
      if (pads.length > 0) {
        gpStatus.classList.add('ok');
        gpStatus.textContent = `Подключён (${pads.length}): ${pads.map(p => p.id).join(' | ')}`;
      } else {
        gpStatus.classList.remove('ok');
        gpStatus.textContent = 'Джойстик не обнаружен. Подключите его и нажмите на нём любую кнопку.';
      }
    }
    if (pads.length > 0 && !gpHadPad) {
      gpHadPad = true;
      showGpToast(`🎮 Джойстик подключён: ${pads[0].id.slice(0, 42)}`);
    } else if (pads.length === 0) {
      gpHadPad = false;
    }
  }

  window.addEventListener('gamepadconnected', updateGamepadStatusUi);
  window.addEventListener('gamepaddisconnected', () => {
    for (const action of ['left', 'right', 'down', 'jump', 'run']) {
      releaseAction(action, 'gamepad');
    }
    updateGamepadStatusUi();
  });

  // Decode DirectInput POV Hat axis (commonly axes[9] on Windows non-standard USB/PS/Logitech controllers)
  function decodePovHat(val) {
    // Centered POV hat is usually > 1.2 (e.g. 3.2857) or NaN
    if (typeof val !== 'number' || Number.isNaN(val) || val < -1.05 || val > 1.05) {
      return { left: false, right: false, up: false, down: false };
    }
    // 8-way values: -1=U, -0.714=UR, -0.429=R, -0.143=DR, 0.143=D, 0.429=DL, 0.714=L, 1.0=UL
    const up = val < -0.58 || val > 0.85;
    const right = val > -0.85 && val < -0.02;
    const down = val > -0.28 && val < 0.58;
    const left = val > 0.28 && val <= 1.05;
    return { left, right, up, down };
  }

  function pollGamepad() {
    const pads = getConnectedPads();
    if (!pads.length) return;
    if (!gpHadPad || (gpModal && !gpModal.hidden)) updateGamepadStatusUi();

    let left = false, right = false, up = false, down = false;
    let jump = false, run = false, start = false, select = false;
    const pressedNow = new Set();
    const dead = 0.35;

    for (const pad of pads) {
      const btn = (idx) => !!(pad.buttons[idx] && (pad.buttons[idx].pressed || pad.buttons[idx].value > 0.5));
      for (let i = 0; i < pad.buttons.length; i++) {
        if (btn(i)) pressedNow.add(i);
      }

      // 1. Standard D-Pad buttons (12..15) + Left Analog Stick (axes[0], axes[1])
      const axX = pad.axes[0] || 0;
      const axY = pad.axes[1] || 0;
      if (btn(14) || axX < -dead) left = true;
      if (btn(15) || axX > dead) right = true;
      if (btn(12) || axY < -dead) up = true;
      if (btn(13) || axY > dead) down = true;

      // 2. Non-standard / DirectInput D-Pad support: POV hat (axes[9]) or secondary axes (6,7)
      if (pad.mapping !== 'standard') {
        if (pad.axes.length > 9) {
          const pov = decodePovHat(pad.axes[9]);
          if (pov.left) left = true;
          if (pov.right) right = true;
          if (pov.up) up = true;
          if (pov.down) down = true;
        }
        if (pad.axes.length > 7 && Math.abs(pad.axes[6]) <= 1.05 && Math.abs(pad.axes[7]) <= 1.05) {
          if (pad.axes[6] < -0.5) left = true;
          if (pad.axes[6] > 0.5) right = true;
          if (pad.axes[7] < -0.5) up = true;
          if (pad.axes[7] > 0.5) down = true;
        }
      }

      // 3. Action buttons from user/default mapping
      if (gpCfg.jump.some(btn)) jump = true;
      if (gpCfg.run.some(btn)) run = true;
      if (gpCfg.start.some(btn)) start = true;
      if (gpCfg.select.some(btn)) select = true;
    }

    if (gpCfg.upToJump && up) jump = true;

    // If the Gamepad Config modal is open: capture remap press & show live button readout
    if (gpModal && !gpModal.hidden) {
      if (gpLive) {
        const dirs = [left && '←', right && '→', up && '↑', down && '↓'].filter(Boolean);
        const btns = Array.from(pressedNow).map(i => 'B' + i);
        const combined = [...dirs, ...btns];
        gpLive.textContent = 'Нажато: ' + (combined.length ? combined.join(' + ') : '—');
      }
      if (gpListeningAction) {
        for (const idx of pressedNow) {
          if (!gpPrev.rawButtons.has(idx) && idx < 12) {
            gpCfg[gpListeningAction] = [idx];
            gpListeningAction = null;
            saveGpCfg();
            renderGpConfigUi();
            audio.init();
            audio.playSfx('beep');
            break;
          }
        }
      }
      gpPrev.rawButtons = pressedNow;
      gpPrev.left = left; gpPrev.right = right; gpPrev.up = up; gpPrev.down = down;
      gpPrev.jump = jump; gpPrev.run = run; gpPrev.start = start; gpPrev.select = select;
      return;
    }

    gpPrev.rawButtons = pressedNow;

    if (left || right || up || down || jump || run || start || select) {
      audio.init();
    }

    // Edge-triggered Start / Pause & Title Menu navigation
    if (start && !gpPrev.start) {
      if (engine.state === 'title' || engine.state === 'gameOver' || engine.state === 'victory') {
        activateMenu();
      } else {
        engine.togglePause();
      }
    }

    if (engine.state === 'title') {
      if (jump && !gpPrev.jump) activateMenu();
      else if (select && !gpPrev.select) shiftTitleWorld(1);
      else if (left && !gpPrev.left) shiftTitleWorld(-1);
      else if (right && !gpPrev.right) shiftTitleWorld(1);
      else if (up && !gpPrev.up) shiftTitleWorld(4);
      else if (down && !gpPrev.down) shiftTitleWorld(-4);
    } else if (engine.state === 'gameOver' || engine.state === 'victory') {
      if (jump && !gpPrev.jump) activateMenu();
    } else {
      if (select && !gpPrev.select && engine.state === 'paused') {
        restartLevel();
      }
      if (left) pressAction('left', 'gamepad'); else releaseAction('left', 'gamepad');
      if (right) pressAction('right', 'gamepad'); else releaseAction('right', 'gamepad');
      if (down) pressAction('down', 'gamepad'); else releaseAction('down', 'gamepad');
      if (jump) pressAction('jump', 'gamepad'); else releaseAction('jump', 'gamepad');
      if (run) pressAction('run', 'gamepad'); else releaseAction('run', 'gamepad');
    }

    gpPrev.left = left; gpPrev.right = right; gpPrev.up = up; gpPrev.down = down;
    gpPrev.jump = jump; gpPrev.run = run; gpPrev.start = start; gpPrev.select = select;
  }

  renderGpConfigUi();
  updateGamepadStatusUi();

  function loop(now) {
    pollGamepad();
    accumulator += Math.min(100, now - lastTime);
    lastTime = now;
    while (accumulator >= STEP) {
      engine.update();
      accumulator -= STEP;
    }

    engine.render();
    syncToolbar();
    requestAnimationFrame(loop);
  }

  syncToolbar();
  requestAnimationFrame(loop);
})();
