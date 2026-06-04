import QRCode from "qrcode";
import { useCallback, useEffect, useRef, useState, type MouseEvent as ReactMouseEvent } from "react";
import { Icon } from "../components/Icon";
import { images } from "../data/images";
import type { FeedbackKind } from "../lib/feedback";
import type { ViewId } from "../types";

interface HomeViewProps {
  characterReady: boolean;
  onFeedback: (kind: FeedbackKind) => void;
  onView: (view: ViewId) => void;
}

const Material = {
  Air: 0,
  Stone: 1,
  Dirt: 2,
  Wood: 3,
  Water: 4,
  Fire: 5,
  Smoke: 6,
  Ember: 7,
  Brass: 8,
  Moss: 9,
} as const;

type MaterialId = (typeof Material)[keyof typeof Material];

interface PixelWorld {
  width: number;
  height: number;
  material: Uint8Array;
  color: Uint32Array;
  life: Uint8Array;
  updated: Uint16Array;
  seed: number;
  tick: number;
  waterSources: Array<{ x: number; y: number }>;
}

interface FlyingPixel {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  material: MaterialId;
  color: number;
}

interface HeroEffect {
  name: "inferno" | "cleave" | "rupture";
  feedback: FeedbackKind;
}

const heroEffects: HeroEffect[] = [
  { name: "inferno", feedback: "homeExplosion" },
  { name: "cleave", feedback: "homeImpact" },
  { name: "rupture", feedback: "homeImpact" },
];

const VOID_COLOR = 0x050408;
const FIRE_COLORS = [0xffc24a, 0xf06a2f, 0xbe2f21, 0xf5df74];
const SMOKE_COLORS = [0x17151a, 0x242128, 0x302b30];
const WATER_COLORS = [0x2aafa8, 0x1b777c, 0x4bd1bf, 0x124c56];
const MAX_FLYING_PIXELS = 1200;

