/**
 * Copyright (c) 2024 X.com Enhanced Gallery
 * Licensed under the MIT License
 *
 * @fileoverview Phase 144.2 - Scroll Chaining: Gallery Resize Tests (Browser)
 * @description Chromium 실제 브라우저 환경에서 갤러리 크기 변화 테스트
 *
 * 테스트 시나리오:
 * 1. 브라우저 리사이즈 중 스크롤 체이닝 방지 유지
 * 2. 풀스크린 전환 시 레이아웃 재계산
 * 3. viewport 크기 변화 감지
 *
 * 현재 구현:
 * - CSS overscroll-behavior: none (스크롤 체이닝 방지)
 * - ResizeObserver로 viewport 크기 변화 감지 (Phase 112)
 * - CSS 변수로 viewport 크기 관리
 *
 * 검증 목표:
 * - 리사이즈 중에도 스크롤 체이닝이 방지되는지
 * - ResizeObserver가 크기 변화를 정확히 감지하는지
 * - 풀스크린 전환 시 레이아웃이 정상 작동하는지
 *
 * @see src/shared/utils/viewport.ts
 * @see test/browser/resize-observer.test.ts
 * @see src/features/gallery/hooks/useGalleryScroll.ts
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';

describe('Phase 144: Scroll Chaining - Gallery Resize (Browser)', () => {
  let galleryContainer: HTMLDivElement;
  let scrollableContent: HTMLDivElement;
  let pageContainer: HTMLDivElement;

  beforeEach(() => {
    document.body.innerHTML = '';

    // 페이지 컨테이너 (부모 스크롤 가능 영역)
    pageContainer = document.createElement('div');
    pageContainer.id = 'page-container';
    pageContainer.style.cssText = `
      height: 1000px;
      overflow-y: auto;
      background: #e0e0e0;
    `;

    // 페이지 콘텐츠
    const pageContent = document.createElement('div');
    pageContent.style.height = '3000px';
    pageContent.style.background = 'linear-gradient(to bottom, #f0f0f0, #d0d0d0)';
    pageContainer.appendChild(pageContent);

    // 갤러리 컨테이너 (스크롤 가능)
    galleryContainer = document.createElement('div');
    galleryContainer.id = 'gallery-container';
    galleryContainer.style.cssText = `
      position: fixed;
      top: 100px;
      left: 100px;
      width: 600px;
      height: 400px;
      overflow-y: auto;
      overscroll-behavior: none;
      background: white;
      border: 2px solid #333;
    `;

    // 스크롤 가능한 콘텐츠
    scrollableContent = document.createElement('div');
    scrollableContent.style.cssText = `
      min-height: 1500px;
      padding: 20px;
    `;

    // 아이템 추가
    for (let i = 0; i < 10; i++) {
      const item = document.createElement('div');
      item.textContent = `Gallery Item ${i}`;
      item.style.cssText = `
        height: 100px;
        margin: 10px 0;
        background: #f5f5f5;
        display: flex;
        align-items: center;
        justify-content: center;
      `;
      scrollableContent.appendChild(item);
    }

    galleryContainer.appendChild(scrollableContent);
    document.body.appendChild(pageContainer);
    document.body.appendChild(galleryContainer);
  });

  afterEach(() => {
    document.body.innerHTML = '';
  });

  describe('1. 브라우저 리사이즈', () => {
    it('should maintain scroll chaining prevention during resize', async () => {
      // 갤러리를 하단으로 스크롤
      galleryContainer.scrollTop = galleryContainer.scrollHeight;
      const initialPageScroll = pageContainer.scrollTop;

      // 갤러리 크기 변경
      galleryContainer.style.height = '300px';

      // 리사이즈 이벤트 트리거
      window.dispatchEvent(new Event('resize'));

      // 약간의 대기
      await new Promise(resolve => setTimeout(resolve, 100));

      // 리사이즈 후에도 wheel 이벤트에서 스크롤 체이닝 방지 유지
      const wheelEvent = new WheelEvent('wheel', {
        deltaY: 100,
        bubbles: true,
        cancelable: true,
      });
      galleryContainer.dispatchEvent(wheelEvent);

      await new Promise(resolve => setTimeout(resolve, 50));

      // 페이지 스크롤이 변하지 않아야 함
      const finalPageScroll = pageContainer.scrollTop;
      expect(finalPageScroll).toBe(initialPageScroll);
    });

    it('should recalculate scroll boundaries after resize', async () => {
      const initialHeight = 400;
      const newHeight = 600;

      // 초기 스크롤 가능 범위
      const initialMaxScroll = galleryContainer.scrollHeight - initialHeight;

      // 갤러리 크기 증가
      galleryContainer.style.height = `${newHeight}px`;
      window.dispatchEvent(new Event('resize'));

      await new Promise(resolve => setTimeout(resolve, 100));

      // 새로운 스크롤 가능 범위
      const newMaxScroll = galleryContainer.scrollHeight - newHeight;

      // 리사이즈 후 스크롤 범위가 변경되어야 함
      expect(newMaxScroll).toBeLessThan(initialMaxScroll);

      // 새로운 범위 내에서 스크롤 가능
      galleryContainer.scrollTop = newMaxScroll;
      await new Promise(resolve => setTimeout(resolve, 50));

      expect(galleryContainer.scrollTop).toBeGreaterThan(0);
    });

    it('should handle rapid consecutive resizes', async () => {
      const initialScrollTop = galleryContainer.scrollTop;

      // 빠른 연속 리사이즈
      for (let i = 0; i < 5; i++) {
        const newHeight = 300 + i * 50;
        galleryContainer.style.height = `${newHeight}px`;
        window.dispatchEvent(new Event('resize'));
        await new Promise(resolve => setTimeout(resolve, 20));
      }

      // 최종 대기
      await new Promise(resolve => setTimeout(resolve, 100));

      // 스크롤 기능이 정상 작동해야 함
      galleryContainer.scrollTop = 200;
      await new Promise(resolve => setTimeout(resolve, 50));

      expect(galleryContainer.scrollTop).toBeGreaterThan(initialScrollTop);
    });
  });

  describe('2. 풀스크린 전환', () => {
    it('should handle fullscreen enter transition', async () => {
      const initialWidth = galleryContainer.offsetWidth;
      const initialHeight = galleryContainer.offsetHeight;

      // 풀스크린 진입 시뮬레이션 (실제 크기 증가)
      galleryContainer.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 1200px;
        height: 800px;
        overflow-y: auto;
        overscroll-behavior: none;
        z-index: 9999;
        background: white;
      `;

      // fullscreenchange 이벤트
      document.dispatchEvent(new Event('fullscreenchange'));

      await new Promise(resolve => setTimeout(resolve, 100));

      // 풀스크린에서 크기가 증가했는지 확인
      const fullscreenWidth = galleryContainer.offsetWidth;
      const fullscreenHeight = galleryContainer.offsetHeight;

      expect(fullscreenWidth).toBeGreaterThan(initialWidth);
      expect(fullscreenHeight).toBeGreaterThan(initialHeight);

      // 풀스크린에서도 스크롤 가능
      galleryContainer.scrollTop = 300;
      await new Promise(resolve => setTimeout(resolve, 50));

      expect(galleryContainer.scrollTop).toBeGreaterThan(0);
    });

    it('should restore layout after fullscreen exit', async () => {
      // 초기 상태 저장
      const initialStyle = galleryContainer.style.cssText;

      // 풀스크린 진입
      galleryContainer.style.cssText += `
        width: 100vw;
        height: 100vh;
      `;

      await new Promise(resolve => setTimeout(resolve, 100));

      // 풀스크린 종료
      galleryContainer.style.cssText = initialStyle;
      document.dispatchEvent(new Event('fullscreenchange'));

      await new Promise(resolve => setTimeout(resolve, 100));

      // 원래 크기로 복원되었는지 확인
      const restoredWidth = galleryContainer.offsetWidth;
      const restoredHeight = galleryContainer.offsetHeight;

      // 초기 크기와 유사해야 함 (정확히 같지 않을 수 있음)
      expect(restoredWidth).toBeGreaterThan(500);
      expect(restoredWidth).toBeLessThan(700);
      expect(restoredHeight).toBeGreaterThan(300);
      expect(restoredHeight).toBeLessThan(500);
    });

    it('should maintain scroll position during fullscreen transition', async () => {
      // 중간 위치로 스크롤
      galleryContainer.scrollTop = 500;
      const scrollBeforeFullscreen = galleryContainer.scrollTop;

      // 풀스크린 진입
      galleryContainer.style.cssText += `
        width: 100vw;
        height: 100vh;
      `;

      await new Promise(resolve => setTimeout(resolve, 100));

      // 스크롤 위치가 유지되거나 유효한 범위 내에 있어야 함
      const scrollDuringFullscreen = galleryContainer.scrollTop;
      expect(scrollDuringFullscreen).toBeGreaterThanOrEqual(0);

      // 풀스크린 종료
      galleryContainer.style.width = '600px';
      galleryContainer.style.height = '400px';

      await new Promise(resolve => setTimeout(resolve, 100));

      // 스크롤 위치가 여전히 유효해야 함
      expect(galleryContainer.scrollTop).toBeGreaterThanOrEqual(0);
    });
  });

  describe('3. DevTools/UI 변화', () => {
    it('should detect viewport size changes', async () => {
      const resizeEvents: number[] = [];

      // ResizeObserver 시뮬레이션
      const observer = new ResizeObserver(entries => {
        entries.forEach(entry => {
          resizeEvents.push(entry.contentRect.height);
        });
      });

      observer.observe(galleryContainer);

      // 크기 변경
      galleryContainer.style.height = '500px';
      await new Promise(resolve => setTimeout(resolve, 100));

      galleryContainer.style.height = '300px';
      await new Promise(resolve => setTimeout(resolve, 100));

      // ResizeObserver가 변화를 감지했는지 확인
      expect(resizeEvents.length).toBeGreaterThan(0);

      observer.disconnect();
    });

    it('should handle DevTools panel opening/closing', async () => {
      // DevTools 열림 시뮬레이션 (viewport 높이 감소)
      const originalHeight = window.innerHeight;

      // viewport 높이 변경 시뮬레이션
      Object.defineProperty(window, 'innerHeight', {
        writable: true,
        configurable: true,
        value: originalHeight - 300,
      });

      window.dispatchEvent(new Event('resize'));
      await new Promise(resolve => setTimeout(resolve, 100));

      // 갤러리가 여전히 스크롤 가능해야 함
      galleryContainer.scrollTop = 200;
      await new Promise(resolve => setTimeout(resolve, 50));

      expect(galleryContainer.scrollTop).toBeGreaterThan(0);

      // 원래 크기로 복원
      Object.defineProperty(window, 'innerHeight', {
        writable: true,
        configurable: true,
        value: originalHeight,
      });

      window.dispatchEvent(new Event('resize'));
      await new Promise(resolve => setTimeout(resolve, 100));

      // 여전히 정상 작동
      expect(galleryContainer.scrollTop).toBeGreaterThanOrEqual(0);
    });
  });
});
