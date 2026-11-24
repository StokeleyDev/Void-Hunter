/**
 * Cheap, GPU-friendly visual helpers for the Canvas2D renderer:
 *  - device-pixel-ratio aware canvas sizing (sharp output on phones / Retina)
 *  - a fake "bloom" pass built only from drawImage + composite modes (no shadowBlur, no ctx.filter),
 *    so it also runs on mobile and inside Telegram's WebView
 *  - an offscreen cache for static, gradient-heavy sector backgrounds
 */
import type { GameSettings } from '../types';
import { IS_MOBILE_DEVICE } from '../utils/device';

export type Quality = GameSettings['particlesLevel'];

/** Backing-store scale. Capped so 3x phones don't render 9x the pixels. */
export function getRenderScale(quality: Quality): number {
  const dpr = window.devicePixelRatio || 1;
  if (quality === 'low') return 1;
  const cap = quality === 'high' && !IS_MOBILE_DEVICE ? 2 : 1.75;
  return Math.max(1, Math.min(dpr, cap));
}

/**
 * Resizes the canvas backing store to CSS size * scale (only when it changed).
 * Returns the logical (CSS-pixel) size the game should simulate and draw in.
 */
export function syncCanvasSize(canvas: HTMLCanvasElement, scale: number): { width: number; height: number } {
  const cssW = window.innerWidth;
  const cssH = window.innerHeight;
  const pxW = Math.round(cssW * scale);
  const pxH = Math.round(cssH * scale);
  if (canvas.width !== pxW || canvas.height !== pxH) {
    canvas.width = pxW;
    canvas.height = pxH;
  }
  return { width: cssW, height: cssH };
}

function makeCanvas(w: number, h: number): HTMLCanvasElement {
  const c = document.createElement('canvas');
  c.width = Math.max(1, w);
  c.height = Math.max(1, h);
  return c;
}

/**
 * Bloom made of a small mip chain:
 *  1. downsample the frame to 1/4 and multiply it by itself 3x (v⁴ → a soft brightness threshold,
 *     so the dark background contributes almost nothing while bullets/sparks stay bright)
 *  2. downsample twice more (1/8, 1/16) — bilinear filtering does the blurring
 *  3. add every level back onto the frame with 'lighter' (additive) blending
 */
export class Bloom {
  private levels: { c: HTMLCanvasElement; ctx: CanvasRenderingContext2D }[] = [];
  private srcW = 0;
  private srcH = 0;

  private ensure(srcW: number, srcH: number) {
    if (srcW === this.srcW && srcH === this.srcH && this.levels.length) return;
    this.srcW = srcW;
    this.srcH = srcH;
    this.levels = [4, 8, 16].map(div => {
      const c = makeCanvas(Math.ceil(srcW / div), Math.ceil(srcH / div));
      const ctx = c.getContext('2d')!;
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'low';
      return { c, ctx };
    });
  }

  apply(target: CanvasRenderingContext2D, strength = 1) {
    const src = target.canvas;
    this.ensure(src.width, src.height);
    const [l1, l2, l3] = this.levels;

    // Level 1: downsample + square (threshold)
    l1.ctx.globalCompositeOperation = 'copy';
    l1.ctx.drawImage(src, 0, 0, l1.c.width, l1.c.height);
    l1.ctx.globalCompositeOperation = 'multiply';
    l1.ctx.drawImage(src, 0, 0, l1.c.width, l1.c.height);
    l1.ctx.drawImage(src, 0, 0, l1.c.width, l1.c.height);
    l1.ctx.drawImage(src, 0, 0, l1.c.width, l1.c.height); // v⁴: mid-tones (planets, nebulae) barely bloom

    // Levels 2-3: progressive downsample = progressively wider blur
    l2.ctx.globalCompositeOperation = 'copy';
    l2.ctx.drawImage(l1.c, 0, 0, l2.c.width, l2.c.height);
    l3.ctx.globalCompositeOperation = 'copy';
    l3.ctx.drawImage(l2.c, 0, 0, l3.c.width, l3.c.height);

    target.save();
    target.setTransform(1, 0, 0, 1, 0, 0);
    target.imageSmoothingEnabled = true;
    target.globalCompositeOperation = 'lighter';
    target.globalAlpha = 0.3 * strength;
    target.drawImage(l1.c, 0, 0, src.width, src.height);
    target.globalAlpha = 0.4 * strength;
    target.drawImage(l2.c, 0, 0, src.width, src.height);
    target.globalAlpha = 0.45 * strength;
    target.drawImage(l3.c, 0, 0, src.width, src.height);
    target.restore();
  }
}

/** Caches the static part of a sector background, keyed by sector + size + scale. */
export class BackgroundCache {
  private canvas: HTMLCanvasElement | null = null;
  private key = '';

  get(
    key: string,
    width: number,
    height: number,
    scale: number,
    paint: (ctx: CanvasRenderingContext2D, width: number, height: number) => void,
  ): HTMLCanvasElement {
    const fullKey = `${key}|${width}x${height}@${scale}`;
    if (!this.canvas || this.key !== fullKey) {
      this.canvas = makeCanvas(Math.round(width * scale), Math.round(height * scale));
      const ctx = this.canvas.getContext('2d')!;
      ctx.scale(scale, scale);
      paint(ctx, width, height);
      this.key = fullKey;
    }
    return this.canvas;
  }
}
