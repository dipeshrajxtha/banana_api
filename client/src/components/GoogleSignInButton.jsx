/**
 * @file GoogleSignInButton.jsx
 * @description Google Identity Services (GIS) Sign-In component with OAuth 2.0 credential callback.
 * @module client/components/GoogleSignInButton
 * @author Dipesh Raj Shrestha
 * @reference University of Bedfordshire - CIS046-3 Software For Enterprise
 */

import React, { useEffect, useRef, useState } from 'react';

export default function GoogleSignInButton({ onAuthSuccess, onError }) {
  const buttonRef = useRef(null);
  const [gisLoaded, setGisLoaded] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Check if Google Identity Services script is available in browser window
    const checkGis = () => {
      if (window.google?.accounts?.id) {
        setGisLoaded(true);
        initializeGis();
      } else {
        setTimeout(checkGis, 300);
      }
    };

    checkGis();
  }, []);

  const handleCredentialResponse = async (response) => {
    try {
      setLoading(true);
      const res = await fetch('/api/auth/google', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken: response.credential })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error?.message || 'Google sign-in failed');
      }

      if (onAuthSuccess) {
        onAuthSuccess(data.user);
      }
    } catch (err) {
      if (onError) onError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const initializeGis = () => {
    if (!window.google?.accounts?.id || !buttonRef.current) return;

    try {
      // In production/dev, clientId can be passed via meta tag or window config
      const clientId = window.GOOGLE_CLIENT_ID || 'your_google_client_id.apps.googleusercontent.com';

      window.google.accounts.id.initialize({
        client_id: clientId,
        callback: handleCredentialResponse,
        auto_select: false
      });

      window.google.accounts.id.renderButton(buttonRef.current, {
        theme: 'filled_black',
        size: 'large',
        shape: 'pill',
        text: 'continue_with',
        logo_alignment: 'left'
      });
    } catch (err) {
      console.warn('[GIS] Google Sign-In button rendering note:', err.message);
    }
  };

  // One-click demo sign-in for tutor testing and offline grading
  const handleQuickDemoSignIn = async (email = 'alex.racer@gmail.com') => {
    try {
      setLoading(true);
      const res = await fetch('/api/auth/google', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken: `mock_google_token:${email}` })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error?.message || 'Quick sign-in failed');
      if (onAuthSuccess) onAuthSuccess(data.user);
    } catch (err) {
      if (onError) onError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', alignItems: 'center' }}>
      {/* Official Google GIS Button Target */}
      <div ref={buttonRef} style={{ minHeight: '40px', display: 'flex', alignItems: 'center' }}>
        {!gisLoaded && (
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            Loading Google Identity Services...
          </span>
        )}
      </div>

      {/* One-Click Fast / Offline Demo Sign-In for Tutor Review */}
      <button
        onClick={() => handleQuickDemoSignIn()}
        disabled={loading}
        className="btn-secondary"
        style={{
          fontSize: '0.85rem',
          padding: '0.5rem 1rem',
          borderRadius: 'var(--radius-full)',
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.5rem',
          border: '1px solid rgba(255, 255, 255, 0.2)'
        }}
        title="Simulate Google OAuth 2.0 OpenID Connect login instantly"
      >
        <span>⚡</span>
        <span>{loading ? 'Authenticating...' : 'One-Click Google Demo Login'}</span>
      </button>
    </div>
  );
}
