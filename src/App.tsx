/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { GameState, Player, Upgrade, RunHistoryItem, Skin, RocketSkin, SectorConfig, SECTORS, GameSettings, getLocalizedSector, getLocalizedSkin, getLocalizedRocketSkin } from './types';
import GameCanvas from './components/GameCanvas';
import HangarScreen from './components/HangarScreen';
import SecondaryScreens from './components/SecondaryScreens';
import SectorSelectScreen from './components/SectorSelectScreen';
import SectorVictoryModal from './components/SectorVictoryModal';
import { pickUpgrades, spd, TOTAL_SYNERGIES_COUNT, getPlayerBuild, getLocalizedUpgrade } from './utils/upgrades';
import { Sound } from './utils/sound';
import { Music } from './utils/music';
import { PerkIcon, ShipIcon, RocketIcon, BossIcon } from './utils/icons';
import { useI18n } from './i18n';

export default function App() {
  const { t, language, setLanguage, toggleLanguage } = useI18n();

  // Global Metagame states loaded from localStorage
  const [bankCredits, setBankCredits] = useState<number>(0);
  const [selectedSkin, setSelectedSkin] = useState<string>('classic');
  const [selectedRocketSkin, setSelectedRocketSkin] = useState<string>('classic');
  const [selectedSector, setSelectedSector] = useState<SectorConfig>(SECTORS[0]);
  const [unlockedSectors, setUnlockedSectors] = useState<string[]>(['earth']);
  const [isEndless, setIsEndless] = useState<boolean>(false);
  const [bankedRunCredits, setBankedRunCredits] = useState<number>(0);
  const [victoryData, setVictoryData] = useState<{
    sector: SectorConfig;
    score: number;
    credits: number;
    isFirstClear: boolean;
    nextSectorName?: string;
  } | null>(null);

  const [bestWave, setBestWave] = useState<number>(0);
  const [bestScore, setBestScore] = useState<number>(0);
  const [runHistory, setRunHistory] = useState<RunHistoryItem[]>([]);
  const [unlockedSynergies, setUnlockedSynergies] = useState<string[]>([]);
  
  // Audio state
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [isMusicMuted, setIsMusicMuted] = useState<boolean>(() => Music.getMuted());

  // Game Settings (shake, flash, particles)
  const [settings, setSettings] = useState<GameSettings>(() => {
    try {
      const raw = localStorage.getItem('void_hunter_settings');
      if (raw) return JSON.parse(raw);
    } catch {}
    return {
      shakeIntensity: 1.0,
      flashEnabled: true,
      particlesLevel: 'high',
    };
  });
  const [showSettingsModal, setShowSettingsModal] = useState<boolean>(false);

  const updateSettings = (partial: Partial<GameSettings>) => {
    setSettings(prev => {
      const next = { ...prev, ...partial };
      try {
        localStorage.setItem('void_hunter_settings', JSON.stringify(next));
      } catch {}
      return next;
    });
  };

  // Ship Skins lists
  const [skins, setSkins] = useState<Skin[]>([
    { id: 'classic', name: 'Azure Core', col: '#2ed8ff', price: 0, owned: true },
    { id: 'crimson', name: 'Crimson Fury', col: '#ff4e6a', price: 120, owned: false },
    { id: 'green', name: 'Venom Stinger', col: '#39ff8a', price: 150, owned: false },
    { id: 'gold', name: 'Gold Emperor', col: '#ffd166', price: 200, owned: false },
    { id: 'purple', name: 'Void Phantom', col: '#b06aff', price: 300, owned: false },
    { id: 'earth_defender', name: 'Earth Defender', col: '#38bdf8', price: 450, owned: false, gradient: ['#38bdf8', '#10b981', '#064e3b'] },
    { id: 'asteroid_miner', name: 'Asteroid Miner', col: '#fb923c', price: 650, owned: false, gradient: ['#fb923c', '#d97706', '#78350f'] },
    { id: 'paradise', name: 'Paradise Cruiser', col: '#0ea5e9', price: 500, owned: false, password: 'ayen', gradient: ['#0ea5e9', '#38bdf8', '#e0f2fe'] },
    { id: 'korean', name: 'Korean Phoenix', col: '#ff3b5c', price: 700, owned: false, password: 'lilkeed', gradient: ['#ff3b5c', '#ffffff', '#0066ff'] },
  ]);

  // Customizable Rocket Skins lists!
  const [rocketSkins, setRocketSkins] = useState<RocketSkin[]>([
    { id: 'classic', name: 'Azure Sting', col: '#38bdf8', price: 0, owned: true, desc: 'Классическая ионная ракета с приятным шлейфом энергии' },
    { id: 'crimson', name: 'Crimson Fury', col: '#f43f5e', price: 80, owned: false, desc: 'Трёхугольная фугасная ракета, извергающая алые искры' },
    { id: 'green', name: 'Venom Spore', col: '#34d399', price: 110, owned: false, desc: 'Органический снаряд с разъедающим ядовитым выбросом' },
    { id: 'nebula_pulse', name: 'Nebula Pulse', col: '#c084fc', price: 250, owned: false, desc: 'Плазменный снаряд туманности Омега с фиолетовым ионным шлейфом' },
    { id: 'gold', name: 'Gold Torpedo', col: '#fbbf24', price: 160, owned: false, desc: 'Золотая элитная торпеда драгоценного сияния' },
    { id: 'purple', name: 'Void Comet', col: '#a78bfa', price: 200, owned: false, desc: 'Темпоральный заряд, затягивающий шлейф тёмной энергии' },
    { id: 'singularity_core', name: 'Singularity Core', col: '#f43f5e', price: 500, owned: false, desc: 'Квантовый снаряд горизонта событий с гравитационным шлейфом' },
    { id: 'paradise', name: 'Paradise Pulse', col: '#ffffff', price: 300, owned: false, desc: 'Целестиальная стрела с мягким плазменным кольцом сопла' },
    { id: 'korean', name: 'Korean Phoenix', col: '#ff3b5c', price: 400, owned: false, desc: 'Красно-синяя ракета Феникса с двойной огненной тягой' },
  ]);

  // Overall controller active screen layout state
  const [activeScreen, setActiveScreen] = useState<'menu' | 'playing' | 'upgrade' | 'pause' | 'stats' | 'leaderboard' | 'history' | 'codex' | 'hangar' | 'sector_select'>('menu');
  
  // Game session parameters
  const [endPayload, setEndPayload] = useState<{
    score: number;
    wave: number;
    level: number;
    credits: number;
    tags: string[];
    damage: number;
    dps: number;
  } | null>(null);

  const [activePlayer, setActivePlayer] = useState<Player | null>(null);
  const [currentLevel, setCurrentLevel] = useState<number>(1);
  const [currentUpgrades, setCurrentUpgrades] = useState<Upgrade[]>([]);
  const [rerolls, setRerolls] = useState<number>(3);
  const [gameTick, setGameTick] = useState<number>(0);

  // Load persistence State on mount
  useEffect(() => {
    try {
      const raw = localStorage.getItem('void_hunter_state');
      if (raw) {
        const meta = JSON.parse(raw);
        if (meta.bankCredits !== undefined) setBankCredits(meta.bankCredits);
        if (meta.selectedSkin) setSelectedSkin(meta.selectedSkin);
        if (meta.selectedRocketSkin) setSelectedRocketSkin(meta.selectedRocketSkin);
        if (meta.bestWave) setBestWave(meta.bestWave);
        if (meta.bestScore) setBestScore(meta.bestScore);
        if (meta.runHistory) setRunHistory(meta.runHistory);
        if (meta.unlockedSynergies) setUnlockedSynergies(meta.unlockedSynergies);
        if (meta.unlockedSectors && meta.unlockedSectors.length > 0) {
          setUnlockedSectors(meta.unlockedSectors);
        }
        if (meta.selectedSector) {
          const found = SECTORS.find(s => s.id === meta.selectedSector);
          if (found) setSelectedSector(found);
        }

        // Sync owned skins list
        if (meta.skins) {
          setSkins(prev =>
            prev.map(s => {
              const saved = meta.skins.find((item: any) => item.id === s.id);
              if (saved) return { ...s, owned: saved.owned };
              return s;
            })
          );
        }

        // Sync owned rocket skins list
        if (meta.rocketSkins) {
          setRocketSkins(prev =>
            prev.map(r => {
              const saved = meta.rocketSkins.find((item: any) => item.id === r.id);
              if (saved) return { ...r, owned: saved.owned };
              return r;
            })
          );
        }
      }
    } catch (e) {
      console.error('Failed to load local game metadata: ', e);
    }
  }, []);

  // Save persistence on modification
  const saveState = (
    credits: number,
    skin: string,
    rocketSkin: string,
    wave: number,
    score: number,
    historyList: RunHistoryItem[],
    synergyList: string[],
    skinsList: Skin[],
    rocketList: RocketSkin[],
    unlockedSecs?: string[],
    selSectorId?: string
  ) => {
    try {
      const payload = {
        bankCredits: credits,
        selectedSkin: skin,
        selectedRocketSkin: rocketSkin,
        selectedSector: selSectorId || selectedSector.id,
        unlockedSectors: unlockedSecs || unlockedSectors,
        bestWave: wave,
        bestScore: score,
        runHistory: historyList,
        unlockedSynergies: synergyList,
        skins: skinsList.map(s => ({ id: s.id, owned: s.owned })),
        rocketSkins: rocketList.map(r => ({ id: r.id, owned: r.owned })),
      };
      localStorage.setItem('void_hunter_state', JSON.stringify(payload));
    } catch (e) {
      console.error('Failed to save metagame state: ', e);
    }
  };

  const handleMuteToggle = () => {
    const nextVal = !isMuted;
    setIsMuted(nextVal);
    Sound.muted = nextVal;
  };

  const handleMusicToggle = () => {
    const nextVal = Music.toggleMute();
    setIsMusicMuted(nextVal);
  };

  const handleStartRun = () => {
    setRerolls(3);
    setBankedRunCredits(0);
    setGameTick(p => p + 1);
    setActiveScreen('playing');
    Sound.resume();
    Music.start();
  };

  // Upgrades mechanics
  const handleLevelUp = (level: number, player: Player) => {
    setActivePlayer(player);
    setCurrentLevel(level);
    
    // Pick 3 candidate upgrade cards (with fallbacks if pool exhausted)
    const picked = pickUpgrades(player);
    setCurrentUpgrades(picked);
    setRerolls(level % 5 === 0 ? rerolls + 1 : rerolls); // extra reroll each 5 levels
    setActiveScreen('upgrade');
  };

  const handleSelectUpgrade = (upg: Upgrade) => {
    if (!activePlayer) return;

    upg.apply(activePlayer);
    
    if (activePlayer.maxShield && activePlayer.shield < 1) {
      activePlayer.shield = 1;
    }

    // Handle fallback credits reward
    if (activePlayer.tags.has('bonus_credits_250')) {
      activePlayer.tags.delete('bonus_credits_250');
      setBankCredits(prev => {
        const next = prev + 250;
        saveState(
          next,
          selectedSkin,
          selectedRocketSkin,
          bestWave,
          bestScore,
          runHistory,
          unlockedSynergies,
          skins,
          rocketSkins,
          unlockedSectors,
          selectedSector.id
        );
        return next;
      });
    }

    // Capture newly unlocked synergies
    if (upg.synergy && !unlockedSynergies.includes(upg.id)) {
      const updatedSynergies = [...unlockedSynergies, upg.id];
      setUnlockedSynergies(updatedSynergies);
      saveState(
        bankCredits,
        selectedSkin,
        selectedRocketSkin,
        bestWave,
        bestScore,
        runHistory,
        updatedSynergies,
        skins,
        rocketSkins,
        unlockedSectors,
        selectedSector.id
      );
      Sound.play('synergy');
    } else {
      Sound.play('upgrade');
    }

    setActiveScreen('playing');
  };

  const handleReroll = () => {
    if (rerolls > 0 && activePlayer) {
      setRerolls(p => p - 1);
      const picked = pickUpgrades(activePlayer);
      setCurrentUpgrades(picked);
    }
  };

  const handleEndRun = (
    score: number,
    wave: number,
    level: number,
    credits: number,
    tags: string[],
    damage: number,
    dps: number
  ) => {
    // Only deposit unbanked portion of credits to avoid double-awarding
    const unbanked = Math.max(0, credits - bankedRunCredits);
    const updatedCredits = bankCredits + unbanked;
    const updatedWave = Math.max(bestWave, wave);
    const updatedScore = Math.max(bestScore, score);

    const historyRecord: RunHistoryItem = {
      date: new Date().toISOString(),
      score,
      wave,
      level,
      credits,
      skin: selectedSkin,
      rocketSkin: selectedRocketSkin,
      upgrades: tags,
      victory: false,
      sectorId: selectedSector.id,
      sectorName: selectedSector.name,
    };
    const updatedHistory = [historyRecord, ...runHistory].slice(0, 10);

    setBankedRunCredits(credits);
    setBankCredits(updatedCredits);
    setBestWave(updatedWave);
    setBestScore(updatedScore);
    setRunHistory(updatedHistory);
    setEndPayload({ score, wave, level, credits, tags, damage, dps });

    saveState(
      updatedCredits,
      selectedSkin,
      selectedRocketSkin,
      updatedWave,
      updatedScore,
      updatedHistory,
      unlockedSynergies,
      skins,
      rocketSkins,
      unlockedSectors,
      selectedSector.id
    );
  };

  // Select ship skin
  const handleSelectSkin = (id: string) => {
    setSelectedSkin(id);
    saveState(
      bankCredits,
      id,
      selectedRocketSkin,
      bestWave,
      bestScore,
      runHistory,
      unlockedSynergies,
      skins,
      rocketSkins
    );
  };

  // Select rocket skin launcher configuration
  const handleSelectRocketSkin = (id: string) => {
    setSelectedRocketSkin(id);
    saveState(
      bankCredits,
      selectedSkin,
      id,
      bestWave,
      bestScore,
      runHistory,
      unlockedSynergies,
      skins,
      rocketSkins
    );
  };

  // Buy or input code for ship skins
  const handleUnlockSkin = (id: string, passwordAttempt?: string) => {
    const index = skins.findIndex(s => s.id === id);
    if (index === -1) return false;

    const s = skins[index];
    
    // Unlock using purchase or password verification
    if (passwordAttempt === '_BUY_WITH_CREDITS_') {
      if (bankCredits >= s.price) {
        const nextCredits = bankCredits - s.price;
        setBankCredits(nextCredits);
        const nextSkins = [...skins];
        nextSkins[index].owned = true;
        setSkins(nextSkins);
        setSelectedSkin(id);
        saveState(
          nextCredits,
          id,
          selectedRocketSkin,
          bestWave,
          bestScore,
          runHistory,
          unlockedSynergies,
          nextSkins,
          rocketSkins
        );
        Sound.play('synergy');
        return true;
      }
    } else if (s.password && s.password === passwordAttempt) {
      const nextSkins = [...skins];
      nextSkins[index].owned = true;
      setSkins(nextSkins);
      setSelectedSkin(id);
      saveState(
        bankCredits,
        id,
        selectedRocketSkin,
        bestWave,
        bestScore,
        runHistory,
        unlockedSynergies,
        nextSkins,
        rocketSkins
      );
      Sound.play('synergy');
      return true;
    } else if (!s.password && bankCredits >= s.price) {
      const nextCredits = bankCredits - s.price;
      setBankCredits(nextCredits);
      const nextSkins = [...skins];
      nextSkins[index].owned = true;
      setSkins(nextSkins);
      setSelectedSkin(id);
      saveState(
        nextCredits,
        id,
        selectedRocketSkin,
        bestWave,
        bestScore,
        runHistory,
        unlockedSynergies,
        nextSkins,
        rocketSkins
      );
      Sound.play('synergy');
      return true;
    }
    return false;
  };

  // Buying rocket launcher skin configurations
  const handleUnlockRocketSkin = (id: string) => {
    const index = rocketSkins.findIndex(r => r.id === id);
    if (index === -1) return false;

    const r = rocketSkins[index];
    if (bankCredits >= r.price) {
      const nextCredits = bankCredits - r.price;
      setBankCredits(nextCredits);
      const nextRockets = [...rocketSkins];
      nextRockets[index].owned = true;
      setRocketSkins(nextRockets);
      setSelectedRocketSkin(id);
      saveState(
        nextCredits,
        selectedSkin,
        id,
        bestWave,
        bestScore,
        runHistory,
        unlockedSynergies,
        skins,
        nextRockets
      );
      Sound.play('synergy');
      return true;
    }
    return false;
  };

  // Sector Victory handler
  const handleSectorVictory = (sector: SectorConfig, score: number, credits: number) => {
    const secIdx = SECTORS.findIndex(s => s.id === sector.id);
    const nextSec = secIdx < SECTORS.length - 1 ? SECTORS[secIdx + 1] : null;
    const isFirstClear = nextSec ? !unlockedSectors.includes(nextSec.id) : !unlockedSectors.includes('all_cleared');

    // Credit accounting: only award difference since last banked checkpoint + first clear reward
    const unbanked = Math.max(0, credits - bankedRunCredits);
    const sectorBonus = isFirstClear ? sector.reward.credits : 0;
    const nextCredits = bankCredits + unbanked + sectorBonus;
    setBankedRunCredits(credits);
    setBankCredits(nextCredits);

    let nextUnlocked = [...unlockedSectors];
    let nextSkins = [...skins];
    let nextRockets = [...rocketSkins];

    if (isFirstClear) {
      if (nextSec && !nextUnlocked.includes(nextSec.id)) {
        nextUnlocked.push(nextSec.id);
        setUnlockedSectors(nextUnlocked);
      } else if (!nextSec && !nextUnlocked.includes('all_cleared')) {
        nextUnlocked.push('all_cleared');
        setUnlockedSectors(nextUnlocked);
      }

      if (sector.reward.skinId) {
        nextSkins = nextSkins.map(s => s.id === sector.reward.skinId ? { ...s, owned: true } : s);
        setSkins(nextSkins);
      }
      if (sector.reward.rocketSkinId) {
        nextRockets = nextRockets.map(r => r.id === sector.reward.rocketSkinId ? { ...r, owned: true } : r);
        setRocketSkins(nextRockets);
      }
    }

    const nextBestScore = Math.max(bestScore, score);
    setBestScore(nextBestScore);

    // Save victory to runHistory
    const victoryRecord: RunHistoryItem = {
      date: new Date().toISOString(),
      score,
      wave: sector.targetScore,
      level: currentLevel,
      credits: credits + sectorBonus,
      skin: selectedSkin,
      rocketSkin: selectedRocketSkin,
      upgrades: activePlayer ? Array.from(activePlayer.tags) : [],
      victory: true,
      sectorId: sector.id,
      sectorName: sector.name,
    };
    const updatedHistory = [victoryRecord, ...runHistory].slice(0, 10);
    setRunHistory(updatedHistory);

    saveState(
      nextCredits,
      selectedSkin,
      selectedRocketSkin,
      bestWave,
      nextBestScore,
      updatedHistory,
      unlockedSynergies,
      nextSkins,
      nextRockets,
      nextUnlocked,
      sector.id
    );

    setVictoryData({
      sector,
      score,
      credits: credits + sectorBonus,
      isFirstClear,
      nextSectorName: nextSec?.name,
    });
    setActiveScreen('sector_victory');
  };

  return (
    <div className="w-full h-screen bg-[#040609] text-white relative font-sans select-none antialiased">
      {/* Background Star loop wrapper behind everything */}
      <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden opacity-30 select-none">
        <canvas className="absolute block w-full h-full" id="menuBackground" />
      </div>

      {/* Primary gameplay engine loop instance */}
      <div className="w-full h-full z-10 relative">
        <GameCanvas
          state={(activeScreen === 'playing' || activeScreen === 'upgrade' || activeScreen === 'pause' || activeScreen === 'sector_victory') ? activeScreen : 'menu'}
          selectedSkin={selectedSkin}
          selectedRocketSkin={selectedRocketSkin}
          selectedSector={selectedSector}
          rerollTrigger={rerolls}
          onEndRun={handleEndRun}
          onLevelUp={handleLevelUp}
          onSectorVictory={handleSectorVictory}
          isEndless={isEndless}
          onStateChange={(st, pl) => {
            if (pl) setActivePlayer(pl);
            if (st === 'playing' || st === 'upgrade' || st === 'pause' || st === 'stats' || st === 'sector_victory') {
              setActiveScreen(st);
            }
          }}
          gameTick={gameTick}
          settings={settings}
        />
      </div>

      {/* Overlay screens controllers */}

      {/* Main menu Screen overlay */}
      {activeScreen === 'menu' && (
        <div className="fixed inset-0 z-30 overflow-y-auto vh-safe-area bg-zinc-950/90 backdrop-blur-md flex items-start justify-center md:items-center select-none antialiased">
          <div className="w-full max-w-5xl bg-slate-950/95 border border-slate-800 rounded-3xl p-4 sm:p-6 md:p-8 shadow-2xl flex flex-col font-sans my-auto gap-4">
            {/* Header Section */}
            <header className="flex justify-between items-center mb-4 sm:mb-6 border-b border-slate-800 pb-3 sm:pb-4 gap-2">
              <div>
                <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white font-sans flex items-center gap-2">
                  <span>VOID HUNTER</span>
                  <span className="text-slate-400 font-mono text-xs px-2 py-0.5 rounded-full bg-slate-900 border border-slate-800 font-bold">v1.4.0</span>
                </h1>
                <p className="text-slate-400 text-[10px] uppercase tracking-widest mt-0.5 font-mono">
                  {t('subHeader')}
                </p>
              </div>
              <div className="flex gap-1.5 sm:gap-2 items-center flex-shrink-0">
                {/* Language Switch Button */}
                <button
                  onClick={toggleLanguage}
                  className="bg-slate-800 hover:bg-slate-750 text-cyan-300 hover:text-white px-2.5 sm:px-3 py-1.5 rounded-lg text-[10px] font-bold border border-slate-700 hover:border-cyan-500/40 transition uppercase tracking-wider cursor-pointer font-mono flex items-center gap-1.5"
                  title={language === 'ru' ? 'Switch to English' : 'Переключить на русский'}
                >
                  <span className="text-xs">🌐</span>
                  <span>{language === 'ru' ? 'EN' : 'RU'}</span>
                </button>
                <button
                  onClick={() => setShowSettingsModal(true)}
                  className="bg-slate-800 hover:bg-slate-750 text-slate-200 px-2.5 sm:px-3 py-1.5 rounded-lg text-[10px] font-bold border border-slate-700 transition uppercase tracking-wider cursor-pointer font-mono flex items-center gap-1"
                  title={t('settings')}
                >
                  <span>⚙️</span>
                  <span className="hidden sm:inline">{t('settings')}</span>
                </button>
                <button
                  onClick={handleMuteToggle}
                  className="bg-slate-800 hover:bg-slate-750 text-slate-200 px-2 sm:px-3 py-1.5 rounded-lg text-[10px] font-bold border border-slate-700 transition uppercase tracking-wider cursor-pointer font-mono flex items-center gap-1"
                  title={`SFX: ${isMuted ? t('off') : t('on')}`}
                >
                  <span>{isMuted ? '🔇' : '🔊'}</span>
                  <span className="hidden sm:inline">{t('sfx')}</span>
                </button>
                <button
                  onClick={handleMusicToggle}
                  className="bg-slate-800 hover:bg-slate-750 text-slate-200 px-2 sm:px-3 py-1.5 rounded-lg text-[10px] font-bold border border-slate-700 transition uppercase tracking-wider cursor-pointer font-mono flex items-center gap-1"
                  title={`${t('music')}: ${isMusicMuted ? t('off') : t('on')}`}
                >
                  <span>{isMusicMuted ? '🔇' : '🎵'}</span>
                  <span className="hidden sm:inline">{t('music')}</span>
                </button>
              </div>
            </header>

            {/* 3 Balanced Secondary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 flex-grow">
              
              {/* Card 1: Hangar & Loadout */}
              <div className="vh-panel p-4 sm:p-5 flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-center mb-3">
                    <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 font-mono">{language === 'ru' ? 'АНГАР И СНАРЯЖЕНИЕ' : 'HANGAR & LOADOUT'}</h2>
                    <span className="text-[10px] bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 px-2 py-0.5 rounded font-mono font-bold">{language === 'ru' ? 'ГОТОВ' : 'READY'}</span>
                  </div>

                  {/* Ship skin showcase */}
                  <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-3 flex items-center gap-3 mb-2.5">
                    <ShipIcon
                      skinId={selectedSkin}
                      size={44}
                      className="rounded-xl border border-slate-700/80 shadow flex-shrink-0"
                    />
                    <div className="min-w-0">
                      <div className="text-[9px] text-slate-500 uppercase font-mono tracking-wider">{t('hull')}</div>
                      <div className="text-sm font-bold text-slate-100 truncate">
                        {getLocalizedSkin(skins.find(s => s.id === selectedSkin) || skins[0], language).name}
                      </div>
                    </div>
                  </div>

                  {/* Rocket skin showcase */}
                  <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-3 flex items-center gap-3">
                    <RocketIcon
                      skinId={selectedRocketSkin}
                      size={44}
                      className="rounded-xl border border-slate-700/80 shadow flex-shrink-0"
                    />
                    <div className="min-w-0">
                      <div className="text-[9px] text-slate-500 uppercase font-mono tracking-wider">{language === 'ru' ? 'БОЕГОЛОВКА' : 'WARHEAD'}</div>
                      <div className="text-sm font-bold text-slate-100 truncate">
                        {getLocalizedRocketSkin(rocketSkins.find(r => r.id === selectedRocketSkin) || rocketSkins[0], language).name}
                      </div>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => setActiveScreen('hangar')}
                  className="w-full mt-4 vh-secondary-btn hover:text-indigo-300 hover:border-indigo-500/30"
                >
                  🔧 {language === 'ru' ? 'Настроить ангар' : 'Configure Hangar'}
                </button>
              </div>

              {/* Card 2: Mission Sector Console */}
              <div className="vh-panel p-4 sm:p-5 flex flex-col justify-between text-center relative overflow-hidden">
                <div className="flex flex-col items-center">
                  <div className="w-full flex justify-between items-center mb-2">
                    <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 font-mono">{language === 'ru' ? 'СЕКТОР МИССИИ' : 'MISSION SECTOR'}</h2>
                    <span
                      className="text-[10px] font-bold font-mono px-2 py-0.5 rounded border"
                      style={{
                        backgroundColor: `${selectedSector.palette.accentColor}18`,
                        borderColor: `${selectedSector.palette.accentColor}40`,
                        color: selectedSector.palette.accentColor,
                      }}
                    >
                      {getLocalizedSector(selectedSector, language).subtitle}
                    </span>
                  </div>

                  <BossIcon
                    sectorId={selectedSector.id}
                    size={64}
                    className="rounded-2xl border border-cyan-500/30 shadow-[0_0_20px_rgba(6,182,212,0.2)] my-2"
                    title={getLocalizedSector(selectedSector, language).bossName}
                  />

                  <h3 className="text-lg sm:text-xl font-black text-white uppercase tracking-wide">
                    {getLocalizedSector(selectedSector, language).name}
                  </h3>

                  <p className="text-xs text-slate-400 mt-1 max-w-[270px] leading-relaxed">
                    {t('sectorObjective')}: {t('sectorObjectiveDesc', {
                      target: selectedSector.targetScore.toLocaleString(),
                      boss: getLocalizedSector(selectedSector, language).bossName,
                    })}
                  </p>
                </div>

                <button
                  onClick={() => setActiveScreen('sector_select')}
                  className="w-full mt-4 vh-secondary-btn text-cyan-300 hover:text-cyan-200 hover:border-cyan-500/40"
                >
                  🗺️ {language === 'ru' ? 'Сменить сектор' : 'Change Sector'}
                </button>
              </div>

              {/* Card 3: Logbook & Codex */}
              <div className="vh-panel p-4 sm:p-5 flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-center mb-3">
                    <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 font-mono">{language === 'ru' ? 'БОРТОВОЙ ЖУРНАЛ' : 'FLIGHT LOG'}</h2>
                    <span className="text-[10px] bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded font-mono font-bold">{language === 'ru' ? 'ПРОГРЕСС' : 'PROGRESS'}</span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 mb-2.5">
                    <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-2.5">
                      <div className="text-[9px] uppercase tracking-wider text-slate-500 font-mono">{t('score').toUpperCase()}</div>
                      <div className="text-xl font-black font-mono text-cyan-400 mt-0.5">{bestScore.toLocaleString()}</div>
                    </div>
                    <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-2.5">
                      <div className="text-[9px] uppercase tracking-wider text-slate-500 font-mono">{t('maxWave').toUpperCase()}</div>
                      <div className="text-xl font-black font-mono text-indigo-400 mt-0.5">{bestWave}</div>
                    </div>
                  </div>

                  <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-2.5 mb-2.5 flex justify-between items-center">
                    <span className="text-[10px] uppercase tracking-wider text-slate-400 font-mono">{language === 'ru' ? 'СБЕРЕЖЕНИЯ' : 'SAVINGS'}</span>
                    <span className="text-base font-black font-mono text-amber-400">{bankCredits.toLocaleString()} {t('creditsSuffix')}</span>
                  </div>

                  {/* Integrated Synergy Progress Bar */}
                  <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-2.5">
                    <div className="flex justify-between items-center text-[10px] font-mono mb-1">
                      <span className="text-slate-400">{t('synergiesLabel').toUpperCase()}</span>
                      <span className="text-indigo-300 font-bold">{unlockedSynergies.length} / {TOTAL_SYNERGIES_COUNT}</span>
                    </div>
                    <div className="w-full bg-slate-950 h-1.5 rounded-full overflow-hidden">
                      <div
                        className="bg-gradient-to-r from-indigo-500 to-cyan-400 h-full rounded-full transition-all duration-500"
                        style={{ width: `${Math.min(100, Math.max(5, (unlockedSynergies.length / TOTAL_SYNERGIES_COUNT) * 100))}%` }}
                      />
                    </div>
                  </div>
                </div>

                <div className="mt-4 flex gap-2">
                  <button
                    onClick={() => setActiveScreen('leaderboard')}
                    className="flex-1 vh-secondary-btn"
                  >
                    🏆 {t('records')}
                  </button>
                  <button
                    onClick={() => setActiveScreen('codex')}
                    className="flex-1 vh-secondary-btn text-amber-300 hover:text-amber-200"
                  >
                    ⭐ {t('codex')}
                  </button>
                </div>
              </div>

            </div>

            {/* SINGLE PROMINENT CALL-TO-ACTION: LAUNCH RUN */}
            <div className="mt-2">
              <button
                onClick={() => {
                  setIsEndless(false);
                  handleStartRun();
                }}
                className="w-full py-4 vh-primary-action text-white text-base sm:text-lg font-black uppercase tracking-widest cursor-pointer border border-cyan-400/30 flex items-center justify-center gap-3"
              >
                <span className="text-xl sm:text-2xl animate-pulse">🚀</span>
                <span>{t('startGame')}</span>
                <span className="text-xs sm:text-sm font-normal text-cyan-200/90 font-mono tracking-normal hidden sm:inline">
                  • {getLocalizedSector(selectedSector, language).name}
                </span>
              </button>
            </div>

            {/* Bottom Status Bar */}
            <footer className="flex flex-col sm:flex-row justify-between items-center gap-2 mt-4 text-[9px] text-zinc-400 font-mono border-t border-zinc-800/60 pt-3">
              <div className="flex flex-wrap gap-3 items-center">
                <span>{t('controlsHint')}</span>
                <span>{t('pauseHint')}</span>
              </div>
              <div className="text-zinc-500 font-mono">
                VOID HUNTER Engine 60Hz Fixed Simulation
              </div>
            </footer>
          </div>
        </div>
      )}

      {/* Upgrade cards selection Overlay */}
      {activeScreen === 'upgrade' && (
        <div className="fixed inset-0 z-40 vh-safe-area bg-zinc-950/85 backdrop-blur-md flex items-start sm:items-center justify-center select-none overflow-y-auto vh-fade-in">
          <div className="w-full max-w-2xl vh-panel p-4 sm:p-6 shadow-2xl flex flex-col my-auto">
            <div className="text-center mb-3 sm:mb-6">
              <span className="text-[9px] sm:text-[10px] font-black tracking-widest text-indigo-400 uppercase bg-indigo-500/10 px-2.5 py-0.5 sm:px-3 sm:py-1 rounded-full border border-indigo-500/20 font-mono">
                {language === 'ru' ? 'НОВЫЙ УРОВЕНЬ ОРУЖИЯ' : 'WEAPON LEVEL UP'}
              </span>
              <h2 className="text-lg sm:text-2xl font-black text-zinc-100 mt-2 sm:mt-4 tracking-wider">{t('newLevel')}</h2>
              <p className="text-[10px] sm:text-xs text-zinc-400 mt-0.5 sm:mt-1 font-mono">{t('levelReached').toUpperCase()}: <span className="text-indigo-400 font-bold">{currentLevel}</span></p>
            </div>

            {/* List upgrade perks cards */}
            <div className="flex flex-col gap-2.5 sm:gap-3 max-h-[50dvh] sm:max-h-[52vh] overflow-y-auto pr-1">
              {currentUpgrades.map(u => {
                const locU = getLocalizedUpgrade(u, language, activePlayer || undefined);
                const rarColor =
                  u.rar === 'Legendary'
                    ? 'text-amber-400'
                    : u.rar === 'Epic'
                    ? 'text-purple-400'
                    : u.rar === 'Rare'
                    ? 'text-sky-400'
                    : 'text-slate-400';

                const borderLeftColor =
                  u.synergy || u.id.startsWith('syn_')
                    ? 'border-l-amber-400 bg-amber-500/[0.04]'
                    : u.rar === 'Legendary'
                    ? 'border-l-amber-400'
                    : u.rar === 'Epic'
                    ? 'border-l-purple-400'
                    : u.rar === 'Rare'
                    ? 'border-l-sky-400'
                    : 'border-l-slate-600';

                return (
                  <div
                    key={u.id}
                    onClick={() => handleSelectUpgrade(u)}
                    className={`vh-panel vh-panel-interactive p-3 sm:p-4 cursor-pointer text-left flex items-center group relative overflow-hidden border-l-4 hover:bg-slate-900/90 ${borderLeftColor}`}
                    role="button"
                    tabIndex={0}
                    onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleSelectUpgrade(u); } }}
                  >
                    <PerkIcon
                      id={u.id}
                      size={52}
                      className="rounded-xl border border-zinc-700/60 shadow-lg group-hover:scale-105 group-hover:border-indigo-400/60 transition-all flex-shrink-0 mr-3 sm:mr-4"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className={`text-[8px] sm:text-[10px] font-black tracking-widest uppercase font-mono ${rarColor}`}>
                          {u.rar}
                        </span>
                        {u.synergy && (
                          <span className="text-[8px] sm:text-[10px] font-black tracking-widest uppercase text-amber-300 bg-amber-500/15 px-1.5 py-0.5 rounded font-mono border border-amber-500/30">
                            ★ {u.id.startsWith('syn_') ? t('evolutionBadge') : (language === 'ru' ? 'СИНЕРГИЯ' : 'SYNERGY')}
                          </span>
                        )}
                        {u.currentLevel !== undefined && u.nextLevel !== undefined ? (
                          u.currentLevel === 0 ? (
                            <span className="text-[8px] sm:text-[9px] font-mono font-bold text-emerald-400 bg-emerald-500/15 px-1.5 py-0.5 rounded border border-emerald-500/25">
                              ✨ {language === 'ru' ? 'НОВОЕ' : 'NEW'}
                            </span>
                          ) : (
                            <span className="text-[8px] sm:text-[9px] font-mono font-bold text-cyan-300 bg-cyan-500/15 px-1.5 py-0.5 rounded border border-cyan-500/25">
                              {t('levelPrefix').toUpperCase()} {u.currentLevel} → {u.nextLevel}
                            </span>
                          )
                        ) : null}
                      </div>
                      <h3 className="text-xs sm:text-sm font-black text-zinc-100 mt-0.5 sm:mt-1 group-hover:text-cyan-300 transition truncate">
                        {locU.name}
                      </h3>
                      <p className="text-[11px] sm:text-xs text-slate-400 mt-1 leading-snug line-clamp-2">{locU.desc}</p>
                      
                      {/* Stat Delta if available */}
                      {locU.statDelta && (
                        <div className="text-[9px] sm:text-[10px] text-emerald-400 font-mono mt-1 font-semibold flex items-center gap-1">
                          <span>▲</span>
                          <span>{locU.statDelta}</span>
                        </div>
                      )}

                      {/* Synergy Requirements Checklist */}
                      {locU.synergyReqs && locU.synergyReqs.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1.5">
                          {locU.synergyReqs.map((req, idx) => (
                            <span
                              key={idx}
                              className={`text-[8px] sm:text-[9px] font-mono px-1.5 py-0.5 rounded border ${
                                req.met
                                  ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300'
                                  : 'bg-zinc-800/60 border-zinc-700 text-zinc-500'
                              }`}
                            >
                              {req.met ? '✓' : '○'} {req.text}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    <button className="ml-2.5 sm:ml-4 px-3 py-1.5 bg-slate-800 group-hover:bg-cyan-500 text-cyan-300 group-hover:text-slate-950 text-[10px] sm:text-xs font-bold rounded-lg border border-slate-700 group-hover:border-cyan-400 transition pointer-events-none font-mono flex-shrink-0">
                      {language === 'ru' ? 'ВЫБРАТЬ' : 'SELECT'}
                    </button>
                  </div>
                );
              })}
            </div>

            {/* Reroll trigger options */}
            <div className="flex justify-between items-center mt-4 sm:mt-6 pt-2 sm:pt-4 border-t border-zinc-800/60">
              <span className="text-[10px] sm:text-xs text-zinc-400 font-mono">{language === 'ru' ? 'РЕКОМПИЛИРОВАТЬ ДРЕВО' : 'RECOMPILE PERK TREE'}</span>
              <button
                onClick={handleReroll}
                disabled={rerolls <= 0}
                className={`py-2 px-5 text-xs font-black uppercase tracking-wider rounded-xl transition cursor-pointer flex items-center gap-1.5 font-mono ${
                  rerolls > 0
                    ? 'bg-zinc-800 border border-zinc-750 hover:border-zinc-550 text-zinc-100 hover:bg-zinc-750'
                    : 'bg-transparent text-zinc-600 border border-zinc-850 cursor-not-allowed'
                }`}
              >
                🔄 {t('reroll').toUpperCase()} ({rerolls})
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Paused options Selection - Tactical Pause with Build Overview & Settings */}
      {activeScreen === 'pause' && (
        <div className="fixed inset-0 z-40 vh-safe-area bg-zinc-950/85 backdrop-blur-md flex items-center justify-center select-none overflow-y-auto">
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-4 sm:p-6 w-full max-w-lg text-center shadow-2xl bento-glow-indigo my-auto max-h-[92vh] flex flex-col">
            
            {/* Header */}
            <div className="flex items-center justify-between border-b border-zinc-800/80 pb-3 mb-3">
              <div className="text-left">
                <span className="text-[9px] font-black tracking-widest text-indigo-400 uppercase bg-indigo-500/10 px-2.5 py-0.5 rounded-full border border-indigo-500/20 font-mono">
                  {language === 'ru' ? 'ТАКТИЧЕСКИЙ РЕЖИМ' : 'TACTICAL OVERVIEW'}
                </span>
                <h2 className="text-lg sm:text-xl font-black text-zinc-100 mt-1 tracking-wider font-sans">
                  {t('paused')}
                </h2>
              </div>
              <button
                onClick={() => setActiveScreen('playing')}
                className="p-1.5 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800 transition cursor-pointer font-mono text-sm"
                title={t('resume')}
              >
                ✕
              </button>
            </div>

            {/* Scrollable body */}
            <div className="flex-1 overflow-y-auto pr-1 space-y-3.5 text-left">
              
              {/* Build Overview Section */}
              <div className="bg-zinc-950/70 border border-zinc-800/80 rounded-2xl p-3 sm:p-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-[10px] font-mono font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
                    <span>⚡ {t('currentBuild')}</span>
                  </h3>
                  {activePlayer && (
                    <span className="text-[9px] font-mono text-indigo-400 font-semibold">
                      {t('level').toUpperCase()} {currentLevel}
                    </span>
                  )}
                </div>

                {(() => {
                  const build = activePlayer ? getPlayerBuild(activePlayer, language) : { weapons: [], passives: [], rocketPerks: [] };
                  const hasWeapons = build.weapons.length > 0;
                  const hasPassives = build.passives.length > 0;
                  const hasRockets = build.rocketPerks.length > 0;

                  if (!hasWeapons && !hasPassives && !hasRockets) {
                    return (
                      <div className="text-xs text-zinc-500 font-mono py-2 text-center">
                        {t('emptyBuildNotice')}
                      </div>
                    );
                  }

                  return (
                    <div className="space-y-3">
                      {/* Weapons */}
                      {hasWeapons && (
                        <div>
                          <div className="text-[9px] font-mono text-zinc-500 uppercase tracking-widest mb-1.5">
                            {t('weapons')}:
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                            {build.weapons.map(w => (
                              <div
                                key={w.id}
                                className={`flex items-center gap-2 p-1.5 rounded-lg border text-xs font-mono ${
                                  w.isEvolved
                                    ? 'bg-yellow-500/10 border-yellow-500/30 text-yellow-300'
                                    : 'bg-zinc-900 border-zinc-800 text-zinc-200'
                                }`}
                              >
                                <PerkIcon id={w.id} size={28} className="rounded-md border border-zinc-700/50 flex-shrink-0" />
                                <div className="min-w-0 flex-1">
                                  <div className="text-[11px] font-bold truncate leading-tight">{w.name}</div>
                                  <div className="text-[9px] text-zinc-400">
                                    {w.isEvolved ? ('★ ' + t('evolutionBadge')) : `${t('levelPrefix')} ${w.level} / ${w.maxLevel}`}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Passives */}
                      {hasPassives && (
                        <div>
                          <div className="text-[9px] font-mono text-zinc-500 uppercase tracking-widest mb-1.5">
                            {t('passives')}:
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                            {build.passives.map(p => (
                              <div
                                key={p.id}
                                className="flex items-center gap-2 p-1.5 rounded-lg border bg-zinc-900 border-zinc-800 text-xs font-mono text-zinc-200"
                              >
                                <PerkIcon id={p.id} size={28} className="rounded-md border border-zinc-700/50 flex-shrink-0" />
                                <div className="min-w-0 flex-1">
                                  <div className="text-[11px] font-bold truncate leading-tight">{p.name}</div>
                                  <div className="text-[9px] text-indigo-400">
                                    {t('levelPrefix')} {p.level} / {p.maxLevel}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Rocket mutations */}
                      {hasRockets && (
                        <div>
                          <div className="text-[9px] font-mono text-zinc-500 uppercase tracking-widest mb-1">
                            {t('rocketPerks')}:
                          </div>
                          <div className="flex flex-wrap gap-1.5">
                            {build.rocketPerks.map(r => (
                              <span
                                key={r.id}
                                className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-purple-500/15 border border-purple-500/30 text-purple-300"
                              >
                                🚀 {r.name}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })()}
              </div>

              {/* Visual Effects & Performance Settings */}
              <div className="bg-zinc-950/70 border border-zinc-800/80 rounded-2xl p-3 sm:p-4">
                <h3 className="text-[10px] font-mono font-bold text-zinc-400 uppercase tracking-wider mb-2.5">
                  ⚙️ {t('settingsHeader')}
                </h3>
                
                <div className="space-y-2.5 text-xs font-mono">
                  {/* Camera Shake */}
                  <div className="flex items-center justify-between">
                    <span className="text-zinc-300 text-[11px]">{t('screenShake')}:</span>
                    <div className="inline-flex rounded-lg border border-zinc-800 p-0.5 bg-zinc-900">
                      {[
                        { label: t('shakeOff'), val: 0 },
                        { label: '50%', val: 0.5 },
                        { label: '100%', val: 1.0 },
                      ].map(opt => (
                        <button
                          key={opt.val}
                          onClick={() => updateSettings({ shakeIntensity: opt.val })}
                          className={`px-2 py-1 text-[10px] font-bold rounded-md transition cursor-pointer ${
                            settings.shakeIntensity === opt.val
                              ? 'bg-indigo-600 text-white'
                              : 'text-zinc-400 hover:text-zinc-200'
                          }`}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Screen Flash */}
                  <div className="flex items-center justify-between">
                    <span className="text-zinc-300 text-[11px]">{t('flashEffects')}:</span>
                    <button
                      onClick={() => updateSettings({ flashEnabled: !settings.flashEnabled })}
                      className={`px-3 py-1 text-[10px] font-bold rounded-lg border transition cursor-pointer ${
                        settings.flashEnabled
                          ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300'
                          : 'bg-zinc-900 border-zinc-800 text-zinc-500'
                      }`}
                    >
                      {settings.flashEnabled ? `✓ ${t('on')}` : `✕ ${t('off')}`}
                    </button>
                  </div>

                  {/* Particles */}
                  <div className="flex items-center justify-between">
                    <span className="text-zinc-300 text-[11px]">{t('graphicsQuality')}:</span>
                    <div className="inline-flex rounded-lg border border-zinc-800 p-0.5 bg-zinc-900">
                      {[
                        { label: t('gfxLow'), val: 'low' as const },
                        { label: t('gfxMed'), val: 'medium' as const },
                        { label: t('gfxHigh'), val: 'high' as const },
                      ].map(opt => (
                        <button
                          key={opt.val}
                          onClick={() => updateSettings({ particlesLevel: opt.val })}
                          className={`px-2 py-1 text-[10px] font-bold rounded-md transition cursor-pointer ${
                            settings.particlesLevel === opt.val
                              ? 'bg-indigo-600 text-white'
                              : 'text-zinc-400 hover:text-zinc-200'
                          }`}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Language switch in pause */}
                  <div className="flex items-center justify-between pt-1 border-t border-zinc-800/60">
                    <span className="text-zinc-300 text-[11px]">{t('language')}:</span>
                    <div className="inline-flex rounded-lg border border-zinc-800 p-0.5 bg-zinc-900">
                      <button
                        onClick={() => setLanguage('ru')}
                        className={`px-2.5 py-1 text-[10px] font-bold rounded-md transition cursor-pointer ${
                          language === 'ru' ? 'bg-indigo-600 text-white' : 'text-zinc-400 hover:text-zinc-200'
                        }`}
                      >
                        RU
                      </button>
                      <button
                        onClick={() => setLanguage('en')}
                        className={`px-2.5 py-1 text-[10px] font-bold rounded-md transition cursor-pointer ${
                          language === 'en' ? 'bg-indigo-600 text-white' : 'text-zinc-400 hover:text-zinc-200'
                        }`}
                      >
                        EN
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Sound & Audio */}
              <div className="bg-zinc-950/70 border border-zinc-800/80 rounded-2xl p-3 sm:p-4">
                <h3 className="text-[10px] font-mono font-bold text-zinc-400 uppercase tracking-wider mb-2">
                  🔊 {t('audioSettings')}
                </h3>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={handleMuteToggle}
                    className={`py-2 text-[11px] font-bold uppercase tracking-wider rounded-xl transition border cursor-pointer font-mono ${
                      !isMuted
                        ? 'bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border-zinc-700'
                        : 'bg-zinc-900 text-zinc-500 border-zinc-800'
                    }`}
                  >
                    {isMuted ? `🔇 SFX: ${t('off')}` : `🔊 SFX: ${t('on')}`}
                  </button>
                  <button
                    onClick={handleMusicToggle}
                    className={`py-2 text-[11px] font-bold uppercase tracking-wider rounded-xl transition border cursor-pointer font-mono ${
                      !isMusicMuted
                        ? 'bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border-zinc-700'
                        : 'bg-zinc-900 text-zinc-500 border-zinc-800'
                    }`}
                  >
                    {isMusicMuted ? `🔇 ${t('music')}: ${t('off')}` : `🎵 ${t('music')}: ${t('on')}`}
                  </button>
                </div>
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="flex flex-col sm:flex-row gap-2 w-full mt-3 pt-3 border-t border-zinc-800/80">
              <button
                onClick={() => setActiveScreen('playing')}
                className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-black uppercase tracking-wider rounded-xl transition cursor-pointer font-mono shadow-[0_0_15px_rgba(99,102,241,0.3)]"
              >
                ▶ {t('resume').toUpperCase()}
              </button>
              <button
                onClick={() => setActiveScreen('menu')}
                className="py-2.5 px-4 bg-zinc-800 hover:bg-zinc-750 text-zinc-300 hover:text-white text-xs font-bold uppercase tracking-wider rounded-xl transition border border-zinc-700 cursor-pointer font-mono"
              >
                {t('toMenu').toUpperCase()}
              </button>
            </div>

          </div>
        </div>
      )}

      {/* End game metrics board stats overlay */}
      {activeScreen === 'stats' && endPayload && (
        <div className="fixed inset-0 z-40 bg-zinc-950/90 backdrop-blur-md flex items-center justify-center p-4 antialiased select-none">
          <div className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-3xl p-6 shadow-2xl flex flex-col items-center text-center max-h-[92vh] overflow-y-auto bento-glow-indigo">
            <span className="text-3xl">💀</span>
            <div className="text-[10px] uppercase font-bold tracking-widest text-zinc-400 mt-2 bg-indigo-950/30 px-3 py-1 rounded-full border border-indigo-500/25 text-indigo-300 font-mono">
              {language === 'ru' ? 'НОВАЯ ЗАПИСЬ БОРТОВОГО КОМПЬЮТЕРА' : 'FLIGHT LOG RECORD ENTRY'}
            </div>
            <h2 className="text-2xl font-black tracking-wider text-zinc-100 mt-3 uppercase font-sans">
              {language === 'ru' ? 'Забег Завершен' : 'Expedition Terminated'}
            </h2>
            
            <div className="text-5xl font-black text-yellow-400 drop-shadow-[0_0_20px_rgba(251,191,36,0.25)] my-4 font-mono">
              {endPayload.score.toLocaleString()} {t('pointsWon').toUpperCase()}
            </div>

            {/* Run score parameters columns */}
            <div className="grid grid-cols-3 gap-2 w-full my-3 p-3 bg-zinc-950/70 rounded-xl border border-zinc-800">
              <div>
                <div className="text-[9px] uppercase tracking-wider text-zinc-500 font-mono">{t('statsLevel')}</div>
                <div className="text-base font-black text-indigo-400 font-mono">{endPayload.level}</div>
              </div>
              <div>
                <div className="text-[9px] uppercase tracking-wider text-zinc-500 font-mono">{t('statsWave')}</div>
                <div className="text-base font-black text-purple-400 font-mono">{endPayload.wave}</div>
              </div>
              <div>
                <div className="text-[9px] uppercase tracking-wider text-zinc-500 font-mono">{t('statsCredits')}</div>
                <div className="text-base font-black text-yellow-400 font-mono">+{endPayload.credits}</div>
              </div>
            </div>

            {/* Damage metrics */}
            <div className="w-full py-2.5 px-3 bg-zinc-950/40 border border-zinc-800 rounded-xl text-center flex justify-between items-center text-sm">
              <span className="text-[10px] text-zinc-450 font-bold uppercase tracking-wider font-mono">DAMAGE PER SECOND (DPS)</span>
              <span className="text-base font-extrabold text-indigo-400 font-mono">{endPayload.dps.toLocaleString()} DPS</span>
            </div>

            {/* Upgrades selected lists */}
            <div className="w-full mt-4 text-left">
              <div className="text-[10px] font-black text-zinc-400 tracking-wider mb-2 uppercase font-mono">{t('collectedBuildHeader').toUpperCase()}</div>
              <div className="flex flex-wrap gap-1.5 max-h-[14vh] overflow-y-auto pr-1 pb-1">
                {endPayload.tags.length > 0 ? (
                  endPayload.tags.map((tg, i) => (
                    <span key={i} className="text-[10px] font-bold bg-zinc-950 text-zinc-300 border border-zinc-800 px-2 py-1 rounded font-mono flex items-center gap-1.5">
                      <PerkIcon id={tg} size={16} className="rounded" />
                      <span>{tg}</span>
                    </span>
                  ))
                ) : (
                  <span className="text-xs text-zinc-500">{t('noUpgradesTaken')}</span>
                )}
              </div>
            </div>

            {/* End stats button grids */}
            <div className="flex flex-col gap-2 w-full mt-6">
              <button
                onClick={handleStartRun}
                className="w-full py-2.5 bg-gradient-to-r from-indigo-600 to-indigo-500 text-white text-xs font-black uppercase tracking-wider rounded-xl transition cursor-pointer font-mono"
              >
                🔄 {t('playAgain').toUpperCase()}
              </button>
              <button
                onClick={() => setActiveScreen('menu')}
                className="w-full py-2.5 bg-zinc-800 hover:bg-zinc-750 text-zinc-300 hover:text-white text-xs font-bold uppercase tracking-wider rounded-xl transition border border-zinc-700 cursor-pointer font-mono"
              >
                🏠 {t('toMenu').toUpperCase()}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Select skin or rocket selectors overlay */}
      {activeScreen === 'hangar' && (
        <HangarScreen
          bankCredits={bankCredits}
          selectedSkin={selectedSkin}
          selectedRocketSkin={selectedRocketSkin}
          skins={skins}
          rocketSkins={rocketSkins}
          onSelectSkin={handleSelectSkin}
          onSelectRocketSkin={handleSelectRocketSkin}
          onUnlockSkin={handleUnlockSkin}
          onUnlockRocketSkin={handleUnlockRocketSkin}
          onClose={() => setActiveScreen('menu')}
        />
      )}

      {/* Secondary Screens tabs triggers (History, Leaderboards, Codex) */}
      {(activeScreen === 'leaderboard' || activeScreen === 'history' || activeScreen === 'codex') && (
        <SecondaryScreens
          initialTab={activeScreen}
          bestWave={bestWave}
          bestScore={bestScore}
          runHistory={runHistory}
          unlockedSynergies={unlockedSynergies}
          skins={skins}
          onClose={() => setActiveScreen('menu')}
        />
      )}

      {/* Galaxy Sector Selection Screen */}
      {activeScreen === 'sector_select' && (
        <SectorSelectScreen
          unlockedSectors={unlockedSectors}
          selectedSectorId={selectedSector.id}
          onSelectSector={(sec) => {
            setSelectedSector(sec);
            setActiveScreen('menu');
          }}
          onLaunchSector={(sec) => {
            setSelectedSector(sec);
            setIsEndless(false);
            handleStartRun();
          }}
          onClose={() => setActiveScreen('menu')}
        />
      )}

      {/* Sector Victory Screen Modal */}
      {victoryData && (
        <SectorVictoryModal
          sector={victoryData.sector}
          nextSectorName={victoryData.nextSectorName}
          isFirstClear={victoryData.isFirstClear}
          score={victoryData.score}
          creditsEarned={victoryData.credits}
          onClaimAndExit={() => {
            setVictoryData(null);
            setActiveScreen('menu');
          }}
          onContinueEndless={() => {
            setVictoryData(null);
            setIsEndless(true);
            setActiveScreen('playing');
          }}
        />
      )}

      {/* Standalone Settings Modal */}
      {showSettingsModal && (
        <div className="fixed inset-0 z-50 bg-zinc-950/85 backdrop-blur-md flex items-center justify-center p-4 select-none">
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 w-full max-w-md text-left shadow-2xl bento-glow-indigo my-auto">
            <div className="flex items-center justify-between border-b border-zinc-800/80 pb-3 mb-4">
              <div>
                <span className="text-[9px] font-black tracking-widest text-indigo-400 uppercase bg-indigo-500/10 px-2.5 py-0.5 rounded-full border border-indigo-500/20 font-mono">
                  {language === 'ru' ? 'КОНФИГУРАЦИЯ' : 'CONFIGURATION'}
                </span>
                <h2 className="text-xl font-black text-zinc-100 mt-1 tracking-wider font-sans">
                  {t('settingsHeader')}
                </h2>
              </div>
              <button
                onClick={() => setShowSettingsModal(false)}
                className="p-1.5 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800 transition cursor-pointer font-mono text-sm"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4 font-mono text-xs">
              {/* Language Selection */}
              <div className="p-3 bg-zinc-950/70 border border-zinc-800/80 rounded-xl flex items-center justify-between">
                <div>
                  <div className="text-zinc-200 font-bold">{t('languageSetting')}</div>
                  <div className="text-[10px] text-zinc-400">{t('languageSettingDesc')}</div>
                </div>
                <div className="inline-flex rounded-lg border border-zinc-800 p-0.5 bg-zinc-900">
                  <button
                    onClick={() => setLanguage('ru')}
                    className={`px-3 py-1.5 text-[10px] font-bold rounded-md transition cursor-pointer flex items-center gap-1.5 ${
                      language === 'ru'
                        ? 'bg-indigo-600 text-white shadow-sm'
                        : 'text-zinc-400 hover:text-zinc-200'
                    }`}
                  >
                    <span>🇷🇺</span>
                    <span>Русский</span>
                  </button>
                  <button
                    onClick={() => setLanguage('en')}
                    className={`px-3 py-1.5 text-[10px] font-bold rounded-md transition cursor-pointer flex items-center gap-1.5 ${
                      language === 'en'
                        ? 'bg-indigo-600 text-white shadow-sm'
                        : 'text-zinc-400 hover:text-zinc-200'
                    }`}
                  >
                    <span>🇬🇧</span>
                    <span>English</span>
                  </button>
                </div>
              </div>

              {/* Camera Shake */}
              <div className="p-3 bg-zinc-950/70 border border-zinc-800/80 rounded-xl flex items-center justify-between">
                <div>
                  <div className="text-zinc-200 font-bold">{t('screenShake')}</div>
                  <div className="text-[10px] text-zinc-400">{t('screenShakeDesc')}</div>
                </div>
                <div className="inline-flex rounded-lg border border-zinc-800 p-0.5 bg-zinc-900">
                  {[
                    { label: t('shakeOff'), val: 0 },
                    { label: '50%', val: 0.5 },
                    { label: '100%', val: 1.0 },
                  ].map(opt => (
                    <button
                      key={opt.val}
                      onClick={() => updateSettings({ shakeIntensity: opt.val })}
                      className={`px-2.5 py-1 text-[10px] font-bold rounded-md transition cursor-pointer ${
                        settings.shakeIntensity === opt.val
                          ? 'bg-indigo-600 text-white'
                          : 'text-zinc-400 hover:text-zinc-200'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Screen Flash */}
              <div className="p-3 bg-zinc-950/70 border border-zinc-800/80 rounded-xl flex items-center justify-between">
                <div>
                  <div className="text-zinc-200 font-bold">{t('flashEffects')}</div>
                  <div className="text-[10px] text-zinc-400">{t('flashEffectsDesc')}</div>
                </div>
                <button
                  onClick={() => updateSettings({ flashEnabled: !settings.flashEnabled })}
                  className={`px-3 py-1.5 text-[10px] font-bold rounded-lg border transition cursor-pointer ${
                    settings.flashEnabled
                      ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300'
                      : 'bg-zinc-900 border-zinc-800 text-zinc-500'
                  }`}
                >
                  {settings.flashEnabled ? `✓ ${t('on')}` : `✕ ${t('off')}`}
                </button>
              </div>

              {/* Particles */}
              <div className="p-3 bg-zinc-950/70 border border-zinc-800/80 rounded-xl flex items-center justify-between">
                <div>
                  <div className="text-zinc-200 font-bold">{t('graphicsQuality')}</div>
                  <div className="text-[10px] text-zinc-400">{t('graphicsQualityDesc')}</div>
                </div>
                <div className="inline-flex rounded-lg border border-zinc-800 p-0.5 bg-zinc-900">
                  {[
                    { label: t('gfxLow'), val: 'low' as const },
                    { label: t('gfxMed'), val: 'medium' as const },
                    { label: t('gfxHigh'), val: 'high' as const },
                  ].map(opt => (
                    <button
                      key={opt.val}
                      onClick={() => updateSettings({ particlesLevel: opt.val })}
                      className={`px-2.5 py-1 text-[10px] font-bold rounded-md transition cursor-pointer ${
                        settings.particlesLevel === opt.val
                          ? 'bg-indigo-600 text-white'
                          : 'text-zinc-400 hover:text-zinc-200'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Audio quick toggles */}
              <div className="p-3 bg-zinc-950/70 border border-zinc-800/80 rounded-xl flex items-center justify-between">
                <div>
                  <div className="text-zinc-200 font-bold">{t('audioSettings')}</div>
                  <div className="text-[10px] text-zinc-400">{t('audioSettingsDesc')}</div>
                </div>
                <div className="flex gap-1.5">
                  <button
                    onClick={handleMuteToggle}
                    className={`px-2.5 py-1 text-[10px] font-bold rounded-lg border transition cursor-pointer ${
                      !isMuted
                        ? 'bg-zinc-800 text-zinc-200 border-zinc-700'
                        : 'bg-zinc-900 text-zinc-500 border-zinc-800'
                    }`}
                  >
                    {isMuted ? '🔇' : '🔊'} SFX
                  </button>
                  <button
                    onClick={handleMusicToggle}
                    className={`px-2.5 py-1 text-[10px] font-bold rounded-lg border transition cursor-pointer ${
                      !isMusicMuted
                        ? 'bg-zinc-800 text-zinc-200 border-zinc-700'
                        : 'bg-zinc-900 text-zinc-500 border-zinc-800'
                    }`}
                  >
                    {isMusicMuted ? '🔇' : '🎵'} {t('music')}
                  </button>
                </div>
              </div>
            </div>

            <button
              onClick={() => setShowSettingsModal(false)}
              className="w-full mt-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-black uppercase tracking-wider rounded-xl transition cursor-pointer font-mono"
            >
              {language === 'ru' ? 'СОХРАНИТЬ И ЗАКРЫТЬ' : 'SAVE & CLOSE'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
