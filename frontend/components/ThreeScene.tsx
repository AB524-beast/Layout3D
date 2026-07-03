'use client';

import React, { useMemo } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Grid, Html } from '@react-three/drei';

interface Room {
  label: string;
  dimensions: string;
  confidence: number;
}

interface ThreeSceneProps {
  rooms: Room[];
  darkMode: boolean;
}

// 1. INDIVIDUAL EXTRUDED MESH LAYER WITH SPATIAL LABELS
function ArchitecturalBox({ room, position }: { room: Room; position: [number, number, number] }) {
  // Parse metric specifications using regex bounds matching document specifications
  const dimensions = useMemo(() => {
    const match = room.dimensions.match(/([\d.]+)\s*m?\s*x\s*([\d.]+)/i);
    if (match) {
      return {
        width: parseFloat(match[1]),
        length: parseFloat(match[2]),
        height: 2.8, // Standard structural height configuration
      };
    }
    return { width: 4, length: 4, height: 2.8 };
  }, [room.dimensions]);

  return (
    <group position={position}>
      {/* Volumetric Wall Profile Representation */}
      <mesh castShadow receiveShadow position={[0, dimensions.height / 2, 0]}>
        <boxGeometry args={[dimensions.width, dimensions.height, dimensions.length]} />
        <meshStandardMaterial 
          color="#6366f1" 
          wireframe={false}
          transparent={true}
          opacity={0.35} 
          roughness={0.2}
          metalness={0.1}
        />
      </mesh>

      {/* Solid Wireframe Borders for Clean Design Geometry */}
      <mesh position={[0, dimensions.height / 2, 0]}>
        <boxGeometry args={[dimensions.width, dimensions.height, dimensions.length]} />
        <meshStandardMaterial 
          color="#4f46e5" 
          wireframe={true} 
          transparent={true}
          opacity={0.8}
        />
      </mesh>

      {/* Floor Plane Mapping */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]} receiveShadow>
        <planeGeometry args={[dimensions.width, dimensions.length]} />
        <meshStandardMaterial 
          color="#312e81" 
          transparent={true}
          opacity={0.15} 
        />
      </mesh>

      {/* DYNAMIC SPATIAL CONTEXT LABEL (HTML/CSS2D Projection) */}
      {/* Positioned slightly above the ceiling bounds of the extruded room block */}
      <Html
        position={[0, dimensions.height + 0.6, 0]}
        center
        distanceFactor={10} // Scales smoothly down as the user pulls the camera back
        className="pointer-events-none select-none"
      >
        <div className="bg-slate-900/90 dark:bg-slate-50/90 backdrop-blur text-slate-50 dark:text-slate-900 px-3 py-1.5 rounded-xl text-[11px] font-bold tracking-tight shadow-xl border border-white/10 dark:border-slate-200/60 flex flex-col items-center min-w-[100px] text-center animate-fade-in">
          <span className="truncate max-w-[140px]">{room.label}</span>
          <span className="text-[9px] opacity-75 font-mono font-medium mt-0.5">
            {room.dimensions}
          </span>
        </div>
      </Html>
    </group>
  );
}

// 2. MAIN VIEWPORT CANVAS CONTROLLER
export default function ThreeScene({ rooms, darkMode }: ThreeSceneProps) {
  
  // Arrange extracted architectural layouts side-by-side cleanly along the X-axis
  const spacesWithOffsets = useMemo(() => {
    let currentXOffset = 0;
    return rooms.map((room) => {
      const match = room.dimensions.match(/([\d.]+)\s*m?\s*x\s*([\d.]+)/i);
      const width = match ? parseFloat(match[1]) : 4;
      
      const xPos = currentXOffset + width / 2;
      currentXOffset += width + 2.5; // Padding spacing between layouts

      return {
        room,
        position: [xPos - 5, 0, 0] as [number, number, number]
      };
    });
  }, [rooms]);

  const themeColors = {
    gridLines: darkMode ? '#334155' : '#cbd5e1',
    background: darkMode ? '#020617' : '#f8fafc',
    lightIntensity: darkMode ? 0.7 : 1.1
  };

  return (
    <div className="w-full h-full relative flex-1 bg-slate-50 dark:bg-slate-950 transition-colors duration-500">
      <Canvas
        shadows="basic" // Explicitly declare shadow maps to satisfy the new specification
        camera={{ position: [0, 12, 14], fov: 50 }}
        gl={{ antialias: true }}
    >
        <color attach="background" args={[themeColors.background]} />

        {/* Global Illumination */}
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

        {/* Render 3D Blocks with Embedded Labels */}
        {spacesWithOffsets.map((item, idx) => (
          <ArchitecturalBox 
            key={idx} 
            room={item.room} 
            position={item.position} 
          />
        ))}

        {/* Base Grid Interface Backdrop */}
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

        {/* Interactive Mouse/Orbit Viewport Controls */}
        <OrbitControls 
          enableDamping={true}
          dampingFactor={0.05}
          maxPolarAngle={Math.PI / 2 - 0.05}
          minDistance={3}
          maxDistance={40}
        />
      </Canvas>
    </div>
  );
}