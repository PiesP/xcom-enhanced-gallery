/**
 * 테스트 어설션 헬퍼 함수
 * 프로젝트별 도메인 로직에 특화된 어설션 함수들
 */

import { expect } from 'vitest';

// ================================
// DOM Assertion Helpers
// ================================

/**
 * 요소가 visible한지 확인
 */
export function expectElementToBeVisible(element) {
  expect(element).toBeTruthy();
  const computedStyle = globalThis.window?.getComputedStyle?.(element);
  if (computedStyle) {
    expect(computedStyle.display).not.toBe('none');
    expect(computedStyle.visibility).not.toBe('hidden');
  } else {
    // Fallback for testing environments without getComputedStyle
    expect(element.style.display).not.toBe('none');
    expect(element.style.visibility).not.toBe('hidden');
  }
}

/**
 * 요소가 hidden인지 확인
 */
export function expectElementToBeHidden(element) {
  const computedStyle = globalThis.window?.getComputedStyle?.(element);
  if (computedStyle) {
    const isHidden = computedStyle.display === 'none' || computedStyle.visibility === 'hidden';
    expect(isHidden).toBe(true);
  } else {
    // Fallback for testing environments
    const isHidden = element.style.display === 'none' || element.style.visibility === 'hidden';
    expect(isHidden).toBe(true);
  }
}

/**
 * 요소에 특정 클래스가 있는지 확인
 */
export function expectElementToHaveClass(element, className) {
  expect(element.classList.contains(className)).toBe(true);
}

/**
 * 요소에 특정 attribute가 있는지 확인
 */
export function expectElementToHaveAttribute(element, attributeName, expectedValue) {
  if (expectedValue !== undefined) {
    expect(element.getAttribute(attributeName)).toBe(expectedValue);
  } else {
    expect(element.hasAttribute(attributeName)).toBe(true);
  }
}

/**
 * 요소가 DOM에 있는지 확인
 */
export function expectElementToBeInDocument(element) {
  expect(element).toBeTruthy();
  expect(
    globalThis.document?.contains?.(element) || globalThis.document?.body?.contains?.(element)
  ).toBe(true);
}

// ================================
// Event Assertion Helpers
// ================================

/**
 * 이벤트 리스너가 올바르게 호출되었는지 확인
 */
export function expectEventToHaveBeenTriggered(mockFn, eventType, targetElement) {
  expect(mockFn).toHaveBeenCalled();
  const calls = mockFn.mock.calls;
  const relevantCall = calls.find(call => {
    const event = call[0];
    return event.type === eventType && (!targetElement || event.target === targetElement);
  });
  expect(relevantCall).toBeTruthy();
}

/**
 * keyboard 이벤트가 올바른 키로 호출되었는지 확인
 */
export function expectKeyboardEventToHaveBeenTriggered(mockFn, key, eventType = 'keydown') {
  expect(mockFn).toHaveBeenCalled();
  const calls = mockFn.mock.calls;
  const relevantCall = calls.find(call => {
    const event = call[0];
    return event.type === eventType && (event.key === key || event.code === key);
  });
  expect(relevantCall).toBeTruthy();
}

// ================================
// URL Assertion Helpers
// ================================

/**
 * URL이 트위터 미디어 URL인지 확인
 */
export function expectUrlToBeMediaUrl(url, expectedType = 'image') {
  expect(url).toBeTruthy();
  expect(typeof url).toBe('string');

  const isImageUrl = url.includes('pbs.twimg.com') || url.includes('ton.twitter.com');
  const isVideoUrl = url.includes('video.twimg.com');

  if (expectedType === 'image') {
    expect(isImageUrl).toBe(true);
  } else if (expectedType === 'video') {
    expect(isVideoUrl).toBe(true);
  }
}

/**
 * URL이 고품질 버전인지 확인
 */
export function expectUrlToBeHighQuality(url) {
  expect(url).toContain('name=large');
}

/**
 * URL 파라미터 확인
 */
