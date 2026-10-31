/**
 * @file CinematicIntroModal.jsx
 * @description Master 6-Part Continuous Cinematic Intro Video Player & Interactive Storyboard Reel.
 * Designed to play user-rendered 3D animated video (intro.mp4) or provide a live interactive
 * cinematic preview of the 6-part feature-film sequence matching the Illumination / DreamWorks aesthetic:
 * 1. The Discovery (Lab & Golden Banana)
 * 2. The Mathematical Awakening (Bite, glowing eyes, math puzzle solved)
 * 3. The Code Genesis (Holographic JS coding & Banana Quest UI build)
 * 4. The Cosmic Inspiration (Giant celestial sun banana & transformation)
 * 5. The Scientist & Rocket Launch (Lab coat, rocket build, deep space blastoff)
 * 6. The Grand Finale & Logo Reveal (Cosmic banana collision, particle sweep, interactive menu)
 * @module client/components/CinematicIntroModal
 * @author Dipesh Raj Shrestha
 * @reference University of Bedfordshire - CIS046-3 Software For Enterprise
 */

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const CINEMATIC_CLIPS = [
  {
    id: 1,
    title: 'CLIP 1: THE DISCOVERY',
    subtitle: 'Underground Laboratory // Sector 7',
    icon: '🔬',
    action: 'The main Minion scratches his head at a complex holographic math interface. Suddenly, a second Minion enters and hands him a radiant Golden Banana.',
    dialogue: '“Bello?... Ooh... BANANAAA!”',
    color: '#38BDF8',
    visualStyle: 'linear-gradient(135deg, #091E3A 0%, #172554 50%, #1E3A8A 100%)'
  },
  {
    id: 2,
    title: 'CLIP 2: THE MATHEMATICAL AWAKENING',
    subtitle: 'Cognitive Surge Protocol',
    icon: '⚡',
    action: 'He takes a massive bite. Glowing green equations and golden particles erupt around his head. With lightning reflexes, his hands fly across the holographic board, solving math nodes into place!',
    dialogue: '“Tulaliloo! E = mc² + BANANA!”',
    color: '#10B981',
    visualStyle: 'linear-gradient(135deg, #064E3B 0%, #065F46 50%, #047857 100%)'
  },
  {
    id: 3,
    title: 'CLIP 3: THE CODE GENESIS',
    subtitle: 'Holographic Software Engineering',
    icon: '💻',
    action: 'Taking a second bite, he switches into elite developer focus. Syntax-highlighted JavaScript code reflects in his goggles. He slams the RUN key—the Banana Quest arcade engine boots!',
    dialogue: '“Git push origin master! It compiles!”',
    color: '#8B5CF6',
    visualStyle: 'linear-gradient(135deg, #2E1065 0%, #4C1D95 50%, #5B21B6 100%)'
  },
  {
    id: 4,
    title: 'CLIP 4: THE COSMIC INSPIRATION',
    subtitle: 'Celestial Alignment',
    icon: '☀️',
    action: 'Stepping into the courtyard with a third banana, he looks up. The sun has been replaced by a colossal glowing golden banana in the clouds! Pure determination strikes—he takes a decisive bite.',
    dialogue: '“Holy mother of potassium... it’s glorious.”',
    color: '#F59E0B',
    visualStyle: 'linear-gradient(135deg, #451A03 0%, #78350F 50%, #92400E 100%)'
  },
  {
    id: 5,
    title: 'CLIP 5: THE SCIENTIST & ROCKET LAUNCH',
    subtitle: 'Aerospace Launch Bay // T-Minus Zero',
    icon: '🚀',
    action: 'Golden energy settles, revealing the Minion in a white scientist lab coat over his overalls. He welds a retro-futuristic rocket, climbs into the cockpit, and ignites twin blue plumes into deep space!',
    dialogue: '“3... 2... 1... IGNITION! Pooo-paaaye!”',
    color: '#EF4444',
    visualStyle: 'linear-gradient(135deg, #450A0A 0%, #7F1D1D 50%, #991B1B 100%)'
  },
  {
    id: 6,
    title: 'CLIP 6: THE GRAND FINALE & LOGO REVEAL',
    subtitle: 'Deep Cosmic Starscape',
    icon: '🍌',
    action: 'The rocket touches the cosmic golden banana. It erupts into swirling golden stardust that sweeps across space, reforming into the official 3D BANANA QUEST game title.',
    dialogue: '“BANANA QUEST: MASTER THE MATH!”',
    color: '#FFD700',
    visualStyle: 'linear-gradient(135deg, #0F172A 0%, #1E1B4B 50%, #31104B 100%)'
  }
];

