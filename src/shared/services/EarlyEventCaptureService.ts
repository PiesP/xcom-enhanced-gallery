/**
 * Early Event Capture Service
 * @description 갤러리 초기화 지연 없이 즉시 미디어 클릭 이벤트를 캐치하는 서비스
 */

import { logger } from '@shared/logging/logger';

interface PendingClick {
  element: HTMLElement;
  event: MouseEvent;
  timestamp: number;
}

/**
 * 초기화 지연 없이 즉시 미디어 클릭 이벤트를 캐치하는 서비스
 */
export class EarlyEventCaptureService {
  private observer: MutationObserver | null = null;
  private pendingClicks: PendingClick[] = [];
  private isGalleryReady = false;
  private readonly mediaSelectors = [
    '[data-testid="tweetPhoto"]',
    '[data-testid="videoPlayer"]',
    'img[src*="pbs.twimg.com"]',
    'img[src*="video.twimg.com"]',
    'video',
  ];

  constructor() {
    this.setupEarlyCapture();
  }

  private setupEarlyCapture(): void {
    // 즉시 기존 미디어 요소들에 임시 이벤트 핸들러 등록
    this.captureExistingMedia();

    // 새로운 미디어 요소 감지를 위한 MutationObserver
    this.observer = new MutationObserver(mutations => {
      mutations.forEach(mutation => {
        mutation.addedNodes.forEach(node => {
          if (node.nodeType === Node.ELEMENT_NODE) {
            this.captureMediaInElement(node as Element);
          }
        });
      });
    });

    this.observer.observe(document.body, {
      childList: true,
      subtree: true,
    });

    logger.debug('✅ Early event capture initialized');
  }

  private captureExistingMedia(): void {
    this.mediaSelectors.forEach(selector => {
      document.querySelectorAll(selector).forEach(element => {
        this.attachEarlyHandler(element as HTMLElement);
      });
    });
  }

  private captureMediaInElement(element: Element): void {
    const mediaElements = element.querySelectorAll(this.mediaSelectors.join(','));
    mediaElements.forEach(el => {
      this.attachEarlyHandler(el as HTMLElement);
    });

    // 요소 자체가 미디어인지 확인
    if (this.mediaSelectors.some(selector => element.matches(selector))) {
      this.attachEarlyHandler(element as HTMLElement);
    }
  }

  private attachEarlyHandler(element: HTMLElement): void {
    // 이미 핸들러가 있는지 확인
    if (element.dataset.xegEarlyCapture === 'true') {
      return;
    }

    const handler = (event: MouseEvent) => {
      if (!this.isGalleryReady) {
        // 갤러리가 준비되지 않았으면 기본 동작 막고 대기열에 추가
        event.preventDefault();
        event.stopPropagation();

        this.pendingClicks.push({
          element,
          event: this.cloneMouseEvent(event),
          timestamp: Date.now(),
        });

        logger.debug('📸 Media click captured early, waiting for gallery initialization');
        return;
      }
    };

    element.addEventListener('click', handler, { capture: true });
    element.dataset.xegEarlyCapture = 'true';
  }

  private cloneMouseEvent(event: MouseEvent): MouseEvent {
    return new MouseEvent(event.type, {
      bubbles: event.bubbles,
      cancelable: event.cancelable,
      view: event.view,
      detail: event.detail,
      screenX: event.screenX,
      screenY: event.screenY,
      clientX: event.clientX,
      clientY: event.clientY,
      ctrlKey: event.ctrlKey,
      altKey: event.altKey,
      shiftKey: event.shiftKey,
      metaKey: event.metaKey,
      button: event.button,
      buttons: event.buttons,
    });
  }

  public onGalleryReady(galleryHandler: (element: HTMLElement, event: MouseEvent) => void): void {
    this.isGalleryReady = true;

    logger.debug(`🚀 Gallery ready, processing ${this.pendingClicks.length} pending clicks`);

    // 대기 중인 클릭들 처리 (타임아웃된 것들 제외)
    const validClicks = this.pendingClicks.filter(
      click => Date.now() - click.timestamp < 10000 // 10초 이내
    );

    validClicks.forEach(({ element, event }) => {
      try {
        galleryHandler(element, event);
      } catch (error) {
        logger.error('❌ Error processing pending click:', error);
      }
    });

    this.pendingClicks = [];
  }

  public getPendingClicksCount(): number {
    return this.pendingClicks.length;
  }

  public destroy(): void {
    if (this.observer) {
      this.observer.disconnect();
      this.observer = null;
    }
    this.pendingClicks = [];

    // 등록된 핸들러 정리
    document.querySelectorAll('[data-xeg-early-capture="true"]').forEach(element => {
      delete (element as HTMLElement).dataset.xegEarlyCapture;
    });

    logger.debug('🧹 Early event capture destroyed');
  }
}
