/**
 * @fileoverview 원자적 갤러리 초기화 서비스
 * 갤러리 기동 시 배경 페이지 스크롤 문제를 근본적으로 해결하는 서비스입니다.
 *
 * 문제 해결 전략:
 * 1. 사전 스크롤 잠금(Pre-emptive Lock) - DOM 변경 전 스크롤 보호
 * 2. 원자적 초기화 - 모든 DOM 조작을 하나의 트랜잭션으로 처리
 * 3. 스크롤 좌표 정확한 복원 - 기존 스크롤 위치 보존
 * 4. CSS 기반 강력한 스크롤 차단 - 브라우저 레벨 보호
 */

import type { EnhancedPageScrollLockService } from '../scroll/EnhancedPageScrollLockService';
import type { ScrollCoordinateManager } from '../scroll/ScrollCoordinateManager';
import type { MediaInfo } from '../../types/media.types';
import { GalleryEarlyInitializer } from './GalleryEarlyInitializer';
import { logger } from '../../../infrastructure/logging/logger';

export interface MediaItem {
  id: string;
  url: string;
  type: 'image' | 'video';
  thumbnail?: string | undefined;
}

export interface AtomicInitializationOptions {
  /** 갤러리 컨테이너 요소 */
  container?: HTMLElement;
  /** 미디어 아이템 배열 */
  mediaItems: MediaInfo[];
  /** 초기 인덱스 */
  initialIndex?: number;
  /** 초기화 타임아웃 (ms) */
  timeout?: number;
  /** 디버그 모드 */
  debug?: boolean;
  /** UI 생성 건너뛰기 (warmup용) */
  skipUI?: boolean;
  /** 스크롤 잠금 건너뛰기 (warmup용) */
  skipScrollLock?: boolean;
  /** 초기화 소스 */
  source?: string;
}

export interface AtomicInitializationResult {
  /** 초기화 성공 여부 */
  success: boolean;
  /** 처리 시간 (ms) */
  duration: number;
  /** 스크롤 위치 변경 여부 */
  scrollChanged: boolean;
  /** 에러 정보 */
  error?: Error;
}

/**
 * 원자적 갤러리 초기화 서비스
 *
 * 갤러리 기동 시 발생하는 배경 페이지 스크롤 문제를 해결하기 위해
 * 모든 DOM 조작과 스크롤 보호를 원자적으로 처리합니다.
 */
export class AtomicGalleryInitializer {
  private readonly scrollLockService: EnhancedPageScrollLockService;
  private readonly coordinateManager: ScrollCoordinateManager;
  private isInitializing = false;

  constructor(
    scrollLockService: EnhancedPageScrollLockService,
    coordinateManager: ScrollCoordinateManager
  ) {
    this.scrollLockService = scrollLockService;
    this.coordinateManager = coordinateManager;
  }

  /**
   * 원자적 갤러리 초기화 실행
   *
   * @param options 초기화 옵션
   * @returns 초기화 결과
   */
  async initializeAtomically(
    options: AtomicInitializationOptions
  ): Promise<AtomicInitializationResult> {
    if (this.isInitializing) {
      throw new Error('AtomicGalleryInitializer: 이미 초기화 진행 중입니다');
    }

    const startTime = performance.now();
    let scrollChanged = false;

    try {
      this.isInitializing = true;

      if (options.debug) {
        logger.debug('[AtomicGalleryInitializer] 원자적 초기화 시작');
      }

      // GalleryEarlyInitializer 상태 확인 및 활용
      const earlyInitializer = GalleryEarlyInitializer.getInstance();
      const isPreInitialized = earlyInitializer.isReady();

      if (options.debug) {
        logger.debug('[AtomicGalleryInitializer] 사전 초기화 상태:', {
          isPreInitialized,
          initState: earlyInitializer.getInitializationState(),
        });
      }

      // Phase 1: 스크롤 보호 (사전 초기화된 서비스 활용)
      const initialScrollPosition = await this.captureAndLockScroll(
        options.debug,
        isPreInitialized,
        options.skipScrollLock
      );

      // Phase 2: 원자적 DOM 조작 (skipUI가 true면 건너뛰기)
      if (!options.skipUI) {
        await this.performAtomicDOMOperations(options);
      } else if (options.debug) {
        logger.debug('[AtomicGalleryInitializer] UI 생성 건너뛰기 (warmup 모드)');
      }

      // Phase 3: 스크롤 위치 검증 및 복원
      scrollChanged = await this.verifyAndRestoreScroll(initialScrollPosition, options.debug);

      const duration = performance.now() - startTime;

      if (options.debug) {
        logger.debug('[AtomicGalleryInitializer] 초기화 완료', {
          duration: `${duration.toFixed(2)}ms`,
          scrollChanged,
          preInitialized: isPreInitialized,
        });
      }

      return {
        success: true,
        duration,
        scrollChanged,
      };
    } catch (error) {
      const duration = performance.now() - startTime;

      logger.error('[AtomicGalleryInitializer] 초기화 실패:', error);

      // 실패 시 스크롤 복원 시도
      try {
        await this.emergencyScrollRestore();
      } catch (restoreError) {
        logger.error('[AtomicGalleryInitializer] 응급 스크롤 복원 실패:', restoreError);
      }

      return {
        success: false,
        duration,
        scrollChanged: true, // 실패 시 변경되었다고 가정
        error: error instanceof Error ? error : new Error(String(error)),
      };
    } finally {
      this.isInitializing = false;
    }
  }

