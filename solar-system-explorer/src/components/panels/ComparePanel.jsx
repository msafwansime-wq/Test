import { useMemo, useState } from 'react';
import { ArrowLeftRight, ChevronUp, ChevronDown, Focus, Maximize2, BarChart3 } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, CartesianGrid } from 'recharts';
import { PLANETS } from '../../data/planets.js';
import { app, useApp } from '../../lib/store.js';
import { getObject, fmt, fmtPeriodDays, fmtDuration, fmtDistanceKm, massEarths } from '../../lib/catalog.js';
import Term from '../ui/Term.jsx';

const COLOR_A = '#7dd3fc';
const COLOR_B = '#f9a8d4';

export const METRICS = [
  { id: 'diameter', label: 'Diameter', unit: 'km', get: (p) => p.diameterKm, format: (v) => `${fmt(v)} km`, log: true,
    explain: (a, b, r) => `${a.name} is ${r >= 1 ? fmtR(r) + '× wider than' : fmtR(1 / r) + '× narrower than'} ${b.name}. About ${fmtBig(Math.pow(Math.max(a.radiusKm / b.radiusKm, b.radiusKm / a.radiusKm), 3))} ${r >= 1 ? b.name : a.name}s could fit inside ${r >= 1 ? a.name : b.name} (by volume).` },
  { id: 'mass', label: 'Mass', unit: 'Earths', term: 'mass', get: (p) => massEarths(p.massKg), format: (v) => `${v < 1 ? fmt(v, 3) : fmt(v, 1)} × Earth`, log: true,
    explain: (a, b, r) => `${a.name} has ${r >= 1 ? fmtR(r) + '× more' : fmtR(1 / r) + '× less'} mass than ${b.name}.` },
  { id: 'gravity', label: 'Gravity', unit: 'm/s²', term: 'gravity', get: (p) => p.gravity, format: (v) => `${fmt(v, 1)} m/s²`,
    explain: (a, b, r) => `A person weighing 40 kg on Earth would feel like ${fmt(40 * a.gravity / 9.8, 1)} kg on ${a.name} and ${fmt(40 * b.gravity / 9.8, 1)} kg on ${b.name}.` },
  { id: 'temp', label: 'Avg temperature', unit: '°C', get: (p) => p.meanTempC, format: (v) => `${fmt(v)} °C`, signed: true,
    explain: (a, b) => `${a.meanTempC > b.meanTempC ? a.name : b.name} is ${fmt(Math.abs(a.meanTempC - b.meanTempC))} °C warmer on average. ${a.id === 'venus' || b.id === 'venus' ? 'Venus is hottest because its thick CO₂ atmosphere traps heat.' : ''}` },
  { id: 'distance', label: 'Distance from Sun', unit: 'million km', get: (p) => p.distanceKm / 1e6, format: (v) => fmtDistanceKm(v * 1e6), log: true,
    explain: (a, b, r) => `${r >= 1 ? a.name : b.name} is ${fmtR(Math.max(r, 1 / r))}× farther from the Sun. Sunlight takes ${fmt(a.distanceKm / 299792.458 / 60, 1)} min to reach ${a.name} and ${fmt(b.distanceKm / 299792.458 / 60, 1)} min to reach ${b.name}.` },
  { id: 'year', label: 'Orbital period (year)', unit: 'Earth days', term: 'orbital period', get: (p) => p.orbitalPeriodDays, format: (v) => fmtPeriodDays(v), log: true,
    explain: (a, b, r) => `One year on ${r >= 1 ? a.name : b.name} lasts as long as ${fmtR(Math.max(r, 1 / r))} years on ${r >= 1 ? b.name : a.name}.` },
  { id: 'day', label: 'Rotation period (day)', unit: 'hours', term: 'rotation period', get: (p) => Math.abs(p.rotationHours), format: (v) => fmtDuration(v), log: true,
    explain: (a, b, r) => `${r >= 1 ? b.name : a.name} spins ${fmtR(Math.max(r, 1 / r))}× faster than ${r >= 1 ? a.name : b.name}.${a.rotationHours < 0 || b.rotationHours < 0 ? ' (Venus and Uranus spin backwards — retrograde.)' : ''}` },
];

function fmtR(r) { return r >= 100 ? fmt(r, 0) : r >= 10 ? fmt(r, 1) : fmt(r, 2); }
function fmtBig(n) { return n < 1.5 ? '1' : n >= 1000 ? fmt(Math.round(n / 10) * 10) : fmt(n, n < 10 ? 1 : 0); }

