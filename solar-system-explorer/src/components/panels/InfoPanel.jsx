import { useEffect, useState } from 'react';
import {
  X, Globe2, Scale, Crosshair, ChevronDown, Rocket, Sparkles, Thermometer, Weight, Ruler, Orbit as OrbitIcon,
  Clock, Gauge, Sun as SunIcon, Moon as MoonIcon, Droplets, CheckCircle2, XCircle, UserRound, BookOpen,
} from 'lucide-react';
import { app, useApp, selectObject } from '../../lib/store.js';
import {
  getObject, KIND_LABEL, fmt, fmtMass, massEarths, fmtEarthRatio, fmtDuration, fmtPeriodDays, fmtDistanceKm, positionLabel,
} from '../../lib/catalog.js';
import { MOONS_BY_PARENT } from '../../data/moons.js';
import { EARTH_RADIUS_KM } from '../../data/planets.js';
import Term from '../ui/Term.jsx';

function Stat({ icon: Icon, label, value, sub, term }) {
  return (
    <div className="rounded-2xl border border-white/[0.07] bg-white/[0.03] p-3">
      <div className="mb-1 flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wider text-slate-400">
        {Icon && <Icon size={12} />}
        {term ? <Term k={term}>{label}</Term> : label}
      </div>
      <div className="font-display text-[15px] font-semibold leading-snug text-white">{value}</div>
      {sub && <div className="mt-0.5 text-[11px] leading-snug text-slate-400">{sub}</div>}
    </div>
  );
}

function Row({ label, term, children }) {
  return (
    <div className="flex items-baseline justify-between gap-4 border-b border-white/5 py-2.5 text-sm last:border-0">
      <span className="text-slate-400">{term ? <Term k={term}>{label}</Term> : label}</span>
      <span className="text-right font-medium text-slate-100">{children}</span>
    </div>
  );
}

