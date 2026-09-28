// M1 / M2 — the hex dungeon in three.js, the renderer the game already uses.
//
//   M1 'textured': hex floor tops carrying a texture baked from map/surfaces.js (so, like M3, no two
//                  hexes match and stones run across hex borders); thin wall runs as real geometry
//                  with a baked masonry texture; solid rock as a dark mass at wall height.
//   M2 'voxel':    the same floor and walls, but built from instanced cubes — floor voxels sampled
//                  from floorAt with grout sunk, walls laid brick by brick.
//
// Both render at low resolution and upscale nearest-neighbour (see present3d), which is what makes
// a 3D scene read as pixel art.
import * as THREE from '../vendor/three.module.js';
import { toWorld, fromWorld, isFloor, wallEdges, DIRS, key, SQRT3, corners } from '../lib/hex.js';
import { floorAt, wallAt } from './surfaces.js';
import { hexToRgb, shade, mix } from '../lib/color.js';
import { valueNoise } from '../lib/rng.js';

export const WALL_H = 1.0, WALL_T = 0.24, STUB_H = 0.3;
const col3 = hex => { const [r, g, b] = hexToRgb(hex); return new THREE.Color(r / 255, g / 255, b / 255).convertSRGBToLinear(); };

/** Which way the camera looks, flattened to the ground — decides which walls are cut down. */
export function camDir(az) { return [Math.sin(az), Math.cos(az)]; }

