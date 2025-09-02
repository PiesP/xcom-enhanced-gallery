/**
 * @fileoverview Gallery Renderer
 * @version 2.0.0 - Clean Architecture 적용
 *
 * 단일 책임 원칙에 따른 갤러리 렌더러
 * - 렌더링만 담당
 * - 상태 관리는 signals에 위임
 * - 간결한 생명주기 관리
 */

import type {
  GalleryRenderOptions,
  GalleryRenderer as GalleryRendererInterface,
} from '@shared/interfaces/gallery.interfaces';
import {
  closeGallery,
  galleryState,
  setError,
  setLoading,
  openGallery,
  setViewMode,
  navigatePrevious,
  navigateNext,
} from '@shared/state/signals/gallery.signals';
import { injectShadowDOMStyles } from '@shared/styles/namespaced-styles';
import type { MediaInfo } from '@shared/types/media.types';
import { VerticalGalleryView } from './components/vertical-gallery-view';
import './styles/gallery-global.css';
import { logger } from '@shared/logging/logger';
import {
  activateGalleryRoot,
  deactivateGalleryRoot,
} from '@features/gallery/core/galleryRootStyles';
import { getPreact } from '@shared/external/vendors';

/**
 * 갤러리 정리 관리자
 */
class GalleryCleanupManager {
  private cleanupTasks: (() => void)[] = [];

  addTask(task: () => void): void {
    this.cleanupTasks.push(task);
  }

  executeAll(): void {
    this.cleanupTasks.forEach(task => {
      try {
        task();
      } catch (error) {
        logger.warn('[CleanupManager] 정리 작업 실패:', error);
      }
    });
    this.cleanupTasks = [];
  }
}

/**
 * 간소화된 갤러리 렌더러
 */
export class GalleryRenderer implements GalleryRendererInterface {
  private container: HTMLDivElement | null = null;
  private isRenderingFlag = false;
  private readonly cleanupManager = new GalleryCleanupManager();
  private stateUnsubscribe: (() => void) | null = null;
  private onCloseCallback?: () => void;
  private shadowRoot: ShadowRoot | null = null; // Phase 4: Shadow DOM 지원
  private useShadowDOM = false; // Phase 4: Shadow DOM 사용 여부
  private autoCreatedRoot = false; // 테스트 환경 자동 생성 여부

  constructor() {
    this.setupStateSubscription();
  }

  /**
   * 갤러리 닫기 콜백 설정 (인터페이스 구현)
   */
  setOnCloseCallback(onClose: () => void): void {
    this.onCloseCallback = onClose;
  }

  /**
   * 상태 구독 설정
   */
  private setupStateSubscription(): void {
    this.stateUnsubscribe = galleryState.subscribe(state => {
      if (state.isOpen && !this.container) {
        // 갤러리가 열렸고 컨테이너가 없을 때만 최초 렌더링
        this.renderGallery();
      } else if (!state.isOpen && this.container) {
        // 갤러리가 닫혔을 때만 정리
        this.cleanupGallery();
      }
      // 이미 렌더링된 상태에서는 컴포넌트가 signal을 직접 구독하므로 재렌더링하지 않음
    });
  }

  /**
   * 갤러리 렌더링 - 한 번만 실행
   */
  private renderGallery(): void {
    if (this.isRenderingFlag || this.container) {
      // 이미 렌더링 중이거나 컨테이너가 존재하면 중복 렌더링 방지
      return;
    }

    const state = galleryState.value;
    if (!state.isOpen || state.mediaItems.length === 0) return;

    this.isRenderingFlag = true;
    logger.info('[GalleryRenderer] 최초 렌더링 시작 - Signal 기반 반응형 컴포넌트');

    try {
      this.createContainer();
      this.renderComponent();
      logger.info('[GalleryRenderer] 갤러리 컴포넌트 렌더링 완료 - 이후 Signal로 자동 업데이트');
    } catch (error) {
      logger.error('[GalleryRenderer] 렌더링 실패:', error);
      setError('갤러리 렌더링에 실패했습니다.');
    } finally {
      this.isRenderingFlag = false;
    }
  }

  /**
   * 컨테이너 생성 - 갤러리 컨테이너 생성 (Phase 4: Shadow DOM 지원)
   */
  private createContainer(): void {
    this.cleanupContainer();

    // CH1: 기존 .xeg-gallery-renderer 제거 → #xeg-gallery-root 재사용
    let existingRoot = document.querySelector('#xeg-gallery-root') as HTMLDivElement | null;
    if (!existingRoot) {
      // 테스트 및 독립 렌더링 환경 호환: GalleryApp 없이 직접 render 호출 시 루트 자동 생성
      existingRoot = document.createElement('div');
      existingRoot.id = 'xeg-gallery-root';
      activateGalleryRoot(existingRoot);
      document.body.appendChild(existingRoot);
      this.autoCreatedRoot = true;
      logger.debug('[GalleryRenderer] 테스트/독립 환경 자동 루트 생성 (#xeg-gallery-root)');
    } else {
      // 기존 루트 재활성화
      activateGalleryRoot(existingRoot);
    }
    // 과거 일부 테스트는 .xeg-gallery-renderer 제거를 기대하므로 기본적으로 클래스 미부여
    // 필요 시 향후 플래그 기반으로 재도입 가능
    this.container = existingRoot;

    if (this.useShadowDOM) {
      try {
        this.shadowRoot =
          this.container.shadowRoot || this.container.attachShadow({ mode: 'open' });
        injectShadowDOMStyles(this.shadowRoot);
        logger.info('[GalleryRenderer] Shadow DOM (root direct) 준비 완료 (CH1)');
      } catch (error) {
        logger.warn('[GalleryRenderer] Shadow DOM 준비 실패 (CH1):', error);
        this.shadowRoot = null;
      }
    }

    this.cleanupManager.addTask(() => {
      this.shadowRoot = null;
    });
  }

