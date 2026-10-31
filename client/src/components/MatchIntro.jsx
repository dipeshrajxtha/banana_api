/**
 * @file MatchIntro.jsx
 * @description Full-screen arcade countdown overlay ("Ready... Set... SOLVE!") with Framer Motion animations.
 * Plays before the puzzle unlocks, building tension with scale, opacity, and color transitions.
 * @module client/components/MatchIntro
 * @author Dipesh Raj Shrestha
 * @reference University of Bedfordshire - CIS046-3 Software For Enterprise (Theme 2: Event-Driven Programming)
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { GAME_MODES } from '@banana-quest/shared';

const COUNTDOWN_STEPS = [
  { label: '3', color: 'var(--accent-cyan)', subtitle: 'Get Ready...' },
  { label: '2', color: 'var(--accent-purple)', subtitle: 'Set...' },
  { label: '1', color: 'var(--accent-gold)', subtitle: 'Almost...' },
  { label: 'SOLVE!', color: 'var(--accent-emerald)', subtitle: '🍌 Go Go Go!' }
];

const getModeIntro = (mode) => {
  switch (mode) {
    case GAME_MODES.SPEED_RUSH: return { icon: '⚡', name: 'SPEED RUSH', sub: '60-Second Blitz' };
    case GAME_MODES.SURVIVAL: return { icon: '🛡️', name: 'SURVIVAL', sub: '3 Lives • Think Carefully' };
    case GAME_MODES.STREAK_MASTER: return { icon: '🎯', name: 'PERFECT 10', sub: 'Zero Mistakes Allowed' };
    case GAME_MODES.TIME_ATTACK: return { icon: '⏱️', name: 'TIME ATTACK', sub: 'Race to Solve 10' };
    case GAME_MODES.PRACTICE: return { icon: '🧘', name: 'ZEN PRACTICE', sub: 'Relax & Train' };
    default: return { icon: '🍌', name: mode, sub: '' };
  }
};

export default function MatchIntro({ gameMode, onComplete }) {
  const [step, setStep] = useState(-1); // -1 = mode title, 0-3 = countdown
  const [finished, setFinished] = useState(false);
  const modeInfo = getModeIntro(gameMode);

  const handleSkipNow = () => {
    setFinished(true);
    if (onComplete) onComplete();
  };

  useEffect(() => {
    // Quick, punchy arcade countdown sequence (~1.9s total)
    const timers = [];

    timers.push(setTimeout(() => setStep(0), 500));
    timers.push(setTimeout(() => setStep(1), 900));
    timers.push(setTimeout(() => setStep(2), 1300));
    timers.push(setTimeout(() => setStep(3), 1700));
    timers.push(setTimeout(() => {
      setFinished(true);
      if (onComplete) onComplete();
    }, 2100));

    // Global skip hotkey (Space, Enter, Escape)
    const handleKey = (e) => {
      if (['Space', 'Enter', 'Escape'].includes(e.code)) {
        handleSkipNow();
      }
    };
    window.addEventListener('keydown', handleKey);

    return () => {
      timers.forEach(clearTimeout);
      window.removeEventListener('keydown', handleKey);
    };
  }, [onComplete]);

  if (finished) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={handleSkipNow}
      title="Click or press Space to start immediately!"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 200,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'radial-gradient(ellipse at center, rgba(10, 13, 20, 0.95) 0%, rgba(5, 7, 12, 0.99) 100%)',
        backdropFilter: 'blur(20px)',
        overflow: 'hidden',
        cursor: 'pointer'
      }}
    >
      {/* Instant Skip Hint Pill */}
      <div style={{
        position: 'absolute',
        bottom: '2rem',
        padding: '0.4rem 1rem',
        borderRadius: '20px',
        background: 'rgba(255, 255, 255, 0.1)',
        border: '1px solid rgba(255, 215, 0, 0.3)',
        color: '#FFD700',
        fontSize: '0.8rem',
        fontWeight: 700,
        letterSpacing: '0.05em'
      }}>
        ⚡ Click anywhere or press <kbd style={{ background: '#333', padding: '2px 6px', borderRadius: '4px' }}>SPACE</kbd> to start instantly
      </div>
      {/* Background Particles */}
      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
        {Array.from({ length: 20 }).map((_, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: '100vh' }}
            animate={{
              opacity: [0, 0.6, 0],
              y: [100, -window.innerHeight],
              x: Math.random() * 40 - 20
            }}
            transition={{
              duration: 3 + Math.random() * 2,
              delay: Math.random() * 2,
              repeat: Infinity,
              ease: 'easeOut'
            }}
            style={{
              position: 'absolute',
              left: `${Math.random() * 100}%`,
              bottom: 0,
              width: '4px',
              height: '4px',
              borderRadius: '50%',
              background: 'var(--accent-gold)',
              boxShadow: '0 0 8px var(--accent-gold-glow)'
            }}
          />
        ))}
      </div>

      <AnimatePresence mode="wait">
        {step === -1 && (
          <motion.div
            key="mode-title"
            initial={{ scale: 0.3, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 1.5, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 200, damping: 15 }}
            style={{ textAlign: 'center' }}
          >
            <motion.div
              animate={{ rotate: [0, -10, 10, -5, 5, 0] }}
              transition={{ duration: 0.8, delay: 0.2 }}
              style={{ fontSize: '4rem', marginBottom: '0.5rem' }}
            >
              {modeInfo.icon}
            </motion.div>
            <div style={{
              fontSize: '2.5rem',
              fontWeight: 900,
              fontFamily: 'var(--font-display)',
              letterSpacing: '-0.02em',
              background: 'var(--grad-banana)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent'
            }}>
              {modeInfo.name}
            </div>
            <div style={{
              fontSize: '1rem',
              color: 'var(--text-secondary)',
              marginTop: '0.5rem',
              fontWeight: 600
            }}>
              {modeInfo.sub}
            </div>
          </motion.div>
        )}

        {step >= 0 && step <= 3 && (
          <motion.div
            key={`step-${step}`}
            initial={{ scale: 3, opacity: 0, rotate: -20 }}
            animate={{ scale: 1, opacity: 1, rotate: 0 }}
            exit={{ scale: 0.3, opacity: 0, y: -80 }}
            transition={{
              type: 'spring',
              stiffness: 300,
              damping: 20,
              duration: 0.5
            }}
            style={{ textAlign: 'center' }}
          >
            <div style={{
              fontSize: step === 3 ? '5rem' : '8rem',
              fontWeight: 900,
              fontFamily: 'var(--font-display)',
              color: COUNTDOWN_STEPS[step].color,
              textShadow: `0 0 60px ${COUNTDOWN_STEPS[step].color}`,
              lineHeight: 1
            }}>
              {COUNTDOWN_STEPS[step].label}
            </div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              style={{
                fontSize: '1.2rem',
                color: 'var(--text-secondary)',
                marginTop: '1rem',
                fontWeight: 600
              }}
            >
              {COUNTDOWN_STEPS[step].subtitle}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Expanding Ring Effect */}
      {step >= 0 && (
        <motion.div
          key={`ring-${step}`}
          initial={{ scale: 0, opacity: 0.5 }}
          animate={{ scale: 4, opacity: 0 }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          style={{
            position: 'absolute',
            width: '100px',
            height: '100px',
            borderRadius: '50%',
            border: `3px solid ${COUNTDOWN_STEPS[step]?.color || 'var(--accent-gold)'}`,
            pointerEvents: 'none'
          }}
        />
      )}
    </motion.div>
  );
}

