/**
 * @file CinematicIntroModal.jsx
 * @description Authentic AAA Game Intro Cutscene Sequence.
 * Plays seamlessly on game boot with zero video player UI:
 * - NO play/pause icons, NO scrubber, NO timeline bars, NO buffering spinners.
 * - Starts playing immediately like an authentic video game prologue.
 * - Respects browser audio policies: begins muted so it never blocks or fails,
 *   with an unobtrusive sound prompt: [ 🔊 CLICK FOR SOUND ].
 * - Sleek tactical HUD prompt: [ESC / SPACE] SKIP TO COMMAND DECK ❯❯.
 * - Cinematic fade-to-black transition directly into the main game dashboard.
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
  const [skipHover, setSkipHover] = useState(false);
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
    }, 350);
  }, [onClose]);

  // Unmute audio upon user interaction
  const handleEnableAudio = useCallback((e) => {
    if (e) e.stopPropagation();
    const video = videoRef.current;
    if (video) {
      video.muted = false;
      setIsAudioMuted(false);
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

      // Muted autoplay is guaranteed 100% reliable across all modern browsers
      const playPromise = video.play();
      if (playPromise !== undefined) {
        playPromise.catch((err) => {
          console.warn('[CinematicIntro] Autoplay note:', err);
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
        transition={{ duration: 0.5 }}
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 999999,
          background: '#000000',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
          cursor: 'default',
          userSelect: 'none'
        }}
      >
        {/* === Fullscreen Video Cutscene === */}
        <video
          ref={videoRef}
          src="/assets/intro.mp4"
          preload="auto"
          playsInline
          autoPlay
          muted={isAudioMuted}
          onEnded={handleSkipToGame}
          onError={() => {
            console.warn('[CinematicIntro] Stream error, resuming');
            if (videoRef.current) videoRef.current.play().catch(() => {});
          }}
          onWaiting={() => {
            if (videoRef.current) videoRef.current.play().catch(() => {});
          }}
          onStalled={() => {
            if (videoRef.current) videoRef.current.play().catch(() => {});
          }}
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            objectFit: 'contain',
            background: '#000000',
            display: 'block',
            pointerEvents: 'none',
            filter: 'contrast(1.08) saturate(1.18)'
          }}
        />

        {/* Cinematic Letterbox Vignette Overlay */}
        <div style={{
          position: 'absolute',
          inset: 0,
          pointerEvents: 'none',
          boxShadow: 'inset 0 0 100px rgba(0, 0, 0, 0.8), inset 0 0 40px rgba(0, 240, 255, 0.15)',
          background: 'linear-gradient(180deg, rgba(0,0,0,0.4) 0%, transparent 15%, transparent 85%, rgba(0,0,0,0.6) 100%)'
        }} />

        {/* Top-Left: Game Prologue Watermark */}
        <div style={{
          position: 'absolute',
          top: '1.75rem',
          left: '2rem',
          zIndex: 20,
          pointerEvents: 'none',
          display: 'flex',
          alignItems: 'center',
          gap: '0.65rem',
          fontFamily: 'var(--font-mono)',
          fontSize: '0.8rem',
          letterSpacing: '0.18em',
          color: '#00F0FF',
          textShadow: '0 0 12px rgba(0, 240, 255, 0.6)'
        }}>
          <span style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', background: '#00F0FF', boxShadow: '0 0 8px #00F0FF' }}></span>
          <span>BANANA QUEST // QUANTUM LAB CUTSCENE</span>
        </div>

        {/* Top-Right: Unmute Sound Prompt (If browser started muted) */}
        {isAudioMuted && (
          <motion.button
            onClick={handleEnableAudio}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ scale: 1.05, boxShadow: '0 0 20px rgba(0, 240, 255, 0.6)' }}
            whileTap={{ scale: 0.95 }}
            style={{
              position: 'absolute',
              top: '1.5rem',
              right: '2rem',
              zIndex: 30,
              padding: '0.5rem 1rem',
              borderRadius: '20px',
              background: 'rgba(5, 12, 28, 0.85)',
              border: '1.5px solid #00F0FF',
              color: '#00F0FF',
              fontFamily: 'var(--font-mono)',
              fontSize: '0.8rem',
              fontWeight: 800,
              letterSpacing: '0.08em',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              cursor: 'pointer',
              backdropFilter: 'blur(10px)',
              boxShadow: '0 0 15px rgba(0, 240, 255, 0.3)'
            }}
          >
            <span>🔊</span>
            <span>UNMUTE AUDIO</span>
          </motion.button>
        )}

        {/* Bottom-Right: Gaming HUD Skip Prompt */}
        {!hasEnded && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.4 }}
            style={{
              position: 'absolute',
              bottom: '2rem',
              right: '2.5rem',
              zIndex: 30,
              cursor: 'pointer'
            }}
            onClick={handleSkipToGame}
            onMouseEnter={() => setSkipHover(true)}
            onMouseLeave={() => setSkipHover(false)}
          >
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.65rem',
                padding: '0.65rem 1.35rem',
                background: skipHover ? 'rgba(0, 240, 255, 0.25)' : 'rgba(4, 8, 20, 0.85)',
                backdropFilter: 'blur(16px)',
                border: skipHover ? '1.5px solid #00F0FF' : '1px solid rgba(0, 240, 255, 0.4)',
                borderRadius: '8px',
                boxShadow: skipHover ? '0 0 25px rgba(0, 240, 255, 0.6)' : '0 4px 20px rgba(0, 0, 0, 0.8)',
                transition: 'all 0.2s ease'
              }}
            >
              <kbd style={{
                background: 'rgba(0, 240, 255, 0.2)',
                border: '1px solid #00F0FF',
                color: '#00F0FF',
                padding: '0.2rem 0.55rem',
                borderRadius: '4px',
                fontFamily: 'var(--font-mono)',
                fontSize: '0.75rem',
                fontWeight: 800
              }}>
                ESC
              </kbd>
              <span style={{
                color: '#FFFFFF',
                fontSize: '0.85rem',
                fontWeight: 800,
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                fontFamily: 'var(--font-mono)'
              }}>
                SKIP INTRO ❯❯
              </span>
            </motion.div>
          </motion.div>
        )}
      </motion.div>
    </AnimatePresence>
  );
}
