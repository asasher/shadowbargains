import type { CharacterState, StatKey } from "../types";
import { archetypes } from "../data/archetypes";
import { boons, banes } from "../data/powers";
import { selectedWeapon } from "../data/weapons";
import { Icon, type IconName } from "../components/Icon";
import { ClassShowcase } from "../components/ClassShowcase";
import { PowerToken } from "../components/PowerToken";
import type { Archetype, Power, Weapon } from "../types";
import { isCharacterReadyForPlay } from "../lib/character";
import { applyStatChange, clampStat, formatStat, isValidStatSpread, normalizeStatSpread, requiredStatMinimums, STAT_MAX, STAT_MIN, STAT_TOTAL, statTotal } from "../lib/stats";

interface BuildViewProps {
  character: CharacterState;
  onCharacter: (updates: Partial<CharacterState>) => void;
  onPlay: () => void;
}

const statLabels: Record<StatKey, string> = {
  might: "Might",
  guile: "Guile",
  will: "Will",
};

function Field({
  id,
  label,
  value,
  onChange,
  textarea = false,
  placeholder,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  textarea?: boolean;
  placeholder?: string;
}) {
  return (
    <label className="field" htmlFor={id}>
      <span>{label}</span>
      {textarea ? (
        <textarea id={id} value={value} placeholder={placeholder} onChange={(event) => onChange(event.target.value)} />
      ) : (
        <input id={id} value={value} placeholder={placeholder} onChange={(event) => onChange(event.target.value)} />
      )}
    </label>
  );
}

function StatInput({
  label,
  value,
  min,
  canIncrease,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  canIncrease: boolean;
  onChange: (value: number) => void;
}) {
  const clamped = clampStat(value);

  return (
    <label className="stat-stepper">
      <span>{label}</span>
      <div>
        <button type="button" aria-label={`Decrease ${label}`} disabled={clamped <= min} onClick={() => onChange(clampStat(clamped - 1))}>
          <Icon name="minus" />
        </button>
        <strong className="numeric">{formatStat(clamped)}</strong>
        <button type="button" aria-label={`Increase ${label}`} disabled={!canIncrease || clamped >= STAT_MAX} onClick={() => onChange(clampStat(clamped + 1))}>
          <Icon name="plus" />
        </button>
      </div>
    </label>
  );
}

function PowerChoiceList({
  label,
  powers,
  selectedId,
  availableIds,
  onSelect,
}: {
  label: "Boon" | "Bane";
  powers: Power[];
  selectedId: string;
  availableIds: string[];
  onSelect: (id: string) => void;
}) {
  const isBane = label === "Bane";
  const availablePowers = availableIds
    .map((id) => powers.find((power) => power.id === id))
    .filter((power): power is Power => Boolean(power));

  return (
    <>
      <div className={isBane ? "power-rule is-bane" : "power-rule"}>
        <strong>{isBane ? "Can impose Disadvantage" : "Can grant Advantage"}</strong>
        <span>{isBane ? "Disadvantage rolls two d20s and keeps the lower." : "Advantage rolls two d20s and keeps the higher."} Advantage and Disadvantage cancel one for one before rolling.</span>
      </div>
      <div className="power-choice-list" role="radiogroup" aria-label={`Choose ${label}`}>
        {availablePowers.length ? availablePowers.map((power) => {
          const selected = selectedId === power.id;
          return (
            <button
              type="button"
              key={power.id}
              role="radio"
              aria-checked={selected}
              className={`${selected ? "power-choice is-selected" : "power-choice"} is-${power.kind}`}
              onClick={() => onSelect(power.id)}
            >
              <PowerToken power={power} />
              <span className="power-choice__body">
                <span className="power-choice__title">
                  <strong>{power.name}</strong>
                </span>
                <span>{power.summary}</span>
                <span>{power.text}</span>
              </span>
            </button>
          );
        }) : <p className="power-empty">Choose a class to see available {label === "Boon" ? "Boons" : "Banes"}.</p>}
      </div>
    </>
  );
}

function WeaponChoiceList({
  hasClass,
  weapons,
  selectedId,
  onSelect,
}: {
  hasClass: boolean;
  weapons: Weapon[];
  selectedId: string;
  onSelect: (id: string) => void;
}) {
  if (!weapons.length) {
    const emptyText = hasClass
      ? "This class does not choose a weapon. Use its class attack in Play."
      : "Choose a class to see available weapons.";

    return <p className="weapon-empty">{emptyText}</p>;
  }

  return (
    <div className="weapon-choice-list" role="radiogroup" aria-label="Choose Weapon">
      {weapons.map((weapon) => {
        const selected = selectedId === weapon.id;
        return (
          <button
            type="button"
            key={weapon.id}
            role="radio"
            aria-checked={selected}
            className={selected ? "weapon-choice is-selected" : "weapon-choice"}
            onClick={() => onSelect(weapon.id)}
          >
            <span>
              <strong>{weapon.name}</strong>
              <em>{weapon.range} · {weapon.attack} · {weapon.damage}</em>
            </span>
            <span>{weapon.text}</span>
          </button>
        );
      })}
    </div>
  );
}

