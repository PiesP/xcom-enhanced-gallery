/**
 * @fileoverview InteractionService - PC 전용 사용자 상호작용 관리
 * @description 키보드와 마우스 입력 방식의 사용자 경험 최적화
 */

/**
 * PC 제스처 타입 (터치 제거됨)
 */
export type GestureType = 'click' | 'doubleClick' | 'rightClick' | 'hover';

/**
 * 마우스 이벤트 정보
 */
export interface MouseEventInfo {
  type: GestureType;
  x: number;
  y: number;
  button: number;
  duration: number;
}

/**
 * PC 제스처 옵션
 */
export interface GestureOptions {
  doubleClickDelay: number;
  hoverDelay: number;
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
 * PC 전용 상호작용 서비스
 */
export class InteractionService {
  private readonly element: HTMLElement;
  private readonly options: GestureOptions;
  private clickStartTime: number = 0;
  private lastClickTime: number = 0;
  private hoverTimer: number | null = null;
  private readonly keyboardShortcuts: Map<string, KeyboardShortcut> = new Map();
  private readonly eventListeners: Map<string, EventListener> = new Map();

  /**
   * 제스처 이벤트 핸들러들
   */
  private readonly gestureHandlers: Map<GestureType, (info: MouseEventInfo) => void> = new Map();

  constructor(element: HTMLElement, options: Partial<GestureOptions> = {}) {
    this.element = element;
    this.options = {
      doubleClickDelay: 300,
      hoverDelay: 500,
      ...options,
    };

    this.initializeEventListeners();
  }

  /**
   * 이벤트 리스너 초기화 (PC 전용)
   */
  private initializeEventListeners(): void {
    this.addMouseListeners();
    this.addKeyboardListeners();
  }

  /**
   * 마우스 이벤트 리스너 추가
   */
  private addMouseListeners(): void {
    const click = (event: Event) => this.handleClick(event as MouseEvent);
    const mouseDown = (event: Event) => this.handleMouseDown(event as MouseEvent);
    const mouseUp = (event: Event) => this.handleMouseUp(event as MouseEvent);
    const mouseMove = (event: Event) => this.handleMouseMove(event as MouseEvent);
    const mouseEnter = (event: Event) => this.handleMouseEnter(event as MouseEvent);
    const mouseLeave = (event: Event) => this.handleMouseLeave(event as MouseEvent);
    const contextMenu = (event: Event) => this.handleContextMenu(event as MouseEvent);

    this.element.addEventListener('click', click);
    this.element.addEventListener('mousedown', mouseDown);
    this.element.addEventListener('mouseup', mouseUp);
    this.element.addEventListener('mousemove', mouseMove);
    this.element.addEventListener('mouseenter', mouseEnter);
    this.element.addEventListener('mouseleave', mouseLeave);
    this.element.addEventListener('contextmenu', contextMenu);

    this.eventListeners.set('click', click);
    this.eventListeners.set('mousedown', mouseDown);
    this.eventListeners.set('mouseup', mouseUp);
    this.eventListeners.set('mousemove', mouseMove);
    this.eventListeners.set('mouseenter', mouseEnter);
    this.eventListeners.set('mouseleave', mouseLeave);
    this.eventListeners.set('contextmenu', contextMenu);
  }

  /**
   * 키보드 이벤트 리스너 추가
   */
  private addKeyboardListeners(): void {
    const keyDown = (event: Event) => this.handleKeyDown(event as KeyboardEvent);

    this.element.addEventListener('keydown', keyDown);
    this.eventListeners.set('keydown', keyDown);
  }

  /**
   * 클릭 처리
   */
  private handleClick(event: MouseEvent): void {
    const eventInfo: MouseEventInfo = {
      type: 'click',
      x: event.clientX,
      y: event.clientY,
      button: event.button,
      duration: 0,
    };
    this.triggerGesture('click', eventInfo);
  }

  /**
   * 마우스 무브 처리
   */
  private handleMouseMove(_event: MouseEvent): void {
    // 마우스 이동 처리 로직 (필요시 구현)
  }

  /**
   * 마우스 다운 처리
   */
  private handleMouseDown(_event: MouseEvent): void {
    this.clickStartTime = Date.now();
  }

