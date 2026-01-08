import type { AppSettings } from '@features/settings/types/settings.types';

export type Migration = (input: AppSettings) => AppSettings;

export type MigrationRegistry = Readonly<Partial<Record<string, Migration>>>;
