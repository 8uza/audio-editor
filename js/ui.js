/**
 * UIController handles DOM events, controls binding, tab switching, and user feedback.
 */
export class UIController {
  constructor() {
    // Elements
    this.dropZone = document.getElementById('drop-zone');
    this.fileInput = document.getElementById('file-input');
    this.editorWorkspace = document.getElementById('editor-workspace');
    this.bottomPanel = document.getElementById('bottom-panel');
    this.fileNameDisplay = document.getElementById('file-name');
    this.timeDisplay = document.getElementById('time-display');

    this.btnPlay = document.getElementById('btn-play');
    this.btnStop = document.getElementById('btn-stop');
    this.btnExportHeader = document.getElementById('btn-export-header');
    this.btnExportTab = document.getElementById('btn-export-tab');
    this.iconPlay = document.getElementById('icon-play');
    this.iconPause = document.getElementById('icon-pause');

    this.zoomSlider = document.getElementById('zoom-slider');
    this.toastContainer = document.getElementById('toast-container');

    this.setupTabs();
  }

  /**
   * Bind drag and drop events.
   * @param {Function} onFileSelected 
   */
  bindFileUpload(onFileSelected) {
    const handleFile = (file) => {
      if (file && file.type.startsWith('audio/')) {
        onFileSelected(file);
      } else {
        this.showNotification('Please select a valid audio file.', 'error');
      }
    };

    this.fileInput.addEventListener('change', (e) => {
      if (e.target.files.length > 0) {
        handleFile(e.target.files[0]);
      }
    });

    this.dropZone.addEventListener('click', () => this.fileInput.click());

    this.dropZone.addEventListener('dragover', (e) => {
      e.preventDefault();
      this.dropZone.classList.add('dragover');
    });

    ['dragleave', 'dragend'].forEach(type => {
      this.dropZone.addEventListener(type, () => {
        this.dropZone.classList.remove('dragover');
      });
    });

    this.dropZone.addEventListener('drop', (e) => {
      e.preventDefault();
      this.dropZone.classList.remove('dragover');
      if (e.dataTransfer.files.length > 0) {
        handleFile(e.dataTransfer.files[0]);
      }
    });
  }

  /**
   * Enable workspace visibility once a file is loaded.
   * @param {string} fileName 
   */
  enableWorkspace(fileName) {
    this.dropZone.classList.add('hidden');
    this.editorWorkspace.classList.remove('hidden');
    this.bottomPanel.classList.remove('disabled');
    this.btnExportHeader.disabled = false;
    this.fileNameDisplay.textContent = fileName;
  }

  /**
   * Update time display format MM:SS / MM:SS
   * @param {number} currentSec 
   * @param {number} totalSec 
   */
  updateTimeDisplay(currentSec, totalSec) {
    const format = (sec) => {
      const m = Math.floor(sec / 60).toString().padStart(2, '0');
      const s = Math.floor(sec % 60).toString().padStart(2, '0');
      return `${m}:${s}`;
    };
    this.timeDisplay.textContent = `${format(currentSec)} / ${format(totalSec)}`;
  }

  /**
   * Update play/pause button state icons.
   * @param {boolean} isPlaying 
   */
  setPlayingState(isPlaying) {
    if (isPlaying) {
      this.iconPlay.classList.add('hidden');
      this.iconPause.classList.remove('hidden');
    } else {
      this.iconPlay.classList.remove('hidden');
      this.iconPause.classList.add('hidden');
    }
  }

  /**
   * Wire tab navigation logic.
   */
  setupTabs() {
    const tabBtns = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');

    tabBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const targetTab = btn.dataset.tab;

        tabBtns.forEach(b => b.classList.remove('active'));
        tabContents.forEach(c => c.classList.remove('active'));

        btn.classList.add('active');
        document.getElementById(`tab-${targetTab}`).classList.add('active');
      });
    });
  }

  /**
   * Display toast message.
   * @param {string} message 
   * @param {'info'|'success'|'error'} type 
   */
  showNotification(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;

    this.toastContainer.appendChild(toast);

    setTimeout(() => {
      toast.remove();
    }, 3000);
  }
}