  /**
   * 마우스 업 처리
   */
  private handleMouseUp(event: MouseEvent): void {
    const endTime = Date.now();
    const duration = endTime - this.clickStartTime;

    const eventInfo: MouseEventInfo = {
      type: 'click',
      x: event.clientX,
      y: event.clientY,
      button: event.button,
      duration,
    };

    // 더블클릭 확인
    const timeSinceLastClick = endTime - this.lastClickTime;
    if (timeSinceLastClick < this.options.doubleClickDelay && this.lastClickTime > 0) {
      eventInfo.type = 'doubleClick';
      this.triggerGesture('doubleClick', eventInfo);
      this.lastClickTime = 0; // 트리플클릭 방지
    } else {
      // 단일 클릭 즉시 처리
      this.triggerGesture('click', eventInfo);
      this.lastClickTime = endTime;
    }
  }

  /**
   * 마우스 진입 처리
   */
  private handleMouseEnter(event: MouseEvent): void {
    this.hoverTimer = window.setTimeout(() => {
      const eventInfo: MouseEventInfo = {
        type: 'hover',
        x: event.clientX,
        y: event.clientY,
        button: -1,
        duration: this.options.hoverDelay,
      };
      this.triggerGesture('hover', eventInfo);
    }, this.options.hoverDelay);
  }

  /**
   * 마우스 이탈 처리
   */
  private handleMouseLeave(_event: MouseEvent): void {
    if (this.hoverTimer) {
      clearTimeout(this.hoverTimer);
      this.hoverTimer = null;
    }
  }

  /**
   * 우클릭 메뉴 처리
   */
  private handleContextMenu(event: MouseEvent): void {
    const eventInfo: MouseEventInfo = {
      type: 'rightClick',
      x: event.clientX,
      y: event.clientY,
      button: event.button,
      duration: 0,
    };
    this.triggerGesture('rightClick', eventInfo);
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
   * 키보드 단축키 키 생성
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
   * 제스처 트리거
   */
  private triggerGesture(type: GestureType, info: MouseEventInfo): void {
    const handler = this.gestureHandlers.get(type);
    if (handler) {
      handler(info);
    }
  }

  /**
   * 제스처 핸들러 등록
   */
  onGesture(type: GestureType, handler: (info: MouseEventInfo) => void): void {
    this.gestureHandlers.set(type, handler);
  }

  /**
   * 키보드 단축키 등록
   */
  addKeyboardShortcut(shortcut: KeyboardShortcut): void {
    const key = this.createShortcutKeyFromShortcut(shortcut);
    this.keyboardShortcuts.set(key, shortcut);
  }

  /**
   * 단축키 객체에서 키 생성
   */
  private createShortcutKeyFromShortcut(shortcut: KeyboardShortcut): string {
    const parts = [];
    if (shortcut.ctrl) parts.push('ctrl');
    if (shortcut.alt) parts.push('alt');
    if (shortcut.shift) parts.push('shift');
    if (shortcut.meta) parts.push('meta');
    parts.push(shortcut.key.toLowerCase());
    return parts.join('+');
  }

  /**
   * 제스처 핸들러 제거
   */
  removeGesture(type: GestureType): void {
    this.gestureHandlers.delete(type);
  }

  /**
   * 키보드 단축키 제거
   */
  removeKeyboardShortcut(key: string): void {
    this.keyboardShortcuts.delete(key);
  }

  /**
   * 모든 이벤트 리스너 정리
   */
  cleanup(): void {
    // 타이머 정리
    if (this.hoverTimer) {
      clearTimeout(this.hoverTimer);
      this.hoverTimer = null;
    }

    // 이벤트 리스너 제거
    this.eventListeners.forEach((listener, eventType) => {
      this.element.removeEventListener(eventType, listener);
    });

    // 데이터 정리
    this.eventListeners.clear();
    this.gestureHandlers.clear();
    this.keyboardShortcuts.clear();
  }
}

/**
 * PC 전용 상호작용 매니저 생성 함수
 */
export function createInteractionManager(
  element: HTMLElement,
  options?: Partial<GestureOptions>
): InteractionService {
  return new InteractionService(element, options);
}
