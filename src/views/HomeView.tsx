import { useCallback, useEffect, useRef, type MouseEvent as ReactMouseEvent } from "react";
import type { ViewId } from "../types";
import { Icon } from "../components/Icon";
import type { FeedbackKind } from "../lib/feedback";

interface HomeViewProps {
  characterReady: boolean;
  onFeedback: (kind: FeedbackKind) => void;
  onView: (view: ViewId) => void;
}

interface PixelWorld {
  width: number;
  height: number;
  cells: Uint8Array;
  seed: number;
}

interface PixelParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
  gravity: number;
  color: string;
}

interface HeroEffect {
  name: "blast" | "slash" | "spark" | "rupture";
  feedback: FeedbackKind;
}

const heroEffects: HeroEffect[] = [
  { name: "blast", feedback: "roll" },
  { name: "slash", feedback: "hpDown" },
  { name: "spark", feedback: "success" },
  { name: "rupture", feedback: "error" },
];

const pixelPalette = [
  "#060408",
  "#111018",
  "#17131a",
  "#211a1b",
  "#352a23",
  "#5d5134",
  "#b89e58",
  "#5e1817",
  "#3b6d4b",
  "#26351f",
];

function pixelNoise(x: number, y: number, seed: number) {
  let value = Math.imul(x + 101, 374761393) ^ Math.imul(y + 173, 668265263) ^ Math.imul(seed, 1274126177);
  value = Math.imul(value ^ (value >>> 13), 1274126177);
  return ((value ^ (value >>> 16)) >>> 0) / 4294967295;
}

function paintRect(world: PixelWorld, x: number, y: number, width: number, height: number, color: number) {
  const startX = Math.max(0, Math.floor(x));
  const startY = Math.max(0, Math.floor(y));
  const endX = Math.min(world.width, Math.ceil(x + width));
  const endY = Math.min(world.height, Math.ceil(y + height));

  for (let row = startY; row < endY; row += 1) {
    for (let column = startX; column < endX; column += 1) {
      world.cells[row * world.width + column] = color;
    }
  }
}

function generateWorld(width: number, height: number): PixelWorld {
  const seed = Math.floor(Math.random() * 900000) + 1000;
  const cells = new Uint8Array(width * height);
  const world = { width, height, cells, seed };
  const floorBase = height * 0.72;

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const floor =
        floorBase +
        Math.sin(x * 0.065) * height * 0.035 +
        Math.sin(x * 0.19 + seed * 0.001) * height * 0.018;
      const ceiling = height * 0.11 + Math.sin(x * 0.11) * height * 0.03 + pixelNoise(x, 2, seed) * height * 0.09;
      const wall = x < 5 + pixelNoise(1, y, seed) * 8 || x > width - 7 - pixelNoise(2, y, seed) * 8;
      const noise = pixelNoise(x, y, seed);
      let color = 1;

      if (y < ceiling || y > floor || wall) {
        color = noise > 0.74 ? 4 : noise > 0.43 ? 3 : 2;
      } else if (y > floor - 4) {
        color = noise > 0.52 ? 5 : 4;
      } else if (noise > 0.986) {
        color = noise > 0.994 ? 8 : 6;
      } else if (noise > 0.935) {
        color = 3;
      } else {
        color = y > height * 0.54 ? 2 : 1;
      }

      if (x > width * 0.2 && x < width * 0.76 && y > floor - 15 && y < floor - 11) color = 5;
      if (noise > 0.992 && y > height * 0.2) color = 7;

      cells[y * width + x] = color;
    }
  }

  const counterY = Math.floor(height * 0.62);
  paintRect(world, width * 0.18, counterY, width * 0.64, 4, 5);
  paintRect(world, width * 0.21, counterY + 4, width * 0.58, 8, 4);
  paintRect(world, width * 0.24, counterY - 13, 18, 13, 3);
  paintRect(world, width * 0.52, counterY - 18, 22, 18, 4);
  paintRect(world, width * 0.67, counterY - 11, 14, 11, 3);

  const lanterns = [
    { x: width * 0.26, y: height * 0.35, color: 6 },
    { x: width * 0.58, y: height * 0.31, color: 8 },
    { x: width * 0.78, y: height * 0.46, color: 6 },
  ];

  for (const lantern of lanterns) {
    const radius = height * 0.12;
    for (let y = Math.floor(lantern.y - radius); y <= Math.ceil(lantern.y + radius); y += 1) {
      for (let x = Math.floor(lantern.x - radius); x <= Math.ceil(lantern.x + radius); x += 1) {
        if (x < 0 || y < 0 || x >= width || y >= height) continue;
        const distance = Math.hypot(x - lantern.x, y - lantern.y);
        if (distance < radius && pixelNoise(x, y, seed + 33) > distance / radius) {
          cells[y * width + x] = distance < radius * 0.24 ? lantern.color : 9;
        }
      }
    }
  }

  return world;
}

