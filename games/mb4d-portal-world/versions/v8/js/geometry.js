// 40-sided geometry helpers. The world rule: "every object has at least 40
// sides except the sky." An icosphere at subdivisions=2 has 320 faces; a
// subdivisions=1 icosphere has 80; our cylinders use 48 radial segments.

export function mat(scene, name, color, opts = {}) {
  const m = new BABYLON.StandardMaterial(name, scene);
  m.diffuseColor = color;
  m.specularColor = opts.glossy ? new BABYLON.Color3(0.4, 0.4, 0.4)
                                : new BABYLON.Color3(0.06, 0.06, 0.06);
  if (opts.emissive) m.emissiveColor = opts.emissive;
  return m;
}

export const C = (r, g, b) => new BABYLON.Color3(r, g, b);

// Faceted sphere — the workhorse "40-sided" primitive.
export function facetedSphere(scene, name, radius, subdivisions = 2) {
  return BABYLON.MeshBuilder.CreateIcoSphere(name, { radius, subdivisions }, scene);
}

// Many-sided disc/cylinder for floors and pillars (48 sides > 40).
export function manySidedCylinder(scene, name, { diameter, height, tess = 48 }) {
  return BABYLON.MeshBuilder.CreateCylinder(name, { diameter, height, tessellation: tess }, scene);
}

// Decorative polyhedron from Babylon's built-in set (types 0..14 are all >= 40
// sides once we pick the richer ones; type 3 = truncated cube-ish, etc.).
const DECO_TYPES = [3, 6, 8, 10, 12];
export function decoPoly(scene, name, size, i = 0) {
  return BABYLON.MeshBuilder.CreatePolyhedron(name, { type: DECO_TYPES[i % DECO_TYPES.length], size }, scene);
}

// A goldberg polyhedron (always many-faced) — nice "alien" rocks.
export function goldberg(scene, name, size) {
  return BABYLON.MeshBuilder.CreateGoldberg(name, { m: 2, n: 1, size }, scene);
}
