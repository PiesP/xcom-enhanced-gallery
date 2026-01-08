import type { LanguageStrings } from '@shared/constants/i18n/i18n.types';
import { buildLanguageStringsFromValues } from '@shared/constants/i18n/translation-values';

const EN_VALUES = [
  'Previous',
  'Next',
  'Download',
  'Download all {count} files as ZIP',
  'Open Settings',
  'Close',
  'View tweet',
  'Tweet text panel',
  'View original tweet',
  'Original',
  'Fit Width',
  'Fit Height',
  'Fit Window',
  'Theme',
  'Language',
  'Auto',
  'Light',
  'Dark',
  'Auto / 자동 / 自動',
  'Korean',
  'English',
  'Japanese',
  'An error occurred',
  'An unexpected error occurred: {error}',
  'Keyboard shortcuts',
  'ArrowLeft: Previous media',
  'ArrowRight: Next media',
  'Escape: Close gallery',
  '?: Show this help',
  'Download Failed',
  'Could not download the file: {error}',
  'Download Failed',
  'Failed to download all items.',
  'Partial Failure',
  'Failed to download {count} items.',
  'No media available',
  'There are no images or videos to display.',
  'Media {index}: {filename}',
  'Failed to load {type}',
] as const;

/**
 * English language strings for the application
 */
export const en: LanguageStrings = buildLanguageStringsFromValues(EN_VALUES);
