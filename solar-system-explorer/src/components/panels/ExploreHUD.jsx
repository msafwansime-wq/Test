import { useState } from 'react';
import { Play, Pause, ChevronLeft, ChevronRight, Axis3d, Moon, Info } from 'lucide-react';
import { app, useApp, selectObject } from '../../lib/store.js';
import { getObject, fmtDuration, fmt } from '../../lib/catalog.js';
import { MAIN_BODIES } from '../../data/planets.js';
import { MOONS_BY_PARENT } from '../../data/moons.js';
import { TIMELAPSES, exploreState } from '../scene/ExploreScene.jsx';
import Term from '../ui/Term.jsx';

export default function ExploreHUD() {
  const { exploreId, exploreAxis, exploreMoons, panelOpen } = useApp();
  const [, force] = useState(0);
  const body = getObject(exploreId) || getObject('earth');
  const list = MAIN_BODIES;
  const idx = list.findIndex((b) => b.id === body.id);
  const go = (d) => {
    const base = idx === -1 ? list.findIndex((b) => b.id === body.parent) : idx;
    const next = list[(base + d + list.length) % list.length];
    app.set({ exploreId: next.id });
    selectObject(next.id, { focus: false });
  };
  const tl = TIMELAPSES[exploreState.timelapse];
  const turnSeconds = body.rotationHours ? Math.abs(body.rotationHours) / tl.hours : null;
  const moons = body.kind === 'moon' ? [] : MOONS_BY_PARENT[body.id] || [];

  return (
    <div className="pointer-events-auto glass w-full max-w-[22rem] rounded-3xl p-4 anim-in" aria-label="Explore controls">
      <div className="flex items-center gap-2">
        <button className="btn-icon h-9 w-9" onClick={() => go(-1)} aria-label="Previous world"><ChevronLeft size={18} /></button>
        <div className="min-w-0 flex-1 text-center">
          <div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-400">{body.kind === 'moon' ? `Moon of ${getObject(body.parent).name}` : body.type}</div>
          <div className="truncate font-display text-xl font-semibold text-white">{body.name}</div>
        </div>
        <button className="btn-icon h-9 w-9" onClick={() => go(1)} aria-label="Next world"><ChevronRight size={18} /></button>
      </div>

      <div className="mt-3 grid grid-cols-3 gap-2 text-center">
        <Mini label={<Term k="rotation period">Spin</Term>} value={body.rotationHours ? fmtDuration(body.rotationHours).replace(' (retrograde)', '') : '—'} sub={body.rotationHours < 0 ? 'retrograde' : body.tidallyLocked ? 'tidally locked' : ''} />
        <Mini label={<Term k="axial tilt">Tilt</Term>} value={body.tilt != null ? `${fmt(body.tilt, 1)}°` : '—'} />
        <Mini label="Diameter" value={`${fmt(body.diameterKm)} km`} />
      </div>

      <div className="mt-3">
        <div className="mb-1.5 flex items-center justify-between text-[11px] text-slate-400">
          <span>Time-lapse</span>
          {turnSeconds && <span>1 turn ≈ {turnSeconds < 120 ? `${fmt(turnSeconds, 0)} s` : turnSeconds < 7200 ? `${fmt(turnSeconds / 60, 0)} min` : `${fmt(turnSeconds / 3600, 1)} h`} of real time</span>}
        </div>
        <div className="flex items-center gap-1">
          <button
            className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-sky-300/15 text-sky-200"
            onClick={() => { exploreState.paused = !exploreState.paused; force((n) => n + 1); }}
            aria-label={exploreState.paused ? 'Play rotation' : 'Pause rotation'}
          >
            {exploreState.paused ? <Play size={16} /> : <Pause size={16} />}
          </button>
          <div className="flex flex-1 rounded-xl bg-white/5 p-0.5">
            {TIMELAPSES.map((t, i) => (
              <button
                key={t.label}
                onClick={() => { exploreState.timelapse = i; force((n) => n + 1); }}
                aria-pressed={exploreState.timelapse === i}
                className={`flex-1 rounded-lg px-1 py-1.5 text-[11px] font-medium transition ${exploreState.timelapse === i ? 'bg-white/10 text-white' : 'text-slate-400 hover:text-white'}`}
              >
                {t.label.replace('1 s = ', '')}
              </button>
            ))}
          </div>
        </div>
        <div className="mt-1 text-[10px] text-slate-500">1 real second = {tl.label.replace('1 s = ', '')} on {body.name.replace('The ', '')}</div>
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        <Toggle on={exploreAxis} onClick={() => app.set({ exploreAxis: !exploreAxis })} icon={Axis3d} label="Spin axis" />
        {moons.length > 0 && <Toggle on={exploreMoons} onClick={() => app.set({ exploreMoons: !exploreMoons })} icon={Moon} label={`Moons (${moons.length})`} />}
        {!panelOpen && (
          <button onClick={() => selectObject(body.id, { focus: false })} className="flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-slate-200 hover:bg-white/10">
            <Info size={14} /> Details
          </button>
        )}
      </div>
      {moons.length > 0 && exploreMoons && <p className="mt-2 text-[10px] leading-snug text-slate-500">Moon sizes are to scale with {body.name}; their distances are compressed so they fit on screen. Tap a moon to visit it.</p>}
    </div>
  );
}

function Mini({ label, value, sub }) {
  return (
    <div className="rounded-xl bg-white/[0.04] px-2 py-2">
      <div className="text-[10px] uppercase tracking-wider text-slate-400">{label}</div>
      <div className="truncate text-[13px] font-semibold text-white">{value}</div>
      {sub && <div className="text-[10px] text-slate-500">{sub}</div>}
    </div>
  );
}

function Toggle({ on, onClick, icon: Icon, label }) {
  return (
    <button onClick={onClick} aria-pressed={on} className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-medium transition ${on ? 'bg-sky-300/15 text-sky-100 shadow-[inset_0_0_0_1px_rgba(125,211,252,0.3)]' : 'border border-white/10 bg-white/5 text-slate-300 hover:bg-white/10'}`}>
      <Icon size={14} /> {label}
    </button>
  );
}
