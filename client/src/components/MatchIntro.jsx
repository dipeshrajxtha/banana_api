/**
 * @file MatchIntro.jsx
 * @description Full-screen arcade countdown sequence ("3... 2... 1... SOLVE!") with rhythmic audio beeps.
 * Calibrated to exactly 1 second per count so the start timing feels authentic, crisp, and predictable.
 * @module client/components/MatchIntro
 * @author Dipesh Raj Shrestha
 * @reference University of Bedfordshire - CIS046-3 Software For Enterprise (Theme 2: Event-Driven Programming)
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { GAME_MODES } from '@banana-quest/shared';
import { soundService } from '../services/soundService.js';

const COUNTDOWN_STEPS = [
  { label: '3', color: '#00F0FF', subtitle: 'GET READY...' },
  { label: '2', color: '#A855F7', subtitle: 'SET...' },
  { label: '1', color: '#FFD700', subtitle: 'ALMOST...' },
  { label: 'SOLVE!', color: '#10B981', subtitle: '⚡ GO GO GO!' }
];

const getModeIntro = (mode) => {
  switch (mode) {
    case GAME_MODES.SPEED_RUSH: return { icon: '⚡', name: 'SPEED RUSH', sub: '60-Second Blitz Sprint' };
    case GAME_MODES.SURVIVAL: return { icon: '🛡️', name: 'SURVIVAL', sub: '3 Lives • Think Carefully' };
    case GAME_MODES.STREAK_MASTER: return { icon: '🎯', name: 'PERFECT 10', sub: 'Flawless 10-Streak Target' };
    case GAME_MODES.TIME_ATTACK: return { icon: '⏱️', name: 'TIME ATTACK', sub: '10 Equations Speed Trial' };
    case GAME_MODES.PRACTICE: return { icon: '🧘', name: 'ZEN PRACTICE', sub: 'Relaxed Training' };
    default: return { icon: '🍌', name: mode || 'BANANA QUEST', sub: 'Math Simulation' };
  }
};

export default function MatchIntro({ gameMode, onComplete }) {
  const [step, setStep] = useState(0); // Starts immediately at 3
  const [finished, setFinished] = useState(false);
  const modeInfo = getModeIntro(gameMode);

  const handleSkipNow = () => {
    setFinished(true);
    if (onComplete) onComplete();
  };

  useEffect(() => {
    // 1-second per beat countdown with authentic arcade tones
    soundService.playTone(600, 'sine', 0.12);

    const timers = [];

    // Step 1: "2" at 1000ms
    timers.push(setTimeout(() => {
      setStep(1);
      soundService.playTone(600, 'sine', 0.12);
    }, 1000));

    // Step 2: "1" at 2000ms
    timers.push(setTimeout(() => {
      setStep(2);
      soundService.playTone(600, 'sine', 0.12);
    }, 2000));

    // Step 3: "SOLVE!" at 3000ms
    timers.push(setTimeout(() => {
      setStep(3);
      soundService.playTone(1200, 'sine', 0.25);
    }, 3000));

    // Complete at 3800ms
    timers.push(setTimeout(() => {
      setFinished(true);
      if (onComplete) onComplete();
  }, 3800));

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

const currentStepData = COUNTDOWN_STEPS[step] || COUNTDOWN_STEPS[0];

return (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    onClick={handleSkipNow}
    title="Click or press Space to skip directly to game!"
    style={{
      position: 'fixed',
      inset: 0,
      zIndex: 200,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'radial-gradient(ellipse at center, rgba(5, 12, 28, 0.96) 0%, rgba(2, 4, 10, 0.99) 100%)',
      backdropFilter: 'blur(20px)',
      overflow: 'hidden',
        cursor: 'pointer',
      userSelect: 'none'
    }}
  >
    {/* Background Radial Glow */}
    <div style={{
      position: 'absolute',
      width: '500px',
      height: '500px',
      borderRadius: '50%',
      background: `radial-gradient(circle, ${currentStepData.color}25 0%, transparent 70%)`,
      pointerEvents: 'none',
      transition: 'all 0.5s ease'
    }} />

    {/* Mode Header */}
    <motion.div
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '0.4rem',
        marginBottom: '2rem'
      }}
    >
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.6rem',
        fontFamily: 'var(--font-mono)',
        fontSize: '0.9rem',
        color: currentStepData.color,
        letterSpacing: '0.15em',
        fontWeight: 800,
        textTransform: 'uppercase'
      }}>
        <span>{modeInfo.icon}</span>
        <span>{modeInfo.name}</span>
      </div>
      <div style={{ fontSize: '0.82rem', color: 'rgba(255, 255, 255, 0.6)', fontFamily: 'var(--font-mono)' }}>
        {modeInfo.sub}
      </div>
    </motion.div>

    {/* Main Animated Countdown Number */}
    <AnimatePresence mode="wait">
      <motion.div
        key={step}
        initial={{ scale: 2.2, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.5, opacity: 0 }}
        transition={{ duration: 0.35, ease: 'easeOut' }}
        style={{
          fontSize: step === 3 ? 'clamp(3.5rem, 12vw, 6.5rem)' : 'clamp(6rem, 20vw, 10rem)',
          fontWeight: 900,
          fontFamily: 'var(--font-display)',
          color: currentStepData.color,
          textShadow: `0 0 50px ${currentStepData.color}`,
          lineHeight: 1,
          letterSpacing: step === 3 ? '0.08em' : '-0.02em',
          textAlign: 'center'
        }}
      >
        {currentStepData.label}
      </motion.div>
    </AnimatePresence>

    {/* Step Subtitle */}
    <motion.div
      key={`sub-${step}`}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      style={{
        marginTop: '1.25rem',
        fontSize: '1rem',
        fontFamily: 'var(--font-mono)',
        color: currentStepData.color,
        fontWeight: 800,
        letterSpacing: '0.12em'
      }}
    >
      {currentStepData.subtitle}
    </motion.div>

    {/* Skip Prompt */}
    <div style={{
      position: 'absolute',
      bottom: '2rem',
      padding: '0.45rem 1.1rem',
      borderRadius: '20px',
      background: 'rgba(255, 255, 255, 0.06)',
      border: '1px solid rgba(255, 255, 255, 0.15)',
      color: 'rgba(255, 255, 255, 0.7)',
      fontSize: '0.78rem',
      fontWeight: 700,
      fontFamily: 'var(--font-mono)',
      letterSpacing: '0.05em'
    }}>
      ⚡ Click or press <kbd style={{ background: 'rgba(0, 240, 255, 0.2)', color: '#00F0FF', padding: '2px 6px', borderRadius: '4px', border: '1px solid #00F0FF' }}>SPACE</kbd> to skip countdown
    </div>
  </motion.div>
);
}
