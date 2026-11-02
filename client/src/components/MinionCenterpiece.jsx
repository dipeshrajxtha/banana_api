/**
 * @file MinionCenterpiece.jsx
 * @description Cyber-Minion Quantum AI Scientist — Modeled directly after the
 * Banana Quest 3D Cinematic Intro video. Features a futuristic cybernetic Minion
 * in a high-tech metallic nano-suit, glowing neon-cyan visor with holographic gaze tracking,
 * quantum banana arc reactor core, revolving 3D holographic data rings, and a structured
 * sci-fi telemetry HUD deck with zero component overlapping.
 * @module client/components/MinionCenterpiece
 * @author Dipesh Raj Shrestha
 * @reference University of Bedfordshire - CIS046-3 Software For Enterprise
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const CYBER_PHRASES = [
  '⚡ QUANTUM MATRIX: ONLINE & READY! 🍌',
  '🔬 NEURAL SYNC: 100% CALIBRATED',
  '🚀 CYBER-BELLO! READY TO SOLVE?',
  '⚛️ POTASSIUM FUSION CORE AT MAX VELOCITY',
  '🌟 REVOLUTIONARY MATH SYNTHESIS ENGAGED',
  '🤖 BANANAAA! QUANTUM OVERDRIVE ⚡'
];

export default function MinionCenterpiece({ onTriggerIntro }) {
  const [speechText, setSpeechText] = useState('⚡ CYBER-MINION MK-IV: SYSTEM ENGAGED 🍌');
  const [visorPulse, setVisorPulse] = useState(false);
  const [eyeOffset, setEyeOffset] = useState({ x: 0, y: 0 });

  // Visor optic pulse cycle
  useEffect(() => {
    const pulseInterval = setInterval(() => {
      setVisorPulse(true);
      setTimeout(() => setVisorPulse(false), 240);
    }, 4200);
    return () => clearInterval(pulseInterval);
  }, []);

  // Track mouse to make cyber visor look toward player cursor
  useEffect(() => {
    const handleMouseMove = (e) => {
      const { innerWidth, innerHeight } = window;
      const x = ((e.clientX / innerWidth) - 0.5) * 16;
      const y = ((e.clientY / innerHeight) - 0.5) * 10;
      setEyeOffset({ x, y });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  const handleMinionClick = () => {
    const randomPhrase = CYBER_PHRASES[Math.floor(Math.random() * CYBER_PHRASES.length)];
    setSpeechText(randomPhrase);
  };

  return (
    <div
      style={{
        position: 'relative',
        width: '100%',
        maxWidth: '720px',
        margin: '0 auto 1.75rem auto',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        userSelect: 'none'
      }}
      onClick={handleMinionClick}
    >
      {/* Sci-Fi Holographic Speech HUD Bubble */}
      <AnimatePresence mode="wait">
        <motion.div
          key={speechText}
          initial={{ opacity: 0, y: 8, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -8, scale: 0.9 }}
          transition={{ type: 'spring', stiffness: 400, damping: 25 }}
          style={{
            background: 'linear-gradient(135deg, rgba(6, 182, 212, 0.95) 0%, rgba(14, 116, 144, 0.95) 100%)',
            color: '#FFFFFF',
            fontWeight: 800,
            fontSize: '0.88rem',
            padding: '0.5rem 1.4rem',
            borderRadius: '24px',
            border: '1.5px solid #00F0FF',
            boxShadow: '0 0 25px rgba(0, 240, 255, 0.45), 0 4px 12px rgba(0, 0, 0, 0.5)',
            marginBottom: '1rem',
            position: 'relative',
            zIndex: 10,
            letterSpacing: '0.04em',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            fontFamily: 'var(--font-mono)'
          }}
        >
          <span style={{ color: '#FFD700', fontSize: '1rem' }}>▶</span>
          <span>{speechText}</span>
          {/* Sci-Fi Arrow Pointer */}
          <div
            style={{
              position: 'absolute',
              bottom: '-7px',
              left: '50%',
              transform: 'translateX(-50%)',
              width: 0,
              height: 0,
              borderLeft: '7px solid transparent',
              borderRight: '7px solid transparent',
              borderTop: '7px solid #00F0FF'
            }}
          />
        </motion.div>
      </AnimatePresence>

      {/* Cyber-Minion 3D SVG Model with Revolving Quantum Arc Rings */}
      <div style={{ position: 'relative', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <motion.svg
          width="280"
          height="260"
          viewBox="0 0 320 300"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          animate={{ y: [0, -6, 0] }}
          transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut' }}
          style={{
            filter: 'drop-shadow(0 15px 35px rgba(0, 240, 255, 0.35))',
            position: 'relative',
            zIndex: 5
          }}
        >
          <defs>
            {/* Cybernetic Metallic Teal Alloy Gradient (From Video Model) */}
            <radialGradient id="cyberChassis" cx="35%" cy="30%" r="70%">
              <stop offset="0%" stopColor="#38BDF8" />
              <stop offset="25%" stopColor="#0EA5E9" />
              <stop offset="60%" stopColor="#0284C7" />
              <stop offset="90%" stopColor="#075985" />
              <stop offset="100%" stopColor="#082F49" />
            </radialGradient>

            {/* Deep Titanium Outer Armor Shell */}
            <linearGradient id="titaniumArmor" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#1E293B" />
              <stop offset="50%" stopColor="#0F172A" />
              <stop offset="100%" stopColor="#020617" />
            </linearGradient>

            {/* Neon Hologram Cyan Visor Gradient */}
            <linearGradient id="neonVisor" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#E0F2FE" />
              <stop offset="25%" stopColor="#38BDF8" />
              <stop offset="70%" stopColor="#0284C7" />
              <stop offset="100%" stopColor="#00F0FF" />
            </linearGradient>

            {/* Arc Reactor Gold Core */}
            <radialGradient id="bananaReactor" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#FFFFFF" />
              <stop offset="30%" stopColor="#FFE600" />
              <stop offset="70%" stopColor="#FFD700" />
              <stop offset="100%" stopColor="#F59E0B" />
            </radialGradient>
          </defs>

          {/* ─── Holographic 3D Orbiting Data Ring (Back Layer) ─── */}
          <g style={{ transformOrigin: '160px 150px' }}>
            <ellipse
              cx="160"
              cy="150"
              rx="135"
              ry="42"
              stroke="#00F0FF"
              strokeWidth="1.5"
              strokeDasharray="6 8"
              opacity="0.45"
              transform="rotate(-18 160 150)"
            />
            <ellipse
              cx="160"
              cy="150"
              rx="120"
              ry="36"
              stroke="#FFD700"
              strokeWidth="1.2"
              strokeDasharray="4 10"
              opacity="0.35"
              transform="rotate(22 160 150)"
            />
          </g>

          {/* ─── Robotic Cybernetic Body Capsule (Pill Shape) ─── */}
          <rect
            x="95"
            y="55"
            width="130"
            height="180"
            rx="65"
            fill="url(#cyberChassis)"
            stroke="#00F0FF"
            strokeWidth="2.5"
            filter="drop-shadow(0 0 15px rgba(0, 240, 255, 0.4))"
          />

          {/* Armor Seam Panel Line */}
          <path
            d="M 98 145 Q 160 160 222 145"
            stroke="#00F0FF"
            strokeWidth="1.5"
            strokeDasharray="3 3"
            opacity="0.75"
          />

          {/* ─── Cybernetic Ear Antenna Nodes ─── */}
          <rect x="83" y="115" width="14" height="24" rx="4" fill="#0EA5E9" stroke="#00F0FF" strokeWidth="1.5" />
          <rect x="80" y="122" width="6" height="10" rx="2" fill="#00F0FF" />
          <rect x="223" y="115" width="14" height="24" rx="4" fill="#0EA5E9" stroke="#00F0FF" strokeWidth="1.5" />
          <rect x="234" y="122" width="6" height="10" rx="2" fill="#00F0FF" />

          {/* ─── Cyber Visor Headset Band ─── */}
          <rect x="94" y="105" width="132" height="30" rx="6" fill="url(#titaniumArmor)" stroke="#0284C7" strokeWidth="2" />

          {/* ─── High-Tech Monolithic Visor Housing (From Cinematic Video) ─── */}
          <rect
            x="110"
            y="95"
            width="100"
            height="50"
            rx="25"
            fill="#030712"
            stroke="#00F0FF"
            strokeWidth="2.5"
            filter="drop-shadow(0 0 12px rgba(0, 240, 255, 0.6))"
          />

          {/* Visor Holographic Lens Screen */}
          <rect
            x="115"
            y="100"
            width="90"
            height="40"
            rx="20"
            fill="url(#neonVisor)"
            opacity="0.85"
          />

          {/* Visor Scanline Sweep */}
          <line x1="120" y1="120" x2="200" y2="120" stroke="#FFFFFF" strokeWidth="1" opacity="0.6" strokeDasharray="2 4" />

          {/* ─── Dynamic Hologram Gaze Tracking Optic Visor Pupils ─── */}
          <g transform={`translate(${eyeOffset.x}, ${eyeOffset.y})`}>
            {/* Left Optic Laser Pupil */}
            <circle cx="145" cy="120" r="10" fill="#030712" />
            <circle cx="145" cy="120" r="7" fill="#00F0FF" filter="drop-shadow(0 0 6px #00F0FF)" />
            <circle cx="145" cy="120" r="3" fill="#FFFFFF" />
            <circle cx="148" cy="117" r="1.5" fill="#FFFFFF" />

            {/* Right Optic Laser Pupil */}
            <circle cx="175" cy="120" r="10" fill="#030712" />
            <circle cx="175" cy="120" r="7" fill="#00F0FF" filter="drop-shadow(0 0 6px #00F0FF)" />
            <circle cx="175" cy="120" r="3" fill="#FFFFFF" />
            <circle cx="178" cy="117" r="1.5" fill="#FFFFFF" />
          </g>

          {/* Visor Optic Pulse Overlay */}
          {visorPulse && (
            <rect
              x="115"
              y="100"
              width="90"
              height="40"
              rx="20"
              fill="#FFFFFF"
              opacity="0.35"
            />
          )}

          {/* ─── Cybernetic Chest Arc Reactor Core ("Potassium Fusion Engine") ─── */}
          <circle cx="160" cy="188" r="20" fill="url(#titaniumArmor)" stroke="#00F0FF" strokeWidth="2" />
          <circle cx="160" cy="188" r="14" fill="url(#bananaReactor)" filter="drop-shadow(0 0 14px #FFD700)" />
          <text x="160" y="193" textAnchor="middle" fontSize="13" fill="#000000" fontWeight="900" fontFamily="sans-serif">⚡</text>

          {/* ─── Robotic Nanotech Hands Holding Holographic Banana Crystal ─── */}
          <g>
            {/* Left Hand Clamp */}
            <circle cx="112" cy="205" r="10" fill="#0284C7" stroke="#00F0FF" strokeWidth="1.5" />
            {/* Right Hand Clamp */}
            <circle cx="208" cy="205" r="10" fill="#0284C7" stroke="#00F0FF" strokeWidth="1.5" />

            {/* Glowing Potassium Crystal Orb */}
            <circle cx="160" cy="225" r="13" fill="#FFD700" opacity="0.85" filter="drop-shadow(0 0 15px #FFD700)" />
            <text x="160" y="230" textAnchor="middle" fontSize="12">🍌</text>
          </g>

          {/* ─── Holographic 3D Orbiting Data Ring (Front Layer) ─── */}
          <ellipse
            cx="160"
            cy="150"
            rx="135"
            ry="42"
            stroke="#00F0FF"
            strokeWidth="1.8"
            strokeDasharray="14 12"
            opacity="0.8"
            transform="rotate(-18 160 150)"
          />
        </motion.svg>
      </div>

      {/* ─── Structured Holographic Subsystem Telemetry Deck (Clean, Non-Overlapping Layout) ─── */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
        gap: '0.75rem',
        width: '100%',
        maxWidth: '640px',
        marginTop: '0.75rem',
        pointerEvents: 'none'
      }}>
        {/* Subsystem 1: Core Engine */}
        <div style={{
          background: 'rgba(6, 182, 212, 0.08)',
          border: '1px solid rgba(0, 240, 255, 0.4)',
          borderRadius: '8px',
          padding: '0.45rem 0.65rem',
          textAlign: 'center',
          fontFamily: 'var(--font-mono)',
          boxShadow: '0 0 12px rgba(0, 240, 255, 0.15)'
        }}>
          <div style={{ fontSize: '0.62rem', color: '#38BDF8', fontWeight: 800, textTransform: 'uppercase' }}>CORE ENGINE</div>
          <div style={{ fontSize: '0.78rem', color: '#FFFFFF', fontWeight: 800, marginTop: '2px' }}>E = mc² + 🍌</div>
        </div>

        {/* Subsystem 2: Quantum Flux */}
        <div style={{
          background: 'rgba(245, 158, 11, 0.08)',
          border: '1px solid rgba(255, 215, 0, 0.4)',
          borderRadius: '8px',
          padding: '0.45rem 0.65rem',
          textAlign: 'center',
          fontFamily: 'var(--font-mono)',
          boxShadow: '0 0 12px rgba(255, 215, 0, 0.15)'
        }}>
          <div style={{ fontSize: '0.62rem', color: '#FBBF24', fontWeight: 800, textTransform: 'uppercase' }}>QUANTUM FLUX</div>
          <div style={{ fontSize: '0.78rem', color: '#FFFFFF', fontWeight: 800, marginTop: '2px' }}>∇ × B = μ₀J</div>
        </div>

        {/* Subsystem 3: Velocity Multiplier */}
        <div style={{
          background: 'rgba(16, 185, 129, 0.08)',
          border: '1px solid rgba(16, 185, 129, 0.4)',
          borderRadius: '8px',
          padding: '0.45rem 0.65rem',
          textAlign: 'center',
          fontFamily: 'var(--font-mono)',
          boxShadow: '0 0 12px rgba(16, 185, 129, 0.15)'
        }}>
          <div style={{ fontSize: '0.62rem', color: '#34D399', fontWeight: 800, textTransform: 'uppercase' }}>VELOCITY</div>
          <div style={{ fontSize: '0.78rem', color: '#FFFFFF', fontWeight: 800, marginTop: '2px' }}>Δv = 9.81 × 10x</div>
        </div>

        {/* Subsystem 4: AI Status */}
        <div style={{
          background: 'rgba(168, 85, 247, 0.08)',
          border: '1px solid rgba(168, 85, 247, 0.4)',
          borderRadius: '8px',
          padding: '0.45rem 0.65rem',
          textAlign: 'center',
          fontFamily: 'var(--font-mono)',
          boxShadow: '0 0 12px rgba(168, 85, 247, 0.15)'
        }}>
          <div style={{ fontSize: '0.62rem', color: '#C084FC', fontWeight: 800, textTransform: 'uppercase' }}>MK-IV AI CORE</div>
          <div style={{ fontSize: '0.78rem', color: '#FFFFFF', fontWeight: 800, marginTop: '2px' }}>STATUS: ONLINE</div>
        </div>
      </div>
    </div>
  );
}
