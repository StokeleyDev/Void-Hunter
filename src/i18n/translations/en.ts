/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Translations } from '../types';

export const en: Translations = {
  // Navigation & Common
  subHeader: 'ARCADE SPACE ROGUELITE SHOOTER',
  settings: 'SETTINGS',
  sfx: 'SFX',
  music: 'MUSIC',
  language: 'LANGUAGE',
  menu: 'Menu',
  back: 'Back',
  cancel: 'Cancel',
  close: 'Close',
  on: 'ON',
  off: 'OFF',
  creditsSuffix: 'cr.',
  pointsSuffix: 'pts',

  // Main Menu
  selectedShip: 'ACTIVE SHIP',
  activeShip: 'DEPLOYED',
  changeShip: 'Change ship',
  selectedSector: 'CURRENT SECTOR',
  sectorObjective: 'OBJECTIVE',
  sectorObjectiveDesc: 'reach {target} points to summon and defeat flagship {boss}',
  allSectors: 'All sectors',
  hangar: 'HANGAR',
  hangarDesc: 'Ships & Skins',
  records: 'RECORDS',
  history: 'LOGS',
  codex: 'SYNERGIES',
  startGame: 'LAUNCH EXPEDITION',
  controlsHint: '🎮 Controls: WASD / Arrow Keys / Virtual Joystick',
  pauseHint: '⏸ Pause: Esc / P',

  // HUD
  score: 'Score',
  wave: 'Wave',
  level: 'Level',
  hull: 'HULL',
  exp: 'EXP',
  laser: 'LASER:',
  pause: '⏸ Pause',
  endlessMode: 'ENDLESS MODE',
  defenseAlert: 'DEFENSE SYSTEM ALERT',
  flagshipApproaching: 'SECTOR FLAGSHIP APPROACHING!',
  ionStrike: '⚡ ION STRIKE',
  gravitySurge: '⚠️ GRAVITY SURGE',

  // Level Up Modal
  newLevel: 'LEVEL UP!',
  levelReached: 'Ship Level',
  reroll: 'Reroll',
  rerollsLeft: 'left',
  evolutionBadge: 'EVOLUTION',
  upgradeBadge: 'UPGRADE',
  levelPrefix: 'Lv.',

  // Pause Modal
  paused: 'GAME PAUSED',
  resume: 'Resume',
  restart: 'Restart',
  toMenu: 'Main Menu',
  currentBuild: 'CURRENT LOADOUT',
  weapons: 'Weapon Systems',
  passives: 'Passive Modules',
  rocketPerks: 'Rocket Mutations',
  synergiesLabel: 'Synergies',
  emptyBuildNotice: 'No modifications installed',
  evolvedBadge: 'EVOLVED',

  // Settings Modal
  settingsHeader: 'SYSTEM SETTINGS',
  screenShake: 'Screen Shake',
  screenShakeDesc: 'Impact concussion intensity on explosions',
  shakeOff: 'Off',
  shakeLow: 'Low',
  shakeMed: 'Medium',
  shakeHigh: 'High',
  flashEffects: 'Screen Flash',
  flashEffectsDesc: 'High-visibility luminescence on hull damage',
  graphicsQuality: 'Graphics Quality',
  graphicsQualityDesc: 'Particle density and FX fidelity',
  gfxLow: 'Low',
  gfxMed: 'Medium',
  gfxHigh: 'High',
  audioSettings: 'Audio & Music',
  audioSettingsDesc: 'Volume levels and acoustic feedback',
  sfxToggle: 'Sound Effects',
  musicToggle: 'Background Soundtrack',
  languageSetting: 'Language',
  languageSettingDesc: 'Select game interface language (Язык)',

  // Game Over Modal
  shipDestroyed: 'VESSEL DESTROYED',
  pointsWon: 'pts',
  statsLevel: 'Level',
  statsWave: 'Wave',
  statsCredits: 'Credits',
  collectedBuildHeader: 'Final Loadout:',
  noUpgradesTaken: 'No upgrades installed',
  playAgain: 'Try Again',

  // Sector Select Screen
  sectorsTitle: 'GALAXY SECTORS',
  sectorsDesc: 'Select an expedition star system. Eliminate the Sector Flagship to claim rewards and unlock deep space frontiers.',
  targetScoreLabel: 'Flagship Summon Target:',
  flagshipLabel: 'Sector Flagship:',
  trophyLabel: 'Trophy:',
  selectedBadge: 'Selected',
  lockedBadge: 'Locked',
  unlockTip: 'Clear the previous sector to unlock access',
  launchSector: '🚀 Launch!',
  selectSector: 'Select Sector',
  sectorHint: 'Tip: Higher difficulty sectors award higher credit multipliers!',
  previousSectorUnlock: 'Clear {sector} to unlock access',

  // Sector Victory Modal
  missionAccomplished: 'Mission Accomplished!',
  sectorCleared: 'SECURED',
  flagshipDestroyedDesc: 'Flagship {boss} has been annihilated! Spacetime stability restored.',
  finalScoreLabel: 'Final Score:',
  creditsEarnedLabel: 'Credits Harvested:',
  firstClearReward: 'FIRST CLEAR BONUS:',
  bonusCreditsReward: '• Bonus +{credits} credits to bank',
  unlockedShipReward: '• Ship Hull Unlocked: "{skin}"',
  unlockedRocketReward: '• Rocket Skin Unlocked: "{rocket}"',
  nextSectorUnlockedReward: '🔓 Access granted to next sector: {sector}!',
  claimAndExit: '🏆 Claim Rewards & Return to Menu',
  continueEndless: '♾️ Continue in Endless Mode',

  // Hangar Screen
  hangarTitle: 'HUNTER HANGAR',
  balanceLabel: 'BALANCE:',
  shipsTab: '🚀 Ships',
  rocketsTab: '🚀 Rocket Skins',
  hullClass: 'Hull Class',
  activatedShip: '✓ DEPLOYED',
  selectShipAction: 'SELECT',
  chargedRocket: '✓ ARMED',
  selectRocketAction: 'ARM',
  codeOrPrice: '🔑 CODE / ',
  passcodeModalTitle: 'MANEUVER CLEARANCE',
  passcodeModalDesc: 'Acquire for {price} cr. or enter access clearance code:',
  passcodePlaceholder: 'Access code...',
  buyWithCreditsBtn: 'Purchase for {price} CR',
  enterCodeBtn: 'Submit Code',
  invalidCodeError: 'Invalid clearance code!',
  insufficientCreditsError: 'Insufficient galactic credits!',
  insufficientCreditsAlert: 'Not enough credits!',

  // Secondary Screens (Leaderboards, History, Codex)
  leaderboardTab: '🏆 Records',
  historyTab: '📜 Logs',
  codexTab: '⭐ Synergies',
  leaderboardTitle: 'HALL OF FAME',
  firstPlayer: '🥇 #1 Pilot',
  youBadge: 'YOU',
  personalRecord: 'PERSONAL BEST:',
  maxWave: 'Max Wave',
  noRunsYet: 'No expeditions logged yet.',
  runsWillLoadHere: 'Your run scores will appear here!',
  localSaveNotice: '🏆 Records and flight logs are stored locally on this device.',
  historyTitle: 'EXPEDITION LOGS',
  runNumber: 'Flight #',
  victoryLabel: '🏆 VICTORY:',
  emptyHistory: 'Flight log is empty.',
  emptyHistoryTip: 'Survive at least 1 wave before hull failure.',
  earnedCreditsLabel: 'EARNED',
  codexTitle: 'SECTOR SYNERGOPEDIA',
  codexDesc: 'Combine specific upgrades during your run to forge legendary combat complexes.',
  unlockedCodexBadge: 'UNLOCKED',
  lockedCodexBadge: 'LOCKED',

  // Weapons
  weaponsMeta: {
    garlic: {
      name: 'Grav-Aura',
      descriptions: [
        'Deploys a warped spacetime ring around the ship, dealing periodic area damage.',
        '+22% grav-field radius and +46% aura damage.',
        'Pulses accelerate, emitting bright gravitational shockwaves.',
        '+16% grav-field radius and +40% aura damage.',
        'Field slows down and repels enemies at the singularity boundary.',
      ],
    },
    bible: {
      name: 'Orbital Relics',
      descriptions: [
        'Launches an ancient orbital module circling the ship.',
        'Adds a second module; orbital rotation speed increased by 15%.',
        'Adds a third module; each leaves an ion trail.',
        '+30% damage to orbital modules.',
        'Adds a fourth module; orbit radius dynamically expands.',
      ],
    },
    water: {
      name: 'Plasma Condensate',
      descriptions: [
        'Drops an orbital plasma puddle creating an unstable scorch zone.',
        'Drops two puddles at once. +20% plasma zone radius.',
        'Plasma zone duration increased by 50%.',
        'Drops three puddles at once. +30% plasma damage.',
        'Plasma enters superheated blue mode, slowing enemies inside.',
      ],
    },
    lightning: {
      name: 'Ion Discharger',
      descriptions: [
        'Strikes a random enemy on screen with a powerful ion blast.',
        '+20% blast damage. Strikes two enemies simultaneously.',
        'Blast overloads targets and arcs to neighboring hulls.',
        'Strike interval reduced to 1.5s. Strikes three targets.',
        'Discharges leave a lingering electromagnetic field at the strike point.',
      ],
    },
    cross: {
      name: 'Photonic Boomerang',
      descriptions: [
        'Fires a spinning photon blade forward that arcs back toward the ship.',
        'Fires two boomerangs. +20% damage.',
        'Boomerangs pierce through enemies (+2 pierce) and increase in size.',
        'Fires three boomerangs in a spread.',
        'Rotation speed increased by 50%, travel range +40%.',
      ],
    },
    scythe: {
      name: 'Plasma Scythe',
      descriptions: [
        'Hurls an arcing plasma scythe slicing through all enemies in its path.',
        'Hurls two scythes. Scythe scale increased by 25%.',
        'Damage increased by 30%. Slices through all obstacles infinitely.',
        'Hurls three scythes.',
        'Cooldown reduced by ~42%.',
      ],
    },
    dagger: {
      name: 'Blade Flurry',
      descriptions: [
        'Fires a burst of 3 high-speed energy daggers forward.',
        'Burst increased to 5 daggers; projectile velocity +20%.',
        'Daggers gain +1 pierce. +30% damage.',
        'Burst increased to 6 daggers.',
        'Burst interval reduced by 40%.',
      ],
    },
    mana: {
      name: 'Cosmic Pillar',
      descriptions: [
        'Periodically summons a beam of cosmic dust cutting across the entire screen.',
        'Pillar width increased by 30%, damage +20%.',
        'Cooldown reduced to ~3.4s. Pillar inflicts slow on enemies.',
        'Pillar width increased by 25%, damage +30%.',
        'Pillar emits secondary shockwaves, vaporizing incoming enemy projectiles.',
      ],
    },
    lancet: {
      name: 'Chrono-Lancet',
      descriptions: [
        'Emits a temporal beam freezing enemies for 1.5 seconds.',
        'Fires dual opposing beams. Freeze duration increased to 1.8s.',
        'Freeze duration increased to 2.1 seconds.',
        'Beam width increased by 25%. Cooldown reduced by 25%.',
        'Frozen enemies temporarily take 15% increased damage from all sources.',
      ],
    },
    laurel: {
      name: 'Aegis Barrier',
      descriptions: [
        'Projects an energy barrier that completely blocks 1 incoming hit. Cooldown ~15s.',
        'Barrier recharge reduced to ~13s.',
        'Barrier stacks up to 2 block charges.',
        'Barrier recharge reduced to ~10s.',
        'Barrier explosion repels enemies upon breaking. Recharge reduced to ~8s.',
      ],
    },
  },

  // Passives
  passivesMeta: {
    spinach: {
      name: 'Stellar Catalyst',
      descriptions: [
        'Increases all damage dealt by +10%.',
        'Increases all damage dealt by +20%.',
        'Increases all damage dealt by +30%.',
        'Increases all damage dealt by +40%.',
        'Increases all damage dealt by +50%.',
      ],
    },
    armor: {
      name: 'Neutron Plating',
      descriptions: [
        'Reduces damage taken by 8% and adds +15 to max hull HP.',
        'Reduces damage taken by 16% and adds +30 to max hull HP.',
        'Reduces damage taken by 24% and adds +45 to max hull HP.',
        'Reduces damage taken by 32% and adds +60 to max hull HP.',
        'Reduces damage taken by 40% and adds +80 to max hull HP.',
      ],
    },
    heart: {
      name: 'Vitality Reactor',
      descriptions: [
        'Increases maximum hull integrity by +25 HP.',
        'Increases maximum hull integrity by +50 HP.',
        'Increases maximum hull integrity by +75 HP.',
        'Increases maximum hull integrity by +100 HP.',
        'Increases maximum hull integrity by +130 HP.',
      ],
    },
    regen: {
      name: 'Nano-Repairer',
      descriptions: [
        'Restores +3 hull integrity every 3 seconds.',
        'Hull repair increased to +6 integrity every 3 seconds.',
        'Hull repair increased to +9 integrity every 3 seconds.',
        'Hull repair increased to +12 integrity every 3 seconds.',
        'Hull repair increased to +15 integrity every 3 seconds.',
      ],
    },
    reactor: {
      name: 'Overclock Reactor',
      descriptions: [
        'Reduces primary weapon firing interval by ~12% (multiplicative).',
        'Reduces primary weapon firing interval by ~22%.',
        'Reduces primary weapon firing interval by ~31%.',
        'Reduces primary weapon firing interval by ~39%.',
        'Reduces primary weapon firing interval by ~47%.',
      ],
    },
    lens: {
      name: 'Focusing Lens',
      descriptions: [
        'Increases projectile size by +15% and aura/explosion radius by +15%.',
        'Increases projectile size by +30% and aura/explosion radius by +30%.',
        'Increases projectile size by +45% and aura/explosion radius by +45%.',
        'Increases projectile size by +60% and aura/explosion radius by +60%.',
        'Increases projectile size by +80% and aura/explosion radius by +80%.',
      ],
    },
    duplicator: {
      name: 'Quantum Duplicator',
      descriptions: [
        'Adds +1 rocket per primary weapon salvo.',
        'Adds +2 rockets per primary weapon salvo.',
        'Adds +3 rockets per primary weapon salvo.',
        'Adds +4 rockets per primary weapon salvo.',
        'Adds +5 rockets per primary weapon salvo.',
      ],
    },
    wings: {
      name: 'Grav-Thrusters',
      descriptions: [
        'Increases ship sub-light flight speed by +15%.',
        'Increases ship sub-light flight speed by +30%.',
        'Increases ship sub-light flight speed by +45%.',
        'Increases ship sub-light flight speed by +60%.',
        'Increases ship sub-light flight speed by +75%.',
      ],
    },
    magnet: {
      name: 'Attractor Array',
      descriptions: [
        'Increases collection radius for EXP and credits by +40%.',
        'Increases collection radius for EXP and credits by +80%.',
        'Increases collection radius for EXP and credits by +120%.',
        'Increases collection radius for EXP and credits by +160%.',
        'Increases collection radius for EXP and credits by +200%.',
      ],
    },
    clover: {
      name: 'Quantum Navigator',
      descriptions: [
        'Increases critical strike chance by +8% and EXP gain by +15%.',
        'Increases critical strike chance by +16% and EXP gain by +30%.',
        'Increases critical strike chance by +24% and EXP gain by +45%.',
        'Increases critical strike chance by +32% and EXP gain by +60%.',
        'Increases critical strike chance by +40% and EXP gain by +75%.',
      ],
    },
  },

  // Rocket Mutations
  rocketMutations: {
    rocket_homing: {
      name: 'Grav-Guided Warheads',
      desc: 'Base rockets gain smart-target tracking, banking toward the closest enemies in flight.',
    },
    rocket_antimatter: {
      name: 'Antimatter Warheads',
      desc: 'Rockets explode on impact, unleashing a vivid localized cosmic shockwave.',
    },
    rocket_fan: {
      name: 'Spread Salvo',
      desc: 'Primary weapon launches three rockets in a broad celestial spread.',
    },
    rocket_duplicator: {
      name: 'Cluster Start',
      desc: '+2 additional rockets per primary weapon volley.',
    },
    rocket_rail: {
      name: 'Rail Accelerator',
      desc: 'Rockets morph into hypervelocity rail slugs: faster, +2 pierce, leaving luminous blue-white trails.',
    },
    rocket_chain: {
      name: 'Ion Coil',
      desc: 'Rocket impacts discharge cascading electrical arcs into neighboring targets.',
    },
    rocket_ricochet: {
      name: 'Ricochet Matrix',
      desc: 'Rockets ricochet off targets, splintering into guided fragmentation shrapnel.',
    },
    rocket_plasma_trail: {
      name: 'Plasma Wake',
      desc: 'Rockets leave a blistering plasma wake that scorches enemies trailing behind.',
    },
    rocket_gravity_warhead: {
      name: 'Gravity Warhead',
      desc: 'Rockets pull nearby enemies along their vector and draw them into the blast center.',
    },
    rocket_splitter: {
      name: 'Cluster Splitters',
      desc: 'On first impact, the rocket fractures into three high-velocity photon darts.',
    },
    rocket_cryo_core: {
      name: 'Cryo Core',
      desc: 'Rockets gain a cyan cryo-core, temporarily freezing damaged targets solid.',
    },
    rocket_orbital_laser: {
      name: 'Orbital Designator',
      desc: 'Calls down synchronized orbital laser strikes on closest hostile targets.',
    },
  },

  // Synergies / Evolutions
  synergies: {
    syn_clusterstorm: {
      name: 'Cluster Storm',
      desc: 'Rocket Synergy: Antimatter Warheads + Spread Salvo. Explosions shatter into six high-yield plasma sub-projectiles.',
      reqs: ['Antimatter Warheads', 'Spread Salvo'],
    },
    syn_ionlance: {
      name: 'Ion Lance',
      desc: 'Rocket Synergy: Grav-Guided Warheads + Rail Accelerator. A devastating sustained ion beam trails each rocket.',
      reqs: ['Grav-Guided Warheads', 'Rail Accelerator'],
    },
    syn_gravity_storm: {
      name: 'Singularity Salvo',
      desc: 'Rocket Synergy: Gravity Warhead + Cluster Splitters. Split shards produce gravitational pull, collapsing enemies into micro-singularities.',
      reqs: ['Gravity Warhead', 'Cluster Splitters'],
    },
    syn_garlic: {
      name: 'Soul Eater (Black Crown)',
      desc: 'Evolution: Grav-Aura + Vitality Reactor. A crimson micro-singularity manifests around the hull: pulsing damage, resource vortex, and hull regeneration.',
      reqs: ['Grav-Aura (Lv. 5)', 'Vitality Reactor (Lv. 1+)'],
    },
    syn_bible: {
      name: 'Unholy Vespers (Eternal Orbits)',
      desc: 'Evolution: Orbital Relics + Overclock Reactor. Satellites fuse into a permanent ring of violet energy, shredding everything in orbit at extreme velocity.',
      reqs: ['Orbital Relics (Lv. 5)', 'Overclock Reactor (Lv. 1+)'],
    },
    syn_water: {
      name: 'La Borra (Blue Nebula)',
      desc: 'Evolution: Plasma Condensate + Focusing Lens. Blue nebular storms drift slowly toward the ship, drastically expanding the hazard zone.',
      reqs: ['Plasma Condensate (Lv. 5)', 'Focusing Lens (Lv. 1+)'],
    },
    syn_lightning: {
      name: 'Thunder Loop (Overload Loop)',
      desc: 'Evolution: Ion Discharger + Quantum Duplicator. Every ion strike hits twice and erupts into violent secondary arcs.',
      reqs: ['Ion Discharger (Lv. 5)', 'Quantum Duplicator (Lv. 1+)'],
    },
    syn_cross: {
      name: 'Heaven Sword (Star Cleaver)',
      desc: 'Evolution: Photonic Boomerang + Quantum Navigator. Boomerangs transform into massive radiant photon blades with critical strike mastery.',
      reqs: ['Photonic Boomerang (Lv. 5)', 'Quantum Navigator (Lv. 1+)'],
    },
    syn_scythe: {
      name: 'Death Spiral (Entropy Spiral)',
      desc: 'Evolution: Plasma Scythe + Stellar Catalyst. Fires a 360-degree radial barrage of 8 massive spinning crimson plasma blades.',
      reqs: ['Plasma Scythe (Lv. 5)', 'Stellar Catalyst (Lv. 1+)'],
    },
    syn_dagger: {
      name: 'Thousand Edge (Photon Barrage)',
      desc: 'Evolution: Blade Flurry + Grav-Thrusters. Fires an unbroken, relentless stream of hypervelocity photon needles.',
      reqs: ['Blade Flurry (Lv. 5)', 'Grav-Thrusters (Lv. 1+)'],
    },
    syn_mana: {
      name: 'Mannajja (Pulsar Pillar)',
      desc: 'Evolution: Cosmic Pillar + Attractor Array. The cosmic beam expands into a gigantic golden shockwave, slowing foes and drawing distant loot.',
      reqs: ['Cosmic Pillar (Lv. 5)', 'Attractor Array (Lv. 1+)'],
    },
    syn_lancet: {
      name: 'Infinite Corridor (Time Corridor)',
      desc: 'Evolution: Chrono-Lancet + Neutron Plating. Projects a chrono-sweep radar ring that freezes enemies and shears off a percentage of their current HP.',
      reqs: ['Chrono-Lancet (Lv. 5)', 'Neutron Plating (Lv. 1+)'],
    },
    syn_laurel: {
      name: 'Crimson Shroud (Crimson Dome)',
      desc: 'Evolution: Aegis Barrier + Nano-Repairer. Holds up to 3 shield charges; retaliates with a radial shockwave of crimson photon daggers when struck.',
      reqs: ['Aegis Barrier (Lv. 5)', 'Nano-Repairer (Lv. 1+)'],
    },
  },

  // Fallbacks
  fallbacks: {
    fallback_repair: {
      name: 'Emergency Hull Repair',
      desc: 'Nanobots immediately restore +45 HP of ship hull integrity.',
      statDelta: '+45 Hull HP',
    },
    fallback_credits: {
      name: 'Quantum Credit Cache',
      desc: 'Synthesizes power crystals: +250 galactic credits for the hangar.',
      statDelta: '+250 Credits to bank',
    },
    fallback_shield: {
      name: 'Shield Supercharge',
      desc: 'Fully recharges the energy barrier and expands shield capacity by +1.',
      statDelta: '+1 Capacity / Full Shield',
    },
  },

  // Sectors
  sectors: {
    earth: {
      name: 'Earth Orbit',
      subtitle: 'Sector 1',
      desc: 'Defensive perimeter of humanity’s homeworld. The ideal staging ground to calibrate ship combat systems.',
      bossTitle: 'Heavy Siege Dreadnought',
    },
    nebula: {
      name: 'Omega Nebula',
      subtitle: 'Sector 2',
      desc: 'Ionized violet gas clouds. Hostile vessels here are far more aggressive and maneuver swiftly.',
      bossTitle: 'Multi-headed Plasma Flagship',
    },
    asteroid: {
      name: 'Ceres Belt',
      subtitle: 'Sector 3',
      desc: 'Dense cluster of ancient asteroids and meteorite dust. Enemies are outfitted with heavy kinetic plating.',
      bossTitle: 'Rotating Combat Citadel',
    },
    singularity: {
      name: 'Event Horizon',
      subtitle: 'Sector 4 (Endgame)',
      desc: 'Gravitational well of a supermassive black hole. Spacetime fractures under the onslaught of Void Phantoms.',
      bossTitle: 'Avatar of Cosmic Entropy',
    },
  },

  // Ship Skins
  skins: {
    starter: { name: 'Vanguard Alpha' },
    interceptor: { name: 'Ghost Interceptor' },
    phantom: { name: 'Cyber Phantom' },
    earth_defender: { name: 'Earth Defender' },
    asteroid_miner: { name: 'Asteroid Miner' },
    golden_void: { name: 'Aura Void' },
  },

  // Rocket Skins
  rocketSkins: {
    classic: {
      name: 'Azure Sting',
      desc: 'Classic swift rocket with a luminous cyan energy trail',
    },
    crimson: {
      name: 'Crimson Fury',
      desc: 'Futuristic angular missile burning with fierce fury',
    },
    green: {
      name: 'Venom Spore',
      desc: 'Organic missile with a corrosive acidic discharge',
    },
    nebula_pulse: {
      name: 'Nebula Pulse',
      desc: 'Omega nebula power projectile with a violet wake',
    },
    gold: {
      name: 'Gold Torpedo',
      desc: 'Heavy elite torpedo of radiant golden gleam',
    },
    purple: {
      name: 'Void Comet',
      desc: 'Helical comet dragging a wake of dark void matter',
    },
    singularity_core: {
      name: 'Singularity Core',
      desc: 'Event horizon quantum projectile with gravitational distortion',
    },
    paradise: {
      name: 'Paradise Pulse',
      desc: 'Linear lance with trailing thruster rings',
    },
    korean: {
      name: 'Korean Phoenix',
      desc: 'Red and blue rocket driven by twin flame vortices',
    },
  },
};
