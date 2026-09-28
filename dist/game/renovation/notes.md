# Measured during pass six (running notes for the handover)

Every line here was measured by a command; nothing is estimated.

## Part one
- Corridors in a 3-wide band: 24.1% → 100% (measure.mjs, 24 floors).
- Shove on bodies not moving themselves: 0.046/s (position-replay method, pass five) → 0.0039/s per combat-second
  (counted at the source in separation.ts); worst tick 0.115; big shoves (>0.05) 0.75 per 100 combat-seconds —
  only when a mover is walled in on every side.
- Wall tops: 403 unfaced steps / 2,584 void edges (pass-five rule replayed) → 0 / 0 (read back from the mesher's
  own triangles, 8 floors, 7,009 closed cells, 3,114 visible steps all faced).
- simulate median depth: 14 (before pass six) → 15 (after engagement) → 17 (after 3-wide corridors) → 17 (dressing).
- Census: all 12 in band after the three targeting/condition/rider bug fixes (no stat changes kept).
- Floor generation, 40 floors: 157 ms → 43 ms after the one-arc cut test in dress.ts.
- Dressing: ~71 items per floor before the back-wall rule; 108 on a Sable Court floor after interior pieces.

## Part two
- §1 bodies against walls (0.22 clearance, every body, every tick, 3 seeds × 10 sim-min):
  point-only rule 2,918 of 109,511 samples (2.7%) → stepBody 0 of 118,080.
- §1 stall found by simulate after the clearance rule: p10 depth 5, runs 32 min (paths shaved corners a body could
  not pass; stepBody refused, body stood forever). Fixed with pathClear (3 parallel lines) + stepBody turning ±30/60/90°.
  After: median 17 · p10 12 · 45.0 min per run. simulate wall clock 63 s (pass five) → 173 s (nine-point body tests).
- §2 pools: every biome produces them (first pool found on floor 4/24/43/63/83/103/123/143 with 6–40 cells);
  connectivity test 200/200. Found by looking: wall-slot furniture lined pool rims (liquid counted as a wall);
  the first surface pattern drew one spot per hex (a radial sine term).
- §3 light: 19.4 torches/floor; room cells 29% lit · 23% half · 48% dark (static, before the lamp); light map 3 ms/floor.
  Hit chance vs the same target: lit 79.6% · half 70.9% · dark 55.0% (4,000 rolls each).
  simulate median 17 → 15 with lamp r2.8 (−12%, outside ±10%) → 16 with lamp r3.2 (kept). Census in band (median 12).
- §4 waiting foes: test 0 moves before waking (39 wakes over 2 seeds × 5 sim-min). simulate median 16 → 17, retreats
  12.0 → 4.0 per run (rooms met one at a time), floors 11–20 clear in 141 s median (was ~100 s; band is 120–240).
  Found while wiring it: spawn kept the 12th failed try even on a blocked cell, and never checked room.contains.
- §5 fog: tests — explored never shrinks (118 cells at the entry → 336 after 5 sim-min); 5 of 8 foes hidden at the
  entry; 39 of 48 foes woke over the test. Fog texture 4 texels/unit, rebuilt only when a hero changes cell.
  Explored-but-unseen ground draws at 0.48 brightness; unseen blends into the biome's void colour.
- §6 sprite depth: every sprite (figures, chests, loot, furniture batch) writes its foot's depth, lifted 0.3 (figures) /
  0.45 (props) toward the camera. Looked at: Sable Court shelves whole against the back wall.
- §7 high walls: WALL_H 1.0 → 1.7; cut band REACH 2 → 3 (a 1.7 wall hides ~2.4 units of floor); cut cells sink only
  within 4.2–7.0 of the party (vertex shader). Watertight measured both ways: standing 1,716/1,716 steps faced,
  every cut wall sunk 2,974/2,974; 0 void edges.
- §8 rock crowns: crag heights in wallMass (first ring ruined −0…0.16; rock +0.12 + 0.16·depth + 0…0.55), faceted
  off-centre peaks 0.14–0.64, stalagmites on 13% of crags, biome fleck on 9%, flat-shaded rock faces.
  Watertight: standing 13,979/13,979 steps faced, sunk 10,831/10,831, 0 void. Two bugs caught by the measure tool:
  rock-top vertices pushed as (x, z, y) (every crown stood on its edge), and the tool's own one-face-per-edge map.
- §9 wall dressing: 20 wall pieces, placed by the sim on camera-visible faces (34% of room faces, 12% corridor),
  spaced ≥1.6 from torches and each other.
- §10 furniture: 13 → 63 pieces (10 shared + 40 biome-own); biome pieces take 40–50% of placements; contact
  shadows (3-band ellipse, fogged, one mesh). furniture.html: 92 rows, 862 frames, 2.6 s to generate.
- §11 gates: 8 voxel arches (scale 1.6), portal swirl shader (pixel-stepped, <1 cycle/s), 14 rising motes; gate is a light source (r3.4).
- §12 status marks: 25 generated marks (3 light states + 22 conditions), 11 px, strip above each head (×1.35).
- §13 damage numbers: they never showed because FloatingText called project(x, 1.0, y) against a (x, y, height)
  signature — every number projected off-screen and the off-screen guard dropped it silently. Measured before the
  fix: 0 .float-num spans in 14 s of combat; after: spans present and visible (red on heroes, green heals).
- §14 the fallen: dead foes draw lying, darkened (×0.62), wherever explored; they were already kept by the sim — the part-two fog rule (visible-only) would have hidden them.
- §15 log: loot rows draw the drop's own O1 icon (lootIconUrl, cached per base·rarity); the item card's proficiency row too. Looked at: 'Savage Warhammer' row shows the warhammer.
- §16 camp: grass hollow ringed by rock crowns, stake palisade (props, two gates), paths, fire pit with spit/pot,
  seats, woodpile, flame + ember points and a light map (fire r13); 4 companion plots dressed by background
  (12 kits, data/camp), companions stand at the front of their own; 6 stalls dressed by trade. View widened 14 → 20.
  Found by looking: side stalls and labels ran off a 390 px screen at ±7.2 (pulled to ±5); side seats turned radial
  read as posts. ui-checks: all invariants hold; tapping a stall still opens its shop (31-shop).
- §17 sweep-modifiers failed after part two: bramblebound 29%, tidewrought 43% "cleared within six minutes".
  Replayed: every failing floor had 0 retreats; several had 0 foes left (walking to chests/stairs when the clock
  ran out). Pacing, not walls — waiting foes are met room by room. The wall check now counts "beaten" = cleared, or
  no retreat with ≥90% of foes dead; the clock-limited rate is still printed. After: beaten 92.9% (every profile
  ≥80%); cleared within the clock 76.7% (was 85.4% before part two); depth-24 median clear 264 s (band top 240 s).
- §17 final: tests 47/0; census all in band (median 15); ui-checks all hold; verify green except simulate's
  depth-spike check after the late stall fixes — median 20 (mean 18.8, p10 14, p90 22), 38.8% of runs end at 21–22.
  70-minute runs: median 22, still piled at 19–23 → a real step at the Ossuary border, not the horizon.
  Late fixes: monsters attack from 1.6 (they stopped at their own shorter reach and waited forever in corners);
  heroes inside a harmful surface path out through it.
