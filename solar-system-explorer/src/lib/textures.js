import * as THREE from 'three';
import { useEffect, useState } from 'react';

// ---------- Procedural textures (used for bodies without image maps and as
// an instant placeholder / fallback while image textures load or if they fail).

function mulberry32(a) {
  return function () {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function makeNoise3(seed) {
  const rand = mulberry32(seed);
  const perm = new Uint8Array(512);
  const p = Array.from({ length: 256 }, (_, i) => i);
  for (let i = 255; i > 0; i--) { const j = Math.floor(rand() * (i + 1)); [p[i], p[j]] = [p[j], p[i]]; }
  for (let i = 0; i < 512; i++) perm[i] = p[i & 255];
  const vals = new Float32Array(256).map(() => rand());
  const fade = (t) => t * t * (3 - 2 * t);
  const lerp = (a, b, t) => a + (b - a) * t;
  const h = (x, y, z) => vals[perm[(perm[(perm[x & 255] + y) & 255] + z) & 255]];
  return (x, y, z) => {
    const xi = Math.floor(x), yi = Math.floor(y), zi = Math.floor(z);
    const xf = fade(x - xi), yf = fade(y - yi), zf = fade(z - zi);
    const x0 = lerp(h(xi, yi, zi), h(xi + 1, yi, zi), xf);
    const x1 = lerp(h(xi, yi + 1, zi), h(xi + 1, yi + 1, zi), xf);
    const x2 = lerp(h(xi, yi, zi + 1), h(xi + 1, yi, zi + 1), xf);
    const x3 = lerp(h(xi, yi + 1, zi + 1), h(xi + 1, yi + 1, zi + 1), xf);
    return lerp(lerp(x0, x1, yf), lerp(x2, x3, yf), zf);
  };
}

function hexToRgb(hex) {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}
const mix = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
const clamp01 = (v) => Math.min(1, Math.max(0, v));

const procCache = new Map();

export function proceduralTexture(cfg, w = 512, h = 256) {
  const key = JSON.stringify(cfg) + w;
  if (procCache.has(key)) return procCache.get(key);
  const canvas = document.createElement('canvas');
  canvas.width = w; canvas.height = h;
  const ctx = canvas.getContext('2d');
  const img = ctx.createImageData(w, h);
  const noise = makeNoise3(cfg.seed || 1);
  const fbm = (x, y, z, oct = 5) => {
    let v = 0, amp = 0.5, f = 1;
    for (let i = 0; i < oct; i++) { v += amp * noise(x * f, y * f, z * f); f *= 2.03; amp *= 0.5; }
    return v;
  };
  const base = hexToRgb(cfg.base), acc = hexToRgb(cfg.accent);
  const rand = mulberry32((cfg.seed || 1) * 7);
  const craters = [];
  const craterCount = cfg.style === 'cratered-dark' ? 140 : cfg.style === 'rocky' ? 70 : 0;
  for (let i = 0; i < craterCount; i++) {
    const u = rand() * 2 - 1, th = rand() * Math.PI * 2, s = Math.sqrt(1 - u * u);
    craters.push({ v: [s * Math.cos(th), u, s * Math.sin(th)], r: 0.02 + Math.pow(rand(), 3) * 0.12 });
  }
  const spots = [];
  if (cfg.style === 'volcanic') for (let i = 0; i < 40; i++) { const u = rand() * 2 - 1, th = rand() * Math.PI * 2, s = Math.sqrt(1 - u * u); spots.push({ v: [s * Math.cos(th), u, s * Math.sin(th)], r: 0.015 + rand() * 0.05 }); }

  for (let j = 0; j < h; j++) {
    const lat = (0.5 - j / h) * Math.PI;
    const cy = Math.sin(lat), cl = Math.cos(lat);
    for (let i = 0; i < w; i++) {
      const lon = (i / w) * Math.PI * 2;
      const x = cl * Math.cos(lon), z = cl * Math.sin(lon), y = cy;
      let c;
      const n = fbm(x * 2.2 + 10, y * 2.2, z * 2.2);
      switch (cfg.style) {
        case 'banded': {
          const warp = fbm(x * 3, y * 3, z * 3, 4) * (cfg.soft ? 0.15 : 0.6);
          const b = Math.sin((y + warp * 0.3) * (cfg.soft ? 9 : 22)) * 0.5 + 0.5;
          const fine = fbm(x * 1.5, y * 40, z * 1.5, 3);
          c = mix(base, acc, clamp01(b * (cfg.soft ? 0.5 : 0.85) + (fine - 0.5) * 0.5));
          break;
        }
        case 'haze': {
          const b = Math.sin(y * 6 + n * 2) * 0.5 + 0.5;
          c = mix(base, acc, clamp01(b * 0.35 + (n - 0.5) * 0.6));
          break;
        }
        case 'cracked': {
          const l1 = Math.abs(Math.sin((x * 9 + fbm(x * 4, y * 4, z * 4) * 6)));
          const l2 = Math.abs(Math.sin((z * 11 + y * 7 + fbm(z * 3, x * 3, y * 3) * 6)));
          const crack = Math.pow(Math.max(1 - l1 * 6, 1 - l2 * 7, 0), 1.5);
          c = mix(base, acc, clamp01(crack * 0.8 + (n - 0.5) * 0.5 + 0.1));
          break;
        }
        case 'patchy': {
          const p = fbm(x * 3, y * 3, z * 3);
          c = mix(base, acc, p > 0.5 ? 0.75 + (n - 0.5) * 0.4 : 0.1 + (n - 0.5) * 0.3);
          break;
        }
        case 'icy': {
          c = mix(base, acc, clamp01((fbm(x * 3, y * 3, z * 3) - 0.35) * 1.6));
          if (cfg.redCap && y > 0.8) c = mix(c, [120, 60, 45], clamp01((y - 0.8) * 6));
          break;
        }
        case 'icy-bright': {
          c = mix(base, acc, clamp01((n - 0.45) * 0.8));
          if (y < -0.75) c = mix(c, [120, 170, 210], Math.abs(Math.sin(x * 30 + z * 10)) < 0.15 ? 0.7 : 0);
          break;
        }
        case 'sun': {
          const g = fbm(x * 12, y * 12, z * 12, 4);
          c = mix(acc, base, clamp01(0.4 + g * 0.9));
          break;
        }
        case 'earth': {
          const land = fbm(x * 2, y * 2, z * 2) > 0.52;
          c = land ? mix(acc, [150, 130, 90], n) : mix(base, [20, 50, 110], n);
          if (Math.abs(y) > 0.9) c = [240, 245, 250];
          break;
        }
        case 'volcanic':
        default: {
          c = mix(base, acc, clamp01((n - 0.3) * 1.2));
        }
      }
      // Craters / spots
      if (craters.length) {
        for (const cr of craters) {
          const d = Math.acos(Math.min(1, x * cr.v[0] + y * cr.v[1] + z * cr.v[2]));
          if (d < cr.r * 1.25) {
            const t = d / cr.r;
            const shade = t < 0.85 ? -0.18 : t < 1.1 ? 0.22 : 0.05;
            const tint = cfg.style === 'cratered-dark' && t < 0.6 ? 0.45 : 0;
            c = mix(c, shade > 0 ? [255, 255, 255] : [0, 0, 0], Math.abs(shade) * 0.6);
            if (tint) c = mix(c, acc, tint);
          }
        }
      }
      if (spots.length) {
        for (const sp of spots) {
          const d = Math.acos(Math.min(1, x * sp.v[0] + y * sp.v[1] + z * sp.v[2]));
          if (d < sp.r) c = mix(c, d < sp.r * 0.45 ? [25, 15, 10] : [200, 80, 30], 0.75);
        }
      }
      if (cfg.brightSpots) {
        const d = Math.acos(Math.min(1, x * 0.3 + y * 0.35 + z * 0.887));
        if (d < 0.04) c = mix(c, [255, 255, 255], 1 - d / 0.04);
      }
      const k = (j * w + i) * 4;
      img.data[k] = c[0]; img.data[k + 1] = c[1]; img.data[k + 2] = c[2]; img.data[k + 3] = 255;
    }
  }
  ctx.putImageData(img, 0, 0);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  procCache.set(key, tex);
  return tex;
}

// ---------- Image textures with graceful fallback ----------
const loader = new THREE.TextureLoader();
const imageCache = new Map();

function loadImage(url, srgb) {
  if (imageCache.has(url)) return imageCache.get(url);
  const p = new Promise((resolve) => {
    loader.load(
      import.meta.env.BASE_URL.replace(/\/$/, '') + url,
      (t) => {
        if (srgb) t.colorSpace = THREE.SRGBColorSpace;
        t.anisotropy = 8;
        resolve(t);
      },
      undefined,
      () => resolve(null), // fall back silently to procedural
    );
  });
  imageCache.set(url, p);
  return p;
}

// Returns a texture immediately (procedural placeholder) and swaps in the
// real image once loaded. Never suspends or throws.
export function useBodyTexture(url, proceduralCfg, { srgb = true } = {}) {
  const [tex, setTex] = useState(() => (proceduralCfg ? proceduralTexture(proceduralCfg) : null));
  useEffect(() => {
    let alive = true;
    if (!url) { setTex(proceduralCfg ? proceduralTexture(proceduralCfg) : null); return; }
    loadImage(url, srgb).then((t) => { if (alive && t) setTex(t); });
    return () => { alive = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [url]);
  return tex;
}

export function useOptionalTexture(url, srgb = false) {
  const [tex, setTex] = useState(null);
  useEffect(() => {
    let alive = true;
    if (url) loadImage(url, srgb).then((t) => alive && setTex(t));
    return () => { alive = false; };
  }, [url, srgb]);
  return tex;
}

// Radial glow sprite texture (for the Sun and highlights).
let glowTex = null;
export function glowTexture() {
  if (glowTex) return glowTex;
  const c = document.createElement('canvas');
  c.width = c.height = 256;
  const g = c.getContext('2d');
  const grd = g.createRadialGradient(128, 128, 0, 128, 128, 128);
  grd.addColorStop(0, 'rgba(255,255,255,1)');
  grd.addColorStop(0.15, 'rgba(255,240,200,0.85)');
  grd.addColorStop(0.35, 'rgba(255,190,90,0.35)');
  grd.addColorStop(0.7, 'rgba(255,140,40,0.08)');
  grd.addColorStop(1, 'rgba(255,120,0,0)');
  g.fillStyle = grd;
  g.fillRect(0, 0, 256, 256);
  glowTex = new THREE.CanvasTexture(c);
  glowTex.colorSpace = THREE.SRGBColorSpace;
  return glowTex;
}

// Procedural ring texture (for faint ice-giant rings).
export function thinRingTexture(color = '#9fb4bf') {
  const key = 'ring' + color;
  if (procCache.has(key)) return procCache.get(key);
  const c = document.createElement('canvas');
  c.width = 512; c.height = 4;
  const g = c.getContext('2d');
  const [r, gg, b] = hexToRgb(color);
  for (let i = 0; i < 512; i++) {
    const t = i / 512;
    let a = 0.04;
    [0.08, 0.2, 0.33, 0.5, 0.62, 0.8, 0.95].forEach((p, k) => { if (Math.abs(t - p) < (k === 6 ? 0.025 : 0.008)) a = k === 6 ? 0.9 : 0.55; });
    g.fillStyle = `rgba(${r},${gg},${b},${a})`;
    g.fillRect(i, 0, 1, 4);
  }
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  procCache.set(key, tex);
  return tex;
}
