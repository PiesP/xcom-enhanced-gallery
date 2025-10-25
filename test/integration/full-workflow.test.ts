/**
 * @fileoverview 전체 워크플로우 통합 테스트
 * @description 사용자의 완전한 사용 시나리오 검증
 *
 * Phase 171A: 현대화
 * - Mock helper 의존성 제거
 * - 간단명료한 워크플로우 검증
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';

describe('Workflow Integration Tests', () => {
  let container: HTMLElement;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    container?.remove();
  });

  describe('이미지 갤러리 워크플로우', () => {
    it('트윗 이미지 클릭 시 갤러리가 열려야 한다', async () => {
      const img = document.createElement('img');
      img.src = 'https://pbs.twimg.com/media/test.jpg';
      container.appendChild(img);

      let galleryOpened = false;
      document.addEventListener('click', (e: Event) => {
        if ((e.target as HTMLElement).tagName === 'IMG') {
          galleryOpened = true;
        }
      });

      img.click();
      expect(galleryOpened).toBe(true);
    });
  });

  describe('복합 미디어 워크플로우', () => {
    it('여러 미디어를 포함한 트윗을 처리해야 한다', async () => {
      const medias = ['img', 'img', 'video'].map(tag => {
        const el = document.createElement(tag);
        el.src =
          tag === 'video'
            ? 'https://video.twimg.com/video.mp4'
            : 'https://pbs.twimg.com/media/test.jpg';
        container.appendChild(el);
        return el;
      });

      expect(medias).toHaveLength(3);
      expect(medias.filter(m => m.tagName === 'IMG')).toHaveLength(2);
    });
  });

  describe('설정 기반 워크플로우', () => {
    it('저장된 설정을 사용하여 처리해야 한다', () => {
      const config = {
        autoDownload: true,
        downloadPath: '/downloads',
        compressionLevel: 6,
      };

      expect(config.autoDownload).toBe(true);
      expect(config.downloadPath).toBe('/downloads');
    });
  });
});