export function buildMap3D(map, biome, { style = 'textured', az = 0.5, pxPerUnit = 16 } = {}) {
  const t0 = performance.now();
  const group = new THREE.Group(); const stats = { style };
  const [cdx, cdy] = camDir(az);
  const floors = [...map.cells.values()].filter(c => c.t === 1);
  const xs = floors.map(c => toWorld(c.q, c.r)[0]), ys = floors.map(c => toWorld(c.q, c.r)[1]);
  const bx0 = Math.min(...xs) - 1.2, by0 = Math.min(...ys) - 1.2, bx1 = Math.max(...xs) + 1.2, by1 = Math.max(...ys) + 1.2;
  const isFront = (nx, ny) => -(nx * cdx + ny * cdy) > 0.25; // wall normal (into floor) points away from camera

  // ── floor ───────────────────────────────────────────────────────────────────────────────
  if (style === 'textured') {
    const tw = Math.ceil((bx1 - bx0) * pxPerUnit), th = Math.ceil((by1 - by0) * pxPerUnit);
    const cv = document.createElement('canvas'); cv.width = tw; cv.height = th;
    const g = cv.getContext('2d'), img = g.createImageData(tw, th);
    for (let Y = 0; Y < th; Y++) for (let X = 0; X < tw; X++) {
      const x = bx0 + (X + 0.5) / pxPerUnit, y = by0 + (Y + 0.5) / pxPerUnit;
      const [q, r] = fromWorld(x, y); if (!isFloor(map, q, r)) continue;
      let c = floorAt(biome, x, y);
      const [cx, cy] = toWorld(q, r); let best = -1, bi = 0;
      DIRS.forEach(([dq, dr], i) => { const [nx, ny] = toWorld(q + dq, r + dr); const d = ((x - cx) * (nx - cx) + (y - cy) * (ny - cy)) / 3; if (d > best) { best = d; bi = i; } });
      if (!isFloor(map, q + DIRS[bi][0], r + DIRS[bi][1]) && best > 0.55) c = shade(c, -0.2 * (best - 0.55) / 0.32);
      else if (best > 0.845) c = shade(c, -0.05);
      const [rr, gg, bb] = hexToRgb(c); img.data.set([rr, gg, bb, 255], (Y * tw + X) * 4);
    }
    g.putImageData(img, 0, 0);
    const tex = new THREE.CanvasTexture(cv); tex.magFilter = tex.minFilter = THREE.NearestFilter; tex.colorSpace = THREE.SRGBColorSpace; tex.generateMipmaps = false;
    const pos = [], uv = [];
    for (const c of floors) { const [cx, cy] = toWorld(c.q, c.r), k = corners(c.q, c.r);
      for (let i = 0; i < 6; i++) { const a = k[i], b = k[(i + 1) % 6]; for (const [x, y] of [[cx, cy], [b[0], b[1]], [a[0], a[1]]]) { pos.push(x, 0, y); uv.push((x - bx0) / (bx1 - bx0), 1 - (y - by0) / (by1 - by0)); } } }
    const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); geo.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); geo.computeVertexNormals();
    const m = new THREE.Mesh(geo, new THREE.MeshLambertMaterial({ map: tex })); m.receiveShadow = true; group.add(m);
    stats.floorTexture = `${tw}×${th}`;
  } else {
    const V = 1 / 10, list = [], GW = 0.075;
    for (let y = by0; y < by1; y += V) for (let x = bx0; x < bx1; x += V) {
      const [q, r] = fromWorld(x + V / 2, y + V / 2); if (!isFloor(map, q, r)) continue;
      const c = floorAt(biome, x + V / 2, y + V / 2, GW);
      list.push([x, y, c]);
    }
    const im = new THREE.InstancedMesh(new THREE.BoxGeometry(V, V, V), new THREE.MeshLambertMaterial(), list.length);
    const mtx = new THREE.Matrix4(), groutCol = shade(biome.floor[3], -0.06);
    list.forEach(([x, y, c], i) => { const low = c === groutCol ? -V * 0.45 : -V / 2 + ((x * 7 + y * 13) % 1) * 0.004; mtx.makeTranslation(x + V / 2, low, y + V / 2); im.setMatrixAt(i, mtx); im.setColorAt(i, col3(c)); });
    im.receiveShadow = true; group.add(im); stats.floorVoxels = list.length;
  }

  // ── rock mass: every non-floor cell next to a floor cell gets a dark top at wall height ───
  const rockN = valueNoise(`rock3:${biome.id}`);
  const rockPos = [], rockCol = [];
  for (const c of map.cells.values()) {
    if (c.t === 1) continue;
    const nb = DIRS.map(([a, b]) => [c.q + a, c.r + b]).filter(([a, b]) => isFloor(map, a, b));
    if (!nb.length) continue;
    const [cx, cy] = toWorld(c.q, c.r);
    const front = nb.every(([a, b]) => { const [fx, fy] = toWorld(a, b); return (cx - fx) * cdx + (cy - fy) * cdy > 0.2; });
    const h = front ? STUB_H : WALL_H, k = corners(c.q, c.r);
    const rock = (x, y) => col3(mix(shade(biome.wall[2], -0.1 + (rockN(x * 1.7, y * 1.7) - 0.5) * 0.22), biome.fog, 0.3));
    for (let i = 0; i < 6; i++) { const a = k[i], b = k[(i + 1) % 6]; for (const [x, y] of [[cx, cy], b, a]) { rockPos.push(x, h - 0.004, y); const rc = rock(x, y); rockCol.push(rc.r, rc.g, rc.b); } }
  }
  { const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(rockPos, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(rockCol, 3)); g.computeVertexNormals(); group.add(new THREE.Mesh(g, new THREE.MeshLambertMaterial({ vertexColors: true }))); }

  // ── walls ───────────────────────────────────────────────────────────────────────────────
  const edges = wallEdges(map); stats.wallRuns = edges.length;
  const torches = [];
  if (style === 'textured') {
    const TW = 96, TH = 24, cv = document.createElement('canvas'); cv.width = TW; cv.height = TH; const g = cv.getContext('2d'), img = g.createImageData(TW, TH);
    for (let Y = 0; Y < TH; Y++) for (let X = 0; X < TW; X++) { const [r, gg, b] = hexToRgb(wallAt(biome, X / 24, (TH - 1 - Y) / 24, WALL_H)); img.data.set([r, gg, b, 255], (Y * TW + X) * 4); }
    g.putImageData(img, 0, 0);
    const tex = new THREE.CanvasTexture(cv); tex.magFilter = tex.minFilter = THREE.NearestFilter; tex.wrapS = THREE.RepeatWrapping; tex.colorSpace = THREE.SRGBColorSpace; tex.generateMipmaps = false;
    const pos = [], uv = [], nor = [];
    const quad = (p, u, n) => { for (const i of [0, 1, 2, 0, 2, 3]) { pos.push(...p[i]); uv.push(...u[i]); nor.push(...n); } };
    edges.forEach((e, i) => {
      const ex = (e.b[0] - e.a[0]) * 0.08, ey = (e.b[1] - e.a[1]) * 0.08;
      const A = [e.a[0] - ex, e.a[1] - ey], B = [e.b[0] + ex, e.b[1] + ey], o = [-e.n[0] * WALL_T, -e.n[1] * WALL_T];
      const A2 = [A[0] + o[0], A[1] + o[1]], B2 = [B[0] + o[0], B[1] + o[1]];
      const H = isFront(e.n[0], e.n[1]) ? STUB_H : WALL_H, len = Math.hypot(B[0] - A[0], B[1] - A[1]), u0 = (i * 0.37) % 4 / 4, u1 = u0 + len / 4, v1 = H / WALL_H;
      quad([[A[0], 0, A[1]], [B[0], 0, B[1]], [B[0], H, B[1]], [A[0], H, A[1]]], [[u0, 0], [u1, 0], [u1, v1], [u0, v1]], [e.n[0], 0, e.n[1]]);
      quad([[B2[0], 0, B2[1]], [A2[0], 0, A2[1]], [A2[0], H, A2[1]], [B2[0], H, B2[1]]], [[u1, 0], [u0, 0], [u0, v1], [u1, v1]], [-e.n[0], 0, -e.n[1]]);
      quad([[A[0], H, A[1]], [B[0], H, B[1]], [B2[0], H, B2[1]], [A2[0], H, A2[1]]], [[u0, 0.97], [u1, 0.97], [u1, 1], [u0, 1]], [0, 1, 0]);
      if (H === WALL_H && i % 6 === 0) torches.push(e);
    });
    const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); geo.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); geo.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
    const m = new THREE.Mesh(geo, new THREE.MeshLambertMaterial({ map: tex, side: THREE.DoubleSide })); m.castShadow = m.receiveShadow = true; group.add(m);
  } else {
    // brick by brick: courses of 0.2, bricks ~0.45 long, joints offset every other course
    const bricks = [];
    edges.forEach((e, i) => {
      const H = isFront(e.n[0], e.n[1]) ? STUB_H : WALL_H;
      const ax = e.a[0], ay = e.a[1], dx = e.b[0] - ax, dy = e.b[1] - ay, len = Math.hypot(dx, dy), ux = dx / len, uy = dy / len;
      const rows = Math.round(H / 0.2);
      for (let row = 0; row < rows; row++) {
        const off = row % 2 ? 0.22 : 0; let s = -0.06 - off;
        while (s < len + 0.06) { const bl = Math.min(0.46, len + 0.06 - s); if (bl > 0.05) { const mid = Math.max(-0.06, s) + (Math.min(len + 0.06, s + bl) - Math.max(-0.06, s)) / 2, w = Math.min(len + 0.06, s + bl) - Math.max(-0.06, s);
          const top = row === rows - 1; const c = top ? shade(biome.wall[1], 0.04) : biome.wall[(((i * 3 + row * 7 + Math.floor(s * 5)) % 3) + 3) % 3];
          bricks.push({ x: ax + ux * mid - e.n[0] * WALL_T / 2, y: row * 0.2 + 0.1, z: ay + uy * mid - e.n[1] * WALL_T / 2, w: w - 0.03, rot: Math.atan2(uy, ux), c: shade(c, ((i * 13 + row * 5) % 7) * 0.01 - 0.03) }); }
          s += bl; }
      }
      if (H === WALL_H && i % 6 === 0) torches.push(e);
    });
    const im = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 0.18, WALL_T), new THREE.MeshLambertMaterial(), bricks.length);
    const mtx = new THREE.Matrix4(), q = new THREE.Quaternion(), sc = new THREE.Vector3();
    bricks.forEach((b, i) => { q.setFromAxisAngle(new THREE.Vector3(0, 1, 0), -b.rot); sc.set(b.w, 1, 1); mtx.compose(new THREE.Vector3(b.x, b.y, b.z), q, sc); im.setMatrixAt(i, mtx); im.setColorAt(i, col3(b.c)); });
    im.castShadow = im.receiveShadow = true; group.add(im); stats.bricks = bricks.length;
  }

  // ── torches ─────────────────────────────────────────────────────────────────────────────
  const flames = [];
  for (const e of torches) {
    const mx = (e.a[0] + e.b[0]) / 2 + e.n[0] * 0.06, my = (e.a[1] + e.b[1]) / 2 + e.n[1] * 0.06;
    const stick = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.18, 0.05), new THREE.MeshLambertMaterial({ color: '#3a2a1e' })); stick.position.set(mx, 0.62, my); group.add(stick);
    const flame = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.1, 0.07), new THREE.MeshBasicMaterial({ color: '#ffb347' })); flame.position.set(mx, 0.76, my); group.add(flame);
    flames.push({ flame, at: new THREE.Vector3(mx + e.n[0] * 0.25, 0.8, my + e.n[1] * 0.25) });
  }
  stats.ms = performance.now() - t0; stats.torches = flames.length;
  group.userData = { stats, flames };
  return group;
}

