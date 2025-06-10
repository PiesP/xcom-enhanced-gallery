/**
 * Gallery Internal Scroll Manager
 *
 * @description 갤러리 내부의 스크롤 위치 관리 및 이미지 간 포커스 이동을 담당하는 유틸리티 클래스
 *
 * 이 매니저는 갤러리 내부의 스크롤을 관리합니다.
 * 페이지 전체 스크롤 잠금은 PageScrollLockManager를 사용하세요.
 *
 * @version 1.0.0
 * @author X.com Enhanced Gallery Team
 */

import { logger } from '@infrastructure/logging/logger';

/**
 * 스크롤 위치 정보 인터페이스 (향후 확장용)
 * @internal
 */
interface _ScrollPosition {
  top: number;
  behavior: ScrollBehavior;
}

/**
 * 스크롤 옵션 인터페이스
 */
interface ScrollOptions {
  behavior?: ScrollBehavior;
  block?: ScrollLogicalPosition;
  inline?: ScrollLogicalPosition;
  offset?: number;
}

/**
 * 갤러리 스크롤 관리자 클래스
 *
 * @description 싱글톤 패턴을 사용하여 갤러리의 스크롤 상태를 관리합니다.
 * 이미지 포커스 이동 시 상단 정렬 스크롤을 제공합니다.
 */
export class GalleryScrollManager {
  private static instance: GalleryScrollManager;
  private focusedImageIndex: number = 0;
  private savedScrollPosition: number = 0;
  private visibilityCache = new Map<string, boolean>();

  /**
   * 싱글톤 인스턴스 반환
   */
  public static getInstance(): GalleryScrollManager {
    GalleryScrollManager.instance ??= new GalleryScrollManager();
    return GalleryScrollManager.instance;
  }

  private constructor() {
    logger.debug('GalleryScrollManager: 인스턴스 생성');
  }

  /**
   * 클릭된 이미지 인덱스 저장
   *
   * @param index - 저장할 이미지 인덱스
   */
  public setFocusedImageIndex(index: number): void {
    this.focusedImageIndex = index;
    logger.debug(`GalleryScrollManager: 포커스 이미지 인덱스 저장 - ${index}`);
  }

  /**
   * 저장된 포커스 이미지 인덱스 반환
   *
   * @returns 저장된 이미지 인덱스
   */
  public getFocusedImageIndex(): number {
    return this.focusedImageIndex;
  }

  /**
   * 현재 스크롤 위치 저장
   *
   * @param position - 저장할 스크롤 위치
   */
  public saveScrollPosition(position: number): void {
    this.savedScrollPosition = position;
    logger.debug(`GalleryScrollManager: 스크롤 위치 저장 - ${position}`);
  }

  /**
   * 저장된 스크롤 위치 반환
   *
   * @returns 저장된 스크롤 위치
   */
  public getSavedScrollPosition(): number {
    return this.savedScrollPosition;
  }

  /**
   * 특정 이미지로 상단 정렬 스크롤 이동
   *
   * @param containerElement - 스크롤 컨테이너 요소
   * @param imageIndex - 이동할 이미지 인덱스
   * @param options - 스크롤 옵션
   */
  public scrollToImageTop(
    containerElement: HTMLElement,
    imageIndex: number,
    options: ScrollOptions = {}
  ): void {
    const { behavior = 'smooth', offset = 0 } = options;

    const targetImage = containerElement.children[imageIndex] as HTMLElement;
    if (!targetImage) {
      logger.warn(`GalleryScrollManager: 인덱스 ${imageIndex}에 해당하는 이미지를 찾을 수 없음`);
      return;
    }

    // 이미지의 최상단을 컨테이너 최상단에 정렬
    const scrollTopPosition = targetImage.offsetTop + offset;

    containerElement.scrollTo({
      top: Math.max(0, scrollTopPosition),
      behavior,
    });

    // 추가적으로 브라우저 기본 스크롤도 사용하여 안정성 확보
    targetImage.scrollIntoView({
      behavior,
      block: 'start', // 이미지 상단을 뷰포트 상단에 정렬
      inline: 'nearest',
    });

    logger.debug(
      `GalleryScrollManager: 이미지 ${imageIndex}로 상단 정렬 스크롤 완료 (offset: ${offset})`
    );
  }

  /**
   * 이미지가 화면에 완전히 보이는지 확인 (메모이제이션 적용)
   *
   * @param containerElement - 스크롤 컨테이너 요소
   * @param imageIndex - 확인할 이미지 인덱스
   * @returns 이미지 가시성 여부
   */
  public isImageVisible(containerElement: HTMLElement, imageIndex: number): boolean {
    const targetImage = containerElement.children[imageIndex] as HTMLElement;
    if (!targetImage) {
      return false;
    }

    // 스크롤 위치와 인덱스 기반 캐시 키 생성
    const scrollTop = containerElement.scrollTop;
    const cacheKey = `${scrollTop}-${imageIndex}-${containerElement.clientHeight}`;

    // 캐시된 결과 확인
    if (this.visibilityCache.has(cacheKey)) {
      const cachedResult = this.visibilityCache.get(cacheKey);
      return cachedResult ?? false;
    }

    // 실제 가시성 계산
    const containerRect = containerElement.getBoundingClientRect();
    const imageRect = targetImage.getBoundingClientRect();

    const isVisible =
      imageRect.top >= containerRect.top && imageRect.bottom <= containerRect.bottom;

    // 결과 캐싱 (캐시 크기 제한)
    if (this.visibilityCache.size > 100) {
      // 가장 오래된 항목 제거
      const firstKey = this.visibilityCache.keys().next().value as string;
      if (firstKey) {
        this.visibilityCache.delete(firstKey);
      }
    }
    this.visibilityCache.set(cacheKey, isVisible);

    logger.debug(
      `GalleryScrollManager: 이미지 ${imageIndex} 가시성 확인 - ${isVisible ? '보임' : '안보임'} (cached: ${cacheKey})`
    );

    return isVisible;
  }

  /**
   * 스크롤 위치 복원
   *
   * @param containerElement - 스크롤 컨테이너 요소
   * @param position - 복원할 스크롤 위치 (선택사항, 저장된 위치 사용)
   */
  public restoreScrollPosition(containerElement: HTMLElement, position?: number): void {
    const scrollPosition = position ?? this.savedScrollPosition;

    containerElement.scrollTo({
      top: scrollPosition,
      behavior: 'auto', // 즉시 복원
    });

    logger.debug(`GalleryScrollManager: 스크롤 위치 복원 - ${scrollPosition}`);
  }

  /**
   * 스크롤 관리자 초기화
   */
  public reset(): void {
    this.focusedImageIndex = 0;
    this.savedScrollPosition = 0;
    this.visibilityCache.clear();
    logger.debug('GalleryScrollManager: 상태 초기화 완료 (캐시 포함)');
  }
}

/**
 * 갤러리 스크롤 매니저 인스턴스 (편의용 export)
 */
export const galleryScrollManager = GalleryScrollManager.getInstance();
