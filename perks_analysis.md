# Perk & Upgrade System Analysis — Space Survivor

> In-depth analysis based on `src/utils/upgrades.ts`, `src/types.ts`, and `src/components/GameCanvas.tsx`.

---

## 1. Overall Architecture

| Component | Count | Progression | Max Level |
|-----------|-------|-------------|-----------|
| **Active Weapons** | 10 | Lv. 1→5, then Evolution | 5 + Legendary |
| **Passive Buffs** | 10 | Lv. 1→5 | 5 |
| **Rocket Mutations** | 12 | One-time perks | 1 |
| **Rocket Synergies** | 3 | One-time Legendary synergies | 1 |
| **Weapon Evolutions** | 10 | Legendary (require Lv. 5 weapon + passive) | 1 |

**Evolution Mechanic:** Level 5 Weapon + corresponding Level 1+ Passive Module unlocks a Legendary Evolution Card that supersedes the Level 5 weapon tier (`tags.delete('weapon_5')`).

---

## 2. Active Weapons

| ID | Name | Type | Rarity 1→5 | Role |
|----|------|------|------------|------|
| `garlic` | Gravi-Aura | Aura around ship | C/C/R/R/E | Close quarters, sustain |
| `bible` | Orbital Relics | Orbiting satellites | C/C/R/R/E | Close/mid range, zoning |
| `water` | Plasma Puddle | Ground plasma pools | C/R/R/E/E | Area DOT |
| `lightning` | Ion Striker | Targeted chain lightning | R/R/E/E/L | Single target burst |
| `cross` | Photon Boomerang | Boomerang forward & back | C/R/R/E/E | Piercing, mid range |
| `scythe` | Plasma Scythe | Arc blades | R/R/E/E/L | Piercing, AoE wave clear |
| `dagger` | Blade Vortex | Forward blade barrage | C/C/R/R/E | Focused DPS |
| `mana` | Cosmic Pillar | Vertical energy beam | R/R/E/E/L | Area control |
| `lancet` | Chrono Lancet | Freezing beams | C/R/R/E/E | Crowd control |
| `laurel` | Aegis Barrier | Reactive shield barrier | R/R/E/E/L | Defense & survival |

### Damage Scaling (relative to `p.damage`)

| Weapon | Lv.1 | Lv.2 | Lv.3 | Lv.4 | Lv.5 | Evolution |
|--------|------|------|------|------|------|-----------|
| Gravi-Aura | 0.70 | 1.02 | 1.34 | 1.66 | 1.98 | **3.80** |
| Orbital Relics | 0.28 | 0.36 | 0.44 | 0.52 | 0.60 | **0.78** |
| Plasma Puddle | 0.16 | 0.20 | 0.24 | 0.28 | 0.32 | **0.33** |
| Ion Striker | 2.70 | 3.25 | 3.80 | 4.35 | 4.90 | **5.20** |
| Photon Boomerang | 1.80 | 2.18 | 2.56 | 2.94 | 3.32 | **6.80** |
| Plasma Scythe | 2.10 | 2.60 | 3.10 | 3.60 | 4.10 | **4.40** |
| Blade Vortex | 0.80 | 0.98 | 1.16 | 1.34 | 1.52 | **2.00** |
| Cosmic Pillar | 0.46 | 0.46 | 0.46 | 0.46 | 0.46 | **0.80** |
| Chrono Lancet | 0.36 | 0.36 | 0.36 | 0.36 | 0.36 | **2.80** + 1% HP |
| Aegis Barrier | — | — | — | — | — | — |

**Weapon Takeaways:**
- **Gravi-Aura** — Fastest linear damage growth (+0.32 per level). Evolution delivers 3.8x multiplier plus lifesteal. An outstanding pick for beginners.
- **Ion Striker** — Massive single-target burst, but R/R/E/E/L progression makes leveling harder. Evolution introduces secondary chain lightning arcs (0.45x main damage).
- **Photon Boomerang** — Evolution outputs a devastating 6.8x multiplier, +25% crit chance, and 8 pierces. One of the strongest late-game evolutions.
- **Cosmic Pillar** — Base damage remains static (0.46x) across levels 1-5; upgrades scale beam width and slow duration instead. Evolution provides 0.8x.
- **Chrono Lancet** — Damage remains constant prior to evolution. Evolution yields 2.8x + 1% current enemy HP damage.
- **Blade Vortex** — Evolution scales to 2.0x, providing sustained forward burst.

---

## 3. Passive Modules

| ID | Name | Effect | Rarity | Notes & Discrepancies |
|----|------|--------|--------|----------------------|
| `spinach` | Stellar Catalyst | +0.15 damage per level | C/C/R/R/E | Tooltip states +10%→+50%, but code applies absolute flat increases over base 1.4 (~+11%→+54%). |
| `armor` | Neutron Armor | +8% armor, +15 Max HP | C/C/R/R/E | Matches description. Hard-capped at 50%. |
| `heart` | Vitality Core | +25 Max HP per level | C/C/R/R/E | Matches description. |
| `regen` | Nano-Regenerator | +1 to `regenLv` | C/R/R/E/E | Heals +3 HP every `180/regenLv` frames (at Lv.5: +3 HP every 0.6s = ~15 HP / 3s). |
| `reactor` | Haste Reactor | shootRate ×0.88 | C/C/R/R/E | Tooltip states -12%→-60%, but multiplicative stacking yields -12%→-47% effective cooldown reduction. |
| `lens` | Focusing Lens | +0.5 projectile size, +10 explosion radius | C/C/R/R/E | Tooltip states +15%→+80%; absolute boost from base 3.0 yields +17%→+83%. |
| `duplicator` | Multiplier | +1 rocket per volley | R/R/E/E/L | Extremely strong passive, synergizes with `multishot`. |
| `wings` | Grav-Booster | +0.4 movement speed | C/C/R/R/E | Tooltip states +15%→+75%; from base 2.6 yields +15%→+77%. |
| `magnet` | Vacuum Field | +25 pickup radius | C/C/R/R/E | Tooltip states +40%→+200%; from base 56 yields +45%→+223%. |
| `clover` | Quantum Navigator | +8% crit, +15% exp gain | C/R/R/E/E | Matches description. |

