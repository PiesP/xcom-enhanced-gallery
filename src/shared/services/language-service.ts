// SPDX-License-Identifier: MIT
// Copyright (c) 2024-2026 PiesP

/**
 * @fileoverview Multilingual Support Service
 * @description TDD-based simple i18n system with lazy language loading
 */

import { detectLocale } from '@piesp/browser-core/locale';
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
  private readonly persistenceListeners = new Set<(unsaved: boolean) => void>();
  private pendingLanguage: SupportedLanguage | undefined;
  private unsaved = false;
  private revision = 0;
  private generation = 0;
  private updateQueue: Promise<void> = Promise.resolve();
  private readonly translator: ReturnType<typeof createTranslator>;
  private readonly _nav: Pick<Navigator, 'language'> | undefined;

  public constructor(nav?: Pick<Navigator, 'language'>) {
    this.translator = createTranslator();
    this._nav = nav ?? (typeof navigator !== 'undefined' ? navigator : undefined);
  }

  /** Initialize service (idempotent) */
  public async initialize(): Promise<void> {
    if (this._initialized) {
      return;
    }
    const generation = this.generation;
    await this.updateQueue;
    if (generation !== this.generation) {
      return;
    }
    // A same-document restart retains denied intent; a new document reads storage.
    if (this.pendingLanguage !== undefined) {
      this._initialized = true;
      return;
    }
    const revision = this.revision;
    try {
      const saved = await this.storage.get<string>(LanguageService.STORAGE_KEY);
      if (generation !== this.generation) {
        return;
      }
      if (revision !== this.revision) {
        this._initialized = true;
        return;
      }
      const normalized = this.normalizeLanguage(saved);
      if (normalized !== this.currentLanguage) {
        this.currentLanguage = normalized;
        this.notifyListeners(normalized);
      }
    } catch (error) {
      __DEV__ && logger.warn('Failed to restore language setting from storage:', error);
    }
    if (generation === this.generation) {
      this._initialized = true;
    }
  }

  /** Destroy service (idempotent) */
  public destroy(): void {
    this.listeners.clear();
    this.persistenceListeners.clear();
    this._initialized = false;
    this.generation++;
  }

  /** Check if service is initialized */
  public isInitialized(): boolean {
    return this._initialized;
  }
  detectLanguage(): BaseLanguageCode {
    // Delegate to shared @piesp/browser-core/locale for unified browser detection
    const browserLangs =
      this._nav && 'languages' in this._nav && Array.isArray(this._nav.languages)
        ? (this._nav.languages as readonly string[])
        : this._nav && typeof this._nav.language === 'string'
          ? [this._nav.language]
          : undefined;
    const result = detectLocale(browserLangs ? { languages: browserLangs } : {});
    return result;
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

    // A saved unchanged choice is a no-op; an unsaved one is explicit retry intent.
    if (this.currentLanguage === normalized) {
      if (this.pendingLanguage !== undefined) {
        void this.retryUnsaved().catch(() => undefined);
      }
      return;
    }

    this.currentLanguage = normalized;
    this.pendingLanguage = normalized;
    const revision = ++this.revision;
    this.updateQueue = this.persistLanguage(normalized, revision).catch(() => undefined);
    this.notifyListeners(normalized);

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
    if (lower === 'zh-cn') {
      return 'zh-CN';
    }
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

  public hasUnsavedChanges(): boolean {
    return this.unsaved;
  }

  public subscribePersistence(listener: (unsaved: boolean) => void): () => void {
    this.persistenceListeners.add(listener);
    return () => this.persistenceListeners.delete(listener);
  }

  /** One explicit attempt, serialized after all earlier language writes. */
  public async retryUnsaved(): Promise<void> {
    const retry = this.updateQueue.then(async () => {
      if (this.pendingLanguage !== undefined) {
        await this.persistLanguage(this.pendingLanguage, this.revision);
      }
    });
    this.updateQueue = retry.catch(() => undefined);
    await retry;
  }

  private setUnsaved(value: boolean): void {
    if (this.unsaved === value) {
      return;
    }
    this.unsaved = value;
    for (const listener of this.persistenceListeners) {
      try {
        listener(value);
      } catch (error) {
        __DEV__ && logger.warn('Language persistence listener error:', error);
      }
    }
  }

  private async persistLanguage(language: SupportedLanguage, revision: number): Promise<void> {
    try {
      await this.storage.set(LanguageService.STORAGE_KEY, language);
      if (revision === this.revision) {
        this.pendingLanguage = undefined;
        this.setUnsaved(false);
      }
    } catch (error) {
      if (revision === this.revision) {
        this.setUnsaved(true);
      }
      __DEV__ && logger.warn('Failed to persist language setting:', error);
      throw error;
    }
  }

  private getEffectiveLanguage(): BaseLanguageCode {
    return this.currentLanguage === 'auto' ? this.detectLanguage() : this.currentLanguage;
  }
}

const { getInstance: getLanguageService, resetForTests: resetLanguageServiceForTests } =
  createSingleton(() => new LanguageService());

export { getLanguageService, resetLanguageServiceForTests };
