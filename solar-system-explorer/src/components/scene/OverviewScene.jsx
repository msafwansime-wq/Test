import { useEffect, useMemo, useRef, useState } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Line, OrbitControls, Billboard } from '@react-three/drei';
import Label3D from './Label3D.jsx';
import * as THREE from 'three';
import { ORBITING_BODIES, BELTS } from '../../data/planets.js';
import { MOONS_BY_PARENT } from '../../data/moons.js';
import { app, sim, useApp, selectObject, notifySim } from '../../lib/store.js';
import {
  bodyScenePosition, displayRadius, sunDisplayRadius, orbitPathAU, scalePosition, DIST_SCALES, moonOverviewDistance,
} from '../../lib/orbits.js';
import { Body, Sun } from './Body.jsx';
import { Starfield } from './Starfield.jsx';

const MAX_SPIN = Math.PI * 2 * 0.35; // cap visual rotation at 0.35 turns per second
const isClick = (e) => e.delta === undefined || e.delta < 6;

// Rotation is real (sidereal period) scaled by the simulation speed, but capped
// so fast spinners don't strobe at high time-lapse speeds.
function overviewSpin(body) {
  if (!sim.playing || !body.rotationHours) return 0;
  const realRate = ((Math.PI * 2) / (body.rotationHours / 24)) * sim.rate; // rad per real second
  return Math.sign(realRate) * Math.min(Math.abs(realRate), MAX_SPIN);
}

function SimDriver() {
  const acc = useRef(0);
  useFrame((_, dt) => {
    const d = Math.min(dt, 0.1);
    if (sim.playing) sim.days += sim.rate * d;
    acc.current += d;
    if (acc.current > 0.1) { acc.current = 0; notifySim(); }
  });
  return null;
}

function OrbitPath({ body, distMode, highlighted }) {
  const points = useMemo(() => orbitPathAU(body.elements, 256).map((p) => scalePosition(p, distMode)), [body, distMode]);
  return (
    <Line
      points={points}
      color={body.color}
      lineWidth={highlighted ? 1.8 : 1}
      transparent
      opacity={highlighted ? 0.9 : body.kind === 'dwarf' ? 0.22 : 0.38}
      dashed={body.kind === 'dwarf'}
      dashSize={1.2}
      gapSize={0.8}
    />
  );
}

function Label(props) {
  return <Label3D {...props} />;
}

function SelectionRing({ radius, color }) {
  const ref = useRef();
  useFrame((s) => {
    if (ref.current) ref.current.material.opacity = 0.4 + Math.sin(s.clock.elapsedTime * 3) * 0.2;
  });
  return (
    <Billboard>
      <mesh ref={ref} raycast={() => null}>
        <ringGeometry args={[radius * 1.6, radius * 1.6 + Math.max(radius * 0.025, 0.04), 96]} />
        <meshBasicMaterial color={color} transparent opacity={0.7} depthWrite={false} />
      </mesh>
    </Billboard>
  );
}

function MoonSystem({ parent, parentR, sizeMode, showLabels }) {
  const moons = MOONS_BY_PARENT[parent.id] || [];
  const refs = useRef([]);
  const angles = useRef(moons.map((_, i) => i * 2.1));
  useFrame((_, dt) => {
    const d = Math.min(dt, 0.1);
    moons.forEach((m, i) => {
      if (sim.playing) {
        const real = ((Math.PI * 2) / m.orbitalPeriodDays) * sim.rate;
        angles.current[i] += Math.sign(real) * Math.min(Math.abs(real), Math.PI * 2 * 0.25) * d;
      }
      const g = refs.current[i];
      if (g) {
        const r = moonOverviewDistance(parentR, i, sizeMode);
        g.position.set(Math.cos(angles.current[i]) * r, 0, -Math.sin(angles.current[i]) * r);
      }
    });
  });
  return moons.map((m, i) => {
    const r = Math.min(displayRadius(m.radiusKm, sizeMode) * (sizeMode === 'true' ? 1 : 0.75), parentR * 0.5);
    return (
      <group key={m.id} ref={(el) => (refs.current[i] = el)}>
        <Body
          body={m}
          radius={Math.max(r, 0.05)}
          segments={20}
          getSpin={() => 0}
          hitRadius={Math.max(r * 2, 0.25)}
          onClick={(e) => { if (!isClick(e)) return; e.stopPropagation(); selectObject(m.id, { focus: false }); }}
          onOver={() => (document.body.style.cursor = 'pointer')}
          onOut={() => (document.body.style.cursor = '')}
        />
        {showLabels && <Label small text={m.name.replace('The ', '')} color={m.color} onClick={() => selectObject(m.id, { focus: false })} />}
      </group>
    );
  });
}

