/**
 * Enhanced Page Scroll Lock Service
 *
 * @description 갤러리 열기 시 배경 페이지 스크롤 차단 문제를 해결하는 개선된 스크롤 보호 서비스
 *
 * 핵심 개선사항:
 * 1. 사전 스크롤 잠금 (Pre-emptive Scroll Lock) - DOM 조작 전 미리 적용
 * 2. 강력한 스크롤 방지 - CSS position: fixed + 이벤트 차단
 * 3. 정확한 위치 복원 - 스크롤 위치 보존 및 복원
 * 4. requestAnimationFrame을 통한 안전한 DOM 조작
 *
 * @version 2.0.0 - Clean Architecture 적용
 * @since 2024-06-21
 */

import { logger } from '../../../infrastructure/logging/logger';

interface ScrollPosition {
  x: number;
  y: number;
}

/**
 * 개선된 페이지 스크롤 잠금 서비스
 */
export class PageScrollLockService {
  private static instance: PageScrollLockService;

  private lockCount = 0;
  private originalScrollPosition: ScrollPosition = { x: 0, y: 0 };
  private readonly originalBodyStyles = new Map<string, string>();
  private isPreemptivelyLocked = false;
  private scrollEventHandlers: Array<() => void> = [];
  private isServiceReady = false;

  private constructor() {
    // 싱글톤 패턴
    this.initializeService();
  }

  /**
   * 서비스 초기화 (즉시 실행)
   */
  private initializeService(): void {
    try {
      // 기본 초기화 작업 수행
      this.isServiceReady = true;
      logger.debug('PageScrollLockService: Service ready');
    } catch (error) {
      logger.error('PageScrollLockService: Initialization failed:', error);
    }
  }

  /**
   * 서비스 준비 상태 확인
   */
  public isReady(): boolean {
    return this.isServiceReady;
  }

  /**
   * 서비스 초기화 상태 확인 (isInitialized 별칭)
   */
  public isInitialized(): boolean {
    return this.isServiceReady;
  }

  public static getInstance(): PageScrollLockService {
    if (!PageScrollLockService.instance) {
      PageScrollLockService.instance = new PageScrollLockService();
    }
    return PageScrollLockService.instance;
  }

  /**
   * 갤러리 기동 전 사전 스크롤 잠금
   * DOM 조작이 시작되기 전에 미리 스크롤을 고정
   */
  public async preemptiveLock(): Promise<void> {
    if (this.isPreemptivelyLocked) {
      logger.debug('Pre-emptive scroll lock already applied');
      return;
    }

    // 서비스 준비 상태 확인
    if (!this.isServiceReady) {
      logger.warn('PageScrollLockService: Service not ready, forcing initialization');
      this.initializeService();
    }

    // 현재 스크롤 위치 즉시 저장 (동기적으로)
    const currentY = window.pageYOffset || document.documentElement.scrollTop || 0;
    const currentX = window.pageXOffset || document.documentElement.scrollLeft || 0;

    this.originalScrollPosition = { x: currentX, y: currentY };

    // 즉시 스크롤 방지 적용 (DOM 조작 전)
    this.applyScrollPrevention();
    this.isPreemptivelyLocked = true;

    logger.debug('Enhanced pre-emptive scroll lock applied', this.originalScrollPosition);
  }

  /**
   * 정식 스크롤 잠금 적용
   */
  public lock(): void {
    if (!this.isPreemptivelyLocked) {
      // 사전 잠금이 없었다면 일반 잠금 적용
      this.originalScrollPosition = {
        x: window.scrollX,
        y: window.scrollY,
      };
    }

    this.lockCount++;

    if (this.lockCount === 1) {
      this.applyScrollPrevention();
    }

    logger.debug('Page scroll locked', {
      lockCount: this.lockCount,
      position: this.originalScrollPosition,
    });
  }

  /**
   * 스크롤 잠금 해제
   */
  public unlock(): void {
    this.lockCount = Math.max(0, this.lockCount - 1);

    if (this.lockCount === 0) {
      this.removeScrollPrevention();
      this.restoreScrollPosition();
      this.isPreemptivelyLocked = false;
    }

    logger.debug('Page scroll unlocked', {
      lockCount: this.lockCount,
      restored: this.lockCount === 0,
    });
  }

