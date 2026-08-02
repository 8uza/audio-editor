/**
 * Entry point module connecting AudioEngine, WaveformManager, EffectsEngine, AudioExporter, and UIController.
 */
import { AudioEngine } from './js/audio.js';
import { WaveformManager } from './js/waveform.js';
import { EffectsEngine } from './js/effects.js';
import { AudioExporter } from './js/export.js';
import { UIController } from './js/ui.js';

class SoundCraftApp {
  constructor() {
    this.ui = new UIController();
    this.audio = new AudioEngine();
    this.waveform = null;
    this.effects = null;

    this.animationFrameId = null;
    this.init();
  }

  init() {
    // Initialize Waveform Manager with callbacks
    this.waveform = new WaveformManager('#waveform', {
      onSeek: (progress) => {
        const time = progress * this.audio.getDuration();
        if (this.audio.isPlaying) {
          this.audio.play(time, this.effects?.getInputNode());
        } else {
          this.audio.pauseOffset = time;
        }
        this.updatePlaybackUI();
      },
      onFinish: () => {
        this.audio.stop();
        this.ui.setPlayingState(false);
      }
    });

    this.bindEvents();
  }

  bindEvents() {
    // Handle Audio File Selection
    this.ui.bindFileUpload(async (file) => {
      try {
        this.ui.showNotification(`Loading ${file.name}...`, 'info');
        
        const arrayBuffer = await file.arrayBuffer();
        const decodedBuffer = await this.audio.decodeAudioData(arrayBuffer);

        // Init Effects Engine once AudioContext is active
        if (!this.effects) {
          this.effects = new EffectsEngine(this.audio.ctx);
        }

        // Load into WaveSurfer
        await this.waveform.load(file);

        this.ui.enableWorkspace(file.name);
        this.ui.updateTimeDisplay(0, decodedBuffer.duration);
        this.ui.showNotification('Audio file loaded successfully!', 'success');
      } catch (err) {
        console.error(err);
        this.ui.showNotification('Failed to decode audio file.', 'error');
      }
    });

    // Playback Controls
    this.ui.btnPlay.addEventListener('click', () => this.togglePlay());
    this.ui.btnStop.addEventListener('click', () => this.stop());

    // Zoom Slider
    this.ui.zoomSlider.addEventListener('input', (e) => {
      this.waveform.zoom(Number(e.target.value));
    });

    // Trim Controls
    document.getElementById('btn-trim').addEventListener('click', () => this.handleTrim());
    document.getElementById('btn-clear-selection').addEventListener('click', () => {
      this.waveform.clearRegions();
    });

    // Effects Sliders
    this.bindEffectSliders();

    // Export Triggers
    const triggerExport = () => this.handleExport();
    this.ui.btnExportHeader.addEventListener('click', triggerExport);
    this.ui.btnExportTab.addEventListener('click', triggerExport);
  }

  togglePlay() {
    if (!this.audio.buffer) return;

    if (this.audio.isPlaying) {
      this.audio.pause();
      this.ui.setPlayingState(false);
      cancelAnimationFrame(this.animationFrameId);
    } else {
      this.audio.play(this.audio.pauseOffset, this.effects.getInputNode());
      this.ui.setPlayingState(true);
      this.trackPlayback();
    }
  }

  stop() {
    this.audio.stop();
    this.waveform.seekTo(0);
    this.ui.setPlayingState(false);
    this.ui.updateTimeDisplay(0, this.audio.getDuration());
    cancelAnimationFrame(this.animationFrameId);
  }

  trackPlayback() {
    const update = () => {
      if (this.audio.isPlaying) {
        const currentTime = this.audio.getCurrentTime();
        const duration = this.audio.getDuration();
        
        if (duration > 0) {
          this.waveform.seekTo(currentTime / duration);
          this.ui.updateTimeDisplay(currentTime, duration);
        }

        this.animationFrameId = requestAnimationFrame(update);
      }
    };
    update();
  }

  bindEffectSliders() {
    // Bass
    const bassSlider = document.getElementById('slider-bass');
    const bassVal = document.getElementById('val-bass');
    bassSlider.addEventListener('input', (e) => {
      const val = parseFloat(e.target.value);
      bassVal.textContent = `${val} dB`;
      this.effects?.applyBassBoost(val);
    });

    // Treble
    const trebleSlider = document.getElementById('slider-treble');
    const trebleVal = document.getElementById('val-treble');
    trebleSlider.addEventListener('input', (e) => {
      const val = parseFloat(e.target.value);
      trebleVal.textContent = `${val} dB`;
      this.effects?.applyTrebleBoost(val);
    });

    // Reverb
    const reverbSlider = document.getElementById('slider-reverb');
    const reverbVal = document.getElementById('val-reverb');
    reverbSlider.addEventListener('input', (e) => {
      const val = parseFloat(e.target.value);
      reverbVal.textContent = val.toFixed(2);
      this.effects?.applyReverb(val);
    });

    // Compressor
    const compSlider = document.getElementById('slider-compressor');
    const compVal = document.getElementById('val-compressor');
    compSlider.addEventListener('input', (e) => {
      const val = parseFloat(e.target.value);
      compVal.textContent = `${val} dB`;
      this.effects?.applyCompressor(val);
    });

    // Reset
    document.getElementById('btn-reset-effects').addEventListener('click', () => {
      bassSlider.value = 0; bassVal.textContent = '0 dB';
      trebleSlider.value = 0; trebleVal.textContent = '0 dB';
      reverbSlider.value = 0; reverbVal.textContent = '0.0';
      compSlider.value = 0; compVal.textContent = '0 dB';
      this.effects?.resetEffects();
      this.ui.showNotification('Effects reset to flat.', 'info');
    });
  }

  handleTrim() {
    const region = this.waveform.getSelectedRegion();
    if (!region) {
      this.ui.showNotification('Please drag a selection on the waveform first.', 'error');
      return;
    }

    this.stop();
    const trimmedBuffer = AudioExporter.trimBuffer(
      this.audio.ctx,
      this.audio.buffer,
      region.start,
      region.end
    );

    this.audio.setBuffer(trimmedBuffer);
    this.waveform.loadAudioBuffer(trimmedBuffer);
    this.waveform.clearRegions();
    this.ui.updateTimeDisplay(0, trimmedBuffer.duration);
    this.ui.showNotification('Audio cropped to selection!', 'success');
  }

  handleExport() {
    if (!this.audio.buffer) return;

    this.ui.showNotification('Encoding WAV file...', 'info');
    setTimeout(() => {
      const blob = AudioExporter.bufferToWavBlob(this.audio.buffer);
      AudioExporter.downloadBlob(blob, 'soundcraft-export.wav');
      this.ui.showNotification('Export complete! File downloaded.', 'success');
    }, 100);
  }
}

// Initialize application on DOM ready
document.addEventListener('DOMContentLoaded', () => {
  window.app = new SoundCraftApp();
});