function OrbitingBody({ body, distMode, sizeMode, showLabels, showMoons, selected }) {
  const ref = useRef();
  const r = displayRadius(body.radiusKm, sizeMode);
  const pos = useRef(new THREE.Vector3());
  useFrame(() => {
    const p = bodyScenePosition(body, sim.days, distMode);
    pos.current.set(...p);
    if (ref.current) ref.current.position.copy(pos.current);
  });
  const [sunVec] = useState(() => [0, 0, 0]);
  const minHit = distMode === 'true' ? 1.4 : 0.9;
  return (
    <group ref={ref}>
      <Body
        body={body}
        radius={r}
        getSpin={overviewSpin}
        sun={sunVec}
        hitRadius={Math.max(r * 1.35, minHit)}
        onClick={(e) => { if (!isClick(e)) return; e.stopPropagation(); selectObject(body.id); }}
        onOver={() => (document.body.style.cursor = 'pointer')}
        onOut={() => (document.body.style.cursor = '')}
      />
      {selected && <SelectionRing radius={r * (body.rings ? 1.5 : 1)} color={body.color} />}
      {showMoons && <MoonSystem parent={body} parentR={r} sizeMode={sizeMode} showLabels={showLabels && selected} />}
      {showLabels && (
        <group position={[0, r * (body.rings ? 1.2 : 1) + 0.6, 0]}>
          <Label text={body.name} color={body.color} active={selected} onClick={() => selectObject(body.id)} />
        </group>
      )}
    </group>
  );
}

// Belts are rendered as GPU-animated point clouds. Each particle has its own
// Keplerian angular speed (∝ a^-1.5) computed in the vertex shader.
const beltVert = /* glsl */ `
  attribute float aR; attribute float aA; attribute float aN; attribute float aY; attribute float aS;
  uniform float uDays; uniform float uPx;
  varying float vS;
  void main(){
    float ang = aA + aN * uDays;
    vec3 p = vec3(cos(ang) * aR, aY, -sin(ang) * aR);
    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    gl_Position = projectionMatrix * mv;
    gl_PointSize = clamp(aS * uPx / -mv.z, 1.0, 4.0);
    vS = aS;
  }`;
const beltFrag = /* glsl */ `
  uniform vec3 uColor; varying float vS;
  void main(){
    vec2 c = gl_PointCoord - 0.5;
    float d = length(c);
    if (d > 0.5) discard;
    gl_FragColor = vec4(uColor * (0.7 + vS * 0.2), (1.0 - d * 2.0) * 0.85);
  }`;

function Belt({ belt, distMode, count, onClick, showLabel }) {
  const matRef = useRef();
  const geo = useMemo(() => {
    const g = new THREE.BufferGeometry();
    const aR = new Float32Array(count), aA = new Float32Array(count), aN = new Float32Array(count), aY = new Float32Array(count), aS = new Float32Array(count);
    const fn = DIST_SCALES[distMode].fn;
    let seed = belt.id.length * 977;
    const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
    for (let i = 0; i < count; i++) {
      // bias towards the centre of the belt
      const t = (rnd() + rnd() + rnd()) / 3;
      const au = belt.innerAu + (belt.outerAu - belt.innerAu) * t;
      aR[i] = fn(au);
      aA[i] = rnd() * Math.PI * 2;
      aN[i] = (Math.PI * 2) / (365.25 * Math.pow(au, 1.5)); // rad/day (Kepler's 3rd law)
      const incl = (belt.id === 'kuiper-belt' ? 0.18 : 0.12) * (rnd() - 0.5) * 2;
      aY[i] = Math.sin(incl) * aR[i] * (rnd() * 0.8 + 0.2);
      aS[i] = rnd() * 2.5 + 0.5;
    }
    g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(count * 3), 3));
    g.setAttribute('aR', new THREE.BufferAttribute(aR, 1));
    g.setAttribute('aA', new THREE.BufferAttribute(aA, 1));
    g.setAttribute('aN', new THREE.BufferAttribute(aN, 1));
    g.setAttribute('aY', new THREE.BufferAttribute(aY, 1));
    g.setAttribute('aS', new THREE.BufferAttribute(aS, 1));
    g.boundingSphere = new THREE.Sphere(new THREE.Vector3(), fn(belt.outerAu) * 1.1);
    return g;
  }, [belt, distMode, count]);
  const uniforms = useMemo(() => ({ uDays: { value: 0 }, uPx: { value: 300 }, uColor: { value: new THREE.Color(belt.color) } }), [belt]);
  const size = useThree((s) => s.size);
  useFrame(() => {
    uniforms.uDays.value = sim.days;
    uniforms.uPx.value = size.height * 0.6;
  });
  const fn = DIST_SCALES[distMode].fn;
  const mid = fn((belt.innerAu + belt.outerAu) / 2);
  return (
    <group>
      <points geometry={geo} raycast={() => null}>
        <shaderMaterial ref={matRef} vertexShader={beltVert} fragmentShader={beltFrag} uniforms={uniforms} transparent depthWrite={false} blending={THREE.AdditiveBlending} />
      </points>
      {showLabel && (
        <group position={[mid * Math.cos(3.6), 0, -mid * Math.sin(3.6)]}>
          <Label small text={belt.name} color={belt.color} onClick={onClick} />
        </group>
      )}
    </group>
  );
}