export default function CinematicIntroModal({ isOpen, onClose, onStartGame }) {
  const [activeClipIndex, setActiveClipIndex] = useState(0);
  const [isPlayingSequence, setIsPlayingSequence] = useState(true);
  const [hasVideoFile, setHasVideoFile] = useState(false);
  const [videoSrc, setVideoSrc] = useState('/assets/intro.mp4');
  const videoRef = useRef(null);
  const fileInputRef = useRef(null);

  // Check if a local video asset exists at /assets/intro.mp4
  useEffect(() => {
    if (!isOpen) return;
    const checkVideo = async () => {
      try {
        const res = await fetch('/assets/intro.mp4', { method: 'HEAD' });
        if (res.ok && res.headers.get('content-type')?.includes('video')) {
          setHasVideoFile(true);
        } else {
          setHasVideoFile(false);
        }
      } catch {
        setHasVideoFile(false);
      }
    };
    checkVideo();
  }, [isOpen]);

  // Automatic slideshow for the 6 cinematic clips when no video file is active
  useEffect(() => {
    if (!isOpen || hasVideoFile || !isPlayingSequence) return;

    const clipDurationMs = activeClipIndex === 5 ? 7000 : 4500;
    const timer = setTimeout(() => {
      if (activeClipIndex < CINEMATIC_CLIPS.length - 1) {
        setActiveClipIndex(prev => prev + 1);
      } else {
        setIsPlayingSequence(false);
      }
    }, clipDurationMs);

    return () => clearTimeout(timer);
  }, [isOpen, hasVideoFile, activeClipIndex, isPlayingSequence]);

  // Handle local user video file upload for instant preview testing
  const handleLocalVideoSelect = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setVideoSrc(url);
      setHasVideoFile(true);
      if (videoRef.current) {
        videoRef.current.load();
        videoRef.current.play().catch(() => {});
      }
    }
  };

  const handleSkipOrClose = () => {
    if (onClose) onClose();
  };

  const handleLaunchGame = () => {
    if (onClose) onClose();
    if (onStartGame) onStartGame();
  };

  if (!isOpen) return null;

  const currentClip = CINEMATIC_CLIPS[activeClipIndex];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        background: '#030712',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
        fontFamily: 'var(--font-body)'
      }}
    >
      {/* 2.39:1 Cinematic Letterbox Bars */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: '48px',
        background: '#000',
        zIndex: 10,
        borderBottom: '1px solid rgba(255, 215, 0, 0.2)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 2rem'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <span style={{ fontSize: '1.2rem' }}>🍌</span>
          <span style={{
            fontSize: '0.75rem',
            fontFamily: 'var(--font-mono)',
            letterSpacing: '0.15em',
            color: '#FFD700',
            fontWeight: 800,
            textTransform: 'uppercase'
          }}>
            BANANA QUEST // CINEMATIC INTRO REEL (24 FPS • 4K SCOPE)
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          {/* File selector to drop in rendered video */}
          <input
            type="file"
            accept="video/mp4,video/webm"
            ref={fileInputRef}
            style={{ display: 'none' }}
            onChange={handleLocalVideoSelect}
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="btn-secondary"
            style={{
              padding: '0.3rem 0.75rem',
              fontSize: '0.7rem',
              borderColor: '#FFD700',
              color: '#FFD700'
            }}
            title="Load your rendered MP4 video file from your drive"
          >
            📂 Load Rendered MP4
          </button>

          <button
            onClick={handleSkipOrClose}
            style={{
              background: 'rgba(255, 255, 255, 0.1)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              color: '#FFF',
              padding: '0.3rem 0.9rem',
              borderRadius: '4px',
              fontSize: '0.75rem',
              fontWeight: 700,
              cursor: 'pointer'
            }}
          >
            SKIP INTRO ✕
          </button>
        </div>
      </div>

      <div style={{
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: '48px',
        background: '#000',
        zIndex: 10,
        borderTop: '1px solid rgba(255, 215, 0, 0.2)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 2rem'
      }}>
        <div style={{ fontSize: '0.7rem', color: '#6B7280', fontFamily: 'var(--font-mono)' }}>
          ILLUMINATION / DREAMWORKS FEATURE AESTHETIC // CONTINUOUS MATCH-CUT ARCHITECTURE
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          {CINEMATIC_CLIPS.map((clip, idx) => (
            <button
              key={clip.id}
              onClick={() => {
                setHasVideoFile(false);
                setActiveClipIndex(idx);
                setIsPlayingSequence(true);
              }}
              style={{
                width: '26px',
                height: '8px',
                borderRadius: '4px',
                border: 'none',
                background: activeClipIndex === idx ? '#FFD700' : 'rgba(255,255,255,0.2)',
                cursor: 'pointer',
                transition: 'all 200ms ease'
              }}
              title={clip.title}
            />
          ))}
        </div>
      </div>

      {/* Main Cinematic Viewport */}
      <div style={{
        width: '100%',
        maxWidth: '1280px',
        aspectRatio: '16/9',
        maxHeight: 'calc(100vh - 96px)',
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
        background: '#000',
        boxShadow: '0 0 80px rgba(0,0,0,0.9)'
      }}>
        {hasVideoFile ? (
          /* Real Video Player when MP4 is present */
          <video
            ref={videoRef}
            src={videoSrc}
            autoPlay
            controls
            playsInline
            onEnded={() => setIsPlayingSequence(false)}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        ) : (
          /* Interactive 6-Part Continuous Storyboard Cinema */
          <AnimatePresence mode="wait">
            <motion.div
              key={currentClip.id}
              initial={{ opacity: 0, scale: 1.05 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.6, ease: 'easeInOut' }}
              style={{
                position: 'absolute',
                inset: 0,
                background: currentClip.visualStyle,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                padding: '3rem 4rem',
                overflow: 'hidden'
              }}
            >
              {/* Animated Volumetric Studio Lighting Glow */}
              <div style={{
                position: 'absolute',
                top: '-20%',
                left: '20%',
                width: '600px',
                height: '600px',
                borderRadius: '50%',
                background: `radial-gradient(circle, ${currentClip.color}33 0%, transparent 70%)`,
                filter: 'blur(60px)',
                pointerEvents: 'none'
              }} />

              {/* Floating Golden Particles */}
              <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
                {Array.from({ length: 15 }).map((_, i) => (
                  <motion.div
                    key={i}
                    animate={{
                      y: [0, -100, 0],
                      x: [0, (i % 2 === 0 ? 30 : -30), 0],
                      opacity: [0.2, 0.8, 0.2]
                    }}
                    transition={{
                      duration: 3 + (i % 3),
                      repeat: Infinity,
                      ease: 'easeInOut',
                      delay: i * 0.2
                    }}
                    style={{
                      position: 'absolute',
                      left: `${(i * 7) % 100}%`,
                      top: `${(i * 11) % 100}%`,
                      width: '6px',
                      height: '6px',
                      borderRadius: '50%',
                      background: '#FFD700',
                      boxShadow: '0 0 10px #FFD700'
                    }}
                  />
                ))}
              </div>

              {/* Top Meta Bar */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', zIndex: 2 }}>
                <div>
                  <div style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    background: 'rgba(0,0,0,0.4)',
                    padding: '0.4rem 0.8rem',
                    borderRadius: '20px',
                    border: `1px solid ${currentClip.color}66`
                  }}>
                    <span style={{ fontSize: '1.2rem' }}>{currentClip.icon}</span>
                    <span style={{
                      color: currentClip.color,
                      fontSize: '0.75rem',
                      fontWeight: 800,
                      letterSpacing: '0.1em'
                    }}>
                      {currentClip.title}
                    </span>
                  </div>
                  <div style={{
                    color: 'rgba(255,255,255,0.7)',
                    fontSize: '0.85rem',
                    marginTop: '0.5rem',
                    fontWeight: 600
                  }}>
                    {currentClip.subtitle}
                  </div>
                </div>

                <div style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.9rem',
                  color: '#FFD700',
                  background: 'rgba(0,0,0,0.6)',
                  padding: '0.4rem 0.8rem',
                  borderRadius: '6px',
                  border: '1px solid rgba(255,215,0,0.3)'
                }}>
                  SCENE 0{currentClip.id} / 06
                </div>
              </div>

              {/* Center Cinematic Narrative Content */}
              <div style={{ maxWidth: '800px', zIndex: 2 }}>
                <motion.div
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.2 }}
                  style={{
                    fontSize: '1.75rem',
                    fontWeight: 800,
                    color: '#FFF',
                    lineHeight: 1.4,
                    textShadow: '0 2px 10px rgba(0,0,0,0.8)'
                  }}
                >
                  {currentClip.action}
                </motion.div>

                {/* Minion Dialogue Callout */}
                <motion.div
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.4 }}
                  style={{
                    display: 'inline-block',
                    marginTop: '1.5rem',
                    padding: '0.75rem 1.5rem',
                    background: 'rgba(0, 0, 0, 0.7)',
                    border: '2px solid #FFD700',
                    borderRadius: '16px',
                    color: '#FFD700',
                    fontSize: '1.1rem',
                    fontWeight: 700,
                    boxShadow: '0 0 25px rgba(255, 215, 0, 0.3)'
                  }}
                >
                  💬 {currentClip.dialogue}
                </motion.div>
              </div>

              {/* Bottom Interactive Transition Controls */}
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                zIndex: 2,
                borderTop: '1px solid rgba(255,255,255,0.1)',
                paddingTop: '1rem'
              }}>
                <div style={{ display: 'flex', gap: '0.75rem' }}>
                  {activeClipIndex > 0 && (
                    <button
                      onClick={() => setActiveClipIndex(prev => prev - 1)}
                      className="btn-secondary"
                      style={{ padding: '0.5rem 1rem', fontSize: '0.8rem' }}
                    >
                      ⏮ Previous Scene
                    </button>
                  )}
                  {activeClipIndex < CINEMATIC_CLIPS.length - 1 ? (
                    <button
                      onClick={() => setActiveClipIndex(prev => prev + 1)}
                      className="btn-primary"
                      style={{ padding: '0.5rem 1.25rem', fontSize: '0.8rem' }}
                    >
                      Next Scene ⏭
                    </button>
                  ) : (
                    <motion.button
                      onClick={handleLaunchGame}
                      whileHover={{ scale: 1.08 }}
                      whileTap={{ scale: 0.95 }}
                      style={{
                        background: 'linear-gradient(135deg, #FFD700 0%, #F59E0B 100%)',
                        color: '#000',
                        fontWeight: 900,
                        fontSize: '1.1rem',
                        padding: '0.75rem 2rem',
                        borderRadius: '10px',
                        border: 'none',
                        cursor: 'pointer',
                        boxShadow: '0 0 30px #FFD700'
                      }}
                    >
                      🍌 PLAY BANANA QUEST NOW!
                    </motion.button>
                  )}
                </div>

                <div style={{
                  fontSize: '0.75rem',
                  color: 'rgba(255,255,255,0.6)',
                  fontFamily: 'var(--font-mono)'
                }}>
                  MATCH-CUT CONTINUITY: 24 FPS CINEMATIC LOCK
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        )}
      </div>
    </motion.div>
  );
}

