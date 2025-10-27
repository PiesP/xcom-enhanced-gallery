/**
 * Focus Services Module
 *
 * 포커스 추적 및 적용을 위한 서비스 계층
 *
 * 주요 컴포넌트:
 * - FocusObserverManager: IntersectionObserver 관리
 * - FocusApplicatorService: 자동 포커스 적용
 * - FocusStateManagerService: 상태 동기화 및 debounce
 */

export { FocusObserverManager, createFocusObserverManager } from './focus-observer-manager';

export { FocusApplicatorService, createFocusApplicatorService } from './focus-applicator-service';

export {
  FocusStateManagerService,
  createFocusStateManagerService,
} from './focus-state-manager-service';
