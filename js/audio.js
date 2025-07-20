export class SoundManager {
  constructor() {
    // 1. Create AudioContext
    this.audioContext = new (window.AudioContext ||
      window.webkitAudioContext)();
    this.soundBuffers = new Map();
    this.enabled = true; // 소리 on/off 상태
  }

  setEnabled(value) {
    this.enabled = value;
  }

  isEnabled() {
    return this.enabled;
  }

  async loadSound(name, url) {
    try {
      const response = await fetch(url);
      const arrayBuffer = await response.arrayBuffer();
      const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
      this.soundBuffers.set(name, audioBuffer);
    } catch (error) {
      console.error(`Error loading sound: ${name}`, error);
    }
  }

  play(name, volume = 1.0) {
    if (!this.enabled) return; // 소리 off면 재생하지 않음
    const soundBuffer = this.soundBuffers.get(name);
    if (!soundBuffer) {
      console.warn(`Sound not found: ${name}`);
      return;
    }

    // Create Sound Source
    const source = this.audioContext.createBufferSource();
    source.buffer = soundBuffer;

    // Create GainNode to control volume
    const gainNode = this.audioContext.createGain();
    gainNode.gain.setValueAtTime(volume, this.audioContext.currentTime);

    // source -> gainNode -> destination(speaker)
    source.connect(gainNode);
    gainNode.connect(this.audioContext.destination);

    source.start(0);
  }
}
