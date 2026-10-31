/**
 * @file MinionReactionAvatar.jsx
 * @description In-game Minion Reaction Avatar for PuzzleArena.
 * Reacts dynamically to gameplay events (CORRECT, WRONG, TIMER_WARNING, STREAK)
 * with authentic Minion expressions, eye movements, and speech bubbles.
 * @module client/components/MinionReactionAvatar
 * @author Dipesh Raj Shrestha
 * @reference University of Bedfordshire - CIS046-3 Software For Enterprise
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function MinionReactionAvatar({ reaction = 'idle', feedbackText = null }) {
  const [currentText, setCurrentText] = useState('Bello!');

  useEffect(() => {
    switch (reaction) {
      case 'correct':
        setCurrentText('BANANAAA! 🍌🎉');
        break;
      case 'wrong':
        setCurrentText('Oopsie! 🙈');
        break;
      case 'urgent':
        setCurrentText('BEE-DO BEE-DO! 🚨');
        break;
      case 'streak':
        setCurrentText('Mega Minion! 🔥');
        break;
      default:
        setCurrentText('Focus! 🧐');
    }
  }, [reaction]);

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: '0.75rem',
      background: 'rgba(17, 24, 39, 0.65)',
      backdropFilter: 'blur(12px)',
      padding: '0.5rem 1rem',
      borderRadius: '24px',
      border: '2px solid rgba(255, 215, 0, 0.3)',
      boxShadow: '0 4px 15px rgba(0,0,0,0.4)',
      position: 'relative'
    }}>
      {/* Minion SVG Face */}
      <motion.svg
        width="48"
        height="48"
        viewBox="0 0 48 48"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        animate={
          reaction === 'correct' ? { y: [0, -8, 0], rotate: [0, -10, 10, 0] } :
          reaction === 'wrong' ? { x: [-4, 4, -4, 4, 0] } :
          reaction === 'urgent' ? { scale: [1, 1.15, 1], rotate: [-5, 5, -5, 5, 0] } :
          { y: [0, -2, 0] }
        }
        transition={{ duration: 0.5 }}
      >
        <defs>
          <linearGradient id="avatarYellow" x1="0" y1="0" x2="1" y2="1">
            <stop stopColor="#FFF066" />
            <stop offset="0.7" stopColor="#FFDC00" />
            <stop offset="1" stopColor="#D99B00" />
          </linearGradient>
          <linearGradient id="avatarGoggles" x1="0" y1="0" x2="1" y2="1">
            <stop stopColor="#FFFFFF" />
            <stop offset="0.5" stopColor="#9CA3AF" />
            <stop offset="1" stopColor="#4B5563" />
          </linearGradient>
        </defs>

        {/* Head */}
        <circle cx="24" cy="24" r="21" fill="url(#avatarYellow)" stroke="#C27803" strokeWidth="2" />

        {/* Black Strap */}
        <rect x="3" y="19" width="42" height="7" rx="2" fill="#1C1917" />

        {/* Goggles Rim */}
        <circle cx="18" cy="22" r="9" fill="url(#avatarGoggles)" stroke="#1F2937" strokeWidth="1.5" />
        <circle cx="30" cy="22" r="9" fill="url(#avatarGoggles)" stroke="#1F2937" strokeWidth="1.5" />

        {/* Lens Glass */}
        <circle cx="18" cy="22" r="6.5" fill="#F9FAFB" />
        <circle cx="30" cy="22" r="6.5" fill="#F9FAFB" />

        {/* Pupils */}
        {reaction === 'wrong' ? (
          <>
            {/* Confused looking up */}
            <circle cx="18" cy="19" r="3" fill="#78350F" />
            <circle cx="30" cy="19" r="3" fill="#78350F" />
          </>
        ) : reaction === 'urgent' ? (
          <>
            {/* Wide panicked eyes */}
            <circle cx="18" cy="22" r="4.5" fill="#DC2626" />
            <circle cx="30" cy="22" r="4.5" fill="#DC2626" />
            <circle cx="18" cy="22" r="2" fill="#000" />
            <circle cx="30" cy="22" r="2" fill="#000" />
          </>
        ) : (
          <>
            {/* Happy eyes */}
            <circle cx="18" cy="22" r="3.5" fill="#78350F" />
            <circle cx="30" cy="22" r="3.5" fill="#78350F" />
            <circle cx="17" cy="21" r="1" fill="#FFF" />
            <circle cx="29" cy="21" r="1" fill="#FFF" />
          </>
        )}

        {/* Mouth */}
        {reaction === 'correct' ? (
          /* Wide open smile */
          <path d="M19 32C19 36 29 36 29 32Z" fill="#78350F" stroke="#78350F" strokeWidth="1" />
        ) : reaction === 'wrong' ? (
          /* O-shape mouth */
          <ellipse cx="24" cy="33" rx="3" ry="2" fill="#78350F" />
        ) : reaction === 'urgent' ? (
          /* Wavy panic mouth */
          <path d="M19 33C21 31 23 35 25 32C27 35 29 32 29 33" stroke="#78350F" strokeWidth="2" strokeLinecap="round" />
        ) : (
          /* Pleasant smirk */
          <path d="M20 32C22 34 26 34 28 32" stroke="#78350F" strokeWidth="2" strokeLinecap="round" />
        )}
      </motion.svg>

      {/* Minion Speech Bubble */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentText}
          initial={{ opacity: 0, x: -5 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 5 }}
          style={{
            fontSize: '0.8rem',
            fontWeight: 800,
            color: '#FFD700',
            fontFamily: 'var(--font-display)',
            whiteSpace: 'nowrap'
          }}
        >
          {feedbackText || currentText}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
