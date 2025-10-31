/**
 * @fileoverview core-utils.ts 단위 테스트
 * @description Phase 140.4: 저커버리지 파일 개선 (25.14% → 70%+)
 */

/* global getComputedStyle, CSSStyleDeclaration, HTMLSpanElement */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  safeQuerySelector,
  isInsideGallery,
  isGalleryContainer,
  isGalleryInternalEvent,
  shouldBlockGalleryEvent,
  safeGetAttribute,
  safeSetAttribute,
  safeAddClass,
  safeRemoveClass,
  safeSetStyle,
  safeRemoveElement,
  setCSSVariable,
  setCSSVariables,
  findScrollContainer,
  findTwitterScrollContainer,
  safeSetScrollTop,
  getCurrentScrollTop,
  ensureGalleryScrollAvailable,
  extractTweetInfoFromUrl,
  removeDuplicateStrings,
} from '@/shared/utils/core-utils';

describe('core-utils: DOM 유틸리티', () => {
  describe('safeQuerySelector', () => {
    beforeEach(() => {
      document.body.innerHTML = `
        <div id="test-container">
          <button class="test-btn">Test Button</button>
          <div class="nested">
            <span id="nested-span">Nested Span</span>
          </div>
        </div>
      `;
    });

    afterEach(() => {
      document.body.innerHTML = '';
    });

    it('1개 파라미터: document에서 검색', () => {
      const btn = safeQuerySelector<HTMLButtonElement>('.test-btn');
      expect(btn).not.toBeNull();
      expect(btn?.tagName).toBe('BUTTON');
      expect(btn?.textContent).toBe('Test Button');
    });

    it('2개 파라미터: 지정된 root에서 검색', () => {
      const container = document.querySelector('#test-container') as HTMLElement;
      const span = safeQuerySelector<HTMLSpanElement>(container, '#nested-span');
      expect(span).not.toBeNull();
      expect(span?.tagName).toBe('SPAN');
      expect(span?.textContent).toBe('Nested Span');
    });

    it('존재하지 않는 요소 검색 시 null 반환', () => {
      const result = safeQuerySelector('.non-existent');
      expect(result).toBeNull();
    });

    it('잘못된 선택자 시 null 반환 (에러 안전)', () => {
      const result = safeQuerySelector('::invalid::selector::');
      expect(result).toBeNull();
    });

    it('2개 파라미터에서 selector 누락 시 null 반환', () => {
      const container = document.querySelector('#test-container') as HTMLElement;
      const result = safeQuerySelector(container, undefined as any);
      expect(result).toBeNull();
    });
  });

  describe('isInsideGallery', () => {
    beforeEach(() => {
      document.body.innerHTML = `
        <div id="outside">Outside</div>
        <div data-gallery-container>
          <div id="inside-data">Inside by data attr</div>
        </div>
        <div class="gallery-container">
          <div id="inside-class">Inside by class</div>
        </div>
        <div class="xeg-gallery-container">
          <div id="inside-xeg">Inside by xeg class</div>
        </div>
        <div id="gallery-view">
          <div id="inside-id">Inside by id</div>
        </div>
      `;
    });

    afterEach(() => {
      document.body.innerHTML = '';
    });

    it('null 요소는 false 반환', () => {
      expect(isInsideGallery(null)).toBe(false);
    });

    it('갤러리 외부 요소는 false', () => {
      const outside = document.querySelector('#outside');
      expect(isInsideGallery(outside)).toBe(false);
    });

    it('[data-gallery-container] 내부는 true', () => {
      const inside = document.querySelector('#inside-data');
      expect(isInsideGallery(inside)).toBe(true);
    });

    it('.gallery-container 내부는 true', () => {
      const inside = document.querySelector('#inside-class');
      expect(isInsideGallery(inside)).toBe(true);
    });

    it('.xeg-gallery-container 내부는 true', () => {
      const inside = document.querySelector('#inside-xeg');
      expect(isInsideGallery(inside)).toBe(true);
    });

    it('#gallery-view 내부는 true', () => {
      const inside = document.querySelector('#inside-id');
      expect(isInsideGallery(inside)).toBe(true);
    });
  });

  describe('isGalleryContainer', () => {
    beforeEach(() => {
      document.body.innerHTML = `
        <div id="not-gallery">Not Gallery</div>
        <div class="xeg-gallery-container" id="xeg-container">XEG Container</div>
        <div class="xeg-gallery" id="xeg-gallery">XEG Gallery</div>
        <div data-xeg-gallery id="data-gallery">Data Gallery</div>
        <div class="gallery-overlay" id="overlay">Overlay</div>
      `;
    });

    afterEach(() => {
      document.body.innerHTML = '';
    });

    it('null 요소는 false 반환', () => {
      expect(isGalleryContainer(null)).toBe(false);
    });

    it('갤러리 컨테이너가 아닌 요소는 false', () => {
      const notGallery = document.querySelector('#not-gallery') as HTMLElement;
      expect(isGalleryContainer(notGallery)).toBe(false);
    });

    it('.xeg-gallery-container는 true', () => {
      const container = document.querySelector('#xeg-container') as HTMLElement;
      expect(isGalleryContainer(container)).toBe(true);
    });

    it('.xeg-gallery는 true', () => {
      const gallery = document.querySelector('#xeg-gallery') as HTMLElement;
      expect(isGalleryContainer(gallery)).toBe(true);
    });

    it('[data-xeg-gallery]는 true', () => {
      const dataGallery = document.querySelector('#data-gallery') as HTMLElement;
      expect(isGalleryContainer(dataGallery)).toBe(true);
    });

    it('.gallery-overlay는 true', () => {
      const overlay = document.querySelector('#overlay') as HTMLElement;
      expect(isGalleryContainer(overlay)).toBe(true);
    });
  });

  describe('isGalleryInternalEvent', () => {
    beforeEach(() => {
      document.body.innerHTML = `
        <div id="outside">Outside</div>
        <div class="xeg-gallery-container">
          <button id="inside-btn">Inside Button</button>
        </div>
      `;
    });

    afterEach(() => {
      document.body.innerHTML = '';
    });

    it('갤러리 외부 이벤트는 false', () => {
      const outside = document.querySelector('#outside') as HTMLElement;
      const event = new MouseEvent('click', { bubbles: true });
      Object.defineProperty(event, 'target', { value: outside, writable: false });

      expect(isGalleryInternalEvent(event)).toBe(false);
    });

    it('갤러리 내부 이벤트는 true', () => {
      const inside = document.querySelector('#inside-btn') as HTMLElement;
      const event = new MouseEvent('click', { bubbles: true });
      Object.defineProperty(event, 'target', { value: inside, writable: false });

      expect(isGalleryInternalEvent(event)).toBe(true);
    });
  });

  describe('shouldBlockGalleryEvent', () => {
    it('갤러리 내부 이벤트는 true (블록해야 함)', () => {
      document.body.innerHTML = '<div class="xeg-gallery-container"><div id="inner"></div></div>';
      const inner = document.querySelector('#inner') as HTMLElement;
      const event = new MouseEvent('click');
      Object.defineProperty(event, 'target', { value: inner, writable: false });

      expect(shouldBlockGalleryEvent(event)).toBe(true);
      document.body.innerHTML = '';
    });

    it('갤러리 외부 이벤트는 false (블록하지 않음)', () => {
      document.body.innerHTML = '<div id="outer"></div>';
      const outer = document.querySelector('#outer') as HTMLElement;
      const event = new MouseEvent('click');
      Object.defineProperty(event, 'target', { value: outer, writable: false });

      expect(shouldBlockGalleryEvent(event)).toBe(false);
      document.body.innerHTML = '';
    });
  });
});

