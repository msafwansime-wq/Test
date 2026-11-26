import { X, Info, Ruler } from 'lucide-react';
import { app, useApp } from '../../lib/store.js';
import { PLANETS, SUN, EARTH_RADIUS_KM } from '../../data/planets.js';
import { displayRadius, sizeExaggeration, sunDisplayRadius } from '../../lib/orbits.js';
import { fmt } from '../../lib/catalog.js';

export function ScaleBadge() {
  const { distMode, sizeMode, mode } = useApp();
  let text;
  if (mode === 'compare') text = 'Sizes to true scale · spacing not to scale';
  else if (mode === 'explore') text = 'Moon distances compressed · rotation real (time-lapse)';
  else text = `${distMode === 'true' ? 'True distances' : 'Distances compressed'} · ${sizeMode === 'true' ? 'true size ratios' : 'sizes enlarged'}`;
  return (
    <button
      onClick={() => app.set({ drawer: 'scale' })}
      className="pointer-events-auto glass flex items-center gap-2 rounded-full px-3 py-1.5 text-[11px] font-medium text-amber-200/90 transition hover:text-amber-100"
      title="Learn how scale is shown"
    >
      <Ruler size={13} /> <span className="hidden sm:inline">Visual scale:</span> {text}
      <Info size={13} className="opacity-70" />
    </button>
  );
}

function Seg({ value, options, onChange, label }) {
  return (
    <div>
      <div className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-slate-400">{label}</div>
      <div className="flex rounded-xl bg-white/5 p-1">
        {options.map((o) => (
          <button
            key={o.id}
            onClick={() => onChange(o.id)}
            aria-pressed={value === o.id}
            className={`flex-1 rounded-lg px-3 py-2 text-left text-sm transition ${value === o.id ? 'bg-sky-300/15 text-sky-100 shadow-[inset_0_0_0_1px_rgba(125,211,252,0.35)]' : 'text-slate-300 hover:bg-white/5'}`}
          >
            <div className="font-medium">{o.label}</div>
            <div className="text-[11px] text-slate-400">{o.hint}</div>
          </button>
        ))}
      </div>
    </div>
  );
}

export default function ScaleDrawer() {
  const { distMode, sizeMode } = useApp();
  const earth = PLANETS.find((p) => p.id === 'earth');
  const earthEx = sizeExaggeration(earth.radiusKm, displayRadius(earth.radiusKm, sizeMode), distMode);
  const sunShownPct = (sunDisplayRadius(distMode) / (displayRadius(earth.radiusKm, sizeMode) * (SUN.radiusKm / earth.radiusKm))) * 100;
  // "If the Sun were a 1-metre ball" model
  const sunD = SUN.diameterKm;
  return (
    <aside className="glass pointer-events-auto flex max-h-full w-full flex-col overflow-hidden rounded-3xl anim-side sm:w-[400px]" aria-label="Scale settings">
      <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
        <h2 className="font-display text-lg font-semibold">Understanding scale</h2>
        <button className="btn-icon" onClick={() => app.set({ drawer: null })} aria-label="Close"><X size={18} /></button>
      </div>
      <div className="scrollbar-thin space-y-5 overflow-y-auto px-5 py-4 text-sm leading-relaxed text-slate-300">
        <p>
          Space is <em>mostly empty</em>. If we drew the planets at their real sizes <em>and</em> real distances on one screen, they would all be smaller than a single pixel. So this explorer lets you choose what to keep accurate.
        </p>
        <Seg
          label="Distances from the Sun"
          value={distMode}
          onChange={(v) => app.set({ distMode: v })}
          options={[
            { id: 'compressed', label: 'Compressed', hint: 'Square-root scale, easy to explore' },
            { id: 'true', label: 'True proportions', hint: '1 AU = 30 units, linear' },
          ]}
        />
        <Seg
          label="Planet sizes"
          value={sizeMode}
          onChange={(v) => app.set({ sizeMode: v })}
          options={[
            { id: 'enhanced', label: 'Enlarged', hint: 'Small worlds made visible' },
            { id: 'true', label: 'True ratios', hint: 'Planets exact vs. each other' },
          ]}
        />
        <div className="rounded-2xl border border-amber-300/20 bg-amber-300/5 p-4 text-[13px]">
          <div className="mb-1 flex items-center gap-2 font-semibold text-amber-200"><Info size={14} /> What you are seeing now</div>
          <ul className="list-disc space-y-1 pl-4">
            <li>{distMode === 'true' ? 'Distances between orbits are in true proportion to each other.' : 'Distances are compressed (√ of the real distance): the order is right, but the outer planets are pulled much closer.'}</li>
            <li>{sizeMode === 'true' ? 'Planets are shown at their true sizes relative to each other.' : 'Small planets are enlarged more than big ones so everyone stays visible.'}</li>
            {earthEx && <li>Compared with the distances, planets are drawn about <b className="text-white">{fmt(earthEx, 0)}×</b> larger than reality (Earth).</li>}
            <li>Compared with Earth as drawn here, the Sun is shown at only about <b className="text-white">{fmt(sunShownPct, sunShownPct < 10 ? 1 : 0)}%</b> of its true size, so it doesn't swallow the inner planets.</li>
            <li>Planet <b className="text-white">positions, orbit shapes and orbital speeds are real</b> (NASA/JPL elements). Spin rates are real but capped at high time-lapse speeds.</li>
            <li>Moon distances around their planets are heavily compressed.</li>
          </ul>
        </div>
        <div>
          <h3 className="mb-2 font-display text-base font-semibold text-white">A true scale model</h3>
          <p className="mb-3">If the Sun were a beach ball <b className="text-white">1 metre</b> wide:</p>
          <div className="overflow-hidden rounded-2xl border border-white/10">
            <table className="w-full text-[13px]">
              <thead className="bg-white/5 text-left text-xs text-slate-400">
                <tr><th className="px-3 py-2 font-medium">Planet</th><th className="px-3 py-2 font-medium">Size</th><th className="px-3 py-2 font-medium">Distance from ball</th></tr>
              </thead>
              <tbody>
                {PLANETS.map((p) => {
                  const mm = (p.diameterKm / sunD) * 1000;
                  const m = p.distanceKm / sunD;
                  return (
                    <tr key={p.id} className="border-t border-white/5">
                      <td className="px-3 py-1.5"><span className="mr-2 inline-block h-2 w-2 rounded-full" style={{ background: p.color }} />{p.name}</td>
                      <td className="px-3 py-1.5 tabular-nums">{fmt(mm, 1)} mm</td>
                      <td className="px-3 py-1.5 tabular-nums">{m >= 1000 ? `${fmt(m / 1000, 2)} km` : `${fmt(m)} m`}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <p className="mt-3 text-xs text-slate-400">Earth would be a peppercorn about a football pitch away; Neptune would be a marble more than 3 km away. The nearest other star would be about 29,000 km away!</p>
        </div>
        <p className="text-xs text-slate-500">Sizes: NASA Planetary Fact Sheet. 1 Earth radius = {fmt(EARTH_RADIUS_KM)} km.</p>
      </div>
    </aside>
  );
}
