/**
 * 전체 워크플로우 통합 테스트
 * 사용자의 완전한 사용 시나리오를 검증
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { setupTestEnvironment, cleanupTestEnvironment } from '../../utils/helpers/test-environment';
import {
  setupTwitterDOM,
  addTweetWithImages,
  addTweetWithVideo,
  simulateClick,
  simulateKeypress,
} from '../../__mocks__/twitter-dom.mock';
import { mockUserscriptAPI, setMockStorageValue } from '../../__mocks__/userscript-api.mock';

// Helper
const wait = ms => new Promise(resolve => globalThis.setTimeout(resolve, ms));
const doc = globalThis.document;

describe('전체 워크플로우 통합 테스트', () => {
  beforeEach(async () => {
    await setupTestEnvironment('full');
  });

  afterEach(async () => {
    await cleanupTestEnvironment();
  });

  describe('기본 이미지 다운로드 워크플로우', () => {
    it('사용자가 트윗 이미지를 클릭하여 갤러리를 열고 다운로드까지 완료해야 한다', async () => {
      // Given: 이미지가 포함된 트윗이 있고, 설정이 올바르게 되어 있을 때
      setMockStorageValue('downloadPath', '/test/downloads');
      setMockStorageValue('autoDownload', 'false');

      const container = setupTwitterDOM();
      const tweet = addTweetWithImages(container);
      const imageElement = tweet.querySelector('img[src*="pbs.twimg.com"]');

      // When: 사용자가 이미지를 클릭하면
      simulateClick(imageElement);
      await wait(100);

      // Then: 갤러리가 열려야 한다
      const galleryModal = doc.querySelector('[data-testid="photoModal"]');
      expect(galleryModal).toBeTruthy();

      // When: 사용자가 D키를 눌러 다운로드하면
      simulateKeypress('d');
      await wait(100);

      // Then: 다운로드가 시작되어야 한다
      expect(mockUserscriptAPI.GM_download).toHaveBeenCalledWith(
        expect.stringContaining('pbs.twimg.com'),
        expect.stringContaining('.jpg')
      );

      // And: 성공 알림이 표시되어야 한다
      expect(mockUserscriptAPI.GM_notification).toHaveBeenCalledWith(
        expect.objectContaining({
          text: expect.stringContaining('다운로드'),
        })
      );
    });
  });

  describe('대량 다운로드 워크플로우', () => {
    it('사용자가 여러 트윗을 선택하여 일괄 다운로드해야 한다', async () => {
      // Given: 여러 이미지 트윗들이 있을 때
      const container = setupTwitterDOM();
      const tweet1 = addTweetWithImages(container, 'tweet-1');
      const tweet2 = addTweetWithImages(container, 'tweet-2');

      const image1 = tweet1.querySelector('img[src*="pbs.twimg.com"]');
      const image2 = tweet2.querySelector('img[src*="pbs.twimg.com"]');

      // When: 사용자가 Ctrl+클릭으로 첫 번째 이미지를 선택하면
      simulateClick(image1, { ctrlKey: true });
      await wait(100);

      // Then: 대량 다운로드 모드가 활성화되어야 한다
      const bulkMode = doc.querySelector('[data-testid="bulk-download-mode"]');
      expect(bulkMode).toBeTruthy();

      // When: 두 번째 이미지도 Ctrl+클릭으로 선택하면
      simulateClick(image2, { ctrlKey: true });
      await wait(100);

      // When: 대량 다운로드 버튼을 클릭하면
      const downloadAllBtn = doc.querySelector('[data-testid="download-all-btn"]');
      simulateClick(downloadAllBtn);
      await wait(200);

      // Then: 모든 선택된 이미지가 다운로드되어야 한다
      expect(mockUserscriptAPI.GM_download).toHaveBeenCalledTimes(2);
    });
  });

  describe('설정 기반 워크플로우', () => {
    it('자동 다운로드가 활성화된 경우 클릭 즉시 다운로드되어야 한다', async () => {
      // Given: 자동 다운로드가 활성화된 상태
      setMockStorageValue('autoDownload', 'true');
      setMockStorageValue('downloadPath', '/auto/downloads');

      const container = setupTwitterDOM();
      const tweet = addTweetWithImages(container);
      const imageElement = tweet.querySelector('img[src*="pbs.twimg.com"]');

      // When: 사용자가 이미지를 클릭하면
      simulateClick(imageElement);
      await wait(100);

      // Then: 갤러리가 열리지 않고 바로 다운로드되어야 한다
      const galleryModal = doc.querySelector('[data-testid="photoModal"]');
      expect(galleryModal).toBeFalsy();

      expect(mockUserscriptAPI.GM_download).toHaveBeenCalled();
    });

    it('압축 설정에 따라 ZIP 파일로 다운로드되어야 한다', async () => {
      // Given: ZIP 압축이 활성화된 상태
      setMockStorageValue('compressionEnabled', 'true');
      setMockStorageValue('compressionLevel', '6');

      const container = setupTwitterDOM();
      addTweetWithImages(container);
      addTweetWithVideo(container);

      // When: 대량 선택 후 다운로드하면
      const images = doc.querySelectorAll('img[src*="pbs.twimg.com"]');
      images.forEach(img => simulateClick(img, { ctrlKey: true }));
      await wait(100);

      const downloadAllBtn = doc.querySelector('[data-testid="download-all-btn"]');
      simulateClick(downloadAllBtn);
      await wait(200);

      // Then: ZIP 파일로 다운로드되어야 한다
      expect(mockUserscriptAPI.GM_download).toHaveBeenCalledWith(
        expect.any(String), // Blob URL
        expect.stringContaining('.zip')
      );
    });
  });

  describe('오류 복구 워크플로우', () => {
    it('네트워크 오류 발생 시 재시도 메커니즘이 작동해야 한다', async () => {
      // Given: 처음에는 실패하고 재시도 시 성공하는 네트워크 응답
      let callCount = 0;
      mockUserscriptAPI.GM_xmlhttpRequest.mockImplementation(details => {
        callCount++;
        globalThis.setTimeout(() => {
          if (callCount === 1) {
            // 첫 번째 호출은 실패
            if (details.onerror) {
              details.onerror({ status: 0, statusText: 'Network Error' });
            }
          } else {
            // 두 번째 호출은 성공
            if (details.onload) {
              details.onload({
                status: 200,
                responseText: JSON.stringify({ success: true }),
              });
            }
          }
        }, 0);
        return { abort: () => {} };
      });

      const container = setupTwitterDOM();
      const tweet = addTweetWithImages(container);
      const imageElement = tweet.querySelector('img[src*="pbs.twimg.com"]');

      // When: 이미지 클릭 및 다운로드 시도
      simulateClick(imageElement);
      await wait(100);

      simulateKeypress('d');
      await wait(300); // 재시도 대기

      // Then: 재시도 후 성공해야 한다
      expect(callCount).toBeGreaterThan(1);
      expect(mockUserscriptAPI.GM_notification).toHaveBeenCalledWith(
        expect.objectContaining({
          text: expect.stringContaining('성공'),
        })
      );
    });

    it('지원하지 않는 미디어 형식에 대해 적절한 안내를 표시해야 한다', async () => {
      // Given: 지원하지 않는 형식의 미디어가 있는 트윗
      const container = setupTwitterDOM();
      const tweet = doc.createElement('article');
      tweet.setAttribute('data-testid', 'tweet');
      tweet.innerHTML = `
        <div>
          <img src="https://example.com/unsupported.webp" alt="Unsupported format">
        </div>
      `;
      container.appendChild(tweet);

      const unsupportedImage = tweet.querySelector('img');

      // When: 지원하지 않는 이미지를 클릭하면
      simulateClick(unsupportedImage);
      await wait(100);

      // Then: 적절한 안내 메시지가 표시되어야 한다
      expect(mockUserscriptAPI.GM_notification).toHaveBeenCalledWith(
        expect.objectContaining({
          text: expect.stringContaining('지원하지 않는'),
        })
      );
    });
  });

  describe('접근성 워크플로우', () => {
    it('키보드만으로 전체 워크플로우를 완료할 수 있어야 한다', async () => {
      // Given: 갤러리가 열린 상태
      const container = setupTwitterDOM();
      addTweetWithImages(container);

      const galleryModal = doc.createElement('div');
      galleryModal.setAttribute('data-testid', 'photoModal');
      galleryModal.setAttribute('tabindex', '0');
      doc.body.appendChild(galleryModal);
      galleryModal.focus();

      // When: 키보드로 다운로드 실행
      simulateKeypress('d');
      await wait(100);

      // Then: 다운로드가 실행되어야 한다
      expect(mockUserscriptAPI.GM_download).toHaveBeenCalled();

      // When: ESC로 갤러리 닫기
      simulateKeypress('Escape');
      await wait(100);

      // Then: 갤러리가 닫혀야 한다
      const modal = doc.querySelector('[data-testid="photoModal"]');
      expect(modal).toBeFalsy();
    });

    it('스크린 리더 사용자를 위한 적절한 안내가 제공되어야 한다', async () => {
      // Given: 갤러리가 열린 상태
      const galleryModal = doc.createElement('div');
      galleryModal.setAttribute('data-testid', 'photoModal');
      galleryModal.setAttribute('role', 'dialog');
      galleryModal.setAttribute('aria-modal', 'true');
      galleryModal.setAttribute('aria-label', '이미지 갤러리');

      // 현재 이미지 정보
      const imageInfo = doc.createElement('div');
      imageInfo.setAttribute('aria-live', 'polite');
      imageInfo.textContent = '이미지 1/3';
      galleryModal.appendChild(imageInfo);

      doc.body.appendChild(galleryModal);

      // When: 다음 이미지로 이동
      simulateKeypress('ArrowRight');
      await wait(100);

      // Then: 스크린 리더에 적절한 정보가 제공되어야 한다
      expect(galleryModal.getAttribute('aria-label')).toBeTruthy();
      expect(imageInfo.getAttribute('aria-live')).toBe('polite');
    });
  });

  describe('성능 워크플로우', () => {
    it('대용량 미디어 파일 다운로드 시 진행률을 표시해야 한다', async () => {
      // Given: 대용량 파일 다운로드 설정
      mockUserscriptAPI.GM_download.mockImplementation((url, filename) => {
        // 진행률 콜백 시뮬레이션
        const progressCallback = progress => {
          const progressElement = doc.querySelector('[data-testid="download-progress"]');
          if (progressElement) {
            progressElement.textContent = `${Math.round(progress * 100)}%`;
          }
        };

        // 시뮬레이션된 진행률 업데이트
        let progress = 0;
        const interval = globalThis.setInterval(() => {
          progress += 0.1;
          progressCallback(progress);

          if (progress >= 1) {
            globalThis.clearInterval(interval);
          }
        }, 50);

        return Promise.resolve({ url, filename, error: null });
      });

      const container = setupTwitterDOM();
      const tweet = addTweetWithImages(container);
      const imageElement = tweet.querySelector('img[src*="pbs.twimg.com"]');

      // When: 대용량 이미지 다운로드 시작
      simulateClick(imageElement);
      await wait(100);

      simulateKeypress('d');
      await wait(100);

      // Then: 진행률 표시 요소가 생성되어야 한다
      const progressElement = doc.querySelector('[data-testid="download-progress"]');
      expect(progressElement).toBeTruthy();

      // 진행률 완료 대기
      await wait(600);

      expect(progressElement.textContent).toBe('100%');
    });
  });
});