function carveCircle(world: PixelWorld, centerX: number, centerY: number, radius: number, edgeColor?: number) {
  const minX = Math.max(0, Math.floor(centerX - radius - 2));
  const maxX = Math.min(world.width - 1, Math.ceil(centerX + radius + 2));
  const minY = Math.max(0, Math.floor(centerY - radius - 2));
  const maxY = Math.min(world.height - 1, Math.ceil(centerY + radius + 2));

  for (let y = minY; y <= maxY; y += 1) {
    for (let x = minX; x <= maxX; x += 1) {
      const distance = Math.hypot(x - centerX, y - centerY);
      const roughRadius = radius * (0.82 + pixelNoise(x, y, world.seed + 97) * 0.34);
      const index = y * world.width + x;

      if (distance < roughRadius) {
        world.cells[index] = 0;
      } else if (edgeColor && distance < radius + 2 && pixelNoise(x, y, world.seed + 191) > 0.45) {
        world.cells[index] = edgeColor;
      }
    }
  }
}

function carveLine(world: PixelWorld, x1: number, y1: number, x2: number, y2: number, width: number, edgeColor?: number) {
  const steps = Math.max(1, Math.ceil(Math.hypot(x2 - x1, y2 - y1) * 1.8));

  for (let step = 0; step <= steps; step += 1) {
    const progress = step / steps;
    carveCircle(world, x1 + (x2 - x1) * progress, y1 + (y2 - y1) * progress, width, edgeColor);
  }
}

function spawnBurst(
  particles: PixelParticle[],
  x: number,
  y: number,
  count: number,
  colors: string[],
  speed: number,
  reducedMotion: boolean,
) {
  if (reducedMotion) return;

  for (let index = 0; index < count; index += 1) {
    const angle = Math.random() * Math.PI * 2;
    const velocity = speed * (0.25 + Math.random());
    particles.push({
      x,
      y,
      vx: Math.cos(angle) * velocity,
      vy: Math.sin(angle) * velocity - Math.random() * 0.45,
      life: 24 + Math.floor(Math.random() * 22),
      maxLife: 46,
      size: Math.random() > 0.72 ? 2 : 1,
      gravity: 0.045,
      color: colors[index % colors.length],
    });
  }
}

function applyHeroEffect(effect: HeroEffect, world: PixelWorld, x: number, y: number, particles: PixelParticle[], reducedMotion: boolean) {
  if (effect.name === "blast") {
    carveCircle(world, x, y, 8 + Math.random() * 7, 7);
    spawnBurst(particles, x, y, 70, [pixelPalette[6], pixelPalette[7], pixelPalette[5], pixelPalette[3]], 1.25, reducedMotion);
    return;
  }

  if (effect.name === "slash") {
    const tilt = Math.random() > 0.5 ? -1 : 1;
    const length = 16 + Math.random() * 15;
    const x1 = x - length;
    const y1 = y + length * 0.42 * tilt;
    const x2 = x + length;
    const y2 = y - length * 0.42 * tilt;
    carveLine(world, x1, y1, x2, y2, 2.2, 6);

    if (!reducedMotion) {
      for (let step = 0; step < 32; step += 1) {
        const progress = step / 31;
        particles.push({
          x: x1 + (x2 - x1) * progress,
          y: y1 + (y2 - y1) * progress,
          vx: (Math.random() - 0.5) * 0.35,
          vy: -0.25 - Math.random() * 0.35,
          life: 14 + Math.floor(Math.random() * 10),
          maxLife: 24,
          size: 1,
          gravity: 0.015,
          color: pixelPalette[6],
        });
      }
    }
    return;
  }

  if (effect.name === "spark") {
    for (let ray = 0; ray < 9; ray += 1) {
      const angle = (Math.PI * 2 * ray) / 9 + Math.random() * 0.24;
      const length = 10 + Math.random() * 17;
      carveLine(world, x, y, x + Math.cos(angle) * length, y + Math.sin(angle) * length, 1.15, 8);
    }
    spawnBurst(particles, x, y, 48, [pixelPalette[8], pixelPalette[6], pixelPalette[9]], 0.9, reducedMotion);
    return;
  }

  const height = 18 + Math.random() * 20;
  carveLine(world, x, y - height * 0.55, x + (Math.random() - 0.5) * 7, y + height * 0.7, 3.4, 7);
  carveCircle(world, x, y, 5 + Math.random() * 3, 7);
  spawnBurst(particles, x, y, 56, [pixelPalette[7], pixelPalette[4], pixelPalette[2]], 0.75, reducedMotion);
}