function getShareUrl() {
  const url = new URL(window.location.href);
  url.search = "";
  url.hash = "";
  return url.toString();
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function packRgb(red: number, green: number, blue: number) {
  return (clamp(red, 0, 255) << 16) | (clamp(green, 0, 255) << 8) | clamp(blue, 0, 255);
}

function mixColor(color: number, target: number, amount: number) {
  const red = color >> 16;
  const green = (color >> 8) & 255;
  const blue = color & 255;
  return packRgb(
    Math.round(red + ((target >> 16) - red) * amount),
    Math.round(green + (((target >> 8) & 255) - green) * amount),
    Math.round(blue + ((target & 255) - blue) * amount),
  );
}

function pixelNoise(x: number, y: number, seed: number) {
  let value = Math.imul(x + 101, 374761393) ^ Math.imul(y + 173, 668265263) ^ Math.imul(seed, 1274126177);
  value = Math.imul(value ^ (value >>> 13), 1274126177);
  return ((value ^ (value >>> 16)) >>> 0) / 4294967295;
}

function indexOf(world: PixelWorld, x: number, y: number) {
  return y * world.width + x;
}

function setCell(world: PixelWorld, index: number, material: MaterialId, color: number, life = 0) {
  world.material[index] = material;
  world.color[index] = color;
  world.life[index] = life;
}

function isEmptyForMotion(material: number) {
  return material === Material.Air || material === Material.Smoke || material === Material.Fire;
}

function isBurnable(material: number) {
  return material === Material.Wood || material === Material.Moss || material === Material.Dirt || material === Material.Ember;
}

function debrisFor(material: number, fiery: boolean): MaterialId {
  if (material === Material.Water) return Material.Water;
  if (fiery && (material === Material.Wood || material === Material.Moss || material === Material.Brass)) return Material.Ember;
  if (material === Material.Fire) return Material.Ember;
  return Material.Dirt;
}

function classifyPixel(
  red: number,
  green: number,
  blue: number,
  alpha: number,
  x: number,
  y: number,
  width: number,
  height: number,
  seed: number,
): { material: MaterialId; color: number; life: number } {
  const luminance = (red + green + blue) / 3;
  const max = Math.max(red, green, blue);
  const min = Math.min(red, green, blue);
  const color = packRgb(red, green, blue);

  if (alpha < 16 || luminance < 10) return { material: Material.Air, color: luminance > 5 ? color : VOID_COLOR, life: 0 };

  const blueGreenWater = blue > 62 && green > 66 && blue > red * 1.08 && green > red * 0.9;
  const orangeFire = red > 150 && green > 72 && blue < 78 && max - min > 70;
  const greenGrowth = green > 48 && green > red * 1.08 && green > blue * 1.05;
  const redGrowth = red > 55 && red > green * 1.18 && red > blue * 1.18;
  const brass = red > 120 && green > 82 && blue < 86;
  const grayStone = Math.abs(red - green) < 22 && Math.abs(green - blue) < 24;
  const brownWood = red > 48 && red > green * 1.03 && green > blue * 1.08;
  const borderRock = x < 3 || x > width - 4 || y < 3 || y > height - 4;

  if (blueGreenWater) return { material: Material.Water, color: mixColor(color, WATER_COLORS[1], 0.18), life: 0 };
  if (orangeFire && luminance > 108) return { material: Material.Fire, color: FIRE_COLORS[0], life: 190 };
  if (greenGrowth || redGrowth) return { material: Material.Moss, color, life: 0 };
  if (brass) return { material: Material.Brass, color, life: 0 };

  if (luminance < 30 && !borderRock) return { material: Material.Air, color, life: 0 };
  if (grayStone || borderRock || y < height * 0.2) return { material: Material.Stone, color, life: 0 };

  if (brownWood && y > height * 0.36 && y < height * 0.76 && pixelNoise(x, y, seed) > 0.24) {
    return { material: Material.Wood, color, life: 0 };
  }

  if (y > height * 0.62 || luminance < 74) return { material: Material.Dirt, color, life: 0 };

  return { material: Material.Stone, color, life: 0 };
}

function drawSceneSource(image: HTMLImageElement, width: number, height: number) {
  const sourceCanvas = document.createElement("canvas");
  sourceCanvas.width = width;
  sourceCanvas.height = height;
  const context = sourceCanvas.getContext("2d");
  if (!context) return null;

  const sourceWidth = image.naturalWidth || image.width;
  const sourceHeight = image.naturalHeight || image.height;
  const sourceAspect = sourceWidth / sourceHeight;
  const targetAspect = width / height;

  let sx = 0;
  let sy = 0;
  let sw = sourceWidth;
  let sh = sourceHeight;

  if (sourceAspect > targetAspect) {
    sw = sourceHeight * targetAspect;
    const focus = targetAspect < 0.8 ? 0.62 : 0.5;
    sx = clamp(sourceWidth * focus - sw / 2, 0, sourceWidth - sw);
  } else {
    sh = sourceWidth / targetAspect;
    sy = clamp(sourceHeight * 0.48 - sh / 2, 0, sourceHeight - sh);
  }

  context.imageSmoothingEnabled = false;
  context.drawImage(image, sx, sy, sw, sh, 0, 0, width, height);
  return context.getImageData(0, 0, width, height);
}

function findWaterSources(world: PixelWorld) {
  let bestX = Math.floor(world.width * 0.76);
  let bestY = Math.floor(world.height * 0.28);
  let found = false;

  for (let y = 0; y < Math.floor(world.height * 0.68); y += 1) {
    for (let x = Math.floor(world.width * 0.5); x < world.width - 2; x += 1) {
      if (world.material[indexOf(world, x, y)] === Material.Water) {
        bestX = x;
        bestY = y;
        found = true;
        break;
      }
    }
    if (found) break;
  }

  return [
    { x: clamp(bestX - 1, 2, world.width - 3), y: clamp(bestY, 2, world.height - 3) },
    { x: clamp(bestX, 2, world.width - 3), y: clamp(bestY, 2, world.height - 3) },
    { x: clamp(bestX + 1, 2, world.width - 3), y: clamp(bestY + 1, 2, world.height - 3) },
  ];
}

function generateWorldFromImage(width: number, height: number, image: HTMLImageElement): PixelWorld {
  const seed = Math.floor(Math.random() * 900000) + 1000;
  const material = new Uint8Array(width * height);
  const color = new Uint32Array(width * height);
  const life = new Uint8Array(width * height);
  const updated = new Uint16Array(width * height);
  const world: PixelWorld = { width, height, material, color, life, updated, seed, tick: 0, waterSources: [] };
  const imageData = drawSceneSource(image, width, height);

  if (!imageData) return world;

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const sourceIndex = (y * width + x) * 4;
      const classified = classifyPixel(
        imageData.data[sourceIndex],
        imageData.data[sourceIndex + 1],
        imageData.data[sourceIndex + 2],
        imageData.data[sourceIndex + 3],
        x,
        y,
        width,
        height,
        seed,
      );
      setCell(world, indexOf(world, x, y), classified.material, classified.color, classified.life);
    }
  }

  world.waterSources = findWaterSources(world);
  return world;
}

