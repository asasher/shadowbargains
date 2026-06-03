import { existsSync, statSync } from "node:fs";
import { join } from "node:path";

const requiredAssets = [
  "assets/generated/home-table.png",
  "assets/generated/rules-reference.png",
  "assets/generated/tokens/shadow-step.png",
  "assets/generated/archetypes/stalker.png",
];

const missingAssets = requiredAssets.filter((assetPath) => {
  const outputPath = join("dist", assetPath);
  return !existsSync(outputPath) || statSync(outputPath).size === 0;
});

if (missingAssets.length > 0) {
  console.error(
    `Missing built image asset${missingAssets.length === 1 ? "" : "s"}:\n` +
      missingAssets.map((assetPath) => `- /${assetPath}`).join("\n"),
  );
  process.exit(1);
}
