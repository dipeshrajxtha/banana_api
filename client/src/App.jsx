/**
 * @file App.jsx
 * @description Main application shell for Banana Quest (CIS046-3 Software For Enterprise).
 * Orchestrates navigation, expanded arcade modes, virtual identity authentication, dynamic leaderboard,
 * 3D interactive banana hero, and match start intro countdown sequence.
 * @module client/App
 * @author Dipesh Raj Shrestha
 * @reference Marc Conrad - https://marcconrad.com/uob/banana/doc.php
 * @reference University of Bedfordshire - CIS046-3
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { GRADE_TIERS, GAME_MODES } from '@banana-quest/shared';
import PuzzleArena from './components/PuzzleArena.jsx';
import GameOverModal from './components/GameOverModal.jsx';
import IdentityPromptModal from './components/IdentityPromptModal.jsx';
import MatchIntro from './components/MatchIntro.jsx';
import FloatingPoints from './components/FloatingPoints.jsx';
import MinionCenterpiece from './components/MinionCenterpiece.jsx';
import MultiplayerArena from './components/MultiplayerArena.jsx';
import CinematicIntroModal from './components/CinematicIntroModal.jsx';
import { soundService } from './services/soundService.js';
import { eventBus } from './events/eventBus.js';

// Helper to extract room code from any URL format:
// ?room=MIN-8652, /room=MIN-8652, /room/MIN-8652, /MIN-8652, #room=MIN-8652
function extractRoomCodeFromUrl() {
  if (typeof window === 'undefined') return null;

  // 1. Search Query Parameters (?room=XYZ or ?r=XYZ)
  try {
    const params = new URLSearchParams(window.location.search);
    const qRoom = params.get('room') || params.get('r');
    if (qRoom && qRoom.trim()) return qRoom.trim().toUpperCase();
  } catch {}

  // 2. Pathname (/room=XYZ, /room/XYZ, /rooms/XYZ, /MIN-XXXX)
  try {
    const pathname = window.location.pathname || '';
    const roomPrefixMatch = pathname.match(/(?:room|rooms)[\/=:]([A-Za-z0-9_-]+)/i);
    if (roomPrefixMatch && roomPrefixMatch[1]) {
      return roomPrefixMatch[1].trim().toUpperCase();
    }
    const minCodeMatch = pathname.match(/\b(MIN-[A-Za-z0-9]+)\b/i);
    if (minCodeMatch && minCodeMatch[1]) {
      return minCodeMatch[1].trim().toUpperCase();
    }
  } catch {}

  // 3. Hash fragment (#room=XYZ or #MIN-XXXX)
  try {
    const hash = window.location.hash || '';
    const hashMatch = hash.match(/(?:room|rooms)[\/=:]([A-Za-z0-9_-]+)|\b(MIN-[A-Za-z0-9]+)\b/i);
    if (hashMatch) {
      return (hashMatch[1] || hashMatch[2]).trim().toUpperCase();
    }
  } catch {}

  return null;
}

export default function App() {
  const [activeTab, setActiveTab] = useState('welcome');
  const [currentUser, setCurrentUser] = useState(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  // Auto-show cinematic intro on first visit (once per session)
  const [showCinematicModal, setShowCinematicModal] = useState(() => {
    // Don't show intro if user is joining a multiplayer room via URL
    if (extractRoomCodeFromUrl()) return false;
    // Show only if this is the first visit in this browser session
    try {
      const seen = sessionStorage.getItem('banana_intro_seen');
      return !seen;
    } catch { return false; }
  });
  const [pendingGameMode, setPendingGameMode] = useState(null);

  // Audio & Event-Driven Engine State
  const [isMuted, setIsMuted] = useState(soundService.isMuted);
  const [busEvents, setBusEvents] = useState([]);

  // Active Gameplay State
  const [activeGameMode, setActiveGameMode] = useState(null);
  const [gameOverStats, setGameOverStats] = useState(null);

  // Match Intro State
  const [showIntro, setShowIntro] = useState(false);
  const [introMode, setIntroMode] = useState(null);

  // Multiplayer 1v1 Room Battle State
  const [multiplayerRoomId, setMultiplayerRoomId] = useState(() => extractRoomCodeFromUrl());
  const [isMultiplayerActive, setIsMultiplayerActive] = useState(() => Boolean(extractRoomCodeFromUrl()));

  // Listen for browser navigation / popstate URL changes
  useEffect(() => {
    const handleUrlChange = () => {
      const detectedRoom = extractRoomCodeFromUrl();
      if (detectedRoom) {
        setMultiplayerRoomId(detectedRoom);
        setIsMultiplayerActive(true);
      }
    };

    window.addEventListener('popstate', handleUrlChange);
    return () => window.removeEventListener('popstate', handleUrlChange);
  }, []);

  // Architecture telemetry state
  const [telemetryData, setTelemetryData] = useState(null);
  const [telemetryLoading, setTelemetryLoading] = useState(false);

  // Global Leaderboard State
  const [leaderboardMode, setLeaderboardMode] = useState(GAME_MODES.SPEED_RUSH);
  const [leaderboardRows, setLeaderboardRows] = useState([]);
  const [leaderboardLoading, setLeaderboardLoading] = useState(false);

  // Bind Web Audio API synthesizer to EventBus on mount
  useEffect(() => {
    soundService.bindToEventBus();

    let interval = null;
    if (activeTab === 'architecture') {
      interval = setInterval(() => {
        setBusEvents(eventBus.getHistory());
      }, 1000);
    }

    return () => {
      soundService.unbindEventBus();
      if (interval) clearInterval(interval);
    };
  }, [activeTab]);

  // Check for active session cookie on application mount
  useEffect(() => {
    fetch('/api/auth/me')
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        if (data?.user) setCurrentUser(data.user);
      })
      .catch(() => {
        // Guest mode by default
      });
  }, []);

  // Fetch leaderboard data when tab or selected mode changes
  const fetchLeaderboard = async (mode = leaderboardMode) => {
    try {
      setLeaderboardLoading(true);
      const res = await fetch(`/api/scores/leaderboard?mode=${mode}`);
      if (res.ok) {
        const data = await res.json();
        setLeaderboardRows(data.leaderboard || []);
      }
    } catch (err) {
      console.warn('Leaderboard fetch note:', err);
    } finally {
      setLeaderboardLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'leaderboard') {
      fetchLeaderboard(leaderboardMode);
    }
  }, [activeTab, leaderboardMode]);

  const handleToggleAudio = () => {
    const nextState = soundService.toggleMute();
    setIsMuted(nextState);
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      setCurrentUser(null);
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  // Virtual Identity Gating: Must be signed in (Google or Guest) to play
  const handleStartGame = (mode) => {
    if (!currentUser) {
      setPendingGameMode(mode);
      setShowAuthModal(true);
      return;
    }
    setGameOverStats(null);
    setShowIntro(false);
    setActiveGameMode(mode); // Immediate launch without 1-second countdown delay
  };

  const handleIntroComplete = () => {
    setShowIntro(false);
    setActiveGameMode(introMode);
    setIntroMode(null);
  };

  const handleFetchTelemetry = async () => {
    try {
      setTelemetryLoading(true);
      const res = await fetch('/api/banana/telemetry');
      if (res.ok) {
        const data = await res.json();
        setTelemetryData(data);
      }
    } catch (err) {
      console.error('Telemetry error:', err);
    } finally {
      setTelemetryLoading(false);
    }
  };

  // Mode card configurations — Authentic Minion Lab Trials
  const modeCards = [
    {
      mode: GAME_MODES.SPEED_RUSH,
      icon: '⚡', name: 'Stuart’s Speed Rush',
      sub: '60-Second Overdrive Sprint',
      color: 'var(--accent-purple)',
      desc: 'Race against the 60-second lab clock! Stuart’s equation sprint awards exponential multiplier streaks for consecutive correct answers.',
      btnClass: 'btn-primary',
      btnLabel: '⚡ Launch Speed Rush'
    },
    {
      mode: GAME_MODES.SURVIVAL,
      icon: '🛡️', name: 'Kevin’s Survival Protocol',
      sub: '3 Banana Hearts • Unlimited Time',
      color: 'var(--accent-rose)',
      desc: 'Sudden-death endurance trial directed by Kevin. You have 3 lives and unlimited calculation time. Think carefully—each error costs one life!',
      btnClass: 'btn-secondary',
      btnLabel: '🛡️ Launch Survival'
    },
    {
      mode: GAME_MODES.STREAK_MASTER,
      icon: '🎯', name: 'Bob’s Perfect 10',
      sub: '1 Life • Flawless 10-Win Target',
      color: 'var(--accent-gold)',
      desc: 'High-stakes precision run with Bob! You have only 1 life. Achieve 10 consecutive correct answers to claim the Golden Trophy.',
      btnClass: 'btn-secondary',
      btnLabel: '🎯 Launch Perfect 10'
    },
    {
      mode: GAME_MODES.TIME_ATTACK,
      icon: '🚀', name: 'Otto’s Rocket Sprint',
      sub: '90s Max • Solve 10 Equations Fast',
      color: 'var(--accent-cyan)',
      desc: 'Fuel Otto’s retro rocket ship! Solve 10 math equations as fast as possible to maximize your lightning velocity bonuses.',
      btnClass: 'btn-secondary',
      btnLabel: '🚀 Launch Rocket Sprint'
    },
    {
      mode: GAME_MODES.PRACTICE,
      icon: '🧘', name: 'Zen Banana Break',
      sub: 'Casual • Unlimited Lives & Time',
      color: 'var(--accent-emerald)',
      desc: 'Relaxed laboratory training session in the Minion break room. Unlimited equations, no pressure, zero penalties. Perfect for warm-ups.',
      btnClass: 'btn-secondary',
      btnLabel: '🧘 Enter Break Room'
    }
  ];

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Match Start Intro Countdown Overlay */}
      <AnimatePresence>
        {showIntro && introMode && (
          <MatchIntro
            key="match-intro"
            gameMode={introMode}
            onComplete={handleIntroComplete}
          />
        )}
      </AnimatePresence>

      {/* Full-Page Cinematic Intro Video (plays on first visit) */}
      <CinematicIntroModal
        isOpen={showCinematicModal}
        onClose={() => {
          setShowCinematicModal(false);
          try { sessionStorage.setItem('banana_intro_seen', '1'); } catch {}
        }}
      />

      {/* Top Cyber Navigation Bar (Game HUD Style) */}
      <header style={{
        borderBottom: '1px solid rgba(0, 240, 255, 0.25)',
        background: 'rgba(4, 7, 18, 0.94)',
        backdropFilter: 'blur(20px)',
        position: 'sticky',
        top: 0,
        zIndex: 50,
        boxShadow: '0 4px 30px rgba(0, 0, 0, 0.8), 0 0 20px rgba(0, 240, 255, 0.08)'
      }}>
        <div style={{
          maxWidth: '1240px',
          margin: '0 auto',
          padding: '0.85rem 1.5rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '1rem',
          flexWrap: 'wrap'
        }}>
          {/* Logo & Unit Branding */}
          <motion.div
            onClick={() => { setActiveGameMode(null); setActiveTab('welcome'); }}
            style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer', flexShrink: 0 }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <motion.div
              animate={{ rotate: [0, -10, 10, -5, 5, 0], scale: [1, 1.08, 1] }}
              transition={{ repeat: Infinity, duration: 3, repeatDelay: 4 }}
              style={{
                fontSize: '1.9rem',
                filter: 'drop-shadow(0 0 12px rgba(0, 240, 255, 0.6))'
              }}
            >
              🍌
            </motion.div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <h1 style={{
                  fontSize: '1.25rem',
                  fontWeight: 900,
                  letterSpacing: '0.04em',
                  margin: 0,
                  color: '#FFFFFF',
                  fontFamily: 'var(--font-display)'
                }}>
                  BANANA <span style={{
                    background: 'linear-gradient(135deg, #00F0FF 0%, #FFD700 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent'
                  }}>QUEST</span>
                </h1>
                <span className="cyber-badge" style={{ fontSize: '0.65rem', padding: '0.15rem 0.45rem' }}>MK-IV</span>
              </div>
              <p style={{ fontSize: '0.72rem', color: '#38BDF8', margin: 0, fontFamily: 'var(--font-mono)', letterSpacing: '0.06em' }}>
                QUANTUM LAB // CIS046-3
              </p>
            </div>
          </motion.div>

          {/* Navigation Links — High-Tech Gaming HUD Tabs */}
          <nav style={{ display: 'flex', gap: '0.45rem', alignItems: 'center', flexWrap: 'wrap', justifyContent: 'center' }}>
            {[
              { id: 'welcome', label: 'COMMAND DECK', icon: '⚡' },
              { id: 'modes', label: 'MISSION MODES', icon: '🎮' },
              { id: 'leaderboard', label: 'GLOBAL PODIUM', icon: '🏆' },
              { id: 'architecture', label: 'TELEMETRY', icon: '🔬' }
            ].map(tab => {
              const isActive = activeTab === tab.id && !activeGameMode;
              return (
                <motion.button
                  key={tab.id}
                  onClick={() => {
                    setActiveGameMode(null);
                    setActiveTab(tab.id);
                    if (tab.id === 'architecture') {
                      handleFetchTelemetry();
                      setBusEvents(eventBus.getHistory());
                    }
                  }}
                  whileHover={{ scale: 1.04 }}
                  whileTap={{ scale: 0.96 }}
                  style={{
                    padding: '0.45rem 0.85rem',
                    fontSize: '0.8rem',
                    fontFamily: 'var(--font-mono)',
                    fontWeight: 700,
                    letterSpacing: '0.05em',
                    borderRadius: '6px',
                    border: isActive ? '1px solid #00F0FF' : '1px solid rgba(255, 255, 255, 0.08)',
                    background: isActive ? 'rgba(0, 240, 255, 0.15)' : 'rgba(255, 255, 255, 0.03)',
                    color: isActive ? '#00F0FF' : 'rgba(255, 255, 255, 0.7)',
                    boxShadow: isActive ? '0 0 15px rgba(0, 240, 255, 0.3)' : 'none',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.4rem',
                    transition: 'all 0.2s ease',
                    whiteSpace: 'nowrap'
                  }}
                >
                  <span style={{ fontSize: '0.9rem' }}>{tab.icon}</span>
                  <span>{tab.label}</span>
                </motion.button>
              );
            })}

            {/* Replay Cinematic Cutscene Button */}
            <motion.button
              onClick={() => setShowCinematicModal(true)}
              whileHover={{ scale: 1.05, boxShadow: '0 0 20px rgba(0, 240, 255, 0.5)' }}
              whileTap={{ scale: 0.95 }}
              style={{
                padding: '0.45rem 0.9rem',
                fontSize: '0.8rem',
                fontFamily: 'var(--font-mono)',
                fontWeight: 800,
                letterSpacing: '0.05em',
                borderRadius: '6px',
                border: '1.5px solid #00F0FF',
                color: '#00F0FF',
                background: 'rgba(0, 240, 255, 0.1)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.45rem',
                boxShadow: '0 0 12px rgba(0, 240, 255, 0.25)',
                transition: 'all 0.2s ease',
                whiteSpace: 'nowrap'
              }}
              title="Watch the official 3D animated cinematic intro cutscene"
            >
              <span>🎬</span>
              <span>PLAY INTRO</span>
            </motion.button>
          </nav>

          {/* Audio Controls & Virtual Identity (Theme 2 & 4) */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', flexWrap: 'wrap', justifyContent: 'flex-end', flexShrink: 0 }}>
            {/* Native Web Audio API Mute Toggle */}
            <motion.button
              onClick={handleToggleAudio}
              whileTap={{ scale: 0.92 }}
              style={{
                padding: '0.4rem 0.75rem',
                fontSize: '0.78rem',
                fontFamily: 'var(--font-mono)',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                borderRadius: '6px',
                border: isMuted ? '1px solid rgba(255, 255, 255, 0.15)' : '1px solid rgba(0, 240, 255, 0.4)',
                background: isMuted ? 'rgba(255, 255, 255, 0.03)' : 'rgba(0, 240, 255, 0.08)',
                color: isMuted ? 'rgba(255, 255, 255, 0.5)' : '#00F0FF',
                cursor: 'pointer'
              }}
              title={isMuted ? 'Unmute Sound Effects' : 'Mute Sound Effects'}
            >
              <span>{isMuted ? '🔇' : '🔊'}</span>
              <span>{isMuted ? 'MUTED' : 'SYNTH ON'}</span>
            </motion.button>

            {currentUser ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.3rem 0.65rem',
                  borderRadius: '20px',
                  background: 'rgba(0, 240, 255, 0.08)',
                  border: '1px solid rgba(0, 240, 255, 0.3)'
                }}>
                  {currentUser.avatarUrl ? (
                    <img
                      src={currentUser.avatarUrl}
                      alt={currentUser.username}
                      style={{ width: '28px', height: '28px', borderRadius: '50%', border: '1.5px solid #00F0FF' }}
                    />
                  ) : (
                    <div style={{
                      width: '28px',
                      height: '28px',
                      borderRadius: '50%',
                      background: 'linear-gradient(135deg, #00F0FF, #0284C7)',
                      color: '#000',
                      fontWeight: 900,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '0.85rem'
                    }}>
                      {currentUser.username.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div style={{ textAlign: 'left' }}>
                    <div style={{ fontSize: '0.82rem', fontWeight: 800, color: '#FFFFFF', lineHeight: 1.1 }}>{currentUser.username}</div>
                    <div style={{ fontSize: '0.65rem', color: '#38BDF8', fontFamily: 'var(--font-mono)' }}>
                      {currentUser.authProvider === 'google' ? 'GOOGLE IDENTITY' : 'VIRTUAL GUEST'}
                    </div>
                  </div>
                </div>

                <button
                  onClick={handleLogout}
                  style={{
                    padding: '0.35rem 0.75rem',
                    fontSize: '0.75rem',
                    borderRadius: '6px',
                    border: '1px solid rgba(239, 68, 68, 0.4)',
                    background: 'rgba(239, 68, 68, 0.1)',
                    color: '#FCA5A5',
                    cursor: 'pointer',
                    fontWeight: 700
                  }}
                >
                  LOGOUT
                </button>
              </div>
            ) : (
              <motion.button
                onClick={() => setShowAuthModal(true)}
                whileHover={{ scale: 1.05, boxShadow: '0 0 20px rgba(0, 240, 255, 0.5)' }}
                whileTap={{ scale: 0.95 }}
                style={{
                  padding: '0.45rem 1.15rem',
                  fontSize: '0.82rem',
                  fontWeight: 800,
                  fontFamily: 'var(--font-mono)',
                  letterSpacing: '0.05em',
                  borderRadius: '6px',
                  border: '1.5px solid #00F0FF',
                  background: 'linear-gradient(135deg, rgba(0, 240, 255, 0.2) 0%, rgba(2, 132, 199, 0.2) 100%)',
                  color: '#00F0FF',
                  cursor: 'pointer'
                }}
              >
                🔐 SIGN IN / GUEST
              </motion.button>
            )}
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main style={{ flex: 1, maxWidth: '1200px', width: '100%', margin: '0 auto', padding: '2.5rem 1.5rem' }}>
        {/* Active Multiplayer 1v1 Room Battle View */}
        {isMultiplayerActive ? (
          <MultiplayerArena
            currentUser={currentUser}
            initialRoomId={multiplayerRoomId}
            onQuit={() => {
              setIsMultiplayerActive(false);
              setMultiplayerRoomId(null);
              window.history.replaceState({}, '', window.location.pathname);
            }}
          />
        ) : (
          /* Active Single-Player Arcade Mode View */
          <AnimatePresence mode="wait">
            {activeGameMode ? (
              <motion.div
                key="arena"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
              >
                <PuzzleArena
                  gameMode={activeGameMode}
                  onGameOver={(stats) => {
                    setGameOverStats(stats);
                    setActiveGameMode(null);
                  }}
                  onQuit={() => setActiveGameMode(null)}
                />
              </motion.div>
            ) : (
              <>
                {/* Tab: Welcome & Home */}
                {activeTab === 'welcome' && (
                  <motion.div
                    key="welcome"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4 }}
                  >
                    {/* Hero Section */}
                    <div className="glass-panel" style={{
                      padding: '3rem 2.5rem',
                      marginBottom: '2.5rem',
                      textAlign: 'center',
                      position: 'relative',
                      overflow: 'hidden'
                    }}>
                      {/* Cyber-Minion Quantum Scientist Centerpiece (Direct Video Model Match) */}
                      <MinionCenterpiece />

                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.5rem',
                          padding: '0.35rem 0.95rem',
                          borderRadius: 'var(--radius-full)',
                          background: 'rgba(0, 240, 255, 0.1)',
                          border: '1px solid rgba(0, 240, 255, 0.4)',
                          boxShadow: '0 0 15px rgba(0, 240, 255, 0.2)',
                          marginBottom: '1.25rem'
                        }}
                      >
                        <span style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', background: '#00F0FF', boxShadow: '0 0 8px #00F0FF' }}></span>
                        <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#00F0FF', textTransform: 'uppercase', letterSpacing: '0.08em', fontFamily: 'var(--font-mono)' }}>
                          CIS046-3 QUANTUM LAB // 5 ARCADE MODES ONLINE
                        </span>
                      </motion.div>

                      <motion.h2
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        style={{ fontSize: '3rem', fontWeight: 900, marginBottom: '1rem', lineHeight: 1.15 }}
                      >
                        Quantum Math Lab. <span className="text-gradient-gold">Conquer the Quest.</span>
                      </motion.h2>

                      <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.4 }}
                        style={{ maxWidth: '650px', margin: '0 auto 2rem auto', fontSize: '1.1rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}
                      >
                        An enterprise, event-driven cognitive arcade game powered by the University of Bedfordshire Banana API.
                        {currentUser
                          ? ` Welcome, ${currentUser.username}! Ready to prove your mathematical reflexes?`
                          : ' Sign in with Google or join as a Guest to record your high scores and climb the Global Hall of Fame.'}
                      </motion.p>

                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.5 }}
                        style={{
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '1rem',
                          alignItems: 'center',
                          maxWidth: '780px',
                          margin: '0 auto'
                        }}
                      >
                        {/* Primary Flagship Actions (1v1 Duel & Cinema Intro) */}
                        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap', width: '100%' }}>
                          <motion.button
                            onClick={() => setIsMultiplayerActive(true)}
                            className="btn-primary"
                            whileHover={{ scale: 1.04, boxShadow: '0 0 35px rgba(0, 240, 255, 0.8)' }}
                            whileTap={{ scale: 0.96 }}
                            style={{
                              flex: '1 1 260px',
                              maxWidth: '360px',
                              fontSize: '1rem',
                              padding: '0.95rem 1.8rem',
                              background: 'linear-gradient(135deg, #00F0FF 0%, #0284C7 50%, #FFD700 100%)',
                              color: '#020617',
                              fontWeight: 900,
                              fontFamily: 'var(--font-mono)',
                              letterSpacing: '0.04em',
                              boxShadow: '0 0 25px rgba(0, 240, 255, 0.5)'
                            }}
                          >
                            ⚔️ 1v1 CYBER DUEL (3/5/7 MIN)
                          </motion.button>

                          <motion.button
                            onClick={() => setShowCinematicModal(true)}
                            className="btn-secondary"
                            whileHover={{ scale: 1.04, boxShadow: '0 0 25px rgba(0, 240, 255, 0.6)' }}
                            whileTap={{ scale: 0.96 }}
                            style={{
                              flex: '1 1 220px',
                              maxWidth: '300px',
                              fontSize: '0.95rem',
                              padding: '0.95rem 1.6rem',
                              fontFamily: 'var(--font-mono)',
                              borderColor: '#00F0FF',
                              color: '#00F0FF',
                              fontWeight: 800,
                              background: 'rgba(0, 240, 255, 0.12)',
                              boxShadow: '0 0 15px rgba(0, 240, 255, 0.25)'
                            }}
                          >
                            🎬 WATCH INTRO CUTSCENE
                          </motion.button>
                        </div>

                        {/* Arcade Modes Grid (Non-overlapping, equal height & structured) */}
                        <div style={{
                          display: 'grid',
                          gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
                          gap: '0.75rem',
                          width: '100%'
                        }}>
                          <motion.button
                            onClick={() => handleStartGame(GAME_MODES.SPEED_RUSH)}
                            whileHover={{ scale: 1.03, borderColor: '#A855F7', boxShadow: '0 0 18px rgba(168, 85, 247, 0.4)' }}
                            whileTap={{ scale: 0.97 }}
                            style={{
                              padding: '0.75rem 0.9rem',
                              borderRadius: '8px',
                              border: '1px solid rgba(168, 85, 247, 0.5)',
                              background: 'rgba(168, 85, 247, 0.08)',
                              color: '#C084FC',
                              fontFamily: 'var(--font-mono)',
                              fontWeight: 800,
                              fontSize: '0.85rem',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: '0.4rem',
                              transition: 'all 0.2s ease'
                            }}
                          >
                            <span>⚡</span> SPEED RUSH (60s)
                          </motion.button>

                          <motion.button
                            onClick={() => handleStartGame(GAME_MODES.SURVIVAL)}
                            whileHover={{ scale: 1.03, borderColor: '#EF4444', boxShadow: '0 0 18px rgba(239, 68, 68, 0.4)' }}
                            whileTap={{ scale: 0.97 }}
                            style={{
                              padding: '0.75rem 0.9rem',
                              borderRadius: '8px',
                              border: '1px solid rgba(239, 68, 68, 0.5)',
                              background: 'rgba(239, 68, 68, 0.08)',
                              color: '#F87171',
                              fontFamily: 'var(--font-mono)',
                              fontWeight: 800,
                              fontSize: '0.85rem',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: '0.4rem',
                              transition: 'all 0.2s ease'
                            }}
                          >
                            <span>🛡️</span> SURVIVAL (3 LIVES)
                          </motion.button>

                          <motion.button
                            onClick={() => handleStartGame(GAME_MODES.STREAK_MASTER)}
                            whileHover={{ scale: 1.03, borderColor: '#FFD700', boxShadow: '0 0 18px rgba(255, 215, 0, 0.4)' }}
                            whileTap={{ scale: 0.97 }}
                            style={{
                              padding: '0.75rem 0.9rem',
                              borderRadius: '8px',
                              border: '1px solid rgba(255, 215, 0, 0.5)',
                              background: 'rgba(255, 215, 0, 0.08)',
                              color: '#FFD700',
                              fontFamily: 'var(--font-mono)',
                              fontWeight: 800,
                              fontSize: '0.85rem',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: '0.4rem',
                              transition: 'all 0.2s ease'
                            }}
                          >
                            <span>🎯</span> PERFECT 10
                          </motion.button>

                          <motion.button
                            onClick={() => handleStartGame(GAME_MODES.PRACTICE)}
                            whileHover={{ scale: 1.03, borderColor: '#10B981', boxShadow: '0 0 18px rgba(16, 185, 129, 0.4)' }}
                            whileTap={{ scale: 0.97 }}
                            style={{
                              padding: '0.75rem 0.9rem',
                              borderRadius: '8px',
                              border: '1px solid rgba(16, 185, 129, 0.5)',
                              background: 'rgba(16, 185, 129, 0.08)',
                              color: '#34D399',
                              fontFamily: 'var(--font-mono)',
                              fontWeight: 800,
                              fontSize: '0.85rem',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: '0.4rem',
                              transition: 'all 0.2s ease'
                            }}
                          >
                            <span>🧘</span> ZEN PRACTICE
                          </motion.button>
                        </div>
                      </motion.div>
                    </div>

                    {/* 4 Academic Themes Grid (Sci-Fi Subsystems) */}
                    <div style={{ marginBottom: '2.5rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
                        <h3 style={{ fontSize: '1.4rem', fontWeight: 800, margin: 0, display: 'flex', alignItems: 'center', gap: '0.6rem', color: '#FFFFFF' }}>
                          <span style={{ color: '#00F0FF' }}>⚡</span> ACADEMIC CORE: FOUR MODULE SUBSYSTEMS
                        </h3>
                        <span className="cyber-badge">CIS046-3 ENTERPRISE</span>
                      </div>

                      <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
                        gap: '1.25rem'
                      }}>
                        {[
                          {
                            theme: 'SYSTEM 01 // VERSION CONTROL',
                            badge: 'GITFLOW & MONOREPO',
                            desc: 'Conventional Commits across client, server, and shared workspaces. Milestone release tagging and feature branch isolation.',
                            color: '#00F0FF'
                          },
                          {
                            theme: 'SYSTEM 02 // EVENT-DRIVEN',
                            badge: 'CUSTOM EVENTBUS & SYNTH',
                            desc: 'Decoupled pub/sub event bus architecture, Web Audio API polyphonic sound synthesizer, and 60 FPS animation tick loop.',
                            color: '#A855F7'
                          },
                          {
                            theme: 'SYSTEM 03 // INTEROPERABILITY',
                            badge: 'BANANA API & HMAC',
                            desc: 'Real-time HTTPS communication with Marc Conrad Banana API, offline procedural SVG fallback, and HMAC-SHA256 solution sealing.',
                            color: '#FFD700'
                          },
                          {
                            theme: 'SYSTEM 04 // VIRTUAL IDENTITY',
                            badge: 'GOOGLE OAUTH & GUEST AUTH',
                            desc: 'Federated identity via Google OpenID Connect, Guest virtual sessions, bcrypt hashing, and Role-Based Access Control (RBAC).',
                            color: '#34D399'
                          }
                        ].map((item, index) => (
                          <motion.div
                            key={item.theme}
                            className="cyber-panel"
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 * index }}
                            whileHover={{ scale: 1.03, borderColor: item.color, boxShadow: `0 0 25px ${item.color}40` }}
                            style={{ padding: '1.6rem', display: 'flex', flexDirection: 'column' }}
                          >
                            <div style={{
                              fontSize: '0.72rem',
                              fontWeight: 800,
                              fontFamily: 'var(--font-mono)',
                              textTransform: 'uppercase',
                              color: item.color,
                              marginBottom: '0.5rem',
                              letterSpacing: '0.08em'
                            }}>
                              {item.badge}
                            </div>
                            <h4 style={{ fontSize: '1.05rem', fontWeight: 800, marginBottom: '0.75rem', color: '#FFFFFF', letterSpacing: '0.02em' }}>
                              {item.theme}
                            </h4>
                            <p style={{ fontSize: '0.88rem', color: 'rgba(255, 255, 255, 0.65)', lineHeight: 1.55, flex: 1, margin: 0 }}>
                              {item.desc}
                            </p>
                          </motion.div>
                        ))}
                      </div>
                    </div>

                    {/* Dynamic Player Grading Tiers */}
                    <div>
                      <h3 style={{ fontSize: '1.5rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span>🏆</span> Dynamic Player Grading System (S to D Tier)
                      </h3>
                      <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                        gap: '1rem'
                      }}>
                        {Object.values(GRADE_TIERS).map((tier, index) => (
                          <motion.div
                            key={tier.id}
                            className="glass-panel"
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 0.08 * index }}
                            whileHover={{ scale: 1.05, boxShadow: `0 0 20px ${tier.badgeColor}30` }}
                            style={{
                              padding: '1.25rem',
                              borderTop: `3px solid ${tier.badgeColor}`,
                              textAlign: 'center',
                              cursor: 'default'
                            }}
                          >
                            <div style={{
                              fontSize: '2.5rem',
                              fontWeight: 900,
                              fontFamily: 'var(--font-display)',
                              color: tier.badgeColor,
                              lineHeight: 1
                            }}>
                              {tier.id}
                            </div>
                            <div style={{ fontWeight: 700, fontSize: '1rem', marginTop: '0.5rem', marginBottom: '0.25rem' }}>
                              {tier.name}
                            </div>
                            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                              Min: {tier.minScore} pts | {tier.minAccuracy}% Acc
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* Tab: Game Modes (Expanded 5 Cyber Simulations) */}
                {activeTab === 'modes' && (
                  <motion.div
                    key="modes"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4 }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
                      <div>
                        <h2 style={{ fontSize: '2.2rem', fontWeight: 900, margin: 0, color: '#FFFFFF', letterSpacing: '-0.02em' }}>
                          MISSION <span style={{
                            background: 'linear-gradient(135deg, #00F0FF, #FFD700)',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent'
                          }}>MODES</span>
                        </h2>
                        <p style={{ color: '#38BDF8', margin: '0.35rem 0 0 0', fontFamily: 'var(--font-mono)', fontSize: '0.85rem' }}>
                          AUTHORITATIVE MATH SIMULATIONS // CONNECTED LIVE TO MARC CONRAD BANANA API
                        </p>
                      </div>
                      <span className="cyber-badge" style={{ fontSize: '0.8rem', padding: '0.35rem 0.85rem' }}>
                        ● 5 SIMULATIONS CALIBRATED
                      </span>
                    </div>

                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
                      gap: '1.5rem'
                    }}>
                      {modeCards.map((card, index) => (
                        <motion.div
                          key={card.mode}
                          className="cyber-card"
                          initial={{ opacity: 0, y: 30 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.1 * index, type: 'spring', stiffness: 200 }}
                          whileHover={{
                            scale: 1.03,
                            y: -6,
                            borderColor: card.color,
                            boxShadow: `0 14px 40px rgba(0,0,0,0.8), 0 0 30px ${card.color}35`
                          }}
                          style={{ padding: '2rem', borderTop: `3px solid ${card.color}` }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                            <motion.div
                              whileHover={{ rotate: [0, -10, 10, 0], scale: 1.2 }}
                              transition={{ duration: 0.5 }}
                              style={{
                                fontSize: '2.4rem',
                                filter: `drop-shadow(0 0 15px ${card.color}80)`
                              }}
                            >
                              {card.icon}
                            </motion.div>
                            <span style={{
                              fontFamily: 'var(--font-mono)',
                              fontSize: '0.72rem',
                              fontWeight: 800,
                              color: card.color,
                              padding: '0.2rem 0.6rem',
                              borderRadius: '4px',
                              background: `${card.color}15`,
                              border: `1px solid ${card.color}40`,
                              letterSpacing: '0.05em'
                            }}>
                              {card.sub.toUpperCase()}
                            </span>
                          </div>

                          <h3 style={{ fontSize: '1.4rem', fontWeight: 900, marginBottom: '0.35rem', color: '#FFFFFF' }}>{card.name}</h3>
                          <p style={{ fontSize: '0.88rem', color: 'rgba(255, 255, 255, 0.65)', lineHeight: 1.55, marginBottom: '1.75rem' }}>
                            {card.desc}
                          </p>

                          <motion.button
                            onClick={() => handleStartGame(card.mode)}
                            whileHover={{ scale: 1.03, boxShadow: `0 0 25px ${card.color}60` }}
                            whileTap={{ scale: 0.97 }}
                            style={{
                              width: '100%',
                              padding: '0.85rem',
                              borderRadius: '8px',
                              border: `1.5px solid ${card.color}`,
                              background: `linear-gradient(135deg, ${card.color}25 0%, rgba(5, 8, 22, 0.9) 100%)`,
                              color: '#FFFFFF',
                              fontFamily: 'var(--font-mono)',
                              fontWeight: 800,
                              fontSize: '0.9rem',
                              letterSpacing: '0.05em',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: '0.5rem',
                              boxShadow: `0 0 15px ${card.color}25`
                            }}
                          >
                            <span>▶</span>
                            <span>{card.btnLabel.toUpperCase()}</span>
                          </motion.button>
                        </motion.div>
                      ))}
                    </div>
                  </motion.div>
                )}

                {/* Tab: Global Hall of Fame / Leaderboard */}
                {activeTab === 'leaderboard' && (
                  <motion.div
                    key="leaderboard"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4 }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
                      <div>
                        <h2 style={{ fontSize: '2.2rem', fontWeight: 900, margin: 0, color: '#FFFFFF' }}>
                          GLOBAL <span style={{
                            background: 'linear-gradient(135deg, #FFD700 0%, #00F0FF 100%)',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent'
                          }}>PODIUM</span>
                        </h2>
                        <p style={{ color: '#38BDF8', margin: '0.25rem 0 0 0', fontFamily: 'var(--font-mono)', fontSize: '0.85rem' }}>
                          AUTHORITATIVE SQLITE DATABASE RANKINGS // UPDATED IN REAL-TIME
                        </p>
                      </div>

                      {/* Mode Filter Selector */}
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        {[
                          { id: GAME_MODES.SPEED_RUSH, label: 'SPEED RUSH' },
                          { id: GAME_MODES.SURVIVAL, label: 'SURVIVAL' },
                          { id: GAME_MODES.STREAK_MASTER, label: 'PERFECT 10' },
                          { id: GAME_MODES.TIME_ATTACK, label: 'TIME ATTACK' }
                        ].map(m => {
                          const isSel = leaderboardMode === m.id;
                          return (
                            <motion.button
                              key={m.id}
                              onClick={() => {
                                setLeaderboardMode(m.id);
                                fetchLeaderboard(m.id);
                              }}
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              style={{
                                padding: '0.45rem 0.9rem',
                                fontSize: '0.78rem',
                                fontFamily: 'var(--font-mono)',
                                fontWeight: 800,
                                letterSpacing: '0.04em',
                                borderRadius: '6px',
                                background: isSel ? 'linear-gradient(135deg, #00F0FF, #0284C7)' : 'rgba(255, 255, 255, 0.04)',
                                color: isSel ? '#020617' : 'rgba(255, 255, 255, 0.7)',
                                border: isSel ? '1px solid #00F0FF' : '1px solid rgba(255, 255, 255, 0.1)',
                                boxShadow: isSel ? '0 0 15px rgba(0, 240, 255, 0.4)' : 'none',
                                cursor: 'pointer'
                              }}
                            >
                              {m.label}
                            </motion.button>
                          );
                        })}
                      </div>
                    </div>

                    <div className="cyber-panel" style={{ padding: '1.75rem', overflowX: 'auto' }}>
                      {leaderboardLoading ? (
                        <div style={{ textAlign: 'center', padding: '3.5rem', color: '#00F0FF', fontFamily: 'var(--font-mono)' }}>
                          ⚡ FETCHING AUTHORITATIVE PODIUM DATA...
                        </div>
                      ) : leaderboardRows.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '3.5rem', color: 'rgba(255,255,255,0.6)' }}>
                          <span style={{ fontSize: '3.5rem', filter: 'drop-shadow(0 0 20px #FFD700)' }}>🏆</span>
                          <h3 style={{ fontSize: '1.3rem', marginTop: '1rem', marginBottom: '0.5rem', color: '#FFFFFF', fontWeight: 800 }}>
                            No Verified High Scores in {leaderboardMode} Yet!
                          </h3>
                          <p style={{ fontSize: '0.9rem', maxWidth: '480px', margin: '0 auto 1.5rem auto', color: 'rgba(255,255,255,0.6)' }}>
                            Be the first mathematical solver to conquer this trial and claim the #1 spot on the global podium.
                          </p>
                          <motion.button
                            onClick={() => handleStartGame(leaderboardMode)}
                            whileHover={{ scale: 1.05, boxShadow: '0 0 25px rgba(0, 240, 255, 0.6)' }}
                            whileTap={{ scale: 0.95 }}
                            style={{
                              padding: '0.8rem 1.8rem',
                              borderRadius: '8px',
                              background: 'linear-gradient(135deg, #00F0FF 0%, #0284C7 100%)',
                              color: '#020617',
                              fontWeight: 900,
                              fontFamily: 'var(--font-mono)',
                              border: 'none',
                              cursor: 'pointer'
                            }}
                          >
                            PLAY NOW TO CLAIM #1
                          </motion.button>
                        </div>
                      ) : (
                        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
                          <thead>
                            <tr style={{ borderBottom: '1px solid rgba(0, 240, 255, 0.2)', color: '#38BDF8', fontFamily: 'var(--font-mono)', fontSize: '0.8rem', letterSpacing: '0.05em' }}>
                              <th style={{ padding: '0.85rem 1rem' }}>RANK</th>
                              <th style={{ padding: '0.85rem 1rem' }}>SOLVER</th>
                              <th style={{ padding: '0.85rem 1rem' }}>TIER</th>
                              <th style={{ padding: '0.85rem 1rem' }}>HIGH SCORE</th>
                              <th style={{ padding: '0.85rem 1rem' }}>ACCURACY</th>
                              <th style={{ padding: '0.85rem 1rem' }}>AVG SPEED</th>
                              <th style={{ padding: '0.85rem 1rem' }}>VERIFIED AT</th>
                            </tr>
                          </thead>
                          <tbody>
                            {leaderboardRows.map((row, index) => (
                              <motion.tr
                                key={row.id}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: index * 0.04 }}
                                style={{
                                  borderBottom: '1px solid rgba(255,255,255,0.04)',
                                  background: row.rank === 1 ? 'rgba(255, 215, 0, 0.05)' : 'transparent'
                                }}
                              >
                                <td style={{ padding: '1rem', fontWeight: 900, fontFamily: 'var(--font-mono)', fontSize: '1rem' }}>
                                  {row.rank === 1 ? (
                                    <span style={{ color: '#FFD700', textShadow: '0 0 10px rgba(255,215,0,0.6)' }}>🥇 #1</span>
                                  ) : row.rank === 2 ? (
                                    <span style={{ color: '#E2E8F0' }}>🥈 #2</span>
                                  ) : row.rank === 3 ? (
                                    <span style={{ color: '#F59E0B' }}>🥉 #3</span>
                                  ) : (
                                    <span style={{ color: 'rgba(255,255,255,0.5)' }}>#{row.rank}</span>
                                  )}
                                </td>
                                <td style={{ padding: '1rem' }}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                    {row.avatar_url ? (
                                      <img src={row.avatar_url} alt="" style={{ width: '28px', height: '28px', borderRadius: '50%', border: '1.5px solid #00F0FF' }} />
                                    ) : (
                                      <div style={{
                                        width: '28px',
                                        height: '28px',
                                        borderRadius: '50%',
                                        background: 'linear-gradient(135deg, #00F0FF, #0284C7)',
                                        color: '#020617',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        fontWeight: 900,
                                        fontSize: '0.85rem'
                                      }}>
                                        {row.username.charAt(0)}
                                      </div>
                                    )}
                                    <span style={{ fontWeight: 800, color: '#FFFFFF' }}>{row.username}</span>
                                  </div>
                                </td>
                                <td style={{ padding: '1rem' }}>
                                  <span style={{
                                    fontWeight: 900,
                                    fontFamily: 'var(--font-mono)',
                                    padding: '0.2rem 0.6rem',
                                    borderRadius: '4px',
                                    background: row.grade_tier === 'S' ? 'rgba(255, 215, 0, 0.15)' : 'rgba(0, 240, 255, 0.15)',
                                    color: row.grade_tier === 'S' ? '#FFD700' : row.grade_tier === 'A' ? '#A855F7' : '#00F0FF',
                                    border: row.grade_tier === 'S' ? '1px solid #FFD700' : '1px solid rgba(0, 240, 255, 0.4)'
                                  }}>
                                    {row.grade_tier} TIER
                                  </span>
                                </td>
                                <td style={{ padding: '1rem', fontWeight: 900, fontFamily: 'var(--font-mono)', color: '#FFD700', fontSize: '1.05rem' }}>
                                  {row.high_score.toLocaleString()}
                                </td>
                                <td style={{ padding: '1rem', fontFamily: 'var(--font-mono)', color: '#34D399', fontWeight: 700 }}>
                                  {row.best_accuracy_pct}%
                                </td>
                                <td style={{ padding: '1rem', fontFamily: 'var(--font-mono)', color: '#38BDF8' }}>
                                  {(row.best_avg_time_ms / 1000).toFixed(1)}s
                                </td>
                                <td style={{ padding: '1rem', color: 'rgba(255,255,255,0.4)', fontSize: '0.8rem', fontFamily: 'var(--font-mono)' }}>
                                  {new Date(row.updated_at).toLocaleDateString()}
                                </td>
                              </motion.tr>
                            ))}
                          </tbody>
                        </table>
                      )}
                    </div>
                  </motion.div>
                )}

                {/* Tab: Architecture & Interoperability Diagnostics */}
                {activeTab === 'architecture' && (
                  <motion.div
                    key="architecture"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4 }}
                  >
                    <div style={{ marginBottom: '1.5rem' }}>
                      <h2 style={{ fontSize: '2.2rem', fontWeight: 900, margin: 0, color: '#FFFFFF' }}>
                        SYSTEM <span style={{
                          background: 'linear-gradient(135deg, #00F0FF, #A855F7)',
                          WebkitBackgroundClip: 'text',
                          WebkitTextFillColor: 'transparent'
                        }}>TELEMETRY</span>
                      </h2>
                      <p style={{ color: '#38BDF8', margin: '0.35rem 0 0 0', fontFamily: 'var(--font-mono)', fontSize: '0.85rem' }}>
                        ARCHITECTURAL INTROSPECTION // THEME 2 (EVENT-DRIVEN) &amp; THEME 3 (INTEROPERABILITY)
                      </p>
                    </div>

                    {/* Theme 2: Custom Event Bus Activity Inspector */}
                    <div className="cyber-panel" style={{ padding: '1.75rem', marginBottom: '2rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                        <div>
                          <h4 style={{ fontSize: '1.2rem', fontWeight: 800, margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#FFFFFF' }}>
                            <span style={{ color: '#00F0FF' }}>⚡</span> THEME 2: DECOUPLED CUSTOM EVENTBUS STREAM
                          </h4>
                          <p style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.6)', margin: '0.25rem 0 0 0', fontFamily: 'var(--font-mono)' }}>
                            REAL-TIME AUDIT LOG OF DISPATCHED SIGNALS &amp; WEB AUDIO SYNTHESIZER
                          </p>
                        </div>

                        <button
                          onClick={() => setBusEvents(eventBus.getHistory())}
                          style={{
                            padding: '0.4rem 0.9rem',
                            fontSize: '0.78rem',
                            fontFamily: 'var(--font-mono)',
                            borderRadius: '6px',
                            background: 'rgba(0, 240, 255, 0.1)',
                            border: '1px solid #00F0FF',
                            color: '#00F0FF',
                            fontWeight: 800,
                            cursor: 'pointer'
                          }}
                        >
                          🔄 REFRESH STREAM
                        </button>
                      </div>

                      <div style={{
                        maxHeight: '240px',
                        overflowY: 'auto',
                        background: 'rgba(2, 6, 23, 0.85)',
                        borderRadius: '8px',
                        padding: '1rem',
                        fontFamily: 'var(--font-mono)',
                        fontSize: '0.8rem',
                        border: '1px solid rgba(0, 240, 255, 0.25)',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '0.45rem'
                      }}>
                        {busEvents.length === 0 ? (
                          <div style={{ color: 'rgba(255,255,255,0.4)', textAlign: 'center', padding: '2rem 0' }}>
                            No events dispatched yet. Play a game or press numpad keys to observe live pub/sub messages!
                          </div>
                        ) : (
                          busEvents.map((ev, index) => (
                            <div key={index} style={{ display: 'flex', gap: '1rem', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.04)', paddingBottom: '0.3rem' }}>
                              <span style={{ color: '#38BDF8', fontSize: '0.72rem' }}>
                                {new Date(ev.timestamp).toLocaleTimeString()}
                              </span>
                              <span style={{ color: '#00F0FF', fontWeight: 800 }}>
                                {ev.event}
                              </span>
                              <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.75rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
                                {ev.payload ? JSON.stringify(ev.payload) : '∅'}
                              </span>
                            </div>
                          ))
                        )}
                      </div>
                    </div>

                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
                      gap: '1.5rem',
                      marginBottom: '2rem'
                    }}>
                      {/* Live Banana API Telemetry Widget */}
                      <div className="cyber-panel" style={{ padding: '1.75rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                          <h4 style={{ fontSize: '1.1rem', fontWeight: 800, margin: 0, color: '#FFD700' }}>🍌 MARC CONRAD API TELEMETRY</h4>
                          <button
                            onClick={handleFetchTelemetry}
                            disabled={telemetryLoading}
                            style={{
                              padding: '0.35rem 0.85rem',
                              fontSize: '0.75rem',
                              fontFamily: 'var(--font-mono)',
                              fontWeight: 800,
                              borderRadius: '6px',
                              background: 'rgba(255, 215, 0, 0.1)',
                              border: '1px solid #FFD700',
                              color: '#FFD700',
                              cursor: 'pointer'
                            }}
                          >
                            {telemetryLoading ? 'PINGING...' : 'PING NOW'}
                          </button>
                        </div>

                        {telemetryData ? (
                          <div style={{ fontSize: '0.85rem', display: 'flex', flexDirection: 'column', gap: '0.65rem', fontFamily: 'var(--font-mono)' }}>
                            <div>STATUS: <span style={{ color: '#34D399', fontWeight: 800 }}>{telemetryData.status}</span></div>
                            <div style={{ wordBreak: 'break-all' }}>ENDPOINT: <code style={{ color: '#FFD700' }}>{telemetryData.remoteApiUrl}</code></div>
                            <div>PING LATENCY: <span style={{ fontWeight: 900, color: '#00F0FF' }}>{telemetryData.latencyMs}ms</span></div>
                            <div>FALLBACK GENERATOR: <span style={{ color: '#38BDF8' }}>PROCEDURAL SVG ACTIVE</span></div>
                          </div>
                        ) : (
                          <div style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.5)', fontFamily: 'var(--font-mono)' }}>
                            Click &apos;PING NOW&apos; to measure live HTTPS roundtrip latency to marcconrad.com.
                          </div>
                        )}
                      </div>

                      {/* Cryptographic Protection Card */}
                      <div className="cyber-panel" style={{ padding: '1.75rem' }}>
                        <h4 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: '0.85rem', color: '#00F0FF' }}>
                          🔐 HMAC-SHA256 SOLUTION SEALING
                        </h4>
                        <p style={{ fontSize: '0.88rem', color: 'rgba(255, 255, 255, 0.65)', lineHeight: 1.6, margin: 0 }}>
                          The raw mathematical solution from Marc Conrad&apos;s API is never sent directly to the client browser. Instead, the backend seals it into an HMAC-SHA256 signed token. Verification occurs exclusively on the backend server.
                        </p>
                      </div>
                    </div>
                  </motion.div>
                )}
              </>
            )}
          </AnimatePresence>
        )}
      </main>

      {/* Game Over Modal with Grade Tier Diagnostics & Score Auto-Recording */}
      {gameOverStats && (
        <GameOverModal
          stats={gameOverStats}
          currentUser={currentUser}
          onPlayAgain={() => {
            const mode = gameOverStats.gameMode;
            setGameOverStats(null);
            handleStartGame(mode);
          }}
          onReturnHome={() => {
            setGameOverStats(null);
            setActiveTab('welcome');
          }}
        />
      )}

      {/* Virtual Identity Gating Modal */}
      <IdentityPromptModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onAuthSuccess={(user) => {
          setCurrentUser(user);
          if (pendingGameMode) {
            setGameOverStats(null);
            setIntroMode(pendingGameMode);
            setShowIntro(true);
            setPendingGameMode(null);
          }
        }}
      />

      {/* Footer */}
      <footer style={{
        borderTop: '1px solid var(--border-subtle)',
        background: 'rgba(10, 13, 20, 0.95)',
        padding: '1.5rem',
        textAlign: 'center',
        fontSize: '0.85rem',
        color: 'var(--text-muted)'
      }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>Banana Quest © 2026 Dipesh Raj Shrestha — University of Bedfordshire (CIS046-3)</span>
          <span>Banana API by <a href="http://marcconrad.com/uob/banana/" target="_blank" rel="noreferrer" style={{ color: 'var(--accent-gold)', textDecoration: 'none' }}>Marc Conrad</a></span>
        </div>
      </footer>
    </div>
  );
}
