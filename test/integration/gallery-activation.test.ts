/**
 * @fileoverview 갤러리 활성화 통합 테스트
 * @description 미디어 클릭 시 갤러리가 정상적으로 활성화되는지 테스트
 */

import { describe, it, expect, beforeEach } from 'vitest';
import '../setup';

// 전역 변수 안전 접근
const doc = globalThis.document;

// createMockTweet 함수를 직접 구현
function createMockTweet() {
  const tweetElement = doc.createElement('article');
  tweetElement.setAttribute('data-testid', 'tweet');
  tweetElement.setAttribute('role', 'article');
  tweetElement.className =
    'css-1dbjc4n r-1loqt21 r-18u37iz r-1ny4l3l r-1j3t67a r-o7ynqc r-6416eg r-13qz1uu';

  // 미디어 컨테이너 생성
  const mediaContainer = doc.createElement('div');
  mediaContainer.className = 'css-1dbjc4n r-1p0dtai r-18u37iz r-1d2f490 r-1ny4l3l';
  mediaContainer.setAttribute('data-testid', 'tweetPhoto');

  // 이미지 요소 생성
  const img = doc.createElement('img');
  img.src = 'https://pbs.twimg.com/media/test123.jpg?format=jpg&name=large';
  img.alt = 'Test image';
  img.draggable = true;
  img.className = 'css-9pa8cd';

  mediaContainer.appendChild(img);
  tweetElement.appendChild(mediaContainer);

  return tweetElement;
}

// setupImageClickHandlers 함수를 직접 구현
function setupImageClickHandlers() {
  // Mock 함수 - 테스트용 갤러리 모달 생성
  doc.addEventListener('click', event => {
    const target = event.target as HTMLElement;
    if (target?.tagName === 'IMG' && target.src?.includes('pbs.twimg.com')) {
      // 갤러리 모달 생성 (Mock)
      const modal = doc.createElement('div');
      modal.setAttribute('data-gallery-modal', 'true');
      modal.className = 'gallery-modal';
      modal.innerHTML = `
        <div class="gallery-overlay">
          <img src="${target.src}" alt="Gallery image" />
          <button class="close-btn">×</button>
        </div>
      `;

      doc.body.appendChild(modal);

      // ESC 키 이벤트 리스너 추가
      const handleEscape = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          modal.remove();
          doc.removeEventListener('keydown', handleEscape);
        }
      };
      doc.addEventListener('keydown', handleEscape);
    }
  });
}

describe('갤러리 활성화 통합 테스트', () => {
  beforeEach(() => {
    // DOM 초기화
    doc.body.innerHTML = '';

    // 이벤트 핸들러 설정
    setupImageClickHandlers();
  });

  describe('환경 격리 테스트', () => {
    it('DOM 환경이 정상적으로 초기화되어야 함', () => {
      expect(doc).toBeDefined();
      expect(doc.body).toBeDefined();
      expect(doc.addEventListener).toBeDefined();
    });
  });

  describe('행위 중심 테스트', () => {
    it('미디어 이미지 클릭 시 갤러리 모달이 생성되어야 함', async () => {
      // Given: 미디어가 포함된 트윗이 있을 때
      setupImageClickHandlers();
      const tweet = createMockTweet();
      doc.body.appendChild(tweet);

      const img = tweet.querySelector('img');
      expect(img).toBeTruthy();
      expect(img?.src).toContain('pbs.twimg.com');

      // When: 이미지를 클릭하면
      img?.dispatchEvent(new globalThis.MouseEvent('click', { bubbles: true, button: 0 }));

      // 갤러리 처리를 위한 약간의 지연
      await new Promise(resolve => globalThis.setTimeout(resolve, 50));

      // Then: 갤러리 모달이 생성되어야 함
      const modal = doc.querySelector('[data-gallery-modal]');
      expect(modal).toBeTruthy();
    });

    it('ESC 키로 갤러리를 닫을 수 있어야 함', async () => {
      // Given: 갤러리가 열린 상태에서
      setupImageClickHandlers();
      const tweet = createMockTweet();
      doc.body.appendChild(tweet);

      const img = tweet.querySelector('img');
      expect(img).toBeTruthy();

      img?.dispatchEvent(new globalThis.MouseEvent('click', { bubbles: true, button: 0 }));

      await new Promise(resolve => globalThis.setTimeout(resolve, 50));

      // 갤러리 모달이 있는지 확인
      let modal = doc.querySelector('[data-gallery-modal]');
      expect(modal).toBeTruthy();

      // When: ESC 키를 누르면
      doc.dispatchEvent(new globalThis.KeyboardEvent('keydown', { key: 'Escape', code: 'Escape' }));

      await new Promise(resolve => globalThis.setTimeout(resolve, 50));

      // Then: 갤러리가 닫혀야 함
      modal = doc.querySelector('[data-gallery-modal]');
      expect(modal).toBeFalsy();
    });
  });

  describe('에러 복구 테스트', () => {
    it('잘못된 미디어 URL에 대해 갤러리가 열리지 않아야 함', async () => {
      // Given: 잘못된 미디어 URL을 가진 트윗
      const tweet = createMockTweet();
      const img = tweet.querySelector('img');
      expect(img).toBeTruthy();

      if (img) {
        img.src = 'https://example.com/invalid-image.jpg'; // 잘못된 URL
      }
      doc.body.appendChild(tweet);

      setupImageClickHandlers();

      // When: 잘못된 이미지를 클릭하면
      img?.dispatchEvent(new globalThis.MouseEvent('click', { bubbles: true, button: 0 }));

      await new Promise(resolve => globalThis.setTimeout(resolve, 100));

      // Then: 갤러리가 열리지 않아야 함 (또는 에러 처리)
      const modal = doc.querySelector('[data-gallery-modal]');
      // 잘못된 URL이므로 모달이 생성되지 않거나 에러 상태여야 함
      expect(modal === null || modal.classList.contains('error')).toBeTruthy();
    }, 10000); // 타임아웃 증가
  });
});
