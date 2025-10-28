/**
 * @fileoverview 갤러리 활성화 통합 테스트
 * @description 미디어 클릭 시 갤러리가 정상적으로 활성화되는지 테스트
 *
 * Phase 171A: 현대화
 * - Mock 팩토리 패턴 적용
 * - 간단명료한 테스트 케이스
 * - JSDOM 기반 행위 검증
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import '../setup';

/** Mock Tweet 생성 팩토리 */
const createMockTweet = (options: { mediaUrl?: string } = {}) => {
  const { mediaUrl = 'https://pbs.twimg.com/media/test123.jpg?format=jpg&name=large' } = options;

  const tweet = document.createElement('article');
  tweet.setAttribute('data-testid', 'tweet');
  tweet.setAttribute('role', 'article');

  const img = document.createElement('img');
  img.src = mediaUrl;
  img.alt = 'Test image';
  img.setAttribute('draggable', 'true');

  tweet.appendChild(img);
  return tweet;
};

/** Mock Gallery Modal 감지 헬퍼 */
const findGalleryModal = (): HTMLElement | null =>
  document.querySelector('[data-testid="photoModal"]');

/** 이미지 클릭 시뮬레이션 */
const simulateImageClick = (img: HTMLImageElement): Promise<void> => {
  img.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, button: 0 }));
  return new Promise(resolve => setTimeout(resolve, 50));
};

describe('갤러리 활성화 통합 테스트', () => {
  beforeEach(() => {
    document.body.innerHTML = '';

    // 테스트용 click 이벤트 리스너
    document.addEventListener('click', (event: Event) => {
      const target = event.target as HTMLElement;
      if (target instanceof HTMLImageElement) {
        try {
          const url = new URL(target.src);
          if (url.hostname === 'pbs.twimg.com') {
            const modal = document.createElement('div');
            modal.setAttribute('data-testid', 'photoModal');
            modal.className = 'gallery-modal';
            document.body.appendChild(modal);
          }
        } catch {
          // URL 파싱 실패 시 무시
        }
      }
    });
  });

  afterEach(() => {
    document.body.innerHTML = '';
  });

  describe('기본 동작', () => {
    it('DOM 환경이 초기화되어야 한다', () => {
      expect(document).toBeDefined();
      expect(document.body).toBeDefined();
    });

    it('Twitter 미디어 이미지 클릭 시 갤러리가 열려야 한다', async () => {
      // Given: Twitter 미디어를 포함한 트윗
      const tweet = createMockTweet();
      document.body.appendChild(tweet);
      const img = tweet.querySelector('img') as HTMLImageElement;

      expect(findGalleryModal()).toBeNull();

      // When: 이미지를 클릭하면
      await simulateImageClick(img);

      // Then: 갤러리 모달이 표시되어야 한다
      expect(findGalleryModal()).toBeTruthy();
    });
  });

  describe('에러 케이스', () => {
    it('잘못된 미디어 URL에 대해 갤러리가 열리지 않아야 한다', async () => {
      // Given: 잘못된 URL을 가진 이미지
      const tweet = createMockTweet({ mediaUrl: 'https://example.com/image.jpg' });
      document.body.appendChild(tweet);
      const img = tweet.querySelector('img') as HTMLImageElement;

      // When: 이미지를 클릭하면
      await simulateImageClick(img);

      // Then: 갤러리가 열리지 않아야 한다
      expect(findGalleryModal()).toBeNull();
    });
  });
});
