import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useBodyTexture, useOptionalTexture, glowTexture, thinRingTexture } from '../../lib/textures.js';

const DEG = Math.PI / 180;

// ---------- Atmosphere (sun-aware fresnel rim glow) ----------
const atmoVert = /* glsl */ `
  varying vec3 vN; varying vec3 vW;
  void main(){
    vec4 w = modelMatrix * vec4(position,1.0);
    vW = w.xyz;
    vN = normalize(mat3(modelMatrix) * normal);
    gl_Position = projectionMatrix * viewMatrix * w;
  }`;
const atmoFrag = /* glsl */ `
  uniform vec3 uColor; uniform vec3 uSun; uniform float uPower; uniform float uIntensity; uniform float uLit;
  varying vec3 vN; varying vec3 vW;
  void main(){
    vec3 v = normalize(cameraPosition - vW);
    vec3 n = normalize(vN);
    float rim = pow(1.0 - max(dot(n, v), 0.0), uPower);
    float lit = mix(1.0, smoothstep(-0.35, 0.6, dot(n, normalize(uSun - vW))), uLit);
    gl_FragColor = vec4(uColor, rim * uIntensity * lit);
  }`;

export function Atmosphere({ radius, color = '#6fb4ff', intensity = 1.2, power = 2.6, sun = [0, 0, 0], lit = 1 }) {
  const uniforms = useMemo(
    () => ({
      uColor: { value: new THREE.Color(color) },
      uSun: { value: new THREE.Vector3(...sun) },
      uPower: { value: power },
      uIntensity: { value: intensity },
      uLit: { value: lit },
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [color, power, intensity, lit],
  );
  uniforms.uSun.value.set(...sun);
  return (
    <mesh scale={radius * 1.035} raycast={() => null}>
      <sphereGeometry args={[1, 48, 48]} />
      <shaderMaterial
        vertexShader={atmoVert}
        fragmentShader={atmoFrag}
        uniforms={uniforms}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </mesh>
  );
}

// ---------- Rings ----------
function useRingGeometry(inner, outer) {
  return useMemo(() => {
    const g = new THREE.RingGeometry(inner, outer, 160, 1);
    const pos = g.attributes.position, uv = g.attributes.uv, v = new THREE.Vector3();
    for (let i = 0; i < pos.count; i++) {
      v.fromBufferAttribute(pos, i);
      uv.setXY(i, (v.length() - inner) / (outer - inner), 0.5);
    }
    return g;
  }, [inner, outer]);
}

export function Rings({ rings, radius }) {
  const geo = useRingGeometry(rings.inner * radius, rings.outer * radius);
  const color = useOptionalTexture(rings.texture, true);
  const alpha = useOptionalTexture(rings.alpha, false);
  const thin = useMemo(() => (rings.procedural ? thinRingTexture(rings.color) : null), [rings]);
  return (
    <mesh geometry={geo} rotation={[-Math.PI / 2, 0, 0]} raycast={() => null}>
      {thin ? (
        <meshBasicMaterial map={thin} transparent opacity={rings.opacity} side={THREE.DoubleSide} depthWrite={false} />
      ) : (
        <meshBasicMaterial
          key={color && alpha ? 'tex' : 'plain'}
          map={color}
          alphaMap={alpha}
          color={color ? '#ffffff' : '#cdb88a'}
          transparent
          opacity={rings.opacity}
          side={THREE.DoubleSide}
          depthWrite={false}
        />
      )}
    </mesh>
  );
}

// ---------- Irregular (potato-shaped) geometry for small moons ----------
function useLumpyGeometry(irregular, seed) {
  return useMemo(() => {
    if (!irregular) return null;
    const g = new THREE.IcosahedronGeometry(1, 5);
    const pos = g.attributes.position, v = new THREE.Vector3();
    for (let i = 0; i < pos.count; i++) {
      v.fromBufferAttribute(pos, i);
      const n = Math.sin(v.x * 5.1 + seed) * Math.cos(v.y * 4.3 + seed * 2) * Math.sin(v.z * 3.7 + seed * 0.5);
      v.multiplyScalar(1 + n * 0.09);
      v.set(v.x * irregular[0], v.y * irregular[2], v.z * irregular[1]);
      pos.setXYZ(i, v.x, v.y, v.z);
    }
    g.computeVertexNormals();
    // equirectangular UVs from direction
    const uv = g.attributes.uv;
    for (let i = 0; i < pos.count; i++) {
      v.fromBufferAttribute(pos, i).normalize();
      uv.setXY(i, 0.5 + Math.atan2(v.z, v.x) / (2 * Math.PI), 0.5 + Math.asin(v.y) / Math.PI);
    }
    return g;
  }, [irregular, seed]);
}

// ---------- Planet / moon body ----------
// getSpin(): returns radians per real second for the body's rotation.
export function Body({ body, radius, getSpin, segments = 48, sun = [0, 0, 0], showAtmosphere = true, onClick, onOver, onOut, hitRadius, showAxis = false, sunLit = 1 }) {
  const spinRef = useRef();
  const cloudRef = useRef();
  const map = useBodyTexture(body.texture, body.procedural);
  const normalMap = useOptionalTexture(body.normalMap);
  const specMap = useOptionalTexture(body.specularMap);
  const clouds = useOptionalTexture(body.clouds, true);
  const lumpy = useLumpyGeometry(body.irregular, body.procedural?.seed || 1);
  const tilt = (body.tilt || 0) * DEG;

  useFrame((_, dt) => {
    const d = Math.min(dt, 0.1);
    const rate = getSpin ? getSpin(body) : 0;
    if (spinRef.current) spinRef.current.rotation.y += rate * d;
    if (cloudRef.current) cloudRef.current.rotation.y += rate * d * 1.15;
  });

  const isEarth = body.id === 'earth';
  return (
    <group>
      <group rotation={[0, 0, tilt]}>
        <mesh ref={spinRef} scale={radius} geometry={lumpy || undefined}>
          {!lumpy && <sphereGeometry args={[1, segments, Math.round(segments * 0.75)]} />}
          {isEarth ? (
            <meshPhongMaterial
              key={normalMap && specMap ? 'full' : 'basic'}
              map={map}
              normalMap={normalMap}
              normalScale={new THREE.Vector2(0.85, 0.85)}
              specularMap={specMap}
              specular={new THREE.Color('#3a4a5a')}
              shininess={18}
            />
          ) : (
            <meshStandardMaterial map={map} roughness={1} metalness={0} />
          )}
        </mesh>
        {clouds && (
          <mesh ref={cloudRef} scale={radius * 1.012} raycast={() => null}>
            <sphereGeometry args={[1, segments, Math.round(segments * 0.75)]} />
            <meshStandardMaterial map={clouds} alphaMap={clouds} transparent opacity={0.85} depthWrite={false} roughness={1} />
          </mesh>
        )}
        {body.rings && <Rings rings={body.rings} radius={radius} />}
        {showAxis && (
          <mesh raycast={() => null}>
            <cylinderGeometry args={[radius * 0.012, radius * 0.012, radius * 3.2, 8]} />
            <meshBasicMaterial color="#7dd3fc" transparent opacity={0.7} />
          </mesh>
        )}
      </group>
      {showAtmosphere && body.atmosphereColor && (
        <Atmosphere radius={radius} color={body.atmosphereColor} sun={sun} lit={sunLit} intensity={isEarth ? 1.4 : 1.0} />
      )}
      {onClick && (
        <mesh
          scale={hitRadius || radius * 1.2}
          onClick={onClick}
          onPointerOver={onOver}
          onPointerOut={onOut}
        >
          <sphereGeometry args={[1, 12, 12]} />
          <meshBasicMaterial transparent opacity={0} depthWrite={false} />
        </mesh>
      )}
    </group>
  );
}

// ---------- The Sun ----------
export function Sun({ radius, onClick, onOver, onOut, light = true, lightIntensity = 3.2, glow: glowAmount = 1 }) {
  const ref = useRef();
  const map = useBodyTexture('/textures/sunmap.jpg', { style: 'sun', base: '#ffb340', accent: '#ff6a00', seed: 1 });
  const glow = glowTexture();
  const coronaRef = useRef();
  useFrame((state, dt) => {
    if (ref.current) ref.current.rotation.y += dt * 0.03;
    if (coronaRef.current) {
      const s = 1 + Math.sin(state.clock.elapsedTime * 0.8) * 0.025;
      coronaRef.current.scale.setScalar(radius * (1 + 6 * glowAmount) * s);
    }
  });
  return (
    <group>
      <mesh ref={ref} scale={radius} onClick={onClick} onPointerOver={onOver} onPointerOut={onOut}>
        <sphereGeometry args={[1, 64, 48]} />
        <meshBasicMaterial map={map} color={[1.05, 0.95, 0.85]} toneMapped={false} />
      </mesh>
      <sprite scale={radius * (1 + 2.2 * glowAmount)} raycast={() => null}>
        <spriteMaterial map={glow} color="#ffd27a" transparent blending={THREE.AdditiveBlending} depthWrite={false} opacity={0.9} toneMapped={false} />
      </sprite>
      <sprite ref={coronaRef} scale={radius * 7} raycast={() => null}>
        <spriteMaterial map={glow} color="#ff8a2a" transparent blending={THREE.AdditiveBlending} depthWrite={false} opacity={0.35 * glowAmount} toneMapped={false} />
      </sprite>
      {light && <pointLight intensity={lightIntensity} decay={0} color="#fff4e6" />}
    </group>
  );
}