// ---------- Camera: smooth fly-to, follow focused body, zoom & reset ----------
const DEFAULT_VIEW = { compressed: [0, 70, 150], true: [0, 520, 1150] };

function CameraRig({ distMode, sizeMode }) {
  const controls = useThree((s) => s.controls);
  const camera = useThree((s) => s.camera);
  const { focusId, cameraCommand } = useApp();
  const flight = useRef(null);
  const lastTarget = useRef(new THREE.Vector3());
  const prevFocus = useRef(undefined);
  const prevCmd = useRef(null);
  const prevMode = useRef(distMode);

  const focusInfo = (id) => {
    if (!id || id === 'sun') return { pos: () => new THREE.Vector3(), dist: id === 'sun' ? sunDisplayRadius(distMode) * 6 : null };
    const belt = BELTS.find((b) => b.id === id);
    if (belt) return { pos: () => new THREE.Vector3(), dist: DIST_SCALES[distMode].fn(belt.outerAu) * 2.1, belt: true };
    const body = ORBITING_BODIES.find((b) => b.id === id);
    if (!body) return null;
    const r = displayRadius(body.radiusKm, sizeMode);
    const moons = (MOONS_BY_PARENT[id] || []).length;
    return {
      pos: () => new THREE.Vector3(...bodyScenePosition(body, sim.days, distMode)),
      dist: Math.max(r * (body.rings ? 7 : 6) + moons * 0.6, 2.2),
    };
  };

  const size = useThree((st) => st.size);
  const startFlight = (toDist, dirOverride, targetId) => {
    if (!controls) return;
    if (toDist && targetId) {
      const inset = app.get().uiInset || { bottom: 0 };
      const aspect = size.width / Math.max(size.height - inset.bottom, 200);
      if (aspect < 1.2) toDist *= Math.pow(1.2 / aspect, 0.85);
    }
    const fromTarget = controls.target.clone();
    const offset = camera.position.clone().sub(fromTarget);
    const fromDist = offset.length();
    let dir = dirOverride ? new THREE.Vector3(...dirOverride).normalize() : offset.normalize();
    // keep a pleasant elevation
    if (!dirOverride && dir.y < 0.25) { dir.y = 0.25; dir.normalize(); }
    flight.current = { fromTarget, fromDist, toDist: toDist ?? fromDist, dir, fromDir: offset.clone().normalize(), t0: performance.now(), dur: 1400, targetId };
  };

  useEffect(() => {
    if (!controls) return;
    const cancel = () => { if (flight.current && flight.current.cancelable) flight.current = null; };
    controls.addEventListener('start', cancel);
    return () => controls.removeEventListener('start', cancel);
  }, [controls]);

  useFrame(() => {
    if (!controls) return;
    // distance-scale change → reset view
    if (prevMode.current !== distMode) {
      prevMode.current = distMode;
      startFlight(null, null, focusId);
      const d = DEFAULT_VIEW[distMode];
      if (!focusId) { flight.current.toDist = Math.hypot(...d); flight.current.dir = new THREE.Vector3(...d).normalize(); }
      else flight.current.toDist = focusInfo(focusId)?.dist ?? flight.current.toDist;
    }
    if (focusId !== prevFocus.current) {
      const first = prevFocus.current === undefined;
      prevFocus.current = focusId;
      if (first && !focusId) {
        camera.position.set(...DEFAULT_VIEW[distMode]);
        controls.target.set(0, 0, 0);
      } else {
        const info = focusInfo(focusId);
        if (info) startFlight(info.dist ?? Math.hypot(...DEFAULT_VIEW[distMode]), focusId ? (info.belt ? [0, 1, 0.9] : null) : DEFAULT_VIEW[distMode], focusId);
      }
    }
    if (cameraCommand && cameraCommand !== prevCmd.current) {
      prevCmd.current = cameraCommand;
      const cur = camera.position.distanceTo(controls.target);
      if (cameraCommand.type === 'zoomIn') { startFlight(Math.max(cur * 0.6, controls.minDistance)); flight.current.dur = 500; flight.current.cancelable = true; }
      if (cameraCommand.type === 'zoomOut') { startFlight(Math.min(cur * 1.6, controls.maxDistance)); flight.current.dur = 500; flight.current.cancelable = true; }
      if (cameraCommand.type === 'reset') {
        if (app.get().focusId) app.set({ focusId: null });
        else startFlight(Math.hypot(...DEFAULT_VIEW[distMode]), DEFAULT_VIEW[distMode], null);
      }
    }

    const info = focusInfo(focusId);
    const target = info ? info.pos() : new THREE.Vector3();
    const f = flight.current;
    if (f) {
      const p = Math.min((performance.now() - f.t0) / f.dur, 1);
      const e = p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2;
      const t = f.fromTarget.clone().lerp(target, e);
      const dir = f.fromDir.clone().lerp(f.dir, e).normalize();
      const dist = THREE.MathUtils.lerp(f.fromDist, f.toDist, e);
      controls.target.copy(t);
      camera.position.copy(t).addScaledVector(dir, dist);
      if (p >= 1) flight.current = null;
    } else if (focusId && focusId !== 'sun' && !info?.belt) {
      const delta = target.clone().sub(lastTarget.current);
      camera.position.add(delta);
      controls.target.copy(target);
    }
    lastTarget.current.copy(controls.target);
    const focused = ORBITING_BODIES.find((b) => b.id === focusId);
    controls.minDistance = focused ? displayRadius(focused.radiusKm, sizeMode) * 1.6 : 1;
  });
  return null;
}

