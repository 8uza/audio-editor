/**
 * EffectsEngine manages Web Audio API DSP nodes (EQ, Filters, Reverb, Compressor).
 */
export class EffectsEngine {
  /**
   * @param {AudioContext} audioContext 
   */
  constructor(audioContext) {
    this.ctx = audioContext;

    // Node instantiation
    this.inputNode = this.ctx.createGain();
    this.bassNode = this.ctx.createBiquadFilter();
    this.trebleNode = this.ctx.createBiquadFilter();
    this.eqLowNode = this.ctx.createBiquadFilter();
    this.eqMidNode = this.ctx.createBiquadFilter();
    this.eqHighNode = this.ctx.createBiquadFilter();
    this.compressorNode = this.ctx.createDynamicsCompressor();
    this.outputNode = this.ctx.createGain();

    this.initNodes();
    this.connectNodes();
  }

  /**
   * Initialize default values for nodes.
   */
  initNodes() {
    // Bass Lowshelf Filter
    this.bassNode.type = 'lowshelf';
    this.bassNode.frequency.value = 200;
    this.bassNode.gain.value = 0;

    // Treble Highshelf Filter
    this.trebleNode.type = 'highshelf';
    this.trebleNode.frequency.value = 3000;
    this.trebleNode.gain.value = 0;

    // Equalizer Bands
    this.eqLowNode.type = 'lowshelf';
    this.eqLowNode.frequency.value = 100;
    this.eqLowNode.gain.value = 0;

    this.eqMidNode.type = 'peaking';
    this.eqMidNode.frequency.value = 1000;
    this.eqMidNode.Q.value = 1.0;
    this.eqMidNode.gain.value = 0;

    this.eqHighNode.type = 'highshelf';
    this.eqHighNode.frequency.value = 10000;
    this.eqHighNode.gain.value = 0;

    // Compressor defaults
    this.compressorNode.threshold.value = 0; // Off/no compression by default
  }

  /**
   * Connect node graph in series.
   */
  connectNodes() {
    this.inputNode
      .connect(this.bassNode)
      .connect(this.trebleNode)
      .connect(this.eqLowNode)
      .connect(this.eqMidNode)
      .connect(this.eqHighNode)
      .connect(this.compressorNode)
      .connect(this.outputNode);

    // Connect final output to AudioContext destination
    this.outputNode.connect(this.ctx.destination);
  }

  /**
   * Get chain entry node.
   * @returns {GainNode}
   */
  getInputNode() {
    return this.inputNode;
  }

  /**
   * Adjust Bass Boost gain (-12dB to +12dB).
   * @param {number} dB 
   */
  applyBassBoost(dB) {
    this.bassNode.gain.value = dB;
  }

  /**
   * Adjust Treble Boost gain (-12dB to +12dB).
   * @param {number} dB 
   */
  applyTrebleBoost(dB) {
    this.trebleNode.gain.value = dB;
  }

  /**
   * Set Reverb Amount (Placeholder function for future ConvolverNode impulse implementation).
   * @param {number} amount (0.0 to 1.0)
   */
  applyReverb(amount) {
    // Future DSP implementation: ConvolverNode wet/dry balance
  }

  /**
   * Apply Dynamics Compression threshold (-60dB to 0dB).
   * @param {number} thresholdDb 
   */
  applyCompressor(thresholdDb) {
    this.compressorNode.threshold.value = thresholdDb;
  }

  /**
   * Set 3-Band Equalizer gains.
   * @param {number} lowDb 
   * @param {number} midDb 
   * @param {number} highDb 
   */
  setEqualizer(lowDb, midDb, highDb) {
    this.eqLowNode.gain.value = lowDb;
    this.eqMidNode.gain.value = midDb;
    this.eqHighNode.gain.value = highDb;
  }

  /**
   * Reset all effect nodes to flat/bypass state.
   */
  resetEffects() {
    this.bassNode.gain.value = 0;
    this.trebleNode.gain.value = 0;
    this.eqLowNode.gain.value = 0;
    this.eqMidNode.gain.value = 0;
    this.eqHighNode.gain.value = 0;
    this.compressorNode.threshold.value = 0;
  }
}
