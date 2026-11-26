import { Orbit, Scale, Globe2, Search, Sparkles, Moon, GraduationCap } from 'lucide-react';
import { app, useApp } from '../../lib/store.js';
import { getObject } from '../../lib/catalog.js';
import { DISCOVERIES } from '../../data/learn.js';

export function setMode(mode) {
  const s = app.get();
  const patch = { mode };
  const sel = getObject(s.selectedId);
  if (mode === 'explore' && sel && sel.kind !== 'belt') patch.exploreId = sel.id;
  if (mode === 'compare') {
    if (sel?.kind === 'planet' && sel.id !== s.compareA && sel.id !== s.compareB) patch.compareB = sel.id;
    patch.panelOpen = false;
  }
  if (mode === 'explore') {
    patch.selectedId = patch.exploreId || s.exploreId;
    if (window.innerWidth < 1024) patch.panelOpen = false;
  }
  app.set(patch);
}

export function randomDiscovery() {
  const prev = app.get().discovery;
  let d;
  do d = DISCOVERIES[Math.floor(Math.random() * DISCOVERIES.length)];
  while (DISCOVERIES.length > 1 && d === prev?.item);
  app.set({ discovery: { item: d, t: Date.now() } });
}

const MODES = [
  { id: 'overview', label: 'Solar System', short: 'Overview', icon: Orbit },
  { id: 'compare', label: 'Compare Sizes', short: 'Compare', icon: Scale },
  { id: 'explore', label: 'Explore World', short: 'Explore', icon: Globe2 },
];

export default function TopBar() {
  const { mode, drawer } = useApp();
  return (
    <header className="pointer-events-none absolute inset-x-0 top-0 z-30 flex flex-col gap-2 p-3 sm:p-4 lg:flex-row lg:items-center lg:justify-between">
      <div className="pointer-events-auto flex items-center justify-between gap-3">
        <button className="flex items-center gap-2.5 text-left" onClick={() => { app.set({ mode: 'overview', selectedId: null, panelOpen: false, focusId: null }); }} aria-label="Solar System Explorer home">
          <span className="relative grid h-9 w-9 place-items-center">
            <span className="absolute inset-0 rounded-full bg-amber-400/20 blur-md" />
            <span className="orb h-5 w-5" style={{ '--c': '#ffb340' }} />
            <span className="absolute inset-0 rounded-full border border-sky-300/30" style={{ transform: 'rotateX(70deg)' }} />
          </span>
          <span>
            <span className="block font-display text-[15px] font-semibold leading-tight tracking-tight sm:text-base">Solar System Explorer</span>
            <span className="hidden text-[11px] text-slate-400 sm:block">Interactive 3D · NASA data</span>
          </span>
        </button>
        <div className="flex items-center gap-1 lg:hidden">
          <ActionButtons drawer={drawer} />
        </div>
      </div>

      <nav className="pointer-events-auto glass mx-auto flex w-full max-w-md rounded-2xl p-1 lg:absolute lg:left-1/2 lg:top-4 lg:w-auto lg:-translate-x-1/2" aria-label="Exploration modes">
        {MODES.map((m) => {
          const Icon = m.icon;
          const active = mode === m.id;
          return (
            <button
              key={m.id}
              onClick={() => setMode(m.id)}
              aria-pressed={active}
              className={`flex flex-1 items-center justify-center gap-2 rounded-xl px-3 py-2 text-sm font-medium transition-all lg:flex-none lg:px-4 ${active ? 'bg-sky-300/15 text-sky-200 shadow-[inset_0_0_0_1px_rgba(125,211,252,0.35)]' : 'text-slate-300 hover:bg-white/5 hover:text-white'}`}
            >
              <Icon size={16} />
              <span className="hidden sm:inline">{m.label}</span>
              <span className="sm:hidden">{m.short}</span>
            </button>
          );
        })}
      </nav>

      <div className="pointer-events-auto hidden items-center gap-1 lg:flex">
        <ActionButtons drawer={drawer} />
      </div>
    </header>
  );
}

function ActionButtons({ drawer }) {
  const base = 'glass flex h-10 min-w-10 items-center justify-center gap-2 rounded-xl px-2.5 text-sm text-slate-200 transition hover:text-white aria-pressed:text-sky-300';
  const lbl = 'hidden min-[1400px]:inline';
  return (
    <>
      <button className={base} onClick={() => app.set({ searchOpen: true })} aria-label="Search the solar system" title="Search (/)">
        <Search size={17} />
        <span className={`${lbl} items-center gap-2`}>Search <kbd className="ml-1 rounded border border-white/15 px-1.5 text-[10px] text-slate-400">/</kbd></span>
      </button>
      <button className={base} onClick={randomDiscovery} aria-label="Random discovery" title="Random discovery">
        <Sparkles size={17} className="text-amber-300" />
        <span className={lbl}>Discover</span>
      </button>
      <button className={base} aria-pressed={drawer === 'moons'} onClick={() => app.set({ drawer: drawer === 'moons' ? null : 'moons' })} aria-label="Moon explorer" title="Moon explorer">
        <Moon size={17} />
        <span className={lbl}>Moons</span>
      </button>
      <button className={base} aria-pressed={drawer === 'learn'} onClick={() => app.set({ drawer: drawer === 'learn' ? null : 'learn' })} aria-label="Learn: Did you know and quiz" title="Did You Know? & Quiz">
        <GraduationCap size={17} />
        <span className={lbl}>Learn & Quiz</span>
      </button>
    </>
  );
}