describe('core-utils: 속성/스타일 유틸리티', () => {
  let testElement: HTMLDivElement;

  beforeEach(() => {
    testElement = document.createElement('div');
    testElement.id = 'test-element';
    testElement.setAttribute('data-test', 'initial');
    testElement.className = 'initial-class';
    document.body.appendChild(testElement);
  });

  afterEach(() => {
    testElement.remove();
  });

  describe('safeGetAttribute', () => {
    it('존재하는 속성 가져오기', () => {
      const value = safeGetAttribute(testElement, 'data-test');
      expect(value).toBe('initial');
    });

    it('존재하지 않는 속성은 null 반환', () => {
      const value = safeGetAttribute(testElement, 'non-existent');
      expect(value).toBeNull();
    });

    it('null 요소는 null 반환', () => {
      const value = safeGetAttribute(null, 'any-attr');
      expect(value).toBeNull();
    });
  });

  describe('safeSetAttribute', () => {
    it('속성 설정', () => {
      safeSetAttribute(testElement, 'data-new', 'new-value');
      expect(testElement.getAttribute('data-new')).toBe('new-value');
    });

    it('null 요소는 에러 없이 무시', () => {
      expect(() => safeSetAttribute(null, 'attr', 'value')).not.toThrow();
    });
  });

  describe('safeAddClass', () => {
    it('클래스 추가', () => {
      safeAddClass(testElement, 'new-class');
      expect(testElement.classList.contains('new-class')).toBe(true);
    });

    it('null 요소는 에러 없이 무시', () => {
      expect(() => safeAddClass(null, 'some-class')).not.toThrow();
    });
  });

  describe('safeRemoveClass', () => {
    it('클래스 제거', () => {
      testElement.classList.add('to-remove');
      safeRemoveClass(testElement, 'to-remove');
      expect(testElement.classList.contains('to-remove')).toBe(false);
    });

    it('null 요소는 에러 없이 무시', () => {
      expect(() => safeRemoveClass(null, 'some-class')).not.toThrow();
    });
  });

  describe('safeSetStyle', () => {
    it('스타일 설정', () => {
      safeSetStyle(testElement, { color: 'red', fontSize: '16px' });
      expect(testElement.style.color).toBe('red');
      expect(testElement.style.fontSize).toBe('16px');
    });

    it('null 요소는 에러 없이 무시', () => {
      expect(() => safeSetStyle(null, { color: 'blue' })).not.toThrow();
    });
  });

  describe('safeRemoveElement', () => {
    it('요소 제거', () => {
      const toRemove = document.createElement('div');
      document.body.appendChild(toRemove);

      safeRemoveElement(toRemove);
      expect(document.body.contains(toRemove)).toBe(false);
    });

    it('null 요소는 에러 없이 무시', () => {
      expect(() => safeRemoveElement(null)).not.toThrow();
    });

    it('부모가 없는 요소도 에러 없이 무시', () => {
      const orphan = document.createElement('div');
      expect(() => safeRemoveElement(orphan)).not.toThrow();
    });
  });
});

