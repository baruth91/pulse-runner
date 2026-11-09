export const SIZE = 30;
export const GRAVITY = 1900;
export const JUMP = 650;
export const SPEEDS = { chill: 235, pulse: 285, rush: 335 };
export const FINISH = 7800;
export const FIXED_STEP = 1 / 240;
// Flight uses a fixed logical arena, independent of responsive canvas height.
export const FLIGHT_HEIGHT = 300;
export const FLIGHT_GRAVITY = 800;
export const FLIGHT_IMPULSE = 250;
export const LEVELS = [
  {
    id: "circuit",
    name: "Circuito inicial",
    number: "01",
    finish: FINISH,
    description: "Aprenda o salto e encontre seu tempo.",
  },
  {
    id: "switchback",
    name: "Quebra-ritmo",
    number: "02",
    finish: 6600,
    description: "Novas sequências, intervalos diferentes.",
  },
  {
    id: "momentum",
    name: "Impulso final",
    number: "03",
    finish: 8000,
    description: "Mais obstáculos. Mais precisão.",
  },
  {
    id: "first-flight",
    name: "Primeiro voo",
    number: "04",
    kind: "flight",
    finish: 5400,
    description: "Passagens amplas para aprender a controlar a altura.",
  },
  {
    id: "skyline",
    name: "Ondas no céu",
    number: "05",
    kind: "flight",
    finish: 5700,
    description: "Suba e desça entre portais em alturas alternadas.",
  },
  {
    id: "airflow",
    name: "Voo de precisão",
    number: "06",
    kind: "flight",
    finish: 6000,
    description: "Passagens menores. Encontre a cadência dos impulsos.",
  },
];
export function getLevel(id = "circuit") {
  const level = LEVELS.find((item) => item.id === id);
  if (!level) throw new Error("Unknown level");
  return level;
}
export function isFlight(level) {
  return getLevel(level).kind === "flight";
}

