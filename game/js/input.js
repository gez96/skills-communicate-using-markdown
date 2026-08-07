// input.js — keyboard, mouse, and on-screen touch controls.
window.App = window.App || {};

(function () {
  const C = App.config;
  const T = C.TILE;

  const keys = {};                    // held keyboard keys
  const touch = { x: 0, y: 0 };       // virtual d-pad vector

  function getMoveVector() {
    let x = 0, y = 0;
    if (keys["arrowleft"] || keys["a"]) x -= 1;
    if (keys["arrowright"] || keys["d"]) x += 1;
    if (keys["arrowup"] || keys["w"]) y -= 1;
    if (keys["arrowdown"] || keys["s"]) y += 1;
    x += touch.x; y += touch.y;
    return { x: Math.max(-1, Math.min(1, x)), y: Math.max(-1, Math.min(1, y)) };
  }

  function init(canvas) {
    // ---- Keyboard ----
    window.addEventListener("keydown", (e) => {
      const k = e.key.toLowerCase();
      if (["arrowup", "arrowdown", "arrowleft", "arrowright", " "].includes(k) ||
          ["w", "a", "s", "d"].includes(k)) e.preventDefault();

      if (k === " " || k === "e") { App.game.doAction(); return; }
      if (k === "escape") { App.game.cancel(); return; }
      if (k >= "1" && k <= "9") { App.inventory.select(parseInt(k, 10) - 1); App.ui.refreshHotbar(); return; }
      keys[k] = true;
    });
    window.addEventListener("keyup", (e) => { keys[e.key.toLowerCase()] = false; });
    window.addEventListener("blur", () => { for (const k in keys) keys[k] = false; });

    // ---- Mouse / tap on the field ----
    canvas.addEventListener("click", (e) => {
      const rect = canvas.getBoundingClientRect();
      const sx = canvas.width / rect.width, sy = canvas.height / rect.height;
      const wx = (e.clientX - rect.left) * sx + App.state.cam.x;
      const wy = (e.clientY - rect.top) * sy + App.state.cam.y;
      const tx = Math.floor(wx / T), ty = Math.floor(wy / T);
      App.game.clickTile(tx, ty);
    });

    // ---- Touch d-pad + action button ----
    document.querySelectorAll("[data-dir]").forEach((btn) => {
      const dir = btn.dataset.dir;
      const set = (on) => {
        if (dir === "left") touch.x = on ? -1 : 0;
        if (dir === "right") touch.x = on ? 1 : 0;
        if (dir === "up") touch.y = on ? -1 : 0;
        if (dir === "down") touch.y = on ? 1 : 0;
      };
      const down = (e) => { e.preventDefault(); set(true); };
      const up = (e) => { e.preventDefault(); set(false); };
      btn.addEventListener("pointerdown", down);
      btn.addEventListener("pointerup", up);
      btn.addEventListener("pointerleave", up);
      btn.addEventListener("pointercancel", up);
    });

    const act = document.getElementById("btn-action");
    if (act) act.addEventListener("pointerdown", (e) => { e.preventDefault(); App.game.doAction(); });
  }

  App.input = { init: init, getMoveVector: getMoveVector };
})();
