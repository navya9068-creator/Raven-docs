import type { AmbientSoundType } from '../types/domain';

class AmbientSoundEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private activeNodes: AudioNode[] = [];
  private activeInterval: number | null = null;
  private currentSound: AmbientSoundType = 'none';
  private volume = 0.35;

  private ensureContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return null;
      this.ctx = new AudioCtx();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.value = this.volume;
      this.masterGain.connect(this.ctx.destination);
    }
    if (this.ctx.state === 'suspended') {
      void this.ctx.resume();
    }
    return this.ctx;
  }

  public setVolume(value: number) {
    this.volume = Math.max(0, Math.min(1, value));
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setTargetAtTime(this.volume, this.ctx.currentTime, 0.08);
    }
  }

  public stop() {
    if (this.activeInterval !== null) {
      window.clearInterval(this.activeInterval);
      this.activeInterval = null;
    }
    for (const node of this.activeNodes) {
      try {
        if ('stop' in node && typeof (node as AudioScheduledSourceNode).stop === 'function') {
          (node as AudioScheduledSourceNode).stop();
        }
        node.disconnect();
      } catch {
        // Ignore already stopped nodes
      }
    }
    this.activeNodes = [];
    this.currentSound = 'none';
  }

  public play(sound: AmbientSoundType) {
    if (sound === this.currentSound && this.activeNodes.length > 0) return;
    this.stop();
    if (sound === 'none') return;

    const ctx = this.ensureContext();
    if (!ctx || !this.masterGain) return;
    this.currentSound = sound;

    if (sound === 'rain') {
      this.startNoise(ctx, 'pink', 950, 0.55);
    } else if (sound === 'archive') {
      this.startNoise(ctx, 'brown', 320, 0.65);
    } else if (sound === 'hearth') {
      this.startNoise(ctx, 'brown', 240, 0.5);
      this.activeInterval = window.setInterval(() => {
        this.triggerCrackle(ctx);
      }, 340);
    } else if (sound === 'binaural') {
      this.startBinaural(ctx, 180, 40);
    }
  }

  private startNoise(ctx: AudioContext, color: 'pink' | 'brown', cutoffHz: number, gainLevel: number) {
    if (!this.masterGain) return;
    const bufferSize = ctx.sampleRate * 3;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const output = buffer.getChannelData(0);

    if (color === 'brown') {
      let lastOut = 0.0;
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        output[i] = (lastOut + 0.02 * white) / 1.02;
        lastOut = output[i];
        output[i] *= 3.2;
      }
    } else {
      let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        b0 = 0.99886 * b0 + white * 0.0555179;
        b1 = 0.99332 * b1 + white * 0.0750759;
        b2 = 0.96900 * b2 + white * 0.1538520;
        b3 = 0.86650 * b3 + white * 0.3104856;
        b4 = 0.55000 * b4 + white * 0.5329522;
        b5 = -0.7616 * b5 - white * 0.0168980;
        output[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.06;
        b6 = white * 0.115926;
      }
    }

    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.loop = true;

    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = cutoffHz;

    const gain = ctx.createGain();
    gain.gain.value = gainLevel;

    source.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);
    source.start();

    this.activeNodes.push(source, filter, gain);
  }

  private triggerCrackle(ctx: AudioContext) {
    if (!this.masterGain || Math.random() > 0.65) return;
    const len = Math.floor(ctx.sampleRate * 0.035);
    const buffer = ctx.createBuffer(1, len, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < len; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (len * 0.2));
    }
    const src = ctx.createBufferSource();
    src.buffer = buffer;

    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 1400 + Math.random() * 1800;

    const gain = ctx.createGain();
    gain.gain.value = 0.12 + Math.random() * 0.12;

    src.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);
    src.start();
  }

  private startBinaural(ctx: AudioContext, baseHz: number, beatHz: number) {
    if (!this.masterGain) return;
    const oscL = ctx.createOscillator();
    const oscR = ctx.createOscillator();
    oscL.type = 'sine';
    oscR.type = 'sine';
    oscL.frequency.value = baseHz;
    oscR.frequency.value = baseHz + beatHz;

    const panL = ctx.createStereoPanner ? ctx.createStereoPanner() : null;
    const panR = ctx.createStereoPanner ? ctx.createStereoPanner() : null;
    const gain = ctx.createGain();
    gain.gain.value = 0.18;

    if (panL && panR) {
      panL.pan.value = -0.8;
      panR.pan.value = 0.8;
      oscL.connect(panL);
      oscR.connect(panR);
      panL.connect(gain);
      panR.connect(gain);
      this.activeNodes.push(panL, panR);
    } else {
      oscL.connect(gain);
      oscR.connect(gain);
    }

    gain.connect(this.masterGain);
    oscL.start();
    oscR.start();
    this.activeNodes.push(oscL, oscR, gain);
  }
}

export const ambientAudio = new AmbientSoundEngine();
