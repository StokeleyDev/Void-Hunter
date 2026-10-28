/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import {
  Language,
  Translations,
  WeaponTranslation,
  PassiveTranslation,
  RocketMutationTranslation,
  SynergyTranslation,
  FallbackTranslation,
  SectorTranslation,
  RocketSkinTranslation,
  ShipSkinTranslation,
} from './types';
import { ru } from './translations/ru';
import { en } from './translations/en';

export * from './types';

const TRANSLATIONS: Record<Language, Translations> = {
  ru,
  en,
};

const STORAGE_KEY = 'void_hunter_lang';

let currentGlobalLanguage: Language = 'ru';

export function getInitialLanguage(): Language {
  if (typeof window === 'undefined') return 'ru';
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved === 'ru' || saved === 'en') {
    currentGlobalLanguage = saved;
    return saved;
  }
  const browserLang = navigator.language?.toLowerCase() || '';
  const initial: Language = browserLang.startsWith('ru') ? 'ru' : 'en';
  currentGlobalLanguage = initial;
  return initial;
}

export function getCurrentGlobalLanguage(): Language {
  return currentGlobalLanguage;
}

export function tDirect(
  key: keyof Translations,
  params?: Record<string, string | number>,
  lang: Language = currentGlobalLanguage
): string {
  const dict = TRANSLATIONS[lang] || TRANSLATIONS.ru;
  let text = (dict[key] as string) || (TRANSLATIONS.ru[key] as string) || String(key);
  if (params) {
    for (const [k, v] of Object.entries(params)) {
      text = text.replace(new RegExp(`\\{${k}\\}`, 'g'), String(v));
    }
  }
  return text;
}

export function getWeaponTranslation(id: string, lang: Language = currentGlobalLanguage): WeaponTranslation | undefined {
  return TRANSLATIONS[lang]?.weaponsMeta?.[id] || TRANSLATIONS.ru?.weaponsMeta?.[id];
}

export function getPassiveTranslation(id: string, lang: Language = currentGlobalLanguage): PassiveTranslation | undefined {
  return TRANSLATIONS[lang]?.passivesMeta?.[id] || TRANSLATIONS.ru?.passivesMeta?.[id];
}

export function getRocketMutationTranslation(id: string, lang: Language = currentGlobalLanguage): RocketMutationTranslation | undefined {
  return TRANSLATIONS[lang]?.rocketMutations?.[id] || TRANSLATIONS.ru?.rocketMutations?.[id];
}

export function getSynergyTranslation(id: string, lang: Language = currentGlobalLanguage): SynergyTranslation | undefined {
  return TRANSLATIONS[lang]?.synergies?.[id] || TRANSLATIONS.ru?.synergies?.[id];
}

export function getFallbackTranslation(id: string, lang: Language = currentGlobalLanguage): FallbackTranslation | undefined {
  return TRANSLATIONS[lang]?.fallbacks?.[id] || TRANSLATIONS.ru?.fallbacks?.[id];
}

export function getSectorTranslation(id: string, lang: Language = currentGlobalLanguage): SectorTranslation | undefined {
  return TRANSLATIONS[lang]?.sectors?.[id] || TRANSLATIONS.ru?.sectors?.[id];
}

export function getSkinTranslation(id: string, lang: Language = currentGlobalLanguage): ShipSkinTranslation | undefined {
  return TRANSLATIONS[lang]?.skins?.[id] || TRANSLATIONS.ru?.skins?.[id];
}

export function getRocketSkinTranslation(id: string, lang: Language = currentGlobalLanguage): RocketSkinTranslation | undefined {
  return TRANSLATIONS[lang]?.rocketSkins?.[id] || TRANSLATIONS.ru?.rocketSkins?.[id];
}

interface I18nContextValue {
  language: Language;
  setLanguage: (lang: Language) => void;
  toggleLanguage: () => void;
  t: (key: keyof Translations, params?: Record<string, string | number>) => string;
  translations: Translations;
}

const I18nContext = createContext<I18nContextValue | null>(null);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>(getInitialLanguage);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    currentGlobalLanguage = lang;
    try {
      localStorage.setItem(STORAGE_KEY, lang);
    } catch {
      // ignore local storage errors
    }
  };

  const toggleLanguage = () => {
    setLanguage(language === 'ru' ? 'en' : 'ru');
  };

  useEffect(() => {
    currentGlobalLanguage = language;
  }, [language]);

  const t = (key: keyof Translations, params?: Record<string, string | number>): string => {
    return tDirect(key, params, language);
  };

  const value: I18nContextValue = {
    language,
    setLanguage,
    toggleLanguage,
    t,
    translations: TRANSLATIONS[language] || TRANSLATIONS.ru,
  };

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nContextValue {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error('useI18n must be used within an I18nProvider');
  }
  return context;
}
