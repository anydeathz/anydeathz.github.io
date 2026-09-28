// One offscreen three.js renderer for every 3D icon (O3, O5): a fixed 3/4 camera and light, rendered
// small and scaled up nearest-neighbour. One WebGL context for hundreds of icons.
import * as THREE from '../../character-proposals/vendor/three.module.js';
export { THREE };
let R = null;
export function iconRenderer() {
  if (R) return R;
  const renderer = new THREE.WebGLRenderer({ antialias: false, alpha: true, preserveDrawingBuffer: true });
  const scene = new THREE.Scene();
  scene.add(new THREE.HemisphereLight('#f0ece4', '#3a2e24', 1.5));
  const sun = new THREE.DirectionalLight('#fff0d8', 2.4); sun.position.set(-3, 4, 5); scene.add(sun);
  const cam = new THREE.OrthographicCamera(-1.15, 1.15, 1.15, -1.15, 0.1, 50);
  // a 3/4 view: from the front, a little right and above, so the icon reads as an object with depth
  cam.position.set(1.6, 2.2, 8); cam.lookAt(0, 0, 0);
  R = { renderer, scene, cam, THREE };
  return R;
}
/** Render a Group at n×n px, return a 2D canvas scaled ×k (nearest). */
export function snap(group, n, k) {
  const { renderer, scene, cam } = iconRenderer();
  renderer.setPixelRatio(1); renderer.setSize(n, n, false);
  scene.add(group); renderer.render(scene, cam); scene.remove(group);
  const c = document.createElement('canvas'); c.width = n * k; c.height = n * k;
  const g = c.getContext('2d'); g.imageSmoothingEnabled = false; g.drawImage(renderer.domElement, 0, 0, n * k, n * k);
  return c;
}
