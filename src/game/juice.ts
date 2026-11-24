/**
 * "Game feel" layer: hit flashes, knockback, directional hit sparks, damage vignette, smooth camera
 * shake, parallax star field, chained boss-death explosions and slow motion.
 *
 * Everything here works by observing the game state (e.g. an enemy's HP dropped since the last step)
 * instead of hooking the ~40 places that deal damage, so weapon code stays untouched.
 */
import type { GameState, Star } from '../types';
import { IS_MOBILE_DEVICE } from '../utils/device';

const rnd = (a: number, b: number) => Math.random() * (b - a) + a;

// ---------------------------------------------------------------- star field

/** Three parallax layers: many dim far stars, fewer mid stars, a handful of bright near streaks. */
export function makeStars(width: number, height: number, cols: string[] = ['#ffffff']): Star[] {
  const area = (width * height) / (1280 * 800);
  const density = Math.max(0.5, Math.min(1.6, area)) * (IS_MOBILE_DEVICE ? 0.75 : 1);
  const stars: Star[] = [];
  const add = (count: number, layer: 0 | 1 | 2, r: [number, number], s: [number, number], a: [number, number]) => {
    for (let i = 0; i < Math.round(count * density); i++) {
      stars.push({
        x: Math.random() * width,
        y: Math.random() * height,
        r: rnd(r[0], r[1]),
        s: rnd(s[0], s[1]),
        a: rnd(a[0], a[1]),
        col: cols[Math.floor(Math.random() * cols.length)],
        layer,
        tw: rnd(0.02, 0.07),
        ph: Math.random() * Math.PI * 2,
      });
    }
  };
  add(110, 0, [0.3, 0.8], [0.06, 0.16], [0.2, 0.5]);
  add(50, 1, [0.7, 1.3], [0.25, 0.45], [0.4, 0.75]);
  add(12, 2, [1.2, 2.0], [0.9, 1.4], [0.55, 0.9]);
  return stars;
}

/** How strongly each layer follows the player's position (bigger = closer). */
const PARALLAX = [0.015, 0.04, 0.09];

export function drawStars(
  ctx: CanvasRenderingContext2D, stars: Star[], width: number, height: number,
  dt: number, frame: number, camX: number, camY: number,
) {
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  for (const s of stars) {
    const layer = s.layer ?? 1;
    s.y += s.s * 1.5 * dt;
    if (s.y > height + 10) {
      s.y = -10;
      s.x = Math.random() * width;
    }
    const k = PARALLAX[layer];
    const x = (((s.x - camX * k) % width) + width) % width;
    const y = (((s.y - camY * k) % (height + 20)) + height + 20) % (height + 20) - 10;
    const twinkle = 0.75 + 0.25 * Math.sin(frame * (s.tw ?? 0.04) + (s.ph ?? 0));
    ctx.globalAlpha = s.a * twinkle;
    if (layer === 2) {
      // Near stars: short motion streaks
      ctx.strokeStyle = s.col || '#ffffff';
      ctx.lineWidth = s.r;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x, y - s.s * 9);
      ctx.stroke();
    } else {
      ctx.fillStyle = s.col || '#ffffff';
      ctx.fillRect(x - s.r, y - s.r, s.r * 2, s.r * 2);
    }
  }
  ctx.restore();
}

/** Faint, sector-tinted nebula clouds — painted once into the cached background. */
export function paintNebulaHaze(ctx: CanvasRenderingContext2D, width: number, height: number, seed: string, cols: string[]) {
  // Deterministic per-sector layout so the cached background doesn't reshuffle on resize
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) h = Math.imul(h ^ seed.charCodeAt(i), 16777619);
  const rand = () => {
    h = Math.imul(h ^ (h >>> 15), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    return ((h ^= h >>> 16) >>> 0) / 4294967296;
  };
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  for (let i = 0; i < 6; i++) {
    const x = rand() * width;
    const y = rand() * height;
    const r = (0.25 + rand() * 0.45) * Math.max(width, height);
    const col = cols[i % cols.length];
    const g = ctx.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, hexA(col, 0.07));
    g.addColorStop(0.5, hexA(col, 0.025));
    g.addColorStop(1, hexA(col, 0));
    ctx.fillStyle = g;
    ctx.fillRect(x - r, y - r, r * 2, r * 2);
  }
  ctx.restore();
}

