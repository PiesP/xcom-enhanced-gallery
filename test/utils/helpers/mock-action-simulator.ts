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
 */
export function simulateDownloadAction(imageUrl: string, filename: string) {
  globalThis.setTimeout(() => {
    if ((globalThis as any).GM_download && typeof (globalThis as any).GM_download === 'function') {
      (globalThis as any).GM_download(imageUrl, filename);
    }
  }, 50);
}

/**
 * 알림 액션 시뮬레이션
 */
export function simulateNotificationAction(options: Record<string, unknown>) {
  if (
    (globalThis as any).GM_notification &&
    typeof (globalThis as any).GM_notification === 'function'
  ) {
    (globalThis as any).GM_notification(options);
  }
}

/**
 * 클릭 이벤트 시뮬레이션
 */
export function simulateClick(
  element: HTMLElement,
  options: {
    ctrlKey?: boolean;
    shiftKey?: boolean;
    altKey?: boolean;
    metaKey?: boolean;
  } = {}
) {
  const event = new MouseEvent('click', {
    bubbles: true,
    cancelable: true,
    view: globalThis as any,
    ctrlKey: options.ctrlKey || false,
    shiftKey: options.shiftKey || false,
    altKey: options.altKey || false,
    metaKey: options.metaKey || false,
  });

  element.dispatchEvent(event);
}

/**
 * 키보드 이벤트 시뮬레이션 (다운로드 트리거 포함)
 */
export function simulateKeyboardDownload(key: string, imageElement: HTMLElement | null) {
  if (key === 'd' || key === 'D') {
    // 현재 활성 이미지 찾기
    const currentImage =
      imageElement ||
      globalThis.document.querySelector('[data-current="true"]') ||
      globalThis.document.querySelector('img[src*="pbs.twimg.com"]');

    if (currentImage && (currentImage as HTMLImageElement).src) {
      const filename = extractFilenameFromUrl((currentImage as HTMLImageElement).src);
      simulateDownloadAction((currentImage as HTMLImageElement).src, filename);
    }
  }
}

/**
 * 자동 다운로드 설정 기반 다운로드 시뮬레이션
 */
export function simulateAutoDownload(imageElement: HTMLImageElement) {
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
export function simulateBulkDownload(imageElements: HTMLImageElement[]) {
  imageElements.forEach((img: HTMLImageElement, index: number) => {
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
 * CI 캐시 갱신을 위한 수정
 */
export function simulateProgressUpdate(progressElement: HTMLElement | null, targetPercent = 100) {
  let currentPercent = 0;
  const incrementStep = 20;
  const interval = globalThis.setInterval(() => {
    currentPercent += incrementStep;

    // 목표값을 초과하지 않도록 제한
    if (currentPercent >= targetPercent) {
      currentPercent = targetPercent;
      if (progressElement) {
        progressElement.textContent = `${currentPercent}%`;
      }
      globalThis.clearInterval(interval);
    } else {
      if (progressElement) {
        progressElement.textContent = `${currentPercent}%`;
      }
    }
  }, 50);
}

/**
 * URL에서 파일명 추출 헬퍼
 */
function extractFilenameFromUrl(url: string): string {
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
export function getMockApiCallCount(apiName: string): number {
  const mockFunction = mockUserscriptAPI[apiName as keyof typeof mockUserscriptAPI];
  return mockFunction && (mockFunction as any).mock ? (mockFunction as any).mock.calls.length : 0;
}

/**
 * Mock API 호출 인자 확인 헬퍼
 */
export function getMockApiCallArgs(apiName: string, callIndex = 0): any[] | null {
  const mockFunction = mockUserscriptAPI[apiName as keyof typeof mockUserscriptAPI];
  return mockFunction && (mockFunction as any).mock && (mockFunction as any).mock.calls[callIndex]
    ? (mockFunction as any).mock.calls[callIndex]
    : null;
}

/**
 * 키보드 이벤트 시뮬레이션
 */
export function simulateKeypress(
  key: string,
  options: {
    ctrlKey?: boolean;
    shiftKey?: boolean;
    altKey?: boolean;
    metaKey?: boolean;
  } = {}
) {
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
    simulateKeyboardDownload(key, null);
  }
}
