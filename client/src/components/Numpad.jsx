/**
 * @file Numpad.jsx
 * @description Tactile 3D-press arcade keypad with depth shadows, pressed states, and EventBus integration.
 * Features realistic button depth via CSS border-bottom trick, hover glow, and Framer Motion press animations.
 * @module client/components/Numpad
 * @author Dipesh Raj Shrestha
 * @reference University of Bedfordshire - CIS046-3 Software For Enterprise (Theme 2: Event-Driven Programming)
 */

import React from 'react';
import { motion } from 'framer-motion';
import { GAME_EVENTS } from '@banana-quest/shared';
import { eventBus } from '../events/eventBus.js';

export default function Numpad({ onDigitPress, onClear, onSubmit, disabled = false, activeDigit = null }) {
  const digits = [1, 2, 3, 4, 5, 6, 7, 8, 9];

  const handleDigit = (digit) => {
    if (disabled) return;
    eventBus.emit(GAME_EVENTS.INPUT_DIGIT, { digit });
    if (onDigitPress) onDigitPress(digit);
  };

  const handleClear = () => {
    if (disabled || activeDigit === null) return;
    eventBus.emit(GAME_EVENTS.INPUT_CLEAR);
    if (onClear) onClear();
  };

  const handleSubmit = () => {
    if (disabled || activeDigit === null) return;
    eventBus.emit(GAME_EVENTS.ANSWER_SUBMITTED, { answer: activeDigit });
    if (onSubmit) onSubmit();
  };

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      gap: '0.65rem',
      maxWidth: '340px',
      margin: '0 auto',
      width: '100%'
    }}>
      {/* 3x3 Grid for Digits 1-9 */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: '0.65rem'
      }}>
        {digits.map((digit, index) => {
          const isSelected = activeDigit === digit;
          return (
            <motion.button
              key={digit}
              type="button"
              disabled={disabled}
              onClick={() => handleDigit(digit)}
              className={`numpad-btn-3d ${isSelected ? 'selected' : ''}`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.03, type: 'spring', stiffness: 400, damping: 25 }}
              whileTap={!disabled ? { scale: 0.92, y: 3 } : {}}
              style={{ height: '62px' }}
            >
              <span>{digit}</span>
            </motion.button>
          );
        })}
      </div>

      {/* Bottom Row: Clear (⌫), 0, Submit (↵) */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr 1.25fr',
        gap: '0.65rem'
      }}>
        {/* Clear Button */}
        <motion.button
          type="button"
          disabled={disabled || activeDigit === null}
          onClick={handleClear}
          className="numpad-btn-3d"
          whileTap={!(disabled || activeDigit === null) ? { scale: 0.92, y: 3 } : {}}
          style={{
            height: '62px',
            flexDirection: 'column',
            fontSize: '1.25rem'
          }}
          title="Clear digit (Backspace)"
        >
          <span style={{ lineHeight: 1 }}>⌫</span>
          <span style={{ fontSize: '0.6rem', color: 'var(--text-muted)', marginTop: '2px' }}>Clear</span>
        </motion.button>

        {/* Digit 0 */}
        <motion.button
          type="button"
          disabled={disabled}
          onClick={() => handleDigit(0)}
          className={`numpad-btn-3d ${activeDigit === 0 ? 'selected' : ''}`}
          whileTap={!disabled ? { scale: 0.92, y: 3 } : {}}
          style={{ height: '62px' }}
        >
          <span>0</span>
        </motion.button>

        {/* Submit Button */}
        <motion.button
          type="button"
          disabled={disabled || activeDigit === null}
          onClick={handleSubmit}
          whileTap={!(disabled || activeDigit === null) ? { scale: 0.95, y: 2 } : {}}
          style={{
            height: '62px',
            borderRadius: 'var(--radius-md)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 0,
            opacity: activeDigit === null ? 0.4 : 1,
            cursor: activeDigit === null ? 'not-allowed' : 'pointer',
            background: activeDigit !== null ? 'var(--grad-banana)' : 'linear-gradient(180deg, #2A3555 0%, #1A2238 100%)',
            color: activeDigit !== null ? '#000' : 'var(--text-muted)',
            border: '1px solid',
            borderColor: activeDigit !== null ? 'var(--accent-yellow)' : 'var(--border-subtle)',
            borderBottom: activeDigit !== null ? '4px solid #B8860B' : '4px solid rgba(0,0,0,0.5)',
            fontFamily: 'var(--font-display)',
            boxShadow: activeDigit !== null
              ? '0 4px 8px rgba(0,0,0,0.3), 0 0 20px var(--accent-gold-glow)'
              : '0 4px 8px rgba(0,0,0,0.3)',
            transition: 'all 100ms ease'
          }}
          title="Submit answer (Enter)"
        >
          <span style={{ fontSize: '1.1rem', lineHeight: 1, fontWeight: 900 }}>ENTER ↵</span>
          <span style={{ fontSize: '0.6rem', marginTop: '2px', fontWeight: 700, opacity: 0.7 }}>Confirm</span>
        </motion.button>
      </div>

      {/* Keyboard hotkey assist hint */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        style={{
          textAlign: 'center',
          fontSize: '0.75rem',
          color: 'var(--text-muted)',
          marginTop: '0.35rem'
        }}
      >
        💡 Tip: You can also use your physical <strong style={{ color: 'var(--text-secondary)' }}>Keyboard</strong> (0–9 &amp; Enter)
      </motion.div>
    </div>
  );
}
