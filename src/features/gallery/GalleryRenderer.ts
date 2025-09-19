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
import type { MediaInfo } from '@shared/types/media.types';
import { VerticalGalleryView } from './components/vertical-gallery-view';
import { GalleryContainer } from '@shared/components/isolation';
import { logger } from '@shared/logging/logger';
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
   * 컨테이너 생성 - 갤러리 컨테이너 생성
   */
  private createContainer(): void {
    this.cleanupContainer();

    this.container = document.createElement('div');
    this.container.className = 'xeg-gallery-renderer';
    this.container.setAttribute('data-renderer', 'gallery');

    document.body.appendChild(this.container);

    // 정리 작업 등록
    this.cleanupManager.addTask(() => {
      // 컨테이너 정리는 cleanupContainer에서 처리
    });
  }

  /**
   * 컴포넌트 렌더링 - 갤러리 컴포넌트 렌더링
   */
  private renderComponent(): void {
    if (!this.container) return;

    const { render, createElement } = getPreact();

    // GalleryContainer로 VerticalGalleryView를 래핑
    const galleryElement = createElement(GalleryContainer, {
      onClose: () => {
        closeGallery();
        if (this.onCloseCallback) {
          this.onCloseCallback();
        }
      },
      // 내부 컨테이너에는 renderer 클래스를 중복 부여하지 않는다 (DOM 간소화)
      className: '',
      useShadowDOM: true, // Shadow DOM 활성화로 스타일 격리
      children: createElement(VerticalGalleryView, {
        // 이벤트 핸들러만 전달, 상태는 Signal에서 직접 구독
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
      }),
    });

    render(galleryElement, this.container);
    logger.info('[GalleryRenderer] 갤러리 컴포넌트 렌더링 완료');
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

      // 다운로드 서비스 - factory 경유 사용 (Phase 6)
      const { getBulkDownloadService } = await import('@shared/services/service-factories');
      const downloadService = await getBulkDownloadService();
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
      logger.error(`[GalleryRenderer] ${type} download failed:`, error);
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
        render(null, this.container);

        if (document.contains(this.container)) {
          this.container.remove();
        }
      } catch (error) {
        logger.warn('[GalleryRenderer] 컨테이너 정리 실패:', error);
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
    openGallery(mediaItems, renderOptions?.startIndex ?? 0);

    if (renderOptions?.viewMode) {
      // ViewMode를 setViewMode에서 허용하는 타입으로 변환
      const mode = renderOptions.viewMode === 'horizontal' ? 'horizontal' : 'vertical';
      setViewMode(mode);
    }

    logger.info(`[GalleryRenderer] ${mediaItems.length}개 미디어로 갤러리 렌더링`);
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
