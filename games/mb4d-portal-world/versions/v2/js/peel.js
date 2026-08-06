import { CFG } from './config.js';
import { mat, C, facetedSphere } from './geometry.js';

// Banana-peel projectiles (MB's "peel" attack). Pooled faceted spheres.
export class Peels {
  constructor(scene) {
    this.scene = scene;
    this.list = [];
    this.mat = mat(scene, 'peelMat', C(0.98, 0.90, 0.25), { emissive: C(0.35, 0.30, 0.05) });
  }

  shoot(origin, dir) {
    let pl = this.list.find((x) => !x.active);
    if (!pl) {
      const m = facetedSphere(this.scene, 'peel' + this.list.length, CFG.peel.radius, 1);
      m.material = this.mat; m.isPickable = false;
      pl = { mesh: m, vel: new BABYLON.Vector3(), life: 0, active: false };
      this.list.push(pl);
    }
    pl.mesh.position.copyFrom(origin);
    pl.vel.copyFrom(dir.normalize().scale(CFG.peel.speed));
    pl.life = CFG.peel.life;
    pl.active = true;
    pl.mesh.setEnabled(true);
  }

  // targets: array of { center(): Vector3, radius:number, alive:boolean }
  // onHit(target) -> return true if the peel should be consumed.
  update(dt, targets, onHit) {
    for (const pl of this.list) {
      if (!pl.active) continue;
      pl.mesh.position.addInPlace(pl.vel.scale(dt));
      pl.mesh.rotation.x += 0.3; pl.mesh.rotation.y += 0.2;
      pl.life -= dt;
      let consumed = pl.life <= 0 || pl.mesh.position.length() > 60;
      if (!consumed) {
        for (const t of targets) {
          if (!t.alive) continue;
          if (BABYLON.Vector3.Distance(pl.mesh.position, t.center()) < t.radius + CFG.peel.radius) {
            if (onHit(t)) { consumed = true; break; }
          }
        }
      }
      if (consumed) { pl.active = false; pl.mesh.setEnabled(false); }
    }
  }
}
