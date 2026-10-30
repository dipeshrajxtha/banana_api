/**
 * @file IdentityPromptModal.jsx
 * @description Virtual Identity gating modal ensuring players establish a verified Google account
 * or recognized Guest Identity before playing, allowing scores to be tracked and ranked.
 * @module client/components/IdentityPromptModal
 * @author Dipesh Raj Shrestha
 * @reference University of Bedfordshire - CIS046-3 Software For Enterprise (Theme 4)
 */

import React, { useState } from 'react';
import GoogleSignInButton from './GoogleSignInButton.jsx';

export default function IdentityPromptModal({ isOpen, onClose, onAuthSuccess }) {
  const [guestName, setGuestName] = useState('');
  const [loadingGuest, setLoadingGuest] = useState(false);
  const [error, setError] = useState(null);

  if (!isOpen) return null;

  const handleGuestSubmit = async (e) => {
    e?.preventDefault();
    try {
      setLoadingGuest(true);
      setError(null);
      const res = await fetch('/api/auth/guest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ guestNickname: guestName.trim() })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error?.message || 'Failed to establish guest session');
      }
      if (onAuthSuccess) {
        onAuthSuccess(data.user);
      }
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoadingGuest(false);
    }
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(5, 7, 12, 0.85)',
      backdropFilter: 'blur(12px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 100,
      padding: '1.5rem',
      animation: 'fadeIn 0.25s ease-out'
    }}>
      <div className="glass-panel" style={{
        maxWidth: '480px',
        width: '100%',
        padding: '2.5rem 2rem',
        textAlign: 'center',
        position: 'relative',
        border: '1px solid var(--accent-gold-glow)'
      }}>
        <button
          onClick={onClose}
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

        <span style={{ fontSize: '2.75rem' }}>🔐</span>
        <h3 style={{ fontSize: '1.75rem', fontWeight: 800, margin: '0.5rem 0 0.25rem 0' }}>
          Player Identity Required
        </h3>
        <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '1.75rem', lineHeight: 1.5 }}>
          To track your mathematical reflexes, submit high scores, and claim your tier rank in the Hall of Fame, please establish your Virtual Identity.
        </p>

        {error && (
          <div style={{
            background: 'rgba(244, 63, 94, 0.15)',
            border: '1px solid var(--accent-rose)',
            padding: '0.75rem',
            borderRadius: 'var(--radius-sm)',
            color: 'var(--accent-rose)',
            fontSize: '0.85rem',
            marginBottom: '1.25rem'
          }}>
            {error}
          </div>
        )}

        {/* Option A: Google Authentication */}
        <div style={{
          background: 'rgba(255, 255, 255, 0.03)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-md)',
          padding: '1.25rem',
          marginBottom: '1.5rem'
        }}>
          <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--accent-gold)', marginBottom: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Recommended: Google OAuth 2.0
          </div>
          <GoogleSignInButton
            onAuthSuccess={(user) => {
              onAuthSuccess(user);
              onClose();
            }}
            onError={(msg) => setError(msg)}
          />
        </div>

        {/* Divider */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '1rem',
          margin: '1.25rem 0',
          color: 'var(--text-muted)',
          fontSize: '0.8rem',
          textTransform: 'uppercase'
        }}>
          <div style={{ flex: 1, height: '1px', background: 'var(--border-subtle)' }} />
          <span>OR</span>
          <div style={{ flex: 1, height: '1px', background: 'var(--border-subtle)' }} />
        </div>

        {/* Option B: Guest Virtual Identity */}
        <form onSubmit={handleGuestSubmit} style={{
          background: 'rgba(255, 255, 255, 0.03)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-md)',
          padding: '1.25rem'
        }}>
          <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--accent-cyan)', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Play as Guest
          </div>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
            Create an instant guest profile. Your scores will still record on the leaderboard.
          </p>

          <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
            <input
              type="text"
              placeholder="Enter your nickname (optional)"
              value={guestName}
              onChange={(e) => setGuestName(e.target.value)}
              maxLength={16}
              style={{
                flex: 1,
                background: 'var(--bg-tertiary)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-sm)',
                padding: '0.65rem 0.85rem',
                color: 'var(--text-primary)',
                fontSize: '0.9rem',
                outline: 'none'
              }}
            />
            <button
              type="submit"
              disabled={loadingGuest}
              className="btn-secondary"
              style={{ padding: '0.65rem 1.25rem', whiteSpace: 'nowrap' }}
            >
              {loadingGuest ? 'Joining...' : '🎮 Play Now'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

