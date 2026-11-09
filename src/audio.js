// Original 128 BPM synth loop. Audio is cosmetic, never a physics clock.
export class GameAudio {
  constructor(
    factory = () => new (window.AudioContext || window.webkitAudioContext)(),
  ) {
    this.factory = factory;
    this.enabled = false;
    this.running = false;
    this.music = true;
    this.effects = true;
    this.volume = 0.35;
    this.voices = new Set();
    this.timer = null;
  }
  async activate() {
    if (!this.context) {
      this.context = this.factory();
      this.master = this.context.createGain();
      this.master.gain.value = this.volume * 0.5;
      this.master.connect(this.context.destination);
    }
    await this.context.resume();
    if (this.context.state !== "running") throw new Error("Audio suspended");
  }
  setVolume(value) {
    this.volume = Math.min(1, Math.max(0, Number(value) || 0));
    if (this.master)
      this.master.gain.setTargetAtTime(
        this.enabled ? this.volume * 0.5 : 0,
        this.context.currentTime,
        0.015,
      );
  }
  sync() {
    if (this.master)
      this.master.gain.setTargetAtTime(
        this.enabled ? this.volume * 0.5 : 0,
        this.context.currentTime,
        0.015,
      );
    const shouldPlay =
      this.enabled &&
      this.music &&
      this.running &&
      this.context?.state === "running";
    if (!shouldPlay) {
      if (this.timer !== null) clearInterval(this.timer);
      this.timer = null;
      for (const voice of [...this.voices]) if (voice.music) voice.stop();
      return;
    }
    if (this.timer !== null) return;
    this.step = 0;
    this.nextTime = this.context.currentTime + 0.03;
    const schedule = () => {
      // Never replay a backlog after browser throttling.
      if (this.nextTime < this.context.currentTime)
        this.nextTime = this.context.currentTime + 0.02;
      while (this.nextTime < this.context.currentTime + 0.12) {
        this.beat(this.step++, this.nextTime);
        this.nextTime += 60 / 128 / 4;
      }
    };
    schedule();
    this.timer = setInterval(schedule, 25);
  }
  voice(source, time, duration, level, music = true, filter = null) {
    const gain = this.context.createGain();
    gain.gain.setValueAtTime(0.0001, time);
    gain.gain.exponentialRampToValueAtTime(level, time + 0.004);
    gain.gain.exponentialRampToValueAtTime(0.0001, time + duration);
    source.connect(filter || gain);
    if (filter) filter.connect(gain);
    gain.connect(this.master);
    const voice = {
      music,
      stop: () => {
        source.onended = null;
        try {
          source.stop();
        } catch {
          /* Already finished. */
        }
        source.disconnect();
        filter?.disconnect();
        gain.disconnect();
        this.voices.delete(voice);
      },
    };
    this.voices.add(voice);
    source.onended = voice.stop;
    source.start(time);
    source.stop(time + duration + 0.01);
  }
  tone(
    time,
    frequency,
    duration,
    level,
    type = "sine",
    end = frequency,
    music = true,
  ) {
    const osc = this.context.createOscillator();
    osc.type = type;
    osc.frequency.setValueAtTime(frequency, time);
    osc.frequency.exponentialRampToValueAtTime(end, time + duration);
    this.voice(osc, time, duration, level, music);
  }
  noise(time, duration, level, highpass, music = true) {
    if (!this.noiseBuffer) {
      this.noiseBuffer = this.context.createBuffer(
        1,
        this.context.sampleRate,
        this.context.sampleRate,
      );
      const data = this.noiseBuffer.getChannelData(0);
      for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
    }
    const source = this.context.createBufferSource();
    source.buffer = this.noiseBuffer;
    const filter = this.context.createBiquadFilter();
    filter.type = "highpass";
    filter.frequency.value = highpass;
    this.voice(source, time, duration, level, music, filter);
  }
  beat(step, time) {
    const n = step % 16;
    if (n % 4 === 0) this.tone(time, 145, 0.16, 0.65, "sine", 42);
    if (n % 2 === 0) this.noise(time, 0.045, 0.09, 7500);
    if (n === 4 || n === 12) this.noise(time, 0.11, 0.18, 1500);
    const roots = [130.81, 103.83, 155.56, 116.54]; // C minor progression.
    const root = roots[Math.floor(step / 16) % 4];
    if (n % 4 === 2) this.tone(time, root / 2, 0.17, 0.24, "triangle");
    const notes = [1, 1.5, 2, 1.1875, 1.5, 2, 2.375, 1.5];
    if (n % 2 === 1)
      this.tone(
        time,
        root * 2 * notes[Math.floor(n / 2)],
        0.12,
        0.1,
        "triangle",
      );
  }
  crash() {
    if (!this.enabled || !this.effects || this.context?.state !== "running")
      return;
    const time = this.context.currentTime + 0.005;
    this.tone(time, 160, 0.24, 0.6, "sine", 30, false);
    this.noise(time, 0.2, 0.3, 500, false);
  }
  silence() {
    this.running = false;
    this.sync();
    for (const voice of [...this.voices]) voice.stop();
  }
}
