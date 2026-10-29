/**
 * @file eventBus.test.js
 * @description Automated unit tests verifying Theme 2 (Event-Driven Programming) CustomEventBus.
 * Tests pub/sub subscriptions, one-shot listeners, error isolation, and historical telemetry auditing.
 * @module server/test/eventBus
 * @author Dipesh Raj Shrestha
 * @reference University of Bedfordshire - CIS046-3 Software For Enterprise
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { CustomEventBus } from '../../client/src/events/eventBus.js';
import { GAME_EVENTS } from '@banana-quest/shared';

describe('Theme 2: CustomEventBus & Event-Driven Engine Tests', () => {
  it('Subscription & Dispatch: dispatches event payloads to registered subscribers', () => {
    const bus = new CustomEventBus();
    const received = [];

    bus.on(GAME_EVENTS.INPUT_DIGIT, (data) => {
      received.push(data.digit);
    });

    bus.emit(GAME_EVENTS.INPUT_DIGIT, { digit: 7 });
    bus.emit(GAME_EVENTS.INPUT_DIGIT, { digit: 3 });

    assert.equal(received.length, 2);
    assert.deepEqual(received, [7, 3]);
  });

  it('Unsubscribe: teardown function detaches listener cleanly', () => {
    const bus = new CustomEventBus();
    let count = 0;

    const unsubscribe = bus.on(GAME_EVENTS.ANSWER_CORRECT, () => {
      count += 1;
    });

    bus.emit(GAME_EVENTS.ANSWER_CORRECT, { points: 100 });
    assert.equal(count, 1);

    // Call teardown
    unsubscribe();

    bus.emit(GAME_EVENTS.ANSWER_CORRECT, { points: 200 });
    assert.equal(count, 1, 'Listener should not fire after unsubscribe');
    assert.equal(bus.listenerCount(GAME_EVENTS.ANSWER_CORRECT), 0);
  });

  it('Once Listener: automatically unbinds after first emission', () => {
    const bus = new CustomEventBus();
    let callCount = 0;

    bus.once(GAME_EVENTS.GAME_STARTED, () => {
      callCount += 1;
    });

    bus.emit(GAME_EVENTS.GAME_STARTED, { gameMode: 'SPEED_RUSH' });
    bus.emit(GAME_EVENTS.GAME_STARTED, { gameMode: 'SURVIVAL' });

    assert.equal(callCount, 1, 'Once listener must only fire once');
    assert.equal(bus.listenerCount(GAME_EVENTS.GAME_STARTED), 0);
  });

  it('Fault Isolation: handler error does not prevent subsequent listeners from executing', () => {
    const bus = new CustomEventBus();
    let executedSecondListener = false;

    // First listener throws an exception
    bus.on(GAME_EVENTS.TIMER_WARNING, () => {
      throw new Error('Simulated subscriber exception');
    });

    // Second listener should still run safely
    bus.on(GAME_EVENTS.TIMER_WARNING, () => {
      executedSecondListener = true;
    });

    assert.doesNotThrow(() => {
      bus.emit(GAME_EVENTS.TIMER_WARNING, { remainingMs: 2500 });
    });

    assert.equal(executedSecondListener, true, 'Second listener must still execute');
  });

  it('Audit Ring Buffer: records chronological event history with payload metadata', () => {
    const bus = new CustomEventBus(5);

    bus.emit(GAME_EVENTS.PUZZLE_REQUESTED);
    bus.emit(GAME_EVENTS.PUZZLE_LOADED, { puzzleId: 'sealed_test_token' });
    bus.emit(GAME_EVENTS.ANSWER_SUBMITTED, { answer: 5 });

    const history = bus.getHistory();
    assert.equal(history.length, 3);
    assert.equal(history[0].event, GAME_EVENTS.ANSWER_SUBMITTED);
    assert.deepEqual(history[0].payload, { answer: 5 });
    assert.equal(history[1].event, GAME_EVENTS.PUZZLE_LOADED);
    assert.equal(history[2].event, GAME_EVENTS.PUZZLE_REQUESTED);
  });

  it('Clear: purges all registered listeners and history logs', () => {
    const bus = new CustomEventBus();
    bus.on(GAME_EVENTS.LIFE_LOST, () => {});
    bus.emit(GAME_EVENTS.LIFE_LOST, { livesRemaining: 2 });

    assert.equal(bus.listenerCount(GAME_EVENTS.LIFE_LOST), 1);
    assert.equal(bus.getHistory().length, 1);

    bus.clear();

    assert.equal(bus.listenerCount(GAME_EVENTS.LIFE_LOST), 0);
    assert.equal(bus.getHistory().length, 0);
  });
});