describe('core-utils: CSS 변수 유틸리티', () => {
  beforeEach(() => {
    // CSS 변수 초기화
    document.documentElement.style.removeProperty('--test-var');
    document.documentElement.style.removeProperty('--var-1');
    document.documentElement.style.removeProperty('--var-2');
  });

  describe('setCSSVariable', () => {
    it('documentElement에 CSS 변수 설정', () => {
      setCSSVariable('--test-var', '10px');
      const value = getComputedStyle(document.documentElement).getPropertyValue('--test-var');
      expect(value.trim()).toBe('10px');
    });

    it('특정 요소에 CSS 변수 설정', () => {
      const element = document.createElement('div');
      setCSSVariable('--custom-var', 'red', element);
      expect(element.style.getPropertyValue('--custom-var')).toBe('red');
    });
  });

  describe('setCSSVariables', () => {
    it('여러 CSS 변수 설정', () => {
      setCSSVariables({
        '--var-1': 'value1',
        '--var-2': 'value2',
      });

      expect(getComputedStyle(document.documentElement).getPropertyValue('--var-1').trim()).toBe(
        'value1'
      );
      expect(getComputedStyle(document.documentElement).getPropertyValue('--var-2').trim()).toBe(
        'value2'
      );
    });

    it('특정 요소에 여러 CSS 변수 설정', () => {
      const element = document.createElement('div');
      setCSSVariables({ '--a': '1', '--b': '2' }, element);

      expect(element.style.getPropertyValue('--a')).toBe('1');
      expect(element.style.getPropertyValue('--b')).toBe('2');
    });
  });
});

