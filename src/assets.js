// ============================================================================
// SUPER MARIO BROS. — Drop-in External Asset Loader (assets/audio & sprites)
// Automatically uses original MP3/WAV/PNG files if placed in ./assets/
// ============================================================================
(function (global) {
  'use strict';

  const MUSIC_FILES = {
    overworld: 'assets/audio/overworld.mp3',
    underground: 'assets/audio/underground.mp3',
    underwater: 'assets/audio/underwater.mp3',
    castle: 'assets/audio/castle.mp3',
    starman: 'assets/audio/starman.ogg'
  };

  const SFX_FILES = {
    jump: 'assets/audio/jump.wav',
    jumpBig: 'assets/audio/jump_big.wav',
    coin: 'assets/audio/coin.wav',
    bump: 'assets/audio/bump.wav',
    break: 'assets/audio/break.wav',
    stomp: 'assets/audio/stomp.wav',
    swim: 'assets/audio/swim.wav',
    kick: 'assets/audio/kick.wav',
    fireball: 'assets/audio/fireball.wav',
    powerupAppear: 'assets/audio/powerup_appear.wav',
    powerup: 'assets/audio/powerup.wav',
    shrink: 'assets/audio/pipe.wav',
    oneUp: 'assets/audio/1up.wav',
    pipe: 'assets/audio/pipe.wav',
    flagpole: 'assets/audio/flagpole.wav',
    bowserFire: 'assets/audio/bowser_fire.wav',
    bowserFall: 'assets/audio/bowser_fall.wav',
    bridgeCollapse: 'assets/audio/break.wav',
    cannon: 'assets/audio/cannon.wav',
    skid: 'assets/audio/skid.wav',
    beep: 'assets/audio/beep.wav',
    stageClear: 'assets/audio/stage_clear.wav',
    worldClear: 'assets/audio/world_clear.wav',
    death: 'assets/audio/death.wav',
    gameOver: 'assets/audio/gameover.wav',
    pause: 'assets/audio/pause.wav',
    hurry: 'assets/audio/hurry.wav'
  };

  const SPRITE_FILES = {
    // Mario (Small, Super, Fire — crisp Scale4x original 1985 NES sprites!)
    mario_small_idle:   'assets/sprites/mario_hd/mario_small_idle.png',
    mario_small_jump:   'assets/sprites/mario_hd/mario_small_jump.png',
    mario_small_dead:   'assets/sprites/mario_hd/mario_small_dead.png',
    mario_small_run_f0: 'assets/sprites/mario_hd/mario_small_run_f0.png',
    mario_small_run_f1: 'assets/sprites/mario_hd/mario_small_run_f1.png',
    mario_small_run_f2: 'assets/sprites/mario_hd/mario_small_run_f2.png',
    mario_big_idle:     'assets/sprites/mario_hd/mario_big_idle.png',
    mario_big_jump:     'assets/sprites/mario_hd/mario_big_jump.png',
    mario_big_crouch:   'assets/sprites/mario_hd/mario_big_crouch.png',
    mario_big_walk:     'assets/sprites/mario_hd/mario_big_walk.png',
    mario_big_walk_f0:  'assets/sprites/mario_hd/mario_small_walk_f0.png',
    mario_big_walk_f1:  'assets/sprites/mario_hd/mario_small_walk_f1.png',
    mario_big_walk_f2:  'assets/sprites/mario_hd/mario_small_walk_f2.png',
    mario_fire_idle:    'assets/sprites/mario_hd/mario_fire_idle.png',
    mario_fire_jump:    'assets/sprites/mario_hd/mario_fire_jump.png',
    mario_fire_crouch:  'assets/sprites/mario_hd/mario_fire_crouch.png',
    mario_fire_shoot:   'assets/sprites/mario_hd/mario_fire_shoot.png',
    mario_fire_walk_f0: 'assets/sprites/mario_hd/mario_fire_walk_f0.png',
    mario_fire_walk_f1: 'assets/sprites/mario_hd/mario_fire_walk_f1.png',
    mario_fire_walk_f2: 'assets/sprites/mario_hd/mario_fire_walk_f2.png',

    // Enemies & NPCs
    goomba_idle:        'assets/sprites/goomba_idle.png',
    goomba_dead:        'assets/sprites/goomba_dead.png',
    goomba_ug:          'assets/sprites/goomba_ug.png',
    goomba_ug_dead:     'assets/sprites/goomba_ug_dead.png',
    goomba_cast:        'assets/sprites/goomba_cast.png',
    goomba_cast_dead:   'assets/sprites/goomba_cast_dead.png',
    koopa_green:        'assets/sprites/koopa_green.png',
    koopa_green_walk_f0:'assets/sprites/koopa_green_walk_f0.png',
    koopa_green_walk_f1:'assets/sprites/koopa_green_walk_f1.png',
    koopa_green_shell:  'assets/sprites/koopa_green_shell.png',
    koopa_red:          'assets/sprites/koopa_red.png',
    koopa_red_walk_f0:  'assets/sprites/koopa_red_walk_f0.png',
    koopa_red_walk_f1:  'assets/sprites/koopa_red_walk_f1.png',
    koopa_red_shell:    'assets/sprites/koopa_red_shell.png',
    paratroopa_green:   'assets/sprites/paratroopa_green.png',
    paratroopa_red:     'assets/sprites/paratroopa_red.png',
    buzzy:              'assets/sprites/buzzy.png',
    buzzy_shell:        'assets/sprites/buzzy_shell.png',
    piranha:            'assets/sprites/piranha.png',
    piranha_anim_f0:    'assets/sprites/piranha_anim_f0.png',
    piranha_anim_f1:    'assets/sprites/piranha_anim_f1.png',
    piranha_anim_f2:    'assets/sprites/piranha_anim_f2.png',
    piranha_ug:         'assets/sprites/piranha_ug.png',
    hammer_bro:         'assets/sprites/hammer_bro.png',
    lakitu:             'assets/sprites/lakitu.png',
    spiny:              'assets/sprites/spiny.png',
    spiny_egg:          'assets/sprites/spiny_egg.png',
    bullet_bill:        'assets/sprites/bullet_bill.png',
    blooper:            'assets/sprites/blooper.png',
    cheep_red:          'assets/sprites/cheep_red.png',
    cheep_gray:         'assets/sprites/cheep_gray.png',
    podoboo:            'assets/sprites/podoboo.png',
    bowser:             'assets/sprites/bowser.png',
    bowser_walk_f0:     'assets/sprites/bowser_walk_f0.png',
    bowser_walk_f1:     'assets/sprites/bowser_walk_f1.png',
    bowser_flame:       'assets/sprites/bowser_flame.png',
    toad:               'assets/sprites/toad.png',
    peach:              'assets/sprites/peach.png',

    // Items
    mushroom:           'assets/sprites/mushroom.png',
    oneup:              'assets/sprites/oneup.png',
    fire_flower:        'assets/sprites/fire_flower.png',
    starman:            'assets/sprites/starman.png',
    coin:               'assets/sprites/coin.png',
    coin_ow_f0:         'assets/sprites/coin_ow_f0.png',
    coin_ow_f1:         'assets/sprites/coin_ow_f1.png',
    coin_ow_f2:         'assets/sprites/coin_ow_f2.png',
    coin_ow_f3:         'assets/sprites/coin_ow_f3.png',
    coin_ug_f0:         'assets/sprites/coin_ug_f0.png',
    coin_ug_f1:         'assets/sprites/coin_ug_f1.png',
    coin_ug_f2:         'assets/sprites/coin_ug_f2.png',
    coin_ug_f3:         'assets/sprites/coin_ug_f3.png',

    // Tiles & Title Logo
    logo:               'assets/sprites/logo.png',
    ground_overworld:   'assets/sprites/ground_overworld.png',
    ground_underground: 'assets/sprites/ground_underground.png',
    ground_underwater:  'assets/sprites/ground_underwater.png',
    ground_castle:      'assets/sprites/ground_castle.png',
    brick_overworld:    'assets/sprites/brick_overworld.png',
    brick_underground:  'assets/sprites/brick_underground.png',
    brick_castle:       'assets/sprites/brick_castle.png',
    qblock_overworld:   'assets/sprites/qblock_overworld.png',
    qblock_underground: 'assets/sprites/qblock_underground.png',
    qblock_castle:      'assets/sprites/qblock_castle.png',
    empty_block:        'assets/sprites/empty_block.png',
    hard_overworld:     'assets/sprites/hard_overworld.png',
    hard_underground:   'assets/sprites/hard_underground.png',
    axe:                'assets/sprites/axe.png',
    fortress_flag:      'assets/sprites/fortress_flag.png'
  };

  class AssetManager {
    constructor() {
      this.musicTracks = {};
      this.sfxBuffers = {};
      this.sprites = {};
      this.activeAudio = null;
      this.probeAll();
    }

    probeAll() {
      // Load external PNG sprites (works on HTTP and local file://)
      for (const [key, src] of Object.entries(SPRITE_FILES)) {
        const img = new Image();
        img.onload = () => {
          if (img.naturalWidth > 0) this.sprites[key] = img;
        };
        img.onerror = () => {};
        img.src = src;
      }

      // Load pre-generated authentic 4-palette NES Starman Mario variants
      const starBases = {
        mario_small_idle:   'mario_small_idle',
        mario_small_jump:   'mario_small_jump',
        mario_small_run_f0: 'mario_small_run_f0',
        mario_small_run_f1: 'mario_small_run_f1',
        mario_small_run_f2: 'mario_small_run_f2',
        mario_big_idle:     'mario_big_idle',
        mario_big_jump:     'mario_big_jump',
        mario_big_crouch:   'mario_big_crouch',
        mario_big_walk_f0:  'mario_small_walk_f0',
        mario_big_walk_f1:  'mario_small_walk_f1',
        mario_big_walk_f2:  'mario_small_walk_f2'
      };
      for (const [key, fileBase] of Object.entries(starBases)) {
        for (const s of ['s1', 's2', 's3']) {
          const img = new Image();
          img.onload = () => { if (img.naturalWidth > 0) this.sprites[key + '_' + s] = img; };
          img.onerror = () => {};
          img.src = `assets/sprites/mario_hd/${fileBase}_${s}.png`;
        }
      }

      // Probe external music files silently (works on HTTP and local file://)
      for (const [key, src] of Object.entries(MUSIC_FILES)) {
        const audio = new Audio();
        audio.loop = true;
        audio.preload = 'auto';
        const onReady = () => { this.musicTracks[key] = audio; };
        audio.addEventListener('canplay', onReady, { once: true });
        audio.addEventListener('loadeddata', onReady, { once: true });
        audio.addEventListener('error', () => {}, { once: true });
        audio.src = src;
      }

      for (const [key, src] of Object.entries(SFX_FILES)) {
        const audio = new Audio();
        audio.preload = 'auto';
        const onReady = () => { this.sfxBuffers[key] = src; };
        audio.addEventListener('canplay', onReady, { once: true });
        audio.addEventListener('loadeddata', onReady, { once: true });
        audio.addEventListener('error', () => {}, { once: true });
        audio.src = src;
      }
    }

    getSprite(key) {
      return this.sprites[key] || null;
    }

    playMusic(trackName, tempoScale = 1.0, muted = false) {
      const audio = this.musicTracks[trackName];
      if (!audio) return false;
      this.stopMusic();
      this.activeAudio = audio;
      audio.currentTime = 0;
      audio.playbackRate = tempoScale;
      audio.volume = muted ? 0 : 0.65;
      audio.play().catch(() => {});
      return true;
    }

    pauseMusic() {
      if (this.activeAudio && !this.activeAudio.paused) {
        this.activeAudio.pause();
      }
    }

    resumeMusic() {
      if (this.activeAudio && this.activeAudio.paused) {
        this.activeAudio.play().catch(() => {});
      }
    }

    stopMusic() {
      if (this.activeAudio) {
        this.activeAudio.pause();
        this.activeAudio.currentTime = 0;
        this.activeAudio = null;
      }
    }

    setMuted(muted) {
      if (this.activeAudio) {
        this.activeAudio.volume = muted ? 0 : 0.65;
      }
    }

    playSfx(name, muted = false) {
      if (muted) return false;
      const src = this.sfxBuffers[name];
      if (!src) return false;
      const a = new Audio(src);
      a.volume = 0.7;
      a.play().catch(() => {});
      return true;
    }
  }

  global.MarioAssets = new AssetManager();
})(window);
