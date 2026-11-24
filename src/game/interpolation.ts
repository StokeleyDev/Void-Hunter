/**
 * Render interpolation for the fixed 60 Hz simulation.
 *
 * The game updates in fixed 16.7 ms steps, but monitors refresh at 90/120/144 Hz. Drawing the raw
 * simulation state makes motion stutter (some frames repeat a position, others jump two steps).
 * Instead we draw every entity between its previous and current simulated position:
 *   pos = prev + (cur - prev) * alpha,   alpha = leftover accumulator / FIXED_STEP
 *
 * Positions are swapped in just for the draw call and restored right after, so the 1100-line
 * renderer does not need to know about interpolation at all.
 */
import type { GameState } from '../types';

interface Interp {
  x: number;
  y: number;
  _px?: number;
  _py?: number;
  _cx?: number;
  _cy?: number;
}

/** Beyond this jump (px) an entity is assumed to have teleported/wrapped — don't smear it. */
const MAX_JUMP = 120;

function lists(g: GameState): Interp[][] {
  const out: Interp[][] = [g.enemies, g.bullets, g.eBullets, g.gems, g.particles, g.superPickups];
  if (g.hazardAsteroids) out.push(g.hazardAsteroids);
  return out;
}

/** Call before every simulation step (including hit-stop frames). */
export function snapshotPositions(g: GameState) {
  if (g.player) {
    const p = g.player as Interp;
    p._px = p.x;
    p._py = p.y;
  }
  for (const list of lists(g)) {
    for (let i = 0; i < list.length; i++) {
      const e = list[i];
      e._px = e.x;
      e._py = e.y;
    }
  }
}

function lerpOne(e: Interp, alpha: number) {
  if (e._px === undefined || e._py === undefined) return;
  const dx = e.x - e._px;
  const dy = e.y - e._py;
  if (dx === 0 && dy === 0) return;
  if (Math.abs(dx) + Math.abs(dy) > MAX_JUMP) return;
  e._cx = e.x;
  e._cy = e.y;
  e.x = e._px + dx * alpha;
  e.y = e._py + dy * alpha;
}

function restoreOne(e: Interp) {
  if (e._cx === undefined || e._cy === undefined) return;
  e.x = e._cx;
  e.y = e._cy;
  e._cx = undefined;
  e._cy = undefined;
}

/** Swap interpolated positions in. Must be paired with restorePositions(). */
export function applyInterpolation(g: GameState, alpha: number) {
  if (alpha >= 1) return;
  if (g.player) lerpOne(g.player as Interp, alpha);
  for (const list of lists(g)) {
    for (let i = 0; i < list.length; i++) lerpOne(list[i], alpha);
  }
}

export function restorePositions(g: GameState) {
  if (g.player) restoreOne(g.player as Interp);
  for (const list of lists(g)) {
    for (let i = 0; i < list.length; i++) restoreOne(list[i]);
  }
}
