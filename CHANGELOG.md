# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to
[Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- QuestionMark icon for keyboard shortcuts help button
- Icon semantic uniqueness contract tests to prevent icon purpose conflicts

### Changed

- Keyboard help button now uses QuestionMark icon instead of Settings icon
- Settings icon is now exclusively used for settings-related actions
- Icon registry improved to support PascalCase icon names (XEG_ICONS)

### Fixed

- Icon semantic ambiguity: Settings icon was used for multiple purposes
- Registry.ts now correctly uses XEG_ICONS export (PascalCase) instead of
  XEG_ICON_DEFINITIONS (kebab-case)

## [0.2.4] - 2024-01-XX

### Previous Releases

See
[Git History](https://github.com/unixzii/xcom-enhanced-gallery/commits/master)
for earlier changes.

---

[Unreleased]:
  https://github.com/unixzii/xcom-enhanced-gallery/compare/v0.2.4...HEAD
[0.2.4]: https://github.com/unixzii/xcom-enhanced-gallery/releases/tag/v0.2.4
