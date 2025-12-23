/**
 * @fileoverview Multilingual Support Service
 * @description TDD-based simple i18n system with lazy language loading
 * @version 3.0.0 - Composition-based lifecycle
 */

import {
  type BaseLanguageCode,
  isBaseLanguageCode,
  type SupportedLanguage,
} from '@shared/constants/i18n/language-types';
import { DEFAULT_LANGUAGE, getLanguageStrings } from '@shared/constants/i18n/translation-registry';
import { resolveTranslationValue } from '@shared/i18n/translation-utils';
import type { TranslationKey, TranslationParams } from '@shared/i18n/types';
import { logger } from '@shared/logging';
import type { Lifecycle } from '@shared/services/lifecycle';
import { createLifecycle } from '@shared/services/lifecycle';
import { getPersistentStorage } from '@shared/services/persistent-storage';
import { createSingleton } from '@shared/utils/types/singleton';

/**
 * Multilingual Service (Phase 355: Direct PersistentStorage usage)
 * - onInitialize(): Restore language setting from storage
 * - onDestroy(): Clean up listeners
 *
 * Note: Global singleton export requires initialize() call from main.ts
 */
export class LanguageService {
  private readonly lifecycle: Lifecycle;
  private static readonly STORAGE_KEY = 'xeg-language';

  private currentLanguage: SupportedLanguage = 'auto';
  private readonly listeners: Set<(language: SupportedLanguage) => void> = new Set();
  private readonly storage = getPersistentStorage();

  private static readonly singleton = createSingleton(() => new LanguageService());

  public static getInstance(): LanguageService {
    return LanguageService.singleton.get();
  }

  /** @internal Test helper */
  public static resetForTests(): void {
    const existing = LanguageService.singleton.peek?.();
    existing?.destroy();
    LanguageService.singleton.reset?.();
  }

  constructor() {
    this.lifecycle = createLifecycle('LanguageService', {
      onInitialize: () => this.onInitialize(),
      onDestroy: () => this.onDestroy(),
    });
  }

  /** Initialize service (idempotent, fail-fast on error) */
  public async initialize(): Promise<void> {
    return this.lifecycle.initialize();
  }

  /** Destroy service (idempotent, graceful on error) */
  public destroy(): void {
    this.lifecycle.destroy();
  }

  /** Check if service is initialized */
  public isInitialized(): boolean {
    return this.lifecycle.isInitialized();
  }

  /**
   * Service initialization hook
   * Restore language setting from storage and lazy load language bundle if needed
   */
  private async onInitialize(): Promise<void> {
    try {
      const saved = await this.storage.getString(LanguageService.STORAGE_KEY);
      const normalized = this.normalizeLanguage(saved);

      if (normalized !== this.currentLanguage) {
        this.currentLanguage = normalized;
        this.notifyListeners(normalized);
      }
    } catch (error) {
      if (__DEV__) {
        logger.warn('Failed to restore language setting from storage:', error);
      }
    }
  }

  /**
   * Service cleanup hook
   * Clean up listeners
   */
  private onDestroy(): void {
    this.listeners.clear();
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

    // Phase 117.1: Prevent duplicate saves when value hasn't changed
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
      await this.storage.setString(LanguageService.STORAGE_KEY, language);
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
