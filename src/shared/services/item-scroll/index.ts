/**
 * Item Scroll Services Module
 *
 * 갤러리 아이템 스크롤 관리를 위한 서비스 계층
 *
 * 주요 컴포넌트:
 * - ItemPositioningService: 스크롤 위치 계산 및 실행
 * - ItemScrollStateManager: 상태 신호 동기화
 * - ScrollBehaviorConfigurator: 스크롤 옵션 관리
 */

export { ItemPositioningService, createItemPositioningService } from './item-positioning-service';
export type { ScrollOptions } from './item-positioning-service';

export { ItemScrollStateManager, createItemScrollStateManager } from './item-scroll-state-manager';

export {
  ScrollBehaviorConfigurator,
  createScrollBehaviorConfigurator,
} from './scroll-behavior-configurator';
export type { ScrollBehaviorConfig, ResolvedScrollBehavior } from './scroll-behavior-configurator';
