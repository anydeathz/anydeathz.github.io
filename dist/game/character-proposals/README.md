# Character & map proposals: the plan

**Status:** proposal, 2026-09-25. Nothing in `frontend/` was changed. **Look at `index.html` first**;
this file is the written plan behind it.

```
node docs/character-proposals/tools/serve.mjs      → http://localhost:5178/   (the page, with live demos)
node docs/character-proposals/tools/capture.mjs    → regenerates shots/*.png + shots/metrics.json
python3 docs/character-proposals/tools/stamp-sizes.py   → re-stamps image sizes into index.html
```

`index.html` also opens straight from disk. The static pictures show, but the live "Try it" and
map demos need the server, because ES modules don't load from `file://`.

---

## 1 · The problem

- **Characters are outlines.** On the map, `gen/meshes/humanoid.ts` builds them from boxes and capsules.
  On the character sheet, `figureFor()` in `ui/components/parts.ts` draws an SVG silhouette plus a class
  overlay. Neither one changes when an item is equipped.
- **Floors are barren and walls are cubes.** `gen/textures/floor.ts` and `wall.ts` produce one tileable
  noise texture per biome, and `render/tiles/TileMesher.ts` draws walls as 1×1.15×1 blocks.
- **The grid is moving from squares to hexes.**
- **The constraint:** no hand-made sprite per item or per character. Looks must be *generated*, which is
  consistent with the ruling in `12-art-direction/asset-pipeline.md` ("All generated… if quality is
  acceptable it ships").

## 2 · The one idea every approach shares

**An item's look is data.** Each of the 54 bases gets a `vis` recipe beside its stats (`lib/data.js`,
drafted for all 54). Every renderer reads that one table:

```js
{ id: 'chainMail', slot: 'body',     vis: { mat: 'iron', chain: true, sleeves: 2, skirt: 0.35, tabard: true } }
{ id: 'halberd',   slot: 'mainHand', vis: { kind: 'polearm', len: 1.05, head: 0.16, blade: 'axe', twoHanded: true } }
```

Inputs are only what the game already stores: race (plus the new visual flags per race, such as
ears, horns, tail and snout), the `Appearance` fields (`skin hair hairStyle primary secondary`) and
each equipped item's `baseId` and rarity. **So none of this needs a save change or a migration.**

Rarity: Common has no trim. Uncommon, Rare and Very Rare add a rim in their colour. Very Rare and
Legendary also add a halo. Only Legendary is gold, which keeps to the house rule.

## 3 · The five character approaches (all built, all rendered)

| # | Approach | What it is | Measured |
|---|---|---|---|
| **1** | **A · Pixel paper-doll** (`approaches/A-pixel-paperdoll`) | Code draws a 56×72 sprite: race-proportioned body masks, items drawn in layers from recipes, hue-shifted ramps, shading from each part's silhouette, a selective outline | 0.4 ms / frame · 5.7 ms for a full 24-frame sheet (48 with mirroring) |
| 2 | **E · Bake** (`approaches/E-bake`) | Render B or C once into an 8-facing × 4-frame atlas, cached by loadout hash, then use it as plain sprites | 82 ms per loadout · cache hit ≈ 0 |
| 3 | **B · Voxel** (`approaches/B-voxel`) | Voxel parts with pivots. Armour is a one-voxel "wrap" shell and weapons live in the arm's space | 8.6–26.8 ms (median 13) · 3.2–6.6k quads |
| 4 | **D · Sprite stacking** (`approaches/D-spritestack`) | B's volume sliced by height, each slice rotated in 2D and stacked, giving any angle | 7.7 ms to slice · 4.7 ms per angle |
| 5 | **C · Pixel-3D** (`approaches/C-pixel3d`) | Toon-shaded low-poly meshes with a hull outline, rendered at ⅓ resolution | 0.3–1.9 ms (median 0.7) · heaviest per frame |

Ranking is by how the pictures look (my judgement, stated as such on the page) and by the
measured cost. Where the page shows dots for look and legibility, those are judgement, not
measurement.

## 4 · The map

- `lib/hex.js`: pointy-top axial hexes and a real hex dungeon generator (rooms, elbow corridors,
  some two wide).
- **The sim model can stay cell-based.** A wall *cell* is never drawn as a block. Each edge it shares
  with a floor cell becomes a **thin masonry run**: 1.0 high, down from 1.15, and 0.24 thick, standing
  inside the wall cell. Runs between the room and the camera are cut to 0.3 stubs, which replaces
  `wallFade.ts`. The rock behind the walls is drawn as a dark mass at wall height. Without that mass,
  thin walls read as fences; that was found by looking at the output.
- `map/surfaces.js`: `floorAt(biome, x, y)` and `wallAt(biome, u, v, h)` are functions of world
  position. Voronoi flagstones run across hex borders, with bevels, cracks and per-biome detail:
  moss, bones, mushrooms, lava joints, tide-pools, rime, muted inlay and roots.