function Section({ title, icon: Icon, children, defaultOpen = false }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="overflow-hidden rounded-2xl border border-white/[0.07] bg-white/[0.025]">
      <button className="flex w-full items-center gap-2.5 px-4 py-3 text-left text-sm font-semibold text-white hover:bg-white/[0.03]" onClick={() => setOpen((o) => !o)} aria-expanded={open}>
        {Icon && <Icon size={16} className="text-sky-300" />}
        <span className="flex-1">{title}</span>
        <ChevronDown size={16} className={`text-slate-400 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && <div className="anim-in px-4 pb-4 text-sm leading-relaxed text-slate-300">{children}</div>}
    </div>
  );
}

export function InteriorDiagram({ body }) {
  if (!body.layers) return null;
  const R = 70;
  return (
    <div className="flex items-center gap-4">
      <svg viewBox="-80 -80 160 160" className="h-36 w-36 shrink-0" role="img" aria-label={`Simplified interior of ${body.name}`}>
        <defs>
          <clipPath id="cut"><path d={`M0 0 L${R + 5} 0 A${R + 5} ${R + 5} 0 1 1 0 ${-(R + 5)} Z`} /></clipPath>
        </defs>
        <circle r={R} fill={body.color} opacity="0.9" />
        <g clipPath="url(#cut)" transform="rotate(90)">
          {body.layers.map((l) => <circle key={l.name} r={R * l.r} fill={l.color} stroke="rgba(0,0,0,.3)" strokeWidth="0.6" />)}
        </g>
        <circle r={R} fill="none" stroke="rgba(255,255,255,.25)" />
      </svg>
      <ul className="space-y-1.5 text-xs">
        {body.layers.map((l) => (
          <li key={l.name} className="flex items-start gap-2">
            <span className="mt-0.5 h-3 w-3 shrink-0 rounded-sm" style={{ background: l.color }} />
            <span><span className="text-slate-200">{l.name}</span>{l.r < 1 && <span className="text-slate-500"> · to {Math.round(l.r * 100)}% radius</span>}</span>
          </li>
        ))}
        <li className="pt-1 text-[10px] text-slate-500">Simplified, approximate model</li>
      </ul>
    </div>
  );
}

function Missions({ missions }) {
  if (!missions?.length) return null;
  return (
    <ol className="relative ml-2 space-y-4 border-l border-sky-300/20 pl-5">
      {missions.map((m) => (
        <li key={m.name} className="relative">
          <span className="absolute -left-[27px] top-1 grid h-3.5 w-3.5 place-items-center rounded-full bg-space-950 ring-2 ring-sky-300/60"><span className="h-1.5 w-1.5 rounded-full bg-sky-300" /></span>
          <div className="flex flex-wrap items-baseline gap-x-2">
            <span className="font-semibold text-white">{m.name}</span>
            <span className="text-xs text-sky-300">{m.year}</span>
          </div>
          <div className="text-[11px] uppercase tracking-wider text-slate-500">{m.agency}</div>
          <p className="mt-1 text-sm leading-relaxed text-slate-300">{m.note}</p>
        </li>
      ))}
    </ol>
  );
}

function OverviewTab({ o }) {
  const [weight, setWeight] = useState(40);
  const isBody = o.kind !== 'belt';
  if (!isBody) {
    return (
      <div className="space-y-4">
        <p className="text-sm leading-relaxed text-slate-300">{o.summary}</p>
        <div className="grid grid-cols-2 gap-2">
          <Stat icon={Ruler} label="Inner edge" value={`${o.innerAu} AU`} term="AU" />
          <Stat icon={Ruler} label="Outer edge" value={`${o.outerAu} AU`} term="AU" />
        </div>
      </div>
    );
  }
  const widthRatio = o.diameterKm / (EARTH_RADIUS_KM * 2);
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-2">
        <Stat icon={Ruler} label="Diameter" value={`${fmt(o.diameterKm)} km`} sub={`${fmtEarthRatio(widthRatio)}× Earth`} />
        <Stat icon={Weight} label="Mass" term="mass" value={fmtMass(o.massKg)} sub={`${fmtEarthRatio(massEarths(o.massKg))}× Earth`} />
        <Stat icon={Gauge} label="Gravity" term="gravity" value={`${fmt(o.gravity, o.gravity < 1 ? 3 : 1)} m/s²`} sub={`${fmt((o.gravity / 9.8) * 100, o.gravity < 0.1 ? 2 : 0)}% of Earth's`} />
        <Stat icon={Thermometer} label={o.kind === 'star' ? 'Surface temp.' : 'Average temp.'} value={`${fmt(o.meanTempC)} °C`} sub={o.tempRange} />
        {o.distanceKm && <Stat icon={SunIcon} label="Distance from Sun" value={fmtDistanceKm(o.distanceKm)} sub={<><Term k="AU">{o.au} AU</Term> · light takes {fmtLight(o.distanceKm)}</>} />}
        {o.kind === 'moon' && <Stat icon={OrbitIcon} label={`Distance from ${getObject(o.parent).name}`} value={`${fmt(o.orbitDistanceKm)} km`} />}
        <Stat icon={Crosshair} label="Position" value={positionLabel(o)} sub={o.kind === 'moon' ? o.discovered : o.type} />
      </div>
      {o.gravity && o.kind !== 'star' && (
        <div className="rounded-2xl border border-sky-300/15 bg-sky-300/[0.04] p-4">
          <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-sky-200"><UserRound size={15} /> Your weight on {o.name.replace('The ', '')}</div>
          <div className="flex flex-wrap items-center gap-3 text-sm text-slate-300">
            <label className="flex items-center gap-2">
              On Earth
              <input type="number" min="1" max="500" value={weight} onChange={(e) => setWeight(Math.max(0, +e.target.value))} className="w-16 rounded-lg border border-white/10 bg-white/5 px-2 py-1 text-white" aria-label="Your weight on Earth in kilograms" />
              kg
            </label>
            <span>→</span>
            <span className="font-display text-xl font-semibold text-white">{fmt((weight * o.gravity) / 9.8, 1)} kg</span>
          </div>
          <p className="mt-1.5 text-[11px] text-slate-500">Strictly, your <em>mass</em> stays the same — this is how heavy you would feel.</p>
        </div>
      )}
      {o.unique && (
        <Section title="What makes it unique?" icon={Sparkles} defaultOpen>
          {o.unique}
        </Section>
      )}
      {o.ocean && (
        <Section title={o.ocean === true ? 'Hidden ocean' : 'Possible hidden ocean'} icon={Droplets} defaultOpen>
          {o.oceanNote}
        </Section>
      )}
      {o.habitability && (
        <Section title="Could humans explore or live there?" icon={UserRound}>
          {o.habitability}
        </Section>
      )}
      {'visited' in o && (
        <div className="flex items-center gap-2 rounded-2xl border border-white/[0.07] bg-white/[0.025] px-4 py-3 text-sm">
          {o.visited ? <CheckCircle2 size={16} className="text-emerald-400" /> : <XCircle size={16} className="text-rose-400" />}
          <span className="text-slate-300">{o.visited ? 'Visited by spacecraft — see the Missions tab.' : 'No spacecraft has visited yet.'}</span>
        </div>
      )}
    </div>
  );
}

