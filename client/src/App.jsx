import React, { useState } from 'react';
import { GRADE_TIERS, GAME_MODES } from '@banana-quest/shared';

export default function App() {
  const [activeTab, setActiveTab] = useState('welcome');

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Top Navigation Bar */}
      <header style={{
        borderBottom: '1px solid var(--border-subtle)',
        background: 'rgba(10, 13, 20, 0.8)',
        backdropFilter: 'blur(12px)',
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

          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button className="btn-secondary" style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}>
              Sign In
            </button>
            <button className="btn-primary" style={{ padding: '0.5rem 1.25rem', fontSize: '0.85rem' }}>
              Play Guest
            </button>
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
              Day 1 Gitflow Milestone Active
            </span>
          </div>

          <h2 style={{ fontSize: '3rem', fontWeight: 900, marginBottom: '1rem', lineHeight: 1.15 }}>
            Master the Math. <span className="text-gradient-gold">Conquer the Quest.</span>
          </h2>

          <p style={{ maxWidth: '650px', margin: '0 auto 2rem auto', fontSize: '1.1rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
            An enterprise, event-driven cognitive arcade game powered by the University of Bedfordshire Banana API.
            Compete on global leaderboards with real-time speed streaks and Google OAuth virtual identity.
          </p>

          <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem' }}>
            <button className="btn-primary" style={{ fontSize: '1.1rem', padding: '1rem 2rem' }}>
              🚀 Start Challenge (Speed Rush)
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
                desc: 'Component modularity across client, server, and shared packages. Feature branching and conventional commits.',
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

        {/* Performance Grade Tiers Showcase */}
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