function tryMove(world: PixelWorld, from: number, to: number) {
  if (to < 0 || to >= world.material.length || world.updated[to] === world.tick) return false;

  const target = world.material[to];
  if (!isEmptyForMotion(target) && !(world.material[from] === Material.Dirt && target === Material.Water)) return false;

  const fromMaterial = world.material[from];
  const fromColor = world.color[from];
  const fromLife = world.life[from];
  const toMaterial = world.material[to];
  const toColor = world.color[to];
  const toLife = world.life[to];

  world.material[to] = fromMaterial;
  world.color[to] = fromColor;
  world.life[to] = fromLife;
  world.material[from] = toMaterial === Material.Water ? Material.Water : Material.Air;
  world.color[from] = toMaterial === Material.Water ? toColor : VOID_COLOR;
  world.life[from] = toMaterial === Material.Water ? toLife : 0;
  world.updated[to] = world.tick;
  world.updated[from] = world.tick;
  return true;
}

function addFlyingPixel(world: PixelWorld, particles: FlyingPixel[], x: number, y: number, material: MaterialId, color: number, force: number) {
  if (particles.length >= MAX_FLYING_PIXELS) return;

  particles.push({
    x,
    y,
    vx: (Math.random() - 0.5) * force,
    vy: (Math.random() - 0.72) * force,
    life: 75 + Math.floor(Math.random() * 60),
    material,
    color,
  });
}

function settleFlyingPixel(world: PixelWorld, particle: FlyingPixel) {
  const x = Math.floor(particle.x);
  const y = Math.floor(particle.y);
  if (x <= 1 || y <= 1 || x >= world.width - 1 || y >= world.height - 1) return true;

  const index = indexOf(world, x, y);
  if (isEmptyForMotion(world.material[index])) {
    const life = particle.material === Material.Ember ? 145 : particle.material === Material.Fire ? 170 : 0;
    setCell(world, index, particle.material, particle.color, life);
    world.updated[index] = world.tick;
    return true;
  }

  return false;
}

function updateFlyingPixels(world: PixelWorld, particles: FlyingPixel[]) {
  const next: FlyingPixel[] = [];

  for (const particle of particles) {
    particle.life -= 1;
    if (particle.life <= 0) {
      settleFlyingPixel(world, particle);
      continue;
    }

    particle.vy += particle.material === Material.Water ? 0.09 : 0.135;
    particle.vx *= 0.992;
    particle.x += particle.vx;
    particle.y += particle.vy;

    const x = Math.floor(particle.x);
    const y = Math.floor(particle.y);
    if (x <= 1 || y <= 1 || x >= world.width - 1 || y >= world.height - 1) continue;

    const index = indexOf(world, x, y);
    if (isEmptyForMotion(world.material[index])) {
      next.push(particle);
      continue;
    }

    particle.x -= particle.vx * 0.8;
    particle.y -= particle.vy * 0.8;
    particle.vx *= -0.22;
    particle.vy *= -0.12;

    if (Math.abs(particle.vx) + Math.abs(particle.vy) < 0.45 || particle.life < 38) {
      settleFlyingPixel(world, particle);
    } else {
      next.push(particle);
    }
  }

  particles.length = 0;
  particles.push(...next);
}

