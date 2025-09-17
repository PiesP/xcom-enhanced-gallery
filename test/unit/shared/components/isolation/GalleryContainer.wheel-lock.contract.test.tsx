/**
 * GalleryContainer — Wheel Lock Contract
 * - 배경 스크롤 누수 방지: 컨텐츠가 스크롤 불가하면 컨테이너에서 wheel을 소비해야 한다
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { render, cleanup } from '@testing-library/preact';
import { h } from 'preact';
import { GalleryContainer } from '@/shared/components/isolation/GalleryContainer';

describe('GalleryContainer — wheel lock', () => {
  let host: HTMLElement;

  beforeEach(() => {
    host = document.createElement('div');
    document.body.appendChild(host);
  });

  afterEach(() => {
    cleanup();
    if (host && document.body.contains(host)) document.body.removeChild(host);
  });

  it('consumes wheel when container cannot scroll (content shorter than viewport)', () => {
    const { container, unmount } = render(
      h(
        GalleryContainer as any,
        { className: '' },
        h('div', { style: 'height: 100px' }, 'short content')
      ),
      { container: host }
    );
    try {
      const root = container.firstElementChild as HTMLElement | null;
      expect(root).not.toBeNull();
      if (!root) return;

      // jsdom은 레이아웃을 계산하지 않으므로 스크롤 가능 여부를 명시적으로 설정한다
      // 컨테이너 높이 400, 컨텐츠 높이 100 → 스크롤 불가
      Object.defineProperty(root, 'clientHeight', { value: 400, configurable: true });
      Object.defineProperty(root, 'scrollHeight', { value: 100, configurable: true });
      root.style.overflow = 'auto';

      const wheel = new globalThis.WheelEvent('wheel', {
        bubbles: true,
        cancelable: true,
        deltaY: 1,
      });
      const defaultBefore = wheel.defaultPrevented;
      const dispatched = root.dispatchEvent(wheel);
      // In JSDOM, dispatchEvent returns false if preventDefault was called on a cancelable event
      expect(dispatched).toBe(false);
      expect(defaultBefore).toBe(false);
      expect(wheel.defaultPrevented).toBe(true);
    } finally {
      unmount();
    }
  });

  it('does not consume wheel if container can scroll (content taller)', () => {
    const TallContent = () => h('div', { style: 'height: 2000px' }, 'tall');
    const { container, unmount } = render(
      h(GalleryContainer as any, { className: '' }, h(TallContent, {})),
      { container: host }
    );
    try {
      const root = container.firstElementChild as HTMLElement | null;
      expect(root).not.toBeNull();
      if (!root) return;

      // 컨테이너 높이 400, 컨텐츠 높이 2000 → 스크롤 가능
      Object.defineProperty(root, 'clientHeight', { value: 400, configurable: true });
      Object.defineProperty(root, 'scrollHeight', { value: 2000, configurable: true });
      root.style.overflow = 'auto';

      const wheel = new globalThis.WheelEvent('wheel', {
        bubbles: true,
        cancelable: true,
        deltaY: 1,
      });
      const dispatched = root.dispatchEvent(wheel);
      // preventDefault should NOT be called; dispatchEvent returns true
      expect(dispatched).toBe(true);
      expect(wheel.defaultPrevented).toBe(false);
    } finally {
      unmount();
    }
  });
});
