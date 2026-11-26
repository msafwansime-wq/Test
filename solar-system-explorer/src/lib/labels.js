import * as THREE from 'three';

// Lightweight label registry: 3D anchors register here; a single DOM layer
// renders the labels and positions them every frame after the scene renders.
const registry = new Map();
const listeners = new Set();
const elements = new Map();
let version = 0;

export function registerLabel(key, data) {
  registry.set(key, data);
  version++;
  listeners.forEach((l) => l());
}
export function unregisterLabel(key) {
  registry.delete(key);
  version++;
  listeners.forEach((l) => l());
}
export function subscribeLabels(l) {
  listeners.add(l);
  return () => listeners.delete(l);
}
export const getLabels = () => registry;
export const getLabelVersion = () => version;
export function bindLabelElement(key, el) {
  if (el) elements.set(key, el);
  else elements.delete(key);
}

const v = new THREE.Vector3();
export function updateLabelPositions(camera, size) {
  registry.forEach((data, key) => {
    const el = elements.get(key);
    const obj = data.obj;
    if (!el || !obj) return;
    obj.getWorldPosition(v);
    v.project(camera);
    let visible = v.z < 1 && v.z > -1 && Math.abs(v.x) < 1.3 && Math.abs(v.y) < 1.3;
    // hide if any ancestor is invisible
    for (let o = obj; o && visible; o = o.parent) if (!o.visible) visible = false;
    if (!visible) { el.style.display = 'none'; return; }
    el.style.display = '';
    const x = (v.x * 0.5 + 0.5) * size.width;
    const y = (-v.y * 0.5 + 0.5) * size.height;
    el.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0) translate(-50%, -50%)`;
    el.style.zIndex = String(Math.round((1 - v.z) * 100000));
  });
}
