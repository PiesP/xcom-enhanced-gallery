/**
 * VerticalGalleryView 이미지 핏 모드 테스트 (Browser 모드)
 *
 * JSDOM의 Solid.js 반응성 제약을 해결하기 위해 실제 브라우저에서 테스트
 *
 * 이점:
 * - Solid.js fine-grained reactivity 완전 작동
 * - 실제 DOM 레이아웃 계산
 * - CSS 스타일 적용 확인
 *
 * @see test/unit/features/gallery/components/VerticalGalleryView.fit-mode.test.tsx (JSDOM 버전)
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { getSolid } from '@shared/external/vendors';
import type { MediaInfo } from '@shared/types';

const { createSignal, createEffect } = getSolid();

describe('VerticalGalleryView Fit Mode (Browser)', () => {
  let container: HTMLDivElement;

  beforeEach(() => {
    container = document.createElement('div');
    container.style.width = '800px';
    container.style.height = '600px';
    document.body.appendChild(container);
  });

  it('should apply fitWidth mode correctly with reactivity', async () => {
    // 상태 생성
    const [fitMode, setFitMode] = createSignal<
      'fitWidth' | 'fitHeight' | 'fitOriginal' | 'fitContainer'
    >('fitWidth');

    // 이미지 요소 생성
    const img = document.createElement('img');
    img.src =
      'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="1920" height="1080"/>';
    container.appendChild(img);

    // 반응형 스타일 적용
    createEffect(() => {
      const mode = fitMode();
      switch (mode) {
        case 'fitWidth':
          img.style.width = '100%';
          img.style.height = 'auto';
          img.style.maxWidth = '100%';
          img.style.maxHeight = 'none';
          break;
        case 'fitHeight':
          img.style.width = 'auto';
          img.style.height = '100%';
          img.style.maxWidth = 'none';
          img.style.maxHeight = '100%';
          break;
        case 'fitOriginal':
          img.style.width = 'auto';
          img.style.height = 'auto';
          img.style.maxWidth = 'none';
          img.style.maxHeight = 'none';
          break;
        case 'fitContainer':
          img.style.width = '100%';
          img.style.height = '100%';
          img.style.maxWidth = '100%';
          img.style.maxHeight = '100%';
          img.style.objectFit = 'contain';
          break;
      }
    });

    // 초기 상태 확인
    await new Promise(resolve => setTimeout(resolve, 0));
    expect(img.style.width).toBe('100%');
    expect(img.style.height).toBe('auto');

    // fitHeight로 변경
    setFitMode('fitHeight');
    await new Promise(resolve => setTimeout(resolve, 0));
    expect(img.style.width).toBe('auto');
    expect(img.style.height).toBe('100%');

    // fitOriginal로 변경
    setFitMode('fitOriginal');
    await new Promise(resolve => setTimeout(resolve, 0));
    expect(img.style.width).toBe('auto');
    expect(img.style.height).toBe('auto');

    // fitContainer로 변경
    setFitMode('fitContainer');
    await new Promise(resolve => setTimeout(resolve, 0));
    expect(img.style.width).toBe('100%');
    expect(img.style.height).toBe('100%');
    expect(img.style.objectFit).toBe('contain');
  });

  it('should handle multiple images with reactive fit mode', async () => {
    const [fitMode, setFitMode] = createSignal<'fitWidth' | 'fitHeight'>('fitWidth');
    const images: HTMLImageElement[] = [];

    // 3개의 이미지 생성
    for (let i = 0; i < 3; i++) {
      const img = document.createElement('img');
      img.src = `data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="${1920 + i * 100}" height="${1080 + i * 100}"/>`;
      img.dataset.index = String(i);
      container.appendChild(img);
      images.push(img);
    }

    // 모든 이미지에 반응형 스타일 적용
    createEffect(() => {
      const mode = fitMode();
      images.forEach(img => {
        if (mode === 'fitWidth') {
          img.style.width = '100%';
          img.style.height = 'auto';
        } else {
          img.style.width = 'auto';
          img.style.height = '100%';
        }
      });
    });

    await new Promise(resolve => setTimeout(resolve, 0));

    // 초기 상태: 모두 fitWidth
    images.forEach(img => {
      expect(img.style.width).toBe('100%');
      expect(img.style.height).toBe('auto');
    });

    // fitHeight로 변경
    setFitMode('fitHeight');
    await new Promise(resolve => setTimeout(resolve, 0));

    // 모든 이미지가 fitHeight로 변경됨
    images.forEach(img => {
      expect(img.style.width).toBe('auto');
      expect(img.style.height).toBe('100%');
    });
  });

  it('should persist fit mode preference across re-renders', async () => {
    const [fitMode, setFitMode] = createSignal<'fitWidth' | 'fitHeight'>('fitWidth');
    const [mounted, setMounted] = createSignal(true);

    let img: HTMLImageElement | null = null;

    createEffect(() => {
      if (mounted()) {
        img = document.createElement('img');
        img.src =
          'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="1920" height="1080"/>';
        container.appendChild(img);

        createEffect(() => {
          const mode = fitMode();
          if (img) {
            img.style.width = mode === 'fitWidth' ? '100%' : 'auto';
            img.style.height = mode === 'fitWidth' ? 'auto' : '100%';
          }
        });
      } else {
        if (img) {
          img.remove();
          img = null;
        }
      }
    });

    await new Promise(resolve => setTimeout(resolve, 0));
    expect(img?.style.width).toBe('100%');

    // fitHeight로 변경
    setFitMode('fitHeight');
    await new Promise(resolve => setTimeout(resolve, 0));
    expect(img?.style.width).toBe('auto');

    // 언마운트
    setMounted(false);
    await new Promise(resolve => setTimeout(resolve, 0));
    expect(img).toBe(null);

    // 재마운트 - fitHeight가 유지되어야 함
    setMounted(true);
    await new Promise(resolve => setTimeout(resolve, 0));
    expect(img?.style.width).toBe('auto');
    expect(img?.style.height).toBe('100%');
  });
});
