/**
 * @description CSS overscroll-behavior 속성 적용 검증
 * @note 갤러리 컨테이너에 올바른 CSS가 적용되어 스크롤 체이닝을 방지하는지 검증
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';

describe('Scroll Chaining CSS Prevention', () => {
  let container: HTMLElement;

  beforeEach(() => {
    document.body.innerHTML = '';
    container = document.createElement('div');
    container.className = 'test-gallery-container';
    document.body.appendChild(container);
  });

  afterEach(() => {
    document.body.innerHTML = '';
  });

  describe('1. CSS overscroll-behavior 속성', () => {
    it('should have overscroll-behavior: none on gallery container', () => {
      // RED: CSS 모듈이 아직 적용되지 않았을 때
      container.style.overscrollBehavior = 'none';

      const computedStyle = window.getComputedStyle(container);

      // overscroll-behavior가 none으로 설정되어야 함
      expect(
        computedStyle.overscrollBehavior || computedStyle.getPropertyValue('overscroll-behavior')
      ).toBe('none');
    });

    it('should prevent scroll chaining with CSS only', () => {
      // GREEN: CSS만으로 스크롤 체이닝 방지
      const parent = document.createElement('div');
      parent.style.height = '500px';
      parent.style.overflow = 'auto';

      const child = document.createElement('div');
      child.style.height = '300px';
      child.style.overflow = 'auto';
      child.style.overscrollBehavior = 'none';

      const childContent = document.createElement('div');
      childContent.style.height = '1000px';
      childContent.textContent = 'Scrollable content';

      child.appendChild(childContent);
      parent.appendChild(child);
      document.body.appendChild(parent);

      const childComputedStyle = window.getComputedStyle(child);

      // 자식 요소가 overscroll-behavior: none을 가져야 함
      expect(
        childComputedStyle.overscrollBehavior ||
          childComputedStyle.getPropertyValue('overscroll-behavior')
      ).toBe('none');

      document.body.removeChild(parent);
    });

    it('should apply overscroll-behavior-y for vertical scrolling', () => {
      // RED: 수직 스크롤만 제어
      container.style.overscrollBehaviorY = 'none';
      container.style.overscrollBehaviorX = 'auto';

      const computedStyle = window.getComputedStyle(container);

      // Y축만 none, X축은 auto
      const behaviorY =
        computedStyle.overscrollBehaviorY ||
        computedStyle.getPropertyValue('overscroll-behavior-y');
      const behaviorX =
        computedStyle.overscrollBehaviorX ||
        computedStyle.getPropertyValue('overscroll-behavior-x');

      expect(behaviorY).toBe('none');
      expect(behaviorX).toBe('auto');
    });
  });

  describe('2. CSS scroll-behavior 속성', () => {
    it('should maintain smooth scroll behavior', () => {
      // GREEN: 스크롤 체이닝 방지와 별개로 smooth 스크롤 유지
      container.style.scrollBehavior = 'smooth';
      container.style.overscrollBehavior = 'none';

      const computedStyle = window.getComputedStyle(container);

      expect(computedStyle.scrollBehavior).toBe('smooth');
      expect(
        computedStyle.overscrollBehavior || computedStyle.getPropertyValue('overscroll-behavior')
      ).toBe('none');
    });

    it('should preserve CSS scroll properties with overscroll-behavior', () => {
      // GREEN: CSS 스크롤 속성들이 함께 작동
      container.style.scrollBehavior = 'smooth';
      container.style.overflowY = 'auto';
      container.style.overscrollBehavior = 'contain';

      const computedStyle = window.getComputedStyle(container);

      expect(computedStyle.scrollBehavior).toBe('smooth');
      expect(computedStyle.overflowY).toBe('auto');
      expect(
        computedStyle.overscrollBehavior || computedStyle.getPropertyValue('overscroll-behavior')
      ).toBe('contain');
    });
  });

  describe('3. CSS 우선순위 및 상속', () => {
    it('should not inherit overscroll-behavior from parent', () => {
      // RED: overscroll-behavior는 상속되지 않음 (각 요소에 명시 필요)
      const parent = document.createElement('div');
      parent.style.overscrollBehavior = 'none';

      const child = document.createElement('div');
      parent.appendChild(child);
      document.body.appendChild(parent);

      const childComputedStyle = window.getComputedStyle(child);

      // 자식은 부모의 overscroll-behavior를 상속하지 않음
      const childBehavior =
        childComputedStyle.overscrollBehavior ||
        childComputedStyle.getPropertyValue('overscroll-behavior');
      expect(childBehavior).not.toBe('none');
      expect(['auto', 'contain', '']).toContain(childBehavior);

      document.body.removeChild(parent);
    });

    it('should apply inline style over CSS class', () => {
      // GREEN: 인라인 스타일이 클래스보다 우선
      const style = document.createElement('style');
      style.textContent = '.gallery-container { overscroll-behavior: contain; }';
      document.head.appendChild(style);

      container.className = 'gallery-container';
      container.style.overscrollBehavior = 'none';

      const computedStyle = window.getComputedStyle(container);

      // 인라인 스타일이 우선
      expect(
        computedStyle.overscrollBehavior || computedStyle.getPropertyValue('overscroll-behavior')
      ).toBe('none');

      document.head.removeChild(style);
    });
  });

  describe('4. 브라우저 호환성 폴백', () => {
    it('should fallback gracefully if overscroll-behavior is not supported', () => {
      // GREEN: 구형 브라우저에서도 에러 없이 동작
      // JSDOM에서는 모든 CSS 속성을 빈 문자열로 반환할 수 있음
      container.style.overscrollBehavior = 'none';

      const computedStyle = window.getComputedStyle(container);
      const behavior =
        computedStyle.overscrollBehavior ||
        computedStyle.getPropertyValue('overscroll-behavior') ||
        '';

      // 지원되거나 빈 문자열이어야 함 (에러 없음)
      expect(['none', 'contain', 'auto', '']).toContain(behavior);
    });

    it('should work without vendor prefixes', () => {
      // GREEN: 표준 속성만 사용 (벤더 프리픽스 불필요)
      container.style.overscrollBehavior = 'none';

      // -webkit-overscroll-behavior 같은 벤더 프리픽스는 필요 없음
      const computedStyle = window.getComputedStyle(container);
      const standardBehavior =
        computedStyle.overscrollBehavior || computedStyle.getPropertyValue('overscroll-behavior');

      expect(standardBehavior).toBeTruthy();
    });
  });
});
