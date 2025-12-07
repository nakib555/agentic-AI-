
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// A singleton service to manage a shared AudioContext and prevent overlapping audio playback.

class AudioManager {
  private audioContext: AudioContext;
  private currentSource: AudioBufferSourceNode | null = null;
  private onEndCallback: (() => void) | null = null;

  constructor() {
    // It's best practice to have a single AudioContext.
    // It will be resumed on the first user interaction.
    this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
  }

  get context(): AudioContext {
    return this.audioContext;
  }

  /**
   * Plays an AudioBuffer, stopping any currently playing audio first.
   * This method is async to correctly handle the AudioContext.resume() promise,
   * which is required by browsers to play audio after a user gesture.
   * @param buffer The AudioBuffer to play.
   * @param onEnd A callback to execute when playback finishes naturally.
   */
  async play(buffer: AudioBuffer, onEnd: () => void): Promise<void> {
    // Ensure the context is running (it might be suspended before the first user gesture).
    try {
      if (this.audioContext.state === 'suspended') {
        await this.audioContext.resume();
      }
    } catch (e) {
        console.error("Failed to resume AudioContext:", e);
        // If resuming fails, we can't play. Call onEnd to reset UI.
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
      // This only runs when playback finishes on its own.
      if (this.onEndCallback) {
        this.onEndCallback();
      }
      // Ensure we clean up connections even on natural end
      try {
        source.disconnect();
      } catch (e) { /* ignore */ }
      
      this.currentSource = null;
      this.onEndCallback = null;
    };
    
    source.start();
    this.currentSource = source;
  }

  /**
   * Stops the currently playing audio.
   */
  stop(): void {
    if (this.currentSource) {
      // Unset the onended callback before stopping to prevent it from firing on manual stop.
      this.currentSource.onended = null;
      
      try {
        this.currentSource.stop();
        this.currentSource.disconnect();
      } catch (error) {
        // Ignore errors if already stopped or invalid state
      }
      
      this.currentSource = null;
      // Also invoke the onEnd callback immediately to reset UI state.
      if (this.onEndCallback) {
        this.onEndCallback();
        this.onEndCallback = null;
      }
    }
  }
}

export const audioManager = new AudioManager();
