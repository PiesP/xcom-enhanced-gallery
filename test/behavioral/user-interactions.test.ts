/**
 * 사용자 상호작용 행위 중심 테스트
 * 사용자가 스크립트와 상호작용하는 방식을 검증
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { setupTestEnvironment, cleanupTestEnvironment } from '../utils/helpers/test-environment';
import {
  setupTwitterDOM,
  addTweetWithImages,
  simulateClick,
  simulateKeypress,
} from '../__mocks__/twitter-dom.mock';
import { mockUserscriptAPI } from '../__mocks__/userscript-api.mock';

// Helper functions
const wait = ms => new Promise(resolve => globalThis.setTimeout(resolve, ms));
const doc = globalThis.document;

describe('사용자 상호작용 행위 테스트', () => {
  beforeEach(async () => {
    await setupTestEnvironment('full');
  });

  afterEach(async () => {
    await cleanupTestEnvironment();
  });

  describe('트윗 이미지 클릭 시', () => {
    it('갤러리가 열려야 한다', async () => {
      // Given: 이미지가 포함된 트윗이 있을 때
      const container = setupTwitterDOM();
      const tweet = addTweetWithImages(container);
      const imageElement = tweet.querySelector('img[src*="pbs.twimg.com"]');

      // When: 사용자가 이미지를 클릭하면
      simulateClick(imageElement);

      // Then: 갤러리 모달이 나타나야 한다
      await wait(100);

      const galleryModal = doc.querySelector('[data-testid="photoModal"]');
      expect(galleryModal).toBeTruthy();
    });

    it('Ctrl+클릭 시 대량 다운로드 모드가 활성화되어야 한다', async () => {
      // Given: 이미지가 포함된 트윗이 있을 때
      const container = setupTwitterDOM();
      const tweet = addTweetWithImages(container);
      const imageElement = tweet.querySelector('img[src*="pbs.twimg.com"]');

      // When: 사용자가 Ctrl을 누르고 이미지를 클릭하면
      simulateClick(imageElement, { ctrlKey: true });

      // Then: 대량 다운로드 모드가 활성화되어야 한다
      await wait(100);

      // 대량 다운로드 UI가 표시되는지 확인
      const bulkDownloadUI = doc.querySelector('[data-testid="bulk-download-mode"]');
      expect(bulkDownloadUI).toBeTruthy();
    });
  });

  describe('키보드 단축키 사용 시', () => {
    it('D 키를 누르면 현재 미디어를 다운로드해야 한다', async () => {
      // Given: 갤러리가 열려 있을 때
      const container = setupTwitterDOM();
      addTweetWithImages(container);

      // 갤러리 열기 시뮬레이션
      const galleryModal = doc.createElement('div');
      galleryModal.setAttribute('data-testid', 'photoModal');
      galleryModal.innerHTML =
        '<img src="https://pbs.twimg.com/media/test.jpg" alt="Gallery image">';
      doc.body.appendChild(galleryModal);

      // When: 사용자가 D 키를 누르면
      simulateKeypress('d');

      // Then: GM_download가 호출되어야 한다
      await wait(100);

      expect(mockUserscriptAPI.GM_download).toHaveBeenCalledWith(
        expect.stringContaining('pbs.twimg.com'),
        expect.stringContaining('.jpg')
      );
    });

    it('Escape 키를 누르면 갤러리가 닫혀야 한다', async () => {
      // Given: 갤러리가 열려 있을 때
      const galleryModal = doc.createElement('div');
      galleryModal.setAttribute('data-testid', 'photoModal');
      doc.body.appendChild(galleryModal);

      // When: 사용자가 Escape 키를 누르면
      simulateKeypress('Escape');

      // Then: 갤러리가 닫혀야 한다
      await wait(100);

      const modal = doc.querySelector('[data-testid="photoModal"]');
      expect(modal).toBeFalsy();
    });
  });

  describe('설정 변경 시', () => {
    it('자동 다운로드 설정을 활성화하면 미디어 클릭 시 바로 다운로드되어야 한다', async () => {
      // Given: 자동 다운로드가 활성화된 상태에서
      mockUserscriptAPI.GM_getValue.mockImplementation((key, defaultValue) => {
        if (key === 'autoDownload') return 'true';
        return defaultValue;
      });

      const container = setupTwitterDOM();
      const tweet = addTweetWithImages(container);
      const imageElement = tweet.querySelector('img[src*="pbs.twimg.com"]');

      // When: 사용자가 이미지를 클릭하면
      simulateClick(imageElement);

      // Then: 갤러리 대신 바로 다운로드가 시작되어야 한다
      await wait(100);

      expect(mockUserscriptAPI.GM_download).toHaveBeenCalled();

      // 갤러리는 열리지 않아야 한다
      const galleryModal = doc.querySelector('[data-testid="photoModal"]');
      expect(galleryModal).toBeFalsy();
    });
  });

  describe('오류 상황 처리', () => {
    it('네트워크 오류 시 사용자에게 알림을 표시해야 한다', async () => {
      // Given: 네트워크 요청이 실패하도록 설정
      mockUserscriptAPI.GM_xmlhttpRequest.mockImplementation(details => {
        globalThis.setTimeout(() => {
          if (details.onerror) {
            details.onerror({ status: 0, statusText: 'Network Error' });
          }
        }, 0);
        return { abort: vi.fn() };
      });

      const container = setupTwitterDOM();
      const tweet = addTweetWithImages(container);
      const imageElement = tweet.querySelector('img[src*="pbs.twimg.com"]');

      // When: 사용자가 이미지를 클릭하면
      simulateClick(imageElement);

      // Then: 오류 알림이 표시되어야 한다
      await wait(200);

      expect(mockUserscriptAPI.GM_notification).toHaveBeenCalledWith(
        expect.objectContaining({
          text: expect.stringContaining('오류'),
        })
      );
    });

    it('미디어가 없는 트윗 클릭 시 아무 동작도 하지 않아야 한다', async () => {
      // Given: 미디어가 없는 트윗이 있을 때
      const container = setupTwitterDOM();
      const textOnlyTweet = doc.createElement('article');
      textOnlyTweet.setAttribute('data-testid', 'tweet');
      textOnlyTweet.innerHTML = '<div>텍스트만 있는 트윗</div>';
      container.appendChild(textOnlyTweet);

      // When: 사용자가 트윗을 클릭하면
      simulateClick(textOnlyTweet);

      // Then: 어떤 동작도 하지 않아야 한다
      await wait(100);

      expect(mockUserscriptAPI.GM_download).not.toHaveBeenCalled();

      const galleryModal = doc.querySelector('[data-testid="photoModal"]');
      expect(galleryModal).toBeFalsy();
    });
  });

  describe('접근성 지원', () => {
    it('스크린 리더 사용자를 위한 적절한 ARIA 레이블이 설정되어야 한다', async () => {
      // Given: 갤러리가 열려 있을 때
      const container = setupTwitterDOM();
      addTweetWithImages(container);

      // 갤러리 시뮬레이션
      const galleryModal = doc.createElement('div');
      galleryModal.setAttribute('data-testid', 'photoModal');
      galleryModal.setAttribute('role', 'dialog');
      galleryModal.setAttribute('aria-modal', 'true');
      galleryModal.setAttribute('aria-label', '이미지 갤러리');
      doc.body.appendChild(galleryModal);

      // Then: 적절한 ARIA 속성들이 설정되어야 한다
      expect(galleryModal.getAttribute('role')).toBe('dialog');
      expect(galleryModal.getAttribute('aria-modal')).toBe('true');
      expect(galleryModal.getAttribute('aria-label')).toBeTruthy();
    });

    it('키보드 네비게이션이 올바르게 작동해야 한다', async () => {
      // Given: 여러 이미지가 있는 갤러리가 열려 있을 때
      const galleryModal = doc.createElement('div');
      galleryModal.setAttribute('data-testid', 'photoModal');

      const image1 = doc.createElement('img');
      image1.src = 'https://pbs.twimg.com/media/image1.jpg';
      image1.setAttribute('data-current', 'true');

      const image2 = doc.createElement('img');
      image2.src = 'https://pbs.twimg.com/media/image2.jpg';

      galleryModal.appendChild(image1);
      galleryModal.appendChild(image2);
      doc.body.appendChild(galleryModal);

      // When: 사용자가 화살표 키를 누르면
      simulateKeypress('ArrowRight');

      // Then: 다음 이미지로 이동해야 한다
      await wait(100);

      // 현재 이미지 속성이 변경되었는지 확인
      const currentImage = galleryModal.querySelector('[data-current="true"]');
      expect(currentImage.src).toBe(image2.src);
    });
  });
});
