/**
 * @fileoverview 격리된 갤러리 렌더러
 * @description 트위터 페이지와 격리된 갤러리 렌더러
 * @version 1.0.0
 */

import { getPreact } from '@core/external/vendors';
import { logger } from '@core/logging';
import type { MediaInfo } from '@core/types/media.types';
import type { Cleanupable } from '@core/types/lifecycle.types';
import { namespacedDesignSystem } from '@core/managers/NamespacedDesignSystem';
import { IsolatedGalleryContainer } from '@shared/components/isolation/IsolatedGalleryContainer';
import { VerticalGalleryView } from '../components/vertical-gallery-view/VerticalGalleryView';

/**
 * 격리된 갤러리 렌더러 옵션
 */
export interface IsolatedGalleryRendererOptions {
  /** Shadow DOM 사용 여부 */
  useShadowDOM?: boolean;
  /** 자동 정리 여부 */
  autoCleanup?: boolean;
  /** 갤러리 닫기 콜백 */
  onClose?: () => void;
}

/**
 * 트위터 페이지와 격리된 갤러리 렌더러
 *
 * @description
 * 기존 GalleryRenderer와 달리 다음 사항을 개선:
 * - 완전한 스타일 격리
 * - 최소한의 DOM 수정
 * - 비침습적 이벤트 처리
 * - 자동 정리 기능
 * - Shadow DOM 지원
 */
export class IsolatedGalleryRenderer implements Cleanupable {
  private container: HTMLDivElement | null = null;
  private isRendering = false;
  private isRendered = false;
  private onCloseCallback?: () => void;
  private readonly options: Required<IsolatedGalleryRendererOptions>;

  constructor(options: IsolatedGalleryRendererOptions = {}) {
    this.options = {
      useShadowDOM: false,
      autoCleanup: true,
      onClose: () => {}, // 기본 빈 함수 제공
      ...options,
    };

    this.onCloseCallback = this.options.onClose || (() => {});

    logger.debug('[IsolatedGalleryRenderer] Initialized with options', this.options);
  }

  /**
   * 갤러리 렌더링
   */
  public async render(mediaItems: MediaInfo[]): Promise<void> {
    if (this.isRendering) {
      logger.warn('[IsolatedGalleryRenderer] Already rendering, skipping');
      return;
    }

    if (this.isRendered) {
      logger.warn('[IsolatedGalleryRenderer] Already rendered, cleanup first');
      this.close();
    }

    try {
      this.isRendering = true;
      logger.info('[IsolatedGalleryRenderer] Starting gallery render with isolation');

      // 1. 격리된 컨테이너 생성
      this.createIsolatedContainer();

      // 2. 네임스페이스된 스타일 주입
      namespacedDesignSystem.initialize();

      // 3. 갤러리 컴포넌트 렌더링
      await this.renderGalleryComponent(mediaItems);

      this.isRendered = true;
      logger.info('[IsolatedGalleryRenderer] Gallery rendered successfully with isolation');
    } catch (error) {
      logger.error('[IsolatedGalleryRenderer] Render failed:', error);
      this.cleanup();
      throw error;
    } finally {
      this.isRendering = false;
    }
  }

  /**
   * 격리된 컨테이너 생성
   */
  private createIsolatedContainer(): void {
    this.container = document.createElement('div');
    this.container.className = `${namespacedDesignSystem.getNamespace()} xeg-gallery-isolated`;
    this.container.setAttribute('data-gallery-isolated', 'true');
    this.container.setAttribute('data-renderer', 'isolated');
    this.container.setAttribute('aria-label', 'X.com Enhanced Gallery');
    this.container.setAttribute('aria-modal', 'true');
    this.container.setAttribute('role', 'dialog');
    this.container.tabIndex = -1;

    // 기본 스타일 적용 (CSS 로드 실패 대비)
    Object.assign(this.container.style, {
      position: 'fixed',
      top: '0',
      left: '0',
      width: '100vw',
      height: '100vh',
      zIndex: '2147483647',
      backgroundColor: 'rgba(0, 0, 0, 0.95)',
      display: 'flex',
      flexDirection: 'column',
      isolation: 'isolate',
      contain: 'layout style paint',
    });

    // 트위터 페이지의 가장 마지막에 추가 (다른 요소들과 격리)
    document.body.appendChild(this.container);

    // 포커스 설정
    this.container.focus();

    logger.debug('[IsolatedGalleryRenderer] Isolated container created');
  }