interface PixelBreakStageProps {
  onFeedback: (kind: FeedbackKind) => void;
}

function PixelBreakStage({ onFeedback }: PixelBreakStageProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const worldRef = useRef<PixelWorld | null>(null);
  const particlesRef = useRef<PixelParticle[]>([]);
  const frameRef = useRef<number | null>(null);
  const previousEffectRef = useRef<number | null>(null);
  const reducedMotionRef = useRef(false);

  const render = useCallback(() => {
    const canvas = canvasRef.current;
    const world = worldRef.current;
    if (!canvas || !world) return;

    const context = canvas.getContext("2d");
    if (!context) return;

    context.imageSmoothingEnabled = false;
    context.clearRect(0, 0, world.width, world.height);
    context.fillStyle = pixelPalette[0];
    context.fillRect(0, 0, world.width, world.height);

    let activeColor = "";
    for (let y = 0; y < world.height; y += 1) {
      for (let x = 0; x < world.width; x += 1) {
        const colorIndex = world.cells[y * world.width + x];
        if (colorIndex === 0) continue;
        const color = pixelPalette[colorIndex];
        if (color !== activeColor) {
          context.fillStyle = color;
          activeColor = color;
        }
        context.fillRect(x, y, 1, 1);
      }
    }

    for (const particle of particlesRef.current) {
      context.globalAlpha = Math.max(0, particle.life / particle.maxLife);
      context.fillStyle = particle.color;
      context.fillRect(particle.x, particle.y, particle.size, particle.size);
    }
    context.globalAlpha = 1;
  }, []);

  const startAnimation = useCallback(() => {
    if (frameRef.current !== null) return;

    const tick = () => {
      const nextParticles: PixelParticle[] = [];
      for (const particle of particlesRef.current) {
        particle.life -= 1;
        if (particle.life <= 0) continue;
        particle.vy += particle.gravity;
        particle.x += particle.vx;
        particle.y += particle.vy;
        nextParticles.push(particle);
      }
      particlesRef.current = nextParticles;
      render();

      if (nextParticles.length > 0) {
        frameRef.current = window.requestAnimationFrame(tick);
      } else {
        frameRef.current = null;
      }
    };

    frameRef.current = window.requestAnimationFrame(tick);
  }, [render]);

  const triggerEffect = useCallback(
    (clientX?: number, clientY?: number) => {
      const canvas = canvasRef.current;
      const world = worldRef.current;
      if (!canvas || !world) return;

      const rect = canvas.getBoundingClientRect();
      const hitX = clientX === undefined ? rect.left + rect.width * (0.38 + Math.random() * 0.24) : clientX;
      const hitY = clientY === undefined ? rect.top + rect.height * (0.36 + Math.random() * 0.34) : clientY;
      const x = Math.max(0, Math.min(world.width - 1, ((hitX - rect.left) / rect.width) * world.width));
      const y = Math.max(0, Math.min(world.height - 1, ((hitY - rect.top) / rect.height) * world.height));
      let effectIndex = Math.floor(Math.random() * heroEffects.length);

      if (effectIndex === previousEffectRef.current) effectIndex = (effectIndex + 1) % heroEffects.length;
      previousEffectRef.current = effectIndex;

      const effect = heroEffects[effectIndex];
      applyHeroEffect(effect, world, x, y, particlesRef.current, reducedMotionRef.current);
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
    };
    setReducedMotion();
    media.addEventListener("change", setReducedMotion);

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      if (rect.width <= 0 || rect.height <= 0) return;

      const pixelSize = rect.width < 560 ? 4 : 5;
      const width = Math.max(96, Math.round(rect.width / pixelSize));
      const height = Math.max(86, Math.round(rect.height / pixelSize));

      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width;
        canvas.height = height;
        worldRef.current = generateWorld(width, height);
        particlesRef.current = [];
      }

      render();
    };

    const observer = new ResizeObserver(resize);
    observer.observe(canvas);
    resize();

    return () => {
      media.removeEventListener("change", setReducedMotion);
      observer.disconnect();
      if (frameRef.current !== null) window.cancelAnimationFrame(frameRef.current);
    };
  }, [render]);

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

  return (
    <div className="view home-view">
      <section className="home-hero" aria-labelledby="home-title">
        <PixelBreakStage onFeedback={onFeedback} />
        <span className="sr-only" id="home-pixel-hint">
          Click the background to break the pixel wall.
        </span>
        <div className="home-menu">
          <h1 id="home-title">Shadow Bargains</h1>
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
          </div>
        </div>
      </section>
    </div>
  );
}
