import type { ReferenceSection, RuleCard, RuleTable } from "../types";
import { archetypes, movementSummary } from "./archetypes";
import { STAT_MAX, STAT_MIN, STAT_TOTAL } from "../lib/stats";

export const quickReferenceCards: RuleCard[] = [
  {
    title: "Core roll",
    kind: "rule",
    text: "Roll d20 + Might, Guile, or Will. Meet or beat the target number.",
  },
  {
    title: "Difficulty targets",
    kind: "rule",
    text: "Use 10, 13, 16, and 20. Standard risky action is 13.",
  },
  {
    title: "Advantage and Disadvantage",
    kind: "rule",
    text: "Advantage rolls two d20s and keeps the higher. Disadvantage keeps the lower. They cancel one for one.",
  },
  {
    title: "HP and Defense",
    kind: "combat",
    text: "Starting HP is 10 + Might. Defense is 10 + Guile.",
  },
  {
    title: "Turn and movement",
    kind: "combat",
    text: "On your turn, take one major action, one minor action, and spend movement up to your class movement.",
  },
  {
    title: "Grid movement",
    kind: "combat",
    text: "The grid works like 5e without feet: one box costs 5 movement units, so 30 units moves 6 boxes.",
  },
  {
    title: "Social exit",
    kind: "negotiation",
    text: "Each major argument changes Interest or Patience. Motivations help, leverage opens doors, pitfalls backfire.",
  },
];

export const difficultyTable: RuleTable = {
  title: "Difficulties",
  note: "Use these instead of long skill lists.",
  columns: ["Difficulty", "Target", "Example"],
  kind: "rule",
  rows: [
    ["Easy under pressure", "10", "A capable person can do it, but failure would matter."],
    ["Standard", "13", "The normal target for risky action."],
    ["Hard", "16", "The situation favors the opposition."],
    ["Extreme", "20", "Only leverage, luck, or supernatural help makes it plausible."],
  ],
};

export const statTable: RuleTable = {
  title: "Stats",
  note: "No skill list. Pick the stat that fits the approach.",
  columns: ["Stat", "Use it for", "Examples"],
  kind: "reference",
  rows: [
    ["Might", "Force, endurance, violence, armor, raw presence.", "Break a door, hold a line, swing heavy steel, resist poison."],
    ["Guile", "Stealth, speed, precision, lies, tricks, dirty work.", "Pick a lock, shoot, vanish, disguise yourself, stab from shadow."],
    ["Will", "Magic, faith, fear, command, negotiation, resisting control.", "Cast a curse, appeal to honor, resist hunger, force attention."],
  ],
};

export const statBudgetTable: RuleTable = {
  title: "Stat Budget",
  note: "The builder keeps stats inside the budget while editing.",
  columns: ["Rule", "Value"],
  kind: "reference",
  rows: [
    ["Total", `Up to ${STAT_TOTAL} points across Might, Guile, and Will.`],
    ["Range", `Each stat can be ${STAT_MIN} to +${STAT_MAX}.`],
    ["Class requirement", "Your chosen class's required stat must be +1 or better."],
  ],
};

export const attackTable: RuleTable = {
  title: "Attack and Damage",
  note: "Roll fast, resolve cleanly.",
  columns: ["Rule", "Use"],
  kind: "combat",
  rows: [
    ["Attack", "Roll d20 + Might, Guile, or Will against Defense. Use the stat that matches the attack."],
    ["Defense", "Default Defense is 10 + Guile. Armor, cover, or a class feature can raise it."],
    ["Light weapon or weak power", "1d6 damage."],
    ["Weapon or standard power", "1d8 damage."],
    ["Heavy weapon or dangerous power", "1d10 damage."],
    ["Critical hit", "Add another damage die."],
    ["Enemy HP", "Use 4 for fragile, 8 for standard, 12 for dangerous, and 20 for a boss."],
  ],
};

export const movementTable: RuleTable = {
  title: "Movement and Grid",
  note: "Same table grid as 5e, without feet.",
  columns: ["Rule", "Use"],
  kind: "combat",
  rows: [
    ["Movement", "Each class lists movement in units. Spend up to that many units on your turn. You can split movement before, between, or after actions."],
    ["Grid boxes", "One grid box costs 5 movement units. A 30-unit move covers 6 boxes."],
    ["Diagonal boxes", "Use the same diagonal rule your table uses in 5e: either 5 units per diagonal box, or alternating 5 and 10 units."],
    ["Difficult ground", "Entering a difficult box costs 10 units unless a class feature, Boon, or scene detail says otherwise."],
    ["Dash", "Use your major action to gain another move up to your movement this turn."],
    ["Blocked movement", "Allies do not block movement. Moving through or out of an enemy's control may require a Might or Guile roll if they can stop you."],
  ],
};

export const archetypeMovementTable: RuleTable = {
  title: "Class Movement",
  note: "Feature movement is the class's special exception to the normal grid rules.",
  columns: ["Class", "Movement", "Feature movement"],
  kind: "combat",
  rows: archetypes.map((archetype) => [archetype.name, movementSummary(archetype), archetype.movement.feature]),
};

export const argumentTable: RuleTable = {
  title: "Argument Roll",
  note: "Roll when a player makes a concrete offer, threat, lie, appeal, or proof.",
  columns: ["Roll", "Track change", "GM move"],
  kind: "negotiation",
  rows: [
    ["20+", "Interest +2.", "They lean in. Reveal what would seal the deal, lower a price, or give more than asked."],
    ["15 to 19", "Interest +1.", "They shift toward yes, but still want proof, payment, safety, or status."],
    ["10 to 14", "Interest +1, Patience -1.", "The point lands, but the ask costs time, trust, face, or bargaining room."],
    ["2 to 9", "Patience -1.", "They refuse the point. Make a counter-demand, warning, insult, or visible escalation."],
    ["1", "Interest -1, Patience -1.", "The ask backfires. They question the speaker's motive, harden their price, or reach for force."],
    ["Pitfall", "Interest -1, Patience -1.", "If the argument is built on the NPC's red line, skip the roll unless the player immediately repairs it."],
  ],
};

