/**
 * @file PuzzleArena.jsx
 * @description Main interactive game arena rendering Banana API math puzzles, timer, and reactive inputs.
 * @module client/components/PuzzleArena
 * @author Dipesh Raj Shrestha
 * @reference Marc Conrad - https://marcconrad.com/uob/banana/doc.php
 * @reference University of Bedfordshire - CIS046-3 Software For Enterprise
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Numpad from './Numpad.jsx';
import { useGameTimer } from '../hooks/useGameTimer.js';

export default function PuzzleArena({ gameMode = 'SPEED_RUSH', onGameOver, onQuit }) {
  // Game State
  const [currentPuzzle, setCurrentPuzzle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedDigit, setSelectedDigit] = useState(null);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [maxStreak, setMaxStreak] = useState(0);
  const [solvedCount, setSolvedCount] = useState(0);
  const [attemptedCount, setAttemptedCount] = useState(0);
  const [lives, setLives] = useState(gameMode === 'SURVIVAL' ? 3 : null);
  const [feedback, setFeedback] = useState(null); // { type: 'correct' | 'wrong', message, points }

  // High-precision response time tracker
  const puzzleStartTimeRef = useRef(Date.now());
  const solveTimesRef = useRef([]);

  // Game Timer (15s per puzzle in Survival, or 60s total in Speed Rush)
  const isSpeedRush = gameMode === 'SPEED_RUSH';
  const puzzleDurationMs = isSpeedRush ? 60000 : 15000;

  const handleTimeout = useCallback(() => {
    if (isSpeedRush) {
      // Speed rush time expired -> Game Over
      finishGame();
    } else {
      // Survival mode -> lose 1 life and move to next puzzle
      setLives((prev) => {
        const nextLives = prev - 1;
        setFeedback({
          type: 'wrong',
          message: '⏰ TIME OUT! -1 LIFE'
        });
        setStreak(0);
        setAttemptedCount((a) => a + 1);

        if (nextLives <= 0) {
          setTimeout(() => finishGame(), 1000);
        } else {
          setTimeout(() => fetchNextPuzzle(), 1200);
        }
        return nextLives;
      });
    }
  }, [isSpeedRush]);

  const timer = useGameTimer({
    warningThresholdMs: 4000,
    onTimeout: handleTimeout
  });

  // Finish game and compile session telemetry
  const finishGame = useCallback(() => {
    timer.stop();
    const totalAttempted = attemptedCount || 1;
    const accuracy = Math.round((solvedCount / totalAttempted) * 100);
    const avgTime = solveTimesRef.current.length > 0
      ? Math.round(solveTimesRef.current.reduce((a, b) => a + b, 0) / solveTimesRef.current.length)
      : 5000;

    if (onGameOver) {
      onGameOver({
        gameMode,
        totalScore: score,
        puzzlesAttempted: attemptedCount,
        puzzlesSolved: solvedCount,
        accuracyPct: accuracy,
        avgSolveTimeMs: avgTime,
        maxStreak
      });
    }
  }, [score, attemptedCount, solvedCount, maxStreak, gameMode, onGameOver, timer]);

  // Fetch next puzzle from backend proxy
  const fetchNextPuzzle = useCallback(async () => {
    try {
      setLoading(true);
      setSelectedDigit(null);
      setFeedback(null);

      const res = await fetch('/api/banana/puzzle');
      if (!res.ok) throw new Error('Failed to load puzzle');
      const data = await res.json();

      setCurrentPuzzle(data.puzzle);
      puzzleStartTimeRef.current = Date.now();

      // Start/reset countdown timer for this puzzle
      if (!isSpeedRush) {
        timer.start(puzzleDurationMs);
      }
    } catch (err) {
      console.error('[PuzzleArena] Error fetching puzzle:', err);
    } finally {
      setLoading(false);
    }
  }, [isSpeedRush, puzzleDurationMs, timer]);

  // Start round on component mount
  useEffect(() => {
    fetchNextPuzzle();
    if (isSpeedRush) {
      timer.start(puzzleDurationMs);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Submit answer verification
  const handleSubmitAnswer = useCallback(async () => {
    if (selectedDigit === null || !currentPuzzle || loading) return;

    const responseTimeMs = Date.now() - puzzleStartTimeRef.current;
    solveTimesRef.current.push(responseTimeMs);

    try {
      setLoading(true);
      const res = await fetch('/api/banana/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          puzzleId: currentPuzzle.puzzleId,
          answer: selectedDigit,
          responseTimeMs,
          currentStreak: streak
        })
      });

      const data = await res.json();
      const result = data.result;

      setAttemptedCount((prev) => prev + 1);

      if (result.isCorrect) {
        const nextStreak = streak + 1;
        setStreak(nextStreak);
        setMaxStreak((prev) => Math.max(prev, nextStreak));
        setSolvedCount((prev) => prev + 1);
        setScore((prev) => prev + result.pointsAwarded);

        setFeedback({
          type: 'correct',
          message: `CORRECT! +${result.pointsAwarded} pts (${result.speedLabel})`,
          points: result.pointsAwarded
        });

        // Auto transition to next puzzle after positive feedback
        setTimeout(() => fetchNextPuzzle(), 900);
      } else {
        setStreak(0);
        setFeedback({
          type: 'wrong',
          message: `INCORRECT! (Correct Answer: ${result.trueSolution})`
        });

        if (gameMode === 'SURVIVAL') {
          const nextLives = lives - 1;
          setLives(nextLives);
          if (nextLives <= 0) {
            setTimeout(() => finishGame(), 1000);
            return;
          }
        }

        setTimeout(() => fetchNextPuzzle(), 1200);
      }
    } catch (err) {
      console.error('[PuzzleArena] Verification error:', err);
      setLoading(false);
    }
  }, [selectedDigit, currentPuzzle, loading, streak, gameMode, lives, finishGame, fetchNextPuzzle]);

  // Reactive DOM Keyboard Listener (Theme 2: Event-Driven Programming)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (loading) return;

      // Handle Digits 0-9 (Physical number keys and Numpad)
      if (/^[0-9]$/.test(e.key)) {
        setSelectedDigit(parseInt(e.key, 10));
      } else if (e.code.startsWith('Numpad') && /^[0-9]$/.test(e.key)) {
        setSelectedDigit(parseInt(e.key, 10));
      } else if (e.key === 'Backspace' || e.key === 'Delete') {
        setSelectedDigit(null);
      } else if (e.key === 'Enter') {
        e.preventDefault();
        handleSubmitAnswer();
      } else if (e.key === 'Escape' && onQuit) {
        onQuit();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [loading, handleSubmitAnswer, onQuit]);

  return (
    <div className="glass-panel" style={{
      maxWidth: '850px',
      margin: '0 auto',
      padding: '2rem',
      display: 'flex',
      flexDirection: 'column',
      gap: '1.5rem',
      position: 'relative'
    }}>
      {/* Top HUD: Score, Streak, Mode, Timer, Lives */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderBottom: '1px solid var(--border-subtle)',
        paddingBottom: '1rem',
        flexWrap: 'wrap',
        gap: '1rem'
      }}>
        {/* Left: Score & Streak */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Score
            </div>
            <div style={{ fontSize: '1.75rem', fontWeight: 900, color: 'var(--accent-yellow)', fontFamily: 'var(--font-mono)' }}>
              {score.toLocaleString()}
            </div>
          </div>

          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Streak
            </div>
            <div style={{
              fontSize: '1.25rem',
              fontWeight: 800,
              color: streak >= 3 ? 'var(--accent-gold)' : 'var(--text-primary)',
              display: 'flex',
              alignItems: 'center',
              gap: '0.25rem'
            }}>
              <span>🔥</span>
              <span>{streak}x</span>
            </div>
          </div>
        </div>

        {/* Center: Mode Badge & Puzzles Solved */}
        <div style={{ textAlign: 'center' }}>
          <span style={{
            fontSize: '0.75rem',
            fontWeight: 800,
            padding: '0.25rem 0.75rem',
            borderRadius: 'var(--radius-full)',
            background: isSpeedRush ? 'rgba(139, 92, 246, 0.2)' : 'rgba(239, 68, 68, 0.2)',
            color: isSpeedRush ? 'var(--accent-purple)' : 'var(--accent-rose)',
            border: `1px solid ${isSpeedRush ? 'rgba(139, 92, 246, 0.4)' : 'rgba(239, 68, 68, 0.4)'}`
          }}>
            {isSpeedRush ? '⚡ SPEED RUSH' : '🛡️ SURVIVAL'}
          </span>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
            Solved: <strong>{solvedCount}</strong> / {attemptedCount}
          </div>
        </div>

        {/* Right: Lives / Timer & Quit */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
          {/* Hearts for Survival Mode */}
          {lives !== null && (
            <div style={{ display: 'flex', gap: '0.25rem', fontSize: '1.25rem' }}>
              {[1, 2, 3].map((heart) => (
                <span key={heart} style={{ opacity: heart <= lives ? 1 : 0.2 }}>
                  ❤️
                </span>
              ))}
            </div>
          )}

          {/* Countdown Clock */}
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
              {isSpeedRush ? 'Time Left' : 'Puzzle Clock'}
            </div>
            <div style={{
              fontSize: '1.75rem',
              fontWeight: 900,
              fontFamily: 'var(--font-mono)',
              color: timer.isWarning ? 'var(--accent-rose)' : 'var(--text-primary)',
              animation: timer.isWarning ? 'pulse 0.8s infinite' : 'none'
            }}>
              {timer.secondsRemaining}s
            </div>
          </div>

          <button
            onClick={onQuit}
            className="btn-secondary"
            style={{ padding: '0.4rem 0.8rem', fontSize: '0.75rem' }}
          >
            Quit
          </button>
        </div>
      </div>

      {/* Timer Progress Bar */}
      <div style={{
        width: '100%',
        height: '6px',
        background: 'var(--bg-tertiary)',
        borderRadius: 'var(--radius-full)',
        overflow: 'hidden'
      }}>
        <div style={{
          width: `${timer.progress * 100}%`,
          height: '100%',
          background: timer.isWarning ? 'var(--grad-danger)' : 'var(--grad-banana)',
          transition: 'width 100ms linear'
        }} />
      </div>

      {/* Main Puzzle Display Arena */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'minmax(320px, 1fr) 300px',
        gap: '2rem',
        alignItems: 'center'
      }}>
        {/* Left Column: Puzzle Image with Fallback Badge */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '1rem',
          background: 'rgba(0,0,0,0.3)',
          borderRadius: 'var(--radius-lg)',
          padding: '1.25rem',
          border: '1px solid var(--border-subtle)',
          minHeight: '280px',
          justifyContent: 'center',
          position: 'relative'
        }}>
          {currentPuzzle?.isFallback && (
            <div style={{
              position: 'absolute',
              top: '0.75rem',
              left: '0.75rem',
              background: 'rgba(245, 158, 11, 0.2)',
              border: '1px solid var(--accent-gold)',
              borderRadius: 'var(--radius-full)',
              padding: '0.2rem 0.6rem',
              fontSize: '0.65rem',
              fontWeight: 700,
              color: 'var(--accent-yellow)'
            }}>
              🛡️ Offline Resilient Fallback
            </div>
          )}

          {loading && !currentPuzzle ? (
            <div style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
              <span style={{ fontSize: '2rem' }}>🍌</span>
              <p style={{ marginTop: '0.5rem', fontSize: '0.9rem' }}>Loading next math puzzle from Banana API...</p>
            </div>
          ) : currentPuzzle ? (
            <img
              src={currentPuzzle.question}
              alt="Banana Math Puzzle"
              style={{
                maxWidth: '100%',
                maxHeight: '260px',
                objectFit: 'contain',
                borderRadius: 'var(--radius-md)'
              }}
            />
          ) : null}

          {/* Answer Preview Box */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            marginTop: '0.5rem'
          }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              Your Answer:
            </span>
            <div style={{
              width: '54px',
              height: '54px',
              borderRadius: 'var(--radius-md)',
              border: '2px solid var(--accent-gold)',
              background: 'var(--bg-tertiary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '2rem',
              fontWeight: 900,
              fontFamily: 'var(--font-mono)',
              color: selectedDigit !== null ? 'var(--accent-yellow)' : 'var(--text-muted)',
              boxShadow: selectedDigit !== null ? 'var(--shadow-glow)' : 'none'
            }}>
              {selectedDigit !== null ? selectedDigit : '?'}
            </div>
          </div>
        </div>

        {/* Right Column: Tactile Numpad */}
        <div>
          <Numpad
            onDigitPress={(d) => setSelectedDigit(d)}
            onClear={() => setSelectedDigit(null)}
            onSubmit={handleSubmitAnswer}
            disabled={loading}
            activeDigit={selectedDigit}
          />
        </div>
      </div>

      {/* Real-Time Answer Feedback Banner */}
      {feedback && (
        <div style={{
          padding: '0.85rem',
          borderRadius: 'var(--radius-md)',
          textAlign: 'center',
          fontWeight: 800,
          fontSize: '1rem',
          background: feedback.type === 'correct' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(244, 63, 94, 0.15)',
          border: `1px solid ${feedback.type === 'correct' ? 'var(--accent-emerald)' : 'var(--accent-rose)'}`,
          color: feedback.type === 'correct' ? 'var(--accent-emerald)' : 'var(--accent-rose)',
          animation: 'fadeIn 0.2s ease-out'
        }}>
          {feedback.message}
        </div>
      )}
    </div>
  );
}
