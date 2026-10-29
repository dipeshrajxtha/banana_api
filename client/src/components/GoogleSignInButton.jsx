/**
 * @file GoogleSignInButton.jsx
 * @description Google Identity Services (GIS) Sign-In component with OAuth 2.0 credential callback.
 * @module client/components/GoogleSignInButton
 * @author Dipesh Raj Shrestha
 * @reference University of Bedfordshire - CIS046-3 Software For Enterprise
 */

import React, { useEffect, useRef, useState } from 'react';

let isGisInitialized = false;

export default function GoogleSignInButton({ onAuthSuccess, onError }) {
  const buttonRef = useRef(null);
  const [gisLoaded, setGisLoaded] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const checkGis = () => {
      if (!isMounted) return;
      if (window.google?.accounts?.id) {
        setGisLoaded(true);
        setupGoogleButton();
      } else {
        setTimeout(checkGis, 300);
      }
    };

    checkGis();

    return () => {
      isMounted = false;
    };
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

  const setupGoogleButton = () => {
    if (!window.google?.accounts?.id || !buttonRef.current) return;

    try {
      const clientId = window.GOOGLE_CLIENT_ID || 'your_google_client_id.apps.googleusercontent.com';

      if (!isGisInitialized) {
        window.google.accounts.id.initialize({
          client_id: clientId,
          callback: handleCredentialResponse,
          auto_select: false
        });
        isGisInitialized = true;
      }

      // Render official Google button into dedicated DOM element
      window.google.accounts.id.renderButton(buttonRef.current, {
        theme: 'filled_black',
        size: 'large',
        shape: 'pill',
        text: 'continue_with',
        logo_alignment: 'left'
      });
    } catch (err) {
      console.warn('[GIS] Google Sign-In note:', err.message);
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
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', alignItems: 'center' }}>
      {/* Loading state rendered outside Google target to prevent DOM collision */}
      {!gisLoaded && (
        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', height: '40px', display: 'flex', alignItems: 'center' }}>
          Connecting to Google Identity Services...
        </div>
      )}

      {/* Dedicated empty DOM target for Google GIS (No React children inside) */}
      <div
        ref={buttonRef}
        style={{
          minHeight: '40px',
          display: gisLoaded ? 'block' : 'none'
        }}
      />

      {/* One-Click Fast / Offline Demo Sign-In for Tutor Review */}
      <button
        onClick={() => handleQuickDemoSignIn()}
        disabled={loading}
        className="btn-secondary"
        style={{
          fontSize: '0.85rem',
          padding: '0.55rem 1.25rem',
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
