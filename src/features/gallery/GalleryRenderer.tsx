import { getSolid, getSolidWeb } from '@shared/external/vendors';

/**
 * @fileoverview Gallery Renderer
 * @version 3.0.0 - Solid.js Integration
 *
 * 단일 책임 원칙에 따른 갤러리 렌더러
 * - Solid.js render 사용
 * - 상태 관리는 signals에 위임
 * - 간결한 생명주기 관리 (dispose 패턴)
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
  isGalleryOpen,
} from '../../shared/state/signals/gallery.signals';
import type { MediaInfo } from '@shared/types/media.types';
import { VerticalGalleryView } from './components/vertical-gallery-view/VerticalGalleryView';
import { GalleryContainer } from '../../shared/components/isolation/GalleryContainer';
import { ErrorBoundary } from '../../shared/components/ui/ErrorBoundary/ErrorBoundary';
import './styles/gallery-global.css';
import { logger } from '../../shared/logging/logger';
import { keyboardNavigator } from '../../shared/services/input/KeyboardNavigator';
import { navigateToItem } from '../../shared/state/signals/gallery.signals';

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
 * 간소화된 갤러리 렌더러 (Solid.js)
 */
export class GalleryRenderer implements GalleryRendererInterface {
  private container: HTMLDivElement | null = null;
  private readonly cleanupManager = new GalleryCleanupManager();
  private stateUnsubscribe: (() => void) | null = null;
  private disposeComponent: (() => void) | null = null; // Solid dispose function
  private keyboardUnsubscribe: (() => void) | null = null; // Keyboard navigator unsubscribe
  private onCloseCallback?: () => void;

  constructor() {
    this.setupStateSubscription();
    this.setupKeyboardNavigation();
  }

  /**
   * 갤러리 닫기 콜백 설정 (인터페이스 구현)
   */
  setOnCloseCallback(onClose: () => void): void {
    this.onCloseCallback = onClose;
  }

  /**
   * 상태 구독 설정
   * Phase 9.23: isInitialized 플래그로 재렌더링 방지
   * - on() helper: isGalleryOpen 신호의 값 변경만 추적
   * - defer: true: 초기 실행 스킵
   * - isInitialized: 최초 1회만 renderGallery() 호출, 네비게이션 시 재렌더링 방지
   */
  private setupStateSubscription(): void {
    const { createEffect, createRoot, on } = getSolid();

    // createRoot로 effect를 감싸서 안전한 cleanup 보장
    this.stateUnsubscribe = createRoot(dispose => {
      // Phase 9.23: 초기화 플래그 추가
      let isInitialized = false;

      // on() helper로 isOpen 값 변경만 추적
      createEffect(
        on(
          isGalleryOpen, // 추적할 signal
          isOpen => {
            // isOpen 값 변경 시에만 실행
            logger.debug('[GalleryRenderer] isOpen 변경 감지', {
              isOpen,
              isInitialized,
              hasContainer: !!this.container,
              timestamp: Date.now(),
            });

            if (isOpen && !isInitialized) {
              // 최초 한 번만 렌더링
              this.renderGallery();
              isInitialized = true;
            } else if (!isOpen && isInitialized) {
              // 갤러리가 닫혔을 때만 정리
              this.cleanupGallery();
              isInitialized = false;
            }
            // isOpen이 true로 유지되는 동안에는 재렌더링하지 않음
          },
          { defer: true } // 초기 실행 스킵
        )
      );

      return dispose;
    });
  }

