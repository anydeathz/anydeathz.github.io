# The renovation: pass six, phase by phase

The page is `index.html` in this folder. This file is the same plan in plain text, for a reader who
opens the repo cold. The prompt that started it (2026-09-26) is quoted in full in §0 of the page.

**Every item in the prompt is a phase below. None is skipped.** Each phase has a gate, and it does not
close until that gate is met *and* a screenshot of the result has been looked at.

## The numbers before (`tools/measure.mjs`, `shots/before/measure.json`)

| What | Measured | Target |
|---|---|---|
| Corridor cells inside a fully open 3-wide band (24 floors) | **24.1%** (worst floor 5%) | **100%** |
| Shove on a body that is not moving itself, per engaged second | **0.046** (worst tick 0.34) | **< 0.005**, worst tick < 0.05 |
| Wall tops: unfaced height steps / edges that end in void (8 floors) | **403 / 2,584** | **0 / 0** |
| `npm run test` | 36 pass, 1 fail (bodies 0.24 apart) | all pass |
| simulate median depth / census | 14 / all 12 in band | within ±10% / all in band |

## Phases

| # | Prompt item | Phase | Gate |
|---|---|---|---|
| 1 | 2 · melee shoving | **Engagement.** Stop at reach rather than walk to the centre. Melee takes a free hex around its target. Separation moves the mover, not the planted body. A* treats occupied cells as costly. Monster reach is never shorter than body contact. | shove < 0.005/s, worst < 0.05; bodies ≥ 0.3 apart; census and simulate in band |
| 2 | 3 · corridors | **Three-wide corridors.** Dig with a radius-1 hex disc; doors become three-cell mouths with posts; floor size grows to pay for it. | 100% of corridor cells in a 3-wide band; connectivity; tests |
| 3 | 5 · wall tops | **Watertight wall mass.** Every closed cell within 2 of the floor is a prism. Its height comes from one consistent cutaway rule, with a side face wherever a neighbour is lower, a capstone top, and a dark ground plane under the rest. | 0 unfaced steps, 0 void edges (the same tool); 8 biome screenshots |
| 4 | 3 · decorations, torches | **Room dressing.** Sim data gives each room a theme (library, barracks, storeroom, shrine, mess, armoury, crypt). It is destroyed about 55% of the time, ransacked 35%, intact 10%. Pieces are voxel props sprite-stacked like D figures: shelves, beds, tables, barrels, crates, racks, altars, sarcophagi, rubble. They stand against walls and block their cell, with connectivity re-verified. Each biome gets its own torch design and light colour. | every biome dressed; connectivity; props never on a door, stair or spawn; screenshots |
| 5 | 3 · chests | **Biome chests.** Eight voxel chest designs, open and shut, about 1.5× bigger. The chest stands against a wall and faces into the room. | 8 × 2 renders; placement test; screenshots |
| 6 | 1 · spell icons | **O1 spell icons.** Port the proposal's spell grammar (sigil, element ring, damage mark, area badge) and use it on Magic, Learn, Queue, the queue editor, the slot picker and scroll cards. | every ActionDef renders; no SVG spell glyph left; screenshots 15–17 |
| 7 | 4 · log loot icons | **O1 icons in the log.** Loot rows show the dropped item's own icon. The same goes for every other place that still uses a glyph for an item. | audit: no item glyph path left; log screenshot |
| 8 | 6 · camp | **The camp, rebuilt.** Larger ground. Stalls become voxel models with wares for each trade. Each hero gets a plot dressed for their background (12 kits). The party stands at the fire in the middle. The fireplace gets a stone ring, logs, a spit and pot, seats and ember motes. | screenshots; ui-checks camp; stall taps still open shops |
| 9 | — | **Verification and records.** verify, census, ui-checks, the full screenshot set, the measure tool after, the handover, directives, and a CLAUDE.md diff. | everything green; the "after" column filled |

The order is 1 → 2 → 3 first: sim, then floor shape, then floor geometry, because 4 and 5 place things
against the walls those phases produce. 6 and 7 are UI-only. 8 reuses the prop system from 4.

## Rules this pass keeps

- **R1:** `sim/` never imports `ui/`, `three` or `window`. Dressing and chest *placement* is sim data; the
  models and rendering stay in `gen/` and `render/`.
- **R3:** themes, pieces, kits and chest designs are data tables.
- **Gold means Legendary.** No gold chest, no gold inlay, no gold torch flame. Sable Court brass is
  brass-grey.
- **Motion Q2:** props and chests are still. Only flames and ember motes move, as they already do.
- A save migration only adds defaults. Camp plots derive from `backgroundId`, which the save already
  has, so no schema change is expected. If one turns out to be needed, it bumps `SAVE_VERSION`.
- **Screenshot and look is the gate** for phases 3, 4, 5, 6, 7 and 8.
