// inventory.js — slot-based hotbar inventory. Slots hold {id, count} or null.
window.App = window.App || {};

(function () {
  const C = App.config;

  function def(id) { return C.ITEMS[id] || null; }
  function isStackable(id) { const d = def(id); return !!(d && d.stackable); }

  function slots() { return App.state.inventory; }

  function findSlot(id) {
    const s = slots();
    for (let i = 0; i < s.length; i++) if (s[i] && s[i].id === id) return i;
    return -1;
  }

  function firstEmpty() {
    const s = slots();
    for (let i = 0; i < s.length; i++) if (!s[i]) return i;
    return -1;
  }

  function countOf(id) {
    return slots().reduce((n, sl) => n + (sl && sl.id === id ? sl.count : 0), 0);
  }

  // Add count of id. Stackables merge into one slot; others take empty slots.
  // Returns how many could NOT be added (0 = all fit).
  function add(id, count) {
    count = count || 1;
    const s = slots();
    if (isStackable(id)) {
      let i = findSlot(id);
      if (i === -1) i = firstEmpty();
      if (i === -1) return count;
      s[i] = s[i] || { id: id, count: 0 };
      s[i].count += count;
      return 0;
    }
    while (count > 0) {
      const i = firstEmpty();
      if (i === -1) break;
      s[i] = { id: id, count: 1 };
      count--;
    }
    return count;
  }

  // Remove up to count of id (searching all slots). Returns amount removed.
  function remove(id, count) {
    count = count || 1;
    const s = slots();
    let removed = 0;
    for (let i = 0; i < s.length && removed < count; i++) {
      if (!s[i] || s[i].id !== id) continue;
      const take = Math.min(s[i].count, count - removed);
      s[i].count -= take;
      removed += take;
      if (s[i].count <= 0) s[i] = null;
    }
    return removed;
  }

  function selectedSlot() { return slots()[App.state.selected] || null; }
  function selectedId() { const sl = selectedSlot(); return sl ? sl.id : null; }
  function selectedDef() { const id = selectedId(); return id ? def(id) : null; }

  // Remove one unit from the currently selected slot (for consumables/seeds).
  function consumeSelected(n) {
    n = n || 1;
    const sl = selectedSlot();
    if (!sl) return 0;
    const take = Math.min(sl.count, n);
    sl.count -= take;
    if (sl.count <= 0) slots()[App.state.selected] = null;
    return take;
  }

  function select(i) {
    if (i >= 0 && i < slots().length) App.state.selected = i;
  }

  App.inventory = {
    def: def, isStackable: isStackable, findSlot: findSlot, firstEmpty: firstEmpty,
    countOf: countOf, add: add, remove: remove,
    selectedSlot: selectedSlot, selectedId: selectedId, selectedDef: selectedDef,
    consumeSelected: consumeSelected, select: select,
  };
})();
