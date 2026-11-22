// ============================================================================
// SUPER MARIO BROS. — Complete Original NES Entities & Enemies
// ============================================================================
(function (global) {
  'use strict';

  const GRAVITY = 0.28;
  const MAX_FALL = 6.2;

  function aabb(a, b) {
    return (
      a.x < b.x + b.w &&
      a.x + a.w > b.x &&
      a.y < b.y + b.h &&
      a.y + a.h > b.y
    );
  }

  class Player {
    constructor(x, y, powerState = 'small') {
      this.x = x;
      this.y = y;
      this.vx = 0;
      this.vy = 0;
      this.facing = 1;
      this.powerState = powerState; // 'small' | 'big' | 'fire'
      this.w = 12;
      this.h = powerState === 'small' ? 16 : 30;
      if (powerState !== 'small') this.y -= 14;
      this.onGround = false;
      this.crouching = false;
      this.skidding = false;
      this.dead = false;
      this.deadTimer = 0;
      this.invulnTimer = 0;
      this.pipeSafeTimer = 0;
      this.springBoostTimer = 0;
      this.stompGrace = 0;
      this.starTimer = 0;
      this.fireCooldown = 0;
      this.fireAnimTimer = 0;
      this.coyoteTimer = 0;
      this.jumpBuffer = 0;
      this.jumpTier = 0; // 0: idle/slow, 1: walk, 2: full run (exact NES SMB1 tiers)
      this.stompCombo = 0;
      this.animFrame = 0;
      this.animTimer = 0;
      this.ridingPlatform = null;
    }

    setPower(newState) {
      const wasBig = this.powerState !== 'small';
      const willBeBig = newState !== 'small';
      if (!wasBig && willBeBig) {
        this.y -= 14;
        this.h = 30;
      } else if (wasBig && !willBeBig) {
        this.y += 14;
        this.h = 16;
        this.crouching = false;
      }
      this.powerState = newState;
    }

    getHitbox() {
      if (this.powerState !== 'small' && this.crouching) {
        return { x: this.x, y: this.y + 12, w: this.w, h: 18 };
      }
      return { x: this.x, y: this.y, w: this.w, h: this.h };
    }
  }

  class Goomba {
    constructor(x, y) {
      this.type = 'goomba';
      this.x = x;
      this.y = y;
      this.w = 16;
      this.h = 16;
      this.vx = -0.65;
      this.vy = 0;
      this.active = false;
      this.dead = false;
      this.squashed = false;
      this.squashTimer = 0;
      this.flipped = false;
      this.remove = false;
    }

    update(engine) {
      if (this.squashed) {
        this.squashTimer--;
        if (this.squashTimer <= 0) this.remove = true;
        return;
      }
      if (this.flipped) {
        this.x += this.vx;
        this.y += this.vy;
        this.vy += GRAVITY;
        if (this.y > 270) this.remove = true;
        return;
      }
      this.vy = Math.min(MAX_FALL, this.vy + GRAVITY);
      engine.moveEntity(this, true);
      if (this.y > 260) this.remove = true;
    }
  }

  class Koopa {
    constructor(x, y, red = false, winged = false) {
      this.type = 'koopa';
      this.red = red;
      this.winged = winged;
      this.x = x;
      this.y = y;
      this.baseY = y;
      this.w = 16;
      this.h = 16;
      this.vx = winged && red ? 0 : -0.65;
      this.vy = 0;
      this.phase = 0;
      this.state = 'walk'; // 'walk' | 'shell' | 'spinning'
      this.shellTimer = 0;
      this.active = false;
      this.dead = false;
      this.flipped = false;
      this.remove = false;
    }

    update(engine) {
      if (this.flipped) {
        this.x += this.vx;
        this.y += this.vy;
        this.vy += GRAVITY;
        if (this.y > 270) this.remove = true;
        return;
      }

      if (this.winged && this.red && this.state === 'walk') {
        // Red Paratroopa hovers vertically
        this.phase += 0.045;
        this.y = this.baseY + Math.sin(this.phase) * 36;
        return;
      }

      if (this.state === 'shell') {
        this.vx = 0;
        this.shellTimer++;
        if (this.shellTimer > 300) {
          this.state = 'walk';
          this.vx = -0.65;
          this.shellTimer = 0;
        }
      }

      this.vy = Math.min(MAX_FALL, this.vy + GRAVITY);
      const prevVx = this.vx;
      engine.moveEntity(this, true);

      // Green Paratroopa bounces!
      if (this.winged && !this.red && this.onGround && this.state === 'walk') {
        this.vy = -4.3;
      }

      // Red Koopa turns at ledges
      if (this.red && !this.winged && this.state === 'walk' && this.onGround && prevVx !== 0) {
        const probeX = this.vx > 0 ? this.x + this.w + 2 : this.x - 2;
        const probeY = this.y + this.h + 4;
        if (!engine.isSolidAtPixel(probeX, probeY)) {
          this.vx = -this.vx;
        }
      }

      if (this.y > 260) this.remove = true;
    }
  }

  class BuzzyBeetle {
    constructor(x, y) {
      this.type = 'buzzy';
      this.x = x;
      this.y = y;
      this.w = 16;
      this.h = 16;
      this.vx = -0.6;
      this.vy = 0;
      this.state = 'walk';
      this.shellTimer = 0;
      this.active = false;
      this.dead = false;
      this.flipped = false;
      this.remove = false;
    }

    update(engine) {
      if (this.flipped) {
        this.x += this.vx;
        this.y += this.vy;
        this.vy += GRAVITY;
        if (this.y > 270) this.remove = true;
        return;
      }
      if (this.state === 'shell') {
        this.vx = 0;
        this.shellTimer++;
        if (this.shellTimer > 300) {
          this.state = 'walk';
          this.vx = -0.6;
          this.shellTimer = 0;
        }
      }
      this.vy = Math.min(MAX_FALL, this.vy + GRAVITY);
      engine.moveEntity(this, true);
      if (this.y > 260) this.remove = true;
    }
  }

  class Spiny {
    constructor(x, y, vx = 0, hatched = false) {
      this.type = 'spiny';
      this.x = x;
      this.y = y;
      this.w = 16;
      this.h = 16;
      this.vx = vx;
      this.vy = hatched ? 0 : -2.7;
      this.hatched = hatched;
      this.active = true;
      this.dead = false;
      this.flipped = false;
      this.remove = false;
    }

    update(engine) {
      if (this.flipped) {
        this.x += this.vx;
        this.y += this.vy;
        this.vy += GRAVITY;
        if (this.y > 270) this.remove = true;
        return;
      }
      this.vy = Math.min(MAX_FALL, this.vy + (this.hatched ? GRAVITY : 0.19));
      engine.moveEntity(this, true);
      if (!this.hatched && this.onGround) {
        // Authentic 1985 NES: Spiny Egg hatches the instant it touches the ground and walks TOWARD Mario!
        this.hatched = true;
        this.vx = engine.player.x < this.x ? -0.65 : 0.65;
      }
      if (this.y > 260) this.remove = true;
    }
  }

  class Lakitu {
    constructor(x, y) {
      this.type = 'lakitu';
      this.x = x;
      this.y = Math.max(30, Math.min(44, y));
      this.baseY = this.y;
      this.w = 16;
      this.h = 24;
      this.vx = -1.2;
      this.vy = 0;
      this.phase = 0;
      this.facing = -1;
      this.throwTimer = 115;
      this.duckTimer = 0;
      this.retreating = false;
      this.active = false;
      this.dead = false;
      this.flipped = false;
      this.remove = false;
    }

    update(engine) {
      if (this.flipped) {
        this.x += this.vx;
        this.y += this.vy;
        this.vy += GRAVITY;
        if (this.y > 270) this.remove = true;
        return;
      }

      // Authentic 1985 NES: Lakitu retreats & flies away before the final staircase/flagpole!
      const safeEndX = engine.level.flagpoleCol ? (engine.level.flagpoleCol - 28) * 16 : Infinity;
      if (engine.player.x >= safeEndX) {
        this.retreating = true;
      }
      if (this.retreating) {
        this.vx = Math.max(-2.6, this.vx - 0.12);
        this.x += this.vx;
        this.facing = -1;
        if (this.x < engine.cameraX - 48) this.remove = true;
        return;
      }

      // Smooth NES cloud flight tracking slightly ahead of Mario (fast enough to keep up with sprint!)
      const leadOffset = engine.player.vx >= 0 ? 48 : -28;
      const targetX = engine.player.x + leadOffset;
      const dist = targetX - this.x;
      const accel = Math.abs(dist) > 64 ? 0.16 : 0.08;
      this.vx += dist > 0 ? accel : -accel;
      const maxSpd = Math.abs(dist) > 72 ? 2.75 : 2.1;
      this.vx = Math.max(-maxSpd, Math.min(maxSpd, this.vx));
      this.x += this.vx;
      this.phase += 0.06;
      this.y = this.baseY + Math.sin(this.phase) * 4 + (this.duckTimer > 0 ? 3 : 0);
      this.facing = engine.player.x < this.x ? -1 : 1;

      if (this.duckTimer > 0) {
        this.duckTimer--;
        if (this.duckTimer === 0) {
          const activeSpinies = engine.enemies.filter(e => e.type === 'spiny' && !e.dead).length;
          if (activeSpinies < 3) {
            const eggVx = Math.max(-0.35, Math.min(0.35, this.vx * 0.2));
            engine.enemies.push(new Spiny(this.x, this.y + 4, eggVx, false));
          }
          this.throwTimer = 140 + Math.floor(Math.random() * 55);
        }
      } else {
        this.throwTimer--;
        if (this.throwTimer <= 0 && Math.abs(this.x - engine.player.x) < 150) {
          this.duckTimer = 18;
        }
      }
    }
  }

  class HammerBro {
    constructor(x, y) {
      this.type = 'hammerbro';
      this.x = x;
      this.y = y;
      this.homeX = x;
      this.w = 16;
      this.h = 18;
      this.vx = -0.38;
      this.vy = 0;
      this.facing = -1;
      this.onGround = false;
      this.jumpTimer = 95 + Math.floor(Math.random() * 45);
      this.dropThroughTimer = 0;
      this.throwTimer = 48 + Math.floor(Math.random() * 30);
      this.windupTimer = 0;
      this.burstLeft = 1 + Math.floor(Math.random() * 2);
      this.chaseTimer = 1100; // Authentic NES anti-camping march after ~18s
      this.active = false;
      this.dead = false;
      this.flipped = false;
      this.remove = false;
    }

    update(engine) {
      if (this.flipped) {
        this.x += this.vx;
        this.y += this.vy;
        this.vy += GRAVITY;
        if (this.y > 270) this.remove = true;
        return;
      }
      this.facing = engine.player.x < this.x ? -1 : 1;

      if (this.chaseTimer > 0) {
        this.chaseTimer--;
        if (this.x < this.homeX - 18) this.vx = 0.38;
        if (this.x > this.homeX + 18) this.vx = -0.38;
      } else {
        this.vx = this.facing * 0.42;
      }

      // Horizontal movement with solid wall turn-around
      this.x += this.vx;
      const topR = Math.floor((this.y + 2) / 16);
      const botR = Math.floor((this.y + this.h - 2) / 16);
      if (this.vx > 0) {
        const rc = Math.floor((this.x + this.w) / 16);
        for (let r = topR; r <= botR; r++) {
          if (engine.isSolidTile(rc, r)) { this.x = rc * 16 - this.w; this.vx = -this.vx; break; }
        }
      } else if (this.vx < 0) {
        const lc = Math.floor(this.x / 16);
        for (let r = topR; r <= botR; r++) {
          if (engine.isSolidTile(lc, r)) { this.x = (lc + 1) * 16; this.vx = -this.vx; break; }
        }
      }

      // Vertical physics: Authentic 1985 NES one-way tier hopping (passes UP through brick rows & drops DOWN through tiers!)
      if (this.dropThroughTimer > 0) this.dropThroughTimer--;
      this.vy = Math.min(4.2, this.vy + 0.19);
      this.y += this.vy;
      this.onGround = false;
      const leftC = Math.floor((this.x + 2) / 16);
      const rightC = Math.floor((this.x + this.w - 2) / 16);
      if (this.vy >= 0) {
        const bot = Math.floor((this.y + this.h) / 16);
        // While dropping through an upper brick tier, ignore brick row until below it (never drop through bottom ground row >= 13!)
        const allowDrop = this.dropThroughTimer > 0 && bot < 12;
        if (!allowDrop) {
          for (let c = leftC; c <= rightC; c++) {
            if (engine.isSolidTile(c, bot)) {
              this.y = bot * 16 - this.h;
              this.vy = 0;
              this.onGround = true;
              break;
            }
          }
        }
      }

      this.jumpTimer--;
      if (this.jumpTimer <= 0 && this.onGround) {
        const midCol = Math.floor((this.x + this.w / 2) / 16);
        const curFootRow = Math.floor((this.y + this.h + 2) / 16);
        const hasUpperTier = curFootRow >= 8 && (
          engine.isSolidTile(midCol, curFootRow - 4) ||
          engine.isSolidTile(midCol - 1, curFootRow - 4) ||
          engine.isSolidTile(midCol + 1, curFootRow - 4)
        );
        const hasLowerFloor = curFootRow <= 10 && (
          engine.isSolidTile(midCol, curFootRow + 4) ||
          engine.isSolidTile(midCol, 13)
        );
        if (hasUpperTier && Math.random() < 0.6) {
          // High leap up onto the upper brick tier!
          this.vy = -5.4;
        } else if (hasLowerFloor && Math.random() < 0.55) {
          // Authentic NES drop-hop down through brick tier onto lower tier/ground!
          this.vy = -2.2;
          this.dropThroughTimer = 20;
        } else {
          // Standard vertical hop
          this.vy = -4.2;
        }
        this.onGround = false;
        this.jumpTimer = 115 + Math.floor(Math.random() * 65);
      }

      // Telegraphed hammer throws in classic NES bursts with breathing room between volleys
      if (this.windupTimer > 0) {
        this.windupTimer--;
        if (this.windupTimer === 0) {
          engine.spawnHammer(this.x + (this.facing > 0 ? 10 : -2), this.y - 6, this.facing);
          this.burstLeft--;
          if (this.burstLeft > 0) {
            this.throwTimer = 26 + Math.floor(Math.random() * 14);
          } else {
            this.burstLeft = 1 + Math.floor(Math.random() * 2);
            this.throwTimer = 78 + Math.floor(Math.random() * 48);
          }
        }
      } else {
        this.throwTimer--;
        if (this.throwTimer <= 0 && Math.abs(this.x - engine.player.x) < 190) {
          this.windupTimer = 18;
        }
      }
      if (this.y > 260) this.remove = true;
    }
  }

  class Hammer {
    constructor(x, y, dir) {
      this.x = x;
      this.y = y;
      this.w = 8;
      this.h = 8;
      this.vx = dir * 1.15;
      this.vy = -4.1;
      this.life = 150;
      this.remove = false;
    }

    update() {
      this.x += this.vx;
      this.y += this.vy;
      this.vy += 0.14;
      this.life--;
      if (this.life <= 0 || this.y > 260) this.remove = true;
    }
  }

  class BulletBill {
    constructor(x, y, dir) {
      this.type = 'bullet';
      this.x = x;
      this.y = y;
      this.w = 16;
      this.h = 14;
      // Exact 1985 NES SMB1 Bullet Bill speed ($01.80 ≈ 1.55 px/f — readable & stompable!)
      this.vx = dir * 1.55;
      this.vy = 0;
      this.active = true;
      this.dead = false;
      this.flipped = false;
      this.remove = false;
    }

    update(engine) {
      if (this.flipped) {
        this.y += this.vy;
        this.vy += GRAVITY;
        if (this.y > 270) this.remove = true;
        return;
      }
      this.x += this.vx;
      if (this.x < engine.cameraX - 40 || this.x > engine.cameraX + (engine.screenW || 256) + 48) {
        this.remove = true;
      }
    }
  }

  class Blooper {
    constructor(x, y) {
      this.type = 'blooper';
      this.x = x;
      this.y = y;
      this.w = 16;
      this.h = 16;
      this.vx = 0;
      this.vy = 0.4;
      this.timer = 45;
      this.active = false;
      this.dead = false;
      this.flipped = false;
      this.remove = false;
    }

    update(engine) {
      if (this.flipped) {
        this.y += 2;
        if (this.y > 270) this.remove = true;
        return;
      }
      this.timer--;
      if (this.timer <= 0) {
        const dx = engine.player.x > this.x ? 1 : -1;
        this.vx = dx * 1.1;
        this.vy = -1.6;
        this.timer = 55 + Math.floor(Math.random() * 25);
      } else {
        this.vx *= 0.95;
        this.vy = Math.min(0.65, this.vy + 0.05);
      }
      this.x += this.vx;
      // Authentic 1985 NES: Bloopers stay at least 1 tile above the sea floor so Small Mario can walk under them!
      this.y = Math.max(36, Math.min(184, this.y + this.vy));
    }
  }

  class CheepCheep {
    constructor(x, y, gray = false, leaping = false) {
      this.type = 'cheep';
      this.gray = gray;
      this.leaping = leaping;
      this.x = x;
      this.y = y;
      this.baseY = y;
      this.w = 16;
      this.h = 14;
      this.vx = gray ? -0.55 : (leaping ? 0.9 : -0.9);
      this.vy = leaping ? -5.8 : 0;
      this.phase = Math.random() * 6;
      this.active = false;
      this.dead = false;
      this.flipped = false;
      this.remove = false;
    }

    update(engine) {
      if (this.flipped) {
        this.y += this.vy;
        this.vy += GRAVITY;
        if (this.y > 270) this.remove = true;
        return;
      }
      if (this.leaping) {
        this.x += this.vx;
        this.y += this.vy;
        this.vy += 0.11;
        if (this.y > 260) {
          this.remove = true;
        }
      } else {
        this.phase += 0.06;
        this.x += this.vx;
        this.y = this.baseY + Math.sin(this.phase) * 14;
      }
    }
  }

  class PiranhaPlant {
    constructor(col, pipeTopRow) {
      this.type = 'piranha';
      this.x = col * 16 + 8;
      this.baseY = pipeTopRow * 16;
      this.y = this.baseY + 2;
      this.w = 16;
      this.h = 23;
      this.phase = 'hidden';
      this.timer = 60;
      this.active = true;
      this.dead = false;
      this.remove = false;
    }

    update(engine) {
      if (this.dead) { this.remove = true; return; }
      const distX = Math.abs((engine.player.x + engine.player.w / 2) - (this.x + 8));
      if (this.phase === 'hidden') {
        this.y = this.baseY + 2;
        if (distX > 32) {
          this.timer--;
          if (this.timer <= 0) this.phase = 'rising';
        }
      } else if (this.phase === 'rising') {
        this.y -= 0.45;
        if (this.y <= this.baseY - 23) {
          this.y = this.baseY - 23;
          this.phase = 'up';
          this.timer = 85;
        }
      } else if (this.phase === 'up') {
        this.timer--;
        if (this.timer <= 0) this.phase = 'falling';
      } else if (this.phase === 'falling') {
        this.y += 0.45;
        if (this.y >= this.baseY + 2) {
          this.y = this.baseY + 2;
          this.phase = 'hidden';
          this.timer = 95;
        }
      }
    }
  }

  class Bowser {
    constructor(x, y, worldNum = 1) {
      this.type = 'bowser';
      this.worldNum = worldNum;
      this.x = x;
      this.y = y;
      this.minX = x - 88;
      this.maxX = x + 48;
      this.w = 30;
      this.h = 30;
      this.vx = -0.45 - worldNum * 0.04;
      this.vy = 0;
      this.facing = -1;
      this.hp = 5;
      this.hitFlash = 0;
      this.jumpTimer = 90;
      this.fireTimer = 95;
      this.hammerTimer = 50;
      this.active = false;
      this.dead = false;
      this.falling = false;
      this.remove = false;
    }

    update(engine) {
      if (this.hitFlash > 0) this.hitFlash--;
      if (this.falling) {
        this.vy += GRAVITY * 0.85;
        this.y += this.vy;
        if (this.y > 280) this.remove = true;
        return;
      }

      this.facing = engine.player.x < this.x ? -1 : 1;
      if (engine.level && engine.level.bridgeStartCol >= 0 && engine.level.bridgeEndCol > engine.level.bridgeStartCol) {
        this.minX = engine.level.bridgeStartCol * 16 + 8;
        this.maxX = Math.max(this.minX + 16, (engine.level.bridgeEndCol - 2) * 16 - 4);
      }
      this.x += this.vx;
      if (this.x < this.minX) { this.x = this.minX; this.vx = Math.abs(this.vx); }
      else if (this.x > this.maxX) { this.x = this.maxX; this.vx = -Math.abs(this.vx); }

      this.vy = Math.min(MAX_FALL, this.vy + GRAVITY * 0.65);
      this.y += this.vy;
      const footCol = Math.floor((this.x + this.w / 2) / 16);
      const footRow = Math.floor((this.y + this.h) / 16);
      if (this.vy >= 0 && engine.isSolidTile(footCol, footRow)) {
        this.y = footRow * 16 - this.h;
        this.vy = 0;
        this.jumpTimer--;
        if (this.jumpTimer <= 0) {
          this.vy = -4.2;
          this.jumpTimer = Math.max(55, 115 - this.worldNum * 7) + Math.floor(Math.random() * 45);
        }
      }

      // Fire breath
      this.fireTimer--;
      if (this.fireTimer <= 0) {
        this.fireTimer = Math.max(55, 110 - this.worldNum * 7) + Math.floor(Math.random() * 45);
        engine.spawnBowserFire(this.x - 10, this.y + 8, this.facing);
      }

      // Worlds 6-8: Bowser also throws Hammers like the original NES!
      if (this.worldNum >= 6) {
        this.hammerTimer--;
        if (this.hammerTimer <= 0) {
          this.hammerTimer = Math.max(30, 75 - this.worldNum * 5);
          engine.spawnHammer(this.x + 8, this.y, this.facing);
        }
      }
    }
  }

  class Springboard {
    constructor(x, y) {
      this.x = x;
      this.y = y - 12; // Authentic tall NES coil spring (28px tall, planted solidly on row 13!)
      this.baseY = y + 16;
      this.w = 16;
      this.h = 28;
      this.compress = 0;
      this.launchTimer = 0;
      this.boostHeld = false;
    }
    update() {
      if (this.launchTimer <= 0 && this.compress > 0) {
        this.compress = Math.max(0, this.compress - 1.5);
      }
    }
  }

  class MovingPlatform {
    constructor(cfg) {
      this.x = cfg.x;
      this.y = cfg.y;
      this.homeY = cfg.y;
      this.w = cfg.w;
      this.h = cfg.h;
      this.axis = cfg.axis;
      this.min = cfg.min;
      this.max = cfg.max;
      this.speed = cfg.speed;
      this.wrap = cfg.wrap || 0;
      this.drop = !!cfg.drop;
      this.seesaw = !!cfg.seesaw;
      this.cloudRide = !!cfg.cloudRide;
      this.cloudActive = false;
      this.pulleyId = cfg.pulleyId || 0;
      this.pulleyTopY = cfg.pulleyTopY || 36;
      this.partner = null;
      this.pulleyVy = 0;
      this.detached = false;
      this.respawnTimer = 0;
      this.dropped = false;
      this.dir = 1;
      this.dx = 0;
      this.dy = 0;
      this.prevX = cfg.x;
      this.prevY = cfg.y;
      this.justWrapped = false;
      this.detachJustHappened = false;
    }

    update(isRidden = false, engine = null) {
      const prevX = this.x;
      const prevY = this.y;
      this.prevX = prevX;
      this.prevY = prevY;
      this.justWrapped = false;
      if (this.detachJustHappened) {
        this.detachJustHappened = false;
        return;
      }
      if (this.cloudRide) {
        // Authentic 1985 NES Cloud Heaven platform: stays waiting until Mario steps on, then glides right across the sky!
        if (isRidden) this.cloudActive = true;
        if (this.cloudActive && this.x < this.max) {
          this.x = Math.min(this.max, this.x + this.speed);
        }
      } else if (this.pulleyId && this.partner) {
        // Real 1985 NES Pulley / Balance Platform Pair (3-3, 4-3, 6-3)!
        if (this.detached) {
          this.pulleyVy = Math.min(4.2, this.pulleyVy + 0.16);
          this.y += this.pulleyVy;
          if (this.y > 268) {
            this.respawnTimer++;
            if (this.respawnTimer > 180) {
              this.detached = false;
              this.respawnTimer = 0;
              this.pulleyVy = 0;
              this.y = this.homeY;
              this.justWrapped = true;
              this.partner.detached = false;
              this.partner.respawnTimer = 0;
              this.partner.pulleyVy = 0;
              this.partner.y = this.partner.homeY;
              this.partner.justWrapped = true;
              this.partner.dx = 0;
              this.partner.dy = 0;
            }
          }
        } else {
          // Only master (left-most of the pair) integrates the shared pulley balance
          if (this.x <= this.partner.x) {
            const partnerPrevY = this.partner.y;
            this.partner.prevX = this.partner.x;
            this.partner.prevY = partnerPrevY;
            const partnerRidden = !!(engine && engine.player && engine.player.ridingPlatform === this.partner);
            if (isRidden && !partnerRidden) {
              this.pulleyVy = Math.min(1.15, this.pulleyVy + 0.045);
            } else if (partnerRidden && !isRidden) {
              this.pulleyVy = Math.max(-1.15, this.pulleyVy - 0.045);
            } else {
              this.pulleyVy *= 0.86;
              if (Math.abs(this.pulleyVy) < 0.02) this.pulleyVy = 0;
            }
            this.y += this.pulleyVy;
            this.partner.y -= this.pulleyVy;
            this.partner.pulleyVy = -this.pulleyVy;
            // If either side reaches the pulley wheel, rope detaches and both fall (+1000 pts)!
            if (this.y <= this.pulleyTopY + 10 || this.partner.y <= this.pulleyTopY + 10) {
              this.detached = true;
              this.partner.detached = true;
              this.partner.detachJustHappened = true;
              this.pulleyVy = 0.6;
              this.partner.pulleyVy = 0.6;
              if (engine) engine.addScore(1000, this.x + this.w / 2, this.y - 8);
            }
            this.partner.dx = 0;
            this.partner.dy = this.partner.y - partnerPrevY;
          }
        }
      } else if (this.wrap) {
        // Continuous NES vertical elevator wrap-around (1-2, 2-4, 4-2, 5-4, 5-2/6-2 underwater)
        // Wrapping resets dx/dy = 0 and sets justWrapped = true so Mario NEVER teleports across the screen!
        this.y += this.speed * this.wrap;
        if (this.wrap > 0 && this.y > this.max) {
          this.y = this.min;
          this.justWrapped = true;
        } else if (this.wrap < 0 && this.y < this.min) {
          this.y = this.max;
          this.justWrapped = true;
        }
      } else if (this.drop) {
        // Falling lift: drops when Mario stands on it, resets cleanly if Mario gets off
        if (isRidden) {
          this.y += this.speed;
          if (this.y > 256) {
            this.y = this.homeY;
            this.justWrapped = true;
          }
        } else if (this.y > this.homeY) {
          this.y = Math.max(this.homeY, this.y - 0.5);
        }
      } else if (this.seesaw) {
        if (isRidden) {
          this.y = Math.min(this.max, this.y + this.speed);
        } else if (this.y > this.homeY) {
          this.y = Math.max(this.homeY, this.y - this.speed * 0.5);
        }
      } else if (this.axis === 'x') {
        this.x += this.speed * this.dir;
        if (this.x >= this.max) { this.x = this.max; this.dir = -1; }
        if (this.x <= this.min) { this.x = this.min; this.dir = 1; }
      } else {
        this.y += this.speed * this.dir;
        if (this.y >= this.max) { this.y = this.max; this.dir = -1; }
        if (this.y <= this.min) { this.y = this.min; this.dir = 1; }
      }
      if (this.justWrapped) {
        this.dx = 0;
        this.dy = 0;
      } else if (!(this.pulleyId && this.partner && this.x > this.partner.x && !this.detached)) {
        this.dx = this.x - prevX;
        this.dy = this.y - prevY;
      }
    }
  }

  class PowerUp {
    constructor(x, y, kind) {
      this.kind = kind;
      this.x = x;
      this.y = y;
      this.targetY = y - 16;
      this.w = 16;
      this.h = 16;
      this.emerging = true;
      this.vx = (kind === 'flower') ? 0 : 1.05;
      this.vy = 0;
      this.remove = false;
    }

    update(engine) {
      if (this.emerging) {
        this.y -= 0.5;
        if (this.y <= this.targetY) {
          this.y = this.targetY;
          this.emerging = false;
          if (this.kind === 'star') this.vy = -4.2;
        }
        return;
      }
      if (this.kind === 'flower') return;
      this.vy = Math.min(MAX_FALL, this.vy + GRAVITY);
      engine.moveEntity(this, true);
      if (this.kind === 'star' && this.onGround) this.vy = -4.4;
      if (this.y > 260) this.remove = true;
    }
  }

  class Fireball {
    constructor(x, y, dir, fromBowser = false) {
      this.x = x;
      this.y = y;
      this.w = fromBowser ? 20 : 8;
      this.h = 8;
      this.vx = dir * (fromBowser ? 1.85 : 3.6);
      this.vy = fromBowser ? 0 : 1.0;
      this.fromBowser = fromBowser;
      this.life = fromBowser ? 210 : 160;
      this.remove = false;
    }

    update(engine) {
      this.life--;
      if (this.life <= 0) { this.remove = true; return; }
      if (this.fromBowser) {
        this.x += this.vx;
        return;
      }
      this.x += this.vx;
      const col = Math.floor((this.vx > 0 ? this.x + this.w : this.x) / 16);
      const row = Math.floor((this.y + 4) / 16);
      if (engine.isSolidTile(col, row)) {
        engine.spawnPuff(this.x, this.y);
        global.MarioAudio.playSfx('bump');
        this.remove = true;
        return;
      }
      this.vy = Math.min(MAX_FALL, this.vy + 0.35);
      this.y += this.vy;
      const bRow = Math.floor((this.y + this.h) / 16);
      const bCol = Math.floor((this.x + 4) / 16);
      if (this.vy > 0 && engine.isSolidTile(bCol, bRow)) {
        this.y = bRow * 16 - this.h;
        this.vy = -3.4;
      }
      if (this.y > 250) this.remove = true;
    }
  }

  class Particle {
    constructor(x, y, vx, vy, color, size = 4, life = 32, gravity = 0.25) {
      this.x = x;
      this.y = y;
      this.vx = vx;
      this.vy = vy;
      this.color = color;
      this.size = size;
      this.life = life;
      this.gravity = gravity;
    }
    update() {
      this.x += this.vx;
      this.y += this.vy;
      this.vy += this.gravity;
      this.life--;
    }
  }

  class FloatingScore {
    constructor(x, y, text) {
      this.x = x;
      this.y = y;
      this.text = String(text);
      this.life = 46;
    }
    update() {
      this.y -= 0.55;
      this.life--;
    }
  }

  global.MarioEntities = {
    GRAVITY,
    MAX_FALL,
    aabb,
    Player,
    Goomba,
    Koopa,
    BuzzyBeetle,
    Spiny,
    Lakitu,
    HammerBro,
    Hammer,
    BulletBill,
    Blooper,
    CheepCheep,
    PiranhaPlant,
    Bowser,
    Springboard,
    MovingPlatform,
    PowerUp,
    Fireball,
    Particle,
    FloatingScore
  };
})(window);