function igniteCell(world: PixelWorld, index: number) {
  if (world.material[index] === Material.Water) {
    setCell(world, index, Material.Smoke, SMOKE_COLORS[1], 70);
    return;
  }

  if (isBurnable(world.material[index]) || world.material[index] === Material.Air || world.material[index] === Material.Smoke) {
    setCell(world, index, Material.Fire, FIRE_COLORS[Math.floor(Math.random() * FIRE_COLORS.length)], 155 + Math.floor(Math.random() * 70));
  }
}

function dislodgeRadius(
  world: PixelWorld,
  particles: FlyingPixel[],
  centerX: number,
  centerY: number,
  radius: number,
  force: number,
  fiery: boolean,
) {
  const minX = Math.max(2, Math.floor(centerX - radius - 4));
  const maxX = Math.min(world.width - 3, Math.ceil(centerX + radius + 4));
  const minY = Math.max(2, Math.floor(centerY - radius - 4));
  const maxY = Math.min(world.height - 3, Math.ceil(centerY + radius + 4));

  for (let y = minY; y <= maxY; y += 1) {
    for (let x = minX; x <= maxX; x += 1) {
      const distance = Math.hypot(x - centerX, y - centerY);
      if (distance > radius + 3) continue;

      const index = indexOf(world, x, y);
      const material = world.material[index];

      if (fiery && distance < radius + 2 && pixelNoise(x + world.tick, y, world.seed) > distance / (radius + 3)) {
        igniteCell(world, index);
      }

      if (material === Material.Air || material === Material.Smoke || material === Material.Fire) continue;

      const roughness = 0.78 + pixelNoise(x, y, world.seed + world.tick) * 0.42;
      if (distance > radius * roughness) continue;

      const debris = debrisFor(material, fiery);
      const color = fiery ? mixColor(world.color[index], FIRE_COLORS[1], 0.42) : world.color[index];
      setCell(world, index, Material.Air, VOID_COLOR);

      const angle = Math.atan2(y - centerY, x - centerX) + (Math.random() - 0.5) * 0.85;
      const launch = force * (0.35 + (1 - distance / Math.max(1, radius)) * 0.95 + Math.random() * 0.45);
      if (particles.length < MAX_FLYING_PIXELS) {
        particles.push({
          x,
          y,
          vx: Math.cos(angle) * launch,
          vy: Math.sin(angle) * launch - force * 0.24,
          life: 70 + Math.floor(Math.random() * 70),
          material: debris,
          color,
        });
      }
    }
  }
}

function dislodgeLine(
  world: PixelWorld,
  particles: FlyingPixel[],
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  radius: number,
  force: number,
) {
  const steps = Math.max(1, Math.ceil(Math.hypot(x2 - x1, y2 - y1) * 1.8));

  for (let step = 0; step <= steps; step += 1) {
    const progress = step / steps;
    dislodgeRadius(world, particles, x1 + (x2 - x1) * progress, y1 + (y2 - y1) * progress, radius, force, false);
  }

  for (let step = 0; step < 40; step += 1) {
    const progress = step / 39;
    addFlyingPixel(world, particles, x1 + (x2 - x1) * progress, y1 + (y2 - y1) * progress, Material.Ember, FIRE_COLORS[3], 0.85);
  }
}

