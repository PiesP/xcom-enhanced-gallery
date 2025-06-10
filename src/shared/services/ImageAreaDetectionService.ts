/**
 * 이미지 영역 감지 및 갤러리 이벤트 처리 통합 서비스
 *
 * @description 갤러리에서 이미지 영역과 배경 영역을 정확히 구분하고,
 * 갤러리 마킹된 요소들의 이벤트 처리를 통합 관리합니다.
 *
 * @example
 * ```typescript
 * const detector = ImageAreaDetectionService.getInstance();
 * const isImageArea = detector.isClickOnImageArea(event, containerElement);
 * const shouldPrevent = detector.shouldPreventGalleryEvent(event, 'click');
 * ```
 */
export class ImageAreaDetectionService {
  private static instance: ImageAreaDetectionService;

  public static getInstance(): ImageAreaDetectionService {
    if (!ImageAreaDetectionService.instance) {
      ImageAreaDetectionService.instance = new ImageAreaDetectionService();
    }
    return ImageAreaDetectionService.instance;
  }

  private constructor() {}

  /**
   * 클릭 이벤트가 이미지 영역에서 발생했는지 확인
   *
   * @param event - 마우스 클릭 이벤트
   * @param containerElement - 갤러리 컨테이너 요소
   * @returns 이미지 영역 클릭 여부
   */
  public isClickOnImageArea(event: MouseEvent, containerElement: HTMLElement): boolean {
    const target = event.target as HTMLElement;

    // 1. 직접적인 이미지 클릭
    if (target.tagName === 'IMG') {
      return true;
    }

    // 2. 이미지를 포함한 미디어 컨테이너 클릭
    if (this.isMediaContainer(target)) {
      return true;
    }

    // 3. 툴바나 UI 컨트롤 영역 클릭
    if (this.isUIControlArea(target)) {
      return true;
    }

    // 4. 이미지 래퍼나 미디어 관련 요소 클릭
    if (this.isImageRelatedElement(target)) {
      return true;
    }

    // 5. 갤러리 마킹된 요소 클릭 확인
    if (this.isGalleryMarkedElement(target)) {
      return true;
    }

    // 6. 좌표 기반 정확한 이미지 영역 확인
    return this.isPointInImageBounds(event, containerElement);
  }

  /**
   * 요소가 미디어 컨테이너인지 확인
   */
  private isMediaContainer(element: HTMLElement): boolean {
    const mediaSelectors = [
      '.xeg-vertical-image-item',
      '[data-gallery-element="media"]',
      '[data-testid="tweetPhoto"]',
      '.xeg-media-container',
    ];

    return mediaSelectors.some(selector => element.closest(selector));
  }

  /**
   * 요소가 UI 컨트롤 영역인지 확인
   */
  private isUIControlArea(element: HTMLElement): boolean {
    const controlSelectors = [
      'button',
      '.xeg-toolbar',
      '.toolbarWrapper',
      '[role="button"]',
      '.downloadButton',
      '.xeg-button',
      '.xeg-nav-button',
    ];

    return controlSelectors.some(
      selector => element.matches(selector) || element.closest(selector)
    );
  }

  /**
   * 요소가 이미지 관련 요소인지 확인
   */
  private isImageRelatedElement(element: HTMLElement): boolean {
    const imageRelatedClasses = [
      'imageWrapper',
      'mediaContainer',
      'image',
      'video',
      'xeg-image',
      'xeg-video',
    ];

    const hasImageRelatedClass = imageRelatedClasses.some(
      className => element.classList.contains(className) || element.closest(`.${className}`)
    );

    // CSS 배경 이미지나 미디어 관련 속성 확인
    const computedStyle = window.getComputedStyle(element);
    const hasBackgroundImage = computedStyle.backgroundImage !== 'none';

    return hasImageRelatedClass || hasBackgroundImage;
  }

