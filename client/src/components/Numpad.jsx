/**
 * @file Numpad.jsx
 * @description Interactive arcade keypad component with tactile click states, hotkey hints, and EventBus integration.
 * @module client/components/Numpad
 * @author Dipesh Raj Shrestha
 * @reference University of Bedfordshire - CIS046-3 Software For Enterprise (Theme 2: Event-Driven Programming)
 */

import React from 'react';
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
        {digits.map((digit) => {
          const isSelected = activeDigit === digit;
          return (
            <button
              key={digit}
              type="button"
              disabled={disabled}
              onClick={() => handleDigit(digit)}
              className="numpad-btn"
              style={{
                height: '62px',
                background: isSelected ? 'var(--accent-gold)' : undefined,
                color: isSelected ? '#000' : undefined,
                borderColor: isSelected ? 'var(--accent-yellow)' : undefined,
                boxShadow: isSelected ? 'var(--shadow-glow)' : undefined,
                transform: isSelected ? 'scale(1.05)' : undefined
              }}
            >
              <span>{digit}</span>
            </button>
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
        <button
          type="button"
          disabled={disabled || activeDigit === null}
          onClick={handleClear}
          className="btn-secondary"
          style={{
            height: '62px',
            borderRadius: 'var(--radius-md)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 0
          }}
          title="Clear digit (Backspace)"
        >
          <span style={{ fontSize: '1.25rem', lineHeight: 1 }}>⌫</span>
          <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: '2px' }}>Clear</span>
        </button>

        {/* Digit 0 */}
        <button
          type="button"
          disabled={disabled}
          onClick={() => handleDigit(0)}
          className="numpad-btn"
          style={{
            height: '62px',
            background: activeDigit === 0 ? 'var(--accent-gold)' : undefined,
            color: activeDigit === 0 ? '#000' : undefined,
            borderColor: activeDigit === 0 ? 'var(--accent-yellow)' : undefined,
            boxShadow: activeDigit === 0 ? 'var(--shadow-glow)' : undefined,
            transform: activeDigit === 0 ? 'scale(1.05)' : undefined
          }}
        >
          <span>0</span>
        </button>

        {/* Submit Button */}
        <button
          type="button"
          disabled={disabled || activeDigit === null}
          onClick={handleSubmit}
          className="btn-primary"
          style={{
            height: '62px',
            borderRadius: 'var(--radius-md)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 0,
            opacity: activeDigit === null ? 0.4 : 1,
            cursor: activeDigit === null ? 'not-allowed' : 'pointer'
          }}
          title="Submit answer (Enter)"
        >
          <span style={{ fontSize: '1.2rem', lineHeight: 1, fontWeight: 900 }}>ENTER ↵</span>
          <span style={{ fontSize: '0.65rem', color: 'rgba(0,0,0,0.6)', marginTop: '2px', fontWeight: 700 }}>Confirm</span>
        </button>
      </div>

      {/* Keyboard hotkey assist hint */}
      <div style={{
        textAlign: 'center',
        fontSize: '0.75rem',
        color: 'var(--text-muted)',
        marginTop: '0.35rem'
      }}>
        💡 Tip: You can also use your physical <strong style={{ color: 'var(--text-secondary)' }}>Keyboard</strong> (0–9 & Enter)
      </div>
    </div>
  );
}
