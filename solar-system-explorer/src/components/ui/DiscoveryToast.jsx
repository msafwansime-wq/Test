import { Sparkles, X, Telescope, Shuffle } from 'lucide-react';
import { app, useApp } from '../../lib/store.js';
import { getObject } from '../../lib/catalog.js';
import { openResult } from './SearchDialog.jsx';
import { randomDiscovery } from './TopBar.jsx';

export default function DiscoveryToast() {
  const { discovery } = useApp();
  if (!discovery) return null;
  const o = getObject(discovery.item.id);
  return (
    <div key={discovery.t} className="glass pointer-events-auto relative w-full max-w-sm overflow-hidden rounded-3xl p-4 anim-in" role="status">
      <div className="pointer-events-none absolute -left-10 -top-10 h-40 w-40 rounded-full opacity-30 blur-3xl" style={{ background: o.color }} />
      <div className="relative flex items-start gap-3">
        <span className="orb mt-0.5 h-10 w-10" style={{ '--c': o.color }} />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-amber-200"><Sparkles size={12} /> Random discovery · {o.name}</div>
          <p className="mt-1 text-sm leading-relaxed text-slate-100">{discovery.item.text}</p>
          <div className="mt-3 flex gap-2">
            <button onClick={() => { app.set({ discovery: null }); openResult(o); }} className="flex items-center gap-1.5 rounded-xl bg-sky-300/15 px-3 py-1.5 text-xs font-semibold text-sky-100 shadow-[inset_0_0_0_1px_rgba(125,211,252,0.35)] hover:bg-sky-300/25">
              <Telescope size={13} /> Take me there
            </button>
            <button onClick={randomDiscovery} className="flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-slate-200 hover:bg-white/10">
              <Shuffle size={13} /> Another
            </button>
          </div>
        </div>
        <button className="btn-icon -mr-2 -mt-2 h-8 w-8" onClick={() => app.set({ discovery: null })} aria-label="Dismiss"><X size={16} /></button>
      </div>
    </div>
  );
}
