/**
 * Per-frame Canvas rendering for GameCanvas (background, entities, effects, HUD overlays, joystick).
 * Extracted from GameCanvas.tsx; pure drawing over the shared game state — no React state updates.
 */
import type { MutableRefObject } from 'react';
import { GameState, Enemy, Bullet, EnemyBullet, Gem, Particle, LightningBolt, Player, Skin, RocketSkin, SectorConfig, SECTORS, DamageNumber, SuperPickup, SuperPickupType, GameSettings, getLocalizedSector } from '../types';
import { spawnEnemy, spawnMiniBoss, spawnBoss } from '../utils/enemies';
import { drawProceduralEnemy, drawProceduralRocket, drawProceduralPlayer } from '../utils/textures';
import { Sound } from '../utils/sound';
import { Music } from '../utils/music';
import { spd, getWeaponLevel } from '../utils/upgrades';
import { SpatialHash } from '../utils/spatial-hash';
import { compactInPlace, sampleWhere } from '../utils/array';
import { PerkIcon, BossIcon, getShipIcon, getBossIcon } from '../utils/icons';
import { useI18n, tDirect } from '../i18n';
import type { Language } from '../i18n';

const rnd = (a: number, b: number) => Math.random() * (b - a) + a;
import { IS_MOBILE_DEVICE } from '../utils/device';

type Ref<T> = MutableRefObject<T>;

export interface RenderFrameDeps {
  ctx: CanvasRenderingContext2D;
  width: number;
  height: number;
  G: Ref<GameState>;
  languageRef: Ref<Language>;
  callbacksRef: Ref<{ settings?: GameSettings; isEndless?: boolean; selectedSector?: SectorConfig; language?: Language }>;
  shipSheet: Ref<HTMLImageElement | null>;
  bossSheet: Ref<HTMLImageElement | null>;
  pickupSheet: Ref<HTMLImageElement | null>;
  joyBase: Ref<{ x: number; y: number }>;
  joyThumb: Ref<{ x: number; y: number }>;
  joyActive: Ref<boolean>;
  selectedSkin: string;
}

