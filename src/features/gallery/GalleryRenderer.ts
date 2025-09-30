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
import { getMediaServiceFromContainer } from '@shared/container/service-accessors';
import { logger } from '@shared/logging/logger';
import { FEATURE_FLAGS } from '@/constants';
import { RebindWatcher } from '@shared/utils/lifecycle/rebind-watcher';
import type {
  SolidGalleryShellInstance,
  SolidGalleryShellRenderOptions,
} from './solid/renderSolidGalleryShell';
type SolidGalleryModule = typeof import('./solid/renderSolidGalleryShell');
import type { SolidGalleryShellOverrides } from './solid/SolidGalleryShell.solid';

interface SolidRenderConfig {
  readonly uiOverrides?: SolidGalleryShellOverrides;
}

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
      void this.renderComponent();
 */
export class GalleryRenderer implements GalleryRendererInterface {
  private container: HTMLDivElement | null = null;
  private isRenderingFlag = false;
  private readonly cleanupManager = new GalleryCleanupManager();
  private stateUnsubscribe: (() => void) | null = null;
  private onCloseCallback?: () => void;
  private rebindWatcher: RebindWatcher | null = null;
  private rebindInProgress = false;
  private solidShellInstance: SolidGalleryShellInstance | null = null;
  private solidShellModule: SolidGalleryModule | null = null;
  private solidShellModulePromise: Promise<SolidGalleryModule> | null = null;
  private pendingSolidRenderToken: symbol | null = null;

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
    // 테스트/SSR 환경에서 document가 없을 수 있음
    if (typeof document === 'undefined' || !document.body) {
      logger.debug('[GalleryRenderer] createContainer skipped: no document/body');
      return;
    }
    this.cleanupContainer();

    let container = document.querySelector('#xeg-gallery-root') as HTMLDivElement | null;

    if (!container) {
      container = document.createElement('div');
      container.id = 'xeg-gallery-root';
      container.classList.add('xeg-root', 'xeg-gallery-renderer');
      container.style.position = 'fixed';
      container.style.inset = '0';
      container.style.width = '100%';
      container.style.height = '100%';
      container.style.zIndex = 'var(--xeg-layer-root)';
      container.style.pointerEvents = 'none';
      document.body.appendChild(container);
    } else {
      container.classList.add('xeg-root', 'xeg-gallery-renderer');
      if (!container.parentElement) {
        document.body.appendChild(container);
      }
    }

    container.setAttribute('data-renderer', 'gallery');

    this.container = container;

    // 정리 작업 등록
    this.cleanupManager.addTask(() => {
      // 컨테이너 정리는 cleanupContainer에서 처리
    });

