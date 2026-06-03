import type { Weapon } from "../types";

export const weapons: Weapon[] = [
  {
    id: "short-bow",
    name: "Short Bow",
    classIds: ["stalker"],
    attack: "Guile",
    damage: "1d8",
    range: "Ranged",
    text: "Quiet ranged weapon. Best from cover, elevation, or concealment.",
  },
  {
    id: "hooked-knife",
    name: "Hooked Knife",
    classIds: ["stalker"],
    attack: "Guile",
    damage: "1d6",
    range: "Touch",
    text: "Close blade for climbing, dragging, cutting lines, and finishing ambushes.",
  },
  {
    id: "heavy-blade",
    name: "Heavy Blade",
    classIds: ["blade"],
    attack: "Might",
    damage: "1d10",
    range: "Touch",
    text: "Slow, direct, and brutal. Best when you hold ground or break a guard.",
  },
  {
    id: "shield-axe",
    name: "Shield Axe",
    classIds: ["blade"],
    attack: "Might",
    damage: "1d8",
    range: "Touch",
    text: "Balanced weapon and shield work. Good for protecting space while striking.",
  },
  {
    id: "sanctified-blade",
    name: "Sanctified Blade",
    classIds: ["saint"],
    attack: "Might or Will",
    damage: "1d8",
    range: "Touch",
    text: "A sworn weapon. Use Will when the strike clearly serves your oath.",
  },
  {
    id: "pilgrim-staff",
    name: "Pilgrim Staff",
    classIds: ["saint"],
    attack: "Might",
    damage: "1d6",
    range: "Touch",
    text: "Plain staff, brace, and walking weapon. Good for defense, leverage, and mercy.",
  },
  {
    id: "slim-blade",
    name: "Slim Blade",
    classIds: ["shade"],
    attack: "Guile",
    damage: "1d6",
    range: "Touch",
    text: "Hidden close weapon. Strongest when the target trusts, ignores, or misreads you.",
  },
  {
    id: "hand-crossbow",
    name: "Hand Crossbow",
    classIds: ["shade"],
    attack: "Guile",
    damage: "1d6",
    range: "Ranged",
    text: "Small ranged weapon for alleys, escapes, and shots from misdirection.",
  },
  {
    id: "claws-and-teeth",
    name: "Claws and Teeth",
    classIds: ["beast"],
    attack: "Might",
    damage: "1d8",
    range: "Touch",
    text: "Your body is the weapon. It cannot be disarmed while you can still move.",
  },
  {
    id: "hunting-knife",
    name: "Hunting Knife",
    classIds: ["beast"],
    attack: "Might or Guile",
    damage: "1d6",
    range: "Touch",
    text: "Rough utility blade. Useful when the beast has to pass as merely armed.",
  },
];

export function selectedWeapon(id: string) {
  return weapons.find((weapon) => weapon.id === id);
}

export function classWeapons(classId: string) {
  return weapons.filter((weapon) => weapon.classIds.includes(classId));
}
