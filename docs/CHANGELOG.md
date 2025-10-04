# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to
[Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- QuestionMark icon for keyboard shortcuts help button
- Icon semantic uniqueness contract tests to prevent icon purpose conflicts
- Enhanced ARIA attributes for ContextMenu component (WCAG 2.1 Level AA):
  - `aria-orientation='vertical'` for screen reader navigation
  - `aria-activedescendant` with reactive tracking for dynamic focus
    announcement
  - Unique `id` for each menuitem (ARIA relationship support)
  - Optional `aria-labelledby` support for external element labeling
- ContextMenu ARIA principles documentation in CODING_GUIDELINES.md
- Complete Toolbar internationalization (i18n) support:
  - 23 new toolbar keys in LanguageService (Korean, English, Japanese)
  - Template support for dynamic text (downloadAllWithCount with {count})
  - Keyboard shortcut integration in titles (\*WithShortcut pattern)

### Changed

- Keyboard help button now uses QuestionMark icon instead of Settings icon
- Settings icon is now exclusively used for settings-related actions
- Icon registry improved to support PascalCase icon names (XEG_ICONS)
- ContextMenuAction interface extended with optional `ariaLabelledBy` property
- All Toolbar labels now use LanguageService instead of hardcoded strings:
  - Navigation buttons: previousMedia, nextMedia
  - Fit mode buttons: fitOriginal, fitWidth, fitHeight, fitContainer
  - Action buttons: downloadCurrent, downloadAllWithCount, showKeyboardHelp
  - Settings and close buttons with proper i18n keys

### Fixed

- Icon semantic ambiguity: Settings icon was used for multiple purposes
- Registry.ts now correctly uses XEG_ICONS export (PascalCase) instead of
  XEG_ICON_DEFINITIONS (kebab-case)
- Toolbar hardcoded Korean text preventing proper language switching

## [0.2.4] - 2024-01-XX

### Previous Releases

See
[Git History](https://github.com/unixzii/xcom-enhanced-gallery/commits/master)
for earlier changes.

---

[Unreleased]:
  https://github.com/unixzii/xcom-enhanced-gallery/compare/v0.2.4...HEAD
[0.2.4]: https://github.com/unixzii/xcom-enhanced-gallery/releases/tag/v0.2.4