---

## 4. Rocket Mutations (Secondary Weapons)

| ID | Name | Rarity | Effect | Weight |
|----|------|--------|--------|--------|
| `rocket_homing` | Grav-Guidance | Rare | Seeking guidance, +projectile speed | 7 |
| `rocket_antimatter` | Antimatter Warhead | Rare | Explosions on impact | 7 |
| `rocket_fan` | Spread Fire | Common | 3-rocket cone salvo | 7 |
| `rocket_duplicator` | Cluster Launch | Common | +2 rockets per volley, +1 to shootRate | 6 |
| `rocket_rail` | Rail Accelerator | Epic | High speed, +2 pierce, +18% damage | 5 |
| `rocket_chain` | Ion Arcing Coil | Rare | Chain lightning arcs between targets | 6 |
| `rocket_ricochet` | Ricochet Hull | Rare | +2 boundary/target bounces | 6 |
| `rocket_plasma_trail` | Plasma Exhaust Trail | Rare | Damaging flame trail (+12% dmg) | 6 |
| `rocket_gravity_warhead` | Graviton Warhead | Epic | Implosion vortex pulls nearby foes | 5 |
| `rocket_splitter` | Fragmentation Warhead | Epic | Splits into 3 sub-munitions on hit | 5 |
| `rocket_cryo_core` | Cryogenic Warhead | Rare | Freezes targets for 0.25s | 6 |
| `rocket_orbital_laser` | Orbital Designator | Epic | Calls down periodic orbital strikes | 5 |

### Rocket Synergies (Legendary)

| ID | Requirements | Effect |
|----|-------------|--------|
| `syn_clusterstorm` | explosive + multishot | Explosions shatter into 6 cluster bomblets |
| `syn_ionlance` | homing + rail_rockets | +2 pierce, high velocity, +22% damage |
| `syn_gravity_storm` | gravity_rockets + split_rockets | Shrapnel fragments retain gravitational pull |

---

## 5. Weapon Evolutions (Legendary)

| Evolution | Weapon Lv.5 | Passive Module | Bonus on `apply` | Mechanic |
|-----------|-------------|----------------|------------------|----------|
| Black Crown | Gravi-Aura | Vitality Core | +0.2 damage | Permanent aura, 3.8x damage, lifesteal |
| Eternal Orbits | Orbital Relics | Haste Reactor | +0.3 radius | 8 rapid orbiting blades, 0.78x damage |
| Azure Nebula | Plasma Puddle | Focusing Lens | — | Plasma storms track ship position |
| Overload Loop | Ion Striker | Multiplier | — | Continuous chain arcs (0.45x) across targets |
| Astral Severance | Photon Boomerang | Quantum Navigator | +15% crit, +0.5 crit dmg | Massive piercing boomerangs (6.8x damage) |
| Entropy Spiral | Plasma Scythe | Stellar Catalyst | — | 360° nova release of 8 scythes (4.4x) |
| Thousand Photons | Blade Vortex | Grav-Booster | — | Continuous streams of spiraling knives |
| Pulsar Pillar | Cosmic Pillar | Vacuum Field | — | Massive radial beam with vortex pull |
| Chrono Corridor | Chrono Lancet | Neutron Armor | — | 360° freeze pulse (2.8x + 1% enemy HP) |
| Crimson Dome | Aegis Barrier | Nano-Regenerator | +1 shield | 3 barrier charges + retaliatory pulse |

---

## 6. Balance Tier List

### S-Tier (Overpowered)
- **Gravi-Aura**: Rapid early scaling, Common availability, evolution grants sustain with lifesteal.
- **Multiplier**: Flat +1 rocket per level. Scales multiplicatively with `multishot` and `rocket_duplicator`.
- **Photon Boomerang**: Evolution outputs 6.8x damage, 8 pierces, and +25% crit.
- **Spread Fire (Mutation)**: 3 rockets per burst with unmodified shoot rate.

### A-Tier (Strong)
- **Haste Reactor**: Reduces attack interval down to ~9 frames. Doubles player DPS.
- **Ion Striker**: High burst damage, evolution clears screens with arcing electricity.
- **Plasma Scythe**: 99 pierces with 8-scythe circular nova upon evolution.
- **Quantum Navigator**: +40% critical chance and +75% experience acceleration.

### B-Tier (Viable)
- **Orbital Relics**: Excellent passive defense, but damage multiplier (0.78x) is low.
- **Plasma Puddle**: Strong area denial, evolves to follow the ship.
- **Chrono Lancet**: Exceptional crowd control; high boss utility post-evolution.
- **Aegis Barrier**: Emergency lifesaver with 3 recharge shields and counter-attack blades.
- **Rail Accelerator**: Reliable +2 pierce and velocity boost for rockets.

### C-Tier (Niche)
- **Cosmic Pillar**: Base damage stays at 0.46x across all 5 ranks.
- **Nano-Regenerator**: Healing is useful in early waves but overshadowed by armor & lifesteal in Sector 3+.
- **Vacuum Field**: Useful utility, but flat pickup radius increases (+25) are modest.

---

*Analysis based on current codebase implementation (`upgrades.ts` and `GameCanvas.tsx`).*
