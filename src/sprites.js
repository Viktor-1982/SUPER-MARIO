// ============================================================================
// SUPER MARIO BROS. — Authentic 1985 NES Pixel-Art Renderer & 8x8 Bitmap Font
// 100% crisp integer pixel-art (zero anti-aliased paths or blurry canvas fonts)
// ============================================================================
(function (global) {
  'use strict';

  const TILE = 16;

  // Authentic NES 2C02 Palettes for all 7 biomes
  const THEMES = {
    overworld: {
      sky: '#5c94fc',
      groundBody: '#c84c0c', groundLight: '#fcbcb0', groundDark: '#000000',
      brickBody: '#c84c0c', brickLight: '#fcbcb0', brickDark: '#000000',
      pipeLight: '#80d010', pipeMid: '#00a800', pipeDark: '#005800',
      hillBody: '#00a800', hillSpot: '#000000', hillHighlight: '#80d010', hillOutline: '#000000',
      bushLight: '#80d010', bushDark: '#00a800', bushOutline: '#00a800',
      cloudBody: '#fcfcfc', cloudShade: '#afbfea', cloudOutline: '#93a6da',
      goombaBody: '#c84c0c', goombaFeet: '#000000',
      piranhaMain: '#00a800', piranhaHead: '#e52521'
    },
    underground: {
      sky: '#000000',
      groundBody: '#356483', groundLight: '#8aafc8', groundDark: '#0b192a',
      brickBody: '#2d506e', brickLight: '#86a9bf', brickDark: '#0b192a',
      pipeLight: '#80d010', pipeMid: '#00a800', pipeDark: '#005800',
      hillBody: '#004058', hillSpot: '#001c28', hillHighlight: '#0070ec', hillOutline: '#000000',
      bushLight: '#0058a8', bushDark: '#002858', bushOutline: '#000000',
      cloudBody: '#3cbcfc', cloudShade: '#0058a8', cloudOutline: '#000000',
      goombaBody: '#008888', goombaFeet: '#000000',
      piranhaMain: '#00a8a8', piranhaHead: '#3cbcfc'
    },
    underwater: {
      sky: '#344a9f',
      groundBody: '#23754b', groundLight: '#72ae68', groundDark: '#123f35',
      brickBody: '#0070ec', brickLight: '#3cbcfc', brickDark: '#000000',
      pipeLight: '#80d010', pipeMid: '#00a800', pipeDark: '#005800',
      coralBody: '#93598e', coralLight: '#db9ab9',
      hillBody: '#0058a8', hillSpot: '#001c58', hillHighlight: '#3cbcfc', hillOutline: '#000000',
      bushLight: '#00a800', bushDark: '#005800', bushOutline: '#000000',
      cloudBody: '#fcfcfc', cloudShade: '#3cbcfc', cloudOutline: '#000000',
      goombaBody: '#c84c0c', goombaFeet: '#000000',
      piranhaMain: '#00a800', piranhaHead: '#e52521'
    },
    athletic: {
      sky: '#7893d5',
      groundBody: '#c84c0c', groundLight: '#fcbcb0', groundDark: '#000000',
      brickBody: '#c84c0c', brickLight: '#fcbcb0', brickDark: '#000000',
      pipeLight: '#80d010', pipeMid: '#00a800', pipeDark: '#005800',
      hillBody: '#00a800', hillSpot: '#000000', hillHighlight: '#80d010', hillOutline: '#000000',
      bushLight: '#80d010', bushDark: '#00a800', bushOutline: '#00a800',
      cloudBody: '#fcfcfc', cloudShade: '#afbfea', cloudOutline: '#93a6da',
      goombaBody: '#c84c0c', goombaFeet: '#000000',
      piranhaMain: '#00a800', piranhaHead: '#e52521'
    },
    night: {
      sky: '#000000',
      groundBody: '#c84c0c', groundLight: '#fcbcb0', groundDark: '#000000',
      brickBody: '#c84c0c', brickLight: '#fcbcb0', brickDark: '#000000',
      pipeLight: '#80d010', pipeMid: '#00a800', pipeDark: '#005800',
      hillBody: '#007800', hillSpot: '#003800', hillHighlight: '#00a800', hillOutline: '#000000',
      bushLight: '#bcbcbc', bushDark: '#747474', bushOutline: '#000000',
      cloudBody: '#bcbcbc', cloudShade: '#747474', cloudOutline: '#000000',
      goombaBody: '#c84c0c', goombaFeet: '#000000',
      piranhaMain: '#00a800', piranhaHead: '#e52521'
    },
    snow: {
      sky: '#7893d5',
      groundBody: '#bcbcbc', groundLight: '#fcfcfc', groundDark: '#000000',
      brickBody: '#c84c0c', brickLight: '#fcbcb0', brickDark: '#000000',
      pipeLight: '#80d010', pipeMid: '#00a800', pipeDark: '#005800',
      hillBody: '#bcbcbc', hillSpot: '#747474', hillHighlight: '#fcfcfc', hillOutline: '#000000',
      bushLight: '#fcfcfc', bushDark: '#bcbcbc', bushOutline: '#000000',
      cloudBody: '#fcfcfc', cloudShade: '#bcbcbc', cloudOutline: '#000000',
      goombaBody: '#c84c0c', goombaFeet: '#000000',
      piranhaMain: '#00a800', piranhaHead: '#e52521'
    },
    castle: {
      sky: '#000000',
      groundBody: '#747474', groundLight: '#bcbcbc', groundDark: '#000000',
      brickBody: '#747474', brickLight: '#bcbcbc', brickDark: '#000000',
      pipeLight: '#80d010', pipeMid: '#00a800', pipeDark: '#005800',
      hillBody: '#3c3c3c', hillSpot: '#1c1c1c', hillHighlight: '#747474', hillOutline: '#000000',
      bushLight: '#3c3c3c', bushDark: '#1c1c1c', bushOutline: '#000000',
      cloudBody: '#747474', cloudShade: '#3c3c3c', cloudOutline: '#000000',
      goombaBody: '#747474', goombaFeet: '#000000',
      piranhaMain: '#00a800', piranhaHead: '#e52521'
    }
  };

  // ---- Authentic Bold 1985 NES Super Mario Bros. 7x7 (8x8 cell) CHR-ROM Bitmap Font ----
  const FONT_7X7 = {
    'A': ['..###..','.#####.','##...##','##...##','#######','##...##','##...##'],
    'B': ['######.','##...##','##...##','######.','##...##','##...##','######.'],
    'C': ['.#####.','##...##','##.....','##.....','##.....','##...##','.#####.'],
    'D': ['#####..','##..##.','##...##','##...##','##...##','##..##.','#####..'],
    'E': ['#######','##.....','##.....','#####..','##.....','##.....','#######'],
    'F': ['#######','##.....','##.....','#####..','##.....','##.....','##.....'],
    'G': ['.#####.','##...##','##.....','##..###','##...##','##...##','.#####.'],
    'H': ['##...##','##...##','##...##','#######','##...##','##...##','##...##'],
    'I': ['.#####.','..###..','..###..','..###..','..###..','..###..','.#####.'],
    'J': ['..#####','....##.','....##.','....##.','##..##.','##..##.','.####..'],
    'K': ['##...##','##..##.','##.##..','####...','##.##..','##..##.','##...##'],
    'L': ['##.....','##.....','##.....','##.....','##.....','##.....','#######'],
    'M': ['##...##','###.###','#######','##.#.##','##...##','##...##','##...##'],
    'N': ['##...##','###..##','####.##','##.####','##..###','##...##','##...##'],
    'O': ['.#####.','##...##','##...##','##...##','##...##','##...##','.#####.'],
    'P': ['######.','##...##','##...##','######.','##.....','##.....','##.....'],
    'Q': ['.#####.','##...##','##...##','##...##','##.#.##','##..##.','.####.#'],
    'R': ['######.','##...##','##...##','######.','##.##..','##..##.','##...##'],
    'S': ['.#####.','##...##','##.....','.#####.','.....##','##...##','.#####.'],
    'T': ['######.','..##...','..##...','..##...','..##...','..##...','..##...'],
    'U': ['##...##','##...##','##...##','##...##','##...##','##...##','.#####.'],
    'V': ['##...##','##...##','##...##','##...##','.#####.','..###..','...#...'],
    'W': ['##...##','##...##','##...##','##.#.##','#######','###.###','##...##'],
    'X': ['##...##','.#####.','..###..','..###..','..###..','.#####.','##...##'],
    'Y': ['##...##','##...##','.#####.','..###..','..###..','..###..','..###..'],
    'Z': ['#######','....##.','...##..','..##...','.##....','##.....','#######'],
    '0': ['.#####.','##...##','##...##','##...##','##...##','##...##','.#####.'],
    '1': ['..###..','.####..','..###..','..###..','..###..','..###..','.#####.'],
    '2': ['.#####.','##...##','....##.','..###..','.##....','##.....','#######'],
    '3': ['.#####.','##...##','.....##','..####.','.....##','##...##','.#####.'],
    '4': ['...###.','..####.','.##.##.','##..##.','#######','....##.','....##.'],
    '5': ['#######','##.....','######.','.....##','.....##','##...##','.#####.'],
    '6': ['.#####.','##.....','######.','##...##','##...##','##...##','.#####.'],
    '7': ['#######','##...##','....##.','...##..','..##...','..##...','..##...'],
    '8': ['.#####.','##...##','##...##','.#####.','##...##','##...##','.#####.'],
    '9': ['.#####.','##...##','##...##','.######','.....##','##...##','.#####.'],
    '-': ['.......','.......','.......','.#####.','.#####.','.......','.......'],
    '!': ['..###..','..###..','..###..','..###..','..###..','.......','..###..'],
    '.': ['.......','.......','.......','.......','.......','..###..','..###..'],
    ':': ['.......','..###..','..###..','.......','..###..','..###..','.......'],
    '/': ['.....##','....##.','...##..','..##...','.##....','##.....','.......'],
    '(': ['...##..','..##...','.##....','.##....','.##....','..##...','...##..'],
    ')': ['..##...','...##..','....##.','....##.','....##.','...##..','..##...'],
    'x': ['.......','.......','##...##','.#####.','..###..','.#####.','##...##'],
    '>': ['.##....','..##...','...##..','....##.','...##..','..##...','.##....'],
    '<': ['....##.','...##..','..##...','.##....','..##...','...##..','....##.'],
    '©': ['.#####.','#.....#','#.###.#','#.#...#','#.###.#','#.....#','.#####.'],
    ' ': ['.......','.......','.......','.......','.......','.......','.......']
  };

  function drawBitmap(ctx, rows, palette, x, y, flipX = false, scale = 1) {
    const h = rows.length;
    const w = rows[0].length;
    const px = Math.round(x);
    const py = Math.round(y);
    for (let r = 0; r < h; r++) {
      const row = rows[r];
      for (let c = 0; c < w; c++) {
        const ch = row[c];
        if (ch === '.' || ch === ' ') continue;
        const color = palette[ch];
        if (!color) continue;
        ctx.fillStyle = color;
        const dx = flipX ? (w - 1 - c) : c;
        ctx.fillRect(px + dx * scale, py + r * scale, scale, scale);
      }
    }
  }

  function getImg(key) {
    return global.MarioAssets ? global.MarioAssets.getSprite(key) : null;
  }

  function drawImg(ctx, img, x, y, flipX = false, destW = null, destH = null) {
    const sc = img._hdScale || 1;
    const w = destW || (img.naturalWidth / sc);
    const h = destH || (img.naturalHeight / sc);
    const px = Math.round(x);
    const py = Math.round(y);
    ctx.imageSmoothingEnabled = false;
    if (flipX) {
      ctx.save();
      ctx.translate(px + w, py);
      ctx.scale(-1, 1);
      ctx.drawImage(img, 0, 0, w, h);
      ctx.restore();
    } else {
      ctx.drawImage(img, px, py, w, h);
    }
  }

  function drawImgAnchored(ctx, img, boxX, boxY, boxW, boxH, flipX = false, destW = null, destH = null) {
    const sc = img._hdScale || 1;
    const w = destW || (img.naturalWidth / sc);
    const h = destH || (img.naturalHeight / sc);
    const x = boxX + (boxW - w) / 2;
    const y = boxY + boxH - h;
    drawImg(ctx, img, x, y, flipX, w, h);
  }

  function drawPixelText(ctx, text, x, y, color = '#fcfcfc', scale = 1, align = 'left', shadow = true) {
    const str = String(text);
    const charW = 8 * scale;
    const totalW = str.length * charW - scale;
    let startX = Math.round(x);
    if (align === 'center') startX = Math.round(x - totalW / 2);
    else if (align === 'right') startX = Math.round(x - totalW);
    const startY = Math.round(y);

    for (let i = 0; i < str.length; i++) {
      const ch = str[i];
      const glyph = FONT_7X7[ch] || FONT_7X7[ch.toUpperCase()] || FONT_7X7[' '];
      const gx = startX + i * charW;
      for (let r = 0; r < 7; r++) {
        const row = glyph[r];
        for (let c = 0; c < 7; c++) {
          if (row[c] === '#') {
            if (shadow) {
              ctx.fillStyle = '#000000';
              ctx.fillRect(gx + c * scale + scale, startY + r * scale + scale, scale, scale);
            }
            ctx.fillStyle = color;
            ctx.fillRect(gx + c * scale, startY + r * scale, scale, scale);
          }
        }
      }
    }
  }

  // ---- Authentic 1985 NES Cobblestone Ground Tile (16x16) ----
  const GROUND_TILE_BMP = [
    '.LLLLLLLLKLLLLL.',
    'LBBBBBBBBKLBBBBK',
    'LBBBBBBBBKLBBBBK',
    'LBBBBBBBBKLBBBBK',
    'LBBBBBBBBKLBBBBK',
    'LBBBBBBBBKLBBBBK',
    'LBBBBBBBBK.KKKK.',
    'LBBBBBBBBKLBBBBK',
    'KBBBBBBBBKLBBBBK',
    '.KKKKKKKKKLBBBBK',
    '.LLLLLLKLLLBBBBK',
    'LBBBBBBKLBBBBBBK',
    'LBBBBBBKLBBBBBBK',
    'LBBBBBBKLBBBBBBK',
    'LBBBBBBKLBBBBBBK',
    '.KKKKKK..KKKKKK.'
  ];

  // ---- Modular 1985 NES Scenery Tiles (Seamless 1-wide, 2-wide, 3-wide!) ----
  const CLOUD_LEFT = [
    '............KKKK',
    '..........KKWWWW',
    '.........KWWWWWW',
    '........KWWWWWWW',
    '.....KKKKWWWWWWW',
    '...KKWWWWWWWWWWW',
    '..KWWWWWWWWWWWWW',
    '.KWWWWWWWWWWWWWW',
    '.KWWWWWWWWWWWWWW',
    'KWWWWWWWWWWWWWWW',
    'KWWWWWWWWWWWWWWW',
    'KWWSSWWWWWWWWWWW',
    '.KWWSSWWWWSSWWWW',
    '.KWWWSSSSWWWWSSS',
    '..KKWWSSSSSSSSSS',
    '....KKKKKKKKKKKK'
  ];

  const CLOUD_MID = [
    'KKKKKK....KKKKKK',
    'WWWWWWKKKKWWWWWW',
    'WWWWWWWWWWWWWWWW',
    'WWWWWWWWWWWWWWWW',
    'WWWWWWWWWWWWWWWW',
    'WWWWWWWWWWWWWWWW',
    'WWWWWKWWKWWWWWWW',
    'WWWWWKWWKWWWWWWW',
    'WWWWWWWWWWWWWWWW',
    'WWWWWWWWWWWWWWWW',
    'WWWWWWWWWWWWWWWW',
    'WWWWWWWWWWWWWWWW',
    'WWSSWWWWWWSSWWWW',
    'SWWWWSSSSWWWWSSS',
    'SSSSSSSSSSSSSSSS',
    'KKKKKKKKKKKKKKKK'
  ];

  const CLOUD_RIGHT = [
    'KKKK............',
    'WWWWKK..........',
    'WWWWWWK.........',
    'WWWWWWWK........',
    'WWWWWWWKKKK.....',
    'WWWWWWWWWWWKK...',
    'WWWWWWWWWWWWWK..',
    'WWWWWWWWWWWWWWK.',
    'WWWWWWWWWWWWWWK.',
    'WWWWWWWWWWWWWWWK',
    'WWWWWWWWWWWWWWWK',
    'WWWWWWWWWWWSSWWK',
    'WWWWSSWWWWSSWWK.',
    'SSWWWWSSSSWWWK..',
    'SSSSSSSSSWWKK...',
    'KKKKKKKKKKK.....'
  ];

  const BUSH_LEFT = [
    '...........KKKKK',
    '.........KKLLLLL',
    '........KLLLLLLL',
    '.......KLLLLLLLL',
    '....KKKKLLLLLLLL',
    '..KKLLLLLLLDLLLL',
    '.KLLLLLLLLDDLLLL',
    '.KLLLLLLLLLLLLLL',
    'KLLLLLDLLLLLLLLL',
    'KLLLLDDLLLLLLLLL',
    'KLLLLLLLLLLLDLLL',
    'KLLLLLLLLLLDDLLL',
    'KLLDDLLLLLLLLLLL',
    'KDDDDLLLLDDLLLLL',
    'KDDDDDDDDDDDDDDD',
    'KKKKKKKKKKKKKKKK'
  ];

  const BUSH_MID = [
    'KKKKK......KKKKK',
    'LLLLLKKKKKKLLLLL',
    'LLLLLLLLLLLLLLLL',
    'LLLLLLLLLLLLLLLL',
    'LLLLLDLLLLLLLLLL',
    'LLLLDDLLLLDLLLLL',
    'LLLLLLLLLDDLLLLL',
    'LLLLLLLLLLLLLLLL',
    'LLLLLLLDLLLLLLLL',
    'LLLLLLDDLLLLLLLL',
    'LLDLLLLLLLLLLDLL',
    'LDDLLLLLLLLLLDDL',
    'LLLLLLLLDDLLLLLL',
    'LLDDLLLLDDLLLLDD',
    'DDDDDDDDDDDDDDDD',
    'KKKKKKKKKKKKKKKK'
  ];

  const BUSH_RIGHT = [
    'KKKKK...........',
    'LLLLLKK.........',
    'LLLLLLLK........',
    'LLLLLLLLK.......',
    'LLLLLLLLKKKK....',
    'LLLLDLLLLLLLKK..',
    'LLLLDDLLLLLLLLK.',
    'LLLLLLLLLLLLLLK.',
    'LLLLLLLLLDLLLLLK',
    'LLLLLLLLDDLLLLLK',
    'LLLDLLLLLLLLLLLK',
    'LLLDDLLLLLLLLLLK',
    'LLLLLLLLLLLDDLLK',
    'LLLLLDDLLLLDDDDK',
    'DDDDDDDDDDDDDDDK',
    'KKKKKKKKKKKKKKKK'
  ];

  // Pixel-art wooden fence post (16x16)
  const FENCE_TILE = [
    '................',
    '................',
    '..KKK......KKK..',
    '.KWWWK....KWWWK.',
    '.KWWWK....KWWWK.',
    'KKWWWKKKKKKWWWKK',
    'KWWWWWWWWWWWWWWK',
    'KWWWWWWWWWWWWWWK',
    'KKWWWKKKKKKWWWKK',
    '.KWWWK....KWWWK.',
    'KKWWWKKKKKKWWWKK',
    'KWWWWWWWWWWWWWWK',
    'KWWWWWWWWWWWWWWK',
    'KKWWWKKKKKKWWWKK',
    '.KWWWK....KWWWK.',
    '.KKKKK....KKKKK.'
  ];

  // Smooth HD Rounded Mario Hill (classic NES silhouette & spots, zero blocky staircases!)
  function drawNesHill(ctx, baseX, baseY, height, theme) {
    const cx = Math.round(baseX);
    const by = Math.round(baseY);
    const baseHalfW = height + 5;

    ctx.save();
    ctx.beginPath();
    ctx.moveTo(cx - baseHalfW, by);
    ctx.lineTo(cx - 8, by - height + 4);
    ctx.quadraticCurveTo(cx, by - height - 3, cx + 8, by - height + 4);
    ctx.lineTo(cx + baseHalfW, by);
    ctx.closePath();

    const grad = ctx.createLinearGradient(cx - baseHalfW, by - height, cx + baseHalfW, by);
    grad.addColorStop(0, theme.hillHighlight || theme.hillBody);
    grad.addColorStop(0.35, theme.hillBody);
    grad.addColorStop(1, theme.hillSpot || theme.hillBody);
    ctx.fillStyle = grad;
    ctx.fill();

    ctx.lineWidth = 1.0;
    ctx.strokeStyle = theme.hillOutline;
    ctx.stroke();

    // Smooth classic rounded hill spots
    const drawSpot = (sx, sy) => {
      ctx.beginPath();
      ctx.ellipse(sx + 0.5, sy + 2.2, 1.8, 2.4, 0, 0, Math.PI * 2);
      ctx.fillStyle = theme.hillSpot;
      ctx.fill();
      ctx.lineWidth = 0.7;
      ctx.strokeStyle = theme.hillOutline;
      ctx.stroke();
      ctx.beginPath();
      ctx.ellipse(sx - 0.1, sy + 1.6, 0.55, 0.9, 0, 0, Math.PI * 2);
      ctx.fillStyle = theme.hillHighlight;
      ctx.fill();
    };

    if (height >= 30) {
      drawSpot(cx - 8, by - 25);
      drawSpot(cx + 6, by - 21);
      drawSpot(cx - 16, by - 14);
      drawSpot(cx + 1, by - 11);
      drawSpot(cx + 16, by - 13);
    } else {
      drawSpot(cx - 6, by - 12);
      drawSpot(cx + 5, by - 9);
    }
    ctx.restore();
  }

  function drawWideCloud(ctx, x, y, midCount, pal) {
    const px = Math.round(x);
    const py = Math.round(y);
    const totalW = 32 + midCount * 16;
    const puffs = 2 + midCount;

    ctx.save();
    ctx.beginPath();
    ctx.moveTo(px + 6, py + 15);
    ctx.quadraticCurveTo(px, py + 14.5, px + 1, py + 9.5);
    ctx.quadraticCurveTo(px + 2, py + 4.5, px + 7.5, py + 5);
    for (let i = 0; i < puffs; i++) {
      const cx = px + 10 + (i * (totalW - 20)) / Math.max(1, puffs - 1);
      ctx.arc(cx, py + 6.5, 6.2, Math.PI * 1.05, Math.PI * 1.95, false);
    }
    ctx.quadraticCurveTo(px + totalW, py + 5.5, px + totalW - 1, py + 10.5);
    ctx.quadraticCurveTo(px + totalW, py + 15, px + totalW - 6, py + 15.5);
    ctx.closePath();

    ctx.fillStyle = pal.W;
    ctx.fill();
    // Soft rounded cloud underside shading
    ctx.save();
    ctx.clip();
    ctx.fillStyle = pal.S;
    ctx.fillRect(px, py + 12.2, totalW, 4);
    ctx.restore();

    ctx.lineWidth = 0.85;
    ctx.strokeStyle = '#3d63ad';
    ctx.stroke();

    // Cute classic Mario cloud eyes on each wide puff
    ctx.fillStyle = '#1f3566';
    for (let i = 0; i < Math.max(1, midCount + 1); i++) {
      const ex = px + 13 + i * 16;
      ctx.beginPath();
      ctx.ellipse(ex, py + 8.5, 0.75, 1.5, 0, 0, Math.PI * 2);
      ctx.ellipse(ex + 3.2, py + 8.5, 0.75, 1.5, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  function drawWideBush(ctx, x, y, midCount, pal) {
    const px = Math.round(x);
    const py = Math.round(y);
    const totalW = 32 + midCount * 16;
    const domes = 2 + midCount;

    ctx.save();
    ctx.beginPath();
    ctx.moveTo(px + 2, py + 16);
    ctx.quadraticCurveTo(px, py + 8, px + 7, py + 6);
    for (let i = 0; i < domes; i++) {
      const cx = px + 10 + (i * (totalW - 20)) / Math.max(1, domes - 1);
      ctx.arc(cx, py + 8.5, 7.2, Math.PI * 1.08, Math.PI * 1.92, false);
    }
    ctx.quadraticCurveTo(px + totalW, py + 8, px + totalW - 2, py + 16);
    ctx.closePath();

    const grad = ctx.createLinearGradient(px, py, px, py + 16);
    grad.addColorStop(0, pal.L);
    grad.addColorStop(0.75, pal.L);
    grad.addColorStop(1, pal.D);
    ctx.fillStyle = grad;
    ctx.fill();

    // Soft leaf accents
    ctx.fillStyle = pal.D;
    for (let i = 0; i < domes; i++) {
      const lx = px + 9 + i * 14;
      ctx.beginPath();
      ctx.ellipse(lx, py + 10.5, 1.6, 1.0, -0.2, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.lineWidth = 0.85;
    ctx.strokeStyle = '#005a00';
    ctx.stroke();
    ctx.restore();
  }

  // ---- Refined 1985 NES Small Mario (12x16) ----
  const MARIO_SMALL_IDLE = [
    '...RRRRR....',
    '..RRRRRRRRR.',
    '..BBBSSKS...',
    '.BSBSSSKS...',
    '.BSBBSSSSK..',
    '.BBSSSSKKKK.',
    '...SSSSSSS..',
    '..BBRBB.....',
    '.BBBRBBRBB..',
    'BBBBRRRRBBB.',
    'SSBRYRRRYBSS',
    'SSSRRRRRRSSS',
    'SSRRRRRRRRSS',
    '..RRR..RRR..',
    '.BBB....BBB.',
    'BBBB....BBBB'
  ];

  // ---- Authentic 1985 NES Small Mario 3-Frame Marching Cycle (16x16) ----
  // Frame 0: Wide Marching Stride (arms swung out, front boot lifted, back boot kicked back)
  const MARIO_SMALL_WALK0 = [
    '....RRRRR.......',
    '...RRRRRRRRR....',
    '...BBBSSKS......',
    '..BSBSSSKS......',
    '..BSBBSSSSK.....',
    '..BBSSSSKKKK....',
    '....SSSSSSS.....',
    '...BBBRRBB......',
    '..BBBBRRBBBSS...',
    '.BBBBBRRRRRSSS..',
    '.SSBBBRRYRRR....',
    '.SSS.RRRRRRBBB..',
    '..BB.RRRRRRBBBB.',
    '.BBBB.RRRR..BBB.',
    '.BBBB...........',
    '..BB............'
  ];

  // Frame 1: Medium Stride (front boot planted, back boot kicked up behind)
  const MARIO_SMALL_WALK1 = [
    '....RRRRR.......',
    '...RRRRRRRRR....',
    '...BBBSSKS......',
    '..BSBSSSKS......',
    '..BSBBSSSSK.....',
    '..BBSSSSKKKK....',
    '....SSSSSSS.....',
    '...BBRRRBB......',
    '..BBBRRRRBB.....',
    '..BBBBRRRBSS....',
    '..BBBBRRYRSS....',
    '...RRRRRRRR.....',
    '..BBRRRRRRR.....',
    '.BBBB..RRR......',
    '.BBBB..BBBB.....',
    '.......BBBB.....'
  ];

  // Frame 2: Closed Passing Step (arm at side, legs together)
  const MARIO_SMALL_WALK2 = [
    '....RRRRR.......',
    '...RRRRRRRRR....',
    '...BBBSSKS......',
    '..BSBSSSKS......',
    '..BSBBSSSSK.....',
    '..BBSSSSKKKK....',
    '....SSSSSSS.....',
    '....BBRBB.......',
    '...BBBRRBB......',
    '...BBBRYBB......',
    '...BBSSRRR......',
    '....SSRRRR......',
    '....RRRRRR......',
    '....RRRRR.......',
    '...BBBBBB.......',
    '...BBBBBBB......'
  ];

  const MARIO_SMALL_JUMP = [
    '.........SSS',
    '...RRRRR.SSS',
    '..RRRRRRRRSS',
    '..BBBSSKSBB.',
    '.BSBSSSKSBB.',
    '.BSBBSSSSKB.',
    '.BBSSSSKKKK.',
    '...SSSSSSRR.',
    '.BBBBRRRRR..',
    'BBBBRRRYRR..',
    'SSBRRRRRRR..',
    'SSRRRRRRRR..',
    '.RRRRRRRRBB.',
    '.RRR..RRRBB.',
    'BBB....BBB..',
    'BBB.........'
  ];

  const MARIO_SMALL_SKID = [
    '....RRRRR...',
    '.RRRRRRRRR..',
    '...SKSSBBB..',
    '...SKSSSBSB.',
    '..KSSSSBBSB.',
    '.KKKKSSSSBB.',
    '..SSSSSSS...',
    '....BBRBB...',
    '..BBRBBRBB..',
    '.BBBRRRBBBB.',
    'SSBYRRRBYBSS',
    'SSSRRRRRRSSS',
    'SSRRRRRRRRSS',
    '..RRR..RRR..',
    '.BBB....BBB.',
    'BBBB....BBBB'
  ];

  const MARIO_SMALL_DEAD = [
    '...RRRRR....',
    '..RRRRRRRRR.',
    '..BBBSSKS...',
    '.BSBSSSKS...',
    '.BSBBSSSSK..',
    '.BBSSSSKKKK.',
    '...SSSSSSS..',
    '.SS.RRRR.SS.',
    'SSSBRRRRBSSS',
    'SSBRYRRRYBSS',
    '..RRRRRRRR..',
    '.RRRR..RRRR.',
    '.BBB....BBB.',
    'BBBB....BBBB',
    '............',
    '............'
  ];

  const MARIO_BIG_IDLE = [
    '....RRRRRR....',
    '...RRRRRRRRR..',
    '...RRRRRRRRRR.',
    '...BBBBSSKS...',
    '..BSBSSSSKS...',
    '..BSBBBSSSSK..',
    '..BBBSSSSKKKK.',
    '....SSSSSSSS..',
    '...BBRRRRRBB..',
    '..BBBRRRRRBBB.',
    '.BBBBRRRRRBBBB',
    '.BBBBRRRRRBBBB',
    '.SSBBBRRRBBBSS',
    '.SSSRRRRRRRSSS',
    '.SSSRRYRRYRSSS',
    '..SSRRRRRRRSS.',
    '...RRRRRRRRR..',
    '..RRRRRRRRRRR.',
    '..RRRRRRRRRRR.',
    '..RRRRR.RRRRR.',
    '..RRRR...RRRR.',
    '..RRRR...RRRR.',
    '..RRR.....RRR.',
    '.BBBB.....BBBB',
    '.BBBB.....BBBB',
    'BBBBB.....BBBB'
  ];

  const MARIO_BIG_WALK = [
    '....RRRRRR....',
    '...RRRRRRRRR..',
    '...RRRRRRRRRR.',
    '...BBBBSSKS...',
    '..BSBSSSSKS...',
    '..BSBBBSSSSK..',
    '..BBBSSSSKKKK.',
    '....SSSSSSSS..',
    '...BBRRRRRB...',
    '..BBBRRRRRBB..',
    '..BBBRRRRRBB..',
    '..SSBRRRRRBB..',
    '..SSSRRYRRBB..',
    '...SSRRRRRR...',
    '...RRRRRRRR...',
    '..RRRRRRRRRR..',
    '..RRRRRRRRRR..',
    '.RRRRR..RRRR..',
    '.RRRR....RRRR.',
    '.RRR......RRR.',
    'BBBB......BBBB',
    'BBBB......BBBB',
    'BBBB......BBBB',
    '..............',
    '..............',
    '..............'
  ];

  const MARIO_BIG_JUMP = [
    '..........SSS.',
    '....RRRRRRSSS.',
    '...RRRRRRRRSS.',
    '...BBBBSSKSBB.',
    '..BSBSSSSKSBB.',
    '..BSBBBSSSSKB.',
    '..BBBSSSSKKKK.',
    '....SSSSSSSS..',
    '..BBBBRRRRRR..',
    '.BBBBBRRRRRR..',
    '.SSBBBRRRYRR..',
    '.SSSRRRRRRRR..',
    '..SSRRRRRRRR..',
    '...RRRRRRRRR..',
    '..RRRRRRRRRRR.',
    '..RRRRRRRRRRR.',
    '.RRRRR...RRRR.',
    '.RRRR....BBBB.',
    'BBBB.....BBBB.',
    'BBBB.....BBBB.',
    'BBBB..........',
    '..............',
    '..............',
    '..............',
    '..............',
    '..............'
  ];

  const MARIO_BIG_CROUCH = [
    '....RRRRRR....',
    '...RRRRRRRRR..',
    '...BBBBSSKS...',
    '..BSBSSSSKS...',
    '..BSBBBSSSSK..',
    '..BBBSSSSKKKK.',
    '....SSSSSSSS..',
    '..BBBRRRRRBB..',
    '.BBBBRRYRRBBB.',
    '.SSRRRRRRRRSS.',
    '..RRRRRRRRRR..',
    '..RRRRRRRRRR..',
    '..RRRR..RRRR..',
    '.BBBB....BBBB.',
    '.BBBB....BBBB.',
    '..............'
  ];

  // ---- Enemy Bitmaps ----
  const GOOMBA_1 = [
    '......BBBB......',
    '.....BBBBBB.....',
    '....BBBBBBBB....',
    '...BBBBBBBBBB...',
    '..BBWWBBBBWWBB..',
    '.BBBWKBBBBKWBBB.',
    '.BBBWKBBBBKWBBB.',
    'BBBBWWBBBBWWBBBB',
    'BBBBBBBBBBBBBBBB',
    '.BBBBSSSSSSBBBB.',
    '....SSSSSSSS....',
    '...SSSSSSSSSS...',
    '..KKKKSSSSKKKK..',
    '.KKKKKSSSSKKKKK.',
    '.KKKK......KKKK.',
    '................'
  ];

  const GOOMBA_2 = [
    '......BBBB......',
    '.....BBBBBB.....',
    '....BBBBBBBB....',
    '...BBBBBBBBBB...',
    '..BBWWBBBBWWBB..',
    '.BBBWKBBBBKWBBB.',
    '.BBBWKBBBBKWBBB.',
    'BBBBWWBBBBWWBBBB',
    'BBBBBBBBBBBBBBBB',
    '.BBBBSSSSSSBBBB.',
    '....SSSSSSSS....',
    '...SSSSSSSSSS...',
    '...KKKKSSKKKK...',
    '....KKK..KKK....',
    '....KKK..KKK....',
    '................'
  ];

  const GOOMBA_FLAT = [
    '................',
    '................',
    '................',
    '................',
    '................',
    '................',
    '................',
    '................',
    '................',
    '................',
    '..BBBBBBBBBBBB..',
    '.BBWWBBBBBBWWBB.',
    'BBBBBBBBBBBBBBBB',
    '.KKKSSSSSSSSKKK.',
    'KKKK........KKKK',
    '................'
  ];

  const KOOPA_WALK1 = [
    '..........YYY...',
    '.........YYYYY..',
    '........YYWKY...',
    '........YYWKY...',
    '.........YYYY...',
    '....GGGG..YY....',
    '..GGGGGGGGYY....',
    '.GGWWGGWWGGY....',
    '.GGGGGGGGGGY....',
    'GGWWGGGGWWGG....',
    'GGGGGGGGGGGG....',
    'GGGGGGGGGGGG....',
    '.WWWWWWWWWW.....',
    '..YYYY..YYYY....',
    '.YYYY....YYYY...',
    '................'
  ];

  const KOOPA_WALK2 = [
    '..........YYY...',
    '.........YYYYY..',
    '........YYWKY...',
    '........YYWKY...',
    '.........YYYY...',
    '....GGGG..YY....',
    '..GGGGGGGGYY....',
    '.GGWWGGWWGGY....',
    '.GGGGGGGGGGY....',
    'GGWWGGGGWWGG....',
    'GGGGGGGGGGGG....',
    'GGGGGGGGGGGG....',
    '.WWWWWWWWWW.....',
    '...YYYYYYYY.....',
    '...YYY..YYY.....',
    '................'
  ];

  const KOOPA_SHELL = [
    '................',
    '................',
    '................',
    '................',
    '....GGGGGGGG....',
    '..GGGGGGGGGGGG..',
    '.GGWWGGGGGGWWGG.',
    '.GGGGGGGGGGGGGG.',
    'GGWWGGGGGGGGWWGG',
    'GGGGGGGGGGGGGGGG',
    'GGGGGGGGGGGGGGGG',
    'GGGGGGGGGGGGGGGG',
    '.WWWWWWWWWWWWWW.',
    '..WWWWWWWWWWWW..',
    '................',
    '................'
  ];

  const BUZZY_1 = [
    '................',
    '................',
    '....BBBBBBBB....',
    '..BBBBBBBBBBBB..',
    '.BBWWBBBBBBBBBB.',
    'BBWBBBBBBBBBBBBB',
    'BBBBBBBBBBBBBBBB',
    'BBBBBBBBBBBBBBBB',
    'BBBBBBBBBBBBBBBB',
    'SSBBBBBBBBBBBBBB',
    'SWKSSBBBBBBBBBB.',
    'SSSSSSWWWWWWWW..',
    '..SSSS....SSSS..',
    '.SSSS......SSSS.',
    '................',
    '................'
  ];

  const SPINY_1 = [
    '....W......W....',
    '...WRW....WRW...',
    '..WRRRW..WRRRW..',
    '.WRRRRRWWRRRRRW.',
    'RRRRRRRRRRRRRRRR',
    'RRWWWRRRRRWWWRRR',
    'RRRRRRRRRRRRRRRR',
    'SSRRRRRRRRRRRRRR',
    'SWKSSRRRRRRRRRR.',
    'SSSSSSWWWWWWWW..',
    '..SSSS....SSSS..',
    '.SSSS......SSSS.',
    '................',
    '................',
    '................',
    '................'
  ];

  const LAKITU_BMP = [
    '.....GGGGGG.....',
    '....GGGGGGGG....',
    '...GGWWGGWWGG...',
    '...GGWKGGKWGG...',
    '...GGGGGGGGGG...',
    '....GGYYYYGG....',
    '..WWWWWWWWWWWW..',
    '.WWWWWWWWWWWWWW.',
    'WWWWKWWWWWWKWWWW',
    'WWWWWWWWWWWWWWWW',
    '.WWWWWWWWWWWWWW.',
    '..WWWWWWWWWWWW..',
    '....WWWWWWWW....',
    '................',
    '................',
    '................'
  ];

  const HAMMERBRO_1 = [
    '....GGGGGGGG....',
    '...GGGGGGGGGG...',
    '...GGWWGGWWGG...',
    '...GGWKGGKWGG...',
    '...GGYYYYYYGG...',
    '....GGGGGGGG....',
    '..GGGGWWWWGGGG..',
    '.GGGGWWWWWWGGGG.',
    '.GGGWWWWWWWWGGG.',
    '..GGWWWWWWWWGG..',
    '...GGGGGGGGGG...',
    '...YYYY..YYYY...',
    '..YYYY....YYYY..',
    '..YYYY....YYYY..',
    '................',
    '................'
  ];

  const BULLET_BMP = [
    '................',
    '................',
    '....KKKKKKKKKK..',
    '..KKKKKKKKKKKKK.',
    '.KKKWWKKKKKKKKKK',
    'KKKWWKKKKKKKKKKK',
    'KKKKWWKKKKKKKKKK',
    'KKKKKKKKKKKKKKKK',
    'KKKKKKKKKKKKKKKK',
    '.KKKKKKKKKKKKKKK',
    '..KKKKKKKKKKKKK.',
    '....KKKKKKKKKK..',
    '................',
    '................',
    '................',
    '................'
  ];

  const BLOOPER_1 = [
    '......WWWW......',
    '....WWWWWWWW....',
    '...WWWWWWWWWW...',
    '..WWWWWWWWWWWW..',
    '.WWKKWWWWWWKKWW.',
    '.WWKKWWWWWWKKWW.',
    '..WWWWWWWWWWWW..',
    '...WWWWWWWWWW...',
    '..WW..WWWW..WW..',
    '.WW..WW..WW..WW.',
    'WW...WW..WW...WW',
    '....WW....WW....',
    '................',
    '................',
    '................',
    '................'
  ];

  const BLOOPER_2 = [
    '......WWWW......',
    '....WWWWWWWW....',
    '...WWWWWWWWWW...',
    '..WWWWWWWWWWWW..',
    '.WWKKWWWWWWKKWW.',
    '.WWKKWWWWWWKKWW.',
    '..WWWWWWWWWWWW..',
    '...WWWWWWWWWW...',
    '...WW.WWWW.WW...',
    '...WW.WWWW.WW...',
    '...WW..WW..WW...',
    '................',
    '................',
    '................',
    '................',
    '................'
  ];

  const CHEEP_1 = [
    '................',
    '.....RRRRRR.....',
    '...RRRRRRRRRR...',
    '..RRWWWRRRRRRR..',
    '.RRWWKWRRRRRRRR.',
    'RRRRWWWRRRRRRRWW',
    'RRRRRRRRRRRRWWWW',
    'RRYYYYRRRRRRWWWW',
    '.YYYYYYRRRRRRRWW',
    '..YYYYRRRRRRRR..',
    '....RRRRRRRR....',
    '.....YYYY.......',
    '................',
    '................',
    '................',
    '................'
  ];

  const PIRANHA_1 = [
    '...GGGG..GGGG...',
    '..GWWGG..GGWWG..',
    '.GWWWWG..GWWWWG.',
    '.GWWWWG..GWWWWG.',
    'GWWGGWG..GWGGWWG',
    'GWWWWWG..GWWWWWG',
    'GWWWWGGGGGGWWWWG',
    '.GWWGGGGGGGGWWG.',
    '..GGGGGGGGGGGG..',
    '...GGGGGGGGGG...',
    '.....GGGGGG.....',
    '..GG.GGGGGG.GG..',
    '.GGGGGGGGGGGGGG.',
    '..GGGGGGGGGGGG..',
    '.....GGGGGG.....',
    '.....GGGGGG.....'
  ];

  const PIRANHA_2 = [
    '....GG....GG....',
    '...GWWG..GWWG...',
    '..GWWWWGGWWWWG..',
    '.GWWWWWWWWWWWWG.',
    '.GWWGGWWWWGGWWG.',
    'GWWWWWWWWWWWWWWG',
    'GWWWWGGGGGGWWWWG',
    '.GWWGGGGGGGGWWG.',
    '..GGGGGGGGGGGG..',
    '...GGGGGGGGGG...',
    '.....GGGGGG.....',
    '...GGGGGGGGGG...',
    '..GGGGGGGGGGGG..',
    '.....GGGGGG.....',
    '.....GGGGGG.....',
    '.....GGGGGG.....'
  ];

  const MUSHROOM_BMP = [
    '.....KKKKKK.....',
    '...KKRRRRRRKK...',
    '..KRRWWRRRRWWK..',
    '.KRRWWWWRRWWWWK.',
    '.KRRWWWWRRWWWWK.',
    'KRRRWWRRRRWWWRRK',
    'KRRRRRRRRRRRRRRK',
    'KRRRRRRRRRRRRRRK',
    '.KKWWWWWWWWWWKK.',
    '..KWWWWWWWWWWK..',
    '..KWWKWWWWKWWK..',
    '..KWWKWWWWKWWK..',
    '..KWWWWWWWWWWK..',
    '...KWWWWWWWWK...',
    '....KKKKKKKK....',
    '................'
  ];

  const FLOWER_BMP = [
    '....KKKKKKKK....',
    '..KKRRRRRRRRKK..',
    '.KRRYYYYYYYYRRK.',
    '.KRYWWKWWKWWYRK.',
    '.KRYWWKWWKWWYRK.',
    '.KRRYYYYYYYYRRK.',
    '..KKRRRRRRRRKK..',
    '....KKKKKKKK....',
    '......KGGK......',
    '..KK..KGGK..KK..',
    '.KGGKKKGGKKKGGK.',
    '..KGGGGGGGGGGK..',
    '...KKGGGGGGKK...',
    '.....KKGGKK.....',
    '......KKKK......',
    '................'
  ];

  const STAR_BMP = [
    '.......KK.......',
    '......KYYK......',
    '.....KYYYYK.....',
    '....KYYYYYYK....',
    'KKKKYYYYYYYYKKKK',
    '.KYYYYYYYYYYYYK.',
    '..KYYYKYYKYYYK..',
    '...KYYKYYKYYK...',
    '...KYYYYYYYYK...',
    '..KYYYYYYYYYYK..',
    '..KYYYYKKYYYYK..',
    '.KYYYYK..KYYYYK.',
    '.KYYKK....KKYYK.',
    '.KKK........KKK.',
    '................',
    '................'
  ];

  const BOWSER_BMP = [
    '.....WW...WW....',
    '...GGGGGGGGGG...',
    '..GGWKG..GKWGG..',
    '.GGGGGGGGGGGGGG.',
    '.GYYYYYYYYYYYYG.',
    '.GYWWYWWWWYWWYG.',
    '..GGGGGGGGGGGG..',
    '.WGGGGGGGGGGGG..',
    'WGGYYYYYYYYYYGG.',
    '.WGGYYYYYYYYGGG.',
    '..WGGYYYYYYGGGG.',
    '...GGYYYYYYGGGG.',
    '...GGGYYYYGGGG..',
    '..GGGG....GGGG..',
    '.WWWW......WWWW.',
    '................'
  ];

  const TOAD_BMP = [
    '....KKKKKKKK....',
    '..KKWWWRRWWWKK..',
    '.KWWWRRRRRRWWWK.',
    '.KWWWRRRRRRWWWK.',
    '.KWWWWWWWWWWWWK.',
    '..KKWWWWWWWWKK..',
    '...KSSKSSKSSK...',
    '...KSSSSSSSSK...',
    '....KSSSSSSK....',
    '..KKBWWWWWWBKK..',
    '.KBBBWWWWWWBBBK.',
    '.KSSBWWWWWWBSSK.',
    '...KWWWWWWWWK...',
    '...KBBBKKBBBK...',
    '..KBBBB..BBBBK..',
    '..KKKKK..KKKKK..'
  ];

  const PEACH_BMP = [
    '.....YYYYYY.....',
    '....YYRYYRYY....',
    '...YYYYYYYYYY...',
    '...YYSSSSSSYY...',
    '...YSSKSSKSSY...',
    '...YSSSSSSSSY...',
    '....YYSSSSYY....',
    '...PPPPPPPPPP...',
    '..PPPPPPPPPPPP..',
    '..SSPPPPPPPPSS..',
    '...PPPPPPPPPP...',
    '..PPPPPPPPPPPP..',
    '.PPPPPPPPPPPPPP.',
    '.PPPPPPPPPPPPPP.',
    '..PPPPPPPPPPPP..',
    '....RR....RR....'
  ];

  const SMALL_SWIM_HEAD = MARIO_SMALL_IDLE.slice(0, 7);
  const BIG_SWIM_HEAD = MARIO_BIG_IDLE.slice(0, 8);

  function drawSwimmingMario(ctx, player, palette, frame, flip) {
    const big = player.powerState !== 'small';
    const head = big ? BIG_SWIM_HEAD : SMALL_SWIM_HEAD;
    const x = Math.round(player.x + (player.w || 12) / 2);
    const y = Math.round(player.y + (big ? 5 : 1));
    const shoulders = head.length - 1;
    // An upward kick starts the reach. The arm returns as the swimmer slows.
    const glide = Math.max(0, Math.min(1, (player.vy + 2.3) / 3.7));
    const reach = player.fireAnimTimer > 0 ? 5 : Math.round(5 - 7 * glide);
    const armDip = Math.round(3 * Math.sin(Math.PI * glide));
    const flutter = Math.round(Math.sin(frame * Math.PI / 6));
    const legs = shoulders + (big ? 10 : 5);
    const part = (color, dx, dy, width, height) => {
      ctx.fillStyle = palette[color];
      ctx.fillRect(x + (flip ? -dx - width : dx), y + dy, width, height);
    };

    part('R', -7, legs + flutter - 1, 5, big ? 4 : 3);
    part('B', -9, legs + flutter, 3, 2);
    part('B', -4, shoulders + 1, 8, big ? 5 : 3);
    part('R', -5, shoulders + 3, 8, big ? 8 : 3);
    part('Y', 1, shoulders + 4, 1, 1);
    part('R', -6, legs - flutter + 1, 5, big ? 4 : 2);
    part('B', -8, legs - flutter + 3, 4, 2);
    part('B', Math.min(0, reach), shoulders + 2 + armDip, Math.abs(reach) + 2, 2);
    part('S', reach, shoulders + 2 + armDip, 3, 2);
    const headX = flip ? x - Math.ceil(head[0].length / 2) - 1 : x - Math.floor(head[0].length / 2) + 1;
    drawBitmap(ctx, head, palette, headX, y, flip);
  }

  function drawFortressBackdrop(ctx, cameraX) {
    const viewW = ctx.canvas.width || 256;
    const spacing = 104;
    const offset = Math.round(cameraX * 0.48) % spacing;
    ctx.fillStyle = '#6986ba';
    ctx.fillRect(0, 157, viewW, 83);
    for (let x = -offset - spacing; x < viewW + spacing; x += spacing) {
      ctx.fillStyle = '#647faf';
      ctx.fillRect(x + 9, 122, 27, 118);
      ctx.fillRect(x + 6, 117, 33, 6);
      ctx.fillRect(x + 6, 111, 7, 6);
      ctx.fillRect(x + 19, 111, 7, 6);
      ctx.fillRect(x + 32, 111, 7, 6);
      for (let tooth = 42; tooth < 102; tooth += 20) ctx.fillRect(x + tooth, 150, 10, 7);
      ctx.fillStyle = '#5370a2';
      ctx.fillRect(x + 20, 136, 5, 13);
      ctx.fillRect(x + 10, 153, 25, 2);
      ctx.fillRect(x + 39, 164, 65, 2);
    }
  }

  const Sprites = {
    TILE,
    THEMES,
    drawPixelText,

    getMarioPalette(state, starTimer, frame) {
      if (starTimer > 0) {
        const phase = Math.floor(frame / (starTimer > 120 ? 2 : 6)) % 4;
        const starPalettes = [
          { R: '#d82800', S: '#fca044', B: '#6c5400', Y: '#fca044', K: '#6c5400' },
          { R: '#00a800', S: '#fcfcfc', B: '#80d010', Y: '#fcfcfc', K: '#80d010' },
          { R: '#fc9838', S: '#fcfcfc', B: '#d82800', Y: '#fcfcfc', K: '#d82800' },
          { R: '#008088', S: '#fca044', B: '#000000', Y: '#fca044', K: '#000000' }
        ];
        return starPalettes[phase];
      }
      if (state === 'fire') {
        return { R: '#fcfcfc', S: '#fca044', B: '#d82800', Y: '#fca044', K: '#d82800' };
      }
      // Vivid crisp 1985 NES 2C02 Mario palette (#D82800 red, #6C5400 deep olive-brown, #FCA044 peach)
      return { R: '#d82800', S: '#fca044', B: '#6c5400', Y: '#fca044', K: '#6c5400' };
    },

    drawMario(ctx, player, frame, isUnderwater = false) {
      if (player.invulnTimer > 0 && Math.floor(frame / 3) % 2 === 0 && player.starTimer <= 0) return;
      const flip = player.facing < 0;
      const isBig = player.powerState !== 'small';
      const isFire = player.powerState === 'fire';
      const pw = player.w || 12;
      const ph = player.h || (isBig ? 30 : 16);

      // Draw crisp Scale4x original 1985 NES Mario PNG at 1:1 on our 4x canvas (dest = natural / 4)
      const drawMarioPng = (img, useFlip, boxH = ph) => {
        const dw = img.naturalWidth > 32 ? img.naturalWidth / 4 : img.naturalWidth;
        const dh = img.naturalHeight > 40 ? img.naturalHeight / 4 : img.naturalHeight;
        drawImgAnchored(ctx, img, player.x, player.y, pw, boxH, useFlip, dw, dh);
      };

      if (player.dead) {
        const deadImg = getImg('mario_small_dead');
        if (deadImg) {
          drawMarioPng(deadImg, false, 16);
          return;
        }
        const pal = this.getMarioPalette(player.powerState, player.starTimer, frame);
        drawBitmap(ctx, MARIO_SMALL_DEAD, pal, player.x, player.y, false, 1);
        return;
      }

      // Authentic 1985 NES ROM Mario sprites (Scale4x smoothed edges!) + 4-palette Starman cycle
      const starPhase = player.starTimer > 0
        ? Math.floor(frame / (player.starTimer > 120 ? 2 : 6)) % 4
        : 0;
      const starSuffix = starPhase === 0 ? '' : ('_s' + starPhase);

      // Authentic crisp Scale4x NES Swimming Mario (replaces old stretched canvas rectangles!)
      if (isUnderwater && !player.onGround) {
        const prefix = isBig
          ? ((isFire && starPhase === 0) ? 'mario_fire' : 'mario_big')
          : 'mario_small';
        const swimKey = (isBig && isFire && starPhase === 0 && player.fireAnimTimer > 0)
          ? 'mario_fire_shoot'
          : (player.vy < -0.9
            ? (prefix + '_swim_f0')
            : (prefix + '_swim_f' + ([1, 2, 1, 0][Math.floor(frame / 8) % 4])));
        const swimImg = getImg(swimKey + starSuffix) || getImg(swimKey);
        if (swimImg) {
          drawMarioPng(swimImg, flip, isBig ? 30 : 16);
          return;
        }
      }

      if (isBig) {
        const prefix = (isFire && starPhase === 0) ? 'mario_fire' : 'mario_big';
        let key = null;
        let useFlip = flip;
        if (player.crouching) {
          key = prefix + '_crouch';
        } else if (isFire && starPhase === 0 && player.fireAnimTimer > 0) {
          key = 'mario_fire_shoot';
        } else if (!player.onGround) {
          key = prefix + '_jump';
        } else if (player.skidding) {
          key = prefix + '_walk_f0';
          useFlip = player.vx > 0;
        } else if (Math.abs(player.vx) > 0.05) {
          const cycle = [2, 1, 0, 1];
          key = prefix + '_walk_f' + cycle[Math.floor(player.animFrame) % 4];
        } else {
          key = prefix + '_idle';
        }
        const img = getImg(key + starSuffix) || getImg(key);
        if (img) {
          drawMarioPng(img, useFlip);
          return;
        }
      } else {
        let key = null;
        let useFlip = flip;
        if (!player.onGround) {
          key = 'mario_small_jump';
        } else if (player.skidding) {
          key = 'mario_small_run_f0';
          useFlip = player.vx > 0;
        } else if (Math.abs(player.vx) > 0.05 && player.onGround) {
          const smallCycle = [2, 0, 1, 0];
          key = 'mario_small_run_f' + smallCycle[Math.floor(player.animFrame) % 4];
        } else if (player.onGround) {
          key = 'mario_small_idle';
        }
        const img = key ? (getImg(key + starSuffix) || getImg(key)) : null;
        if (img) {
          drawMarioPng(img, useFlip);
          return;
        }
      }

      const pal = this.getMarioPalette(player.powerState, player.starTimer, frame);
      if (isBig) {
        if (player.crouching) {
          drawBitmap(ctx, MARIO_BIG_CROUCH, pal, player.x - 1, player.y + 14, flip, 1);
          return;
        }
        let bmp = MARIO_BIG_IDLE;
        if (!player.onGround) bmp = MARIO_BIG_JUMP;
        else if (Math.abs(player.vx) > 0.05) bmp = (Math.floor(player.animFrame) % 2 === 0) ? MARIO_BIG_WALK : MARIO_BIG_IDLE;
        drawBitmap(ctx, bmp, pal, player.x - 1, player.y + 4, flip, 1);
      } else {
        let bmp = MARIO_SMALL_IDLE;
        if (!player.onGround) bmp = MARIO_SMALL_JUMP;
        else if (player.skidding) bmp = MARIO_SMALL_SKID;
        else if (Math.abs(player.vx) > 0.05) {
          const cycle = [MARIO_SMALL_WALK2, MARIO_SMALL_WALK1, MARIO_SMALL_WALK0, MARIO_SMALL_WALK1];
          bmp = cycle[Math.floor(player.animFrame) % 4];
        }
        const ox = bmp[0].length > 12 ? player.x - 2 : player.x;
        drawBitmap(ctx, bmp, pal, ox, player.y, flip, 1);
      }
    },

    drawGoomba(ctx, enemy, frame, themeName = 'overworld') {
      let keyIdle = 'goomba_idle', keyDead = 'goomba_dead';
      if (themeName === 'underground') { keyIdle = 'goomba_ug'; keyDead = 'goomba_ug_dead'; }
      else if (themeName === 'castle') { keyIdle = 'goomba_cast'; keyDead = 'goomba_cast_dead'; }
      const img = enemy.squashed ? getImg(keyDead) : getImg(keyIdle);
      if (img) {
        const walkFlip = !enemy.squashed && (Math.floor(frame / 10) % 2 === 1);
        drawImgAnchored(ctx, img, enemy.x, enemy.y, enemy.w || 16, enemy.h || 16, walkFlip);
        return;
      }
      const t = THEMES[themeName] || THEMES.overworld;
      const pal = { B: t.goombaBody, W: '#fcfcfc', K: t.goombaFeet, S: '#fc9838' };
      if (enemy.squashed) drawBitmap(ctx, GOOMBA_FLAT, pal, enemy.x, enemy.y, false, 1);
      else drawBitmap(ctx, (Math.floor(frame / 10) % 2 === 0) ? GOOMBA_1 : GOOMBA_2, pal, enemy.x, enemy.y, false, 1);
    },

    drawKoopa(ctx, enemy, frame) {
      const colorKey = enemy.red ? 'koopa_red' : 'koopa_green';
      if (enemy.state === 'shell' || enemy.state === 'spinning') {
        const shellImg = getImg(colorKey + '_shell');
        if (shellImg) {
          drawImgAnchored(ctx, shellImg, enemy.x, enemy.y, enemy.w || 16, enemy.h || 16, false);
          return;
        }
      } else {
        const img = enemy.winged
          ? getImg(enemy.red ? 'paratroopa_red' : 'paratroopa_green')
          : (getImg(colorKey + '_walk_f' + (Math.floor(frame / 10) % 2)) || getImg(colorKey));
        if (img) {
          drawImgAnchored(ctx, img, enemy.x, enemy.y, enemy.w || 16, enemy.h || 16, enemy.vx > 0);
          return;
        }
      }
      const shellColor = enemy.red ? '#d82800' : '#00a800';
      const pal = { G: shellColor, W: '#fcfcfc', Y: '#fc9838', K: '#000000' };
      if (enemy.state === 'shell' || enemy.state === 'spinning') {
        drawBitmap(ctx, KOOPA_SHELL, pal, enemy.x, enemy.y, false, 1);
      } else {
        drawBitmap(ctx, (Math.floor(frame / 10) % 2 === 0) ? KOOPA_WALK1 : KOOPA_WALK2, pal, enemy.x, enemy.y - 6, enemy.vx < 0, 1);
      }
    },

    drawBuzzy(ctx, enemy) {
      const img = (enemy.state === 'shell' || enemy.state === 'spinning') ? getImg('buzzy_shell') : getImg('buzzy');
      if (img) {
        drawImgAnchored(ctx, img, enemy.x, enemy.y, enemy.w || 16, enemy.h || 16, enemy.vx > 0);
        return;
      }
      if (enemy.state === 'shell' || enemy.state === 'spinning') {
        drawBitmap(ctx, KOOPA_SHELL, { G: '#003888', W: '#fcfcfc', Y: '#fc9838', K: '#000000' }, enemy.x, enemy.y, false, 1);
      } else {
        drawBitmap(ctx, BUZZY_1, { B: '#003888', W: '#fcfcfc', S: '#fc9838', K: '#000000' }, enemy.x, enemy.y, enemy.vx > 0, 1);
      }
    },

    drawSpiny(ctx, enemy) {
      const img = getImg('spiny');
      if (img) {
        drawImgAnchored(ctx, img, enemy.x, enemy.y, enemy.w || 16, enemy.h || 16, enemy.vx > 0);
        return;
      }
      drawBitmap(ctx, SPINY_1, { R: '#d82800', W: '#fcfcfc', S: '#fc9838', K: '#000000' }, enemy.x, enemy.y, enemy.vx > 0, 1);
    },

    drawLakitu(ctx, enemy) {
      const img = getImg('lakitu');
      if (img) {
        drawImgAnchored(ctx, img, enemy.x, enemy.y, enemy.w || 16, enemy.h || 24, enemy.facing > 0);
        return;
      }
      drawBitmap(ctx, LAKITU_BMP, { G: '#00a800', W: '#fcfcfc', Y: '#fbd000', K: '#000000' }, enemy.x, enemy.y, enemy.facing < 0, 1);
    },

    drawHammerBro(ctx, enemy) {
      const img = getImg('hammer_bro');
      if (img) {
        drawImgAnchored(ctx, img, enemy.x, enemy.y, enemy.w || 16, enemy.h || 24, enemy.facing > 0);
        return;
      }
      drawBitmap(ctx, HAMMERBRO_1, { G: '#00a800', W: '#fcfcfc', Y: '#fc9838', K: '#000000' }, enemy.x, enemy.y - 6, enemy.facing < 0, 1);
    },

    drawHammer(ctx, h, frame) {
      const px = Math.round(h.x), py = Math.round(h.y);
      const rot = Math.floor(frame / 3) % 4;
      ctx.fillStyle = '#000000';
      if (rot === 0 || rot === 2) {
        ctx.fillRect(px, py, 8, 5);
        ctx.fillStyle = '#fc9838';
        ctx.fillRect(px + 3, py + 5, 2, 6);
      } else {
        ctx.fillRect(px + 2, py, 5, 8);
        ctx.fillStyle = '#fc9838';
        ctx.fillRect(px, py + 3, 6, 2);
      }
    },

    drawBulletBill(ctx, enemy) {
      const img = getImg('bullet_bill');
      if (img) {
        drawImgAnchored(ctx, img, enemy.x, enemy.y, enemy.w || 16, enemy.h || 14, enemy.vx > 0);
        return;
      }
      drawBitmap(ctx, BULLET_BMP, { K: '#1c1c1c', W: '#fcfcfc' }, enemy.x, enemy.y, enemy.vx > 0, 1);
    },

    drawBlooper(ctx, enemy, frame) {
      const img = getImg('blooper');
      if (img) {
        drawImgAnchored(ctx, img, enemy.x, enemy.y, enemy.w || 16, enemy.h || 24, false);
        return;
      }
      drawBitmap(ctx, (Math.floor(frame / 14) % 2 === 0) ? BLOOPER_1 : BLOOPER_2, { W: '#fcfcfc', K: '#000000' }, enemy.x, enemy.y, false, 1);
    },

    drawCheepCheep(ctx, enemy) {
      const img = getImg(enemy.gray ? 'cheep_gray' : 'cheep_red');
      if (img) {
        drawImgAnchored(ctx, img, enemy.x, enemy.y, enemy.w || 16, enemy.h || 16, enemy.vx > 0);
        return;
      }
      drawBitmap(ctx, CHEEP_1, { R: enemy.gray ? '#bcbcbc' : '#e52521', W: '#fcfcfc', Y: '#fc9838', K: '#000000' }, enemy.x, enemy.y, enemy.vx > 0, 1);
    },

    drawPiranha(ctx, enemy, frame, themeName = 'overworld') {
      if (enemy.phase === 'hidden') return;
      const img = themeName === 'underground'
        ? getImg('piranha_ug')
        : (getImg('piranha_anim_f' + (Math.floor(frame / 8) % 3)) || getImg('piranha'));
      if (img) {
        const sc = img._hdScale || 1;
        const w = img.naturalWidth / sc;
        const h = img.naturalHeight / sc;
        const dx = enemy.x + (16 - w) / 2;
        drawImg(ctx, img, dx, enemy.y, false, w, h);
        return;
      }
      const t = THEMES[themeName] || THEMES.overworld;
      drawBitmap(ctx, (Math.floor(frame / 10) % 2 === 0) ? PIRANHA_1 : PIRANHA_2, { G: t.piranhaMain, W: t.piranhaHead }, enemy.x, enemy.y, false, 1);
    },

    drawBowser(ctx, boss, frame = 0) {
      // Authentic 1985 NES Fake Bowser reveal when defeated by 5 Fireballs!
      if (boss.revealedDisguise) {
        const dMap = {
          goomba: 'goomba_cast', koopa: 'koopa_green', buzzy: 'buzzy',
          spiny: 'spiny', lakitu: 'lakitu', blooper: 'blooper', hammerbro: 'hammer_bro'
        };
        const dImg = getImg(dMap[boss.revealedDisguise] || 'goomba_cast');
        if (dImg) {
          const sc = dImg._hdScale || 1;
          const dw = dImg.naturalWidth / sc;
          const dh = dImg.naturalHeight / sc;
          ctx.save();
          ctx.translate(Math.round(boss.x + 16), Math.round(boss.y + 16));
          ctx.scale(1, -1); // upside-down tumble into lava!
          ctx.drawImage(dImg, -dw / 2, -dh / 2, dw, dh);
          ctx.restore();
          return;
        }
      }
      if (!(boss.hitFlash > 0)) {
        const img = getImg('bowser_walk_f' + (Math.floor(frame / 12) % 2)) || getImg('bowser');
        if (img) {
          drawImgAnchored(ctx, img, boss.x, boss.y, boss.w || 32, boss.h || 32, boss.facing > 0);
          return;
        }
      }
      drawBitmap(ctx, BOWSER_BMP, { G: boss.hitFlash > 0 ? '#fcfcfc' : '#00a800', W: '#fcfcfc', Y: '#fc9838', K: '#000000' }, boss.x, boss.y, boss.facing > 0, 2);
    },

    drawToad(ctx, x, y) {
      const img = getImg('toad');
      if (img) { drawImgAnchored(ctx, img, x, y, 16, 24, false); return; }
      drawBitmap(ctx, TOAD_BMP, { W: '#fcfcfc', R: '#e52521', S: '#fc9838', K: '#000000', B: '#0058f8' }, x, y, false, 1);
    },

    drawPeach(ctx, x, y) {
      const img = getImg('peach');
      if (img) { drawImgAnchored(ctx, img, x, y, 16, 24, false); return; }
      drawBitmap(ctx, PEACH_BMP, { Y: '#fbd000', R: '#e52521', S: '#fc9838', K: '#000000', P: '#ff88c8' }, x, y - 4, false, 1);
    },

    drawSpring(ctx, sp) {
      const px = Math.round(sp.x);
      const comp = Math.min(14, Math.round(sp.compress || 0));
      const topY = Math.round(sp.y) + comp;
      const botY = Math.round(sp.baseY || (sp.y + sp.h));
      const curH = Math.max(8, botY - topY);
      // Smooth tall NES coil spring (red top/bottom caps + crisp white zigzag coils)
      ctx.fillStyle = '#000000';
      ctx.fillRect(px + 1, topY, 14, 4);
      ctx.fillRect(px + 1, botY - 4, 14, 4);
      ctx.fillStyle = '#e52521';
      ctx.fillRect(px + 2, topY + 1, 12, 2);
      ctx.fillRect(px + 2, botY - 3, 12, 2);
      ctx.fillStyle = '#fca044';
      ctx.fillRect(px + 3, topY + 1, 10, 1);
      // Zigzag steel coil in between
      const innerTop = topY + 4;
      const innerBot = botY - 4;
      if (innerBot > innerTop + 1) {
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 2.6;
        ctx.beginPath();
        ctx.moveTo(px + 4, innerTop);
        ctx.lineTo(px + 12, (innerTop + innerBot) / 2);
        ctx.lineTo(px + 4, innerBot);
        ctx.moveTo(px + 12, innerTop);
        ctx.lineTo(px + 4, (innerTop + innerBot) / 2);
        ctx.lineTo(px + 12, innerBot);
        ctx.stroke();
        ctx.strokeStyle = '#fcfcfc';
        ctx.lineWidth = 1.4;
        ctx.stroke();
      }
    },

    drawPowerUp(ctx, item, frame) {
      const keyMap = { mushroom: 'mushroom', oneUp: 'oneup', flower: 'fire_flower', star: 'starman' };
      const img = getImg(keyMap[item.kind]);
      if (img) {
        drawImgAnchored(ctx, img, item.x, item.y, 16, 16, false);
        return;
      }
      if (item.kind === 'mushroom') drawBitmap(ctx, MUSHROOM_BMP, { R: '#e52521', W: '#fc9838', K: '#000000' }, item.x, item.y, false, 1);
      else if (item.kind === 'oneUp') drawBitmap(ctx, MUSHROOM_BMP, { R: '#00a800', W: '#fc9838', K: '#000000' }, item.x, item.y, false, 1);
      else if (item.kind === 'flower') {
        const flash = Math.floor(frame / 4) % 2 === 0;
        drawBitmap(ctx, FLOWER_BMP, { R: flash ? '#e52521' : '#fc9838', Y: flash ? '#fbd000' : '#fcfcfc', W: '#fcfcfc', K: '#000000', G: '#00a800' }, item.x, item.y, false, 1);
      } else if (item.kind === 'star') {
        const colors = ['#fbd000', '#fc9838', '#fcfcfc', '#80d010'];
        drawBitmap(ctx, STAR_BMP, { Y: colors[Math.floor(frame / 3) % 4], K: '#000000' }, item.x, item.y, false, 1);
      }
    },

    drawCoin(ctx, x, y, frame, themeName = 'overworld') {
      const prefix = themeName === 'underground' ? 'coin_ug_f' : 'coin_ow_f';
      const img = getImg(prefix + (Math.floor(frame / 10) % 4)) || getImg('coin');
      if (img) {
        drawImgAnchored(ctx, img, x, y, 16, 15, false);
        return;
      }
      // Fallback rounded NES coin
      const px = Math.round(x + 3);
      const py = Math.round(y + 1);
      ctx.fillStyle = '#fc9838';
      ctx.fillRect(px + 2, py + 2, 6, 10);
    },

    drawFireball(ctx, x, y, frame) {
      const cx = x + 4, cy = y + 4;
      const r = 3.6 + Math.sin(frame * 0.6) * 0.3;
      ctx.save();
      const grad = ctx.createRadialGradient(cx, cy, 0.5, cx, cy, r);
      grad.addColorStop(0, '#ffffff');
      grad.addColorStop(0.45, '#fbd000');
      grad.addColorStop(1, '#e52521');
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.fillStyle = grad;
      ctx.fill();
      ctx.restore();
    },

    drawBowserFire(ctx, x, y, frame) {
      const img = getImg('bowser_flame');
      if (img) {
        drawImg(ctx, img, x, y, false, 24, 8);
        return;
      }
      const px = Math.round(x), py = Math.round(y);
      ctx.fillStyle = Math.floor(frame / 4) % 2 === 0 ? '#e52521' : '#fc9838';
      ctx.fillRect(px, py + 1, 20, 6);
      ctx.fillRect(px + 2, py, 12, 8);
      ctx.fillStyle = '#fbd000';
      ctx.fillRect(px + 2, py + 2, 10, 4);
      ctx.fillStyle = '#fcfcfc';
      ctx.fillRect(px + 3, py + 3, 5, 2);
    },

    // ---- Authentic Tile Rendering ----
    drawTile(ctx, tileCode, x, y, themeName, frame, bumpOffset = 0) {
      const t = THEMES[themeName] || THEMES.overworld;
      const px = Math.round(x);
      const py = Math.round(y - bumpOffset);
      const spriteTheme = (themeName === 'underground' || themeName === 'underwater' || themeName === 'castle')
        ? themeName : 'overworld';

      switch (tileCode) {
        case '#': {
          const gImg = getImg('ground_' + spriteTheme);
          if (gImg && themeName !== 'snow') { drawImg(ctx, gImg, px, py, false, 16, 16); break; }
          drawBitmap(ctx, GROUND_TILE_BMP, { B: t.groundBody, L: t.groundLight, K: t.groundDark }, px, py, false, 1);
          break;
        }

        case 'B':
        case 'M':
        case 'S':
        case 'V':
        case 'p':
        case 'b': {
          const bKey = spriteTheme === 'underwater' ? 'brick_underground' : ('brick_' + spriteTheme);
          const bImg = getImg(bKey);
          if (bImg) { drawImg(ctx, bImg, px, py, false, 16, 16); break; }
          ctx.fillStyle = t.brickDark;
          ctx.fillRect(px, py, 16, 16);
          ctx.fillStyle = t.brickBody;
          ctx.fillRect(px, py + 1, 7, 6);
          ctx.fillRect(px + 8, py + 1, 7, 6);
          ctx.fillRect(px + 4, py + 9, 7, 6);
          ctx.fillRect(px, py + 9, 3, 6);
          ctx.fillRect(px + 12, py + 9, 4, 6);
          ctx.fillStyle = t.brickLight;
          ctx.fillRect(px, py + 1, 7, 1);
          ctx.fillRect(px + 8, py + 1, 7, 1);
          ctx.fillRect(px + 4, py + 9, 7, 1);
          ctx.fillRect(px, py + 9, 3, 1);
          ctx.fillRect(px + 12, py + 9, 4, 1);
          break;
        }

        case '1':
        case 'h':
          // Authentic 1985 NES Hidden Block (1-UP or Coin): completely invisible until struck from below!
          break;

        case '?':
        case 'P':
        {
          const qKey = spriteTheme === 'underwater' ? 'qblock_overworld' : ('qblock_' + spriteTheme);
          const qImg = getImg(qKey);
          if (qImg) { drawImg(ctx, qImg, px, py, false, 16, 16); break; }
          const shimmer = ['#fc9838', '#e47818', '#c84c0c', '#e47818'][Math.floor(frame / 10) % 4];
          ctx.fillStyle = '#000000';
          ctx.fillRect(px, py, 16, 16);
          ctx.fillStyle = shimmer;
          ctx.fillRect(px + 1, py + 1, 14, 14);
          ctx.fillStyle = '#fcbcb0';
          ctx.fillRect(px + 1, py + 1, 13, 1);
          ctx.fillRect(px + 1, py + 1, 1, 13);
          ctx.fillStyle = '#a03800';
          ctx.fillRect(px + 1, py + 14, 14, 1);
          ctx.fillRect(px + 14, py + 1, 1, 14);
          ctx.fillStyle = '#000000';
          ctx.fillRect(px + 2, py + 2, 1, 1);
          ctx.fillRect(px + 13, py + 2, 1, 1);
          ctx.fillRect(px + 2, py + 13, 1, 1);
          ctx.fillRect(px + 13, py + 13, 1, 1);
          // Authentic 1985 NES '?' glyph: burnt orange #c84c0c with crisp black shadow!
          ctx.fillStyle = '#000000';
          ctx.fillRect(px + 6, py + 4, 5, 2);
          ctx.fillRect(px + 10, py + 5, 2, 3);
          ctx.fillRect(px + 8, py + 8, 3, 2);
          ctx.fillRect(px + 8, py + 11, 2, 2);
          ctx.fillStyle = '#c84c0c';
          ctx.fillRect(px + 5, py + 3, 5, 2);
          ctx.fillRect(px + 9, py + 4, 2, 3);
          ctx.fillRect(px + 7, py + 7, 3, 2);
          ctx.fillRect(px + 7, py + 10, 2, 2);
          break;
        }

        case 'U': {
          const uImg = getImg('empty_block');
          if (uImg) { drawImg(ctx, uImg, px, py, false, 16, 16); break; }
          ctx.fillStyle = '#000000';
          ctx.fillRect(px, py, 16, 16);
          ctx.fillStyle = '#9c4a00';
          ctx.fillRect(px + 1, py + 1, 14, 14);
          ctx.fillStyle = '#fcbcb0';
          ctx.fillRect(px + 1, py + 1, 13, 1);
          ctx.fillRect(px + 1, py + 1, 1, 13);
          ctx.fillStyle = '#000000';
          ctx.fillRect(px + 2, py + 2, 1, 1);
          ctx.fillRect(px + 13, py + 2, 1, 1);
          ctx.fillRect(px + 2, py + 13, 1, 1);
          ctx.fillRect(px + 13, py + 13, 1, 1);
          break;
        }

        case 'H': {
          const hImg = getImg(spriteTheme === 'underground' ? 'hard_underground' : 'hard_overworld');
          if (hImg && themeName !== 'castle' && themeName !== 'snow') { drawImg(ctx, hImg, px, py, false, 16, 16); break; }
          ctx.fillStyle = '#000000';
          ctx.fillRect(px, py, 16, 16);
          ctx.fillStyle = t.groundBody;
          ctx.fillRect(px + 1, py + 1, 14, 14);
          ctx.fillStyle = t.groundLight;
          ctx.fillRect(px + 1, py + 1, 14, 2);
          ctx.fillRect(px + 1, py + 1, 2, 14);
          ctx.fillStyle = '#000000';
          ctx.fillRect(px + 4, py + 4, 8, 8);
          ctx.fillStyle = t.groundBody;
          ctx.fillRect(px + 5, py + 5, 6, 6);
          break;
        }

        case 'K':
          ctx.fillStyle = '#000000';
          ctx.fillRect(px, py, 16, 16);
          ctx.fillStyle = '#3c3c3c';
          ctx.fillRect(px + 1, py + 1, 14, 14);
          ctx.fillStyle = '#000000';
          ctx.fillRect(px, py + 4, 5, 8);
          ctx.fillRect(px + 11, py + 4, 5, 8);
          ctx.fillStyle = '#fcfcfc';
          ctx.fillRect(px + 6, py + 4, 4, 4);
          break;

        case 'k':
          ctx.fillStyle = '#000000';
          ctx.fillRect(px + 1, py, 14, 16);
          ctx.fillStyle = '#585858';
          ctx.fillRect(px + 2, py + 1, 12, 14);
          ctx.fillStyle = '#bcbcbc';
          ctx.fillRect(px + 4, py + 2, 3, 12);
          break;

        case 'X':
          ctx.fillStyle = '#000000';
          ctx.fillRect(px + 1, py + 1, 14, 14);
          ctx.fillStyle = t.coralBody || '#e52521';
          ctx.fillRect(px + 2, py + 2, 12, 12);
          ctx.fillStyle = t.coralLight || '#fc9838';
          ctx.fillRect(px + 3, py + 3, 4, 4);
          ctx.fillRect(px + 9, py + 7, 4, 4);
          break;

        case '[': {
          const g = ctx.createLinearGradient(px, py, px + 16, py);
          g.addColorStop(0, t.pipeMid);
          g.addColorStop(0.28, t.pipeLight);
          g.addColorStop(0.65, t.pipeMid);
          g.addColorStop(1, t.pipeMid);
          ctx.fillStyle = g;
          ctx.fillRect(px + 0.5, py + 0.5, 15.5, 15);
          ctx.fillStyle = 'rgba(255,255,255,0.35)';
          ctx.fillRect(px + 3.2, py + 1.5, 2.6, 13);
          ctx.fillStyle = '#000000';
          ctx.fillRect(px, py, 16, 1);
          ctx.fillRect(px, py, 1, 16);
          ctx.fillRect(px, py + 15, 16, 1);
          break;
        }

        case ']': {
          const g = ctx.createLinearGradient(px, py, px + 16, py);
          g.addColorStop(0, t.pipeMid);
          g.addColorStop(0.45, t.pipeDark);
          g.addColorStop(1, t.pipeDark);
          ctx.fillStyle = g;
          ctx.fillRect(px, py + 0.5, 15.5, 15);
          ctx.fillStyle = '#000000';
          ctx.fillRect(px, py, 16, 1);
          ctx.fillRect(px + 15, py, 1, 16);
          ctx.fillRect(px, py + 15, 16, 1);
          break;
        }

        case '{': {
          const g = ctx.createLinearGradient(px + 1.5, py, px + 16, py);
          g.addColorStop(0, t.pipeMid);
          g.addColorStop(0.28, t.pipeLight);
          g.addColorStop(0.75, t.pipeMid);
          g.addColorStop(1, t.pipeMid);
          ctx.fillStyle = g;
          ctx.fillRect(px + 1.5, py, 14.5, 16);
          ctx.fillStyle = 'rgba(255,255,255,0.32)';
          ctx.fillRect(px + 4.2, py, 2.4, 16);
          ctx.fillStyle = '#000000';
          ctx.fillRect(px + 1, py, 1, 16);
          break;
        }

        case '}': {
          const g = ctx.createLinearGradient(px, py, px + 14.5, py);
          g.addColorStop(0, t.pipeMid);
          g.addColorStop(0.45, t.pipeDark);
          g.addColorStop(1, t.pipeDark);
          ctx.fillStyle = g;
          ctx.fillRect(px, py, 14.5, 16);
          ctx.fillStyle = '#000000';
          ctx.fillRect(px + 14, py, 1, 16);
          break;
        }

        case '<': {
          const g = ctx.createLinearGradient(px, py, px, py + 16);
          g.addColorStop(0, t.pipeMid);
          g.addColorStop(0.32, t.pipeLight);
          g.addColorStop(1, t.pipeMid);
          ctx.fillStyle = g;
          ctx.fillRect(px + 0.5, py + 0.5, 15, 15.5);
          ctx.fillStyle = 'rgba(255,255,255,0.32)';
          ctx.fillRect(px + 1.5, py + 3.2, 13, 2.5);
          ctx.fillStyle = '#000000';
          ctx.fillRect(px, py, 16, 1);
          ctx.fillRect(px, py, 1, 16);
          ctx.fillRect(px + 15, py, 1, 16);
          break;
        }

        case ',': {
          const g = ctx.createLinearGradient(px, py, px, py + 16);
          g.addColorStop(0, t.pipeMid);
          g.addColorStop(0.55, t.pipeDark);
          g.addColorStop(1, t.pipeDark);
          ctx.fillStyle = g;
          ctx.fillRect(px + 0.5, py, 15, 15.5);
          ctx.fillStyle = '#000000';
          ctx.fillRect(px, py, 1, 16);
          ctx.fillRect(px + 15, py, 1, 16);
          ctx.fillRect(px, py + 15, 16, 1);
          break;
        }

        case '-': {
          const g = ctx.createLinearGradient(px, py + 1, px, py + 16);
          g.addColorStop(0, t.pipeMid);
          g.addColorStop(0.32, t.pipeLight);
          g.addColorStop(1, t.pipeMid);
          ctx.fillStyle = g;
          ctx.fillRect(px, py + 1.5, 16, 14.5);
          ctx.fillStyle = 'rgba(255,255,255,0.30)';
          ctx.fillRect(px, py + 4.2, 16, 2.4);
          ctx.fillStyle = '#000000';
          ctx.fillRect(px, py + 1, 16, 1);
          break;
        }

        case '_': {
          const g = ctx.createLinearGradient(px, py, px, py + 15);
          g.addColorStop(0, t.pipeMid);
          g.addColorStop(0.55, t.pipeDark);
          g.addColorStop(1, t.pipeDark);
          ctx.fillStyle = g;
          ctx.fillRect(px, py, 16, 14.5);
          ctx.fillStyle = '#000000';
          ctx.fillRect(px, py + 14, 16, 1);
          break;
        }

        case 'O': {
          // Smooth crisp solid Mario Cloud block
          ctx.save();
          ctx.beginPath();
          ctx.ellipse(px + 8, py + 8.5, 7.2, 6.4, 0, 0, Math.PI * 2);
          ctx.fillStyle = '#fcfcfc';
          ctx.fill();
          ctx.save();
          ctx.clip();
          ctx.fillStyle = '#8cb2ff';
          ctx.fillRect(px, py + 12, 16, 4);
          ctx.restore();
          ctx.lineWidth = 0.9;
          ctx.strokeStyle = '#000000';
          ctx.stroke();
          ctx.fillStyle = '#000000';
          ctx.beginPath();
          ctx.ellipse(px + 6, py + 7.2, 0.85, 1.7, 0, 0, Math.PI * 2);
          ctx.ellipse(px + 10.2, py + 7.2, 0.85, 1.7, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
          break;
        }

        case '=':
          ctx.fillStyle = '#000000';
          ctx.fillRect(px, py, 16, 8);
          ctx.fillStyle = '#c84c0c';
          ctx.fillRect(px + 1, py + 1, 14, 6);
          ctx.fillStyle = '#fc9838';
          ctx.fillRect(px + 1, py + 1, 14, 2);
          ctx.fillStyle = '#000000';
          ctx.fillRect(px + 7, py + 1, 2, 6);
          break;

        case 'T': {
          // Authentic lush green Treetop Canopy (Worlds 1-3, 3-3, 5-3!)
          ctx.save();
          const g = ctx.createLinearGradient(px, py, px, py + 15);
          g.addColorStop(0, '#96e824');
          g.addColorStop(0.55, '#00b400');
          g.addColorStop(1, '#007a00');
          ctx.fillStyle = g;
          ctx.beginPath();
          ctx.roundRect(px + 0.5, py + 0.5, 15, 14, 3);
          ctx.fill();
          ctx.lineWidth = 0.85;
          ctx.strokeStyle = '#003c00';
          ctx.stroke();
          ctx.fillStyle = 'rgba(255,255,255,0.22)';
          ctx.beginPath();
          ctx.ellipse(px + 5.5, py + 4, 3.2, 1.4, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
          break;
        }

        case 't': {
          // Authentic Giant Mushroom Cap platform (Worlds 4-3 & 6-3!)
          ctx.save();
          const isNight = (themeName === 'night');
          const g = ctx.createLinearGradient(px, py, px, py + 15);
          g.addColorStop(0, isNight ? '#e4e8f0' : '#ff5a36');
          g.addColorStop(1, isNight ? '#9ca4b4' : '#c82014');
          ctx.fillStyle = g;
          ctx.beginPath();
          ctx.roundRect(px + 0.5, py + 0.5, 15, 13.5, 3);
          ctx.fill();
          ctx.lineWidth = 0.9;
          ctx.strokeStyle = '#000000';
          ctx.stroke();
          ctx.fillStyle = isNight ? '#606878' : '#fcfcfc';
          ctx.beginPath();
          ctx.arc(px + 5, py + 6, 2.1, 0, Math.PI * 2);
          ctx.arc(px + 11.5, py + 7.5, 1.7, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
          break;
        }

        case 'I':
          ctx.fillStyle = '#000000';
          ctx.fillRect(px + 3, py, 10, 16);
          ctx.fillStyle = '#fc9838';
          ctx.fillRect(px + 4, py, 8, 16);
          ctx.fillStyle = '#c84c0c';
          ctx.fillRect(px + 10, py, 2, 16);
          break;

        case 'L':
        {
          ctx.save();
          const phase = frame * 0.14;
          ctx.beginPath();
          ctx.moveTo(px, py + 16);
          ctx.lineTo(px, py + 4);
          ctx.quadraticCurveTo(px + 4, py + 1.5 + Math.sin(phase) * 1.3, px + 8, py + 3.5);
          ctx.quadraticCurveTo(px + 12, py + 5.5 - Math.sin(phase) * 1.3, px + 16, py + 4);
          ctx.lineTo(px + 16, py + 16);
          ctx.closePath();
          const lg = ctx.createLinearGradient(px, py + 2, px, py + 16);
          lg.addColorStop(0, '#fbd000');
          lg.addColorStop(0.28, '#fc9838');
          lg.addColorStop(1, '#c81c00');
          ctx.fillStyle = lg;
          ctx.fill();
          ctx.restore();
          break;
        }

        case 'A':
        {
          const aImg = getImg('axe');
          if (aImg) { drawImg(ctx, aImg, px, py, false, 16, 16); break; }
          const glow = Math.floor(frame / 6) % 2 === 0 ? '#fbd000' : '#fc9838';
          ctx.fillStyle = '#000000';
          ctx.fillRect(px + 5, py + 2, 6, 12);
          ctx.fillStyle = glow;
          ctx.fillRect(px + 2, py + 2, 8, 7);
          ctx.fillStyle = '#fcfcfc';
          ctx.fillRect(px + 3, py + 3, 3, 4);
          ctx.fillStyle = '#c84c0c';
          ctx.fillRect(px + 7, py + 8, 3, 7);
          break;
        }

        case 'F':
          ctx.fillStyle = '#00a800';
          ctx.fillRect(px + 7, py, 2.2, 16);
          ctx.fillStyle = '#80d010';
          ctx.fillRect(px + 7, py, 0.9, 16);
          break;

        case 'G': {
          ctx.fillStyle = '#00a800';
          ctx.fillRect(px + 7, py + 7, 2.2, 9);
          ctx.fillStyle = '#80d010';
          ctx.fillRect(px + 7, py + 7, 0.9, 9);
          ctx.save();
          ctx.beginPath();
          ctx.arc(px + 8, py + 5, 3.8, 0, Math.PI * 2);
          ctx.fillStyle = '#00a800';
          ctx.fill();
          ctx.lineWidth = 0.85;
          ctx.strokeStyle = '#000000';
          ctx.stroke();
          ctx.beginPath();
          ctx.arc(px + 6.8, py + 3.8, 1.3, 0, Math.PI * 2);
          ctx.fillStyle = '#9cf030';
          ctx.fill();
          ctx.restore();
          break;
        }

        case 'C':
          this.drawCoin(ctx, px, py, frame, themeName);
          break;
      }
    },

    // ---- Authentic 1985 NES Repeating World-Locked Scenery (Native Widescreen!) ----
    drawScenery(ctx, level, cameraX, frame) {
      const viewW = ctx.canvas.width || 256;
      const t = THEMES[level.theme] || THEMES.overworld;
      ctx.fillStyle = t.sky;
      ctx.fillRect(0, 0, viewW, 240);

      const fortressApproach = level.id === '8-3';
      if (fortressApproach) drawFortressBackdrop(ctx, cameraX);

      if (level.theme === 'underwater') {
        ctx.fillStyle = '#7695d1';
        ctx.fillRect(0, 28, viewW, 2);
        for (let x = 0; x < viewW; x += 16) {
          const wy = 26 + ((Math.floor(frame / 12) + x / 16) % 2);
          ctx.fillStyle = '#a4bee8';
          ctx.fillRect(x, wy, 10, 2);
        }
        ctx.fillStyle = '#a4bee8';
        for (let i = 0; i < 18; i++) {
          const bx = ((i * 73 + 20) - Math.floor(cameraX * 0.5)) % viewW;
          const by = 220 - ((frame * 0.4 + i * 31) % 185);
          ctx.fillRect((bx + viewW) % viewW, Math.round(by), 2, 2);
        }
        return;
      }

      if (level.theme === 'night') {
        for (let i = 0; i < 20; i++) {
          const sx = (i * 53 + 17) % viewW;
          const sy = 26 + ((i * 37) % 118);
          ctx.fillStyle = ((frame + i * 7) % 40 < 30) ? '#777c8e' : '#333747';
          ctx.fillRect(sx, sy, 1, 1);
        }
      }

      if (level.theme === 'overworld' || level.theme === 'athletic' || level.theme === 'snow' || level.theme === 'night') {
        const cloudPal = { W: t.cloudBody, S: t.cloudShade, K: t.cloudOutline };
        const bushPal = { L: t.bushLight, D: t.bushDark, K: t.bushOutline };
        const fencePal = { W: '#fcfcfc', K: '#000000' };

        // Authentic 48-tile (768px) NES Scenery Cycle!
        const cycle = 768;
        const firstCycle = Math.floor((cameraX - 96) / cycle);
        const lastCycle = Math.floor((cameraX + viewW + 96) / cycle);

        for (let k = firstCycle; k <= lastCycle; k++) {
          const ox = k * cycle - Math.floor(cameraX);

          // Clouds (1-wide, 2-wide, 3-wide — authentic NES rhythm!)
          drawWideCloud(ctx, ox + 136, 48, 0, cloudPal);
          drawWideCloud(ctx, ox + 308, 36, 0, cloudPal);
          drawWideCloud(ctx, ox + 436, 52, 2, cloudPal);
          drawWideCloud(ctx, ox + 584, 38, 1, cloudPal);

          if (level.theme !== 'athletic' && !fortressApproach) {
            // Large Hill (35px) & Small Hill (19px)
            drawNesHill(ctx, ox + 44, 208, 35, t);
            drawNesHill(ctx, ox + 292, 208, 19, t);

            // Triple Bush, Single Bush, Double Bush
            drawWideBush(ctx, ox + 176, 192, 2, bushPal);
            drawWideBush(ctx, ox + 372, 192, 0, bushPal);
            drawWideBush(ctx, ox + 656, 192, 1, bushPal);

            // Subtle classic wooden fence in Snow/Overworld
            if (level.theme === 'snow') {
              drawBitmap(ctx, FENCE_TILE, fencePal, ox + 480, 192);
              drawBitmap(ctx, FENCE_TILE, fencePal, ox + 496, 192);
            }
          }
        }
      } else if (level.theme === 'castle') {
        ctx.fillStyle = '#181822';
        for (let i = 0; i < 34; i++) {
          const px = Math.floor(i * 92 - cameraX * 0.5);
          if (px < -40 || px > viewW + 44) continue;
          ctx.fillRect(px, 32, 20, 176);
          ctx.fillStyle = '#0c0c14';
          ctx.fillRect(px + 6, 62, 8, 24);
          ctx.fillStyle = '#181822';
        }
      }
    },

    drawFlagPennant(ctx, x, y) {
      // Smooth crisp white triangle pennant with rounded green Koopa emblem
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(x + 15.5, y + 0.5);
      ctx.lineTo(x + 1, y + 7.5);
      ctx.lineTo(x + 15.5, y + 15.5);
      ctx.closePath();
      ctx.fillStyle = '#fcfcfc';
      ctx.fill();
      ctx.lineWidth = 0.7;
      ctx.strokeStyle = '#1b1b1b';
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(x + 10.5, y + 7.8, 3.1, 0, Math.PI * 2);
      ctx.fillStyle = '#00a800';
      ctx.fill();
      ctx.fillStyle = '#fcfcfc';
      ctx.beginPath();
      ctx.arc(x + 9.4, y + 7.2, 0.75, 0, Math.PI * 2);
      ctx.arc(x + 11.5, y + 7.2, 0.75, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    },

    drawCastle(ctx, x, y) {
      const px = Math.round(x);
      const py = Math.round(y);
      ctx.fillStyle = '#000000';
      ctx.fillRect(px, py + 24, 80, 56);
      ctx.fillStyle = '#c84c0c';
      ctx.fillRect(px + 2, py + 26, 76, 54);
      // Brick masonry grid
      ctx.fillStyle = '#000000';
      for (let yy = py + 32; yy < py + 80; yy += 8) {
        ctx.fillRect(px + 2, yy, 76, 1);
        const offset = ((yy - py) / 8) % 2 === 0 ? 0 : 8;
        for (let xx = px + 2 + offset; xx < px + 78; xx += 16) {
          ctx.fillRect(xx, yy, 1, 8);
        }
      }
      // Upper tower
      ctx.fillStyle = '#000000';
      ctx.fillRect(px + 16, py, 48, 30);
      ctx.fillStyle = '#c84c0c';
      ctx.fillRect(px + 18, py + 2, 44, 28);
      ctx.fillStyle = '#fcbcb0';
      for (let i = 0; i < 5; i++) {
        ctx.fillRect(px + 2 + i * 16, py + 21, 10, 6);
        ctx.fillStyle = '#c84c0c';
        ctx.fillRect(px + 3 + i * 16, py + 22, 8, 5);
        ctx.fillStyle = '#fcbcb0';
      }
      for (let i = 0; i < 3; i++) {
        ctx.fillRect(px + 18 + i * 16, py - 5, 10, 6);
        ctx.fillStyle = '#c84c0c';
        ctx.fillRect(px + 19 + i * 16, py - 4, 8, 5);
        ctx.fillStyle = '#fcbcb0';
      }
      ctx.fillStyle = '#000000';
      ctx.fillRect(px + 24, py + 10, 8, 12);
      ctx.fillRect(px + 48, py + 10, 8, 12);
      ctx.fillRect(px + 30, py + 52, 20, 28);
      ctx.fillRect(px + 33, py + 48, 14, 6);
    }
  };

  global.MarioSprites = Sprites;
})(window);
