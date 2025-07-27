/**
 * @fileoverview 유틸리티 통합을 위한 테스트 코드
 * @description 단순화 작업 중 기능 무결성을 확인하기 위한 행위 중심 테스트
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { logger } from '@shared/logging/logger';

/**
 * 핵심 유틸리티 기능 검증
 */
describe('Phase 1: 유틸리티 통합 검증', () => {
  describe('핵심 DOM 유틸리티 기능', () => {
    it('safeQuerySelector는 안전하게 요소를 찾아야 한다', () => {
      // DOM 환경 설정
      document.body.innerHTML = '<div id="test">Test</div>';

      // 동적 import로 유틸리티 로드
      return import('@shared/utils').then(({ safeQuerySelector }) => {
        const element = safeQuerySelector('#test');
        expect(element).toBeTruthy();
        expect(element?.id).toBe('test');

        // 잘못된 선택자에 대해 null 반환
        const nullElement = safeQuerySelector('#nonexistent');
        expect(nullElement).toBeNull();
      });
    });

    it('isInsideGallery는 갤러리 요소를 정확히 감지해야 한다', () => {
      document.body.innerHTML = `
        <div class="xeg-gallery-container">
          <div id="gallery-child">Gallery Content</div>
        </div>
        <div id="outside">Outside Content</div>
      `;

      return import('@shared/utils').then(({ isInsideGallery }) => {
        const galleryChild = document.getElementById('gallery-child');
        const outsideElement = document.getElementById('outside');

        expect(isInsideGallery(galleryChild)).toBe(true);
        expect(isInsideGallery(outsideElement)).toBe(false);
      });
    });
  });

  describe('핵심 이벤트 시스템 기능', () => {
    let cleanupFunctions: (() => void)[] = [];

    afterEach(() => {
      // 각 테스트 후 이벤트 정리
      cleanupFunctions.forEach(cleanup => cleanup());
      cleanupFunctions = [];
    });

    it('addEventListenerManaged는 이벤트를 안전하게 관리해야 한다', async () => {
      const { addEventListenerManaged, removeEventListenerManaged } = await import('@shared/utils');

      let clickCount = 0;
      const handler = () => {
        clickCount++;
      };

      // DOM 요소 생성
      const button = document.createElement('button');
      document.body.appendChild(button);

      // 이벤트 등록
      const listenerId = addEventListenerManaged(button, 'click', handler);
      expect(typeof listenerId).toBe('string');

      // 이벤트 발생 테스트
      button.click();
      expect(clickCount).toBe(1);

      // 이벤트 제거
      const removed = removeEventListenerManaged(listenerId);
      expect(removed).toBe(true);

      // 제거 후 이벤트가 발생하지 않아야 함
      button.click();
      expect(clickCount).toBe(1);

      // 정리
      document.body.removeChild(button);
    });

    it('갤러리 이벤트 시스템이 올바르게 초기화되어야 한다', async () => {
      const { initializeGalleryEvents, cleanupGalleryEvents } = await import('@shared/utils');

      let mediaClickCount = 0;
      let galleryCloseCount = 0;

      const handlers = {
        onMediaClick: async () => {
          mediaClickCount++;
        },
        onGalleryClose: () => {
          galleryCloseCount++;
        },
        onKeyboardEvent: () => {
          /* 키보드 이벤트 */
        },
      };

      // 갤러리 이벤트 초기화
      await initializeGalleryEvents(handlers);

      // 정리 함수 등록
      cleanupFunctions.push(() => cleanupGalleryEvents());

      // 초기화 성공 확인 (예외 없이 완료되어야 함)
      expect(true).toBe(true);
    });
  });

  describe('성능 및 스타일 유틸리티', () => {
    it('combineClasses는 클래스를 올바르게 결합해야 한다', async () => {
      const { combineClasses } = await import('@shared/utils');

      const result = combineClasses('class1', 'class2', undefined, 'class3');
      expect(result).toBe('class1 class2 class3');

      // 빈 값들 처리
      const emptyResult = combineClasses('', null, undefined);
      expect(emptyResult).toBe('');
    });

    it('throttleScroll은 스크롤 이벤트를 제한해야 한다', async () => {
      const { throttleScroll } = await import('@shared/utils');

      let callCount = 0;
      const handler = () => {
        callCount++;
      };

      const throttledHandler = throttleScroll(handler);

      // 여러 번 빠르게 호출
      throttledHandler();
      throttledHandler();
      throttledHandler();

      // RAF 기반이므로 leading edge에서 호출되거나 다음 프레임에서 호출
      expect(callCount).toBeGreaterThanOrEqual(0);

      // 다음 프레임에서 호출 확인을 위한 Promise
      await new Promise(resolve => {
        requestAnimationFrame(() => {
          // throttle 메커니즘에 따라 1회 이상 호출되어야 함
          expect(callCount).toBeGreaterThan(0);
          resolve(undefined);
        });
      });
    });
  });

  describe('미디어 유틸리티', () => {
    it('미디어 URL 유틸리티가 올바르게 동작해야 한다', async () => {
      const { isValidMediaUrl, getHighQualityMediaUrl } = await import('@shared/utils/media');

      // 유효한 트위터 미디어 URL 테스트
      const validUrl = 'https://pbs.twimg.com/media/image.jpg';
      expect(isValidMediaUrl(validUrl)).toBe(true);

      // 무효한 URL 테스트
      const invalidUrl = 'https://example.com/image.jpg';
      expect(isValidMediaUrl(invalidUrl)).toBe(false);

      // 고화질 URL 변환 테스트 - large 품질로 변환
      const originalUrl = 'https://pbs.twimg.com/media/image.jpg?format=jpg&name=small';
      const highQualityUrl = getHighQualityMediaUrl(originalUrl);
      expect(highQualityUrl).toContain('large');
    });
  });

  describe('타입 안전성 헬퍼', () => {
    it('safeParseInt는 안전하게 정수를 파싱해야 한다', async () => {
      const { safeParseInt } = await import('@shared/utils');

      expect(safeParseInt('123')).toBe(123);
      expect(safeParseInt('invalid')).toBe(0);
      expect(safeParseInt('123.45')).toBe(123);
      expect(safeParseInt(null)).toBe(0);
      expect(safeParseInt(undefined)).toBe(0);
    });

    it('stringWithDefault는 기본값을 올바르게 제공해야 한다', async () => {
      const { stringWithDefault } = await import('@shared/utils');

      expect(stringWithDefault('test', 'default')).toBe('test');
      expect(stringWithDefault('', 'default')).toBe(''); // 빈 문자열은 유효한 값
      expect(stringWithDefault(null, 'default')).toBe('default');
      expect(stringWithDefault(undefined, 'default')).toBe('default');
    });
  });

  describe('리소스 관리', () => {
    it('createManagedTimer는 타이머를 안전하게 관리해야 한다', async () => {
      const { createManagedTimer, releaseResource } = await import('@shared/utils');

      let called = false;
      const callback = () => {
        called = true;
      };

      const id = createManagedTimer(callback, 0, 'test-context');
      expect(typeof id).toBe('string');

      // 타이머 정리
      const released = releaseResource(id);
      expect(released).toBe(true);
    });
  });
});