function applyHeroEffect(effect: HeroEffect, world: PixelWorld, particles: FlyingPixel[], x: number, y: number, reducedMotion: boolean) {
  if (effect.name === "inferno") {
    dislodgeRadius(world, particles, x, y, reducedMotion ? 8 : 15, reducedMotion ? 0.45 : 1.85, true);
    for (let index = 0; index < 34 && !reducedMotion; index += 1) {
      const angle = Math.random() * Math.PI * 2;
      const distance = Math.random() * 10;
      addFlyingPixel(world, particles, x + Math.cos(angle) * distance, y + Math.sin(angle) * distance, Material.Fire, FIRE_COLORS[index % FIRE_COLORS.length], 2.2);
    }
    return;
  }

  if (effect.name === "cleave") {
    const tilt = Math.random() > 0.5 ? -1 : 1;
    const length = reducedMotion ? 16 : 28;
    dislodgeLine(world, particles, x - length, y + length * 0.38 * tilt, x + length, y - length * 0.38 * tilt, 2.4, reducedMotion ? 0.4 : 1.35);
    return;
  }

  dislodgeRadius(world, particles, x, y, reducedMotion ? 7 : 11, reducedMotion ? 0.35 : 1.25, false);
}

function updatePowder(world: PixelWorld, x: number, y: number, index: number, direction: number) {
  const below = index + world.width;
  const downLeft = below - direction;
  const downRight = below + direction;

  return (
    tryMove(world, index, below) ||
    tryMove(world, index, downLeft) ||
    tryMove(world, index, downRight) ||
    tryMove(world, index, below - direction * 2) ||
    tryMove(world, index, below + direction * 2)
  );
}

function updateWater(world: PixelWorld, x: number, y: number, index: number, direction: number) {
  const neighbors = [index - 1, index + 1, index - world.width, index + world.width];
  for (const neighbor of neighbors) {
    if (world.material[neighbor] === Material.Fire || world.material[neighbor] === Material.Ember) {
      setCell(world, index, Material.Smoke, SMOKE_COLORS[1], 84);
      setCell(world, neighbor, Material.Smoke, SMOKE_COLORS[0], 50);
      return true;
    }
  }

  const below = index + world.width;
  if (tryMove(world, index, below) || tryMove(world, index, below + direction) || tryMove(world, index, below - direction)) return true;

  const spread = 1 + ((world.tick + x + y) % 3);
  for (let offset = 1; offset <= spread; offset += 1) {
    if (tryMove(world, index, index + direction * offset)) return true;
    if (tryMove(world, index, index - direction * offset)) return true;
  }

  return false;
}

function updateSmoke(world: PixelWorld, x: number, y: number, index: number, direction: number) {
  if (world.life[index] > 0) world.life[index] -= 1;
  if (world.life[index] <= 1 && pixelNoise(x, y, world.seed + world.tick) > 0.65) {
    setCell(world, index, Material.Air, VOID_COLOR);
    return true;
  }

  const above = index - world.width;
  return tryMove(world, index, above) || tryMove(world, index, above + direction) || tryMove(world, index, index + direction);
}

function updateFire(world: PixelWorld, x: number, y: number, index: number, direction: number) {
  if (world.life[index] > 0) world.life[index] -= 1;
  if (world.life[index] <= 1) {
    setCell(world, index, pixelNoise(x, y, world.seed + world.tick) > 0.55 ? Material.Smoke : Material.Air, SMOKE_COLORS[0], 62);
    return true;
  }

  const neighborOffsets = [-1, 1, -world.width, world.width];
  for (const offset of neighborOffsets) {
    const target = index + offset;
    const targetMaterial = world.material[target];

    if (targetMaterial === Material.Water) {
      setCell(world, index, Material.Smoke, SMOKE_COLORS[1], 75);
      setCell(world, target, Material.Smoke, SMOKE_COLORS[0], 50);
      return true;
    }

    if (isBurnable(targetMaterial) && pixelNoise(x + offset, y, world.seed + world.tick) > 0.82) {
      setCell(world, target, Material.Fire, FIRE_COLORS[Math.floor(Math.random() * FIRE_COLORS.length)], 125 + Math.floor(Math.random() * 72));
      world.updated[target] = world.tick;
    }
  }

  const above = index - world.width;
  if (tryMove(world, index, above) || tryMove(world, index, above + direction)) return true;

  if (pixelNoise(x, y, world.seed + world.tick) > 0.86) {
    setCell(world, index, Material.Smoke, SMOKE_COLORS[1], 62);
    return true;
  }

  return false;
}