export function createLevel(id = "circuit") {
  getLevel(id);
  if (isFlight(id)) {
    const config =
      id === "first-flight"
        ? {
            gap: 154,
            spacing: 430,
            centers: [150, 150, 175, 150, 125, 150, 175, 150, 125, 150],
          }
        : id === "skyline"
          ? {
              gap: 132,
              spacing: 420,
              centers: [150, 185, 150, 115, 150, 185, 150, 115, 150, 180, 150],
            }
          : {
              gap: 114,
              spacing: 400,
              centers: [
                150, 180, 125, 175, 120, 170, 130, 180, 125, 170, 140, 150,
              ],
            };
    return config.centers.map((center, index) => ({
      type: "gate",
      x: 650 + index * config.spacing,
      width: 64,
      height: FLIGHT_HEIGHT,
      bottom: center - config.gap / 2,
      top: center + config.gap / 2,
    }));
  }
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
  const authored =
    id === "switchback"
      ? [
          [850, "spike"],
          [1240, "block"],
          [1770, "double"],
          [2180, "spike"],
          [2780, "block"],
          [3190, "double"],
          [3650, "block"],
          [4220, "spike"],
          [4700, "double"],
          [5170, "block"],
          [5710, "double"],
        ]
      : id === "momentum"
        ? [
            [850, "double"],
            [1200, "block"],
            [1640, "spike"],
            [2020, "double"],
            [2490, "block"],
            [2870, "double"],
            [3330, "spike"],
            [3700, "block"],
            [4180, "double"],
            [4540, "spike"],
            [5040, "block"],
            [5430, "double"],
            [5900, "block"],
            [6280, "double"],
            [6740, "spike"],
            [7150, "double"],
          ]
        : pattern.map((type, index) => [850 + index * 510, type]);
  authored.forEach(([x, type]) => {
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
export function createState(
  mode = "pulse",
  level = "circuit",
  practice = false,
) {
  if (!Object.hasOwn(SPEEDS, mode)) throw new Error("Unknown mode");
  getLevel(level);
  if (typeof practice !== "boolean") throw new Error("Invalid practice mode");
  return {
    mode,
    level,
    practice,
    checkpoint: 0,
    status: "ready",
    distance: 0,
    y: isFlight(level) ? (FLIGHT_HEIGHT - SIZE) / 2 : 0,
    velocity: 0,
    jumps: 0,
    rotation: 0,
    accumulator: 0,
    jumpBuffer: 0,
    checkpointY: isFlight(level) ? (FLIGHT_HEIGHT - SIZE) / 2 : 0,
  };
}
const checkpointCache = new Map();
export function checkpointDistances(level = "circuit") {
  if (!checkpointCache.has(level)) {
    const obstacles = createLevel(level),
      candidates = [];
    for (let index = 0; index < obstacles.length - 1; index++) {
      const end = obstacles[index].x + obstacles[index].width;
      if (obstacles[index + 1].x - end >= 300) candidates.push(end + 35);
    }
    const points = [0.25, 0.5, 0.75].map(
      (fraction) =>
        candidates
          .filter((point) => point <= getLevel(level).finish * fraction)
          .at(-1) || 0,
    );
    checkpointCache.set(
      level,
      [...new Set(points)].filter((point) => point > 0),
    );
  }
  return [...checkpointCache.get(level)];
}
export function restartState(previous, fromBeginning = false) {
  const next = createState(previous.mode, previous.level, previous.practice);
  if (previous.practice && !fromBeginning && previous.status !== "won") {
    next.checkpoint = previous.checkpoint;
    next.distance = next.checkpoint;
    if (isFlight(previous.level) && next.checkpoint > 0)
      next.y = next.checkpointY = previous.checkpointY;
  }
  return next;
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
  if (obstacle.type === "gate") {
    if (right <= obstacle.x || left >= obstacle.x + obstacle.width)
      return false;
    return state.y + 2 < obstacle.bottom || state.y + SIZE - 2 > obstacle.top;
  }
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
export function update(state, elapsed, obstacles = createLevel(state.level)) {
  if (state.status !== "running") return state;
  const flight = isFlight(state.level);
  const gravity = flight ? FLIGHT_GRAVITY : GRAVITY;
  // Long frame gaps never fast-forward the player through an entire level.
  state.accumulator += Math.min(0.1, Math.max(0, elapsed));
  while (state.accumulator >= FIXED_STEP && state.status === "running") {
    state.accumulator -= FIXED_STEP;
    if (state.jumpBuffer > 0 && (flight || state.y === 0)) {
      state.velocity = flight ? FLIGHT_IMPULSE : JUMP;
      state.jumps++;
      state.jumpBuffer = 0;
    }
    state.jumpBuffer = Math.max(0, state.jumpBuffer - FIXED_STEP);
    state.distance += SPEEDS[state.mode] * FIXED_STEP;
    state.y +=
      state.velocity * FIXED_STEP - (gravity * FIXED_STEP * FIXED_STEP) / 2;
    state.velocity -= gravity * FIXED_STEP;
    if (flight) {
      state.rotation = Math.max(-0.5, Math.min(0.8, -state.velocity / 400));
      if (state.y <= 0 || state.y + SIZE >= FLIGHT_HEIGHT) {
        state.y = Math.max(0, Math.min(FLIGHT_HEIGHT - SIZE, state.y));
        state.status = "dead";
        break;
      }
    } else if (state.y <= 0) {
      state.y = 0;
      state.velocity = 0;
      state.rotation =
        Math.round(state.rotation / (Math.PI / 2)) * (Math.PI / 2);
    } else state.rotation += FIXED_STEP * 7;
    if (obstacles.some((obstacle) => collides(state, obstacle))) {
      state.status = "dead";
      break;
    }
    if (state.practice && (flight || state.y === 0)) {
      for (const point of checkpointDistances(state.level))
        if (state.distance >= point && state.checkpoint < point) {
          state.checkpoint = point;
          // Restart in a safe gap with zero vertical speed, away from both limits.
          state.checkpointY = Math.max(
            75,
            Math.min(FLIGHT_HEIGHT - SIZE - 75, state.y),
          );
        }
    }
    if (state.distance >= getLevel(state.level).finish) {
      state.distance = getLevel(state.level).finish;
      state.status = "won";
    }
  }
  return state;
}
