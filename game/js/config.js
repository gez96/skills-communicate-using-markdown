// config.js — constants and data tables for Pixel Harvest.
// Everything hangs off a single global `App` namespace so the files can be
// loaded as ordinary <script src> tags (works over file://, no build step).
window.App = window.App || {};

App.config = {
  TILE: 32,
  VIEW_COLS: 15,
  VIEW_ROWS: 15,
  WORLD_COLS: 40,
  WORLD_ROWS: 40,
  PLAYER_SPEED: 2.6,      // world px per frame at 60fps
  PICKUP_RADIUS: 26,      // px — auto-collect ground items within this range
  HOTBAR_SLOTS: 12,
  SAVE_KEY: "pixel-harvest-save-v1",

  // Crops: multi-stage growth. growDays = "progress" units needed per stage;
  // watering adds 2 progress/day instead of 1 (so watered crops grow 2x faster).
  CROPS: {
    wheat:   { name: "Wheat",   emoji: "🌾", stages: 3, growDays: 2, color: "#e8c86a", ripe: "#f5d97a" },
    carrot:  { name: "Carrot",  emoji: "🥕", stages: 3, growDays: 3, color: "#ff8c3b", ripe: "#ff7a1f" },
    pumpkin: { name: "Pumpkin", emoji: "🎃", stages: 4, growDays: 5, color: "#ff9a3d", ripe: "#ff7d12" },
  },

  // Every carriable thing. `type` drives behaviour; `price` is the shipping value.
  ITEMS: {
    // tools (not stackable, not sold)
    hoe:          { type: "tool",   name: "Hoe",           emoji: "⛏️" },
    watering_can: { type: "tool",   name: "Watering Can",  emoji: "💧" },
    basket:       { type: "tool",   name: "Basket",        emoji: "🧺" },
    // seeds (stackable)
    wheat_seed:   { type: "seed", crop: "wheat",   name: "Wheat Seeds",   emoji: "🌾", price: 4,  buy: 4 },
    carrot_seed:  { type: "seed", crop: "carrot",  name: "Carrot Seeds",  emoji: "🥕", price: 8,  buy: 8 },
    pumpkin_seed: { type: "seed", crop: "pumpkin", name: "Pumpkin Seeds", emoji: "🎃", price: 20, buy: 20 },
    // harvested crops (stackable, shippable)
    wheat:        { type: "crop", name: "Wheat",   emoji: "🌾", price: 12, stackable: true },
    carrot:       { type: "crop", name: "Carrot",  emoji: "🥕", price: 22, stackable: true },
    pumpkin:      { type: "crop", name: "Pumpkin", emoji: "🎃", price: 60, stackable: true },
    // animal produce (stackable, shippable)
    egg:          { type: "produce", name: "Egg",  emoji: "🥚", price: 20, stackable: true },
    milk:         { type: "produce", name: "Milk", emoji: "🥛", price: 45, stackable: true },
    // feed (stackable)
    hay:          { type: "feed", name: "Hay", emoji: "🌿", price: 0, buy: 5, stackable: true },
  },

  // Placeable structures. w/h in tiles. `solid` blocks walking.
  BUILDINGS: {
    coop:         { name: "Coop",        emoji: "🐔", w: 4, h: 3, buy: 500, houses: "chicken", capacity: 4, color: "#b9754a" },
    barn:         { name: "Barn",        emoji: "🐄", w: 5, h: 4, buy: 800, houses: "cow",     capacity: 4, color: "#a94b3a" },
    shipping_bin: { name: "Shipping Bin", emoji: "📦", w: 1, h: 1, buy: 250, color: "#6b8f3a" },
    fence:        { name: "Fence",       emoji: "🪵", w: 1, h: 1, buy: 10,  color: "#7a5230" },
  },

  ANIMALS: {
    chicken: { name: "Chicken", emoji: "🐔", produce: "egg",  buy: 100, color: "#f4f0e2", speed: 0.5, roam: 3 },
    cow:     { name: "Cow",     emoji: "🐄", produce: "milk", buy: 250, color: "#f0e9df", speed: 0.4, roam: 4 },
  },

  STARTING_COINS: 180,
};
