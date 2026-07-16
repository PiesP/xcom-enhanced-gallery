// SPDX-License-Identifier: MIT
// Copyright (c) 2024-2026 PiesP

/**
 * @fileoverview Multilingual Support Service
 * @description TDD-based simple i18n system with lazy language loading
 */

import {
  type BaseLanguageCode,
  isBaseLanguageCode,
  type SupportedLanguage,
} from '@shared/constants/i18n/language-types';
import { createTranslator, DEFAULT_LANGUAGE } from '@shared/i18n/translator';
import type { TranslationKey, TranslationParams } from '@shared/i18n/types';
import { logger } from '@shared/logging/logger';
import { getPersistentStorage } from '@shared/services/persistent-storage';
import { createSingleton } from '@shared/services/singleton-base';

export class LanguageService {
  private static readonly STORAGE_KEY = 'xeg-language';
  private _initialized = false;
  private currentLanguage: SupportedLanguage = 'auto';
  private readonly listeners: Set<(language: SupportedLanguage) => void> = new Set();
  private readonly storage = getPersistentStorage();
  private readonly translator: ReturnType<typeof createTranslator>;
  private readonly _nav: Pick<Navigator, 'language'> | undefined;

  public constructor(nav?: Pick<Navigator, 'language'>) {
    this.translator = createTranslator();
    this._nav = nav ?? (typeof navigator !== 'undefined' ? navigator : undefined);
  }

  /** Initialize service (idempotent) */
  public async initialize(): Promise<void> {
    if (this._initialized) return;
    try {
      const saved = await this.storage.get<string>(LanguageService.STORAGE_KEY);
      const normalized = this.normalizeLanguage(saved);
      if (normalized !== this.currentLanguage) {
        this.currentLanguage = normalized;
        this.notifyListeners(normalized);
      }
    } catch (error) {
      __DEV__ && logger.warn('Failed to restore language setting from storage:', error);
    }
    this._initialized = true;
  }

  /** Destroy service (idempotent) */
  public destroy(): void {
    this.listeners.clear();
    this._initialized = false;
  }

  /** Check if service is initialized */
  public isInitialized(): boolean {
    return this._initialized;
  }
  detectLanguage(): BaseLanguageCode {
    // Priority: navigator.languages[] (ordered user preference) → navigator.language (fallback)
    const browserLangs =
      this._nav && 'languages' in this._nav && Array.isArray(this._nav.languages)
        ? (this._nav.languages as readonly string[])
        : this._nav && typeof this._nav.language === 'string'
          ? [this._nav.language.toLowerCase()]
          : [DEFAULT_LANGUAGE];

    for (const lang of browserLangs) {
      if (!lang) continue;
      const normalized = lang.toLowerCase();

      if (isBaseLanguageCode(normalized)) {
        return normalized;
      }

      // Handle language-region codes (e.g., zh-CN)
      if (normalized.includes('-')) {
        const baseRegion = normalized.slice(0, 5); // e.g., "zh-CN"
        if (isBaseLanguageCode(baseRegion)) {
          return baseRegion;
        }
      }

      // Fall back to base 2-letter code
      const baseLang = normalized.slice(0, 2);
      if (isBaseLanguageCode(baseLang)) {
        return baseLang;
      }
    }

    return DEFAULT_LANGUAGE;
  }

  getCurrentLanguage(): SupportedLanguage {
    return this.currentLanguage;
  }

  setLanguage(language: SupportedLanguage): void {
    const normalized = this.normalizeLanguage(language);

    if (language !== normalized && language !== 'auto') {
      if (__DEV__) {
        logger.warn(`Unsupported language: ${language}, falling back to '${normalized}'`);
      }
    }

    // Prevent duplicate saves when value is unchanged
    if (this.currentLanguage === normalized) {
      return;
    }

    this.currentLanguage = normalized;
    this.notifyListeners(normalized);
    void this.persistLanguage(normalized);

    if (__DEV__) {
      logger.debug(`Language changed to: ${normalized}`);
    }
  }

  translate(key: TranslationKey, params?: TranslationParams): string {
    const language = this.getEffectiveLanguage();
    return this.translator.translate(language, key, params);
  }

  onLanguageChange(callback: (language: SupportedLanguage) => void): () => void {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  private normalizeLanguage(
    language: SupportedLanguage | string | null | undefined
  ): SupportedLanguage {
    if (!language) {
      return 'auto';
    }

    if (language === 'auto') {
      return 'auto';
    }

    // Normalize case before validation (e.g., zh-CN → zh-cn)
    const lower = language.toLowerCase();
    if (isBaseLanguageCode(lower)) {
      return lower;
    }

    if (isBaseLanguageCode(language)) {
      return language;
    }

    return DEFAULT_LANGUAGE;
  }

  private notifyListeners(language: SupportedLanguage): void {
    this.listeners.forEach((listener) => {
      try {
        listener(language);
      } catch (error) {
        if (__DEV__) {
          logger.warn('Language change listener error:', error);
        }
      }
    });
  }

  private async persistLanguage(language: SupportedLanguage): Promise<void> {
    try {
      await this.storage.set(LanguageService.STORAGE_KEY, language);
    } catch (error) {
      if (__DEV__) {
        logger.warn('Failed to persist language setting:', error);
      }
    }
  }

  private getEffectiveLanguage(): BaseLanguageCode {
    return this.currentLanguage === 'auto' ? this.detectLanguage() : this.currentLanguage;
  }
}

const { getInstance: getLanguageService, resetForTests: resetLanguageServiceForTests } =
  createSingleton(() => new LanguageService());

export { getLanguageService, resetLanguageServiceForTests };