function updateEmber(world: PixelWorld, x: number, y: number, index: number, direction: number) {
  if (world.life[index] > 0) world.life[index] -= 1;

  const below = index + world.width;
  if (world.material[below] === Material.Water) {
    setCell(world, index, Material.Smoke, SMOKE_COLORS[0], 44);
    return true;
  }

  if (world.life[index] <= 1) {
    setCell(world, index, Material.Smoke, SMOKE_COLORS[0], 48);
    return true;
  }

  if (pixelNoise(x, y, world.seed + world.tick) > 0.92) {
    const target = index + (pixelNoise(x, y, world.seed) > 0.5 ? 1 : -1);
    if (isBurnable(world.material[target])) setCell(world, target, Material.Fire, FIRE_COLORS[1], 118);
  }

  return tryMove(world, index, below) || tryMove(world, index, below + direction) || tryMove(world, index, below - direction);
}

function addWaterSources(world: PixelWorld) {
  if (world.tick % 2 !== 0) return;

  for (const source of world.waterSources) {
    const index = indexOf(world, source.x, source.y);
    const below = index + world.width;
    const direction = world.tick % 4 < 2 ? 1 : -1;
    const targets = [below, below + direction, below - direction, index];

    for (const target of targets) {
      if (target <= 0 || target >= world.material.length || !isEmptyForMotion(world.material[target])) continue;
      setCell(world, target, Material.Water, WATER_COLORS[(world.tick + source.x + target) % WATER_COLORS.length]);
      world.updated[target] = world.tick;
      break;
    }
  }
}

function stepWorld(world: PixelWorld, particles: FlyingPixel[]) {
  world.tick = (world.tick + 1) % 65000;
  addWaterSources(world);
  updateFlyingPixels(world, particles);

  const direction = world.tick % 2 === 0 ? 1 : -1;

  for (let y = world.height - 2; y >= 1; y -= 1) {
    if (direction === 1) {
      for (let x = 1; x < world.width - 1; x += 1) updateCell(world, x, y, direction);
    } else {
      for (let x = world.width - 2; x >= 1; x -= 1) updateCell(world, x, y, direction);
    }
  }
}

function updateCell(world: PixelWorld, x: number, y: number, direction: number) {
  const index = indexOf(world, x, y);
  if (world.updated[index] === world.tick) return;

  const material = world.material[index];
  if (material === Material.Dirt) updatePowder(world, x, y, index, direction);
  else if (material === Material.Water) updateWater(world, x, y, index, direction);
  else if (material === Material.Fire) updateFire(world, x, y, index, direction);
  else if (material === Material.Smoke) updateSmoke(world, x, y, index, direction);
  else if (material === Material.Ember) updateEmber(world, x, y, index, direction);
}

function renderWorld(
  canvas: HTMLCanvasElement,
  context: CanvasRenderingContext2D,
  world: PixelWorld,
  particles: FlyingPixel[],
) {
  const imageData = context.createImageData(world.width, world.height);
  const data = imageData.data;

  for (let index = 0; index < world.material.length; index += 1) {
    let color = world.color[index];
    const material = world.material[index];

    if (material === Material.Air) {
      color = world.color[index] || VOID_COLOR;
    } else if (material === Material.Fire) {
      color = FIRE_COLORS[(world.tick + index + world.life[index]) % FIRE_COLORS.length];
    } else if (material === Material.Smoke) {
      color = SMOKE_COLORS[(world.tick + index) % SMOKE_COLORS.length];
    } else if (material === Material.Water) {
      color = mixColor(world.color[index] || WATER_COLORS[1], WATER_COLORS[(world.tick + index) % WATER_COLORS.length], 0.35);
    } else if (material === Material.Ember) {
      color = mixColor(world.color[index], FIRE_COLORS[(world.tick + index) % FIRE_COLORS.length], 0.55);
    }

    const offset = index * 4;
    data[offset] = color >> 16;
    data[offset + 1] = (color >> 8) & 255;
    data[offset + 2] = color & 255;
    data[offset + 3] = 255;
  }

  for (const particle of particles) {
    const x = Math.floor(particle.x);
    const y = Math.floor(particle.y);
    if (x < 0 || y < 0 || x >= world.width || y >= world.height) continue;
    const index = (y * world.width + x) * 4;
    const color =
      particle.material === Material.Fire || particle.material === Material.Ember
        ? mixColor(particle.color, FIRE_COLORS[(world.tick + x + y) % FIRE_COLORS.length], 0.55)
        : particle.color;
    data[index] = color >> 16;
    data[index + 1] = (color >> 8) & 255;
    data[index + 2] = color & 255;
    data[index + 3] = 255;
  }

  context.imageSmoothingEnabled = false;
  context.putImageData(imageData, 0, 0);
  canvas.style.imageRendering = "pixelated";
}

