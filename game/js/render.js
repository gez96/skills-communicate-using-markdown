// render.js — camera-based drawing of the world and everything in it.
window.App = window.App || {};

(function () {
  const C = App.config;
  const T = C.TILE;
  let ctx, canvas;

  function init(cv) {
    canvas = cv;
    ctx = cv.getContext("2d");
    ctx.imageSmoothingEnabled = false;
  }

  function frame() {
    const s = App.state;
    const cam = s.cam;
    const viewW = C.VIEW_COLS * T, viewH = C.VIEW_ROWS * T;
    ctx.clearRect(0, 0, viewW, viewH);

    ctx.save();
    ctx.translate(-Math.round(cam.x), -Math.round(cam.y));

    const x0 = Math.floor(cam.x / T), y0 = Math.floor(cam.y / T);
    const x1 = Math.min(s.world.cols - 1, x0 + C.VIEW_COLS + 1);
    const y1 = Math.min(s.world.rows - 1, y0 + C.VIEW_ROWS + 1);

    // Ground + crops.
    for (let y = y0; y <= y1; y++) {
      for (let x = x0; x <= x1; x++) drawGround(x, y);
    }
    // Buildings.
    s.buildings.forEach(drawBuilding);
    // Ground items.
    s.groundItems.forEach(drawGroundItem);
    // Animals + player, y-sorted so nearer ones overlap correctly.
    const sprites = s.animals.map((a) => ({ y: a.wy, draw: () => drawAnimal(a) }));
    sprites.push({ y: s.player.wy, draw: () => drawPlayer(s.player) });
    sprites.sort((a, b) => a.y - b.y);
    sprites.forEach((sp) => sp.draw());

    // Facing highlight / placement ghost.
    if (s.placing) drawPlacementGhost();
    else drawActionHighlight();

    ctx.restore();
  }

  // ---- Ground ---------------------------------------------------------------
  function drawGround(x, y) {
    const t = App.state.world.tiles[y][x];
    const px = x * T, py = y * T;

    // base grass
    ctx.fillStyle = (x + y) % 2 === 0 ? "#5aa54a" : "#54a044";
    ctx.fillRect(px, py, T, T);

    if (t.type === "path") {
      ctx.fillStyle = "#c2a373";
      ctx.fillRect(px, py, T, T);
      ctx.fillStyle = "#b39364";
      ctx.fillRect(px + 4, py + 6, 5, 5);
      ctx.fillRect(px + 20, py + 16, 5, 5);
    } else if (t.type === "water") {
      ctx.fillStyle = "#3b7dd8";
      ctx.fillRect(px, py, T, T);
      ctx.fillStyle = "#5a97e6";
      const w = Math.sin((performance.now() / 500) + x + y);
      ctx.fillRect(px + 4, py + 8 + w * 1.5, 10, 2);
      ctx.fillRect(px + 16, py + 18 - w * 1.5, 10, 2);
    } else if (t.type === "grass") {
      const seed = (x * 7 + y * 13) % 5;
      ctx.fillStyle = "#67b657";
      if (seed === 0) ctx.fillRect(px + 6, py + 20, 3, 3);
      if (seed === 2) ctx.fillRect(px + 22, py + 8, 3, 3);
    }

    if (t.tilled) {
      ctx.fillStyle = t.watered ? "#5a3a24" : "#7a5230";
      ctx.fillRect(px + 3, py + 3, T - 6, T - 6);
      ctx.fillStyle = t.watered ? "#4a2f1d" : "#6a4526";
      ctx.fillRect(px + 3, py + 11, T - 6, 2);
      ctx.fillRect(px + 3, py + 20, T - 6, 2);
    }
    if (t.crop) drawCrop(px, py, t);

    if (t.type === "tree") drawTree(px, py);
    else if (t.type === "rock") drawRock(px, py);
  }

  function drawTree(px, py) {
    ctx.fillStyle = "#6b4423";
    ctx.fillRect(px + 13, py + 18, 6, 12);
    ctx.fillStyle = "#2f7d32";
    ctx.beginPath();
    ctx.arc(px + 16, py + 12, 12, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#3c9a3f";
    ctx.beginPath();
    ctx.arc(px + 11, py + 10, 7, 0, Math.PI * 2);
    ctx.arc(px + 21, py + 13, 7, 0, Math.PI * 2);
    ctx.fill();
  }

  function drawRock(px, py) {
    ctx.fillStyle = "#8b8b93";
    ctx.beginPath();
    ctx.moveTo(px + 6, py + 26);
    ctx.lineTo(px + 10, py + 12);
    ctx.lineTo(px + 20, py + 10);
    ctx.lineTo(px + 26, py + 24);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = "#a6a6ad";
    ctx.fillRect(px + 12, py + 14, 6, 4);
  }

  function drawCrop(px, py, t) {
    const c = C.CROPS[t.crop];
    const ripe = t.grow >= c.stages;
    const stageFrac = Math.min(1, t.grow / c.stages);
    const cx = px + T / 2;

    if (t.grow === 0) {
      ctx.fillStyle = "#3f7a2f"; ctx.fillRect(cx - 1, py + 22, 2, 6);
      ctx.fillStyle = "#7ac142"; ctx.fillRect(cx - 3, py + 20, 2, 2); ctx.fillRect(cx + 1, py + 20, 2, 2);
      return;
    }
    const stalkH = 6 + Math.round(stageFrac * 16);
    ctx.fillStyle = "#3f7a2f"; ctx.fillRect(cx - 1, py + (28 - stalkH), 3, stalkH);
    ctx.fillStyle = "#66b33a";
    ctx.fillRect(cx - 5, py + (28 - stalkH) + 3, 4, 2);
    ctx.fillRect(cx + 2, py + (28 - stalkH) + 6, 4, 2);

    const col = ripe ? c.ripe : c.color;
    if (t.crop === "wheat") {
      ctx.fillStyle = col;
      const topY = py + (28 - stalkH) - 2;
      ctx.fillRect(cx - 3, topY, 6, 8);
      if (ripe) { ctx.fillStyle = "#fff2b0"; ctx.fillRect(cx - 3, topY, 6, 2); }
    } else if (t.crop === "carrot") {
      if (ripe) { ctx.fillStyle = col; ctx.fillRect(cx - 3, py + 20, 6, 7); ctx.fillRect(cx - 2, py + 27, 4, 3); }
      else { ctx.fillStyle = "#4c9a2e"; ctx.fillRect(cx - 4, py + 20, 8, 4); }
    } else if (t.crop === "pumpkin") {
      const r = 4 + Math.round(stageFrac * 6);
      ctx.fillStyle = col;
      ctx.beginPath(); ctx.arc(cx, py + T - 8, r, 0, Math.PI * 2); ctx.fill();
      if (ripe) {
        ctx.fillStyle = "#c85a12"; ctx.fillRect(cx - r, py + T - 8, r * 2, 1);
        ctx.fillStyle = "#3f7a2f"; ctx.fillRect(cx - 1, py + T - 8 - r - 2, 2, 3);
      }
    }
    if (ripe) {
      const s = (Math.sin(performance.now() / 200 + px) + 1) / 2;
      ctx.fillStyle = "rgba(255,255,180," + (0.4 + s * 0.5) + ")";
      ctx.fillRect(px + T - 8, py + 4, 3, 3);
    }
  }

  // ---- Buildings ------------------------------------------------------------
  function drawBuilding(b) {
    const def = C.BUILDINGS[b.type];
    const px = b.x * T, py = b.y * T, w = b.w * T, h = b.h * T;

    if (b.type === "shipping_bin") {
      ctx.fillStyle = "#5a7a2e"; ctx.fillRect(px + 3, py + 8, T - 6, T - 12);
      ctx.fillStyle = def.color; ctx.fillRect(px + 3, py + 4, T - 6, 8);
      ctx.fillStyle = "#3f5720"; ctx.fillRect(px + 3, py + 11, T - 6, 2);
      ctx.fillStyle = "#dfe8c0"; ctx.font = "10px monospace"; ctx.fillText("📦", px + 9, py + 26);
      return;
    }
    if (b.type === "fence") {
      ctx.fillStyle = "#8a6237"; ctx.fillRect(px + 6, py + 8, 4, 20);
      ctx.fillRect(px + 22, py + 8, 4, 20);
      ctx.fillStyle = "#a5794a"; ctx.fillRect(px + 2, py + 12, T - 4, 4);
      ctx.fillRect(px + 2, py + 20, T - 4, 4);
      return;
    }

    // Coop / barn: walls + roof + door.
    const wallH = h - 14;
    ctx.fillStyle = def.color;
    ctx.fillRect(px + 2, py + 12, w - 4, wallH);
    ctx.fillStyle = shade(def.color, -20);
    ctx.fillRect(px + 2, py + 12 + wallH - 4, w - 4, 4);
    // roof
    ctx.fillStyle = "#7a3b2e";
    ctx.beginPath();
    ctx.moveTo(px, py + 14);
    ctx.lineTo(px + w / 2, py - 2);
    ctx.lineTo(px + w, py + 14);
    ctx.closePath();
    ctx.fill();
    // door
    ctx.fillStyle = "#5a3a24";
    ctx.fillRect(px + w / 2 - 7, py + 12 + wallH - 16, 14, 16);
    // sign emoji
    ctx.font = "14px monospace";
    ctx.fillText(def.emoji, px + w / 2 - 8, py + 26);
  }

  function shade(hex, amt) {
    const n = parseInt(hex.slice(1), 16);
    let r = (n >> 16) + amt, g = ((n >> 8) & 255) + amt, b = (n & 255) + amt;
    r = Math.max(0, Math.min(255, r)); g = Math.max(0, Math.min(255, g)); b = Math.max(0, Math.min(255, b));
    return "rgb(" + r + "," + g + "," + b + ")";
  }

  // ---- Animals --------------------------------------------------------------
  function drawAnimal(a) {
    const x = a.wx, y = a.wy;
    ctx.fillStyle = "rgba(0,0,0,0.2)";
    ctx.beginPath(); ctx.ellipse(x, y + 2, 9, 3, 0, 0, Math.PI * 2); ctx.fill();
    const def = C.ANIMALS[a.type];

    if (a.type === "chicken") {
      ctx.fillStyle = def.color; ctx.fillRect(x - 6, y - 10, 12, 10);
      ctx.fillStyle = "#e33"; ctx.fillRect(x - 3, y - 15, 6, 4); // comb
      ctx.fillStyle = def.color; ctx.fillRect(x - 4, y - 14, 8, 6); // head
      ctx.fillStyle = "#f5a623"; // beak
      ctx.fillRect(a.dir === "left" ? x - 8 : x + 5, y - 12, 3, 2);
      ctx.fillStyle = "#222"; ctx.fillRect(a.dir === "left" ? x - 3 : x + 1, y - 12, 2, 2);
      ctx.fillStyle = "#f5a623"; ctx.fillRect(x - 3, y, 2, 3); ctx.fillRect(x + 1, y, 2, 3);
    } else { // cow
      ctx.fillStyle = def.color; ctx.fillRect(x - 9, y - 13, 18, 13);
      ctx.fillStyle = "#3a3a3a"; ctx.fillRect(x - 6, y - 11, 5, 5); ctx.fillRect(x + 2, y - 6, 5, 5);
      ctx.fillStyle = def.color; ctx.fillRect(a.dir === "left" ? x - 13 : x + 6, y - 12, 7, 8); // head
      ctx.fillStyle = "#f2b8c6"; ctx.fillRect(a.dir === "left" ? x - 13 : x + 9, y - 7, 4, 3); // snout
      ctx.fillStyle = "#222"; ctx.fillRect(a.dir === "left" ? x - 11 : x + 8, y - 10, 2, 2);
      ctx.fillStyle = "#5a3a24"; ctx.fillRect(x - 7, y, 3, 3); ctx.fillRect(x + 4, y, 3, 3);
    }
  }

  // ---- Ground items ---------------------------------------------------------
  function drawGroundItem(it) {
    const x = it.wx, y = it.wy;
    const bob = Math.sin(performance.now() / 300 + x) * 1.5;
    ctx.fillStyle = "rgba(0,0,0,0.2)";
    ctx.beginPath(); ctx.ellipse(x, y + 3, 6, 2, 0, 0, Math.PI * 2); ctx.fill();
    if (it.id === "egg") {
      ctx.fillStyle = "#f7f0dd";
      ctx.beginPath(); ctx.ellipse(x, y - 3 + bob, 4, 5, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = "#e6dcc0"; ctx.fillRect(x - 2, y - 1 + bob, 2, 2);
    } else if (it.id === "milk") {
      ctx.fillStyle = "#d8d8d8"; ctx.fillRect(x - 4, y - 8 + bob, 8, 9);
      ctx.fillStyle = "#fff"; ctx.fillRect(x - 4, y - 8 + bob, 8, 2);
      ctx.fillStyle = "#bbb"; ctx.fillRect(x - 4, y - 1 + bob, 8, 2);
    } else {
      const d = C.ITEMS[it.id];
      ctx.fillStyle = (C.CROPS[it.id] && C.CROPS[it.id].ripe) || "#e8c86a";
      ctx.fillRect(x - 4, y - 6 + bob, 8, 8);
    }
  }

  // ---- Player ---------------------------------------------------------------
  function drawPlayer(p) {
    const x = Math.round(p.wx), feet = Math.round(p.wy);
    ctx.fillStyle = "rgba(0,0,0,0.25)";
    ctx.beginPath(); ctx.ellipse(x, feet, 9, 3, 0, 0, Math.PI * 2); ctx.fill();

    // legs (walk cycle)
    const swing = p.moving ? [0, 2, 0, -2][p.frame] : 0;
    ctx.fillStyle = "#28406a";
    ctx.fillRect(x - 5, feet - 8 + Math.max(0, swing), 4, 8 - Math.abs(swing) * 0.5);
    ctx.fillRect(x + 1, feet - 8 + Math.max(0, -swing), 4, 8 - Math.abs(swing) * 0.5);

    // body / shirt / head / hat (feet-relative)
    ctx.fillStyle = "#3a6ea5"; ctx.fillRect(x - 6, feet - 18, 12, 11);       // overalls
    ctx.fillStyle = "#d94f4f"; ctx.fillRect(x - 6, feet - 21, 12, 4);        // shirt
    ctx.fillStyle = "#f0c088"; ctx.fillRect(x - 5, feet - 28, 10, 9);        // head
    ctx.fillStyle = "#c8a24a"; ctx.fillRect(x - 8, feet - 30, 16, 3);        // hat brim
    ctx.fillRect(x - 5, feet - 33, 10, 3);                                   // hat top

    ctx.fillStyle = "#222";
    if (p.dir === "left") ctx.fillRect(x - 4, feet - 24, 2, 2);
    else if (p.dir === "right") ctx.fillRect(x + 2, feet - 24, 2, 2);
    else if (p.dir === "up") { ctx.fillStyle = "#d8a878"; ctx.fillRect(x - 5, feet - 28, 10, 9); }
    else { ctx.fillRect(x - 3, feet - 24, 2, 2); ctx.fillRect(x + 1, feet - 24, 2, 2); }
  }

  // ---- Overlays -------------------------------------------------------------
  function drawActionHighlight() {
    const a = App.player.actionTile();
    if (!App.world.tileAt(a.x, a.y)) return;
    ctx.strokeStyle = "rgba(255,255,255,0.5)";
    ctx.lineWidth = 2;
    ctx.strokeRect(a.x * T + 2, a.y * T + 2, T - 4, T - 4);
  }

  function drawPlacementGhost() {
    const s = App.state;
    const a = App.player.actionTile();
    const def = C.BUILDINGS[s.placing];
    const ok = App.world.canPlace(s.placing, a.x, a.y);
    ctx.globalAlpha = 0.5;
    ctx.fillStyle = ok ? "#8fd66b" : "#e0605a";
    ctx.fillRect(a.x * T, a.y * T, def.w * T, def.h * T);
    ctx.globalAlpha = 1;
    ctx.strokeStyle = ok ? "#eaffd0" : "#ffb0ac";
    ctx.lineWidth = 2;
    ctx.strokeRect(a.x * T + 1, a.y * T + 1, def.w * T - 2, def.h * T - 2);
  }

  App.render = { init: init, frame: frame };
})();