    // SPA DOM 교체 시 재바인드 감시 시작 (feature flag)
    if (FEATURE_FLAGS.vdomRebind) {
      this.startRebindWatcher();
    }
  }

  /**
   * 컴포넌트 렌더링 - 갤러리 컴포넌트 렌더링
   */
  private renderComponent(): void {
    if (!this.container) return;
    if (typeof document === 'undefined') {
      logger.debug('[GalleryRenderer] renderComponent skipped: no document');
      return;
    }

    const renderConfig = this.resolveSolidRenderConfig();
    this.container.setAttribute('data-renderer-impl', 'solid');
    const rendered = this.renderSolidComponent(renderConfig);
    if (!rendered) {
      logger.error('[GalleryRenderer] Solid shell render failed');
    }
  }

  private resolveSolidRenderConfig(): SolidRenderConfig {
    // Stage D: Solid-only rendering, no feature flags needed
    return {};
  }

  private renderSolidComponent(config: SolidRenderConfig): boolean {
    if (!this.container) {
      return false;
    }

    if (this.solidShellModule) {
      return this.renderSolidShellWithModule(this.solidShellModule, config);
    }

    try {
      const modulePromise = this.loadSolidShellModule();
      this.scheduleSolidShellRender(modulePromise, config);
      return true;
    } catch (error) {
      logger.error('[GalleryRenderer] Solid 모듈 로딩 준비 실패:', error);
      return false;
    }
  }

  private loadSolidShellModule(): Promise<SolidGalleryModule> {
    if (this.solidShellModule) {
      return Promise.resolve(this.solidShellModule);
    }

    if (this.solidShellModulePromise) {
      return this.solidShellModulePromise;
    }

    this.solidShellModulePromise = import('./solid/renderSolidGalleryShell')
      .then(module => {
        this.solidShellModule = module;
        return module;
      })
      .catch(error => {
        this.solidShellModulePromise = null;
        throw error;
      });

    return this.solidShellModulePromise;
  }

  private scheduleSolidShellRender(
    modulePromise: Promise<SolidGalleryModule>,
    config: SolidRenderConfig
  ): void {
    if (this.pendingSolidRenderToken) {
      return;
    }

    const renderToken = Symbol('solid-render');
    this.pendingSolidRenderToken = renderToken;

    modulePromise
      .then(module => {
        if (this.pendingSolidRenderToken !== renderToken) {
          return;
        }
        this.pendingSolidRenderToken = null;

        if (!this.container) {
          return;
        }

        const rendered = this.renderSolidShellWithModule(module, config);
        if (!rendered && this.container) {
          logger.warn('[GalleryRenderer] Solid shell render failed after module load');
          setError('갤러리 렌더링에 실패했습니다.');
        }
      })
      .catch(error => {
        if (this.pendingSolidRenderToken === renderToken) {
          this.pendingSolidRenderToken = null;
        }
        logger.error('[GalleryRenderer] Solid 모듈 로딩 실패:', error);
        if (this.container) {
          setError('갤러리 모듈 로딩에 실패했습니다.');
        }
      });
  }

  private renderSolidShellWithModule(
    module: SolidGalleryModule,
    config: SolidRenderConfig
  ): boolean {
    this.pendingSolidRenderToken = null;

    if (!this.container) {
      return false;
    }

    const { uiOverrides } = config;

    try {
      this.disposeSolidShell();
      const renderOptions: SolidGalleryShellRenderOptions = {
        container: this.container,
        onClose: () => {
          closeGallery();
          if (this.onCloseCallback) {
            this.onCloseCallback();
          }
        },
        onPrevious: () => this.handleNavigation('previous'),
        onNext: () => this.handleNavigation('next'),
        onDownloadCurrent: () => {
          void this.handleDownload('current');
        },
        onDownloadAll: () => {
          void this.handleDownload('all');
        },
        ...(uiOverrides ? { uiOverrides } : {}),
      };

      this.solidShellInstance = module.renderSolidGalleryShell(renderOptions);
      logger.info('[GalleryRenderer] Solid 갤러리 쉘 렌더링 완료');
      return true;
    } catch (error) {
      logger.error('[GalleryRenderer] Solid 쉘 렌더링 실패:', error);
      this.disposeSolidShell();
      return false;
    }
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
        // Read user setting safely (default false)
        const { getSetting } = await import('@shared/container/settings-access');
        const showProgressToast = getSetting<boolean>(
          'download.showProgressToast' as unknown as string,
          false
        );
        await downloadService.downloadMultiple(state.mediaItems, { showProgressToast });
      }
    } catch (error) {
      logger.error(`[GalleryRenderer] ${type} download failed:`, error);
      setError('다운로드에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  }

  private disposeSolidShell(): void {
    if (!this.solidShellInstance) {
      return;
    }
    try {
      this.solidShellInstance.dispose();
    } catch (error) {
      logger.warn('[GalleryRenderer] Solid 쉘 정리 중 경고:', error);
    } finally {
      this.solidShellInstance = null;
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
        if (this.solidShellInstance) {
          this.disposeSolidShell();
        }
        if (typeof document !== 'undefined' && document.contains(this.container)) {
          this.container.remove();
        }
      } catch (error) {
        logger.warn('[GalleryRenderer] 컨테이너 정리 실패:', error);
      }
      this.container = null;
      this.pendingSolidRenderToken = null;
    }
    // 리바인드 워처 중지
    if (this.rebindWatcher) {
      this.rebindWatcher.dispose();
      this.rebindWatcher = null;
    }
  }

  /**
   * 컨테이너 분실 시 재바인드 감시 시작
   */
  private startRebindWatcher(): void {
    if (!this.container) return;
    // 기존 워처 정리
    if (this.rebindWatcher) {
      this.rebindWatcher.dispose();
    }
    const target = this.container;
    this.rebindWatcher = new RebindWatcher({
      isTargetNode: node => node === target,
      onContainerLost: async () => {
        if (typeof document === 'undefined') {
          // 환경이 정리된 경우 재바인드 시도 생략
          return;
        }
        // 갤러리가 열려있다면 컨테이너를 재생성하고, 이미 렌더 중이 아니면 컴포넌트 다시 렌더링
        const isOpen = galleryState.value.isOpen;
        if (!isOpen) return;
        if (this.rebindInProgress) return;
        this.rebindInProgress = true;
        logger.info('[GalleryRenderer] 컨테이너 분실 감지 → 재바인드 시도');
        try {
          // 혹시 존재하는 동일 클래스 컨테이너를 모두 제거하여 단일성 보장
          try {
            if (typeof document === 'undefined') {
              return;
            }
            const nodes = document.querySelectorAll('.xeg-gallery-renderer');
            if (nodes.length > 0) {
              nodes.forEach(n => {
                try {
                  if (n.parentNode) n.parentNode.removeChild(n);
                } catch (err) {
                  // DOM 제거 실패도 무시 가능(중복 정리 경합 등)
                  logger.debug('[GalleryRenderer] 컨테이너 DOM 제거 중 오류(무시):', err);
                }
              });
            }
          } catch (err) {
            // 쿼리/정리 루프 전체가 실패해도 재바인드 자체는 진행
            logger.debug('[GalleryRenderer] 기존 컨테이너 정리 스캔 중 오류(무시):', err);
          }
          this.container = null;
          this.createContainer();
          // 이미 신컨테이너가 만들어졌으니 컴포넌트만 다시 렌더
          this.renderComponent();
        } finally {
          this.rebindInProgress = false;
        }
      },
      rebindDelayMs: 150,
    });
    this.rebindWatcher.start();
  }

  // =============================================================================
  // GalleryRendererInterface 구현
  // =============================================================================

  async render(
    mediaItems: readonly MediaInfo[],
    renderOptions?: GalleryRenderOptions
  ): Promise<void> {
    try {
      const mediaService = getMediaServiceFromContainer();
      await mediaService.prepareForGallery();
    } catch (error) {
      logger.error('[GalleryRenderer] prepareForGallery failed:', error);
      throw error;
    }

    try {
      await this.loadSolidShellModule();
    } catch (error) {
      logger.error('[GalleryRenderer] Solid shell module preload failed:', error);
      throw error;
    }

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

// 싱글톤 인스턴스는 사이드이펙트를 유발할 수 있으므로 여기서 생성하지 않습니다.
// 필요한 곳에서 명시적으로 new GalleryRenderer() 하거나 DI를 통해 주입하세요.
