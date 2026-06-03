import { archetypes } from "../data/archetypes";
import { selectedWeapon } from "../data/weapons";
import type { CharacterState, Weapon } from "../types";
import { isValidStatSpread } from "./stats";

export function isCharacterReadyForPlay(character: CharacterState) {
  const archetype = archetypes.find((entry) => entry.id === character.archetypeId);
  if (!archetype) return false;
  if (!isValidStatSpread(character)) return false;
  if (character[archetype.requiredStat] < 1) return false;

  const availableWeapons = archetype.weaponIds
    .map((id) => selectedWeapon(id))
    .filter((weapon): weapon is Weapon => Boolean(weapon));

  const selectedWeaponAvailable = !availableWeapons.length || availableWeapons.some((weapon) => weapon.id === character.weaponId);
  const selectedBoonAvailable = archetype.boonIds.includes(character.boonId);
  const selectedBaneAvailable = archetype.baneIds.includes(character.baneId);

  return selectedWeaponAvailable && selectedBoonAvailable && selectedBaneAvailable;
}
