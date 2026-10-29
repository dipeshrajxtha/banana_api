/**
 * @file GameOverModal.jsx
 * @description High-impact arcade recap modal displaying grade tiers (S/A/B/C/D), score telemetry, and replay controls.
 * @module client/components/GameOverModal
 * @author Dipesh Raj Shrestha
 * @reference University of Bedfordshire - CIS046-3 Software For Enterprise
 */

import React from 'react';
import { evaluatePlayerGrade } from '@banana-quest/shared';

export default function GameOverModal({ stats, onPlayAgain, onReturnHome }) {
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
        maxWidth: '560px',
        width: '100%',
        padding: '2.5rem',
        textAlign: 'center',
        position: 'relative',
        border: `2px solid ${grade.badgeColor}40`,
        boxShadow: `0 0 35px ${grade.badgeColor}25`
      }}>
        {/* Arcade Badge Tier Header */}
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.5rem',
          padding: '0.35rem 1rem',
          borderRadius: 'var(--radius-full)',
          background: `${grade.badgeColor}15`,
          border: `1px solid ${grade.badgeColor}50`,
          marginBottom: '1rem'
        }}>
          <span style={{ fontSize: '0.85rem', fontWeight: 800, color: grade.badgeColor, letterSpacing: '0.05em' }}>
            {gameMode === 'SPEED_RUSH' ? '⚡ SPEED RUSH SESSION RECAP' : '🛡️ SURVIVAL SESSION RECAP'}
          </span>
        </div>

        {/* Large Grade Rank Stamp */}
        <div style={{
          fontSize: '5rem',
          fontWeight: 900,
          fontFamily: 'var(--font-display)',
          color: grade.badgeColor,
          lineHeight: 1,
          textShadow: `0 0 30px ${grade.badgeColor}60`,
          margin: '0.5rem 0'
        }}>
          {grade.id}
        </div>

        <h3 style={{ fontSize: '1.75rem', fontWeight: 800, margin: '0 0 0.5rem 0' }}>
          {grade.name}
        </h3>
        <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '2rem' }}>
          {grade.description}
        </p>

        {/* Telemetry Stats Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '1rem',
          marginBottom: '2rem'
        }}>
          {/* Final Score */}
          <div style={{
            background: 'var(--bg-tertiary)',
            padding: '1rem 0.5rem',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-subtle)'
          }}>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Final Score
            </div>
            <div style={{ fontSize: '1.5rem', fontWeight: 900, color: 'var(--accent-yellow)', fontFamily: 'var(--font-mono)' }}>
              {totalScore.toLocaleString()}
            </div>
          </div>

          {/* Accuracy */}
          <div style={{
            background: 'var(--bg-tertiary)',
            padding: '1rem 0.5rem',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-subtle)'
          }}>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Accuracy
            </div>
            <div style={{
              fontSize: '1.5rem',
              fontWeight: 900,
              color: accuracyPct >= 80 ? 'var(--accent-emerald)' : 'var(--text-primary)',
              fontFamily: 'var(--font-mono)'
            }}>
              {accuracyPct}%
            </div>
          </div>

          {/* Solved Count */}
          <div style={{
            background: 'var(--bg-tertiary)',
            padding: '1rem 0.5rem',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-subtle)'
          }}>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Puzzles
            </div>
            <div style={{ fontSize: '1.5rem', fontWeight: 900, color: 'var(--accent-cyan)', fontFamily: 'var(--font-mono)' }}>
              {puzzlesSolved} / {puzzlesAttempted}
            </div>
          </div>

          {/* Avg Speed */}
          <div style={{
            background: 'var(--bg-tertiary)',
            padding: '0.75rem 0.5rem',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-subtle)'
          }}>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
              Avg Speed
            </div>
            <div style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>
              {avgSeconds}s
            </div>
          </div>

          {/* Max Streak */}
          <div style={{
            background: 'var(--bg-tertiary)',
            padding: '0.75rem 0.5rem',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-subtle)'
          }}>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
              Max Streak
            </div>
            <div style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--accent-gold)', fontFamily: 'var(--font-mono)' }}>
              🔥 {maxStreak}x
            </div>
          </div>

          {/* Rating */}
          <div style={{
            background: 'var(--bg-tertiary)',
            padding: '0.75rem 0.5rem',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-subtle)'
          }}>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
              Tier Class
            </div>
            <div style={{ fontSize: '1.15rem', fontWeight: 800, color: grade.badgeColor }}>
              {grade.id} Rank
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
          <button
            onClick={onPlayAgain}
            className="btn-primary"
            style={{ flex: 1, padding: '0.85rem 1.5rem', fontSize: '1rem' }}
          >
            🔄 Play Again
          </button>
          <button
            onClick={onReturnHome}
            className="btn-secondary"
            style={{ flex: 1, padding: '0.85rem 1.5rem', fontSize: '1rem' }}
          >
            🏠 Return Home
          </button>
        </div>
      </div>
    </div>
  );
}