  /**
   * 강력한 스크롤 방지 적용
   */
  private applyScrollPrevention(): void {
    const body = document.body;

    // 현재 스타일 백업
    const stylesToBackup = ['overflow', 'position', 'top', 'left', 'width', 'height'];
    stylesToBackup.forEach(prop => {
      this.originalBodyStyles.set(prop, body.style.getPropertyValue(prop));
    });

    // 강력한 스크롤 방지 적용
    Object.assign(body.style, {
      overflow: 'hidden',
      position: 'fixed',
      top: `-${this.originalScrollPosition.y}px`,
      left: `-${this.originalScrollPosition.x}px`,
      width: '100%',
      height: '100%',
    });

    // CSS 클래스 추가
    document.body.classList.add('xeg-gallery-active');

    // 추가 보안: 스크롤 이벤트도 차단
    this.addScrollEventBlockers();

    logger.debug('Scroll prevention applied', {
      scrollY: this.originalScrollPosition.y,
      scrollX: this.originalScrollPosition.x,
    });
  }

  /**
   * 스크롤 이벤트 차단 추가
   */
  private addScrollEventBlockers(): void {
    const preventScroll = this.preventScroll.bind(this);

    document.addEventListener('wheel', preventScroll, { passive: false });
    document.addEventListener('touchmove', preventScroll, { passive: false });
    document.addEventListener('keydown', this.preventKeyboardScroll.bind(this), { passive: false });
    window.addEventListener('scroll', preventScroll, { passive: false });

    // 정리 함수들 저장
    this.scrollEventHandlers = [
      (): void => document.removeEventListener('wheel', preventScroll),
      (): void => document.removeEventListener('touchmove', preventScroll),
      (): void => document.removeEventListener('keydown', this.preventKeyboardScroll.bind(this)),
      (): void => window.removeEventListener('scroll', preventScroll),
    ];
  }

  /**
   * 스크롤 방지 해제
   */
  private removeScrollPrevention(): void {
    const body = document.body;

    // 원본 스타일 복원
    this.originalBodyStyles.forEach((value, prop) => {
      if (value) {
        body.style.setProperty(prop, value);
      } else {
        body.style.removeProperty(prop);
      }
    });

    this.originalBodyStyles.clear();

    // CSS 클래스 제거
    document.body.classList.remove('xeg-gallery-active');

    // 이벤트 리스너 제거
    this.scrollEventHandlers.forEach(cleanup => {
      try {
        cleanup();
      } catch (error) {
        logger.debug('Failed to remove scroll event handler:', error);
      }
    });
    this.scrollEventHandlers = [];

    logger.debug('Scroll prevention removed');
  }

  /**
   * 스크롤 위치 복원
   */
  private restoreScrollPosition(): void {
    // 스크롤 위치 복원 (부드럽게)
    window.scrollTo({
      left: this.originalScrollPosition.x,
      top: this.originalScrollPosition.y,
      behavior: 'instant', // 즉시 복원
    });

    logger.debug('Scroll position restored', this.originalScrollPosition);
  }

  /**
   * 스크롤 이벤트 방지 핸들러
   */
  private readonly preventScroll = (e: Event): void => {
    const target = e.target as HTMLElement;
    const galleryContainer = target?.closest?.('.xeg-gallery-container');

    // 갤러리 컨테이너 내부가 아닌 경우에만 방지
    if (!galleryContainer) {
      e.preventDefault();
      e.stopPropagation();
    }
  };

  /**
   * 키보드 스크롤 방지 핸들러
   */
  private readonly preventKeyboardScroll = (e: KeyboardEvent): void => {
    const scrollKeys = ['ArrowUp', 'ArrowDown', 'PageUp', 'PageDown', 'Home', 'End', 'Space'];
    const target = e.target as HTMLElement;
    const galleryContainer = target?.closest?.('.xeg-gallery-container');

    if (!galleryContainer && scrollKeys.includes(e.key)) {
      e.preventDefault();
      e.stopPropagation();
    }
  };

  /**
   * 현재 잠금 상태 확인
   */
  public isLocked(): boolean {
    return this.lockCount > 0 || this.isPreemptivelyLocked;
  }

  /**
   * 강제 잠금 해제 (비상시)
   */
  public forceUnlock(): void {
    logger.warn('Force unlocking scroll');

    this.lockCount = 0;
    this.isPreemptivelyLocked = false;
    this.removeScrollPrevention();
    this.restoreScrollPosition();
  }
}
