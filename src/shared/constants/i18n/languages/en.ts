/**
 * @fileoverview English Language Strings
 * @description Complete translation strings for English (en) locale
 * @version 2.0.0 - Phase 400: Comprehensive English documentation with context
 * @module shared/constants/i18n/languages/en
 *
 * **Language Metadata**:
 * - Code: 'en' (ISO 639-1)
 * - Name: English
 * - Region: United States (en-US)
 * - Variants: en-GB, en-AU supported (default fallback)
 * - Direction: LTR (left-to-right)
 * - Encoding: UTF-8
 *
 * **String Categories**:
 *
 * ### Toolbar Strings (UI Controls)
 * Strings for media navigation and download toolbar
 * - **previous**: Navigate to previous media item
 * - **next**: Navigate to next media item
 * - **download**: Download current media
 * - **downloadAll**: Download all media as ZIP
 * - **settings**: Open settings panel
 * - **close**: Exit gallery view
 *
 * **Context**: These strings appear as button labels in the gallery toolbar.
 * Used for mouse/keyboard interaction feedback.
 *
 * ### Settings Strings (Configuration Panel)
 * Strings for settings modal and preferences
 * - **title**: Settings panel heading
 * - **theme**: Theme preference label
 * - **language**: Language preference label
 * - **themeAuto/Light/Dark**: Theme option labels
 * - **languageAuto/Ko/En/Ja**: Language option labels
 * - **close**: Close button
 * - **gallery**: Gallery section header
 *
 * **Context**: Settings panel displays user preferences for theme and language.
 * Language labels show native names: English, 한국어, 日本語, Auto.
 *
 * ### Message Strings (Notifications & Feedback)
 * Strings for user-facing messages and notifications
 *
 * **errorBoundary**: Error boundary fallback
 * - title: "An error occurred"
 * - body: "An unexpected error occurred: {error}"
 * - Context: Displayed when component crashes, includes error details
 *
 * **keyboardHelp**: Keyboard shortcut reference
 * - title: "Keyboard shortcuts"
 * - navPrevious: "ArrowLeft: Previous media"
 * - navNext: "ArrowRight: Next media"
 * - close: "Escape: Close gallery"
 * - toggleHelp: "?: Show this help"
 * - Context: Help modal shows keyboard shortcuts for gallery navigation
 *
 * **download**: Download feedback messages
 * - **single.error**: Single file download failure
 *   - title: "Download Failed"
 *   - body: "Could not download the file: {error}"
 * - **allFailed**: All downloads failed
 *   - title: "Download Failed"
 *   - body: "Failed to download all items."
 * - **partial**: Some downloads failed
 *   - title: "Partial Failure"
 *   - body: "Failed to download {count} items."
 * - **retry.action**: Retry button label ("Retry")
 * - **retry.success**: Retry succeeded
 *   - title: "Retry Successful"
 *   - body: "Successfully downloaded all previously failed items."
 * - **cancelled**: User cancelled download
 *   - title: "Download Cancelled"
 *   - body: "The requested download was cancelled."
 * - Context: Displayed as toast notifications during download operations
 *
 * **gallery**: Gallery state messages
 * - **emptyTitle**: "No media available" (when no items)
 * - **emptyDescription**: "There are no images or videos to display."
 * - **failedToLoadImage**: "{type} 로드에 실패했습니다"
 *   - type placeholder: "Image", "Video", or media format
 * - Context: Displayed in gallery area when empty or loading fails
 *
 * ## String Interpolation
 *
 * **Placeholders** (in braces):
 * - {error}: Error message details
 * - {count}: Number of failed items
 * - {type}: Media type (Image, Video, etc.)
 *
 * **Example**:
 * - Template: "Failed to download {count} items."
 * - Runtime: "Failed to download 3 items."
 *
 * ## Localization Notes
 *
 * **Grammar & Style**:
 * - Imperative tone for actions (Previous, Next, Download)
 * - Professional, accessible language
 * - No jargon or regional slang
 * - Sentence case for titles
 * - Title case for UI labels
 *
 * **Consistency**:
 * - Parallel structure: "Download" vs "Download ZIP"
 * - Consistent terminology: "items", "media", "download"
 * - Consistent punctuation: No trailing periods in UI labels
 *
 * **Scope**:
 * - English strings are primary reference (master translations)
 * - Other languages (ja, ko) derive from English
 * - Update here first, then translate to other languages
 *
 * ## Type Safety
 *
 * All strings conform to `LanguageStrings` interface:
 * - toolbar: Toolbar control strings
 * - settings: Settings UI strings
 * - messages: User-facing message strings
 *
 * Optional message properties marked with `?` in type definition.
 *
 * ## Related Documentation
 * - {@link ../language-types} - Language string type definitions
 * - {@link ../translation-registry} - Language registration
 * - {@link ../../index.ts} - i18n system entry point
 * - {@link ../../../services/language-service.ts} - Language switching service
 *
 * @see {@link ../language-types.ts} - Type definitions
 * @see {@link ../index.ts} - i18n barrel export
 */

import type { LanguageStrings } from '../language-types';

/**
 * English language strings (en-US)
 * Primary reference translations for X.com Enhanced Gallery
 *
 * @type {LanguageStrings}
 * @const
 */
export const en: LanguageStrings = {
  toolbar: {
    previous: 'Previous',
    next: 'Next',
    download: 'Download',
    downloadAll: 'Download ZIP',
    settings: 'Settings',
    close: 'Close',
    tweetText: 'Tweet text',
    tweetTextPanel: 'Tweet text panel',
  },
  settings: {
    title: 'Settings',
    theme: 'Theme',
    language: 'Language',
    themeAuto: 'Auto',
    themeLight: 'Light',
    themeDark: 'Dark',
    languageAuto: 'Auto / 자동 / 自動',
    languageKo: '한국어',
    languageEn: 'English',
    languageJa: '日本語',
    close: 'Close',
    gallery: {
      sectionTitle: 'Gallery',
    },
  },
  messages: {
    errorBoundary: { title: 'An error occurred', body: 'An unexpected error occurred: {error}' },
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
};
