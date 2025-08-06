/**
 * @fileoverview DOM 모듈 타입 정의
 */

export interface ElementOptions {
  id?: string;
  className?: string;
  textContent?: string;
  innerHTML?: string;
  style?: Partial<CSSStyleDeclaration>;
  attributes?: Record<string, string>;
  children?: (HTMLElement | string)[];
}

export interface EventOptions {
  once?: boolean;
  passive?: boolean;
  capture?: boolean;
  signal?: AbortSignal;
}
