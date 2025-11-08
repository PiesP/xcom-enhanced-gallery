/**
 * @fileoverview Korean Language Strings
 * @description Complete translation strings for Korean (ko) locale
 * @version 2.0.0 - Phase 400: Comprehensive documentation with cultural context
 * @module shared/constants/i18n/languages/ko
 *
 * **Language Metadata**:
 * - Code: 'ko' (ISO 639-1)
 * - Name: 한국어 (Hangugeo)
 * - Region: South Korea (ko-KR)
 * - Variants: ko-KR (South), ko-KP (North, not supported)
 * - Direction: LTR (left-to-right)
 * - Encoding: UTF-8
 * - Writing System: Hangul (한글) - alphabetic, no characters
 *
 * **Translation Strategy**:
 * - Based on English reference (en.ts)
 * - Uses native Korean terms (Hangul exclusively)
 * - Maintains formality appropriate for UI context
 * - Consistent with Korean UX conventions
 * - No Chinese characters (한자) to maximize accessibility
 *
 * **String Categories**:
 * Same as English version, with Korean translations.
 *
 * ### Toolbar Strings (UI Controls)
 * - **previous**: '이전' (ijeon - previous)
 * - **next**: '다음' (daeum - next)
 * - **download**: '다운로드' (Native Korean with English origin)
 * - **downloadAll**: 'ZIP 다운로드' (ZIP download)
 * - **settings**: '설정' (seoljeong - settings)
 * - **close**: '닫기' (datgi - close action)
 *
 * ### Settings Strings (Configuration Panel)
 * - **title**: '설정' (Settings)
 * - **theme**: '테마' (tema - theme in Korean)
 * - **language**: '언어' (eoneo - language)
 * - **themeAuto**: '자동' (jadong - automatic)
 * - **themeLight**: '라이트' (raiteu - light in Korean)
 * - **themeDark**: '다크' (dakeu - dark in Korean)
 * - **languageAuto**: '자동 / Auto / 자동' (shows all supported languages)
 * - **gallery**: **sectionTitle**: '갤러리' (gaelleori - gallery in Korean)
 *
 * ### Message Strings (Notifications & Feedback)
 *
 * **errorBoundary**: Error handling
 * - title: '오류가 발생했습니다' (An error has occurred)
 * - body: '예상치 못한 오류가 발생했습니다: {error}' (Unexpected error occurred)
 *
 * **keyboardHelp**: Keyboard shortcut reference
 * - title: '키보드 단축키' (Keyboard shortcuts)
 * - navPrevious: 'ArrowLeft: 이전 미디어' (Previous media)
 * - navNext: 'ArrowRight: 다음 미디어' (Next media)
 * - close: 'Escape: 갤러리 닫기' (Close gallery)
 * - toggleHelp: '?: 이 도움말 표시' (Show this help)
 *
 * **download**: Download status messages
 * - single.error: '다운로드 실패' (Download failure)
 * - allFailed: '다운로드 실패' + '모든 항목을 다운로드할 수 없었습니다'
 * - partial: '일부 실패' (Partial failure) + '{count}개 항목을 가져올 수 없었습니다'
 *   - Note: '개' (gae) is counter for items
 * - retry.action: '다시 시도' (Retry)
 * - retry.success: '다시 시도 성공' (Retry successful)
 * - cancelled: '다운로드가 취소되었습니다' (Download was cancelled)
 *
 * **gallery**: Gallery state messages
 * - emptyTitle: '미디어 없음' (No media)
 * - emptyDescription: '표시할 이미지 또는 동영상이 없습니다' (No images or videos to display)
 * - failedToLoadImage: '{type} 로드 실패' (Failed to load {type})
 *
 * ## Localization & Cultural Notes
 *
 * **Formality Level**:
 * - Uses polite formal tone (습니다/습니까 ending)
 * - Professional and accessible for all users
 * - UI buttons use standard present tense
 *
 * **Grammar**:
 * - 100% Hangul (한글) - no Chinese characters for accessibility
 * - Proper use of Korean particles: 을/를, 이/가, 에, 에게
 * - Subject-Object-Verb (SOV) word order
 * - Consistent verb conjugation throughout
 *
 * **Terminology**:
 * - '미디어' (misero) - consistent media term
 * - '다운로드' - standard technical term
 * - '항목' (hangmok) - standard item/list term
 * - '다시 시도' - standard retry action
 *
 * **Constraints**:
 * - Keep strings concise for UI layout
 * - Use common modern Korean vocabulary
 * - Avoid overly formal or archaic expressions
 * - Match English character count roughly (Korean is more compact)
 * - All Hangul reduces cognitive load (no Han-Ja memorization)
 *
 * ## Type Safety
 *
 * All strings conform to `LanguageStrings` interface.
 * Structure mirrors English version for consistency.
 *
 * ## Related Documentation
 * - {@link ../language-types} - Language string type definitions
 * - {@link ./en.ts} - English reference translations
 * - {@link ./ja.ts} - Japanese translations
 *
 * @see {@link ./en.ts} - English reference
 * @see {@link ../index.ts} - i18n barrel export
 */

import type { LanguageStrings } from '../language-types';

/**
 * Korean language strings (ko-KR)
 * Translated from English reference (en.ts)
 * Follows Korean UI conventions and 100% Hangul typography
 *
 * @type {LanguageStrings}
 * @const
 */
export const ko: LanguageStrings = {
  toolbar: {
    previous: '이전',
    next: '다음',
    download: '다운로드',
    downloadAll: 'ZIP 다운로드',
    settings: '설정',
    close: '닫기',
    tweetText: '트윗 텍스트',
    tweetTextPanel: '트윗 텍스트 패널',
  },
  settings: {
    title: '설정',
    theme: '테마',
    language: '언어',
    themeAuto: '자동',
    themeLight: '라이트',
    themeDark: '다크',
    languageAuto: '자동 / Auto / 자동',
    languageKo: '한국어',
    languageEn: 'English',
    languageJa: '日本語',
    close: '닫기',
    gallery: {
      sectionTitle: '갤러리',
    },
  },
  messages: {
    errorBoundary: {
      title: '오류가 발생했습니다',
      body: '예상치 못한 오류가 발생했습니다: {error}',
    },
    keyboardHelp: {
      title: '키보드 단축키',
      navPrevious: 'ArrowLeft: 이전 미디어',
      navNext: 'ArrowRight: 다음 미디어',
      close: 'Escape: 갤러리 닫기',
      toggleHelp: '?: 이 도움말 표시',
    },
    download: {
      single: { error: { title: '다운로드 실패', body: '파일을 가져올 수 없습니다: {error}' } },
      allFailed: {
        title: '다운로드 실패',
        body: '모든 항목을 다운로드할 수 없었습니다.',
      },
      partial: { title: '일부 실패', body: '{count}개 항목을 가져올 수 없었습니다.' },
      retry: {
        action: '다시 시도',
        success: { title: '다시 시도 성공', body: '실패했던 모든 항목을 가져왔습니다.' },
      },
      cancelled: {
        title: '다운로드가 취소되었습니다',
        body: '요청한 다운로드가 취소되었습니다.',
      },
    },
    gallery: {
      emptyTitle: '미디어 없음',
      emptyDescription: '표시할 이미지 또는 동영상이 없습니다.',
      failedToLoadImage: '{type} 로드 실패',
    },
  },
};
