/**
 * SettingsService Factory (features 레이어)
 * shared 레이어에서 features 로 직접 의존하지 않도록 분리.
 */
import { SettingsService } from './SettingsService';

export interface ISettingsServiceFactoryShape {
  get<T = unknown>(key: string): T;
  set<T = unknown>(key: string, value: T): Promise<void>;
  subscribe?(handler: (event: { key: string; newValue: unknown }) => void): void;
  cleanup?(): void;
}

let instancePromise: Promise<ISettingsServiceFactoryShape> | null = null;

export async function getSettingsService(): Promise<ISettingsServiceFactoryShape> {
  if (!instancePromise) {
    instancePromise = Promise.resolve(new SettingsService());
  }
  return instancePromise;
}

export function __resetSettingsServiceFactory(): void {
  instancePromise = null;
}
