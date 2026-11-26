import { useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { app } from '../../lib/store.js';

// Shifts the projection centre so the scene stays centred in the area not
// covered by side panels / bottom sheets. Animated for smooth transitions.
export default function ViewOffset() {
  const camera = useThree((s) => s.camera);
  const size = useThree((s) => s.size);
  const cur = useRef({ x: 0, y: 0 });
  useFrame((_, dt) => {
    const inset = app.get().uiInset || { right: 0, bottom: 0 };
    const tx = inset.right / 2, ty = inset.bottom / 2;
    const k = 1 - Math.exp(-dt * 6);
    const c = cur.current;
    c.x += (tx - c.x) * k;
    c.y += (ty - c.y) * k;
    if (Math.abs(c.x) < 0.5 && Math.abs(c.y) < 0.5 && tx === 0 && ty === 0) {
      if (camera.view?.enabled) camera.clearViewOffset();
      return;
    }
    camera.setViewOffset(size.width, size.height, c.x, c.y, size.width, size.height);
  });
  return null;
}
