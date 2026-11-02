/**
 * @file MinionReactionAvatar.jsx
 * @description In-game Cyber-Minion AI Assistant Reaction Avatar.
 * Direct visual alignment with the 3D Cybernetic Laboratory Intro Cutscene.
 * Reacts dynamically to gameplay events (CORRECT, WRONG, TIMER_WARNING, STREAK)
 * with animated cyber visor optic scanning, glowing reactor pulses, and holographic HUD feedback.
 * @module client/components/MinionReactionAvatar
 * @author Dipesh Raj Shrestha
 * @reference University of Bedfordshire - CIS046-3 Software For Enterprise
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function MinionReactionAvatar({ reaction = 'idle', feedbackText = null }) {
  const [currentText, setCurrentText] = useState('AI CO-PILOT: ONLINE');

  useEffect(() => {
    switch (reaction) {
      case 'correct':
        setCurrentText('QUANTUM SYNTHESIS: +100! ⚡');
        break;
      case 'wrong':
        setCurrentText('PARITY CHECK FAILED! ⚠️');
        break;
      case 'urgent':
        setCurrentText('REACTOR OVERHEAT: HURRY! 🚨');
        break;
      case 'streak':
        setCurrentText('NEURAL MATRIX OVERDRIVE! 🔥');
        break;
      default:
        setCurrentText('SCANNING BANANA VECTOR... 🔬');
    }
  }, [reaction]);

  // Color theme according to reaction
  const getThemeColor = () => {
    switch (reaction) {
      case 'correct': return '#10B981'; // Emerald
      case 'wrong': return '#F59E0B'; // Amber
      case 'urgent': return '#EF4444'; // Crimson
      case 'streak': return '#8B5CF6'; // Purple
      default: return '#00F0FF'; // Cyber Cyan
    }
  };

  const themeColor = getThemeColor();

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: '0.75rem',
      background: 'rgba(5, 12, 28, 0.85)',
      backdropFilter: 'blur(16px)',
      padding: '0.45rem 1rem',
      borderRadius: '24px',
      border: `1.5px solid ${themeColor}`,
      boxShadow: `0 0 20px ${themeColor}33, 0 4px 15px rgba(0, 0, 0, 0.6)`,
      position: 'relative',
      fontFamily: 'var(--font-mono)'
    }}>
      {/* Cybernetic Minion SVG Face */}
      <motion.svg
        width="46"
        height="46"
        viewBox="0 0 48 48"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        animate={
          reaction === 'correct' ? { y: [0, -6, 0], scale: [1, 1.08, 1] } :
            reaction === 'wrong' ? { x: [-3, 3, -3, 3, 0] } :
              reaction === 'urgent' ? { scale: [1, 1.15, 1], rotate: [-4, 4, -4, 4, 0] } :
                reaction === 'streak' ? { rotate: [0, -8, 8, 0], scale: [1, 1.1, 1] } :
                  { y: [0, -1.5, 0] }
        }
        transition={{ duration: 0.5 }}
      >
        <defs>
          {/* Metallic Nano-Armor Chassis Gradient */}
          <linearGradient id="cyberHead" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#38BDF8" />
            <stop offset="35%" stopColor="#0284C7" />
            <stop offset="70%" stopColor="#075985" />
            <stop offset="100%" stopColor="#082F49" />
          </linearGradient>

          {/* Visor Core Optic Gradient */}
          <linearGradient id="visorLens" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor={themeColor} stopOpacity="0.8" />
            <stop offset="50%" stopColor="#FFFFFF" />
            <stop offset="100%" stopColor={themeColor} stopOpacity="0.8" />
          </linearGradient>

          {/* Titanium Rim Gradient */}
          <linearGradient id="cyberRim" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#FFFFFF" />
            <stop offset="50%" stopColor="#64748B" />
            <stop offset="100%" stopColor="#1E293B" />
          </linearGradient>
        </defs>

        {/* Outer Nano-Armor Head Capsule */}
        <circle cx="24" cy="24" r="21" fill="url(#cyberHead)" stroke={themeColor} strokeWidth="1.5" />

        {/* Cyber Ear Neural Antennas */}
        <rect x="2" y="21" width="4" height="6" rx="2" fill={themeColor} />
        <rect x="42" y="21" width="4" height="6" rx="2" fill={themeColor} />

        {/* Carbon Fiber Headset Band */}
        <rect x="3" y="19" width="42" height="7" rx="2" fill="#0A0F1D" stroke="#1E293B" strokeWidth="0.5" />

        {/* Cyber Visor Frame (Single Panoramic Wide Lens matching intro video) */}
        <rect x="9" y="15" width="30" height="15" rx="7.5" fill="#030712" stroke="url(#cyberRim)" strokeWidth="1.5" />

        {/* Visor Optic Glass Scanline */}
        <rect x="11" y="17" width="26" height="11" rx="5.5" fill="rgba(0, 240, 255, 0.15)" />

        {/* Visor Laser Pupil / HUD Reticle */}
        <circle cx="20" cy="22.5" r="3" fill="url(#visorLens)" filter="drop-shadow(0 0 4px #00F0FF)" />
        <circle cx="28" cy="22.5" r="3" fill="url(#visorLens)" filter="drop-shadow(0 0 4px #00F0FF)" />

        {/* Glowing Banana Arc Core on Chest */}
        <circle cx="24" cy="38" r="3" fill="#FFD700" filter="drop-shadow(0 0 6px #FFD700)" />
      </motion.svg>

      {/* Futuristic Telemetry HUD Speech Bubble */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentText}
          initial={{ opacity: 0, x: -5 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 5 }}
          style={{
            fontSize: '0.78rem',
            fontWeight: 800,
            color: themeColor,
            fontFamily: 'var(--font-mono)',
            whiteSpace: 'nowrap',
            letterSpacing: '0.04em'
          }}
        >
          {feedbackText || currentText}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
