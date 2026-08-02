/**
 * AudioEngine manages Web Audio Context, AudioBuffers, and direct playback node connections.
 */
export class AudioEngine {
  constructor() {
    /** @type {AudioContext|null} */
    this.ctx = null;
    /** @type {AudioBuffer|null} */
    this.buffer = null;
    /** @type {AudioBufferSourceNode|null} */
    this.sourceNode = null;
    /** @type {number} */
    this.startTime = 0;
    /** @type {number} */
    this.pauseOffset = 0;
    /** @type {boolean} */
    this.isPlaying = false;
  }

  /**
   * Initializes or resumes the AudioContext (handles browser autoplay policies).
   */
  initContext() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  /**
   * Decodes an ArrayBuffer into an AudioBuffer.
   * @param {ArrayBuffer} arrayBuffer 
   * @returns {Promise<AudioBuffer>}
   */
  async decodeAudioData(arrayBuffer) {
    this.initContext();
    this.buffer = await this.ctx.decodeAudioData(arrayBuffer);
    return this.buffer;
  }

  /**
   * Play the audio from the given offset.
   * @param {number} offsetInSeconds 
   * @param {AudioNode} [destinationNode] Target Web Audio Node (e.g. effects chain)
   */
  play(offsetInSeconds = 0, destinationNode = null) {
    if (!this.buffer) return;
    this.initContext();

    this.stopSource();

    this.sourceNode = this.ctx.createBufferSource();
    this.sourceNode.buffer = this.buffer;

    const target = destinationNode || this.ctx.destination;
    this.sourceNode.connect(target);

    this.pauseOffset = offsetInSeconds;
    this.startTime = this.ctx.currentTime - this.pauseOffset;

    this.sourceNode.start(0, this.pauseOffset);
    this.isPlaying = true;
  }

  /**
   * Pause playback and track exact offset.
   * @returns {number} Current position in seconds
   */
  pause() {
    if (!this.isPlaying) return this.pauseOffset;
    
    this.pauseOffset = this.getCurrentTime();
    this.stopSource();
    this.isPlaying = false;
    return this.pauseOffset;
  }

  /**
   * Stop playback completely and reset offset.
   */
  stop() {
    this.stopSource();
    this.pauseOffset = 0;
    this.isPlaying = false;
  }

  /**
   * Internal helper to safely disconnect source node.
   */
  stopSource() {
    if (this.sourceNode) {
      try {
        this.sourceNode.stop();
        this.sourceNode.disconnect();
      } catch (e) {
        // Node might already be stopped
      }
      this.sourceNode = null;
    }
  }

  /**
   * Returns current playhead position in seconds.
   * @returns {number}
   */
  getCurrentTime() {
    if (!this.isPlaying) return this.pauseOffset;
    return this.ctx.currentTime - this.startTime;
  }

  /**
   * Gets total duration of the current audio buffer.
   * @returns {number}
   */
  getDuration() {
    return this.buffer ? this.buffer.duration : 0;
  }

  /**
   * Replaces internal buffer with a trimmed/modified AudioBuffer.
   * @param {AudioBuffer} newBuffer 
   */
  setBuffer(newBuffer) {
    this.buffer = newBuffer;
    this.pauseOffset = 0;
  }
}
