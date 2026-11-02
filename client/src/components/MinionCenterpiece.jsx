/**
 * @file MinionCenterpiece.jsx
 * @description Cyber-Minion Quantum AI Scientist — Modeled directly after the
 * Banana Quest 3D Cinematic Intro video. Features a futuristic cybernetic Minion
 * in a high-tech metallic nano-suit, glowing neon-cyan visor with holographic gaze tracking,
 * quantum banana arc reactor core, revolving 3D holographic data rings, and floating
 * sci-fi telemetry HUD displays matching the cinematic laboratory environment.
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
        maxWidth: '560px',
        margin: '0 auto 1.5rem auto',
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
            marginBottom: '0.75rem',
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

      {/* Floating Holographic Sci-Fi Telemetry Cards (Matching the Intro Video Lab) */}
      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 1 }}>
        {/* Top-Left: Quantum Mass Energy */}
        <motion.div
          animate={{ y: [0, -8, 0], opacity: [0.65, 0.95, 0.65] }}
          transition={{ duration: 3.2, repeat: Infinity, ease: 'easeInOut' }}
          style={{
            position: 'absolute',
            top: '8%',
            left: '3%',
            background: 'rgba(6, 182, 212, 0.12)',
            border: '1px solid rgba(0, 240, 255, 0.45)',
            boxShadow: '0 0 15px rgba(0, 240, 255, 0.2)',
            borderRadius: '8px',
            padding: '0.35rem 0.65rem',
            fontFamily: 'var(--font-mono)',
            fontSize: '0.75rem',
            fontWeight: 800,
            color: '#00F0FF'
          }}
        >
          <div style={{ fontSize: '0.6rem', color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase' }}>CORE ENGINE</div>
          <div>E = mc² + 🍌</div>
        </motion.div>

        {/* Top-Right: Holographic Hex Telemetry */}
        <motion.div
          animate={{ y: [0, 8, 0], opacity: [0.65, 0.95, 0.65] }}
          transition={{ duration: 3.8, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }}
          style={{
            position: 'absolute',
            top: '12%',
            right: '4%',
            background: 'rgba(245, 158, 11, 0.12)',
            border: '1px solid rgba(255, 215, 0, 0.45)',
            boxShadow: '0 0 15px rgba(255, 215, 0, 0.2)',
            borderRadius: '8px',
            padding: '0.35rem 0.65rem',
            fontFamily: 'var(--font-mono)',
            fontSize: '0.75rem',
            fontWeight: 800,
            color: '#FFD700'
          }}
        >
          <div style={{ fontSize: '0.6rem', color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase' }}>QUANTUM FLUX</div>
          <div>∇ × B = μ₀J_potassium</div>
        </motion.div>

        {/* Bottom-Left: Velocity Vector */}
        <motion.div
          animate={{ y: [0, -6, 0], opacity: [0.55, 0.85, 0.55] }}
          transition={{ duration: 4.1, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
          style={{
            position: 'absolute',
            bottom: '15%',
            left: '2%',
            background: 'rgba(16, 185, 129, 0.12)',
            border: '1px solid rgba(16, 185, 129, 0.45)',
            boxShadow: '0 0 15px rgba(16, 185, 129, 0.2)',
            borderRadius: '8px',
            padding: '0.35rem 0.65rem',
            fontFamily: 'var(--font-mono)',
            fontSize: '0.75rem',
            fontWeight: 800,
            color: '#34D399'
          }}
        >
          <div style={{ fontSize: '0.6rem', color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase' }}>VELOCITY STREAK</div>
          <div>Δv = 9.81 × 10x</div>
        </motion.div>

        {/* Bottom-Right: Matrix Frequency */}
        <motion.div
          animate={{ y: [0, 6, 0], opacity: [0.55, 0.85, 0.55] }}
          transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut', delay: 1.5 }}
          style={{
            position: 'absolute',
            bottom: '20%',
            right: '2%',
            background: 'rgba(168, 85, 247, 0.12)',
            border: '1px solid rgba(168, 85, 247, 0.45)',
            boxShadow: '0 0 15px rgba(168, 85, 247, 0.2)',
            borderRadius: '8px',
            padding: '0.35rem 0.65rem',
            fontFamily: 'var(--font-mono)',
            fontSize: '0.75rem',
            fontWeight: 800,
            color: '#C084FC'
          }}
        >
          <div style={{ fontSize: '0.6rem', color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase' }}>SYSTEM STATE</div>
          <div>CIS046-3_ACTIVE</div>
        </motion.div>
      </div>

      {/* Cyber-Minion 3D SVG Model (Directly matching the video's robotic sphere & sci-fi lab character) */}
      <motion.svg
        width="320"
        height="300"
        viewBox="0 0 320 300"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        animate={{ y: [0, -8, 0] }}
        transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
        style={{
          filter: 'drop-shadow(0 20px 45px rgba(0, 240, 255, 0.35))',
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

          {/* Visor Glow Glow */}
          <radialGradient id="visorCoreGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#FFFFFF" />
            <stop offset="40%" stopColor="#00F0FF" />
            <stop offset="85%" stopColor="#0284C7" />
            <stop offset="100%" stopColor="transparent" />
          </radialGradient>

          {/* Quantum Arc Reactor Core (Chest) */}
          <radialGradient id="arcReactor" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#FFFFFF" />
            <stop offset="35%" stopColor="#38BDF8" />
            <stop offset="70%" stopColor="#0284C7" />
            <stop offset="100%" stopColor="#082F49" />
          </radialGradient>

          {/* Golden Quantum Banana Energy */}
          <linearGradient id="quantumBanana" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#FFFBEB" />
            <stop offset="30%" stopColor="#FDE047" />
            <stop offset="70%" stopColor="#F59E0B" />
            <stop offset="100%" stopColor="#D97706" />
          </linearGradient>

          {/* Sci-Fi Glow Filters */}
          <filter id="cyanGlow" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="6" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>

          <filter id="superGlow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="12" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* Outer 3D Holographic Orbit Ring (Revolving in 3D Perspective) */}
        <ellipse
          cx="160"
          cy="150"
          rx="145"
          ry="65"
          fill="none"
          stroke="url(#neonVisor)"
          strokeWidth="1.5"
          strokeDasharray="12 8"
          transform="rotate(-15 160 150)"
          style={{ opacity: 0.6 }}
        />
        <ellipse
          cx="160"
          cy="150"
          rx="135"
          ry="55"
          fill="none"
          stroke="#00F0FF"
          strokeWidth="1"
          strokeDasharray="6 14"
          transform="rotate(25 160 150)"
          style={{ opacity: 0.4 }}
        />

        {/* Shadow base under the floating model */}
        <ellipse cx="160" cy="275" rx="75" ry="12" fill="rgba(0, 240, 255, 0.2)" filter="url(#cyanGlow)" />

        {/* ─── CYBERNETIC CHASSIS (Sleek Futuristic Capsule Body from Video) ─── */}
        <path
          d="M85 110C85 62 118 25 160 25C202 25 235 62 235 110V185C235 228 202 255 160 255C118 255 85 228 85 185V110Z"
          fill="url(#cyberChassis)"
          stroke="#00F0FF"
          strokeWidth="2.5"
        />

        {/* High-Tech Shell Segment Lines (Armor Seams) */}
        <path d="M86 100C125 110 195 110 234 100" stroke="#00F0FF" strokeWidth="1.5" strokeOpacity="0.7" />
        <path d="M86 195C125 205 195 205 234 195" stroke="#00F0FF" strokeWidth="1.5" strokeOpacity="0.7" />
        <path d="M160 25V65" stroke="#00F0FF" strokeWidth="1.5" strokeOpacity="0.8" />
        <path d="M160 220V255" stroke="#00F0FF" strokeWidth="1.5" strokeOpacity="0.8" />

        {/* Side Titanium Exoskeleton Brackets */}
        <rect x="74" y="110" width="12" height="60" rx="4" fill="url(#titaniumArmor)" stroke="#00F0FF" strokeWidth="1" />
        <rect x="234" y="110" width="12" height="60" rx="4" fill="url(#titaniumArmor)" stroke="#00F0FF" strokeWidth="1" />

        {/* ─── HOLOGRAPHIC CYBER-VISOR / OPTICAL SENSOR ─── */}
        {/* Visor Frame (Curved Panoramic Carbon Shield) */}
        <path
          d="M95 80C115 75 205 75 225 80C235 84 235 125 225 130C205 135 115 135 95 130C85 125 85 84 95 80Z"
          fill="url(#titaniumArmor)"
          stroke="#00F0FF"
          strokeWidth="2"
        />

        {/* Glowing Neon Visor Screen Glass */}
        <path
          d="M102 85C118 81 202 81 218 85C226 88 226 122 218 125C202 129 118 129 102 125C94 122 94 88 102 85Z"
          fill="#030F26"
          stroke="#38BDF8"
          strokeWidth="1.5"
        />

        {/* Luminous Aqua Optical HUD Sweep (Gaze Tracking) */}
        <g transform={`translate(${eyeOffset.x}, ${eyeOffset.y})`}>
          {/* Dual Cyber Optic Lenses */}
          {/* Left Sensor Eye */}
          <circle cx="135" cy="105" r="16" fill="url(#visorCoreGlow)" filter="url(#cyanGlow)" />
          <circle cx="135" cy="105" r="8" fill="#FFFFFF" />
          <circle cx="135" cy="105" r="4" fill="#00F0FF" />
          {/* Circular HUD Reticle */}
          <circle cx="135" cy="105" r="18" fill="none" stroke="#00F0FF" strokeWidth="1" strokeDasharray="4 4" />

          {/* Right Sensor Eye */}
          <circle cx="185" cy="105" r="16" fill="url(#visorCoreGlow)" filter="url(#cyanGlow)" />
          <circle cx="185" cy="105" r="8" fill="#FFFFFF" />
          <circle cx="185" cy="105" r="4" fill="#00F0FF" />
          {/* Circular HUD Reticle */}
          <circle cx="185" cy="105" r="18" fill="none" stroke="#00F0FF" strokeWidth="1" strokeDasharray="4 4" />
        </g>

        {/* Scanning Laser HUD Line Across Visor */}
        <line
          x1="102"
          y1={visorPulse ? '118' : '92'}
          x2="218"
          y2={visorPulse ? '118' : '92'}
          stroke="#00F0FF"
          strokeWidth="2"
          filter="url(#cyanGlow)"
          style={{ transition: 'y1 0.4s ease, y2 0.4s ease' }}
        />

        {/* ─── CHEST QUANTUM ARC REACTOR CORE ─── */}
        <circle cx="160" cy="170" r="24" fill="url(#titaniumArmor)" stroke="#00F0FF" strokeWidth="2" />
        <circle cx="160" cy="170" r="18" fill="url(#arcReactor)" filter="url(#cyanGlow)" />
        {/* Core Tri-Node Rings */}
        <circle cx="160" cy="170" r="12" fill="none" stroke="#FFFFFF" strokeWidth="1.5" strokeDasharray="6 4" />
        <polygon points="160,162 167,175 153,175" fill="#00F0FF" />

        {/* ─── QUANTUM GOLDEN BANANA IN CYBERNETIC CLAW ─── */}
        {/* Robotic Arm Holding the Quantum Banana */}
        <path d="M90 170C70 180 60 195 85 210" stroke="#0EA5E9" strokeWidth="8" strokeLinecap="round" />
        <circle cx="85" cy="210" r="8" fill="url(#titaniumArmor)" stroke="#00F0FF" strokeWidth="1.5" />

        {/* Radiant Quantum Golden Banana (Luminescent) */}
        <g filter="url(#superGlow)">
          <path
            d="M80 195C88 190 102 196 108 206C112 214 110 224 100 230C86 238 72 230 68 220C65 212 70 200 80 195Z"
            fill="url(#quantumBanana)"
            stroke="#FFD700"
            strokeWidth="2"
          />
          {/* Banana Stem Tip */}
          <path d="M108 206L114 209" stroke="#78350F" strokeWidth="3" strokeLinecap="round" />
        </g>

        {/* Futuristic Tech Decals & Logos on Suit */}
        <text
          x="160"
          y="225"
          fill="#38BDF8"
          fontSize="8"
          fontWeight="900"
          fontFamily="monospace"
          textAnchor="middle"
          letterSpacing="2"
        >
          BQ-MK4 // 2026
        </text>
      </motion.svg>
    </div>
  );
}
