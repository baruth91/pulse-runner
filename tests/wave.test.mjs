import test from "node:test";
import assert from "node:assert/strict";
import {
  LEVELS,
  SPEEDS,
  SIZE,
  FLIGHT_HEIGHT,
  WAVE_SLOPE,
  isWave,
  createState,
  createLevel,
  requestJump,
  update,
  collides,
  wavePath,
  checkpointDistances,
  restartState,
  waveBounds,
} from "../src/engine.js";
import { readRecords, recordAttempt } from "../src/records.js";
const levels = LEVELS.filter((level) => isWave(level.id));

function finishWave(state, walls) {
  state.status = "running";
  const hazards = walls.filter((wall) => wall.type === "wave-hazard");
  for (let i = 0; i < 20000 && state.status === "running"; i++) {
    const next = hazards.find(
      (hazard) => hazard.x + hazard.width > state.distance + 3,
    );
    if (
      next &&
      next.x - state.distance < 230 &&
      ((next.side === "ceiling" && state.direction === 1) ||
        (next.side === "floor" && state.direction === -1))
    )
      requestJump(state);
    update(state, 1 / 120, walls);
  }
}

test("each Wave tap toggles exactly once, including two inputs before a frame", () => {
  const state = createState("pulse", "wave-start");
  state.status = "running";
  assert.equal(state.direction, 1);
  requestJump(state);
  assert.equal(state.direction, -1);
  requestJump(state);
  assert.equal(state.direction, 1);
  assert.equal(state.jumps, 2);
  update(state, 0.1, []);
  assert.equal(state.jumps, 2);
  assert.equal(state.velocity, SPEEDS.pulse * WAVE_SLOPE);
  state.status = "paused";
  const before = structuredClone(state);
  requestJump(state);
  update(state, 0.1, []);
  assert.deepEqual(state, before);
});

test("Wave glides on outer limits and reverses away on the next tap", () => {
  for (const direction of [-1, 1]) {
    const state = createState("rush", "wave-start");
    state.status = "running";
    state.direction = direction;
    state.y = direction === 1 ? FLIGHT_HEIGHT - SIZE - 1 : 1;
    update(state, 0.1, []);
    assert.equal(state.status, "running");
    const limit = direction === 1 ? FLIGHT_HEIGHT - SIZE : 0;
    assert.equal(state.y, limit);
    const distance = state.distance;
    update(state, 0.1, []);
    assert.ok(state.distance > distance);
    assert.equal(state.y, limit);
    requestJump(state);
    update(state, 0.1, []);
    assert.notEqual(state.y, limit);
  }
});

test("Wave sticks to sloped surfaces until another tap", () => {
  const state = createState("pulse", "wave-start");
  state.status = "running";
  const walls = createLevel(state.level).filter(
    (item) => item.type === "corridor",
  );
  for (let frame = 0; frame < 360; frame++) update(state, 1 / 120, walls);
  assert.equal(state.status, "running");
  assert.equal(state.attached, "ceiling");
  assert.equal(state.y, waveBounds(state.distance, walls).top);
  for (let frame = 0; frame < 60; frame++) update(state, 1 / 120, walls);
  assert.equal(state.attached, "ceiling");
  assert.equal(state.jumps, 0);
  requestJump(state);
  for (let frame = 0; frame < 120; frame++) update(state, 1 / 120, walls);
  assert.equal(state.status, "running");
  assert.equal(state.attached, "floor");
  assert.equal(state.y, waveBounds(state.distance, walls).bottom);
});

test("Wave surfaces are safe and only separate obstacles are lethal", () => {
  const wall = createLevel("wave-storm")[2];
  const state = createState("rush", "wave-storm");
  state.distance = wall.x + 150;
  state.y = wavePath(state.level, state.distance + SIZE / 2).center - SIZE / 2;
  assert.equal(collides(state, wall), false);
  state.y = 0;
  assert.equal(collides(state, wall), false);
  state.y = FLIGHT_HEIGHT - SIZE;
  assert.equal(collides(state, wall), false);
  const hazard = createLevel(state.level).find(
    (item) => item.type === "wave-hazard",
  );
  state.status = "running";
  state.distance = hazard.x;
  state.y = hazard.y + 5;
  assert.equal(collides(state, hazard), true);
  update(state, 0.01, [hazard]);
  assert.equal(state.status, "dead");
});

test("all three Wave courses complete at every speed with discrete toggles", () => {
  assert.equal(levels.length, 3);
  for (const level of levels)
    for (const mode of Object.keys(SPEEDS)) {
      const state = createState(mode, level.id);
      finishWave(state, createLevel(level.id));
      assert.equal(
        state.status,
        "won",
        `${level.id}/${mode} at ${state.distance}`,
      );
      assert.equal(state.distance, level.finish);
      assert.ok(state.jumps >= 8);
    }
});

test("every Wave checkpoint restarts centered and finishes at the fastest speed", () => {
  for (const level of levels)
    for (const point of checkpointDistances(level.id)) {
      const previous = createState("rush", level.id, true);
      previous.distance = point - 1;
      previous.status = "running";
      previous.y = wavePath(level.id, point + SIZE / 2).center - SIZE / 2;
      update(previous, 1 / 120);
      assert.equal(previous.checkpoint, point);
      previous.status = "dead";
      previous.direction = -1;
      previous.jumpBuffer = 0.09;
      const state = restartState(previous);
      assert.equal(state.distance, point);
      assert.equal(
        state.y,
        wavePath(level.id, point + SIZE / 2).center - SIZE / 2,
      );
      assert.equal(state.jumpBuffer, 0);
      assert.ok(!createLevel(level.id).some((wall) => collides(state, wall)));
      finishWave(state, createLevel(level.id));
      assert.equal(state.status, "won");
      assert.equal(restartState(previous, true).distance, 0);
      assert.equal(restartState(state).distance, 0);
    }
});

test("Wave movement stays equivalent across render rates", () => {
  const states = [30, 60, 120].map((fps) => {
    const state = createState("pulse", "wave-start");
    state.status = "running";
    for (let frame = 0; frame < fps; frame++) {
      if (frame === fps / 2) requestJump(state);
      update(state, 1 / fps, []);
    }
    return state;
  });
  for (const state of states) {
    assert.ok(Math.abs(state.y - 135) < 1.5);
    assert.ok(Math.abs(state.distance - SPEEDS.pulse) < 1.5);
    assert.equal(state.jumps, 1);
  }
});

test("Wave scores stay isolated from flight and practice", () => {
  const records = readRecords(null);
  const state = createState("pulse", "wave-neon");
  state.distance = 5700;
  const next = recordAttempt(records, state);
  assert.equal(next["wave-neon:pulse"], 100);
  assert.equal(next["skyline:pulse"], 0);
  state.practice = true;
  assert.deepEqual(recordAttempt(records, state), records);
});
