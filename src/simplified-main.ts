/**
 * @fileoverview 단순화된 메인 애플리케이션
 * @description 유저스크립트에 적합한 간단한 진입점
 *
 * 변경사항:
 * - 복잡한 서비스 매니저 제거
 * - 단순한 초기화 로직
 * - 불필요한 추상화 제거
 * - 핵심 기능만 유지
 */

import { logger } from '@core/logging/logger';
import { CONFIG, createRuntimeConfig } from './simple-config';
import { initializeCoreServices } from './simple-services';
import { measurePerformance } from './unified-utils';

// 전역 스타일
import '../styles/globals';

/**
 * 애플리케이션 상태
 */
interface AppState {
  isInitialized: boolean;
  isStarted: boolean;
  config: typeof CONFIG;
  services: ReturnType<typeof initializeCoreServices> | null;
}

/**
 * 애플리케이션 인스턴스
 */
class SimplifiedApp {
  private readonly state: AppState = {
    isInitialized: false,
    isStarted: false,
    config: CONFIG,
    services: null,
  };

  private cleanupHandlers: (() => void | Promise<void>)[] = [];

  /**
   * 애플리케이션 초기화
   */
  async initialize(): Promise<void> {
    if (this.state.isInitialized) {
      logger.debug('[App] Already initialized');
      return;
    }

    try {
      logger.info('🚀 X.com Enhanced Gallery 초기화 시작...');

      await measurePerformance('app-initialization', async () => {
        // 1. 설정 초기화
        this.state.config = createRuntimeConfig();
        logger.debug('[App] 설정 초기화 완료');

        // 2. 외부 라이브러리 초기화
        await this.initializeVendors();

        // 3. 핵심 서비스 초기화
        this.state.services = initializeCoreServices();
        logger.debug('[App] 서비스 초기화 완료');

        // 4. 갤러리 시스템 초기화
        await this.initializeGallery();

        // 5. 이벤트 핸들러 등록
        this.setupEventHandlers();

        this.state.isInitialized = true;
      });

      logger.info('✅ 애플리케이션 초기화 완료');
    } catch (error) {
      logger.error('❌ 애플리케이션 초기화 실패:', error);
      throw error;
    }
  }

  /**
   * 애플리케이션 시작
   */
  async start(): Promise<void> {
    if (!this.state.isInitialized) {
      await this.initialize();
    }

    if (this.state.isStarted) {
      logger.debug('[App] Already started');
      return;
    }

    try {
      logger.info('[App] 애플리케이션 시작...');

      // 갤러리 감지 및 활성화
      this.startGalleryDetection();

      this.state.isStarted = true;
      logger.info('✅ 애플리케이션 시작 완료');
    } catch (error) {
      logger.error('❌ 애플리케이션 시작 실패:', error);
      throw error;
    }
  }

  /**
   * 애플리케이션 정리
   */
  async cleanup(): Promise<void> {
    try {
      logger.info('🧹 애플리케이션 정리 시작...');

      // 정리 핸들러들 실행
      await Promise.all(
        this.cleanupHandlers.map(async handler => {
          try {
            await handler();
          } catch (error) {
            logger.warn('[App] 정리 핸들러 실행 중 오류:', error);
          }
        })
      );

      // 서비스 정리
      if (this.state.services) {
        await this.state.services.cleanup();
        this.state.services = null;
      }

      // 상태 초기화
      this.state.isInitialized = false;
      this.state.isStarted = false;
      this.cleanupHandlers = [];

      logger.info('✅ 애플리케이션 정리 완료');
    } catch (error) {
      logger.error('❌ 애플리케이션 정리 중 오류:', error);
    }
  }

  /**
   * 외부 라이브러리 초기화
   */
  private async initializeVendors(): Promise<void> {
    try {
      const { initializeVendors } = await import('@core/external/vendors');
      await initializeVendors();
      logger.debug('[App] 외부 라이브러리 초기화 완료');
    } catch (error) {
      logger.error('[App] 외부 라이브러리 초기화 실패:', error);
      throw error;
    }
  }

  /**
   * 갤러리 시스템 초기화
   */
  private async initializeGallery(): Promise<void> {
    try {
      // 토스트 컨테이너 생성
      await this.createToastContainer();

      // 갤러리 스타일 주입
      this.injectGalleryStyles();

      logger.debug('[App] 갤러리 시스템 초기화 완료');
    } catch (error) {
      logger.error('[App] 갤러리 시스템 초기화 실패:', error);
      throw error;
    }
  }

