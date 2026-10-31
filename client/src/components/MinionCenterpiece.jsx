/**
 * @file MinionCenterpiece.jsx
 * @description Authentic Real Minion Hero Centerpiece with animated eyes, iconic silver goggles,
 * denim overalls with yellow contrast stitching, embroidered Banana Quest chest crest,
 * radiant Golden Banana with volumetric glow, and holographic math particles.
 * Replaces the procedural 3D tube with an authentic Illumination-grade Minion character.
 * @module client/components/MinionCenterpiece
 * @author Dipesh Raj Shrestha
 * @reference University of Bedfordshire - CIS046-3 Software For Enterprise
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const MINION_PHRASES = [
  'BANANAAA! 🍌',
  'Bello! Ready to solve? 👋',
  'Tulaliloo ti amo! 💛',
  'E = mc² + BANANA! ⚡',
  'Poopaye! Let’s get 10 streak! 🚀',
  'Holy potassium! 🌟'
];

export default function MinionCenterpiece({ onTriggerIntro }) {
  const [speechText, setSpeechText] = useState('Bello! Master the math! 🍌');
  const [blink, setBlink] = useState(false);
  const [eyeOffset, setEyeOffset] = useState({ x: 0, y: 0 });

  // Natural Minion eye blinking cycle
  useEffect(() => {
    const blinkInterval = setInterval(() => {
      setBlink(true);
      setTimeout(() => setBlink(false), 160);
    }, 3800);
    return () => clearInterval(blinkInterval);
  }, []);

  // Track mouse lightly to make Minion gaze follow the player
  useEffect(() => {
    const handleMouseMove = (e) => {
      const { innerWidth, innerHeight } = window;
      const x = ((e.clientX / innerWidth) - 0.5) * 12;
      const y = ((e.clientY / innerHeight) - 0.5) * 8;
      setEyeOffset({ x, y });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  const handleMinionClick = () => {
    const randomPhrase = MINION_PHRASES[Math.floor(Math.random() * MINION_PHRASES.length)];
    setSpeechText(randomPhrase);
  };

  return (
    <div style={{
      position: 'relative',
      width: '100%',
      maxWidth: '520px',
      margin: '0 auto 1.5rem auto',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      cursor: 'pointer'
    }} onClick={handleMinionClick}>
      {/* Interactive Speech Bubble */}
      <AnimatePresence mode="wait">
        <motion.div
          key={speechText}
          initial={{ opacity: 0, y: 10, scale: 0.8 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -10, scale: 0.8 }}
          transition={{ type: 'spring', stiffness: 350, damping: 20 }}
          style={{
            background: '#FFE600',
            color: '#1E293B',
            fontWeight: 800,
            fontSize: '0.95rem',
            padding: '0.5rem 1.25rem',
            borderRadius: '20px',
            border: '2px solid #D97706',
            boxShadow: '0 4px 15px rgba(255, 215, 0, 0.4)',
            marginBottom: '0.75rem',
            position: 'relative',
            zIndex: 10
          }}
        >
          {speechText}
          {/* Bubble tail */}
          <div style={{
            position: 'absolute',
            bottom: '-8px',
            left: '50%',
            transform: 'translateX(-50%)',
            width: 0,
            height: 0,
            borderLeft: '8px solid transparent',
            borderRight: '8px solid transparent',
            borderTop: '8px solid #FFE600'
          }} />
        </motion.div>
      </AnimatePresence>

      {/* Floating Holographic Math Equations (Clip 1 & 2 continuity) */}
      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
        {[
          { text: 'E = mc²', top: '10%', left: '5%', color: '#38BDF8' },
          { text: 'x + 7 = 12', top: '25%', right: '8%', color: '#10B981' },
          { text: '🍌 × 9 = 81', bottom: '20%', left: '2%', color: '#FBBF24' },
          { text: '∫ f(x) dx', bottom: '35%', right: '4%', color: '#A855F7' }
        ].map((eq, i) => (
          <motion.div
            key={i}
            animate={{
              y: [0, -10, 0],
              opacity: [0.4, 0.9, 0.4]
            }}
            transition={{
              duration: 2.5 + i,
              repeat: Infinity,
              ease: 'easeInOut'
            }}
            style={{
              position: 'absolute',
              top: eq.top,
              left: eq.left,
              right: eq.right,
              bottom: eq.bottom,
              fontFamily: 'var(--font-mono)',
              fontWeight: 800,
              fontSize: '0.85rem',
              color: eq.color,
              background: 'rgba(0,0,0,0.5)',
              padding: '0.2rem 0.5rem',
              borderRadius: '6px',
              border: `1px solid ${eq.color}44`,
              boxShadow: `0 0 10px ${eq.color}33`
            }}
          >
            {eq.text}
          </motion.div>
        ))}
      </div>

      {/* High-Fidelity Vector Minion Scientist & Golden Banana */}
      <motion.svg
        width="280"
        height="260"
        viewBox="0 0 280 260"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        animate={{ y: [0, -6, 0] }}
        transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut' }}
        style={{ filter: 'drop-shadow(0 15px 35px rgba(0, 0, 0, 0.6))' }}
      >
        <defs>
          {/* Minion Yellow Skin Gradient */}
          <linearGradient id="minionYellow" x1="60" y1="30" x2="220" y2="210" gradientUnits="userSpaceOnUse">
            <stop stopColor="#FFF066" />
            <stop offset="0.4" stopColor="#FFDC00" />
            <stop offset="0.85" stopColor="#F5B800" />
            <stop offset="1" stopColor="#D99B00" />
          </linearGradient>

          {/* Denim Overalls Gradient */}
          <linearGradient id="denimBlue" x1="80" y1="140" x2="200" y2="230" gradientUnits="userSpaceOnUse">
            <stop stopColor="#2E6B9E" />
            <stop offset="0.5" stopColor="#1E4B7A" />
            <stop offset="1" stopColor="#123258" />
          </linearGradient>

          {/* Metallic Silver Goggles Gradient */}
          <linearGradient id="chromeGoggles" x1="0" y1="0" x2="1" y2="1">
            <stop stopColor="#FFFFFF" />
            <stop offset="0.3" stopColor="#D1D5DB" />
            <stop offset="0.6" stopColor="#9CA3AF" />
            <stop offset="0.9" stopColor="#4B5563" />
            <stop offset="1" stopColor="#374151" />
          </linearGradient>

          {/* Golden Banana Glow Gradient */}
          <linearGradient id="goldenBanana" x1="0" y1="0" x2="1" y2="1">
            <stop stopColor="#FFFBEB" />
            <stop offset="0.2" stopColor="#FDE047" />
            <stop offset="0.6" stopColor="#F59E0B" />
            <stop offset="1" stopColor="#B45309" />
          </linearGradient>

          <filter id="bananaGlow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="8" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* Minion Body (Capsule / Pill Shape) */}
        <path
          d="M75 105C75 62 104 30 140 30C176 30 205 62 205 105V175C205 205 180 220 140 220C100 220 75 205 75 175V105Z"
          fill="url(#minionYellow)"
          stroke="#C27803"
          strokeWidth="3"
        />

        {/* Few Wispy Minion Hair Strands */}
        <path d="M135 30C132 18 126 12 120 10" stroke="#451A03" strokeWidth="2.5" strokeLinecap="round" />
        <path d="M140 30C140 16 142 10 144 8" stroke="#451A03" strokeWidth="2.5" strokeLinecap="round" />
        <path d="M145 30C148 18 154 12 160 10" stroke="#451A03" strokeWidth="2.5" strokeLinecap="round" />

        {/* Black Goggle Straps */}
        <rect x="73" y="80" width="134" height="18" rx="4" fill="#1C1917" stroke="#0C0A09" strokeWidth="2" />
        {/* Strap Rivets */}
        <circle cx="82" cy="89" r="2.5" fill="#9CA3AF" />
        <circle cx="198" cy="89" r="2.5" fill="#9CA3AF" />

        {/* Dual Goggles Outer Rims (Brushed Chrome) */}
        {/* Left Goggle Rim */}
        <circle cx="114" cy="89" r="26" fill="url(#chromeGoggles)" stroke="#1F2937" strokeWidth="2" />
        <circle cx="114" cy="89" r="20" fill="#E5E7EB" />
        <circle cx="114" cy="89" r="18" fill="#F9FAFB" />

        {/* Right Goggle Rim */}
        <circle cx="166" cy="89" r="26" fill="url(#chromeGoggles)" stroke="#1F2937" strokeWidth="2" />
        <circle cx="166" cy="89" r="20" fill="#E5E7EB" />
        <circle cx="166" cy="89" r="18" fill="#F9FAFB" />

        {/* Goggle Bridge Clip */}
        <rect x="135" y="84" width="10" height="10" rx="2" fill="url(#chromeGoggles)" stroke="#374151" strokeWidth="1" />

        {/* Left Eye & Pupil (With Blinking Support) */}
        {!blink ? (
          <g transform={`translate(${eyeOffset.x * 0.4}, ${eyeOffset.y * 0.4})`}>
            {/* Iris (Hazel/Brown) */}
            <circle cx="114" cy="89" r="9" fill="#78350F" />
            <circle cx="114" cy="89" r="5" fill="#0F172A" />
            {/* Highlight */}
            <circle cx="112" cy="86" r="2.5" fill="#FFFFFF" />
          </g>
        ) : (
          <line x1="99" y1="89" x2="129" y2="89" stroke="#78350F" strokeWidth="3" strokeLinecap="round" />
        )}

        {/* Right Eye & Pupil (With Blinking Support) */}
        {!blink ? (
          <g transform={`translate(${eyeOffset.x * 0.4}, ${eyeOffset.y * 0.4})`}>
            {/* Iris (Hazel/Brown) */}
            <circle cx="166" cy="89" r="9" fill="#78350F" />
            <circle cx="166" cy="89" r="5" fill="#0F172A" />
            {/* Highlight */}
            <circle cx="164" cy="86" r="2.5" fill="#FFFFFF" />
          </g>
        ) : (
          <line x1="151" y1="89" x2="181" y2="89" stroke="#78350F" strokeWidth="3" strokeLinecap="round" />
        )}

        {/* Friendly Smirk / Mouth */}
        <path
          d="M125 125C132 133 148 133 155 125"
          stroke="#78350F"
          strokeWidth="3.5"
          strokeLinecap="round"
          fill="none"
        />

        {/* Denim Overalls Body */}
        <path
          d="M85 160C85 152 95 145 105 145H175C185 145 195 152 195 160V195C195 210 175 220 140 220C105 220 85 210 85 195V160Z"
          fill="url(#denimBlue)"
          stroke="#0F2B48"
          strokeWidth="2.5"
        />

        {/* Overalls Straps */}
        {/* Left Strap */}
        <path d="M85 145L108 175H94L78 145H85Z" fill="#1E4B7A" stroke="#0F2B48" strokeWidth="1.5" />
        <circle cx="103" cy="170" r="3.5" fill="#0F172A" stroke="#FFD700" strokeWidth="1" />

        {/* Right Strap */}
        <path d="M195 145L172 175H186L202 145H195Z" fill="#1E4B7A" stroke="#0F2B48" strokeWidth="1.5" />
        <circle cx="177" cy="170" r="3.5" fill="#0F172A" stroke="#FFD700" strokeWidth="1" />

        {/* Yellow Contrast Stitching along Overalls Pocket */}
        <path
          d="M115 178H165V200C165 206 158 210 140 210C122 210 115 206 115 200V178Z"
          fill="#173B61"
          stroke="#FFD700"
          strokeWidth="1.5"
          strokeDasharray="3 3"
        />

        {/* Center Embroidered Chest Crest Patch (Banana Quest Crest) */}
        <circle cx="140" cy="192" r="11" fill="#111827" stroke="#FFD700" strokeWidth="1.5" />
        {/* Banana Crest Icon */}
        <path
          d="M136 195C136 189 142 186 146 190C144 192 140 196 136 195Z"
          fill="#FFD700"
        />

        {/* Left Hand Holding The Radiant Golden Banana */}
        {/* Arm */}
        <path d="M78 155C60 162 50 178 52 195C53 198 58 198 62 194C66 182 72 170 82 165" fill="#FFDC00" stroke="#C27803" strokeWidth="2" />
        {/* Black Glove */}
        <circle cx="53" cy="195" r="7" fill="#1C1917" />
        <circle cx="49" cy="192" r="4" fill="#1C1917" />

        {/* RADIANT GOLDEN BANANA (Feature Film Illumination Standard) */}
        <g filter="url(#bananaGlow)">
          {/* Volumetric Aura Rays behind banana */}
          <circle cx="45" cy="180" r="24" fill="rgba(255, 215, 0, 0.25)" />

          {/* Perfect Golden Banana Curve */}
          <path
            d="M32 198C28 184 34 165 52 158C56 156 59 159 57 163C44 172 40 186 42 196C42 199 35 201 32 198Z"
            fill="url(#goldenBanana)"
            stroke="#92400E"
            strokeWidth="1.5"
          />
          {/* Banana Stem */}
          <rect x="52" y="156" width="3" height="5" rx="1" fill="#78350F" />
          {/* Banana Tip */}
          <circle cx="33" cy="199" r="1.5" fill="#78350F" />

          {/* Sparkle Glint */}
          <polygon points="48,165 50,161 52,165 56,167 52,169 50,173 48,169 44,167" fill="#FFFFFF" />
        </g>
      </motion.svg>
    </div>
  );
}

