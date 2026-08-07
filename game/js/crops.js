// crops.js — tilling, planting, watering, harvesting, and overnight growth.
// Ported from the original useToolAt/nextDay logic, now driven by the selected
// inventory item and operating on the world tilemap.
window.App = window.App || {};

(function () {
  const C = App.config;

  function ripe(t) { return t.crop && t.grow >= C.CROPS[t.crop].stages; }

  // Act on tile (tx,ty) with the currently selected item. Returns a toast string.
  function useOnTile(tx, ty) {
    const t = App.world.tileAt(tx, ty);
    if (!t) return null;
    if (App.world.buildingAt(tx, ty)) return null;
    if (t.type === "water" || t.type === "tree" || t.type === "rock") return null;

    const item = App.inventory.selectedDef();
    const id = App.inventory.selectedId();
    if (!item) return "Nothing selected.";

    // Tools ------------------------------------------------------------------
    if (id === "hoe") {
      if (t.crop) return "Something's growing here!";
      if (t.type !== "grass") return "Can't till that.";
      if (t.tilled) return "Already tilled.";
      t.tilled = true;
      return "Tilled the soil. 🟫";
    }
    if (id === "watering_can") {
      if (!t.tilled) return "Till the soil first.";
      if (t.watered) return "Already watered.";
      t.watered = true;
      return "Watered! 💧";
    }
    if (id === "basket") {
      if (ripe(t)) {
        const crop = t.crop;
        App.inventory.add(crop, 1);
        t.crop = null; t.grow = 0; t.prog = 0; t.tilled = false; t.watered = false;
        const c = C.CROPS[crop];
        return "Harvested " + c.name + " " + c.emoji + " → basket";
      }
      if (t.crop) return "Not ripe yet.";
      return "Nothing to harvest.";
    }

    // Seeds ------------------------------------------------------------------
    if (item.type === "seed") {
      if (!t.tilled) return "Till the soil first (⛏️).";
      if (t.crop) return "Already planted here.";
      t.crop = item.crop; t.grow = 0; t.prog = 0;
      App.inventory.consumeSelected(1);
      return "Planted " + C.CROPS[item.crop].name + " " + C.CROPS[item.crop].emoji;
    }

    return "Can't use that here.";
  }

  // Advance all crops one day. Watered tiles gain 2 progress, else 1.
  function growOvernight() {
    const w = App.state.world;
    for (let y = 0; y < w.rows; y++) {
      for (let x = 0; x < w.cols; x++) {
        const t = w.tiles[y][x];
        if (t.crop) {
          const c = C.CROPS[t.crop];
          t.prog = (t.prog || 0) + (t.watered ? 2 : 1);
          while (t.prog >= c.growDays && t.grow < c.stages) {
            t.prog -= c.growDays;
            t.grow++;
          }
        }
        t.watered = false; // dries overnight
      }
    }
  }

  App.crops = { useOnTile: useOnTile, growOvernight: growOvernight, ripe: ripe };
})();
