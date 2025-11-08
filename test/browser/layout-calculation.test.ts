/**
 * Layout Calculation 테스트 (Browser 모드)
 *
 * 실제 브라우저 환경에서 CSS 레이아웃 계산을 검증합니다.
 * - getBoundingClientRect()
 * - offsetWidth/Height
 * - scrollWidth/Height
 * - IntersectionObserver
 *
 * JSDOM에서는 모든 레이아웃 값이 0으로 반환됩니다.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { setupGlobalTestIsolation } from '../shared/global-cleanup-hooks';

describe('Layout Calculation in Browser', () => {
  setupGlobalTestIsolation();

  let container: HTMLDivElement;

  beforeEach(() => {
    container = document.createElement('div');
    container.style.padding = '20px';
    document.body.appendChild(container);
  });

  afterEach(() => {
    container.remove();
  });

  it('should calculate element dimensions correctly', () => {
    const box = document.createElement('div');
    box.style.width = '200px';
    box.style.height = '100px';
    box.style.padding = '10px';
    box.style.border = '5px solid black';
    container.appendChild(box);

    // offsetWidth/Height는 padding + border를 포함
    expect(box.offsetWidth).toBeGreaterThan(0);
    expect(box.offsetHeight).toBeGreaterThan(0);

    // clientWidth/Height는 padding만 포함 (border 제외)
    expect(box.clientWidth).toBeGreaterThan(0);
    expect(box.clientHeight).toBeGreaterThan(0);

    // 실제 브라우저에서는 정확한 값 계산 가능
    // offsetWidth = 200 + 10*2 + 5*2 = 230
    // clientWidth = 200 + 10*2 = 220
  });

  it('should get bounding rect with accurate positions', () => {
    const box = document.createElement('div');
    box.style.position = 'absolute';
    box.style.left = '50px';
    box.style.top = '100px';
    box.style.width = '150px';
    box.style.height = '80px';
    container.appendChild(box);

    const rect = box.getBoundingClientRect();

    expect(rect.width).toBe(150);
    expect(rect.height).toBe(80);
    expect(rect.left).toBeGreaterThanOrEqual(0);
    expect(rect.top).toBeGreaterThanOrEqual(0);
  });

  it('should detect element visibility with IntersectionObserver', async () => {
    const target = document.createElement('div');
    target.style.width = '100px';
    target.style.height = '100px';
    target.style.backgroundColor = 'red';
    container.appendChild(target);

    const isVisible = await new Promise<boolean>(resolve => {
      const observer = new IntersectionObserver(
        entries => {
          entries.forEach(entry => {
            // 요소가 뷰포트에 보이는지 확인
            expect(entry.target).toBe(target);
            resolve(entry.isIntersecting);
            observer.disconnect();
          });
        },
        { threshold: 0.1 }
      );

      observer.observe(target);
    });

    expect(isVisible).toBe(true);
  });

  it('should calculate scroll dimensions', () => {
    const scrollable = document.createElement('div');
    scrollable.style.width = '200px';
    scrollable.style.height = '150px';
    scrollable.style.overflow = 'auto';

    const content = document.createElement('div');
    content.style.width = '400px';
    content.style.height = '300px';
    content.textContent = 'Scrollable content';

    scrollable.appendChild(content);
    container.appendChild(scrollable);

    // scrollWidth/Height는 콘텐츠 전체 크기
    expect(scrollable.scrollWidth).toBeGreaterThanOrEqual(scrollable.clientWidth);
    expect(scrollable.scrollHeight).toBeGreaterThanOrEqual(scrollable.clientHeight);
  });

  it('should handle responsive layout changes', () => {
    const responsive = document.createElement('div');
    responsive.style.width = '50%'; // 부모 너비의 50%
    responsive.style.height = '100px';
    container.appendChild(responsive);

    const initialWidth = responsive.offsetWidth;
    expect(initialWidth).toBeGreaterThan(0);

    // 부모 너비 변경
    container.style.width = '800px';

    // 레이아웃 재계산 (실제로는 브라우저가 자동 처리)
    const newWidth = responsive.offsetWidth;
    expect(newWidth).toBeGreaterThan(0);
  });

  it('should calculate element positions relative to viewport', () => {
    const fixed = document.createElement('div');
    fixed.style.position = 'fixed';
    fixed.style.top = '10px';
    fixed.style.left = '20px';
    fixed.style.width = '100px';
    fixed.style.height = '50px';
    container.appendChild(fixed);

    const rect = fixed.getBoundingClientRect();

    // Fixed 포지션 요소는 뷰포트 기준
    expect(rect.top).toBeCloseTo(10, 1);
    expect(rect.left).toBeCloseTo(20, 1);
  });

  it('should handle hidden elements correctly', () => {
    const hidden = document.createElement('div');
    hidden.style.width = '100px';
    hidden.style.height = '100px';
    hidden.style.display = 'none';
    container.appendChild(hidden);

    // display: none 요소는 레이아웃에서 제외
    expect(hidden.offsetWidth).toBe(0);
    expect(hidden.offsetHeight).toBe(0);

    // visibility: hidden은 공간 유지
    hidden.style.display = 'block';
    hidden.style.visibility = 'hidden';

    expect(hidden.offsetWidth).toBe(100);
    expect(hidden.offsetHeight).toBe(100);
  });

  it('should calculate image aspect ratio', async () => {
    const img = document.createElement('img');
    img.src =
      'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="1920" height="1080"/>';

    await new Promise<void>(resolve => {
      img.addEventListener('load', () => {
        container.appendChild(img);

        // 이미지 자연 크기
        expect(img.naturalWidth).toBe(1920);
        expect(img.naturalHeight).toBe(1080);

        // Aspect ratio 계산
        const aspectRatio = img.naturalWidth / img.naturalHeight;
        expect(aspectRatio).toBeCloseTo(16 / 9, 2);

        resolve();
      });
    });
  });
});
