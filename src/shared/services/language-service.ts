/**
 * @fileoverview Multilingual Support Service
 * @description TDD-based simple i18n system with lazy language loading
 * @version 3.0.0 - Composition-based lifecycle
 */

import {
  type BaseLanguageCode,
  isBaseLanguageCode,
  LANGUAGE_CODES,
  type SupportedLanguage,
} from '@shared/constants/i18n/language-types';
import {
  DEFAULT_LANGUAGE,
  TRANSLATION_REGISTRY,
} from '@shared/constants/i18n/translation-registry';
import {
  TranslationCatalog,
  type TranslationKey,
  type TranslationParams,
  Translator,
} from '@shared/i18n';
import { logger } from '@shared/logging';
import type { Lifecycle } from '@shared/services/lifecycle';
import { createLifecycle } from '@shared/services/lifecycle';
import { getPersistentStorage } from '@shared/services/persistent-storage';
import { createSingleton } from '@shared/utils/types/singleton';

export type {
  BaseLanguageCode,
  LanguageStrings,
  SupportedLanguage,
} from '@shared/constants/i18n/language-types';
export type { TranslationKey, TranslationParams } from '@shared/i18n';

const translationCatalog = new TranslationCatalog({
  bundles: TRANSLATION_REGISTRY,
  fallbackLanguage: DEFAULT_LANGUAGE,
});
const translator = new Translator(translationCatalog);

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
  private static readonly SUPPORTED_LANGUAGES: ReadonlySet<SupportedLanguage> = new Set([
    'auto',
    ...LANGUAGE_CODES,
  ]);

  private currentLanguage: SupportedLanguage = 'auto';
  private readonly listeners: Set<(language: SupportedLanguage) => void> = new Set();
  private readonly storage = getPersistentStorage();

  private static readonly singleton = createSingleton(() => new LanguageService());

  public static getInstance(): LanguageService {
    return LanguageService.singleton.get();
  }

  /** @internal Test helper */
  public static resetForTests(): void {
    LanguageService.singleton.reset();
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
      const saved = await this.storage.get<string>(LanguageService.STORAGE_KEY);
      const normalized = this.normalizeLanguage(saved);

      if (normalized !== this.currentLanguage) {
        this.currentLanguage = normalized;
        this.notifyListeners(normalized);
      }

      // Phase 356: Preload the effective language bundle
      const effectiveLang = this.getEffectiveLanguage();
      await this.ensureLanguageLoaded(effectiveLang);
    } catch (error) {
      logger.warn('Failed to restore language setting from storage:', error);
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

  getAvailableLanguages(): BaseLanguageCode[] {
    return [...LANGUAGE_CODES];
  }

  setLanguage(language: SupportedLanguage): void {
    const normalized = this.normalizeLanguage(language);

    if (language !== normalized && language !== 'auto') {
      logger.warn(`Unsupported language: ${language}, falling back to '${normalized}'`);
    }

    // Phase 117.1: Prevent duplicate saves when value hasn't changed
    if (this.currentLanguage === normalized) {
      return;
    }

    this.currentLanguage = normalized;
    this.notifyListeners(normalized);
    this.persistLanguage(normalized).catch((error) => {
      logger.warn('Failed to persist language setting on change:', error);
    });

    // Phase 356: Lazy load language bundle if needed
    const effectiveLang = this.getEffectiveLanguage();
    this.ensureLanguageLoaded(effectiveLang).catch((error) => {
      logger.warn('Failed to load language bundle on change:', error);
    });

    logger.debug(`Language changed to: ${normalized}`);
  }

  /**
   * Ensure the language bundle is loaded (lazy load if necessary).
   * This is called automatically when language changes.
   */
  async ensureLanguageLoaded(language: BaseLanguageCode): Promise<void> {
    try {
      await translator.ensureLanguage(language);
    } catch (error) {
      logger.warn(`Failed to load language bundle: ${language}`, error);
    }
  }

  translate(key: TranslationKey, params?: TranslationParams): string {
    return translator.translate(this.getEffectiveLanguage(), key, params);
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

    if (LanguageService.SUPPORTED_LANGUAGES.has(language as SupportedLanguage)) {
      return language as SupportedLanguage;
    }

    return DEFAULT_LANGUAGE;
  }

  private notifyListeners(language: SupportedLanguage): void {
    this.listeners.forEach((listener) => {
      try {
        listener(language);
      } catch (error) {
        logger.warn('Language change listener error:', error);
      }
    });
  }

  private async persistLanguage(language: SupportedLanguage): Promise<void> {
    try {
      await this.storage.set(LanguageService.STORAGE_KEY, language);
    } catch (error) {
      logger.warn('Failed to persist language setting:', error);
    }
  }

  private getEffectiveLanguage(): BaseLanguageCode {
    return this.currentLanguage === 'auto' ? this.detectLanguage() : this.currentLanguage;
  }
}
