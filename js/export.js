/**
 * AudioExporter provides methods for audio slice trimming and client-side WAV rendering.
 */
export class AudioExporter {
  /**
   * Slice an existing AudioBuffer to create a trimmed copy.
   * @param {AudioContext} audioCtx 
   * @param {AudioBuffer} buffer 
   * @param {number} startTime Seconds
   * @param {number} endTime Seconds
   * @returns {AudioBuffer}
   */
  static trimBuffer(audioCtx, buffer, startTime, endTime) {
    const rate = buffer.sampleRate;
    const startOffset = Math.floor(startTime * rate);
    const endOffset = Math.floor(endTime * rate);
    const frameCount = Math.max(0, endOffset - startOffset);

    const trimmedBuffer = audioCtx.createBuffer(
      buffer.numberOfChannels,
      frameCount,
      rate
    );

    for (let channel = 0; channel < buffer.numberOfChannels; channel++) {
      const channelData = buffer.getChannelData(channel);
      const trimmedData = trimmedBuffer.getChannelData(channel);
      trimmedData.set(channelData.subarray(startOffset, endOffset));
    }

    return trimmedBuffer;
  }

  /**
   * Encodes an AudioBuffer to a uncompressed PCM WAV Blob.
   * @param {AudioBuffer} audioBuffer 
   * @returns {Blob}
   */
  static bufferToWavBlob(audioBuffer) {
    const numOfChan = audioBuffer.numberOfChannels;
    const length = audioBuffer.length * numOfChan * 2 + 44;
    const buffer = new ArrayBuffer(length);
    const view = new DataView(buffer);
    const channels = [];
    let sample = 0;
    let offset = 0;
    let pos = 0;

    // Helper writer functions
    function setUint16(data) {
      view.setUint16(pos, data, true);
      pos += 2;
    }

    function setUint32(data) {
      view.setUint32(pos, data, true);
      pos += 4;
    }

    // Write RIFF Header
    setUint32(0x46464952); // "RIFF"
    setUint32(length - 8); // file length - 8
    setUint32(0x45564157); // "WAVE"

    // Write Format Chunk
    setUint32(0x20746d66); // "fmt " chunk
    setUint32(16);         // length = 16
    setUint16(1);          // PCM (uncompressed)
    setUint16(numOfChan);
    setUint32(audioBuffer.sampleRate);
    setUint32(audioBuffer.sampleRate * 2 * numOfChan); // byte rate
    setUint16(numOfChan * 2); // block align
    setUint16(16);         // bits per sample

    // Write Data Chunk
    setUint32(0x61746164); // "data" chunk
    setUint32(length - pos - 4);

    for (let i = 0; i < audioBuffer.numberOfChannels; i++) {
      channels.push(audioBuffer.getChannelData(i));
    }

    while (offset < audioBuffer.length) {
      for (let i = 0; i < numOfChan; i++) {
        sample = Math.max(-1, Math.min(1, channels[i][offset]));
        sample = (0.5 + sample < 0 ? sample * 32768 : sample * 32767) | 0;
        view.setInt16(pos, sample, true);
        pos += 2;
      }
      offset++;
    }

    return new Blob([buffer], { type: 'audio/wav' });
  }

  /**
   * Triggers a browser download of the Blob.
   * @param {Blob} blob 
   * @param {string} filename 
   */
  static downloadBlob(blob, filename = 'exported-audio.wav') {
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = filename;
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    URL.revokeObjectURL(url);
  }
}
