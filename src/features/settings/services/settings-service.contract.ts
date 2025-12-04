import type {
  AppSettings,
  FeatureFlags,
  NestedSettingKey,
  SettingChangeEvent,
} from '@features/settings/types/settings.types';
import type { BaseService } from '@shared/types/core/base-service.types';

export type FeatureFlagMap = Readonly<Record<keyof FeatureFlags, boolean>>;

export interface SettingsServiceContract extends BaseService {
  getAllSettings(): Readonly<AppSettings>;
  get<T = unknown>(key: NestedSettingKey | string): T;
  set<T = unknown>(key: NestedSettingKey, value: T): Promise<void>;
  updateBatch(updates: Partial<Record<NestedSettingKey, unknown>>): Promise<void>;
  resetToDefaults(category?: keyof AppSettings): Promise<void>;
  subscribe(listener: (event: SettingChangeEvent) => void): () => void;
  exportSettings(): string;
  importSettings(jsonString: string): Promise<void>;
  getFeatureMap(): FeatureFlagMap;
}
