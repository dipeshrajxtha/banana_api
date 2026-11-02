/**
 * @file CinematicIntroModal.jsx
 * @description Full-page cinematic intro video screen — plays on first app launch
 * like AAA game intros. Covers the entire viewport with uncropped, crisp video rendering,
 * ambient sci-fi laboratory backlight matching the intro video, bottom progress bar,
 * and a "Skip Intro" button. The timer display is omitted as requested.
 * When skipped or finished, the user is taken smoothly to the dashboard.
 * @module client/components/CinematicIntroModal
 * @author Dipesh Raj Shrestha
 * @reference University of Bedfordshire - CIS046-3 Software For Enterprise
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function CinematicIntroModal({ isOpen, onClose }) {
  const videoRef = useRef(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [hasEnded, setHasEnded] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const hideTimerRef = useRef(null);
  const prevIsOpenRef = useRef(false);

  // Auto-hide controls after 3s of inactivity
  const resetControlsTimer = useCallback(() => {
    setShowControls(true);
    if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    hideTimerRef.current = setTimeout(() => {
      if (isPlaying && !hasEnded) setShowControls(false);
    }, 3000);
  }, [isPlaying, hasEnded]);

  // Start video when modal opens
  useEffect(() => {
    if (isOpen && !prevIsOpenRef.current) {
      prevIsOpenRef.current = true;
      const video = videoRef.current;
      if (video) {
        video.currentTime = 0;
        setHasEnded(false);
        setCurrentTime(0);
        video.play().then(() => {
          setIsPlaying(true);
        }).catch(() => {
          // Browser blocked unmuted autoplay — try muted
          video.muted = true;
          setIsMuted(true);
          video.play().then(() => setIsPlaying(true)).catch(() => setIsPlaying(false));
        });
      }
    } else if (!isOpen && prevIsOpenRef.current) {
      prevIsOpenRef.current = false;
      if (videoRef.current) {
        videoRef.current.pause();
        videoRef.current.currentTime = 0;
      }
      setHasEnded(false);
      setCurrentTime(0);
      setIsPlaying(false);
    }
  }, [isOpen]);

  // Keyboard shortcuts
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' || e.key === 'Enter') {
        e.preventDefault();
        onClose();
      } else if (e.key === ' ' || e.key === 'k') {
        e.preventDefault();
        togglePlay();
      } else if (e.key === 'm') {
        toggleMute();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Mouse move shows controls
  useEffect(() => {
    if (!isOpen) return;
    const handleMouseMove = () => resetControlsTimer();
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [isOpen, resetControlsTimer]);

  // Clean up timer on unmount
  useEffect(() => {
    return () => {
      if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    };
  }, []);

  const togglePlay = () => {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused || video.ended) {
      video.play();
      setIsPlaying(true);
      setHasEnded(false);
    } else {
      video.pause();
      setIsPlaying(false);
    }
  };

  const toggleMute = () => {
    const video = videoRef.current;
    if (!video) return;
    video.muted = !video.muted;
    setIsMuted(video.muted);
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) setCurrentTime(videoRef.current.currentTime);
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current) setDuration(videoRef.current.duration);
  };

  const handleSeek = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const pos = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    if (videoRef.current && duration > 0) {
      videoRef.current.currentTime = pos * duration;
    }
  };

  const handleVideoEnded = () => {
    setIsPlaying(false);
    setHasEnded(true);
    setShowControls(true);
    setTimeout(() => onClose(), 1200);
  };

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

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
          zIndex: 99999,
          background: '#040711',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: showControls ? 'default' : 'none',
          overflow: 'hidden'
        }}
        onClick={togglePlay}
        onMouseMove={resetControlsTimer}
      >
        {/* Ambient Sci-Fi Hologram Backlight Glow (Matching the Video's Teal & Gold Palette) */}
        <div
          style={{
            position: 'absolute',
            width: '85vw',
            height: '65vh',
            background: 'radial-gradient(ellipse at center, rgba(6, 182, 212, 0.28) 0%, rgba(245, 158, 11, 0.12) 45%, transparent 75%)',
            filter: 'blur(90px)',
            pointerEvents: 'none',
            zIndex: 1
          }}
        />

        {/* Crisp Full-Viewport Video Canvas (Contain mode preserves native 1:1 sharp clarity) */}
        <video
          ref={videoRef}
          preload="auto"
          playsInline
          onTimeUpdate={handleTimeUpdate}
          onLoadedMetadata={handleLoadedMetadata}
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
            WebkitBackfaceVisibility: 'hidden',
            backfaceVisibility: 'hidden',
            transform: 'translateZ(0)',
            filter: 'contrast(1.04) saturate(1.08)'
          }}
        >
          <source src="/assets/intro.mp4" type="video/mp4" />
        </video>

        {/* Top-left Unmute Prompt (if autoplay forced muted) */}
        <AnimatePresence>
          {isMuted && isPlaying && !hasEnded && showControls && (
            <motion.button
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              onClick={(e) => { e.stopPropagation(); toggleMute(); }}
              style={{
                position: 'absolute',
                top: '1.5rem',
                left: '1.5rem',
                zIndex: 20,
                background: 'linear-gradient(135deg, #00F0FF 0%, #0284C7 100%)',
                color: '#FFFFFF',
                fontWeight: 800,
                fontSize: '0.9rem',
                padding: '0.6rem 1.25rem',
                borderRadius: '12px',
                border: '1.5px solid #00F0FF',
                cursor: 'pointer',
                boxShadow: '0 0 25px rgba(0, 240, 255, 0.55)',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                letterSpacing: '0.04em'
              }}
            >
              🔊 Tap to Unmute
            </motion.button>
          )}
        </AnimatePresence>

        {/* Paused Center Play Button */}
        <AnimatePresence>
          {!isPlaying && !hasEnded && (
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              style={{
                position: 'absolute',
                inset: 0,
                zIndex: 10,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                pointerEvents: 'none'
              }}
            >
              <div style={{
                width: '88px',
                height: '88px',
                borderRadius: '50%',
                background: 'rgba(0, 240, 255, 0.9)',
                color: '#040711',
                fontSize: '2.2rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 0 45px rgba(0, 240, 255, 0.65)',
                paddingLeft: '5px'
              }}>
                ▶
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Video Ended Overlay */}
        <AnimatePresence>
          {hasEnded && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              style={{
                position: 'absolute',
                inset: 0,
                zIndex: 30,
                background: 'rgba(4, 7, 17, 0.92)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '1rem',
                pointerEvents: 'none'
              }}
            >
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.2 }}
                style={{ textAlign: 'center' }}
              >
                <div style={{ fontSize: '3.2rem', marginBottom: '0.5rem' }}>🍌</div>
                <h2 style={{
                  fontSize: '2.2rem',
                  fontWeight: 900,
                  color: '#00F0FF',
                  margin: 0,
                  textShadow: '0 0 35px rgba(0, 240, 255, 0.6)'
                }}>
                  BANANA QUEST
                </h2>
                <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.92rem', marginTop: '0.5rem', fontFamily: 'monospace' }}>
                  Loading quantum dashboard...
                </p>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Bottom Controls Bar — progress bar + skip button (No timer display) */}
        <AnimatePresence>
          {showControls && !hasEnded && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              transition={{ duration: 0.25 }}
              onClick={(e) => e.stopPropagation()}
              style={{
                position: 'absolute',
                bottom: 0,
                left: 0,
                right: 0,
                zIndex: 50,
                background: 'linear-gradient(transparent, rgba(4, 7, 17, 0.95))',
                padding: '3rem 2rem 1.6rem 2rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.75rem'
              }}
            >
              {/* Progress / Scrubber Bar */}
              <div
                onClick={handleSeek}
                style={{
                  width: '100%',
                  height: '5px',
                  background: 'rgba(255, 255, 255, 0.2)',
                  borderRadius: '3px',
                  cursor: 'pointer',
                  position: 'relative',
                  overflow: 'hidden'
                }}
              >
                {/* Buffered / played bar */}
                <div style={{
                  height: '100%',
                  width: `${progress}%`,
                  background: 'linear-gradient(90deg, #00F0FF 0%, #FFD700 100%)',
                  borderRadius: '3px',
                  transition: 'width 0.15s linear',
                  boxShadow: '0 0 10px rgba(0, 240, 255, 0.7)'
                }} />
                {/* Scrubber Thumb */}
                <div style={{
                  position: 'absolute',
                  top: '50%',
                  left: `${progress}%`,
                  transform: 'translate(-50%, -50%)',
                  width: '12px',
                  height: '12px',
                  borderRadius: '50%',
                  background: '#FFD700',
                  boxShadow: '0 0 12px rgba(255, 215, 0, 0.8)',
                  transition: 'left 0.15s linear'
                }} />
              </div>

              {/* Controls Row (Timer removed per request) */}
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                {/* Left: Play/Pause + Mute */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <button
                    onClick={togglePlay}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#00F0FF',
                      fontSize: '1.3rem',
                      cursor: 'pointer',
                      padding: '0.3rem',
                      display: 'flex',
                      alignItems: 'center'
                    }}
                    title="Play / Pause (Space)"
                  >
                    {isPlaying ? '⏸' : '▶️'}
                  </button>

                  <button
                    onClick={toggleMute}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#00F0FF',
                      fontSize: '1.2rem',
                      cursor: 'pointer',
                      padding: '0.3rem',
                      display: 'flex',
                      alignItems: 'center'
                    }}
                    title="Mute / Unmute (M)"
                  >
                    {isMuted ? '🔇' : '🔊'}
                  </button>
                </div>

                {/* Right: Skip Intro Button */}
                <motion.button
                  onClick={onClose}
                  whileHover={{ scale: 1.05, boxShadow: '0 0 25px rgba(255, 215, 0, 0.5)' }}
                  whileTap={{ scale: 0.95 }}
                  style={{
                    background: 'rgba(255, 215, 0, 0.12)',
                    border: '1.5px solid #FFD700',
                    color: '#FFD700',
                    fontWeight: 800,
                    fontSize: '0.95rem',
                    padding: '0.55rem 1.6rem',
                    borderRadius: '10px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    letterSpacing: '0.04em',
                    backdropFilter: 'blur(8px)',
                    transition: 'all 0.2s ease'
                  }}
                >
                  Skip Intro
                  <span style={{ fontSize: '1.1rem' }}>⏭</span>
                </motion.button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </AnimatePresence>
  );
}
