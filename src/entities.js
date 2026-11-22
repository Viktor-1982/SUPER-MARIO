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
    constructor(x, y, vx = -0.75) {
      this.type = 'spiny';
      this.x = x;
      this.y = y;
      this.w = 16;
      this.h = 16;
      this.vx = vx;
      this.vy = -2.2;
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
      this.vy = Math.min(MAX_FALL, this.vy + GRAVITY);
      engine.moveEntity(this, true);
      if (this.y > 260) this.remove = true;
    }
  }

  class Lakitu {
    constructor(x, y) {
      this.type = 'lakitu';
      this.x = x;
      this.y = y;
      this.w = 16;
      this.h = 16;
      this.vx = 0;
      this.vy = 0;
      this.facing = -1;
      this.throwTimer = 95;
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
      // Hover above player
      const targetX = engine.player.x + 28;
      this.vx += (targetX > this.x ? 0.08 : -0.08);
      this.vx = Math.max(-1.8, Math.min(1.8, this.vx));
      this.x += this.vx;
      this.facing = engine.player.x < this.x ? -1 : 1;

      // Stop following near flagpole
      if (engine.level.flagpoleCol && this.x > (engine.level.flagpoleCol - 12) * 16) {
        this.vx = -1.5;
      }

      this.throwTimer--;
      if (this.throwTimer <= 0) {
        this.throwTimer = 145 + Math.floor(Math.random() * 55);
        const activeSpinies = engine.enemies.filter(e => e.type === 'spiny' && !e.dead).length;
        if (activeSpinies < 4) {
          const dir = engine.player.x < this.x ? -0.75 : 0.75;
          engine.enemies.push(new Spiny(this.x, this.y + 6, dir));
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
      this.vx = -0.4;
      this.vy = 0;
      this.facing = -1;
      this.jumpTimer = 90;
      this.throwTimer = 55;
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
      if (this.x < this.homeX - 18) this.vx = 0.4;
      if (this.x > this.homeX + 18) this.vx = -0.4;

      this.vy = Math.min(MAX_FALL, this.vy + GRAVITY);
      engine.moveEntity(this, true);

      this.jumpTimer--;
      if (this.jumpTimer <= 0 && this.onGround) {
        this.vy = -5.0;
        this.jumpTimer = 110 + Math.floor(Math.random() * 60);
      }

      this.throwTimer--;
      if (this.throwTimer <= 0) {
        this.throwTimer = 70 + Math.floor(Math.random() * 45);
        engine.spawnHammer(this.x + 4, this.y - 4, this.facing);
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
      this.vx = dir * 1.45;
      this.vy = -4.2;
      this.life = 140;
      this.remove = false;
    }

    update() {
      this.x += this.vx;
      this.y += this.vy;
      this.vy += 0.16;
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
      this.vx = dir * 2.15;
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
      this.y = y - 10; // Authentic tall NES coil spring (26px tall, planted cleanly on row 13!)
      this.baseY = y + 16;
      this.w = 16;
      this.h = 26;
      this.compress = 0;
      this.launchTimer = 0;
      this.boostHeld = false;
    }
    update() {
      if (this.launchTimer <= 0 && this.compress > 0) {
        this.compress = Math.max(0, this.compress - 1.2);
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
    }

    update(isRidden = false, engine = null) {
      const prevX = this.x;
      const prevY = this.y;
      if (this.pulleyId && this.partner) {
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
              this.partner.detached = false;
              this.partner.respawnTimer = 0;
              this.partner.pulleyVy = 0;
              this.partner.y = this.partner.homeY;
            }
          }
        } else {
          // Only master (left-most of the pair) integrates the shared pulley balance
          if (this.x <= this.partner.x) {
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
              this.pulleyVy = 0.6;
              this.partner.pulleyVy = 0.6;
              if (engine) engine.addScore(1000, this.x + this.w / 2, this.y - 8);
            }
            this.partner.dx = 0;
            this.partner.dy = -this.pulleyVy;
          }
        }
      } else if (this.wrap) {
        // Continuous NES vertical elevator wrap-around (1-2, 2-4, 4-2, 5-4, 5-2/6-2 underwater)
        this.y += this.speed * this.wrap;
        if (this.wrap > 0 && this.y > this.max) this.y = this.min;
        if (this.wrap < 0 && this.y < this.min) this.y = this.max;
      } else if (this.drop) {
        // Falling lift: drops when Mario stands on it, resets cleanly if Mario gets off
        if (isRidden) {
          this.y += this.speed;
          if (this.y > 256) this.y = this.homeY;
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
      if (!(this.pulleyId && this.partner && this.x > this.partner.x && !this.detached)) {
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
