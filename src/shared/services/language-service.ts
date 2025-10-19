/**
 * @fileoverview 다국어 지원 서비스
 * @description TDD 기반으로 구현된 간단한 i18n 시스템
 */

import { logger } from '../logging/logger';
import type { StorageAdapter } from './storage/storage-adapter.interface';
import { UserscriptStorageAdapter } from './storage/userscript-storage-adapter';
import {
  LANGUAGE_CODES,
  isBaseLanguageCode,
  type BaseLanguageCode,
  type SupportedLanguage,
  type LanguageStrings,
} from '@shared/i18n/language-types';
import {
  DEFAULT_LANGUAGE,
  TRANSLATION_REGISTRY,
  getLanguageStrings,
} from '@shared/i18n/translation-registry';

export type {
  SupportedLanguage,
  LanguageStrings,
  BaseLanguageCode,
} from '@shared/i18n/language-types';

export class LanguageService {
  private static readonly STORAGE_KEY = 'xeg-language';
  private static readonly SUPPORTED_LANGUAGES: ReadonlySet<SupportedLanguage> = new Set([
    'auto',
    ...LANGUAGE_CODES,
  ]);

  private currentLanguage: SupportedLanguage = 'auto';
  private readonly listeners: Set<(language: SupportedLanguage) => void> = new Set();
  private readonly storage: StorageAdapter;
  private isInitialized = false;
  private initializationPromise: Promise<void> | null = null;

  constructor(storage: StorageAdapter = new UserscriptStorageAdapter()) {
    this.storage = storage;
  }
  /**
   * (Phase 4) 다국어 리소스 정합성 보고
   * missing: 기준(en) 대비 누락된 키 목록
   * extra: 기준(en)에는 없지만 다른 로케일에 존재하는 키 목록
   */
  getIntegrityReport(): {
    missing: Record<BaseLanguageCode, string[]>;
    extra: Record<BaseLanguageCode, string[]>;
  } {
    const locales: readonly BaseLanguageCode[] = LANGUAGE_CODES;
    const base: LanguageStrings = TRANSLATION_REGISTRY[DEFAULT_LANGUAGE];

    const flatten = (obj: unknown, prefix = '', acc: string[] = []): string[] => {
      if (obj && typeof obj === 'object') {
        for (const [k, v] of Object.entries(obj as Record<string, unknown>)) {
          const key = prefix ? `${prefix}.${k}` : k;
          // 리프는 string, 그 외는 재귀
          if (typeof v === 'string') acc.push(key);
          else flatten(v, key, acc);
        }
      }
      return acc;
    };

    const baseKeys = new Set(flatten(base));
    const missing: Record<BaseLanguageCode, string[]> = {
      en: [],
      ko: [],
      ja: [],
    };
    const extra: Record<BaseLanguageCode, string[]> = {
      en: [],
      ko: [],
      ja: [],
    };

    for (const locale of locales) {
      const localeStrings: LanguageStrings = TRANSLATION_REGISTRY[locale];
      const keys = new Set(flatten(localeStrings));
      // missing (base 존재, locale 없음)
      for (const k of baseKeys) if (!keys.has(k)) missing[locale].push(k);
      // extra (locale 존재, base 없음)
      for (const k of keys) if (!baseKeys.has(k)) extra[locale].push(k);
    }

    return { missing, extra };
  }

  detectLanguage(): BaseLanguageCode {
    // 안전한 navigator.language 접근
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

  async initialize(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    if (this.initializationPromise) {
      await this.initializationPromise;
      return;
    }

    this.initializationPromise = (async () => {
      try {
        const saved = await this.storage.getItem(LanguageService.STORAGE_KEY);
        const normalized = this.normalizeLanguage(saved);

        if (normalized !== this.currentLanguage) {
          this.currentLanguage = normalized;
          this.notifyListeners(normalized);
          logger.debug(`Language restored from storage: ${normalized}`);
        }
      } catch (error) {
        logger.warn('Failed to restore language setting from storage:', error);
      } finally {
        this.isInitialized = true;
        this.initializationPromise = null;
      }
    })();

    await this.initializationPromise;
  }

  setLanguage(language: SupportedLanguage): void {
    const normalized = this.normalizeLanguage(language);

    if (language !== normalized && language !== 'auto') {
      logger.warn(`Unsupported language: ${language}, falling back to '${normalized}'`);
    }

    // Phase 117.1: 값이 변경되지 않았을 때 중복 저장 방지
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
   * 메시지 포맷 지원: {param} 치환
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
      await this.storage.setItem(LanguageService.STORAGE_KEY, language);
    } catch (error) {
      logger.warn('Failed to persist language setting:', error);
    }
  }
}

// 전역 싱글톤 (간단한 소비 편의)
export const languageService = new LanguageService();
