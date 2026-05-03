/**
 * @fileoverview Multilingual Support Service
 * @description TDD-based simple i18n system with lazy language loading
 */

import {
  type BaseLanguageCode,
  isBaseLanguageCode,
  type SupportedLanguage,
} from '@shared/constants/i18n/i18n.types';
import { DEFAULT_LANGUAGE, getLanguageStrings } from '@shared/constants/i18n/translation-registry';
import type { TranslationKey, TranslationParams } from '@shared/i18n/types';
import { logger } from '@shared/logging/logger';
import { getPersistentStorage } from '@shared/services/persistent-storage';

function resolveTranslationValue(dictionary: Record<string, unknown>, key: string): string | undefined {
  const segments = key.split('.');
  let current: unknown = dictionary;
  for (const segment of segments) {
    if (current == null || typeof current !== 'object') return undefined;
    current = (current as Record<string, unknown>)[segment];
  }
  return typeof current === 'string' ? current : undefined;
}

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
  private readonly storage = getPersistentStorage();

  public static getInstance(): LanguageService {
    if (!_instance) _instance = new LanguageService();
    return _instance;
  }

  /** @internal Test helper */
  public static resetForTests(): void {
    _instance = null;
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
  }

  /** Check if service is initialized */
  public isInitialized(): boolean {
    return this._initialized;
  }
  detectLanguage(): BaseLanguageCode {
    // Safe navigator.language access
    const browserLang =
      typeof navigator !== 'undefined' && navigator.language
        ? navigator.language.slice(0, 2)
        : DEFAULT_LANGUAGE;

    if (isBaseLanguageCode(browserLang)) {
      return browserLang;
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
    this.persistLanguage(normalized).catch((error) => {
      if (__DEV__) {
        logger.warn('Failed to persist language setting on change:', error);
      }
    });

    if (__DEV__) {
      logger.debug(`Language changed to: ${normalized}`);
    }
  }

  translate(key: TranslationKey, params?: TranslationParams): string {
    const language = this.getEffectiveLanguage();
    const dictionary = getLanguageStrings(language);
    const template = resolveTranslationValue(dictionary, key);

    if (!template) {
      return key;
    }

    if (!params) {
      return template;
    }

    return template.replace(/\{(\w+)\}/g, (_, placeholder: string) => {
      if (Object.hasOwn(params, placeholder)) {
        return String(params[placeholder]);
      }

      return `{${placeholder}}`;
    });
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
