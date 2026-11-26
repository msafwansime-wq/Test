import { SUN, PLANETS, DWARF_PLANETS, BELTS, EARTH_RADIUS_KM } from '../data/planets.js';
import { MOONS } from '../data/moons.js';

export const ALL_OBJECTS = [SUN, ...PLANETS, ...DWARF_PLANETS, ...MOONS, ...BELTS];
export const BY_ID = Object.fromEntries(ALL_OBJECTS.map((o) => [o.id, o]));
export const getObject = (id) => BY_ID[id] || null;

export const KIND_LABEL = { star: 'Star', planet: 'Planet', dwarf: 'Dwarf planet', moon: 'Moon', belt: 'Region' };

// ---------- Formatting helpers ----------
const nf = (d = 0) => new Intl.NumberFormat('en-US', { maximumFractionDigits: d });
export const fmt = (n, d = 0) => (n == null ? '—' : nf(d).format(n));

export function fmtMass(kg) {
  const exp = Math.floor(Math.log10(kg));
  const mant = kg / 10 ** exp;
  const sup = String(exp).split('').map((c) => '⁰¹²³⁴⁵⁶⁷⁸⁹'[+c] || c).join('');
  return `${mant.toFixed(2)} × 10${sup} kg`;
}
export const massEarths = (kg) => kg / 5.972e24;

export function fmtEarthRatio(r) {
  if (r >= 100) return fmt(r, 0);
  if (r >= 10) return fmt(r, 1);
  if (r >= 0.01) return fmt(r, 2);
  if (r >= 0.00001) return String(Number(r.toPrecision(2)));
  return r.toExponential(1);
}

export function fmtDuration(hours) {
  if (hours == null) return '—';
  const h = Math.abs(hours);
  const retro = hours < 0 ? ' (retrograde)' : '';
  if (h < 48) {
    const hh = Math.floor(h), mm = Math.round((h - hh) * 60);
    return `${hh} h ${mm} min${retro}`;
  }
  const d = h / 24;
  if (d < 1000) return `${fmt(d, 1)} Earth days${retro}`;
  return `${fmt(d / 365.25, 1)} Earth years${retro}`;
}
export function fmtPeriodDays(days) {
  if (days == null) return '—';
  const d = Math.abs(days);
  const retro = days < 0 ? ' (retrograde)' : '';
  if (d < 2) return `${fmt(d * 24, 1)} hours${retro}`;
  if (d < 800) return `${fmt(d, 1)} Earth days${retro}`;
  return `${fmt(d / 365.25, 1)} Earth years${retro}`;
}
export function fmtDistanceKm(km) {
  if (km >= 1e9) return `${fmt(km / 1e9, 2)} billion km`;
  if (km >= 1e6) return `${fmt(km / 1e6, 1)} million km`;
  return `${fmt(km)} km`;
}
export const fmtTemp = (c) => (c == null ? '—' : `${c > 0 ? '' : ''}${fmt(c)} °C`);
export const earthRadii = (km) => km / EARTH_RADIUS_KM;

export function positionLabel(o) {
  if (o.kind === 'planet') return `${ordinal(o.order)} planet from the Sun`;
  if (o.kind === 'dwarf') return o.id === 'ceres' ? 'In the asteroid belt' : 'Beyond Neptune';
  if (o.kind === 'moon') return `Moon of ${getObject(o.parent)?.name}`;
  if (o.kind === 'star') return 'Centre of the solar system';
  return '';
}
export function ordinal(n) {
  return ['', '1st', '2nd', '3rd', '4th', '5th', '6th', '7th', '8th'][n] || `${n}th`;
}

// ---------- Search ----------
export function searchObjects(query) {
  const q = query.trim().toLowerCase();
  if (!q) return ALL_OBJECTS;
  return ALL_OBJECTS.map((o) => {
    const name = o.name.toLowerCase().replace(/^the /, '');
    let score = 0;
    if (name === q) score = 100;
    else if (name.startsWith(q)) score = 80;
    else if (name.includes(q)) score = 60;
    else if ((o.type || '').toLowerCase().includes(q)) score = 40;
    else if (o.parent && getObject(o.parent).name.toLowerCase().includes(q)) score = 35;
    else if ((KIND_LABEL[o.kind] || '').toLowerCase().includes(q)) score = 30;
    else if (q.length > 2 && (o.tagline || '').toLowerCase().includes(q)) score = 20;
    else if (q.includes('ocean') && o.ocean) score = 25;
    return { o, score };
  })
    .filter((r) => r.score > 0)
    .sort((a, b) => b.score - a.score)
    .map((r) => r.o);
}
