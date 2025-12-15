/**
 * @fileoverview Settings persistence command plan
 * @description Pure command generation for persisting settings to storage.
 */

import type { AppSettings } from '@features/settings/types/settings.types';

export type SettingsPersistCommand =
  | {
      readonly type: 'STORE_SET';
      readonly key: string;
      readonly value: unknown;
    }
  | {
      readonly type: 'LOG';
      readonly level: 'debug' | 'info' | 'warn' | 'error';
      readonly message: string;
      readonly context?: Readonly<Record<string, unknown>>;
    };

export interface PlanSettingsPersistInput {
  readonly key: string;
  readonly settings: AppSettings;
  readonly schemaHash: string;
}

/**
 * Build the storage payload and emit a single STORE_SET command.
 */
export function planSettingsPersist(
  input: PlanSettingsPersistInput
): readonly SettingsPersistCommand[] {
  return [
    {
      type: 'STORE_SET',
      key: input.key,
      value: {
        ...input.settings,
        __schemaHash: input.schemaHash,
      },
    },
  ];
}
