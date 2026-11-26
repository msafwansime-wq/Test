import { EARTH_RADIUS_KM, AU_KM, SUN } from '../data/planets.js';

const DEG = Math.PI / 180;
export const J2000_JD = 2451545.0;

export function dateToDaysSinceJ2000(date) {
  return date.getTime() / 86400000 + 2440587.5 - J2000_JD;
}
export function daysSinceJ2000ToDate(d) {
  return new Date((d + J2000_JD - 2440587.5) * 86400000);
}

function solveKepler(M, e) {
  let E = e < 0.8 ? M : Math.PI;
  for (let i = 0; i < 12; i++) {
    const dE = (E - e * Math.sin(E) - M) / (1 - e * Math.cos(E));
    E -= dE;
    if (Math.abs(dE) < 1e-8) break;
  }
  return E;
}

// Heliocentric ecliptic position in AU, mapped to three.js axes:
// X = ecliptic x, Y = ecliptic z (north), Z = −ecliptic y.
export function heliocentricAU(el, days) {
  const T = days / 36525;
  const L = el.L + el.Ldot * T;
  const w = (el.lp - el.node) * DEG; // argument of perihelion
  const O = el.node * DEG;
  const I = el.I * DEG;
  let M = ((L - el.lp) % 360) * DEG;
  if (M > Math.PI) M -= 2 * Math.PI;
  if (M < -Math.PI) M += 2 * Math.PI;
  const E = solveKepler(M, el.e);
  return orbitalToEcliptic(el.a, el.e, E, w, O, I);
}

function orbitalToEcliptic(a, e, E, w, O, I) {
  const xp = a * (Math.cos(E) - e);
  const yp = a * Math.sqrt(1 - e * e) * Math.sin(E);
  const cw = Math.cos(w), sw = Math.sin(w), cO = Math.cos(O), sO = Math.sin(O), cI = Math.cos(I), sI = Math.sin(I);
  const x = (cw * cO - sw * sO * cI) * xp + (-sw * cO - cw * sO * cI) * yp;
  const y = (cw * sO + sw * cO * cI) * xp + (-sw * sO + cw * cO * cI) * yp;
  const z = sw * sI * xp + cw * sI * yp;
  return [x, z, -y];
}

export function orbitPathAU(el, segments = 360) {
  const w = (el.lp - el.node) * DEG, O = el.node * DEG, I = el.I * DEG;
  const pts = [];
  for (let i = 0; i <= segments; i++) {
    const E = (i / segments) * Math.PI * 2;
    pts.push(orbitalToEcliptic(el.a, el.e, E, w, O, I));
  }
  return pts;
}

// ---------- Visual scales ----------
// Distances: "compressed" uses a square-root compression of true AU distance
// (order and relative spacing preserved, but outer planets pulled in).
// "true" uses a linear scale where 1 AU = 30 scene units.
export const DIST_SCALES = {
  compressed: { label: 'Compressed', fn: (au) => 18 * Math.sqrt(au), unitsPerAU: null },
  true: { label: 'True proportions', fn: (au) => 30 * au, unitsPerAU: 30 },
};

export function scalePosition(p, distMode) {
  const r = Math.hypot(p[0], p[1], p[2]);
  if (r === 0) return [0, 0, 0];
  const s = DIST_SCALES[distMode].fn(r) / r;
  return [p[0] * s, p[1] * s, p[2] * s];
}

// Sizes: "enhanced" compresses radii (power 0.55) so small worlds stay visible.
// "true" keeps planets' radii in exact proportion to each other.
export function displayRadius(radiusKm, sizeMode) {
  const rel = radiusKm / EARTH_RADIUS_KM;
  if (sizeMode === 'true') return Math.max(0.22 * rel, 0.004);
  return Math.max(0.6 * Math.pow(rel, 0.55), 0.1);
}

export function sunDisplayRadius(distMode) {
  return distMode === 'true' ? 2.2 : 5;
}

// How much bigger an object is drawn compared with a perfectly-to-scale model
// using the current distance scale. Only meaningful for the linear distance scale.
export function sizeExaggeration(radiusKm, displayR, distMode) {
  const unitsPerAU = DIST_SCALES[distMode].unitsPerAU;
  if (!unitsPerAU) return null;
  const trueR = (radiusKm / AU_KM) * unitsPerAU;
  return displayR / trueR;
}

export function sunTrueRatioRadius(sizeMode) {
  // The Sun's radius if drawn at the same scale as the planets.
  return sizeMode === 'true' ? 0.22 * (SUN.radiusKm / EARTH_RADIUS_KM) : 0.6 * Math.pow(SUN.radiusKm / EARTH_RADIUS_KM, 0.55);
}

export function bodyScenePosition(body, days, distMode) {
  if (!body.elements) return [0, 0, 0];
  return scalePosition(heliocentricAU(body.elements, days), distMode);
}

// Display distance of a moon from its parent in the overview (heavily compressed).
export function moonOverviewDistance(parentR, moonIndex, sizeMode) {
  return parentR * (sizeMode === 'true' ? 1.9 : 1.8) + 0.45 + moonIndex * (0.35 + parentR * 0.28);
}
