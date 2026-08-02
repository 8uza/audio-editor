/**
 * WaveformManager handles WaveSurfer.js rendering and UI sync.
 */
export class WaveformManager {
  /**
   * @param {string|HTMLElement} container 
   * @param {Object} callbacks Event callbacks for audio sync
   */
  constructor(container, callbacks = {}) {
    this.container = container;
    this.callbacks = callbacks;
    this.wavesurfer = null;
    this.regionsPlugin = null;
    this.activeRegion = null;

    this.init();
  }

  /**
   * Initialize WaveSurfer instance and plugins.
   */
  init() {
    // Create Regions Plugin instance
    this.regionsPlugin = WaveSurfer.Regions.create();

    this.wavesurfer = WaveSurfer.create({
      container: this.container,
      waveColor: '#374151',
      progressColor: '#3B82F6',
      cursorColor: '#22C55E',
      barWidth: 2,
      barGap: 1,
      barRadius: 2,
      height: 128,
      plugins: [this.regionsPlugin]
    });

    this.setupEvents();
  }

  /**
   * Bind event listeners to WaveSurfer.
   */
  setupEvents() {
    this.wavesurfer.on('interaction', (newTime) => {
      if (this.callbacks.onSeek) {
        this.callbacks.onSeek(newTime);
      }
    });

    this.wavesurfer.on('finish', () => {
      if (this.callbacks.onFinish) {
        this.callbacks.onFinish();
      }
    });

    // Enable drag selection for region trimming
    this.regionsPlugin.enableDragSelection({
      color: 'rgba(59, 130, 246, 0.3)',
    });

    this.regionsPlugin.on('region-created', (region) => {
      // Keep only one active region at a time
      this.clearRegions();
      this.activeRegion = region;
    });
  }

  /**
   * Load audio file or Blob into WaveSurfer.
   * @param {File|Blob|string} src 
   */
  async load(src) {
    if (src instanceof File || src instanceof Blob) {
      await this.wavesurfer.loadBlob(src);
    } else {
      await this.wavesurfer.load(src);
    }
  }

  /**
   * Load directly from AudioBuffer.
   * @param {AudioBuffer} buffer 
   */
  loadAudioBuffer(buffer) {
    this.wavesurfer.loadAudioBuffer(buffer);
  }

  /**
   * Set playback zoom level.
   * @param {number} pxPerSec 
   */
  zoom(pxPerSec) {
    this.wavesurfer.zoom(pxPerSec);
  }

  /**
   * Set playhead position manually.
   * @param {number} progress (0.0 to 1.0)
   */
  seekTo(progress) {
    this.wavesurfer.seekTo(progress);
  }

  /**
   * Clear active selection regions.
   */
  clearRegions() {
    this.regionsPlugin.clearRegions();
    this.activeRegion = null;
  }

  /**
   * Get selected region start/end times in seconds.
   * @returns {{start: number, end: number}|null}
   */
  getSelectedRegion() {
    if (!this.activeRegion) return null;
    return {
      start: this.activeRegion.start,
      end: this.activeRegion.end
    };
  }
}
