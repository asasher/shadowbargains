import assert from "node:assert/strict";
import fs from "node:fs/promises";
import ts from "typescript";

const source = await fs.readFile(new URL("../src/views/HomeView.tsx", import.meta.url), "utf8");
const physicsStart = source.indexOf("const Material");
const physicsEnd = source.indexOf("interface PixelBreakStageProps");

assert.notEqual(physicsStart, -1, "Could not find physics block start in HomeView.tsx");
assert.notEqual(physicsEnd, -1, "Could not find physics block end in HomeView.tsx");

const testModule = `${source.slice(physicsStart, physicsEnd)}
export { Material, indexOf, setCell, stepWorld, VOID_COLOR };
`;

const transpiled = ts.transpileModule(testModule, {
  compilerOptions: {
    module: ts.ModuleKind.ESNext,
    target: ts.ScriptTarget.ES2022,
  },
});

const physics = await import(`data:text/javascript;base64,${Buffer.from(transpiled.outputText).toString("base64")}`);
const { Material, VOID_COLOR, indexOf, setCell, stepWorld } = physics;

function createOpenBasin(width, height) {
  const material = new Uint8Array(width * height);
  const color = new Uint32Array(width * height);
  const life = new Uint8Array(width * height);
  const updated = new Uint16Array(width * height);
  const world = {
    width,
    height,
    material,
    color,
    life,
    updated,
    seed: 1234,
    tick: 0,
    waterSources: [
      { x: width - 5, y: 2 },
      { x: width - 4, y: 2 },
      { x: width - 3, y: 3 },
    ],
  };

  for (let index = 0; index < material.length; index += 1) {
    setCell(world, index, Material.Air, VOID_COLOR);
  }

  for (let x = 0; x < width; x += 1) {
    setCell(world, indexOf(world, x, height - 1), Material.Stone, 0x777777);
  }

  for (let y = 0; y < height; y += 1) {
    setCell(world, indexOf(world, 0, y), Material.Stone, 0x777777);
    setCell(world, indexOf(world, width - 1, y), Material.Stone, 0x777777);
  }

  return world;
}

function measureWater(world) {
  let water = 0;
  let floorWater = 0;
  const columns = new Map();

  for (let y = 0; y < world.height; y += 1) {
    for (let x = 0; x < world.width; x += 1) {
      if (world.material[indexOf(world, x, y)] !== Material.Water) continue;

      water += 1;
      if (y === world.height - 2) floorWater += 1;
      columns.set(x, (columns.get(x) ?? 0) + 1);
    }
  }

  return {
    water,
    floorWater,
    tallestColumn: Math.max(0, ...columns.values()),
  };
}

const world = createOpenBasin(48, 32);
for (let tick = 0; tick < 160; tick += 1) {
  stepWorld(world, []);
}

const water = measureWater(world);

assert.equal(water.water, 240);
assert.equal(water.floorWater, 46, "Water should fill the open basin floor instead of stacking above the source");
assert.ok(water.tallestColumn <= 18, `Water stacked too high: ${water.tallestColumn}`);

console.log(`water flow ok: ${water.floorWater} floor cells, tallest column ${water.tallestColumn}`);
