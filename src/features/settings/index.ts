/**
 * @fileoverview Settings Feature Exports (Feature barrel)
 * @description F1-b: 배럴은 UI/타입/Factory만 노출합니다. 구현(Service 클래스) 재노출 금지.
 * @version 2.1.0
 */

// Factory only (소비자는 factory 경유)
export { getSettingsService, __resetSettingsServiceFactory } from './services/settings-factory';
export type { ISettingsServiceFactoryShape } from './services/settings-factory';

// Types
export * from './types/settings.types';
