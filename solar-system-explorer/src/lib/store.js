import { useSyncExternalStore } from 'react';
import { dateToDaysSinceJ2000 } from './orbits.js';

// Minimal global store (no extra dependency).
function createStore(initial) {
  let state = initial;
  const listeners = new Set();
  return {
    get: () => state,
    set: (patch) => {
      const next = typeof patch === 'function' ? patch(state) : patch;
      state = { ...state, ...next };
      listeners.forEach((l) => l());
    },
    subscribe: (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
  };
}

export const app = createStore({
  mode: 'overview', // overview | compare | explore
  selectedId: null, // object shown in the info panel
  focusId: null, // object the overview camera follows
  exploreId: 'earth',
  exploreAxis: true,
  exploreMoons: true,
  compareA: 'earth',
  compareB: 'jupiter',
  compareFrame: 'all', // all | pair
  lastPicked: 'B',
  showLabels: true,
  showOrbits: true,
  showMoons: true,
  showBelts: true,
  distMode: 'compressed',
  sizeMode: 'enhanced',
  panelOpen: false,
  drawer: null, // 'moons' | 'learn' | 'quiz' | 'scale' | null
  searchOpen: false,
  discovery: null,
  cameraCommand: null, // { type: 'reset' | 'zoomIn' | 'zoomOut', t }
  webgl: true,
});

export function useApp(selector = (s) => s) {
  return useSyncExternalStore(app.subscribe, () => selector(app.get()));
}

// ---------- Simulation clock (mutated every frame, UI polls it) ----------
export const SPEEDS = [
  { label: '1 hour / s', days: 1 / 24 },
  { label: '6 hours / s', days: 0.25 },
  { label: '1 day / s', days: 1 },
  { label: '1 week / s', days: 7 },
  { label: '1 month / s', days: 30.44 },
  { label: '3 months / s', days: 91.3 },
  { label: '1 year / s', days: 365.25 },
  { label: '5 years / s', days: 1826.25 },
];
export const DEFAULT_SPEED = 3;

export const sim = {
  days: dateToDaysSinceJ2000(new Date()),
  playing: true,
  speedIndex: DEFAULT_SPEED,
  get rate() {
    return SPEEDS[this.speedIndex].days;
  },
};
const simListeners = new Set();
export function notifySim() {
  simListeners.forEach((l) => l());
}
export function subscribeSim(l) {
  simListeners.add(l);
  return () => simListeners.delete(l);
}
export function resetSim() {
  sim.days = dateToDaysSinceJ2000(new Date());
  sim.speedIndex = DEFAULT_SPEED;
  sim.playing = true;
  notifySim();
}

export function selectObject(id, opts = {}) {
  const s = app.get();
  app.set({
    selectedId: id,
    panelOpen: !!id,
    focusId: opts.focus === false ? s.focusId : id,
  });
}

export function sendCamera(type) {
  app.set({ cameraCommand: { type, t: performance.now() } });
}