export function renderFrame({
  ctx, width, height, G, languageRef, callbacksRef,
  shipSheet, bossSheet, pickupSheet, joyBase, joyThumb, joyActive, selectedSkin,
}: RenderFrameDeps): void {
  // Draw Sector-themed Space Background
  const sec = G.current.currentSector || SECTORS[0];
  const bgGrad = ctx.createLinearGradient(0, 0, 0, height);
  bgGrad.addColorStop(0, sec.palette.bgGradientTop);
  bgGrad.addColorStop(1, sec.palette.bgGradientBottom);
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, width, height);

  // Sector-specific Celestial Background elements
  if (sec.id === 'earth') {
    // Earth horizon in background
    ctx.save();
    const earthY = height + width * 0.55;
    const earthR = width * 0.92;

    // Atmosphere glow
    const atmGrad = ctx.createRadialGradient(width / 2, earthY, earthR * 0.88, width / 2, earthY, earthR * 1.06);
    atmGrad.addColorStop(0, 'rgba(56, 189, 248, 0)');
    atmGrad.addColorStop(0.5, 'rgba(14, 165, 233, 0.16)');
    atmGrad.addColorStop(0.85, 'rgba(56, 189, 248, 0.32)');
    atmGrad.addColorStop(1, 'rgba(56, 189, 248, 0)');
    ctx.fillStyle = atmGrad;
    ctx.beginPath();
    ctx.arc(width / 2, earthY, earthR * 1.06, 0, Math.PI * 2);
    ctx.fill();

    // Earth surface
    const surfGrad = ctx.createRadialGradient(width / 2, earthY, earthR * 0.3, width / 2, earthY, earthR);
    surfGrad.addColorStop(0, '#064e3b');
    surfGrad.addColorStop(0.35, '#0369a1');
    surfGrad.addColorStop(0.7, '#075985');
    surfGrad.addColorStop(0.95, '#0c4a6e');
    surfGrad.addColorStop(1, '#082f49');
    ctx.fillStyle = surfGrad;
    ctx.beginPath();
    ctx.arc(width / 2, earthY, earthR, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = 'rgba(125, 211, 252, 0.45)';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.restore();
  } else if (sec.id === 'nebula') {
    // Glowing Omega Nebula gas clouds
    ctx.save();
    const g1 = ctx.createRadialGradient(width * 0.25, height * 0.35, 30, width * 0.25, height * 0.35, width * 0.55);
    g1.addColorStop(0, 'rgba(192, 132, 252, 0.18)');
    g1.addColorStop(0.5, 'rgba(232, 121, 249, 0.08)');
    g1.addColorStop(1, 'transparent');
    ctx.fillStyle = g1;
    ctx.beginPath();
    ctx.arc(width * 0.25, height * 0.35, width * 0.55, 0, Math.PI * 2);
    ctx.fill();

    const g2 = ctx.createRadialGradient(width * 0.75, height * 0.65, 40, width * 0.75, height * 0.65, width * 0.6);
    g2.addColorStop(0, 'rgba(244, 114, 182, 0.15)');
    g2.addColorStop(0.6, 'rgba(168, 85, 247, 0.06)');
    g2.addColorStop(1, 'transparent');
    ctx.fillStyle = g2;
    ctx.beginPath();
    ctx.arc(width * 0.75, height * 0.65, width * 0.6, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  } else if (sec.id === 'asteroid' && G.current.asteroids) {
    // Drifting background asteroids
    ctx.save();
    for (const ast of G.current.asteroids) {
      ast.y += ast.spd;
      ast.rot += ast.rotSpd;
      if (ast.y > height + 50) {
        ast.y = -50;
        ast.x = Math.random() * width;
      }
      ctx.save();
      ctx.translate(ast.x, ast.y);
      ctx.rotate(ast.rot);
      ctx.fillStyle = ast.col;
      ctx.strokeStyle = '#78350f';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      const sides = 6;
      for (let i = 0; i < sides; i++) {
        const a = (i / sides) * Math.PI * 2;
        const r = ast.r * (0.8 + ((i % 2) * 0.35));
        const ax = Math.cos(a) * r;
        const ay = Math.sin(a) * r;
        if (i === 0) ctx.moveTo(ax, ay);
        else ctx.lineTo(ax, ay);
      }
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    }
    ctx.restore();
  } else if (sec.id === 'singularity') {
    // Supermassive Black Hole with fiery accretion disk
    ctx.save();
    const bhX = width * 0.82;
    const bhY = height * 0.22;
    const bhR = spd(32);
    const time = G.current.frame * 0.02;

    const diskGrad = ctx.createRadialGradient(bhX, bhY, bhR * 0.9, bhX, bhY, bhR * 3.2);
    diskGrad.addColorStop(0, 'rgba(251, 146, 60, 0)');
    diskGrad.addColorStop(0.25, 'rgba(244, 63, 94, 0.45)');
    diskGrad.addColorStop(0.6, 'rgba(251, 191, 36, 0.25)');
    diskGrad.addColorStop(1, 'transparent');
    ctx.fillStyle = diskGrad;
    ctx.beginPath();
    ctx.arc(bhX, bhY, bhR * 3.2, 0, Math.PI * 2);
    ctx.fill();

    ctx.save();
    ctx.translate(bhX, bhY);
    ctx.rotate(Math.PI / 6 + Math.sin(time * 0.5) * 0.05);
    ctx.scale(1, 0.35);
    ctx.strokeStyle = 'rgba(251, 191, 36, 0.65)';
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.arc(0, 0, bhR * 2.2, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();

    // Event Horizon
    ctx.fillStyle = '#000000';
    ctx.beginPath();
    ctx.arc(bhX, bhY, bhR, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.85)';
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.restore();
  }

  // Camera screen shake calculations
  ctx.save();
  const shakeFactor = callbacksRef.current.settings?.shakeIntensity ?? 1.0;
  if (G.current.screenShake > 0.1 && G.current.state === 'playing') {
    const shakeX = (Math.random() * 2 - 1) * G.current.screenShake * shakeFactor;
    const shakeY = (Math.random() * 2 - 1) * G.current.screenShake * shakeFactor;
    ctx.translate(shakeX, shakeY);
    G.current.screenShake *= 0.9;
  }

  // Draw background stars with sector colors
  for (const s of G.current.stars) {
    s.y += s.s * 1.5;
    if (s.y > height) {
      s.y = 0;
      s.x = Math.random() * width;
    }
    ctx.fillStyle = s.col || `rgba(255, 255, 255, ${s.a})`;
    ctx.globalAlpha = s.a;
    ctx.beginPath();
    ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;

  // Render Sector Hazards (Stage 4)
  if (G.current.state !== 'menu') {
    // 1. Nebula Ion Storm Strikes
    for (const hz of G.current.ionHazards || []) {
      ctx.save();
      if (hz.timer > 0) {
        const progress = hz.timer / hz.maxTimer;
        const pulse = 0.5 + Math.sin(G.current.frame * 0.2) * 0.25;
        
        ctx.fillStyle = `rgba(192, 132, 252, ${0.08 * pulse})`;
        ctx.beginPath();
        ctx.arc(hz.x, hz.y, hz.r, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = `rgba(192, 132, 252, ${0.4 + pulse * 0.4})`;
        ctx.lineWidth = 1.5;
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        ctx.arc(hz.x, hz.y, hz.r, 0, Math.PI * 2);
        ctx.stroke();

        ctx.setLineDash([]);
        ctx.strokeStyle = '#c084fc';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(hz.x, hz.y, hz.r, -Math.PI / 2, -Math.PI / 2 + (1 - progress) * Math.PI * 2);
        ctx.stroke();

        ctx.font = '900 10px "Exo 2", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillStyle = '#e9d5ff';
        ctx.fillText(tDirect('ionStrike', undefined, languageRef.current), hz.x, hz.y);
      } else if (hz.active) {
        ctx.strokeStyle = '#f3e8ff';
        ctx.lineWidth = 4;
        ctx.shadowColor = '#c084fc';
        ctx.shadowBlur = 15;
        ctx.beginPath();
        ctx.moveTo(hz.x, 0);
        ctx.lineTo(hz.x, hz.y);
        ctx.stroke();

        ctx.fillStyle = 'rgba(233, 213, 255, 0.4)';
        ctx.beginPath();
        ctx.arc(hz.x, hz.y, hz.r, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }

    // 2. Asteroid Belt: Destructible Drifting Meteors
    for (const ast of G.current.hazardAsteroids || []) {
      ctx.save();
      ctx.strokeStyle = 'rgba(239, 68, 68, 0.45)';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([5, 5]);
      ctx.beginPath();
      ctx.moveTo(ast.x, ast.y);
      ctx.lineTo(ast.x + ast.vx * 70, ast.y + ast.vy * 70);
      ctx.stroke();
      ctx.setLineDash([]);

      ctx.translate(ast.x, ast.y);
      ctx.rotate(ast.rot);
      ctx.fillStyle = '#44403c';
      ctx.strokeStyle = '#f97316';
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      const sides = 7;
      for (let i = 0; i < sides; i++) {
        const a = (i / sides) * Math.PI * 2;
        const r = ast.r * (0.8 + ((i % 3) * 0.15));
        const px = Math.cos(a) * r;
        const py = Math.sin(a) * r;
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.restore();

      ctx.save();
      const hpPct = Math.max(0, ast.hp / ast.maxHp);
      const barW = ast.r * 1.5;
      ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
      ctx.fillRect(ast.x - barW / 2, ast.y - ast.r - 8, barW, 4);
      ctx.fillStyle = '#f97316';
      ctx.fillRect(ast.x - barW / 2, ast.y - ast.r - 8, barW * hpPct, 4);
      ctx.restore();
    }

    // 3. Singularity Gravitational Micro-Vortices
    for (const vx of G.current.vortexHazards || []) {
      ctx.save();
      if (vx.timer > 0) {
        const pulse = 0.5 + Math.sin(G.current.frame * 0.25) * 0.3;
        ctx.fillStyle = `rgba(244, 63, 94, ${0.07 * pulse})`;
        ctx.beginPath();
        ctx.arc(vx.x, vx.y, vx.r, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = `rgba(244, 63, 94, ${0.5 + pulse * 0.4})`;
        ctx.lineWidth = 1.5;
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        ctx.arc(vx.x, vx.y, vx.r, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);

        ctx.font = '900 10px "Exo 2", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillStyle = '#fda4af';
        ctx.fillText(tDirect('gravitySurge', undefined, languageRef.current), vx.x, vx.y);
      } else if (vx.active) {
        const spin = G.current.frame * 0.08;
        ctx.fillStyle = 'rgba(15, 23, 42, 0.4)';
        ctx.beginPath();
        ctx.arc(vx.x, vx.y, vx.r, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = '#fb7185';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(vx.x, vx.y, 22 + Math.sin(spin) * 4, spin, spin + Math.PI * 1.5);
        ctx.stroke();

        ctx.fillStyle = '#050106';
        ctx.beginPath();
        ctx.arc(vx.x, vx.y, 14, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1;
        ctx.stroke();
      }
      ctx.restore();
    }
  }

  // Render items logic
  if (G.current.state !== 'menu') {
    const p = G.current.player;
    if (p) {
      for (const pool of G.current.waterPools || []) {
        ctx.save();
        const alpha = Math.max(0, Math.min(0.65, pool.life / 140));
        const grad = ctx.createRadialGradient(pool.x, pool.y, 2, pool.x, pool.y, pool.r);
        grad.addColorStop(0, pool.evolved ? `rgba(125, 211, 252, ${alpha})` : `rgba(34, 211, 238, ${alpha})`);
        grad.addColorStop(0.45, pool.evolved ? `rgba(59, 130, 246, ${alpha * 0.45})` : `rgba(14, 165, 233, ${alpha * 0.35})`);
        grad.addColorStop(1, 'rgba(15, 23, 42, 0)');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(pool.x, pool.y, pool.r, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = pool.evolved ? 'rgba(191, 219, 254, 0.55)' : 'rgba(103, 232, 249, 0.38)';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(pool.x, pool.y, pool.r * (0.72 + Math.sin(G.current.frame * 0.08) * 0.08), 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
      }

      for (const pillar of G.current.manaPillars || []) {
        ctx.save();
        const alpha = Math.min(0.75, pillar.life / 42);
        const grad = ctx.createLinearGradient(pillar.x - pillar.w / 2, 0, pillar.x + pillar.w / 2, 0);
        grad.addColorStop(0, 'rgba(15, 23, 42, 0)');
        grad.addColorStop(0.5, pillar.col.replace(')', `, ${alpha})`).replace('rgb', 'rgba'));
        grad.addColorStop(1, 'rgba(15, 23, 42, 0)');
        ctx.fillStyle = grad;
        ctx.fillRect(pillar.x - pillar.w / 2, 0, pillar.w, height);
        ctx.strokeStyle = pillar.col;
        ctx.globalAlpha = alpha;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(pillar.x, 0);
        ctx.lineTo(pillar.x, height);
        ctx.stroke();
        ctx.restore();
      }

      for (const beam of G.current.lancetBeams || []) {
        ctx.save();
        const alpha = Math.min(0.75, beam.life / 28);
        ctx.translate(beam.x, beam.y);
        ctx.rotate(beam.ang);
        ctx.globalAlpha = alpha;
        ctx.strokeStyle = beam.evolved ? '#e0f2fe' : '#93c5fd';
        ctx.shadowColor = beam.evolved ? '#bfdbfe' : '#60a5fa';
        ctx.shadowBlur = 14;
        ctx.lineWidth = beam.width;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(Math.max(width, height) * 1.4, 0);
        ctx.stroke();
        if (beam.evolved) {
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.35)';
          ctx.lineWidth = 1;
          for (let i = 1; i <= 12; i++) {
            const x = i * 55;
            ctx.beginPath();
            ctx.moveTo(x, -beam.width * 1.4);
            ctx.lineTo(x, beam.width * 1.4);
            ctx.stroke();
          }
        }
        ctx.restore();
      }

      const garlicLv = getWeaponLevel(p, 'garlic');
      if (garlicLv > 0) {
        const evolved = p.tags.has('syn_garlic');
        const radius = spd((evolved ? 112 : 58 + garlicLv * 13) * (1 + getWeaponLevel(p, 'lens') * 0.15));
        ctx.save();
        ctx.globalAlpha = evolved ? 0.18 : 0.12;
        ctx.fillStyle = evolved ? '#fb7185' : '#22d3ee';
        ctx.shadowColor = evolved ? '#fb7185' : '#22d3ee';
        ctx.shadowBlur = 22;
        ctx.beginPath();
        ctx.arc(p.x, p.y, radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 0.5;
        ctx.strokeStyle = evolved ? '#fecdd3' : '#a5f3fc';
        ctx.lineWidth = 1.5;
        for (let i = 0; i < 3; i++) {
          ctx.beginPath();
          ctx.arc(p.x, p.y, radius * (0.78 + i * 0.11 + Math.sin(G.current.frame * 0.06 + i) * 0.025), 0, Math.PI * 2);
          ctx.stroke();
        }
        ctx.restore();
      }

      const bibleLv = getWeaponLevel(p, 'bible');
      if (bibleLv > 0) {
        const evolved = p.tags.has('syn_bible');
        const count = evolved ? 8 + getWeaponLevel(p, 'duplicator') : Math.min(7, bibleLv + 1 + Math.floor(getWeaponLevel(p, 'duplicator') / 2));
        const radius = spd((evolved ? 70 : 42 + bibleLv * 6) * (1 + getWeaponLevel(p, 'lens') * 0.15));
        for (let i = 0; i < count; i++) {
          const oa = (p.bibleAngle || 0) + i * (Math.PI * 2 / count);
          const ox = p.x + Math.cos(oa) * radius;
          const oy = p.y + Math.sin(oa) * radius;
          ctx.save();
          ctx.translate(ox, oy);
          ctx.rotate(oa + Math.PI / 2);
          ctx.shadowColor = evolved ? '#c084fc' : '#67e8f9';
          ctx.shadowBlur = 12;
          ctx.fillStyle = evolved ? '#8b5cf6' : '#0891b2';
          ctx.strokeStyle = evolved ? '#ddd6fe' : '#cffafe';
          ctx.lineWidth = 1.2;
          ctx.beginPath();
          ctx.roundRect(-7, -10, 14, 20, 3);
          ctx.fill();
          ctx.stroke();
          ctx.beginPath();
          ctx.moveTo(-4, -4);
          ctx.lineTo(4, -4);
          ctx.moveTo(-4, 2);
          ctx.lineTo(4, 2);
          ctx.stroke();
          ctx.restore();
        }
      }

      if ((p.laurelShields || 0) > 0 || getWeaponLevel(p, 'laurel') > 0) {
        ctx.save();
        const evolved = p.tags.has('syn_laurel');
        const charges = p.laurelShields || 0;
        ctx.strokeStyle = evolved ? '#fb7185' : '#38bdf8';
        ctx.shadowColor = evolved ? '#fb7185' : '#38bdf8';
        ctx.shadowBlur = charges > 0 ? 18 : 5;
        ctx.globalAlpha = charges > 0 ? 0.65 : 0.25;
        ctx.lineWidth = 2;
        for (let i = 0; i < Math.max(1, charges); i++) {
          ctx.beginPath();
          ctx.arc(p.x, p.y, 29 + i * 7 + Math.sin(G.current.frame * 0.08 + i) * 2, 0, Math.PI * 2);
          ctx.stroke();
        }
        ctx.restore();
      }

      // Heat circles (aura)
      if (p.aura > 0) {
        ctx.save();
        ctx.globalAlpha = p.tags.has('gravitywell') ? 0.14 : 0.06;
        ctx.fillStyle = p.tags.has('gravitywell') ? '#a78bfa' : p.col;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.aura, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      // Satellites
      if (p.orbital > 0) {
        for (let oi = 0; oi < p.orbital; oi++) {
          const oa = (p.orbAngle || 0) + oi * ((Math.PI * 2) / p.orbital);
          const ox = p.x + Math.cos(oa) * (p.tags.has('gravitywell') ? 48 : 35);
          const oy = p.y + Math.sin(oa) * (p.tags.has('gravitywell') ? 48 : 35);
          ctx.save();
          ctx.fillStyle = p.tags.has('gravitywell') ? '#fcd34d' : p.col;
          ctx.beginPath();
          ctx.arc(ox, oy, 5.5, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        }
      }

      // Orbital Deflector Drone
      if (p.tags.has('deflector')) {
        const oa = G.current.deflectorAngle || 0;
        const ox = p.x + Math.cos(oa) * 44;
        const oy = p.y + Math.sin(oa) * 44;
        
        // Draw scanning link
        ctx.save();
        ctx.strokeStyle = p.tags.has('energy_symbiont') ? 'rgba(167, 139, 250, 0.25)' : 'rgba(56, 189, 248, 0.2)';
        ctx.lineWidth = 1;
        ctx.setLineDash([3, 3]);
        ctx.beginPath();
        ctx.moveTo(p.x, p.y);
        ctx.lineTo(ox, oy);
        ctx.stroke();
        ctx.restore();

        // Draw drone body core
        ctx.save();
        ctx.shadowColor = p.tags.has('energy_symbiont') ? '#a78bfa' : '#38bdf8';
        ctx.shadowBlur = 10;
        ctx.fillStyle = p.tags.has('energy_symbiont') ? '#c084fc' : '#38bdf8';
        ctx.beginPath();
        ctx.arc(ox, oy, 6, 0, Math.PI * 2);
        ctx.fill();

        // Rotating sub-panels for mechanical tech aesthetic
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1.3;
        ctx.beginPath();
        ctx.arc(ox, oy, 8.5, oa * 2, oa * 2 + Math.PI * 0.4);
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(ox, oy, 8.5, oa * 2 + Math.PI, oa * 2 + Math.PI * 1.4);
        ctx.stroke();
        
        // Deflector Shield recharge ring indicator
        if ((G.current.deflectorCd || 0) > 0) {
          const cdPercent = (G.current.deflectorCd || 0) / 240;
          ctx.strokeStyle = 'rgba(239, 68, 68, 0.55)';
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.arc(ox, oy, 11, -Math.PI/2, -Math.PI/2 + (Math.PI * 2 * cdPercent));
          ctx.stroke();
        } else {
          // Idle energy rings
          ctx.strokeStyle = 'rgba(56, 189, 248, 0.7)';
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.arc(ox, oy, 11 + Math.sin(G.current.frame * 0.1) * 2, 0, Math.PI * 2);
          ctx.stroke();
        }
        ctx.restore();

        // Synergy double electric boundary glow ring around ship
        if (p.tags.has('energy_symbiont')) {
          ctx.save();
          ctx.strokeStyle = 'rgba(192, 132, 252, 0.15)';
          ctx.lineWidth = 2.2;
          ctx.shadowColor = '#c084fc';
          ctx.shadowBlur = 6;
          ctx.beginPath();
          ctx.arc(p.x, p.y, 44, 0, Math.PI * 2);
          ctx.stroke();
          ctx.restore();
        }
      }

      // Render active gravity singularities (vortex black holes)
      if (G.current.singularities && G.current.singularities.length > 0) {
        for (const sing of G.current.singularities) {
          ctx.save();
          const coreRadius = 8 + (150 - sing.life) * 0.12; 
          const angleSpin = G.current.frame * 0.085;
          
          // 1. Swirling accretion disk
          const discGrad = ctx.createRadialGradient(sing.x, sing.y, coreRadius, sing.x, sing.y, sing.r);
          discGrad.addColorStop(0, 'rgba(15, 23, 42, 0.95)'); // pitch black core
          discGrad.addColorStop(0.18, 'rgba(124, 58, 237, 0.65)'); // intense purple hot gas
          discGrad.addColorStop(0.55, 'rgba(192, 132, 252, 0.25)'); // fading ultraviolet tentacles
          discGrad.addColorStop(1.0, 'rgba(15, 23, 42, 0)');
          
          ctx.fillStyle = discGrad;
          ctx.beginPath();
          ctx.arc(sing.x, sing.y, sing.r, 0, Math.PI * 2);
          ctx.fill();

          // 2. Swirling spiral lines inside accretion disk
          ctx.strokeStyle = 'rgba(192, 132, 252, 0.4)';
          ctx.lineWidth = 1.6;
          for (let sa = 0; sa < Math.PI * 2; sa += Math.PI * 0.5) {
            ctx.beginPath();
            for (let r = coreRadius; r < sing.r * 0.85; r += 4) {
              const spiralAng = sa + angleSpin + (r * 0.035);
              const sx = sing.x + Math.cos(spiralAng) * r;
              const sy = sing.y + Math.sin(spiralAng) * r;
              if (r === coreRadius) ctx.moveTo(sx, sy);
              else ctx.lineTo(sx, sy);
            }
            ctx.stroke();
          }

          // 3. Pitch black event horizon singularity core
          ctx.shadowColor = '#c084fc';
          ctx.shadowBlur = 18;
          ctx.fillStyle = '#020617';
          ctx.beginPath();
          ctx.arc(sing.x, sing.y, coreRadius, 0, Math.PI * 2);
          ctx.fill();
          
          ctx.restore();
        }
      }

      // Laserbeams representation
      if (G.current.laserBeams) {
        for (const beam of G.current.laserBeams) {
          const alphaCheck = beam.life / 12;
          ctx.save();
          ctx.globalAlpha = alphaCheck * 0.75;
          ctx.strokeStyle = '#ffee00';
          ctx.lineWidth = 4 * alphaCheck;
          ctx.beginPath();
          ctx.moveTo(beam.x, beam.y);
          ctx.lineTo(beam.x + Math.cos(beam.ang) * 1200, beam.y + Math.sin(beam.ang) * 1200);
          ctx.stroke();
          ctx.restore();
          beam.life--;
        }
        compactInPlace<any>(G.current.laserBeams, b => b.life > 0);
      }

      // Lightning bolt arcs - rendered as stunning procedural jagged electrical currents
      for (const bolt of G.current.lightningBolts) {
        ctx.save();
        ctx.strokeStyle = bolt.col;
        ctx.lineWidth = 2.5 * (bolt.life / 12) + 0.6;
        ctx.shadowColor = bolt.col;
        ctx.shadowBlur = 10;
        ctx.beginPath();
        ctx.moveTo(bolt.x1, bolt.y1);
        
        // Procedurally calculate jagged lightning joints
        const steps = 4;
        const dx = bolt.x2 - bolt.x1;
        const dy = bolt.y2 - bolt.y1;
        const dist = Math.hypot(dx, dy);
        
        if (dist > 5) {
          for (let s = 1; s < steps; s++) {
            const fraction = s / steps;
            const px = bolt.x1 + dx * fraction;
            const py = bolt.y1 + dy * fraction;
            
            // Normal direction for perpendicular offsets
            const nx = -dy / dist;
            const ny = dx / dist;
            const offset = (Math.random() - 0.5) * Math.min(22, dist * 0.25);
            ctx.lineTo(px + nx * offset, py + ny * offset);
          }
        }
        ctx.lineTo(bolt.x2, bolt.y2);
        ctx.stroke();
        ctx.restore();
        bolt.life--;
      }
      compactInPlace<LightningBolt>(G.current.lightningBolts, b => b.life > 0);

      // Ship hulls trail
      for (let i = 0; i < p.trail.length; i++) {
        const tr = p.trail[i];
        ctx.fillStyle = p.col;
        ctx.globalAlpha = (i / p.trail.length) * 0.25;
        ctx.beginPath();
        ctx.arc(tr.x, tr.y, 5 * (i / p.trail.length), 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1.0;
      }

      // Draw player starship (using high-res sprite sheet when ready, fallback to procedural)
      if (shipSheet.current && shipSheet.current.complete) {
        const coord = getShipIcon(selectedSkin);
        const drawSize = 46;
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.facing); // sprite already faces upward, aligned with p.facing
        ctx.drawImage(
          shipSheet.current,
          coord.col * 418, coord.row * 418, 418, 418,
          -drawSize / 2, -drawSize / 2, drawSize, drawSize
        );
        ctx.restore();
      } else {
        drawProceduralPlayer(ctx, p, G.current.frame);
      }

      // Shield sphere overlay
      if (p.shield > 0) {
        ctx.save();
        ctx.strokeStyle = '#38bdf8';
        ctx.globalAlpha = 0.5 + Math.sin(G.current.frame * 0.25) * 0.15;
        ctx.lineWidth = 1.8;
        ctx.beginPath();
        ctx.arc(p.x, p.y, 23, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
      }
    }

    // Draw dynamic rocket projectiles and their high-fidelity flame tails
    for (const b of G.current.bullets) {
      // Draw rocket hull trail (smoke plumes & fading fires)
      for (let i = 0; i < b.trail.length; i++) {
        const tr = b.trail[i];
        ctx.fillStyle = b.col;
        ctx.globalAlpha = (i / b.trail.length) * 0.22;
        ctx.beginPath();
        ctx.arc(tr.x, tr.y, b.r * 0.8 * (i / b.trail.length), 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1.0;
      }

      if (b.weaponKind) {
        ctx.save();
        ctx.translate(b.x, b.y);
        ctx.rotate(b.angle || 0);
        ctx.shadowColor = b.col;
        ctx.shadowBlur = 14;
        ctx.strokeStyle = b.col;
        ctx.fillStyle = b.col;
        ctx.lineWidth = 2;

        if (b.weaponKind === 'dagger' || b.weaponKind === 'shroud') {
          ctx.beginPath();
          ctx.moveTo(b.r * 3.4, 0);
          ctx.lineTo(-b.r * 1.6, -b.r * 0.8);
          ctx.lineTo(-b.r * 0.7, 0);
          ctx.lineTo(-b.r * 1.6, b.r * 0.8);
          ctx.closePath();
          ctx.fill();
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.55)';
          ctx.beginPath();
          ctx.moveTo(-b.r * 0.6, 0);
          ctx.lineTo(b.r * 2.5, 0);
          ctx.stroke();
        } else if (b.weaponKind === 'scythe') {
          // Glowing circular whirlwind trail
          ctx.beginPath();
          ctx.arc(0, 0, b.r * 1.8, 0, Math.PI * 2);
          ctx.strokeStyle = `${b.col}44`;
          ctx.lineWidth = 1.5;
          ctx.stroke();

          // Scythe staff / handle
          ctx.strokeStyle = '#e2e8f0';
          ctx.lineWidth = 2.5;
          ctx.beginPath();
          ctx.moveTo(-b.r * 1.5, 0);
          ctx.lineTo(b.r * 1.5, 0);
          ctx.stroke();

          // Curved razor crescent blade
          ctx.strokeStyle = b.col;
          ctx.fillStyle = `${b.col}cc`;
          ctx.lineWidth = 3.5;
          ctx.beginPath();
          ctx.arc(b.r * 0.9, 0, b.r * 1.6, -Math.PI * 0.55, Math.PI * 0.3);
          ctx.stroke();

          // Opposite hook blade
          ctx.beginPath();
          ctx.arc(-b.r * 0.9, 0, b.r * 0.9, Math.PI * 0.45, Math.PI * 1.15);
          ctx.stroke();
        } else if (b.weaponKind === 'sword') {
          ctx.beginPath();
          ctx.moveTo(b.r * 3.6, 0);
          ctx.lineTo(b.r * 0.6, -b.r * 0.55);
          ctx.lineTo(-b.r * 1.2, -b.r * 0.25);
          ctx.lineTo(-b.r * 1.2, b.r * 0.25);
          ctx.lineTo(b.r * 0.6, b.r * 0.55);
          ctx.closePath();
          ctx.fill();
          ctx.strokeStyle = '#fff7ed';
          ctx.beginPath();
          ctx.moveTo(-b.r, 0);
          ctx.lineTo(b.r * 3, 0);
          ctx.stroke();
        } else {
          ctx.beginPath();
          ctx.moveTo(0, -b.r * 1.8);
          ctx.lineTo(b.r * 0.55, -b.r * 0.55);
          ctx.lineTo(b.r * 1.8, 0);
          ctx.lineTo(b.r * 0.55, b.r * 0.55);
          ctx.lineTo(0, b.r * 1.8);
          ctx.lineTo(-b.r * 0.55, b.r * 0.55);
          ctx.lineTo(-b.r * 1.8, 0);
          ctx.lineTo(-b.r * 0.55, -b.r * 0.55);
          ctx.closePath();
          ctx.stroke();
        }

        ctx.restore();
        continue;
      }

      // Procedural render bullet as highly detailed scifi rocket
      drawProceduralRocket(
        ctx,
        b.x,
        b.y,
        b.r * 0.68, // Scaled down rocket size visually as requested by the user
        b.angle || 0,
        b.skinId,
        G.current.frame,
        b.critHit
      );
    }

    // Mini lasers shots from enemies
    for (const eb of G.current.eBullets) {
      ctx.fillStyle = eb.poison ? '#10b981' : '#f87171';
      ctx.beginPath();
      ctx.arc(eb.x, eb.y, eb.r, 0, Math.PI * 2);
      ctx.fill();
    }

    // Procedural Spaceships of space invaders (Enemies) and Flagship Bosses
    for (const e of G.current.enemies) {
      // Telegraphed Attack indicator (laser aim lines before sudden dash/charge)
      if (e.type === 'charger' && e.chargePhase === 'wind') {
        ctx.save();
        const aimAng = Math.atan2(e.chargeVy || 0, e.chargeVx || 0);
        ctx.strokeStyle = 'rgba(239, 68, 68, 0.85)';
        ctx.lineWidth = 2.2;
        ctx.setLineDash([8, 6]);
        ctx.lineDashOffset = -G.current.frame * 2.5;
        ctx.beginPath();
        ctx.moveTo(e.x, e.y);
        ctx.lineTo(e.x + Math.cos(aimAng) * 500, e.y + Math.sin(aimAng) * 500);
        ctx.stroke();

        // Pulsing target reticle along trajectory
        const reticleDist = 200 + Math.sin(G.current.frame * 0.3) * 20;
        const rx = e.x + Math.cos(aimAng) * reticleDist;
        const ry = e.y + Math.sin(aimAng) * reticleDist;
        ctx.strokeStyle = '#ef4444';
        ctx.beginPath();
        ctx.arc(rx, ry, 7, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
      } else if (e.type === 'dasher' && (e.dashTimer || 0) >= 20 && (e.dashTimer || 0) < 35) {
        ctx.save();
        const dAng = e.dashAngle ?? (G.current.player ? Math.atan2(G.current.player.y - e.y, G.current.player.x - e.x) : 0);
        ctx.strokeStyle = 'rgba(244, 63, 94, 0.8)';
        ctx.lineWidth = 1.8;
        ctx.setLineDash([6, 5]);
        ctx.lineDashOffset = -G.current.frame * 2;
        ctx.beginPath();
        ctx.moveTo(e.x, e.y);
        ctx.lineTo(e.x + Math.cos(dAng) * 380, e.y + Math.sin(dAng) * 380);
        ctx.stroke();
        ctx.restore();
      } else if (e.boss && e.shootCd && e.shootCd > 30 && G.current.player) {
        ctx.save();
        const toP = Math.atan2(G.current.player.y - e.y, G.current.player.x - e.x);
        ctx.strokeStyle = 'rgba(239, 68, 68, 0.45)';
        ctx.lineWidth = 2.5;
        ctx.setLineDash([12, 8]);
        ctx.lineDashOffset = -G.current.frame * 3;
        ctx.beginPath();
        ctx.moveTo(e.x, e.y);
        ctx.lineTo(e.x + Math.cos(toP) * 600, e.y + Math.sin(toP) * 600);
        ctx.stroke();
        ctx.restore();
      }

      if (e.boss && bossSheet.current && bossSheet.current.complete) {
        const coord = getBossIcon(G.current.currentSector?.id || 'earth');
        const bSize = e.r * 2.5;
        ctx.save();
        ctx.translate(e.x, e.y);
        ctx.drawImage(
          bossSheet.current,
          coord.col * 418, coord.row * 418, 418, 418,
          -bSize / 2, -bSize / 2, bSize, bSize
        );
        ctx.restore();
      } else {
        drawProceduralEnemy(ctx, e, G.current.frame);
      }

      // Drawing enemy floating text, wave modifiers, or simple HP bars
      if (e.hp < e.maxHp) {
        const hBarWidth = e.r * 1.9 + 5;
        ctx.fillStyle = 'rgba(15, 23, 42, 0.7)';
        ctx.fillRect(e.x - hBarWidth / 2, e.y + e.r + 6, hBarWidth, 4);
        ctx.fillStyle = e.boss ? '#ef4444' : '#10b981';
        ctx.fillRect(e.x - hBarWidth / 2, e.y + e.r + 6, hBarWidth * (e.hp / e.maxHp), 4);
      }
    }

    const isMobile = window.innerWidth < 768 || /Mobi|Android|iPhone|iPad|Telegram/i.test(navigator.userAgent);
    const useGlow = !isMobile;

    // Collectible crystallite nodes
    for (const g of G.current.gems) {
      ctx.save();
      if (useGlow) {
        ctx.shadowColor = g.col;
        ctx.shadowBlur = 8;
      }
      if (pickupSheet.current && pickupSheet.current.complete) {
        let col = 0, row = 0;
        if (g.type === 'credit') {
          col = 0; row = 1; // golden credit chip
        } else if (g.val >= 10) {
          col = 2; row = 0; // purple star crystal
        } else if (g.val >= 3) {
          col = 1; row = 0; // green bio-crystal
        } else {
          col = 0; row = 0; // blue quantum crystal
        }
        const pSize = Math.max(16, g.r * 2.8);
        ctx.drawImage(
          pickupSheet.current,
          col * 418, row * 418, 418, 418,
          g.x - pSize / 2, g.y - pSize / 2, pSize, pSize
        );
      } else {
        ctx.fillStyle = g.col;
        if (g.type === 'credit') {
          g.spin = (g.spin || 0) + 0.1;
          const sizeX = Math.abs(Math.sin(g.spin));
          ctx.translate(g.x, g.y);
          ctx.scale(sizeX, 1);
          ctx.beginPath();
          ctx.arc(0, 0, g.r, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = '#0f172a';
          ctx.font = 'bold 7px sans-serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText('$', 0, 0);
        } else {
          // Draw diamond crystals
          ctx.translate(g.x, g.y);
          ctx.beginPath();
          ctx.moveTo(0, -g.r);
          ctx.lineTo(g.r * 0.7, 0);
          ctx.lineTo(0, g.r);
          ctx.lineTo(-g.r * 0.7, 0);
          ctx.closePath();
          ctx.fill();
        }
      }
      ctx.restore();
    }

    // Rare Battlefield Super-Pickups rendering
    for (const sp of G.current.superPickups) {
      ctx.save();
      const bob = Math.sin(sp.pulseTimer) * 3;
      const px = sp.x;
      const py = sp.y + bob;

      // Pulsing underglow ring
      const ringPulse = 1 + Math.sin(sp.pulseTimer * 2) * 0.22;
      ctx.beginPath();
      ctx.arc(px, py, sp.r * 1.35 * ringPulse, 0, Math.PI * 2);
      ctx.fillStyle = `${sp.col}25`;
      ctx.fill();
      ctx.strokeStyle = sp.col;
      ctx.lineWidth = 1.8;
      ctx.stroke();

      if (pickupSheet.current && pickupSheet.current.complete) {
        let col = 0;
        let row = 0;
        if (sp.type === 'nuke') {
          col = 2; row = 1;
        } else if (sp.type === 'magnet') {
          col = 1; row = 2;
        } else if (sp.type === 'heal') {
          col = 0; row = 2;
        } else if (sp.type === 'freeze') {
          col = 2; row = 2;
        }
        const pSize = sp.r * 2.5;
        ctx.drawImage(
          pickupSheet.current,
          col * 418, row * 418, 418, 418,
          px - pSize / 2, py - pSize / 2, pSize, pSize
        );
      } else {
        // High-tech fallback badge
        ctx.beginPath();
        ctx.arc(px, py, sp.r, 0, Math.PI * 2);
        ctx.fillStyle = sp.col;
        ctx.fill();
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 12px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        const iconSymbol = sp.type === 'nuke' ? '💣' : sp.type === 'magnet' ? '🧲' : sp.type === 'heal' ? '💊' : '⏳';
        ctx.fillText(iconSymbol, px, py);
      }
      ctx.restore();
    }

    // Particle nodes
    for (const pt of G.current.particles) {
      if (pt.type === 'debris') {
        ctx.save();
        ctx.globalAlpha = pt.life;
        ctx.fillStyle = pt.col;
        ctx.strokeStyle = pt.col;
        ctx.lineWidth = 1.0;
        ctx.translate(pt.x, pt.y);
        ctx.rotate(pt.angle || 0);
        ctx.beginPath();
        ctx.moveTo(0, -pt.r);
        ctx.lineTo(pt.r * 0.5, pt.r * 0.7);
        ctx.lineTo(-pt.r * 0.5, pt.r * 0.7);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.restore();
      } else {
        ctx.globalAlpha = pt.life;
        ctx.beginPath();
        if (pt.type === 'ring') {
          ctx.strokeStyle = pt.col;
          ctx.lineWidth = 2.5 * pt.life;
          if (useGlow) {
            ctx.shadowColor = pt.col;
            ctx.shadowBlur = 10 * pt.life;
          }
          ctx.arc(pt.x, pt.y, pt.r, 0, Math.PI * 2);
          ctx.stroke();
        } else if (pt.type === 'smoke') {
          ctx.fillStyle = pt.col;
          ctx.arc(pt.x, pt.y, pt.r, 0, Math.PI * 2);
          ctx.fill();
        } else { // spark
          ctx.fillStyle = pt.col;
          if (useGlow) {
            ctx.shadowColor = pt.col;
            ctx.shadowBlur = 8 * pt.life;
          }
          ctx.arc(pt.x, pt.y, pt.r, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }
    ctx.globalAlpha = 1.0;
    if (useGlow) {
      ctx.shadowBlur = 0;
    }

    // Floating Damage Numbers rendering
    for (let i = G.current.damageNumbers.length - 1; i >= 0; i--) {
      const dn = G.current.damageNumbers[i];
      dn.x += dn.vx;
      dn.y += dn.vy;
      dn.vy *= 0.93;
      dn.life--;
      dn.alpha = Math.max(0, dn.life / (dn.isCrit ? 45 : 30));
      if (dn.life <= 0) {
        G.current.damageNumbers.splice(i, 1);
        continue;
      }

      ctx.save();
      ctx.globalAlpha = dn.alpha;
      const currentSize = dn.isCrit ? dn.size * (1 + Math.sin((45 - dn.life) * 0.25) * 0.2) : dn.size;
      ctx.font = `900 ${Math.round(currentSize)}px "Exo 2", "Rajdhani", sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      // Deep stroke outline for high readability against starry nebula backgrounds
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = dn.isCrit ? 3.5 : 2.5;
      ctx.strokeText(dn.text, dn.x, dn.y);

      // Glowing colored fill
      ctx.fillStyle = dn.col;
      if (useGlow && dn.isCrit) {
        ctx.shadowColor = dn.col;
        ctx.shadowBlur = 10;
      }
      ctx.fillText(dn.text, dn.x, dn.y);
      ctx.restore();
    }

    // Onscreen flash notifications
    if (G.current.screenFlash) {
      const flashesAllowed = callbacksRef.current.settings?.flashEnabled ?? true;
      if (flashesAllowed) {
        const flLife = G.current.screenFlash.life / 15;
        ctx.fillStyle = G.current.screenFlash.col;
        ctx.globalAlpha = flLife * 0.25;
        ctx.fillRect(0, 0, width, height);
        ctx.globalAlpha = 1.0;
      }
      G.current.screenFlash.life--;
      if (G.current.screenFlash.life <= 0) G.current.screenFlash = null;
    }

    // Virtual Touch Joystick HUD
    if (joyActive.current) {
      ctx.save();
      ctx.globalAlpha = 0.45;
      
      // Outer loop
      ctx.strokeStyle = '#22d3ee';
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.arc(joyBase.current.x, joyBase.current.y, 42, 0, Math.PI * 2);
      ctx.stroke();

      // Under fill
      ctx.fillStyle = 'rgba(34, 211, 238, 0.08)';
      ctx.fill();

      // Thumb track knob
      ctx.fillStyle = '#22d3ee';
      ctx.beginPath();
      ctx.arc(joyThumb.current.x, joyThumb.current.y, 16, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
    }
  }

  ctx.restore();
}
