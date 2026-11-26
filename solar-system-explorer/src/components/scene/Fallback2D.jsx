import { useEffect, useRef, useState } from 'react';
import { ORBITING_BODIES, PLANETS, EARTH_RADIUS_KM } from '../../data/planets.js';
import { MOONS_BY_PARENT } from '../../data/moons.js';
import { sim, notifySim, useApp, selectObject, app } from '../../lib/store.js';
import { heliocentricAU, orbitPathAU } from '../../lib/orbits.js';
import { getObject } from '../../lib/catalog.js';
import { pickComparePlanet } from './CompareScene.jsx';

// 2D SVG renderer used when WebGL is unavailable. Same data, same controls.
const scale = (au) => 46 * Math.sqrt(au);

function useTicker() {
  const [, setT] = useState(0);
  useEffect(() => {
    let raf, last = performance.now(), acc = 0;
    const loop = (now) => {
      const dt = Math.min((now - last) / 1000, 0.1);
      last = now;
      if (sim.playing) sim.days += sim.rate * dt;
      acc += dt;
      if (acc > 0.05) { acc = 0; setT((t) => t + 1); notifySim(); }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []);
}

function Overview2D() {
  useTicker();
  const { showLabels, showOrbits, selectedId, cameraCommand } = useApp();
  const [zoom, setZoom] = useState(1);
  useEffect(() => {
    if (!cameraCommand) return;
    if (cameraCommand.type === 'zoomIn') setZoom((z) => Math.min(8, z * 1.5));
    if (cameraCommand.type === 'zoomOut') setZoom((z) => Math.max(0.6, z / 1.5));
    if (cameraCommand.type === 'reset') setZoom(1);
  }, [cameraCommand]);
  const ref = useRef();
  const proj = (p) => { const r = Math.hypot(p[0], p[2]) || 1; const s = scale(r) / r; return [p[0] * s, p[2] * s]; };
  const R = 380 / zoom;
  return (
    <svg ref={ref} viewBox={`${-R} ${-R * 0.62} ${R * 2} ${R * 1.24}`} className="h-full w-full" onWheel={(e) => setZoom((z) => Math.min(8, Math.max(0.6, z * (e.deltaY > 0 ? 0.9 : 1.1))))}>
      <defs>
        <radialGradient id="sun2d"><stop offset="0" stopColor="#fff3c4" /><stop offset=".6" stopColor="#ffb340" /><stop offset="1" stopColor="#ff7a00" stopOpacity="0" /></radialGradient>
      </defs>
      <circle r="22" fill="url(#sun2d)" onClick={() => selectObject('sun')} style={{ cursor: 'pointer' }} />
      {showOrbits && ORBITING_BODIES.map((b) => (
        <polyline key={b.id} points={orbitPathAU(b.elements, 180).map((p) => proj(p).join(',')).join(' ')} fill="none" stroke={b.color} strokeOpacity={selectedId === b.id ? 0.9 : 0.3} strokeWidth={0.8 / zoom} strokeDasharray={b.kind === 'dwarf' ? '3 3' : undefined} />
      ))}
      {ORBITING_BODIES.map((b) => {
        const [x, y] = proj(heliocentricAU(b.elements, sim.days));
        const r = (3 + Math.pow(b.radiusKm / EARTH_RADIUS_KM, 0.5) * 3) / Math.sqrt(zoom);
        return (
          <g key={b.id} transform={`translate(${x},${y})`} onClick={() => selectObject(b.id)} style={{ cursor: 'pointer' }}>
            {b.rings && <ellipse rx={r * 2} ry={r * 0.6} fill="none" stroke="#d8c48f" strokeOpacity=".7" />}
            <circle r={r} fill={b.color} stroke={selectedId === b.id ? '#fff' : 'none'} strokeWidth={1 / zoom} />
            {showLabels && <text y={-r - 4 / zoom} textAnchor="middle" fontSize={11 / zoom} fill="#e6ebf5">{b.name}</text>}
          </g>
        );
      })}
    </svg>
  );
}

function Compare2D() {
  const { compareA, compareB } = useApp();
  let x = 0;
  const items = PLANETS.map((p) => { const r = (p.radiusKm / EARTH_RADIUS_KM) * 6; x += r; const it = { p, r, x }; x += r + 6; return it; });
  return (
    <svg viewBox={`-10 -80 ${x + 10} 160`} className="h-full w-full">
      {items.map(({ p, r, x: cx }) => (
        <g key={p.id} onClick={() => pickComparePlanet(p.id)} style={{ cursor: 'pointer' }}>
          <circle cx={cx} cy={0} r={r} fill={p.color} stroke={p.id === compareA ? '#7dd3fc' : p.id === compareB ? '#f9a8d4' : 'none'} strokeWidth="1.5" />
          <text x={cx} y={r + 12} textAnchor="middle" fontSize="7" fill="#e6ebf5">{p.name}</text>
        </g>
      ))}
    </svg>
  );
}

function Explore2D() {
  const { exploreId } = useApp();
  const b = getObject(exploreId);
  const moons = b.kind === 'moon' ? [] : MOONS_BY_PARENT[b.id] || [];
  return (
    <div className="relative grid h-full w-full place-items-center">
      <div className="orb" style={{ '--c': b.color, width: 'min(50vw, 50vh)', height: 'min(50vw, 50vh)' }} />
      <div className="absolute bottom-[38%] flex gap-3">
        {moons.map((m) => (
          <button key={m.id} className="label-pill label-small" style={{ '--dot': m.color }} onClick={() => { app.set({ exploreId: m.id }); selectObject(m.id, { focus: false }); }}>
            <span className="label-dot" />{m.name}
          </button>
        ))}
      </div>
    </div>
  );
}

export default function Fallback2D() {
  const { mode } = useApp();
  return (
    <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,#0c1328_0%,#03050d_70%)]">
      {mode === 'overview' && <Overview2D />}
      {mode === 'compare' && <Compare2D />}
      {mode === 'explore' && <Explore2D />}
      <div className="pointer-events-none absolute left-1/2 top-28 -translate-x-1/2 rounded-full bg-amber-500/10 px-3 py-1 text-[11px] text-amber-200">
        3D graphics unavailable — showing a simplified 2D view
      </div>
    </div>
  );
}