export const negotiationRunSteps = [
  "Frame the stakes: what the characters want, what the NPC can give, and what happens if the talk fails.",
  "Set Interest from 1 to 4 and Patience from 2 to 5. Write two Motivations, one Pitfall, and one piece of Leverage.",
  "For each exchange, a player makes one concrete argument: offer, threat, lie, appeal, proof, or concession.",
  "Pick the stat from the approach: Will for command or sincerity, Guile for deception or tradecraft, Might for intimidation or visible force.",
  "Check the hook. Motivation grants Advantage. Leverage permits a harder ask and can be spent for extra progress. Pitfall can backfire before the dice.",
  "Roll, move the tracks, then say what visibly changes. Stop at Interest 5, Patience 0, or when the table chooses violence.",
];

export const negotiationHookCards: RuleCard[] = [
  {
    title: "Motivation",
    kind: "negotiation",
    text: "A thing the NPC already wants: honor, payment, revenge, safety, secrecy, authority. If the argument honestly serves it, roll with Advantage.",
  },
  {
    title: "Leverage",
    kind: "negotiation",
    text: "Concrete pressure or proof: a debt, hostage, secret, bribe, warrant, relic, or concession. It makes an impossible ask rollable. If spent before the roll, any hit gains +1 Interest.",
  },
  {
    title: "Pitfall",
    kind: "negotiation",
    text: "A red line that makes the NPC shut down: disrespect, cowardice, betrayal, public shame, wasted time. If the argument centers it, apply the Pitfall result instead of rolling.",
  },
  {
    title: "Repair",
    kind: "negotiation",
    text: "After a Pitfall, the next exchange must apologize, pay, concede, flatter, or change the subject. On a hit, restore 1 Patience instead of gaining Interest.",
  },
];

export const negotiationEndTable: RuleTable = {
  title: "End States",
  note: "The tracks do not force a single outcome. They tell the GM when the scene changes state.",
  columns: ["Trigger", "Result"],
  kind: "negotiation",
  rows: [
    ["Interest reaches 5", "They agree, stand down, give a strong concession, reveal the price of yes, or switch sides if the fiction supports it."],
    ["Patience reaches 0", "They make a final demand, leave, attack, call help, expose the characters, or demand immediate payment."],
    ["Both would trigger", "Offer a hard bargain: get the yes with a sharp cost, or avoid the cost and lose the deal."],
    ["Violence starts", "Keep the social exit visible. A later argument can still move Interest or Patience if someone creates room to speak."],
  ],
};

export const creationSteps = [
  "Name, Look, Drive: write who they are, what people notice first, and what they want badly enough to bargain for.",
  `Assign stats: spend up to ${STAT_TOTAL} points across Might, Guile, and Will. Each stat can be ${STAT_MIN} to +${STAT_MAX}.`,
  "Choose one class: Stalker, Blade, Hex, Saint, Shade, or Beast. It requires +1 or better in its key stat.",
  "Choose one weapon from your class list. Hex uses Spell Attack instead of weapon attacks.",
  "Choose one Boon from the Boons available to your class.",
  "Choose one Bane from the Banes available to your class.",
  "Calculate combat numbers: HP is 10 + Might. Defense is 10 + Guile. Movement comes from your class.",
  "Pick gear: one useful tool, one personal keepsake, and one sign of the bargain.",
  "Write the bargain: what did you ask for, what answered, what did it take, and who knows?",
  "Create bonds: one reason you trust another character and one reason you should not.",
];

export const referenceSections: ReferenceSection[] = [
  {
    id: "quick",
    title: "Quick Reference",
    summary: "The table version of the rules.",
    cards: quickReferenceCards,
    table: difficultyTable,
  },
  {
    id: "stats",
    title: "Stats",
    summary: "Three stats cover the whole character.",
    table: statTable,
    tables: [statBudgetTable],
  },
  {
    id: "creation",
    title: "Character Creation",
    summary: "Build a complete one-shot character in about 10 minutes.",
    bullets: creationSteps,
  },
  {
    id: "combat",
    title: "Combat",
    summary: "One major action, one minor action, class movement, simple HP, and clear damage dice.",
    table: attackTable,
    tables: [movementTable, archetypeMovementTable],
    cards: [
      {
        title: "Major action",
        kind: "combat",
        text: "Attack, cast, use a class feature or power, grapple, disarm, help, dash, or negotiate mid-fight.",
      },
      {
        title: "Minor action",
        kind: "combat",
        text: "Draw an item, shout, mark a target, open a door, take cover, or interact with something nearby.",
      },
    ],
  },
  {
    id: "negotiation",
    title: "Negotiation",
    summary: "Important social scenes get structure without replacing roleplay.",
    bullets: negotiationRunSteps,
    cards: [
      {
        title: "Write the NPC",
        kind: "negotiation",
        text: "Interest 1 to 4, Patience 2 to 5, two Motivations, one Pitfall, and one piece of leverage.",
      },
      ...negotiationHookCards,
      {
        title: "Vampire knight example",
        kind: "negotiation",
        text: "Goal: convince him his sire betrayed him. Motivations: honor and revenge. Leverage: the sire's signet. Pitfall: calling him a coward. Interest 2, Patience 3.",
      },
    ],
    table: argumentTable,
    tables: [negotiationEndTable],
  },
];
