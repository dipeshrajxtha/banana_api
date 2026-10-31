/**
 * @file MultiplayerArena.jsx
 * @description Real-Time 1v1 Split-Screen Multiplayer Room Battle ("Minion Duel").
 * Enables creating a match room with 3, 5, or 7-minute timers, sharing an invite link,
 * and displaying two live puzzles simultaneously side-by-side with real-time SSE synchronization.
 * Features automatic forfeit victory if an opponent quits or disconnects.
 * @module client/components/MultiplayerArena
 * @author Dipesh Raj Shrestha
 * @reference University of Bedfordshire - CIS046-3 Software For Enterprise
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import Numpad from './Numpad.jsx';
import FloatingPoints from './FloatingPoints.jsx';
import MinionReactionAvatar from './MinionReactionAvatar.jsx';
import { soundService } from '../services/soundService.js';

export default function MultiplayerArena({ currentUser, initialRoomId = null, onQuit }) {
  // Connection & Room state
  const [roomId, setRoomId] = useState(initialRoomId);
  const [playerId, setPlayerId] = useState(() => {
    try {
      const stored = sessionStorage.getItem('banana_multiplayer_player_id');
      if (stored) return stored;
      const newId = `p_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
      sessionStorage.setItem('banana_multiplayer_player_id', newId);
      return newId;
    } catch {
      return `p_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    }
  });

  const [roomState, setRoomState] = useState(null);
  const [selectedTimerMin, setSelectedTimerMin] = useState(3);
  const [copiedLink, setCopiedLink] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);
  const [joinCodeInput, setJoinCodeInput] = useState('');

  // Local Player Gameplay state
  const [selectedDigit, setSelectedDigit] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [pointsTrigger, setPointsTrigger] = useState(null);
  const [feedback, setFeedback] = useState(null);
  const [secondsLeft, setSecondsLeft] = useState(180);

  const eventSourceRef = useRef(null);
  const puzzleStartRef = useRef(Date.now());

  // Derive player role
  const isHost = roomState?.host?.id === playerId;
  const isGuest = roomState?.guest?.id === playerId;
  const myData = isHost ? roomState?.host : isGuest ? roomState?.guest : null;
  const friendData = isHost ? roomState?.guest : isGuest ? roomState?.host : null;

  // Real-time SSE Connection to Room Stream
  const connectToRoomStream = useCallback((code) => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }

    const sse = new EventSource(`/api/rooms/${code}/stream?playerId=${playerId}`);
    eventSourceRef.current = sse;

    sse.onmessage = (event) => {
      try {
        const updatedRoom = JSON.parse(event.data);
        setRoomState(updatedRoom);

        // Update local countdown clock from server authoritative end time
        if (updatedRoom.status === 'playing' && updatedRoom.endTime) {
          const remaining = Math.max(0, Math.round((updatedRoom.endTime - Date.now()) / 1000));
          setSecondsLeft(remaining);
        }

        // Trigger celebration on match conclusion
        if (updatedRoom.status === 'finished') {
            const didIWin = updatedRoom.winner && (
              (isHost && updatedRoom.winner.role === 'host') ||
              (isGuest && updatedRoom.winner.role === 'guest') ||
              updatedRoom.winner.id === playerId
            );

            if (didIWin) {
              confetti({
                particleCount: 130,
                spread: 90,
                origin: { y: 0.5 },
                colors: ['#FFD700', '#F59E0B', '#10B981', '#38BDF8']
              });
              soundService.playCorrect(5);
            } else {
              soundService.playGameOver();
            }
          }
        } catch (err) {
          console.warn('[SSE] Parse warning:', err);
        }
      };

      sse.onerror = () => {
        // Stream auto-reconnection handled by native browser EventSource
      };
}, [isHost, isGuest, playerId]);

// Clean up SSE connection on unmount
useEffect(() => {
  return () => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }
  };
}, []);

// Shared 1-second countdown interval while playing
useEffect(() => {
  if (roomState?.status !== 'playing' || !roomState?.endTime) return;

  const interval = setInterval(() => {
    const remaining = Math.max(0, Math.round((roomState.endTime - Date.now()) / 1000));
    setSecondsLeft(remaining);

    // Warning siren at < 15 seconds
    if (remaining <= 15 && remaining > 0) {
      soundService.playTimerWarning();
    }

    // Finish match when clock hits 0
    if (remaining <= 0) {
      clearInterval(interval);
      fetch(`/api/rooms/${roomState.id}/finish`, { method: 'POST' }).catch(() => { });
    }
  }, 1000);

  return () => clearInterval(interval);
}, [roomState?.status, roomState?.endTime, roomState?.id]);

// Handle player quit with automatic forfeit victory to opponent
const handleQuitMatch = useCallback(async (bypassConfirm = false) => {
  if (!bypassConfirm && roomState?.status === 'playing') {
    const confirmed = window.confirm('Are you sure you want to quit? Quitting will immediately forfeit the match and award the victory to your opponent.');
    if (!confirmed) return;
  }

  if (eventSourceRef.current) {
    eventSourceRef.current.close();
  }

  if (roomId && playerId) {
    try {
      await fetch(`/api/rooms/${roomId}/quit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ playerId })
      });
    } catch (err) {
      console.warn('[Quit notification failed]:', err);
    }
  }

  if (onQuit) onQuit();
}, [roomId, playerId, roomState?.status, onQuit]);

// Notify server via sendBeacon if user closes tab/browser during match
useEffect(() => {
  const handleBeforeUnload = () => {
    if (roomId && playerId && roomState?.status === 'playing') {
      const payload = JSON.stringify({ playerId });
      const blob = new Blob([payload], { type: 'application/json' });
      navigator.sendBeacon(`/api/rooms/${roomId}/quit?playerId=${encodeURIComponent(playerId)}`, blob);
    }
  };

  window.addEventListener('beforeunload', handleBeforeUnload);
  return () => window.removeEventListener('beforeunload', handleBeforeUnload);
}, [roomId, playerId, roomState?.status]);

// Create a new Room
const handleCreateRoom = async () => {
  try {
    setLoading(true);
    setErrorMsg(null);
    const res = await fetch('/api/rooms/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        durationMinutes: selectedTimerMin,
        playerName: currentUser?.username || 'Host Minion',
        avatarUrl: currentUser?.avatarUrl || null
      })
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to create room');

    setRoomId(data.roomId);
    setPlayerId(data.playerId);
    sessionStorage.setItem('banana_multiplayer_player_id', data.playerId);
    setRoomState(data.room);
    connectToRoomStream(data.roomId);
  } catch (err) {
    setErrorMsg(err.message);
  } finally {
    setLoading(false);
  }
};

// Join existing Room via code or invite link
const handleJoinRoom = useCallback(async (codeToJoin) => {
  try {
    setLoading(true);
    setErrorMsg(null);
    const res = await fetch(`/api/rooms/${codeToJoin}/join`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        playerName: currentUser?.username || 'Guest Minion',
        avatarUrl: currentUser?.avatarUrl || null,
        playerId
      })
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to join room');

    setRoomId(codeToJoin);
    setPlayerId(data.playerId);
    sessionStorage.setItem('banana_multiplayer_player_id', data.playerId);
    setRoomState(data.room);
    connectToRoomStream(codeToJoin);
  } catch (err) {
    setErrorMsg(err.message);
  } finally {
    setLoading(false);
  }
}, [currentUser, playerId, connectToRoomStream]);

// Auto-join if initialRoomId is provided via invite URL
useEffect(() => {
  if (initialRoomId && !roomState) {
    handleJoinRoom(initialRoomId);
  }
}, [initialRoomId, handleJoinRoom, roomState]);

// Copy shareable battle link to clipboard
const handleCopyLink = () => {
  const url = `${window.location.origin}/?room=${roomId}`;
  navigator.clipboard.writeText(url).then(() => {
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  });
};

// Submit Answer
const handleSubmitAnswer = async () => {
  if (selectedDigit === null || isSubmitting || !roomState || roomState.status !== 'playing') return;

  const responseTimeMs = Date.now() - puzzleStartRef.current;
  setIsSubmitting(true);

  try {
    const res = await fetch(`/api/rooms/${roomId}/action`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        playerId,
        answer: selectedDigit,
        responseTimeMs
      })
    });

    const data = await res.json();
    if (res.ok && data.result) {
      if (data.result.isCorrect) {
        soundService.playCorrect(data.player.streak);
        setPointsTrigger({ points: data.result.pointsAwarded, ts: Date.now() });
        setFeedback({ type: 'correct', message: `+${data.result.pointsAwarded} PTS!` });
      } else {
        soundService.playWrong();
        setFeedback({ type: 'wrong', message: `MISS! (${data.result.trueSolution})` });
      }
      puzzleStartRef.current = Date.now();
      setSelectedDigit(null);
    }
  } catch (err) {
    console.error('[Duel Action Error]:', err);
  } finally {
    setIsSubmitting(false);
  }
};

// Keyboard controls
useEffect(() => {
  const handleKeyDown = (e) => {
    if (roomState?.status !== 'playing') return;

    if (/^[0-9]$/.test(e.key)) {
      setSelectedDigit(parseInt(e.key, 10));
      soundService.playDigitClick();
    } else if (e.key === 'Backspace') {
      setSelectedDigit(null);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      handleSubmitAnswer();
    }
  };
  window.addEventListener('keydown', handleKeyDown);
  return () => window.removeEventListener('keydown', handleKeyDown);
}, [roomState?.status, selectedDigit, handleSubmitAnswer]);

// Format time mm:ss
const formatTime = (totalSec) => {
  const mins = Math.floor(totalSec / 60);
  const secs = totalSec % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

// Calculate score difference
const myScore = myData?.score || 0;
const friendScore = friendData?.score || 0;
const scoreDiff = myScore - friendScore;

// Determine win condition
const didIWin = roomState?.winner && (
  (isHost && roomState.winner.role === 'host') ||
  (isGuest && roomState.winner.role === 'guest') ||
  roomState.winner.id === playerId
);
const isForfeit = roomState?.winner?.forfeit;

// ═══════════════════════════════════════════════════════════════
// VIEW 1: LOBBY & ROOM CONFIGURATION (When no active match yet)
// ═══════════════════════════════════════════════════════════════
if (!roomState || roomState.status === 'waiting') {
  return (
    <div className="glass-panel" style={{
      maxWidth: '720px',
      margin: '0 auto',
      padding: '2.5rem',
      textAlign: 'center',
      border: '2px dashed var(--minion-yellow)'
    }}>
      <div style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>⚔️</div>
      <h2 style={{ fontSize: '2.2rem', fontWeight: 900, marginBottom: '0.5rem' }}>
        Minion 1v1 <span className="text-gradient-gold">Battle Room</span>
      </h2>
      <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem', fontSize: '0.95rem' }}>
        Create a live duel room, select your battle timer, and share the link with a friend to compete head-to-head on the same screen!
      </p>

      {errorMsg && (
        <div style={{
          background: 'rgba(239, 68, 68, 0.2)',
          border: '1px solid #EF4444',
          color: '#FCA5A5',
          padding: '0.75rem',
          borderRadius: '8px',
          marginBottom: '1.5rem',
          fontSize: '0.9rem'
        }}>
          {errorMsg}
        </div>
      )}

      {!roomState ? (
        /* Step 1: Select Timer & Create Room OR Join with Code */
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem', alignItems: 'center', width: '100%' }}>
          {/* Option A: Host a Duel */}
          <div style={{
            width: '100%',
            maxWidth: '520px',
            background: 'rgba(255, 255, 255, 0.03)',
            padding: '1.5rem',
            borderRadius: '16px',
            border: '1px solid rgba(255, 215, 0, 0.3)'
          }}>
            <div style={{ fontSize: '1.1rem', fontWeight: 900, color: '#FFD700', marginBottom: '0.25rem' }}>
              🍌 HOST A NEW DUEL
            </div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>
              Pick match duration and create a battle room
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', marginBottom: '1.25rem' }}>
              {[3, 5, 7].map((mins) => (
                <motion.button
                  key={mins}
                  onClick={() => setSelectedTimerMin(mins)}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  style={{
                    flex: 1,
                    padding: '0.75rem 0.5rem',
                    borderRadius: '10px',
                    border: selectedTimerMin === mins ? '2px solid #FFD700' : '1px solid rgba(255,255,255,0.1)',
                    background: selectedTimerMin === mins ? 'linear-gradient(135deg, #FFD700 0%, #F59E0B 100%)' : 'rgba(255,255,255,0.05)',
                    color: selectedTimerMin === mins ? '#000' : '#FFF',
                    fontWeight: 800,
                    fontSize: '1rem',
                    cursor: 'pointer',
                    boxShadow: selectedTimerMin === mins ? '0 0 15px rgba(255, 215, 0, 0.3)' : 'none'
                  }}
                >
                  ⏱️ {mins} Min
                </motion.button>
              ))}
            </div>

            <motion.button
              onClick={handleCreateRoom}
              disabled={loading}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              className="btn-primary"
              style={{
                width: '100%',
                padding: '0.9rem',
                fontSize: '1.1rem',
                fontWeight: 900
              }}
            >
              {loading ? 'Creating Secret Lab Chamber...' : '🍌 CREATE BATTLE ROOM'}
            </motion.button>
          </div>

          {/* Divider */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '1rem',
            width: '100%',
            maxWidth: '520px',
            color: 'var(--text-muted)',
            fontSize: '0.8rem',
            fontWeight: 800,
            letterSpacing: '0.05em'
          }}>
            <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.1)' }} />
            <span>OR ENTER A ROOM CODE</span>
            <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.1)' }} />
          </div>

          {/* Option B: Join an Existing Room via Code */}
          <div style={{
            width: '100%',
            maxWidth: '520px',
            background: 'rgba(255, 255, 255, 0.03)',
            padding: '1.5rem',
            borderRadius: '16px',
            border: '1px solid rgba(56, 189, 248, 0.3)'
          }}>
            <div style={{ fontSize: '1.1rem', fontWeight: 900, color: '#38BDF8', marginBottom: '0.25rem' }}>
              🚀 JOIN A FRIEND&apos;S ROOM
            </div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>
              Enter the room code shared by your friend (e.g. MIN-XXXX)
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (joinCodeInput.trim()) {
                  handleJoinRoom(joinCodeInput.trim().toUpperCase());
                }
              }}
              style={{ display: 'flex', gap: '0.75rem' }}
            >
              <input
                type="text"
                placeholder="MIN-XXXX"
                value={joinCodeInput}
                onChange={(e) => setJoinCodeInput(e.target.value.toUpperCase())}
                maxLength={10}
                style={{
                  flex: 1,
                  padding: '0.8rem 1rem',
                  borderRadius: '10px',
                  background: 'rgba(0,0,0,0.5)',
                  border: '1px solid rgba(56, 189, 248, 0.4)',
                  color: '#FFD700',
                  fontSize: '1.2rem',
                  fontWeight: 900,
                  letterSpacing: '0.1em',
                  textAlign: 'center',
                  fontFamily: 'var(--font-mono)'
                }}
              />
              <motion.button
                type="submit"
                disabled={loading || !joinCodeInput.trim()}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="btn-secondary"
                style={{
                  padding: '0.8rem 1.5rem',
                  borderColor: '#38BDF8',
                  color: '#38BDF8',
                  fontWeight: 800,
                  fontSize: '1rem'
                }}
              >
                Join
              </motion.button>
            </form>
          </div>

          <button onClick={onQuit} className="btn-secondary" style={{ fontSize: '0.85rem' }}>
            Cancel &amp; Return Home
          </button>
        </div>
      ) : (
        /* Step 2: Room Created! Waiting for Friend to Connect */
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', alignItems: 'center' }}>
          <div style={{
            background: 'rgba(0,0,0,0.4)',
            padding: '1.5rem',
            borderRadius: '16px',
            border: '1px solid rgba(255,215,0,0.3)',
            width: '100%',
            maxWidth: '520px'
          }}>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
              ROOM CODE
            </div>
            <div style={{
              fontSize: '2.5rem',
              fontWeight: 900,
              color: '#FFD700',
              fontFamily: 'var(--font-mono)',
              margin: '0.25rem 0 1rem 0'
            }}>
              {roomState.id}
            </div>

            <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
              <motion.button
                onClick={handleCopyLink}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                className="btn-primary"
                style={{ flex: 1, padding: '0.75rem', fontSize: '0.9rem' }}
              >
                {copiedLink ? '✅ LINK COPIED TO CLIPBOARD!' : '📋 COPY INVITE LINK FOR FRIEND'}
              </motion.button>
            </div>

            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.75rem' }}>
              Send this link to your friend. When they open it, both screens connect automatically!
            </div>

            {typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') && (
              <div style={{
                background: 'rgba(245, 158, 11, 0.12)',
                border: '1px solid rgba(245, 158, 11, 0.35)',
                borderRadius: '8px',
                padding: '0.75rem',
                marginTop: '1rem',
                fontSize: '0.8rem',
                color: '#FDE68A',
                textAlign: 'left',
                lineHeight: 1.5
              }}>
                <div style={{ fontWeight: 800, marginBottom: '0.25rem', color: '#FFD700' }}>
                  📱 Playing on another phone or device?
                </div>
                <div>
                  • <strong>Same Wi-Fi</strong>: On your phone/laptop, open your computer&apos;s network URL (e.g. <code>http://192.168.x.x:3000</code>).<br />
                  • <strong>Over the Internet</strong>: Open a tunnel via <code>npx localtunnel --port 3000</code> or ngrok.<br />
                  • Your friend can also simply open the game and type Room Code: <strong>{roomState.id}</strong>!
                </div>
              </div>
            )}
          </div>

          {/* Pulsing Radar Animation */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: '#FFD700', fontWeight: 700 }}>
            <motion.span
              animate={{ scale: [1, 1.4, 1], opacity: [0.6, 1, 0.6] }}
              transition={{ repeat: Infinity, duration: 1.5 }}
              style={{ fontSize: '1.5rem' }}
            >
              📡
            </motion.span>
            <span>Waiting for Friend to Connect... (Timer: {roomState.durationMinutes} min)</span>
          </div>

            <button onClick={handleQuitMatch} className="btn-secondary" style={{ fontSize: '0.85rem' }}>
              Cancel &amp; Exit Room
            </button>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// VIEW 2: DUAL SPLIT-SCREEN ARENA ("2 PUZZLES IN ONE SCREEN")
