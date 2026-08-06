// Spike hazards for Levels 2/3 ("obstacles include spikes"). Faceted 40-sided
// cones; touching one while grounded does CFG.hazard.spikeDamage and i-frames
// the player. Spikes are persistent — they don't go away on hit.

import { CFG } from './config.js';
import { mat, C } from './geometry.js';

export function buildSpikes(scene, positions) {
  const out = [];
  for (let i = 0; i < positions.length; i++) {
    const [x, y, z] = positions[i];
    const root = new BABYLON.TransformNode('spike' + i, scene);
    root.position.set(x, y, z);
    // 5-cluster: one center + 4 ring spikes, all 40-sided cones.
    const baseMat  = mat(scene, 'spikeBase', C(0.32, 0.32, 0.36));
    const tipMat   = mat(scene, 'spikeTip',  C(0.78, 0.78, 0.82), { glossy: true });
    const center = BABYLON.MeshBuilder.CreateCylinder('spkC' + i, {
      diameterTop: 0, diameterBottom: 0.45, height: 1.1, tessellation: 40,
    }, scene);
    center.parent = root; center.position.y = 0.55; center.material = tipMat;
    for (let j = 0; j < 4; j++) {
      const a = j * Math.PI / 2;
      const s = BABYLON.MeshBuilder.CreateCylinder('spk' + i + '_' + j, {
        diameterTop: 0, diameterBottom: 0.35, height: 0.85, tessellation: 40,
      }, scene);
      s.parent = root;
      s.position.set(Math.cos(a) * 0.55, 0.42, Math.sin(a) * 0.55);
      s.material = baseMat;
    }
    out.push({ position: root.position, radius: 0.9, alive: true, root });
  }
  return out;
}