  /**
   * 토스트 컨테이너 생성
   */
  private async createToastContainer(): Promise<void> {
    try {
      const { ToastContainer } = await import('@shared/components/ui');
      const { getPreact } = await import('@core/external/vendors');
      const { h, render } = getPreact();

      let container = document.getElementById('xeg-toast-container');
      if (!container) {
        container = document.createElement('div');
        container.id = 'xeg-toast-container';
        container.style.cssText = `
          position: fixed;
          top: 20px;
          right: 20px;
          z-index: ${this.state.config.UI.Z_INDEX.TOAST};
          pointer-events: none;
        `;
        document.body.appendChild(container);
      }

      render(h(ToastContainer, {}), container);

      // 정리 핸들러 등록
      this.cleanupHandlers.push(() => {
        container?.remove();
      });

      logger.debug('[App] 토스트 컨테이너 생성 완료');
    } catch (error) {
      logger.warn('[App] 토스트 컨테이너 생성 실패:', error);
    }
  }

  /**
   * 갤러리 스타일 주입
   */
  private injectGalleryStyles(): void {
    const styleId = 'xeg-gallery-styles';
    if (document.getElementById(styleId)) {
      return;
    }

    const style = document.createElement('style');
    style.id = styleId;
    style.textContent = `
      /* 갤러리 기본 스타일 */
      [data-xeg-gallery] {
        position: fixed;
        top: 0;
        left: 0;
        width: 100vw;
        height: 100vh;
        background: rgba(0, 0, 0, 0.9);
        z-index: ${this.state.config.UI.Z_INDEX.GALLERY_CONTAINER};
        display: flex;
        align-items: center;
        justify-content: center;
      }

      [data-xeg-gallery] img,
      [data-xeg-gallery] video {
        max-width: 90vw;
        max-height: 90vh;
        object-fit: contain;
        transition: transform ${this.state.config.GALLERY.ANIMATION_DURATION}ms ${this.state.config.GALLERY.TRANSITION_EASING};
      }

      [data-xeg-gallery] .xeg-toolbar {
        position: absolute;
        top: 20px;
        right: 20px;
        display: flex;
        gap: 10px;
        z-index: ${this.state.config.UI.Z_INDEX.TOOLBAR};
      }

      [data-xeg-gallery] .xeg-button {
        padding: 8px 16px;
        background: rgba(255, 255, 255, 0.1);
        border: 1px solid rgba(255, 255, 255, 0.2);
        border-radius: 4px;
        color: white;
        cursor: pointer;
        transition: background-color 0.2s ease;
      }

      [data-xeg-gallery] .xeg-button:hover {
        background: rgba(255, 255, 255, 0.2);
      }
    `;

    document.head.appendChild(style);

    // 정리 핸들러 등록
    this.cleanupHandlers.push(() => {
      style.remove();
    });

    logger.debug('[App] 갤러리 스타일 주입 완료');
  }

  /**
   * 이벤트 핸들러 설정
   */
  private setupEventHandlers(): void {
    // 페이지 언로드 시 정리
    const beforeUnloadHandler = () => {
      this.cleanup().catch(error => logger.error('[App] 페이지 언로드 정리 중 오류:', error));
    };

    window.addEventListener('beforeunload', beforeUnloadHandler);
    window.addEventListener('pagehide', beforeUnloadHandler);

    // 정리 핸들러 등록
    this.cleanupHandlers.push(() => {
      window.removeEventListener('beforeunload', beforeUnloadHandler);
      window.removeEventListener('pagehide', beforeUnloadHandler);
    });

    logger.debug('[App] 이벤트 핸들러 설정 완료');
  }

  /**
   * 갤러리 감지 시작
   */
  private startGalleryDetection(): void {
    // 간단한 미디어 클릭 감지
    const handleClick = async (event: MouseEvent) => {
      const target = event.target as Element;

      // 이미지나 비디오 클릭 감지
      if (target.tagName === 'IMG' || target.tagName === 'VIDEO') {
        const mediaUrl = target.getAttribute('src');
        if (mediaUrl && this.isTwitterMedia(mediaUrl)) {
          event.preventDefault();
          await this.openGallery(mediaUrl);
        }
      }
    };

    document.addEventListener('click', handleClick, true);

    // 정리 핸들러 등록
    this.cleanupHandlers.push(() => {
      document.removeEventListener('click', handleClick, true);
    });

    logger.debug('[App] 갤러리 감지 시작');
  }

