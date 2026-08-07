// animals.js — livestock that live by their building, get fed, and produce goods.
window.App = window.App || {};

(function () {
  const C = App.config;
  const T = C.TILE;

  function buildingById(id) { return App.state.buildings.find((b) => b.id === id) || null; }

  function homeCenter(a) {
    const b = buildingById(a.home);
    if (!b) return { x: a.wx, y: a.wy, roam: 3 * T };
    return { x: (b.x + b.w / 2) * T, y: (b.y + b.h + 1) * T, roam: (C.ANIMALS[a.type].roam) * T };
  }

  // Try to buy an animal of `type`; needs a matching building with free space.
  function buy(type) {
    const def = C.ANIMALS[type];
    if (!def) return "Unknown animal.";
    if (App.state.coins < def.buy) return "Not enough coins (need " + def.buy + ").";
    // Which building houses this animal?
    const home = App.state.buildings.find((b) => {
      const bd = C.BUILDINGS[b.type];
      if (bd.houses !== type) return false;
      const n = App.state.animals.filter((a) => a.home === b.id).length;
      return n < bd.capacity;
    });
    if (!home) {
      const bd = Object.values(C.BUILDINGS).find((x) => x.houses === type);
      return "Build a " + (bd ? bd.name : "home") + " first (with space).";
    }
    App.state.coins -= def.buy;
    const cx = (home.x + home.w / 2) * T, cy = (home.y + home.h + 1) * T;
    App.state.animals.push({
      id: "a" + Date.now() + Math.floor(Math.random() * 999),
      type: type, home: home.id,
      wx: cx, wy: cy, dir: "down", fed: false,
      tx: cx, ty: cy, waitTimer: 30 + Math.random() * 60,
    });
    return "A new " + def.name + " " + def.emoji + " joined the farm!";
  }

  // Feed the closest unfed animal within reach of world point (px,py). Uses 1 hay.
  function feedNear(px, py) {
    if (App.inventory.countOf("hay") <= 0) return "You have no hay.";
    let best = null, bestD = 44;
    App.state.animals.forEach((a) => {
      if (a.fed) return;
      const d = Math.hypot(a.wx - px, a.wy - py);
      if (d < bestD) { bestD = d; best = a; }
    });
    if (!best) return "No hungry animal nearby.";
    App.inventory.remove("hay", 1);
    best.fed = true;
    return "Fed the " + C.ANIMALS[best.type].name + " 🌿";
  }

  // Fed animals drop produce near themselves; hunger resets. Returns a count.
  function produceOvernight() {
    let n = 0;
    App.state.animals.forEach((a) => {
      if (!a.fed) return;
      const def = C.ANIMALS[a.type];
      App.state.groundItems.push({
        id: def.produce,
        wx: a.wx + (Math.random() * 20 - 10),
        wy: a.wy + (Math.random() * 20 - 10),
      });
      a.fed = false;
      n++;
    });
    return n;
  }

  // Gentle random wander within the roam radius of home.
  function update() {
    const speedScale = 1;
    App.state.animals.forEach((a) => {
      const h = homeCenter(a);
      a.waitTimer -= 1;
      if (a.waitTimer <= 0) {
        const ang = Math.random() * Math.PI * 2;
        const r = Math.random() * h.roam;
        a.tx = h.x + Math.cos(ang) * r;
        a.ty = h.y + Math.sin(ang) * r;
        a.waitTimer = 40 + Math.random() * 120;
      }
      const dx = a.tx - a.wx, dy = a.ty - a.wy;
      const dist = Math.hypot(dx, dy);
      const sp = C.ANIMALS[a.type].speed * speedScale;
      if (dist > 1.5) {
        const nx = a.wx + (dx / dist) * sp;
        const ny = a.wy + (dy / dist) * sp;
        // Stay off solid tiles (water/trees/buildings).
        if (!App.world.isSolidTile(Math.floor(nx / T), Math.floor(ny / T))) {
          a.wx = nx; a.wy = ny;
          a.dir = Math.abs(dx) > Math.abs(dy) ? (dx < 0 ? "left" : "right") : (dy < 0 ? "up" : "down");
        } else {
          a.waitTimer = 0; // pick a new target next frame
        }
      }
    });
  }

  App.animals = { buy: buy, feedNear: feedNear, produceOvernight: produceOvernight, update: update };
})();