/**
 * A full scene: the map, lights, fog, an orthographic camera at `az` / `elev`, and a renderer that
 * draws at 1/px resolution. Returns { scene, camera, renderer, frame(t) }.
 */
export function mapScene(canvasHost, map, biome, { style = 'textured', az = 0.5, elev = 0.72, w = 390, h = 480, px = 3, focus = [0, 0], zoom = 24, lights = 6 } = {}) {
  const renderer = new THREE.WebGLRenderer({ antialias: false, preserveDrawingBuffer: true });
  renderer.setPixelRatio(1 / px); renderer.setSize(w, h); renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.BasicShadowMap;
  renderer.domElement.style.imageRendering = 'pixelated'; canvasHost.append(renderer.domElement);
  const scene = new THREE.Scene(); scene.background = new THREE.Color(biome.fog);
  const mapGroup = buildMap3D(map, biome, { style, az }); scene.add(mapGroup);
  scene.add(new THREE.HemisphereLight(mix(biome.accent, '#b8c0c8', 0.6), biome.fog, 0.95));
  const key = new THREE.DirectionalLight('#d8d0c0', 0.5); key.position.set(-4, 10, -2); scene.add(key);
  // the lamp the party carries: what makes the room around them the brightest thing on screen
  const lamp = new THREE.PointLight('#ffd9a0', 11, 9, 1.3); lamp.position.set(focus[0], 1.6, focus[1]); lamp.castShadow = true; lamp.shadow.mapSize.set(512, 512); scene.add(lamp);
  const near = mapGroup.userData.flames.sort((a, b) => a.at.distanceTo(new THREE.Vector3(focus[0], 0.8, focus[1])) - b.at.distanceTo(new THREE.Vector3(focus[0], 0.8, focus[1]))).slice(0, lights);
  const tl = near.map(f => { const l = new THREE.PointLight('#ff9a4a', 3.2, 3.6, 1.5); l.position.copy(f.at); scene.add(l); return l; });
  const lowH = h / px, span = lowH / zoom;
  const camera = new THREE.OrthographicCamera(-span * w / h / 2, span * w / h / 2, span / 2, -span / 2, 0.1, 200);
  const target = new THREE.Vector3(focus[0], 0.4, focus[1]);
  camera.position.set(target.x + Math.sin(az) * Math.cos(elev) * 40, target.y + Math.sin(elev) * 40, target.z + Math.cos(az) * Math.cos(elev) * 40); camera.lookAt(target);
  scene.fog = new THREE.Fog(biome.fog, 36, 52);
  const frame = t => { tl.forEach((l, i) => (l.intensity = 3.2 + Math.sin(t * 9 + i * 2) * 0.35)); mapGroup.userData.flames.forEach((f, i) => f.flame.scale.y = 1 + Math.sin(t * 12 + i) * 0.25); renderer.render(scene, camera); };
  return { scene, camera, renderer, frame, stats: mapGroup.userData.stats, target };
}
