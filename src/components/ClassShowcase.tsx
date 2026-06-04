import type { Archetype, ClassFeature, StatKey, Weapon } from "../types";
import { movementBoxCount } from "../data/archetypes";
import { images } from "../data/images";
import { selectedWeapon } from "../data/weapons";
import { Icon, type IconName } from "./Icon";

const statLabels: Record<StatKey, string> = {
  might: "Might",
  guile: "Guile",
  will: "Will",
};

function talentFeature(talent: string): ClassFeature {
  const separator = talent.indexOf(":");
  if (separator === -1) return { name: "Class Feature", text: talent };
  return {
    name: talent.slice(0, separator).trim(),
    text: talent.slice(separator + 1).trim(),
  };
}

function archetypeWeapons(archetype: Pick<Archetype, "weaponIds">) {
  return archetype.weaponIds
    .map((id) => selectedWeapon(id))
    .filter((weapon): weapon is Weapon => Boolean(weapon));
}

function hasMagic(archetype: Pick<Archetype, "weaponIds">) {
  return archetype.weaponIds.length === 0;
}

function attackDetail(archetype: Archetype) {
  if (hasMagic(archetype)) {
    return {
      icons: [{ name: "sparkle" as IconName, label: "Magic" }],
      title: "Magic",
      text: "Uses Will for touch, ranged, or area magic instead of choosing a weapon.",
    };
  }

  const weapons = archetypeWeapons(archetype);
  const hasMelee = weapons.some((weapon) => weapon.range !== "Ranged");
  const hasRanged = weapons.some((weapon) => weapon.range === "Ranged");
  const icons = [
    hasMelee ? { name: "sword" as IconName, label: "Melee" } : null,
    hasRanged ? { name: "target" as IconName, label: "Ranged" } : null,
  ].filter((icon): icon is { name: IconName; label: string } => Boolean(icon));
  const capability = hasMelee && hasRanged
    ? "Can use both melee and ranged weapons."
    : hasRanged
      ? "Can use ranged weapons."
      : "Can use melee weapons.";

  return {
    icons,
    title: "Weapons",
    text: `${capability} Available: ${weapons.map((weapon) => weapon.name).join(", ")}.`,
  };
}

interface ClassShowcaseProps {
  archetype: Archetype | undefined;
  emptyDescription?: string;
}

export function ClassShowcase({ archetype, emptyDescription = "Choose a class to see movement, weapons or magic, the class feature, and the class image." }: ClassShowcaseProps) {
  const portrait = archetype?.image ?? images.emptyCharacter;

  return (
    <article className="panel class-showcase">
      <div className="class-showcase__art">
        <img src={portrait} alt="" />
      </div>
      {archetype ? (
        <div className="class-showcase__body">
          <div className="class-showcase__head">
            <div>
              <h2>{archetype.name}</h2>
              <p>{archetype.role}</p>
            </div>
            <span>{statLabels[archetype.requiredStat]} +1</span>
          </div>
          <div className="class-rule-grid">
            <div className="class-rule">
              <span className="class-rule__label">
                <Icon name="arrow-right" />
                <strong>{archetype.movement.units}</strong>
                <em>Movement</em>
              </span>
              <p>{movementBoxCount(archetype.movement.units)} boxes. {archetype.movement.feature}</p>
            </div>
            {(() => {
              const detail = attackDetail(archetype);

              return (
                <div className="class-rule">
                  <span className="class-rule__label">
                    {detail.icons.map((icon) => (
                      <span className="class-attack-type" key={icon.label}>
                        <Icon name={icon.name} />
                        <strong>{icon.label}</strong>
                      </span>
                    ))}
                    <em>{detail.title}</em>
                  </span>
                  <p>{detail.text}</p>
                </div>
              );
            })()}
          </div>
          <div className="class-feature-strip">
            {(() => {
              const feature = talentFeature(archetype.talent);

              return (
                <>
                  <strong>{feature.name}</strong>
                  <p>{feature.text}</p>
                </>
              );
            })()}
          </div>
        </div>
      ) : (
        <div className="class-showcase__empty">
          <strong>No class selected</strong>
          <p>{emptyDescription}</p>
        </div>
      )}
    </article>
  );
}
