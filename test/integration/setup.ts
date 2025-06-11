import '@testing-library/jest-dom/vitest';
import { vi } from 'vitest';
import type { MediaInfo } from '../../src/core/types/media.types';

// Global API 모킹
const mockFetch = vi.fn().mockResolvedValue({
  ok: true,
  status: 200,
  blob: () => Promise.resolve(new Blob(['mock data'])),
  json: () => Promise.resolve({}),
  text: () => Promise.resolve('mock text'),
});

const mockMatchMedia = vi.fn().mockImplementation((query: string) => ({
  matches: false,
  media: query,
  onchange: null,
  addListener: vi.fn(),
  removeListener: vi.fn(),
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
  dispatchEvent: vi.fn(),
}));

// Global과 window 모두에 설정
global.fetch = mockFetch;
global.matchMedia = mockMatchMedia;

// Window 객체가 있다면 거기에도 설정
if (typeof window !== 'undefined') {
  window.fetch = mockFetch;
  window.matchMedia = mockMatchMedia;
}

/**
 * 통합 테스트 설정 및 초기화
 *
 * @description 통합 테스트 실행을 위한 환경 설정과 공통 유틸리티를 제공합니다.
 * Feature-based 아키텍처에 맞춘 갤러리 컴포넌트 간의 상호작용을 테스트하기 위한 DOM 환경을 준비합니다.
 */

/**
 * 테스트용 미디어 데이터 생성
 */
export function createTestMediaData(): MediaInfo {
  return {
    id: 'test-media-1',
    type: 'image' as const,
    url: 'https://pbs.twimg.com/media/test.jpg',
    originalUrl: 'https://pbs.twimg.com/media/test.jpg?name=orig',
    thumbnailUrl: 'https://pbs.twimg.com/media/test.jpg?name=small',
    filename: 'test.jpg',
    width: 1200,
    height: 800,
    fileSize: 512000,
  };
}

/**
 * 여러 미디어 아이템 생성 (테스트용)
 */
export function createMockMediaItems(): MediaInfo[] {
  return [
    createTestMediaData(),
    {
      id: 'test-media-2',
      type: 'video' as const,
      url: 'https://video.twimg.com/tweet_video/test.mp4',
      originalUrl: 'https://video.twimg.com/tweet_video/test.mp4',
      thumbnailUrl: 'https://pbs.twimg.com/tweet_video_thumb/test.jpg',
      filename: 'test.mp4',
      width: 1280,
      height: 720,
      fileSize: 2048000,
    },
    {
      id: 'test-media-3',
      type: 'gif' as const,
      url: 'https://video.twimg.com/tweet_video/test.gif',
      originalUrl: 'https://video.twimg.com/tweet_video/test.gif',
      thumbnailUrl: 'https://pbs.twimg.com/tweet_video_thumb/test.jpg',
      filename: 'test.gif',
      width: 640,
      height: 480,
      fileSize: 1024000,
    },
  ];
}

/**
 * DOM 업데이트 대기 (Promise 기반)
 */
export function waitForDOMUpdate(timeout = 100): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, timeout));
}

/**
 * 비동기 작업 완료 대기 (Promise 기반)
 */
export function waitForAsyncOperations(timeout = 500): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, timeout));
}

/**
 * 테스트 환경을 위한 DOM 초기화
 * 갤러리 루트 컨테이너 생성 및 기본 스타일 설정
 */
