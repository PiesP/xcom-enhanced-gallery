/**
 * GalleryController (Phase 13 초기 스캐폴드)
 * 목표: GalleryApp / GalleryCore 혼재된 책임을 단일 퍼사드로 통합.
 * 현재는 GalleryApp 최소 위임 래퍼로 시작하며, TDD GREEN 후 내부 모듈화 진행.
 */
import { GalleryApp } from '@/features/gallery/GalleryApp';
import type { MediaInfo } from '@shared/types/media.types';
import { FEATURE_GALLERY_CONTROLLER, SERVICE_KEYS } from '@/constants';
import { CoreService } from '@shared/services/ServiceManager';
// 지연 의존성: GalleryRenderer 는 필요 시에만 동적 import (테스트 최소 요건)

export interface GalleryControllerDiagnostics {
  isInitialized: boolean;
  isOpen: boolean;
  mediaCount: number;
  currentIndex: number;
}

export class GalleryController {
  private readonly app: GalleryApp;
  private initialized = false;
  // Phase13: controller-level lightweight metrics
  private openCount = 0;
  private lastOpenAt: number | null = null;
  private lastStateCache: {
    open: boolean;
    count: number;
    index: number;
    initialized: boolean;
    metrics: { openCount: number; lastOpenAt: number | null };
  } | null = null;

  // 모듈 캐시 이후 플래그 강제 변경(forceFlag)을 반영하기 위한 런타임 평가 함수
  // 첫 테스트에서 플래그 OFF 상태로 모듈이 로드된 후 두 번째 테스트에서 강제 ON 시
  // 정적 상수 캡처로 인해 initialize()가 no-op 되는 문제를 방지한다.
  private featureEnabled(): boolean {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const forced = (globalThis as any)?.__XEG_FORCE_FLAGS__?.FEATURE_GALLERY_CONTROLLER;
    if (typeof forced === 'boolean') return forced;
    return FEATURE_GALLERY_CONTROLLER; // 기본 상수 (환경 변수 기반 초기 평가 값)
  }

  constructor() {
    this.app = new GalleryApp();
  }

  async initialize(): Promise<void> {
    if (!this.featureEnabled()) return; // 플래그 OFF 시 no-op (회귀 가드)
    // 필요한 핵심 서비스 (GalleryRenderer) 가 없으면 테스트 환경에서 최소 등록
    const core = CoreService.getInstance();
    if (!core.has(SERVICE_KEYS.GALLERY_RENDERER)) {
      try {
        const { GalleryRenderer } = await import('./GalleryRenderer');
        core.register(SERVICE_KEYS.GALLERY_RENDERER, new GalleryRenderer());
      } catch {
        // GalleryRenderer 로드 실패 시 초기화 진행 불가 -> 조용히 반환 (테스트에서 실패 감지)
        return;
      }
    }
    await this.app.initialize();
    this.initialized = true;
  }

  async open(media: MediaInfo[], index = 0): Promise<void> {
    if (!this.featureEnabled()) return this.app.openGallery(media, index);
    await this.app.openGallery(media, index);
    // open 호출 시점에 GalleryApp 이 내부적으로 initialize 되었을 수 있으므로 동기화
    if (!this.initialized) {
      try {
        const diag = this.app.getDiagnostics();
        if (diag.isInitialized) this.initialized = true;
      } catch {
        /* noop */
      }
    }
    // Metrics 업데이트
    this.openCount += 1;
    this.lastOpenAt = Date.now();
  }

  close(): void {
    this.app.closeGallery();
  }

  // (Phase13) 공개 API 축소: getDiagnostics 제거 (퍼사드 단일 getState 로 통합)
  private collectDiagnostics(): GalleryControllerDiagnostics {
    const diag = this.app.getDiagnostics();
    return {
      isInitialized: this.featureEnabled() ? this.initialized : diag.isInitialized,
      isOpen: diag.galleryState.isOpen,
      mediaCount: diag.galleryState.mediaCount,
      currentIndex: diag.galleryState.currentIndex,
    };
  }

  /**
   * Phase13: 축약 상태 + 메트릭 노출 (UI/테스트용 단일 진입점)
   */
  getState(): {
    open: boolean;
    count: number;
    index: number;
    initialized: boolean;
    metrics: { openCount: number; lastOpenAt: number | null };
  } {
    const d = this.collectDiagnostics();
    const next = {
      open: d.isOpen,
      count: d.mediaCount,
      index: d.currentIndex,
      initialized: d.isInitialized,
      metrics: { openCount: this.openCount, lastOpenAt: this.lastOpenAt },
    } as const;
    if (this.lastStateCache) {
      const prev = this.lastStateCache;
      if (
        prev.open === next.open &&
        prev.count === next.count &&
        prev.index === next.index &&
        prev.initialized === next.initialized &&
        prev.metrics.openCount === next.metrics.openCount &&
        prev.metrics.lastOpenAt === next.metrics.lastOpenAt
      ) {
        return prev;
      }
    }
    this.lastStateCache = { ...next, metrics: { ...next.metrics } };
    return this.lastStateCache;
  }
}
