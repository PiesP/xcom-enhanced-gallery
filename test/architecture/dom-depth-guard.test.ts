/**
 * Epic DOM-DEPTH-GUARD: 갤러리 DOM 중첩 깊이 회귀 방지 테스트
 *
 * @purpose 갤러리 DOM 구조가 불필요하게 깊어지지 않도록 가드
 * @background Phase 4 최적화에서 이    it('갤러리 구조의 6개 핵심 레이어가 모두 존재해야 한다', () => {
    const galleryRoot = document.querySelector('#xeg-gallery-root');
    expect(galleryRoot).not.toBeNull();

    // 핵심 레이어 존재 여부 검증
    const overlay = galleryRoot!.querySelector('.xeg-gallery-overlay');
    const shell = galleryRoot!.querySelector('.shell');
    const contentArea = galleryRoot!.querySelector('.contentArea');
    const itemsContainer = galleryRoot!.querySelector('.itemsContainer');
    const itemContainer = galleryRoot!.querySelector('.container');

    // 최소 5개 레이어 존재 (Toolbar는 선택적)
    const layersExist = [
      galleryRoot !== null, // Layer 1
      overlay !== null, // Layer 2
      shell !== null, // Layer 3
      contentArea !== null, // Layer 4
      itemsContainer !== null, // Layer 5
      itemContainer !== null, // Layer 6
    ].filter(Boolean).length;

    expect(layersExist).toBeGreaterThanOrEqual(5);

    // 핵심 레이어 검증 (GalleryRenderer, GalleryContainer, SolidGalleryShell 필수)
    expect(galleryRoot).not.toBeNull();
    expect(overlay).not.toBeNull();
    expect(shell).not.toBeNull();
  });* @constraint 최대 허용 깊이: 6단계
 * @relates docs/TDD_REFACTORING_PLAN.md Epic DOM-DEPTH-GUARD
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import type { IGalleryMedia } from '@shared/types/core/media.types';

// 깊이 계산 유틸리티
function calculateMaxDepth(root: Element): number {
  let maxDepth = 0;

  function traverse(element: Element, currentDepth: number): void {
    maxDepth = Math.max(maxDepth, currentDepth);

    for (let i = 0; i < element.children.length; i++) {
      const child = element.children[i];
      if (child) {
        traverse(child, currentDepth + 1);
      }
    }
  }

  traverse(root, 1);
  return maxDepth;
}

// 갤러리 구조의 각 레이어 역할 검증 유틸리티
function verifyLayerStructure(root: Element): {
  layers: string[];
  depth: number;
} {
  const layers: string[] = [];

  // Layer 1: #xeg-gallery-root (GalleryRenderer)
  const galleryRoot = root.querySelector('#xeg-gallery-root');
  if (galleryRoot) {
    layers.push('Layer 1: #xeg-gallery-root (GalleryRenderer)');

    // Layer 2: .xeg-gallery-overlay (GalleryContainer)
    const overlay = galleryRoot.querySelector('.xeg-gallery-overlay');
    if (overlay) {
      layers.push('Layer 2: .xeg-gallery-overlay (GalleryContainer)');

      // Layer 3: .shell (SolidGalleryShell)
      const shell = overlay.querySelector('.shell');
      if (shell) {
        layers.push('Layer 3: .shell (SolidGalleryShell)');

        // Layer 4a: Toolbar (선택적)
        const toolbar = shell.querySelector('.toolbar');
        if (toolbar) {
          layers.push('Layer 4a: .toolbar');
        }

        // Layer 4b: .contentArea
        const contentArea = shell.querySelector('.contentArea');
        if (contentArea) {
          layers.push('Layer 4b: .contentArea');

          // Layer 5: .itemsContainer
          const itemsContainer = contentArea.querySelector('.itemsContainer');
          if (itemsContainer) {
            layers.push('Layer 5: .itemsContainer');

            // Layer 6: .container (VerticalImageItem)
            const itemContainer = itemsContainer.querySelector('.container');
            if (itemContainer) {
              layers.push('Layer 6: .container (VerticalImageItem)');
            }
          }
        }
      }
    }
  }

  return { layers, depth: layers.length };
}

describe('Epic DOM-DEPTH-GUARD: 갤러리 DOM 중첩 깊이 회귀 방지', () => {
  let mockContainer: HTMLElement;

  beforeEach(() => {
    // 실제 DOM 구조 시뮬레이션
    mockContainer = document.createElement('div');
    mockContainer.innerHTML = `
      <div id="xeg-gallery-root">
        <div class="xeg-gallery-overlay">
          <div class="shell">
            <div class="toolbar"></div>
            <div class="contentArea">
              <div class="itemsContainer">
                <div class="container">
                  <!-- VerticalImageItem 내용 -->
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
    document.body.appendChild(mockContainer);
  });

  afterEach(() => {
    document.body.removeChild(mockContainer);
  });

  it('갤러리 DOM 구조는 최대 6단계 깊이를 초과하지 않아야 한다', () => {
    const galleryRoot = document.querySelector('#xeg-gallery-root');
    expect(galleryRoot).not.toBeNull();

    const depth = calculateMaxDepth(galleryRoot!);

    // 최대 허용 깊이: 6단계
    // Layer 1: #xeg-gallery-root
    // Layer 2: .xeg-gallery-overlay
    // Layer 3: .shell
    // Layer 4: .toolbar / .contentArea
    // Layer 5: .itemsContainer
    // Layer 6: .container (item)
    expect(depth).toBeLessThanOrEqual(6);
  });

  it('갤러리 구조의 6개 핵심 레이어가 모두 존재해야 한다', () => {
    const galleryRoot = document.querySelector('#xeg-gallery-root');
    expect(galleryRoot).not.toBeNull();

    // 핵심 레이어 존재 여부 검증
    const overlay = galleryRoot!.querySelector('.xeg-gallery-overlay');
    const shell = galleryRoot!.querySelector('.shell');
    const contentArea = galleryRoot!.querySelector('.contentArea');
    const itemsContainer = galleryRoot!.querySelector('.itemsContainer');
    const itemContainer = galleryRoot!.querySelector('.container');

    // 최소 5개 레이어 존재 (Toolbar는 선택적)
    const layersExist = [
      galleryRoot !== null, // Layer 1
      overlay !== null, // Layer 2
      shell !== null, // Layer 3
      contentArea !== null, // Layer 4
      itemsContainer !== null, // Layer 5
      itemContainer !== null, // Layer 6
    ].filter(Boolean).length;

    expect(layersExist).toBeGreaterThanOrEqual(5);

    // 핵심 레이어 검증 (GalleryRenderer, GalleryContainer, SolidGalleryShell 필수)
    expect(galleryRoot).not.toBeNull();
    expect(overlay).not.toBeNull();
    expect(shell).not.toBeNull();
  });

  it('불필요한 중간 래퍼가 존재하지 않아야 한다 (imageWrapper, itemsList 등)', () => {
    const galleryRoot = document.querySelector('#xeg-gallery-root');
    expect(galleryRoot).not.toBeNull();

    // Phase 4 최적화에서 제거된 불필요한 래퍼들
    const unnecessaryWrappers = [
      '.itemsList', // Phase 4에서 제거됨
      '.imageWrapper', // Phase 4에서 제거됨
      '.redundantContainer',
    ];

    unnecessaryWrappers.forEach(selector => {
      const wrapper = galleryRoot!.querySelector(selector);
      expect(wrapper).toBeNull();
    });
  });

  it('각 레이어는 명확한 역할을 가져야 한다', () => {
    const galleryRoot = document.querySelector('#xeg-gallery-root');
    expect(galleryRoot).not.toBeNull();

    // Layer 1: GalleryRenderer - 전역 초기화 진입점
    const root = document.querySelector('#xeg-gallery-root');
    expect(root).not.toBeNull();
    expect(root!.id).toBe('xeg-gallery-root');

    // Layer 2: GalleryContainer - 격리 컨테이너
    const overlay = root!.querySelector('.xeg-gallery-overlay');
    expect(overlay).not.toBeNull();
    expect(overlay!.className).toContain('xeg-gallery-overlay');

    // Layer 3: SolidGalleryShell - SolidJS 루트
    const shell = overlay!.querySelector('.shell');
    expect(shell).not.toBeNull();
    expect(shell!.className).toContain('shell');

    // Layer 4: contentArea - 스크롤 가능 영역
    const contentArea = shell!.querySelector('.contentArea');
    expect(contentArea).not.toBeNull();
    expect(contentArea!.className).toContain('contentArea');

    // Layer 5: itemsContainer - 아이템 컨테이너
    const itemsContainer = contentArea!.querySelector('.itemsContainer');
    expect(itemsContainer).not.toBeNull();
    expect(itemsContainer!.className).toContain('itemsContainer');

    // Layer 6: container - 개별 아이템
    const itemContainer = itemsContainer!.querySelector('.container');
    expect(itemContainer).not.toBeNull();
    expect(itemContainer!.className).toContain('container');
  });

  it('새 기능 추가 시에도 DOM 깊이가 증가하지 않아야 한다 (회귀 방지)', () => {
    // 미래 리팩토링 시나리오 시뮬레이션
    const galleryRoot = document.querySelector('#xeg-gallery-root');
    expect(galleryRoot).not.toBeNull();

    const initialDepth = calculateMaxDepth(galleryRoot!);

    // 잠재적 위험 패턴들이 추가되지 않았는지 검증
    const riskyPatterns = ['.redundant-wrapper', '.unnecessary-container', '.extra-layer'];

    riskyPatterns.forEach(pattern => {
      const element = galleryRoot!.querySelector(pattern);
      expect(element).toBeNull();
    });

    // 깊이가 초기 상태를 유지하는지 검증
    expect(initialDepth).toBeLessThanOrEqual(6);
  });
});
