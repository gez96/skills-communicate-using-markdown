// world.js — tilemap generation, tile queries, collision, building placement.
window.App = window.App || {};

(function () {
  const C = App.config;

  // Deterministic RNG (mulberry32) so the terrain is identical every load and
  // we only need to persist the mutable farm tiles, not the whole map.
  function mulberry32(seed) {
    return function () {
      seed |= 0; seed = (seed + 0x6D2B79F5) | 0;
      let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function makeTile(type) {
    // Farm fields (tilled/crop) live directly on the tile.
    return { type: type, tilled: false, watered: false, crop: null, grow: 0, prog: 0 };
  }

  // Build the base terrain. Returns { tiles, cols, rows }.
  function generate() {
    const cols = C.WORLD_COLS, rows = C.WORLD_ROWS;
    const rng = mulberry32(1337);
    const tiles = [];
    for (let y = 0; y < rows; y++) {
      const row = [];
      for (let x = 0; x < cols; x++) row.push(makeTile("grass"));
      tiles.push(row);
    }

    // The farm plot — kept clear of obstacles so there is room to plant.
    const farmZone = { x0: 3, y0: 3, x1: 22, y1: 24 };
    const inFarm = (x, y) => x >= farmZone.x0 && x <= farmZone.x1 && y >= farmZone.y0 && y <= farmZone.y1;

    // A dirt path running down the middle of the farm.
    for (let y = 4; y < 24; y++) tiles[y][12].type = "path";
    for (let x = 6; x < 18; x++) tiles[10][x].type = "path";

    // A pond (solid water) off to the east.
    const pond = { cx: 30, cy: 9, r: 3 };
    for (let y = pond.cy - pond.r - 1; y <= pond.cy + pond.r + 1; y++) {
      for (let x = pond.cx - pond.r - 1; x <= pond.cx + pond.r + 1; x++) {
        if (x < 0 || y < 0 || x >= cols || y >= rows) continue;
        const d = Math.hypot(x - pond.cx, y - pond.cy);
        if (d <= pond.r + rng() * 0.6) tiles[y][x].type = "water";
      }
    }

    // Scatter trees and rocks outside the farm zone as solid scenery.
    let trees = 46, rocks = 26, guard = 0;
    while ((trees > 0 || rocks > 0) && guard++ < 4000) {
      const x = Math.floor(rng() * cols), y = Math.floor(rng() * rows);
      const t = tiles[y][x];
      if (t.type !== "grass" || inFarm(x, y)) continue;
      if (trees > 0) { t.type = "tree"; trees--; }
      else if (rocks > 0) { t.type = "rock"; rocks--; }
    }

    return { tiles: tiles, cols: cols, rows: rows };
  }

  function tileAt(x, y) {
    const w = App.state.world;
    if (!w || x < 0 || y < 0 || x >= w.cols || y >= w.rows) return null;
    return w.tiles[y][x];
  }

  // Solid = cannot walk onto. Buildings mark their footprint solid via a set.
  function isSolidTile(x, y) {
    const t = tileAt(x, y);
    if (!t) return true; // world border
    if (t.type === "water" || t.type === "tree" || t.type === "rock") return true;
    if (App.world.buildingAt(x, y)) return true;
    return false;
  }

  function buildingAt(x, y) {
    const bs = App.state.buildings;
    for (let i = 0; i < bs.length; i++) {
      const b = bs[i];
      if (x >= b.x && x < b.x + b.w && y >= b.y && y < b.y + b.h) return b;
    }
    return null;
  }

  // Can a w×h building be placed with its top-left at (x,y)?
  function canPlace(type, x, y) {
    const def = C.BUILDINGS[type];
    if (!def) return false;
    for (let dy = 0; dy < def.h; dy++) {
      for (let dx = 0; dx < def.w; dx++) {
        const tx = x + dx, ty = y + dy;
        const t = tileAt(tx, ty);
        if (!t) return false;
        if (t.type !== "grass" && t.type !== "path") return false;
        if (t.crop) return false;
        if (buildingAt(tx, ty)) return false;
      }
    }
    return true;
  }

  function placeBuilding(type, x, y) {
    const def = C.BUILDINGS[type];
    const b = { id: "b" + Date.now() + Math.floor(Math.random() * 999), type: type, x: x, y: y, w: def.w, h: def.h };
    App.state.buildings.push(b);
    return b;
  }

  App.world = {
    generate: generate,
    makeTile: makeTile,
    tileAt: tileAt,
    isSolidTile: isSolidTile,
    buildingAt: buildingAt,
    canPlace: canPlace,
    placeBuilding: placeBuilding,
  };
})();