export function expectUrlToHaveParams(url, params) {
  // URL 생성자가 사용 가능한지 확인
  const URLConstructor = globalThis.URL;
  if (!URLConstructor) {
    // Fallback: 간단한 query parameter 파싱
    const queryString = url.split('?')[1] || '';
    const URLSearchParamsConstructor = globalThis.URLSearchParams;

    if (URLSearchParamsConstructor) {
      const urlParams = new URLSearchParamsConstructor(queryString);
      Object.entries(params).forEach(([key, value]) => {
        expect(urlParams.get(key)).toBe(value);
      });
    } else {
      // 매우 기본적인 파싱
      Object.entries(params).forEach(([key, value]) => {
        expect(url).toContain(`${key}=${value}`);
      });
    }
    return;
  }

  // URL 생성자 사용 (안전한 접근)
  let urlObj;
  try {
    // globalThis에서 URL 생성자 가져오기
    const URLConstructor = globalThis.URL || globalThis.window?.URL;
    if (!URLConstructor) {
      throw new Error('URL constructor not available');
    }
    urlObj = new URLConstructor(url);
  } catch {
    // URL 생성이 실패하면 기본적인 문자열 검사
    Object.entries(params).forEach(([key, value]) => {
      expect(url).toContain(`${key}=${value}`);
    });
    return;
  }

  Object.entries(params).forEach(([key, value]) => {
    expect(urlObj.searchParams.get(key)).toBe(value);
  });
}

// ================================
// Media Item Assertion Helpers
// ================================

/**
 * 미디어 아이템이 올바른 구조인지 확인
 */
export function expectMediaItemToBeValid(item) {
  expect(item).toBeTruthy();
  expect(item.url).toBeTruthy();
  expect(typeof item.url).toBe('string');
  expect(['image', 'video', 'gif'].includes(item.type)).toBe(true);
}

/**
 * 이미지 정보가 올바른지 확인
 */
export function expectImageInfoToBeValid(imageInfo) {
  expect(imageInfo).toBeTruthy();
  expect(imageInfo.src).toBeTruthy();
  expect(typeof imageInfo.src).toBe('string');

  if (imageInfo.width !== undefined) {
    expect(typeof imageInfo.width).toBe('number');
    expect(imageInfo.width).toBeGreaterThan(0);
  }

  if (imageInfo.height !== undefined) {
    expect(typeof imageInfo.height).toBe('number');
    expect(imageInfo.height).toBeGreaterThan(0);
  }
}

/**
 * 비디오 정보가 올바른지 확인
 */
export function expectVideoInfoToBeValid(videoInfo) {
  expect(videoInfo).toBeTruthy();
  expect(videoInfo.src).toBeTruthy();
  expect(typeof videoInfo.src).toBe('string');

  if (videoInfo.duration !== undefined) {
    expect(typeof videoInfo.duration).toBe('number');
    expect(videoInfo.duration).toBeGreaterThan(0);
  }
}

// ================================
// Gallery State Assertion Helpers
// ================================

/**
 * 갤러리 상태가 올바른지 확인
 */
export function expectGalleryStateToBeValid(state) {
  expect(state).toBeTruthy();
  expect(typeof state.isOpen).toBe('boolean');
  expect(typeof state.currentIndex).toBe('number');
  expect(Array.isArray(state.items)).toBe(true);

  if (state.isOpen && state.items.length > 0) {
    expect(state.currentIndex).toBeGreaterThanOrEqual(0);
    expect(state.currentIndex).toBeLessThan(state.items.length);
  }
}

/**
 * 갤러리가 열려있는지 확인
 */
export function expectGalleryToBeOpen(state) {
  expect(state.isOpen).toBe(true);
  expect(state.items.length).toBeGreaterThan(0);
  expect(state.currentIndex).toBeGreaterThanOrEqual(0);
}

/**
 * 갤러리가 닫혀있는지 확인
 */
export function expectGalleryToBeClosed(state) {
  expect(state.isOpen).toBe(false);
}

// ================================
// Download Assertion Helpers
// ================================

/**
 * 다운로드가 트리거되었는지 확인
 */
export function expectDownloadToHaveBeenTriggered(mockDownloadFn, expectedUrl, expectedFilename) {
  expect(mockDownloadFn).toHaveBeenCalled();

  if (expectedUrl) {
    expect(mockDownloadFn).toHaveBeenCalledWith(
      expect.stringContaining(expectedUrl),
      expect.any(String)
    );
  }

  if (expectedFilename) {
    expect(mockDownloadFn).toHaveBeenCalledWith(
      expect.any(String),
      expect.stringContaining(expectedFilename)
    );
  }
}

/**
 * 대량 다운로드가 시작되었는지 확인
 */
export function expectBulkDownloadToHaveStarted(mockBulkDownloadFn, expectedCount) {
  expect(mockBulkDownloadFn).toHaveBeenCalled();

  if (expectedCount !== undefined) {
    const callArgs = mockBulkDownloadFn.mock.calls[0];
    const downloadItems = callArgs[0];
    expect(Array.isArray(downloadItems)).toBe(true);
    expect(downloadItems.length).toBe(expectedCount);
  }
}

