export type ViewId = "home" | "build" | "play" | "dm" | "reference" | "settings";

export type StatKey = "might" | "guile" | "will";

export type PowerKind = "boon" | "bane";

export interface ClassFeature {
  name: string;
  text: string;
}

export interface Archetype {
  id: string;
  name: string;
  role: string;
  requiredStat: StatKey;
  movement: {
    units: number;
    feature: string;
  };
  talent: string;
  classFeatures: ClassFeature[];
  gear: string;
  weaponIds: string[];
  boonIds: string[];
  baneIds: string[];
  questions: string[];
  image: string;
}

export interface Power {
  id: string;
  kind: PowerKind;
  name: string;
  summary: string;
  text: string;
  token: {
    col: number;
    row: number;
  };
}

export interface Weapon {
  id: string;
  name: string;
  classIds: string[];
  attack: string;
  damage: string;
  range: string;
  text: string;
}

export interface RuleCard {
  title: string;
  text: string;
  kind: string;
}

export interface RuleTable {
  title: string;
  note?: string;
  columns: string[];
  rows: string[][];
  kind: string;
}

export interface ReferenceSection {
  id: string;
  title: string;
  summary: string;
  cards?: RuleCard[];
  table?: RuleTable;
  tables?: RuleTable[];
  bullets?: string[];
}

export interface RollResult {
  stat: StatKey;
  dice: number[];
  kept: number;
  modifier: number;
  total: number;
  mode: "normal" | "advantage" | "disadvantage";
  createdAt: string;
}

export interface CharacterState {
  name: string;
  look: string;
  drive: string;
  archetypeId: string;
  might: number;
  guile: number;
  will: number;
  boonId: string;
  baneId: string;
  weaponId: string;
  hp: number;
  gear: string;
  bargain: string;
  bonds: string;
  notes: string;
}

export interface DmTrackerState {
  name: string;
  role: string;
  hp: number;
  hpMax: number;
  defense: number;
  combatGoal: string;
  attack: string;
  damage: string;
  special: string;
  status: string;
  interest: number;
  patience: number;
  socialGoal: string;
  motivationOne: string;
  motivationTwo: string;
  pitfall: string;
  leverage: string;
  notes: string;
}

export interface AppState {
  view: ViewId;
  soundEnabled: boolean;
  hapticsEnabled: boolean;
  savedAt: string;
  lastRoll: RollResult | null;
  sceneUsedIds: string[];
  character: CharacterState;
  dm: DmTrackerState;
}
