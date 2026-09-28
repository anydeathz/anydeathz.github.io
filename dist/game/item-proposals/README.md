# Item, spell & cast proposals: the plan

**Status:** proposal, 2026-09-25. Nothing in `frontend/` or `docs/character-proposals/` was changed. This
folder only imports from them. **Look at `index.html` first.** This file is the written plan behind it.

```
node docs/item-proposals/tools/serve.mjs                                           → http://localhost:5179/item-proposals/
node --experimental-strip-types --no-warnings docs/item-proposals/tools/snapshot-game.mjs   → lib/game.js (copy of the game's data)
node docs/item-proposals/tools/audit.mjs                                           → coverage; exits 1 if anything has no look
node --experimental-transform-types --no-warnings docs/item-proposals/tools/baseline.mjs    → shots/baseline-*.png (today's icons)
node docs/item-proposals/tools/capture.mjs [filter]                                → shots/*.png + shots/metrics.json
python3 docs/item-proposals/tools/stamp-sizes.py                                   → image sizes into index.html
node docs/item-proposals/tools/shot.mjs <path> <out.png> [width] [full] [selector] → one screenshot, fails on page errors
```

`index.html` opens from disk and the pictures show. The two live benches need the server. The server is rooted
at `docs/`, which is what lets this folder import `../character-proposals/…`.

---

## 1 · The problem, measured

- **Items today are 15 silhouettes.** `gen/textures/itemIcon.ts` draws each one with a material and a rarity
  frame. `tools/baseline.mjs` runs that code itself. It gives 54 item bases a handful of shapes, and **99
  consumable stacks come out as only 12 distinct images**: potions and throwables share the flask, all 36
  scrolls share the scroll, and reagents and solvents share the pouch.
- **Spells today are primitives.** `render/vfx/spells.ts` draws spheres, boxes and rings in the damage hue.
  The cone, chain, vortex and sigil families fall back to the melee arc.
- **The sim has one area shape.** It is a Euclidean disc (`aoeRadius`, `SurfaceGrid.paint`) on square
  tiles. There is no cone, line, cube or wall. Nothing persists except surfaces.
- **Loot never touches the map.** `sim/Run.ts:collect` sends drops straight to the inventory.
- **What exists in the references and not in code:** 223 spell rows (213 unique spells), 27 elixirs and
  14 crafted potions. Manuals are ruled in `scrolls.md` Q4 but not built.

## 2 · The idea every approach shares

**A look is data, compiled to geometry once.** Each object has a `vis` recipe in `lib/items.js`, and each
spell has a row in `lib/spells.js`. `lib/parts.js` turns a recipe into vector parts: `lathe`, `poly`, `bar`,
`ell`, `strokes` and `mark`. The five object approaches only *draw* parts, so they cannot disagree about
what a thing is.

- **The game's data is snapshotted by a tool, never retyped.** `tools/snapshot-game.mjs` imports
  `frontend/src/data` under Node and writes `lib/game.js`: the stacks, the 76 actions, the 13 damage types
  with their hues and glyphs, the 9 surfaces with their palettes, and rarity.
- **Coverage is enforced.** `tools/audit.mjs` fails if any game id or any reference row has no look. It
  passes at 100%. It also caught a row that had been missed by hand: *Tadpole Elixir*.
- **Where the game has a spell, its radius wins.** `src: 'game'` rows take the action's `aoeRadius`, so
  Fireball is 3.2, not 20 ft.
- **Eight BG3-only spells are drafted and flagged `bg3`:** Bursting Sinew, Enhance Leap, Warden of
  Vitality, Artistry of War, Bestial Communion, Dethrone, Summon Quasit and Bone Chill.
- **Every element has a hue and a mark.** The hue is the game's. The mark is a 5×5 pixel glyph in
  `lib/marks.js`, because visual-language Q3 says colour is never enough on its own.
- **Spell identity is a sigil.** `lib/sigil.js` draws the frame from the school (eight shapes) and the
  strokes from a hash of the id. It is used on scroll seals, spell icons and cast circles.
- **No save change.** Every look comes from ids the game already stores.

## 3 · Objects: five approaches (all built, all rendered, same sets)

