/**
 * @file useGameTimer.js
 * @description High-precision requestAnimationFrame delta-timing countdown hook.
 * @module client/hooks/useGameTimer
 * @author Dipesh Raj Shrestha
 * @reference University of Bedfordshire - CIS046-3 Software For Enterprise (Theme 2: Event-Driven Programming)
 */

import { useState, useRef, useEffect, useCallback } from 'react';

/**
 * High-precision game timer driven by requestAnimationFrame
 * Avoids setInterval drift and throttling when browser tabs switch.
 * @param {object} options
 * @param {number} [options.warningThresholdMs=5000] - Threshold when timer enters warning state
 * @param {Function} [options.onTimeout] - Callback invoked when timer expires
 */
export function useGameTimer({ warningThresholdMs = 5000, onTimeout } = {}) {
  const [timeLeftMs, setTimeLeftMs] = useState(0);
  const [totalDurationMs, setTotalDurationMs] = useState(0);
  const [isRunning, setIsRunning] = useState(false);

  const requestRef = useRef(null);
  const startTimeRef = useRef(null);
  const durationRef = useRef(0);
  const onTimeoutRef = useRef(onTimeout);

  useEffect(() => {
    onTimeoutRef.current = onTimeout;
  }, [onTimeout]);

  const tick = useCallback((now) => {
    if (!startTimeRef.current) startTimeRef.current = now;

    const elapsed = now - startTimeRef.current;
    const remaining = Math.max(0, durationRef.current - elapsed);

    setTimeLeftMs(remaining);

    if (remaining > 0) {
      requestRef.current = requestAnimationFrame(tick);
    } else {
      setIsRunning(false);
      cancelAnimationFrame(requestRef.current);
      if (onTimeoutRef.current) {
        onTimeoutRef.current();
      }
    }
  }, []);

  const start = useCallback((durationMs) => {
    cancelAnimationFrame(requestRef.current);
    durationRef.current = durationMs;
    setTotalDurationMs(durationMs);
    setTimeLeftMs(durationMs);
    setIsRunning(true);
    startTimeRef.current = null;
    requestRef.current = requestAnimationFrame(tick);
  }, [tick]);

  const stop = useCallback(() => {
    setIsRunning(false);
    cancelAnimationFrame(requestRef.current);
    setTimeLeftMs(0);
  }, []);

  const reset = useCallback((newDurationMs) => {
    cancelAnimationFrame(requestRef.current);
    const d = newDurationMs || durationRef.current;
    durationRef.current = d;
    setTotalDurationMs(d);
    setTimeLeftMs(d);
    setIsRunning(false);
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
