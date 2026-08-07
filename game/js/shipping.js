// shipping.js — the shipping bin. Deposit stacks by day; they sell overnight.
window.App = window.App || {};

(function () {
  const C = App.config;

  function isShippable(id) {
    const d = C.ITEMS[id];
    return !!(d && (d.type === "crop" || d.type === "produce") && d.price > 0);
  }

  // Deposit the whole selected stack into the bin. Returns a toast string.
  function depositSelected() {
    const sl = App.inventory.selectedSlot();
    if (!sl) return "Nothing to ship.";
    if (!isShippable(sl.id)) return "That can't be shipped.";
    const id = sl.id, count = sl.count;
    App.inventory.remove(id, count);
    // Merge into the bin.
    const bin = App.state.shipping;
    const existing = bin.find((e) => e.id === id);
    if (existing) existing.count += count; else bin.push({ id: id, count: count });
    const d = C.ITEMS[id];
    return "Shipped " + count + "x " + d.name + " " + d.emoji;
  }

  // Sell everything in the bin. Returns { coins, summary } and clears the bin.
  function sellOvernight() {
    const bin = App.state.shipping;
    if (!bin.length) return { coins: 0, summary: "" };
    let total = 0;
    const parts = [];
    bin.forEach((e) => {
      const d = C.ITEMS[e.id];
      const sub = d.price * e.count;
      total += sub;
      parts.push(e.count + "x " + d.name);
    });
    App.state.coins += total;
    App.state.shipping = [];
    return { coins: total, summary: "Sold " + parts.join(", ") + " → +" + total + "c" };
  }

  App.shipping = { isShippable: isShippable, depositSelected: depositSelected, sellOvernight: sellOvernight };
})();
