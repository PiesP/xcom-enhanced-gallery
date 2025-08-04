/**
 * @fileoverview InteractionManager - 사용자 상호작용 관리
 * @description 터치, 키보드, 마우스 등 다양한 입력 방식의 사용자 경험 최적화
 */

/**
 * 터치 제스처 타입
 */
export type GestureType = 'tap' | 'doubleTap' | 'longPress' | 'swipe' | 'pinch' | 'pan';

/**
 * 스와이프 방향
 */
export type SwipeDirection = 'left' | 'right' | 'up' | 'down';

/**
 * 터치 이벤트 정보
 */
export interface TouchEventInfo {
  type: GestureType;
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  deltaX: number;
  deltaY: number;
  distance: number;
  duration: number;
  direction?: SwipeDirection;
  scale?: number;
}

/**
 * 제스처 옵션
 */
export interface GestureOptions {
  tapThreshold: number;
  doubleTapDelay: number;
  longPressDelay: number;
  swipeThreshold: number;
  pinchThreshold: number;
  panThreshold: number;
}

/**
 * 키보드 단축키 정보
 */
export interface KeyboardShortcut {
  key: string;
  ctrl?: boolean;
  alt?: boolean;
  shift?: boolean;
  meta?: boolean;
  preventDefault?: boolean;
  callback: (event: KeyboardEvent) => void;
}

/**
 * 상호작용 관리자
 */
export class InteractionManager {
  private readonly element: HTMLElement;
  private options: GestureOptions;
  private readonly isTouch: boolean;
  private touchStartTime: number = 0;
  private touchStartPos: { x: number; y: number } = { x: 0, y: 0 };
  private touchEndPos: { x: number; y: number } = { x: 0, y: 0 };
  private lastTapTime: number = 0;
  private longPressTimer: number | null = null;
  private readonly keyboardShortcuts: Map<string, KeyboardShortcut> = new Map();
  private readonly eventListeners: Map<string, EventListener> = new Map();

  /**
   * 제스처 이벤트 핸들러들
   */
  private readonly gestureHandlers: Map<GestureType, (info: TouchEventInfo) => void> = new Map();

  constructor(element: HTMLElement, options: Partial<GestureOptions> = {}) {
    this.element = element;
    this.options = {
      tapThreshold: 10,
      doubleTapDelay: 300,
      longPressDelay: 500,
      swipeThreshold: 50,
      pinchThreshold: 0.1,
      panThreshold: 10,
      ...options,
    };

    this.isTouch = 'ontouchstart' in window;
    this.initializeEventListeners();
  }

  /**
   * 이벤트 리스너 초기화
   */
  private initializeEventListeners(): void {
    if (this.isTouch) {
      this.addTouchListeners();
    } else {
      this.addMouseListeners();
    }

    this.addKeyboardListeners();
  }

  /**
   * 터치 이벤트 리스너 추가
   */
  private addTouchListeners(): void {
    const touchStart = (event: Event) => this.handleTouchStart(event as TouchEvent);
    const touchEnd = (event: Event) => this.handleTouchEnd(event as TouchEvent);
    const touchMove = (event: Event) => this.handleTouchMove(event as TouchEvent);

    this.element.addEventListener('touchstart', touchStart, { passive: false });
    this.element.addEventListener('touchend', touchEnd, { passive: false });
    this.element.addEventListener('touchmove', touchMove, { passive: false });

    this.eventListeners.set('touchstart', touchStart);
    this.eventListeners.set('touchend', touchEnd);
    this.eventListeners.set('touchmove', touchMove);
  }

  /**
   * 마우스 이벤트 리스너 추가
   */
  private addMouseListeners(): void {
    const mouseDown = (event: Event) => this.handleMouseDown(event as MouseEvent);
    const mouseUp = (event: Event) => this.handleMouseUp(event as MouseEvent);
    const mouseMove = (event: Event) => this.handleMouseMove(event as MouseEvent);

    this.element.addEventListener('mousedown', mouseDown);
    this.element.addEventListener('mouseup', mouseUp);
    this.element.addEventListener('mousemove', mouseMove);

    this.eventListeners.set('mousedown', mouseDown);
    this.eventListeners.set('mouseup', mouseUp);
    this.eventListeners.set('mousemove', mouseMove);
  }

  /**
   * 키보드 이벤트 리스너 추가
   */
  private addKeyboardListeners(): void {
    const keyDown = (event: Event) => this.handleKeyDown(event as KeyboardEvent);
    document.addEventListener('keydown', keyDown);
    this.eventListeners.set('keydown', keyDown);
  }

