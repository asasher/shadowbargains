import type { Archetype, ClassFeature } from "../types";

function talentFeature(talent: string): ClassFeature {
  const separator = talent.indexOf(":");
  if (separator === -1) return { name: "Class Feature", text: talent };
  return {
    name: talent.slice(0, separator).trim(),
    text: talent.slice(separator + 1).trim(),
  };
}

export function archetypeClassFeatures(archetype: Pick<Archetype, "talent" | "classFeatures">): ClassFeature[] {
  return [talentFeature(archetype.talent), ...archetype.classFeatures];
}

export function classFeatureLine(feature: ClassFeature) {
  return `${feature.name}: ${feature.text}`;
}