  /**
   * 키보드 네비게이션 설정
   * Phase 7.1: ArrowLeft/Right, Home/End 지원
   */
  private setupKeyboardNavigation(): void {
    this.keyboardUnsubscribe = keyboardNavigator.subscribe(
      {
        onLeft: () => {
          const state = galleryState.value;
          if (state.isOpen) {
            logger.debug('[GalleryRenderer] ArrowLeft - navigatePrevious');
            navigatePrevious();
          }
        },
        onRight: () => {
          const state = galleryState.value;
          if (state.isOpen) {
            logger.debug('[GalleryRenderer] ArrowRight - navigateNext');
            navigateNext();
          }
        },
        onHome: () => {
          const state = galleryState.value;
          if (state.isOpen) {
            logger.debug('[GalleryRenderer] Home - navigate to first');
            navigateToItem(0);
          }
        },
        onEnd: () => {
          const state = galleryState.value;
          if (state.isOpen && state.mediaItems.length > 0) {
            logger.debug('[GalleryRenderer] End - navigate to last');
            navigateToItem(state.mediaItems.length - 1);
          }
        },
        onEscape: () => {
          const state = galleryState.value;
          if (state.isOpen) {
            logger.debug('[GalleryRenderer] Escape - close gallery');
            closeGallery();
            if (this.onCloseCallback) {
              this.onCloseCallback();
            }
          }
        },
        // Space는 향후 Fit mode 토글 기능 추가 시 구현
      },
      {
        context: 'gallery-renderer',
        capture: true,
        preventDefault: true,
        stopPropagation: true,
      }
    );
  }

  /**
   * 갤러리 렌더링 - 한 번만 실행
   * Phase 9.16: 이중 렌더링 방지 - container 존재 여부로만 판단
   * Phase 9.19: renderComponent 내부의 Solid render가 subscription trigger 의심
   */
  private renderGallery(): void {
    // Phase 9.16: container가 이미 존재하면 중복 렌더링 방지
    // isRenderingFlag는 제거 - container 존재가 더 정확한 가드 조건
    if (this.container) {
      logger.debug('[GalleryRenderer] 이미 렌더링됨, 중복 렌더링 방지');
      return;
    }

    const state = galleryState.value;
    if (!state.isOpen || state.mediaItems.length === 0) return;

    logger.info('[GalleryRenderer] 최초 렌더링 시작 - Signal 기반 반응형 컴포넌트', {
      timestamp: Date.now(),
      hasContainer: !!this.container,
    });

    try {
      this.createContainer();
      this.renderComponent();
      logger.info('[GalleryRenderer] 갤러리 컴포넌트 렌더링 완료 - 이후 Signal로 자동 업데이트');
    } catch (error) {
      logger.error('[GalleryRenderer] 렌더링 실패:', error);
      setError('갤러리 렌더링에 실패했습니다.');
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
   * 컴포넌트 렌더링 - Solid.js로 갤러리 컴포넌트 렌더링
   */
  private renderComponent(): void {
    if (!this.container) return;

    const handleClose = () => {
      closeGallery();
      if (this.onCloseCallback) {
        this.onCloseCallback();
      }
    };

    // Solid.js render with JSX - vendors getter를 함수 내부에서 호출
    const { render } = getSolidWeb();
    this.disposeComponent = render(
      () => (
        <GalleryContainer onClose={handleClose} className='xeg-gallery-renderer xeg-gallery-root'>
          <ErrorBoundary>
            <VerticalGalleryView
              onClose={handleClose}
              onPrevious={() => this.handleNavigation('previous')}
              onNext={() => this.handleNavigation('next')}
              onDownloadCurrent={() => this.handleDownload('current')}
              onDownloadAll={() => this.handleDownload('all')}
              className='xeg-vertical-gallery'
            />
          </ErrorBoundary>
        </GalleryContainer>
      ),
      this.container
    );

    logger.info('[GalleryRenderer] Solid 갤러리 컴포넌트 렌더링 완료');
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
      const { getBulkDownloadService } = await import('../../shared/services/service-factories');
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

    this.cleanupContainer();
    this.cleanupManager.executeAll();

    logger.debug('[GalleryRenderer] 정리 완료');
  }

  /**
   * 컨테이너 정리 - Solid dispose 패턴 사용
   */
  private cleanupContainer(): void {
    if (this.container) {
      try {
        // Solid.js dispose 호출
        this.disposeComponent?.();
        this.disposeComponent = null;

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
    // Phase 9.16: container 존재 여부로 렌더링 상태 판단
    return this.container !== null;
  }

  destroy(): void {
    logger.info('[GalleryRenderer] 완전 정리 시작');

    this.stateUnsubscribe?.();
    this.keyboardUnsubscribe?.();
    this.cleanupGallery();

    logger.info('[GalleryRenderer] 완전 정리 완료');
  }
}

// 싱글톤 인스턴스 export
export const galleryRenderer = new GalleryRenderer();
