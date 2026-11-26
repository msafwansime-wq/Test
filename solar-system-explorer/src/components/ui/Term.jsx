import { useEffect, useRef, useState } from 'react';
import { GLOSSARY } from '../../data/learn.js';

// Inline glossary term with an accessible tooltip (hover on desktop, tap on touch).
export default function Term({ k, children }) {
  const def = GLOSSARY[k];
  const [open, setOpen] = useState(false);
  const ref = useRef();
  useEffect(() => {
    if (!open) return;
    const close = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('pointerdown', close);
    return () => document.removeEventListener('pointerdown', close);
  }, [open]);
  if (!def) return children;
  return (
    <span ref={ref} className="relative inline-block" onMouseEnter={() => setOpen(true)} onMouseLeave={() => setOpen(false)}>
      <button type="button" className="term text-left" aria-expanded={open} onClick={() => setOpen((o) => !o)}>
        {children || k}
      </button>
      {open && (
        <span role="tooltip" className="absolute left-0 top-full z-50 mt-1.5 w-60 rounded-xl glass p-3 text-xs font-normal normal-case leading-relaxed tracking-normal text-slate-200 anim-in">
          <span className="mb-1 block font-semibold capitalize text-sky-300">{k}</span>
          {def}
        </span>
      )}
    </span>
  );
}
