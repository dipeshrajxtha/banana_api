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
   * Ascending arpeggio chime for correct answers (C5 -> E5 -> G5, 523Hz -> 659Hz -> 784Hz)
   * Plays extra flourish if streak multiplier is active.
   */
  playCorrect(streak = 0) {
    this.playTone(523.25, 'triangle', 0.1, 0);
    this.playTone(659.25, 'triangle', 0.1, 0.08);
    this.playTone(783.99, 'triangle', 0.15, 0.16);

    // Multiplier fanfare chord if on a 3+ streak!
    if (streak >= 3) {
      this.playTone(1046.50, 'sine', 0.22, 0.24); // High C6
    }
  }

  /**
   * Low discordant downward buzz for incorrect answers (220 Hz -> 110 Hz sawtooth)
   */
  playWrong() {
    this.playTone(220, 'sawtooth', 0.25, 0, 110);
  }

  /**
   * Dramatic life-lost buzz
   */
  playLifeLost() {
    this.playTone(196, 'sawtooth', 0.35, 0, 82);
  }

  /**
   * Short double tick for urgent timer warnings (under 4s left)
   */
  playTimerWarning() {
    this.playTone(880, 'square', 0.03, 0);
    this.playTone(880, 'square', 0.03, 0.1);
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
