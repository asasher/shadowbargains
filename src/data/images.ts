export const images = {
  home: "/assets/generated/home-table.png",
  homePhysics: "/assets/generated/home-physics-scene.png",
  rules: "/assets/generated/rules-reference.png",
  dm: "/assets/generated/dm-creature.png",
  emptyCharacter: "/assets/generated/empty-character.png",
  boons: "/assets/generated/boon-token-sheet-alpha.png",
  banes: "/assets/generated/bane-token-sheet-alpha.png",
  archetypes: {
    stalker: "/assets/generated/archetypes/stalker.png",
    blade: "/assets/generated/archetypes/blade.png",
    hex: "/assets/generated/archetypes/hex.png",
    saint: "/assets/generated/archetypes/saint.png",
    shade: "/assets/generated/archetypes/shade.png",
    beast: "/assets/generated/archetypes/beast.png",
  },
} as const;

export function powerTokenImage(id: string) {
  return `/assets/generated/tokens/${id}.png`;
}