describe('core-utils: 스크롤 유틸리티', () => {
  describe('findScrollContainer', () => {
    beforeEach(() => {
      document.body.innerHTML = `
        <div id="scroll-parent" style="overflow-y: scroll; height: 100px;">
          <div id="child" style="height: 200px;">
            <div id="grandchild">Content</div>
          </div>
        </div>
        <div id="no-scroll">
          <div id="orphan-child">No scroll parent</div>
        </div>
      `;
    });

    afterEach(() => {
      document.body.innerHTML = '';
    });

    it('가장 가까운 스크롤 컨테이너 찾기', () => {
      const grandchild = document.querySelector('#grandchild') as HTMLElement;
      const scrollContainer = findScrollContainer(grandchild);
      expect(scrollContainer.id).toBe('scroll-parent');
    });

    it('스크롤 컨테이너가 없으면 documentElement 반환', () => {
      const orphan = document.querySelector('#orphan-child') as HTMLElement;
      const scrollContainer = findScrollContainer(orphan);
      expect(scrollContainer).toBe(document.documentElement);
    });
  });

  describe('findTwitterScrollContainer', () => {
    afterEach(() => {
      document.body.innerHTML = '';
    });

    it('[data-testid="primaryColumn"] 우선 검색', () => {
      document.body.innerHTML = '<div data-testid="primaryColumn" id="primary"></div>';
      const container = findTwitterScrollContainer();
      expect(container?.id).toBe('primary');
    });

    it('main[role="main"] 검색', () => {
      document.body.innerHTML = '<main role="main" id="main-content"></main>';
      const container = findTwitterScrollContainer();
      expect(container?.id).toBe('main-content');
    });

    it('컨테이너가 없으면 body 반환', () => {
      document.body.innerHTML = '<div>No Twitter container</div>';
      const container = findTwitterScrollContainer();
      expect(container).toBe(document.body);
    });
  });

  describe('safeSetScrollTop', () => {
    it('HTMLElement 스크롤 설정', () => {
      const element = document.createElement('div');
      element.style.overflow = 'scroll';
      element.style.height = '100px';
      element.innerHTML = '<div style="height: 300px;"></div>';
      document.body.appendChild(element);

      safeSetScrollTop(element, 50);
      expect(element.scrollTop).toBe(50);

      element.remove();
    });

    it('Window 스크롤 설정', () => {
      const scrollToSpy = vi.spyOn(window, 'scrollTo');
      safeSetScrollTop(window, 100);
      expect(scrollToSpy).toHaveBeenCalledWith({ top: 100, behavior: 'smooth' });
      scrollToSpy.mockRestore();
    });
  });

  describe('getCurrentScrollTop', () => {
    it('HTMLElement 스크롤 위치 가져오기', () => {
      const element = document.createElement('div');
      element.style.overflow = 'scroll';
      element.scrollTop = 75;

      const scrollTop = getCurrentScrollTop(element);
      expect(scrollTop).toBe(75);
    });

    it('Window 스크롤 위치 가져오기 (pageYOffset 우선)', () => {
      Object.defineProperty(window, 'pageYOffset', {
        value: 123,
        writable: true,
        configurable: true,
      });
      const scrollTop = getCurrentScrollTop(window);
      expect(scrollTop).toBe(123);
    });

    it('기본값은 window', () => {
      const scrollTop = getCurrentScrollTop();
      expect(typeof scrollTop).toBe('number');
    });
  });

  describe('ensureGalleryScrollAvailable', () => {
    it('null 요소는 무시', () => {
      expect(() => ensureGalleryScrollAvailable(null)).not.toThrow();
    });

    it('스크롤 가능한 요소에 overflow-y: auto 설정', () => {
      document.body.innerHTML = `
        <div id="gallery">
          <div data-xeg-role="items-list" id="items"></div>
          <div class="itemsList" id="items2"></div>
          <div class="content" id="content"></div>
        </div>
      `;

      const gallery = document.querySelector('#gallery') as HTMLElement;
      ensureGalleryScrollAvailable(gallery);

      const items = document.querySelector('#items') as HTMLElement;
      const items2 = document.querySelector('#items2') as HTMLElement;
      const content = document.querySelector('#content') as HTMLElement;

      expect(items.style.overflowY).toBe('auto');
      expect(items2.style.overflowY).toBe('auto');
      expect(content.style.overflowY).toBe('auto');

      document.body.innerHTML = '';
    });

    it('이미 overflow-y가 설정된 요소는 변경하지 않음', () => {
      document.body.innerHTML = `
        <div id="gallery">
          <div data-xeg-role="items-list" style="overflow-y: scroll;"></div>
        </div>
      `;

      const gallery = document.querySelector('#gallery') as HTMLElement;
      const items = gallery.querySelector('[data-xeg-role="items-list"]') as HTMLElement;

      ensureGalleryScrollAvailable(gallery);
      expect(items.style.overflowY).toBe('scroll');

      document.body.innerHTML = '';
    });
  });
});