interface PixelBreakStageProps {
  onFeedback: (kind: FeedbackKind) => void;
}

function PixelBreakStage({ onFeedback }: PixelBreakStageProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);
  const worldRef = useRef<PixelWorld | null>(null);
  const particlesRef = useRef<FlyingPixel[]>([]);
  const frameRef = useRef<number | null>(null);
  const previousFrameRef = useRef(0);
  const previousEffectRef = useRef<number | null>(null);
  const reducedMotionRef = useRef(false);

  const render = useCallback(() => {
    const canvas = canvasRef.current;
    const world = worldRef.current;
    if (!canvas || !world) return;

    const context = canvas.getContext("2d");
    if (!context) return;
    renderWorld(canvas, context, world, particlesRef.current);
  }, []);

  const runLoop = useCallback(
    (time: number) => {
      const world = worldRef.current;
      if (!world || reducedMotionRef.current) {
        frameRef.current = null;
        render();
        return;
      }

      if (time - previousFrameRef.current >= 33) {
        stepWorld(world, particlesRef.current);
        render();
        previousFrameRef.current = time;
      }

      frameRef.current = window.requestAnimationFrame(runLoop);
    },
    [render],
  );

  const startAnimation = useCallback(() => {
    if (frameRef.current !== null || reducedMotionRef.current) return;
    previousFrameRef.current = 0;
    frameRef.current = window.requestAnimationFrame(runLoop);
  }, [runLoop]);

  const resize = useCallback(() => {
    const canvas = canvasRef.current;
    const image = imageRef.current;
    if (!canvas || !image) return;

    const rect = canvas.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) return;

    const pixelSize = rect.width < 560 ? 3 : 4;
    const width = Math.max(112, Math.round(rect.width / pixelSize));
    const height = Math.max(96, Math.round(rect.height / pixelSize));

    if (canvas.width !== width || canvas.height !== height) {
      if (frameRef.current !== null) {
        window.cancelAnimationFrame(frameRef.current);
        frameRef.current = null;
      }
      canvas.width = width;
      canvas.height = height;
      worldRef.current = generateWorldFromImage(width, height, image);
      particlesRef.current = [];
      previousFrameRef.current = 0;
    }

    render();
    startAnimation();
  }, [render, startAnimation]);

  const triggerEffect = useCallback(
    (clientX?: number, clientY?: number) => {
      const canvas = canvasRef.current;
      const world = worldRef.current;
      if (!canvas || !world) return;

      const rect = canvas.getBoundingClientRect();
      const hitX = clientX === undefined ? rect.left + rect.width * (0.36 + Math.random() * 0.28) : clientX;
      const hitY = clientY === undefined ? rect.top + rect.height * (0.32 + Math.random() * 0.42) : clientY;
      const x = clamp(((hitX - rect.left) / rect.width) * world.width, 2, world.width - 3);
      const y = clamp(((hitY - rect.top) / rect.height) * world.height, 2, world.height - 3);
      let effectIndex = Math.floor(Math.random() * heroEffects.length);

      if (effectIndex === previousEffectRef.current) effectIndex = (effectIndex + 1) % heroEffects.length;
      previousEffectRef.current = effectIndex;

      const effect = heroEffects[effectIndex];
      applyHeroEffect(effect, world, particlesRef.current, x, y, reducedMotionRef.current);
      onFeedback(effect.feedback);
      render();
      startAnimation();
    },
    [onFeedback, render, startAnimation],
  );

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const setReducedMotion = () => {
      reducedMotionRef.current = media.matches;
      if (!media.matches) startAnimation();
    };
    setReducedMotion();
    media.addEventListener("change", setReducedMotion);

    const image = new Image();
    image.decoding = "async";
    image.src = images.homePhysics;
    image.onload = () => {
      imageRef.current = image;
      resize();
    };

    const observer = new ResizeObserver(resize);
    observer.observe(canvas);
    resize();

    return () => {
      media.removeEventListener("change", setReducedMotion);
      observer.disconnect();
      if (frameRef.current !== null) window.cancelAnimationFrame(frameRef.current);
    };
  }, [resize, startAnimation]);

  function handleStageClick(event: ReactMouseEvent<HTMLButtonElement>) {
    if (event.nativeEvent.detail === 0) {
      triggerEffect();
      return;
    }
    triggerEffect(event.clientX, event.clientY);
  }

  return (
    <button
      type="button"
      className="pixel-stage"
      data-feedback="manual"
      onClick={handleStageClick}
      aria-describedby="home-pixel-hint"
      aria-label="Break the cursed pixel wall"
    >
      <canvas ref={canvasRef} aria-hidden="true" />
    </button>
  );
}

