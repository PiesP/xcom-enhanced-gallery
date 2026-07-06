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
import { PersistentStorage } from '@shared/services/persistent-storage';
import { SingletonBase } from '@shared/services/singleton-base';

let _instance: LanguageService | null = null;

/**
 * Multilingual Service
 * - onInitialize(): Restore language setting from storage
 * - onDestroy(): Clean up listeners
 *
 * Note: Global singleton export requires initialize() call from main.ts
 */
export class LanguageService {
  private static readonly STORAGE_KEY = 'xeg-language';
  private _initialized = false;
  private currentLanguage: SupportedLanguage = 'auto';
  private readonly listeners: Set<(language: SupportedLanguage) => void> = new Set();
  private readonly storage = PersistentStorage.getInstance();
  private readonly translator: ReturnType<typeof createTranslator>;

  public constructor() {
    this.translator = createTranslator();
  }

  public static getInstance(): LanguageService {
    return SingletonBase.get(
      () => _instance,
      (inst) => {
        _instance = inst;
      },
      () => new LanguageService()
    );
  }

  /** @internal Test helper */
  public static resetForTests(): void {
    SingletonBase.reset(
      () => _instance,
      (inst) => {
        _instance = inst;
      }
    );
  }

  /** Initialize service (idempotent) */
  public async initialize(): Promise<void> {
    if (this._initialized) return;
    try {
      const saved = await this.storage.getString(LanguageService.STORAGE_KEY);
      const normalized = this.normalizeLanguage(saved);
      if (normalized !== this.currentLanguage) {
        this.currentLanguage = normalized;
        this.notifyListeners(normalized);
      }
    } catch (error) {
      if (__DEV__) logger.warn('Failed to restore language setting from storage:', error);
    }
    this._initialized = true;
  }

  /** Destroy service (idempotent) */
  public destroy(): void {
    this.listeners.clear();
    this._initialized = false;
    _instance = null;
  }

  /** Check if service is initialized */
  public isInitialized(): boolean {
    return this._initialized;
  }
  detectLanguage(): BaseLanguageCode {
    const browserLang =
      typeof navigator !== 'undefined' && typeof navigator.language === 'string'
        ? navigator.language.toLowerCase()
        : DEFAULT_LANGUAGE;

    if (isBaseLanguageCode(browserLang)) {
      return browserLang;
    }

    // Handle language-region codes (e.g., zh-CN → zh-cn)
    if (browserLang.includes('-')) {
      const baseRegion = browserLang.slice(0, 5); // e.g., "zh-cn"
      if (isBaseLanguageCode(baseRegion)) {
        return baseRegion;
      }
    }

    // Fall back to base 2-letter code
    const baseLang = browserLang.slice(0, 2);
    if (isBaseLanguageCode(baseLang)) {
      return baseLang;
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