| # | Approach | All 651 objects¹ | Verdict |
|---|---|---|---|
| **1** | **O1 · Pixel icon grammar** (`objects/O1-pixel`): character-proposals' pixel engine on the shared parts. Glass is a rim and a highlight, liquid has a meniscus, marks go on tags, seals and medallions. | **105 ms · 0.16 ms each** | **Recommended.** It is the same language as A. It stays legible at 18–32 px, and one sprite serves the inventory and the floor. |
| 2 | O2 · Manuscript vector (`objects/O2-vector`): SVG, ink borders, hatched shadow, real glyphs | 41 ms (markup only) | The best in UI rows at ≥40 px. On the map it reads as a sticker. |
| 3 | O5 · Lathe/extrude toon 3D (`objects/O5-lathe3d`): baked, cached by recipe hash | 463 ms | The best bottles. Softer than O1 at 32 px. |
| 4 | O3 · Voxel (`objects/O3-voxel`, `objects/voxelize.js`) | 1,225 ms | Thin things break up, and sigils are lost. |
| 5 | O4 · Sprite-stacked (`objects/O4-stack`) | 1,992 ms | Any angle, but muddy. Use it only for Legendary loot that turns. |

¹ 225 objects, 213 catalogue scrolls, 212 spell icons and the manuals. Headless Chrome, Apple M4 Pro.
**Not measured on a phone.**

## 4 · Casts: five approaches, one timeline

`casts/cast.js` turns a look, a caster and a target into cells (`lib/hexarea.js`) and **emitters on a 0–1
timeline**: telegraph → release → impact → aftermath. `particlesAt(cast, t)` is a pure function of time, so
every frame can be drawn on its own and is deterministic. Every approach renders the same 18 casts at the
same four moments (`map/arena.js` `MATRIX`).

| # | Approach | M3 added / frame² | M1 / frame | Verdict |
|---|---|---|---|---|
| **1** | **S2 · Hex footprint decals**: the ground half. Rule telegraph, per-cell wash as the effect arrives, surface as floor state (`casts/surfaces.js`) | 5.2 ms (p95 20.9) | 2.4 ms | **Recommended, with S1.** The only approach that always says which cells were hit. |
| **1** | **S1 · Pixel particles**: the air half. Per-element pixel shapes, drawn after lighting, and they light the room | 1.3 ms (p95 10.7) | 0.2 ms | **Recommended, with S2.** |
| 3 | S4 · Toon meshes (M1): the same primitive family as today's `spells.ts`, for every shape | — | 0.3 ms · 16–77 calls | In reserve for volumes: walls, columns. |
| 4 | S3 · Continuous SDF field | 17.0 ms (p95 189) | not measured | The prettiest ground. It misleads about cells and is the slowest. |
| 5 | S5 · Voxel particles (M1) | — | 0.3 ms · ≤16k tris | Free once S1 exists. Sparse at map scale. |

² At 360×216. The base frame is ≈2 ms.

**Rulings the casts obey:**
- **Motion Q2:** only the brief cast moves. Zones and surfaces are static state, with at most a slow shimmer
  for fire and acid.
- **Visual-language Q3:** surfaces are low-saturation tints plus a texture.
- **Gold means Legendary:** no liquid, ink or effect is gold. Speed and Valour were first drawn yellow,
  which read as gold, and were recoloured.

## 5 · Areas on hexes (`lib/hexarea.js`, pure, R1-safe)

Measured in `hex-atlas`:

| Shape | Measured | What it means |
|---|---|---|
| Disc r 3.2 (Fireball) | **37 squares → 37 hexes** | Unchanged on hexes. |
| Disc r 1.8 (Cleave) | **9 → 13** | Grows on hexes. |
| Disc r 3 (Stinking Cloud) | **29 → 37** | Grows on hexes. |
| Cone, 60° hex wedge vs 53° 5e | 6/6 · 10/9 · 22/18 cells at 15/20/30 ft | The 60° wedge follows grid lines. |
| Line, 2 wide | one-sided | A symmetric band on hexes is 1 or 3 cells wide. |
| Cube | n×n axial lozenge | The closest shape the grid can draw. |
| Wall | a hex run perpendicular to the caster's line | |
| Aura | a disc that follows the caster | |

## 6 · On the new floors (`map/`)

- **`map/render2d-fx.js` is a *copy* of character-proposals' M3 renderer, not an edit of it.** It adds three
  hooks:
  - `fx.ground(x, y, key, t)` returns an overlay colour for floor pixels inside a cell set.
  - `fx.draw(api, t)` draws after lighting, depth-tested against walls.
  - `fx.lights` adds lights to the lighting pass.

  It also lets sprites take a world position and a shadow size, for loot.
- **M1 uses character-proposals' `mapScene` unchanged.** Effects are added to its scene:
  - `casts/ground3d.js` bakes any ground overlay to a floor decal.
  - `rimLines` draws the telegraph as 3D lines.
