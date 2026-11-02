/**
 * @file CinematicIntroModal.jsx
 * @description True full-screen cinematic intro — like AAA game cutscenes (God of War, The Last of Us, Cyberpunk 2077).
 * ZERO native browser video controls — no scrubber, no timeline, no volume slider, no duration counter.
 * Full-viewport coverage, keyboard skip (ESC), click-anywhere play/pause, smooth HUD overlay.
 * @module client/components/CinematicIntroModal
 * @author Dipesh Raj Shrestha
 * @reference University of Bedfordshire - CIS046-3 Software For Enterprise
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function CinematicIntroModal({ isOpen, onClose }) {
  const videoRef = useRef(null);
  const containerRef = useRef(null);
  const [hasStarted, setHasStarted] = useState(false);
  const [hasEnded, setHasEnded] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [skipHover, setSkipHover] = useState(false);
  const [progress, setProgress] = useState(0);
  const prevIsOpenRef = useRef(false);
  const userPausedRef = useRef(false);
  const endedRef = useRef(false);
  const animFrameRef = useRef(null);

  // Skip / finish the cutscene
  const handleSkip = useCallback(() => {
    if (endedRef.current) return;
    endedRef.current = true;
    setHasEnded(true);
    if (videoRef.current) {
      videoRef.current.pause();
    }
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
    }
    setTimeout(() => onClose(), 300);
  }, [onClose]);

  // Start playback (user gesture required by browsers for unmuted)
  const startPlayback = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    setHasStarted(true);
    userPausedRef.current = false;
    video.muted = false;
    video.play().then(() => {
      setIsPlaying(true);
      setIsPaused(false);
    }).catch(() => {
      // Browser blocked unmuted — fall back to muted autoplay
      video.muted = true;
      video.play().then(() => {
        setIsPlaying(true);
        setIsPaused(false);
      }).catch(() => {});
    });
  }, []);

  // Toggle play/pause on click
  const togglePlayPause = useCallback(() => {
    const video = videoRef.current;
    if (!video || !hasStarted) return;

    if (video.paused) {
      userPausedRef.current = false;
      video.play().then(() => {
        setIsPlaying(true);
        setIsPaused(false);
      }).catch(() => {});
    } else {
      userPausedRef.current = true;
      video.pause();
      setIsPlaying(false);
      setIsPaused(true);
    }
  }, [hasStarted]);

  // Progress bar update via requestAnimationFrame (smooth, no re-renders for timer)
  const updateProgress = useCallback(() => {
    const video = videoRef.current;
    if (video && video.duration && !endedRef.current) {
      setProgress(video.currentTime / video.duration);
    }
    animFrameRef.current = requestAnimationFrame(updateProgress);
  }, []);

  // Synchronize on open/close
  useEffect(() => {
    if (isOpen && !prevIsOpenRef.current) {
      prevIsOpenRef.current = true;
      endedRef.current = false;
      setHasEnded(false);
      setIsPaused(false);
      setProgress(0);
      userPausedRef.current = false;

      const video = videoRef.current;
      if (video) {
        video.currentTime = 0;
        video.muted = false;
        video.play().then(() => {
          setHasStarted(true);
          setIsPlaying(true);
          animFrameRef.current = requestAnimationFrame(updateProgress);
        }).catch(() => {
          // Autoplay blocked — show the start splash
          setHasStarted(false);
          setIsPlaying(false);
        });
      }
    } else if (!isOpen && prevIsOpenRef.current) {
      prevIsOpenRef.current = false;
      setHasStarted(false);
      setHasEnded(false);
      setIsPlaying(false);
      setIsPaused(false);
      setProgress(0);
      userPausedRef.current = false;
      endedRef.current = false;
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      if (videoRef.current) {
        videoRef.current.pause();
        videoRef.current.currentTime = 0;
      }
    }
  }, [isOpen, updateProgress]);

  // Start progress tracking when playback begins
  useEffect(() => {
    if (isPlaying && !animFrameRef.current) {
      animFrameRef.current = requestAnimationFrame(updateProgress);
    }
    return () => {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
        animFrameRef.current = null;
      }
    };
  }, [isPlaying, updateProgress]);

  // Keyboard: ESC = skip, Space = play/pause
  useEffect(() => {
    if (!isOpen) return;

    const handleKey = (e) => {
      if (e.code === 'Escape') {
        e.preventDefault();
        handleSkip();
      } else if (e.code === 'Space') {
        e.preventDefault();
        if (!hasStarted) {
          startPlayback();
        } else {
          togglePlayPause();
        }
      }
    };

    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isOpen, hasStarted, handleSkip, startPlayback, togglePlayPause]);

  // Video ended naturally
  const handleVideoEnded = () => {
    handleSkip();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        ref={containerRef}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.4 }}
        onClick={(e) => {
          // Only toggle if clicking the video area, not the skip button
          if (e.target === containerRef.current || e.target.tagName === 'VIDEO') {
            if (hasStarted) {
              togglePlayPause();
            } else {
              startPlayback();
            }
          }
        }}
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 999999,
          background: '#000',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: hasStarted ? 'pointer' : 'default',
          overflow: 'hidden'
        }}
      >
        {/* === FULL-SCREEN VIDEO (no controls attribute — ever) === */}
        <video
          ref={videoRef}
          src="/assets/intro.mp4"
          preload="auto"
          playsInline
          onEnded={handleVideoEnded}
          onWaiting={() => {
            // Auto-resume if buffering stalls
            if (hasStarted && !userPausedRef.current && videoRef.current) {
              videoRef.current.play().catch(() => {});
            }
          }}
          onStalled={() => {
            if (hasStarted && !userPausedRef.current && videoRef.current) {
              videoRef.current.play().catch(() => {});
            }
          }}
          onCanPlay={() => {
            if (hasStarted && !userPausedRef.current && videoRef.current && videoRef.current.paused) {
              videoRef.current.play().catch(() => {});
            }
          }}
          onPause={() => {
            // Only auto-resume if the user didn't deliberately pause
            if (hasStarted && !endedRef.current && !userPausedRef.current) {
              setTimeout(() => {
                if (videoRef.current && videoRef.current.paused && !userPausedRef.current && !endedRef.current) {
                  videoRef.current.play().catch(() => {});
                }
              }, 100);
            }
          }}
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            objectFit: 'contain',
            background: '#000',
            display: 'block',
            filter: 'contrast(1.06) saturate(1.15) brightness(1.02)',
            transform: 'translateZ(0)',
            pointerEvents: 'none'  // Prevent native video context menu / controls
          }}
        />

        {/* === PAUSED OVERLAY === */}
        <AnimatePresence>
          {isPaused && hasStarted && !hasEnded && (
            <motion.div
              initial={{ opacity: 0, scale: 0.85 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.85 }}
              style={{
                position: 'absolute',
                zIndex: 20,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '80px',
                height: '80px',
                borderRadius: '50%',
                background: 'rgba(0, 0, 0, 0.7)',
                border: '2px solid rgba(255, 255, 255, 0.4)',
                backdropFilter: 'blur(8px)'
              }}
            >
              <span style={{ fontSize: '2rem', color: '#FFF', marginLeft: '4px' }}>▶</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* === START SPLASH (shown when browser blocks autoplay) === */}
        {!hasStarted && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            style={{
              position: 'absolute',
              inset: 0,
              zIndex: 30,
              background: 'radial-gradient(ellipse at center, rgba(5, 12, 28, 0.95) 0%, rgba(0, 0, 0, 0.98) 100%)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '1.5rem',
              cursor: 'pointer',
              userSelect: 'none'
            }}
            onClick={(e) => {
              e.stopPropagation();
              startPlayback();
            }}
          >
            <motion.div
              animate={{
                scale: [1, 1.1, 1],
                filter: [
                  'drop-shadow(0 0 20px rgba(0, 240, 255, 0.5))',
                  'drop-shadow(0 0 40px rgba(0, 240, 255, 0.9))',
                  'drop-shadow(0 0 20px rgba(0, 240, 255, 0.5))'
                ]
              }}
              transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
              style={{ fontSize: '4rem' }}
            >
              🍌
            </motion.div>

            <div style={{ textAlign: 'center' }}>
              <h1 style={{
                fontSize: 'clamp(1.6rem, 4vw, 2.8rem)',
                fontWeight: 900,
                letterSpacing: '0.12em',
                margin: 0,
                background: 'linear-gradient(135deg, #00F0FF 0%, #FFF 50%, #FFD700 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                textTransform: 'uppercase',
                fontFamily: 'var(--font-display)'
              }}>
                BANANA QUEST
              </h1>
              <p style={{
                color: '#38BDF8',
                fontSize: '0.85rem',
                letterSpacing: '0.2em',
                textTransform: 'uppercase',
                margin: '0.5rem 0 0 0',
                fontFamily: 'var(--font-mono)'
              }}>
                CIS046-3 // TAP TO BEGIN CUTSCENE
              </p>
            </div>

            <motion.div
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 1.5, repeat: Infinity }}
              style={{
                marginTop: '1rem',
                padding: '0.7rem 2rem',
                background: 'rgba(0, 240, 255, 0.15)',
                border: '1.5px solid #00F0FF',
                borderRadius: '50px',
                color: '#00F0FF',
                fontWeight: 800,
                fontSize: '0.9rem',
                letterSpacing: '0.15em',
                fontFamily: 'var(--font-mono)'
              }}
            >
              ▶ CLICK ANYWHERE TO PLAY
            </motion.div>
          </motion.div>
        )}

        {/* === BOTTOM HUD: Thin progress line + Skip button === */}
        {!hasEnded && hasStarted && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.3 }}
            style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              zIndex: 25,
              pointerEvents: 'none'
            }}
          >
            {/* Ultra-thin progress line (no time labels, no scrubber — just a clean bar) */}
            <div style={{
              width: '100%',
              height: '3px',
              background: 'rgba(255, 255, 255, 0.15)'
            }}>
              <motion.div
                style={{
                  width: `${progress * 100}%`,
                  height: '100%',
                  background: 'linear-gradient(90deg, #00F0FF, #FFD700)',
                  transition: 'width 0.2s linear'
                }}
              />
            </div>

            {/* Skip button row */}
            <div style={{
              display: 'flex',
              justifyContent: 'flex-end',
              padding: '0.75rem 1.5rem',
              background: 'linear-gradient(transparent, rgba(0, 0, 0, 0.6))',
              pointerEvents: 'auto'
            }}>
              <motion.button
                onClick={(e) => {
                  e.stopPropagation();
                  handleSkip();
                }}
                onMouseEnter={() => setSkipHover(true)}
                onMouseLeave={() => setSkipHover(false)}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.6rem',
                  padding: '0.5rem 1.2rem',
                  background: skipHover ? 'rgba(255, 255, 255, 0.2)' : 'rgba(255, 255, 255, 0.08)',
                  backdropFilter: 'blur(8px)',
                  border: '1px solid rgba(255, 255, 255, 0.3)',
                  borderRadius: '6px',
                  color: '#FFF',
                  fontWeight: 700,
                  fontSize: '0.85rem',
                  letterSpacing: '0.08em',
                  fontFamily: 'var(--font-mono)',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
              >
                <span style={{ fontSize: '0.75rem', opacity: 0.7 }}>ESC</span>
                <span>SKIP INTRO</span>
                <span>❯❯</span>
              </motion.button>
            </div>
          </motion.div>
        )}
      </motion.div>
    </AnimatePresence>
  );
}
