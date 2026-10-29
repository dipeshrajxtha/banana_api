/**
 * @file App.jsx
 * @description Main application shell for Banana Quest (CIS046-3 Software For Enterprise).
 * Orchestrates navigation, game lifecycle, virtual identity auth, and theme diagnostic panels.
 * Integrates Theme 2 (Event-Driven Programming) via CustomEventBus and native Web Audio synthesizer.
 * @module client/App
 * @author Dipesh Raj Shrestha
 * @reference Marc Conrad - https://marcconrad.com/uob/banana/doc.php
 * @reference University of Bedfordshire - CIS046-3
 */

import React, { useState, useEffect } from 'react';
import { GRADE_TIERS, GAME_MODES } from '@banana-quest/shared';
import GoogleSignInButton from './components/GoogleSignInButton.jsx';
import PuzzleArena from './components/PuzzleArena.jsx';
import GameOverModal from './components/GameOverModal.jsx';
import { soundService } from './services/soundService.js';
import { eventBus } from './events/eventBus.js';

export default function App() {
  const [activeTab, setActiveTab] = useState('welcome');
  const [currentUser, setCurrentUser] = useState(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authError, setAuthError] = useState(null);

  // Audio & Event-Driven Engine State
  const [isMuted, setIsMuted] = useState(soundService.isMuted);
  const [busEvents, setBusEvents] = useState([]);

  // Active Gameplay State
  const [activeGameMode, setActiveGameMode] = useState(null);
  const [gameOverStats, setGameOverStats] = useState(null);

  // Architecture telemetry state
  const [telemetryData, setTelemetryData] = useState(null);
  const [telemetryLoading, setTelemetryLoading] = useState(false);

  // Bind Web Audio API synthesizer to EventBus on mount
  useEffect(() => {
    soundService.bindToEventBus();

    // Refresh event bus history periodically for Architecture inspector
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

  const handleStartGame = (mode) => {
    setGameOverStats(null);
    setActiveGameMode(mode);
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

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
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
          <div
            onClick={() => { setActiveGameMode(null); setActiveTab('welcome'); }}
            style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer' }}
          >
            <span style={{ fontSize: '1.8rem' }}>🍌</span>
            <div>
              <h1 style={{ fontSize: '1.25rem', fontWeight: 800, letterSpacing: '-0.02em', margin: 0 }}>
                BANANA <span className="text-gradient-gold">QUEST</span>
              </h1>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: 0 }}>
                CIS046-3 Software For Enterprise
              </p>
            </div>
          </div>

          {/* Navigation Links */}
          <nav style={{ display: 'flex', gap: '0.5rem' }}>
            {['welcome', 'modes', 'architecture', 'leaderboard'].map(tab => (
              <button
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
              </button>
            ))}
          </nav>

          {/* Audio Controls & Virtual Identity (Theme 2 & 4) */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            {/* Native Web Audio API Mute Toggle */}
            <button
              onClick={handleToggleAudio}
              className="btn-secondary"
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
            </button>

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
                      {currentUser.authProvider === 'google' ? 'Google Account' : 'Local Player'}
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
              <>
                <button
                  onClick={() => setShowAuthModal(true)}
                  className="btn-secondary"
                  style={{ padding: '0.5rem 1.25rem', fontSize: '0.85rem' }}
                >
                  Sign In
                </button>
                <button
                  onClick={() => setShowAuthModal(true)}
                  className="btn-primary"
                  style={{ padding: '0.5rem 1.25rem', fontSize: '0.85rem' }}
                >
                  Play with Google
                </button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main style={{ flex: 1, maxWidth: '1200px', width: '100%', margin: '0 auto', padding: '2.5rem 1.5rem' }}>
        {/* Active Game Mode View */}
        {activeGameMode ? (
          <div>
            <PuzzleArena
              gameMode={activeGameMode}
              onGameOver={(stats) => {
                setGameOverStats(stats);
                setActiveGameMode(null);
              }}
              onQuit={() => setActiveGameMode(null)}
            />
          </div>
        ) : (
          <>
            {/* Tab: Welcome & Home */}
            {activeTab === 'welcome' && (
              <>
                {/* Hero Section */}
                <div className="glass-panel" style={{
                  padding: '3rem 2.5rem',
                  marginBottom: '2.5rem',
                  textAlign: 'center',
                  position: 'relative'
                }}>
                  <div style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    padding: '0.35rem 0.85rem',
                    borderRadius: 'var(--radius-full)',
                    background: 'rgba(245, 158, 11, 0.1)',
                    border: '1px solid rgba(245, 158, 11, 0.3)',
                    marginBottom: '1.25rem'
                  }}>
                    <span style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', background: 'var(--accent-emerald)' }}></span>
                    <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--accent-yellow)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      Day 10 Milestone: Custom EventBus & Web Audio API Active
                    </span>
                  </div>

                  <h2 style={{ fontSize: '3rem', fontWeight: 900, marginBottom: '1rem', lineHeight: 1.15 }}>
                    Master the Math. <span className="text-gradient-gold">Conquer the Quest.</span>
                  </h2>

                  <p style={{ maxWidth: '650px', margin: '0 auto 2rem auto', fontSize: '1.1rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                    An enterprise, event-driven cognitive arcade game powered by the University of Bedfordshire Banana API.
                    {currentUser
                      ? ` Welcome back, ${currentUser.username}! Ready to test your mathematical reflexes?`
                      : ' Sign in with Google to record your high scores, earn Apex Legend rank, and challenge global solvers.'}
                  </p>

                  <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                    <button
                      onClick={() => handleStartGame(GAME_MODES.SPEED_RUSH)}
                      className="btn-primary"
                      style={{ fontSize: '1.1rem', padding: '1rem 2rem' }}
                    >
                      🚀 Start Speed Rush (60s)
                    </button>
                    <button
                      onClick={() => handleStartGame(GAME_MODES.SURVIVAL)}
                      className="btn-secondary"
                      style={{ fontSize: '1.1rem', padding: '1rem 1.75rem' }}
                    >
                      🛡️ Survival Mode (3 Strikes)
                    </button>
                  </div>
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
                        badge: 'Google OAuth & JWT',
                        desc: 'Federated identity via Google OpenID Connect, bcrypt password hashing, HttpOnly cookies, and RBAC.',
                        color: 'var(--accent-emerald)'
                      }
                    ].map(item => (
                      <div key={item.theme} className="glass-panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column' }}>
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
                      </div>
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
                    {Object.values(GRADE_TIERS).map(tier => (
                      <div
                        key={tier.id}
                        className="glass-panel"
                        style={{
                          padding: '1.25rem',
                          borderTop: `3px solid ${tier.badgeColor}`,
                          textAlign: 'center'
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
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}

            {/* Tab: Game Modes */}
            {activeTab === 'modes' && (
              <div>
                <h2 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '0.5rem' }}>
                  Select Arcade Challenge Mode
                </h2>
                <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>
                  Choose your challenge parameters. All modes communicate in real time with the Marc Conrad Banana API.
                </p>

                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
                  gap: '1.5rem'
                }}>
                  {/* Speed Rush */}
                  <div className="glass-panel" style={{ padding: '2rem', borderTop: '4px solid var(--accent-purple)' }}>
                    <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>⚡</div>
                    <h3 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '0.5rem' }}>Speed Rush</h3>
                    <div style={{ fontSize: '0.85rem', color: 'var(--accent-purple)', fontWeight: 700, marginBottom: '1rem' }}>
                      60-Second Timed Sprint
                    </div>
                    <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '1.5rem' }}>
                      Race against the global 60-second countdown clock. Solve as many equations as possible. Consecutive correct answers award exponential multiplier streaks!
                    </p>
                    <button
                      onClick={() => handleStartGame(GAME_MODES.SPEED_RUSH)}
                      className="btn-primary"
                      style={{ width: '100%', padding: '0.85rem' }}
                    >
                      🚀 Launch Speed Rush
                    </button>
                  </div>

                  {/* Survival Mode */}
                  <div className="glass-panel" style={{ padding: '2rem', borderTop: '4px solid var(--accent-rose)' }}>
                    <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🛡️</div>
                    <h3 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '0.5rem' }}>Survival Mode</h3>
                    <div style={{ fontSize: '0.85rem', color: 'var(--accent-rose)', fontWeight: 700, marginBottom: '1rem' }}>
                      3 Lives • 15s Per Puzzle
                    </div>
                    <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '1.5rem' }}>
                      Sudden death puzzle endurance. You have 3 hearts and 15 seconds per puzzle. Every wrong answer or timeout consumes 1 heart. How far can you survive?
                    </p>
                    <button
                      onClick={() => handleStartGame(GAME_MODES.SURVIVAL)}
                      className="btn-secondary"
                      style={{ width: '100%', padding: '0.85rem', borderColor: 'var(--accent-rose)', color: 'var(--accent-rose)' }}
                    >
                      🛡️ Launch Survival
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Tab: Architecture & Interoperability Diagnostics */}
            {activeTab === 'architecture' && (
              <div>
                <h2 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '0.5rem' }}>
                  Enterprise Architecture & Diagnostics
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
              </div>
            )}

            {/* Tab: Leaderboard */}
            {activeTab === 'leaderboard' && (
              <div>
                <h2 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '0.5rem' }}>
                  Global Hall of Fame
                </h2>
                <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>
                  Top competitive solvers ranked by high score, accuracy, and tier classification.
                </p>

                <div className="glass-panel" style={{ padding: '1.5rem' }}>
                  <div style={{ textAlign: 'center', padding: '2rem 1rem', color: 'var(--text-muted)' }}>
                    <span style={{ fontSize: '3rem' }}>🏆</span>
                    <h3 style={{ fontSize: '1.25rem', marginTop: '0.75rem', marginBottom: '0.5rem', color: 'var(--text-primary)' }}>
                      Complete a Game Session to Claim Your Rank!
                    </h3>
                    <p style={{ fontSize: '0.9rem', maxWidth: '500px', margin: '0 auto 1.5rem auto' }}>
                      Start a Speed Rush or Survival game to record your score. Top scores will automatically register in the SQLite persistent ledger.
                    </p>
                    <button
                      onClick={() => handleStartGame(GAME_MODES.SPEED_RUSH)}
                      className="btn-primary"
                      style={{ padding: '0.75rem 1.5rem' }}
                    >
                      Play Now
                    </button>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </main>

      {/* Game Over Modal with Grade Tier Diagnostics */}
      {gameOverStats && (
        <GameOverModal
          stats={gameOverStats}
          onPlayAgain={() => {
            const mode = gameOverStats.gameMode;
            setGameOverStats(null);
            setActiveGameMode(mode);
          }}
          onReturnHome={() => {
            setGameOverStats(null);
            setActiveTab('welcome');
          }}
        />
      )}

      {/* Virtual Identity Authentication Modal */}
      {showAuthModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0, 0, 0, 0.75)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 100,
          padding: '1rem'
        }}>
          <div className="glass-panel" style={{
            maxWidth: '440px',
            width: '100%',
            padding: '2rem',
            textAlign: 'center',
            position: 'relative'
          }}>
            <button
              onClick={() => setShowAuthModal(false)}
              style={{
                position: 'absolute',
                top: '1rem',
                right: '1rem',
                background: 'transparent',
                border: 'none',
                color: 'var(--text-muted)',
                fontSize: '1.25rem',
                cursor: 'pointer'
              }}
            >
              ✕
            </button>

            <span style={{ fontSize: '2.5rem' }}>🔐</span>
            <h3 style={{ fontSize: '1.5rem', marginTop: '0.5rem', marginBottom: '0.5rem' }}>
              Player Virtual Identity
            </h3>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
              Sign in with your Google account or academic demo profile to track your scores.
            </p>

            {authError && (
              <div style={{
                background: 'rgba(244, 63, 94, 0.1)',
                border: '1px solid var(--accent-rose)',
                padding: '0.75rem',
                borderRadius: 'var(--radius-sm)',
                color: 'var(--accent-rose)',
                fontSize: '0.85rem',
                marginBottom: '1rem'
              }}>
                {authError}
              </div>
            )}

            <GoogleSignInButton
              onAuthSuccess={(user) => {
                setCurrentUser(user);
                setShowAuthModal(false);
                setAuthError(null);
              }}
              onError={(err) => setAuthError(err)}
            />
          </div>
        </div>
      )}

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
