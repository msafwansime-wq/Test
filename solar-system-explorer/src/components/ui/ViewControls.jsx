import { ZoomIn, ZoomOut, LocateFixed, Tags, CircleDashed, Moon, Sparkle, Ruler } from 'lucide-react';
import { app, useApp, sendCamera } from '../../lib/store.js';

export default function ViewControls() {
  const { showLabels, showOrbits, showMoons, showBelts, drawer } = useApp();
  const toggle = (k) => app.set({ [k]: !app.get()[k] });
  return (
    <div className="pointer-events-auto glass flex flex-col gap-0.5 rounded-2xl p-1" role="toolbar" aria-label="View controls">
      <button className="btn-icon" onClick={() => sendCamera('zoomIn')} title="Zoom in" aria-label="Zoom in"><ZoomIn size={18} /></button>
      <button className="btn-icon" onClick={() => sendCamera('zoomOut')} title="Zoom out" aria-label="Zoom out"><ZoomOut size={18} /></button>
      <button className="btn-icon" onClick={() => sendCamera('reset')} title="Reset view" aria-label="Reset camera view"><LocateFixed size={18} /></button>
      <div className="mx-2 my-1 h-px bg-white/10" />
      <button className="btn-icon" aria-pressed={showLabels} onClick={() => toggle('showLabels')} title="Toggle labels" aria-label="Toggle planet labels"><Tags size={18} /></button>
      <button className="btn-icon" aria-pressed={showOrbits} onClick={() => toggle('showOrbits')} title="Toggle orbital paths" aria-label="Toggle orbital paths"><CircleDashed size={18} /></button>
      <button className="btn-icon" aria-pressed={showMoons} onClick={() => toggle('showMoons')} title="Toggle moons" aria-label="Toggle moons"><Moon size={18} /></button>
      <button className="btn-icon" aria-pressed={showBelts} onClick={() => toggle('showBelts')} title="Toggle asteroid & Kuiper belts" aria-label="Toggle asteroid and Kuiper belts"><Sparkle size={18} /></button>
      <button className="btn-icon" aria-pressed={drawer === 'scale'} onClick={() => app.set({ drawer: drawer === 'scale' ? null : 'scale' })} title="Scale settings" aria-label="Scale settings"><Ruler size={18} /></button>
    </div>
  );
}