  /**
   * Phase 1: 사전 스크롤 잠금 및 좌표 캡처
   */
  private async captureAndLockScroll(
    debug?: boolean,
    isPreInitialized?: boolean,
    skipScrollLock?: boolean
  ): Promise<{ x: number; y: number }> {
    if (debug) {
      logger.debug('[AtomicGalleryInitializer] Phase 1: 스크롤 잠금 및 캡처', {
        isPreInitialized,
        skipScrollLock,
      });
    }

    // skipScrollLock이 true면 현재 스크롤 위치만 반환
    if (skipScrollLock) {
      const currentPosition = {
        x: window.scrollX || window.pageXOffset || 0,
        y: window.scrollY || window.pageYOffset || 0,
      };
      if (debug) {
        logger.debug(
          '[AtomicGalleryInitializer] 스크롤 잠금 건너뛰기, 현재 위치:',
          currentPosition
        );
      }
      return currentPosition;
    }

    // 사전 초기화된 경우 추가 잠금은 건너뛰고 좌표만 확인
    if (isPreInitialized) {
      const position = this.coordinateManager.getSavedPosition();
      if (debug) {
        logger.debug('[AtomicGalleryInitializer] 사전 초기화된 스크롤 위치 사용:', position);
      }
      return position;
    }

    // 일반적인 스크롤 잠금 및 캡처 프로세스
    this.coordinateManager.captureCurrentPosition();
    const position = this.coordinateManager.getSavedPosition();

    // 사전 스크롤 잠금 활성화 (promise 대응)
    await this.scrollLockService.preemptiveLock();

    if (debug) {
      logger.debug('[AtomicGalleryInitializer] 새로운 스크롤 위치 캡처됨:', position);
    }

    return position;
  }

  /**
   * Phase 2: 원자적 DOM 조작
   */
  private async performAtomicDOMOperations(options: AtomicInitializationOptions): Promise<void> {
    if (options.debug) {
      logger.debug('[AtomicGalleryInitializer] Phase 2: 원자적 DOM 조작');
    }

    // container가 없으면 기본 컨테이너 생성
    const container = options.container || this.ensureGalleryContainer();

    // requestAnimationFrame을 사용하여 브라우저 렌더링 사이클과 동기화
    await new Promise<void>(resolve => {
      requestAnimationFrame(() => {
        try {
          // 갤러리 컨테이너 초기화
          this.initializeGalleryContainer(container);

          // 미디어 아이템 렌더링
          this.renderMediaItems(container, options.mediaItems, options.initialIndex);

          // CSS 클래스 적용 (스크롤 차단 강화)
          this.applyGalleryStyles();

          resolve();
        } catch (error) {
          logger.error('[AtomicGalleryInitializer] DOM 조작 실패:', error);
          throw error;
        }
      });
    });

    // DOM 변경 사항이 완전히 적용될 때까지 대기
    await this.waitForDOMStabilization();
  }

  /**
   * 기본 갤러리 컨테이너 확보 또는 생성
   */
  private ensureGalleryContainer(): HTMLElement {
    let container = document.getElementById('xeg-gallery-container');

    if (!container) {
      container = document.createElement('div');
      container.id = 'xeg-gallery-container';
      container.setAttribute('data-xeg-gallery-container', 'true');

      // 기본 스타일 설정
      Object.assign(container.style, {
        position: 'fixed',
        top: '0',
        left: '0',
        width: '100vw',
        height: '100vh',
        zIndex: '10000',
        background: 'rgba(0, 0, 0, 0.9)',
        display: 'none', // 기본적으로 숨김
      });

      document.body.appendChild(container);
    }

    return container;
  }