function hexA(col: string, a: number): string {
  const m = /^#([0-9a-f]{6})$/i.exec(col);
  if (!m) return `rgba(148, 163, 184, ${a})`;
  const n = parseInt(m[1], 16);
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${a})`;
}

// ---------------------------------------------------------------- glow sprites

const glowCache = new Map<string, HTMLCanvasElement>();

/** A soft round additive glow in the given colour (cached per colour). */
export function glowSprite(col: string): HTMLCanvasElement {
  let c = glowCache.get(col);
  if (!c) {
    c = document.createElement('canvas');
    c.width = c.height = 64;
    const g = c.getContext('2d')!;
    const grad = g.createRadialGradient(32, 32, 0, 32, 32, 32);
    grad.addColorStop(0, 'rgba(255,255,255,1)');
    grad.addColorStop(0.15, col);
    grad.addColorStop(0.5, hexA(col, 0.25));
    grad.addColorStop(1, hexA(col, 0));
    g.fillStyle = grad;
    g.fillRect(0, 0, 64, 64);
    if (glowCache.size > 64) glowCache.clear();
    glowCache.set(col, c);
  }
  return c;
}

// ---------------------------------------------------------------- camera shake

/**
 * Smooth camera shake: layered sines instead of a fresh random offset every frame, plus a little
 * rotation. Feels heavier and doesn't turn into high-frequency jitter on 144 Hz screens.
 */
export function applyCameraShake(ctx: CanvasRenderingContext2D, g: GameState, width: number, height: number, factor: number, dt: number) {
  const s = g.screenShake;
  if (s <= 0.1) return;
  const t = performance.now() / 1000;
  const amp = s * factor;
  const nx = Math.sin(t * 47.3) * 0.6 + Math.sin(t * 83.1 + 1.3) * 0.4;
  const ny = Math.sin(t * 52.7 + 2.1) * 0.6 + Math.sin(t * 91.9 + 0.4) * 0.4;
  const nr = Math.sin(t * 38.5 + 4.2);
  ctx.translate(width / 2, height / 2);
  ctx.rotate(nr * amp * 0.0012);
  ctx.translate(-width / 2 + nx * amp, -height / 2 + ny * amp);
  g.screenShake *= Math.pow(0.88, dt);
}

// ---------------------------------------------------------------- per-step update

export interface JuiceHooks {
  explode: (x: number, y: number, col: string, big: boolean) => void;
}

/** Call once per fixed simulation step, after damage has been applied and before dead enemies are removed. */
export function updateJuice(g: GameState, hooks: JuiceHooks) {
  const p = g.player;

  // Enemy hit reactions
  for (const e of g.enemies) {
    const prev = e._prevHp ?? e.hp;
    if (e._flash && e._flash > 0) e._flash--;
    if (e.hp < prev && e.hp > 0) {
      const dealt = prev - e.hp;
      const fresh = !e._flash;
      e._flash = 4;
      if (p && fresh) {
        const dx = e.x - p.x;
        const dy = e.y - p.y;
        const d = Math.hypot(dx, dy) || 1;
        const ux = dx / d;
        const uy = dy / d;
        // Knockback for regular enemies on meaningful hits (bosses don't budge)
        if (!e.boss && !e.miniboss && dealt >= e.maxHp * 0.06) {
          const kb = Math.min(6, 2 + (dealt / e.maxHp) * 10) * Math.max(0.35, 1 - e.r / 40);
          e.x += ux * kb;
          e.y += uy * kb;
        }
        // Directional sparks on the side facing the shooter
        const n = IS_MOBILE_DEVICE ? 2 : 3;
        for (let i = 0; i < n; i++) {
          const a = Math.atan2(uy, ux) + Math.PI + rnd(-0.7, 0.7);
          const sp = rnd(2.5, 5.5);
          g.particles.push({
            x: e.x - ux * e.r * 0.8,
            y: e.y - uy * e.r * 0.8,
            vx: Math.cos(a) * sp,
            vy: Math.sin(a) * sp,
            life: rnd(0.35, 0.6),
            col: Math.random() < 0.5 ? '#ffffff' : e.col,
            r: rnd(1, 1.8),
            type: 'spark',
            friction: 0.9,
          });
        }
      }
    }
    e._prevHp = e.hp;
  }

  // Player damage vignette
  if (p) {
    const pp = p as typeof p & { _prevHp?: number };
    if (pp._prevHp !== undefined && p.hp < pp._prevHp) g.hurtFlash = 18;
    pp._prevHp = p.hp;
  }
  if (g.hurtFlash && g.hurtFlash > 0) g.hurtFlash--;

  // Chained explosions after a boss / mini-boss dies
  if (g.deathSequence && g.deathSequence.length) {
    for (const ds of g.deathSequence) {
      ds.t--;
      if (ds.t <= 0 && ds.left > 0) {
        const a = Math.random() * Math.PI * 2;
        const r = Math.random() * ds.r;
        hooks.explode(ds.x + Math.cos(a) * r, ds.y + Math.sin(a) * r, ds.col, ds.left === 1 && ds.boss);
        g.screenShake = Math.max(g.screenShake, ds.boss ? 9 : 5);
        ds.left--;
        ds.t = ds.boss ? 7 : 6;
      }
    }
    g.deathSequence = g.deathSequence.filter(ds => ds.left > 0);
  }
}

/** Queue a short kill-cam for a big enemy: chained explosions + slow motion. */
export function startDeathSequence(g: GameState, x: number, y: number, r: number, col: string, boss: boolean) {
  (g.deathSequence ??= []).push({ x, y, r: r * 1.1, col, t: 4, left: boss ? 9 : 4, boss });
  g.timeScale = Math.min(g.timeScale ?? 1, boss ? 0.3 : 0.55);
}

/** Ease slow motion back to normal speed (real-time, called once per rendered frame). */
export function recoverTimeScale(g: GameState, realDtFrames: number) {
  if (g.timeScale === undefined || g.timeScale >= 1) return 1;
  g.timeScale = Math.min(1, g.timeScale + 0.012 * realDtFrames);
  return g.timeScale;
}

// ---------------------------------------------------------------- overlays

export function drawHurtVignette(ctx: CanvasRenderingContext2D, g: GameState, width: number, height: number) {
  const f = g.hurtFlash ?? 0;
  if (f <= 0) return;
  const a = (f / 18) * 0.45;
  const r = Math.hypot(width, height) / 2;
  const grad = ctx.createRadialGradient(width / 2, height / 2, r * 0.45, width / 2, height / 2, r);
  grad.addColorStop(0, 'rgba(239, 68, 68, 0)');
  grad.addColorStop(1, `rgba(239, 68, 68, ${a})`);
  ctx.save();
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, width, height);
  ctx.restore();
}
