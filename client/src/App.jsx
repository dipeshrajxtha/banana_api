import React, { useState, useEffect } from 'react';
import { GRADE_TIERS } from '@banana-quest/shared';
import GoogleSignInButton from './components/GoogleSignInButton.jsx';

export default function App() {
  const [activeTab, setActiveTab] = useState('welcome');
  const [currentUser, setCurrentUser] = useState(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authError, setAuthError] = useState(null);

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

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      setCurrentUser(null);
    } catch (err) {
      console.error('Logout error:', err);
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
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
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
                onClick={() => setActiveTab(tab)}
                className="btn-secondary"
                style={{
                  padding: '0.5rem 1rem',
                  fontSize: '0.85rem',
                  borderRadius: 'var(--radius-sm)',
                  background: activeTab === tab ? 'var(--bg-tertiary)' : 'transparent',
                  borderColor: activeTab === tab ? 'var(--accent-gold)' : 'transparent',
                  color: activeTab === tab ? 'var(--accent-gold)' : 'var(--text-secondary)'
                }}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </nav>

          {/* Virtual Identity / Profile Widget (Theme 4) */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
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
              Day 5 Milestone: Google OAuth 2.0 Active
            </span>
          </div>

          <h2 style={{ fontSize: '3rem', fontWeight: 900, marginBottom: '1rem', lineHeight: 1.15 }}>
            Master the Math. <span className="text-gradient-gold">Conquer the Quest.</span>
          </h2>

          <p style={{ maxWidth: '650px', margin: '0 auto 2rem auto', fontSize: '1.1rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
            An enterprise, event-driven cognitive arcade game powered by the University of Bedfordshire Banana API.
            {currentUser
              ? ` Welcome back, ${currentUser.username}! Your career stats and rank are actively tracking.`
              : ' Sign in with Google to record your high scores, earn Apex Legend rank, and challenge global solvers.'}
          </p>

          <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', flexWrap: 'wrap' }}>
            <button className="btn-primary" style={{ fontSize: '1.1rem', padding: '1rem 2rem' }}>
              🚀 Start Speed Rush (60s)
            </button>
            <button className="btn-secondary" style={{ fontSize: '1.1rem', padding: '1rem 1.75rem' }}>
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
                desc: 'Component modularity across client, server, and shared packages. Feature branching, semantic tags (v0.1.0-alpha).',
                color: 'var(--accent-cyan)'
              },
              {
                theme: 'Theme 2: Event-Driven Programming',
                badge: 'Custom EventBus',
                desc: 'Decoupled pub/sub event architecture, reactive keyboard & numpad listeners, and 60 FPS tick loops.',
                color: 'var(--accent-purple)'
              },
              {
                theme: 'Theme 3: Interoperability',
                badge: 'Banana API & GIS',
                desc: 'RESTful HTTPS communication with Marc Conrad Banana API, fault-tolerant proxy caching, and offline fallbacks.',
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
      </main>

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