export function HomeView({ characterReady, onFeedback, onView }: HomeViewProps) {
  const characterView = characterReady ? "play" : "build";
  const [shareOpen, setShareOpen] = useState(false);
  const [shareUrl, setShareUrl] = useState("");
  const qrCanvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!shareOpen) return;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setShareOpen(false);
    }

    window.addEventListener("keydown", handleKeyDown);

    const nextShareUrl = getShareUrl();
    setShareUrl(nextShareUrl);

    const canvas = qrCanvasRef.current;
    if (canvas) {
      void QRCode.toCanvas(canvas, nextShareUrl, {
        errorCorrectionLevel: "M",
        margin: 2,
        width: 280,
        color: {
          dark: "#101018",
          light: "#eee0b2",
        },
      });
    }

    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [shareOpen]);

  return (
    <div className="view home-view">
      <section className="home-hero" aria-labelledby="home-title">
        <PixelBreakStage onFeedback={onFeedback} />
        <span className="sr-only" id="home-pixel-hint">
          Click the background to break the pixel wall.
        </span>
        <div className="home-menu">
          <h1 id="home-title">Oath & Steel</h1>
          <div className="home-menu__actions" aria-label="Home menu">
            <button type="button" className="primary-action home-menu__button" onClick={() => onView(characterView)}>
              <Icon name={characterReady ? "play" : "user"} />
              <span>{characterReady ? "Play Character" : "Start Character"}</span>
            </button>
            <button type="button" className="home-menu__button" onClick={() => onView("dm")}>
              <Icon name="dm" />
              <span>DM Tracker</span>
            </button>
            <button type="button" className="home-menu__button" onClick={() => onView("reference")}>
              <Icon name="book" />
              <span>Reference</span>
            </button>
            <button type="button" className="home-menu__share-button" onClick={() => setShareOpen(true)}>
              <Icon name="share" />
              <span>Share</span>
            </button>
          </div>
        </div>
        {shareOpen ? (
          <div className="home-share-overlay" role="presentation" onClick={() => setShareOpen(false)}>
            <section
              className="home-share-dialog"
              role="dialog"
              aria-modal="true"
              aria-labelledby="home-share-title"
              onClick={(event) => event.stopPropagation()}
            >
              <div className="home-share-dialog__head">
                <h2 id="home-share-title">Share</h2>
                <button type="button" className="icon-button" aria-label="Close share QR code" onClick={() => setShareOpen(false)}>
                  <Icon name="close" />
                </button>
              </div>
              <canvas ref={qrCanvasRef} className="home-share-qr" aria-label={`QR code for ${shareUrl}`} />
              <p>{shareUrl}</p>
            </section>
          </div>
        ) : null}
      </section>
    </div>
  );
}
