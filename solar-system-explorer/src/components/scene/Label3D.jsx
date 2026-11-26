import { useEffect, useId, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { registerLabel, unregisterLabel, updateLabelPositions } from '../../lib/labels.js';

// A label anchored to a point in 3D space (rendered by <LabelLayer/> in the DOM).
export default function Label3D({ position = [0, 0, 0], text, color, onClick, small, active, badge, sub }) {
  const ref = useRef();
  const key = useId();
  useEffect(() => {
    registerLabel(key, { obj: ref.current, text, color, onClick, small, active, badge, sub });
  }, [key, text, color, onClick, small, active, badge, sub]);
  useEffect(() => () => unregisterLabel(key), [key]);
  return <group ref={ref} position={position} />;
}

// Renders the scene manually (priority 1 runs after all other frame updates)
// and then positions labels, so labels never lag behind moving planets.
export function RenderAndLabel() {
  useFrame((state) => {
    state.gl.render(state.scene, state.camera);
    updateLabelPositions(state.camera, state.size);
  }, 1);
  return null;
}
