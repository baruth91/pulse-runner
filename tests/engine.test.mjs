import { test } from "node:test";
import assert from "node:assert/strict";
import {
  createState,
  createLevel,
  update,
  requestJump,
  collides,
  SPEEDS,
  FINISH,
} from "../src/engine.js";
test("unknown and inherited mode names are rejected", () => {
  assert.throws(() => createState("invalid"));
  assert.throws(() => createState("toString"));
});
test("running without a jump collides with the first obstacle", () => {
  const state = createState();
  state.status = "running";
  for (let i = 0; i < 1000 && state.status === "running"; i++)
    update(state, 1 / 60);
  assert.equal(state.status, "dead");
  assert.ok(state.distance < 900);
});
test("a jump lifts the player and does not permit a second midair jump", () => {
  const state = createState();
  state.status = "running";
  requestJump(state);
  update(state, 0.05, []);
  const jumps = state.jumps;
  requestJump(state);
  update(state, 0.05, []);
  assert.ok(state.y > 0);
  assert.equal(state.jumps, jumps);
});
test("a paused state does not advance time, distance or physics", () => {
  const state = createState();
  state.status = "paused";
  const previous = structuredClone(state);
  update(state, 1);
  assert.deepEqual(state, previous);
});
test("triangle collision avoids the empty space above a spike edge", () => {
  const state = createState();
  state.distance = 0;
  state.y = 25;
  const obstacle = { x: 25, width: 32, height: 40, type: "spike" };
  assert.equal(collides(state, obstacle), false);
  state.distance = 27;
  assert.equal(collides(state, obstacle), true);
});
test("high speed fixed substeps do not tunnel through narrow obstacles", () => {
  const state = createState("rush");
  state.status = "running";
  update(state, 0.1, [{ x: 34, width: 2, height: 48, type: "block" }]);
  assert.equal(state.status, "dead");
});
test("normal render rates produce equivalent physical results", () => {
  const a = createState(),
    b = createState();
  a.status = b.status = "running";
  requestJump(a);
  requestJump(b);
  for (let i = 0; i < 60; i++) update(a, 1 / 60, []);
  for (let i = 0; i < 120; i++) update(b, 1 / 120, []);
  assert.ok(Math.abs(a.distance - b.distance) < 2);
  assert.equal(a.y, b.y);
});
test("the fixed circuit is completable in each difficulty using grounded jumps", () => {
  for (const mode of Object.keys(SPEEDS)) {
    const state = createState(mode);
    state.status = "running";
    const obstacles = createLevel();
    for (let frame = 0; frame < 20000 && state.status === "running"; frame++) {
      const next = obstacles.find(
        (item) => item.x + item.width > state.distance + 3,
      );
      if (
        next &&
        state.y === 0 &&
        next.x - state.distance <= SPEEDS[mode] * 0.3
      )
        requestJump(state);
      update(state, 1 / 120, obstacles);
    }
    assert.equal(
      state.status,
      "won",
      `${mode} should be completable at ${state.distance}`,
    );
    assert.equal(state.distance, FINISH);
  }
});
test("dead and completed states are stable until an explicit restart", () => {
  for (const status of ["dead", "won"]) {
    const state = createState();
    state.status = status;
    const before = structuredClone(state);
    requestJump(state);
    update(state, 0.1);
    assert.deepEqual(state, before);
  }
});
