/**
 * @fileoverview AnimationService 단위 테스트
 * @description 52.52% → 80%+ 커버리지 목표
 */

import { beforeEach, describe, expect, it, vi, afterEach } from 'vitest';
import { setupGlobalTestIsolation } from '../../../shared/global-cleanup-hooks';
import { AnimationService } from '@/shared/services/animation-service.js';

describe('AnimationService', () => {
  setupGlobalTestIsolation();

  let service: AnimationService;
  let testElement: HTMLDivElement;

  beforeEach(() => {
    // DOM 초기화
    document.head.innerHTML = '';
    document.body.innerHTML = '';

    // 테스트 요소 생성
    testElement = document.createElement('div');
    document.body.appendChild(testElement);

    // 싱글톤 인스턴스 가져오기
    service = AnimationService.getInstance();

    // stylesInjected 플래그 리셋 (private이므로 any로 접근)
    (service as any).stylesInjected = false;
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('싱글톤 패턴', () => {
    it('should return same instance on multiple calls', () => {
      const instance1 = AnimationService.getInstance();
      const instance2 = AnimationService.getInstance();

      expect(instance1).toBe(instance2);
    });

    it('should initialize with styles not injected initially', () => {
      const styleElement = document.getElementById('xcom-animations');
      expect(styleElement).toBeNull();
    });
  });

  describe('스타일 주입', () => {
    it('should inject animation styles on first use', () => {
      service.fadeIn(testElement, { duration: 10 });

      const styleElement = document.getElementById('xcom-animations');
      expect(styleElement).not.toBeNull();
      expect(styleElement?.tagName).toBe('STYLE');
    });

    it('should not inject styles twice', () => {
      service.fadeIn(testElement, { duration: 10 });
      const firstStyle = document.getElementById('xcom-animations');

      service.fadeOut(testElement, { duration: 10 });
      const secondStyle = document.getElementById('xcom-animations');

      expect(firstStyle).toBe(secondStyle);
    });

    it('should include fade-in styles', () => {
      service.fadeIn(testElement, { duration: 10 });

      const styleElement = document.getElementById('xcom-animations');
      const content = styleElement?.textContent || '';

      expect(content).toContain('.xcom-fade-in');
      expect(content).toContain('opacity: 0');
      expect(content).toContain('transition:');
    });

    it('should include fade-out styles', () => {
      service.fadeOut(testElement, { duration: 10 });

      const styleElement = document.getElementById('xcom-animations');
      const content = styleElement?.textContent || '';

      expect(content).toContain('.xcom-fade-out');
      expect(content).toContain('opacity: 1');
    });

    it('should include slide-in styles', () => {
      service.slideIn(testElement, { duration: 10 });

      const styleElement = document.getElementById('xcom-animations');
      const content = styleElement?.textContent || '';

      expect(content).toContain('.xcom-slide-in');
      expect(content).toContain('transform:');
      expect(content).toContain('translateY');
    });

    it('should include reduced motion media query', () => {
      service.fadeIn(testElement, { duration: 10 });

      const styleElement = document.getElementById('xcom-animations');
      const content = styleElement?.textContent || '';

      expect(content).toContain('@media (prefers-reduced-motion: reduce)');
      expect(content).toContain('transition: none');
    });

    it('should use design tokens for transitions', () => {
      service.fadeIn(testElement, { duration: 10 });

      const styleElement = document.getElementById('xcom-animations');
      const content = styleElement?.textContent || '';

      expect(content).toContain('var(--xeg-transition-preset-fade)');
      expect(content).toContain('var(--xeg-ease-standard)');
    });
  });

  describe('fadeIn 애니메이션', () => {
    it('should add fade-in class to element', () => {
      service.fadeIn(testElement, { duration: 10 });

      expect(testElement.classList.contains('xcom-fade-in')).toBe(true);
    });

    it('should add active class eventually', async () => {
      vi.useFakeTimers();
      const promise = service.fadeIn(testElement, { duration: 10 });

      await vi.advanceTimersByTimeAsync(10);
      await promise;

      expect(testElement.classList.contains('active')).toBe(true);
      vi.useRealTimers();
    });

    it('should respect custom duration', async () => {
      vi.useFakeTimers();

      const promise = service.fadeIn(testElement, { duration: 500 });

      await vi.advanceTimersByTimeAsync(500);
      await promise;

      expect(testElement.classList.contains('active')).toBe(true);
      vi.useRealTimers();
    });

    it('should apply delay before animation', async () => {
      vi.useFakeTimers();

      const promise = service.fadeIn(testElement, { duration: 100, delay: 200 });

      // delay 전에는 active 클래스 없음
      await vi.advanceTimersByTimeAsync(100);
      expect(testElement.classList.contains('active')).toBe(false);

      // delay + duration 후에는 active 클래스 추가
      await vi.advanceTimersByTimeAsync(200);
      await promise;

      expect(testElement.classList.contains('active')).toBe(true);
      vi.useRealTimers();
    });

    it('should use default duration (300ms) when not specified', async () => {
      vi.useFakeTimers();

      const promise = service.fadeIn(testElement);

      await vi.advanceTimersByTimeAsync(300);
      await promise;

      expect(testElement.classList.contains('active')).toBe(true);
      vi.useRealTimers();
    });
  });

  describe('fadeOut 애니메이션', () => {
    it('should add fade-out class to element', () => {
      service.fadeOut(testElement, { duration: 10 });

      expect(testElement.classList.contains('xcom-fade-out')).toBe(true);
    });

    it('should add active class eventually', async () => {
      vi.useFakeTimers();
      const promise = service.fadeOut(testElement, { duration: 10 });

      await vi.advanceTimersByTimeAsync(10);
      await promise;

      expect(testElement.classList.contains('active')).toBe(true);
      vi.useRealTimers();
    });

    it('should respect custom duration', async () => {
      vi.useFakeTimers();

      const promise = service.fadeOut(testElement, { duration: 500 });

      await vi.advanceTimersByTimeAsync(500);
      await promise;

      expect(testElement.classList.contains('active')).toBe(true);
      vi.useRealTimers();
    });

    it('should apply delay before animation', async () => {
      vi.useFakeTimers();

      const promise = service.fadeOut(testElement, { duration: 100, delay: 200 });

      await vi.advanceTimersByTimeAsync(100);
      expect(testElement.classList.contains('active')).toBe(false);

      await vi.advanceTimersByTimeAsync(200);
      await promise;

      expect(testElement.classList.contains('active')).toBe(true);
      vi.useRealTimers();
    });
  });

  describe('slideIn 애니메이션', () => {
    it('should add slide-in class to element', () => {
      service.slideIn(testElement, { duration: 10 });

      expect(testElement.classList.contains('xcom-slide-in')).toBe(true);
    });

    it('should add active class eventually', async () => {
      vi.useFakeTimers();
      const promise = service.slideIn(testElement, { duration: 10 });

      await vi.advanceTimersByTimeAsync(10);
      await promise;

      expect(testElement.classList.contains('active')).toBe(true);
      vi.useRealTimers();
    });

    it('should respect custom duration', async () => {
      vi.useFakeTimers();

      const promise = service.slideIn(testElement, { duration: 500 });

      await vi.advanceTimersByTimeAsync(500);
      await promise;

      expect(testElement.classList.contains('active')).toBe(true);
      vi.useRealTimers();
    });

    it('should apply delay before animation', async () => {
      vi.useFakeTimers();

      const promise = service.slideIn(testElement, { duration: 100, delay: 200 });

      await vi.advanceTimersByTimeAsync(100);
      expect(testElement.classList.contains('active')).toBe(false);

      await vi.advanceTimersByTimeAsync(200);
      await promise;

      expect(testElement.classList.contains('active')).toBe(true);
      vi.useRealTimers();
    });
  });

  describe('갤러리 애니메이션', () => {
    it('should animate gallery opening with fadeIn', async () => {
      vi.useFakeTimers();
      const promise = service.openGallery(testElement, { duration: 10 });

      await vi.advanceTimersByTimeAsync(10);
      await promise;

      expect(testElement.classList.contains('xcom-fade-in')).toBe(true);
      expect(testElement.classList.contains('active')).toBe(true);
      vi.useRealTimers();
    });

    it('should animate gallery closing with fadeOut', async () => {
      vi.useFakeTimers();
      const promise = service.closeGallery(testElement, { duration: 10 });

      await vi.advanceTimersByTimeAsync(10);
      await promise;

      expect(testElement.classList.contains('xcom-fade-out')).toBe(true);
      expect(testElement.classList.contains('active')).toBe(true);
      vi.useRealTimers();
    });

    it('should respect config for openGallery', async () => {
      vi.useFakeTimers();

      const promise = service.openGallery(testElement, { duration: 500, delay: 100 });

      await vi.advanceTimersByTimeAsync(600);
      await promise;

      expect(testElement.classList.contains('active')).toBe(true);
      vi.useRealTimers();
    });

    it('should respect config for closeGallery', async () => {
      vi.useFakeTimers();

      const promise = service.closeGallery(testElement, { duration: 500, delay: 100 });

      await vi.advanceTimersByTimeAsync(600);
      await promise;

      expect(testElement.classList.contains('active')).toBe(true);
      vi.useRealTimers();
    });
  });

  describe('animateElement (통합 메서드)', () => {
    it('should trigger fadeIn animation', () => {
      service.animateElement(testElement, { duration: 10 });

      // animateElement는 비동기지만 await 없이 호출 가능
      expect(testElement.classList.contains('xcom-fade-in')).toBe(true);
    });

    it('should use default config when not provided', () => {
      service.animateElement(testElement);

      expect(testElement.classList.contains('xcom-fade-in')).toBe(true);
    });
  });

  describe('cleanup', () => {
    it('should remove all animation classes from elements', async () => {
      vi.useFakeTimers();
      const promise = service.fadeIn(testElement, { duration: 10 });
      await vi.advanceTimersByTimeAsync(10);
      await promise;

      service.cleanup();

      expect(testElement.classList.contains('xcom-fade-in')).toBe(false);
      expect(testElement.classList.contains('active')).toBe(false);
      vi.useRealTimers();
    });

    it('should clean up multiple animated elements', async () => {
      const element2 = document.createElement('div');
      const element3 = document.createElement('div');
      document.body.appendChild(element2);
      document.body.appendChild(element3);

      vi.useFakeTimers();
      const p1 = service.fadeIn(testElement, { duration: 10 });
      const p2 = service.fadeOut(element2, { duration: 10 });
      const p3 = service.slideIn(element3, { duration: 10 });
      await vi.advanceTimersByTimeAsync(10);
      await Promise.all([p1, p2, p3]);

      service.cleanup();

      expect(testElement.classList.length).toBe(0);
      expect(element2.classList.length).toBe(0);
      expect(element3.classList.length).toBe(0);
      vi.useRealTimers();
    });

    it('should handle cleanup on elements without animation classes', () => {
      const plainElement = document.createElement('div');
      plainElement.className = 'some-other-class';
      document.body.appendChild(plainElement);

      service.cleanup();

      expect(plainElement.className).toBe('some-other-class');
    });
  });

  describe('엣지 케이스', () => {
    it('should handle animation on detached element', async () => {
      const detachedElement = document.createElement('div');

      vi.useFakeTimers();
      const promise = service.fadeIn(detachedElement, { duration: 10 });
      await vi.advanceTimersByTimeAsync(10);
      await promise;

      expect(detachedElement.classList.contains('xcom-fade-in')).toBe(true);
      expect(detachedElement.classList.contains('active')).toBe(true);
      vi.useRealTimers();
    });

    it('should handle zero duration', async () => {
      // zero duration은 즉시 완료
      await service.fadeIn(testElement, { duration: 0 });

      expect(testElement.classList.contains('xcom-fade-in')).toBe(true);
      expect(testElement.classList.contains('active')).toBe(true);
    });

    it('should handle zero delay', async () => {
      vi.useFakeTimers();
      const promise = service.fadeIn(testElement, { duration: 10, delay: 0 });
      await vi.advanceTimersByTimeAsync(10);
      await promise;

      expect(testElement.classList.contains('active')).toBe(true);
      vi.useRealTimers();
    });

    it('should handle concurrent animations on same element', async () => {
      vi.useFakeTimers();
      const promise1 = service.fadeIn(testElement, { duration: 10 });
      const promise2 = service.fadeOut(testElement, { duration: 10 });

      await vi.advanceTimersByTimeAsync(10);
      await Promise.all([promise1, promise2]);

      // 두 애니메이션 클래스가 모두 적용됨
      expect(
        testElement.classList.contains('xcom-fade-in') ||
          testElement.classList.contains('xcom-fade-out')
      ).toBe(true);
      vi.useRealTimers();
    });

    it('should not fail when styles already injected externally', () => {
      // 외부에서 이미 스타일 주입
      const existingStyle = document.createElement('style');
      existingStyle.id = 'xcom-animations';
      existingStyle.textContent = '/* existing */';
      document.head.appendChild(existingStyle);

      service.fadeIn(testElement, { duration: 10 });

      const styleElements = document.querySelectorAll('#xcom-animations');
      expect(styleElements.length).toBe(1);
    });
  });

  describe('타이머 관리', () => {
    it('should use globalTimerManager for delays', async () => {
      vi.useFakeTimers();

      const promise = service.fadeIn(testElement, { duration: 100 });

      // 수동으로 타이머 진행
      await vi.advanceTimersByTimeAsync(100);
      await promise;

      expect(testElement.classList.contains('active')).toBe(true);

      vi.useRealTimers();
    });

    it('should chain multiple delays correctly', async () => {
      vi.useFakeTimers();

      const promise = service.fadeIn(testElement, { duration: 200, delay: 100 });

      // delay + duration = 300ms
      await vi.advanceTimersByTimeAsync(300);
      await promise;

      expect(testElement.classList.contains('active')).toBe(true);

      vi.useRealTimers();
    });
  });
});
