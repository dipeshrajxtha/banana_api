/**
 * @file soundService.js
 * @description Web Audio API sound synthesizer engine with decoupled EventBus integration.
 * Generates dynamic retro-arcade audio frequencies programmatically without external media assets.
 * @module client/services/soundService
 * @author Dipesh Raj Shrestha
 * @reference University of Bedfordshire - CIS046-3 Software For Enterprise
 */

import { GAME_EVENTS } from '@banana-quest/shared';
import { eventBus } from '../events/eventBus.js';

class SoundService {
  constructor() {
    this.audioCtx = null;
    this.isMuted = this.loadMutePreference();
    this.volume = 0.25; // Balanced default volume
    this.unsubscribeList = [];
  }

  /**
   * Lazily initializes the Web Audio AudioContext upon first user interaction
   * to comply with browser autoplay policies.
   */
  initContext() {
    if (!this.audioCtx) {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (AudioContextClass) {
        this.audioCtx = new AudioContextClass();
      }
    }
    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
  }

  loadMutePreference() {
    try {
      const saved = localStorage.getItem('banana_quest_muted');
      return saved === 'true';
    } catch {
      return false;
    }
  }

  toggleMute() {
    this.isMuted = !this.isMuted;
    try {
      localStorage.setItem('banana_quest_muted', String(this.isMuted));
    } catch {
      // Fallback
    }
    return this.isMuted;
  }

  setMuted(muted) {
    this.isMuted = Boolean(muted);
    try {
      localStorage.setItem('banana_quest_muted', String(this.isMuted));
    } catch {
      // Fallback
    }
  }

  /**
   * Generates a tone using an oscillator and gain envelope.
   * @param {number} freq - Tone frequency in Hz
   * @param {string} type - 'sine' | 'square' | 'triangle' | 'sawtooth'
   * @param {number} durationSec - Tone length in seconds
   * @param {number} [startOffset=0] - Delay before playing in seconds
   * @param {number} [targetFreq=null] - Optional pitch slide destination
   */
  playTone(freq, type = 'sine', durationSec = 0.1, startOffset = 0, targetFreq = null) {
    if (this.isMuted) return;
    this.initContext();
    if (!this.audioCtx) return;

    try {
      const startTime = this.audioCtx.currentTime + startOffset;
      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();

      osc.type = type;
      osc.frequency.setValueAtTime(freq, startTime);
      if (targetFreq !== null) {
        osc.frequency.exponentialRampToValueAtTime(targetFreq, startTime + durationSec);
      }

      // Attack and quick decay envelope to avoid speaker clicks
      gain.gain.setValueAtTime(0.001, startTime);
      gain.gain.linearRampToValueAtTime(this.volume, startTime + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + durationSec);

      osc.connect(gain);
      gain.connect(this.audioCtx.destination);

      osc.start(startTime);
      osc.stop(startTime + durationSec);
    } catch (err) {
      console.warn('[SoundService] Audio playback warning:', err);
    }
  }

  /**
   * Tactile click tone for Numpad key presses (520 Hz blip)
   */
  playDigitClick() {
    this.playTone(520, 'sine', 0.04);
  }

  /**
   * Ascending arpeggio chime for correct answers (Illumination arcade celebration)
   * Plays extra flourish if streak multiplier is active.
   */
  playCorrect(streak = 0) {
    this.playTone(587.33, 'triangle', 0.09, 0);     // D5
    this.playTone(739.99, 'triangle', 0.09, 0.07);  // F#5
    this.playTone(880.00, 'triangle', 0.12, 0.14);  // A5
    this.playTone(1174.66, 'sine', 0.18, 0.21);     // D6 "Woo-hoo!"

    // Multiplier fanfare chord if on a 3+ streak! (Mega Minion fanfare)
    if (streak >= 3) {
      this.playTone(1479.98, 'sine', 0.25, 0.28); // F#6
      this.playTone(1760.00, 'sine', 0.35, 0.34); // A6
    }
  }

  /**
   * Comical cartoon slide down for incorrect answers
   */
  playWrong() {
    this.playTone(350, 'sawtooth', 0.15, 0, 220);
    this.playTone(220, 'sawtooth', 0.25, 0.12, 110);
  }

  /**
   * Dramatic life-lost buzz
   */
  playLifeLost() {
    this.playTone(280, 'sawtooth', 0.2, 0, 140);
    this.playTone(140, 'sawtooth', 0.3, 0.18, 70);
  }

  /**
   * "BEE-DO BEE-DO!" Minion Emergency siren for urgent timer warnings (under 5s left)
   */
  playTimerWarning() {
    // High-low emergency siren sweep
    this.playTone(920, 'square', 0.08, 0, 1150);
    this.playTone(720, 'square', 0.08, 0.09, 600);
  }

  /**
   * Melodic descending arcade Game Over motif
   */
  playGameOver() {
    this.playTone(440, 'sine', 0.2, 0);      // A4
    this.playTone(392, 'sine', 0.2, 0.18);   // G4
    this.playTone(349.23, 'sine', 0.2, 0.36);// F4
    this.playTone(261.63, 'sine', 0.45, 0.54);// C4
  }

  /**
   * Binds sound triggers directly to EventBus messages, cleanly decoupling
   * the audio engine from UI React components.
   */
  bindToEventBus() {
    // Teardown any prior subscriptions to avoid duplication
    this.unbindEventBus();

    this.unsubscribeList.push(
      eventBus.on(GAME_EVENTS.INPUT_DIGIT, () => this.playDigitClick()),
      eventBus.on(GAME_EVENTS.ANSWER_CORRECT, (payload) => this.playCorrect(payload?.streak || 0)),
      eventBus.on(GAME_EVENTS.ANSWER_WRONG, () => this.playWrong()),
      eventBus.on(GAME_EVENTS.LIFE_LOST, () => this.playLifeLost()),
      eventBus.on(GAME_EVENTS.TIMER_WARNING, () => this.playTimerWarning()),
      eventBus.on(GAME_EVENTS.GAME_OVER, () => this.playGameOver())
    );
  }

  /**
   * Unbinds all EventBus subscriptions
   */
  unbindEventBus() {
    for (const unsubscribe of this.unsubscribeList) {
      unsubscribe();
    }
    this.unsubscribeList = [];
  }
}

export const soundService = new SoundService();