/**
 * 통합 후 무결성 검증
 */
describe('통합 작업 무결성 검증', () => {
  it('모든 핵심 export가 여전히 사용 가능해야 한다', async () => {
    const utils = await import('@shared/utils');

    // 핵심 함수들이 존재하는지 확인
    const requiredExports = [
      'safeQuerySelector',
      'isInsideGallery',
      'addEventListenerManaged',
      'initializeGalleryEvents',
      'combineClasses',
      'throttleScroll',
      'safeParseInt',
      'createManagedTimer',
    ];

    requiredExports.forEach(exportName => {
      expect(utils[exportName]).toBeDefined();
      expect(typeof utils[exportName]).toBe('function');
    });
  });

  it('중복 제거 후에도 기능이 정상 동작해야 한다', async () => {
    // 실제 갤러리 동작과 유사한 시나리오 테스트
    const { safeQuerySelector, isInsideGallery, addEventListenerManaged, combineClasses } =
      await import('@shared/utils');

    // DOM 설정
    document.body.innerHTML = `
      <div class="xeg-gallery-container">
        <button id="gallery-btn" class="btn">Gallery Button</button>
      </div>
    `;

    // 요소 찾기
    const button = safeQuerySelector('#gallery-btn');
    expect(button).toBeTruthy();

    // 갤러리 내부 확인
    expect(isInsideGallery(button)).toBe(true);

    // 클래스 결합
    const combinedClass = combineClasses('btn', 'active');
    expect(combinedClass).toBe('btn active');

    // 이벤트 관리
    let clicked = false;
    const listenerId = addEventListenerManaged(button!, 'click', () => {
      clicked = true;
    });

    button!.click();
    expect(clicked).toBe(true);
  });
});
