import { useEffect, useState, useSyncExternalStore } from 'react';
import { Play, Pause, RotateCcw, Rewind, FastForward } from 'lucide-react';
import { sim, SPEEDS, subscribeSim, notifySim, resetSim } from '../../lib/store.js';
import { daysSinceJ2000ToDate } from '../../lib/orbits.js';

const fmtDate = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });

function useSimSnapshot() {
  // Re-render at most ~10×/s; snapshot is a string so React can compare cheaply.
  return useSyncExternalStore(subscribeSim, () => `${Math.floor(sim.days * 4)}|${sim.playing}|${sim.speedIndex}`);
}

export default function TimeControls() {
  useSimSnapshot();
  const date = daysSinceJ2000ToDate(sim.days);
  const year = date.getUTCFullYear();
  const valid = year > -9999 && year < 9999;
  const toggle = () => { sim.playing = !sim.playing; notifySim(); };
  const slower = () => { sim.speedIndex = Math.max(0, sim.speedIndex - 1); notifySim(); };
  const faster = () => { sim.speedIndex = Math.min(SPEEDS.length - 1, sim.speedIndex + 1); notifySim(); };

  useEffect(() => {
    const onKey = (e) => {
      if (e.target.closest('input, textarea')) return;
      if (e.code === 'Space') { e.preventDefault(); toggle(); }
      if (e.key === '[' || e.key === ',') slower();
      if (e.key === ']' || e.key === '.') faster();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const [showTip, setShowTip] = useState(false);
  return (
    <div className="pointer-events-auto glass flex items-center gap-1 rounded-2xl p-1.5" role="group" aria-label="Time simulation controls">
      <button className="btn-icon" onClick={resetSim} title="Reset to today" aria-label="Reset simulation to today"><RotateCcw size={17} /></button>
      <button className="btn-icon" onClick={slower} disabled={sim.speedIndex === 0} title="Slower ( [ )" aria-label="Decrease simulation speed"><Rewind size={17} /></button>
      <button
        className="grid h-11 w-11 place-items-center rounded-xl bg-sky-300/15 text-sky-200 shadow-[inset_0_0_0_1px_rgba(125,211,252,0.35)] transition hover:bg-sky-300/25"
        onClick={toggle}
        title={sim.playing ? 'Pause (Space)' : 'Play (Space)'}
        aria-label={sim.playing ? 'Pause simulation' : 'Play simulation'}
      >
        {sim.playing ? <Pause size={19} /> : <Play size={19} className="translate-x-px" />}
      </button>
      <button className="btn-icon" onClick={faster} disabled={sim.speedIndex === SPEEDS.length - 1} title="Faster ( ] )" aria-label="Increase simulation speed"><FastForward size={17} /></button>
      <div className="relative ml-1 min-w-[104px] pr-2 text-left leading-tight" onMouseEnter={() => setShowTip(true)} onMouseLeave={() => setShowTip(false)}>
        <div className="font-display text-sm font-semibold tabular-nums text-white">{valid ? fmtDate.format(date) : '—'}</div>
        <div className="text-[11px] text-slate-400">{sim.playing ? SPEEDS[sim.speedIndex].label : 'Paused'}</div>
        {showTip && (
          <div className="absolute bottom-full right-0 mb-2 w-64 rounded-xl glass p-3 text-xs leading-relaxed text-slate-300 anim-in">
            Planet positions are calculated from NASA/JPL orbital elements for the date shown. Speed shows how much simulated time passes each real second.
          </div>
        )}
      </div>
    </div>
  );
}
