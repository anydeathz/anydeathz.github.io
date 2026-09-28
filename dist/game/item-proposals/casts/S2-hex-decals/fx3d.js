// S2 in M1: the same ground functions, baked to a floor decal per frame (casts/ground3d.js).
import { fx2d } from './fx.js';
import { groundMesh } from '../ground3d.js';
export function fx3d(cast, t) { return groundMesh(fx2d(cast, t), t); }