// ═══════════════════════════════════════════════════════════════
return (
  <div style={{
    maxWidth: '1240px',
    margin: '0 auto',
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
    position: 'relative'
  }}>
    {/* Floating Score Animation */}
    <FloatingPoints trigger={pointsTrigger} />

    {/* ═══════ TOP SHARED MATCH HUD BAR ═══════ */}
    <div className="glass-panel" style={{
      padding: '0.75rem 1.5rem',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      border: '2px solid rgba(255, 215, 0, 0.4)',
      background: 'rgba(10, 15, 28, 0.95)'
    }}>
      {/* Left: Your Mini Summary */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <div style={{
          width: '38px',
          height: '38px',
          borderRadius: '50%',
          background: '#FFD700',
          color: '#000',
          fontWeight: 900,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          YOU
        </div>
        <div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{myData?.name || 'You'}</div>
          <div style={{ fontSize: '1.25rem', fontWeight: 900, color: '#FFD700', fontFamily: 'var(--font-mono)' }}>
            {myScore.toLocaleString()} PTS
          </div>
        </div>
      </div>

      {/* Center: Shared Match Clock & Lead Indicator */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.25rem' }}>
        <motion.div
          animate={secondsLeft <= 15 ? { scale: [1, 1.1, 1] } : {}}
          transition={{ repeat: Infinity, duration: 0.8 }}
          style={{
            fontSize: '2rem',
            fontWeight: 900,
            fontFamily: 'var(--font-mono)',
            color: secondsLeft <= 30 ? 'var(--accent-rose)' : '#FFF'
          }}
        >
          ⏱️ {formatTime(secondsLeft)}
        </motion.div>

        {/* Lead Indicator Badge */}
        <div style={{
          fontSize: '0.75rem',
          fontWeight: 800,
          padding: '0.15rem 0.6rem',
          borderRadius: '10px',
          background: scoreDiff > 0 ? 'rgba(16, 185, 129, 0.2)' : scoreDiff < 0 ? 'rgba(239, 68, 68, 0.2)' : 'rgba(255, 215, 0, 0.2)',
          color: scoreDiff > 0 ? '#10B981' : scoreDiff < 0 ? '#EF4444' : '#FFD700',
          border: '1px solid currentColor'
        }}>
          {scoreDiff > 0 ? `🔥 +${scoreDiff} PTS LEAD` : scoreDiff < 0 ? `⚠️ ${scoreDiff} PTS BEHIND` : '🤝 TIED MATCH'}
        </div>
      </div>

      {/* Right: Friend's Mini Summary & Forfeit/Quit */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{friendData?.name || 'Friend'}</div>
          <div style={{ fontSize: '1.25rem', fontWeight: 900, color: '#38BDF8', fontFamily: 'var(--font-mono)' }}>
            {friendScore.toLocaleString()} PTS
          </div>
        </div>
        <div style={{
          width: '38px',
          height: '38px',
          borderRadius: '50%',
          background: '#38BDF8',
          color: '#000',
          fontWeight: 900,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          VS
        </div>
          <button
            onClick={handleQuitMatch}
            className="btn-secondary"
            style={{ padding: '0.35rem 0.75rem', fontSize: '0.75rem', borderColor: 'var(--accent-rose)', color: 'var(--accent-rose)' }}
            title="Quitting forfeits the match and awards the victory to your opponent"
          >
            Quit / Forfeit
          </button>
      </div>
    </div>

    {/* ═══════ DUAL SPLIT-SCREEN ARENAS (2 PUZZLES IN ONE SCREEN) ═══════ */}
    <div style={{
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gap: '1.25rem'
    }}>
      {/* ──── LEFT ARENA: YOU (Active Playable Puzzle & Controls) ──── */}
      <div className="glass-panel" style={{
        padding: '1.5rem',
        border: '2px solid rgba(255, 215, 0, 0.5)',
        display: 'flex',
        flexDirection: 'column',
        gap: '1rem',
        position: 'relative'
      }}>
        {/* Header Tag */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{
            background: '#FFD700',
            color: '#000',
            fontWeight: 900,
            fontSize: '0.75rem',
            padding: '0.2rem 0.6rem',
            borderRadius: '6px'
          }}>
            YOUR SCREEN (PLAYER 1)
          </span>
          <span style={{ fontSize: '0.85rem', color: '#FFD700', fontWeight: 800 }}>
            🔥 Streak: {myData?.streak || 0}x | Solved: {myData?.solved || 0}
          </span>
        </div>

        {/* Puzzle Image & Input Preview */}
        <div style={{
          background: 'rgba(0,0,0,0.4)',
          borderRadius: '12px',
          padding: '1rem',
          minHeight: '220px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          border: '1px solid rgba(255,215,0,0.2)'
        }}>
          {myData?.currentPuzzle?.question ? (
            <img
              src={myData.currentPuzzle.question}
              alt="Your Puzzle"
              style={{ maxHeight: '180px', maxWidth: '100%', objectFit: 'contain', borderRadius: '8px' }}
            />
          ) : (
            <div style={{ color: 'var(--text-muted)' }}>Loading equation...</div>
          )}

          {/* Answer Preview Box */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.5rem' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Selected Answer:</span>
            <div style={{
              width: '42px',
              height: '42px',
              borderRadius: '8px',
              border: '2px solid #FFD700',
              background: 'var(--bg-tertiary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.5rem',
              fontWeight: 900,
              color: selectedDigit !== null ? '#FFD700' : 'var(--text-muted)'
            }}>
              {selectedDigit !== null ? selectedDigit : '?'}
            </div>
          </div>
        </div>

        {/* Answer Feedback Banner */}
        {feedback && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            style={{
              padding: '0.4rem',
              borderRadius: '6px',
              textAlign: 'center',
              fontWeight: 800,
              fontSize: '0.85rem',
              background: feedback.type === 'correct' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)',
              color: feedback.type === 'correct' ? '#10B981' : '#EF4444'
            }}
          >
            {feedback.message}
          </motion.div>
        )}

        {/* Minion Avatar & Numpad */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <MinionReactionAvatar
            reaction={feedback?.type === 'correct' ? 'correct' : feedback?.type === 'wrong' ? 'wrong' : 'idle'}
            feedbackText={feedback ? feedback.message : 'Solve it faster! 🍌'}
          />

          <Numpad
            onDigitPress={(d) => setSelectedDigit(d)}
            onClear={() => setSelectedDigit(null)}
            onSubmit={handleSubmitAnswer}
            disabled={isSubmitting || roomState.status !== 'playing'}
            activeDigit={selectedDigit}
          />
        </div>
      </div>

      {/* ──── RIGHT ARENA: FRIEND (Live Opponent Puzzle & Stats) ──── */}
      <div className="glass-panel" style={{
        padding: '1.5rem',
        border: '2px solid rgba(56, 189, 248, 0.5)',
        display: 'flex',
        flexDirection: 'column',
        gap: '1rem',
        position: 'relative',
        background: 'rgba(15, 23, 42, 0.7)'
      }}>
        {/* Header Tag */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{
            background: '#38BDF8',
            color: '#000',
            fontWeight: 900,
            fontSize: '0.75rem',
            padding: '0.2rem 0.6rem',
            borderRadius: '6px'
          }}>
            FRIEND&apos;S SCREEN (PLAYER 2)
          </span>
          <span style={{ fontSize: '0.85rem', color: '#38BDF8', fontWeight: 800 }}>
            🔥 Streak: {friendData?.streak || 0}x | Solved: {friendData?.solved || 0}
          </span>
        </div>

        {/* Friend's Live Puzzle Image */}
        <div style={{
          background: 'rgba(0,0,0,0.4)',
          borderRadius: '12px',
          padding: '1rem',
          minHeight: '220px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          border: '1px solid rgba(56, 189, 248, 0.2)',
          position: 'relative'
        }}>
          {friendData?.currentPuzzle?.question ? (
            <img
              src={friendData.currentPuzzle.question}
              alt="Friend's Puzzle"
              style={{ maxHeight: '180px', maxWidth: '100%', objectFit: 'contain', borderRadius: '8px' }}
            />
          ) : (
            <div style={{ color: 'var(--text-muted)' }}>Waiting for friend...</div>
          )}

          {/* Friend action indicator */}
          {friendData?.lastAction && (
            <motion.div
              key={friendData.lastAction.ts}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              style={{
                position: 'absolute',
                top: '0.5rem',
                right: '0.5rem',
                padding: '0.2rem 0.6rem',
                borderRadius: '12px',
                background: friendData.lastAction.type === 'correct' ? '#10B981' : '#EF4444',
                color: '#FFF',
                fontWeight: 900,
                fontSize: '0.75rem'
              }}
            >
              {friendData.lastAction.type === 'correct' ? `+${friendData.lastAction.points} PTS!` : 'MISSED!'}
            </motion.div>
          )}
        </div>

        {/* Friend's Minion Reaction Avatar */}
        <MinionReactionAvatar
          reaction={friendData?.lastAction?.type === 'correct' ? 'correct' : friendData?.lastAction?.type === 'wrong' ? 'wrong' : 'idle'}
          feedbackText={friendData?.lastAction?.type === 'correct' ? 'Friend Solved One! ⚡' : 'Friend Missed! 🙈'}
        />

        {/* Opponent Live Stats Card */}
        <div style={{
          background: 'rgba(0,0,0,0.3)',
          borderRadius: '12px',
          padding: '1.25rem',
          border: '1px solid rgba(56, 189, 248, 0.2)',
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '0.75rem',
          textAlign: 'center'
        }}>
          <div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Score</div>
            <div style={{ fontSize: '1.4rem', fontWeight: 900, color: '#38BDF8', fontFamily: 'var(--font-mono)' }}>
              {friendScore}
            </div>
          </div>
          <div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Streak</div>
            <div style={{ fontSize: '1.4rem', fontWeight: 900, color: '#FFD700', fontFamily: 'var(--font-mono)' }}>
              {friendData?.streak || 0}x
            </div>
          </div>
          <div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Solved</div>
            <div style={{ fontSize: '1.4rem', fontWeight: 900, color: '#10B981', fontFamily: 'var(--font-mono)' }}>
              {friendData?.solved || 0}
            </div>
          </div>
        </div>
      </div>
    </div>

    {/* ═══════ MATCH CONCLUDED PODIUM MODAL ═══════ */}
    <AnimatePresence>
      {roomState?.status === 'finished' && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 300,
            background: 'rgba(5, 7, 12, 0.92)',
            backdropFilter: 'blur(16px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1.5rem'
          }}
        >
          <motion.div
            className="glass-panel"
            initial={{ scale: 0.8, y: 30 }}
            animate={{ scale: 1, y: 0 }}
            style={{
              maxWidth: '600px',
              width: '100%',
              padding: '2.5rem',
              textAlign: 'center',
              border: isForfeit ? (didIWin ? '2px solid #10B981' : '2px solid #EF4444') : '2px solid #FFD700',
              boxShadow: '0 0 50px rgba(255, 215, 0, 0.4)'
            }}
          >
            <div style={{ fontSize: '4rem', marginBottom: '0.5rem' }}>
              {isForfeit ? (didIWin ? '🏆' : '🚪') : (myScore > friendScore ? '🏆' : myScore < friendScore ? '🥈' : '🤝')}
            </div>

            <h2 style={{ fontSize: '2.2rem', fontWeight: 900, marginBottom: '0.25rem' }}>
              {isForfeit
                ? (didIWin ? 'VICTORY BY FORFEIT!' : 'YOU FORFEITED THE MATCH')
                : (myScore > friendScore ? 'VICTORY! YOU WON!' : myScore < friendScore ? 'DEFEAT! FRIEND WON!' : 'EPIC TIE MATCH!')}
            </h2>

            {isForfeit && (
              <div style={{
                background: didIWin ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)',
                border: `1px solid ${didIWin ? '#10B981' : '#EF4444'}`,
                borderRadius: '8px',
                padding: '0.6rem 1rem',
                margin: '1rem 0',
                fontWeight: 800,
                fontSize: '0.95rem',
                color: didIWin ? '#34D399' : '#F87171'
              }}>
                {didIWin
                  ? `🏆 ${roomState.winner?.quitterName || 'Your opponent'} has quit the duel. You win automatically!`
                  : 'You left the match. Victory was awarded to your opponent.'}
              </div>
            )}

            <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
              {roomState.durationMinutes}-Minute Minion Duel Concluded
            </p>

            {/* Side-by-side Telemetry Recap */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '1rem',
              marginBottom: '2rem'
            }}>
              <div style={{
                background: 'rgba(255, 215, 0, 0.1)',
                border: '1px solid #FFD700',
                padding: '1rem',
                borderRadius: '12px'
              }}>
                <div style={{ fontSize: '0.8rem', color: '#FFD700', fontWeight: 800 }}>YOU</div>
                <div style={{ fontSize: '1.8rem', fontWeight: 900, fontFamily: 'var(--font-mono)' }}>{myScore}</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Solved: {myData?.solved || 0} / {myData?.attempted || 0}</div>
              </div>

              <div style={{
                background: 'rgba(56, 189, 248, 0.1)',
                border: '1px solid #38BDF8',
                padding: '1rem',
                borderRadius: '12px'
              }}>
                <div style={{ fontSize: '0.8rem', color: '#38BDF8', fontWeight: 800 }}>FRIEND</div>
                <div style={{ fontSize: '1.8rem', fontWeight: 900, fontFamily: 'var(--font-mono)' }}>{friendScore}</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Solved: {friendData?.solved || 0} / {friendData?.attempted || 0}</div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '1rem' }}>
              <button onClick={onQuit} className="btn-primary" style={{ flex: 1, padding: '0.85rem' }}>
                🍌 Return to Menu
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  </div>
);
}
