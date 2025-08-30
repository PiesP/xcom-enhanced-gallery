/**
 * @fileoverview Test Helper Utilities
 * @description 공통 테스트 유틸리티 함수들
 */

import { vi } from 'vitest';

export function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * DOM 요소 생성 헬퍼
 */
export function createElement(
  tag: string,
  attributes: Record<string, string> = {},
  textContent?: string
): HTMLElement {
  const element = document.createElement(tag);

  Object.entries(attributes).forEach(([key, value]) => {
    element.setAttribute(key, value);
  });

  if (textContent) {
    element.textContent = textContent;
  }

  return element;
}

/**
 * Mock 함수 생성 및 설정 헬퍼
 */
export function createMockFn<T extends (...args: any[]) => any>(
  implementation?: T
): T & { mockClear: () => void } {
  const mockFn = vi.fn(implementation) as unknown as T & { mockClear: () => void };
  // ensure mockClear exists with correct signature
  (mockFn as any).mockClear = (mockFn as any).mockClear || (() => {});
  return mockFn;
}

/**
 * 테스트용 갤러리 DOM 구조 생성
 */
export function createGalleryDOM(): HTMLElement {
  const container = createElement('div', {
    class: 'xeg-gallery-container',
    'data-xeg-gallery': 'true',
  });

  const content = createElement('div', { class: 'gallery-content' });
  const toolbar = createElement('div', { class: 'xeg-toolbar' });

  container.appendChild(content);
  container.appendChild(toolbar);

  return container;
}

/**
 * 테스트용 미디어 요소 생성
 */
export function createMediaElement(
  type: 'image' | 'video' = 'image',
  src = 'https://example.com/media.jpg'
): HTMLElement {
  const element =
    type === 'image'
      ? createElement('img', { src, alt: 'Test media' })
      : createElement('video', { src });

  return element;
}

/**
 * 클린업 함수들을 관리하는 헬퍼
 */
export class TestCleanupManager {
  private cleanupFunctions: (() => void)[] = [];

  add(cleanup: () => void): void {
    this.cleanupFunctions.push(cleanup);
  }

  cleanup(): void {
    this.cleanupFunctions.forEach(fn => {
      try {
        fn();
      } catch (error) {
        console.warn('Cleanup function failed:', error);
      }
    });
    this.cleanupFunctions = [];
  }
}

/**
 * 전역 클린업 매니저 인스턴스
 */
export const globalCleanup = new TestCleanupManager();
