import { useState } from 'react';
import { X, ChevronDown, Lightbulb, Trophy, CheckCircle2, XCircle, RotateCcw, ArrowRight, Telescope } from 'lucide-react';
import { DID_YOU_KNOW, QUIZ } from '../../data/learn.js';
import { app, useApp } from '../../lib/store.js';
import { getObject } from '../../lib/catalog.js';
import { goToObject } from '../ui/PlanetDock.jsx';

function DidYouKnow() {
  const [open, setOpen] = useState(0);
  return (
    <div className="space-y-2.5">
      <p className="text-sm text-slate-400">Big questions with simple answers. Tap a card to reveal it.</p>
      {DID_YOU_KNOW.map((d, i) => {
        const o = getObject(d.id);
        const isOpen = open === i;
        return (
          <div key={d.q} className="overflow-hidden rounded-2xl border border-white/[0.07] bg-white/[0.025]">
            <button className="flex w-full items-center gap-3 px-4 py-3.5 text-left" onClick={() => setOpen(isOpen ? -1 : i)} aria-expanded={isOpen}>
              <span className="orb h-7 w-7" style={{ '--c': o.color }} />
              <span className="flex-1 text-sm font-semibold text-white">{d.q}</span>
              <ChevronDown size={16} className={`text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </button>
            {isOpen && (
              <div className="anim-in px-4 pb-4">
                <div className="mb-1.5 font-display text-lg font-semibold" style={{ color: o.color }}>{d.a}</div>
                <p className="text-sm leading-relaxed text-slate-300">{d.body}</p>
                <button onClick={() => { app.set({ drawer: null }); goToObject(d.id); }} className="mt-3 flex items-center gap-1.5 text-xs font-semibold text-sky-300 hover:text-sky-200">
                  <Telescope size={13} /> Visit {o.name.replace('The ', '')}
                </button>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function Quiz() {
  const [i, setI] = useState(0);
  const [picked, setPicked] = useState(null);
  const [score, setScore] = useState(0);
  const [done, setDone] = useState(false);
  const q = QUIZ[i];
  const restart = () => { setI(0); setPicked(null); setScore(0); setDone(false); };
  if (done) {
    const pct = score / QUIZ.length;
    return (
      <div className="anim-in py-6 text-center">
        <Trophy size={44} className="mx-auto text-amber-300" />
        <div className="mt-3 font-display text-4xl font-bold text-white">{score} / {QUIZ.length}</div>
        <p className="mt-2 text-slate-300">
          {pct === 1 ? 'Perfect score — you\'re a true space explorer! 🚀' : pct >= 0.7 ? 'Brilliant! You really know your solar system.' : pct >= 0.4 ? 'Good effort! Explore the planets and try again.' : 'Every astronaut starts somewhere — explore and try again!'}
        </p>
        <button onClick={restart} className="mx-auto mt-5 flex items-center gap-2 rounded-xl bg-sky-300/15 px-4 py-2 text-sm font-semibold text-sky-100 shadow-[inset_0_0_0_1px_rgba(125,211,252,0.35)] hover:bg-sky-300/25">
          <RotateCcw size={15} /> Play again
        </button>
      </div>
    );
  }
  return (
    <div key={i} className="anim-in">
      <div className="mb-3 flex items-center justify-between text-xs text-slate-400">
        <span>Question {i + 1} of {QUIZ.length}</span>
        <span className="font-semibold text-amber-200">Score: {score}</span>
      </div>
      <div className="mb-4 h-1.5 overflow-hidden rounded-full bg-white/5">
        <div className="h-full rounded-full bg-gradient-to-r from-sky-400 to-violet-400 transition-all duration-500" style={{ width: `${((i + (picked !== null ? 1 : 0)) / QUIZ.length) * 100}%` }} />
      </div>
      <h3 className="mb-4 font-display text-lg font-semibold leading-snug text-white">{q.q}</h3>
      <div className="space-y-2">
        {q.options.map((opt, k) => {
          const isRight = k === q.answer, isPicked = k === picked;
          let cls = 'border-white/10 bg-white/[0.03] hover:bg-white/[0.07]';
          if (picked !== null) cls = isRight ? 'border-emerald-400/50 bg-emerald-400/10' : isPicked ? 'border-rose-400/50 bg-rose-400/10' : 'border-white/5 bg-white/[0.02] opacity-60';
          return (
            <button
              key={opt}
              disabled={picked !== null}
              onClick={() => { setPicked(k); if (isRight) setScore((s) => s + 1); }}
              className={`flex w-full items-center gap-3 rounded-xl border px-4 py-3 text-left text-sm font-medium text-slate-100 transition ${cls}`}
            >
              <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-white/10 text-xs">{String.fromCharCode(65 + k)}</span>
              <span className="flex-1">{opt}</span>
              {picked !== null && isRight && <CheckCircle2 size={18} className="text-emerald-400" />}
              {picked !== null && isPicked && !isRight && <XCircle size={18} className="text-rose-400" />}
            </button>
          );
        })}
      </div>
      {picked !== null && (
        <div className="anim-in mt-4 rounded-2xl border border-white/10 bg-white/[0.04] p-4">
          <div className={`mb-1 font-semibold ${picked === q.answer ? 'text-emerald-300' : 'text-rose-300'}`}>{picked === q.answer ? 'Correct!' : `Not quite — the answer is ${q.options[q.answer]}.`}</div>
          <p className="text-sm leading-relaxed text-slate-300">{q.explain}</p>
          <button
            onClick={() => { if (i + 1 >= QUIZ.length) setDone(true); else { setI(i + 1); setPicked(null); } }}
            className="mt-3 flex items-center gap-2 rounded-xl bg-sky-300/15 px-4 py-2 text-sm font-semibold text-sky-100 shadow-[inset_0_0_0_1px_rgba(125,211,252,0.35)] hover:bg-sky-300/25"
          >
            {i + 1 >= QUIZ.length ? 'See my score' : 'Next question'} <ArrowRight size={15} />
          </button>
        </div>
      )}
    </div>
  );
}

export default function LearnDrawer() {
  const { learnTab = 'dyk' } = useApp();
  return (
    <aside className="glass pointer-events-auto flex max-h-full w-full flex-col overflow-hidden rounded-3xl anim-side sm:w-[440px]" aria-label="Learn">
      <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
        <div className="flex rounded-xl bg-white/5 p-1">
          {[{ id: 'dyk', label: 'Did You Know?', icon: Lightbulb }, { id: 'quiz', label: 'Quiz', icon: Trophy }].map((t) => (
            <button key={t.id} onClick={() => app.set({ learnTab: t.id })} aria-pressed={learnTab === t.id} className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition ${learnTab === t.id ? 'bg-white/10 text-white' : 'text-slate-400 hover:text-white'}`}>
              <t.icon size={14} /> {t.label}
            </button>
          ))}
        </div>
        <button className="btn-icon" onClick={() => app.set({ drawer: null })} aria-label="Close"><X size={18} /></button>
      </div>
      <div className="scrollbar-thin flex-1 overflow-y-auto px-5 py-4">
        {learnTab === 'dyk' ? <DidYouKnow /> : <Quiz />}
      </div>
    </aside>
  );
}
