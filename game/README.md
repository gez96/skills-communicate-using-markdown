# 🌱 Pixel Harvest

A small, self-contained **pixel art farming game** built with plain HTML5 Canvas
and vanilla JavaScript. No build step, no dependencies — just open the file.

## ▶️ Play

Open [`index.html`](./index.html) in any modern browser (double-click it, or drag it
into a browser window).

## 🎮 How to play

| Action | Keys |
| --- | --- |
| Move | `WASD` or the **arrow keys** |
| Use current tool on the tile in front | `Space` / `E` |
| Use a tool on any tile | **Click** the tile |
| Select a tool | `1`–`6` or the toolbar buttons |

### The farming loop

1. **⛏️ Hoe** — till a patch of grass into soil.
2. **🌾 / 🥕 / 🎃 Seeds** — plant a seed in tilled soil.
3. **💧 Water** — water the crop so it grows faster (watered tiles grow twice as fast that day).
4. **😴 Sleep / Next Day** — advance a day so crops grow. Water dries overnight.
5. **🧺 Harvest** — collect ripe crops (they sparkle ✨) for coins.
6. **🛒 Buy Seeds** — spend coins on more seeds.

### Crops

| Crop | Grows in | Sells for | Seed cost |
| --- | --- | --- | --- |
| 🌾 Wheat | fast | 12 | 4 |
| 🥕 Carrot | medium | 22 | 8 |
| 🎃 Pumpkin | slow | 60 | 20 |

## 🛠️ Tech

Everything lives in a single [`index.html`](./index.html):

- Rendering: `<canvas>` with `image-rendering: pixelated` for crisp pixel art.
- Sprites (player, soil, crops) are drawn procedurally with rectangles — no image assets.
- Game state (coins, day, inventory, per-tile crop data) is plain JavaScript objects.

Ideas for extending it: save progress to `localStorage`, add seasons/weather,
a fence and animals, or an actual sprite sheet.
