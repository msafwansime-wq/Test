import { useMemo } from 'react';
import * as THREE from 'three';

// A spherical star backdrop with realistic colour temperatures and a faint
// Milky Way band. Rendered at "infinity" (follows the camera via large radius).
const vert = /* glsl */ `
  attribute float aSize; attribute vec3 aColor; varying vec3 vC; varying float vTw;
  uniform float uTime;
  void main(){
    vC = aColor;
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    gl_Position = projectionMatrix * mv;
    gl_PointSize = aSize;
  }`;
const frag = /* glsl */ `
  varying vec3 vC;
  void main(){
    float d = length(gl_PointCoord - 0.5);
    if (d > 0.5) discard;
    float a = smoothstep(0.5, 0.0, d);
    gl_FragColor = vec4(vC * a, a);
  }`;

export function Starfield({ count = 9000, radius = 9000 }) {
  const geo = useMemo(() => {
    const g = new THREE.BufferGeometry();
    const pos = new Float32Array(count * 3), col = new Float32Array(count * 3), size = new Float32Array(count);
    const palette = ['#9bb0ff', '#aabfff', '#cad7ff', '#f8f7ff', '#fff4ea', '#ffd2a1', '#ffcc6f'];
    let s = 12345;
    const rnd = () => ((s = (s * 16807) % 2147483647) / 2147483647);
    // galactic plane tilted ~60° to the ecliptic
    const tilt = new THREE.Matrix4().makeRotationX(THREE.MathUtils.degToRad(60));
    const v = new THREE.Vector3();
    for (let i = 0; i < count; i++) {
      const inBand = i < count * 0.45;
      const u = inBand ? (rnd() - 0.5) * 0.25 * (rnd() + 0.2) : rnd() * 2 - 1;
      const th = rnd() * Math.PI * 2;
      const r = Math.sqrt(1 - u * u);
      v.set(r * Math.cos(th), u, r * Math.sin(th));
      if (inBand) v.applyMatrix4(tilt);
      v.multiplyScalar(radius);
      pos.set([v.x, v.y, v.z], i * 3);
      const c = new THREE.Color(palette[Math.floor(Math.pow(rnd(), 1.5) * palette.length)]);
      const b = 0.35 + Math.pow(rnd(), 4) * 1.4;
      col.set([c.r * b, c.g * b, c.b * b], i * 3);
      size[i] = 1 + Math.pow(rnd(), 6) * 3.2;
    }
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    g.setAttribute('aColor', new THREE.BufferAttribute(col, 3));
    g.setAttribute('aSize', new THREE.BufferAttribute(size, 1));
    return g;
  }, [count, radius]);
  return (
    <points geometry={geo} raycast={() => null} frustumCulled={false}>
      <shaderMaterial vertexShader={vert} fragmentShader={frag} uniforms={{ uTime: { value: 0 } }} transparent depthWrite={false} blending={THREE.AdditiveBlending} />
    </points>
  );
}
