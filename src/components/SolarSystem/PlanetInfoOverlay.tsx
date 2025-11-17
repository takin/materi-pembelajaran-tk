import { useRef, useEffect, useState } from 'react';
import { useThree, useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface PlanetInfoOverlayProps {
  planetPosition: THREE.Vector3 | null;
  onPositionUpdate: (x: number, y: number) => void;
}

export function PlanetInfoOverlay({ planetPosition, onPositionUpdate }: PlanetInfoOverlayProps) {
  const { camera, size } = useThree();
  
  useFrame(() => {
    if (planetPosition) {
      // Convert 3D position to screen coordinates
      const vector = planetPosition.clone();
      vector.project(camera);
      
      // Convert to pixel coordinates
      const x = (vector.x * 0.5 + 0.5) * size.width;
      const y = (-(vector.y * 0.5) + 0.5) * size.height;
      
      // Position card to the right of the planet
      const cardX = Math.min(x + 120, size.width - 420); // 420 = card width + margin
      const cardY = Math.max(Math.min(y - 200, size.height - 550), 20); // Center card vertically
      
      onPositionUpdate(cardX, cardY);
    }
  });
  
  return null;
}