function PlanetPicker({ value, other, onChange, color, label }) {
  return (
    <div className="min-w-0 flex-1">
      <div className="mb-1.5 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider" style={{ color }}>
        <span className={`badge-ab ${label.toLowerCase()}`}>{label}</span> Planet {label}
      </div>
      <div className="grid grid-cols-8 gap-1 sm:grid-cols-4">
        {PLANETS.map((p) => (
          <button
            key={p.id}
            disabled={p.id === other}
            onClick={() => onChange(p.id)}
            aria-pressed={value === p.id}
            title={p.name}
            className={`flex min-w-0 items-center justify-center gap-1.5 rounded-lg px-1.5 py-1.5 text-xs transition disabled:opacity-30 sm:justify-start ${value === p.id ? 'bg-white/10 text-white' : 'text-slate-400 hover:bg-white/5 hover:text-white'}`}
            style={value === p.id ? { boxShadow: `inset 0 0 0 1px ${color}` } : undefined}
          >
            <span className="orb h-3.5 w-3.5" style={{ '--c': p.color }} />
            <span className="truncate max-sm:hidden">{p.name}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

function SizeOverlay({ a, b }) {
  const max = Math.max(a.diameterKm, b.diameterKm);
  const ra = (a.diameterKm / max) * 52, rb = (b.diameterKm / max) * 52;
  return (
    <svg viewBox="0 0 120 120" className="h-28 w-28 shrink-0" role="img" aria-label={`Size of ${a.name} compared with ${b.name}`}>
      <circle cx="60" cy={112 - ra} r={ra} fill={a.color} fillOpacity="0.35" stroke={COLOR_A} strokeWidth="1.2" />
      <circle cx="60" cy={112 - rb} r={rb} fill={b.color} fillOpacity="0.35" stroke={COLOR_B} strokeWidth="1.2" strokeDasharray="3 2" />
      <line x1="4" y1="112" x2="116" y2="112" stroke="rgba(255,255,255,.2)" />
    </svg>
  );
}

function MetricRow({ m, a, b, active, onClick }) {
  const va = m.get(a), vb = m.get(b);
  const span = m.signed ? Math.max(Math.abs(va), Math.abs(vb)) : Math.max(va, vb);
  const w = (v) => `${Math.max((Math.abs(v) / span) * 100, 1.5)}%`;
  return (
    <div role="button" tabIndex={0} onClick={onClick} onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && (e.preventDefault(), onClick())} aria-pressed={active} className={`w-full cursor-pointer rounded-2xl border p-3 text-left transition ${active ? 'border-sky-300/30 bg-sky-300/[0.05]' : 'border-white/[0.07] bg-white/[0.025] hover:bg-white/[0.05]'}`}>
      <div className="mb-2 flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-slate-400">
        {m.term ? <Term k={m.term}>{m.label}</Term> : m.label}
        <BarChart3 size={13} className={active ? 'text-sky-300' : 'opacity-40'} />
      </div>
      {[[a, va, COLOR_A], [b, vb, COLOR_B]].map(([p, v, c]) => (
        <div key={p.id} className="mb-1 flex items-center gap-2 text-xs">
          <span className="w-16 shrink-0 truncate text-slate-300">{p.name}</span>
          <div className="relative h-2.5 flex-1 overflow-hidden rounded-full bg-white/5">
            <div className="h-full rounded-full transition-all duration-700" style={{ width: w(v), background: v < 0 ? `repeating-linear-gradient(45deg, ${c}, ${c} 4px, ${c}99 4px, ${c}99 8px)` : c }} />
          </div>
          <span className="w-28 shrink-0 text-right tabular-nums text-slate-100">{m.format(v)}</span>
        </div>
      ))}
      <p className="mt-2 text-[12.5px] leading-relaxed text-slate-300">{m.explain(a, b, va / vb)}</p>
    </div>
  );
}

function ChartTip({ active, payload, metric }) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return <div className="glass rounded-lg px-3 py-2 text-xs"><b>{d.name}</b>: {metric.format(d.raw)}</div>;
}

export default function ComparePanel() {
  const { compareA, compareB, compareFrame } = useApp();
  const [metricId, setMetricId] = useState('diameter');
  const [collapsed, setCollapsed] = useState(() => typeof window !== 'undefined' && window.innerWidth < 640);
  const a = getObject(compareA), b = getObject(compareB);
  const metric = METRICS.find((m) => m.id === metricId);
  const data = useMemo(() => PLANETS.map((p) => {
    const raw = metric.get(p);
    return { name: p.name, id: p.id, raw, value: metric.log ? raw : raw, color: p.color };
  }), [metric]);

  return (
    <section className="glass pointer-events-auto flex max-h-full w-full flex-col overflow-hidden rounded-3xl anim-in lg:w-[440px]" aria-label="Planet comparison">
      <div className="flex items-center gap-2 border-b border-white/10 px-4 py-3">
        <h2 className="flex-1 font-display text-base font-semibold">Compare planets</h2>
        <button className="btn-icon h-9 w-9" onClick={() => app.set({ compareFrame: compareFrame === 'all' ? 'pair' : 'all' })} title={compareFrame === 'all' ? 'Zoom to A & B' : 'Show all planets'} aria-label={compareFrame === 'all' ? 'Zoom to selected planets' : 'Show all planets'}>
          {compareFrame === 'all' ? <Focus size={17} /> : <Maximize2 size={17} />}
        </button>
        <button className="btn-icon h-9 w-9" onClick={() => app.set({ compareA: compareB, compareB: compareA })} title="Swap A and B" aria-label="Swap planets"><ArrowLeftRight size={17} /></button>
        <button className="btn-icon h-9 w-9" onClick={() => setCollapsed((c) => !c)} aria-label={collapsed ? 'Expand comparison panel' : 'Collapse comparison panel'}>{collapsed ? <ChevronUp size={17} /> : <ChevronDown size={17} />}</button>
      </div>
      <div className="flex gap-3 px-4 pt-3">
        <PlanetPicker label="A" value={compareA} other={compareB} color={COLOR_A} onChange={(id) => app.set({ compareA: id })} />
      </div>
      <div className="flex gap-3 px-4 pb-3 pt-2">
        <PlanetPicker label="B" value={compareB} other={compareA} color={COLOR_B} onChange={(id) => app.set({ compareB: id })} />
      </div>
      {!collapsed && (
        <div className="scrollbar-thin flex-1 space-y-3 overflow-y-auto px-4 pb-4">
          <div className="flex items-center gap-3 rounded-2xl border border-white/[0.07] bg-white/[0.025] p-3">
            <SizeOverlay a={a} b={b} />
            <div className="text-sm leading-relaxed text-slate-300">
              <div className="mb-1 font-display text-base font-semibold text-white">
                <span style={{ color: COLOR_A }}>{a.name}</span> vs <span style={{ color: COLOR_B }}>{b.name}</span>
              </div>
              {METRICS[0].explain(a, b, a.diameterKm / b.diameterKm)}
              <div className="mt-1 text-[11px] text-slate-500">Circles drawn to true scale. Tap a planet in 3D to choose it.</div>
            </div>
          </div>

          <div className="rounded-2xl border border-white/[0.07] bg-white/[0.025] p-3">
            <div className="mb-2 flex items-center justify-between">
              <div className="text-xs font-semibold uppercase tracking-wider text-slate-400">All planets · {metric.label}</div>
              {metric.log && <div className="text-[10px] text-slate-500">log scale</div>}
            </div>
            <div className="h-44">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: -12 }}>
                  <CartesianGrid vertical={false} stroke="rgba(255,255,255,0.06)" />
                  <XAxis dataKey="name" tick={{ fill: '#94a3b8', fontSize: 10 }} tickFormatter={(n) => n.slice(0, 3)} axisLine={false} tickLine={false} />
                  <YAxis
                    scale={metric.log ? 'log' : 'auto'}
                    domain={metric.log ? ['auto', 'auto'] : [metric.signed ? 'auto' : 0, 'auto']}
                    allowDataOverflow
                    tick={{ fill: '#64748b', fontSize: 10 }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(v) => (Math.abs(v) >= 1000 ? `${fmt(v / 1000, 0)}k` : fmt(v, v < 1 ? 2 : 0))}
                  />
                  <Tooltip content={<ChartTip metric={metric} />} cursor={{ fill: 'rgba(255,255,255,0.04)' }} />
                  <Bar dataKey="value" radius={[4, 4, 0, 0]} isAnimationActive>
                    {data.map((d) => (
                      <Cell key={d.id} fill={d.id === compareA ? COLOR_A : d.id === compareB ? COLOR_B : d.color} fillOpacity={d.id === compareA || d.id === compareB ? 1 : 0.28} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-1 text-[10px] text-slate-500">Units: {metric.unit}. Tap a metric below to chart it.</div>
          </div>

          {METRICS.map((m) => (
            <MetricRow key={m.id} m={m} a={a} b={b} active={metricId === m.id} onClick={() => setMetricId(m.id)} />
          ))}
          <p className="px-1 text-[11px] text-slate-500">Data: NASA Planetary Fact Sheet. Temperatures are averages (cloud-top for giant planets).</p>
        </div>
      )}
    </section>
  );
}
