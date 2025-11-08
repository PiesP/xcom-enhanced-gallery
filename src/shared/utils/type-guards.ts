/**
 * Phase 135: Improve Type Safety - Type Guard functions
 * @description Replace type assertions with Type Guard functions to strengthen type safety
 * @version 2.0.0 - Phase 138.4: JSDoc standardization
 */

/**
 * Create EventListener wrapper function
 * @template T - Event type (default: Event)
 * @param handler - Typed event handler
 * @returns Function implementing EventListener interface
 * @description Ensure type safety when registering DOM event listeners
 * @example
 * ```typescript
 * const clickListener = createEventListener<MouseEvent>(e => {
 *   console.log(e.clientX, e.clientY); // Type-safe
 * });
 * element.addEventListener('click', clickListener);
 * ```
 */
export function createEventListener<T extends Event = Event>(
  handler: (event: T) => void
): EventListener {
  return (event: Event) => {
    handler(event as T);
  };
}

/**
 * HTML element type guard
 * @param element - Value to check
 * @returns true if element is HTMLElement, false otherwise (type narrowing)
 * @example
 * ```typescript
 * const el = document.getElementById('something');
 * if (isHTMLElement(el)) {
 *   el.textContent = 'text'; // Type-safe
 * }
 * ```
 */
export function isHTMLElement(element: unknown): element is HTMLElement {
  return element instanceof HTMLElement;
}

/**
 * HTML Image Element type guard
 * @param element - Value to check
 * @returns true if element is HTMLImageElement
 */
export function isHTMLImageElement(element: unknown): element is HTMLImageElement {
  return element instanceof HTMLImageElement;
}

/**
 * HTML Video Element 타입 가드
 * @param element - 검사할 값
 * @returns element가 HTMLVideoElement이면 true
 */
export function isHTMLVideoElement(element: unknown): element is HTMLVideoElement {
  return element instanceof HTMLVideoElement;
}

/**
 * HTML Anchor Element 타입 가드
 * @param element - 검사할 값
 * @returns element가 HTMLAnchorElement이면 true
 */
export function isHTMLAnchorElement(element: unknown): element is HTMLAnchorElement {
  return element instanceof HTMLAnchorElement;
}

/**
 * Wheel Event 타입 가드
 * @param event - 검사할 이벤트
 * @returns event가 WheelEvent이면 true (타입 좁히기)
 * @example
 * ```typescript
 * function handleScroll(e: Event) {
 *   if (isWheelEvent(e)) {
 *     console.log(e.deltaY, e.deltaX); // 타입 안전
 *   }
 * }
 * ```
 */
export function isWheelEvent(event: Event): event is WheelEvent {
  return event instanceof WheelEvent;
}

/**
 * Keyboard Event 타입 가드
 * @param event - 검사할 이벤트
 * @returns event가 KeyboardEvent이면 true
 */
export function isKeyboardEvent(event: Event): event is KeyboardEvent {
  return event instanceof KeyboardEvent;
}

/**
 * Mouse Event 타입 가드
 * @param event - 검사할 이벤트
 * @returns event가 MouseEvent이면 true
 */
export function isMouseEvent(event: Event): event is MouseEvent {
  return event instanceof MouseEvent;
}

/**
 * Element 존재 확인 및 타입 가드
 * @template T - 기대하는 Element 타입 (기본값: Element)
 * @param element - 검사할 값
 * @returns element가 Element 인스턴스이면 true
 */
export function hasElement<T extends Element = Element>(element: unknown): element is T {
  return element instanceof Element;
}

/**
 * Array 타입 가드 (엄격한 검사)
 * @template T - 배열 요소 타입
 * @param value - 검사할 값
 * @returns value가 배열이면 true (타입 좁히기)
 * @example
 * ```typescript
 * const value: unknown = JSON.parse(data);
 * if (isArray<MyType>(value)) {
 *   value.map(item => item.id); // 타입 안전
 * }
 * ```
 */
export function isArray<T>(value: unknown): value is T[] {
  return Array.isArray(value);
}

/**
 * Record 객체 타입 가드
 * @param value - 검사할 값
 * @returns value가 일반 객체(Record)이면 true (배열, null 제외)
 * @example
 * ```typescript
 * if (isRecord(value)) {
 *   Object.entries(value).forEach(([key, val]) => { ... });
 * }
 * ```
 */
export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/**
 * AbortSignal 타입 가드
 * @param value - 검사할 값
 * @returns value가 AbortSignal이면 true
 */
export function isAbortSignal(value: unknown): value is AbortSignal {
  return value instanceof AbortSignal;
}

/**
 * AddEventListenerOptions 객체 생성 헬퍼
 */
export function createAddEventListenerOptions(options?: {
  capture?: boolean;
  once?: boolean;
  passive?: boolean;
  signal?: AbortSignal;
}): AddEventListenerOptions {
  return (options || {}) as AddEventListenerOptions;
}

/**
 * Record로 안전하게 변환 (Type Guard와 함께 사용)
 * @description 타입 단언 대신 사용하여 타입 안전성 확보
 * @param value - 변환할 값
 * @returns Record<string, unknown>으로 변환된 값
 * @throws Error if value is not a valid Record
 * @example
 * ```typescript
 * if (isRecord(value)) {
 *   const record = toRecord(value); // 타입 안전
 * }
 * ```
 * @version 1.0.0 - Phase 192: 타입 안전성 강화
 */
export function toRecord(value: unknown): Record<string, unknown> {
  if (!isRecord(value)) {
    throw new Error('Value is not a valid Record<string, unknown>');
  }
  return value;
}
