import { describe, it, expect } from 'vitest';
declare const document: any;
// minimal timer decl (opaque any to silence unused param warnings)
declare const setTimeout: any;
import { getPreactSafe } from '@shared/external/vendors/vendor-api-safe';
import { useGalleryItemScroll } from '@/features/gallery/hooks/useGalleryItemScroll';

const { h, render } = getPreactSafe();

// 재현 목적: overlay 영역과 scrollArea(children) 분리 시 index 매핑 일관성

describe('FocusSync index mapping: overlay/scrollArea mismatch 재현 방지', () => {
  it('itemsRootRef 제공 시 container 자식 구조 상이해도 올바른 인덱스 스크롤', async () => {
    const container = document.createElement('div');
    Object.assign(container.style, { height: '240px', overflow: 'auto', position: 'relative' });
    container.getBoundingClientRect = () => ({
      top: 0,
      left: 0,
      width: 300,
      height: 240,
      bottom: 240,
      right: 300,
      x: 0,
      y: 0,
      toJSON() {},
    });

    // overlay (인덱스에 포함되면 안 됨)
    const overlay = document.createElement('div');
    overlay.textContent = 'overlay';
    Object.assign(overlay.style, { position: 'absolute', top: '0', left: '0' });
    container.appendChild(overlay);

    // 실제 items root wrapper
    const itemsRoot = document.createElement('div');
    Object.assign(itemsRoot.style, { position: 'relative' });
    container.appendChild(itemsRoot);

    for (let i = 0; i < 5; i++) {
      const item = document.createElement('div');
      item.setAttribute('data-xeg-role', 'gallery-item');
      Object.assign(item.style, { height: '160px' });
      item.getBoundingClientRect = () => ({
        top: i * 160 - container.scrollTop,
        left: 0,
        width: 300,
        height: 160,
        bottom: i * 160 - container.scrollTop + 160,
        right: 300,
        x: 0,
        y: i * 160 - container.scrollTop,
        toJSON() {},
      });
      itemsRoot.appendChild(item);
    }

    document.body.appendChild(container);
    const containerRef = { current: container };
    const itemsRootRef = { current: itemsRoot };

    let scrolled: number[] = [];

    function Test() {
      useGalleryItemScroll(containerRef, 3, 5, {
        itemsRootRef,
        debounceDelay: 10,
        behavior: 'auto',
        onAutoScrollStart: i => scrolled.push(i),
      });
      return null;
    }
    render(h(Test, {}), document.body);

    await new Promise(r => setTimeout(r, 60));

    expect(scrolled.includes(3)).toBe(true);
    // overlay 가 childIndex 계산에 포함되지 않았음을 간접 검증: length ===1
    expect(scrolled.length).toBe(1);
  });
});
