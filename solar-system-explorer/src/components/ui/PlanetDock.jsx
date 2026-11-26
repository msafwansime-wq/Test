import { SUN, PLANETS, DWARF_PLANETS } from '../../data/planets.js';
import { app, useApp, selectObject } from '../../lib/store.js';
import { pickComparePlanet } from '../scene/CompareScene.jsx';

// Planet selector: vertical dock on desktop, horizontal scroller on mobile.
export function goToObject(id) {
  const { mode } = app.get();
  if (mode === 'explore') {
    app.set({ exploreId: id });
    selectObject(id, { focus: false });
  } else if (mode === 'compare') {
    pickComparePlanet(id);
  } else {
    selectObject(id);
  }
}

export default function PlanetDock() {
  const { mode, selectedId, exploreId, compareA, compareB } = useApp();
  const items = mode === 'compare' ? PLANETS : [SUN, ...PLANETS, null, ...DWARF_PLANETS];
  const activeId = mode === 'explore' ? exploreId : selectedId;
  return (
    <nav
      aria-label="Planet selector"
      className="pointer-events-auto glass scrollbar-none flex max-w-full gap-1 overflow-x-auto rounded-2xl p-1.5 md:max-h-[calc(100vh-220px)] md:flex-col md:overflow-y-auto md:overflow-x-hidden"
    >
      {items.map((b, i) =>
        b === null ? (
          <div key={'sep' + i} className="mx-1 my-0.5 shrink-0 bg-white/10 md:mx-2 md:h-px md:w-auto max-md:w-px" />
        ) : (
          <DockItem
            key={b.id}
            body={b}
            active={mode === 'compare' ? b.id === compareA || b.id === compareB : activeId === b.id}
            badge={mode === 'compare' ? (b.id === compareA ? 'A' : b.id === compareB ? 'B' : null) : null}
          />
        ),
      )}
    </nav>
  );
}

function DockItem({ body, active, badge }) {
  const size = body.kind === 'star' ? 22 : Math.max(10, Math.min(22, 8 + Math.log2(body.radiusKm / 1000 + 1) * 3.2));
  return (
    <button
      onClick={() => goToObject(body.id)}
      aria-current={active ? 'true' : undefined}
      title={body.name}
      className={`group relative flex shrink-0 items-center gap-2.5 rounded-xl px-2.5 py-1.5 text-left text-[13px] transition-all md:w-36 ${active ? 'bg-white/10 text-white' : 'text-slate-300 hover:bg-white/5 hover:text-white'}`}
    >
      <span className="grid w-6 place-items-center">
        <span className="orb" style={{ '--c': body.color, width: size, height: size }} />
      </span>
      <span className={`whitespace-nowrap font-medium ${body.kind === 'dwarf' ? 'text-slate-400 group-hover:text-white' : ''}`}>{body.name.replace('The ', '')}</span>
      {badge && <span className={`badge-ab ${badge.toLowerCase()} ml-auto`}>{badge}</span>}
      {active && !badge && <span className="ml-auto hidden h-1.5 w-1.5 rounded-full md:block" style={{ background: body.color, boxShadow: `0 0 8px ${body.color}` }} />}
    </button>
  );
}
