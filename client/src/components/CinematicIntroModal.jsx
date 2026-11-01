/**
 * @file CinematicIntroModal.jsx
 * @description Master 3D Animated Cinematic Intro Video Player & Feature-Film Experience.
 * Plays the official Banana Quest intro video (intro.mp4) with theater-style overlay,
 * custom play/pause/mute/fullscreen controls, auto-play with sound unmute prompt,
 * and direct transition to gameplay upon video completion or skip.
 * @module client/components/CinematicIntroModal
 * @author Dipesh Raj Shrestha
 * @reference University of Bedfordshire - CIS046-3 Software For Enterprise
 */

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function CinematicIntroModal({ isOpen, onClose, onStartGame, onStartMultiplayer }) {
  const videoRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [hasEnded, setHasEnded] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const containerRef = useRef(null);
  const prevIsOpenRef = useRef(false);
  const onCloseRef = useRef(onClose);

  useEffect(() => {
    onCloseRef.current = onClose;
  });

  // Control video strictly when isOpen changes (does NOT reset on parent re-renders)
  useEffect(() => {
    if (isOpen && !prevIsOpenRef.current) {
      prevIsOpenRef.current = true;
      const video = videoRef.current;
      if (video) {
        video.currentTime = 0;
        setHasEnded(false);
        setIsPlaying(true);
        video.play().catch(() => {
          // Fallback to muted if browser blocks unmuted autoplay
          video.muted = true;
          setIsMuted(true);
          video.play().catch(() => setIsPlaying(false));
        });
      }
    } else if (!isOpen && prevIsOpenRef.current) {
      prevIsOpenRef.current = false;
      if (videoRef.current) {
        videoRef.current.pause();
        videoRef.current.currentTime = 0;
      }
      setHasEnded(false);
    }
  }, [isOpen]);

  // Keyboard shortcut listeners (active only when open)
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onCloseRef.current?.();
      } else if (e.key === ' ' || e.key === 'k') {
        e.preventDefault();
        togglePlay();
      } else if (e.key === 'm') {
        toggleMute();
      } else if (e.key === 'f') {
        toggleFullscreen();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (videoRef.current.paused || videoRef.current.ended) {
      videoRef.current.play();
      setIsPlaying(true);
      setHasEnded(false);
    } else {
      videoRef.current.pause();
      setIsPlaying(false);
    }
  };

  const toggleMute = () => {
    if (!videoRef.current) return;
    videoRef.current.muted = !videoRef.current.muted;
    setIsMuted(videoRef.current.muted);
  };

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration);
    }
  };

  const handleSeek = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const pos = (e.clientX - rect.left) / rect.width;
    if (videoRef.current) {
      videoRef.current.currentTime = pos * duration;
    }
  };

  const handleVideoEnded = () => {
    setIsPlaying(false);
    setHasEnded(true);
  };

  const handleReplay = () => {
    if (videoRef.current) {
      videoRef.current.currentTime = 0;
      videoRef.current.play();
      setIsPlaying(true);
      setHasEnded(false);
    }
  };

  const formatTime = (seconds) => {
    if (isNaN(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 9999,
          background: 'rgba(5, 8, 16, 0.96)',
          backdropFilter: 'blur(20px)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '1.5rem'
        }}
        onClick={(e) => {
          if (e.target === e.currentTarget) onClose();
        }}
      >
        <motion.div
          ref={containerRef}
          initial={{ scale: 0.92, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.92, opacity: 0, y: 20 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          style={{
            width: '100%',
            maxWidth: '1080px',
            background: 'linear-gradient(180deg, rgba(20, 27, 45, 0.98) 0%, rgba(10, 14, 26, 0.98) 100%)',
            borderRadius: '24px',
            border: '2px solid rgba(255, 215, 0, 0.4)',
            boxShadow: '0 0 60px rgba(255, 215, 0, 0.25), 0 25px 50px -12px rgba(0, 0, 0, 0.8)',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            position: 'relative'
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Top Theater Header */}
          <div style={{
            padding: '1rem 1.75rem',
            background: 'rgba(0, 0, 0, 0.5)',
            borderBottom: '1px solid rgba(255, 215, 0, 0.2)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <span style={{ fontSize: '1.8rem' }}>🍌</span>
              <div>
                <h3 style={{
                  fontSize: '1.25rem',
                  fontWeight: 900,
                  margin: 0,
                  letterSpacing: '0.02em',
                  color: '#FFD700',
                  textShadow: '0 0 15px rgba(255, 215, 0, 0.4)'
                }}>
                  BANANA QUEST: THE CINEMATIC INTRO
                </h3>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: 0 }}>
                  Master 3D Animated Sequence // Illumination &amp; DreamWorks Visual Standard
                </p>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <button
                onClick={onClose}
                className="btn-secondary"
                style={{
                  padding: '0.4rem 0.9rem',
                  fontSize: '0.85rem',
                  borderRadius: '10px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem'
                }}
                title="Close intro (Esc)"
              >
                <span>✕</span>
                <span>Close</span>
              </button>
            </div>
          </div>

          {/* Video Container Area */}
          <div style={{
            position: 'relative',
            width: '100%',
            backgroundColor: '#000',
            aspectRatio: '16 / 9',
            maxHeight: '620px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden'
          }}>
            <video
              ref={videoRef}
              src="/assets/intro.mp4"
              preload="auto"
              playsInline
              onTimeUpdate={handleTimeUpdate}
              onLoadedMetadata={handleLoadedMetadata}
              onEnded={handleVideoEnded}
              onClick={togglePlay}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'contain',
                cursor: 'pointer'
              }}
            >
              <source src="/assets/intro.mp4" type="video/mp4" />
              <source src="/assets/WhatsApp Video 2026-11-01 at 11.42.03 AM.mp4" type="video/mp4" />
              Your browser does not support HTML5 video.
            </video>

            {/* Unmute Prompt Banner if autoplay muted */}
            {isMuted && isPlaying && !hasEnded && (
              <motion.button
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                onClick={toggleMute}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                style={{
                  position: 'absolute',
                  top: '1rem',
                  left: '1rem',
                  zIndex: 10,
                  background: 'rgba(245, 158, 11, 0.95)',
                  color: '#000',
                  fontWeight: 800,
                  fontSize: '0.85rem',
                  padding: '0.5rem 1rem',
                  borderRadius: '12px',
                  border: 'none',
                  cursor: 'pointer',
                  boxShadow: '0 0 20px rgba(245, 158, 11, 0.5)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}
              >
                <span>🔊</span>
                <span>Tap to Unmute Audio</span>
              </motion.button>
            )}

            {/* Paused Overlay Button */}
            {!isPlaying && !hasEnded && (
              <motion.button
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                onClick={togglePlay}
                style={{
                  position: 'absolute',
                  zIndex: 5,
                  width: '80px',
                  height: '80px',
                  borderRadius: '50%',
                  background: 'rgba(255, 215, 0, 0.9)',
                  color: '#000',
                  border: 'none',
                  fontSize: '2rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  boxShadow: '0 0 40px rgba(255, 215, 0, 0.6)'
                }}
              >
                ▶
              </motion.button>
            )}

            {/* Video Completed Finish Screen */}
            {hasEnded && (
              <motion.div
                initial={{ opacity: 0, backdropFilter: 'blur(0px)' }}
                animate={{ opacity: 1, backdropFilter: 'blur(8px)' }}
                style={{
                  position: 'absolute',
                  inset: 0,
                  zIndex: 20,
                  background: 'rgba(10, 14, 26, 0.88)',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '1.25rem',
                  padding: '2rem',
                  textAlign: 'center'
                }}
              >
                <div style={{ fontSize: '3.5rem' }}>🍌</div>
                <h2 style={{
                  fontSize: '2.4rem',
                  fontWeight: 900,
                  color: '#FFD700',
                  margin: 0,
                  textShadow: '0 0 25px rgba(255, 215, 0, 0.5)'
                }}>
                  THE QUEST HAS BEGUN!
                </h2>
                <p style={{
                  color: 'var(--text-secondary)',
                  maxWidth: '520px',
                  fontSize: '1rem',
                  lineHeight: 1.5,
                  margin: 0
                }}>
                  You have unlocked the mathematical secret of the Golden Banana.
                  Ready to test your reflexes and conquer the leaderboards?
                </p>

                <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', justifyContent: 'center', marginTop: '0.5rem' }}>
                  <motion.button
                    onClick={() => {
                      onClose();
                      if (onStartGame) onStartGame();
                    }}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="btn-primary"
                    style={{
                      padding: '0.9rem 2rem',
                      fontSize: '1.1rem',
                      fontWeight: 900,
                      boxShadow: '0 0 30px rgba(255, 215, 0, 0.5)'
                    }}
                  >
                    ⚡ PLAY SPEED RUSH (60s)
                  </motion.button>

                  {onStartMultiplayer && (
                    <motion.button
                      onClick={() => {
                        onClose();
                        onStartMultiplayer();
                      }}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="btn-secondary"
                      style={{
                        padding: '0.9rem 1.75rem',
                        fontSize: '1.1rem',
                        fontWeight: 800,
                        borderColor: '#38BDF8',
                        color: '#38BDF8'
                      }}
                    >
                      ⚔️ 1v1 DUEL A FRIEND
                    </motion.button>
                  )}

                  <motion.button
                    onClick={handleReplay}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="btn-secondary"
                    style={{
                      padding: '0.9rem 1.5rem',
                      fontSize: '1rem',
                      fontWeight: 700
                    }}
                  >
                    🔄 Replay Video
                  </motion.button>
                </div>
              </motion.div>
            )}
          </div>

          {/* Interactive Player Controls Bar */}
          <div style={{
            padding: '0.75rem 1.75rem 1.25rem 1.75rem',
            background: 'rgba(10, 14, 26, 0.95)',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.75rem'
          }}>
            {/* Scrubber Bar */}
            <div
              onClick={handleSeek}
              style={{
                width: '100%',
                height: '8px',
                background: 'rgba(255, 255, 255, 0.1)',
                borderRadius: '4px',
                cursor: 'pointer',
                position: 'relative',
                overflow: 'hidden'
              }}
            >
              <div
                style={{
                  height: '100%',
                  width: `${(currentTime / (duration || 1)) * 100}%`,
                  background: 'linear-gradient(90deg, #FFD700 0%, #F59E0B 100%)',
                  borderRadius: '4px',
                  boxShadow: '0 0 10px rgba(255, 215, 0, 0.5)'
                }}
              />
            </div>

            {/* Buttons Row */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <button
                  onClick={togglePlay}
                  className="btn-secondary"
                  style={{ padding: '0.4rem 0.8rem', fontSize: '1rem' }}
                  title="Play / Pause (Space)"
                >
                  {isPlaying ? '⏸' : '▶'}
                </button>

                <button
                  onClick={toggleMute}
                  className="btn-secondary"
                  style={{ padding: '0.4rem 0.8rem', fontSize: '1rem' }}
                  title="Mute / Unmute (M)"
                >
                  {isMuted ? '🔇' : '🔊'}
                </button>

                <div style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.85rem',
                  color: 'var(--text-muted)'
                }}>
                  <span style={{ color: '#FFD700', fontWeight: 700 }}>{formatTime(currentTime)}</span>
                  <span> / </span>
                  <span>{formatTime(duration)}</span>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <button
                  onClick={toggleFullscreen}
                  className="btn-secondary"
                  style={{ padding: '0.4rem 0.8rem', fontSize: '1rem' }}
                  title="Toggle Fullscreen (F)"
                >
                  {isFullscreen ? '⛶ Exit Fullscreen' : '⛶ Fullscreen'}
                </button>

                <motion.button
                  onClick={() => {
                    onClose();
                    if (onStartGame) onStartGame();
                  }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="btn-primary"
                  style={{
                    padding: '0.5rem 1.25rem',
                    fontSize: '0.9rem',
                    fontWeight: 900
                  }}
                >
                  🍌 Skip to Game ⏭
                </motion.button>
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

