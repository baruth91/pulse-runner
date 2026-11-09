import { LEVELS, SPEEDS } from "./engine.js";
export function recordKey(level, mode) {
  return `${level}:${mode}`;
}
export function readRecords(value, legacy = null) {
  const result = {};
  for (const level of LEVELS)
    for (const mode of Object.keys(SPEEDS)) {
      const candidate =
        value?.[recordKey(level.id, mode)] ??
        (level.id === "circuit" ? legacy?.[mode] : undefined);
      result[recordKey(level.id, mode)] =
        Number.isInteger(candidate) && candidate >= 0 && candidate <= 100
          ? candidate
          : 0;
    }
  return result;
}
export function recordAttempt(records, state) {
  const next = { ...records };
  if (state.practice) return next;
  const key = recordKey(state.level, state.mode);
  const percentage = Math.min(
    100,
    Math.floor(
      (state.distance /
        LEVELS.find((level) => level.id === state.level).finish) *
        100,
    ),
  );
  next[key] = Math.max(next[key] || 0, percentage);
  return next;
}
