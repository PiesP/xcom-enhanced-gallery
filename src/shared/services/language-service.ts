/**
 * @fileoverview Multilingual Support Service
 * @description TDD-based simple i18n system
 * @version 2.2.0 - Phase 355: Simplified with direct PersistentStorage usage
 */

import { logger } from '@shared/logging';
import { getPersistentStorage } from './persistent-storage';
import { BaseServiceImpl } from './base-service';
import {
  LANGUAGE_CODES,
  isBaseLanguageCode,
  type BaseLanguageCode,
  type SupportedLanguage,
} from '@shared/constants/i18n/language-types';
import { DEFAULT_LANGUAGE, getLanguageStrings } from '@shared/constants/i18n/translation-registry';

export type {
  SupportedLanguage,
  LanguageStrings,
  BaseLanguageCode,
} from '@shared/constants/i18n/language-types';

/**
 * Multilingual Service (Phase 355: Direct PersistentStorage usage)
 * - onInitialize(): Restore language setting from storage
 * - onDestroy(): Clean up listeners
 *
 * Note: Global singleton export requires initialize() call from main.ts
 */
export class LanguageService extends BaseServiceImpl {
  private static readonly STORAGE_KEY = 'xeg-language';
  private static readonly SUPPORTED_LANGUAGES: ReadonlySet<SupportedLanguage> = new Set([
    'auto',
    ...LANGUAGE_CODES,
  ]);

  private currentLanguage: SupportedLanguage = 'auto';
  private readonly listeners: Set<(language: SupportedLanguage) => void> = new Set();
  private readonly storage = getPersistentStorage();

  constructor() {
    super('LanguageService');
  }

  /**
   * Service initialization (BaseServiceImpl template method implementation)
   * Restore language setting from storage
   */
  protected async onInitialize(): Promise<void> {
    try {
      const saved = await this.storage.get<string>(LanguageService.STORAGE_KEY);
      const normalized = this.normalizeLanguage(saved);

      if (normalized !== this.currentLanguage) {
        this.currentLanguage = normalized;
        this.notifyListeners(normalized);
      }
    } catch (error) {
      logger.warn('Failed to restore language setting from storage:', error);
    }
  }

  /**
   * Service cleanup (BaseServiceImpl template method implementation)
   * Clean up listeners
   */
  protected onDestroy(): void {
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
      logger.warn(`Unsupported language: ${language}, falling back to '${normalized}'`);
    }

    // Phase 117.1: Prevent duplicate saves when value hasn't changed
    if (this.currentLanguage === normalized) {
      return;
    }

    this.currentLanguage = normalized;
    this.notifyListeners(normalized);
    void this.persistLanguage(normalized);

    logger.debug(`Language changed to: ${normalized}`);
  }

  getString(path: string): string {
    const effectiveLanguage: BaseLanguageCode =
      this.currentLanguage === 'auto' ? this.detectLanguage() : this.currentLanguage;

    const keys = path.split('.');
    let value: unknown = getLanguageStrings(effectiveLanguage);

    for (const key of keys) {
      if (!value || typeof value !== 'object') {
        return path;
      }
      value = (value as Record<string, unknown>)[key];
    }

    return typeof value === 'string' ? value : path;
  }

  /**
   * Message format support: {param} substitution
   */
  getFormattedString(path: string, params?: Record<string, string | number>): string {
    const base = this.getString(path);
    if (!params) return base;
    return base.replace(/\{(\w+)\}/g, (_, k) => String(params[k] ?? `{${k}}`));
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
    this.listeners.forEach(listener => {
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
}

// Global singleton (for simplified consumption)
export const languageService = new LanguageService();
