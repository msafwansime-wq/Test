import { useEffect, useMemo, useRef, useState } from 'react';
import { Search, X, CornerDownLeft, Droplets } from 'lucide-react';
import { app, useApp, selectObject } from '../../lib/store.js';
import { searchObjects, KIND_LABEL, getObject } from '../../lib/catalog.js';

export function openResult(o) {
  const { mode } = app.get();
  app.set({ searchOpen: false });
  if (o.kind === 'moon') {
    app.set({ mode: 'explore', exploreId: o.id });
    selectObject(o.id, { focus: false });
    if (window.innerWidth < 1024) app.set({ panelOpen: false });
  } else if (mode === 'explore' && o.kind !== 'belt') {
    app.set({ exploreId: o.id });
    selectObject(o.id, { focus: false });
  } else {
    if (mode !== 'overview') app.set({ mode: 'overview' });
    selectObject(o.id);
  }
}

export default function SearchDialog() {
  const { searchOpen } = useApp();
  const [q, setQ] = useState('');
  const [active, setActive] = useState(0);
  const inputRef = useRef();
  const results = useMemo(() => searchObjects(q), [q]);

  useEffect(() => {
    const onKey = (e) => {
      if ((e.key === '/' && !e.target.closest('input, textarea')) || ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k')) {
        e.preventDefault();
        app.set({ searchOpen: true });
      }
      if (e.key === 'Escape') app.set({ searchOpen: false });
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);
  useEffect(() => {
    if (searchOpen) { setQ(''); setActive(0); setTimeout(() => inputRef.current?.focus(), 30); }
  }, [searchOpen]);
  useEffect(() => setActive(0), [q]);

  if (!searchOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/50 p-4 pt-[12vh] backdrop-blur-sm" onPointerDown={(e) => e.target === e.currentTarget && app.set({ searchOpen: false })}>
      <div className="glass w-full max-w-lg overflow-hidden rounded-3xl anim-in" role="dialog" aria-modal="true" aria-label="Search the solar system">
        <div className="flex items-center gap-3 border-b border-white/10 px-4">
          <Search size={18} className="text-slate-400" />
          <input
            ref={inputRef}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'ArrowDown') { e.preventDefault(); setActive((a) => Math.min(a + 1, results.length - 1)); }
              if (e.key === 'ArrowUp') { e.preventDefault(); setActive((a) => Math.max(a - 1, 0)); }
              if (e.key === 'Enter' && results[active]) openResult(results[active]);
            }}
            placeholder="Search planets, moons, dwarf planets…"
            className="h-14 flex-1 bg-transparent text-base text-white placeholder:text-slate-500 focus:outline-none"
            aria-label="Search query"
            role="combobox"
            aria-expanded="true"
            aria-controls="search-results"
          />
          <button className="btn-icon h-8 w-8" onClick={() => app.set({ searchOpen: false })} aria-label="Close search"><X size={16} /></button>
        </div>
        <ul id="search-results" role="listbox" className="scrollbar-thin max-h-[50vh] overflow-y-auto p-2">
          {results.length === 0 && <li className="px-4 py-8 text-center text-sm text-slate-400">No objects match “{q}”. Try “Mars”, “moon” or “ocean”.</li>}
          {results.map((o, i) => (
            <li key={o.id} role="option" aria-selected={i === active}>
              <button
                onMouseEnter={() => setActive(i)}
                onClick={() => openResult(o)}
                className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition ${i === active ? 'bg-white/10' : ''}`}
              >
                <span className="orb h-7 w-7" style={{ '--c': o.color }} />
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-2 text-sm font-semibold text-white">
                    {o.name}
                    {o.ocean && <Droplets size={12} className="text-sky-300" />}
                  </span>
                  <span className="block truncate text-xs text-slate-400">
                    {KIND_LABEL[o.kind]}{o.parent ? ` of ${getObject(o.parent).name}` : ''} · {o.tagline}
                  </span>
                </span>
                {i === active && <CornerDownLeft size={14} className="text-slate-500" />}
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
