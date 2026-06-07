import { useEffect, useMemo } from "react";
import type { CharacterState, ClassFeature, Power, Weapon } from "../types";
import { archetypes, movementBoxCount } from "../data/archetypes";
import { powers } from "../data/powers";
import { selectedWeapon } from "../data/weapons";
import { images } from "../data/images";
import { ClassShowcase } from "../components/ClassShowcase";
import { Track } from "../components/Track";
import { Icon } from "../components/Icon";
import { PowerToken } from "../components/PowerToken";
import { archetypeClassFeatures } from "../lib/classFeatures";
import type { FeedbackKind } from "../lib/feedback";

interface PlayViewProps {
  character: CharacterState;
  sceneUsedIds: string[];
  onFeedback: (kind: FeedbackKind) => void;
  onCharacter: (updates: Partial<CharacterState>) => void;
  onSceneUsedIds: (ids: string[]) => void;
  onBuild: () => void;
}

interface SceneUse {
  id: string;
  source: string;
  name: string;
  text: string;
}

interface AvailableAction extends SceneUse {
  timing: "major" | "minor";
  limited?: boolean;
}

const majorBoonIds = new Set(["commanding-voice", "dark-pact", "shadow-step", "second-skin"]);

function selectedPower(id: string) {
  return powers.find((power) => power.id === id);
}

function isOncePerScene(text: string) {
  return /\bonce per scene\b/i.test(text);
}

function limitedLabel(action: AvailableAction, usedIds: Set<string>) {
  if (!action.limited) return action.source;
  return usedIds.has(action.id) ? `${action.source} · Used` : `${action.source} · Ready`;
}

function PowerPanel({ label, power }: { label: "Boon" | "Bane"; power: Power | undefined }) {
  const isBane = label === "Bane";

  return (
    <article className={isBane ? "panel power-panel bane-panel" : "panel power-panel"}>
      <div className="panel__head">
        <div>
          <h2>{label}</h2>
          <p>{power?.summary || `Choose one in Build.`}</p>
        </div>
      </div>
      {power ? (
        <div className="play-power">
          <PowerToken power={power} />
          <div>
            <strong>{power.name}</strong>
            <p>{power.text}</p>
          </div>
        </div>
      ) : (
        <p>No {label} selected.</p>
      )}
    </article>
  );
}

function ClassFeaturesPanel({ features }: { features: ClassFeature[] }) {
  return (
    <article className="panel class-feature-panel">
      <div className="panel__head">
        <div>
          <h2>Class Features</h2>
          <p>{features.length ? `${features.length} class moves` : "No class selected."}</p>
        </div>
      </div>
      {features.length ? (
        <div className="feature-list">
          {features.map((feature) => (
            <article className="feature-item" key={feature.name}>
              <strong>{feature.name}</strong>
              <p>{feature.text}</p>
            </article>
          ))}
        </div>
      ) : (
        <p>No class features yet.</p>
      )}
    </article>
  );
}

function WeaponPanel({ weapon, isHex }: { weapon: Weapon | undefined; isHex: boolean }) {
  return (
    <article className="panel weapon-panel">
      <div className="panel__head">
        <div>
          <h2>{isHex ? "Spell Attack" : "Weapon"}</h2>
          <p>{isHex ? "Major action magic attack." : weapon ? `${weapon.range} · ${weapon.attack} · ${weapon.damage}` : "Choose one in Build."}</p>
        </div>
      </div>
      {isHex ? (
        <div className="weapon-readout">
          <strong>Spell Attack</strong>
          <p>Make a Will attack as magic: touch 1d10, ranged 1d8, or area 1d6 against each nearby target.</p>
        </div>
      ) : weapon ? (
        <div className="weapon-readout">
          <strong>{weapon.name}</strong>
          <p>{weapon.text}</p>
        </div>
      ) : (
        <p>No weapon selected.</p>
      )}
    </article>
  );
}

