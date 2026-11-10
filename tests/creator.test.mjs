import test from "node:test";
import assert from "node:assert/strict";
import {
  LEVELS,
  SPEEDS,
  createLevel,
  createState,
  update,
  requestJump,
  isFlight,
  isWave,
  registerCustomLevel,
  activeObstacles,
  levelKind,
  restartState,
  getLevel,
} from "../src/engine.js";
import {
  compileTrack,
  defaultSection,
  validateTrack,
  readLibrary,
} from "../src/creator.js";
import { SKINS } from "../src/cosmetics.js";

function pilot(state) {
  const obstacles = createLevel(state.level);
  state.status = "running";
  for (let frame = 0; frame < 30000 && state.status === "running"; frame++) {
    const current = activeObstacles(state, obstacles);
    if (isWave(state.level, state.distance)) {
      const next = current.find(
        (item) =>
          item.type === "wave-hazard" &&
          item.x + item.width > state.distance + 3,
      );
      if (
        next &&
        next.x - state.distance < 230 &&
        ((next.side === "ceiling" && state.direction === 1) ||
          (next.side === "floor" && state.direction === -1))
      )
        requestJump(state);
    } else if (isFlight(state.level, state.distance)) {
      const gate = current.find(
        (item) => item.x + item.width > state.distance + 3,
      );
      const target = gate ? (gate.bottom + gate.top - 30) / 2 : 135;
      if (state.y < target && state.velocity <= 0) requestJump(state);
    } else {
      const next = current.find(
        (item) => item.x + item.width > state.distance + 3,
      );
      if (
        next &&
        state.y === 0 &&
        next.x - state.distance <= SPEEDS[state.mode] * 0.3
      )
        requestJump(state);
    }
    update(state, 1 / 120, obstacles);
  }
}

test("catalog contains 24 distinct courses per modality and new harder speeds", () => {
  assert.equal(LEVELS.length, 72);
  for (const kind of ["jump", "flight", "wave"]) {
    const group = LEVELS.filter((level) => levelKind(level.id) === kind);
    assert.equal(group.length, 24);
    assert.equal(
      new Set(group.map((level) => JSON.stringify(createLevel(level.id)))).size,
      24,
    );
  }
  assert.ok(SPEEDS.extreme > SPEEDS.expert && SPEEDS.expert > SPEEDS.rush);
  assert.equal(SKINS.length, 12);
  assert.ok(SKINS.some((skin) => skin.shape === 6));
  assert.ok(new Set(SKINS.map((skin) => skin.id)).size === SKINS.length);
});

test("Creator rejects invalid, overlong and malformed tracks", () => {
  const good = { schema: 1, title: "Mixed", sections: [defaultSection()] };
  assert.throws(() => validateTrack({ ...good, title: "" }));
  assert.throws(() =>
    validateTrack({ ...good, sections: Array(4).fill(defaultSection()) }),
  );
  assert.throws(() =>
    validateTrack({
      ...good,
      sections: [{ ...defaultSection(), kind: "constructor" }],
    }),
  );
  assert.throws(() =>
    validateTrack({
      ...good,
      sections: [{ ...defaultSection(), slots: ["spike"] }],
    }),
  );
  assert.throws(() =>
    validateTrack({
      ...good,
      sections: [{ ...defaultSection(), challenge: Infinity }],
    }),
  );
  assert.deepEqual(validateTrack(JSON.parse(JSON.stringify(good))), good);
  assert.deepEqual(readLibrary([null, { id: "bad", ...good }]), []);
  assert.equal(readLibrary([{ id: "creator-sample", ...good }]).length, 1);
});

test("all mode transitions and Creator courses complete at every speed", () => {
  const kinds = ["jump", "flight", "wave"];
  const orders = [
    ...kinds.map((kind) => [kind]),
    ...kinds.flatMap((a) => kinds.filter((b) => a !== b).map((b) => [a, b])),
    kinds,
    ["wave", "jump", "flight"],
    ["flight", "wave", "jump"],
  ];
  for (const [index, order] of orders.entries())
    for (const mode of Object.keys(SPEEDS)) {
      const level = registerCustomLevel(
        compileTrack(
          {
            schema: 1,
            title: "Test course",
            sections: order.map((kind) => defaultSection(kind)),
          },
          `creator-test-${index}`,
        ),
      );
      assert.ok(level.finish <= 6000);
      const state = createState(mode, level.id, true);
      pilot(state);
      assert.equal(
        state.status,
        "won",
        `${order.join("/")}/${mode} at ${state.distance}`,
      );
      assert.equal(state.sectionIndex, order.length - 1);
      assert.equal(
        getLevel(state.level).sections[state.sectionIndex].kind,
        order.at(-1),
      );
    }
});

test("mixed checkpoint retry restores its modality with cleared input and physics", () => {
  const level = registerCustomLevel(
    compileTrack(
      {
        schema: 1,
        title: "Mixed checkpoint",
        sections: [
          defaultSection("jump"),
          defaultSection("flight"),
          defaultSection("wave"),
        ],
      },
      "creator-checkpoints",
    ),
  );
  for (const [distance, kind] of [
    [2000, "flight"],
    [4000, "wave"],
  ]) {
    const previous = createState("extreme", level.id, true);
    previous.checkpoint = distance;
    previous.status = "dead";
    previous.velocity = -500;
    previous.jumpBuffer = 1;
    const state = restartState(previous);
    assert.equal(state.distance, distance);
    assert.equal(levelKind(state.level, state.distance), kind);
    assert.equal(state.velocity, 0);
    assert.equal(state.jumpBuffer, 0);
    pilot(state);
    assert.equal(state.status, "won");
    assert.equal(restartState(previous, true).distance, 0);
  }
});

test("Creator default obstacles remain completable across all challenge profiles and speeds", () => {
  for (const kind of ["jump", "flight", "wave"])
    for (let challenge = 1; challenge <= 24; challenge++)
      for (const mode of Object.keys(SPEEDS)) {
        const level = registerCustomLevel(
          compileTrack(
            {
              schema: 1,
              title: "Challenge check",
              sections: [{ ...defaultSection(kind), challenge }],
            },
            "creator-profile",
          ),
        );
        const state = createState(mode, level.id, true);
        pilot(state);
        assert.equal(
          state.status,
          "won",
          `${kind}/${challenge}/${mode} at ${state.distance}`,
        );
      }
});
