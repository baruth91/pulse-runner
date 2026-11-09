import test from "node:test";
import assert from "node:assert/strict";
import {
  LEVELS,
  SPEEDS,
  SIZE,
  FLIGHT_HEIGHT,
  FLIGHT_IMPULSE,
  isFlight,
  createState,
  createLevel,
  requestJump,
  update,
  collides,
  checkpointDistances,
  restartState,
} from "../src/engine.js";
import { readRecords, recordAttempt } from "../src/records.js";
const flightLevels = LEVELS.filter((level) => isFlight(level.id));

function fly(state, gates) {
  state.status = "running";
  for (let frame = 0; frame < 20000 && state.status === "running"; frame++) {
    const gate = gates.find((gate) => gate.x + gate.width > state.distance + 3);
    const target = gate ? (gate.bottom + gate.top - SIZE) / 2 : 135;
    if (state.y < target && state.velocity <= 0) requestJump(state);
    update(state, 1 / 120, gates);
  }
}

test("flight falls without input and allows discrete midair impulses", () => {
  const state = createState("pulse", "first-flight");
  state.status = "running";
  const initial = state.y;
  update(state, 0.1, []);
  assert.ok(state.y < initial);
  requestJump(state);
  update(state, 1 / 120, []);
  assert.ok(state.velocity > 0 && state.velocity < FLIGHT_IMPULSE);
  const first = state.y;
  requestJump(state);
  update(state, 1 / 120, []);
  assert.equal(state.jumps, 2);
  assert.ok(state.y > first);
  update(state, 0.1, []);
  assert.equal(state.jumps, 2, "an impulse is consumed once, not held");
});

test("floor and ceiling are lethal and paused flight stays still", () => {
  for (const ceiling of [false, true]) {
    const state = createState("pulse", "first-flight");
    state.status = "running";
    state.y = ceiling ? FLIGHT_HEIGHT - SIZE - 1 : 1;
    state.velocity = ceiling ? 200 : -200;
    update(state, 0.02, []);
    assert.equal(state.status, "dead");
  }
  const state = createState("pulse", "first-flight");
  state.status = "paused";
  const before = structuredClone(state);
  requestJump(state);
  update(state, 0.1);
  assert.deepEqual(state, before);
});

test("gate collision includes both pillars but permits the opening", () => {
  const gate = createLevel("airflow")[0];
  const state = createState("rush", "airflow");
  state.distance = gate.x;
  state.y = (gate.bottom + gate.top - SIZE) / 2;
  assert.equal(collides(state, gate), false);
  state.y = gate.bottom - 5;
  assert.equal(collides(state, gate), true);
  state.y = gate.top - SIZE + 5;
  assert.equal(collides(state, gate), true);
  state.distance = gate.x - SIZE - 1;
  assert.equal(collides(state, gate), false);
});

test("all three flight courses finish at every speed using timed impulses", () => {
  assert.equal(flightLevels.length, 3);
  for (const level of flightLevels) {
    const gates = createLevel(level.id);
    assert.ok(
      gates.every((gate) => gate.bottom > 0 && gate.top < FLIGHT_HEIGHT),
    );
    for (const mode of Object.keys(SPEEDS)) {
      const state = createState(mode, level.id);
      fly(state, gates);
      assert.equal(
        state.status,
        "won",
        `${level.id}/${mode} at ${state.distance}`,
      );
      assert.equal(state.distance, level.finish);
      assert.ok(state.jumps > 10);
    }
  }
});

test("flight checkpoints acquire in air and safely restart with clean vertical speed", () => {
  for (const level of flightLevels) {
    const gates = createLevel(level.id);
    const points = checkpointDistances(level.id);
    assert.ok(points.length >= 2);
    for (const point of points) {
      const previous = createState("rush", level.id, true);
      previous.distance = point - 1;
      previous.y = 165;
      previous.velocity = -50;
      previous.status = "running";
      update(previous, 1 / 120, gates);
      assert.equal(previous.checkpoint, point);
      previous.status = "dead";
      const state = restartState(previous);
      assert.equal(state.distance, point);
      assert.equal(state.velocity, 0);
      assert.equal(state.jumpBuffer, 0);
      assert.ok(state.y > 0 && state.y + SIZE < FLIGHT_HEIGHT);
      assert.ok(!gates.some((gate) => collides(state, gate)));
      fly(state, gates);
      assert.equal(state.status, "won", `${level.id} checkpoint ${point}`);
      assert.equal(restartState(previous, true).distance, 0);
      assert.equal(
        restartState(state).distance,
        0,
        "completed practice restarts fully",
      );
    }
  }
});

test("flight records are isolated from jumping and practice", () => {
  const records = readRecords(null);
  const state = createState("rush", "first-flight");
  state.distance = LEVELS.find((level) => level.id === state.level).finish;
  const next = recordAttempt(records, state);
  assert.equal(next["first-flight:rush"], 100);
  assert.equal(next["circuit:rush"], 0);
  assert.equal(next["first-flight:pulse"], 0);
  state.practice = true;
  assert.deepEqual(recordAttempt(records, state), records);
});
