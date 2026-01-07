/**
 * @fileoverview Type definitions for settings migration
 * @description Defines migration function signatures and types
 */

import type { AppSettings } from '@features/settings/types/settings.types';

/**
 * Migration function type - transforms settings from one version to another
 */
export type Migration = (input: AppSettings) => AppSettings;

/**
 * Migration registry - maps version strings to migration functions
 */
export type MigrationRegistry = Readonly<Partial<Record<string, Migration>>>;
