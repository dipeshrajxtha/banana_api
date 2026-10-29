/**
 * @file eventBus.js
 * @description Decoupled Pub/Sub Event Bus architecture implementing Theme 2 (Event-Driven Programming).
 * Provides event subscription, safe emission, one-time listeners, and an audit trail of dispatched signals.
 * @module client/events/eventBus
 * @author Dipesh Raj Shrestha
 * @reference University of Bedfordshire - CIS046-3 Software For Enterprise (Theme 2)
 */

export class CustomEventBus {
  /**
   * Initializes the event listener registry and historical event ring buffer.
   * @param {number} [maxHistory=50] - Number of recent events to store for diagnostics.
   */
  constructor(maxHistory = 50) {
    this.listeners = new Map();
    this.history = [];
    this.maxHistory = maxHistory;
  }

  /**
   * Subscribes a listener function to a specific event.
   * @param {string} event - Event name (e.g. from GAME_EVENTS)
   * @param {Function} handler - Callback function invoked on emission
   * @returns {Function} Unsubscribe teardown function
   */
  on(event, handler) {
    if (typeof handler !== 'function') {
      throw new TypeError(`[EventBus] Handler for event "${event}" must be a function.`);
    }

    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }

    this.listeners.get(event).add(handler);

    // Return convenient teardown unsubscribe function
    return () => this.off(event, handler);
  }

  /**
   * Subscribes a one-time listener that automatically unbinds after first execution.
   * @param {string} event
   * @param {Function} handler
   * @returns {Function} Unsubscribe teardown function
   */
  once(event, handler) {
    const onceWrapper = (payload) => {
      this.off(event, onceWrapper);
      handler(payload);
    };
    return this.on(event, onceWrapper);
  }

  /**
   * Unsubscribes a listener function from an event.
   * @param {string} event
   * @param {Function} handler
   */
  off(event, handler) {
    const handlers = this.listeners.get(event);
    if (handlers) {
      handlers.delete(handler);
      if (handlers.size === 0) {
        this.listeners.delete(event);
      }
    }
  }

  /**
   * Emits an event with an optional data payload to all registered subscribers.
   * Encapsulates execution in safe try/catch blocks so one listener error cannot crash others.
   * @param {string} event - Event identifier
   * @param {*} [payload=null] - Accompanying event data
   */
  emit(event, payload = null) {
    const timestamp = Date.now();
    const eventRecord = {
      event,
      payload,
      timestamp,
      listenerCount: this.listenerCount(event)
    };

    // Maintain circular diagnostics history for tutor architectural review
    this.history.unshift(eventRecord);
    if (this.history.length > this.maxHistory) {
      this.history.pop();
    }

    const handlers = this.listeners.get(event);
    if (!handlers || handlers.size === 0) return;

    // Snapshot set to prevent mutation issues if a listener unsubscribes during loop
    const snapshot = Array.from(handlers);
    for (const handler of snapshot) {
      try {
        handler(payload, { event, timestamp });
      } catch (err) {
        console.error(`[EventBus] Error executing subscriber for "${event}":`, err);
      }
    }
  }

  /**
   * Returns the number of registered listeners for an event.
   * @param {string} event
   * @returns {number}
   */
  listenerCount(event) {
    return this.listeners.get(event)?.size || 0;
  }

  /**
   * Retrieves recorded event history for architectural introspection.
   * @returns {Array<object>}
   */
  getHistory() {
    return [...this.history];
  }

  /**
   * Clears all registered event listeners and historical logs.
   */
  clear() {
    this.listeners.clear();
    this.history = [];
  }
}

// Global application singleton instance
export const eventBus = new CustomEventBus();
