/**
 * Mock Action Simulator
 * 테스트에서 실제 애플리케이션 동작을 시뮬레이션하는 헬퍼
 */

import { mockUserscriptAPI, mockApiState } from '../../__mocks__/userscript-api.mock.js';

/**
 * Mock API 상태 설정
 */
export function enableAutoDownload() {
  mockApiState.isAutoDownloadEnabled = true;
}

export function disableAutoDownload() {
  mockApiState.isAutoDownloadEnabled = false;
}

/**
 * 다운로드 액션 시뮬레이션
 * 실제 애플리케이션에서 다운로드가 트리거될 때의 동작을 모방
 */
export function simulateDownloadAction(imageUrl, filename) {
  // 실제 애플리케이션에서 일어나는 다운로드 로직 시뮬레이션
  globalThis.setTimeout(() => {
    // GM_download 호출 시뮬레이션
    if (globalThis.GM_download && typeof globalThis.GM_download === 'function') {
      globalThis.GM_download(imageUrl, filename);
    }
  }, 50);
}

/**
 * 알림 액션 시뮬레이션
 * 실제 애플리케이션에서 알림이 트리거될 때의 동작을 모방
 */
export function simulateNotificationAction(options) {
  globalThis.setTimeout(() => {
    if (globalThis.GM_notification && typeof globalThis.GM_notification === 'function') {
      globalThis.GM_notification(options);
    }
  }, 50);
}

/**
 * 클릭 이벤트 시뮬레이션
 */
export function simulateClick(element, options = {}) {
  if (!element) return;

  const event = new globalThis.MouseEvent('click', {
    bubbles: true,
    cancelable: true,
    button: 0,
    ctrlKey: options.ctrlKey || false,
    shiftKey: options.shiftKey || false,
    altKey: options.altKey || false,
    metaKey: options.metaKey || false,
    ...options,
  });

  element.dispatchEvent(event);
}

/**
 * 키보드 이벤트 시뮬레이션 (다운로드 트리거 포함)
 */
export function simulateKeyboardDownload(key, imageElement) {
  if (key === 'd' || key === 'D') {
    // 현재 활성 이미지 찾기
    const currentImage =
      imageElement ||
      globalThis.document.querySelector('[data-current="true"]') ||
      globalThis.document.querySelector('img[src*="pbs.twimg.com"]');

    if (currentImage && currentImage.src) {
      const filename = extractFilenameFromUrl(currentImage.src);
      simulateDownloadAction(currentImage.src, filename);
    }
  }
}

/**
 * 자동 다운로드 설정 기반 다운로드 시뮬레이션
 */
export function simulateAutoDownload(imageElement) {
  if (mockApiState.isAutoDownloadEnabled) {
    const filename = extractFilenameFromUrl(imageElement.src);
    simulateDownloadAction(imageElement.src, filename);
    return true; // 다운로드가 실행됨을 표시
  }
  return false;
}

/**
 * 대량 다운로드 시뮬레이션
 */
export function simulateBulkDownload(imageElements) {
  imageElements.forEach((img, index) => {
    globalThis.setTimeout(() => {
      const filename = extractFilenameFromUrl(img.src);
      simulateDownloadAction(img.src, filename);
    }, index * 100); // 연속 다운로드 시뮬레이션
  });
}

/**
 * 오류 상황 시뮬레이션
 */
export function simulateNetworkError() {
  globalThis.setTimeout(() => {
    simulateNotificationAction({
      text: '다운로드 중 오류가 발생했습니다.',
      title: '오류',
      timeout: 3000,
    });
  }, 100);
}

/**
 * 진행률 업데이트 시뮬레이션
 */
export function simulateProgressUpdate(progressElement, targetPercent = 100) {
  let currentPercent = 0;
  const interval = globalThis.setInterval(() => {
    currentPercent += 20;
    if (progressElement) {
      progressElement.textContent = `${currentPercent}%`;
    }

    if (currentPercent >= targetPercent) {
      globalThis.clearInterval(interval);
    }
  }, 100);
}

/**
 * URL에서 파일명 추출 헬퍼
 */
function extractFilenameFromUrl(url) {
  try {
    const urlObj = new globalThis.URL(url);
    const pathname = urlObj.pathname;
    const filename = pathname.split('/').pop() || 'image.jpg';
    return filename.includes('.') ? filename : `${filename}.jpg`;
  } catch {
    return 'image.jpg';
  }
}

/**
 * Mock API 상태 확인 헬퍼
 */
export function getMockApiCallCount(apiName) {
  const mockFunction = mockUserscriptAPI[apiName];
  return mockFunction && mockFunction.mock ? mockFunction.mock.calls.length : 0;
}

/**
 * Mock API 호출 인자 확인 헬퍼
 */
export function getMockApiCallArgs(apiName, callIndex = 0) {
  const mockFunction = mockUserscriptAPI[apiName];
  return mockFunction && mockFunction.mock && mockFunction.mock.calls[callIndex]
    ? mockFunction.mock.calls[callIndex]
    : null;
}

/**
 * 키보드 이벤트 시뮬레이션
 */
export function simulateKeypress(key, options = {}) {
  const keyEvent = new globalThis.KeyboardEvent('keydown', {
    key,
    bubbles: true,
    cancelable: true,
    ctrlKey: options.ctrlKey || false,
    shiftKey: options.shiftKey || false,
    altKey: options.altKey || false,
    metaKey: options.metaKey || false,
    ...options,
  });

  globalThis.document.dispatchEvent(keyEvent);

  // 특정 키에 대한 특별한 처리
  if (key === 'd' || key === 'D') {
    simulateKeyboardDownload(key);
  }
}
