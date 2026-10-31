/**
 * @file GameOverModal.jsx
 * @description High-impact arcade recap modal with Framer Motion animations, confetti celebrations,
 * grade tiers (S/A/B/C/D), score telemetry, leaderboard submission feedback, and replay controls.
 * @module client/components/GameOverModal
 * @author Dipesh Raj Shrestha
 * @reference University of Bedfordshire - CIS046-3 Software For Enterprise
 */

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import { evaluatePlayerGrade, GAME_MODES } from '@banana-quest/shared';

export default function GameOverModal({ stats, currentUser, onPlayAgain, onReturnHome }) {
  const [submissionStatus, setSubmissionStatus] = useState(null);
  const [showStats, setShowStats] = useState(false);

  if (!stats) return null;

  const {
    gameMode = 'SPEED_RUSH',
    totalScore = 0,
    puzzlesAttempted = 0,
    puzzlesSolved = 0,
    accuracyPct = 0,
    avgSolveTimeMs = 0,
    maxStreak = 0
  } = stats;

  const grade = evaluatePlayerGrade(totalScore, accuracyPct, avgSolveTimeMs);
  const avgSeconds = (avgSolveTimeMs / 1000).toFixed(1);

  // Trigger confetti for S and A rank on mount
  useEffect(() => {
    if (grade.id === 'S' || grade.id === 'A') {
      // Grand celebration
      const duration = 2500;
      const end = Date.now() + duration;
      const interval = setInterval(() => {
        if (Date.now() > end) {
          clearInterval(interval);
          return;
        }
        confetti({
          particleCount: 50,
          angle: 60 + Math.random() * 60,
          spread: 55,
          origin: { x: Math.random(), y: Math.random() * 0.5 },
          colors: ['#FFD700', '#F59E0B', '#FBBF24', '#8B5CF6', '#10B981', '#06B6D4']
        });
      }, 150);
      return () => clearInterval(interval);
    } else if (grade.id === 'B') {
      // Moderate celebration
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#F59E0B', '#FBBF24', '#FCD34D']
      });
    }
  }, [grade.id]);

  // Stagger stats reveal
  useEffect(() => {
    const timer = setTimeout(() => setShowStats(true), 600);
    return () => clearTimeout(timer);
  }, []);

  // Auto-submit score to SQLite backend if user has an active identity (Google or Guest)
  useEffect(() => {
    let isMounted = true;

    async function recordSession() {
      try {
        const res = await fetch('/api/scores/submit', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            gameMode,
            totalScore,
            puzzlesAttempted,
            puzzlesSolved,
            accuracyPct,
            avgSolveTimeMs,
            maxStreak
          })
        });
        if (res.ok) {
          const data = await res.json();
          if (isMounted) {
            setSubmissionStatus({
              recorded: true,
              isNewHighScore: data.isNewHighScore,
              highScore: data.currentHighScore
            });
          }
        }
      } catch (err) {
        console.warn('[GameOver] Score submission note:', err.message);
      }
    }

    if (currentUser) {
      recordSession();
    }

    return () => { isMounted = false; };
  }, [currentUser, gameMode, totalScore, puzzlesAttempted, puzzlesSolved, accuracyPct, avgSolveTimeMs, maxStreak]);

  const getModeTitle = () => {
    switch (gameMode) {
      case GAME_MODES.SPEED_RUSH: return '⚡ SPEED RUSH SESSION RECAP';
      case GAME_MODES.SURVIVAL: return '🛡️ SURVIVAL SESSION RECAP';
      case GAME_MODES.STREAK_MASTER: return '🎯 PERFECT 10 SESSION RECAP';
      case GAME_MODES.TIME_ATTACK: return '⏱️ TIME ATTACK SESSION RECAP';
      case GAME_MODES.PRACTICE: return '🧘 ZEN PRACTICE SESSION RECAP';
      default: return `${gameMode} SESSION RECAP`;
    }
  };

  const statItems = [
    { label: 'Final Score', value: totalScore.toLocaleString(), color: 'var(--accent-yellow)', large: true },
    { label: 'Accuracy', value: `${accuracyPct}%`, color: accuracyPct >= 80 ? 'var(--accent-emerald)' : 'var(--text-primary)', large: true },
    { label: 'Puzzles', value: `${puzzlesSolved} / ${puzzlesAttempted}`, color: 'var(--accent-cyan)', large: true },
    { label: 'Avg Speed', value: `${avgSeconds}s`, color: 'var(--text-primary)', large: false },
    { label: 'Max Streak', value: `🔥 ${maxStreak}x`, color: 'var(--accent-gold)', large: false },
    { label: 'Tier Class', value: `${grade.id} Rank`, color: grade.badgeColor, large: false }
  ];

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(5, 7, 12, 0.85)',
          backdropFilter: 'blur(12px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 100,
          padding: '1.5rem'
        }}
      >
        <motion.div
          className="glass-panel"
          initial={{ scale: 0.7, opacity: 0, y: 50 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 200, damping: 20, delay: 0.1 }}
          style={{
            maxWidth: '560px',
            width: '100%',
            padding: '2.5rem',
            textAlign: 'center',
            position: 'relative',
            border: `2px solid ${grade.badgeColor}40`,
            boxShadow: `0 0 35px ${grade.badgeColor}25`
          }}
        >
          {/* Arcade Badge Tier Header */}
          <motion.div
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.35rem 1rem',
              borderRadius: 'var(--radius-full)',
              background: `${grade.badgeColor}15`,
              border: `1px solid ${grade.badgeColor}50`,
              marginBottom: '1rem'
            }}
          >
            <span style={{ fontSize: '0.85rem', fontWeight: 800, color: grade.badgeColor, letterSpacing: '0.05em' }}>
              {getModeTitle()}
            </span>
          </motion.div>

          {/* Large Grade Rank Stamp */}
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.3 }}
            style={{
              fontSize: '5rem',
              fontWeight: 900,
              fontFamily: 'var(--font-display)',
              color: grade.badgeColor,
              lineHeight: 1,
              textShadow: `0 0 30px ${grade.badgeColor}60`,
              margin: '0.5rem 0'
            }}
          >
            {grade.id}
          </motion.div>

          <motion.h3
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            style={{ fontSize: '1.75rem', fontWeight: 800, margin: '0 0 0.25rem 0' }}
          >
            {grade.name}
          </motion.h3>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.55 }}
            style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '1.5rem' }}
          >
            {grade.description}
          </motion.p>

          {/* Leaderboard High Score Banner */}
          <AnimatePresence>
            {submissionStatus && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                style={{
                  background: submissionStatus.isNewHighScore ? 'rgba(245, 158, 11, 0.15)' : 'rgba(16, 185, 129, 0.15)',
                  border: `1px solid ${submissionStatus.isNewHighScore ? 'var(--accent-gold)' : 'var(--accent-emerald)'}`,
                  borderRadius: 'var(--radius-sm)',
                  padding: '0.5rem 1rem',
                  fontSize: '0.85rem',
                  fontWeight: 700,
                  color: submissionStatus.isNewHighScore ? 'var(--accent-yellow)' : 'var(--accent-emerald)',
                  marginBottom: '1.5rem'
                }}
              >
                {submissionStatus.isNewHighScore
                  ? `🏆 NEW PERSONAL HIGH SCORE! Recorded to Global Hall of Fame.`
                  : `✓ Score verified & saved to player match history.`}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Telemetry Stats Grid */}
          {showStats && (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: '1rem',
              marginBottom: '2rem'
            }}>
              {statItems.map((item, index) => (
                <motion.div
                  key={item.label}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 + index * 0.08, type: 'spring', stiffness: 300 }}
                  style={{
                    background: 'var(--bg-tertiary)',
                    padding: item.large ? '1rem 0.5rem' : '0.75rem 0.5rem',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border-subtle)'
                  }}
                >
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    {item.label}
                  </div>
                  <div style={{
                    fontSize: item.large ? '1.5rem' : '1.15rem',
                    fontWeight: item.large ? 900 : 800,
                    color: item.color,
                    fontFamily: 'var(--font-mono)'
                  }}>
                    {item.value}
                  </div>
                </motion.div>
              ))}
            </div>
          )}

          {/* Action Controls */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.1 }}
            style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}
          >
            <motion.button
              onClick={onPlayAgain}
              className="btn-primary"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              style={{ flex: 1, padding: '0.85rem 1.5rem', fontSize: '1rem' }}
            >
              🔄 Play Again
            </motion.button>
            <motion.button
              onClick={onReturnHome}
              className="btn-secondary"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              style={{ flex: 1, padding: '0.85rem 1.5rem', fontSize: '1rem' }}
            >
              🏠 Return Home
            </motion.button>
          </motion.div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
