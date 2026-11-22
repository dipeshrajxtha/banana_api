/**
 * @file circuitBreaker.test.js
 * @description Enterprise unit tests for 3-State Circuit Breaker pattern (Theme 3: Interoperability).
 * Verifies state transitions (CLOSED -> OPEN -> HALF_OPEN -> CLOSED), failure threshold tripping,
 * and automatic fallback protection.
 * @module server/test/circuitBreaker
 * @author Dipesh Raj Shrestha
 * @reference University of Bedfordshire - CIS046-3 Software For Enterprise
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { CircuitBreaker } from '../src/services/bananaApiService.js';

describe('Theme 3: Enterprise 3-State Circuit Breaker Pattern Tests', () => {
  it('Initial State: starts in CLOSED state with 0 consecutive failures', () => {
    const cb = new CircuitBreaker({ failureThreshold: 3, cooldownMs: 1000 });
    const state = cb.getState();

    assert.equal(state.state, 'CLOSED');
    assert.equal(state.consecutiveFailures, 0);
    assert.equal(state.totalTripped, 0);
    assert.equal(cb.canRequest(), true);
  });

  it('Tripping Mechanism: trips from CLOSED to OPEN after 3 consecutive failures', () => {
    const cb = new CircuitBreaker({ failureThreshold: 3, cooldownMs: 1000 });

    cb.recordFailure();
    assert.equal(cb.getState().state, 'CLOSED');
    assert.equal(cb.getState().consecutiveFailures, 1);

    cb.recordFailure();
    assert.equal(cb.getState().state, 'CLOSED');
    assert.equal(cb.getState().consecutiveFailures, 2);

    cb.recordFailure(); // Third failure hits threshold
    assert.equal(cb.getState().state, 'OPEN');
    assert.equal(cb.getState().totalTripped, 1);

    // Fast-fail: canRequest() must return false while OPEN and cooldown active
    assert.equal(cb.canRequest(), false);
  });

  it('Cooldown Recovery: transitions to HALF_OPEN after cooldown period', async () => {
    // 50ms cooldown for fast unit test
    const cb = new CircuitBreaker({ failureThreshold: 2, cooldownMs: 50 });

    cb.recordFailure();
    cb.recordFailure();
    assert.equal(cb.getState().state, 'OPEN');
    assert.equal(cb.canRequest(), false);

    // Wait for cooldown to expire
    await new Promise((r) => setTimeout(r, 60));

    // canRequest() must now allow a single probe request and transition to HALF_OPEN
    assert.equal(cb.canRequest(), true);
    assert.equal(cb.getState().state, 'HALF_OPEN');
  });

  it('Self-Healing: successful probe in HALF_OPEN resets breaker back to CLOSED', async () => {
    const cb = new CircuitBreaker({ failureThreshold: 1, cooldownMs: 30 });

    cb.recordFailure();
    assert.equal(cb.getState().state, 'OPEN');

    await new Promise((r) => setTimeout(r, 40));
    assert.equal(cb.canRequest(), true); // Enters HALF_OPEN

    // Probe succeeds
    cb.recordSuccess();
    assert.equal(cb.getState().state, 'CLOSED');
    assert.equal(cb.getState().consecutiveFailures, 0);
    assert.equal(cb.canRequest(), true);
  });

  it('Persistent Failure: failed probe in HALF_OPEN immediately re-trips to OPEN', async () => {
    const cb = new CircuitBreaker({ failureThreshold: 1, cooldownMs: 30 });

    cb.recordFailure();
    assert.equal(cb.getState().state, 'OPEN');

    await new Promise((r) => setTimeout(r, 40));
    assert.equal(cb.canRequest(), true); // Enters HALF_OPEN

    // Probe fails
    cb.recordFailure();
    assert.equal(cb.getState().state, 'OPEN');
    assert.equal(cb.canRequest(), false);
  });
});