export default function OverviewScene() {
  const { distMode, sizeMode, showLabels, showOrbits, showMoons, showBelts, selectedId } = useApp();
  const sunR = sunDisplayRadius(distMode);
  return (
    <>
      <SimDriver />
      <ambientLight intensity={0.09} />
      <Starfield />
      <Sun
        radius={sunR}
        onClick={(e) => { if (!isClick(e)) return; e.stopPropagation(); selectObject('sun'); }}
        onOver={() => (document.body.style.cursor = 'pointer')}
        onOut={() => (document.body.style.cursor = '')}
      />
      {showLabels && (
        <group position={[0, sunR + 1.2, 0]}>
          <Label text="Sun" color="#ffb340" active={selectedId === 'sun'} onClick={() => selectObject('sun')} />
        </group>
      )}
      {showOrbits && ORBITING_BODIES.map((b) => <OrbitPath key={b.id + distMode} body={b} distMode={distMode} highlighted={selectedId === b.id} />)}
      {ORBITING_BODIES.map((b) => (
        <OrbitingBody key={b.id} body={b} distMode={distMode} sizeMode={sizeMode} showLabels={showLabels} showMoons={showMoons} selected={selectedId === b.id} />
      ))}
      {showBelts && BELTS.map((b) => (
        <Belt key={b.id + distMode} belt={b} distMode={distMode} count={b.id === 'kuiper-belt' ? 5000 : 3500} onClick={() => selectObject(b.id)} showLabel={showLabels} />
      ))}
      <OrbitControls makeDefault enableDamping dampingFactor={0.08} maxDistance={distMode === 'true' ? 4500 : 1200} zoomSpeed={0.9} rotateSpeed={0.6} />
      <CameraRig distMode={distMode} sizeMode={sizeMode} />
    </>
  );
}
