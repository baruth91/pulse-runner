export const SIZE = 30;
export const GRAVITY = 1900;
export const JUMP = 650;
export const SPEEDS = { chill: 235, pulse: 285, rush: 335 };
export const FINISH = 7800;
export const FIXED_STEP = 1 / 240;

export function createLevel() {
  const obstacles = [];
  const pattern = [
    "spike",
    "spike",
    "block",
    "double",
    "spike",
    "block",
    "double",
    "spike",
    "double",
    "block",
    "spike",
    "double",
    "block",
  ];
  pattern.forEach((type, index) => {
    const x = 850 + index * 510;
    if (type === "block")
      obstacles.push({ x, width: 42, height: 48, type: "block" });
    else {
      obstacles.push({ x, width: 32, height: 40, type: "spike" });
      if (type === "double")
        obstacles.push({ x: x + 34, width: 32, height: 40, type: "spike" });
    }
  });
  return obstacles;
}
export function createState(mode = "pulse") {
  if (!Object.hasOwn(SPEEDS, mode)) throw new Error("Unknown mode");
  return {
    mode,
    status: "ready",
    distance: 0,
    y: 0,
    velocity: 0,
    jumps: 0,
    rotation: 0,
    accumulator: 0,
    jumpBuffer: 0,
  };
}
export function requestJump(state) {
  if (state.status === "running") state.jumpBuffer = 0.09;
}
export function overlapPolygons(first, second) {
  for (const polygon of [first, second])
    for (let index = 0; index < polygon.length; index++) {
      const point = polygon[index],
        next = polygon[(index + 1) % polygon.length];
      const axis = { x: -(next.y - point.y), y: next.x - point.x };
      const project = (shape) =>
        shape.map((item) => item.x * axis.x + item.y * axis.y);
      const a = project(first),
        b = project(second);
      if (Math.max(...a) <= Math.min(...b) || Math.max(...b) <= Math.min(...a))
        return false;
    }
  return true;
}
export function collides(state, obstacle) {
  const left = state.distance + 3,
    right = state.distance + SIZE - 3;
  if (
    right <= obstacle.x ||
    left >= obstacle.x + obstacle.width ||
    state.y >= obstacle.height
  )
    return false;
  const player = [
    { x: left, y: state.y + 2 },
    { x: right, y: state.y + 2 },
    { x: right, y: state.y + SIZE - 2 },
    { x: left, y: state.y + SIZE - 2 },
  ];
  const shape =
    obstacle.type === "spike"
      ? [
          { x: obstacle.x, y: 0 },
          { x: obstacle.x + obstacle.width / 2, y: obstacle.height },
          { x: obstacle.x + obstacle.width, y: 0 },
        ]
      : [
          { x: obstacle.x, y: 0 },
          { x: obstacle.x + obstacle.width, y: 0 },
          { x: obstacle.x + obstacle.width, y: obstacle.height },
          { x: obstacle.x, y: obstacle.height },
        ];
  return overlapPolygons(player, shape);
}
export function update(state, elapsed, obstacles = createLevel()) {
  if (state.status !== "running") return state;
  // Long frame gaps never fast-forward the player through an entire level.
  state.accumulator += Math.min(0.1, Math.max(0, elapsed));
  while (state.accumulator >= FIXED_STEP && state.status === "running") {
    state.accumulator -= FIXED_STEP;
    if (state.jumpBuffer > 0 && state.y === 0) {
      state.velocity = JUMP;
      state.jumps++;
      state.jumpBuffer = 0;
    }
    state.jumpBuffer = Math.max(0, state.jumpBuffer - FIXED_STEP);
    state.distance += SPEEDS[state.mode] * FIXED_STEP;
    state.y +=
      state.velocity * FIXED_STEP - (GRAVITY * FIXED_STEP * FIXED_STEP) / 2;
    state.velocity -= GRAVITY * FIXED_STEP;
    if (state.y <= 0) {
      state.y = 0;
      state.velocity = 0;
      state.rotation =
        Math.round(state.rotation / (Math.PI / 2)) * (Math.PI / 2);
    } else state.rotation += FIXED_STEP * 7;
    if (obstacles.some((obstacle) => collides(state, obstacle))) {
      state.status = "dead";
      break;
    }
    if (state.distance >= FINISH) {
      state.distance = FINISH;
      state.status = "won";
    }
  }
  return state;
}
