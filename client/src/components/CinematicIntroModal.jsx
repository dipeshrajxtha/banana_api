/**
 * @file CinematicIntroModal.jsx
 * @description Full-page cinematic intro video screen — plays on first app launch
 * like AAA game intros. Covers the entire viewport with the intro video, a sleek
 * bottom progress bar, and a "Skip Intro" button. When skipped or finished, the
 * user is taken to the main dashboard (not directly into gameplay).
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
    // Auto-skip to dashboard after a brief moment
    setTimeout(() => onClose(), 1200);
  };

  const formatTime = (seconds) => {
    if (isNaN(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
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
          background: '#000',
          display: 'flex',
          flexDirection: 'column',
          cursor: showControls ? 'default' : 'none'
        }}
        onClick={togglePlay}
        onMouseMove={resetControlsTimer}
      >
        {/* Full-Page Video */}
        <video
          ref={videoRef}
          preload="auto"
          playsInline
          onTimeUpdate={handleTimeUpdate}
          onLoadedMetadata={handleLoadedMetadata}
          onEnded={handleVideoEnded}
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            zIndex: 1
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
                background: 'rgba(255, 215, 0, 0.95)',
                color: '#000',
                fontWeight: 800,
                fontSize: '0.9rem',
                padding: '0.6rem 1.2rem',
                borderRadius: '12px',
                border: 'none',
                cursor: 'pointer',
                boxShadow: '0 0 25px rgba(255, 215, 0, 0.5)',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
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
                width: '90px',
                height: '90px',
                borderRadius: '50%',
                background: 'rgba(255, 215, 0, 0.85)',
                color: '#000',
                fontSize: '2.2rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 0 50px rgba(255, 215, 0, 0.6)',
                paddingLeft: '5px'
              }}>
                ▶
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Video Ended Overlay — fades to black then closes */}
        <AnimatePresence>
          {hasEnded && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              style={{
                position: 'absolute',
                inset: 0,
                zIndex: 30,
                background: 'rgba(0, 0, 0, 0.85)',
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
                <div style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>🍌</div>
                <h2 style={{
                  fontSize: '2rem',
                  fontWeight: 900,
                  color: '#FFD700',
                  margin: 0,
                  textShadow: '0 0 30px rgba(255, 215, 0, 0.5)'
                }}>
                  BANANA QUEST
                </h2>
                <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.9rem', marginTop: '0.5rem' }}>
                  Loading dashboard...
                </p>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Bottom Controls Bar — progress bar + skip button */}
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
                background: 'linear-gradient(transparent, rgba(0,0,0,0.85))',
                padding: '3rem 1.5rem 1.5rem 1.5rem',
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
                  height: '6px',
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
                  background: 'linear-gradient(90deg, #FFD700, #F59E0B)',
                  borderRadius: '3px',
                  transition: 'width 0.15s linear',
                  boxShadow: '0 0 8px rgba(255, 215, 0, 0.5)'
                }} />
                {/* Scrubber Thumb */}
                <div style={{
                  position: 'absolute',
                  top: '50%',
                  left: `${progress}%`,
                  transform: 'translate(-50%, -50%)',
                  width: '14px',
                  height: '14px',
                  borderRadius: '50%',
                  background: '#FFD700',
                  boxShadow: '0 0 10px rgba(255, 215, 0, 0.7)',
                  transition: 'left 0.15s linear'
                }} />
              </div>

              {/* Controls Row */}
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                {/* Left: Play/Pause + Mute + Time */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <button
                    onClick={togglePlay}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#fff',
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
                      color: '#fff',
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

                  <span style={{
                    fontFamily: 'monospace',
                    fontSize: '0.85rem',
                    color: 'rgba(255,255,255,0.7)',
                    userSelect: 'none'
                  }}>
                    <span style={{ color: '#FFD700', fontWeight: 700 }}>{formatTime(currentTime)}</span>
                    {' / '}
                    {formatTime(duration)}
                  </span>
                </div>

                {/* Right: Skip Intro Button */}
                <motion.button
                  onClick={onClose}
                  whileHover={{ scale: 1.05, backgroundColor: 'rgba(255, 215, 0, 0.25)' }}
                  whileTap={{ scale: 0.95 }}
                  style={{
                    background: 'rgba(255, 255, 255, 0.1)',
                    border: '1.5px solid rgba(255, 215, 0, 0.6)',
                    color: '#FFD700',
                    fontWeight: 800,
                    fontSize: '0.95rem',
                    padding: '0.55rem 1.5rem',
                    borderRadius: '10px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    letterSpacing: '0.03em',
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