function fmtLight(km) {
  const s = km / 299792.458;
  if (s < 3600) return `${fmt(s / 60, 1)} min`;
  return `${fmt(s / 3600, 1)} h`;
}

function OrbitTab({ o }) {
  const moons = MOONS_BY_PARENT[o.id] || [];
  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-white/[0.07] bg-white/[0.025] px-4 py-1">
        {o.orbitalPeriodDays && <Row label="Year (orbital period)" term="orbital period">{fmtPeriodDays(o.orbitalPeriodDays)}</Row>}
        {o.rotationHours && <Row label="Spin (rotation period)" term="rotation period">{fmtDuration(o.rotationHours)}</Row>}
        {o.dayLengthHours && <Row label="Day (sunrise to sunrise)" term="solar day">{fmtDuration(o.dayLengthHours)}</Row>}
        {o.orbitalSpeedKms && <Row label="Average orbital speed" term="orbital speed">{fmt(o.orbitalSpeedKms, 1)} km/s <span className="text-slate-500">({fmt(o.orbitalSpeedKms * 3600)} km/h)</span></Row>}
        {o.distanceKm && <Row label="Distance from the Sun">{fmtDistanceKm(o.distanceKm)} · {o.au} AU</Row>}
        {o.kind === 'moon' && <Row label={`Distance from ${getObject(o.parent).name}`}>{fmt(o.orbitDistanceKm)} km</Row>}
        {o.eccentricity != null && <Row label="Orbit shape" term="eccentricity">e = {o.eccentricity} {o.eccentricity < 0.02 ? '(nearly circular)' : o.eccentricity > 0.2 ? '(stretched oval)' : '(slightly oval)'}</Row>}
        {o.tilt != null && <Row label="Axial tilt" term="axial tilt">{fmt(o.tilt, 1)}°</Row>}
        {o.escapeVelocity && <Row label="Escape velocity" term="escape velocity">{fmt(o.escapeVelocity, 1)} km/s</Row>}
        {o.moons != null && <Row label="Known moons">{fmt(o.moons)}</Row>}
        {o.tidallyLocked && <Row label="Rotation" term="tidally locked">Tidally locked</Row>}
      </div>
      {o.kind === 'star' && <p className="text-sm text-slate-300">The Sun itself orbits the centre of the Milky Way at about 220 km/s, taking roughly 230 million years for one lap.</p>}
      {moons.length > 0 && (
        <div>
          <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-400">Moons you can explore</div>
          <div className="flex flex-wrap gap-2">
            {moons.map((m) => (
              <button key={m.id} onClick={() => { app.set({ mode: 'explore', exploreId: m.id }); selectObject(m.id, { focus: false }); if (window.innerWidth < 1024) app.set({ panelOpen: false }); }} className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-sm hover:bg-white/10">
                <span className="orb h-3.5 w-3.5" style={{ '--c': m.color }} />{m.name}
                {m.ocean && <Droplets size={12} className="text-sky-300" />}
              </button>
            ))}
          </div>
        </div>
      )}
      {o.approximatePosition && <p className="text-xs text-slate-500">Position in the 3D view is approximate (simplified orbital elements).</p>}
    </div>
  );
}