  /**
   * 터치 시작 처리
   */
  private handleTouchStart(event: TouchEvent): void {
    const touch = event.touches[0];
    if (!touch) return;

    this.touchStartTime = Date.now();
    this.touchStartPos = { x: touch.clientX, y: touch.clientY };

    // 롱프레스 타이머 설정
    this.longPressTimer = window.setTimeout(() => {
      this.triggerGesture('longPress', {
        type: 'longPress',
        startX: this.touchStartPos.x,
        startY: this.touchStartPos.y,
        endX: this.touchStartPos.x,
        endY: this.touchStartPos.y,
        deltaX: 0,
        deltaY: 0,
        distance: 0,
        duration: Date.now() - this.touchStartTime,
      });
    }, this.options.longPressDelay);
  }

  /**
   * 터치 종료 처리
   */
  private handleTouchEnd(event: TouchEvent): void {
    const touch = event.changedTouches[0];
    if (!touch) return;

    const endTime = Date.now();
    this.touchEndPos = { x: touch.clientX, y: touch.clientY };

    // 롱프레스 타이머 취소
    if (this.longPressTimer) {
      clearTimeout(this.longPressTimer);
      this.longPressTimer = null;
    }

    const deltaX = this.touchEndPos.x - this.touchStartPos.x;
    const deltaY = this.touchEndPos.y - this.touchStartPos.y;
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
    const duration = endTime - this.touchStartTime;

    const eventInfo: TouchEventInfo = {
      type: 'tap',
      startX: this.touchStartPos.x,
      startY: this.touchStartPos.y,
      endX: this.touchEndPos.x,
      endY: this.touchEndPos.y,
      deltaX,
      deltaY,
      distance,
      duration,
    };

    // 제스처 타입 결정
    if (distance > this.options.swipeThreshold) {
      // 스와이프
      eventInfo.type = 'swipe';
      eventInfo.direction = this.getSwipeDirection(deltaX, deltaY);
      this.triggerGesture('swipe', eventInfo);
    } else if (distance < this.options.tapThreshold) {
      // 탭 또는 더블탭
      const timeSinceLastTap = endTime - this.lastTapTime;
      if (timeSinceLastTap < this.options.doubleTapDelay) {
        eventInfo.type = 'doubleTap';
        this.triggerGesture('doubleTap', eventInfo);
        this.lastTapTime = 0; // 트리플탭 방지
      } else {
        eventInfo.type = 'tap';
        this.triggerGesture('tap', eventInfo);
        this.lastTapTime = endTime;
      }
    }
  }

  /**
   * 터치 이동 처리
   */
  private handleTouchMove(event: TouchEvent): void {
    // 팬 제스처 처리
    const touch = event.touches[0];
    if (!touch) return;

    const deltaX = touch.clientX - this.touchStartPos.x;
    const deltaY = touch.clientY - this.touchStartPos.y;
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

    if (distance > this.options.panThreshold) {
      // 롱프레스 타이머 취소 (이동 중이므로)
      if (this.longPressTimer) {
        clearTimeout(this.longPressTimer);
        this.longPressTimer = null;
      }

      const eventInfo: TouchEventInfo = {
        type: 'pan',
        startX: this.touchStartPos.x,
        startY: this.touchStartPos.y,
        endX: touch.clientX,
        endY: touch.clientY,
        deltaX,
        deltaY,
        distance,
        duration: Date.now() - this.touchStartTime,
      };

      this.triggerGesture('pan', eventInfo);
    }
  }

  /**
   * 마우스 다운 처리
   */
  private handleMouseDown(event: MouseEvent): void {
    this.touchStartTime = Date.now();
    this.touchStartPos = { x: event.clientX, y: event.clientY };
  }

  /**
   * 마우스 업 처리
   */
  private handleMouseUp(event: MouseEvent): void {
    const endTime = Date.now();
    this.touchEndPos = { x: event.clientX, y: event.clientY };

    const deltaX = this.touchEndPos.x - this.touchStartPos.x;
    const deltaY = this.touchEndPos.y - this.touchStartPos.y;
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
    const duration = endTime - this.touchStartTime;

    if (distance < this.options.tapThreshold) {
      const eventInfo: TouchEventInfo = {
        type: 'tap',
        startX: this.touchStartPos.x,
        startY: this.touchStartPos.y,
        endX: this.touchEndPos.x,
        endY: this.touchEndPos.y,
        deltaX,
        deltaY,
        distance,
        duration,
      };

      this.triggerGesture('tap', eventInfo);
    }
  }

  /**
   * 마우스 이동 처리
   */
  private handleMouseMove(_event: MouseEvent): void {
    // 마우스 이동 처리 (필요시 구현)
  }

