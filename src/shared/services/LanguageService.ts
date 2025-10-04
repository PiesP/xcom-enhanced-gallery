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
    readonly toggleProgressToastShow: string;
    readonly toggleProgressToastHide: string;
    // Phase 2: I18N-TOOLBAR-LABELS - Navigation
    readonly previousMedia: string;
    readonly nextMedia: string;
    readonly previousMediaWithShortcut: string;
    readonly nextMediaWithShortcut: string;
    // Phase 2: I18N-TOOLBAR-LABELS - Fit modes
    readonly fitOriginal: string;
    readonly fitWidth: string;
    readonly fitHeight: string;
    readonly fitContainer: string;
    readonly fitOriginalWithShortcut: string;
    readonly fitWidthTitle: string;
    readonly fitHeightTitle: string;
    readonly fitContainerTitle: string;
    // Phase 2: I18N-TOOLBAR-LABELS - Actions
    readonly downloadCurrent: string;
    readonly downloadCurrentWithShortcut: string;
    readonly downloadAllWithCount: string; // Template: {count}
    readonly showKeyboardHelp: string;
    readonly showKeyboardHelpWithShortcut: string;
    readonly openSettings: string;
    readonly settingsTitle: string;
    readonly closeGallery: string;
    readonly closeGalleryWithShortcut: string;
  };
  readonly settings: {
    readonly title: string;
    readonly theme: string;
    readonly language: string;
    readonly themeAuto: string;
    readonly themeLight: string;
    readonly themeDark: string;
    readonly close: string;
    /** Bulk download: show progress toast toggle label */
    readonly downloadProgressToast: string;
  };
  readonly messages: {
    readonly download: {
      readonly single: {
        readonly error: {
          readonly title: string;
          readonly body: string; // {error}
        };
      };
      readonly progress: {
        readonly title: string; // downloading… {current}/{total}
        readonly body: string; // {percentage}% {filename?}
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
      toggleProgressToastShow: '진행률 토스트 표시',
      toggleProgressToastHide: '진행률 토스트 숨김',
      // Phase 2: I18N-TOOLBAR-LABELS
      previousMedia: '이전 미디어',
      nextMedia: '다음 미디어',
      previousMediaWithShortcut: '이전 미디어 (←)',
      nextMediaWithShortcut: '다음 미디어 (→)',
      fitOriginal: '원본 크기',
      fitWidth: '가로에 맞춤',
      fitHeight: '세로에 맞춤',
      fitContainer: '창에 맞춤',
      fitOriginalWithShortcut: '원본 크기 (1:1)',
      fitWidthTitle: '가로에 맞추기',
      fitHeightTitle: '세로에 맞추기',
      fitContainerTitle: '창에 맞추기',
      downloadCurrent: '현재 파일 다운로드',
      downloadCurrentWithShortcut: '현재 파일 다운로드 (Ctrl+D)',
      downloadAllWithCount: '전체 {count}개 파일 ZIP 다운로드',
      showKeyboardHelp: '키보드 단축키 표시',
      showKeyboardHelpWithShortcut: '키보드 단축키 표시 (?)',
      openSettings: '설정 열기',
      settingsTitle: '설정',
      closeGallery: '갤러리 닫기',
      closeGalleryWithShortcut: '갤러리 닫기 (Esc)',
    },
    settings: {
      title: '설정',
      theme: '테마',
      language: '언어',
      themeAuto: '자동',
      themeLight: '라이트',
      themeDark: '다크',
      close: '닫기',
      downloadProgressToast: '대량 다운로드 진행 토스트 표시',
    },
    messages: {
      download: {
        single: { error: { title: '다운로드 실패', body: '파일을 받을 수 없습니다: {error}' } },
        progress: { title: '다운로드 중', body: '{current}/{total} • {percentage}% {filename}' },
        allFailed: { title: '다운로드 실패', body: '모든 항목을 다운로드하지 못했습니다.' },
        partial: { title: '일부 실패', body: '{count}개 항목을 받지 못했습니다.' },
        retry: {
          // NOTE: i18n literal 스캐너 예외: 이미 리소스 테이블 내이므로 허용
          action: '재시도',
          success: { title: '재시도 성공', body: '실패했던 항목을 모두 받았습니다.' },
        },
        cancelled: { title: '다운로드 취소됨', body: '요청한 다운로드가 취소되었습니다.' },
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
      toggleProgressToastShow: 'Show progress toast',
      toggleProgressToastHide: 'Hide progress toast',
      // Phase 2: I18N-TOOLBAR-LABELS
      previousMedia: 'Previous media',
      nextMedia: 'Next media',
      previousMediaWithShortcut: 'Previous media (←)',
      nextMediaWithShortcut: 'Next media (→)',
      fitOriginal: 'Original size',
      fitWidth: 'Fit to width',
      fitHeight: 'Fit to height',
      fitContainer: 'Fit to window',
      fitOriginalWithShortcut: 'Original size (1:1)',
      fitWidthTitle: 'Fit to width',
      fitHeightTitle: 'Fit to height',
      fitContainerTitle: 'Fit to window',
      downloadCurrent: 'Download current file',
      downloadCurrentWithShortcut: 'Download current file (Ctrl+D)',
      downloadAllWithCount: 'Download all {count} files as ZIP',
      showKeyboardHelp: 'Show keyboard shortcuts',
      showKeyboardHelpWithShortcut: 'Show keyboard shortcuts (?)',
      openSettings: 'Open settings',
      settingsTitle: 'Settings',
      closeGallery: 'Close gallery',
      closeGalleryWithShortcut: 'Close gallery (Esc)',
    },
    settings: {
      title: 'Settings',
      theme: 'Theme',
      language: 'Language',
      themeAuto: 'Auto',
      themeLight: 'Light',
      themeDark: 'Dark',
      close: 'Close',
      downloadProgressToast: 'Show progress toast during bulk download',
    },
    messages: {
      download: {
        single: {
          error: { title: 'Download Failed', body: 'Could not download the file: {error}' },
        },
        progress: { title: 'Downloading', body: '{current}/{total} • {percentage}% {filename}' },
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
      toggleProgressToastShow: '進行トーストを表示',
      toggleProgressToastHide: '進行トーストを非表示',
      // Phase 2: I18N-TOOLBAR-LABELS
      previousMedia: '前のメディア',
      nextMedia: '次のメディア',
      previousMediaWithShortcut: '前のメディア (←)',
      nextMediaWithShortcut: '次のメディア (→)',
      fitOriginal: '原寸サイズ',
      fitWidth: '幅に合わせる',
      fitHeight: '高さに合わせる',
      fitContainer: 'ウィンドウに合わせる',
      fitOriginalWithShortcut: '原寸サイズ (1:1)',
      fitWidthTitle: '幅に合わせる',
      fitHeightTitle: '高さに合わせる',
      fitContainerTitle: 'ウィンドウに合わせる',
      downloadCurrent: '現在のファイルをダウンロード',
      downloadCurrentWithShortcut: '現在のファイルをダウンロード (Ctrl+D)',
      downloadAllWithCount: '全{count}ファイルをZIPでダウンロード',
      showKeyboardHelp: 'キーボードショートカットを表示',
      showKeyboardHelpWithShortcut: 'キーボードショートカットを表示 (?)',
      openSettings: '設定を開く',
      settingsTitle: '設定',
      closeGallery: 'ギャラリーを閉じる',
      closeGalleryWithShortcut: 'ギャラリーを閉じる (Esc)',
    },
    settings: {
      title: '設定',
      theme: 'テーマ',
      language: '言語',
      themeAuto: '自動',
      themeLight: 'ライト',
      themeDark: 'ダーク',
      close: '閉じる',
      downloadProgressToast: '一括ダウンロードの進行トーストを表示',
    },
    messages: {
      download: {
        single: { error: { title: 'ダウンロード失敗', body: 'ファイルを取得できません: {error}' } },
        progress: { title: 'ダウンロード中', body: '{current}/{total} • {percentage}% {filename}' },
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