function archetypeWeapons(archetype: Pick<Archetype, "weaponIds">) {
  return archetype.weaponIds
    .map((id) => selectedWeapon(id))
    .filter((weapon): weapon is Weapon => Boolean(weapon));
}

function hasMagic(archetype: Pick<Archetype, "weaponIds">) {
  return archetype.weaponIds.length === 0;
}

function classIconBadges(archetype: Archetype) {
  const weapons = archetypeWeapons(archetype);
  const hasMelee = weapons.some((weapon) => weapon.range !== "Ranged");
  const hasRanged = weapons.some((weapon) => weapon.range === "Ranged");
  const badges: { icon: IconName; label: string; value?: string }[] = [
    { icon: "arrow-right", label: "Movement", value: String(archetype.movement.units) },
  ];

  if (hasMagic(archetype)) {
    badges.push({ icon: "sparkle", label: "Magic", value: "Will" });
  } else {
    if (hasMelee) badges.push({ icon: "sword", label: "Melee weapons" });
    if (hasRanged) badges.push({ icon: "target", label: "Ranged weapons" });
  }

  return badges;
}

export function BuildView({ character, onCharacter, onPlay }: BuildViewProps) {
  const selectedArchetype = archetypes.find((archetype) => archetype.id === character.archetypeId);
  const availableWeapons = selectedArchetype?.weaponIds
    .map((id) => selectedWeapon(id))
    .filter((weapon): weapon is Weapon => Boolean(weapon)) ?? [];
  const statSpread = { might: character.might, guile: character.guile, will: character.will };
  const statMinimums = requiredStatMinimums(selectedArchetype?.requiredStat);
  const pointTotal = statTotal(statSpread);
  const hasValidStats = isValidStatSpread(statSpread, statMinimums);
  const canIncreaseStats = pointTotal < STAT_TOTAL;
  const selectedWeaponAvailable = !availableWeapons.length || availableWeapons.some((weapon) => weapon.id === character.weaponId);
  const selectedBoonAvailable = selectedArchetype?.boonIds.includes(character.boonId) ?? false;
  const selectedBaneAvailable = selectedArchetype?.baneIds.includes(character.baneId) ?? false;
  const canPlay = isCharacterReadyForPlay(character);
  const hpMax = 10 + character.might;
  const defense = 10 + character.guile;
  const readinessNote = !selectedArchetype
    ? "Choose a class."
    : !hasValidStats
      ? `Stats must fit ${selectedArchetype.name}: ${statLabels[selectedArchetype.requiredStat]} +1 or better, total ${STAT_TOTAL} or less.`
      : !selectedWeaponAvailable
        ? "Choose an available weapon."
        : !selectedBoonAvailable
          ? "Choose an available Boon."
          : !selectedBaneAvailable
            ? "Choose an available Bane."
            : "";

  function chooseArchetype(id: string) {
    const archetype = archetypes.find((item) => item.id === id);
    const previousGear = selectedArchetype?.gear.trim() ?? "";
    const currentGear = character.gear.trim();
    const shouldUseArchetypeGear = !currentGear || currentGear === previousGear;
    const nextStats = normalizeStatSpread(
      { might: character.might, guile: character.guile, will: character.will },
      requiredStatMinimums(archetype?.requiredStat),
    );
    const nextHpMax = 10 + nextStats.might;

    onCharacter({
      ...nextStats,
      archetypeId: id,
      gear: shouldUseArchetypeGear ? archetype?.gear || "" : character.gear,
      weaponId: archetype?.weaponIds.includes(character.weaponId) ? character.weaponId : "",
      boonId: archetype?.boonIds.includes(character.boonId) ? character.boonId : "",
      baneId: archetype?.baneIds.includes(character.baneId) ? character.baneId : "",
      hp: character.hp === hpMax ? nextHpMax : Math.min(character.hp, nextHpMax),
    });
  }

  function changeStat(stat: StatKey, value: number) {
    const nextStats = applyStatChange(
      { might: character.might, guile: character.guile, will: character.will },
      stat,
      value,
      statMinimums,
    );
    const nextHpMax = 10 + nextStats.might;

    onCharacter({
      ...nextStats,
      hp: character.hp === hpMax ? nextHpMax : Math.min(character.hp, nextHpMax),
    });
  }

  return (
    <div className="view build-view">
      <h1 className="sr-only">Build</h1>
      <section className="build-start">
        <ClassShowcase
          archetype={selectedArchetype}
          emptyDescription="Pick from the gallery to see movement, weapons or magic, class features, and the class image."
        />

        <div className="panel class-panel">
          <div className="class-gallery-list">
            {archetypes.map((archetype) => {
              const requirementMet = character[archetype.requiredStat] >= 1;
              const className = [
                "class-gallery-card",
                character.archetypeId === archetype.id ? "is-selected" : "",
                requirementMet ? "" : "is-requirement-missing",
              ].filter(Boolean).join(" ");

              return (
                <button
                  type="button"
                  key={archetype.id}
                  className={className}
                  aria-pressed={character.archetypeId === archetype.id}
                  onClick={() => chooseArchetype(archetype.id)}
                >
                  <span className="class-gallery-card__thumb">
                    <img src={archetype.image} alt="" />
                  </span>
                  <span className="class-gallery-card__body">
                    <span className="class-gallery-card__top">
                      <strong>{archetype.name}</strong>
                      <em className={requirementMet ? "" : "is-warning"}>{statLabels[archetype.requiredStat]} +1</em>
                    </span>
                    <span className="class-icon-row">
                      {classIconBadges(archetype).map((badge) => (
                        <span className="class-icon-badge" key={badge.label} aria-label={badge.value ? `${badge.label}: ${badge.value}` : badge.label}>
                          <Icon name={badge.icon} />
                          {badge.value ? <span>{badge.value}</span> : null}
                        </span>
                      ))}
                    </span>
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </section>

      <section className="panel build-stats-panel">
        <div className="panel__head">
          <div>
            <h2>Stats</h2>
            <p>Spend up to {STAT_TOTAL} points across Might, Guile, and Will. Each stat can be {STAT_MIN} to +{STAT_MAX}.</p>
          </div>
        </div>
        <div className="stat-grid">
          <StatInput
            label="Might"
            value={character.might}
            min={statMinimums.might ?? STAT_MIN}
            canIncrease={canIncreaseStats}
            onChange={(might) => changeStat("might", might)}
          />
          <StatInput label="Guile" value={character.guile} min={statMinimums.guile ?? STAT_MIN} canIncrease={canIncreaseStats} onChange={(guile) => changeStat("guile", guile)} />
          <StatInput label="Will" value={character.will} min={statMinimums.will ?? STAT_MIN} canIncrease={canIncreaseStats} onChange={(will) => changeStat("will", will)} />
        </div>
        <div className="derived-row">
          <span>Total <strong className="numeric">{formatStat(pointTotal)}</strong></span>
          <span>HP <strong className="numeric">{hpMax}</strong></span>
          <span>Defense <strong className="numeric">{defense}</strong></span>
        </div>
      </section>

      <section className="panel">
        <div className="panel__head">
          <div>
            <h2>Weapon</h2>
            <p>Choose one weapon available to your class. Hex uses Spell Attack instead.</p>
          </div>
        </div>
        <WeaponChoiceList
          hasClass={Boolean(selectedArchetype)}
          weapons={availableWeapons}
          selectedId={character.weaponId}
          onSelect={(weaponId) => onCharacter({ weaponId })}
        />
      </section>

      <section className="form-grid">
        <div className="panel">
          <div className="panel__head">
            <div>
              <h2>Boon</h2>
              <p>Pick one gift available to your class.</p>
            </div>
          </div>
          <PowerChoiceList
            label="Boon"
            powers={boons}
            selectedId={character.boonId}
            availableIds={selectedArchetype?.boonIds ?? []}
            onSelect={(boonId) => onCharacter({ boonId })}
          />
        </div>

        <div className="panel">
          <div className="panel__head">
            <div>
              <h2>Bane</h2>
              <p>Pick one cost available to your class.</p>
            </div>
          </div>
          <PowerChoiceList
            label="Bane"
            powers={banes}
            selectedId={character.baneId}
            availableIds={selectedArchetype?.baneIds ?? []}
            onSelect={(baneId) => onCharacter({ baneId })}
          />
        </div>
      </section>

      <section className="form-grid flavor-grid">
        <div className="panel">
          <div className="panel__head">
            <div>
              <h2>Identity</h2>
              <p>Name, look, drive, and bargain can wait until the build has its mechanics.</p>
            </div>
          </div>
          <div className="field-grid">
            <Field id="name" label="Name" value={character.name} onChange={(name) => onCharacter({ name })} />
            <Field id="look" label="Look" value={character.look} onChange={(look) => onCharacter({ look })} />
            <Field id="drive" label="Drive" value={character.drive} onChange={(drive) => onCharacter({ drive })} />
            <Field id="bargain" label="What did you bargain for?" value={character.bargain} onChange={(bargain) => onCharacter({ bargain })} />
          </div>
        </div>

        <div className="panel">
          <div className="panel__head">
            <div>
              <h2>Table Notes</h2>
              <p>Gear, bonds, and anything the GM should push on.</p>
            </div>
          </div>
          <div className="field-grid">
            <Field id="gear" label="Gear" value={character.gear} textarea onChange={(gear) => onCharacter({ gear })} />
            <Field id="bonds" label="Bonds" value={character.bonds} textarea onChange={(bonds) => onCharacter({ bonds })} />
            <Field id="notes" label="Notes" value={character.notes} textarea onChange={(notes) => onCharacter({ notes })} />
          </div>
          <div className="action-row align-end build-ready-row">
            {readinessNote ? <p className="readiness-note">{readinessNote}</p> : null}
            <button type="button" className="primary-action" disabled={!canPlay} onClick={onPlay}>
              <Icon name="play" /> Play Character
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
