/**
 * @file useGameTimer.js
 * @description Bulletproof, wall-clock synchronized countdown hook using Date.now().
 * Completely immune to monitor refresh rates (60Hz/144Hz/240Hz), frame throttling, or timing drift.
 * Updates state at steady 100ms intervals for silky, jitter-free countdowns.
 * @module client/hooks/useGameTimer
 * @author Dipesh Raj Shrestha
 * @reference University of Bedfordshire - CIS046-3 Software For Enterprise (Theme 2: Event-Driven Programming)
 */

import { useState, useRef, useEffect, useCallback } from 'react';
import { GAME_EVENTS } from '@banana-quest/shared';
import { eventBus } from '../events/eventBus.js';

/**
 * High-precision game timer driven by Date.now() wall-clock delta.
 * Emits signals over the decoupled EventBus on warning threshold and timeout.
 * @param {object} options
 * @param {number} [options.warningThresholdMs=5000] - Threshold when timer enters warning state
 * @param {Function} [options.onTimeout] - Callback invoked when timer expires
 */
export function useGameTimer({ warningThresholdMs = 5000, onTimeout } = {}) {
  const [timeLeftMs, setTimeLeftMs] = useState(0);
  const [totalDurationMs, setTotalDurationMs] = useState(0);
  const [isRunning, setIsRunning] = useState(false);

  const endTimeRef = useRef(0);
  const intervalRef = useRef(null);
  const onTimeoutRef = useRef(onTimeout);
  const hasEmittedWarningRef = useRef(false);

  useEffect(() => {
    onTimeoutRef.current = onTimeout;
  }, [onTimeout]);

  const stop = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setIsRunning(false);
  }, []);

  const start = useCallback((durationMs) => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    if (!durationMs || durationMs <= 0) return;

    const endTime = Date.now() + durationMs;
    endTimeRef.current = endTime;
    setTotalDurationMs(durationMs);
    setTimeLeftMs(durationMs);
    setIsRunning(true);
    hasEmittedWarningRef.current = false;

    intervalRef.current = setInterval(() => {
      const now = Date.now();
      const remaining = Math.max(0, endTimeRef.current - now);
      setTimeLeftMs(remaining);

      // Warning siren at or below threshold
      if (remaining <= warningThresholdMs && remaining > 0 && !hasEmittedWarningRef.current) {
        hasEmittedWarningRef.current = true;
        eventBus.emit(GAME_EVENTS.TIMER_WARNING, { remainingMs: remaining });
      }

      // Timer reached 0
      if (remaining <= 0) {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
        setIsRunning(false);
        setTimeLeftMs(0);
        eventBus.emit(GAME_EVENTS.TIMER_EXPIRED);
        if (onTimeoutRef.current) {
          onTimeoutRef.current();
        }
      }
    }, 100);
  }, [warningThresholdMs]);

  const reset = useCallback((newDurationMs) => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    const d = newDurationMs || 0;
    setTotalDurationMs(d);
    setTimeLeftMs(d);
    setIsRunning(false);
    hasEmittedWarningRef.current = false;
  }, []);

  // Clean up interval on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, []);

  const progress = totalDurationMs > 0 ? (timeLeftMs / totalDurationMs) : 0;
  const isWarning = isRunning && timeLeftMs > 0 && timeLeftMs <= warningThresholdMs;

  return {
    timeLeftMs,
    totalDurationMs,
    secondsRemaining: Math.ceil(timeLeftMs / 1000),
    progress,
    isRunning,
    isWarning,
    start,
    stop,
    reset
  };
}
