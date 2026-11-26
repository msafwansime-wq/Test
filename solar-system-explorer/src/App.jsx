import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { MousePointer2, X } from 'lucide-react';
import { app, useApp } from './lib/store.js';
import Stage, { hasWebGL } from './components/scene/Stage.jsx';
import TopBar from './components/ui/TopBar.jsx';
import PlanetDock from './components/ui/PlanetDock.jsx';
import TimeControls from './components/ui/TimeControls.jsx';
import ViewControls from './components/ui/ViewControls.jsx';
import SearchDialog from './components/ui/SearchDialog.jsx';
import DiscoveryToast from './components/ui/DiscoveryToast.jsx';
import InfoPanel from './components/panels/InfoPanel.jsx';
import ComparePanel from './components/panels/ComparePanel.jsx';
import ExploreHUD from './components/panels/ExploreHUD.jsx';
import MoonsDrawer from './components/panels/MoonsDrawer.jsx';
import LearnDrawer from './components/panels/LearnDrawer.jsx';
import ScaleDrawer, { ScaleBadge } from './components/panels/ScaleDrawer.jsx';

function useInsetTracking(ref) {
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const update = () => {
      const child = el.firstElementChild;
      if (!child) { app.set({ uiInset: { right: 0, bottom: 0 } }); return; }
      const r = child.getBoundingClientRect();
      const W = window.innerWidth, H = window.innerHeight;
      const side = r.left > W * 0.45 && r.height > H * 0.5;
      app.set({ uiInset: side ? { right: W - r.left + 8, bottom: 0 } : { right: 0, bottom: Math.max(0, H - r.top) * 0.9 } });
    };
    const ro = new ResizeObserver(update);
    ro.observe(el);
    const mo = new MutationObserver(() => { if (el.firstElementChild) ro.observe(el.firstElementChild); update(); });
    mo.observe(el, { childList: true });
    if (el.firstElementChild) ro.observe(el.firstElementChild);
    window.addEventListener('resize', update);
    update();
    return () => { ro.disconnect(); mo.disconnect(); window.removeEventListener('resize', update); };
  }, [ref]);
}

function Hint() {
  const [show, setShow] = useState(() => {
    try { return !localStorage.getItem('sse-hint'); } catch { return true; }
  });
  useEffect(() => {
    if (!show) return;
    const t = setTimeout(() => setShow(false), 12000);
    return () => clearTimeout(t);
  }, [show]);
  if (!show) return null;
  const dismiss = () => { setShow(false); try { localStorage.setItem('sse-hint', '1'); } catch { /* ignore */ } };
  return (
    <div className="glass pointer-events-auto flex max-w-sm items-start gap-3 rounded-2xl p-3.5 text-sm text-slate-300 anim-in">
      <MousePointer2 size={18} className="mt-0.5 shrink-0 text-sky-300" />
      <div>
        <div className="font-semibold text-white">Welcome, explorer!</div>
        <span className="hidden md:inline">Drag to rotate · scroll to zoom · right-drag to pan. </span>
        <span className="md:hidden">Drag to rotate · pinch to zoom. </span>
        Tap any planet to learn about it.
      </div>
      <button className="btn-icon -mr-1 -mt-1 h-7 w-7" onClick={dismiss} aria-label="Dismiss tip"><X size={14} /></button>
    </div>
  );
}

export default function App() {
  const { mode, panelOpen, selectedId, drawer, discovery } = useApp();
  const sideRef = useRef();
  useInsetTracking(sideRef);

  useEffect(() => {
    if (!hasWebGL()) app.set({ webgl: false });
    const onKey = (e) => {
      if (e.key === 'Escape' && !app.get().searchOpen) {
        const s = app.get();
        if (s.drawer) app.set({ drawer: null });
        else if (s.panelOpen) app.set({ panelOpen: false });
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  let side = null;
  if (drawer === 'moons') side = <MoonsDrawer />;
  else if (drawer === 'learn') side = <LearnDrawer />;
  else if (drawer === 'scale') side = <ScaleDrawer />;
  else if (mode === 'compare') side = <ComparePanel />;
  else if (panelOpen && selectedId) side = <InfoPanel />;

  return (
    <div className="relative h-full w-full overflow-hidden bg-space-950 select-none">
      <Stage />
      {/* soft vignette */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_55%,rgba(3,5,13,0.65)_100%)]" />

      <TopBar />

      <div className="pointer-events-none absolute inset-x-0 top-[112px] z-10 flex justify-center px-3 lg:top-[76px]">
        <ScaleBadge />
      </div>

      {/* Planet selector: left dock (desktop) / bottom bar (mobile) */}
      <div className={`pointer-events-none absolute z-10 max-md:inset-x-3 max-md:bottom-3 max-md:flex max-md:justify-center md:left-4 md:top-24 ${mode === 'explore' ? 'lg:[&>nav]:max-h-[calc(100vh-470px)]' : ''}`}>
        <PlanetDock />
      </div>

      {/* Bottom-centre controls */}
      <div className={`pointer-events-none absolute inset-x-3 bottom-[76px] z-10 flex flex-col items-center gap-2 md:bottom-4 ${mode === 'overview' ? 'max-md:pr-12' : ''}`}>
        {discovery && <DiscoveryToast />}
        {!discovery && mode === 'overview' && <Hint />}
        {mode === 'overview' && <TimeControls />}
        {mode === 'explore' && <div className="w-full max-w-[22rem] lg:hidden"><ExploreHUD /></div>}
      </div>
      {mode === 'explore' && <div className="pointer-events-none absolute bottom-4 left-4 z-10 hidden w-[22rem] lg:block"><ExploreHUD /></div>}

      {mode === 'overview' && (
        <div className="pointer-events-none absolute right-3 top-[150px] z-10 max-md:[&_.btn-icon]:h-9 max-md:[&_.btn-icon]:w-9 md:bottom-4 md:left-[176px] md:right-auto md:top-auto lg:top-auto">
          <ViewControls />
        </div>
      )}

      {/* Right column: info panel, compare panel, drawers (bottom sheet on mobile) */}
      <div
        ref={sideRef}
        className="pointer-events-none absolute inset-x-2 bottom-2 z-20 flex max-h-[62vh] justify-end sm:inset-x-auto sm:bottom-4 sm:right-4 sm:top-[112px] sm:max-h-none lg:top-24"
      >
        {side}
      </div>

      <SearchDialog />
    </div>
  );
}
