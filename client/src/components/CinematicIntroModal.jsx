/**
 * @file CinematicIntroModal.jsx
 * @description True AAA Game-Style Cinematic Intro Cutscene.
 * Modeled after modern gaming titles (Cyberpunk 2077, Valorant, Overwatch, Apex Legends):
 * - ZERO video player controls: NO pause button, NO volume button, NO timeline scrubber, NO time labels.
 * - Pure uninterrupted full-screen cinematic cutscene with true cinema letterboxing.
 * - User-interaction gateway ensures 100% unmuted high-fidelity audio without browser restrictions.
 * - Sleek gaming HUD prompt in the corner: "HOLD / PRESS SPACE TO SKIP ❯❯".
 * - Smooth cinematic fade-to-black transition into the Main Command Deck.
 * @module client/components/CinematicIntroModal
 * @author Dipesh Raj Shrestha
 * @reference University of Bedfordshire - CIS046-3 Software For Enterprise
 */

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function CinematicIntroModal({ isOpen, onClose }) {
  const videoRef = useRef(null);
  const [hasStarted, setHasStarted] = useState(false);
  const [hasEnded, setHasEnded] = useState(false);
  const [skipHover, setSkipHover] = useState(false);
  const [showSkipHint, setShowSkipHint] = useState(true);
  const prevIsOpenRef = useRef(false);

  // Play unmuted video once user initiates or when opened
  const startCinematic = () => {
    setHasStarted(true);
    const video = videoRef.current;
    if (video) {
      video.muted = false;
      video.currentTime = 0;
      video.play().catch(() => {
        // Fallback: If browser still blocks unmuted, play muted and allow user to continue
        video.muted = true;
        video.play().catch(() => {});
      });
    }
  };

  // Synchronize playback state on open/close
  useEffect(() => {
    if (isOpen && !prevIsOpenRef.current) {
      prevIsOpenRef.current = true;
      setHasEnded(false);
      // Attempt immediate auto-play
      const video = videoRef.current;
      if (video) {
        video.currentTime = 0;
        video.play().then(() => {
          setHasStarted(true);
        }).catch(() => {
          // Awaiting user gesture splash
          setHasStarted(false);
        });
      }
    } else if (!isOpen && prevIsOpenRef.current) {
      prevIsOpenRef.current = false;
      setHasStarted(false);
      setHasEnded(false);
      if (videoRef.current) {
        videoRef.current.pause();
        videoRef.current.currentTime = 0;
      }
    }
  }, [isOpen]);

  // Global game hotkeys (Space, Enter, Escape) to skip cutscene
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      if (['Space', 'Enter', 'Escape'].includes(e.code)) {
        e.preventDefault();
        handleFinishAndEnter();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  const handleFinishAndEnter = () => {
    setHasEnded(true);
    if (videoRef.current) {
      videoRef.current.pause();
    }
    setTimeout(() => {
      onClose();
    }, 400);
  };

  const handleVideoEnded = () => {
    handleFinishAndEnter();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.6 }}
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 999999,
          background: '#02040A',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
          cursor: 'none' // Hide standard cursor during cutscene like real games
        }}
        onClick={() => {
          if (!hasStarted) startCinematic();
        }}
      >
        {/* Ambient Cinema Lighting Backlight */}
        <div
          style={{
            position: 'absolute',
            width: '90vw',
            height: '70vh',
            background: 'radial-gradient(ellipse at center, rgba(0, 240, 255, 0.22) 0%, rgba(255, 215, 0, 0.08) 45%, transparent 75%)',
            filter: 'blur(100px)',
            pointerEvents: 'none',
            zIndex: 1
          }}
        />

        {/* Video Stage — Pure Cinematic 16:9 Letterbox Presentation (NO CONTROLS) */}
        <video
          ref={videoRef}
          preload="auto"
          playsInline
          onEnded={handleVideoEnded}
          style={{
            width: '100vw',
            height: '100vh',
            maxWidth: '100vw',
            maxHeight: '100vh',
            objectFit: 'contain',
            position: 'relative',
            zIndex: 2,
            imageRendering: 'auto',
            transform: 'translateZ(0)',
            filter: 'contrast(1.05) saturate(1.1)'
          }}
        >
          <source src="/assets/intro.mp4" type="video/mp4" />
        </video>

        {/* ─── AAA GAME START SPLASH (Shown only if browser requires initial user click) ─── */}
        {!hasStarted && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            style={{
              position: 'absolute',
              inset: 0,
              zIndex: 50,
              background: 'radial-gradient(ellipse at center, rgba(5, 8, 20, 0.95) 0%, #02040A 100%)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              gap: '1.5rem',
              userSelect: 'none'
            }}
            onClick={startCinematic}
          >
            {/* Holographic Glowing Crest */}
            <motion.div
              animate={{
                scale: [1, 1.08, 1],
                filter: [
                  'drop-shadow(0 0 25px rgba(0, 240, 255, 0.5))',
                  'drop-shadow(0 0 45px rgba(0, 240, 255, 0.9))',
                  'drop-shadow(0 0 25px rgba(0, 240, 255, 0.5))'
                ]
              }}
              transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
              style={{ fontSize: '4.5rem' }}
            >
              🍌
            </motion.div>

            <div style={{ textAlign: 'center' }}>
              <h1 style={{
                fontSize: '2.8rem',
                fontWeight: 900,
                letterSpacing: '0.15em',
                margin: 0,
                background: 'linear-gradient(135deg, #00F0FF 0%, #FFFFFF 50%, #FFD700 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                textTransform: 'uppercase',
                fontFamily: 'var(--font-display)'
              }}>
                BANANA QUEST
              </h1>
              <p style={{
                color: '#38BDF8',
                fontSize: '0.95rem',
                letterSpacing: '0.25em',
                textTransform: 'uppercase',
                margin: '0.5rem 0 0 0',
                fontFamily: 'var(--font-mono)'
              }}>
                CIS046-3 // QUANTUM LABORATORY CUTSCENE
              </p>
            </div>

            {/* Pulsing Press to Start Button */}
            <motion.div
              animate={{ opacity: [0.6, 1, 0.6] }}
              transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
              style={{
                marginTop: '1.5rem',
                padding: '0.85rem 2.5rem',
                background: 'linear-gradient(135deg, rgba(0, 240, 255, 0.15) 0%, rgba(255, 215, 0, 0.15) 100%)',
                border: '1.5px solid #00F0FF',
                borderRadius: '50px',
                color: '#00F0FF',
                fontWeight: 800,
                fontSize: '1rem',
                letterSpacing: '0.2em',
                textTransform: 'uppercase',
                boxShadow: '0 0 35px rgba(0, 240, 255, 0.4)',
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                fontFamily: 'var(--font-mono)'
              }}
            >
              <span>▶</span>
              <span>CLICK TO INITIALIZE CUTSCENE</span>
            </motion.div>
          </motion.div>
        )}

        {/* ─── REAL GAME HUD SKIP PROMPT (Bottom-Right Discreet Cyber Badge) ─── */}
        {hasStarted && !hasEnded && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1, duration: 0.5 }}
            style={{
              position: 'absolute',
              bottom: '2.5rem',
              right: '3rem',
              zIndex: 30,
              cursor: 'pointer',
              userSelect: 'none'
            }}
            onClick={handleFinishAndEnter}
            onMouseEnter={() => setSkipHover(true)}
            onMouseLeave={() => setSkipHover(false)}
          >
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                padding: '0.65rem 1.4rem',
                background: skipHover ? 'rgba(0, 240, 255, 0.25)' : 'rgba(5, 12, 28, 0.75)',
                backdropFilter: 'blur(12px)',
                border: skipHover ? '1.5px solid #00F0FF' : '1px solid rgba(0, 240, 255, 0.4)',
                borderRadius: '8px',
                boxShadow: skipHover ? '0 0 25px rgba(0, 240, 255, 0.6)' : '0 4px 15px rgba(0, 0, 0, 0.6)',
                transition: 'all 0.2s ease'
              }}
            >
              <kbd style={{
                background: 'rgba(0, 240, 255, 0.2)',
                border: '1px solid #00F0FF',
                color: '#00F0FF',
                padding: '0.2rem 0.6rem',
                borderRadius: '4px',
                fontFamily: 'var(--font-mono)',
                fontSize: '0.75rem',
                fontWeight: 800,
                letterSpacing: '0.05em'
              }}>
                SPACE
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

        {/* ─── Top Discreet Watermark Branding (Real Game Style) ─── */}
        <div style={{
          position: 'absolute',
          top: '2rem',
          left: '2.5rem',
          zIndex: 20,
          pointerEvents: 'none',
          opacity: 0.5,
          fontFamily: 'var(--font-mono)',
          fontSize: '0.75rem',
          letterSpacing: '0.2em',
          color: '#38BDF8',
          textTransform: 'uppercase'
        }}>
          BANANA QUEST // CUTSCENE SEQUENCE
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
