/**
 * @file Test-only compat adapter for UnifiedEventManager
 * 기존 리팩터링 테스트가 참조하는 경로(@shared/services/UnifiedEventManager)를
 * 현재 구현(@shared/services/EventManager)으로 매핑합니다.
 */

export { EventManager as UnifiedEventManager } from '@shared/services/EventManager';
