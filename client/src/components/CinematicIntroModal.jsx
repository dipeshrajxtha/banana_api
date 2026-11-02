/**
 * @file CinematicIntroModal.jsx
 * @description Premium Arcade Cutscene Modal with 1:1 Pixel-Crisp Theater Window.
 * Solves video blurriness by framing the native 848x480 video in an optimized cinema viewport (maxWidth: 850px).
 * Eliminates all player controls (no timeline, no scrubbers, no pause overlays).
 * Features ambient backlight glow, tactical corner reticles, and a dedicated 'Skip Intro' HUD button.
 * @module client/components/CinematicIntroModal
 * @author Dipesh Raj Shrestha
 * @reference University of Bedfordshire - CIS046-3 Software For Enterprise
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function CinematicIntroModal({ isOpen, onClose }) {
  const videoRef = useRef(null);
  const [isAudioMuted, setIsAudioMuted] = useState(true);
  const [hasEnded, setHasEnded] = useState(false);
  const endedRef = useRef(false);

  // Transition smoothly from cutscene to main command deck
  const handleSkipToGame = useCallback(() => {
    if (endedRef.current) return;
    endedRef.current = true;
    setHasEnded(true);

    if (videoRef.current) {
      videoRef.current.pause();
    }

    setTimeout(() => {
      onClose();
    }, 300);
  }, [onClose]);

  // Unmute audio on user interaction
  const handleToggleAudio = useCallback((e) => {
    if (e) e.stopPropagation();
    const video = videoRef.current;
    if (video) {
      video.muted = !video.muted;
      setIsAudioMuted(video.muted);
    }
  }, []);

  // Initialize playback on mount / open
  useEffect(() => {
    if (!isOpen) {
      endedRef.current = false;
      setHasEnded(false);
      return;
    }

    endedRef.current = false;
    setHasEnded(false);

    const video = videoRef.current;
    if (video) {
      video.currentTime = 0;
      video.muted = true;
      setIsAudioMuted(true);

      const playPromise = video.play();
      if (playPromise !== undefined) {
        playPromise.catch(() => {
          // Autoplay fallback
        });
      }
    }
  }, [isOpen]);

  // Keyboard controls: ESC or Space = Skip directly to game
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      if (e.code === 'Escape' || e.code === 'Space' || e.code === 'Enter') {
        e.preventDefault();
        handleSkipToGame();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, handleSkipToGame]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.4 }}
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 999999,
          background: 'rgba(2, 5, 15, 0.96)',
          backdropFilter: 'blur(20px)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '1.25rem',
          padding: '1.5rem',
          overflow: 'hidden',
          userSelect: 'none'
        }}
      >
        {/* Dynamic Ambient Backlight Glow (Eliminates harsh edges) */}
        <motion.div
          animate={{
            scale: [1, 1.08, 1],
            opacity: [0.35, 0.55, 0.35]
          }}
          transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
          style={{
            position: 'absolute',
            width: '650px',
            height: '420px',
            background: 'radial-gradient(ellipse at center, rgba(0, 240, 255, 0.3) 0%, rgba(2, 132, 199, 0.15) 45%, transparent 70%)',
            filter: 'blur(80px)',
            pointerEvents: 'none',
            zIndex: 1
          }}
        />

        {/* Top Watermark Header */}
        <div style={{
          zIndex: 10,
          display: 'flex',
          alignItems: 'center',
          gap: '0.6rem',
          fontFamily: 'var(--font-mono)',
          fontSize: '0.82rem',
          color: '#00F0FF',
          letterSpacing: '0.15em',
          textTransform: 'uppercase',
          textShadow: '0 0 10px rgba(0, 240, 255, 0.5)'
        }}>
          <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#00F0FF', boxShadow: '0 0 8px #00F0FF' }} />
          <span>BANANA QUEST // QUANTUM LAB CUTSCENE</span>
        </div>

        {/* ─── Compact Cinema Theater Window (1:1 Native Resolution — Eliminates Blurriness) ─── */}
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          transition={{ duration: 0.35, ease: 'easeOut' }}
          style={{
            position: 'relative',
            zIndex: 10,
            width: '90vw',
            maxWidth: '850px',
            aspectRatio: '16 / 9',
            maxHeight: '68vh',
            borderRadius: '12px',
            overflow: 'hidden',
            border: '1.5px solid rgba(0, 240, 255, 0.45)',
            boxShadow: '0 0 40px rgba(0, 240, 255, 0.25), 0 25px 60px rgba(0, 0, 0, 0.9)',
            background: '#000000',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          {/* Tactical Corner Reticles */}
          <div style={{ position: 'absolute', top: '10px', left: '12px', zIndex: 15, pointerEvents: 'none', color: '#00F0FF', fontSize: '1.1rem', fontFamily: 'monospace', opacity: 0.7 }}>┌</div>
          <div style={{ position: 'absolute', top: '10px', right: '12px', zIndex: 15, pointerEvents: 'none', color: '#00F0FF', fontSize: '1.1rem', fontFamily: 'monospace', opacity: 0.7 }}>┐</div>
          <div style={{ position: 'absolute', bottom: '10px', left: '12px', zIndex: 15, pointerEvents: 'none', color: '#00F0FF', fontSize: '1.1rem', fontFamily: 'monospace', opacity: 0.7 }}>└</div>
          <div style={{ position: 'absolute', bottom: '10px', right: '12px', zIndex: 15, pointerEvents: 'none', color: '#00F0FF', fontSize: '1.1rem', fontFamily: 'monospace', opacity: 0.7 }}>┘</div>

          {/* Crisp Video Element — ZERO Player Controls */}
          <video
            ref={videoRef}
            src="/assets/intro.mp4"
            preload="auto"
            playsInline
            autoPlay
            muted={isAudioMuted}
            onEnded={handleSkipToGame}
            onError={() => {
              if (videoRef.current) videoRef.current.play().catch(() => {});
            }}
            onWaiting={() => {
              if (videoRef.current) videoRef.current.play().catch(() => {});
            }}
            onStalled={() => {
              if (videoRef.current) videoRef.current.play().catch(() => {});
            }}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              display: 'block',
              pointerEvents: 'none',
              filter: 'contrast(1.08) saturate(1.18)'
            }}
          />

          {/* Discreet Audio Toggle Button (Top-Right inside frame) */}
          <motion.button
            onClick={handleToggleAudio}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            style={{
              position: 'absolute',
              top: '12px',
              right: '12px',
              zIndex: 20,
              padding: '0.35rem 0.75rem',
              borderRadius: '20px',
              background: 'rgba(3, 7, 18, 0.8)',
              border: isAudioMuted ? '1px solid rgba(255, 255, 255, 0.25)' : '1px solid #00F0FF',
              color: isAudioMuted ? 'rgba(255, 255, 255, 0.7)' : '#00F0FF',
              fontFamily: 'var(--font-mono)',
              fontSize: '0.75rem',
              fontWeight: 800,
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              cursor: 'pointer',
              backdropFilter: 'blur(8px)',
              boxShadow: isAudioMuted ? 'none' : '0 0 12px rgba(0, 240, 255, 0.3)'
            }}
            title={isAudioMuted ? 'Unmute Audio' : 'Mute Audio'}
          >
            <span>{isAudioMuted ? '🔇' : '🔊'}</span>
            <span>{isAudioMuted ? 'UNMUTE' : 'AUDIO ON'}</span>
          </motion.button>
        </motion.div>

        {/* ─── Bottom HUD: Only 'Skip Intro' Button ─── */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.3 }}
          style={{ zIndex: 10 }}
        >
          <motion.button
            onClick={handleSkipToGame}
            whileHover={{ scale: 1.05, boxShadow: '0 0 25px rgba(0, 240, 255, 0.6)' }}
            whileTap={{ scale: 0.95 }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.65rem',
              padding: '0.65rem 1.6rem',
              borderRadius: '8px',
              border: '1.5px solid #00F0FF',
              background: 'linear-gradient(135deg, rgba(0, 240, 255, 0.2) 0%, rgba(2, 132, 199, 0.2) 100%)',
              backdropFilter: 'blur(12px)',
              color: '#FFFFFF',
              fontFamily: 'var(--font-mono)',
              fontWeight: 800,
              fontSize: '0.9rem',
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              cursor: 'pointer',
              boxShadow: '0 0 15px rgba(0, 240, 255, 0.35)',
              transition: 'all 0.2s ease'
            }}
          >
            <kbd style={{
              background: 'rgba(0, 240, 255, 0.25)',
              border: '1px solid #00F0FF',
              color: '#00F0FF',
              padding: '0.15rem 0.5rem',
              borderRadius: '4px',
              fontSize: '0.75rem',
              fontWeight: 900
            }}>
              ESC
            </kbd>
            <span>Skip Intro ❯❯</span>
          </motion.button>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
