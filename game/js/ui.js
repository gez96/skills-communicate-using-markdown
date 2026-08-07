// ui.js — HUD, hotbar, toast, shop panel, and morning summary.
window.App = window.App || {};

(function () {
  const C = App.config;
  const $ = (id) => document.getElementById(id);

  let toastTimer = null;

  function toast(msg) {
    const t = $("toast");
    if (!t) return;
    t.textContent = msg;
    t.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => t.classList.remove("show"), 1600);
  }

  function refreshHUD() {
    $("coins").textContent = App.state.coins;
    $("day").textContent = App.state.day;
    const binCount = App.state.shipping.reduce((n, e) => n + e.count, 0);
    $("bin").textContent = binCount;
  }

  function buildHotbar() {
    const bar = $("hotbar");
    bar.innerHTML = "";
    for (let i = 0; i < C.HOTBAR_SLOTS; i++) {
      const cell = document.createElement("div");
      cell.className = "slot";
      cell.dataset.index = i;
      cell.addEventListener("click", () => { App.inventory.select(i); refreshHotbar(); });
      bar.appendChild(cell);
    }
    refreshHotbar();
  }

  function refreshHotbar() {
    const bar = $("hotbar");
    const s = App.state;
    for (let i = 0; i < bar.children.length; i++) {
      const cell = bar.children[i];
      const slot = s.inventory[i];
      cell.classList.toggle("active", i === s.selected);
      if (slot) {
        const d = C.ITEMS[slot.id];
        const count = (d.stackable && slot.count > 1) ? '<span class="ct">' + slot.count + "</span>" : "";
        cell.innerHTML = '<span class="emo">' + d.emoji + "</span>" + count;
        cell.title = d.name;
      } else {
        cell.innerHTML = "";
        cell.title = "";
      }
    }
    const sel = App.inventory.selectedDef();
    $("selname").textContent = sel ? sel.name : "—";
  }

  // ---- Shop -----------------------------------------------------------------
  function shopRow(label, emoji, cost, disabled, onClick) {
    const row = document.createElement("div");
    row.className = "shop-row";
    row.innerHTML = '<span class="shop-emo">' + emoji + '</span><span class="shop-name">' + label +
      '</span><span class="shop-cost">' + cost + "c</span>";
    const btn = document.createElement("button");
    btn.className = "shop-buy";
    btn.textContent = "Buy";
    btn.disabled = !!disabled;
    btn.addEventListener("click", onClick);
    row.appendChild(btn);
    return row;
  }

  function openShop() {
    const panel = $("shop-panel");
    const list = $("shop-list");
    list.innerHTML = "";
    const s = App.state;

    const section = (title) => {
      const h = document.createElement("div");
      h.className = "shop-head";
      h.textContent = title;
      list.appendChild(h);
    };

    section("🌱 Seeds");
    ["wheat_seed", "carrot_seed", "pumpkin_seed"].forEach((id) => {
      const d = C.ITEMS[id];
      list.appendChild(shopRow(d.name, d.emoji, d.buy, s.coins < d.buy, () => {
        if (s.coins < d.buy) return;
        s.coins -= d.buy; App.inventory.add(id, 1);
        toast("Bought " + d.name); afterBuy();
      }));
    });

    section("🐔 Animals & feed");
    const hay = C.ITEMS.hay;
    list.appendChild(shopRow("Hay", hay.emoji, hay.buy, s.coins < hay.buy, () => {
      if (s.coins < hay.buy) return;
      s.coins -= hay.buy; App.inventory.add("hay", 1);
      toast("Bought Hay 🌿"); afterBuy();
    }));
    ["chicken", "cow"].forEach((type) => {
      const d = C.ANIMALS[type];
      list.appendChild(shopRow(d.name, d.emoji, d.buy, s.coins < d.buy, () => {
        toast(App.animals.buy(type)); afterBuy();
      }));
    });

    section("🏠 Buildings (buy → then place)");
    ["coop", "barn", "shipping_bin", "fence"].forEach((type) => {
      const d = C.BUILDINGS[type];
      list.appendChild(shopRow(d.name, d.emoji, d.buy, s.coins < d.buy, () => {
        if (s.coins < d.buy) return;
        s.placing = type;
        closeShop();
        toast("Placing " + d.name + " — tap a spot / press action. (Esc/✕ cancels)");
      }));
    });

    panel.classList.add("show");
  }

  function afterBuy() { refreshHUD(); refreshHotbar(); if ($("shop-panel").classList.contains("show")) openShop(); }
  function closeShop() { $("shop-panel").classList.remove("show"); }

  function showMorning(text) {
    const m = $("morning");
    $("morning-text").innerHTML = text;
    m.classList.add("show");
  }
  function hideMorning() { $("morning").classList.remove("show"); }

  App.ui = {
    toast: toast, refreshHUD: refreshHUD, buildHotbar: buildHotbar, refreshHotbar: refreshHotbar,
    openShop: openShop, closeShop: closeShop, showMorning: showMorning, hideMorning: hideMorning,
  };
})();
