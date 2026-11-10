// Deterministic authored rules: layouts never change between attempts.
export const KIND_NAMES = { jump: "Salto", flight: "Voo", wave: "Wave" };
export const tier = (index) =>
  index <= 8 ? "Inicial" : index <= 16 ? "Avançado" : "Especialista";
export const EXTRA_LEVELS = Object.keys(KIND_NAMES).flatMap((kind) =>
  Array.from({ length: 21 }, (_, i) => {
    const index = i + 4;
    return {
      id: `${kind}-${String(index).padStart(2, "0")}`,
      kind,
      index,
      name: `${KIND_NAMES[kind]} ${String(index).padStart(2, "0")} · ${tier(index)}`,
      number: `${kind === "jump" ? "S" : kind === "flight" ? "V" : "W"}${String(index).padStart(2, "0")}`,
      finish: 4800 + (index % 5) * 220,
      generated: true,
      description: `Desafio ${index}/24. ${tier(index)}: novas sequências e ${kind === "jump" ? "ritmos de salto" : kind === "flight" ? "alturas de passagem" : "obstáculos entre superfícies"}.`,
    };
  }),
);
const hash = (seed, n) =>
  ((seed * 1103515245 + n * 12345 + n * n * 97) >>> 0) % 997;
export function makeCourse(kind, index, length) {
  if (kind === "jump") {
    const result = [];
    let n = 0;
    for (let x = 750; x < length - 350; n++) {
      const pick = hash(index, n) % 4;
      const type = pick === 0 ? "block" : "spike";
      result.push({
        x,
        width: type === "block" ? 42 : 32,
        height: type === "block" ? 48 : 40,
        type,
      });
      if (pick === 3)
        result.push({ x: x + 34, width: 32, height: 40, type: "spike" });
      x += 530 - index * 4 + (hash(index, n + 9) % 80);
    }
    return result;
  }
  if (kind === "flight") {
    const result = [],
      gap = 160 - index * 1.7;
    for (
      let x = 650, n = 0;
      x < length - 350;
      n++, x += 470 - index * 2 + (hash(index, n) % 45)
    ) {
      const center = 150 + ((hash(index, n + 3) % 5) - 2) * (10 + index * 0.2);
      result.push({
        type: "gate",
        x,
        width: 64,
        height: 300,
        bottom: center - gap / 2,
        top: center + gap / 2,
      });
    }
    return result;
  }
  const gap = 168 - index * 1.8,
    walls = [];
  const spacing = 400;
  for (let x = 0, n = 0; x < length; n++, x += spacing) {
    const center =
      n === 0 ? 150 : 150 + ((hash(index, n) % 5) - 2) * (9 + index * 0.3);
    const endCenter = 150 + ((hash(index, n + 1) % 5) - 2) * (9 + index * 0.3);
    walls.push({
      type: "corridor",
      x,
      width: Math.min(spacing, length - x),
      height: 300,
      bottom: center - gap / 2,
      top: center + gap / 2,
      bottomEnd: endCenter - gap / 2,
      topEnd: endCenter + gap / 2,
    });
  }
  const hazards = [];
  for (let x = 650, n = 0; x < length - 350; n++, x += 560 - index * 5) {
    hazards.push(makeHazard(walls, x, n % 2 === 0 ? "ceiling" : "floor"));
  }
  return [...walls, ...hazards];
}
export function makeHazard(walls, x, side) {
  const wall = walls.find((w) => x + 17 < w.x + w.width) || walls.at(-1);
  const offset =
    ((wall.bottomEnd - wall.bottom) * (x + 17 - wall.x)) / wall.width;
  return {
    type: "wave-hazard",
    x,
    width: 34,
    height: 44,
    side,
    y: side === "floor" ? wall.bottom + offset - 2 : wall.top + offset - 42,
  };
}
