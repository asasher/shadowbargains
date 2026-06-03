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
  return STAT_KEYS.every((key) => {
    const value = Number(stats[key]);
    return Number.isFinite(value) && Math.trunc(value) === value && value >= STAT_MIN && value <= STAT_MAX;
  }) && statTotal(stats) <= STAT_TOTAL;
}

export function normalizeStatSpread(stats: StatSpread): StatSpread {
  const next = {
    might: clampStat(stats.might),
    guile: clampStat(stats.guile),
    will: clampStat(stats.will),
  };
  let overflow = statTotal(next) - STAT_TOTAL;

  for (const key of [...STAT_KEYS].reverse()) {
    if (overflow <= 0) break;
    const reduction = Math.min(next[key] - STAT_MIN, overflow);
    next[key] -= reduction;
    overflow -= reduction;
  }

  return next;
}

export function applyStatChange(stats: StatSpread, stat: StatKey, value: number): StatSpread {
  const current = normalizeStatSpread(stats);
  const otherTotal = STAT_KEYS.reduce((total, key) => key === stat ? total : total + current[key], 0);
  const budgetMax = Math.min(STAT_MAX, Math.max(STAT_MIN, STAT_TOTAL - otherTotal));
  const nextValue = Math.min(clampStat(value), budgetMax);

  return {
    ...current,
    [stat]: nextValue,
  };
}
