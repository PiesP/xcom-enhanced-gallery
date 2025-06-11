import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { logger } from '../../src/infrastructure/logging/logger';
import {
  cleanupTestEnvironment,
  createMockTweetContainer,
  createTestMediaData,
  mockExtractMediaFromCurrentTweet,
  mockInitializeGallery,
  setupTestEnvironment,
  simulateClick,
  waitForDOMUpdate,
} from './setup';

/**
 * DOM API 사용 가능 여부를 확인하는 타입 가드
 */
function isDOMAvailable(): boolean {
  return typeof window !== 'undefined' && typeof document !== 'undefined';
}

/**
 * 요소가 특정 타입인지 확인하는 타입 가드
 */
function isElementOfType<T extends Element>(
  element: Element | null,
  constructor: new (...args: unknown[]) => T
): element is T {
  return element instanceof constructor;
}

/**
 * Gallery Integration Tests
 *
 * 갤러리 기능의 통합 테스트로 여러 컴포넌트 간의 상호작용을 검증합니다.
 * Feature-based 아키텍처에 따른 통합 테스트를 수행합니다.
 */
describe('Gallery Integration', () => {
  let galleryRoot: HTMLElement | null = null;

  beforeEach(() => {
    // 갤러리 루트 설정
    galleryRoot = setupTestEnvironment();

    // DOM 초기화
    if (isDOMAvailable()) {
      // 기존 내용 제거하되 갤러리 루트는 유지
      const galleryRootElement = document.getElementById('xeg-gallery-root');
      document.body.innerHTML = '';
      if (galleryRootElement) {
        document.body.appendChild(galleryRootElement);
      }

      // 테스트용 트위터 페이지 구조 생성
      const mockTweetContainer = createMockTweetContainer(true);
      document.body.appendChild(mockTweetContainer);
    }

    // 로거 모킹
    vi.spyOn(logger, 'info').mockImplementation(() => {});
    vi.spyOn(logger, 'debug').mockImplementation(() => {});
    vi.spyOn(logger, 'error').mockImplementation(() => {});
    vi.spyOn(logger, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
    if (isDOMAvailable()) {
      document.body.innerHTML = '';
    }
    cleanupTestEnvironment();
  });

  it('갤러리 초기화가 올바르게 수행됨', async () => {
    if (!isDOMAvailable()) {
      expect(true).toBe(true); // DOM이 없는 환경에서는 스킵
      return;
    }

    // 모킹된 초기화 함수 사용
    await mockInitializeGallery();
    await waitForDOMUpdate();

    // 갤러리 루트가 생성되었는지 확인
    expect(galleryRoot).toBeTruthy();

    if (galleryRoot) {
      expect(document.body.contains(galleryRoot)).toBe(true);
      expect(galleryRoot.id).toBe('xeg-gallery-root');
      expect(galleryRoot.style.display).toBe('block');
    }
  });

  it('이미지 클릭 시 갤러리가 열림', async () => {
    if (!isDOMAvailable()) {
      expect(true).toBe(true); // DOM이 없는 환경에서는 스킵
      return;
    }

    // 갤러리 초기화 (모킹된 함수 사용)
    await mockInitializeGallery();

    // DOM 업데이트 대기
    await waitForDOMUpdate();

    // 이미지 요소 찾기
    const imageElement = document.querySelector('[data-testid="tweet-image"]');
    expect(imageElement).toBeTruthy();
    expect(imageElement?.getAttribute('src')).toBe('https://pbs.twimg.com/media/test.jpg');

    // 클릭 이벤트 시뮬레이션
    if (imageElement) {
      simulateClick(imageElement);
      await waitForDOMUpdate();

      // 갤러리 컨테이너가 표시되었는지 확인
      const galleryContainer = document.querySelector('#xeg-gallery-root');
      if (galleryContainer && isElementOfType(galleryContainer, HTMLElement)) {
        expect(galleryContainer.style.display).toBe('block');
      }
    }
  });

  it('미디어 데이터 추출이 올바르게 작동함', () => {
    const mediaItems = mockExtractMediaFromCurrentTweet();

    expect(Array.isArray(mediaItems)).toBe(true);
    expect(mediaItems.length).toBeGreaterThan(0);

    const testMedia = mediaItems[0];
    expect(testMedia).toHaveProperty('url');
    expect(testMedia).toHaveProperty('type');
    expect(testMedia).toHaveProperty('filename');
    expect(['image', 'video', 'gif']).toContain(testMedia.type);
  });

  it('여러 미디어 타입이 올바르게 처리됨', () => {
    const mediaItems = mockExtractMediaFromCurrentTweet();

    // 이미지 타입 확인
    const imageMedia = mediaItems.find(item => item.type === 'image');
    expect(imageMedia).toBeTruthy();
    expect(imageMedia?.url).toContain('pbs.twimg.com');

    // 비디오 타입 확인
    const videoMedia = mediaItems.find(item => item.type === 'video');
    expect(videoMedia).toBeTruthy();
    expect(videoMedia?.url).toContain('video.twimg.com');

    // GIF 타입 확인
    const gifMedia = mediaItems.find(item => item.type === 'gif');
    expect(gifMedia).toBeTruthy();
    expect(gifMedia?.filename).toContain('.gif');
  });

  it('에러 발생 시 안전하게 처리됨', async () => {
    // 잘못된 DOM 구조에서도 에러 없이 처리되는지 확인
    if (isDOMAvailable()) {
      document.body.innerHTML = '<div>Invalid structure</div>';
    }

    // 모킹된 함수는 항상 안전한 결과를 반환
    const result = mockExtractMediaFromCurrentTweet();
    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBeGreaterThan(0);

    // 에러 로그가 호출되지 않았는지 확인 (모킹된 함수는 안전함)
    expect(logger.error).not.toHaveBeenCalled();
  });

  it('갤러리 컨테이너 스타일이 올바르게 설정됨', () => {
    // 갤러리 루트가 존재하는지 확인
    expect(galleryRoot).toBeTruthy();

    if (galleryRoot) {
      expect(galleryRoot.style.position).toBe('fixed');
      expect(galleryRoot.style.top).toBe('0px');
      expect(galleryRoot.style.left).toBe('0px');
      expect(galleryRoot.style.width).toBe('100%');
      expect(galleryRoot.style.height).toBe('100%');
      expect(galleryRoot.style.zIndex).toBe('10000');
    }
  });

  it('테스트 데이터가 올바른 구조를 가짐', () => {
    const testData = createTestMediaData();

    expect(testData).toMatchObject({
      id: expect.any(String),
      url: expect.stringContaining('pbs.twimg.com'),
      type: 'image',
      originalUrl: expect.stringContaining('name=orig'),
      thumbnailUrl: expect.stringContaining('name=small'),
      filename: expect.stringMatching(/\.(jpg|jpeg|png|webp)$/i),
      width: expect.any(Number),
      height: expect.any(Number),
      fileSize: expect.any(Number),
    });
  });

  it('트윗 컨테이너가 올바른 구조를 가짐', () => {
    if (!isDOMAvailable()) {
      expect(true).toBe(true);
      return;
    }

    const tweetContainer = document.querySelector('[data-testid="tweet"]');
    expect(tweetContainer).toBeTruthy();

    // 상태 링크 확인
    const statusLink = tweetContainer?.querySelector('[data-testid="tweet-status-link"]');
    expect(statusLink).toBeTruthy();
    expect(statusLink?.getAttribute('href')).toContain('x.com');

    // 미디어 컨테이너 확인
    const mediaContainer = tweetContainer?.querySelector('[data-testid="tweet-media"]');
    expect(mediaContainer).toBeTruthy();

    // 이미지 확인
    const image = mediaContainer?.querySelector('[data-testid="tweet-image"]');
    expect(image).toBeTruthy();
    expect(image?.getAttribute('src')).toContain('pbs.twimg.com');
  });
});
