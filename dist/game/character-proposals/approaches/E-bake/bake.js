// Approach E — bake. Build the character in 3D (B's voxels or C's toon meshes), render it once per
// facing and frame into a small atlas, then treat the result as plain pixel sprites everywhere:
// the map, the roster band, the character sheet. The 3D cost is paid only when the loadout changes.
//
// This is how the cache in frontend/src/gen/cache.ts would be used: key = hash of everything that
// changes the look (race, appearance, each slot's base id and rarity), value = the atlas.
import * as THREE from '../../vendor/three.module.js';
import { voxelCharacter, animate } from '../B-voxel/mesh.js';
import { buildC } from '../C-pixel3d/gen.js';
import { Sprite } from '../../lib/pixel.js';
import { hexToRgb, rgbToHex } from '../../lib/color.js';
import { hashString } from '../../lib/rng.js';

export const FW = 64, FH = 80, DIRS = 8, FRAMES = 4;
let renderer, scene, cam;
function setup() {
  if (renderer) return;
  renderer = new THREE.WebGLRenderer({ antialias: false, alpha: true, preserveDrawingBuffer: true });
  renderer.setPixelRatio(1); renderer.setSize(FW, FH);
  scene = new THREE.Scene();
  scene.add(new THREE.HemisphereLight('#e8eef2', '#4a3a2a', 1.5)); const sun = new THREE.DirectionalLight('#fff0d8', 2.4); sun.position.set(2, 5, 6); scene.add(sun);
  // 24 px per world unit, like the 2D map, looking down at the same ~38° as the 3/4 camera
  const hw = FW / 24 / 2, hh = FH / 24 / 2;
  cam = new THREE.OrthographicCamera(-hw, hw, hh, -hh, 0.1, 50);
  cam.position.set(0, Math.sin(0.66) * 20 + 1.25, Math.cos(0.66) * 20); cam.lookAt(0, 1.25, 0);
}
const cache = new Map();
export const bakeKey = (spec, kind) => `${kind}:${hashString(JSON.stringify([spec.race.id, spec.skin, spec.hair, spec.hairStyle, spec.primary, spec.secondary, spec.loadout, spec.rarity]))}`;

/** → { atlas: canvas (FRAMES×FW by DIRS×FH), frame(dir, f) → Sprite, ms, cached } */
export function bake(spec, kind = 'C') {
  const key = bakeKey(spec, kind), t0 = performance.now();
  if (cache.has(key)) return { ...cache.get(key), ms: performance.now() - t0, cached: true };
  setup();
  const model = kind === 'C' ? buildC(spec) : voxelCharacter(spec);
  model.position.y = -0.1; scene.add(model);
  const atlas = document.createElement('canvas'); atlas.width = FW * FRAMES; atlas.height = FH * DIRS;
  const g = atlas.getContext('2d'); const frames = [];
  for (let d = 0; d < DIRS; d++) for (let f = 0; f < FRAMES; f++) {
    model.rotation.y = d / DIRS * Math.PI * 2;
    animate(model, 'walk', f / FRAMES * (Math.PI * 2 / 8) + 0.001);
    renderer.render(scene, cam);
    const sp = spriteFrom(renderer.domElement);
    sp.outline();
    frames.push(sp); g.drawImage(sp.toCanvas(1), f * FW, d * FH);
  }
  scene.remove(model);
  const out = { atlas, frames, frame: (d, f) => frames[d * FRAMES + f] };
  cache.set(key, out);
  return { ...out, ms: performance.now() - t0, cached: false };
}

function spriteFrom(canvas) {
  const c = document.createElement('canvas'); c.width = FW; c.height = FH; const g = c.getContext('2d'); g.drawImage(canvas, 0, 0);
  const d = g.getImageData(0, 0, FW, FH).data, sp = new Sprite(FW, FH);
  for (let i = 0; i < FW * FH; i++) if (d[i * 4 + 3] > 140) sp.px[i] = rgbToHex([d[i * 4], d[i * 4 + 1], d[i * 4 + 2]]);
  return sp;
}