export function setupTestEnvironment(): HTMLElement {
  // 기존 갤러리 루트 제거
  const existingRoot = document.getElementById('xeg-gallery-root');
  if (existingRoot) {
    existingRoot.remove();
  }

  // 새로운 갤러리 루트 생성
  const galleryRoot = document.createElement('div');
  galleryRoot.id = 'xeg-gallery-root';
  galleryRoot.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    z-index: 10000;
    background-color: rgba(0, 0, 0, 0.9);
    display: none;
  `;

  document.body.appendChild(galleryRoot);
  return galleryRoot;
}

/**
 * 테스트 후 환경 정리
 * DOM 요소 제거 및 이벤트 리스너 정리
 */
export function cleanupTestEnvironment(): void {
  // 갤러리 루트 제거
  const galleryRoot = document.getElementById('xeg-gallery-root');
  if (galleryRoot) {
    galleryRoot.remove();
  }

  // 추가적인 테스트 요소들 정리
  const testElements = document.querySelectorAll('[data-testid]');
  testElements.forEach(element => {
    if (element.parentNode) {
      element.parentNode.removeChild(element);
    }
  });
}

/**
 * 모킹된 미디어 크롤러 함수
 * 현재 트윗에서 미디어 정보 추출 시뮬레이션
 */
export function mockExtractMediaFromCurrentTweet(): MediaInfo[] {
  return createMockMediaItems();
}

/**
 * 모킹된 갤러리 초기화 함수
 * 실제 갤러리 초기화 프로세스 시뮬레이션
 */
export function mockInitializeGallery(): Promise<void> {
  return new Promise(resolve => {
    // 갤러리 컨테이너가 이미 존재하는지 확인
    let galleryRoot = document.getElementById('xeg-gallery-root');

    if (!galleryRoot) {
      galleryRoot = setupTestEnvironment();
    }

    // 갤러리 표시
    galleryRoot.style.display = 'block';

    setTimeout(() => {
      resolve();
    }, 10); // 최소한의 비동기 지연
  });
}

/**
 * 모킹된 트윗 컨테이너 생성
 * Twitter/X.com DOM 구조 시뮬레이션
 */
export function createMockTweetContainer(withMedia = true): HTMLElement {
  const container = document.createElement('div');
  container.setAttribute('data-testid', 'tweet');
  container.className = 'css-1dbjc4n r-1igl3o0 r-qklmqi r-1adg3ll r-1ny4l3l';

  // 상태 링크 추가 (트윗 ID 추출용)
  const statusLink = document.createElement('a');
  statusLink.href = 'https://x.com/testuser/status/1234567890123456789';
  statusLink.setAttribute('data-testid', 'tweet-status-link');
  container.appendChild(statusLink);

  if (withMedia) {
    // 미디어 컨테이너 추가
    const mediaContainer = document.createElement('div');
    mediaContainer.setAttribute('data-testid', 'tweet-media');

    // 이미지 추가
    const image = document.createElement('img');
    image.src = 'https://pbs.twimg.com/media/test.jpg';
    image.alt = 'Test image';
    image.setAttribute('data-testid', 'tweet-image');
    mediaContainer.appendChild(image);

    container.appendChild(mediaContainer);
  }

  return container;
}

/**
 * DOM 이벤트 시뮬레이션 헬퍼
 */
export function simulateClick(element: Element): void {
  try {
    if (typeof MouseEvent !== 'undefined') {
      const event = new MouseEvent('click', {
        bubbles: true,
        cancelable: true,
        // view 속성 제거 - jsdom에서 문제를 일으킬 수 있음
      });
      element.dispatchEvent(event);
    } else {
      // Fallback for environments without MouseEvent
      const event = document.createEvent('Event');
      event.initEvent('click', true, true);
      element.dispatchEvent(event);
    }
  } catch (error) {
    // 더 안전한 fallback
    if (element && 'click' in element && typeof (element as any).click === 'function') {
      (element as any).click();
    }
  }
}

/**
 * 키보드 이벤트 시뮬레이션 헬퍼
 */
export function simulateKeyPress(element: Element, key: string, code?: string): void {
  if (typeof KeyboardEvent !== 'undefined') {
    const event = new KeyboardEvent('keydown', {
      key,
      code: code || key,
      bubbles: true,
      cancelable: true,
    });
    element.dispatchEvent(event);
  }
}