- Three renderers:
  - **M1** is three.js with a baked floor texture and wall geometry. It's recommended, and every
    character approach works in it: 331–374 ms to build a 30×22 floor, 16 draw calls, 3,648 triangles.
  - **M2** is three.js voxel: instanced floor voxels and bricks. It builds in 150–167 ms but has
    **666,614 triangles**.
  - **M3** is pure 2D per-pixel on a canvas with a 3/4 camera: bake 221–304 ms, then **1.5–1.7 ms per
    frame** against a depth buffer.

## 5 · Recommendation

**A for characters, M1 for the map, E in reserve** in case four facings stop being enough.

Why A: it looks most like the reference, gear is most legible at phone size, it costs the least,
and one output serves the map (×1), the roster band (×2) and the character sheet (×5–6).

What A costs: two drawn facings mirrored into four diagonals, hand-coded poses, and code for each
new body plan (the rat and the ooze each needed their own). Rings are one pixel, so jewellery
must be identified by rarity glow, not by shape.

Why M1 over M3: it keeps the renderer, camera, lighting and draw-call budget the game already
has. M3 is the more Stardew-like picture, but adopting it means replacing the three.js renderer
and fixing the camera.

## 6 · Integration plan (not started; each step needs your go-ahead)

1. **Recipes into data.** Add `vis` to `BaseItem` (`data/items/slots.ts`) and fill it for the 54 rows in
   `data/items/bases/*`. The draft is in `lib/data.js`. Race visual flags (ears, horns, tail, snout,
   beard, tusks, curls, topknot, bigHead) go on `Race` in `data/races/index.ts`. R3 holds: content is
   data.
2. **Port A to TypeScript** as `gen/sprites/paperdoll.ts` plus `gen/sprites/pixel.ts` (the mask, ramp and
   outline engine). It must import nothing from `ui/` or `window` (R1): take a canvas factory, as
   `gen/textures` does. Cache sheets by loadout hash in `gen/cache.ts`. Invalidate on equip, on
   appearance change, and on rarity change through enhancement.
3. **UI:** `figureFor()` returns the sprite at ×5–6 on the character sheet and ×2 in the roster band. The
   paper-doll slot layout around the figure stays.
4. **Map actors:** `render/actors/ActorView.ts` swaps the humanoid mesh for a billboard (`map/actors3d.js`
   shows the anchoring). Facing comes from the movement vector, snapped to four diagonals, and
   `gen/anim/procedural.ts` picks the frame.
5. **The hex migration is a separate pass and must be planned before it starts.** It touches the sim
   (grid → axial), pathing, AoE shapes, line of sight, the dungeon generator and `TileMesher`. **I have
   not surveyed that scope.** The rendering half is prototyped here; the sim half is not.

Verification for each step follows the repo's gates: `npm run verify`, `npm run census`,
`ui-checks`, and screenshot-and-look.

## 7 · Open questions for you

- **Camera.** The game uses a true isometric camera, while M3 and the A sprites assume a 3/4
  top-down view. In M1, A billboards look right at the azimuth used here (≈29°) and elevation (≈41°).
  Do you want to keep true iso, or move to this 3/4 view?
- **Facings.** Is four (front, back, mirrored) enough, or should E's eight be the target from the start?
- **Pointy-top or flat-top hexes?** Everything here is pointy-top.
- **Race visual flags** (ears, horns and so on) are my interpretation. Confirm them or correct them.

## 8 · Rejected, with reasons

- **LPC-style layered sprite packs.** They are CC-BY-SA / GPL, not CC0, which breaks the sourcing rule.
  They are also the "sprite per item" approach you want to avoid.
- **AI image generation.** It isn't deterministic, doesn't work offline, can't guarantee consistency,
  and has provenance problems.
- **Tinting the existing SVG figure.** A colour swap can't draw a halberd.

## 9 · Session notes (what a later reader needs)

- **Measured on:** headless Chrome, Apple M4 Pro (ANGLE/Metal). **Nothing was measured on a phone.**
  Frame-cost numbers are the median of 120 frames with `gl.finish()` after each frame. The first
  attempt used rAF FPS, which capped every option at 60 and told us nothing, so it was replaced.
- **Defects found by looking at renders, all fixed:**
  - Cloak collars and mantles were painted over faces, because of draw order.
  - Skin shadows were hue-shifted too far toward red.
  - Hair sat too low and hid the face.
  - Corner posts at every hex vertex made walls read as picket fences, so the posts were removed and
    the runs extended instead.
  - Thin walls with no rock mass behind them read as fences.
  - Voxel two-handed weapons were buried inside the torso.
  - Voxel shields and blades faced the camera edge-on.
  - The voxel brick colour index went negative (a modulo bug), which crashed the voxel map.
  - Sable Court's inlay was bright gold, which breaks the house rule.
  - The hero title was invisible because two CSS animations overrode each other.
  - A dark page embedding a light-scheme iframe showed it as solid white.
- **Not built:** creature body plans in C (skeleton and ooze); doorways and arches on hex walls.
- **Traps:**
  - Voxel `%` on negative indices.
  - Images need `width`/`height` attributes or nav anchors land wrong while they lazy-load.
    `tools/stamp-sizes.py` does this.
  - rAF FPS is useless for comparing renderers.
