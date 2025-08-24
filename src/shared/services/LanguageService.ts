/**
 * @fileoverview 다국어 지원 서비스
 * @description TDD 기반으로 구현된 간단한 i18n 시스템
 */

import { logger } from '../logging/logger';

export type SupportedLanguage = 'auto' | 'ko' | 'en' | 'ja';

export interface LanguageStrings {
  toolbar: {
    previous: string;
    next: string;
    download: string;
    downloadAll: string;
    settings: string;
    close: string;
  };
  settings: {
    title: string;
    theme: string;
    language: string;
    themeAuto: string;
    themeLight: string;
    themeDark: string;
    close: string;
  };
}

const LANGUAGE_STRINGS: Record<Exclude<SupportedLanguage, 'auto'>, LanguageStrings> = {
  ko: {
    toolbar: {
      previous: '이전',
      next: '다음',
      download: '다운로드',
      downloadAll: 'ZIP 다운로드',
      settings: '설정',
      close: '닫기',
    },
    settings: {
      title: '설정',
      theme: '테마',
      language: '언어',
      themeAuto: '자동',
      themeLight: '라이트',
      themeDark: '다크',
      close: '닫기',
    },
  },
  en: {
    toolbar: {
      previous: 'Previous',
      next: 'Next',
      download: 'Download',
      downloadAll: 'Download ZIP',
      settings: 'Settings',
      close: 'Close',
    },
    settings: {
      title: 'Settings',
      theme: 'Theme',
      language: 'Language',
      themeAuto: 'Auto',
      themeLight: 'Light',
      themeDark: 'Dark',
      close: 'Close',
    },
  },
  ja: {
    toolbar: {
      previous: '前へ',
      next: '次へ',
      download: 'ダウンロード',
      downloadAll: 'ZIPダウンロード',
      settings: '設定',
      close: '閉じる',
    },
    settings: {
      title: '設定',
      theme: 'テーマ',
      language: '言語',
      themeAuto: '自動',
      themeLight: 'ライト',
      themeDark: 'ダーク',
      close: '閉じる',
    },
  },
};

export class LanguageService {
  private currentLanguage: SupportedLanguage = 'auto';
  private readonly listeners: Set<(language: SupportedLanguage) => void> = new Set();

  detectLanguage(): Exclude<SupportedLanguage, 'auto'> {
    // 안전한 navigator.language 접근
    const browserLang =
      typeof navigator !== 'undefined' && navigator.language
        ? navigator.language.slice(0, 2)
        : 'en';

    if (browserLang in LANGUAGE_STRINGS) {
      return browserLang as Exclude<SupportedLanguage, 'auto'>;
    }

    return 'en';
  }

  getCurrentLanguage(): SupportedLanguage {
    return this.currentLanguage;
  }

  setLanguage(language: SupportedLanguage): void {
    if (language !== 'auto' && !(language in LANGUAGE_STRINGS)) {
      logger.warn(`Unsupported language: ${language}, falling back to 'en'`);
      language = 'en';
    }

    this.currentLanguage = language;
    this.listeners.forEach(listener => listener(language));

    logger.debug(`Language changed to: ${language}`);
  }

  getString(path: string): string {
    const effectiveLanguage =
      this.currentLanguage === 'auto' ? this.detectLanguage() : this.currentLanguage;

    const keys = path.split('.');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let value: any = LANGUAGE_STRINGS[effectiveLanguage];

    for (const key of keys) {
      value = value?.[key];
    }

    return value || path;
  }

  onLanguageChange(callback: (language: SupportedLanguage) => void): () => void {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }
}
