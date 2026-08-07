// player.js — smooth movement, collision, facing, camera, and item pickup.
window.App = window.App || {};

(function () {
  const C = App.config;
  const T = C.TILE;
  const HALF_W = 9;   // collision box half-width (feet)
  const BOX_H = 12;   // collision box height (feet)

  function boxSolid(cx, feetY) {
    const corners = [
      [cx - HALF_W, feetY - BOX_H], [cx + HALF_W, feetY - BOX_H],
      [cx - HALF_W, feetY],         [cx + HALF_W, feetY],
    ];
    for (const [px, py] of corners) {
      if (App.world.isSolidTile(Math.floor(px / T), Math.floor(py / T))) return true;
    }
    return false;
  }

  // The tile the player is currently facing (used by tools).
  function actionTile() {
    const p = App.state.player;
    const cx = Math.floor(p.wx / T);
    const cy = Math.floor((p.wy - 8) / T);
    let x = cx, y = cy;
    if (p.dir === "up") y--;
    else if (p.dir === "down") y++;
    else if (p.dir === "left") x--;
    else if (p.dir === "right") x++;
    return { x: x, y: y };
  }

  function update() {
    const p = App.state.player;
    let v = App.input.getMoveVector(); // {x,y} each in [-1,1]
    let vx = v.x, vy = v.y;
    const len = Math.hypot(vx, vy);
    p.moving = len > 0.01;

    if (p.moving) {
      vx /= len; vy /= len;
      // Facing follows dominant axis.
      if (Math.abs(vx) > Math.abs(vy)) p.dir = vx < 0 ? "left" : "right";
      else p.dir = vy < 0 ? "up" : "down";

      const sp = C.PLAYER_SPEED;
      const nx = p.wx + vx * sp;
      if (!boxSolid(nx, p.wy)) p.wx = nx;
      const ny = p.wy + vy * sp;
      if (!boxSolid(p.wx, ny)) p.wy = ny;

      p.animT += 0.25;
      p.frame = Math.floor(p.animT) % 4;
    } else {
      p.frame = 0;
    }

    pickupGroundItems();
    updateCamera();
  }

  function pickupGroundItems() {
    const p = App.state.player;
    const gi = App.state.groundItems;
    for (let i = gi.length - 1; i >= 0; i--) {
      const it = gi[i];
      if (Math.hypot(it.wx - p.wx, it.wy - (p.wy - 10)) < C.PICKUP_RADIUS) {
        const leftover = App.inventory.add(it.id, 1);
        if (leftover === 0) {
          gi.splice(i, 1);
          const d = C.ITEMS[it.id];
          App.ui.toast("Picked up " + d.name + " " + d.emoji);
        }
      }
    }
  }

  function updateCamera() {
    const p = App.state.player;
    const viewW = C.VIEW_COLS * T, viewH = C.VIEW_ROWS * T;
    const worldW = C.WORLD_COLS * T, worldH = C.WORLD_ROWS * T;
    let cx = p.wx - viewW / 2;
    let cy = (p.wy - 16) - viewH / 2;
    cx = Math.max(0, Math.min(worldW - viewW, cx));
    cy = Math.max(0, Math.min(worldH - viewH, cy));
    App.state.cam.x = cx;
    App.state.cam.y = cy;
  }

  App.player = { update: update, actionTile: actionTile, updateCamera: updateCamera };
})();
