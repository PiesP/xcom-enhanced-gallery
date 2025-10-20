/**
 * Phase 135: Type Safety 개선 - Type Guard 함수들
 *
 * 목표: 타입 단언을 Type Guard 함수로 대체하여 타입 안전성 강화
 */

/**
 * EventListener 래퍼 생성 함수
 * DOM 이벤트 리스너 등록 시 타입 안전성 확보
 */
export function createEventListener<T extends Event = Event>(
  handler: (event: T) => void
): EventListener {
  return (event: Event) => {
    handler(event as T);
  };
}

/**
 * HTML 요소 타입 가드
 */
export function isHTMLElement(element: unknown): element is HTMLElement {
  return element instanceof HTMLElement;
}

/**
 * HTML Image Element 타입 가드
 */
export function isHTMLImageElement(element: unknown): element is HTMLImageElement {
  return element instanceof HTMLImageElement;
}

/**
 * HTML Video Element 타입 가드
 */
export function isHTMLVideoElement(element: unknown): element is HTMLVideoElement {
  return element instanceof HTMLVideoElement;
}

/**
 * HTML Anchor Element 타입 가드
 */
export function isHTMLAnchorElement(element: unknown): element is HTMLAnchorElement {
  return element instanceof HTMLAnchorElement;
}

/**
 * Wheel Event 타입 가드
 */
export function isWheelEvent(event: Event): event is WheelEvent {
  return event instanceof WheelEvent;
}

/**
 * Keyboard Event 타입 가드
 */
export function isKeyboardEvent(event: Event): event is KeyboardEvent {
  return event instanceof KeyboardEvent;
}

/**
 * Mouse Event 타입 가드
 */
export function isMouseEvent(event: Event): event is MouseEvent {
  return event instanceof MouseEvent;
}

/**
 * Element 존재 확인 및 타입 가드
 */
export function hasElement<T extends Element = Element>(element: unknown): element is T {
  return element instanceof Element;
}

/**
 * Array 타입 가드 (엄격한 검사)
 */
export function isArray<T>(value: unknown): value is T[] {
  return Array.isArray(value);
}

/**
 * Record 객체 타입 가드
 */
export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
