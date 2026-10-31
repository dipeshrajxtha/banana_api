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
import CinematicIntroModal from './components/CinematicIntroModal.jsx';
import { soundService } from './services/soundService.js';
import { eventBus } from './events/eventBus.js';

export default function App() {
  const [activeTab, setActiveTab] = useState('welcome');
  const [currentUser, setCurrentUser] = useState(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
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

  // Cinematic 6-Part Intro State
  const [showCinematicIntro, setShowCinematicIntro] = useState(false);

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

    const interval = setInterval(() => {
      setBusEvents(eventBus.getHistory());
    }, 1000);

    return () => {
      soundService.unbindEventBus();
      clearInterval(interval);
    };
  }, []);

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
    // Show match intro countdown first
    setIntroMode(mode);
    setShowIntro(true);
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

      {/* 6-Part Continuous Cinematic Intro Video Modal */}
      <CinematicIntroModal
        isOpen={showCinematicIntro}
        onClose={() => setShowCinematicIntro(false)}
        onStartGame={() => handleStartGame(GAME_MODES.SPEED_RUSH)}
      />

      {/* Top Navigation Bar */}
      <header style={{
        borderBottom: '1px solid var(--border-subtle)',
        background: 'rgba(10, 13, 20, 0.85)',
        backdropFilter: 'blur(16px)',
        position: 'sticky',
        top: 0,
        zIndex: 50
      }}>
        <div style={{
          maxWidth: '1200px',
          margin: '0 auto',
          padding: '1rem 1.5rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          {/* Logo & Unit Branding */}
          <motion.div
            onClick={() => { setActiveGameMode(null); setActiveTab('welcome'); }}
            style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer' }}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
          >
            <motion.span
              animate={{ rotate: [0, -10, 10, -5, 5, 0] }}
              transition={{ repeat: Infinity, duration: 3, repeatDelay: 5 }}
              style={{ fontSize: '1.8rem' }}
            >
              🍌
            </motion.span>
            <div>
              <h1 style={{ fontSize: '1.25rem', fontWeight: 800, letterSpacing: '-0.02em', margin: 0 }}>
                BANANA <span className="text-gradient-gold">QUEST</span>
              </h1>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: 0 }}>
                CIS046-3 Software For Enterprise
              </p>
            </div>
          </motion.div>

          {/* Navigation Links */}
          <nav style={{ display: 'flex', gap: '0.5rem' }}>
            {['welcome', 'modes', 'leaderboard', 'architecture'].map(tab => (
              <motion.button
                key={tab}
                onClick={() => {
                  setActiveGameMode(null);
                  setActiveTab(tab);
                  if (tab === 'architecture') {
                    handleFetchTelemetry();
                    setBusEvents(eventBus.getHistory());
                  }
                }}
                className="btn-secondary"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                style={{
                  padding: '0.5rem 1rem',
                  fontSize: '0.85rem',
                  borderRadius: 'var(--radius-sm)',
                  background: activeTab === tab && !activeGameMode ? 'var(--bg-tertiary)' : 'transparent',
                  borderColor: activeTab === tab && !activeGameMode ? 'var(--accent-gold)' : 'transparent',
                  color: activeTab === tab && !activeGameMode ? 'var(--accent-gold)' : 'var(--text-secondary)'
                }}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </motion.button>
            ))}
          </nav>

          {/* Audio Controls, Cinematic Intro & Virtual Identity */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            {/* Watch 6-Part Feature Film Cinematic Intro */}
            <motion.button
              onClick={() => setShowCinematicIntro(true)}
              className="btn-secondary"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              style={{
                padding: '0.45rem 0.85rem',
                fontSize: '0.8rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                borderColor: '#FFD700',
                color: '#FFD700',
                background: 'rgba(255, 215, 0, 0.1)'
              }}
              title="Watch 6-Part Continuous Cinematic Intro Video"
            >
              <span>🎬</span>
              <span>Watch Intro</span>
            </motion.button>

            {/* Native Web Audio API Mute Toggle */}
            <motion.button
              onClick={handleToggleAudio}
              className="btn-secondary"
              whileTap={{ scale: 0.9 }}
              style={{
                padding: '0.45rem 0.85rem',
                fontSize: '0.85rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                borderColor: isMuted ? 'var(--border-subtle)' : 'var(--accent-gold)'
              }}
              title={isMuted ? 'Unmute Sound Effects' : 'Mute Sound Effects'}
            >
              <span>{isMuted ? '🔇' : '🔊'}</span>
              <span style={{ fontSize: '0.75rem', color: isMuted ? 'var(--text-muted)' : 'var(--accent-yellow)' }}>
                {isMuted ? 'Muted' : 'Sound ON'}
              </span>
            </motion.button>

            {currentUser ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  {currentUser.avatarUrl ? (
                    <img
                      src={currentUser.avatarUrl}
                      alt={currentUser.username}
                      style={{ width: '36px', height: '36px', borderRadius: '50%', border: '2px solid var(--accent-gold)' }}
                    />
                  ) : (
                    <div style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: '50%',
                      background: 'var(--accent-gold)',
                      color: '#000',
                      fontWeight: 800,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      {currentUser.username.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div style={{ textAlign: 'left' }}>
                    <div style={{ fontSize: '0.85rem', fontWeight: 700 }}>{currentUser.username}</div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                      {currentUser.authProvider === 'google' ? 'Google Account' : 'Guest Identity'}
                    </div>
                  </div>
                </div>

                <button
                  onClick={handleLogout}
                  className="btn-secondary"
                  style={{ padding: '0.4rem 0.85rem', fontSize: '0.8rem' }}
                >
                  Logout
                </button>
              </div>
            ) : (
              <button
                onClick={() => setShowAuthModal(true)}
                className="btn-primary"
                style={{ padding: '0.5rem 1.25rem', fontSize: '0.85rem' }}
              >
                🔐 Sign In / Guest
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main style={{ flex: 1, maxWidth: '1200px', width: '100%', margin: '0 auto', padding: '2.5rem 1.5rem' }}>
        {/* Active Game Mode View */}
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
                    {/* Authentic Minion Scientist Hero Centerpiece */}
                    <MinionCenterpiece onTriggerIntro={() => setShowCinematicIntro(true)} />

                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.2 }}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        padding: '0.35rem 0.85rem',
                        borderRadius: 'var(--radius-full)',
                        background: 'rgba(245, 158, 11, 0.1)',
                        border: '1px solid rgba(245, 158, 11, 0.3)',
                        marginBottom: '1.25rem'
                      }}
                    >
                      <span style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', background: 'var(--accent-emerald)' }}></span>
                      <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--accent-yellow)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        CIS046-3 Enterprise Ready: 5 Arcade Modes Active
                      </span>
                    </motion.div>

                    <motion.h2
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.3 }}
                      style={{ fontSize: '3rem', fontWeight: 900, marginBottom: '1rem', lineHeight: 1.15 }}
                    >
                      Master the Math. <span className="text-gradient-gold">Conquer the Quest.</span>
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
                      style={{ display: 'flex', justifyContent: 'center', gap: '1rem', flexWrap: 'wrap' }}
                    >
                      <motion.button
                        onClick={() => handleStartGame(GAME_MODES.SPEED_RUSH)}
                        className="btn-primary"
                        whileHover={{ scale: 1.05, boxShadow: '0 0 35px var(--accent-gold-glow)' }}
                        whileTap={{ scale: 0.95 }}
                        style={{ fontSize: '1.05rem', padding: '0.9rem 1.75rem' }}
                      >
                        ⚡ Speed Rush (60s)
                      </motion.button>
                      <motion.button
                        onClick={() => handleStartGame(GAME_MODES.SURVIVAL)}
                        className="btn-secondary"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        style={{ fontSize: '1.05rem', padding: '0.9rem 1.75rem' }}
                      >
                        🛡️ Survival Mode (3 Strikes)
                      </motion.button>
                      <motion.button
                        onClick={() => handleStartGame(GAME_MODES.STREAK_MASTER)}
                        className="btn-secondary"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        style={{ fontSize: '1.05rem', padding: '0.9rem 1.75rem', borderColor: 'var(--accent-gold)', color: 'var(--accent-yellow)' }}
                      >
                        🎯 Perfect 10 Streak
                      </motion.button>
                    </motion.div>
                  </div>

                  {/* 4 Academic Themes Grid */}
                  <div style={{ marginBottom: '2.5rem' }}>
                    <h3 style={{ fontSize: '1.5rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span>🏛️</span> Academic Core: The Four Module Themes
                    </h3>
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
                      gap: '1.25rem'
                    }}>
                      {[
                        {
                          theme: 'Theme 1: Version Control',
                          badge: 'Gitflow & Monorepo',
                          desc: 'Granular Conventional Commits across client, server, and shared packages. Feature branching and milestone releases.',
                          color: 'var(--accent-cyan)'
                        },
                        {
                          theme: 'Theme 2: Event-Driven Programming',
                          badge: 'Custom EventBus & Web Audio',
                          desc: 'Decoupled pub/sub event bus, synthesized Web Audio API sound effects, and 60 FPS requestAnimationFrame tick loop.',
                          color: 'var(--accent-purple)'
                        },
                        {
                          theme: 'Theme 3: Interoperability',
                          badge: 'Banana API & GIS',
                          desc: 'RESTful HTTPS communication with Marc Conrad Banana API, offline procedural SVG fallback, and HMAC solution sealing.',
                          color: 'var(--accent-gold)'
                        },
                        {
                          theme: 'Theme 4: Virtual Identity',
                          badge: 'Google OAuth & Guest Auth',
                          desc: 'Federated identity via Google OpenID Connect, Guest virtual identities, bcrypt password hashing, and HttpOnly cookies.',
                          color: 'var(--accent-emerald)'
                        }
                      ].map((item, index) => (
                        <motion.div
                          key={item.theme}
                          className="glass-panel"
                          initial={{ opacity: 0, y: 30 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.1 * index }}
                          whileHover={{ scale: 1.02, borderColor: item.color }}
                          style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column' }}
                        >
                          <div style={{
                            fontSize: '0.75rem',
                            fontWeight: 700,
                            textTransform: 'uppercase',
                            color: item.color,
                            marginBottom: '0.5rem',
                            letterSpacing: '0.05em'
                          }}>
                            {item.badge}
                          </div>
                          <h4 style={{ fontSize: '1.15rem', marginBottom: '0.75rem' }}>{item.theme}</h4>
                          <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.5, flex: 1 }}>
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

              {/* Tab: Game Modes (Expanded 5 Modes) */}
              {activeTab === 'modes' && (
                <motion.div
                  key="modes"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4 }}
                >
                  <h2 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '0.5rem' }}>
                    Select Arcade Challenge Mode
                  </h2>
                  <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>
                    Choose your test parameter. All modes communicate live with Marc Conrad&apos;s Banana API.
                  </p>

                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
                    gap: '1.5rem'
                  }}>
                    {modeCards.map((card, index) => (
                      <motion.div
                        key={card.mode}
                        className="glass-panel mode-card"
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 * index, type: 'spring', stiffness: 200 }}
                        whileHover={{
                          scale: 1.03,
                          y: -4,
                          boxShadow: `0 10px 30px rgba(0,0,0,0.4), 0 0 20px ${card.color}20`
                        }}
                        style={{ padding: '2rem', borderTop: `4px solid ${card.color}` }}
                      >
                        <motion.div
                          whileHover={{ rotate: [0, -10, 10, 0], scale: 1.2 }}
                          transition={{ duration: 0.5 }}
                          style={{ fontSize: '2rem', marginBottom: '0.5rem' }}
                        >
                          {card.icon}
                        </motion.div>
                        <h3 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '0.5rem' }}>{card.name}</h3>
                        <div style={{ fontSize: '0.85rem', color: card.color, fontWeight: 700, marginBottom: '1rem' }}>
                          {card.sub}
                        </div>
                        <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '1.5rem' }}>
                          {card.desc}
                        </p>
                        <motion.button
                          onClick={() => handleStartGame(card.mode)}
                          className={card.btnClass}
                          whileHover={{ scale: 1.03 }}
                          whileTap={{ scale: 0.97 }}
                          style={{
                            width: '100%',
                            padding: '0.85rem',
                            ...(card.btnClass === 'btn-secondary' ? { borderColor: card.color, color: card.color } : {})
                          }}
                        >
                          {card.btnLabel}
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
                      <h2 style={{ fontSize: '2rem', fontWeight: 800, margin: 0 }}>
                        Global Hall of Fame
                      </h2>
                      <p style={{ color: 'var(--text-secondary)', margin: '0.25rem 0 0 0' }}>
                        Top competitive solvers ranked in real time by high score, accuracy, and tier classification.
                      </p>
                    </div>

                    {/* Mode Filter Selector */}
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      {[
                        { id: GAME_MODES.SPEED_RUSH, label: 'Speed Rush' },
                        { id: GAME_MODES.SURVIVAL, label: 'Survival' },
                        { id: GAME_MODES.STREAK_MASTER, label: 'Perfect 10' },
                        { id: GAME_MODES.TIME_ATTACK, label: 'Time Attack' }
                      ].map(m => (
                        <motion.button
                          key={m.id}
                          onClick={() => {
                            setLeaderboardMode(m.id);
                            fetchLeaderboard(m.id);
                          }}
                          className="btn-secondary"
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          style={{
                            padding: '0.4rem 0.85rem',
                            fontSize: '0.8rem',
                            borderRadius: 'var(--radius-sm)',
                            background: leaderboardMode === m.id ? 'var(--accent-gold)' : 'transparent',
                            color: leaderboardMode === m.id ? '#000' : 'var(--text-secondary)',
                            borderColor: leaderboardMode === m.id ? 'var(--accent-yellow)' : 'var(--border-subtle)'
                          }}
                        >
                          {m.label}
                        </motion.button>
                      ))}
                    </div>
                  </div>

                  <div className="glass-panel" style={{ padding: '1.5rem', overflowX: 'auto' }}>
                    {leaderboardLoading ? (
                      <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                        Loading verified leaderboard rankings...
                      </div>
                    ) : leaderboardRows.length === 0 ? (
                      <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                        <span style={{ fontSize: '3rem' }}>🏆</span>
                        <h3 style={{ fontSize: '1.25rem', marginTop: '0.75rem', marginBottom: '0.5rem', color: 'var(--text-primary)' }}>
                          No Verified High Scores in {leaderboardMode} Yet!
                        </h3>
                        <p style={{ fontSize: '0.9rem', maxWidth: '480px', margin: '0 auto 1.5rem auto' }}>
                          Be the first solver to set a record in this mode and claim the #1 spot on the podium.
                        </p>
                        <motion.button
                          onClick={() => handleStartGame(leaderboardMode)}
                          className="btn-primary"
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          style={{ padding: '0.75rem 1.5rem' }}
                        >
                          Play Now to Claim #1
                        </motion.button>
                      </div>
                    ) : (
                      <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
                        <thead>
                          <tr style={{ borderBottom: '1px solid var(--border-subtle)', color: 'var(--text-muted)' }}>
                            <th style={{ padding: '0.75rem 1rem' }}>Rank</th>
                            <th style={{ padding: '0.75rem 1rem' }}>Player</th>
                            <th style={{ padding: '0.75rem 1rem' }}>Tier</th>
                            <th style={{ padding: '0.75rem 1rem' }}>High Score</th>
                            <th style={{ padding: '0.75rem 1rem' }}>Accuracy</th>
                            <th style={{ padding: '0.75rem 1rem' }}>Avg Speed</th>
                            <th style={{ padding: '0.75rem 1rem' }}>Verified At</th>
                          </tr>
                        </thead>
                        <tbody>
                          {leaderboardRows.map((row, index) => (
                            <motion.tr
                              key={row.id}
                              initial={{ opacity: 0, x: -20 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: index * 0.05 }}
                              style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}
                            >
                              <td style={{ padding: '1rem', fontWeight: 800, fontFamily: 'var(--font-mono)' }}>
                                {row.rank === 1 ? '🥇 #1' : row.rank === 2 ? '🥈 #2' : row.rank === 3 ? '🥉 #3' : `#${row.rank}`}
                              </td>
                              <td style={{ padding: '1rem' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                  {row.avatar_url ? (
                                    <img src={row.avatar_url} alt="" style={{ width: '28px', height: '28px', borderRadius: '50%' }} />
                                  ) : (
                                    <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'var(--accent-gold)', color: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800 }}>
                                      {row.username.charAt(0)}
                                    </div>
                                  )}
                                  <span style={{ fontWeight: 700 }}>{row.username}</span>
                                </div>
                              </td>
                              <td style={{ padding: '1rem' }}>
                                <span style={{
                                  fontWeight: 800,
                                  padding: '0.2rem 0.6rem',
                                  borderRadius: 'var(--radius-sm)',
                                  background: 'rgba(255,255,255,0.06)',
                                  color: row.grade_tier === 'S' ? '#FFD700' : row.grade_tier === 'A' ? '#A855F7' : 'var(--text-primary)'
                                }}>
                                  {row.grade_tier}
                                </span>
                              </td>
                              <td style={{ padding: '1rem', fontWeight: 900, fontFamily: 'var(--font-mono)', color: 'var(--accent-yellow)' }}>
                                {row.high_score.toLocaleString()}
                              </td>
                              <td style={{ padding: '1rem', fontFamily: 'var(--font-mono)' }}>
                                {row.best_accuracy_pct}%
                              </td>
                              <td style={{ padding: '1rem', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
                                {(row.best_avg_time_ms / 1000).toFixed(1)}s
                              </td>
                              <td style={{ padding: '1rem', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
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
                  <h2 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '0.5rem' }}>
                    Enterprise Architecture &amp; Diagnostics
                  </h2>
                  <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>
                    Live architectural introspection verifying Theme 2 (Event-Driven Programming) and Theme 3 (Interoperability).
                  </p>

                  {/* Theme 2: Custom Event Bus Activity Inspector */}
                  <div className="glass-panel" style={{ padding: '1.5rem', marginBottom: '2rem', borderTop: '4px solid var(--accent-purple)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                      <div>
                        <h4 style={{ fontSize: '1.2rem', fontWeight: 800, margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <span>⚡</span> Theme 2: Decoupled CustomEventBus Signal Stream
                        </h4>
                        <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: '0.25rem 0 0 0' }}>
                          Real-time audit log of published and subscribed events across the gameplay engine and Web Audio synthesizer.
                        </p>
                      </div>

                      <button
                        onClick={() => setBusEvents(eventBus.getHistory())}
                        className="btn-secondary"
                        style={{ padding: '0.35rem 0.8rem', fontSize: '0.75rem' }}
                      >
                        🔄 Refresh Stream
                      </button>
                    </div>

                    <div style={{
                      maxHeight: '220px',
                      overflowY: 'auto',
                      background: 'rgba(0,0,0,0.3)',
                      borderRadius: 'var(--radius-md)',
                      padding: '0.75rem',
                      fontFamily: 'var(--font-mono)',
                      fontSize: '0.8rem',
                      border: '1px solid var(--border-subtle)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.4rem'
                    }}>
                      {busEvents.length === 0 ? (
                        <div style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '1.5rem 0' }}>
                          No events dispatched yet. Play a game or press numpad keys to observe live pub/sub messages!
                        </div>
                      ) : (
                        busEvents.map((ev, index) => (
                          <div key={index} style={{ display: 'flex', gap: '1rem', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.04)', paddingBottom: '0.25rem' }}>
                            <span style={{ color: 'var(--text-muted)', fontSize: '0.7rem' }}>
                              {new Date(ev.timestamp).toLocaleTimeString()}
                            </span>
                            <span style={{ color: 'var(--accent-purple)', fontWeight: 700 }}>
                              {ev.event}
                            </span>
                            <span style={{ color: 'var(--text-secondary)', fontSize: '0.75rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
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
                    <div className="glass-panel" style={{ padding: '1.5rem', borderTop: '4px solid var(--accent-gold)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                        <h4 style={{ fontSize: '1.1rem', fontWeight: 700 }}>🍌 Remote Banana API Health</h4>
                        <button
                          onClick={handleFetchTelemetry}
                          disabled={telemetryLoading}
                          className="btn-secondary"
                          style={{ padding: '0.3rem 0.75rem', fontSize: '0.75rem' }}
                        >
                          {telemetryLoading ? 'Pinging...' : 'Ping Now'}
                        </button>
                      </div>

                      {telemetryData ? (
                        <div style={{ fontSize: '0.85rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                          <div>Status: <span style={{ color: 'var(--accent-emerald)', fontWeight: 700 }}>{telemetryData.status}</span></div>
                          <div>Target URL: <code style={{ color: 'var(--accent-gold)' }}>{telemetryData.remoteApiUrl}</code></div>
                          <div>Ping Latency: <span style={{ fontWeight: 800, fontFamily: 'var(--font-mono)' }}>{telemetryData.latencyMs}ms</span></div>
                          <div>Fallback Generator: <span style={{ color: 'var(--accent-cyan)' }}>Procedural SVG Enabled</span></div>
                        </div>
                      ) : (
                        <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                          Click &apos;Ping Now&apos; to measure live HTTPS roundtrip latency to marcconrad.com.
                        </div>
                      )}
                    </div>

                    {/* Cryptographic Protection Card */}
                    <div className="glass-panel" style={{ padding: '1.5rem', borderTop: '4px solid var(--accent-emerald)' }}>
                      <h4 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.75rem' }}>
                        🔐 HMAC-SHA256 Solution Sealing
                      </h4>
                      <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                        The raw mathematical solution from Marc Conrad&apos;s API is never sent directly to the client browser. Instead, the backend seals it into an HMAC-SHA256 signed token. Verification occurs exclusively on the backend server.
                      </p>
                    </div>
                  </div>
                </motion.div>
              )}
            </>
          )}
        </AnimatePresence>
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
