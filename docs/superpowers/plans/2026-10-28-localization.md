# Full English & Russian Localization Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement full English and Russian localization for Void Hunter with runtime language switching accessible from both the main menu header and the settings modal, persisted in localStorage.

**Architecture:** A lightweight React Context-based i18n system (`src/i18n/`) with strongly typed translation schemas, providing reactive translations (`useI18n`) across all React UI components and helper functions for canvas and dynamic game objects (upgrades, sectors, skins, synergies).

**Tech Stack:** React 19, TypeScript 5.8, Tailwind CSS v4, Vite 6.

**Spec:** Localize 100% of the game text (weapons, passives, synergies, rockets, sectors, skins, HUD, menus, modals, canvas alerts) into idiomatic English and preserve exact Russian text, with persistent language toggle in both the main menu header and the settings modal.

## Global Constraints
- TypeScript must pass strict type check (`npm --prefix c:\bat\void run lint`).
- Production build must succeed cleanly (`npm --prefix c:\bat\void run build`).
- Preserves all game mechanics, tags, prices, ids, sound triggers, and stats without regressions.
- No external heavy dependencies like i18next; use a lean, zero-dependency, fully typed custom React context.

## Review Focus
- Upgrades/Synergies dynamic level text and requirements tags match active language.
- Date formatting in Run History uses `'ru-RU'` or `'en-US'` depending on active language.
- Canvas hazard alerts ('ION STRIKE' vs 'ИОННЫЙ УДАР', 'GRAVITY SURGE' vs 'ГРАВИ-ВОЗМУЩЕНИЕ') render correctly in chosen language.
- Language switcher in main menu header and settings modal are kept in sync and update all UI instantly.
- LocalStorage persistence restores selected language upon page refresh.

---

### Task 1: Create i18n Core Types and Translation Dictionaries

**Files:**
- Create: `c:\bat\void\src\i18n/types.ts`
- Create: `c:\bat\void\src\i18n/translations/ru.ts`
- Create: `c:\bat\void\src\i18n/translations/en.ts`
- Create: `c:\bat\void\src\i18n/index.tsx`

- [ ] Define `Language` type (`'ru' | 'en'`) and translation schema interface in `src/i18n/types.ts`.
- [ ] Implement `src/i18n/translations/ru.ts` containing all existing Russian UI text, upgrade names/descriptions, sector details, skins, and alerts.
- [ ] Implement `src/i18n/translations/en.ts` with complete, polished English translations for all keys.
- [ ] Implement `src/i18n/index.tsx` exporting `I18nProvider`, `useI18n()`, `t()`, and helper functions for upgrades and sectors.
- [ ] Verify TypeScript types compile cleanly.

---

### Task 2: Integrate Upgrades, Sectors, and Skins Localization

**Files:**
- Modify: `c:\bat\void\src\types.ts`
- Modify: `c:\bat\void\src\utils/upgrades.ts`

- [ ] Add localization helper methods to retrieve localized names, descriptions, and synergy requirements for active language in `src/utils/upgrades.ts`.
- [ ] Update `SECTORS` in `src/types.ts` or add sector localization lookup helper so sector names, subtitles, descriptions, and boss titles update reactively based on language.
- [ ] Update `getPlayerBuild` in `src/utils/upgrades.ts` to output localized names for weapons, passives, and rocket mutations.
- [ ] Verify `npm --prefix c:\bat\void run lint`.

---

### Task 3: Localize Components (SectorSelectScreen, SectorVictoryModal, HangarScreen, SecondaryScreens)

**Files:**
- Modify: `c:\bat\void\src\components/SectorSelectScreen.tsx`
- Modify: `c:\bat\void\src\components/SectorVictoryModal.tsx`
- Modify: `c:\bat\void\src\components/HangarScreen.tsx`
- Modify: `c:\bat\void\src\components/SecondaryScreens.tsx`

- [ ] Localize `SectorSelectScreen.tsx` (title, descriptions, unlock status, boss targets, rewards, buttons).
- [ ] Localize `SectorVictoryModal.tsx` (victory announcement, score/credits summary, first clear rewards, action buttons).
- [ ] Localize `HangarScreen.tsx` (tabs, ship/rocket cards, passwords modal, purchase confirmations, alerts).
- [ ] Localize `SecondaryScreens.tsx` (Leaderboard, Run History with locale date formatting, Codex synergies).
- [ ] Verify `npm --prefix c:\bat\void run lint`.

---

### Task 4: Localize GameCanvas and In-Game HUD

**Files:**
- Modify: `c:\bat\void\src\components/GameCanvas.tsx`

- [ ] Update canvas hazard warnings (Ion Strike, Gravity Surge) to read active language.
- [ ] Update HUD stats (Score, Wave, Level, Hull, Sector Flagship warnings, Endless Mode banner, Exp, Laser, Pause).
- [ ] Verify canvas animations and rendering are intact and lint passes.

---

### Task 5: Localize App.tsx & Add Dual Language Switchers (Header & Settings Modal)

**Files:**
- Modify: `c:\bat\void\src\App.tsx`
- Modify: `c:\bat\void\src\main.tsx`

- [ ] Wrap application with `I18nProvider` in `src/main.tsx` (or top of `App.tsx`).
- [ ] Replace all hardcoded Russian text in `App.tsx` (Menu, Level Up cards, Pause modal, Settings modal, Game Over modal, Controls bar) with `t(...)`.
- [ ] Add Language toggle button (`[🌐 RU]` / `[🌐 EN]`) in Main Menu header next to Settings and Sound buttons.
- [ ] Add Language selector option (RU / EN buttons) inside the Settings modal.
- [ ] Verify reactive language change updates both switchers and all active screens instantly.

---

### Task 6: End-to-End Verification and Build

- [ ] Run `npm --prefix c:\bat\void run lint`.
- [ ] Run `npm --prefix c:\bat\void run build`.
- [ ] Verify that switching languages updates:
  - Main menu and header
  - Settings modal
  - Hangar (ships and rockets)
  - Galaxy sectors
  - Upgrade selection cards
  - In-game HUD and alerts
  - Secondary screens (Codex, History, Leaderboard)
  - Victory and Game Over screens