  /**
   * 갤러리 컴포넌트 렌더링
   */
  private async renderGalleryComponent(mediaItems: MediaInfo[]): Promise<void> {
    if (!this.container) {
      throw new Error('Container not created');
    }

    const { h, render } = getPreact();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const galleryElement = h(IsolatedGalleryContainer as any, {
      onClose: () => this.close(),
      useShadowDOM: this.options.useShadowDOM,
      className: 'xeg-isolated-renderer-container',
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      children: h(VerticalGalleryView as any, {
        mediaItems,
        onClose: () => this.close(),
        // 격리 모드에서는 기본 설정 사용
        initialIndex: 0,
        enableKeyboard: true,
        enableMouse: true,
      }),
    });

    // Preact로 렌더링
    render(galleryElement, this.container);

    logger.debug('[IsolatedGalleryRenderer] Gallery component rendered');
  }

  /**
   * 갤러리 닫기
   */
  public close(): void {
    if (!this.isRendered && !this.isRendering) {
      logger.debug('[IsolatedGalleryRenderer] Not rendered, skipping close');
      return;
    }

    logger.info('[IsolatedGalleryRenderer] Closing gallery');

    // 갤러리 닫기 콜백 실행
    if (this.onCloseCallback) {
      try {
        this.onCloseCallback();
      } catch (error) {
        logger.error('[IsolatedGalleryRenderer] Error in close callback:', error);
      }
    }

    // 정리 실행
    this.cleanup();
  }

  /**
   * 렌더링 상태 확인
   */
  public isGalleryRendered(): boolean {
    return this.isRendered;
  }

  /**
   * 컨테이너 요소 반환
   */
  public getContainer(): HTMLDivElement | null {
    return this.container;
  }

  /**
   * 진단 정보 반환
   */
  public getDiagnostics() {
    return {
      isRendering: this.isRendering,
      isRendered: this.isRendered,
      hasContainer: !!this.container,
      containerInDOM: this.container ? document.body.contains(this.container) : false,
      designSystem: namespacedDesignSystem.getDiagnostics(),
      options: { ...this.options },
    };
  }

  /**
   * 정리 (Cleanupable 인터페이스 구현)
   */
  public cleanup(): void {
    logger.debug('[IsolatedGalleryRenderer] Starting cleanup');

    // 컨테이너 제거
    if (this.container) {
      try {
        // Preact 렌더링 정리
        const { render } = getPreact();
        render(null, this.container);

        // DOM에서 제거
        if (this.container.parentNode) {
          this.container.parentNode.removeChild(this.container);
        }

        // 이벤트 정리 (컨테이너에 저장된 정리 함수 실행)
        const containerWithCleanup = this.container as HTMLElement & { _cleanup?: () => void };
        if (containerWithCleanup._cleanup) {
          containerWithCleanup._cleanup();
        }

        this.container = null;
        logger.debug('[IsolatedGalleryRenderer] Container removed');
      } catch (error) {
        logger.error('[IsolatedGalleryRenderer] Error removing container:', error);
      }
    }

    // 상태 초기화
    this.isRendering = false;
    this.isRendered = false;

    logger.info('[IsolatedGalleryRenderer] Cleanup completed');
  }

  /**
   * 소멸자 (자동 정리)
   */
  public destroy(): void {
    this.cleanup();
    this.onCloseCallback = () => {}; // undefined 대신 빈 함수 할당

    logger.debug('[IsolatedGalleryRenderer] Destroyed');
  }
}

/**
 * 편의 함수: 격리된 갤러리 렌더링
 */
export async function renderIsolatedGallery(
  mediaItems: MediaInfo[],
  options?: IsolatedGalleryRendererOptions
): Promise<IsolatedGalleryRenderer> {
  const renderer = new IsolatedGalleryRenderer(options);
  await renderer.render(mediaItems);
  return renderer;
}

/**
 * 편의 함수: 현재 활성화된 격리 갤러리 찾기
 */
export function findActiveIsolatedGallery(): HTMLDivElement | null {
  return document.querySelector(
    '[data-gallery-isolated="true"][data-renderer="isolated"]'
  ) as HTMLDivElement;
}

/**
 * 편의 함수: 모든 격리 갤러리 정리
 */
export function cleanupAllIsolatedGalleries(): void {
  const galleries = document.querySelectorAll(
    '[data-gallery-isolated="true"][data-renderer="isolated"]'
  );

  galleries.forEach(gallery => {
    try {
      if (gallery.parentNode) {
        gallery.parentNode.removeChild(gallery);
      }
    } catch (error) {
      logger.error('[IsolatedGalleryRenderer] Error cleaning up gallery:', error);
    }
  });

  logger.info(`[IsolatedGalleryRenderer] Cleaned up ${galleries.length} isolated galleries`);
}