  /**
   * 클릭 좌표가 실제 이미지 영역 내부에 있는지 확인
   */
  private isPointInImageBounds(event: MouseEvent, containerElement: HTMLElement): boolean {
    const images = containerElement.querySelectorAll('img, video');
    const clickX = event.clientX;
    const clickY = event.clientY;

    for (const media of images) {
      const rect = media.getBoundingClientRect();

      if (
        clickX >= rect.left &&
        clickX <= rect.right &&
        clickY >= rect.top &&
        clickY <= rect.bottom
      ) {
        return true;
      }
    }

    return false;
  }

  /**
   * 배경 영역 클릭인지 확인 (이미지 영역의 반대)
   */
  public isBackgroundClick(event: MouseEvent, containerElement: HTMLElement): boolean {
    return !this.isClickOnImageArea(event, containerElement);
  }

  // ===== 갤러리 마킹 통합 기능 =====

  /**
   * DOM 요소가 갤러리 마킹된 요소인지 확인
   */
  public isGalleryMarkedElement(element: Element): boolean {
    return element.closest('[data-xeg-gallery]') !== null;
  }

  /**
   * DOM 요소의 갤러리 타입 반환
   */
  public getGalleryElementType(element: Element): string | null {
    const galleryElement = element.closest('[data-xeg-gallery]');
    return galleryElement?.getAttribute('data-xeg-gallery') ?? null;
  }

  /**
   * DOM 요소가 특정 갤러리 타입인지 확인
   */
  public isGalleryElementType(element: Element, type: string): boolean {
    return this.getGalleryElementType(element) === type;
  }

  /**
   * 클릭 이벤트가 갤러리 마킹된 요소에서 발생했는지 확인
   */
  public isClickOnGalleryElement(event: Event): boolean {
    const target = event.target as Element | null;
    if (!target) {
      return false;
    }

    // 클릭된 요소나 부모 요소 중에 갤러리 마킹이 있는지 확인
    return this.isGalleryMarkedElement(target);
  }

  /**
   * 이벤트가 차단되어야 하는 갤러리 요소에서 발생했는지 확인
   */
  public shouldPreventGalleryEvent(
    event: Event,
    eventType: 'click' | 'keyboard' | 'touch'
  ): boolean {
    const target = event.target as Element | null;
    if (!target) {
      return false;
    }

    const galleryElement = target.closest('[data-xeg-gallery]');
    if (!galleryElement) {
      return false;
    }

    const preventAttribute = `data-xeg-prevent-${eventType}`;
    return galleryElement.getAttribute(preventAttribute) === 'true';
  }

  /**
   * 갤러리 요소에 마킹 속성 추가
   */
  public markElement(
    element: HTMLElement,
    type: string,
    options: {
      preventClick?: boolean;
      preventKeyboard?: boolean;
      preventTouch?: boolean;
      customData?: Record<string, string>;
    } = {}
  ): void {
    // 기본 갤러리 마킹
    element.setAttribute('data-xeg-gallery', type);

    // 이벤트 차단 설정
    if (options.preventClick) {
      element.setAttribute('data-xeg-prevent-click', 'true');
    }
    if (options.preventKeyboard) {
      element.setAttribute('data-xeg-prevent-keyboard', 'true');
    }
    if (options.preventTouch) {
      element.setAttribute('data-xeg-prevent-touch', 'true');
    }

    // 커스텀 데이터 속성 추가
    if (options.customData) {
      Object.entries(options.customData).forEach(([key, value]) => {
        element.setAttribute(`data-xeg-${key}`, value);
      });
    }
  }

  /**
   * 갤러리 요소에서 마킹 속성 제거
   */
  public unmarkElement(element: HTMLElement): void {
    // data-xeg로 시작하는 모든 속성 제거
    Array.from(element.attributes).forEach(attr => {
      if (attr.name.startsWith('data-xeg-')) {
        element.removeAttribute(attr.name);
      }
    });
  }
}
