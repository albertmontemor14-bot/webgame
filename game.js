(function () {
  "use strict";
  var $ = function (id) { return document.getElementById(id); };
  var world = $("world"), mapEl = $("map"), ctx = mapEl.getContext("2d");
  var overEl = $("over"), bannerEl = $("banner"), fadeEl = $("fade"), infoEl = $("info"), hpEl = $("hp");

  /* ============================================================
     PIXEL ART: text maps turned into crisp SVG pictures
     ============================================================ */
  function pix(map, pal, s) {
    var W = 0, i;
    for (i = 0; i < map.length; i++) W = Math.max(W, map[i].length);
    var h = map.length, out = "";
    for (var y = 0; y < h; y++) {
      var row = map[y] + new Array(W - map[y].length + 1).join(".");
      var x = 0;
      while (x < W) {
        var c = row[x];
        if (c === ".") { x++; continue; }
        var x2 = x;
        while (x2 < W && row[x2] === c) x2++;
        out += '<rect x="' + x + '" y="' + y + '" width="' + (x2 - x) + '" height="1" fill="' + pal[c] + '"/>';
        x = x2;
      }
    }
    return '<svg xmlns="http://www.w3.org/2000/svg" width="' + (W * s) + '" height="' + (h * s) +
      '" viewBox="0 0 ' + W + ' ' + h + '" shape-rendering="crispEdges">' + out + '</svg>';
  }
  function svgImage(svg) {
    var img = new Image();
    img.src = "data:image/svg+xml;utf8," + encodeURIComponent(svg);
    return img;
  }

  var PAL = {
    k: "#1a1426", s: "#f2c9a0", S: "#d9a273", h: "#5a3216", H: "#8a5a2b", e: "#1a1426", w: "#ffffff",
    a: "#3b6fd4", A: "#264a99", B: "#7fa8ff", g: "#ffd84a", G: "#c9a227",
    n: "#2e3560", N: "#1f2447", l: "#7a4a26", L: "#4a2a12", r: "#d23b43", R: "#8f2229",
    f: "#f4f8fc", F: "#a9b6c8"
  };
  var BODY = [
    "...kkkkkk...", "..khhhhhhk..", ".khHhhhhhhk.", ".khhhhssssk.", ".khhssswesk.", "..ksssssssk.",
    "...ksssssk..", "....kssk....", ".kaBBaaaaAk.", ".kaBaaggaAk.", ".kaaaaggaAk.", ".kaaaaaaaAk.",
    ".kgggGggggk.", ".knnnnnnnnk."
  ];
  var LEG = ["knnnnk.", "knnnNk.", "knnnNk.", "kllllk.", "kllllk.", "kllllLk", "kLLLLLk", "kkkkkkk"];
  var CAPE = ["krrRRk", "krrRRk", "krrRRk", "krrRRk", "krrRRk", "krRRRk", "krRRRk", "kRRRRk", "kRRRk.", "kkkk.."];
  var ARM = ["kBak", "kaak", "kaAk", "kaAk", "kssk", "kkkk"];
  var SWORD = ["...kk..."];
  for (var i = 0; i < 15; i++) SWORD.push("..kfFk..");
  SWORD.push("kggggggk", "..klLk..", "..klLk..", "..klLk..", "..kggk..");
  var PISTOL = ["kkkkkkkk", "kfFFFFfk", "kkkkkkkk", "kllk....", "kLLk....", "kkkk...."];

  var HEART = [".kkk.kkk.", "kwRRkRRRk", "kRRRRRRDk", "kRRRRRRDk", ".kRRRRDk.", "..kRRDk..", "...kRk...", "....k...."];
  var HEART_SVG = pix(HEART, { k: "#000000", R: "#ff3b3b", D: "#c21414", w: "#ffd0d0" }, 4);

  /* zombie: green skin, torn shirt, arms stretched out in front (faces right) */
  var ZPAL = { k: "#101a12", g: "#7fbf5a", G: "#5e9a42", y: "#ffe14a", e: "#1a1426", m: "#5a1020",
    b: "#6b7f9a", B: "#4a5a70", p: "#4a3a6a", P: "#34284d" };
  var ZOMBIE = [
    "...kkkkkk", "..kggggggk", ".kgGggggGgk", ".kgyegyegk", ".kggggggggk", "..kgmmmmgk", "...kggggk",
    "..kbbbbbbbk", ".kbbbbbbbbkggggk", ".kbbBbbbbbbkkkkk", ".kbbbbbbbbk", ".kBbbbbbBBk",
    ".kppppppppk", ".kpppkkpppk", ".kpppk.kpppk", ".kpppk.kpppk", ".kkkkk.kkkkk"
  ];
  var ZOMBIE_SVG = pix(ZOMBIE, ZPAL, 4);

  $("heart").innerHTML = HEART_SVG;
  $("ldheart").innerHTML = HEART_SVG;

  /* ============================================================
     SHARED STATE
     ============================================================ */
  var CASTLES = [
    { name: "Castle of Limits",    map: 0, tx: 7,  ty: 15, waves: [4, 6],         speed: [40, 62], hp: 3 },
    { name: "Castle of Slopes",    map: 0, tx: 18, ty: 9,  waves: [5, 8, 10],     speed: [48, 72], hp: 3 },
    { name: "Castle of Integrals", map: 0, tx: 30, ty: 15, waves: [6, 10, 14, 18], speed: [55, 88], hp: 4 },
    { name: "Castle of Series",    map: 1, tx: 12, ty: 14, waves: [8, 12, 16],    speed: [60, 95], hp: 5, ice: true },
    { name: "Castle of Infinity",  map: 1, tx: 27, ty: 8,  waves: [10, 14],       speed: [65, 100], hp: 5, ice: true, boss: true }
  ];
  var cleared = [false, false, false, false, false];
  var SV = { coins: 0, up: {}, chests: {}, talked: {} };
  try {
    var sv = JSON.parse(localStorage.getItem("mk-save") || "{}"); for (var q in sv) SV[q] = sv[q];
    var sc = JSON.parse(localStorage.getItem("mk-cleared") || "[]"); for (var ci = 0; ci < 5; ci++) cleared[ci] = !!sc[ci];
  } catch (e) {}
  function save() { try { localStorage.setItem("mk-save", JSON.stringify(SV)); } catch (e) {} }
  function saveCleared() { try { localStorage.setItem("mk-cleared", JSON.stringify(cleared)); } catch (e) {} }
  function lv(k) { return SV.up[k] || 0; }
  function maxhp() { return 100 + 20 * lv("hp"); }
  function magSize() { return 12 + 4 * lv("mag"); }

  var mode = "map";                // "map" or "castle"
  var started = false;             // set when the loading screen is dismissed
  var keys = { left: false, right: false, up: false, down: false };
  var MAXHP = 100;
  var P = { x: 80, y: 0, vy: 0, dir: 1, hp: 100, max: 100, inv: 0, atk: 0, ammo: 12, mag: 12, reload: 0, aimT: 0, flashT: 0, shotCd: 0 };
  var zombies = [], bullets = [];
  var C = null;                    // current castle fight
  var stepT = 0, over = false, time = 0;

  function sfx(name) { if (window.SFX) SFX.play(name); }
  function isDark() {
    var r = document.documentElement, t = r.getAttribute("data-theme");
    return t === "dark" || (!t && window.matchMedia("(prefers-color-scheme: dark)").matches);
  }

  /* ---------- health bar: heart + 4 segments ---------- */
  function drawHealth() {
    var segs = $("bar").children, per = P.max / segs.length;
    for (var i = 0; i < segs.length; i++) {
      var f = Math.max(0, Math.min(1, (P.hp - i * per) / per));
      segs[i].firstChild.style.width = (f * 100) + "%";
    }
    hpEl.classList.toggle("low", P.hp > 0 && P.hp <= P.max * 0.25);
    hpEl.setAttribute("aria-label", "Health " + Math.ceil(P.hp) + " of " + P.max);
  }

  function banner(text) {
    bannerEl.textContent = text;
    bannerEl.classList.remove("show");
    void bannerEl.offsetWidth;
    bannerEl.classList.add("show");
  }

  /* ============================================================
     OVERWORLD MAP
     ============================================================ */
  var COLS = 36, ROWS = 22, T = 32;
  var GRASS = 0, WATER = 1, TREE = 2, PATH = 3, ROCK = 4, BRIDGE = 6, DOOR = 7, WALL = 8;
  var tiles = [], doorAt = {};
  var curMap = 0, BM, ui = null, talk = null, warp = false, ents = [], nearE = null;
  var BIOMES = [
    { name: "Greenlands", g1: "#4caf3a", g2: "#47a736", w1: "#2f7fd6", w2: "#3589dd", path: "#d9ad6e", snow: false, trees: 0.26, seed: 7,
      start: { x: 4, y: 11 }, lakes: [[12, 5, 2.6], [22, 18, 2.6], [26, 6, 2.2], [11, 12, 2]] },
    { name: "Frozen Tundra", g1: "#eef5fa", g2: "#e1ecf5", w1: "#3f86c4", w2: "#4a92cf", path: "#bfae96", snow: true, trees: 0.24, seed: 21,
      start: { x: 7, y: 16 }, lakes: [[8, 7, 2.4], [20, 11, 2.2], [31, 17, 2.6], [16, 4, 2]] }
  ];
  var MAPOBJ = [
    { chests: [[9, 9], [15, 13], [24, 13], [31, 11], [20, 5]], npcs: [
      { tx: 7, ty: 10, name: "Blacksmith Gauss", col: "#c0504d", hair: "#444", shop: true, lines: ["Welcome, hero! Bring coins and I will make you stronger.", "I can upgrade your armor, boots, sword and pistol."] },
      { tx: 14, ty: 14, name: "Villager Euler", col: "#3aa845", hair: "#8a5a2b", gift: 10, lines: ["Zombies drop coins. Collect them to buy upgrades!", "Chests hide around the map. Press E next to one."] },
      { tx: 20, ty: 13, name: "Prof. Newton", col: "#7a4ad1", hair: "#eeeeee", gift: 20, lines: ["The derivative is the slope at a single point.", "Clear all three castles to open the portal in the east."] }
    ] },
    { chests: [[8, 10], [17, 13], [22, 14], [32, 12], [21, 5]], npcs: [
      { tx: 7, ty: 13, name: "Frost Smith Taylor", col: "#4a8fd1", hair: "#ffffff", shop: true, lines: ["Brrr! Even forges freeze here.", "Upgrade yourself before the final castle."] },
      { tx: 19, ty: 14, name: "Hermit Maclaurin", col: "#8a6a4a", hair: "#cccccc", gift: 25, lines: ["Every smooth curve is a sum of tiny pieces.", "Lord Infinity waits in the north-east castle. Be ready!"] }
    ] }
  ];
  var PORTALS = [
    { map: 0, tx: 33, ty: 16, to: 1, sx: 6,  sy: 16, lock: true, push: -56, label: "Frozen Tundra" },
    { map: 1, tx: 4,  ty: 16, to: 0, sx: 31, sy: 16, push: 0,   label: "Greenlands" }
  ];
  var START = BIOMES[0].start;

  function buildMap(m) {
    BM = BIOMES[m]; tiles = []; doorAt = {};
    var seed = BM.seed;
    function rnd() { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; }
    var x, y, k;
    for (y = 0; y < ROWS; y++) {
      tiles[y] = [];
      for (x = 0; x < COLS; x++) {
        var d = Math.min(x, y, COLS - 1 - x, ROWS - 1 - y);
        tiles[y][x] = (d < 2 || (d === 2 && rnd() < 0.5)) ? WATER : GRASS;
      }
    }
    var lakes = BM.lakes;
    lakes.forEach(function (l) {
      for (y = 0; y < ROWS; y++) for (x = 0; x < COLS; x++) {
        var dx = x - l[0], dy = y - l[1];
        if (Math.sqrt(dx * dx + dy * dy) < l[2] + rnd() * 0.6) tiles[y][x] = WATER;
      }
    });
    /* castle footprints: 5 wide, 4 tall, door in the bottom middle */
    var keep = {};
    CASTLES.forEach(function (c, idx) {
      if (c.map !== m) return;
      for (y = c.ty - 3; y <= c.ty; y++) for (x = c.tx - 2; x <= c.tx + 2; x++) tiles[y][x] = WALL;
      tiles[c.ty][c.tx] = DOOR;
      doorAt[c.tx + "," + c.ty] = idx;
      for (y = c.ty - 4; y <= c.ty + 2; y++) for (x = c.tx - 3; x <= c.tx + 3; x++) keep[x + "," + y] = true;
    });
    /* paths (2 tiles wide), bridges where they cross water */
    function lay(x1, y1, x2, y2) {
      var sx = x1 < x2 ? 1 : -1, sy = y1 < y2 ? 1 : -1;
      for (x = x1; x !== x2 + sx; x += sx) { put(x, y1); put(x, y1 + 1); }
      for (y = y1; y !== y2 + sy; y += sy) { put(x2, y); put(x2 + 1, y); }
    }
    function put(px, py) {
      if (px < 1 || py < 1 || px >= COLS - 1 || py >= ROWS - 1) return;
      var t = tiles[py][px];
      if (t === WALL || t === DOOR) return;
      tiles[py][px] = (t === WATER) ? BRIDGE : PATH;
      keep[px + "," + py] = true;
    }
    if (m === 0) { lay(4, 11, 4, 16); lay(4, 16, 7, 16); lay(7, 16, 32, 16); lay(18, 16, 18, 10); }
    else { lay(4, 16, 27, 16); lay(12, 16, 12, 15); lay(27, 16, 27, 9); }
    /* trees, rocks */
    for (y = 0; y < ROWS; y++) for (x = 0; x < COLS; x++) {
      if (tiles[y][x] !== GRASS || keep[x + "," + y]) continue;
      if (Math.abs(x - BM.start.x) < 3 && Math.abs(y - BM.start.y) < 3) continue;
      var r = rnd();
      if (r < BM.trees) tiles[y][x] = TREE; else if (r < BM.trees + 0.03) tiles[y][x] = ROCK;
    }
    var o = MAPOBJ[m];
    ents = o.chests.map(function (p, i) { return { tx: p[0], ty: p[1], id: "c" + m + "_" + i, chest: true }; })
      .concat(o.npcs.map(function (n, i) { n.id = "n" + m + "_" + i; return n; }));
    ents.forEach(function (e) {
      [[0, 0], [1, 0], [-1, 0], [0, 1], [0, -1]].forEach(function (d) {
        var tx = e.tx + d[0], ty = e.ty + d[1], t = tiles[ty][tx];
        if (t === WATER || t === TREE || t === ROCK) tiles[ty][tx] = GRASS;
      });
    });
  }
  buildMap(0);

  function solidTile(tx, ty) {
    if (tx < 0 || ty < 0 || tx >= COLS || ty >= ROWS) return true;
    for (var ei = 0; ei < ents.length; ei++) if (ents[ei].tx === tx && ents[ei].ty === ty) return true;
    var t = tiles[ty][tx];
    return t === WATER || t === TREE || t === ROCK || t === WALL;
  }

  var hero = { x: START.x * T + 16, y: START.y * T + 28, dir: 1, walk: 0, moving: false };
  var heroImgs = { body: svgImage(pix(BODY, PAL, 1)), leg: svgImage(pix(LEG, PAL, 1)), cape: svgImage(pix(CAPE, PAL, 1)) };

  function hash(x, y) { var h = (x * 73856093) ^ (y * 19349663); h = (h ^ (h >>> 13)) >>> 0; return h; }

  function drawTile(x, y, px, py) {
    var t = tiles[y][x], h = hash(x, y), c = ctx, i;
    var isWaterish = (t === WATER || t === BRIDGE);
    if (isWaterish) {
      c.fillStyle = ((x + y) & 1) ? BM.w1 : BM.w2;
      c.fillRect(px, py, T, T);
      var wv = Math.floor(time * 6 + (h % 8)) % 8;
      c.fillStyle = "rgba(255,255,255,.35)";
      c.fillRect(px + 4 + wv * 2, py + 8 + (h % 3) * 8, 8, 2);
      c.fillRect(px + 16 - wv, py + 22, 6, 2);
      c.fillStyle = "#e8f6ff";
      if (t === WATER) {
        if (y > 0 && !isW(x, y - 1)) c.fillRect(px, py, T, 3);
        if (y < ROWS - 1 && !isW(x, y + 1)) c.fillRect(px, py + T - 3, T, 3);
        if (x > 0 && !isW(x - 1, y)) c.fillRect(px, py, 3, T);
        if (x < COLS - 1 && !isW(x + 1, y)) c.fillRect(px + T - 3, py, 3, T);
      }
      if (t === BRIDGE) {
        c.fillStyle = "#8a5a33"; c.fillRect(px, py + 2, T, T - 4);
        c.fillStyle = "#6b4425";
        for (i = 0; i < 4; i++) c.fillRect(px + i * 8 + 6, py + 2, 2, T - 4);
        c.fillStyle = "#a87445"; c.fillRect(px, py + 2, T, 3); c.fillRect(px, py + T - 5, T, 3);
      }
      return;
    }
    if (t === PATH || t === DOOR) {
      c.fillStyle = BM.path; c.fillRect(px, py, T, T);
      c.fillStyle = "#bd8c4d";
      c.fillRect(px + (h % 20) + 2, py + ((h >> 5) % 20) + 2, 4, 4);
      c.fillRect(px + ((h >> 3) % 22) + 2, py + ((h >> 8) % 22) + 2, 3, 3);
      return;
    }
    /* grass base for everything else */
    c.fillStyle = ((x + y) & 1) ? BM.g1 : BM.g2;
    c.fillRect(px, py, T, T);
    if (t === WALL) return;
    if (h % 7 === 0) { c.fillStyle = BM.snow ? "#c5d6e4" : "#357f27"; c.fillRect(px + (h % 18) + 4, py + ((h >> 4) % 18) + 6, 3, 6); c.fillRect(px + (h % 18) + 8, py + ((h >> 4) % 18) + 8, 3, 4); }
    if (h % 19 === 0 && t === GRASS && !BM.snow) { c.fillStyle = (h & 1) ? "#ffd84a" : "#ff8fc1"; c.fillRect(px + 10, py + 12, 4, 4); c.fillStyle = "#fff"; c.fillRect(px + 11, py + 13, 2, 2); }
    if (t === TREE && BM.snow) {
      c.fillStyle = "rgba(0,0,0,.18)"; c.fillRect(px + 4, py + 26, 24, 5);
      c.fillStyle = "#5a3a22"; c.fillRect(px + 14, py + 22, 5, 8);
      c.fillStyle = "#1f6a46"; c.fillRect(px + 13, py + 1, 7, 6); c.fillRect(px + 9, py + 7, 15, 6); c.fillRect(px + 5, py + 13, 23, 9);
      c.fillStyle = "#f4f8fc"; c.fillRect(px + 13, py + 1, 7, 3); c.fillRect(px + 9, py + 7, 15, 3); c.fillRect(px + 5, py + 13, 23, 3);
    } else if (t === TREE) {
      c.fillStyle = "rgba(0,0,0,.18)"; c.fillRect(px + 4, py + 26, 24, 5);
      c.fillStyle = "#825330"; c.fillRect(px + 13, py + 19, 6, 11);
      c.fillStyle = "#2a7a34";
      c.fillRect(px + 9, py + 1, 14, 7); c.fillRect(px + 5, py + 7, 22, 8); c.fillRect(px + 7, py + 14, 18, 7);
      c.fillStyle = "#3d9a48"; c.fillRect(px + 10, py + 3, 6, 3); c.fillRect(px + 8, py + 9, 5, 3);
      c.fillStyle = "#1d5a26"; c.fillRect(px + 17, py + 15, 8, 4);
      if (h % 3 === 0) { c.fillStyle = "#d23b43"; c.fillRect(px + 11, py + 11, 3, 3); c.fillRect(px + 19, py + 17, 3, 3); }
    } else if (t === ROCK) {
      c.fillStyle = "rgba(0,0,0,.18)"; c.fillRect(px + 4, py + 24, 24, 5);
      c.fillStyle = "#8d8f94"; c.fillRect(px + 6, py + 12, 20, 14); c.fillRect(px + 10, py + 8, 12, 6);
      c.fillStyle = "#b5b7bd"; c.fillRect(px + 10, py + 9, 6, 3); c.fillRect(px + 8, py + 14, 4, 3);
      c.fillStyle = "#62646a"; c.fillRect(px + 18, py + 20, 8, 6);
    }
  }
  function isW(x, y) { var t = tiles[y][x]; return t === WATER || t === BRIDGE; }

  function drawCastle(idx, camX, camY) {
    var cs = CASTLES[idx], c = ctx;
    var ox = (cs.tx - 2) * T - camX, oy = (cs.ty - 3) * T - camY;
    var stone = cs.ice ? "#a9c4de" : "#9aa0aa", dark = cs.ice ? "#6d8fb3" : "#6c727d", light = cs.ice ? "#dcecfa" : "#bcc2cc";
    /* shadow */
    c.fillStyle = "rgba(0,0,0,.2)"; c.fillRect(ox + 6, oy + 4 * T - 4, 5 * T - 6, 10);
    /* main wall */
    c.fillStyle = stone; c.fillRect(ox + 24, oy + 40, 5 * T - 48, 3 * T - 14);
    c.fillStyle = light; c.fillRect(ox + 24, oy + 40, 5 * T - 48, 4);
    /* bricks */
    c.fillStyle = dark;
    for (var by = 0; by < 5; by++) for (var bx = 0; bx < 8; bx++) {
      c.fillRect(ox + 30 + bx * 12 + (by & 1) * 6, oy + 50 + by * 12, 8, 2);
    }
    /* towers */
    [0, 5 * T - 40].forEach(function (tx) {
      c.fillStyle = stone; c.fillRect(ox + tx, oy + 14, 40, 4 * T - 18);
      c.fillStyle = light; c.fillRect(ox + tx, oy + 14, 5, 4 * T - 18);
      c.fillStyle = dark; c.fillRect(ox + tx + 35, oy + 14, 5, 4 * T - 18);
      for (var m = 0; m < 3; m++) { c.fillStyle = stone; c.fillRect(ox + tx + m * 16, oy + 4, 8, 12); c.fillStyle = dark; c.fillRect(ox + tx + m * 16 + 6, oy + 4, 2, 12); }
      c.fillStyle = "#1c2233"; c.fillRect(ox + tx + 16, oy + 40, 8, 16);
      c.fillStyle = "#ffcf4d"; c.fillRect(ox + tx + 18, oy + 44, 4, 6);
    });
    /* wall battlements */
    for (var m2 = 0; m2 < 4; m2++) { c.fillStyle = stone; c.fillRect(ox + 44 + m2 * 18, oy + 30, 10, 10); }
    /* gate */
    var gx = ox + 2 * T + 2, gy = oy + 3 * T - 10;
    c.fillStyle = "#2b2118"; c.fillRect(gx, gy + 8, T - 4, T + 2); c.fillRect(gx + 4, gy + 2, T - 12, 8);
    c.fillStyle = "#4a3a28"; c.fillRect(gx + 14, gy + 8, 2, T + 2);
    /* flag */
    var fx = ox + 2 * T + 14, fy = oy - 20, wave = Math.sin(time * 4) * 2;
    c.fillStyle = "#4a3a28"; c.fillRect(fx, fy, 3, 34);
    c.fillStyle = cleared[idx] ? "#3aa845" : "#d23b43";
    c.fillRect(fx + 3, fy + 2, 18, 5); c.fillRect(fx + 3, fy + 7 + wave * 0.5, 14, 5); c.fillRect(fx + 3, fy + 12 + wave, 9, 4);
    /* name */
    c.font = "8px 'Press Start 2P', monospace"; c.textAlign = "center";
    var label = cs.name + (cleared[idx] ? " \u2713" : "");
    var lx = ox + 2.5 * T, ly = oy - 26;
    c.fillStyle = "#1b2a3a"; c.fillText(label, lx + 1, ly + 1);
    c.fillStyle = cleared[idx] ? "#8cff9a" : "#ffd84a"; c.fillText(label, lx, ly);
  }

  function drawHero(camX, camY) {
    var c = ctx, s = 1.5, hx = hero.x - camX, hy = hero.y - camY;
    var swing = hero.moving ? Math.sin(hero.walk * 10) : 0;
    var bob = hero.moving ? Math.abs(Math.sin(hero.walk * 10)) * -2 : 0;
    c.save();
    c.translate(Math.round(hx), Math.round(hy));
    c.scale(hero.dir, 1);
    c.fillStyle = "rgba(0,0,0,.25)"; c.fillRect(-9, -3, 18, 5);
    /* legs */
    c.drawImage(heroImgs.leg, -9 * 1 + swing * 3, -8 * s + 0, 7 * s, 8 * s);
    c.drawImage(heroImgs.leg, -1 - swing * 3, -8 * s + 0, 7 * s, 8 * s);
    /* cape + body */
    c.drawImage(heroImgs.cape, -12 * s * 0.8, -22 * s + 14 * s * 0.6 + bob, 6 * s, 10 * s);
    c.drawImage(heroImgs.body, -6 * s, -22 * s + bob, 12 * s, 14 * s);
    c.restore();
  }

  var view = { w: 0, h: 0, scale: 1, dpr: 1 };
  function resize() {
    var dpr = window.devicePixelRatio || 1;
    view.w = window.innerWidth; view.h = window.innerHeight; view.dpr = dpr;
    mapEl.width = Math.round(view.w * dpr); mapEl.height = Math.round(view.h * dpr);
    view.scale = Math.max(1, Math.min(view.w / (14 * T), view.h / (8 * T)));
  }
  window.addEventListener("resize", resize);
  resize();

  function renderMap() {
    var c = ctx, s = view.scale * view.dpr;
    c.setTransform(1, 0, 0, 1, 0, 0);
    c.imageSmoothingEnabled = false;
    c.fillStyle = "#1d5fae"; c.fillRect(0, 0, mapEl.width, mapEl.height);
    var vw = view.w / view.scale, vh = view.h / view.scale;
    var camX = hero.x - vw / 2, camY = hero.y - vh / 2 - 10;
    camX = (COLS * T <= vw) ? (COLS * T - vw) / 2 : Math.max(0, Math.min(COLS * T - vw, camX));
    camY = (ROWS * T <= vh) ? (ROWS * T - vh) / 2 : Math.max(0, Math.min(ROWS * T - vh, camY));
    camX = Math.round(camX); camY = Math.round(camY);
    c.setTransform(s, 0, 0, s, 0, 0);
    var x0 = Math.max(0, Math.floor(camX / T)), x1 = Math.min(COLS - 1, Math.floor((camX + vw) / T));
    var y0 = Math.max(0, Math.floor(camY / T)), y1 = Math.min(ROWS - 1, Math.floor((camY + vh) / T));
    var x, y;
    for (y = y0; y <= y1; y++) for (x = x0; x <= x1; x++) drawTile(x, y, x * T - camX, y * T - camY);
    /* draw things in order of depth so the hero walks behind trees and castles */
    var items = [];
    CASTLES.forEach(function (cs, i) { if (cs.map !== curMap) return; items.push({ y: cs.ty * T + T, f: function () { drawCastle(i, camX, camY); } }); });
    ents.forEach(function (e) { items.push({ y: e.ty * T + T, f: function () { drawEnt(e, camX, camY); } }); });
    PORTALS.forEach(function (p) { if (p.map === curMap) items.push({ y: p.ty * T, f: function () { drawPortal(p, camX, camY); } }); });
    items.push({ y: hero.y, f: function () { drawHero(camX, camY); } });
    items.sort(function (a, b) { return a.y - b.y; });
    items.forEach(function (it) { it.f(); });
    /* tree canopies in front of the hero */
    for (y = y0; y <= y1; y++) for (x = x0; x <= x1; x++) {
      if (tiles[y][x] === TREE && (y + 1) * T > hero.y - 4 && y * T < hero.y + 4 && Math.abs(x * T + 16 - hero.x) < 22) drawTile(x, y, x * T - camX, y * T - camY);
    }
    if (isDark()) { c.fillStyle = "rgba(6,10,40,.5)"; c.fillRect(0, 0, vw, vh); }
    if (nearE && !ui) {
      var ex = nearE.tx * T + 16 - camX, ey = nearE.ty * T - camY - 6, lb = nearE.chest ? "E: Open" : "E: Talk";
      c.font = "8px 'Press Start 2P', monospace"; c.textAlign = "center";
      c.fillStyle = "#1b2a3a"; c.fillText(lb, ex + 1, ey + 1); c.fillStyle = "#fff"; c.fillText(lb, ex, ey);
    }
    /* progress text */
    var n = (curMap ? cleared.slice(3) : cleared.slice(0, 3)).filter(Boolean).length, tot = curMap ? 2 : 3;
    c.font = "9px 'Press Start 2P', monospace"; c.textAlign = "center";
    var msg = cleared[4] ? "You are the Champion of Calculus!" : BM.name + ": castles " + n + " / " + tot;
    c.fillStyle = "#1b2a3a"; c.fillText(msg, vw / 2 + 1, vh - 24 + 1);
    c.fillStyle = cleared[4] ? "#ffd84a" : "#fff"; c.fillText(msg, vw / 2, vh - 24);
  }

  function updateMap(dt) {
    if (ui || warp) { hero.moving = false; return; }
    nearE = findNear();
    var mx = (keys.right ? 1 : 0) - (keys.left ? 1 : 0), my = (keys.down ? 1 : 0) - (keys.up ? 1 : 0);
    hero.moving = !!(mx || my);
    if (hero.moving) {
      var len = Math.sqrt(mx * mx + my * my), sp = 130 * (1 + 0.06 * lv("spd")) * dt;
      if (mx) hero.dir = mx;
      var nx = hero.x + (mx / len) * sp, ny = hero.y + (my / len) * sp;
      if (!blocked(nx, hero.y)) hero.x = nx;
      if (!blocked(hero.x, ny)) hero.y = ny;
      hero.walk += dt;
      stepT -= dt;
      if (stepT <= 0) { sfx("step"); stepT = 0.28; }
      var dk = doorAt[Math.floor(hero.x / T) + "," + Math.floor((hero.y - 4) / T)];
      if (dk !== undefined) enterCastle(dk);
      PORTALS.forEach(function (p) {
        if (p.map === curMap && !warp && Math.hypot(hero.x - (p.tx * T + 16), hero.y - 8 - (p.ty * T + 32)) < 26) usePortal(p);
      });
    } else { stepT = 0; }
  }
  function blocked(x, y) {
    var hw = 7, hh = 6;
    return solidTile(Math.floor((x - hw) / T), Math.floor((y - hh) / T)) || solidTile(Math.floor((x + hw) / T), Math.floor((y - hh) / T)) ||
      solidTile(Math.floor((x - hw) / T), Math.floor(y / T)) || solidTile(Math.floor((x + hw) / T), Math.floor(y / T));
  }

  /* ============================================================
     CASTLE FIGHT
     ============================================================ */
  /* ============================================================
     COINS, NPCS, CHESTS, SHOP, PORTALS
     ============================================================ */
  var coinEl = document.createElement("div"); coinEl.className = "coins";
  hpEl.parentNode.insertBefore(coinEl, infoEl);
  var bossEl = document.createElement("div"); bossEl.id = "bossbar";
  bossEl.innerHTML = "<b>LORD INFINITY</b><i><u></u></i>";
  var talkEl = document.createElement("div"); talkEl.id = "talk";
  var shopEl = document.createElement("div"); shopEl.id = "shop";
  document.body.appendChild(bossEl); document.body.appendChild(talkEl); document.body.appendChild(shopEl);
  document.querySelector(".pad .grp").insertAdjacentHTML("beforeend", '<button class="btn mapOnly" data-act="act">Act</button>');
  function coinHud() { coinEl.innerHTML = '<span class="coin"></span> ' + SV.coins; }
  function addCoins(n) {
    SV.coins += n; save(); coinHud();
    coinEl.classList.remove("pop"); void coinEl.offsetWidth; coinEl.classList.add("pop");
    sfx("coin");
  }
  coinHud();

  var UPG = [
    { k: "hp",  n: "Max Heart",    d: "+20 max health",      base: 30 },
    { k: "arm", n: "Armor",        d: "-8% damage taken",    base: 40 },
    { k: "spd", n: "Boots",        d: "+8% move speed",      base: 30 },
    { k: "sw",  n: "Sword",        d: "+1 damage, more reach", base: 50 },
    { k: "gd",  n: "Pistol Power", d: "+1 bullet damage",    base: 60 },
    { k: "mag", n: "Magazine",     d: "+4 bullets per clip", base: 40 },
    { k: "rel", n: "Quick Reload", d: "-15% reload time",    base: 35 }
  ];
  function applyStats() { P.max = maxhp(); P.mag = magSize(); P.hp = P.max; P.ammo = P.mag; drawHealth(); }
  function renderShop() {
    var h = '<h3>Upgrade Shop <span class="coin"></span> ' + SV.coins + '</h3>';
    UPG.forEach(function (u) {
      var l = lv(u.k), maxed = l >= 5, cost = u.base * (l + 1), pips = "";
      for (var i = 0; i < 5; i++) pips += '<i' + (i < l ? ' class="on"' : '') + '></i>';
      h += '<div class="row"><div><b>' + u.n + '</b><small>' + u.d + '</small><span class="pips">' + pips + '</span></div>' +
        '<button class="btn" data-up="' + u.k + '"' + (maxed || SV.coins < cost ? ' disabled' : '') + '>' + (maxed ? 'MAX' : cost + ' coins') + '</button></div>';
    });
    shopEl.innerHTML = h + '<button class="btn" id="shopx">Close (Esc)</button>';
  }
  function openShop() { ui = "shop"; renderShop(); shopEl.classList.add("show"); }
  function closeShop() { ui = null; shopEl.classList.remove("show"); }
  shopEl.addEventListener("click", function (ev) {
    var b = ev.target.closest ? ev.target.closest("button") : null;
    if (!b || b.disabled) return;
    if (b.id === "shopx") { closeShop(); return; }
    var k = b.getAttribute("data-up"), u = UPG.filter(function (x) { return x.k === k; })[0];
    if (!u) return;
    var l = lv(k), cost = u.base * (l + 1);
    if (l >= 5 || SV.coins < cost) return;
    SV.coins -= cost; SV.up[k] = l + 1; save(); coinHud(); applyStats(); sfx("buy"); renderShop();
  });

  function findNear() {
    var best = null, bd = 52;
    ents.forEach(function (e) {
      if (e.chest && SV.chests[e.id]) return;
      var d = Math.hypot(hero.x - (e.tx * T + 16), hero.y - 8 - (e.ty * T + 22));
      if (d < bd) { bd = d; best = e; }
    });
    return best;
  }
  function showTalk() {
    var last = talk.i >= talk.lines.length - 1;
    talkEl.innerHTML = "<b>" + talk.e.name + "</b><p>" + talk.lines[talk.i] + "</p><i>" +
      (last ? (talk.e.shop ? "E: open shop" : "E: close") : "E: next") + "</i>";
    talkEl.classList.add("show");
  }
  function interact() {
    if (mode !== "map" || !started || warp) return;
    if (ui === "talk") {
      talk.i++;
      if (talk.i >= talk.lines.length) {
        talkEl.classList.remove("show"); ui = null;
        var e = talk.e;
        if (e.gift && !SV.talked[e.id]) { SV.talked[e.id] = 1; addCoins(e.gift); banner("+" + e.gift + " coins!"); }
        if (e.shop) openShop();
      } else showTalk();
      return;
    }
    if (ui) return;
    var n = findNear();
    if (!n) return;
    keys.left = keys.right = keys.up = keys.down = false;
    if (n.chest) {
      SV.chests[n.id] = 1;
      var amt = 15 + hash(n.tx, n.ty) % 26;
      addCoins(amt); sfx("chest"); banner("Chest: +" + amt + " coins!");
      return;
    }
    var lines = n.lines.slice();
    if (n.gift && !SV.talked[n.id]) lines.push("Here, take " + n.gift + " coins for visiting!");
    ui = "talk"; talk = { e: n, lines: lines, i: 0 };
    sfx("click"); showTalk();
  }

  function drawEnt(e, camX, camY) {
    var c = ctx, px = e.tx * T - camX, py = e.ty * T - camY;
    c.fillStyle = "rgba(0,0,0,.2)"; c.fillRect(px + 5, py + 26, 22, 5);
    if (e.chest) {
      var op = !!SV.chests[e.id];
      c.fillStyle = "#6b4425"; c.fillRect(px + 5, py + 14, 22, 13);
      c.fillStyle = "#8a5a33"; c.fillRect(px + 6, py + 15, 20, 11);
      if (op) { c.fillStyle = "#ffd84a"; c.fillRect(px + 8, py + 14, 16, 3); c.fillStyle = "#a87445"; c.fillRect(px + 5, py + 4, 22, 6); }
      else { c.fillStyle = "#a87445"; c.fillRect(px + 5, py + 9, 22, 7); c.fillStyle = "#ffd84a"; c.fillRect(px + 14, py + 9, 4, 18); c.fillStyle = "#c9a227"; c.fillRect(px + 14, py + 16, 4, 4); }
    } else {
      var bob = Math.round(Math.sin(time * 2 + e.tx));
      c.fillStyle = "#2e3560"; c.fillRect(px + 11, py + 22, 4, 8); c.fillRect(px + 17, py + 22, 4, 8);
      c.fillStyle = e.col; c.fillRect(px + 9, py + 12 + bob, 14, 11);
      c.fillStyle = "#f2c9a0"; c.fillRect(px + 10, py + 3 + bob, 12, 10);
      c.fillStyle = e.hair; c.fillRect(px + 10, py + 2 + bob, 12, 4);
      c.fillStyle = "#1a1426"; c.fillRect(px + 13, py + 8 + bob, 2, 2); c.fillRect(px + 18, py + 8 + bob, 2, 2);
      if (e.shop) { c.fillStyle = "#ffd84a"; c.fillRect(px + 13, py - 6 + bob, 6, 6); }
    }
  }
  function drawPortal(p, camX, camY) {
    var c = ctx, px = p.tx * T - camX, py = p.ty * T - camY, w = Math.sin(time * 4) * 2;
    c.fillStyle = "#4a1fa8"; c.fillRect(px + 2 - w, py - 10, 28 + w * 2, 74);
    c.fillStyle = "#b88cff"; c.fillRect(px + 8, py - 4, 16, 62);
    c.fillStyle = "#fff"; c.fillRect(px + 14 + Math.sin(time * 5) * 4, py + ((time * 40) % 50), 4, 6);
    c.font = "8px 'Press Start 2P', monospace"; c.textAlign = "center";
    c.fillStyle = "#1b2a3a"; c.fillText(p.label, px + 17, py - 16); c.fillStyle = "#ffd84a"; c.fillText(p.label, px + 16, py - 17);
  }
  function usePortal(p) {
    if (p.lock && !(cleared[0] && cleared[1] && cleared[2])) { banner("Clear all 3 castles first!"); hero.x += p.push; return; }
    warp = true; sfx("door");
    fadeTo(function () {
      curMap = p.to; buildMap(p.to);
      hero.x = p.sx * T + 16; hero.y = p.sy * T + 28; hero.dir = 1;
      keys.left = keys.right = keys.up = keys.down = false;
      warp = false; banner(BM.name);
    });
  }

  var player = document.createElement("div");
  player.id = "player";
  player.innerHTML =
    '<div class="sprite">' +
      '<div class="leg b">' + pix(LEG, PAL, 4) + '</div>' +
      '<div class="leg f">' + pix(LEG, PAL, 4) + '</div>' +
      '<div class="torso">' +
        '<div class="cape">' + pix(CAPE, PAL, 4) + '</div>' +
        '<div class="upper">' + pix(BODY, PAL, 4) + '</div>' +
        '<div class="arm">' + pix(ARM, PAL, 4) +
          '<div class="sword">' + pix(SWORD, PAL, 4) + '</div>' +
          '<div class="pistol">' + pix(PISTOL, PAL, 4) + '<span class="muzzle"></span></div>' +
        '</div>' +
        '<div class="swoosh"></div>' +
      '</div>' +
    '</div>';
  world.appendChild(player);

  function resetPlayer() {
    P.x = 80; P.y = 0; P.vy = 0; P.dir = 1; P.max = maxhp(); P.mag = magSize(); P.hp = P.max; P.inv = 0; P.atk = 0;
    P.ammo = P.mag; P.reload = 0; P.aimT = 0; P.flashT = 0; P.shotCd = 0;
    player.classList.remove("hurt", "swing", "walk", "air", "aim", "shoot");
    drawHealth();
  }
  function clearFoes() {
    zombies.forEach(function (z) { z.el.remove(); });
    bullets.forEach(function (b) { b.el.remove(); });
    zombies = []; bullets = [];
    bossEl.classList.remove("show");
  }

  function fadeTo(fn) {
    fadeEl.classList.add("on");
    setTimeout(function () { fn(); fadeEl.classList.remove("on"); }, 380);
  }

  function enterCastle(idx) {
    if (mode !== "map" || C) return;
    C = { idx: idx, pending: true };
    keys.left = keys.right = keys.up = keys.down = false;
    sfx("door");
    fadeTo(function () { startCastle(idx); });
  }
  function startCastle(idx) {
    var cfg = CASTLES[idx];
    mode = "castle";
    document.body.classList.remove("on-map"); document.body.classList.add("in-castle"); document.body.classList.toggle("ice", !!cfg.ice);
    clearFoes(); over = false; overEl.classList.remove("show");
    resetPlayer();
    C = { idx: idx, cfg: cfg, wave: 0, queue: 0, spawnT: 0, state: "intro", timer: 2.2 };
    banner(cfg.name);
    if (window.Music) Music.play("terraria-theme.mp3", 0.45);
    updateInfo();
  }
  function leaveCastle() {
    fadeTo(function () {
      var cfg = CASTLES[C.idx];
      mode = "map";
      document.body.classList.remove("in-castle", "ice"); document.body.classList.add("on-map");
      hero.x = cfg.tx * T + 16; hero.y = (cfg.ty + 1) * T + 26; hero.dir = 1;
      clearFoes(); over = false; overEl.classList.remove("show");
      P.max = maxhp(); P.mag = magSize(); P.hp = P.max; drawHealth();
      C = null;
      if (window.Music) Music.play("overworld-day.mp3", 0.45);
      if (cleared[4]) banner("Champion of Calculus!");
    });
  }

  function updateInfo() {
    if (!C || !C.cfg) { infoEl.textContent = ""; return; }
    var left = zombies.length + C.queue;
    var ammo = P.reload > 0 ? "RELOADING" : P.ammo + "/" + P.mag;
    infoEl.innerHTML = "WAVE <em>" + Math.max(1, C.wave) + "/" + C.cfg.waves.length + "</em>  ZOMBIES <em>" + left + "</em>\nAMMO <em>" + ammo + "</em>";
  }

  /* ---------- actions ---------- */
  var SWING_TIME = 0.34;
  function attack() {
    if (mode !== "castle" || over || P.atk > 0) return;
    P.atk = SWING_TIME; P.aimT = 0;
    sfx("slash");
    player.classList.remove("swing", "aim");
    void player.offsetWidth;
    player.classList.add("swing");
    zombies.forEach(function (z) { z.hit = false; });
  }
  function jump() {
    if (mode === "castle" && !over && P.y === 0) { P.vy = 560; sfx("jump"); }
  }
  function reload() {
    if (mode !== "castle" || over || P.reload > 0 || P.ammo === P.mag) return;
    P.reload = 1.1 * (1 - 0.15 * lv("rel")); sfx("reload"); updateInfo();
  }
  function shoot() {
    if (mode !== "castle" || over || P.shotCd > 0 || P.reload > 0 || P.atk > 0) return;
    if (P.ammo <= 0) { sfx("empty"); reload(); return; }
    P.ammo--; P.shotCd = 0.22; P.aimT = 0.45; P.flashT = 0.07;
    sfx("shoot");
    player.classList.add("aim", "shoot");
    var el = document.createElement("div");
    el.className = "bullet";
    world.appendChild(el);
    bullets.push({ el: el, x: P.x + 24 + P.dir * 38, h: P.y + 46, dir: P.dir });
    if (P.ammo === 0) reload();
    updateInfo();
  }

  function hurtPlayer(fromX, dmg) {
    if (over || P.inv > 0) return;
    P.hp = Math.max(0, P.hp - Math.round((dmg || 12) * (1 - 0.08 * lv("arm"))));
    sfx("hurt");
    P.inv = 0.8;
    P.x += (P.x + 24 < fromX ? -1 : 1) * 36;
    P.vy = 240;
    player.classList.add("hurt");
    hpEl.classList.remove("shake"); void hpEl.offsetWidth; hpEl.classList.add("shake");
    drawHealth();
    if (P.hp <= 0) {
      over = true;
      overEl.classList.add("show");
      setTimeout(function () { sfx("gameover"); }, 350);
    }
  }

  /* ---------- zombies ---------- */
  function spawnZombie(boss) {
    var el = document.createElement("div");
    el.className = "zombie" + (C.cfg.ice ? " ice" : "") + (boss ? " boss" : "");
    el.innerHTML = '<div class="zb">' + ZOMBIE_SVG + '</div>';
    el.firstChild.style.animationDelay = (-Math.random() * 0.6) + "s";
    world.appendChild(el);
    if (Math.random() < 0.35) sfx("groan");
    var fromLeft = Math.random() < 0.5, sp = C.cfg.speed;
    zombies.push({
      el: el, x: fromLeft ? -70 : window.innerWidth + 10, hp: boss ? 40 : C.cfg.hp, boss: !!boss, sc: boss ? 2.2 : 1, cd: 3, lunge: 0, kb: 0, hit: false, dir: 1,
      speed: boss ? 58 : sp[0] + Math.random() * (sp[1] - sp[0]), ph: Math.random() * 6, dead: false
    });
  }
  function killZombie(z) {
    z.dead = true;
    addCoins(z.boss ? 120 : 1 + Math.floor(Math.random() * 2) + (C.cfg.ice ? 1 : 0));
    sfx("zdie");
    z.el.classList.add("dying");
    setTimeout(function () { z.el.remove(); }, 300);
  }
  function hitZombie(z, dmg, kb) {
    z.hp -= dmg; z.kb = kb / (z.sc * z.sc); z.hit = true;
    sfx("zhit");
    z.el.classList.add("flash");
    setTimeout(function () { z.el.classList.remove("flash"); }, 90);
    if (z.hp <= 0) killZombie(z);
  }

  function updateWaves(dt) {
    var cfg = C.cfg;
    if (C.state === "intro") {
      C.timer -= dt;
      if (C.timer <= 0) nextWave();
    } else if (C.state === "fight") {
      C.spawnT -= dt;
      if (C.queue > 0 && C.spawnT <= 0 && zombies.length < 10) {
        spawnZombie(); C.queue--; C.spawnT = 0.45 + Math.random() * 0.6; updateInfo();
      }
      if (C.queue === 0 && zombies.length === 0) {
        if (C.wave >= cfg.waves.length && cfg.boss && !C.bossOn) {
          C.bossOn = true; spawnZombie(true); banner("BOSS: Lord Infinity!"); sfx("wave"); updateInfo(); return;
        }
        if (C.wave >= cfg.waves.length) {
          C.state = "done"; C.timer = 3.2;
          cleared[C.idx] = true; saveCleared(); addCoins(40 + 20 * C.idx);
          banner(cfg.boss ? "Boss defeated! Champion!" : "Castle cleared!"); sfx("cleared");
        } else {
          C.state = "between"; C.timer = 2.6;
          P.hp = Math.min(P.max, P.hp + 25); P.ammo = P.mag; P.reload = 0; drawHealth();
          banner("Wave cleared!");
        }
        updateInfo();
      }
    } else if (C.state === "between") {
      C.timer -= dt;
      if (C.timer <= 0) nextWave();
    } else if (C.state === "done") {
      C.timer -= dt;
      if (C.timer <= 0 && !C.leaving) { C.leaving = true; leaveCastle(); }
    }
  }
  function nextWave() {
    C.wave++; C.queue = C.cfg.waves[C.wave - 1]; C.spawnT = 0.2; C.state = "fight";
    banner("Wave " + C.wave); sfx("wave"); updateInfo();
  }

  function updateCastle(dt) {
    if (!over) {
      var move = (keys.right ? 1 : 0) - (keys.left ? 1 : 0);
      if (move) { P.dir = move; P.x += move * 240 * (1 + 0.08 * lv("spd")) * dt; }
      P.x = Math.max(0, Math.min(window.innerWidth - 48, P.x));

      if (P.y > 0 || P.vy > 0) {
        P.vy -= 1500 * dt;
        P.y += P.vy * dt;
        if (P.y <= 0) { P.y = 0; P.vy = 0; sfx("land"); }
      }
      P.atk = Math.max(0, P.atk - dt);
      P.inv = Math.max(0, P.inv - dt);
      P.shotCd = Math.max(0, P.shotCd - dt);
      P.aimT = Math.max(0, P.aimT - dt);
      P.flashT = Math.max(0, P.flashT - dt);
      if (P.reload > 0) { P.reload -= dt; if (P.reload <= 0) { P.reload = 0; P.ammo = P.mag; updateInfo(); } }
      if (P.inv === 0) player.classList.remove("hurt");
      if (P.atk === 0) player.classList.remove("swing");
      if (P.aimT === 0) player.classList.remove("aim");
      if (P.flashT === 0) player.classList.remove("shoot");
      player.classList.toggle("walk", move !== 0 && P.y === 0);
      player.classList.toggle("air", P.y > 0);
      if (move !== 0 && P.y === 0) { stepT -= dt; if (stepT <= 0) { sfx("step"); stepT = 0.28; } } else { stepT = 0; }

      updateWaves(dt);

      /* bullets */
      bullets.forEach(function (b) {
        b.x += b.dir * 760 * dt;
        if (b.x < -20 || b.x > window.innerWidth + 20) { b.dead = true; return; }
        for (var i = 0; i < zombies.length; i++) {
          var z = zombies[i];
          if (z.dead) continue;
          if (Math.abs(b.x - (z.x + 26)) < 24 * z.sc && b.h < 64 * z.sc) {
            hitZombie(z, 1 + lv("gd"), b.dir * 140); b.dead = true; break;
          }
        }
      });
      bullets = bullets.filter(function (b) { if (b.dead) b.el.remove(); return !b.dead; });

      /* zombies */
      var elapsed = SWING_TIME - P.atk;
      zombies.forEach(function (z) {
        if (z.dead) return;
        var zc = z.x + 26, pc = P.x + 24;
        z.dir = pc > zc ? 1 : -1;
        var lurch = 1 + 0.3 * Math.sin(time * 4 + z.ph);
        z.x += z.dir * z.speed * lurch * dt + z.kb * dt;
        if (z.boss) {
          z.cd -= dt;
          if (z.cd < 0) { z.cd = 3.5; z.lunge = 0.7; if (C.queue < 4) C.queue += 3; sfx("groan"); }
          if (z.lunge > 0) { z.lunge -= dt; z.x += z.dir * 260 * dt; }
        }
        z.kb -= z.kb * 6 * dt;
        if (Math.abs(zc - pc) < 30 * z.sc && P.y < 40) hurtPlayer(zc, z.boss ? 28 : 12 + (C.cfg.ice ? 4 : 0));
        if (P.atk > 0 && elapsed > 0.07 && elapsed < 0.26 && !z.hit && P.y < 56) {
          var front = (zc - pc) * P.dir;
          if (front > -10 && front < 120 + 8 * lv("sw")) hitZombie(z, 2 + lv("sw"), P.dir * 420);
        }
      });
      zombies = zombies.filter(function (z) { return !z.dead; });
      var bz = zombies.filter(function (z) { return z.boss; })[0];
      bossEl.classList.toggle("show", !!bz);
      if (bz) bossEl.getElementsByTagName("u")[0].style.width = Math.max(0, bz.hp / 40 * 100) + "%";
    }
    player.style.transform = "translate3d(" + P.x + "px," + (-P.y) + "px,0) scaleX(" + P.dir + ")";
    zombies.forEach(function (z) { z.el.style.transform = "translate3d(" + z.x + "px,0,0) scale(" + (z.dir * z.sc) + "," + z.sc + ")"; });
    bullets.forEach(function (b) { b.el.style.transform = "translate3d(" + b.x + "px,0,0)"; b.el.style.bottom = "calc(100vh - var(--surface) + " + b.h + "px)"; });
  }

  /* ============================================================
     MAIN LOOP
     ============================================================ */
  var last = performance.now(), infoT = 0;
  function loop(now) {
    var dt = Math.min(0.05, (now - last) / 1000);
    last = now; time += dt;
    if (started) {
      if (mode === "map") updateMap(dt);
      else if (C && C.cfg) { updateCastle(dt); infoT -= dt; if (infoT <= 0) { updateInfo(); infoT = 0.25; } }
    }
    if (mode === "map") renderMap();
    requestAnimationFrame(loop);
  }

  /* ============================================================
     CONTROLS
     ============================================================ */
  var keymap = {
    ArrowLeft: "left", a: "left", A: "left", ArrowRight: "right", d: "right", D: "right",
    ArrowUp: "up", w: "up", W: "up", ArrowDown: "down", s: "down", S: "down"
  };
  window.addEventListener("keydown", function (e) {
    if (!started) return;
    if (e.key === "e" || e.key === "E" || (ui === "talk" && (e.key === "Enter" || e.key === " "))) { e.preventDefault(); if (ui !== "shop") interact(); return; }
    if (e.key === "Escape" && ui === "shop") { closeShop(); return; }
    if (ui) return;
    var k = keymap[e.key];
    if (k) {
      keys[k] = true; e.preventDefault();
      if (k === "up") jump();
    } else if (e.key === " ") { jump(); e.preventDefault(); }
    else if (e.key === "j" || e.key === "J" || e.key === "x" || e.key === "X") attack();
    else if (e.key === "k" || e.key === "K" || e.key === "z" || e.key === "Z") shoot();
    else if (e.key === "r" || e.key === "R") reload();
  });
  window.addEventListener("keyup", function (e) { var k = keymap[e.key]; if (k) keys[k] = false; });
  world.addEventListener("pointerdown", function (e) {
    if (!started || e.target !== world) return;
    P.dir = e.clientX >= P.x + 24 ? 1 : -1;      // click or tap: shoot toward that side
    shoot();
  });

  Array.prototype.forEach.call(document.querySelectorAll("[data-act]"), function (b) {
    var act = b.getAttribute("data-act");
    function down(e) {
      e.preventDefault();
      if (!started) return;
      if (act === "left" || act === "right" || act === "up" || act === "down") keys[act] = true;
      if (act === "act") interact(); else if (act === "jump") jump(); else if (act === "attack") attack(); else if (act === "shoot") shoot();
    }
    function up() { if (keys[act] !== undefined) keys[act] = false; }
    b.addEventListener("pointerdown", down);
    b.addEventListener("pointerup", up);
    b.addEventListener("pointerleave", up);
    b.addEventListener("pointercancel", up);
  });

  $("again").addEventListener("click", function () { if (C && C.cfg) { var i = C.idx; fadeTo(function () { startCastle(i); }); } });
  $("leave").addEventListener("click", function () { if (C && C.cfg) leaveCastle(); });

  var soundBtn = $("sound");
  function soundLabel() { soundBtn.textContent = "Sound: " + (SFX.isMuted() ? "Off" : "On"); }
  if (window.SFX) {
    soundLabel();
    soundBtn.addEventListener("click", function () {
      SFX.toggle();
      if (window.Music) Music.setMuted(SFX.isMuted());
      soundLabel();
    });
  } else { soundBtn.hidden = true; }

  /* ============================================================
     LOADING SCREEN
     ============================================================ */
  (function loadingScreen() {
    var tips = [
      "Press R to reload your pistol.",
      "The sword hits hard. The pistol keeps you safe.",
      "Clearing a wave heals you and refills your ammo.",
      "Walk into a castle door to enter.",
      "Don’t forget the + C!"
    ];
    var load = $("loading"), fill = $("ldfill"), pct = $("ldpct"), startMsg = $("ldstart");
    $("ldtip").textContent = tips[Math.floor(Math.random() * tips.length)];
    /* loading music: plays at once if the browser allows it, otherwise on the first press or tap */
    if (window.Music) Music.play("terraria-theme.mp3", 0.45);

    var total = 4, doneCount = 0, t0 = performance.now(), ready = false, shown = 0;
    function step() { doneCount++; }
    function warm(url) {
      if (!window.fetch) { step(); return; }
      fetch(url).then(function (r) { return r.arrayBuffer(); }).then(step, step);
    }
    warm("overworld-day.mp3");
    warm("terraria-theme.mp3");
    var fontP = (document.fonts && document.fonts.load) ? document.fonts.load("12px 'Press Start 2P'") : Promise.resolve();
    fontP.then(step, step);
    var imgs = [heroImgs.body, heroImgs.leg, heroImgs.cape];
    var left = imgs.length;
    imgs.forEach(function (im) { var f = function () { if (--left === 0) step(); }; if (im.complete) f(); else { im.onload = f; im.onerror = f; } });

    function begin() {
      if (started) return;
      started = true;
      load.classList.add("done");
      setTimeout(function () { load.style.display = "none"; }, 600);
      if (window.Music) Music.play("overworld-day.mp3", 0.45);
      window.removeEventListener("keydown", begin);
      window.removeEventListener("pointerdown", begin);
      if (cleared[4]) banner("Champion of Calculus!");
    }
    function tick(now) {
      var real = doneCount / total, timed = Math.min(1, (now - t0) / 1800);
      if (now - t0 > 9000) real = 1;
      var target = Math.min(real, timed);
      shown += (target - shown) * 0.2;
      if (target - shown < 0.002) shown = target;
      fill.style.width = (shown * 100) + "%";
      pct.textContent = "Loading " + Math.round(shown * 100) + "%";
      if (shown >= 1 && !ready) {
        ready = true;
        pct.textContent = "Ready!";
        startMsg.hidden = false;
        window.addEventListener("keydown", begin);
        window.addEventListener("pointerdown", begin);
      }
      if (!started) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  })();

  resetPlayer();
  drawHealth();
  requestAnimationFrame(loop);
})();