- **Scenes (`map/scenes.js`)** use a real generated dungeon with:
  - the A-sprite party and foes
  - loot, as O1 icons at 18 px with a rarity ring beneath each
  - an open chest
  - grease meeting fire, and a web
  - one signature cast per biome

  They are rendered in all eight biomes in M3, and in six scenes in M1 across S1+S2, S2, S4 and S5.
- **Casts are clipped to floor cells**, as the sim would.

## 7 · Integration plan (not started; each step needs your go-ahead)

1. **Recipes into data.**
   - Add `vis` to `StackDef` and to the stack rows in `data/consumables/*`.
   - Add a `look` (school, element, delivery, area) to `ActionDef` beside `vfx`.
   - The drafts are `lib/items.js` and `lib/spells.js`. R3 holds. No save change.
   - Elixirs and manuals need items created first. That is pass B's scope.
2. **Port O1.**
   - `lib/parts.js`, `lib/marks.js` and `lib/sigil.js` become `gen/` modules.
   - `objects/O1-pixel/icon.js` replaces the body of `gen/textures/itemIcon.ts`, keeping its signature.
   - R1 holds: take a canvas factory, as `gen/textures` does. Cache by recipe hash in `gen/cache.ts`.
   - Re-run `npm run verify`. Screenshot the Hoard and the shop, and look at them.
3. **Port S2 and S1.**
   - S2's ground functions go into `render/vfx/areaEffects.ts`. Surfaces stay tile-aligned but gain the
     textures from `casts/surfaces.js`.
   - S1's `particlesAt` goes into `render/vfx/spells.ts`, which fills the four families that fall back to
     melee today.
   - **Bake surfaces once, not per frame.** The Fireball aftermath frame measured 37–48 ms because the
     proposal re-shades a static surface every frame.
4. **Cone, line, cube and wall as sim shapes** belong to the hex pass and pass B. `lib/hexarea.js` is ready
   for them, but they are **not scoped here**.

Verification for each step follows the repo's gates: `npm run verify`, `npm run census`, `ui-checks`, and
screenshot-and-look.

## 8 · Open questions for you

- **Should loot appear on the map at all?** It is a design change, and today drops never touch the floor.
- **Cones: 60° hex wedge or the 5e 53° cone?**
- **Small discs grow on hexes** (Cleave 9 → 13). Should radii be retuned in the hex pass?
- **Confirm the eight `bg3` spell rows.**
- **Elixir rarity** is not set anywhere, so elixirs show as Common until you set it.

## 9 · Rejected, with reasons

- **Icon packs (game-icons.net and the like).** They are CC-BY, not CC0, which breaks `asset-pipeline.md`.
  They are also "an image per item".
- **AI image generation.** It is not deterministic, does not run offline, and has provenance problems.
- **Colour variants of one flask.** This is today's approach. It breaks visual-language Q3, and the
  baseline shows 12 images for 99 stacks.
- **Idle animation on loot.** Motion Q2 forbids it for anything common. Only Legendary may turn.

## 10 · Session notes (what a later reader needs)

- **Measured on:** headless Chrome, Apple M4 Pro. **Nothing was measured on a phone.** 3D frame costs use
  `gl.finish()` after each frame.
- **Defects found by looking at renders, all fixed:**
  - Weapons were too small and blades too thin at 32 px.
  - Metal potion flasks hid their liquid, so they read as helmets.
  - Speed and Valour potions looked gold.
  - Elixirs differed only by colour, so marks were added.
  - Radiant ink was invisible on parchment, so pale inks are now darkened.
  - Divine wax disappeared on paper.
  - The O5 quill and halberd haft were mirrored, from a capsule rotation that ignored the flipped y.
  - O5 lathes rendered black, from reversed winding, fixed with `DoubleSide`.
  - Fireball used the SRD's 20 ft instead of the game's 3.2.
  - Bursts were invisible at impact: too faint, and too slow in S3.
  - The 3D arena was zoomed far in, because `mapScene`'s zoom is per low-res pixel.
  - Scene cameras cut off the target room.
  - Casts spilled over rock.
- **Traps:**
  - `node --experimental-strip-types` cannot load `gen/textures/tileable.ts` (it uses a TS parameter
    property). Use `--experimental-transform-types`.
  - `snapshot-game` works with strip-types, because `data/` has none.
  - On hexes, a 2-wide band is 3 wide unless it is one-sided.
  - `mapScene`'s `zoom` is pixels per unit **at the reduced resolution**.
  - A per-pixel ground effect over a large cell set is O(pixels × cells). S3's p95 of 189 ms is exactly
    that.
- **Numbers the survey got wrong, corrected by the snapshot:**
  - There are 76 actions, not 80.
  - There are 27 elixirs, not 26.
