# 🌱 Pixel Harvest

A pixel-art farming game inspired by Stardew Valley — walk your farmer around a
scrolling world, grow crops, keep animals, and ship your harvest for coins. Built
with plain HTML5 Canvas and vanilla JavaScript: **no build step, no dependencies.**

## ▶️ Play

- **On a computer:** double-click [`index.html`](./index.html) (or drag it into a browser).
- **On a phone / to share one file:** open [`dist/pixel-harvest.html`](./dist/pixel-harvest.html) —
  a single self-contained copy generated from the source (see *Building* below).

The modules load as ordinary `<script>` tags, so the game runs straight from
`file://` with no server. A local server also works: `python3 -m http.server`.

## 🎮 Controls

| Action | How |
| --- | --- |
| **Move** | On-screen ▲◀▶▼ pad, or `WASD` / arrow keys |
| **Use held item** | The ✋ button, `Space` / `E`, or **tap a nearby tile** |
| **Select hotbar item** | Tap a hotbar slot, or number keys `1`–`9` |
| **Sleep (next day)** | 😴 Sleep button |
| **Shop / place buildings** | 🛒 Shop button |
| **Cancel placement** | ✕ button or `Esc` |

## 🌾 The loop

1. **⛏️ Till** grass into soil.
2. **🌱 Plant** a seed in tilled soil.
3. **💧 Water** it — watered crops grow **twice as fast** that day.
4. **😴 Sleep** to advance days; crops grow overnight.
5. **🧺 Harvest** ripe crops (they ✨ sparkle) into your inventory.
6. **📦 Ship** crops/produce in the shipping bin — they **sell overnight** and you
   get a morning summary of your earnings.
7. **🛒 Buy** more seeds, animals, and buildings with your coins.

### Crops

| Crop | Growth | Sells for | Seeds |
| --- | --- | --- | --- |
| 🌾 Wheat | fast (3 stages) | 12c | 4c |
| 🥕 Carrot | medium | 22c | 8c |
| 🎃 Pumpkin | slow (4 stages) | 60c | 20c |

### Animals & buildings

Buy a **🐔 Coop** or **🐄 Barn** from the shop, then place it on clear ground.
Buy animals into them, feed them **🌿 hay** each day, and the next morning they
leave **🥚 eggs / 🥛 milk** on the ground — walk over them to collect, then ship
them. You can also place extra **📦 shipping bins** and **🪵 fences**.

Progress **auto-saves** to your browser each time you sleep. Use **🔄 Reset** to
start a brand-new farm.

## 🗂️ Project structure

The game is split into small modules under `js/`, each attaching to one global
`App` namespace (classic scripts, so it still runs by double-click):

```
game/
  index.html        # canvas, HUD, hotbar, touch controls; loads the modules in order
  js/
    config.js       # constants + data tables (crops, items, buildings, animals)
    state.js        # central state, new game, save/load (localStorage)
    world.js        # tilemap generation, collision, building placement
    inventory.js    # slot-based inventory / hotbar
    crops.js        # till / plant / water / harvest + overnight growth
    shipping.js     # shipping bin + overnight sale
    animals.js      # livestock: wander, feed, produce
    player.js       # smooth movement, collision, camera, pickups
    render.js       # camera-based drawing of the whole scene (procedural pixel sprites)
    ui.js           # HUD, hotbar, toast, shop & morning panels
    input.js        # keyboard, tap-to-act, touch d-pad + action button
    game.js         # bootstrap, main loop, and the actions tying systems together
  dist/
    pixel-harvest.html  # generated single-file build (for phones / sharing)
  build.mjs         # inlines everything into dist/pixel-harvest.html
```

## 🛠️ Building the single-file version

```bash
node game/build.mjs   # writes game/dist/pixel-harvest.html
```

All sprites are drawn procedurally with canvas rectangles/shapes — there are no
image assets, keeping the whole game a single dependency-free deliverable.

## 🚜 Possible next steps

Seasons & weather, energy/stamina, tool upgrades, NPCs & relationships, and
mining/fishing were intentionally left out of this version — they're natural
future additions.