  /**
   * 트위터 미디어 URL인지 확인
   */
  private isTwitterMedia(url: string): boolean {
    return (
      this.state.config.MEDIA.TWITTER_IMAGE_URL_PATTERN.test(url) ||
      this.state.config.MEDIA.TWITTER_VIDEO_URL_PATTERN.test(url)
    );
  }

  /**
   * 갤러리 열기
   */
  private async openGallery(mediaUrl: string): Promise<void> {
    try {
      logger.info('[App] 갤러리 열기:', mediaUrl);

      // 간단한 갤러리 구현
      const galleryElement = document.createElement('div');
      galleryElement.setAttribute('data-xeg-gallery', '');

      const mediaElement = document.createElement('img');
      mediaElement.src = mediaUrl;
      mediaElement.alt = 'Gallery Image';

      const toolbar = document.createElement('div');
      toolbar.className = 'xeg-toolbar';

      const closeButton = document.createElement('button');
      closeButton.className = 'xeg-button';
      closeButton.textContent = '✕';
      closeButton.onclick = () => galleryElement.remove();

      const downloadButton = document.createElement('button');
      downloadButton.className = 'xeg-button';
      downloadButton.textContent = '⬇';
      downloadButton.onclick = () => this.downloadMedia(mediaUrl);

      toolbar.appendChild(downloadButton);
      toolbar.appendChild(closeButton);
      galleryElement.appendChild(mediaElement);
      galleryElement.appendChild(toolbar);

      // ESC 키로 닫기
      const handleKeydown = (event: KeyboardEvent) => {
        if (event.key === 'Escape') {
          galleryElement.remove();
          document.removeEventListener('keydown', handleKeydown);
        }
      };
      document.addEventListener('keydown', handleKeydown);

      document.body.appendChild(galleryElement);

      logger.debug('[App] 갤러리 열기 완료');
    } catch (error) {
      logger.error('[App] 갤러리 열기 실패:', error);
    }
  }

  /**
   * 미디어 다운로드
   */
  private async downloadMedia(url: string): Promise<void> {
    try {
      logger.info('[App] 미디어 다운로드 시작:', url);

      const response = await fetch(url);
      const blob = await response.blob();

      const downloadUrl = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = `twitter-media-${Date.now()}.jpg`;

      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      URL.revokeObjectURL(downloadUrl);

      logger.debug('[App] 미디어 다운로드 완료');
    } catch (error) {
      logger.error('[App] 미디어 다운로드 실패:', error);
    }
  }

  /**
   * 현재 상태 조회
   */
  getState(): Readonly<AppState> {
    return { ...this.state };
  }
}

// 전역 앱 인스턴스
let appInstance: SimplifiedApp | null = null;

/**
 * 애플리케이션 시작 함수
 */
export async function startApplication(): Promise<void> {
  if (appInstance) {
    logger.debug('[Main] Application already exists');
    return;
  }

  try {
    appInstance = new SimplifiedApp();
    await appInstance.start();

    // 개발 환경에서 전역 접근 제공
    if (typeof window !== 'undefined' && CONFIG.DEBUG.ENABLED) {
      (window as Record<string, unknown>).__XEG_APP__ = appInstance;
    }
  } catch (error) {
    logger.error('[Main] Failed to start application:', error);
    throw error;
  }
}

/**
 * 애플리케이션 정리 함수
 */
export async function cleanupApplication(): Promise<void> {
  if (appInstance) {
    await appInstance.cleanup();
    appInstance = null;

    if (typeof window !== 'undefined') {
      delete (window as Record<string, unknown>).__XEG_APP__;
    }
  }
}

/**
 * 현재 앱 인스턴스 조회
 */
export function getAppInstance(): SimplifiedApp | null {
  return appInstance;
}

// DOM 준비 시 자동 시작
if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      startApplication().catch(error => {
        logger.error('[Main] Auto-start failed:', error);
      });
    });
  } else {
    startApplication().catch(error => {
      logger.error('[Main] Auto-start failed:', error);
    });
  }
}

// 기본 export
export default {
  start: startApplication,
  cleanup: cleanupApplication,
  getInstance: getAppInstance,
};