function AvailableActionsPanel({
  actions,
  usedIds,
  onToggle,
  onReset,
}: {
  actions: AvailableAction[];
  usedIds: Set<string>;
  onToggle: (id: string) => void;
  onReset: () => void;
}) {
  const majorActions = actions.filter((action) => action.timing === "major");
  const minorActions = actions.filter((action) => action.timing === "minor");
  const limitedActions = actions.filter((action) => action.limited);
  const readyCount = limitedActions.filter((action) => !usedIds.has(action.id)).length;

  function renderAction(action: AvailableAction) {
    const used = action.limited ? usedIds.has(action.id) : false;

    return (
      <article className={`available-action ${action.limited ? "is-limited" : ""} ${used ? "is-used" : ""}`} key={action.id}>
        {action.limited ? (
          <button
            type="button"
            className="available-action__marker"
            aria-pressed={used}
            aria-label={`${used ? "Mark ready" : "Mark used"}: ${action.name}`}
            data-feedback="manual"
            onClick={() => onToggle(action.id)}
          >
            {used ? <Icon name="check" /> : null}
          </button>
        ) : null}
        <div className="available-action__body">
          <div className="available-action__title">
            <span>{limitedLabel(action, usedIds)}</span>
            <strong>{action.name}</strong>
          </div>
          <p>{action.text}</p>
        </div>
      </article>
    );
  }

  return (
    <section className="panel actions-panel">
      <div className="panel__head">
        <div>
          <h2>Available Actions</h2>
          <p>{limitedActions.length ? `${readyCount}/${limitedActions.length} limited ready` : "Major and minor options"}</p>
        </div>
        <button type="button" className="scene-reset" onClick={onReset}>
          <Icon name="reload" /> Reset Scene
        </button>
      </div>
      <div className="available-actions">
        <div className="available-actions__group">
          <h3>Major Actions</h3>
          <div className="available-actions__list">{majorActions.map(renderAction)}</div>
        </div>
        <div className="available-actions__group">
          <h3>Minor Actions</h3>
          <div className="available-actions__list">{minorActions.map(renderAction)}</div>
        </div>
      </div>
    </section>
  );
}

