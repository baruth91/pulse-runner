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
  LEVELS,
  getLevel,
  checkpointDistances,
  restartState,
  isFlight,
  isWave,
} from "../src/engine.js";
import { readRecords, recordAttempt, recordKey } from "../src/records.js";
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
test("every authored circuit is completable in each difficulty using grounded jumps", () => {
  for (const level of LEVELS.filter(
    (item) => !isFlight(item.id) && !isWave(item.id),
  )) {
    for (const mode of Object.keys(SPEEDS)) {
      const state = createState(mode, level.id);
      state.status = "running";
      const obstacles = createLevel(level.id);
      for (
        let frame = 0;
        frame < 20000 && state.status === "running";
        frame++
      ) {
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
        `${level.id}/${mode} should be completable at ${state.distance}`,
      );
      assert.equal(state.distance, level.finish);
    }
  }
});

test("new circuits have distinct authored patterns and preserve the original finish", () => {
  assert.equal(getLevel().finish, FINISH);
  assert.notDeepEqual(createLevel("circuit"), createLevel("switchback"));
  assert.notDeepEqual(createLevel("switchback"), createLevel("momentum"));
  assert.throws(() => createState("pulse", "missing"));
});
test("practice checkpoints activate only after reaching grounded progress", () => {
  const state = createState("rush", "circuit", true);
  const point = checkpointDistances()[0];
  state.distance = point - 1;
  state.y = 50;
  state.status = "running";
  update(state, 0.05, []);
  assert.equal(state.checkpoint, 0);
  state.y = 0;
  state.velocity = 0;
  update(state, 0.01, []);
  assert.equal(state.checkpoint, point);
  const normal = createState("rush");
  normal.distance = point + 5;
  normal.status = "running";
  update(normal, 0.01, []);
  assert.equal(normal.checkpoint, 0);
});
test("each checkpoint restarts safely and can finish at the highest speed", () => {
  for (const level of LEVELS.filter(
    (item) => !isFlight(item.id) && !isWave(item.id),
  ))
    for (const point of checkpointDistances(level.id)) {
      const previous = createState("rush", level.id, true);
      previous.checkpoint = point;
      previous.status = "dead";
      previous.y = 80;
      previous.jumpBuffer = 1;
      const state = restartState(previous);
      state.status = "running";
      assert.equal(state.distance, point);
      assert.equal(state.y, 0);
      assert.equal(state.jumpBuffer, 0);
      const obstacles = createLevel(level.id);
      assert.equal(
        obstacles.some((obstacle) => collides(state, obstacle)),
        false,
      );
      for (
        let frame = 0;
        frame < 15000 && state.status === "running";
        frame++
      ) {
        const next = obstacles.find(
          (obstacle) => obstacle.x + obstacle.width > state.distance + 3,
        );
        if (
          next &&
          state.y === 0 &&
          next.x - state.distance <= SPEEDS.rush * 0.3
        )
          requestJump(state);
        update(state, 1 / 120, obstacles);
      }
      assert.equal(state.status, "won", `${level.id} checkpoint ${point}`);
    }
});
test("restart from beginning clears checkpoint and ordinary runs never inherit one", () => {
  const state = createState("pulse", "switchback", true);
  state.checkpoint = checkpointDistances("switchback")[0];
  state.status = "dead";
  assert.equal(restartState(state, true).distance, 0);
  state.practice = false;
  assert.equal(restartState(state).distance, 0);
});
test("legacy records migrate only to the unchanged original circuit", () => {
  const records = readRecords(null, { chill: 40, pulse: 100, rush: -1 });
  assert.equal(records[recordKey("circuit", "chill")], 40);
  assert.equal(records[recordKey("switchback", "chill")], 0);
  assert.equal(records[recordKey("circuit", "rush")], 0);
  assert.equal(readRecords({ "momentum:rush": 999 })["momentum:rush"], 0);
});
test("practice attempts cannot set records and ranked scores stay scoped to level and speed", () => {
  const records = readRecords(null);
  const practice = createState("pulse", "circuit", true);
  practice.distance = FINISH;
  assert.deepEqual(recordAttempt(records, practice), records);
  const normal = createState("rush", "switchback");
  normal.distance = getLevel("switchback").finish;
  const next = recordAttempt(records, normal);
  assert.equal(next["switchback:rush"], 100);
  assert.equal(next["circuit:rush"], 0);
  assert.equal(next["switchback:pulse"], 0);
  assert.equal(records["switchback:rush"], 0);
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
