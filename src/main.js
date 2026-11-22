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
    left: new Set(), right: new Set(), up: new Set(), down: new Set(), jump: new Set(), run: new Set(),
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
      if (code === 'ArrowUp' || code === 'KeyW') pressAction('up', code);
    }
  });

  window.addEventListener('keyup', ({ code }) => {
    const action = bindings[code];
    if (action) releaseAction(action, code);
    if (code === 'ArrowUp' || code === 'KeyW') releaseAction('up', code);
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

  // ---- Universal Plug-and-Play Gamepad / Joystick Support (DualShock 4/5, Xbox, Switch, USB NES/Dendy, DirectInput) ----
  const btnGamepad = document.getElementById('btn-gamepad');
  const gpModal = document.getElementById('gamepad-modal');
  const gpClose = document.getElementById('gp-close');
  const gpDone = document.getElementById('gp-done');
  const gpReset = document.getElementById('gp-reset');
  const gpPresetMario = document.getElementById('gp-preset-mario');
  const gpPresetNes = document.getElementById('gp-preset-nes');
  const gpStatus = document.getElementById('gp-status');
  const gpLive = document.getElementById('gp-live');
  const gpUpJump = document.getElementById('gp-up-jump');
  const gpBindButtons = Array.from(document.querySelectorAll('[data-gp-bind]'));

  // Canonical physical button indices (normalized across Standard, DualShock DirectInput, and USB NES/Dendy!):
  // 0 = Bottom (✕ / A), 1 = Right (○ / B / NES-A), 2 = Left (□ / X / NES-B), 3 = Top (△ / Y)
  // 4 = L1, 5 = R1, 6 = L2, 7 = R2, 8 = Share/Select, 9 = Options/Start, 10 = L3, 11 = R3
  const GP_BTN_NAMES = {
    0: '✕/A', 1: '○/B', 2: '□/X', 3: '△/Y',
    4: 'L1', 5: 'R1', 6: 'L2', 7: 'R2',
    8: 'Share/Sel', 9: 'Opt/Start', 10: 'L3', 11: 'R3'
  };

  const GP_PRESETS = {
    // Official Nintendo Super Mario All-Stars / SNES / PlayStation / Xbox classic diamond split:
    // Left (□) + Top (△) + Shoulders = B (Run / Fire), Bottom (✕) + Right (○) = A (Jump)!
    classic: {
      jump: [0, 1],
      run: [2, 3, 4, 5, 6, 7],
      start: [9],
      select: [8],
      upToJump: false
    },
    // Classic 2-button NES / Dendy lower-pair layout:
    // Bottom/Left (✕, □) = B (Run / Fire), Right (○) = A (Jump)!
    nes: {
      jump: [1],
      run: [0, 2, 3, 4, 5, 6, 7],
      start: [9],
      select: [8],
      upToJump: false
    }
  };

  const DEFAULT_GP_CFG = GP_PRESETS.classic;
  const GP_STORAGE_KEY = 'smb_gamepad_cfg_v4';

  function cloneGpCfg(src) {
    return {
      jump: src.jump.slice(),
      run: src.run.slice(),
      start: src.start.slice(),
      select: src.select.slice(),
      upToJump: !!src.upToJump
    };
  }

  function loadGpCfg() {
    try {
      const raw = localStorage.getItem(GP_STORAGE_KEY);
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
    return cloneGpCfg(DEFAULT_GP_CFG);
  }

  let gpCfg = loadGpCfg();
  let gpListeningAction = null;
  let gpModalPausedGame = false;
  let gpHadPad = false;
  let gpToastTimer = 0;

  function saveGpCfg() {
    try { localStorage.setItem(GP_STORAGE_KEY, JSON.stringify(gpCfg)); } catch { /* ignore */ }
  }

  function btnLabel(idx) {
    return GP_BTN_NAMES[idx] || ('B' + idx);
  }

  function formatBtnList(arr) {
    return arr.slice(0, 3).map(btnLabel).join(' / ');
  }

  function renderGpConfigUi() {
    if (gpUpJump) gpUpJump.checked = !!gpCfg.upToJump;
    for (const b of gpBindButtons) {
      const act = b.dataset.gpBind;
      const isListen = gpListeningAction === act;
      b.classList.toggle('listening', isListen);
      b.textContent = isListen ? 'Нажмите кнопку...' : formatBtnList(gpCfg[act]);
    }
    if (gpPresetMario && gpPresetNes) {
      const isNes = gpCfg.jump.includes(1) && !gpCfg.jump.includes(0) && gpCfg.run.includes(0);
      gpPresetNes.classList.toggle('active', isNes);
      gpPresetMario.classList.toggle('active', !isNes);
    }
    for (const dBtn of document.querySelectorAll('[data-gp-face]')) {
      const idx = Number(dBtn.dataset.gpFace);
      const role = gpCfg.jump.includes(idx) ? 'Прыж' : (gpCfg.run.includes(idx) ? 'Бег' : '—');
      const roleEl = dBtn.querySelector('small');
      if (roleEl) roleEl.textContent = role;
      dBtn.classList.toggle('role-jump', gpCfg.jump.includes(idx));
      dBtn.classList.toggle('role-run', gpCfg.run.includes(idx));
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

  function applyPreset(name) {
    gpCfg = cloneGpCfg(GP_PRESETS[name] || DEFAULT_GP_CFG);
    gpListeningAction = null;
    saveGpCfg();
    renderGpConfigUi();
    audio.init();
    audio.playSfx('beep');
  }

  if (btnGamepad) btnGamepad.addEventListener('click', () => (gpModal && !gpModal.hidden) ? closeGpModal() : openGpModal());
  if (gpClose) gpClose.addEventListener('click', closeGpModal);
  if (gpDone) gpDone.addEventListener('click', closeGpModal);
  if (gpModal) gpModal.addEventListener('click', (e) => { if (e.target === gpModal) closeGpModal(); });
  if (gpUpJump) gpUpJump.addEventListener('change', () => { gpCfg.upToJump = gpUpJump.checked; saveGpCfg(); });
  if (gpPresetMario) gpPresetMario.addEventListener('click', () => applyPreset('classic'));
  if (gpPresetNes) gpPresetNes.addEventListener('click', () => applyPreset('nes'));
  if (gpReset) gpReset.addEventListener('click', () => applyPreset('classic'));
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
    canonButtons: new Set()
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

  function detectPadProfile(pad) {
    if (pad.mapping === 'standard') return 'standard';
    const id = (pad.id || '').toLowerCase();
    // DualShock 4 / DualSense over Bluetooth DirectInput (VID 054c, PID 09cc / 05c4 / 0ce6): B0=□, B1=✕, B2=○, B3=△, axes[9]=POV
    if (/054c|dualshock|dualsense|wireless controller|ps4|ps5/.test(id)) return 'ds4-dinput';
    // Classic USB NES / SNES / Dendy / Twin USB DirectInput pads (VID 0079 / 0810): B0=Top, B1=Right(A), B2=Bottom(B), B3=Left
    if (/0079|0810|dragonrise|dendy|famicom|\bnes\b|\bsnes\b|retrolink|usb gamepad|twin usb/.test(id)) return 'nes-dinput';
    return 'generic';
  }

  // Decode DirectInput POV Hat axis (commonly axes[9] on Windows DualShock 4 / Logitech / USB controllers)
  function decodePovHat(val) {
    // Centered/neutral POV hat is usually ~3.2857, >1.1, or NaN
    if (typeof val !== 'number' || Number.isNaN(val) || val < -1.05 || val > 1.05) {
      return { left: false, right: false, up: false, down: false };
    }
    // Windows 8-way POV hat: -1.0=U, -0.714=UR, -0.429=R, -0.143=DR, +0.143=D, +0.429=DL, +0.714=L, +1.0=UL
    const up = val < -0.58 || val > 0.85;
    const right = val > -0.85 && val < -0.02;
    const down = val > -0.28 && val < 0.58;
    const left = val > 0.28 && val <= 1.05;
    return { left, right, up, down };
  }

  // Normalize any physical gamepad into canonical buttons (0=✕/A, 1=○/B, 2=□/X, 3=△/Y, 4..7=L/R, 8=Sel, 9=Start) + D-pad!
  function readNormalizedPad(pad) {
    const profile = detectPadProfile(pad);
    const dead = 0.38;
    const rawPressed = (idx) => !!(pad.buttons[idx] && (pad.buttons[idx].pressed || pad.buttons[idx].value > 0.55));
    const canon = new Set();

    let mapTable = null;
    if (profile === 'ds4-dinput') {
      // Raw DS4 DirectInput: 0=□->2, 1=✕->0, 2=○->1, 3=△->3
      mapTable = { 0: 2, 1: 0, 2: 1, 3: 3 };
    } else if (profile === 'nes-dinput') {
      // Raw USB NES/SNES DirectInput: 0=Top->3, 1=Right(A)->1, 2=Bottom(B)->0, 3=Left->2
      mapTable = { 0: 3, 1: 1, 2: 0, 3: 2 };
    }

    for (let i = 0; i < pad.buttons.length; i++) {
      if (!rawPressed(i)) continue;
      // Never leak Standard D-Pad buttons (12..15) or DS4 PS/Touchpad buttons into face bindings unless explicitly mapped
      if (profile === 'standard' && i >= 12 && i <= 15) continue;
      const cIdx = (mapTable && mapTable[i] !== undefined) ? mapTable[i] : i;
      canon.add(cIdx);
    }

    let left = false, right = false, up = false, down = false;
    const axX = pad.axes[0] || 0;
    const axY = pad.axes[1] || 0;
    if (axX < -dead) left = true;
    if (axX > dead) right = true;
    if (axY < -dead) up = true;
    if (axY > dead) down = true;

    if (profile === 'standard') {
      if (rawPressed(14)) left = true;
      if (rawPressed(15)) right = true;
      if (rawPressed(12)) up = true;
      if (rawPressed(13)) down = true;
    } else {
      // Non-standard DirectInput D-Pad: POV Hat (axes[9]) or secondary hat axes (6, 7)
      // IMPORTANT: NEVER read buttons[12..15] here — on DualShock 4 DirectInput B12=PS and B13=Touchpad!
      if (pad.axes.length > 9) {
        const pov = decodePovHat(pad.axes[9]);
        if (pov.left) left = true;
        if (pov.right) right = true;
        if (pov.up) up = true;
        if (pov.down) down = true;
      }
      if (profile !== 'ds4-dinput' && pad.axes.length > 7 && Math.abs(pad.axes[6]) <= 1.05 && Math.abs(pad.axes[7]) <= 1.05) {
        if (pad.axes[6] < -0.5) left = true;
        if (pad.axes[6] > 0.5) right = true;
        if (pad.axes[7] < -0.5) up = true;
        if (pad.axes[7] > 0.5) down = true;
      }
    }

    return { profile, canon, left, right, up, down };
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
        const pInfo = pads.map(p => `${p.id} [${detectPadProfile(p)}]`).join(' | ');
        gpStatus.classList.add('ok');
        gpStatus.textContent = `Подключён (${pads.length}): ${pInfo}`;
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
    for (const action of ['left', 'right', 'up', 'down', 'jump', 'run']) {
      releaseAction(action, 'gamepad');
    }
    gpPrev.canonButtons.clear();
    updateGamepadStatusUi();
  });

  function pollGamepad() {
    const pads = getConnectedPads();
    if (!pads.length) return;
    if (!gpHadPad || (gpModal && !gpModal.hidden)) updateGamepadStatusUi();

    let left = false, right = false, up = false, down = false;
    let jump = false, run = false, start = false, select = false;
    const canonNow = new Set();

    for (const pad of pads) {
      const st = readNormalizedPad(pad);
      if (st.left) left = true;
      if (st.right) right = true;
      if (st.up) up = true;
      if (st.down) down = true;
      for (const idx of st.canon) canonNow.add(idx);
    }

    const hasAny = (list) => list.some(idx => canonNow.has(idx));
    const newlyPressedAny = (list) => list.some(idx => canonNow.has(idx) && !gpPrev.canonButtons.has(idx));

    if (hasAny(gpCfg.jump)) jump = true;
    if (hasAny(gpCfg.run)) run = true;
    if (hasAny(gpCfg.start)) start = true;
    if (hasAny(gpCfg.select)) select = true;
    if (gpCfg.upToJump && up) jump = true;

    const jumpFresh = newlyPressedAny(gpCfg.jump) || (gpCfg.upToJump && up && !gpPrev.up);
    const runFresh = newlyPressedAny(gpCfg.run);

    const savePrev = () => {
      gpPrev.canonButtons = canonNow;
      gpPrev.left = left; gpPrev.right = right; gpPrev.up = up; gpPrev.down = down;
      gpPrev.jump = jump; gpPrev.run = run; gpPrev.start = start; gpPrev.select = select;
    };

    // If the Gamepad Config modal is open: capture remap press & show live button + action readout
    if (gpModal && !gpModal.hidden) {
      for (const dBtn of document.querySelectorAll('[data-gp-face]')) {
        const idx = Number(dBtn.dataset.gpFace);
        dBtn.classList.toggle('pressed', canonNow.has(idx));
      }
      if (gpLive) {
        const dirs = [left && '←', right && '→', up && '↑', down && '↓'].filter(Boolean);
        const btns = Array.from(canonNow).map(btnLabel);
        const acts = [
          left && 'Влево', right && 'Вправо', down && 'Вниз',
          jump && 'Прыжок(A)', run && 'Бег/Огонь(B)',
          start && 'Старт', select && 'Выбор'
        ].filter(Boolean);
        const rawStr = [...dirs, ...btns].join(' + ') || '—';
        gpLive.textContent = acts.length ? `Нажато: ${rawStr}  →  ${acts.join(', ')}` : `Нажато: ${rawStr}`;
      }
      if (gpListeningAction) {
        for (const idx of canonNow) {
          if (!gpPrev.canonButtons.has(idx)) {
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
      savePrev();
      return;
    }

    if (left || right || up || down || jump || run || start || select) {
      audio.init();
    }

    // Edge-triggered Start / Pause (return cleanly on menu activation so press never leaks into gameplay!)
    if (start && !gpPrev.start) {
      if (engine.state === 'title' || engine.state === 'gameOver' || engine.state === 'victory') {
        activateMenu();
        savePrev();
        return;
      } else {
        engine.togglePause();
        engine.input.jumpPressed = false;
        engine.input.firePressed = false;
        savePrev();
        return;
      }
    }

    if (engine.state === 'title') {
      if (jump && !gpPrev.jump) {
        activateMenu();
        savePrev();
        return;
      }
      if (select && !gpPrev.select) shiftTitleWorld(1);
      else if (left && !gpPrev.left) shiftTitleWorld(-1);
      else if (right && !gpPrev.right) shiftTitleWorld(1);
      else if (up && !gpPrev.up) shiftTitleWorld(4);
      else if (down && !gpPrev.down) shiftTitleWorld(-4);
    } else if (engine.state === 'gameOver' || engine.state === 'victory') {
      if (jump && !gpPrev.jump) {
        activateMenu();
        savePrev();
        return;
      }
    } else {
      if (select && !gpPrev.select && engine.state === 'paused') {
        restartLevel();
        savePrev();
        return;
      }
      if (left) pressAction('left', 'gamepad'); else releaseAction('left', 'gamepad');
      if (right) pressAction('right', 'gamepad'); else releaseAction('right', 'gamepad');
      if (up) pressAction('up', 'gamepad'); else releaseAction('up', 'gamepad');
      if (down) pressAction('down', 'gamepad'); else releaseAction('down', 'gamepad');

      // Per-button rising edge guarantees tapping □ to shoot works even while holding R1 to sprint!
      if (jump) {
        pressAction('jump', 'gamepad');
        if (jumpFresh) engine.input.jumpPressed = true;
      } else {
        releaseAction('jump', 'gamepad');
      }
      if (run) {
        pressAction('run', 'gamepad');
        if (runFresh) engine.input.firePressed = true;
      } else {
        releaseAction('run', 'gamepad');
      }
    }

    savePrev();
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
