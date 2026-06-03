import type { StatKey } from "../types";

export const STAT_KEYS = ["might", "guile", "will"] as const satisfies readonly StatKey[];

export type StatSpread = Record<StatKey, number>;
export type StatMinimums = Partial<Record<StatKey, number>>;

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

function statMinimum(stat: StatKey, minimums: StatMinimums) {
  if (minimums[stat] === undefined) return STAT_MIN;
  return clampStat(minimums[stat]);
}

export function requiredStatMinimums(requiredStat: StatKey | undefined): StatMinimums {
  return requiredStat ? { [requiredStat]: 1 } : {};
}

export function isValidStatSpread(stats: StatSpread, minimums: StatMinimums = {}) {
  return STAT_KEYS.every((key) => {
    const value = Number(stats[key]);
    return Number.isFinite(value) && Math.trunc(value) === value && value >= statMinimum(key, minimums) && value <= STAT_MAX;
  }) && statTotal(stats) <= STAT_TOTAL;
}

export function normalizeStatSpread(stats: StatSpread, minimums: StatMinimums = {}): StatSpread {
  const next = {
    might: Math.max(statMinimum("might", minimums), clampStat(stats.might)),
    guile: Math.max(statMinimum("guile", minimums), clampStat(stats.guile)),
    will: Math.max(statMinimum("will", minimums), clampStat(stats.will)),
  };
  let overflow = statTotal(next) - STAT_TOTAL;

  for (const key of [...STAT_KEYS].reverse()) {
    if (overflow <= 0) break;
    const reduction = Math.min(next[key] - statMinimum(key, minimums), overflow);
    next[key] -= reduction;
    overflow -= reduction;
  }

  return next;
}

export function applyStatChange(stats: StatSpread, stat: StatKey, value: number, minimums: StatMinimums = {}): StatSpread {
  const current = normalizeStatSpread(stats, minimums);
  const minimum = statMinimum(stat, minimums);
  const otherTotal = STAT_KEYS.reduce((total, key) => key === stat ? total : total + current[key], 0);
  const budgetMax = Math.min(STAT_MAX, Math.max(minimum, STAT_TOTAL - otherTotal));
  const nextValue = Math.max(minimum, Math.min(clampStat(value), budgetMax));

  return {
    ...current,
    [stat]: nextValue,
  };
}