  /**
   * Phase 3: 스크롤 위치 검증 및 복원
   */
  private async verifyAndRestoreScroll(
    originalPosition: { x: number; y: number },
    debug?: boolean
  ): Promise<boolean> {
    if (debug) {
      console.info('[AtomicGalleryInitializer] Phase 3: 스크롤 검증 및 복원');
    }

    // 현재 스크롤 위치 확인 (현재 window 위치 직접 확인)
    const currentPosition = {
      x: window.scrollX,
      y: window.scrollY,
    };

    const scrollChanged =
      Math.abs(currentPosition.x - originalPosition.x) > 1 ||
      Math.abs(currentPosition.y - originalPosition.y) > 1;

    if (scrollChanged) {
      if (debug) {
        console.warn('[AtomicGalleryInitializer] 스크롤 위치 변경 감지:', {
          original: originalPosition,
          current: currentPosition,
        });
      }

      // 원래 위치로 복원 (직접 scrollTo 사용)
      window.scrollTo({
        left: originalPosition.x,
        top: originalPosition.y,
        behavior: 'instant',
      });
    }

    // 사전 잠금 해제
    this.scrollLockService.unlock();

    return scrollChanged;
  }

  /**
   * 갤러리 컨테이너 초기화
   */
  private initializeGalleryContainer(container: HTMLElement): void {
    // 컨테이너 기본 스타일 설정
    container.style.position = 'fixed';
    container.style.top = '0';
    container.style.left = '0';
    container.style.width = '100vw';
    container.style.height = '100vh';
    container.style.zIndex = '10000';
    container.style.backgroundColor = 'rgba(0, 0, 0, 0.9)';

    // 스크롤 차단 추가
    container.style.overflow = 'hidden';
    container.setAttribute('data-xeg-gallery-container', 'true');
  }

  /**
   * 미디어 아이템 렌더링
   */
  private renderMediaItems(
    container: HTMLElement,
    mediaItems: MediaInfo[],
    _initialIndex = 0
  ): void {
    // 기존 내용 제거
    container.innerHTML = '';

    // 미디어 아이템 렌더링 로직
    // (실제 구현은 UnifiedGalleryRenderer와 연동)
    const placeholder = document.createElement('div');
    placeholder.textContent = `갤러리 로딩 중... (${mediaItems.length}개 아이템)`;
    placeholder.style.color = 'white';
    placeholder.style.textAlign = 'center';
    placeholder.style.marginTop = '50vh';
    container.appendChild(placeholder);
  }

  /**
   * 갤러리 CSS 스타일 적용
   */
  private applyGalleryStyles(): void {
    // body에 갤러리 활성화 클래스 추가
    document.body.classList.add('xeg-gallery-active');

    // 추가 스크롤 차단 스타일
    document.documentElement.style.overflow = 'hidden';
    document.body.style.overflow = 'hidden';
  }

  /**
   * DOM 안정화 대기
   */
  private async waitForDOMStabilization(): Promise<void> {
    // 두 번의 애니메이션 프레임을 대기하여 DOM 변경사항이 완전히 적용되도록 함
    return new Promise(resolve => {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          resolve();
        });
      });
    });
  }

  /**
   * 응급 스크롤 복원
   */
  private async emergencyScrollRestore(): Promise<void> {
    try {
      // 강제 스크롤 잠금 해제
      await this.scrollLockService.forceUnlock();

      // CSS 클래스 제거
      document.body.classList.remove('xeg-gallery-active');
      document.documentElement.style.overflow = '';
      document.body.style.overflow = '';

      console.info('[AtomicGalleryInitializer] 응급 복원 완료');
    } catch (error) {
      console.error('[AtomicGalleryInitializer] 응급 복원 실패:', error);
      throw error;
    }
  }

  /**
   * 갤러리 종료 시 정리
   */
  async cleanup(): Promise<void> {
    try {
      // 스크롤 잠금 해제
      await this.scrollLockService.unlock();

      // CSS 클래스 정리
      document.body.classList.remove('xeg-gallery-active');
      document.documentElement.style.overflow = '';
      document.body.style.overflow = '';

      console.info('[AtomicGalleryInitializer] 정리 완료');
    } catch (error) {
      console.error('[AtomicGalleryInitializer] 정리 실패:', error);
      throw error;
    }
  }

  /**
   * 현재 초기화 상태 반환
   */
  get isCurrentlyInitializing(): boolean {
    return this.isInitializing;
  }
}
