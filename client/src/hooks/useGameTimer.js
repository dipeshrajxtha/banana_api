/**
 * @file useGameTimer.js
 * @description High-precision requestAnimationFrame delta-timing countdown hook with EventBus signal emission.
 * @module client/hooks/useGameTimer
 * @author Dipesh Raj Shrestha
 * @reference University of Bedfordshire - CIS046-3 Software For Enterprise (Theme 2: Event-Driven Programming)
 */

import { useState, useRef, useEffect, useCallback } from 'react';
import { GAME_EVENTS } from '@banana-quest/shared';
import { eventBus } from '../events/eventBus.js';

/**
 * High-precision game timer driven by requestAnimationFrame.
 * Emits signals over the decoupled EventBus on warning threshold and timeout.
 * @param {object} options
 * @param {number} [options.warningThresholdMs=4000] - Threshold when timer enters warning state
 * @param {Function} [options.onTimeout] - Callback invoked when timer expires
 */
export function useGameTimer({ warningThresholdMs = 4000, onTimeout } = {}) {
  const [timeLeftMs, setTimeLeftMs] = useState(0);
  const [totalDurationMs, setTotalDurationMs] = useState(0);
  const [isRunning, setIsRunning] = useState(false);

  const requestRef = useRef(null);
  const startTimeRef = useRef(null);
  const durationRef = useRef(0);
  const onTimeoutRef = useRef(onTimeout);
  const hasEmittedWarningRef = useRef(false);

  useEffect(() => {
    onTimeoutRef.current = onTimeout;
  }, [onTimeout]);

  const tick = useCallback((now) => {
    if (!startTimeRef.current) startTimeRef.current = now;

    const elapsed = now - startTimeRef.current;
    const remaining = Math.max(0, durationRef.current - elapsed);

    setTimeLeftMs(remaining);

    // Emit event bus signal on warning threshold
    if (remaining <= warningThresholdMs && remaining > 0 && !hasEmittedWarningRef.current) {
      hasEmittedWarningRef.current = true;
      eventBus.emit(GAME_EVENTS.TIMER_WARNING, { remainingMs: remaining });
    }

    if (remaining > 0) {
      requestRef.current = requestAnimationFrame(tick);
    } else {
      setIsRunning(false);
      cancelAnimationFrame(requestRef.current);
      eventBus.emit(GAME_EVENTS.TIMER_EXPIRED);
      if (onTimeoutRef.current) {
        onTimeoutRef.current();
      }
    }
  }, [warningThresholdMs]);

  const start = useCallback((durationMs) => {
    cancelAnimationFrame(requestRef.current);
    durationRef.current = durationMs;
    setTotalDurationMs(durationMs);
    setTimeLeftMs(durationMs);
    setIsRunning(true);
    hasEmittedWarningRef.current = false;
    startTimeRef.current = null;
    requestRef.current = requestAnimationFrame(tick);
  }, [tick]);

  const stop = useCallback(() => {
    setIsRunning(false);
    cancelAnimationFrame(requestRef.current);
    setTimeLeftMs(0);
    hasEmittedWarningRef.current = false;
  }, []);

  const reset = useCallback((newDurationMs) => {
    cancelAnimationFrame(requestRef.current);
    const d = newDurationMs || durationRef.current;
    durationRef.current = d;
    setTotalDurationMs(d);
    setTimeLeftMs(d);
    setIsRunning(false);
    hasEmittedWarningRef.current = false;
    startTimeRef.current = null;
  }, []);

  useEffect(() => {
    return () => cancelAnimationFrame(requestRef.current);
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
