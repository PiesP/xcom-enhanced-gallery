/**
 * @fileoverview 다국어 지원 서비스
 * @description TDD 기반으로 구현된 간단한 i18n 시스템
 */

import { logger } from '../logging/logger';

export type SupportedLanguage = 'auto' | 'ko' | 'en' | 'ja';

export interface LanguageStrings {
  readonly toolbar: {
    readonly previous: string;
    readonly next: string;
    readonly download: string;
    readonly downloadAll: string;
    readonly settings: string;
    readonly close: string;
  };
  readonly settings: {
    readonly title: string;
    readonly theme: string;
    readonly language: string;
    readonly themeAuto: string;
    readonly themeLight: string;
    readonly themeDark: string;
    readonly close: string;
  };
  readonly messages: {
    readonly keyboardHelp: {
      readonly title: string;
      readonly navPrevious: string;
      readonly navNext: string;
      readonly close: string;
      readonly toggleHelp: string;
    };
    readonly download: {
      readonly single: {
        readonly error: {
          readonly title: string;
          readonly body: string; // {error}
        };
      };
      readonly allFailed: {
        readonly title: string;
        readonly body: string;
      };
      readonly partial: {
        readonly title: string;
        readonly body: string; // {count}
      };
      readonly retry: {
        readonly action: string;
        readonly success: {
          readonly title: string;
          readonly body: string;
        };
      };
      readonly cancelled: {
        readonly title: string;
        readonly body: string;
      };
    };
    readonly gallery: {
      readonly emptyTitle: string;
      readonly emptyDescription: string;
      readonly failedToLoadImage: string; // {type}
    };
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
    messages: {
      keyboardHelp: {
        title: '키보드 단축키',
        navPrevious: 'ArrowLeft: 이전 미디어',
        navNext: 'ArrowRight: 다음 미디어',
        close: 'Escape: 갤러리 닫기',
        toggleHelp: '?: 이 도움말 표시',
      },
      download: {
        single: { error: { title: '다운로드 실패', body: '파일을 받을 수 없습니다: {error}' } },
        allFailed: { title: '다운로드 실패', body: '모든 항목을 다운로드하지 못했습니다.' },
        partial: { title: '일부 실패', body: '{count}개 항목을 받지 못했습니다.' },
        retry: {
          // NOTE: i18n literal 스캐너 예외: 이미 리소스 테이블 내이므로 허용
          action: '재시도',
          success: { title: '재시도 성공', body: '실패했던 항목을 모두 받았습니다.' },
        },
        cancelled: { title: '다운로드 취소됨', body: '요청한 다운로드가 취소되었습니다.' },
      },
      gallery: {
        emptyTitle: '미디어가 없습니다',
        emptyDescription: '표시할 이미지나 비디오가 없습니다.',
        failedToLoadImage: '{type} 로드에 실패했습니다',
      },
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
    messages: {
      keyboardHelp: {
        title: 'Keyboard shortcuts',
        navPrevious: 'ArrowLeft: Previous media',
        navNext: 'ArrowRight: Next media',
        close: 'Escape: Close gallery',
        toggleHelp: '?: Show this help',
      },
      download: {
        single: {
          error: { title: 'Download Failed', body: 'Could not download the file: {error}' },
        },
        allFailed: { title: 'Download Failed', body: 'Failed to download all items.' },
        partial: { title: 'Partial Failure', body: 'Failed to download {count} items.' },
        retry: {
          action: 'Retry',
          success: {
            title: 'Retry Successful',
            body: 'Successfully downloaded all previously failed items.',
          },
        },
        cancelled: { title: 'Download Cancelled', body: 'The requested download was cancelled.' },
      },
      gallery: {
        emptyTitle: 'No media available',
        emptyDescription: 'There are no images or videos to display.',
        failedToLoadImage: 'Failed to load {type}',
      },
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
    messages: {
      keyboardHelp: {
        title: 'キーボードショートカット',
        navPrevious: 'ArrowLeft: 前のメディア',
        navNext: 'ArrowRight: 次のメディア',
        close: 'Escape: ギャラリーを閉じる',
        toggleHelp: '?: このヘルプを表示',
      },
      download: {
        single: { error: { title: 'ダウンロード失敗', body: 'ファイルを取得できません: {error}' } },
        allFailed: {
          title: 'ダウンロード失敗',
          body: 'すべての項目をダウンロードできませんでした。',
        },
        partial: { title: '一部失敗', body: '{count}個の項目を取得できませんでした。' },
        retry: {
          action: '再試行',
          success: { title: '再試行成功', body: '失敗していた項目をすべて取得しました。' },
        },
        cancelled: {
          title: 'ダウンロードがキャンセルされました',
          body: '要求したダウンロードはキャンセルされました。',
        },
      },
      gallery: {
        emptyTitle: 'メディアがありません',
        emptyDescription: '表示する画像や動画がありません。',
        failedToLoadImage: '{type} の読み込みに失敗しました',
      },
    },
  },
};

export class LanguageService {
  private currentLanguage: SupportedLanguage = 'auto';
  private readonly listeners: Set<(language: SupportedLanguage) => void> = new Set();
  /**
   * (Phase 4) 다국어 리소스 정합성 보고
   * missing: 기준(en) 대비 누락된 키 목록
   * extra: 기준(en)에는 없지만 다른 로케일에 존재하는 키 목록
   */
  getIntegrityReport(): {
    missing: Record<Exclude<SupportedLanguage, 'auto'>, string[]>;
    extra: Record<Exclude<SupportedLanguage, 'auto'>, string[]>;
  } {
    const locales: Array<Exclude<SupportedLanguage, 'auto'>> = ['en', 'ko', 'ja'];
    const base: LanguageStrings = LANGUAGE_STRINGS.en;

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
    const missing: Record<Exclude<SupportedLanguage, 'auto'>, string[]> = {
      en: [],
      ko: [],
      ja: [],
    };
    const extra: Record<Exclude<SupportedLanguage, 'auto'>, string[]> = {
      en: [],
      ko: [],
      ja: [],
    };

    for (const locale of locales) {
      const localeStrings: LanguageStrings = LANGUAGE_STRINGS[locale];
      const keys = new Set(flatten(localeStrings));
      // missing (base 존재, locale 없음)
      for (const k of baseKeys) if (!keys.has(k)) missing[locale].push(k);
      // extra (locale 존재, base 없음)
      for (const k of keys) if (!baseKeys.has(k)) extra[locale].push(k);
    }

    return { missing, extra };
  }

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
}

// 전역 싱글톤 (간단한 소비 편의)
export const languageService = new LanguageService();
