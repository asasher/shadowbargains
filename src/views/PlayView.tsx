import { useEffect, useMemo } from "react";
import type { CharacterState, ClassFeature, Power, Weapon } from "../types";
import { archetypes, movementBoxCount } from "../data/archetypes";
import { powers } from "../data/powers";
import { selectedWeapon } from "../data/weapons";
import { images } from "../data/images";
import { Track } from "../components/Track";
import { Icon } from "../components/Icon";
import { PowerToken } from "../components/PowerToken";
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

function selectedPower(id: string) {
  return powers.find((power) => power.id === id);
}

function isOncePerScene(text: string) {
  return /\bonce per scene\b/i.test(text);
}

function talentNameAndText(talent: string) {
  const separator = talent.indexOf(":");
  if (separator === -1) return { name: "Class Feature", text: talent };
  return {
    name: talent.slice(0, separator).trim(),
    text: talent.slice(separator + 1).trim(),
  };
}

function talentFeature(talent: string): ClassFeature {
  const talentParts = talentNameAndText(talent);
  return { name: talentParts.name, text: talentParts.text };
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

function SceneUsesPanel({
  items,
  usedIds,
  onToggle,
  onReset,
}: {
  items: SceneUse[];
  usedIds: Set<string>;
  onToggle: (id: string) => void;
  onReset: () => void;
}) {
  const readyCount = items.filter((item) => !usedIds.has(item.id)).length;

  return (
    <section className="panel scene-panel">
      <div className="panel__head">
        <div>
          <h2>Scene Uses</h2>
          <p>{items.length ? `${readyCount}/${items.length} ready` : "No once-per-scene picks."}</p>
        </div>
        <button type="button" className="scene-reset" onClick={onReset}>
          <Icon name="reload" /> Reset Scene
        </button>
      </div>
      {items.length ? (
        <div className="scene-list">
          {items.map((item) => {
            const used = usedIds.has(item.id);
            return (
              <article className={`scene-use ${used ? "is-used" : ""}`} key={item.id}>
                <button
                  type="button"
                  className="scene-use__marker"
                  aria-pressed={used}
                  aria-label={`${used ? "Mark ready" : "Mark used"}: ${item.name}`}
                  data-feedback="manual"
                  onClick={() => onToggle(item.id)}
                >
                  {used ? <Icon name="check" /> : null}
                </button>
                <div className="scene-use__body">
                  <div className="scene-use__title">
                    <span>{item.source}</span>
                    <strong>{item.name}</strong>
                  </div>
                  <p>{item.text}</p>
                </div>
              </article>
            );
          })}
        </div>
      ) : (
        <p className="scene-empty">Choose a once-per-scene class feature or Boon in Build to track it here.</p>
      )}
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
  const classFeatures = archetype ? [talentFeature(archetype.talent), ...archetype.classFeatures] : [];
  const isHex = archetype?.id === "hex";
  const hasStarted = Boolean(character.name || character.archetypeId || character.boonId || character.baneId);
  const sceneUses = useMemo(() => {
    const items: SceneUse[] = [];

    if (archetype?.talent && isOncePerScene(archetype.talent)) {
      const talent = talentFeature(archetype.talent);
      items.push({
        id: `talent:${archetype.id}`,
        source: "Class",
        name: talent.name,
        text: talent.text,
      });
    }

    archetype?.classFeatures.forEach((feature) => {
      if (!isOncePerScene(feature.text)) return;
      items.push({
        id: `class:${archetype.id}:${feature.name}`,
        source: "Class",
        name: feature.name,
        text: feature.text,
      });
    });

    if (boon && isOncePerScene(boon.text)) {
      items.push({
        id: `boon:${boon.id}`,
        source: "Boon",
        name: boon.name,
        text: boon.text,
      });
    }

    return items;
  }, [archetype, boon]);
  const usedSceneIds = useMemo(() => new Set(sceneUsedIds), [sceneUsedIds]);

  useEffect(() => {
    const validIds = new Set(sceneUses.map((item) => item.id));
    const nextUsedIds = sceneUsedIds.filter((id) => validIds.has(id));
    if (nextUsedIds.length !== sceneUsedIds.length) {
      onSceneUsedIds(nextUsedIds);
    }
  }, [onSceneUsedIds, sceneUses, sceneUsedIds]);

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
        <SceneUsesPanel items={sceneUses} usedIds={usedSceneIds} onToggle={toggleSceneUse} onReset={resetScene} />
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
