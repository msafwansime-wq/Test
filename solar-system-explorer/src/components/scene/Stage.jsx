import { Component, Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import * as THREE from 'three';
import { app, useApp } from '../../lib/store.js';
import OverviewScene from './OverviewScene.jsx';
import CompareScene from './CompareScene.jsx';
import ExploreScene from './ExploreScene.jsx';
import Fallback2D from './Fallback2D.jsx';
import ViewOffset from './ViewOffset.jsx';
import { RenderAndLabel } from './Label3D.jsx';
import LabelLayer from '../ui/LabelLayer.jsx';

export function hasWebGL() {
  try {
    const c = document.createElement('canvas');
    return !!(window.WebGLRenderingContext && (c.getContext('webgl2') || c.getContext('webgl')));
  } catch {
    return false;
  }
}

class GLBoundary extends Component {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  componentDidCatch(err) {
    console.warn('3D renderer failed, switching to 2D fallback:', err);
    app.set({ webgl: false });
  }
  render() { return this.state.failed ? <Fallback2D /> : this.props.children; }
}

export default function Stage() {
  const { mode, webgl } = useApp();
  if (!webgl) return <Fallback2D />;
  return (
    <GLBoundary>
      <Canvas
        className="!absolute inset-0"
        dpr={[1, 1.75]}
        camera={{ fov: 45, near: 0.05, far: 30000, position: [0, 70, 150] }}
        gl={{ antialias: true, powerPreference: 'high-performance', toneMapping: THREE.ACESFilmicToneMapping }}
        onCreated={({ gl }) => {
          gl.setClearColor('#03050d');
          gl.domElement.addEventListener('webglcontextlost', (e) => { e.preventDefault(); app.set({ webgl: false }); });
        }}
        onPointerMissed={() => { document.body.style.cursor = ''; }}
      >
        <ViewOffset />
        <RenderAndLabel />
        <Suspense fallback={null}>
          {mode === 'overview' && <OverviewScene key="overview" />}
          {mode === 'compare' && <CompareScene key="compare" />}
          {mode === 'explore' && <ExploreScene key="explore" />}
        </Suspense>
      </Canvas>
      <LabelLayer />
      <div key={mode} className="mode-fade pointer-events-none absolute inset-0 z-[6] bg-space-950" />
    </GLBoundary>
  );
}
