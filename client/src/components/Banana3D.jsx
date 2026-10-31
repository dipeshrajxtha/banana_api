/**
 * @file Banana3D.jsx
 * @description Interactive 3D spinning banana using React Three Fiber with ambient lighting,
 * auto-rotation, and mouse-tracking orbit. Decorative element for the Welcome/Home screen.
 * @module client/components/Banana3D
 * @author Dipesh Raj Shrestha
 * @reference University of Bedfordshire - CIS046-3 Software For Enterprise
 */

import React, { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Float, MeshDistortMaterial, Environment, OrbitControls } from '@react-three/drei';
import * as THREE from 'three';

/**
 * Procedural banana mesh using a curved tube geometry with banana-yellow material.
 * The shape approximates a banana using a CatmullRomCurve3.
 */
function BananaShape({ speed = 0.6 }) {
  const meshRef = useRef();

  // Generate banana curve path
  const curve = useMemo(() => {
    const points = [
      new THREE.Vector3(-1.2, -0.3, 0),
      new THREE.Vector3(-0.6, 0.4, 0.15),
      new THREE.Vector3(0, 0.7, 0.1),
      new THREE.Vector3(0.5, 0.6, -0.1),
      new THREE.Vector3(1.0, 0.2, -0.15),
      new THREE.Vector3(1.3, -0.2, 0)
    ];
    return new THREE.CatmullRomCurve3(points);
  }, []);

  const tubeGeometry = useMemo(() => {
    return new THREE.TubeGeometry(curve, 32, 0.22, 12, false);
  }, [curve]);

  // Slow continuous rotation
  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.y += 0.003 * speed;
      meshRef.current.rotation.z = Math.sin(state.clock.elapsedTime * 0.5) * 0.05;
      meshRef.current.position.y = Math.sin(state.clock.elapsedTime * 0.8) * 0.08;
    }
  });

  return (
    <Float speed={1.5} rotationIntensity={0.3} floatIntensity={0.4}>
      <mesh ref={meshRef} geometry={tubeGeometry} castShadow>
        <MeshDistortMaterial
          color="#FBBF24"
          emissive="#F59E0B"
          emissiveIntensity={0.3}
          roughness={0.3}
          metalness={0.1}
          distort={0.08}
          speed={2}
        />
      </mesh>
    </Float>
  );
}

/**
 * Small orbiting banana ring particle effect
 */
function GoldenParticles() {
  const groupRef = useRef();
  const count = 30;

  const positions = useMemo(() => {
    const pos = [];
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2;
      const radius = 2.0 + Math.random() * 1.0;
      pos.push({
        x: Math.cos(angle) * radius,
        y: (Math.random() - 0.5) * 1.5,
        z: Math.sin(angle) * radius,
        scale: 0.02 + Math.random() * 0.04
      });
    }
    return pos;
  }, []);

  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.y = state.clock.elapsedTime * 0.15;
    }
  });

  return (
    <group ref={groupRef}>
      {positions.map((p, i) => (
        <mesh key={i} position={[p.x, p.y, p.z]}>
          <sphereGeometry args={[p.scale, 6, 6]} />
          <meshStandardMaterial
            color="#FCD34D"
            emissive="#F59E0B"
            emissiveIntensity={0.8}
            transparent
            opacity={0.7}
          />
        </mesh>
      ))}
    </group>
  );
}

/**
 * Main Banana3D canvas component with controls and lighting
 */
export default function Banana3D({ height = '280px', enableControls = true }) {
  return (
    <div style={{
      width: '100%',
      height,
      borderRadius: 'var(--radius-lg)',
      overflow: 'hidden',
      position: 'relative'
    }}>
      <Canvas
        camera={{ position: [0, 0, 4], fov: 45 }}
        dpr={[1, 2]}
        style={{ background: 'transparent' }}
      >
        <ambientLight intensity={0.5} />
        <directionalLight position={[5, 5, 5]} intensity={1.2} color="#FFF8DC" />
        <pointLight position={[-3, 2, -3]} intensity={0.5} color="#8B5CF6" />
        <pointLight position={[3, -2, 3]} intensity={0.3} color="#06B6D4" />

        <BananaShape speed={0.6} />
        <GoldenParticles />

        {enableControls && (
          <OrbitControls
            enableZoom={false}
            enablePan={false}
            autoRotate
            autoRotateSpeed={0.5}
            maxPolarAngle={Math.PI / 1.8}
            minPolarAngle={Math.PI / 3}
          />
        )}
      </Canvas>

      {/* Subtle gradient overlay at bottom for blending */}
      <div style={{
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: '40px',
        background: 'linear-gradient(transparent, var(--bg-primary))',
        pointerEvents: 'none'
      }} />
    </div>
  );
}

