/**
 * @fileoverview 설정 서비스 팩토리
 * @description SettingsService 싱글톤 인스턴스를 제공하는 팩토리
 */
import { SettingsService } from './settings-service';

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