describe('core-utils: Twitter URL 유틸리티', () => {
  describe('extractTweetInfoFromUrl', () => {
    it('twitter.com URL에서 username과 tweetId 추출', () => {
      const url = 'https://twitter.com/testuser/status/1234567890';
      const info = extractTweetInfoFromUrl(url);

      expect(info).toEqual({
        username: 'testuser',
        tweetId: '1234567890',
      });
    });

    it('x.com URL에서 username과 tweetId 추출', () => {
      const url = 'https://x.com/anotheruser/status/9876543210';
      const info = extractTweetInfoFromUrl(url);

      expect(info).toEqual({
        username: 'anotheruser',
        tweetId: '9876543210',
      });
    });

    it('빈 문자열은 null 반환', () => {
      const info = extractTweetInfoFromUrl('');
      expect(info).toBeNull();
    });

    it('Twitter URL이 아닌 경우 null 반환', () => {
      const info = extractTweetInfoFromUrl('https://example.com/page');
      expect(info).toBeNull();
    });

    it('status가 없는 URL은 null 반환', () => {
      const info = extractTweetInfoFromUrl('https://twitter.com/testuser');
      expect(info).toBeNull();
    });
  });
});

describe('core-utils: 배열 유틸리티', () => {
  describe('removeDuplicateStrings', () => {
    it('중복 제거', () => {
      const input = ['a', 'b', 'a', 'c', 'b', 'd'];
      const result = removeDuplicateStrings(input);
      expect(result).toEqual(['a', 'b', 'c', 'd']);
    });

    it('중복이 없으면 원본 순서 유지', () => {
      const input = ['x', 'y', 'z'];
      const result = removeDuplicateStrings(input);
      expect(result).toEqual(['x', 'y', 'z']);
    });

    it('빈 배열은 빈 배열 반환', () => {
      const result = removeDuplicateStrings([]);
      expect(result).toEqual([]);
    });

    it('readonly 배열도 처리 가능', () => {
      const input: readonly string[] = ['a', 'a', 'b'];
      const result = removeDuplicateStrings(input);
      expect(result).toEqual(['a', 'b']);
    });
  });
});
