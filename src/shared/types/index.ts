/**
 * @fileoverview 통합 타입 시스템 - 메인 인덱스
 * @description Phase 1: 타입 통합 완료 - 모든 통합된 타입들의 중앙 진입점
 * @version 2.0.0 - 타입 통합 완료
 */

// Phase 1: 통합된 타입 시스템
export * from './unified';

// 기존 미디어 타입들
export * from './media.types';

// 기존 앱 타입들 (이제 unified 타입들을 re-export)
export * from './app.types';

// UserScript API 타입들
export * from './core/userscript.d';

// 하위 호환성을 위한 re-export
export type { Result, AsyncResult, Option } from './app.types';

// ========================================
// 편의를 위한 그룹별 타입 re-export
// ========================================

export type {
  // 핵심 애플리케이션 타입들
  AppConfig,
  ServiceConfig,
  BaseService,
  BaseConfig,

  // 생명주기 관리 타입들
  Cleanupable,
  Disposable,
  Destroyable,
  Lifecycle,
  LifecycleConfig,

  // UI & 갤러리 관련 타입들
  GalleryConfig,
  ThemeConfig,
  AnimationConfig,

  // 유틸리티 타입들
  Point,
  Size,
  EventHandler,
  AsyncEventHandler,
  RequiredFields,
  PartialFields,
  StringRecord,
  TypeGuard,
} from './unified';
