import { useEffect, useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import Label3D from './Label3D.jsx';
import * as THREE from 'three';
import { PLANETS, SUN, EARTH_RADIUS_KM } from '../../data/planets.js';
import { app, useApp } from '../../lib/store.js';
import { fmt } from '../../lib/catalog.js';
import { Body, Sun } from './Body.jsx';
import { Starfield } from './Starfield.jsx';

// All planets drawn at TRUE relative size: 1 Earth radius = 0.5 units.
export const UNIT = 0.5;
const GAP = 0.9;
const DEG = Math.PI / 180;

export function compareLayout() {
  let x = 0;
  const items = PLANETS.map((p) => {
    const r = (p.radiusKm / EARTH_RADIUS_KM) * UNIT;
    const half = p.rings && p.id === 'saturn' ? r * p.rings.outer * Math.cos(p.tilt * DEG) : r;
    x += half;
    const item = { body: p, r, x, half };
    x += half + GAP;
    return item;
  });
  const width = x - GAP;
  items.forEach((it) => (it.x -= width / 2));
  return { items, width, left: -width / 2 };
}

export function pickComparePlanet(id) {
  const { compareA, compareB, lastPicked } = app.get();
  if (id === compareA || id === compareB) return;
  if (lastPicked === 'B') app.set({ compareA: id, lastPicked: 'A' });
  else app.set({ compareB: id, lastPicked: 'B' });
}

const spin = (b) => (b.rotationHours ? ((Math.PI * 2) / b.rotationHours) * 1.2 : 0); // 1 s = 1.2 h

function Framer({ layout, frame, a, b, inset }) {
  const camera = useThree((s) => s.camera);
  const controls = useThree((s) => s.controls);
  const size = useThree((s) => s.size);
  const anim = useRef(null);
  useEffect(() => {
    if (!controls) return;
    let cx = 0, w = layout.width, h = 12;
    if (frame === 'pair') {
      const ia = layout.items.find((i) => i.body.id === a), ib = layout.items.find((i) => i.body.id === b);
      const l = Math.min(ia.x - ia.half, ib.x - ib.half), r = Math.max(ia.x + ia.half, ib.x + ib.half);
      cx = (l + r) / 2; w = r - l + 2; h = Math.max(ia.r, ib.r) * 2.6 + 1;
    }
    const fov = (camera.fov * Math.PI) / 180;
    const visW = Math.max(size.width - (inset?.right || 0), 200), visH = Math.max(size.height - (inset?.bottom || 0) - 160, 200);
    const aspect = visW / visH;
    const hFrac = visH / size.height;
    const distW = (w / 2) / (Math.tan(fov / 2) * hFrac * aspect) * 1.1;
    const distH = (h / 2) / (Math.tan(fov / 2) * hFrac);
    const dist = Math.max(distW, distH, 4);
    anim.current = { fromT: controls.target.clone(), fromP: camera.position.clone(), toT: new THREE.Vector3(cx, 0, 0), toP: new THREE.Vector3(cx, dist * 0.12, dist), t0: performance.now() };
  }, [frame, a, b, layout, controls, camera, size.width, size.height, inset?.right, inset?.bottom]);
  useFrame(() => {
    const an = anim.current;
    if (!an || !controls) return;
    const p = Math.min((performance.now() - an.t0) / 1100, 1);
    const e = 1 - Math.pow(1 - p, 3);
    controls.target.lerpVectors(an.fromT, an.toT, e);
    camera.position.lerpVectors(an.fromP, an.toP, e);
    if (p >= 1) anim.current = null;
  });
  return null;
}

export default function CompareScene() {
  const { compareA, compareB, compareFrame, showLabels, uiInset } = useApp();
  const compact = useThree((st) => st.size.width) < 640;
  const layout = useMemo(() => compareLayout(), []);
  const sunR = (SUN.radiusKm / EARTH_RADIUS_KM) * UNIT;
  const sunX = layout.left - sunR - 2.2;
  const lightPos = [sunX, 0, 0];
  return (
    <>
      <Starfield />
      <ambientLight intensity={0.22} />
      <directionalLight position={[-80, 25, 60]} intensity={2.6} color="#fff4e6" />
      <group position={[sunX, 0, 0]}>
        <Sun radius={sunR} light={false} glow={0.06} />
      </group>
      {showLabels && !compact && <Label3D position={[layout.left - 1.6, -6.5, 0]} small text="Edge of the Sun (to scale)" color="#ffb340" />}
      {layout.items.map((it) => {
        const isA = it.body.id === compareA, isB = it.body.id === compareB;
        return (
          <group key={it.body.id} position={[it.x, 0, 0]}>
            <Body
              body={it.body}
              radius={it.r}
              segments={64}
              getSpin={spin}
              sun={lightPos}
              hitRadius={Math.max(it.r * 1.1, 0.5)}
              onClick={(e) => { if (e.delta > 6) return; e.stopPropagation(); pickComparePlanet(it.body.id); }}
              onOver={() => (document.body.style.cursor = 'pointer')}
              onOut={() => (document.body.style.cursor = '')}
            />
            {showLabels && (!compact || isA || isB) && (
              <Label3D
                position={[0, it.body.category === 'terrestrial' && !compact ? -1.25 - (it.body.order - 1) * 0.75 : -it.r - (it.body.rings ? 1.4 : 0.6), 0]}
                small
                active={isA || isB}
                badge={isA ? 'A' : isB ? 'B' : null}
                text={it.body.name}
                sub={`${fmt(it.body.diameterKm)} km`}
                color={it.body.color}
                onClick={() => pickComparePlanet(it.body.id)}
              />
            )}
          </group>
        );
      })}
      <OrbitControls makeDefault enableDamping dampingFactor={0.08} minDistance={2} maxDistance={140} minPolarAngle={Math.PI * 0.2} maxPolarAngle={Math.PI * 0.8} />
      <Framer layout={layout} frame={compareFrame} a={compareA} b={compareB} inset={uiInset} />
    </>
  );
}