  /**
   * 키보드 다운 처리
   */
  private handleKeyDown(event: KeyboardEvent): void {
    const shortcutKey = this.createShortcutKey(event);
    const shortcut = this.keyboardShortcuts.get(shortcutKey);

    if (shortcut) {
      if (shortcut.preventDefault) {
        event.preventDefault();
      }
      shortcut.callback(event);
    }
  }

  /**
   * 스와이프 방향 결정
   */
  private getSwipeDirection(deltaX: number, deltaY: number): SwipeDirection {
    if (Math.abs(deltaX) > Math.abs(deltaY)) {
      return deltaX > 0 ? 'right' : 'left';
    } else {
      return deltaY > 0 ? 'down' : 'up';
    }
  }

  /**
   * 제스처 트리거
   */
  private triggerGesture(type: GestureType, info: TouchEventInfo): void {
    const handler = this.gestureHandlers.get(type);
    if (handler) {
      handler(info);
    }
  }

  /**
   * 단축키 키 생성
   */
  private createShortcutKey(event: KeyboardEvent): string {
    const parts = [];
    if (event.ctrlKey) parts.push('ctrl');
    if (event.altKey) parts.push('alt');
    if (event.shiftKey) parts.push('shift');
    if (event.metaKey) parts.push('meta');
    parts.push(event.key.toLowerCase());
    return parts.join('+');
  }

  /**
   * 제스처 핸들러 등록
   */
  onGesture(type: GestureType, handler: (info: TouchEventInfo) => void): void {
    this.gestureHandlers.set(type, handler);
  }

  /**
   * 키보드 단축키 등록
   */
  addKeyboardShortcut(shortcut: KeyboardShortcut): void {
    const key = this.createShortcutKeyFromConfig(shortcut);
    this.keyboardShortcuts.set(key, shortcut);
  }

  /**
   * 설정에서 단축키 키 생성
   */
  private createShortcutKeyFromConfig(shortcut: KeyboardShortcut): string {
    const parts = [];
    if (shortcut.ctrl) parts.push('ctrl');
    if (shortcut.alt) parts.push('alt');
    if (shortcut.shift) parts.push('shift');
    if (shortcut.meta) parts.push('meta');
    parts.push(shortcut.key.toLowerCase());
    return parts.join('+');
  }

  /**
   * 키보드 단축키 제거
   */
  removeKeyboardShortcut(shortcut: KeyboardShortcut): void {
    const key = this.createShortcutKeyFromConfig(shortcut);
    this.keyboardShortcuts.delete(key);
  }

  /**
   * 제스처 핸들러 제거
   */
  removeGestureHandler(type: GestureType): void {
    this.gestureHandlers.delete(type);
  }

  /**
   * 옵션 업데이트
   */
  updateOptions(newOptions: Partial<GestureOptions>): void {
    this.options = { ...this.options, ...newOptions };
  }

  /**
   * 정리 메서드
   */
  cleanup(): void {
    // 롱프레스 타이머 정리
    if (this.longPressTimer) {
      clearTimeout(this.longPressTimer);
      this.longPressTimer = null;
    }

    // 이벤트 리스너 제거
    this.eventListeners.forEach((listener, event) => {
      if (event === 'keydown') {
        document.removeEventListener(event, listener);
      } else {
        this.element.removeEventListener(event, listener);
      }
    });

    // 맵 정리
    this.eventListeners.clear();
    this.gestureHandlers.clear();
    this.keyboardShortcuts.clear();
  }
}

/**
 * 상호작용 관리자 팩토리
 */
export function createInteractionManager(
  element: HTMLElement,
  options?: Partial<GestureOptions>
): InteractionManager {
  return new InteractionManager(element, options);
}

/**
 * 기본 제스처 설정
 */
export const DEFAULT_GESTURE_OPTIONS: GestureOptions = {
  tapThreshold: 10,
  doubleTapDelay: 300,
  longPressDelay: 500,
  swipeThreshold: 50,
  pinchThreshold: 0.1,
  panThreshold: 10,
};

/**
 * 일반적인 키보드 단축키들
 */
export const COMMON_SHORTCUTS = {
  ESCAPE: { key: 'Escape', preventDefault: true },
  ENTER: { key: 'Enter', preventDefault: false },
  SPACE: { key: ' ', preventDefault: true },
  ARROW_LEFT: { key: 'ArrowLeft', preventDefault: true },
  ARROW_RIGHT: { key: 'ArrowRight', preventDefault: true },
  ARROW_UP: { key: 'ArrowUp', preventDefault: true },
  ARROW_DOWN: { key: 'ArrowDown', preventDefault: true },
  HOME: { key: 'Home', preventDefault: true },
  END: { key: 'End', preventDefault: true },
  PAGE_UP: { key: 'PageUp', preventDefault: true },
  PAGE_DOWN: { key: 'PageDown', preventDefault: true },
} as const;
