// state.js — central game state, new game, and save/load (localStorage).
window.App = window.App || {};

(function () {
  const C = App.config;

  App.state = null;

  function newGame() {
    const world = App.world.generate();
    const inv = new Array(C.HOTBAR_SLOTS).fill(null);
    // Starting kit: the three tools plus a few seeds.
    inv[0] = { id: "hoe", count: 1 };
    inv[1] = { id: "watering_can", count: 1 };
    inv[2] = { id: "basket", count: 1 };
    inv[3] = { id: "wheat_seed", count: 6 };
    inv[4] = { id: "carrot_seed", count: 3 };

    App.state = {
      version: 1,
      coins: C.STARTING_COINS,
      day: 1,
      world: world,
      player: { wx: 8 * C.TILE + C.TILE / 2, wy: 13 * C.TILE, dir: "down", moving: false, frame: 0, animT: 0 },
      buildings: [],
      animals: [],
      inventory: inv,
      selected: 0,
      shipping: [],       // [{id, count}] awaiting overnight sale
      groundItems: [],    // [{id, wx, wy}] to walk over and collect
      placing: null,      // building type currently being placed
      cam: { x: 0, y: 0 },
      morning: null,      // summary text shown after sleeping
    };

    // A shipping bin near the house so you can sell from day one.
    App.world.placeBuilding("shipping_bin", 10, 12);
    return App.state;
  }

  // ---- Persistence ----------------------------------------------------------
  // The base terrain is deterministic, so we only store mutable farm tiles plus
  // the dynamic entities. On load we regenerate terrain and re-apply overrides.
  function serialize() {
    const s = App.state;
    const tileOverrides = [];
    for (let y = 0; y < s.world.rows; y++) {
      for (let x = 0; x < s.world.cols; x++) {
        const t = s.world.tiles[y][x];
        if (t.tilled || t.crop) {
          tileOverrides.push({ x, y, tilled: t.tilled, watered: t.watered, crop: t.crop, grow: t.grow, prog: t.prog });
        }
      }
    }
    return JSON.stringify({
      version: s.version, coins: s.coins, day: s.day,
      player: s.player, buildings: s.buildings, animals: s.animals,
      inventory: s.inventory, selected: s.selected,
      shipping: s.shipping, groundItems: s.groundItems,
      tileOverrides: tileOverrides,
    });
  }

  function save() {
    try { localStorage.setItem(C.SAVE_KEY, serialize()); return true; }
    catch (e) { return false; }
  }

  function load() {
    let raw;
    try { raw = localStorage.getItem(C.SAVE_KEY); } catch (e) { return false; }
    if (!raw) return false;
    let d;
    try { d = JSON.parse(raw); } catch (e) { return false; }
    if (!d || d.version !== 1) return false;

    const world = App.world.generate();
    // Re-apply the saved farm tiles onto fresh terrain.
    (d.tileOverrides || []).forEach((o) => {
      const t = world.tiles[o.y] && world.tiles[o.y][o.x];
      if (!t) return;
      t.type = "grass";
      t.tilled = o.tilled; t.watered = o.watered;
      t.crop = o.crop; t.grow = o.grow; t.prog = o.prog || 0;
    });

    App.state = {
      version: 1,
      coins: d.coins, day: d.day, world: world,
      player: d.player,
      buildings: d.buildings || [],
      animals: d.animals || [],
      inventory: d.inventory || new Array(C.HOTBAR_SLOTS).fill(null),
      selected: d.selected || 0,
      shipping: d.shipping || [],
      groundItems: d.groundItems || [],
      placing: null,
      cam: { x: 0, y: 0 },
      morning: null,
    };
    return true;
  }

  function reset() {
    try { localStorage.removeItem(C.SAVE_KEY); } catch (e) {}
    newGame();
  }

  App.stateApi = { newGame: newGame, save: save, load: load, reset: reset, serialize: serialize };
})();
