import test from "node:test";
import assert from "node:assert/strict";
import { GameAudio } from "../src/audio.js";

function context() {
  const param = () => ({
    value: 0,
    setValueAtTime() {},
    exponentialRampToValueAtTime() {},
    setTargetAtTime(v) {
      this.value = v;
    },
  });
  const node = () => ({
    connect() {},
    disconnect() {},
    start() {},
    stop() {},
    frequency: param(),
    gain: param(),
  });
  return {
    state: "suspended",
    currentTime: 0,
    sampleRate: 8000,
    destination: {},
    async resume() {
      this.state = "running";
    },
    createGain: node,
    createOscillator: node,
    createBufferSource: node,
    createBiquadFilter: node,
    createBuffer: (_, length) => ({
      getChannelData: () => new Float32Array(length),
    }),
  };
}

test("sound is opt-in and stopping clears scheduled music and the scheduler", async () => {
  let created = 0;
  const audio = new GameAudio(() => {
    created++;
    return context();
  });
  audio.running = true;
  audio.sync();
  audio.crash();
  assert.equal(created, 0);
  audio.enabled = true;
  await audio.activate();
  audio.sync();
  try {
    assert.notEqual(audio.timer, null);
    assert.ok(audio.voices.size > 0);
    audio.silence();
    assert.equal(audio.timer, null);
    assert.equal(audio.voices.size, 0);
  } finally {
    audio.silence();
  }
});

test("collision can sound with music off, but respects effects and master mute", async () => {
  const audio = new GameAudio(context);
  await audio.activate();
  audio.enabled = true;
  audio.music = false;
  audio.running = true;
  audio.sync();
  assert.equal(audio.timer, null);
  audio.crash();
  assert.equal(audio.voices.size, 2);
  assert.ok([...audio.voices].every((voice) => !voice.music));
  audio.silence();
  audio.effects = false;
  audio.crash();
  assert.equal(audio.voices.size, 0);
  audio.effects = true;
  audio.enabled = false;
  audio.crash();
  assert.equal(audio.voices.size, 0);
});

test("late activation does not restart a paused run and volume stays bounded", async () => {
  const audio = new GameAudio(context);
  audio.enabled = true;
  audio.running = true;
  const activation = audio.activate();
  audio.silence();
  await activation;
  audio.sync();
  assert.equal(audio.timer, null);
  audio.setVolume(9);
  assert.equal(audio.volume, 1);
  audio.setVolume(-2);
  assert.equal(audio.volume, 0);
  audio.enabled = false;
  audio.sync();
  assert.equal(audio.master.gain.value, 0);
});
