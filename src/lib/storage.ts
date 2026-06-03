import type { AppState, CharacterState, DmTrackerState, RollResult } from "../types";
import { archetypes } from "../data/archetypes";
import { normalizeStatSpread, requiredStatMinimums } from "./stats";

export const STORAGE_KEY = "shadow-bargains:v1";

export const defaultCharacter: CharacterState = {
  name: "",
  look: "",
  drive: "",
  archetypeId: "",
  might: 2,
  guile: 1,
  will: 0,
  boonId: "",
  baneId: "",
  weaponId: "",
  hp: 12,
  gear: "",
  bargain: "",
  bonds: "",
  notes: "",
};

export const defaultDm: DmTrackerState = {
  name: "Candle-Jaw Bailiff",
  role: "Bossy enforcer with a contract and a melting temper.",
  hp: 12,
  hpMax: 12,
  defense: 12,
  combatGoal: "Subdue the debtor and drag them to the market scales.",
  attack: "Lantern hook, Will or Might vs Defense",
  damage: "1d8",
  special: "Marks a debt. The next failed roll gives it leverage.",
  status: "",
  interest: 2,
  patience: 3,
  socialGoal: "Get the debt paid without looking weak.",
  motivationOne: "Collect what is owed.",
  motivationTwo: "Keep the market afraid.",
  pitfall: "Being mocked as a servant.",
  leverage: "It respects proof of a stronger bargain.",
  notes: "",
};

export const defaultState: AppState = {
  view: "home",
  soundEnabled: true,
  hapticsEnabled: true,
  savedAt: "",
  lastRoll: null,
  sceneUsedIds: [],
  character: defaultCharacter,
  dm: defaultDm,
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function mergeRecord<T extends Record<string, unknown>>(base: T, value: unknown): T {
  if (!isRecord(value)) return base;
  return Object.entries(base).reduce((next, [key, defaultValue]) => {
    const incoming = value[key];
    if (isRecord(defaultValue)) {
      return { ...next, [key]: mergeRecord(defaultValue, incoming) };
    }
    return { ...next, [key]: incoming ?? defaultValue };
  }, { ...base });
}

function clampInteger(value: unknown, min: number, max: number) {
  const number = Number(value);
  if (!Number.isFinite(number)) return min;
  return Math.min(max, Math.max(min, Math.trunc(number)));
}

function normalizeCharacter(character: CharacterState): CharacterState {
  const archetype = archetypes.find((entry) => entry.id === character.archetypeId);
  const { might, guile, will } = normalizeStatSpread(character, requiredStatMinimums(archetype?.requiredStat));
  const hpMax = 10 + might;

  return {
    ...character,
    might,
    guile,
    will,
    hp: clampInteger(character.hp, 0, hpMax),
  };
}

function normalizeDm(dm: DmTrackerState): DmTrackerState {
  const hpMax = clampInteger(dm.hpMax, 1, 40);

  return {
    ...dm,
    hpMax,
    hp: clampInteger(dm.hp, 0, hpMax),
    defense: clampInteger(dm.defense, 1, 30),
    interest: clampInteger(dm.interest, 0, 5),
    patience: clampInteger(dm.patience, 0, 5),
  };
}

function normalizeRoll(roll: AppState["lastRoll"]): AppState["lastRoll"] {
  if (!roll) return null;
  const legacyMode = roll.mode as RollResult["mode"] | "boon" | "bane";
  const mode = legacyMode === "boon" ? "advantage" : legacyMode === "bane" ? "disadvantage" : legacyMode;
  if (mode !== "normal" && mode !== "advantage" && mode !== "disadvantage") return null;

  return {
    ...roll,
    mode,
  };
}

function normalizeStringList(value: unknown) {
  if (!Array.isArray(value)) return [];
  return value.filter((entry): entry is string => typeof entry === "string");
}

function normalizeState(state: AppState): AppState {
  return {
    ...state,
    lastRoll: normalizeRoll(state.lastRoll),
    sceneUsedIds: normalizeStringList(state.sceneUsedIds),
    character: normalizeCharacter(state.character),
    dm: normalizeDm(state.dm),
  };
}

export function loadState(): AppState {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultState;
    return normalizeState(mergeRecord(defaultState as unknown as Record<string, unknown>, JSON.parse(raw)) as unknown as AppState);
  } catch {
    return defaultState;
  }
}

export function saveState(state: AppState) {
  const savedAt = new Date().toISOString();
  const next = { ...normalizeState(state), savedAt };
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  return next;
}

export function clearStoredState() {
  window.localStorage.removeItem(STORAGE_KEY);
}
