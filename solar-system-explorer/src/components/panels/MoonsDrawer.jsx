import { useState } from 'react';
import { X, Droplets, Globe2 } from 'lucide-react';
import { MOONS } from '../../data/moons.js';
import { app, selectObject } from '../../lib/store.js';
import { getObject, fmt, fmtPeriodDays } from '../../lib/catalog.js';
import Term from '../ui/Term.jsx';

const FILTERS = [
  { id: 'all', label: 'All moons' },
  { id: 'ocean', label: 'Ocean worlds' },
  { id: 'earth', label: 'Earth' },
  { id: 'mars', label: 'Mars' },
  { id: 'jupiter', label: 'Jupiter' },
  { id: 'saturn', label: 'Saturn' },
  { id: 'neptune', label: 'Neptune' },
  { id: 'pluto', label: 'Pluto' },
];

export function openMoon(id) {
  app.set({ mode: 'explore', exploreId: id, drawer: null });
  selectObject(id, { focus: false });
  if (window.innerWidth < 1024) app.set({ panelOpen: false });
}

export default function MoonsDrawer() {
  const [filter, setFilter] = useState('all');
  const moons = MOONS.filter((m) => filter === 'all' || (filter === 'ocean' ? m.ocean : m.parent === filter));
  const maxD = Math.max(...MOONS.map((m) => m.diameterKm));
  return (
    <aside className="glass pointer-events-auto flex max-h-full w-full flex-col overflow-hidden rounded-3xl anim-side sm:w-[460px]" aria-label="Moon explorer">
      <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
        <div>
          <h2 className="font-display text-lg font-semibold">Moon Explorer</h2>
          <p className="text-xs text-slate-400">The most fascinating moons of our solar system</p>
        </div>
        <button className="btn-icon" onClick={() => app.set({ drawer: null })} aria-label="Close"><X size={18} /></button>
      </div>
      <div className="scrollbar-none flex gap-1.5 overflow-x-auto px-5 py-3">
        {FILTERS.map((f) => (
          <button key={f.id} onClick={() => setFilter(f.id)} aria-pressed={filter === f.id} className={`flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition ${filter === f.id ? 'bg-sky-300/15 text-sky-100 shadow-[inset_0_0_0_1px_rgba(125,211,252,0.35)]' : 'bg-white/5 text-slate-300 hover:bg-white/10'}`}>
            {f.id === 'ocean' && <Droplets size={12} />}{f.label}
          </button>
        ))}
      </div>
      <div className="scrollbar-thin flex-1 space-y-3 overflow-y-auto px-5 pb-5">
        {filter === 'ocean' && (
          <div className="rounded-2xl border border-sky-300/20 bg-sky-300/[0.05] p-4 text-sm leading-relaxed text-slate-300">
            <div className="mb-1 flex items-center gap-2 font-semibold text-sky-200"><Droplets size={15} /> Why ocean moons matter</div>
            Several icy moons hide <Term k="subsurface ocean">subsurface oceans</Term> of liquid water, kept warm by tidal squeezing from their giant planets. Water + energy + chemistry = the ingredients for life as we know it — which makes these moons some of the best places to search for life beyond Earth.
          </div>
        )}
        {moons.map((m) => {
          const parent = getObject(m.parent);
          return (
            <article key={m.id} className={`group rounded-2xl border p-4 transition ${m.ocean ? 'border-sky-300/20 bg-sky-300/[0.03]' : 'border-white/[0.07] bg-white/[0.025]'} hover:bg-white/[0.06]`}>
              <div className="flex items-start gap-3">
                <span className="orb mt-0.5" style={{ '--c': m.color, width: 18 + (m.diameterKm / maxD) * 30, height: 18 + (m.diameterKm / maxD) * 30 }} />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-display text-base font-semibold text-white">{m.name}</h3>
                    {m.ocean && (
                      <span className="flex items-center gap-1 rounded-full bg-sky-400/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-sky-200">
                        <Droplets size={10} /> {m.ocean === true ? 'Subsurface ocean' : 'Possible ocean'}
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-slate-400">
                    Orbits <span style={{ color: parent.color }}>{parent.name}</span> · {m.type}
                  </div>
                  <p className="mt-1.5 text-[13px] leading-relaxed text-slate-300">{m.tagline}</p>
                  <dl className="mt-2.5 grid grid-cols-3 gap-2 text-[11px]">
                    <div><dt className="text-slate-500">Diameter</dt><dd className="font-semibold text-slate-100">{fmt(m.diameterKm, m.diameterKm < 100 ? 1 : 0)} km</dd></div>
                    <div><dt className="text-slate-500">Orbit</dt><dd className="font-semibold text-slate-100">{fmtPeriodDays(m.orbitalPeriodDays).replace(' (retrograde)', ' ↺')}</dd></div>
                    <div><dt className="text-slate-500">Gravity</dt><dd className="font-semibold text-slate-100">{fmt(m.gravity, m.gravity < 0.1 ? 4 : 2)} m/s²</dd></div>
                  </dl>
                  {m.oceanNote && <p className="mt-2 text-[12px] leading-relaxed text-sky-100/80">{m.oceanNote}</p>}
                  <div className="mt-3 flex gap-2">
                    <button onClick={() => openMoon(m.id)} className="flex items-center gap-1.5 rounded-xl bg-sky-300/15 px-3 py-1.5 text-xs font-semibold text-sky-100 shadow-[inset_0_0_0_1px_rgba(125,211,252,0.35)] hover:bg-sky-300/25">
                      <Globe2 size={13} /> Explore in 3D
                    </button>
                    <button onClick={() => { selectObject(m.id, { focus: false }); app.set({ drawer: null }); }} className="rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-slate-200 hover:bg-white/10">
                      Details
                    </button>
                  </div>
                </div>
              </div>
            </article>
          );
        })}
        <p className="text-[11px] text-slate-500">Moon sizes in the thumbnails are relative to Ganymede, the largest moon. Data: NASA / JPL.</p>
      </div>
    </aside>
  );
}