function PhysicalTab({ o }) {
  return (
    <div className="space-y-2.5">
      {o.layers && (
        <Section title="Internal structure" icon={BookOpen} defaultOpen>
          <InteriorDiagram body={o} />
          {o.interior && <p className="mt-3">{o.interior}</p>}
        </Section>
      )}
      {o.atmosphere && <Section title="Atmosphere" icon={Globe2} defaultOpen={!o.layers}>{o.atmosphere}</Section>}
      {o.surface && <Section title="Surface" icon={Ruler} defaultOpen={o.kind === 'moon'}>{o.surface}</Section>}
      {o.magneticField && <Section title="Magnetic field" term="magnetic field" icon={Gauge}><Term k="magnetic field">Magnetic field</Term>: {o.magneticField}</Section>}
      {(o.features || o.highlights) && (
        <Section title={o.kind === 'moon' ? 'Highlights' : 'Unique geological features'} icon={Sparkles} defaultOpen={o.kind === 'moon'}>
          <ul className="list-disc space-y-1.5 pl-4">{(o.features || o.highlights).map((f) => <li key={f}>{f}</li>)}</ul>
        </Section>
      )}
      {o.density && <p className="px-1 pt-1 text-xs text-slate-500">Average density: {fmt(o.density)} kg/m³ (water = 1,000)</p>}
    </div>
  );
}

function FactsTab({ o }) {
  const facts = o.facts || o.highlights || [];
  return (
    <div className="space-y-3">
      <ol className="space-y-2.5">
        {facts.map((f, i) => (
          <li key={f} className="flex gap-3 rounded-2xl border border-white/[0.07] bg-white/[0.025] p-3.5 text-sm leading-relaxed text-slate-200">
            <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-amber-300/15 font-display text-xs font-bold text-amber-200">{i + 1}</span>
            {f}
          </li>
        ))}
      </ol>
    </div>
  );
}

const TABS = [
  { id: 'overview', label: 'Overview' },
  { id: 'orbit', label: 'Orbit' },
  { id: 'physical', label: 'Physical' },
  { id: 'facts', label: 'Facts' },
  { id: 'missions', label: 'Missions' },
];

