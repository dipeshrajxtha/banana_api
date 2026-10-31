/**
 * @file PuzzleArena.jsx
 * @description Main interactive game arena with Modern Arcade HUD Overhaul.
 * Features Framer Motion animations, glowing arcade stat cards, animated timer arc,
 * confetti bursts, screen shake, floating score popups, and tactile 3D-press buttons.
 * Deeply integrates with CustomEventBus to decouple gameplay signals, audio, and HUD diagnostics.
 * Supports multiple distinct challenge modes: SPEED_RUSH, SURVIVAL, STREAK_MASTER, TIME_ATTACK, and PRACTICE.
 * @module client/components/PuzzleArena
 * @author Dipesh Raj Shrestha
 * @reference Marc Conrad - https://marcconrad.com/uob/banana/doc.php
 * @reference University of Bedfordshire - CIS046-3 Software For Enterprise (Theme 2)
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import { GAME_EVENTS, GAME_MODES } from '@banana-quest/shared';
import Numpad from './Numpad.jsx';
import FloatingPoints from './FloatingPoints.jsx';
import MinionReactionAvatar from './MinionReactionAvatar.jsx';
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

  // Animation state
  const [shaking, setShaking] = useState(false);
  const [pointsTrigger, setPointsTrigger] = useState(null);

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

  // Fire confetti burst
  const fireConfetti = useCallback(() => {
    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#F59E0B', '#FBBF24', '#FCD34D', '#10B981', '#8B5CF6']
    });
  }, []);

  // Trigger screen shake
  const triggerShake = useCallback(() => {
    setShaking(true);
    setTimeout(() => setShaking(false), 500);
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

        // Floating points animation
        setPointsTrigger({ points, ts: Date.now() });

        // Confetti on correct answer (bigger burst on streaks)
        if (nextStreak >= 3) {
          confetti({
            particleCount: 120,
            spread: 90,
            origin: { y: 0.5 },
            colors: ['#F59E0B', '#FBBF24', '#FCD34D', '#10B981', '#8B5CF6', '#06B6D4']
          });
        } else {
          fireConfetti();
        }

        // Mode Win / Progression Triggers
        if (isStreakMaster && nextSolved >= 10) {
          setTimeout(() => {
            if (finishGameRef.current) finishGameRef.current();
          }, 850);
          return;
        }

        if (isTimeAttack && nextSolved >= 10) {
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

        // Screen shake on wrong answer
        triggerShake();

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
  }, [selectedDigit, currentPuzzle, loading, isStreakMaster, isTimeAttack, isSurvival, fetchNextPuzzle, fireConfetti, triggerShake]);

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

  // Timer arc SVG values
  const timerRadius = 28;
  const timerCircumference = 2 * Math.PI * timerRadius;
  const timerOffset = timerCircumference * (1 - timer.progress);

  // Dynamic Minion Reaction State
  const minionReaction = feedback?.type === 'correct'
    ? (streak >= 3 ? 'streak' : 'correct')
    : feedback?.type === 'wrong'
      ? 'wrong'
      : (hasTimer && timer.isWarning ? 'urgent' : 'idle');

  return (
    <motion.div
      className="glass-panel"
      initial={{ opacity: 0, y: 30 }}
      animate={{
        opacity: 1,
        y: 0,
        x: shaking ? [-8, 8, -6, 6, -3, 3, 0] : 0
      }}
      transition={shaking ? { duration: 0.5 } : { type: 'spring', stiffness: 200, damping: 20 }}
      style={{
        maxWidth: '850px',
        margin: '0 auto',
        padding: '2rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '1.5rem',
        position: 'relative'
      }}
    >
      {/* Floating Points Overlay */}
      <FloatingPoints trigger={pointsTrigger} />

      {/* ═══════ TOP HUD BAR ═══════ */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: '0.75rem',
        flexWrap: 'wrap'
      }}>
        {/* Left: Score & Streak Cards */}
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          {/* Score Card */}
          <motion.div
            className="hud-stat-card"
            key={score}
            animate={{ scale: [1, 1.08, 1] }}
            transition={{ duration: 0.3 }}
          >
            <span className="stat-label">Score</span>
            <span className="stat-value" style={{ color: 'var(--accent-yellow)' }}>
              {score.toLocaleString()}
            </span>
          </motion.div>

          {/* Streak Card */}
          <motion.div
            className="hud-stat-card"
            style={{
              animation: streak >= 3 ? 'streakFire 1s ease-in-out infinite' : 'none'
            }}
          >
            <span className="stat-label">Streak</span>
            <span className="stat-value" style={{
              color: streak >= 5 ? 'var(--accent-gold)' : streak >= 3 ? 'var(--accent-yellow)' : 'var(--text-primary)',
              display: 'flex',
              alignItems: 'center',
              gap: '0.2rem'
            }}>
              <motion.span
                key={streak}
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: 'spring', stiffness: 300 }}
              >
                🔥
              </motion.span>
              <motion.span
                key={`s-${streak}`}
                initial={{ y: -20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ type: 'spring', stiffness: 400 }}
              >
                {streak}x
              </motion.span>
            </span>
          </motion.div>
        </div>

        {/* Center: Mode Badge & Progress */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', delay: 0.1 }}
          style={{ textAlign: 'center' }}
        >
          <span style={{
            fontSize: '0.75rem',
            fontWeight: 800,
            padding: '0.25rem 0.75rem',
            borderRadius: 'var(--radius-full)',
            background: 'rgba(255, 255, 255, 0.05)',
            color: getModeColor(),
            border: `1px solid ${getModeColor()}`,
            display: 'inline-block'
          }}>
            {getModeLabel()}
          </span>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
            Solved: <strong>{solvedCount}</strong>
            {isStreakMaster || isTimeAttack ? ' / 10 Goal' : ` / ${attemptedCount}`}
          </div>
        </motion.div>

        {/* Right: Timer / Lives / Quit */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          {/* Hearts Indicator */}
          {lives !== null && (
            <div style={{ display: 'flex', gap: '0.3rem', fontSize: '1.25rem' }}>
              {Array.from({ length: initialLives || 1 }).map((_, i) => (
                <motion.span
                  key={i}
                  animate={i >= lives ? {
                    scale: [1, 1.3, 0],
                    rotate: [0, 15, 30],
                    opacity: [1, 0.5, 0]
                  } : { scale: 1, opacity: 1 }}
                  transition={{ duration: 0.5 }}
                  style={{ display: 'inline-block' }}
                >
                  {i < lives ? '❤️' : '🖤'}
                </motion.span>
              ))}
            </div>
          )}

          {/* Timer: Circular Arc for timed modes */}
          {hasTimer ? (
            <div className="timer-progress-ring">
              <svg width="70" height="70" viewBox="0 0 70 70">
                <circle
                  className="ring-bg"
                  cx="35" cy="35" r={timerRadius}
                />
                <circle
                  className="ring-fg"
                  cx="35" cy="35" r={timerRadius}
                  stroke={timer.isWarning ? 'var(--accent-rose)' : 'var(--accent-gold)'}
                  strokeDasharray={timerCircumference}
                  strokeDashoffset={timerOffset}
                />
              </svg>
              <div style={{
                position: 'absolute',
                inset: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexDirection: 'column'
              }}>
                <motion.span
                  style={{
                    fontSize: '1.1rem',
                    fontWeight: 900,
                    fontFamily: 'var(--font-mono)',
                    color: timer.isWarning ? 'var(--accent-rose)' : 'var(--text-primary)',
                    animation: timer.isWarning ? 'timerUrgent 0.8s infinite' : 'none'
                  }}
                >
                  {timer.secondsRemaining}s
                </motion.span>
              </div>
            </div>
          ) : (
            <div className="hud-stat-card">
              <span className="stat-label">Timer</span>
              <span className="stat-value" style={{ color: 'var(--accent-emerald)', fontSize: '1rem' }}>
                ∞
              </span>
            </div>
          )}

          <motion.button
            onClick={onQuit}
            className="btn-secondary"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            style={{ padding: '0.4rem 0.8rem', fontSize: '0.75rem' }}
          >
            Quit
          </motion.button>
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
          <motion.div
            style={{
              width: `${timer.progress * 100}%`,
              height: '100%',
              background: timer.isWarning ? 'var(--grad-danger)' : 'var(--grad-banana)',
              borderRadius: 'var(--radius-full)'
            }}
            transition={{ duration: 0.1 }}
          />
        </div>
      )}

      {/* ═══════ MAIN PUZZLE DISPLAY ARENA ═══════ */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'minmax(320px, 1fr) 300px',
        gap: '2rem',
        alignItems: 'center'
      }}>
        {/* Left Column: Puzzle Image */}
        <motion.div
          className="puzzle-container"
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.15 }}
        >
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
              color: 'var(--accent-yellow)',
              zIndex: 2
            }}>
              🛡️ Offline Resilient Fallback
            </div>
          )}

          <AnimatePresence mode="wait">
            {loading && !currentPuzzle ? (
              <motion.div
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                style={{ textAlign: 'center', color: 'var(--text-muted)' }}
              >
                <motion.span
                  animate={{ rotate: [0, 20, -20, 0], scale: [1, 1.2, 1] }}
                  transition={{ repeat: Infinity, duration: 1.5 }}
                  style={{ fontSize: '2.5rem', display: 'block' }}
                >
                  🍌
                </motion.span>
                <p style={{ marginTop: '0.5rem', fontSize: '0.9rem' }}>Loading next puzzle...</p>
              </motion.div>
            ) : currentPuzzle ? (
              <motion.img
                key={currentPuzzle.puzzleId}
                src={currentPuzzle.question}
                alt="Banana Math Puzzle"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8, y: -20 }}
                transition={{ type: 'spring', stiffness: 200, damping: 20 }}
                style={{
                  maxWidth: '100%',
                  maxHeight: '260px',
                  objectFit: 'contain',
                  borderRadius: 'var(--radius-md)'
                }}
              />
            ) : null}
          </AnimatePresence>

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
            <motion.div
              animate={{
                borderColor: selectedDigit !== null ? 'var(--accent-gold)' : 'var(--border-medium)',
                boxShadow: selectedDigit !== null ? '0 0 20px var(--accent-gold-glow)' : 'none'
              }}
              style={{
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
                color: selectedDigit !== null ? 'var(--accent-yellow)' : 'var(--text-muted)'
              }}
            >
              <AnimatePresence mode="wait">
                <motion.span
                  key={selectedDigit ?? 'empty'}
                  initial={{ scale: 0, rotate: -90 }}
                  animate={{ scale: 1, rotate: 0 }}
                  exit={{ scale: 0, rotate: 90 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 15 }}
                >
                  {selectedDigit !== null ? selectedDigit : '?'}
                </motion.span>
              </AnimatePresence>
            </motion.div>
          </div>
        </motion.div>

        {/* Right Column: Minion Lab Assistant & Tactile 3D Numpad */}
        <motion.div
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}
        >
          {/* Minion Laboratory Teammate */}
          <MinionReactionAvatar
            reaction={minionReaction}
            feedbackText={feedback ? (feedback.type === 'correct' ? 'BANANAAA! 🎉' : 'TRY AGAIN! 🧐') : null}
          />

          <Numpad
            onDigitPress={(d) => setSelectedDigit(d)}
            onClear={() => setSelectedDigit(null)}
            onSubmit={handleSubmitAnswer}
            disabled={loading}
            activeDigit={selectedDigit}
          />
        </motion.div>
      </div>

      {/* ═══════ REAL-TIME ANSWER FEEDBACK BANNER ═══════ */}
      <AnimatePresence>
        {feedback && (
          <motion.div
            key={feedback.message}
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.9 }}
            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            className={feedback.type === 'correct' ? 'feedback-correct' : 'feedback-wrong'}
            style={{
              padding: '0.85rem',
              borderRadius: 'var(--radius-md)',
              textAlign: 'center',
              fontWeight: 800,
              fontSize: '1rem',
              background: feedback.type === 'correct' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(244, 63, 94, 0.15)',
              border: `1px solid ${feedback.type === 'correct' ? 'var(--accent-emerald)' : 'var(--accent-rose)'}`,
              color: feedback.type === 'correct' ? 'var(--accent-emerald)' : 'var(--accent-rose)'
            }}
          >
            {feedback.type === 'correct' ? '✅ ' : '❌ '}{feedback.message}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
