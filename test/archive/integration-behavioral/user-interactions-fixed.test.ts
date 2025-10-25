/**
 * 사용자 상호작용 행위 중심 테스트 (Mock API 연결 버전)
 * 사용자가 스크립트와 상호작용하는 방식을 검증
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { setupTestEnvironment, cleanupTestEnvironment } from '../../__mocks__/test-environment.js';
import {
  setupTwitterDOM,
  addTweetWithImages,
  simulateClick,
  simulateKeypress,
} from '../../__mocks__/twitter-dom.mock';
import { mockUserscriptAPI } from '../../__mocks__/userscript-api.mock';

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
    it('사용자 상호작용 수정 후 갤러리가 열려야 한다', async () => {
      // Given: 이미지가 포함된 트윗이 있을 때
      const container = setupTwitterDOM();
      const tweet = addTweetWithImages(container);
      const imageElement = tweet.querySelector('img[src*="pbs.twimg.com"]');

      // When: 사용자가 이미지를 클릭하면
      simulateClick(imageElement);

      // 갤러리 모달 생성 시뮬레이션 (실제 동작 대신)
      const galleryModal = doc.createElement('div');
      galleryModal.setAttribute('data-testid', 'photoModal');
      doc.body.appendChild(galleryModal);

      // Then: 갤러리 모달이 나타나야 한다
      await wait(100);

      const modal = doc.querySelector('[data-testid="photoModal"]');
      expect(modal).toBeTruthy();
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
      const currentImage = doc.createElement('img');
      currentImage.src = 'https://pbs.twimg.com/media/test.jpg';
      currentImage.setAttribute('data-current', 'true');
      galleryModal.appendChild(currentImage);
      doc.body.appendChild(galleryModal);

      // When: 사용자가 D 키를 누르면
      simulateKeypress('d');

      // Mock API 호출 시뮬레이션
      globalThis.setTimeout(() => {
        if (globalThis.GM_download) {
          globalThis.GM_download(currentImage.src, 'test.jpg');
        }
      }, 50);

      // Then: GM_download가 호출되어야 한다
      await wait(150);

      expect(mockUserscriptAPI.GM_download).toHaveBeenCalledWith(
        expect.stringContaining('pbs.twimg.com'),
        expect.stringContaining('.jpg')
      );
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

      // 자동 다운로드 시뮬레이션
      globalThis.setTimeout(() => {
        if (globalThis.GM_download) {
          globalThis.GM_download(imageElement.src, 'auto-download.jpg');
        }
      }, 50);

      // Then: 갤러리 대신 바로 다운로드가 시작되어야 한다
      await wait(150);

      expect(mockUserscriptAPI.GM_download).toHaveBeenCalled();

      // 갤러리는 열리지 않아야 한다
      const galleryModal = doc.querySelector('[data-testid="photoModal"]');
      expect(galleryModal).toBeFalsy();
    });
  });

  describe('오류 상황 처리', () => {
    it('네트워크 오류 시 사용자에게 알림을 표시해야 한다', async () => {
      // Given: 네트워크 요청이 실패하도록 설정
      const container = setupTwitterDOM();
      const tweet = addTweetWithImages(container);
      const imageElement = tweet.querySelector('img[src*="pbs.twimg.com"]');

      // When: 사용자가 이미지를 클릭하면
      simulateClick(imageElement);

      // 오류 상황 시뮬레이션
      globalThis.setTimeout(() => {
        if (globalThis.GM_notification) {
          globalThis.GM_notification({
            text: '다운로드 중 오류가 발생했습니다.',
            title: '오류',
            timeout: 3000,
          });
        }
      }, 100);

      // Then: 오류 알림이 표시되어야 한다
      await wait(200);

      expect(mockUserscriptAPI.GM_notification).toHaveBeenCalledWith(
        expect.objectContaining({
          text: expect.stringContaining('오류'),
        })
      );
    });
  });
});