export function PlayView({ character, sceneUsedIds, onFeedback, onCharacter, onSceneUsedIds, onBuild }: PlayViewProps) {
  const archetype = archetypes.find((entry) => entry.id === character.archetypeId);
  const hpMax = 10 + character.might;
  const defense = 10 + character.guile;
  const movementUnits = archetype?.movement.units ?? 30;
  const movementBoxes = movementBoxCount(movementUnits);
  const boon = selectedPower(character.boonId);
  const bane = selectedPower(character.baneId);
  const weapon = selectedWeapon(character.weaponId);
  const classFeatures = archetype ? archetypeClassFeatures(archetype) : [];
  const isHex = archetype?.id === "hex";
  const hasStarted = Boolean(character.name || character.archetypeId || character.boonId || character.baneId);
  const availableActions = useMemo(() => {
    const actions: AvailableAction[] = [];

    if (isHex) {
      actions.push({
        id: "major:spell-attack",
        source: "Attack",
        name: "Spell Attack",
        text: "Roll Will against Defense: touch 1d10, ranged 1d8, or area 1d6 against each nearby target.",
        timing: "major",
      });
    } else if (weapon) {
      actions.push({
        id: `major:weapon:${weapon.id}`,
        source: "Attack",
        name: weapon.name,
        text: `${weapon.attack} attack, ${weapon.range.toLowerCase()}, ${weapon.damage} damage. ${weapon.text}`,
        timing: "major",
      });
    } else {
      actions.push({
        id: "major:attack",
        source: "Attack",
        name: "Attack",
        text: "Choose a weapon in Build to show the attack stat, range, and damage here.",
        timing: "major",
      });
    }

    if (archetype?.talent && isOncePerScene(archetype.talent)) {
      const talent = archetypeClassFeatures(archetype)[0];
      actions.push({
        id: `talent:${archetype.id}`,
        source: "Class",
        name: talent.name,
        text: talent.text,
        timing: "major",
        limited: true,
      });
    }

    archetype?.classFeatures.forEach((feature) => {
      if (!isOncePerScene(feature.text)) return;
      actions.push({
        id: `class:${archetype.id}:${feature.name}`,
        source: "Class",
        name: feature.name,
        text: feature.text,
        timing: "major",
        limited: true,
      });
    });

    if (boon) {
      if (/as a minor action/i.test(boon.text)) {
        actions.push({
          id: `boon:${boon.id}`,
          source: "Boon",
          name: boon.name,
          text: boon.text,
          timing: "minor",
          limited: isOncePerScene(boon.text),
        });
      } else if (majorBoonIds.has(boon.id) || isOncePerScene(boon.text)) {
        actions.push({
          id: `boon:${boon.id}`,
          source: "Boon",
          name: boon.name,
          text: boon.text,
          timing: "major",
          limited: isOncePerScene(boon.text),
        });
      }
    }

    if (bane?.id === "sun-cursed") {
      actions.push({
        id: `bane:${bane.id}:cover`,
        source: "Bane",
        name: "Create Cover",
        text: "Create shade, cover, or sacrilege before acting in direct sunlight, sanctified glare, or exposed bright spaces.",
        timing: "minor",
      });
    }

    actions.push(
      {
        id: "major:dash",
        source: "Core",
        name: "Dash",
        text: `Gain another move up to ${movementUnits} units (${movementBoxes} ${movementBoxes === 1 ? "box" : "boxes"}) this turn.`,
        timing: "major",
      },
      {
        id: "major:maneuver",
        source: "Core",
        name: "Grapple, Disarm, or Help",
        text: "Roll with the stat that matches your approach to control, expose, protect, or create an opening.",
        timing: "major",
      },
      {
        id: "major:negotiate",
        source: "Core",
        name: "Negotiate Mid-Fight",
        text: "Make one concrete argument: offer, threat, lie, appeal, proof, or concession.",
        timing: "major",
      },
      {
        id: "minor:item",
        source: "Core",
        name: "Draw or Use an Item",
        text: "Draw gear, open a door, pull a lever, grab something nearby, or handle a simple object.",
        timing: "minor",
      },
      {
        id: "minor:position",
        source: "Core",
        name: "Take Cover or Mark",
        text: "Take cover, shout, signal, point out a target, or set up a nearby interaction.",
        timing: "minor",
      },
    );

    return actions;
  }, [archetype, bane, boon, isHex, movementBoxes, movementUnits, weapon]);
  const usedSceneIds = useMemo(() => new Set(sceneUsedIds), [sceneUsedIds]);

  useEffect(() => {
    const validIds = new Set(availableActions.filter((action) => action.limited).map((action) => action.id));
    const nextUsedIds = sceneUsedIds.filter((id) => validIds.has(id));
    if (nextUsedIds.length !== sceneUsedIds.length) {
      onSceneUsedIds(nextUsedIds);
    }
  }, [availableActions, onSceneUsedIds, sceneUsedIds]);

  function toggleSceneUse(id: string) {
    const next = new Set(sceneUsedIds);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    onSceneUsedIds([...next]);
    onFeedback("select");
  }

  function resetScene() {
    onSceneUsedIds([]);
    onFeedback("success");
  }

  if (!hasStarted) {
    return (
      <div className="view">
        <section className="empty-state">
          <img src={images.emptyCharacter} alt="" />
          <div>
            <h1>No Character Yet</h1>
            <p>Build one locally, then this screen becomes the table sheet.</p>
            <button type="button" className="primary-action" onClick={onBuild}>
              <Icon name="user" /> Start Character
            </button>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="view play-view">
      <section className="view-header compact">
        <div>
          <h1>{character.name || "Unnamed Bargainer"}</h1>
          <p>{archetype?.name || "No class"} · {character.drive || "No drive written yet"}</p>
        </div>
        <button type="button" onClick={onBuild}>
          <Icon name="user" /> Edit Character
        </button>
      </section>

      <ClassShowcase
        archetype={archetype}
        emptyDescription="Choose a class in Build to show movement, weapons or magic, class features, and the class image."
      />

      <section className="play-grid">
        <div className="panel">
          <div className="panel__head">
            <div>
              <h2>Vitals</h2>
              <p>Defense <span className="numeric">{defense}</span> · Move <span className="numeric">{movementUnits}</span></p>
            </div>
          </div>
          <Track label="HP" value={character.hp} max={hpMax} onFeedback={onFeedback} onChange={(hp) => onCharacter({ hp })} />
          <div className="derived-row">
            <span>Might <strong className="numeric">{character.might >= 0 ? `+${character.might}` : character.might}</strong></span>
            <span>Guile <strong className="numeric">{character.guile >= 0 ? `+${character.guile}` : character.guile}</strong></span>
            <span>Will <strong className="numeric">{character.will >= 0 ? `+${character.will}` : character.will}</strong></span>
            <span>Move <strong className="numeric">{movementUnits}</strong> units</span>
            <span>Grid <strong className="numeric">{movementBoxes}</strong> boxes</span>
          </div>
          {archetype ? <p className="movement-note">{archetype.movement.feature}</p> : null}
        </div>
        <AvailableActionsPanel actions={availableActions} usedIds={usedSceneIds} onToggle={toggleSceneUse} onReset={resetScene} />
      </section>

      <section className="power-grid">
        <ClassFeaturesPanel features={classFeatures} />
        <WeaponPanel weapon={weapon} isHex={isHex} />
        <PowerPanel label="Boon" power={boon} />
        <PowerPanel label="Bane" power={bane} />
      </section>

      <section className="panel">
        <div className="panel__head">
          <div>
            <h2>Notes</h2>
            <p>Bargain, bonds, gear, and table changes.</p>
          </div>
        </div>
        <div className="field-grid">
          <label className="field" htmlFor="play-notes">
            <span>Notes</span>
            <textarea id="play-notes" value={character.notes} onChange={(event) => onCharacter({ notes: event.target.value })} />
          </label>
          <div className="note-stack">
            <p><strong>Bargain:</strong> {character.bargain || "Not written."}</p>
            <p><strong>Bonds:</strong> {character.bonds || "Not written."}</p>
            <p><strong>Gear:</strong> {character.gear || "Not written."}</p>
          </div>
        </div>
      </section>
    </div>
  );
}
