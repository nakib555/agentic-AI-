
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// A singleton service to manage a shared AudioContext and prevent overlapping audio playback.

class AudioManager {
  private audioContext: AudioContext | null = null;
  private currentSource: AudioBufferSourceNode | null = null;
  private onEndCallback: (() => void) | null = null;

  constructor() {
    try {
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        this.audioContext = new AudioContextClass();
    } catch (e) {
        console.error("[AudioManager] Failed to initialize AudioContext:", e);
    }
  }

  get context(): AudioContext {
    if (!this.audioContext) {
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        this.audioContext = new AudioContextClass();
    }
    return this.audioContext;
  }

  /**
   * Plays an AudioBuffer, stopping any currently playing audio first.
   * @param buffer The AudioBuffer to play.
   * @param onEnd A callback to execute when playback finishes naturally.
   */
  async play(buffer: AudioBuffer, onEnd: () => void): Promise<void> {
    if (!this.audioContext) {
        onEnd();
        return;
    }

    try {
      if (this.audioContext.state === 'suspended') {
        await this.audioContext.resume();
      }
    } catch (e) {
        console.error("[AudioManager] Failed to resume AudioContext:", e);
        onEnd();
        return;
    }

    // Stop any audio that is currently playing.
    this.stop();

    const source = this.audioContext.createBufferSource();
    source.buffer = buffer;
    source.connect(this.audioContext.destination);
    
    this.onEndCallback = onEnd;

    source.onended = () => {
      // CRITICAL FIX: Clear references *before* calling the callback.
      // This prevents the callback (which might call play() -> stop()) from 
      // triggering a recursive loop or double-fire of the end logic.
      const callback = this.onEndCallback;
      this.currentSource = null;
      this.onEndCallback = null;

      if (callback) {
        callback();
      }
    };
    
    source.start();
    this.currentSource = source;
  }

  /**
   * Stops the currently playing audio.
   */
  stop(): void {
    if (this.currentSource) {
      try {
          this.currentSource.onended = null;
          this.currentSource.stop();
      } catch (e) {
          // Ignore errors if source is already stopped
      }
      this.currentSource = null;
      
      // Invoke the callback to ensure UI state is reset (e.g. setPlaying(false))
      if (this.onEndCallback) {
        const callback = this.onEndCallback;
        this.onEndCallback = null;
        callback();
      }
    }
  }
}

export const audioManager = new AudioManager();
