/**
 * @file PuzzleArena.jsx
 * @description Main interactive game arena rendering Banana API math puzzles, timer, and reactive inputs.
 * Deeply integrates with CustomEventBus to decouple gameplay signals, audio, and HUD diagnostics.
 * Supports multiple distinct challenge modes: SPEED_RUSH, SURVIVAL, STREAK_MASTER, TIME_ATTACK, and PRACTICE.
 * @module client/components/PuzzleArena
 * @author Dipesh Raj Shrestha
 * @reference Marc Conrad - https://marcconrad.com/uob/banana/doc.php
 * @reference University of Bedfordshire - CIS046-3 Software For Enterprise (Theme 2)
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { GAME_EVENTS, GAME_MODES } from '@banana-quest/shared';
import Numpad from './Numpad.jsx';
import { useGameTimer } from '../hooks/useGameTimer.js';
import { eventBus } from '../events/eventBus.js';

export default function PuzzleArena({ gameMode = GAME_MODES.SPEED_RUSH, onGameOver, onQuit }) {
  // Game State
  const [currentPuzzle, setCurrentPuzzle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedDigit, setSelectedDigit] = useState(null);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [maxStreak, setMaxStreak] = useState(0);
  const [solvedCount, setSolvedCount] = useState(0);
  const [attemptedCount, setAttemptedCount] = useState(0);

  // Lives setup depending on mode
  const initialLives = gameMode === GAME_MODES.SURVIVAL
    ? 3
    : gameMode === GAME_MODES.STREAK_MASTER
      ? 1
      : null;
  const [lives, setLives] = useState(initialLives);
  const [feedback, setFeedback] = useState(null); // { type: 'correct' | 'wrong', message, points }

  // High-precision response time tracker
  const puzzleStartTimeRef = useRef(Date.now());
  const solveTimesRef = useRef([]);

  // Synchronization refs to prevent stale closures and TDZ initialization errors
  const scoreRef = useRef(0);
  const streakRef = useRef(0);
  const maxStreakRef = useRef(0);
  const solvedCountRef = useRef(0);
  const attemptedCountRef = useRef(0);
  const livesRef = useRef(initialLives);
  const finishGameRef = useRef(null);

  // Keep refs synchronized with state
  scoreRef.current = score;
  streakRef.current = streak;
  maxStreakRef.current = maxStreak;
  solvedCountRef.current = solvedCount;
  attemptedCountRef.current = attemptedCount;
  livesRef.current = lives;

  // Game Mode Configurations
  const isSpeedRush = gameMode === GAME_MODES.SPEED_RUSH;
  const isTimeAttack = gameMode === GAME_MODES.TIME_ATTACK;
  const isStreakMaster = gameMode === GAME_MODES.STREAK_MASTER;
  const isSurvival = gameMode === GAME_MODES.SURVIVAL;
  const isPractice = gameMode === GAME_MODES.PRACTICE;

  // Timed modes configuration
  const durationMs = isSpeedRush ? 60000 : isTimeAttack ? 90000 : 0;
  const hasTimer = isSpeedRush || isTimeAttack;

  // Timer callback delegates to finishGameRef to avoid TDZ circularity
  const handleTimeout = useCallback(() => {
    if (hasTimer && finishGameRef.current) {
      finishGameRef.current();
    }
  }, [hasTimer]);

  const timer = useGameTimer({
    warningThresholdMs: 5000,
    onTimeout: handleTimeout
  });

  // Finish game compiles authoritative telemetry from synchronization refs
  const finishGame = useCallback(() => {
    timer.stop();
    const totalAttempted = attemptedCountRef.current;
    const solved = solvedCountRef.current;
    const finalScore = scoreRef.current;
    const bestStreak = maxStreakRef.current;
    const accuracy = totalAttempted > 0 ? Math.round((solved / totalAttempted) * 100) : 0;
    const avgTime = solveTimesRef.current.length > 0
      ? Math.round(solveTimesRef.current.reduce((a, b) => a + b, 0) / solveTimesRef.current.length)
      : 0;

    const sessionSummary = {
      gameMode,
      totalScore: finalScore,
      puzzlesAttempted: totalAttempted,
      puzzlesSolved: solved,
      accuracyPct: accuracy,
      avgSolveTimeMs: avgTime,
      maxStreak: bestStreak
    };

    // Emit event bus game over signal for audio engine and telemetry handlers
    eventBus.emit(GAME_EVENTS.GAME_OVER, sessionSummary);

    if (onGameOver) {
      onGameOver(sessionSummary);
    }
  }, [gameMode, onGameOver, timer]);

  // Bind ref to latest finishGame instance
  finishGameRef.current = finishGame;

  // Fetch next puzzle from backend proxy
  const fetchNextPuzzle = useCallback(async () => {
    try {
      setLoading(true);
      setSelectedDigit(null);
      setFeedback(null);

      eventBus.emit(GAME_EVENTS.PUZZLE_REQUESTED);

      const res = await fetch('/api/banana/puzzle');
      if (!res.ok) throw new Error('Failed to load puzzle');
      const data = await res.json();

      setCurrentPuzzle(data.puzzle);
      puzzleStartTimeRef.current = Date.now();

      eventBus.emit(GAME_EVENTS.PUZZLE_LOADED, {
        puzzleId: data.puzzle.puzzleId,
        isFallback: data.puzzle.isFallback
      });
    } catch (err) {
      console.error('[PuzzleArena] Error fetching puzzle:', err);
      eventBus.emit(GAME_EVENTS.PUZZLE_ERROR, { error: err.message });
    } finally {
      setLoading(false);
    }
  }, []);

  // Start round on component mount
  useEffect(() => {
    eventBus.emit(GAME_EVENTS.GAME_STARTED, { gameMode });
    fetchNextPuzzle();
    if (hasTimer) {
      timer.start(durationMs);
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
          currentStreak: streakRef.current
        })
      });

      if (!res.ok) {
        throw new Error(`Verification endpoint failed with status ${res.status}`);
      }

      const data = await res.json();
      const result = data.result;

      if (!result) {
        throw new Error('Empty verification result payload');
      }

      const nextAttempted = attemptedCountRef.current + 1;
      attemptedCountRef.current = nextAttempted;
      setAttemptedCount(nextAttempted);

      if (result.isCorrect) {
        const nextStreak = streakRef.current + 1;
        streakRef.current = nextStreak;
        setStreak(nextStreak);

        const nextMaxStreak = Math.max(maxStreakRef.current, nextStreak);
        maxStreakRef.current = nextMaxStreak;
        setMaxStreak(nextMaxStreak);

        const nextSolved = solvedCountRef.current + 1;
        solvedCountRef.current = nextSolved;
        setSolvedCount(nextSolved);

        const points = result.pointsAwarded || 100;
        const nextScore = scoreRef.current + points;
        scoreRef.current = nextScore;
        setScore(nextScore);

        // Emit decoupled events for audio synthesizer and stats
        eventBus.emit(GAME_EVENTS.ANSWER_CORRECT, {
          points,
          streak: nextStreak,
          speedLabel: result.speedLabel
        });
        eventBus.emit(GAME_EVENTS.STREAK_UPDATED, { streak: nextStreak });

        setFeedback({
          type: 'correct',
          message: `CORRECT! +${points} pts (${result.speedLabel})`,
          points
        });

        // Mode Win / Progression Triggers
        if (isStreakMaster && nextSolved >= 10) {
          // Player achieved Perfect 10 Streak Master
          setTimeout(() => {
            if (finishGameRef.current) finishGameRef.current();
          }, 850);
          return;
        }

        if (isTimeAttack && nextSolved >= 10) {
          // Completed 10-puzzle Time Attack Sprint
          setTimeout(() => {
            if (finishGameRef.current) finishGameRef.current();
          }, 850);
          return;
        }

        // Auto transition to next puzzle after positive feedback
        setTimeout(() => {
          fetchNextPuzzle();
        }, 850);
      } else {
        streakRef.current = 0;
        setStreak(0);

        eventBus.emit(GAME_EVENTS.ANSWER_WRONG, {
          trueSolution: result.trueSolution
        });

        setFeedback({
          type: 'wrong',
          message: `INCORRECT! (Correct Answer: ${result.trueSolution})`
        });

        // Failure handling per mode
        if (isSurvival || isStreakMaster) {
          const nextLives = (livesRef.current ?? 1) - 1;
          livesRef.current = nextLives;
          setLives(nextLives);
          eventBus.emit(GAME_EVENTS.LIFE_LOST, { livesRemaining: nextLives });

          if (nextLives <= 0) {
            setTimeout(() => {
              if (finishGameRef.current) finishGameRef.current();
            }, 1000);
            return;
          }
        }

        setTimeout(() => {
          fetchNextPuzzle();
        }, 1100);
      }
    } catch (err) {
      console.error('[PuzzleArena] Verification error:', err);
      setLoading(false);
    }
  }, [selectedDigit, currentPuzzle, loading, isStreakMaster, isTimeAttack, isSurvival, fetchNextPuzzle]);

  // Reactive DOM Keyboard Listener (Theme 2: Event-Driven Programming)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (loading) return;

      // Handle Digits 0-9 (Physical number keys and Numpad)
      if (/^[0-9]$/.test(e.key)) {
        const digit = parseInt(e.key, 10);
        setSelectedDigit(digit);
        eventBus.emit(GAME_EVENTS.INPUT_DIGIT, { digit });
      } else if (e.code.startsWith('Numpad') && /^[0-9]$/.test(e.key)) {
        const digit = parseInt(e.key, 10);
        setSelectedDigit(digit);
        eventBus.emit(GAME_EVENTS.INPUT_DIGIT, { digit });
      } else if (e.key === 'Backspace' || e.key === 'Delete') {
        setSelectedDigit(null);
        eventBus.emit(GAME_EVENTS.INPUT_CLEAR);
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

  // Mode Display Name Helper
  const getModeLabel = () => {
    switch (gameMode) {
      case GAME_MODES.SPEED_RUSH: return '⚡ SPEED RUSH';
      case GAME_MODES.SURVIVAL: return '🛡️ SURVIVAL';
      case GAME_MODES.STREAK_MASTER: return '🎯 PERFECT 10';
      case GAME_MODES.TIME_ATTACK: return '⏱️ TIME ATTACK';
      case GAME_MODES.PRACTICE: return '🧘 ZEN PRACTICE';
      default: return gameMode;
    }
  };

  const getModeColor = () => {
    switch (gameMode) {
      case GAME_MODES.SPEED_RUSH: return 'var(--accent-purple)';
      case GAME_MODES.SURVIVAL: return 'var(--accent-rose)';
      case GAME_MODES.STREAK_MASTER: return 'var(--accent-gold)';
      case GAME_MODES.TIME_ATTACK: return 'var(--accent-cyan)';
      case GAME_MODES.PRACTICE: return 'var(--accent-emerald)';
      default: return 'var(--accent-yellow)';
    }
  };

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
            background: 'rgba(255, 255, 255, 0.05)',
            color: getModeColor(),
            border: `1px solid ${getModeColor()}`
          }}>
            {getModeLabel()}
          </span>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
            Solved: <strong>{solvedCount}</strong>
            {isStreakMaster || isTimeAttack ? ' / 10 Goal' : ` / ${attemptedCount}`}
          </div>
        </div>

        {/* Right: Lives / Timer & Quit */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
          {/* Hearts Indicator */}
          {lives !== null && (
            <div style={{ display: 'flex', gap: '0.25rem', fontSize: '1.25rem' }}>
              {Array.from({ length: initialLives || 1 }).map((_, i) => (
                <span key={i} style={{ opacity: i < lives ? 1 : 0.2 }}>
                  ❤️
                </span>
              ))}
            </div>
          )}

          {/* Clock or Mode Condition */}
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
              {hasTimer ? 'Time Left' : 'Time Limit'}
            </div>
            <div style={{
              fontSize: '1.75rem',
              fontWeight: 900,
              fontFamily: 'var(--font-mono)',
              color: hasTimer
                ? (timer.isWarning ? 'var(--accent-rose)' : 'var(--text-primary)')
                : 'var(--accent-emerald)',
              animation: hasTimer && timer.isWarning ? 'pulse 0.8s infinite' : 'none'
            }}>
              {hasTimer ? `${timer.secondsRemaining}s` : '∞ Untimed'}
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

      {/* Timer Progress Bar (Timed Modes Only) */}
      {hasTimer && (
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
      )}

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
