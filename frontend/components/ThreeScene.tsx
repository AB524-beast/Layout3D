'use client';

import React, { useMemo } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Grid } from '@react-three/drei';

interface Room {
  label: string;
  dimensions: string;
  confidence: number;
}

interface ThreeSceneProps {
  rooms: Room[];
  darkMode: boolean;
}

// 1. INDIVIDUAL EXTRUDED MESH LAYER
function ArchitecturalBox({ room, position }: { room: Room; position: [number, number, number] }) {
  // Parse textual metric specifications (e.g. "4.5m x 5.0m") using regex bounds
  const dimensions = useMemo(() => {
    const match = room.dimensions.match(/([\d.]+)\s*m?\s*x\s*([\d.]+)/i);
    if (match) {
      return {
        width: parseFloat(match[1]),
        length: parseFloat(match[2]),
        height: 2.8, // Standard localized blueprint ceiling height metric
      };
    }
    // Reliable default fallback vector boundaries if dimensions are unreadable
    return { width: 4, length: 4, height: 2.8 };
  }, [room.dimensions]);

  return (
    <group position={position}>
      {/* Volumetric Wall Profile Representation */}
      <mesh castShadow receiveShadow position={[0, dimensions.height / 2, 0]}>
        <boxGeometry args={[dimensions.width, dimensions.height, dimensions.length]} />
        <meshStandardMaterial 
          color="#6366f1" // Modern deep Indigo styling theme
          wireframe={false}
          transparent={true}
          opacity={0.35} // Semitransparent so structural cross-sections are clear
          roughness={0.2}
          metalness={0.1}
        />
      </mesh>

      {/* Solid Wireframe Borders for Structural Definition */}
      <mesh position={[0, dimensions.height / 2, 0]}>
        <boxGeometry args={[dimensions.width, dimensions.height, dimensions.length]} />
        <meshStandardMaterial 
          color="#4f46e5" 
          wireframe={true} 
          transparent={true}
          opacity={0.8}
        />
      </mesh>

      {/* Localized Floor Plane for Spatial Realization */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]} receiveShadow>
        <planeGeometry args={[dimensions.width, dimensions.length]} />
        <meshStandardMaterial 
          color="#312e81" 
          transparent={true}
          opacity={0.15} 
        />
      </mesh>
    </group>
  );
}

// 2. ROOT VIEWPORT CANVAS CONTROLLER
export default function ThreeScene({ rooms, darkMode }: ThreeSceneProps) {
  
  // Dynamic offset math layout array to lay out extracted meshes side-by-side along the X-axis
  const spacesWithOffsets = useMemo(() => {
    let currentXOffset = 0;
    return rooms.map((room) => {
      const match = room.dimensions.match(/([\d.]+)\s*m?\s*x\s*([\d.]+)/i);
      const width = match ? parseFloat(match[1]) : 4;
      
      // Calculate current anchor layout coordinate point
      const xPos = currentXOffset + width / 2;
      // Advance offset counter forward with structural padding spaces
      currentXOffset += width + 2.5; 

      return {
        room,
        position: [xPos - 5, 0, 0] as [number, number, number]
      };
    });
  }, [rooms]);

  // Adjust theme hex styles programmatically based on active layout modes
  const themeColors = {
    gridLines: darkMode ? '#334155' : '#cbd5e1',
    background: darkMode ? '#020617' : '#f8fafc',
    lightIntensity: darkMode ? 0.7 : 1.1
  };

  return (
    <div className="w-full h-full relative flex-1 bg-slate-50 dark:bg-slate-950 transition-colors duration-500">
      <Canvas
        shadows
        camera={{ position: [0, 12, 14], fov: 50 }}
        gl={{ antialias: true }}
      >
        {/* Dynamic Canvas Theme Background syncing with Tailwind state hooks */}
        <color attach="background" args={[themeColors.background]} />

        {/* SHADOW-MAPPED ENVIRONMENT ILLUMINATION SETUP */}
        <ambientLight intensity={darkMode ? 0.4 : 0.6} /> 
        
        <directionalLight
          position={[10, 18, 12]}
          intensity={themeColors.lightIntensity}
          castShadow
          shadow-mapSize-width={2048}
          shadow-mapSize-height={2048}
          shadow-bias={-0.0001}
        />
        
        <pointLight position={[-10, 10, -10]} intensity={0.3} />

        {/* RENDER DYNAMIC ARCHITECTURAL MESH BLOCKS */}
        {spacesWithOffsets.map((item, idx) => (
          <ArchitecturalBox 
            key={idx} 
            room={item.room} 
            position={item.position} 
          />
        ))}

        {/* PROFESSIONAL DESIGN GRID BACKDROP INTERFACE */}
        <Grid
          renderOrder={-1}
          position={[0, -0.01, 0]}
          args={[60, 60]}
          cellSize={1}
          cellThickness={1}
          cellColor={themeColors.gridLines}
          sectionSize={5}
          sectionThickness={1.5}
          sectionColor={darkMode ? '#475569' : '#94a3b8'}
          fadeDistance={45}
        />

        {/* INTERACTIVE USER VIEWER ORIENTATION CONTROLS */}
        <OrbitControls 
          enableDamping={true}
          dampingFactor={0.05}
          maxPolarAngle={Math.PI / 2 - 0.05} // Protects camera view from dipping completely underneath floor grids
          minDistance={3}
          maxDistance={40}
        />
      </Canvas>
    </div>
  );
}