export default function InfoPanel() {
  const { selectedId, mode } = useApp();
  const o = getObject(selectedId);
  const [tab, setTab] = useState('overview');
  useEffect(() => setTab('overview'), [selectedId]);
  if (!o) return null;
  const tabs = TABS.filter((t) => {
    if (o.kind === 'belt') return ['overview', 'facts', 'missions'].includes(t.id);
    if (o.kind === 'moon') return t.id !== 'facts';
    return true;
  });
  const parent = o.parent ? getObject(o.parent) : null;
  const canExplore = o.kind !== 'belt';
  return (
    <aside key={o.id} className="glass pointer-events-auto flex max-h-full w-full flex-col overflow-hidden rounded-3xl anim-side sm:w-[420px]" aria-label={`${o.name} information`}>
      <div className="relative overflow-hidden px-5 pb-3 pt-5">
        <div className="pointer-events-none absolute -right-16 -top-20 h-56 w-56 rounded-full opacity-25 blur-3xl" style={{ background: o.color }} />
        <div className="relative flex items-start gap-3.5">
          <span className="orb mt-1 h-12 w-12" style={{ '--c': o.color }} />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-slate-300">
                {o.kind === 'planet' ? <Term k={o.category === 'gas' ? 'gas giant' : o.category === 'ice' ? 'ice giant' : 'terrestrial planet'}>{o.type}</Term> : o.kind === 'dwarf' ? <Term k="dwarf planet">{o.type}</Term> : o.type || KIND_LABEL[o.kind]}
              </span>
              {o.ocean && <span className="flex items-center gap-1 rounded-full bg-sky-400/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-sky-200"><Droplets size={10} /> {o.ocean === true ? 'Ocean world' : 'Possible ocean'}</span>}
            </div>
            <h2 className="mt-1 font-display text-2xl font-semibold leading-tight tracking-tight text-white">{o.name}</h2>
            <p className="mt-0.5 text-[13px] leading-snug text-slate-400">{o.tagline}</p>
          </div>
          <button className="btn-icon -mr-2 -mt-2" onClick={() => app.set({ panelOpen: false, selectedId: mode === 'explore' ? app.get().selectedId : null })} aria-label="Close information panel"><X size={18} /></button>
        </div>
        <div className="relative mt-3 flex flex-wrap gap-2">
          {canExplore && mode !== 'explore' && (
            <button onClick={() => app.set({ mode: 'explore', exploreId: o.id, ...(window.innerWidth < 1024 ? { panelOpen: false } : {}) })} className="flex items-center gap-1.5 rounded-xl bg-sky-300/15 px-3 py-1.5 text-xs font-semibold text-sky-100 shadow-[inset_0_0_0_1px_rgba(125,211,252,0.35)] hover:bg-sky-300/25">
              <Globe2 size={14} /> Explore in 3D
            </button>
          )}
          {o.kind === 'planet' && (
            <button onClick={() => { const s = app.get(); app.set({ mode: 'compare', panelOpen: false, ...(o.id !== s.compareA ? { compareB: o.id } : {}) }); }} className="flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-semibold text-slate-200 hover:bg-white/10">
              <Scale size={14} /> Compare
            </button>
          )}
          {mode !== 'overview' && o.kind !== 'moon' && (
            <button onClick={() => { app.set({ mode: 'overview' }); selectObject(o.id); }} className="flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-semibold text-slate-200 hover:bg-white/10">
              <Crosshair size={14} /> Show in solar system
            </button>
          )}
          {parent && (
            <button onClick={() => { if (mode === 'explore') app.set({ exploreId: parent.id }); selectObject(parent.id, { focus: mode === 'overview' }); }} className="flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-semibold text-slate-200 hover:bg-white/10">
              <MoonIcon size={14} /> Orbits {parent.name}
            </button>
          )}
        </div>
      </div>
      <div className="scrollbar-none flex gap-1 overflow-x-auto border-b border-white/10 px-4" role="tablist">
        {tabs.map((t) => (
          <button
            key={t.id}
            role="tab"
            aria-selected={tab === t.id}
            onClick={() => setTab(t.id)}
            className={`relative whitespace-nowrap px-3 py-2.5 text-[13px] font-medium transition ${tab === t.id ? 'text-white' : 'text-slate-400 hover:text-slate-200'}`}
          >
            {t.label}
            {tab === t.id && <span className="absolute inset-x-2 -bottom-px h-0.5 rounded-full" style={{ background: o.color }} />}
          </button>
        ))}
      </div>
      <div className="scrollbar-thin flex-1 overflow-y-auto px-5 py-4" role="tabpanel">
        {tab === 'overview' && <OverviewTab o={o} />}
        {tab === 'orbit' && <OrbitTab o={o} />}
        {tab === 'physical' && <PhysicalTab o={o} />}
        {tab === 'facts' && <FactsTab o={o} />}
        {tab === 'missions' && (
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-400"><Rocket size={13} /> Notable missions & discoveries</div>
            <Missions missions={o.missions} />
          </div>
        )}
        <div className="mt-6 flex items-start gap-2 rounded-xl bg-white/[0.03] p-3 text-[11px] leading-relaxed text-slate-500">
          <Clock size={12} className="mt-0.5 shrink-0" />
          <span><b className="text-slate-400">Scientific data</b> from NASA (Planetary Fact Sheet, NASA Science) and JPL. Moon counts as of 2025. The 3D view is a <b className="text-slate-400">visual representation</b> and not to scale unless stated.</span>
        </div>
      </div>
    </aside>
  );
}
