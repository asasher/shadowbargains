import type { Archetype } from "../types";
import { images } from "./images";

export const archetypes: Archetype[] = [
  {
    id: "stalker",
    name: "Stalker",
    role: "Mobility, ambush, tracking, and controlling distance.",
    requiredStat: "guile",
    movement: {
      units: 35,
      feature: "Ghost the Distance lets you ignore extra movement costs from climbing, leaping, and dangerous ground this turn.",
    },
    talent:
      "Marked Quarry: once per scene, name one target. Until the scene ends, track them perfectly and add +1d6 to your first hit from concealment.",
    classFeatures: [
      {
        name: "Vanish",
        text: "Once per scene, disappear into cover, smoke, crowd, foliage, or darkness even while watched.",
      },
    ],
    gear: "Short bow, hooked knife, dark cloak, trap wire, trail token.",
    weaponIds: ["short-bow", "hooked-knife"],
    boonIds: ["predators-grace", "blood-sense", "shadow-step", "killing-focus"],
    baneIds: ["haunted", "hunger", "monstrous-tell", "sun-cursed"],
    questions: ["What quarry escaped you?", "What place can you navigate blind?", "Who taught you to wait?"],
    image: images.archetypes.stalker,
  },
  {
    id: "blade",
    name: "Blade",
    role: "Armor, weapons, intimidation, and direct violence.",
    requiredStat: "might",
    movement: {
      units: 25,
      feature: "Hold Center lets you move 10 units or less and resist being pushed, pulled, or forced aside until your next turn.",
    },
    talent:
      "Punishing Strike: once per fight, after you hit, add +1d8 damage or knock the target down.",
    classFeatures: [
      {
        name: "Interpose",
        text: "When a nearby ally would take damage, move to them and reduce that damage by 1d6.",
      },
    ],
    gear: "Heavy blade, battered armor, shield charm, old uniform mark.",
    weaponIds: ["heavy-blade", "shield-axe"],
    boonIds: ["iron-flesh", "commanding-voice", "killing-focus", "oath-shield"],
    baneIds: ["oathbound", "pride", "blood-price", "debt"],
    questions: ["Who did you fail to protect?", "What weapon has a name?", "Who wants proof you can bleed?"],
    image: images.archetypes.blade,
  },
  {
    id: "hex",
    name: "Hex",
    role: "Curses, blood magic, forbidden knowledge, and occult leverage.",
    requiredStat: "will",
    movement: {
      units: 30,
      feature: "Forbidden Working lets you step 5 units through a ward, circle, or shadow touched by your magic after the working.",
    },
    talent:
      "Spell Attack: Hex does not use weapon attacks. As a major action, make a Will attack as magic: touch 1d10, ranged 1d8, or area 1d6 against each nearby target.",
    classFeatures: [
      {
        name: "Improvised Magic",
        text: "Once per scene, burn a meaningful object to create a magical effect. Say what you consume and what you want; the GM decides how the material shapes the result and what cost or instability follows.",
      },
    ],
    gear: "Bone stylus, black salt, blood cup, torn grimoire, marked candle.",
    weaponIds: [],
    boonIds: ["dark-pact", "grave-whisper", "blood-sense", "relic-hand"],
    baneIds: ["hunger", "true-name", "monstrous-tell", "silver-scar"],
    questions: ["What rule did you break?", "What answered first?", "Which name must you never say?"],
    image: images.archetypes.hex,
  },
  {
    id: "saint",
    name: "Saint",
    role: "Healing, protection, oaths, and moral pressure.",
    requiredStat: "will",
    movement: {
      units: 30,
      feature: "Oath Light lets you move 10 units toward an ally before or after you heal, shield, or bolster them.",
    },
    talent:
      "Lay on Hands: once per scene, restore 1d6 + Will HP or clear fear, charm, or panic from someone you touch.",
    classFeatures: [
      {
        name: "Judgment",
        text: "When you hit a foe who harmed the helpless, add +1d6 damage or force them back.",
      },
    ],
    gear: "Oath cord, sanctified blade, healer kit, relic fragment, plain cloak.",
    weaponIds: ["sanctified-blade", "pilgrim-staff"],
    boonIds: ["oath-shield", "commanding-voice", "iron-flesh", "terrible-beauty"],
    baneIds: ["oathbound", "mercy", "sun-cursed", "debt"],
    questions: ["What oath saved you?", "Who calls you a hypocrite?", "What mercy still haunts you?"],
    image: images.archetypes.saint,
  },
  {
    id: "shade",
    name: "Shade",
    role: "Stealth, lies, contacts, theft, and social misdirection.",
    requiredStat: "guile",
    movement: {
      units: 35,
      feature: "Underworld Face lets you move through narrow routes, crowds, or occupied boxes without extra cost when your declared route fits.",
    },
    talent:
      "False Face: once per scene, declare a fake identity, contact, document, or underworld custom that gets you access.",
    classFeatures: [
      {
        name: "Knife in the Moment",
        text: "When a target trusts, ignores, or underestimates you, your first hit against them adds +1d6 damage.",
      },
    ],
    gear: "Lock picks, false papers, reversible coat, coded token, slim blade.",
    weaponIds: ["slim-blade", "hand-crossbow"],
    boonIds: ["predators-grace", "terrible-beauty", "shadow-step", "relic-hand"],
    baneIds: ["debt", "invitation", "monstrous-tell", "true-name"],
    questions: ["Who bought your loyalty?", "What identity feels real?", "What door is still closed to you?"],
    image: images.archetypes.shade,
  },
  {
    id: "beast",
    name: "Beast",
    role: "Claws, rage, senses, pursuit, and terrifying presence.",
    requiredStat: "might",
    movement: {
      units: 40,
      feature: "Let It Out lets you climb or leap at full movement while chasing, mauling, or terrifying prey.",
    },
    talent:
      "Rend: your body counts as a weapon. Unarmed attacks deal 1d8, or 1d10 when you fully transform.",
    classFeatures: [
      {
        name: "Blood Rush",
        text: "Once per scene, move your full movement and attack. Afterward, roll Will 13 or your Bane stirs.",
      },
    ],
    gear: "Ragged trophy, iron collar, hunting knife, torn cloak, bone charm.",
    weaponIds: ["claws-and-teeth", "hunting-knife"],
    boonIds: ["blood-sense", "predators-grace", "iron-flesh", "terrible-beauty"],
    baneIds: ["hunger", "monstrous-tell", "silver-scar", "mercy"],
    questions: ["What do you become when angry?", "Who saw the first change?", "What scent can you never ignore?"],
    image: images.archetypes.beast,
  },
];

export function archetypeName(id: string) {
  return archetypes.find((archetype) => archetype.id === id)?.name ?? "";
}

export function movementBoxCount(units: number) {
  return Math.floor(units / 5);
}

export function movementSummary(archetype: Pick<Archetype, "movement">) {
  const boxes = movementBoxCount(archetype.movement.units);
  return `${archetype.movement.units} units (${boxes} ${boxes === 1 ? "box" : "boxes"})`;
}
