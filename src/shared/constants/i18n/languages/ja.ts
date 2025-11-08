/**
 * @fileoverview Japanese Language Strings
 * @description Complete translation strings for Japanese (ja) locale
 * @version 2.0.0 - Phase 400: Comprehensive documentation with cultural context
 * @module shared/constants/i18n/languages/ja
 *
 * **Language Metadata**:
 * - Code: 'ja' (ISO 639-1)
 * - Name: 日本語 (Nihongo)
 * - Region: Japan (ja-JP)
 * - Variants: ja-JP (standard), ja-KS (Kansai)
 * - Direction: LTR (left-to-right)
 * - Encoding: UTF-8
 * - Writing System: Hiragana, Katakana, Kanji
 *
 * **Translation Strategy**:
 * - Based on English reference (en.ts)
 * - Uses Katakana for technical terms and English origin words
 * - Maintains formality appropriate for UI context
 * - Consistent with Japanese UX conventions
 *
 * **String Categories**:
 * Same as English version, with Japanese translations.
 *
 * ### Toolbar Strings (UI Controls)
 * - **previous**: '前へ' (mae e - "go forward" in terms of previous time)
 * - **next**: '次へ' (tsugi e - "go to next")
 * - **download**: 'ダウンロード' (Katakana technical term)
 * - **downloadAll**: 'ZIPダウンロード' (ZIP download)
 * - **settings**: '設定' (settei - standard term)
 * - **close**: '閉じる' (tojiru - standard action)
 *
 * ### Settings Strings (Configuration Panel)
 * - **title**: '設定' (Settings)
 * - **theme**: 'テーマ' (Katakana for theme)
 * - **language**: '言語' (gengo - language)
 * - **themeAuto**: '自動' (jidou - automatic)
 * - **themeLight**: 'ライト' (Katakana for light)
 * - **themeDark**: 'ダーク' (Katakana for dark)
 * - **languageAuto**: '自動 / Auto / 자동' (shows all supported languages)
 * - **gallery**: **sectionTitle**: 'ギャラリー' (Katakana for gallery)
 *
 * ### Message Strings (Notifications & Feedback)
 *
 * **errorBoundary**: Error handling
 * - title: 'エラーが発生しました' (Error has occurred)
 * - body: '予期しないエラーが発生しました: {error}' (Unexpected error)
 *
 * **keyboardHelp**: Keyboard shortcut reference
 * - title: 'キーボードショートカット' (Keyboard shortcuts)
 * - navPrevious: 'ArrowLeft: 前のメディア' (Previous media)
 * - navNext: 'ArrowRight: 次のメディア' (Next media)
 * - close: 'Escape: ギャラリーを閉じる' (Close gallery)
 * - toggleHelp: '?: このヘルプを表示' (Show this help)
 *
 * **download**: Download status messages
 * - single.error: 'ダウンロード失敗' (Download failure)
 * - allFailed: 'ダウンロード失敗' + 'すべての項目をダウンロードできませんでした'
 * - partial: '一部失敗' (Partial failure) + '{count}個の項目を取得できませんでした'
 *   - Note: '個' (ko) is counter for items
 * - retry.action: '再試行' (Retry)
 * - retry.success: '再試行成功' (Retry successful)
 * - cancelled: 'ダウンロードがキャンセルされました' (Download was cancelled)
 *
 * **gallery**: Gallery state messages
 * - emptyTitle: 'メディアがありません' (No media)
 * - emptyDescription: '表示する画像や動画がありません' (No images or videos to display)
 * - failedToLoadImage: '{type} の読み込みに失敗しました' (Failed to load {type})
 *
 * ## Localization & Cultural Notes
 *
 * **Formality Level**:
 * - Uses polite/casual tone (ます form)
 * - Not too formal, maintains accessibility
 * - UI buttons use casual form (活用形)
 *
 * **Grammar**:
 * - Kanji + Hiragana combination for readability
 * - Katakana for foreign/technical terms
 * - Proper use of particles: を, に, で, へ
 * - Verb conjugation appropriate for UI context
 *
 * **Terminology**:
 * - 'メディア' (media) - consistent across UI
 * - 'ダウンロード' - standard technical term
 * - '項目' (items) - standard list term
 * - '再試行' - standard retry/retry action
 *
 * **Constraints**:
 * - Keep strings concise for UI layout
 * - Avoid kanji that require furigana
 * - Use common vocabulary for accessibility
 * - Match English character count roughly (Japanese is more compact)
 *
 * ## Type Safety
 *
 * All strings conform to `LanguageStrings` interface.
 * Structure mirrors English version for consistency.
 *
 * ## Related Documentation
 * - {@link ../language-types} - Language string type definitions
 * - {@link ./en.ts} - English reference translations
 * - {@link ./ko.ts} - Korean translations
 *
 * @see {@link ./en.ts} - English reference
 * @see {@link ../index.ts} - i18n barrel export
 */

import type { LanguageStrings } from '../language-types';

/**
 * Japanese language strings (ja-JP)
 * Translated from English reference (en.ts)
 * Follows Japanese UI conventions and terminology
 *
 * @type {LanguageStrings}
 * @const
 */
export const ja: LanguageStrings = {
  toolbar: {
    previous: '前へ',
    next: '次へ',
    download: 'ダウンロード',
    downloadAll: 'ZIPダウンロード',
    settings: '設定',
    close: '閉じる',
    tweetText: 'ツイートテキスト',
    tweetTextPanel: 'ツイートテキストパネル',
  },
  settings: {
    title: '設定',
    theme: 'テーマ',
    language: '言語',
    themeAuto: '自動',
    themeLight: 'ライト',
    themeDark: 'ダーク',
    languageAuto: '自動 / Auto / 자동',
    languageKo: '한국어',
    languageEn: 'English',
    languageJa: '日本語',
    close: '閉じる',
    gallery: {
      sectionTitle: 'ギャラリー',
    },
  },
  messages: {
    errorBoundary: {
      title: 'エラーが発生しました',
      body: '予期しないエラーが発生しました: {error}',
    },
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
};
