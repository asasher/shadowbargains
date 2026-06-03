import type { StatKey } from "../types";

export const STAT_KEYS = ["might", "guile", "will"] as const satisfies readonly StatKey[];

export type StatSpread = Record<StatKey, number>;

export const STAT_TOTAL = 3;
export const STAT_MIN = -2;
export const STAT_MAX = 3;

export function clampStat(value: unknown) {
  const number = Number(value);
  if (!Number.isFinite(number)) return 0;
  return Math.min(STAT_MAX, Math.max(STAT_MIN, Math.trunc(number)));
}

export function formatStat(value: unknown) {
  const clamped = clampStat(value);
  return clamped > 0 ? `+${clamped}` : String(clamped);
}

export function statTotal(stats: StatSpread) {
  return STAT_KEYS.reduce((total, key) => total + clampStat(stats[key]), 0);
}

export function isValidStatSpread(stats: StatSpread) {
  return statTotal(stats) === STAT_TOTAL;
}

export function normalizeStatSpread(stats: StatSpread): StatSpread {
  return {
    might: clampStat(stats.might),
    guile: clampStat(stats.guile),
    will: clampStat(stats.will),
  };
}

export function applyStatChange(stats: StatSpread, stat: StatKey, value: number): StatSpread {
  const current = normalizeStatSpread(stats);
  const nextValue = clampStat(value);

  return {
    ...current,
    [stat]: nextValue,
  };
}
