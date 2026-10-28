/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type Language = 'ru' | 'en';

export interface WeaponTranslation {
  name: string;
  descriptions: string[];
}

export interface PassiveTranslation {
  name: string;
  descriptions: string[];
}

export interface RocketMutationTranslation {
  name: string;
  desc: string;
}

export interface SynergyTranslation {
  name: string;
  desc: string;
  reqs: [string, string];
}

export interface FallbackTranslation {
  name: string;
  desc: string;
  statDelta: string;
}

export interface SectorTranslation {
  name: string;
  subtitle: string;
  desc: string;
  bossTitle: string;
}

export interface RocketSkinTranslation {
  name: string;
  desc: string;
}

export interface ShipSkinTranslation {
  name: string;
}

export interface Translations {
  // Navigation & Common
  subHeader: string;
  settings: string;
  sfx: string;
  music: string;
  language: string;
  menu: string;
  back: string;
  cancel: string;
  close: string;
  on: string;
  off: string;
  creditsSuffix: string;
  pointsSuffix: string;

  // Main Menu
  selectedShip: string;
  activeShip: string;
  changeShip: string;
  selectedSector: string;
  sectorObjective: string;
  sectorObjectiveDesc: string;
  allSectors: string;
  hangar: string;
  hangarDesc: string;
  records: string;
  history: string;
  codex: string;
  startGame: string;
  controlsHint: string;
  pauseHint: string;

  // HUD
  score: string;
  wave: string;
  level: string;
  hull: string;
  exp: string;
  laser: string;
  pause: string;
  endlessMode: string;
  defenseAlert: string;
  flagshipApproaching: string;
  ionStrike: string;
  gravitySurge: string;

  // Level Up Modal
  newLevel: string;
  levelReached: string;
  reroll: string;
  rerollsLeft: string;
  evolutionBadge: string;
  upgradeBadge: string;
  levelPrefix: string;

  // Pause Modal
  paused: string;
  resume: string;
  restart: string;
  toMenu: string;
  currentBuild: string;
  weapons: string;
  passives: string;
  rocketPerks: string;
  synergiesLabel: string;
  emptyBuildNotice: string;
  evolvedBadge: string;

  // Settings Modal
  settingsHeader: string;
  screenShake: string;
  screenShakeDesc: string;
  shakeOff: string;
  shakeLow: string;
  shakeMed: string;
  shakeHigh: string;
  flashEffects: string;
  flashEffectsDesc: string;
  graphicsQuality: string;
  graphicsQualityDesc: string;
  gfxLow: string;
  gfxMed: string;
  gfxHigh: string;
  audioSettings: string;
  audioSettingsDesc: string;
  sfxToggle: string;
  musicToggle: string;
  languageSetting: string;
  languageSettingDesc: string;

  // Game Over Modal
  shipDestroyed: string;
  pointsWon: string;
  statsLevel: string;
  statsWave: string;
  statsCredits: string;
  collectedBuildHeader: string;
  noUpgradesTaken: string;
  playAgain: string;

  // Sector Select Screen
  sectorsTitle: string;
  sectorsDesc: string;
  targetScoreLabel: string;
  flagshipLabel: string;
  trophyLabel: string;
  selectedBadge: string;
  lockedBadge: string;
  unlockTip: string;
  launchSector: string;
  selectSector: string;
  sectorHint: string;
  previousSectorUnlock: string;

  // Sector Victory Modal
  missionAccomplished: string;
  sectorCleared: string;
  flagshipDestroyedDesc: string;
  finalScoreLabel: string;
  creditsEarnedLabel: string;
  firstClearReward: string;
  bonusCreditsReward: string;
  unlockedShipReward: string;
  unlockedRocketReward: string;
  nextSectorUnlockedReward: string;
  claimAndExit: string;
  continueEndless: string;

  // Hangar Screen
  hangarTitle: string;
  balanceLabel: string;
  shipsTab: string;
  rocketsTab: string;
  hullClass: string;
  activatedShip: string;
  selectShipAction: string;
  chargedRocket: string;
  selectRocketAction: string;
  codeOrPrice: string;
  passcodeModalTitle: string;
  passcodeModalDesc: string;
  passcodePlaceholder: string;
  buyWithCreditsBtn: string;
  enterCodeBtn: string;
  invalidCodeError: string;
  insufficientCreditsError: string;
  insufficientCreditsAlert: string;

  // Secondary Screens (Leaderboards, History, Codex)
  leaderboardTab: string;
  historyTab: string;
  codexTab: string;
  leaderboardTitle: string;
  firstPlayer: string;
  youBadge: string;
  personalRecord: string;
  maxWave: string;
  noRunsYet: string;
  runsWillLoadHere: string;
  localSaveNotice: string;
  historyTitle: string;
  runNumber: string;
  victoryLabel: string;
  emptyHistory: string;
  emptyHistoryTip: string;
  earnedCreditsLabel: string;
  codexTitle: string;
  codexDesc: string;
  unlockedCodexBadge: string;
  lockedCodexBadge: string;

  // Weapons, Passives, Mutations, Synergies, Fallbacks, Sectors, Skins
  weaponsMeta: Record<string, WeaponTranslation>;
  passivesMeta: Record<string, PassiveTranslation>;
  rocketMutations: Record<string, RocketMutationTranslation>;
  synergies: Record<string, SynergyTranslation>;
  fallbacks: Record<string, FallbackTranslation>;
  sectors: Record<string, SectorTranslation>;
  skins: Record<string, ShipSkinTranslation>;
  rocketSkins: Record<string, RocketSkinTranslation>;
}
