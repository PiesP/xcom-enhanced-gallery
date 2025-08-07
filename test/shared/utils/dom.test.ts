/**
 * @fileoverview DOM Utils TDD 테스트 (실제 함수들만)
 * @description 실제로 존재하는 DOM 유틸리티 함수들만 테스트
 * @version 3.0.0 - 실제 함수 기반 재작성
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { JSDOM } from 'jsdom';
import {
  // 실제 존재하는 함수들만 import
  isInsideGallery,
  isGalleryContainer,
  isGalleryInternalEvent,
  shouldBlockGalleryEvent,
  safeQuerySelector,
  safeQuerySelectorAll,
} from '@shared/utils/dom';

// JSDOM 환경 설정
const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>');
global.document = dom.window.document;
global.window = dom.window as any;

// Element.prototype.matches 폴리필 (JSDOM에서 필요)
if (!Element.prototype.matches) {
  Element.prototype.matches = function (selector: string): boolean {
    const matches = (this.document || this.ownerDocument).querySelectorAll(selector);
    let i = matches.length;
    while (--i >= 0 && matches.item(i) !== this) {}
    return i > -1;
  };
}

describe('DOM Utils TDD 테스트', () => {
  beforeEach(() => {
    // DOM 초기화
    document.body.innerHTML = '';
  });

  describe('🔴 RED: 갤러리 요소 감지', () => {
    it('isInsideGallery가 갤러리 내부 요소를 감지해야 한다', () => {
      // 갤러리 컨테이너 생성
      const galleryContainer = document.createElement('div');
      galleryContainer.setAttribute('data-gallery-container', 'true');

      const childElement = document.createElement('div');
      galleryContainer.appendChild(childElement);
      document.body.appendChild(galleryContainer);

      expect(isInsideGallery(childElement)).toBe(true);
      expect(isInsideGallery(galleryContainer)).toBe(true);
    });

    it('isInsideGallery가 갤러리 외부 요소를 올바르게 분류해야 한다', () => {
      const normalDiv = document.createElement('div');
      document.body.appendChild(normalDiv);

      expect(isInsideGallery(normalDiv)).toBe(false);
      expect(isInsideGallery(null)).toBe(false);
    });

    it('isGalleryContainer가 갤러리 컨테이너를 식별해야 한다', () => {
      const galleryContainer = document.createElement('div');
      galleryContainer.setAttribute('data-gallery-container', 'true');

      const normalDiv = document.createElement('div');

      expect(isGalleryContainer(galleryContainer)).toBe(true);
      expect(isGalleryContainer(normalDiv)).toBe(false);
      expect(isGalleryContainer(null)).toBe(false);
    });

    it('isGalleryInternalEvent가 갤러리 내부 이벤트를 식별해야 한다', () => {
      const galleryContainer = document.createElement('div');
      galleryContainer.className = 'gallery-container';

      const button = document.createElement('button');
      galleryContainer.appendChild(button);
      document.body.appendChild(galleryContainer);

      const clickEvent = new MouseEvent('click', { bubbles: true });
      Object.defineProperty(clickEvent, 'target', { value: button });

      expect(isGalleryInternalEvent(clickEvent)).toBe(true);
    });

    it('shouldBlockGalleryEvent가 이벤트 차단 여부를 결정해야 한다', () => {
      const galleryButton = document.createElement('button');
      galleryButton.className = 'xeg-button';
      document.body.appendChild(galleryButton);

      const clickEvent = new MouseEvent('click');
      Object.defineProperty(clickEvent, 'target', { value: galleryButton });

      expect(shouldBlockGalleryEvent(clickEvent)).toBe(true);
    });
  });

  describe('🟢 GREEN: 안전한 DOM 선택', () => {
    it.skip('safeQuerySelector가 요소를 안전하게 선택해야 한다', () => {
      const testDiv = document.createElement('div');
      testDiv.id = 'test-element';
      testDiv.className = 'test-class';
      document.body.appendChild(testDiv);

      const selected = safeQuerySelector('#test-element');
      expect(selected).toBe(testDiv);
      expect(selected?.className).toBe('test-class');
    });

    it('safeQuerySelectorAll이 여러 요소를 안전하게 선택해야 한다', () => {
      const div1 = document.createElement('div');
      div1.className = 'test-item';
      const div2 = document.createElement('div');
      div2.className = 'test-item';

      document.body.appendChild(div1);
      document.body.appendChild(div2);

      const elements = safeQuerySelectorAll('.test-item');
      expect(elements).toHaveLength(2);
      expect(elements[0]).toBe(div1);
      expect(elements[1]).toBe(div2);
    });

    it('safeQuerySelector가 부모 요소에서 검색해야 한다', () => {
      const container = document.createElement('div');
      const child = document.createElement('span');
      child.className = 'child-element';
      container.appendChild(child);
      document.body.appendChild(container);

      const selected = safeQuerySelector(container, '.child-element');
      expect(selected).toBe(child);
    });
  });

  describe('🔵 REFACTOR: 에러 처리', () => {
    it('safeQuerySelector가 잘못된 선택자에 대해 null을 반환해야 한다', () => {
      const result = safeQuerySelector('invalid:::selector');
      expect(result).toBeNull();
    });

    it('safeQuerySelectorAll이 잘못된 선택자에 대해 빈 배열을 반환해야 한다', () => {
      const result = safeQuerySelectorAll('invalid:::selector');
      expect(result).toEqual([]);
    });

    it('safeQuerySelector가 존재하지 않는 요소에 대해 null을 반환해야 한다', () => {
      const result = safeQuerySelector('#non-existent-element');
      expect(result).toBeNull();
    });

    it('safeQuerySelectorAll이 존재하지 않는 요소에 대해 빈 배열을 반환해야 한다', () => {
      const result = safeQuerySelectorAll('.non-existent-class');
      expect(result).toEqual([]);
    });
  });

  describe('🚀 갤러리 선택자 테스트', () => {
    it('[data-gallery-container] 선택자가 갤러리 요소로 인식되어야 한다', () => {
      const element = document.createElement('div');
      element.setAttribute('data-gallery-container', 'true');
      document.body.appendChild(element);

      expect(isGalleryContainer(element)).toBe(true);
      expect(isInsideGallery(element)).toBe(true);
    });

    it('.gallery-container 선택자가 갤러리 요소로 인식되어야 한다', () => {
      const element = document.createElement('div');
      element.className = 'gallery-container';
      document.body.appendChild(element);

      expect(isGalleryContainer(element)).toBe(true);
      expect(isInsideGallery(element)).toBe(true);
    });

    it('.xeg-gallery-container 선택자가 갤러리 요소로 인식되어야 한다', () => {
      const element = document.createElement('div');
      element.className = 'xeg-gallery-container';
      document.body.appendChild(element);

      expect(isGalleryContainer(element)).toBe(true);
      expect(isInsideGallery(element)).toBe(true);
    });

    it('.xeg-button 선택자가 갤러리 요소로 인식되어야 한다', () => {
      const button = document.createElement('button');
      button.className = 'xeg-button';
      document.body.appendChild(button);

      expect(isGalleryContainer(button)).toBe(true);
      expect(isInsideGallery(button)).toBe(true);
    });

    it('중첩된 갤러리 요소가 올바르게 감지되어야 한다', () => {
      const container = document.createElement('div');
      container.className = 'xeg-gallery-container';

      const toolbar = document.createElement('div');
      toolbar.className = 'xeg-toolbar';

      const button = document.createElement('button');
      button.className = 'xeg-button';

      toolbar.appendChild(button);
      container.appendChild(toolbar);
      document.body.appendChild(container);

      expect(isInsideGallery(container)).toBe(true);
      expect(isInsideGallery(toolbar)).toBe(true);
      expect(isInsideGallery(button)).toBe(true);
    });
  });

  describe('🌟 실제 사용 시나리오', () => {
    it('갤러리 UI 이벤트 필터링 시나리오', () => {
      // 갤러리 구조 생성
      const galleryContainer = document.createElement('div');
      galleryContainer.className = 'xeg-gallery-container';

      const closeButton = document.createElement('button');
      closeButton.className = 'xeg-button close-btn';
      galleryContainer.appendChild(closeButton);

      const externalButton = document.createElement('button');
      externalButton.className = 'external-button';

      document.body.appendChild(galleryContainer);
      document.body.appendChild(externalButton);

      // 갤러리 내부 클릭 이벤트
      const galleryClick = new MouseEvent('click');
      Object.defineProperty(galleryClick, 'target', { value: closeButton });

      // 갤러리 외부 클릭 이벤트
      const externalClick = new MouseEvent('click');
      Object.defineProperty(externalClick, 'target', { value: externalButton });

      expect(shouldBlockGalleryEvent(galleryClick)).toBe(true);
      expect(shouldBlockGalleryEvent(externalClick)).toBe(false);
    });

    it('DOM 선택 안전성 시나리오', () => {
      // 정상적인 DOM 구조
      const validContainer = document.createElement('div');
      validContainer.id = 'media-container';

      const mediaItem = document.createElement('img');
      mediaItem.className = 'media-item';
      validContainer.appendChild(mediaItem);

      document.body.appendChild(validContainer);

      // 안전한 선택
      const container = safeQuerySelector('#media-container');
      const items = safeQuerySelectorAll('.media-item');
      const nonExistent = safeQuerySelector('#non-existent');
      const invalidSelector = safeQuerySelector('[invalid::selector');

      expect(container).toBe(validContainer);
      expect(items).toHaveLength(1);
      expect(items[0]).toBe(mediaItem);
      expect(nonExistent).toBeNull();
      expect(invalidSelector).toBeNull();
    });
  });
});