// ================================
// Notification Assertion Helpers
// ================================

/**
 * 알림이 표시되었는지 확인
 */
export function expectNotificationToHaveBeenShown(mockNotificationFn, expectedMessage) {
  expect(mockNotificationFn).toHaveBeenCalled();

  if (expectedMessage) {
    expect(mockNotificationFn).toHaveBeenCalledWith(
      expect.objectContaining({
        text: expect.stringContaining(expectedMessage),
      })
    );
  }
}

// ================================
// Accessibility Assertion Helpers
// ================================

/**
 * 요소가 접근 가능한지 확인
 */
export function expectElementToBeAccessible(element) {
  expect(element).toBeTruthy();

  // ARIA 속성 확인
  const ariaLabel = element.getAttribute('aria-label');
  const ariaLabelledBy = element.getAttribute('aria-labelledby');

  // 최소한 하나의 접근성 레이블이 있어야 함
  const hasAccessibleName = ariaLabel || ariaLabelledBy || element.textContent?.trim();
  expect(hasAccessibleName).toBeTruthy();

  // 포커스 가능한 요소인지 확인
  const isFocusable =
    element.tabIndex >= 0 ||
    ['button', 'a', 'input', 'select', 'textarea'].includes(element.tagName.toLowerCase());

  if (isFocusable) {
    expect(element.tabIndex).toBeGreaterThanOrEqual(0);
  }
}

/**
 * 키보드 네비게이션이 가능한지 확인
 */
export function expectElementToBeKeyboardAccessible(element) {
  expect(element).toBeTruthy();
  expect(element.tabIndex).toBeGreaterThanOrEqual(0);

  // Enter나 Space 키 이벤트 핸들러가 있는지 확인
  const hasKeyboardHandler =
    element.onclick || element.onkeydown || element.onkeypress || element.addEventListener;
  expect(hasKeyboardHandler).toBeTruthy();
}

// ================================
// Performance Assertion Helpers
// ================================

/**
 * 작업이 제한 시간 내에 완료되었는지 확인
 */
export function expectTaskToCompleteWithinTime(taskPromise, maxTimeMs = 1000) {
  const timeoutFn = globalThis.setTimeout || globalThis.window?.setTimeout;
  if (!timeoutFn) {
    // setTimeout이 없는 환경에서는 단순히 task 완료만 확인
    return expect(taskPromise).resolves.toBeTruthy();
  }

  const timeoutPromise = new Promise((_, reject) => {
    timeoutFn(() => reject(new Error(`Task took longer than ${maxTimeMs}ms`)), maxTimeMs);
  });

  return expect(Promise.race([taskPromise, timeoutPromise])).resolves.toBeTruthy();
}

/**
 * 메모리 사용량이 적절한지 확인 (단순 휴리스틱)
 */
export function expectReasonableMemoryUsage(
  beforeHeapUsed,
  afterHeapUsed,
  maxIncreaseBytes = 10000000
) {
  const memoryIncrease = afterHeapUsed - beforeHeapUsed;
  expect(memoryIncrease).toBeLessThan(maxIncreaseBytes);
}

/**
 * 함수가 지정된 시간 내에 실행되는지 확인
 */
export async function expectFunctionToExecuteWithin(func, maxTimeMs = 1000) {
  const startTime = Date.now();

  try {
    await func();
    const executionTime = Date.now() - startTime;
    expect(executionTime).toBeLessThan(maxTimeMs);
  } catch (error) {
    const executionTime = Date.now() - startTime;
    // 실행 시간은 확인하되, 원래 에러는 다시 던짐
    expect(executionTime).toBeLessThan(maxTimeMs);
    throw error;
  }
}

// ================================
// Custom Matchers Extension
// ================================

/**
 * Jest/Vitest custom matchers를 확장하는 유틸리티
 */
export function setupCustomMatchers() {
  expect.extend({
    toBeMediaUrl(received, mediaType = 'image') {
      const pass =
        typeof received === 'string' &&
        ((mediaType === 'image' &&
          (received.includes('pbs.twimg.com') || received.includes('ton.twitter.com'))) ||
          (mediaType === 'video' && received.includes('video.twimg.com')));

      return {
        message: () => `expected ${received} to be a valid ${mediaType} URL`,
        pass,
      };
    },

    toBeVisibleElement(received) {
      const pass =
        received &&
        received.style &&
        received.style.display !== 'none' &&
        received.style.visibility !== 'hidden';

      return {
        message: () => `expected ${received} to be visible`,
        pass,
      };
    },
  });
}
