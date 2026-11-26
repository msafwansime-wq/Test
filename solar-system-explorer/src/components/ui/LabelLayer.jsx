import { useSyncExternalStore } from 'react';
import { subscribeLabels, getLabels, getLabelVersion, bindLabelElement } from '../../lib/labels.js';

export default function LabelLayer() {
  useSyncExternalStore(subscribeLabels, getLabelVersion);
  const entries = [...getLabels().entries()];
  return (
    <div className="pointer-events-none absolute inset-0 z-[5] overflow-hidden" aria-hidden="false">
      {entries.map(([key, l]) => (
        <button
          key={key}
          ref={(el) => bindLabelElement(key, el)}
          onClick={l.onClick}
          tabIndex={l.onClick ? 0 : -1}
          className={`label-pill absolute left-0 top-0 ${l.small ? 'label-small' : ''} ${l.active ? 'label-active' : ''} ${l.onClick ? 'pointer-events-auto' : ''}`}
          style={{ '--dot': l.color, display: 'none' }}
        >
          {l.badge ? <span className={`badge-ab ${l.badge.toLowerCase()}`}>{l.badge}</span> : <span className="label-dot" />}
          {l.text}
          {l.sub && <span className="ml-0.5 font-normal opacity-60">{l.sub}</span>}
        </button>
      ))}
    </div>
  );
}