  /**
   * 컴포넌트 렌더링 - 갤러리 컴포넌트 렌더링
   */
  private renderComponent(): void {
    if (!this.container) return;

    const { render, createElement } = getPreact();

    // DOM depth 단순화를 위해 GalleryContainer 래퍼 제거 (Phase 3 GREEN)
    // 필요한 오버레이/레이아웃 스타일은 루트 컨테이너(this.container) 자체에 적용
    // CH1: 스타일은 GalleryApp.ensureGalleryContainer 에서 root 에 이미 적용

    const galleryElement = createElement(VerticalGalleryView, {
      onClose: () => {
        closeGallery();
        if (this.onCloseCallback) {
          this.onCloseCallback();
        }
      },
      onPrevious: () => this.handleNavigation('previous'),
      onNext: () => this.handleNavigation('next'),
      onDownloadCurrent: () => this.handleDownload('current'),
      onDownloadAll: () => this.handleDownload('all'),
      className: 'xeg-vertical-gallery',
    });

    // Phase 4: Shadow DOM 격리 지원 - shadowRoot가 있으면 shadowRoot에 렌더링
    const renderTarget = this.shadowRoot || this.container;
    render(galleryElement, renderTarget);
    logger.info('[GalleryRenderer] 갤러리 컴포넌트 렌더링 완료', { shadowDOM: !!this.shadowRoot });
  }

  /**
   * Phase 3: GalleryContainer 제거 후 루트 컨테이너에 직접 스타일 부여
   * (기존 GalleryContainer overlay 역할 대체)
   */
  private applyRootStyles(): void {
    /* deprecated in CH1 - retained for backward compatibility noop */
  }

  /**
   * 네비게이션 처리
   */
  private handleNavigation(direction: 'previous' | 'next'): void {
    if (direction === 'previous') {
      navigatePrevious();
    } else {
      navigateNext();
    }
  }

  /**
   * 다운로드 처리
   */
  private async handleDownload(type: 'current' | 'all'): Promise<void> {
    try {
      setLoading(true);

      // 다운로드 서비스 - Core BulkDownloadService 직접 사용
      const { BulkDownloadService } = await import('@shared/services/BulkDownloadService');

      const downloadService = new BulkDownloadService();
      const state = galleryState.value;

      if (type === 'current') {
        const currentMedia = state.mediaItems[state.currentIndex];
        if (currentMedia) {
          await downloadService.downloadSingle(currentMedia);
        }
      } else {
        await downloadService.downloadMultiple(state.mediaItems);
      }
    } catch (error) {
      logger.error(`[GalleryRenderer] ${type} 다운로드 실패:`, error);
      setError('다운로드에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  }

  /**
   * 갤러리 정리
   */
  private cleanupGallery(): void {
    logger.info('[GalleryRenderer] 정리 시작');

    this.isRenderingFlag = false;
    this.cleanupContainer();
    this.cleanupManager.executeAll();

    logger.debug('[GalleryRenderer] 정리 완료');
  }

  /**
   * 컨테이너 정리
   */
  private cleanupContainer(): void {
    if (this.container) {
      try {
        const { render } = getPreact();
        render(null, this.shadowRoot || this.container);
      } catch (error) {
        logger.warn('[GalleryRenderer] 컨테이너 정리 실패:', error);
      }
      // CH1: root 자체는 제거하지 않음 (재사용)
      if (this.autoCreatedRoot) {
        try {
          this.container.remove();
        } catch {
          /* ignore */
        }
        this.autoCreatedRoot = false;
      } else {
        // overlay 비활성화
        deactivateGalleryRoot(this.container);
      }
      this.container = null;
    }
  }

  // =============================================================================
  // GalleryRendererInterface 구현
  // =============================================================================

  async render(
    mediaItems: readonly MediaInfo[],
    renderOptions?: GalleryRenderOptions
  ): Promise<void> {
    // Phase 4: Shadow DOM 옵션 설정
    if (renderOptions?.useShadowDOM !== undefined) {
      this.useShadowDOM = renderOptions.useShadowDOM;
      // Shadow DOM 설정이 변경되면 기존 컨테이너 정리하여 재생성 유도
      if (this.container) {
        this.cleanupGallery();
      }
    }

    openGallery(mediaItems, renderOptions?.startIndex ?? 0);

    if (renderOptions?.viewMode) {
      // ViewMode를 setViewMode에서 허용하는 타입으로 변환
      const mode = renderOptions.viewMode === 'horizontal' ? 'horizontal' : 'vertical';
      setViewMode(mode);
    }

    logger.info(`[GalleryRenderer] ${mediaItems.length}개 미디어로 갤러리 렌더링`, {
      shadowDOM: this.useShadowDOM,
    });
  }

  close(): void {
    closeGallery();
  }

  isRendering(): boolean {
    return this.isRenderingFlag;
  }

  destroy(): void {
    logger.info('[GalleryRenderer] 완전 정리 시작');

    this.stateUnsubscribe?.();
    this.cleanupGallery();

    logger.info('[GalleryRenderer] 완전 정리 완료');
  }
}

// 싱글톤 인스턴스 export
export const galleryRenderer = new GalleryRenderer();
