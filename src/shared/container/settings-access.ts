/**
 * Thin wrapper re-exporting typed settings utilities.
 * Provides type-safe access with compile-time validation.
 */

export type { SettingPath, SettingValue } from './typed-settings';
export { getTypedSettingOr, setTypedSetting } from './typed-settings';
