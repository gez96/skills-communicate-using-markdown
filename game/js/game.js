// game.js — bootstrap, main loop, and the actions that tie systems together.
window.App = window.App || {};

(function () {
  const C = App.config;
  const T = C.TILE;
  let canvas;

  function refresh() { App.ui.refreshHUD(); App.ui.refreshHotbar(); }

  // Act on a specific tile (shipping / feeding / farming), respecting placement.
  function actOnTile(tx, ty) {
    const s = App.state;
    if (s.placing) { tryPlace(tx, ty); return; }

    const b = App.world.buildingAt(tx, ty);
    if (b && b.type === "shipping_bin") {
      App.ui.toast(App.shipping.depositSelected());
      refresh();
      return;
    }

    if (App.inventory.selectedId() === "hay") {
      App.ui.toast(App.animals.feedNear((tx + 0.5) * T, (ty + 0.5) * T));
      refresh();
      return;
    }

    const msg = App.crops.useOnTile(tx, ty);
    if (msg) App.ui.toast(msg);
    refresh();
  }

  function doAction() {
    if (App.state.placing) {
      const a = App.player.actionTile();
      tryPlace(a.x, a.y);
      return;
    }
    const a = App.player.actionTile();
    actOnTile(a.x, a.y);
  }

  // Tap on the field: act if adjacent, otherwise just turn to face it.
  function clickTile(tx, ty) {
    const s = App.state;
    if (s.placing) { tryPlace(tx, ty); return; }
    const p = s.player;
    const pcx = Math.floor(p.wx / T), pcy = Math.floor((p.wy - 8) / T);
    const dx = tx - pcx, dy = ty - pcy;
    if (dx !== 0 || dy !== 0) {
      if (Math.abs(dx) > Math.abs(dy)) p.dir = dx < 0 ? "left" : "right";
      else p.dir = dy < 0 ? "up" : "down";
    }
    if (Math.max(Math.abs(dx), Math.abs(dy)) <= 1) actOnTile(tx, ty);
  }

  function tryPlace(tx, ty) {
    const s = App.state;
    const type = s.placing;
    if (!type) return;
    const def = C.BUILDINGS[type];
    if (!App.world.canPlace(type, tx, ty)) { App.ui.toast("Can't place there — needs clear ground."); return; }
    if (s.coins < def.buy) { App.ui.toast("Not enough coins."); s.placing = null; toggleCancel(); return; }
    s.coins -= def.buy;
    App.world.placeBuilding(type, tx, ty);
    s.placing = null;
    toggleCancel();
    App.ui.toast(def.name + " placed! 🏗️");
    refresh();
  }

  function cancel() {
    if (App.state.placing) { App.state.placing = null; toggleCancel(); App.ui.toast("Placement cancelled."); return; }
    App.ui.closeShop();
    App.ui.hideMorning();
  }

  function toggleCancel() {
    const btn = document.getElementById("btn-cancel");
    if (btn) btn.style.display = App.state.placing ? "inline-block" : "none";
  }

  function sleep() {
    App.crops.growOvernight();
    const sold = App.shipping.sellOvernight();
    const produced = App.animals.produceOvernight();
    App.state.day++;
    App.stateApi.save();

    const lines = ["<b>☀️ Day " + App.state.day + "</b>"];
    if (sold.summary) lines.push(sold.summary);
    if (produced > 0) lines.push("Your animals left " + produced + " thing" + (produced > 1 ? "s" : "") + " to collect 🥚");
    lines.push("Crops grew. Watered soil dried out.");
    App.ui.showMorning(lines.join("<br>"));
    refresh();
  }

  function loop() {
    App.player.update();
    App.animals.update();
    App.render.frame();
    requestAnimationFrame(loop);
  }

  function init() {
    canvas = document.getElementById("game");
    App.render.init(canvas);

    if (!App.stateApi.load()) App.stateApi.newGame();
    App.player.updateCamera();

    App.input.init(canvas);
    App.ui.buildHotbar();
    App.ui.refreshHUD();

    document.getElementById("btn-sleep").addEventListener("click", sleep);
    document.getElementById("btn-shop").addEventListener("click", App.ui.openShop);
    document.getElementById("shop-close").addEventListener("click", App.ui.closeShop);
    document.getElementById("morning-ok").addEventListener("click", App.ui.hideMorning);
    document.getElementById("btn-cancel").addEventListener("click", cancel);
    document.getElementById("btn-reset").addEventListener("click", () => {
      if (!window.confirm("Reset the farm and lose all progress?")) return;
      App.stateApi.reset();
      App.player.updateCamera();
      App.ui.buildHotbar();
      refresh();
      App.ui.toast("Fresh farm! 🌱");
    });
    toggleCancel();

    App.ui.toast("Welcome to your farm! Walk with the pad, tap a tile to act.");
    requestAnimationFrame(loop);
  }

  App.game = { doAction: doAction, clickTile: clickTile, cancel: cancel, sleep: sleep, tryPlace: tryPlace };

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
