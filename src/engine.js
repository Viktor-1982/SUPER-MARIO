// ============================================================================
// SUPER MARIO BROS. — Complete 8-World NES Engine, Physics & State Machine
// ============================================================================
(function (global) {
  'use strict';

  const TILE = 16;
  const SCREEN_H = 240;

  const SOLID_TILES = new Set(['#', 'B', '?', 'P', 'p', 'M', 'S', 'b', 'U', 'H', '[', ']', '{', '}', '<', ',', '-', '_', '=', 'T', 'O', 'K', 'k', 'X']);

  class GameEngine {
    constructor(canvas) {
      this.canvas = canvas;
      this.ctx = canvas.getContext('2d');
      this.screenW = canvas.width || 256;
      this.ctx.imageSmoothingEnabled = false;

      this.input = {
        left: false, right: false, up: false, down: false,
        jump: false, jumpPressed: false,
        run: false, firePressed: false
      };

      this.frame = 0;
      this.state = 'title';
      this.currentLevelIdx = 0;
      this.selectedLevelIdx = 0;

      this.score = 0;
      this.highScore = 0;
      try {
        this.highScore = parseInt(localStorage.getItem('smb_highscore'), 10) || 0;
      } catch {
        // Private browsing or a local file can block access to storage.
      }
      this.coins = 0;
      this.lives = 25;
      this.time = 400;
      this.timeTick = 0;
      this.hurryPlayed = false;

      this.level = null;
      this.savedMainState = null;
      this.respawnAt = null;
      this.player = null;
      this.cameraX = 0;

      this.enemies = [];
      this.platforms = [];
      this.springs = [];
      this.powerUps = [];
      this.fireballs = [];
      this.hammers = [];
      this.particles = [];
      this.floatingScores = [];
      this.bumpedTiles = new Map();
      this.multiCoinCounts = new Map();

      this.introTimer = 0;
      this.stateTimer = 0;
      this.pipeAnim = null;
      this.flagAnim = null;
      this.bridgeAnim = null;
      this.toadMessageTimer = 0;

      this.loadLevel('1-1', 'small', true);
    }

    addScore(pts, x = null, y = null) {
      this.score += pts;
      if (this.score > this.highScore) {
        this.highScore = this.score;
        try {
          localStorage.setItem('smb_highscore', String(this.highScore));
        } catch {
          // Keep the high score in memory if storage is unavailable.
        }
      }
      if (x !== null && y !== null) {
        this.floatingScores.push(new global.MarioEntities.FloatingScore(x, y, pts));
      }
    }

    addCoin(x = null, y = null) {
      this.coins++;
      global.MarioAudio.playSfx('coin');
      this.addScore(200);
      if (this.coins >= 100) {
        this.coins -= 100;
        this.lives++;
        global.MarioAudio.playSfx('oneUp');
        if (x !== null && y !== null) {
          this.floatingScores.push(new global.MarioEntities.FloatingScore(x, y - 8, '1UP'));
        }
      }
    }

    setScreenWidth(w) {
      this.screenW = Math.max(256, Math.round(w));
      this.ctx.imageSmoothingEnabled = false;
      if (this.level) {
        const maxCam = Math.max(0, this.level.cols * TILE - this.screenW);
        this.cameraX = Math.max(0, Math.min(maxCam, this.cameraX));
      }
    }

    startNewGame(startIdx = 0) {
      this.score = 0;
      this.coins = 0;
      this.lives = 25;
      this.currentLevelIdx = startIdx;
      this.savedMainState = null;
      global.MarioAudio.setPaused(false);
      this.beginLevelIntro(global.MarioLevels.LEVEL_ORDER[this.currentLevelIdx], 'small');
    }

    beginLevelIntro(levelId, powerState, respawnAt = null) {
      this.respawnAt = respawnAt;
      this.savedMainState = null;
      this.flagAnim = null;
      this.bridgeAnim = null;
      this.pipeAnim = null;
      this.barrageTimer = 0;
      this.toadMessageTimer = 0;
      global.MarioAudio.setPaused(false);
      global.MarioAudio.stopMusic();
      this.pendingLevelId = levelId;
      this.pendingPowerState = powerState;
      this.state = 'intro';
      this.introTimer = 175;
    }

    returnToTitle(keepWorldContinue = false) {
      global.MarioAudio.setPaused(false);
      global.MarioAudio.stopMusic();
      if (keepWorldContinue) {
        // Classic NES Continue: pre-select World X-1 of the world reached!
        const worldStart = Math.floor((this.currentLevelIdx || 0) / 4) * 4;
        this.selectedLevelIdx = Math.max(0, Math.min(global.MarioLevels.LEVEL_ORDER.length - 1, worldStart));
      } else {
        this.selectedLevelIdx = 0;
      }
      this.currentLevelIdx = this.selectedLevelIdx;
      this.score = 0;
      this.coins = 0;
      this.lives = 25;
      this.savedMainState = null;
      this.respawnAt = null;
      this.flagAnim = null;
      this.bridgeAnim = null;
      this.pipeAnim = null;
      this.barrageTimer = 0;
      this.toadMessageTimer = 0;
      this.input.jumpPressed = false;
      this.input.firePressed = false;
      this.state = 'title';
      this.loadLevel('1-1', 'small', true);
    }

    loadLevel(levelId, powerState = 'small', isTitleBackdrop = false) {
      const lv = global.MarioLevels.build(levelId);
      const E = global.MarioEntities;
      this.level = lv;
      this.time = lv.time;
      this.timeTick = 0;
      this.hurryPlayed = false;
      this.cameraX = 0;

      const respawn = !isTitleBackdrop && this.respawnAt?.levelId === levelId ? this.respawnAt : null;
      const spawn = respawn || lv.spawn;
      this.player = new E.Player(spawn.x, spawn.y, powerState);
      if (isTitleBackdrop) {
        this.player.onGround = true;
      }
      if (respawn) {
        this.player.onGround = true;
        this.cameraX = Math.max(0, Math.min(Math.max(0, lv.cols * TILE - this.screenW), spawn.x - this.screenW * 0.42));
      }
      if (!isTitleBackdrop && levelId === global.MarioLevels.LEVEL_ORDER[this.currentLevelIdx]) {
        lv.midpoint = this.findMidpointCheckpoint(lv);
      }
      this.enemies = [];
      this.platforms = [];
      this.springs = [];
      this.powerUps = [];
      this.fireballs = [];
      this.hammers = [];
      this.particles = [];
      this.floatingScores = [];
      this.bumpedTiles.clear();
      this.multiCoinCounts.clear();

      for (const e of lv.enemies) {
        if (e.type === 'goomba') this.enemies.push(new E.Goomba(e.col * TILE, e.row * TILE));
        else if (e.type === 'koopa') this.enemies.push(new E.Koopa(e.col * TILE, e.row * TILE, !!e.red, !!e.winged));
        else if (e.type === 'buzzy') this.enemies.push(new E.BuzzyBeetle(e.col * TILE, e.row * TILE));
        else if (e.type === 'spiny') this.enemies.push(new E.Spiny(e.col * TILE, e.row * TILE));
        else if (e.type === 'lakitu') this.enemies.push(new E.Lakitu(e.col * TILE, e.row * TILE));
        else if (e.type === 'hammerbro') this.enemies.push(new E.HammerBro(e.col * TILE, e.row * TILE));
        else if (e.type === 'blooper') this.enemies.push(new E.Blooper(e.col * TILE, e.row * TILE));
        else if (e.type === 'cheep') this.enemies.push(new E.CheepCheep(e.col * TILE, e.row * TILE, !!e.gray, !!e.leaping));
        else if (e.type === 'piranha') this.enemies.push(new E.PiranhaPlant(e.col, e.row));
        else if (e.type === 'bowser') this.enemies.push(new E.Bowser(e.col * TILE, e.row * TILE, e.worldNum || lv.worldNum || 1));
      }

      for (const p of (lv.platforms || [])) this.platforms.push(new E.MovingPlatform(p));
      for (const sp of (lv.springs || [])) this.springs.push(new E.Springboard(sp.col * TILE, sp.row * TILE));

      if (lv.podoboos) {
        lv.podoboos.forEach(pb => { pb.y = pb.baseY; pb.vy = 0; pb.jumping = false; });
      }

      if (!isTitleBackdrop) {
        this.state = 'playing';
        global.MarioAudio.playMusic(lv.music, 1.0);
      }
    }

    findMidpointCheckpoint(level) {
      if (level.isCastle || level.isUnderwater || level.worldNum >= 8) return null;
      const endCol = level.flagpoleCol ?? level.warpPipes?.find(pipe => pipe.isStageExit)?.col;
      if (!endCol) return null;

      const startCol = level.spawn.x / TILE;
      const midpoint = (startCol + endCol) / 2;
      const searchRadius = (endCol - startCol) * 0.14;
      const hazards = [...level.enemies, ...level.cannons, ...level.springs];
      const stableTiles = new Set(['#', '=', 'T']);
      const clearTiles = new Set(['.', 'C']);
      let best = null;
      let nearest = Infinity;

      for (let col = Math.ceil(midpoint - searchRadius); col <= Math.floor(midpoint + searchRadius); col++) {
        const distance = Math.abs(col - midpoint);
        if (distance >= nearest || hazards.some(hazard => Math.abs(hazard.col - col) < 5)) continue;

        const x = col * TILE + 2;
        const nearMovingPlatform = level.platforms.some(platform => {
          const left = platform.axis === 'x' ? platform.min : platform.x;
          const right = (platform.axis === 'x' ? platform.max : platform.x) + platform.w;
          return left < x + 2 * TILE && right > x - 2 * TILE;
        });
        if (nearMovingPlatform) continue;

        const neighbors = [col - 1, col, col + 1];
        for (let row = 13; row >= 7; row--) {
          const safe = neighbors.every(c => stableTiles.has(level.grid[row][c]) &&
            clearTiles.has(level.grid[row - 1][c]) && clearTiles.has(level.grid[row - 2][c]));
          if (!safe) continue;
          best = { levelId: level.id, x, y: (row - 1) * TILE };
          nearest = distance;
          break;
        }
      }
      return best;
    }

    restartCurrentLevel() {
      if (this.state !== 'playing' && this.state !== 'paused') return;
      const id = global.MarioLevels.LEVEL_ORDER[this.currentLevelIdx];
      this.savedMainState = null;
      this.respawnAt = null;
      global.MarioAudio.setPaused(false);
      this.beginLevelIntro(id, 'small');
    }

    togglePause() {
      if (this.state === 'playing') {
        this.state = 'paused';
        global.MarioAudio.playSfx('pause');
        global.MarioAudio.setPaused(true);
      } else if (this.state === 'paused') {
        this.state = 'playing';
        global.MarioAudio.setPaused(false);
        global.MarioAudio.playSfx('pause');
      }
    }

    getTile(col, row) {
      if (!this.level) return '.';
      if (row < 0 || row >= this.level.grid.length) return '.';
      if (col < 0 || col >= this.level.cols) return '#';
      return this.level.grid[row][col];
    }

    setTile(col, row, ch) {
      if (!this.level) return;
      if (row < 0 || row >= this.level.grid.length) return;
      if (col < 0 || col >= this.level.cols) return;
      this.level.grid[row][col] = ch;
    }

    isSolidTile(col, row) {
      if (row < 0) return false;
      if (row >= this.level.grid.length) return false;
      if (col < 0 || col >= this.level.cols) return true;
      return SOLID_TILES.has(this.level.grid[row][col]);
    }

    isSolidAtPixel(px, py) {
      return this.isSolidTile(Math.floor(px / TILE), Math.floor(py / TILE));
    }

    moveEntity(ent, reverseOnWall = false) {
      ent.x += ent.vx;
      const topRow = Math.floor((ent.y + 2) / TILE);
      const botRow = Math.floor((ent.y + ent.h - 2) / TILE);

      if (ent.vx > 0) {
        const rightCol = Math.floor((ent.x + ent.w) / TILE);
        for (let r = topRow; r <= botRow; r++) {
          if (this.isSolidTile(rightCol, r)) {
            ent.x = rightCol * TILE - ent.w;
            ent.vx = reverseOnWall ? -ent.vx : 0;
            break;
          }
        }
      } else if (ent.vx < 0) {
        const leftCol = Math.floor(ent.x / TILE);
        for (let r = topRow; r <= botRow; r++) {
          if (this.isSolidTile(leftCol, r)) {
            ent.x = (leftCol + 1) * TILE;
            ent.vx = reverseOnWall ? -ent.vx : 0;
            break;
          }
        }
      }

      ent.y += ent.vy;
      ent.onGround = false;
      const leftCol = Math.floor((ent.x + 2) / TILE);
      const rightCol = Math.floor((ent.x + ent.w - 2) / TILE);

      if (ent.vy >= 0) {
        const bot = Math.floor((ent.y + ent.h) / TILE);
        for (let c = leftCol; c <= rightCol; c++) {
          if (this.isSolidTile(c, bot)) {
            ent.y = bot * TILE - ent.h;
            ent.vy = 0;
            ent.onGround = true;
            break;
          }
        }
      } else {
        const top = Math.floor(ent.y / TILE);
        for (let c = leftCol; c <= rightCol; c++) {
          if (this.isSolidTile(c, top)) {
            ent.y = (top + 1) * TILE;
            ent.vy = 0;
            break;
          }
        }
      }
    }

    hitBlock(col, row) {
      const ch = this.getTile(col, row);
      if (ch === 'U' || ch === '#' || ch === 'H' || ch === '[' || ch === ']' || ch === '<' || ch === ',' || ch === '-' || ch === '_' || ch === '=' || ch === 'K' || ch === 'k' || ch === 'X' || ch === 'T' || ch === 'O') {
        global.MarioAudio.playSfx('bump');
        return;
      }

      const key = `${col},${row}`;
      this.bumpedTiles.set(key, 6);

      const blockBox = { x: col * TILE - 2, y: (row - 1) * TILE - 2, w: TILE + 4, h: TILE + 4 };
      for (const e of this.enemies) {
        if (!e.dead && !e.squashed && !e.flipped && e.type !== 'piranha' && e.type !== 'bowser') {
          if (global.MarioEntities.aabb(e, blockBox)) {
            this.flipEnemy(e, e.x >= col * TILE ? 1 : -1);
          }
        }
      }

      if (ch === '?' || ch === 'h') {
        this.setTile(col, row, 'U');
        this.spawnCoinPop(col * TILE, row * TILE - 14);
        this.addCoin(col * TILE, row * TILE - 16);
      } else if (ch === 'P' || ch === 'p') {
        this.setTile(col, row, 'U');
        const kind = this.player.powerState === 'small' ? 'mushroom' : 'flower';
        this.powerUps.push(new global.MarioEntities.PowerUp(col * TILE, row * TILE, kind));
        global.MarioAudio.playSfx('powerupAppear');
      } else if (ch === '1' || ch === 'b') {
        this.setTile(col, row, 'U');
        this.powerUps.push(new global.MarioEntities.PowerUp(col * TILE, row * TILE, 'oneUp'));
        global.MarioAudio.playSfx('powerupAppear');
      } else if (ch === 'S') {
        this.setTile(col, row, 'U');
        this.powerUps.push(new global.MarioEntities.PowerUp(col * TILE, row * TILE, 'star'));
        global.MarioAudio.playSfx('powerupAppear');
      } else if (ch === 'M') {
        let rem = this.multiCoinCounts.has(key) ? this.multiCoinCounts.get(key) : 7;
        this.spawnCoinPop(col * TILE, row * TILE - 14);
        this.addCoin(col * TILE, row * TILE - 16);
        rem--;
        if (rem <= 0) this.setTile(col, row, 'U');
        else this.multiCoinCounts.set(key, rem);
      } else if (ch === 'B') {
        if (this.player.powerState !== 'small') {
          this.setTile(col, row, '.');
          this.bumpedTiles.delete(key);
          global.MarioAudio.playSfx('break');
          this.addScore(50);
          const theme = global.MarioSprites.THEMES[this.level.theme] || global.MarioSprites.THEMES.overworld;
          const bx = col * TILE + 6;
          const by = row * TILE + 6;
          this.particles.push(new global.MarioEntities.Particle(bx, by, -1.7, -4.6, theme.brick, 5, 38, 0.25));
          this.particles.push(new global.MarioEntities.Particle(bx, by, 1.7, -4.6, theme.brick, 5, 38, 0.25));
          this.particles.push(new global.MarioEntities.Particle(bx, by, -1.1, -3.2, theme.brickLight, 5, 34, 0.25));
          this.particles.push(new global.MarioEntities.Particle(bx, by, 1.1, -3.2, theme.brickLight, 5, 34, 0.25));
        } else {
          global.MarioAudio.playSfx('bump');
        }
      }
    }

    spawnCoinPop(x, y) {
      const pt = new global.MarioEntities.Particle(x, y, 0, -4.6, '#fbd000', 8, 26, 0.28);
      pt.isCoinPop = true;
      this.particles.push(pt);
    }

    spawnPuff(x, y) {
      for (let i = 0; i < 4; i++) {
        const ang = (Math.PI / 2) * i + 0.4;
        this.particles.push(new global.MarioEntities.Particle(
          x + 3, y + 3, Math.cos(ang) * 1.3, Math.sin(ang) * 1.3, '#fc9838', 3, 14, 0
        ));
      }
    }

    spawnBowserFire(x, y, dir) {
      global.MarioAudio.playSfx('bowserFire');
      this.fireballs.push(new global.MarioEntities.Fireball(x, y, dir, true));
    }

    spawnHammer(x, y, dir) {
      this.hammers.push(new global.MarioEntities.Hammer(x, y, dir));
    }

    flipEnemy(e, dir = 1) {
      e.flipped = true;
      e.dead = true;
      e.vx = dir * 1.2;
      e.vy = -3.8;
      global.MarioAudio.playSfx('kick');
      this.addScore(200, e.x, e.y);
    }

    getPlayerHurtbox(pBox) {
      // Exact 1985 NES SMB1 damage hurtbox ($04AC): tighter than tile hitbox so grazing empty corner pixels never kills Mario!
      return {
        x: pBox.x + 2,
        y: pBox.y + 4,
        w: Math.max(4, pBox.w - 4),
        h: Math.max(8, pBox.h - 5)
      };
    }

    getEnemyHurtbox(e) {
      if (e.type === 'piranha') {
        // Hidden or barely below pipe rim -> completely harmless!
        if (e.phase === 'hidden' || e.y >= e.baseY - 4) return null;
        const visH = Math.max(0, Math.min(e.h, e.baseY - e.y) - 4);
        if (visH <= 2) return null;
        return { x: e.x + 3, y: e.y + 4, w: Math.max(4, e.w - 6), h: visH };
      }
      if (e.type === 'bowser') {
        return { x: e.x + 6, y: e.y + 5, w: Math.max(8, e.w - 12), h: Math.max(10, e.h - 7) };
      }
      if (e.type === 'hammerbro') {
        return { x: e.x + 3, y: e.y + 3, w: Math.max(6, e.w - 6), h: Math.max(8, e.h - 4) };
      }
      return {
        x: e.x + 3,
        y: e.y + 4,
        w: Math.max(6, e.w - 6),
        h: Math.max(6, e.h - 5)
      };
    }

    hurtPlayer() {
      const p = this.player;
      if (p.dead || p.invulnTimer > 0 || p.starTimer > 0) return;
      if (p.powerState !== 'small') {
        p.setPower('small');
        p.invulnTimer = 110;
        global.MarioAudio.playSfx('shrink');
      } else {
        this.killPlayer();
      }
    }

    killPlayer() {
      const p = this.player;
      if (p.dead) return;
      p.dead = true;
      p.vx = 0;
      p.vy = -5.8;
      p.deadTimer = 135;
      global.MarioAudio.stopMusic();
      global.MarioAudio.playSfx('death');
    }

    // ---- Main 60FPS Update ----
    update() {
      if (this.state === 'paused') {
        this.input.jumpPressed = false;
        this.input.firePressed = false;
        return;
      }
      this.frame++;

      if (this.state === 'title') {
        this.cameraX = 0;
      } else if (this.state === 'intro') {
        this.introTimer--;
        if (this.introTimer <= 0) {
          this.loadLevel(this.pendingLevelId, this.pendingPowerState, false);
        }
      } else if (this.state === 'playing') {
        this.updatePlaying();
      } else if (this.state === 'pipe') {
        this.updatePipeAnim();
      } else if (this.state === 'flagpole') {
        this.updateFlagpole();
      } else if (this.state === 'bridge') {
        this.updateBridgeCollapse();
      } else if (this.state === 'castleVictory') {
        this.updateCastleVictory();
      } else if (this.state === 'gameOver' || this.state === 'victory') {
        this.stateTimer++;
        if (this.stateTimer > 30 && (this.input.jumpPressed || this.input.firePressed)) {
          this.returnToTitle(false);
        }
      }

      this.input.jumpPressed = false;
      this.input.firePressed = false;
    }

    updatePlaying() {
      const p = this.player;

      for (const [k, v] of this.bumpedTiles.entries()) {
        if (v <= 1) this.bumpedTiles.delete(k);
        else this.bumpedTiles.set(k, v - 1);
      }

      for (const pt of this.particles) pt.update();
      this.particles = this.particles.filter(pt => pt.life > 0);
      for (const fs of this.floatingScores) fs.update();
      this.floatingScores = this.floatingScores.filter(fs => fs.life > 0);

      if (p.dead) {
        p.y += p.vy;
        p.vy += 0.24;
        p.deadTimer--;
        if (p.deadTimer <= 0) {
          this.lives--;
          this.savedMainState = null;
          if (this.lives <= 0) {
            this.respawnAt = null;
            this.state = 'gameOver';
            this.stateTimer = 0;
            global.MarioAudio.playSfx('gameOver');
          } else {
            const id = global.MarioLevels.LEVEL_ORDER[this.currentLevelIdx];
            this.beginLevelIntro(id, 'small', this.respawnAt);
          }
        }
        return;
      }

      // Level Timer
      this.timeTick++;
      if (this.timeTick >= 24) {
        this.timeTick = 0;
        if (this.time > 0) this.time--;
        if (this.time === 100 && !this.hurryPlayed) {
          this.hurryPlayed = true;
          global.MarioAudio.playSfx('hurry');
          if (p.starTimer <= 0) global.MarioAudio.playMusic(this.level.music, 1.32);
        }
        if (this.time <= 0) { this.killPlayer(); return; }
      }

      if (p.invulnTimer > 0) p.invulnTimer--;
      if (p.stompGrace > 0) p.stompGrace--;
      if (p.fireCooldown > 0) p.fireCooldown--;
      if (p.fireAnimTimer > 0) p.fireAnimTimer--;
      if (p.starTimer > 0) {
        p.starTimer--;
        if (p.starTimer === 0) {
          global.MarioAudio.playMusic(this.level.music, this.hurryPlayed ? 1.32 : 1.0);
        }
      }

      for (const plat of this.platforms) plat.update(p.ridingPlatform === plat);
      for (const sp of this.springs) sp.update();

      // Authentic NES Bullet Bill random barrage (Worlds 5-3 & 6-3)
      if (this.level.bulletBarrage && this.level.flagpoleCol && p.x < (this.level.flagpoleCol - 14) * TILE && p.x > 16 * TILE) {
        this.barrageTimer = (this.barrageTimer || 140) - 1;
        if (this.barrageTimer <= 0) {
          this.barrageTimer = 130 + Math.floor(Math.random() * 80);
          const by = Math.max(48, Math.min(184, p.y - 16 + Math.floor(Math.random() * 48)));
          this.enemies.push(new global.MarioEntities.BulletBill(this.cameraX + this.screenW + 8, by, -1));
          global.MarioAudio.playSfx('cannon');
        }
      }

      // Player Physics (Normal vs Underwater)
      if (this.level.isUnderwater) this.updateUnderwaterPhysics();
      else this.updatePlayerPhysics();

      this.collectWorldCoins();
      this.checkWarpPipes();

      const pBox = p.getHitbox();

      // Check Springboards
      for (const sp of this.springs) {
        if (p.vy >= 0 && global.MarioEntities.aabb(pBox, sp)) {
          sp.compress = 7;
          p.y = sp.y - p.h;
          p.vy = this.input.jump ? -8.6 : -6.8;
          p.onGround = false;
          global.MarioAudio.playSfx('spring');
        }
      }

      // Check Lava
      const footRow = Math.floor((pBox.y + pBox.h - 2) / TILE);
      const midCol = Math.floor((pBox.x + pBox.w / 2) / TILE);
      if (this.getTile(midCol, footRow) === 'L') { this.killPlayer(); return; }

      if (p.y > SCREEN_H + 16) { this.killPlayer(); return; }

      // Authentic NES Castle Maze loop checks (Worlds 4-4, 7-4, 8-4)
      if (this.level.mazeLoops && !p.dead) {
        for (const mz of this.level.mazeLoops) {
          if (p.x >= mz.checkCol * TILE && p.x < (mz.checkCol + 1) * TILE) {
            const pMidY = p.y + p.h / 2;
            if (pMidY < mz.validMinY || pMidY > mz.validMaxY) {
              const shift = (mz.checkCol - mz.loopBackCol) * TILE;
              p.x -= shift;
              this.cameraX = Math.max(0, this.cameraX - shift);
              break;
            }
          }
        }
      }

      // Flagpole
      if (this.level.flagpoleCol) {
        const flagX = this.level.flagpoleCol * TILE + 4;
        if (p.x + p.w >= flagX && p.x <= flagX + 8) {
          this.startFlagpoleSequence();
          return;
        }
      }

      // Castle Axe
      if (this.level.isCastle && this.level.axeCol) {
        const axeBox = { x: this.level.axeCol * TILE, y: this.level.axeRow * TILE, w: 16, h: 16 };
        if (global.MarioEntities.aabb(pBox, axeBox)) {
          this.startBridgeCollapse();
          return;
        }
      }

      // Bill Blaster Cannons
      if (this.level.cannons) {
        for (const cn of this.level.cannons) {
          const cx = cn.col * TILE;
          const cy = cn.row * TILE;
          if (cx > this.cameraX - 16 && cx < this.cameraX + this.screenW + 16) {
            cn.timer--;
            if (cn.timer <= 0) {
              cn.timer = 135 + Math.floor(Math.random() * 60);
              if (Math.abs(p.x - cx) > 24) {
                const dir = p.x < cx ? -1 : 1;
                this.enemies.push(new global.MarioEntities.BulletBill(cx + dir * 10, cy + 1, dir));
                this.spawnPuff(cx + dir * 12, cy + 4);
                global.MarioAudio.playSfx('cannon');
              }
            }
          }
        }
      }

      // Update Power-Ups
      for (const item of this.powerUps) {
        item.update(this);
        if (!item.emerging && global.MarioEntities.aabb(pBox, item)) {
          item.remove = true;
          if (item.kind === 'mushroom') {
            if (p.powerState === 'small') p.setPower('big');
            global.MarioAudio.playSfx('powerup');
            this.addScore(1000, item.x, item.y);
          } else if (item.kind === 'flower') {
            p.setPower('fire');
            global.MarioAudio.playSfx('powerup');
            this.addScore(1000, item.x, item.y);
          } else if (item.kind === 'oneUp') {
            this.lives++;
            global.MarioAudio.playSfx('oneUp');
            this.floatingScores.push(new global.MarioEntities.FloatingScore(item.x, item.y, '1UP'));
          } else if (item.kind === 'star') {
            p.starTimer = 600;
            global.MarioAudio.playMusic('starman', 1.0);
            this.addScore(1000, item.x, item.y);
          }
        }
      }
      this.powerUps = this.powerUps.filter(i => !i.remove);

      const pHurt = this.getPlayerHurtbox(pBox);

      // Update Hammers
      for (const h of this.hammers) {
        h.update();
        if (global.MarioEntities.aabb(pHurt, { x: h.x + 1, y: h.y + 1, w: Math.max(4, h.w - 2), h: Math.max(4, h.h - 2) })) {
          this.hurtPlayer();
          h.remove = true;
        }
      }
      this.hammers = this.hammers.filter(h => !h.remove);

      // Update Fireballs
      for (const fb of this.fireballs) {
        fb.update(this);
        if (fb.fromBowser) {
          if (global.MarioEntities.aabb(pHurt, { x: fb.x + 2, y: fb.y + 2, w: Math.max(4, fb.w - 4), h: Math.max(4, fb.h - 4) })) {
            this.hurtPlayer();
            fb.remove = true;
          }
        } else {
          for (const e of this.enemies) {
            if (e.dead || e.squashed || e.flipped) continue;
            if (global.MarioEntities.aabb(fb, e)) {
              fb.remove = true;
              this.spawnPuff(fb.x, fb.y);
              if (e.type === 'buzzy') {
                // Authentic NES: Buzzy Beetle is immune to Fireballs!
                global.MarioAudio.playSfx('bump');
              } else if (e.type === 'bowser') {
                e.hp--;
                e.hitFlash = 10;
                global.MarioAudio.playSfx('kick');
                if (e.hp <= 0) {
                  e.falling = true;
                  e.dead = true;
                  if (e.worldNum < 8) {
                    const disguises = ['goomba', 'koopa', 'buzzy', 'spiny', 'lakitu', 'blooper', 'hammerbro'];
                    e.revealedDisguise = disguises[e.worldNum - 1] || 'goomba';
                  }
                  global.MarioAudio.playSfx('bowserFall');
                  this.addScore(5000, e.x, e.y);
                }
              } else if (e.type === 'piranha') {
                e.dead = true;
                global.MarioAudio.playSfx('kick');
                this.addScore(200, e.x, e.y);
              } else {
                this.flipEnemy(e, fb.vx > 0 ? 1 : -1);
              }
              break;
            }
          }
        }
      }
      this.fireballs = this.fireballs.filter(f => !f.remove);

      // Update Enemies
      // Preserve entry vy & foot position across the whole frame so stomping enemy #1 in a pair
      // also cleanly stomps overlapping enemy #2 instead of hurting Mario on the same frame!
      const entryVy = p.vy;
      const entryPrevFootY = pBox.y + pBox.h - Math.max(0, entryVy);
      let stompedThisFrame = false;

      for (const e of this.enemies) {
        if (!e.active && e.x < this.cameraX + this.screenW + 44) e.active = true;
        if (!e.active) continue;
        e.update(this);

        // Spinning shell knocks out enemies
        if ((e.type === 'koopa' || e.type === 'buzzy') && e.state === 'spinning' && !e.dead) {
          for (const other of this.enemies) {
            if (other === e || other.dead || other.squashed || other.flipped || other.type === 'bowser') continue;
            if (global.MarioEntities.aabb(e, other)) {
              this.flipEnemy(other, e.vx > 0 ? 1 : -1);
            }
          }
        }

        if (e.dead || e.squashed || e.flipped || p.dead) continue;

        // 1. Generous Starman kill
        if (p.starTimer > 0 && e.type !== 'bowser' && global.MarioEntities.aabb(pBox, e)) {
          if (e.type === 'piranha') {
            if (e.phase !== 'hidden') { e.dead = true; global.MarioAudio.playSfx('kick'); this.addScore(200, e.x, e.y); }
          } else {
            this.flipEnemy(e, p.facing);
          }
          continue;
        }

        // Cannot stomp Piranha, Bowser, Spiny, or underwater enemies!
        const unstompable = (
          e.type === 'piranha' || e.type === 'bowser' || e.type === 'spiny' ||
          this.level.isUnderwater
        );

        // 2. Generous Stomp check BEFORE tight hurtbox check (uses entryVy so multi-stomps never hurt!)
        const stompBox = { x: e.x + 1, y: e.y - 2, w: Math.max(6, e.w - 2), h: Math.max(10, e.h) };
        if (!unstompable && (entryVy > 0 || stompedThisFrame) && entryPrevFootY <= e.y + 11 && global.MarioEntities.aabb(pBox, stompBox)) {
          stompedThisFrame = true;
          p.vy = this.input.jump ? -4.8 : -3.4;
          p.y = Math.min(p.y, e.y - p.h);
          p.stompGrace = 10; // Brief bounce grace so de-winged Paratroopas / kicked shells / clustered enemies never hurt Mario on bounce-off!
          const comboPts = [100, 200, 400, 800, 1000, 2000, 4000, 8000];
          const pts = comboPts[Math.min(p.stompCombo, comboPts.length - 1)];
          p.stompCombo++;

          if (e.type === 'goomba') {
            e.squashed = true; e.dead = true; e.squashTimer = 24;
            global.MarioAudio.playSfx('stomp');
            this.addScore(pts, e.x, e.y);
          } else if (e.type === 'koopa' || e.type === 'buzzy') {
            if (e.winged) {
              e.winged = false;
              e.vx = -0.65;
              global.MarioAudio.playSfx('stomp');
              this.addScore(400, e.x, e.y);
            } else if (e.state === 'walk' || e.state === 'spinning') {
              e.state = 'shell'; e.vx = 0; e.shellTimer = 0;
              global.MarioAudio.playSfx('stomp');
              this.addScore(pts, e.x, e.y);
            } else {
              e.state = 'spinning';
              e.vx = (p.x + p.w / 2 < e.x + e.w / 2) ? 3.5 : -3.5;
              global.MarioAudio.playSfx('kick');
              this.addScore(400, e.x, e.y);
            }
          } else {
            // Stomp Bullet Bill, Lakitu, Hammer Bro, Leaping Cheep-Cheep!
            this.flipEnemy(e, p.facing);
            global.MarioAudio.playSfx('stomp');
          }
          continue;
        }

        // 3. Kick stationary Koopa/Buzzy shell on touch (with brief grace so kicked shell never hurts Mario!)
        if ((e.type === 'koopa' || e.type === 'buzzy') && e.state === 'shell' && global.MarioEntities.aabb(pBox, e)) {
          e.state = 'spinning';
          e.vx = (p.x + p.w / 2 < e.x + e.w / 2) ? 3.5 : -3.5;
          p.x += (e.vx > 0 ? -4 : 4);
          p.stompGrace = 10;
          global.MarioAudio.playSfx('kick');
          this.addScore(400, e.x, e.y);
          continue;
        }

        // 4. Tight NES Damage Hurtbox: Mario ONLY gets hurt when sprites actually overlap and not bouncing off a stomp!
        if (stompedThisFrame || (p.stompGrace > 0 && !unstompable)) continue;
        const eHurt = this.getEnemyHurtbox(e);
        if (eHurt && global.MarioEntities.aabb(pHurt, eHurt)) {
          this.hurtPlayer();
          if (p.dead) break;
        }
      }
      this.enemies = this.enemies.filter(e => !e.remove);

      // Castle Fire Bars
      if (this.level.fireBars) {
        for (const bar of this.level.fireBars) {
          bar.angle += bar.speed;
          for (let i = 1; i <= bar.length; i++) {
            const fx = bar.cx + Math.cos(bar.angle) * (i * 8) - 4;
            const fy = bar.cy + Math.sin(bar.angle) * (i * 8) - 4;
            if (global.MarioEntities.aabb(pHurt, { x: fx + 2, y: fy + 2, w: 4, h: 4 })) {
              this.hurtPlayer();
            }
          }
        }
      }

      // Castle Podoboos
      if (this.level.podoboos) {
        for (const pb of this.level.podoboos) {
          if (!pb.jumping) {
            pb.timer--;
            if (pb.timer <= 0) { pb.jumping = true; pb.y = pb.baseY; pb.vy = -5.4; }
          } else {
            pb.y += pb.vy;
            pb.vy += 0.12;
            if (pb.y > pb.baseY) {
              pb.jumping = false; pb.y = pb.baseY;
              pb.timer = 70 + Math.floor(Math.random() * 50);
            }
            if (global.MarioEntities.aabb(pHurt, { x: pb.x - 3, y: pb.y - 3, w: 6, h: 8 })) {
              this.hurtPlayer();
            }
          }
        }
      }

      const midpoint = this.level.midpoint;
      if (midpoint && !this.respawnAt && !p.dead && this.state === 'playing' && p.x >= midpoint.x) {
        this.respawnAt = midpoint;
      }

      // Camera
      const maxCam = Math.max(0, this.level.cols * TILE - this.screenW);
      const targetCam = Math.max(0, Math.min(maxCam, p.x - this.screenW * 0.42));
      this.cameraX += (targetCam - this.cameraX) * 0.22;
      if (Math.abs(targetCam - this.cameraX) < 0.5) this.cameraX = targetCam;
    }

    // ---- Authentic Underwater Swimming Physics (Worlds 2-2 & 7-2) ----
    updateUnderwaterPhysics() {
      const p = this.player;
      const inp = this.input;
      const maxSpeed = 1.4;
      if (inp.left && !inp.right) { p.vx = Math.max(-maxSpeed, p.vx - 0.10); p.facing = -1; }
      else if (inp.right && !inp.left) { p.vx = Math.min(maxSpeed, p.vx + 0.10); p.facing = 1; }
      else { p.vx *= 0.88; if (Math.abs(p.vx) < 0.05) p.vx = 0; }

      if (inp.jumpPressed) {
        p.vy = -2.35;
        p.onGround = false;
        global.MarioAudio.playSfx('swim');
        this.particles.push(new global.MarioEntities.Particle(p.x + 6, p.y, 0, -0.7, '#a4e4fc', 2, 26, -0.01));
      }

      if (inp.firePressed && p.powerState === 'fire' && p.fireCooldown <= 0) {
        const active = this.fireballs.filter(f => !f.fromBowser).length;
        if (active < 2) {
          this.fireballs.push(new global.MarioEntities.Fireball(p.facing > 0 ? p.x + p.w : p.x - 8, p.y + 8, p.facing, false));
          p.fireCooldown = 14;
          p.fireAnimTimer = 10;
          global.MarioAudio.playSfx('fireball');
        }
      }

      // Authentic NES underwater pit downward current
      const footCol = Math.floor((p.x + p.w / 2) / TILE);
      const overPit = !this.isSolidTile(footCol, 13) && !this.isSolidTile(footCol, 14);
      const sinkGrav = overPit ? 0.145 : 0.085;
      p.vy = Math.min(overPit ? 2.3 : 1.5, p.vy + sinkGrav);
      this.resolvePlayerTileMovement();
      if (p.y < 30) { p.y = 30; if (p.vy < 0) p.vy = 0; }
      p.animFrame += Math.abs(p.vx) * 0.14;
    }

    updatePlayerPhysics() {
      const p = this.player;
      const inp = this.input;

      p.crouching = (p.powerState !== 'small' && p.onGround && inp.down);

      // Exact 1985 NES Super Mario Bros. Disassembly Physics (JDaster64 / 6502 ROM values, 1px = 256 subpixels)
      const WALK_MAX = 1.5;              // $01800
      const RUN_MAX = 2.75;              // $02C00
      const WALK_ACCEL = 10 / 256;       // $00098 (~0.0391 px/f^2)
      const RUN_ACCEL = 19 / 256;        // $000E4-$00130 (~0.0742 px/f^2)
      const RELEASE_DECEL = 10 / 256;    // $000A0 (~0.0391 px/f^2 — classic NES coasting slide)
      const SKID_DECEL = 26 / 256;       // $001A0 (~0.1016 px/f^2 — snappy skid brake)
      const SKID_TURN_SPEED = 0.5625;    // $00900 — threshold to complete turnaround
      const MIN_WALK_SPEED = 0.13;       // $00130 — instant start from standstill

      const targetMax = inp.run ? RUN_MAX : WALK_MAX;
      const accel = inp.run ? RUN_ACCEL : WALK_ACCEL;

      const wasSkidding = p.skidding;
      p.skidding = false;

      if (p.onGround) {
        if (!p.crouching && inp.left && !inp.right) {
          if (p.vx > SKID_TURN_SPEED) {
            p.skidding = true;
            p.vx -= SKID_DECEL;
          } else if (p.vx > 0) {
            p.vx = -MIN_WALK_SPEED;
            p.facing = -1;
          } else {
            if (p.vx > -MIN_WALK_SPEED) p.vx = -MIN_WALK_SPEED;
            else if (p.vx > -targetMax) p.vx = Math.max(-targetMax, p.vx - accel);
            else p.vx = Math.min(-targetMax, p.vx + RELEASE_DECEL);
            p.facing = -1;
          }
        } else if (!p.crouching && inp.right && !inp.left) {
          if (p.vx < -SKID_TURN_SPEED) {
            p.skidding = true;
            p.vx += SKID_DECEL;
          } else if (p.vx < 0) {
            p.vx = MIN_WALK_SPEED;
            p.facing = 1;
          } else {
            if (p.vx < MIN_WALK_SPEED) p.vx = MIN_WALK_SPEED;
            else if (p.vx < targetMax) p.vx = Math.min(targetMax, p.vx + accel);
            else p.vx = Math.max(targetMax, p.vx - RELEASE_DECEL);
            p.facing = 1;
          }
        } else {
          if (Math.abs(p.vx) <= RELEASE_DECEL) p.vx = 0;
          else p.vx -= Math.sign(p.vx) * RELEASE_DECEL;
        }
      } else {
        // Authentic NES midair control: facing never flips midair; momentum-based air accel
        const airAccel = Math.abs(p.vx) >= WALK_MAX ? RUN_ACCEL : WALK_ACCEL;
        const airCap = Math.max(targetMax, Math.abs(p.vx));
        if (inp.left && !inp.right) {
          p.vx = Math.max(-airCap, p.vx - airAccel);
        } else if (inp.right && !inp.left) {
          p.vx = Math.min(airCap, p.vx + airAccel);
        }
      }

      // Authentic 1985 SMB1 has no skid sound (skid screech was only added in SMB2J / Lost Levels)

      if (p.ridingPlatform) { p.x += p.ridingPlatform.dx; p.y += p.ridingPlatform.dy; }

      if (p.onGround) { p.coyoteTimer = 6; p.stompCombo = 0; }
      else if (p.coyoteTimer > 0) p.coyoteTimer--;

      if (inp.jumpPressed) p.jumpBuffer = 6;
      else if (p.jumpBuffer > 0) p.jumpBuffer--;

      // Exact 3-tier NES SMB1 Jump Takeoff (clears 4-tile pipes cleanly from a standstill!)
      if (p.jumpBuffer > 0 && p.coyoteTimer > 0) {
        const absVx = Math.abs(p.vx);
        if (absVx >= 2.3125) {
          p.jumpTier = 2; // Full sprint jump (~5.1 tiles)
          p.vy = -5.1;
        } else if (absVx >= 1.0) {
          p.jumpTier = 1; // Walking jump (~4.7 tiles)
          p.vy = -4.25;
        } else {
          p.jumpTier = 0; // Standing / slow jump (~4.4 tiles — clears tallest 4-tile pipe!)
          p.vy = -4.25;
        }
        p.onGround = false; p.coyoteTimer = 0; p.jumpBuffer = 0; p.ridingPlatform = null;
        global.MarioAudio.playSfx(p.powerState === 'small' ? 'jump' : 'jumpBig');
      }

      if (inp.firePressed && p.powerState === 'fire' && p.fireCooldown <= 0) {
        const active = this.fireballs.filter(f => !f.fromBowser).length;
        if (active < 2) {
          this.fireballs.push(new global.MarioEntities.Fireball(p.facing > 0 ? p.x + p.w : p.x - 8, p.y + 8, p.facing, false));
          p.fireCooldown = 14;
          p.fireAnimTimer = 10;
          global.MarioAudio.playSfx('fireball');
        }
      }

      // Exact 3-tier NES SMB1 Holding & Falling Gravity + 4.0 px/f Terminal Velocity
      const HOLD_GRAV = [0.125, 0.1171875, 0.15625];
      const FALL_GRAV = [0.4375, 0.375, 0.5625];
      const tier = p.jumpTier || 0;
      const grav = (p.vy < 0 && inp.jump) ? HOLD_GRAV[tier] : FALL_GRAV[tier];
      p.vy = Math.min(4.0, p.vy + grav);

      this.resolvePlayerTileMovement();

      // Authentic NES countdown animation timer scaled by ground velocity (4-step pendulum cycle 0..3)
      if (p.onGround && Math.abs(p.vx) > 0.05 && !p.crouching && !p.skidding) {
        const spd = Math.abs(p.vx);
        const delay = spd >= 2.2 ? 4 : (spd >= 1.2 ? 6 : 8);
        p.animTimer = (p.animTimer || 0) - 1;
        if (p.animTimer <= 0) {
          p.animTimer = delay;
          p.animFrame = ((p.animFrame || 0) + 1) % 4;
        }
      } else {
        p.animFrame = 0;
        p.animTimer = 0;
      }
    }

    resolvePlayerTileMovement() {
      const p = this.player;
      p.x += p.vx;
      if (p.x < 0) { p.x = 0; p.vx = 0; }
      const hb = p.getHitbox();
      const topRow = Math.floor((hb.y + 2) / TILE);
      const botRow = Math.floor((hb.y + hb.h - 2) / TILE);

      if (p.vx > 0) {
        const rightCol = Math.floor((hb.x + hb.w) / TILE);
        for (let r = topRow; r <= botRow; r++) {
          if (this.isSolidTile(rightCol, r)) { p.x = rightCol * TILE - hb.w; p.vx = 0; break; }
        }
      } else if (p.vx < 0) {
        const leftCol = Math.floor(hb.x / TILE);
        for (let r = topRow; r <= botRow; r++) {
          if (this.isSolidTile(leftCol, r)) { p.x = (leftCol + 1) * TILE; p.vx = 0; break; }
        }
      }

      const prevBottom = hb.y + hb.h;
      p.y += p.vy;
      p.onGround = false;
      p.ridingPlatform = null;

      const hb2 = p.getHitbox();
      const leftCol = Math.floor((hb2.x + 1) / TILE);
      const rightCol = Math.floor((hb2.x + hb2.w - 1) / TILE);

      if (p.vy >= 0) {
        const botRow2 = Math.floor((hb2.y + hb2.h) / TILE);
        for (let c = leftCol; c <= rightCol; c++) {
          if (this.isSolidTile(c, botRow2)) {
            p.y = botRow2 * TILE - p.h;
            p.vy = 0; p.onGround = true;
            break;
          }
        }
        if (!p.onGround) {
          for (const plat of this.platforms) {
            if (hb2.x + hb2.w > plat.x && hb2.x < plat.x + plat.w && prevBottom <= plat.y + 4 && hb2.y + hb2.h >= plat.y) {
              p.y = plat.y - p.h; p.vy = 0; p.onGround = true; p.ridingPlatform = plat;
              break;
            }
          }
        }
      } else {
        const topRow2 = Math.floor(hb2.y / TILE);
        const hitCols = [];
        for (let c = leftCol; c <= rightCol; c++) {
          const tile = this.getTile(c, topRow2);
          if (this.isSolidTile(c, topRow2) || tile === '1' || tile === 'h') hitCols.push(c);
        }
        if (hitCols.length > 0) {
          const centerX = hb2.x + hb2.w / 2;
          const closestCol = hitCols.reduce((a, b) =>
            Math.abs(a * TILE + 8 - centerX) < Math.abs(b * TILE + 8 - centerX) ? a : b
          );
          p.y = (topRow2 + 1) * TILE - (hb2.y - p.y);
          p.vy = 0;
          this.hitBlock(closestCol, topRow2);
        }
      }
    }

    collectWorldCoins() {
      const hb = this.player.getHitbox();
      const c1 = Math.floor(hb.x / TILE);
      const c2 = Math.floor((hb.x + hb.w) / TILE);
      const r1 = Math.floor(hb.y / TILE);
      const r2 = Math.floor((hb.y + hb.h) / TILE);
      for (let r = r1; r <= r2; r++) {
        for (let c = c1; c <= c2; c++) {
          if (this.getTile(c, r) === 'C') {
            this.setTile(c, r, '.');
            this.addCoin(c * TILE, r * TILE);
          }
        }
      }
    }

    checkWarpPipes() {
      const p = this.player;
      const hb = p.getHitbox();

      // 1. Horizontal side-entry pipes (1-2, 2-2, 4-2, 7-2 exits & bonus room exits — works on ground & underwater!)
      if (this.input.right && (p.onGround || this.level.isUnderwater)) {
        if (this.level.warpPipes) {
          for (const wp of this.level.warpPipes) {
            if (!wp.sideEntry) continue;
            const mouthX = wp.col * TILE;
            const mouthTop = wp.row * TILE - 4;
            const mouthBot = (wp.row + 2) * TILE + 4;
            if (Math.abs((hb.x + hb.w) - mouthX) <= 5 && hb.y + hb.h > mouthTop + 6 && hb.y < mouthBot - 6) {
              this.state = 'pipe';
              this.pipeAnim = { mode: wp.isStageExit ? 'stageExit' : 'enterBonus', timer: 32, target: wp.target, side: true };
              global.MarioAudio.playSfx('pipe');
              return;
            }
          }
        }
        if (this.level.isBonus && this.level.exitPipe && this.level.exitPipe.sideEntry) {
          const ep = this.level.exitPipe;
          const mouthX = ep.col * TILE;
          const mouthTop = ep.row * TILE - 4;
          const mouthBot = (ep.row + 2) * TILE + 4;
          if (Math.abs((hb.x + hb.w) - mouthX) <= 5 && hb.y + hb.h > mouthTop + 6 && hb.y < mouthBot - 6) {
            this.state = 'pipe';
            this.pipeAnim = { mode: 'exitBonus', timer: 32, side: true };
            global.MarioAudio.playSfx('pipe');
            return;
          }
        }
      }

      if (!p.onGround) return;

      if (this.input.down && this.level.warpPipes) {
        for (const wp of this.level.warpPipes) {
          if (wp.sideEntry) continue;
          const pipeLeft = wp.col * TILE;
          const pipeRight = (wp.col + 2) * TILE;
          const pipeTop = wp.row * TILE;
          if (p.x >= pipeLeft && p.x + p.w <= pipeRight && Math.abs((p.y + p.h) - pipeTop) <= 2) {
            if (wp.sameLevel) {
              this.state = 'pipe';
              this.pipeAnim = { mode: 'sameLevel', timer: 32, destX: wp.destX, destY: wp.destY };
              global.MarioAudio.playSfx('pipe');
              return;
            }
            if (wp.isWorldWarp) {
              this.state = 'pipe';
              this.pipeAnim = { mode: 'worldWarp', timer: 36, target: wp.target };
              global.MarioAudio.stopMusic();
              global.MarioAudio.playSfx('pipe');
              return;
            }
            if (wp.isStageExit) {
              this.state = 'pipe';
              this.pipeAnim = { mode: 'stageExit', timer: 36, target: wp.target };
              global.MarioAudio.playSfx('pipe');
              return;
            }
            this.savedMainState = {
              level: this.level, enemies: this.enemies, platforms: this.platforms,
              springs: this.springs, powerUps: this.powerUps, time: this.time,
              exitX: wp.exitX, exitY: wp.exitY
            };
            this.state = 'pipe';
            this.pipeAnim = { mode: 'enterBonus', timer: 36, target: wp.target };
            global.MarioAudio.playSfx('pipe');
            return;
          }
        }
      }

      if (this.level.isBonus && this.level.exitPipe && !this.level.exitPipe.sideEntry && this.input.down) {
        const ep = this.level.exitPipe;
        const pipeLeft = ep.col * TILE;
        const pipeRight = (ep.col + 2) * TILE;
        const pipeTop = ep.row * TILE;
        if (p.x >= pipeLeft && p.x + p.w <= pipeRight && Math.abs((p.y + p.h) - pipeTop) <= 2) {
          this.state = 'pipe';
          this.pipeAnim = { mode: 'exitBonus', timer: 36 };
          global.MarioAudio.playSfx('pipe');
        }
      }
    }

    updatePipeAnim() {
      const p = this.player;
      this.pipeAnim.timer--;
      const stepPipeMove = () => {
        if (this.pipeAnim.side) p.x += 0.9;
        else p.y += 0.9;
      };
      if (this.pipeAnim.mode === 'sameLevel') {
        stepPipeMove();
        if (this.pipeAnim.timer <= 0) {
          p.x = this.pipeAnim.destX;
          p.y = this.pipeAnim.destY - p.h + 16;
          p.vx = 0; p.vy = 0;
          this.cameraX = Math.max(0, Math.min(Math.max(0, this.level.cols * TILE - this.screenW), p.x - this.screenW * 0.35));
          this.pipeAnim = { mode: 'emerge', timer: 24, targetY: this.pipeAnim.destY - p.h };
          global.MarioAudio.playSfx('pipe');
        }
      } else if (this.pipeAnim.mode === 'worldWarp') {
        stepPipeMove();
        if (this.pipeAnim.timer <= 0) {
          const power = p.powerState;
          const nextIdx = global.MarioLevels.LEVEL_ORDER.indexOf(this.pipeAnim.target);
          if (nextIdx >= 0) this.currentLevelIdx = nextIdx;
          this.savedMainState = null;
          this.respawnAt = null;
          this.beginLevelIntro(this.pipeAnim.target, power);
        }
      } else if (this.pipeAnim.mode === 'stageExit') {
        stepPipeMove();
        if (this.pipeAnim.timer <= 0) {
          const power = p.powerState;
          const savedTime = this.time;
          this.savedMainState = null;
          this.loadLevel(this.pipeAnim.target, power, false);
          this.time = savedTime;
          this.player.y = (this.level.spawnPipeRow * TILE) - this.player.h + 16;
          this.state = 'pipe';
          this.pipeAnim = { mode: 'emerge', timer: 24, targetY: (this.level.spawnPipeRow * TILE) - this.player.h };
          global.MarioAudio.playSfx('pipe');
        }
      } else if (this.pipeAnim.mode === 'enterBonus') {
        stepPipeMove();
        if (this.pipeAnim.timer <= 0) {
          const power = p.powerState;
          const savedTime = this.time;
          this.loadLevel(this.pipeAnim.target, power, false);
          this.time = savedTime;
        }
      } else if (this.pipeAnim.mode === 'exitBonus') {
        stepPipeMove();
        if (this.pipeAnim.timer <= 0) {
          if (this.savedMainState) {
            const s = this.savedMainState;
            const power = p.powerState;
            this.level = s.level;
            this.enemies = s.enemies;
            this.platforms = s.platforms;
            this.springs = s.springs || [];
            this.powerUps = s.powerUps;
            this.fireballs = [];
            this.hammers = [];
            this.particles = [];
            this.player = new global.MarioEntities.Player(s.exitX, s.exitY - 16, power);
            this.player.y = s.exitY - this.player.h + 16;
            const maxCam = Math.max(0, this.level.cols * TILE - this.screenW);
            this.cameraX = Math.max(0, Math.min(maxCam, s.exitX - 100));
            this.savedMainState = null;
            this.pipeAnim = { mode: 'emerge', timer: 24, targetY: s.exitY - this.player.h };
            global.MarioAudio.playSfx('pipe');
            global.MarioAudio.playMusic(this.level.music, this.hurryPlayed ? 1.32 : 1.0);
          } else {
            const id = global.MarioLevels.LEVEL_ORDER[this.currentLevelIdx] || '1-1';
            this.loadLevel(id, p.powerState, false);
          }
        }
      } else if (this.pipeAnim.mode === 'emerge') {
        p.y = Math.max(this.pipeAnim.targetY, p.y - 0.8);
        if (this.pipeAnim.timer <= 0) this.state = 'playing';
      }
    }

    startFlagpoleSequence() {
      const p = this.player;
      this.state = 'flagpole';
      this.savedMainState = null;
      p.vx = 0; p.vy = 0;
      p.starTimer = 0; p.crouching = false; p.skidding = false; p.invulnTimer = 0;
      p.x = this.level.flagpoleCol * TILE - 4;
      const heightRatio = (13 * TILE - (p.y + p.h)) / (9 * TILE);
      let bonus = 100;
      if (heightRatio > 0.85) bonus = 5000;
      else if (heightRatio > 0.55) bonus = 2000;
      else if (heightRatio > 0.25) bonus = 800;
      else if (heightRatio > 0.10) bonus = 400;
      this.addScore(bonus);
      global.MarioAudio.stopMusic();
      global.MarioAudio.playSfx('flagpole');
      const lastDigit = this.time % 10;
      const fwCount = (lastDigit === 1 || lastDigit === 3 || lastDigit === 6) ? lastDigit : 0;
      this.flagAnim = {
        phase: 'slide', flagY: 3 * TILE, timer: 0,
        bonusText: String(bonus),
        bonusX: this.level.flagpoleCol * TILE + 12,
        bonusY: 11 * TILE + 4,
        castleX: this.level.castleCol * TILE + 34,
        fireworksLeft: fwCount, fireworkCooldown: 24
      };
    }

    updateFlagpole() {
      const p = this.player;
      const fa = this.flagAnim;
      for (const pt of this.particles) pt.update();
      this.particles = this.particles.filter(pt => pt.life > 0);
      for (const fs of this.floatingScores) fs.update();
      this.floatingScores = this.floatingScores.filter(fs => fs.life > 0);

      if (fa.phase === 'slide') {
        const groundY = 12 * TILE - p.h;
        if (p.y < groundY) p.y = Math.min(groundY, p.y + 2.2);
        if (fa.flagY < 11 * TILE) fa.flagY = Math.min(11 * TILE, fa.flagY + 2.2);
        // Authentic 1985 NES: flagpole score rises UP on the right side as flag slides DOWN!
        if (fa.bonusY > 3 * TILE + 6) fa.bonusY = Math.max(3 * TILE + 6, fa.bonusY - 2.2);
        if (p.y >= groundY && fa.flagY >= 11 * TILE) {
          fa.phase = 'walk';
          global.MarioAudio.playSfx('stageClear');
        }
      } else if (fa.phase === 'walk') {
        p.x += 1.2; p.y = 13 * TILE - p.h; p.facing = 1; p.onGround = true; p.animFrame += 0.18;
        if (p.x >= fa.castleX) { fa.phase = 'tally'; fa.timer = 115; }
      } else if (fa.phase === 'tally') {
        fa.flagRise = Math.min(16, (fa.flagRise || 0) + 0.5);
        if (this.time > 0) {
          const take = Math.min(2, this.time);
          this.time -= take;
          this.addScore(take * 50);
        } else if (fa.fireworksLeft > 0) {
          fa.fireworkCooldown--;
          if (fa.fireworkCooldown <= 0) {
            fa.fireworksLeft--;
            fa.fireworkCooldown = 26;
            const fx = fa.castleX - 24 + Math.random() * 56;
            const fy = 44 + Math.random() * 36;
            this.spawnFirework(fx, fy);
            this.addScore(500, fx, fy);
          }
        } else {
          fa.timer--;
          if (fa.timer <= 0) this.advanceToNextLevel();
        }
      }
    }

    spawnFirework(x, y) {
      global.MarioAudio.playSfx('cannon');
      const colors = ['#fbd000', '#e52521', '#fcfcfc', '#80d010'];
      for (let i = 0; i < 12; i++) {
        const ang = (Math.PI * 2 * i) / 12;
        const spd = 1.2 + Math.random() * 1.4;
        this.particles.push(new global.MarioEntities.Particle(
          x, y, Math.cos(ang) * spd, Math.sin(ang) * spd, colors[i % colors.length], 3, 24, 0.04
        ));
      }
    }

    startBridgeCollapse() {
      const p = this.player;
      this.state = 'bridge';
      this.savedMainState = null;
      p.vx = 0; p.vy = 0;
      p.starTimer = 0; p.crouching = false; p.skidding = false; p.invulnTimer = 0;
      this.setTile(this.level.axeCol, this.level.axeRow, '.');
      this.fireballs = [];
      this.hammers = [];
      global.MarioAudio.stopMusic();
      this.bridgeAnim = { col: this.level.bridgeEndCol, tick: 0 };
    }

    updateBridgeCollapse() {
      this.bridgeAnim.tick++;
      if (this.bridgeAnim.tick % 5 === 0) {
        if (this.bridgeAnim.col >= this.level.bridgeStartCol) {
          this.setTile(this.bridgeAnim.col, this.level.bridgeRow, '.');
          global.MarioAudio.playSfx('bridgeCollapse');
          this.bridgeAnim.col--;
        } else {
          for (const e of this.enemies) {
            if (e.type === 'bowser' && !e.falling) {
              e.falling = true; e.dead = true;
              global.MarioAudio.playSfx('bowserFall');
            }
          }
        }
      }

      let bowserVisible = false;
      for (const e of this.enemies) {
        if (e.type === 'bowser') {
          e.update(this);
          if (!e.remove) bowserVisible = true;
        }
      }

      if (this.bridgeAnim.col < this.level.bridgeStartCol && !bowserVisible) {
        this.state = 'castleVictory';
        this.toadMessageTimer = 0;
        global.MarioAudio.playSfx(this.level.isFinalCastle ? 'worldClear' : 'stageClear');
      }
    }

    updateCastleVictory() {
      const p = this.player;
      const targetX = this.level.toadPos.x - 28;
      const floorY = 13 * TILE - p.h;
      if (p.x < targetX) {
        p.x += 1.2;
        if (p.y < floorY) {
          p.vy = Math.min(4.0, (p.vy || 0) + 0.28);
          p.y = Math.min(floorY, p.y + p.vy);
        } else {
          p.y = floorY;
          p.vy = 0;
        }
        p.facing = 1; p.onGround = (p.y >= floorY); p.animFrame += 0.16;
        const maxCam = Math.max(0, this.level.cols * TILE - this.screenW);
        this.cameraX = Math.min(maxCam, Math.max(this.cameraX, p.x - 100));
      } else {
        p.y = floorY;
        p.vx = 0;
        p.onGround = true;
        this.toadMessageTimer++;
        if (this.toadMessageTimer > 290) {
          if (this.level.isFinalCastle) {
            this.state = 'victory';
            this.stateTimer = 0;
          } else {
            this.advanceToNextLevel();
          }
        }
      }
    }

    advanceToNextLevel() {
      const power = this.player ? this.player.powerState : 'small';
      this.currentLevelIdx++;
      if (this.currentLevelIdx >= global.MarioLevels.LEVEL_ORDER.length) {
        this.respawnAt = null;
        this.state = 'victory';
        this.stateTimer = 0;
      } else {
        this.beginLevelIntro(global.MarioLevels.LEVEL_ORDER[this.currentLevelIdx], power);
      }
    }

    // ========================================================================
    // RENDERING (256x240 Authentic NES Frame)
    // ========================================================================
    render() {
      const ctx = this.ctx;
      const S = global.MarioSprites;

      if (this.state === 'intro') { this.renderIntroScreen(ctx); return; }
      if (this.state === 'gameOver') { this.renderGameOverScreen(ctx); return; }
      if (this.state === 'victory') { this.renderVictoryScreen(ctx); return; }

      S.drawScenery(ctx, this.level, this.cameraX, this.frame);

      ctx.save();
      const roomOffsetX = this.level.cols * TILE < this.screenW
        ? Math.floor((this.screenW - this.level.cols * TILE) / 2)
        : 0;
      ctx.translate(roomOffsetX - Math.floor(this.cameraX), 0);

      if (this.level.castleCol) {
        const cx = this.level.castleCol * TILE;
        const cy = 13 * TILE - 80;
        // Raise authentic NES fortress flag when Mario enters castle!
        if (this.state === 'flagpole' && this.flagAnim && this.flagAnim.phase === 'tally') {
          const fImg = global.MarioAssets ? global.MarioAssets.getSprite('fortress_flag') : null;
          const rise = Math.min(16, (this.flagAnim.flagRise || 0));
          if (fImg) {
            ctx.drawImage(fImg, cx + 34, cy - rise, 13, 16);
          }
        }
        S.drawCastle(ctx, cx, cy);
      }

      for (const e of this.enemies) {
        if (e.type === 'piranha' && !e.dead) S.drawPiranha(ctx, e, this.frame, this.level.theme);
      }

      // Emerging power-ups rise smoothly from BEHIND the block (authentic NES layer order)
      for (const item of this.powerUps) {
        if (item.emerging) S.drawPowerUp(ctx, item, this.frame);
      }

      if (this.state === 'pipe') {
        S.drawMario(ctx, this.player, this.frame, !!this.level.isUnderwater);
      }

      const startCol = Math.max(0, Math.floor(this.cameraX / TILE) - 1);
      const endCol = Math.min(this.level.cols - 1, Math.ceil((this.cameraX + this.screenW) / TILE) + 1);
      const isTitle = this.state === 'title';
      for (let r = 0; r < this.level.grid.length; r++) {
        // Keep the widescreen Title Screen clean (sky, hills, bushes, ground & Mario — no blocks behind the logo/menu!)
        if (isTitle && r < 13) continue;
        for (let c = startCol; c <= endCol; c++) {
          const ch = this.level.grid[r][c];
          if (ch === '.') continue;
          const bump = this.bumpedTiles.get(`${c},${r}`) || 0;
          S.drawTile(ctx, ch, c * TILE, r * TILE, this.level.theme, this.frame, bump);
        }
      }

      // Authentic 1985 NES crisp pixel-art flagpole pennant (white triangle + green skull) & rising bonus score
      if (this.level.flagpoleCol) {
        const fx = this.level.flagpoleCol * TILE - 9;
        const fy = (this.state === 'flagpole' && this.flagAnim) ? this.flagAnim.flagY : 3 * TILE;
        S.drawFlagPennant(ctx, fx, fy);
        if (this.state === 'flagpole' && this.flagAnim && this.flagAnim.bonusText && this.flagAnim.phase !== 'tally') {
          S.drawPixelText(ctx, this.flagAnim.bonusText, Math.round(this.flagAnim.bonusX), Math.round(this.flagAnim.bonusY), '#fcfcfc', 1, 'left', true);
        }
      }

      // Moving Platforms
      for (const plat of this.platforms) {
        ctx.fillStyle = '#000000';
        ctx.fillRect(Math.round(plat.x), Math.round(plat.y), plat.w, plat.h);
        ctx.fillStyle = '#fc9838';
        ctx.fillRect(Math.round(plat.x) + 1, Math.round(plat.y) + 1, plat.w - 2, plat.h - 2);
        ctx.fillStyle = '#c84c0c';
        ctx.fillRect(Math.round(plat.x) + 1, Math.round(plat.y) + plat.h - 3, plat.w - 2, 2);
      }

      // Springboards
      for (const sp of this.springs) S.drawSpring(ctx, sp);

      // Toad or Princess Peach (planted cleanly on castle rescue stone floor row 13!)
      if (this.level.toadPos) {
        const rescueY = 13 * TILE - 24;
        if (this.level.isFinalCastle) S.drawPeach(ctx, this.level.toadPos.x, rescueY);
        else S.drawToad(ctx, this.level.toadPos.x, rescueY);
      }

      for (const item of this.powerUps) {
        if (!item.emerging) S.drawPowerUp(ctx, item, this.frame);
      }

      // Enemies (hidden on clean Title Screen backdrop)
      if (!isTitle) for (const e of this.enemies) {
        if (e.type === 'piranha') continue;
        if (e.x + e.w < this.cameraX - 32 || e.x > this.cameraX + this.screenW + 32) continue;
        if (e.type === 'goomba') S.drawGoomba(ctx, e, this.frame, this.level.theme);
        else if (e.type === 'koopa') S.drawKoopa(ctx, e, this.frame);
        else if (e.type === 'buzzy') S.drawBuzzy(ctx, e, this.frame);
        else if (e.type === 'spiny') S.drawSpiny(ctx, e, this.frame);
        else if (e.type === 'lakitu') S.drawLakitu(ctx, e);
        else if (e.type === 'hammerbro') S.drawHammerBro(ctx, e, this.frame);
        else if (e.type === 'bullet') S.drawBulletBill(ctx, e);
        else if (e.type === 'blooper') S.drawBlooper(ctx, e, this.frame);
        else if (e.type === 'cheep') S.drawCheepCheep(ctx, e, this.frame);
        else if (e.type === 'bowser') S.drawBowser(ctx, e, this.frame);
      }

      // Castle Fire Bars & Podoboos
      if (this.level.fireBars) {
        for (const bar of this.level.fireBars) {
          for (let i = 0; i <= bar.length; i++) {
            S.drawFireball(ctx, bar.cx + Math.cos(bar.angle) * (i * 8) - 4, bar.cy + Math.sin(bar.angle) * (i * 8) - 4, this.frame + i);
          }
        }
      }
      if (this.level.podoboos) {
        for (const pb of this.level.podoboos) {
          if (pb.jumping) {
            S.drawFireball(ctx, pb.x - 4, pb.y - 4, this.frame);
            S.drawFireball(ctx, pb.x - 4, pb.y + 2, this.frame + 2);
          }
        }
      }

      // Hammers & Fireballs
      for (const h of this.hammers) S.drawHammer(ctx, h, this.frame);
      for (const fb of this.fireballs) {
        if (fb.fromBowser) S.drawBowserFire(ctx, fb.x, fb.y, this.frame);
        else S.drawFireball(ctx, fb.x, fb.y, this.frame);
      }

      // Mario (also visible standing on 1-1 ground on the Title Screen, just like 1985 NES!)
      if (this.state !== 'pipe' && !(this.state === 'flagpole' && this.flagAnim && this.flagAnim.phase === 'tally')) {
        S.drawMario(ctx, this.player, this.frame, !!this.level.isUnderwater);
      }

      for (const pt of this.particles) {
        if (pt.isCoinPop) {
          S.drawCoin(ctx, pt.x, pt.y, this.frame * 3, 'overworld');
        } else {
          ctx.fillStyle = pt.color;
          ctx.fillRect(Math.round(pt.x), Math.round(pt.y), pt.size, pt.size);
        }
      }

      for (const fs of this.floatingScores) {
        S.drawPixelText(ctx, fs.text, Math.round(fs.x), Math.round(fs.y) - 7, '#fcfcfc', 1, 'center', true);
      }

      if (this.level.worldTexts) {
        for (const wt of this.level.worldTexts) {
          S.drawPixelText(ctx, wt.text, wt.x, wt.y, wt.color || '#fcfcfc', 1, wt.align || 'center', false);
        }
      }

      ctx.restore();

      // Toad / Princess Peach Dialogue
      const cxMid = Math.round(this.screenW / 2);
      if (this.state === 'castleVictory' && this.toadMessageTimer > 15) {
        this.drawPixelText(ctx, 'THANK YOU MARIO!', cxMid, 72, '#fcfcfc', 8, 'center');
        if (this.toadMessageTimer > 55) {
          if (this.level.isFinalCastle) {
            this.drawPixelText(ctx, 'YOUR QUEST IS OVER.', cxMid, 92, '#ff88c8', 8, 'center');
            this.drawPixelText(ctx, 'WE PRESENT YOU A NEW QUEST!', cxMid, 108, '#fbd000', 7, 'center');
          } else {
            this.drawPixelText(ctx, 'BUT OUR PRINCESS IS IN', cxMid, 92, '#fbd000', 7, 'center');
            this.drawPixelText(ctx, 'ANOTHER CASTLE!', cxMid, 104, '#fbd000', 7, 'center');
          }
        }
      }

      this.renderHUD(ctx);

      if (this.state === 'title') this.renderTitleOverlay(ctx);
      else if (this.state === 'paused') {
        ctx.fillStyle = 'rgba(0,0,0,0.55)';
        ctx.fillRect(0, 0, this.screenW, SCREEN_H);
        this.drawPixelText(ctx, 'PAUSED', cxMid, 118, '#fcfcfc', 12, 'center');
        this.drawPixelText(ctx, 'PRESS P TO RESUME', cxMid, 136, '#fbd000', 7, 'center');
      }
    }

    drawPixelText(ctx, text, x, y, color = '#fcfcfc', size = 8, align = 'left', shadow = true) {
      const scale = size >= 14 ? 2 : 1;
      const topY = Math.round(y - 7 * scale);
      global.MarioSprites.drawPixelText(ctx, text, x, topY, color, scale, align, shadow);
    }

    renderHUD(ctx) {
      if (this.level?.isCastle) {
        ctx.fillStyle = '#000000';
        ctx.fillRect(0, 0, this.screenW, 25);
      }

      const ox = Math.round((this.screenW - 256) / 2);
      const scoreStr = String(this.score).padStart(6, '0');
      const coinStr = String(this.coins).padStart(2, '0');
      const timeStr = String(this.time).padStart(3, '0');

      // Authentic 1985 NES SMB HUD (centered cleanly in widescreen & classic 4:3!)
      this.drawPixelText(ctx, 'MARIO', ox + 24, 15, '#fcfcfc', 8, 'left', false);
      this.drawPixelText(ctx, scoreStr, ox + 24, 23, '#fcfcfc', 8, 'left', false);

      // Shimmering rounded NES HUD coin icon
      const coinShimmer = ['#fc9838', '#e47818', '#c84c0c', '#e47818'][Math.floor(this.frame / 10) % 4];
      ctx.fillStyle = '#000000';
      ctx.fillRect(ox + 89, 16, 4, 8);
      ctx.fillRect(ox + 88, 17, 6, 6);
      ctx.fillStyle = coinShimmer;
      ctx.fillRect(ox + 89, 17, 3, 6);
      ctx.fillStyle = '#fcbcb0';
      ctx.fillRect(ox + 90, 18, 1, 4);
      this.drawPixelText(ctx, `x${coinStr}`, ox + 96, 23, '#fcfcfc', 8, 'left', false);

      this.drawPixelText(ctx, 'WORLD', ox + 144, 15, '#fcfcfc', 8, 'left', false);
      const worldLabel = this.state === 'title'
        ? (global.MarioLevels.LEVEL_ORDER[this.selectedLevelIdx || 0] || '1-1')
        : (this.state === 'intro'
          ? (this.pendingLevelId || '1-1')
          : (this.level?.id.replace(/-(bonus\d*|exit)$/, '') || '1-1'));
      this.drawPixelText(ctx, worldLabel, ox + 152, 23, '#fcfcfc', 8, 'left', false);

      this.drawPixelText(ctx, 'TIME', ox + 200, 15, '#fcfcfc', 8, 'left', false);
      if (this.state !== 'title' && this.state !== 'intro' && this.state !== 'gameOver' && this.state !== 'victory') {
        this.drawPixelText(ctx, timeStr, ox + 208, 23, this.time <= 99 ? '#ff5555' : '#fcfcfc', 8, 'left', false);
      }
    }

    renderTitleOverlay(ctx) {
      const ox = Math.round((this.screenW - 256) / 2);
      const cxMid = Math.round(this.screenW / 2);
      const logo = global.MarioAssets ? global.MarioAssets.getSprite('logo') : null;
      if (logo) {
        ctx.imageSmoothingEnabled = false;
        ctx.drawImage(logo, ox + 40, 24, 176, 88);
      } else {
        // Fallback NES Title Plaque
        ctx.fillStyle = '#000000';
        ctx.fillRect(ox + 42, 26, 176, 84);
        ctx.fillStyle = '#c84c0c';
        ctx.fillRect(ox + 40, 24, 176, 84);
        ctx.fillStyle = '#fcbcb0';
        ctx.fillRect(ox + 40, 24, 176, 2);
        ctx.fillRect(ox + 40, 24, 2, 84);
        this.drawPixelText(ctx, 'SUPER', cxMid, 54, '#fcbcb0', 16, 'center');
        this.drawPixelText(ctx, 'MARIO BROS.', cxMid, 82, '#fcbcb0', 16, 'center');
      }

      // Authentic 1985 NES copyright line right beneath the plaque
      this.drawPixelText(ctx, '©1985 NINTENDO', ox + 216, 121, '#fcbcb0', 8, 'right', false);

      // Authentic 8x8 NES title mushroom cursor
      const cx = ox + 72, cy = 138;
      ctx.fillStyle = '#000000';
      ctx.fillRect(cx + 2, cy, 4, 1);
      ctx.fillRect(cx + 1, cy + 1, 6, 1);
      ctx.fillRect(cx, cy + 2, 8, 4);
      ctx.fillRect(cx + 2, cy + 6, 4, 2);
      ctx.fillStyle = '#c84c0c';
      ctx.fillRect(cx + 2, cy + 1, 4, 1);
      ctx.fillRect(cx + 1, cy + 2, 6, 3);
      ctx.fillStyle = '#fc9838';
      ctx.fillRect(cx + 2, cy + 2, 2, 2);
      ctx.fillStyle = '#fcfcfc';
      ctx.fillRect(cx + 2, cy + 5, 4, 2);

      this.drawPixelText(ctx, '1 PLAYER GAME', ox + 88, 145, '#fcfcfc', 8, 'left', false);
      this.drawPixelText(ctx, '2 PLAYER GAME', ox + 88, 161, '#fcfcfc', 8, 'left', false);
      this.drawPixelText(ctx, `TOP- ${String(this.highScore).padStart(6, '0')}`, cxMid, 184, '#fcfcfc', 8, 'center', false);
    }

    renderIntroScreen(ctx) {
      const cxMid = Math.round(this.screenW / 2);
      ctx.fillStyle = '#000000';
      ctx.fillRect(0, 0, this.screenW, SCREEN_H);
      this.renderHUD(ctx);

      this.drawPixelText(ctx, `WORLD ${this.pendingLevelId}`, cxMid, 98, '#fcfcfc', 10, 'center');
      const dummy = { x: cxMid - 32, y: 112, powerState: 'small', facing: 1, onGround: true, vx: 0, dead: false, invulnTimer: 0, starTimer: 0, animFrame: 0 };
      global.MarioSprites.drawMario(ctx, dummy, 0);
      this.drawPixelText(ctx, `x  ${this.lives}`, cxMid - 6, 125, '#fcfcfc', 10, 'left');
    }

    renderGameOverScreen(ctx) {
      const cxMid = Math.round(this.screenW / 2);
      ctx.fillStyle = '#000000';
      ctx.fillRect(0, 0, this.screenW, SCREEN_H);
      this.renderHUD(ctx);
      this.drawPixelText(ctx, 'GAME OVER', cxMid, 118, '#e52521', 14, 'center');
      this.drawPixelText(ctx, `FINAL SCORE: ${String(this.score).padStart(6, '0')}`, cxMid, 140, '#fcfcfc', 8, 'center');
      this.drawPixelText(ctx, 'PRESS SPACE OR ENTER', cxMid, 164, '#fbd000', 7, 'center');
    }

    renderVictoryScreen(ctx) {
      const cxMid = Math.round(this.screenW / 2);
      ctx.fillStyle = '#000000';
      ctx.fillRect(0, 0, this.screenW, SCREEN_H);
      this.renderHUD(ctx);
      this.drawPixelText(ctx, 'CONGRATULATIONS!', cxMid, 82, '#fbd000', 12, 'center');
      this.drawPixelText(ctx, 'ALL 8 WORLDS CLEARED!', cxMid, 102, '#80d010', 9, 'center');
      this.drawPixelText(ctx, 'PRINCESS PEACH IS SAVED!', cxMid, 118, '#ff88c8', 8, 'center');
      this.drawPixelText(ctx, `SCORE: ${String(this.score).padStart(6, '0')}`, cxMid, 142, '#fcfcfc', 9, 'center');
      this.drawPixelText(ctx, `HIGH SCORE: ${String(this.highScore).padStart(6, '0')}`, cxMid, 158, '#fc9838', 8, 'center');
      this.drawPixelText(ctx, 'PRESS ENTER TO PLAY AGAIN', cxMid, 186, '#fcfcfc', 7, 'center');
    }
  }

  global.MarioEngine = GameEngine;
})(window);
