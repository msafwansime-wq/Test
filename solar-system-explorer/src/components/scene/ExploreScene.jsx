import { useEffect, useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Line, OrbitControls } from '@react-three/drei';
import Label3D from './Label3D.jsx';
import { MOONS_BY_PARENT } from '../../data/moons.js';
import { getObject } from '../../lib/catalog.js';
import { app, useApp, selectObject } from '../../lib/store.js';
import { Body, Sun } from './Body.jsx';
import { Starfield } from './Starfield.jsx';

export const EXPLORE_RADIUS = 2.5;
// Time-lapse options for the explore view: simulated hours per real second.
export const TIMELAPSES = [
  { label: '1 s = 10 min', hours: 1 / 6 },
  { label: '1 s = 1 hour', hours: 1 },
  { label: '1 s = 6 hours', hours: 6 },
  { label: '1 s = 1 day', hours: 24 },
];
export const exploreState = { timelapse: 1, paused: false };

const isClick = (e) => e.delta === undefined || e.delta < 6;

function spinFor(body) {
  if (exploreState.paused || !body.rotationHours) return 0;
  const hoursPerSec = TIMELAPSES[exploreState.timelapse].hours;
  return ((Math.PI * 2) / body.rotationHours) * hoursPerSec;
}

// Moon orbit distances in this view are log-compressed so every moon fits on screen.
export function exploreMoonDistance(parent, moon) {
  const ratio = moon.orbitDistanceKm / parent.radiusKm;
  const minR = parent.rings ? parent.rings.outer * 0.85 : 1.3;
  return EXPLORE_RADIUS * Math.max(1 + 2.2 * Math.log10(ratio), minR + 0.4);
}

function ExploreMoon({ parent, moon, index, showLabel }) {
  const ref = useRef();
  const angle = useRef(index * 1.7 + 0.6);
  const d = exploreMoonDistance(parent, moon);
  const r = Math.max(EXPLORE_RADIUS * (moon.radiusKm / parent.radiusKm), 0.07);
  const incl = (index % 2 ? 1 : -1) * 0.04 * index;
  const orbit = useMemo(() => {
    const pts = [];
    for (let i = 0; i <= 128; i++) { const a = (i / 128) * Math.PI * 2; pts.push([Math.cos(a) * d, Math.sin(a) * d * incl, -Math.sin(a) * d]); }
    return pts;
  }, [d, incl]);
  useFrame((_, dt) => {
    if (!exploreState.paused) {
      const hoursPerSec = TIMELAPSES[exploreState.timelapse].hours;
      angle.current += ((Math.PI * 2) / (moon.orbitalPeriodDays * 24)) * hoursPerSec * Math.min(dt, 0.1);
    }
    if (ref.current) ref.current.position.set(Math.cos(angle.current) * d, Math.sin(angle.current) * d * incl, -Math.sin(angle.current) * d);
  });
  return (
    <group>
      <Line points={orbit} color={moon.color} transparent opacity={0.3} lineWidth={1} />
      <group ref={ref}>
        <Body
          body={moon}
          radius={r}
          segments={32}
          sun={[-60, 10, 40]}
          getSpin={() => 0}
          hitRadius={Math.max(r * 2, 0.35)}
          onClick={(e) => { if (!isClick(e)) return; e.stopPropagation(); app.set({ exploreId: moon.id }); selectObject(moon.id, { focus: false }); }}
          onOver={() => (document.body.style.cursor = 'pointer')}
          onOut={() => (document.body.style.cursor = '')}
        />
        {showLabel && (
          <Label3D position={[0, r + 0.35, 0]} small text={moon.name.replace('The ', '')} color={moon.color} onClick={() => { app.set({ exploreId: moon.id }); selectObject(moon.id, { focus: false }); }} />
        )}
      </group>
    </group>
  );
}

function CameraIntro({ id, moonReach, isSun }) {
  const camera = useThree((s) => s.camera);
  const controls = useThree((s) => s.controls);
  const t0 = useRef(0);
  const goal = isSun ? 16 : moonReach ? Math.max(12, moonReach * 1.45 + 2) : 10.5;
  useEffect(() => { t0.current = performance.now(); }, [id]);
  useFrame(() => {
    const p = Math.min((performance.now() - t0.current) / 1600, 1);
    if (p >= 1 || !controls) return;
    const e = 1 - Math.pow(1 - p, 3);
    const dist = goal * 2.2 + (goal - goal * 2.2) * e;
    const dir = camera.position.clone().sub(controls.target).normalize();
    if (p < 0.02) dir.set(0.35, 0.25, 1).normalize();
    camera.position.copy(dir.multiplyScalar(dist));
    controls.target.set(0, 0, 0);
  });
  return null;
}

export default function ExploreScene() {
  const { exploreId, showLabels, exploreAxis, exploreMoons } = useApp();
  const body = getObject(exploreId) || getObject('earth');
  const isSun = body.kind === 'star';
  const moons = body.kind === 'moon' ? [] : MOONS_BY_PARENT[body.id] || [];
  const sunPos = [-60, 10, 40];
  return (
    <>
      <Starfield />
      <ambientLight intensity={isSun ? 0.5 : 0.07} />
      {!isSun && <directionalLight position={sunPos} intensity={3} color="#fff4e6" />}
      {isSun ? (
        <Sun radius={EXPLORE_RADIUS * 1.6} light={false} />
      ) : (
        <group key={body.id}>
          <Body body={body} radius={EXPLORE_RADIUS} segments={96} getSpin={spinFor} sun={sunPos} showAxis={exploreAxis} />
          {exploreMoons && moons.map((m, i) => <ExploreMoon key={m.id} parent={body} moon={m} index={i} showLabel={showLabels} />)}
        </group>
      )}
      <OrbitControls makeDefault enableDamping dampingFactor={0.08} minDistance={EXPLORE_RADIUS * 1.25} maxDistance={80} enablePan={false} rotateSpeed={0.6} />
      <CameraIntro id={body.id} moonReach={moons.length ? Math.max(...moons.map((m) => exploreMoonDistance(body, m))) : 0} isSun={isSun} />
    </>
  );
}
