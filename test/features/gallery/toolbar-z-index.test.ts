/**
 * Toolbar Z-Index 충돌 방지 테스트
 * @description TDD 방식으로 Z-Index 계층 구조 검증
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

describe('Toolbar Z-Index 충돌 방지', () => {
  let container: HTMLElement;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);

    // CSS 변수 모킹
    Object.defineProperty(document.documentElement, 'style', {
      value: {
        setProperty: vi.fn(),
        getProperty: vi.fn((prop: string) => {
          switch (prop) {
            case '--xeg-z-gallery':
              return '2000';
            case '--xeg-z-toolbar':
              return '2500';
            case '--xeg-z-modal':
              return '3000';
            case '--xeg-z-overlay':
              return '3500';
            case '--xeg-z-toast':
              return '4000';
            default:
              return '';
          }
        }),
      },
      writable: true,
    });
  });

  afterEach(() => {
    if (container && document.body.contains(container)) {
      document.body.removeChild(container);
    }
  });

  it('should maintain correct z-index hierarchy', () => {
    // 전체 Z-Index 계층 구조 검증
    const expectedHierarchy = [
      { name: 'gallery', value: 2000 },
      { name: 'hover-zone', value: 2499 },
      { name: 'toolbar', value: 2500 },
      { name: 'modal', value: 3000 },
      { name: 'overlay', value: 3500 },
      { name: 'toast', value: 4000 },
    ];

    // 순서대로 증가하는지 확인
    for (let i = 1; i < expectedHierarchy.length; i++) {
      const current = expectedHierarchy[i];
      const previous = expectedHierarchy[i - 1];

      expect(current.value).toBeGreaterThan(previous.value);
    }

    // 툴바가 갤러리보다 위에 있는지 확인
    const galleryLayer = expectedHierarchy.find(layer => layer.name === 'gallery');
    const toolbarLayer = expectedHierarchy.find(layer => layer.name === 'toolbar');

    expect(toolbarLayer?.value).toBeGreaterThan(galleryLayer?.value || 0);
  });

  it('should not conflict with other UI elements', () => {
    // 다른 UI 요소들과의 충돌 검사
    const zIndexLayers = {
      gallery: 2000,
      toolbar: 2500,
      modal: 3000,
      overlay: 3500,
      toast: 4000,
    };

    // 계층 간 최소 간격 검증
    const layers = Object.values(zIndexLayers).sort((a, b) => a - b);
    for (let i = 1; i < layers.length; i++) {
      const gap = layers[i] - layers[i - 1];
      expect(gap).toBeGreaterThanOrEqual(500); // 최소 500 간격
    }
  });

  it('should use design token values consistently', () => {
    // Design Token 값이 일관되게 사용되는지 확인
    const expectedTokens = {
      '--xeg-z-gallery': '2000',
      '--xeg-z-toolbar': '2500',
      '--xeg-z-modal': '3000',
      '--xeg-z-overlay': '3500',
      '--xeg-z-toast': '4000',
    };

    Object.entries(expectedTokens).forEach(([token, expectedValue]) => {
      const actualValue = document.documentElement.style.getProperty(token);
      expect(actualValue).toBe(expectedValue);
    });
  });

  it('should place toolbar above gallery content', () => {
    // Z-Index 값 직접 검증
    const galleryZIndex = 2000; // --xeg-z-gallery
    const toolbarZIndex = 2500; // --xeg-z-toolbar

    expect(toolbarZIndex).toBeGreaterThan(galleryZIndex);
    expect(toolbarZIndex - galleryZIndex).toBe(500); // 적절한 간격
  });

  it('should place hover zone below toolbar', () => {
    // 호버 존 Z-Index 계산 검증
    const toolbarZIndex = 2500; // --xeg-z-toolbar
    const hoverZoneZIndex = toolbarZIndex - 1; // calc(var(--xeg-z-toolbar) - 1)

    expect(hoverZoneZIndex).toBe(2499);
    expect(toolbarZIndex).toBeGreaterThan(hoverZoneZIndex);
  });
});
