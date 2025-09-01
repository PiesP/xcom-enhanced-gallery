// @ts-nocheck
/**
 * Phase 4 RED: Shadow DOM 격리 테스트
 * 목표: FEATURE_GALLERY_SHADOW 플래그 ON 시 Shadow DOM 활성화 및 외부 스타일 격리 확인
 */
/* eslint-env jsdom */
/* global document, window */
import { describe, it, expect, afterAll, beforeEach } from 'vitest';
import { galleryRenderer } from '@/features/gallery';
import { closeGallery } from '@shared/state/signals/gallery.signals';

function createMedia(count) {
  return Array.from({ length: count }, (_, i) => ({
    id: `shadow-${i}`,
    url: `https://example.com/shadow/${i}.jpg`,
    type: 'image',
    filename: `shadow_${i}.jpg`,
  }));
}

/**
 * Shadow DOM 외부 스타일 충돌 시뮬레이션을 위한 CSS 주입
 */
function injectConflictingStyles() {
  const style = document.createElement('style');
  style.id = 'external-conflicting-styles';
  style.textContent = `
    /* 외부에서 갤러리 요소를 강제로 숨기려는 악의적 스타일 */
    .xeg-gallery-renderer,
    div.xeg-gallery-renderer,
    body .xeg-gallery-renderer {
      display: none !important;
      visibility: hidden !important;
      opacity: 0 !important;
    }
    .xeg-vertical-gallery { opacity: 0 !important; }
    [data-xeg-role="gallery"] { visibility: hidden !important; }

    /* 아이템 스타일 충돌 */
    .gallery-item {
      background: red !important;
      border: 10px solid blue !important;
    }
  `;
  document.head.appendChild(style);
}

function removeConflictingStyles() {
  const style = document.getElementById('external-conflicting-styles');
  if (style) {
    style.remove();
  }
}

describe('Phase 4 RED: Shadow DOM 격리', () => {
  beforeEach(() => {
    // 각 테스트 전에 충돌 스타일 주입
    injectConflictingStyles();
  });

  afterAll(() => {
    removeConflictingStyles();
    closeGallery();
  });

  it('FEATURE_GALLERY_SHADOW 플래그 OFF 시 일반 DOM 렌더링 (충돌 영향 있음)', async () => {
    const media = createMedia(3);

    // 일반 렌더링 (Shadow DOM 비활성화)
    await galleryRenderer.render(media, { viewMode: 'vertical' });
    await Promise.resolve();

    const galleryRoot = document.querySelector('.xeg-gallery-renderer');
    expect(galleryRoot).not.toBeNull();

    // Shadow DOM이 없어야 함
    expect(galleryRoot.shadowRoot).toBeNull();

    // 외부 스타일 충돌로 인해 갤러리가 숨겨져야 함 (RED 조건)
    const computedStyle = window.getComputedStyle(galleryRoot);
    expect(computedStyle.display).toBe('none'); // 외부 CSS의 display: none !important 적용됨
  });

  it('FEATURE_GALLERY_SHADOW 플래그 ON 시 Shadow DOM 생성 및 격리 (GREEN 구현 완료)', async () => {
    // 이 테스트는 아직 Shadow DOM 기능이 구현되지 않았으므로 실패해야 함
    const media = createMedia(3);

    // Shadow DOM 옵션으로 렌더링 시도 (Phase 4 GREEN 구현 중)
    await galleryRenderer.render(media, {
      viewMode: 'vertical',
      useShadowDOM: true, // Phase 4: Shadow DOM 격리 활성화
    });
    await Promise.resolve();

    const galleryRoot = document.querySelector('.xeg-gallery-renderer');
    expect(galleryRoot).not.toBeNull();

    // Phase 4 GREEN: Shadow DOM이 성공적으로 구현되었으므로 shadowRoot가 존재해야 함
    expect(galleryRoot.shadowRoot).not.toBeNull(); // 이제 성공해야 함

    // RED: 격리되지 않아 외부 스타일 영향을 받을 것임
    if (galleryRoot.shadowRoot) {
      // Shadow DOM 내부에서는 외부 스타일 영향 없이 정상 표시되어야 함
      const shadowContent = galleryRoot.shadowRoot?.querySelector('[data-xeg-role="gallery"]');
      expect(shadowContent).not.toBeNull();

      // Shadow DOM 격리로 인해 외부 충돌 스타일의 영향을 받지 않아야 함
      const shadowComputedStyle = window.getComputedStyle(shadowContent);
      expect(shadowComputedStyle.display).not.toBe('none');
      expect(shadowComputedStyle.visibility).not.toBe('hidden');
      expect(shadowComputedStyle.opacity).not.toBe('0');
    }
  });

  it('Shadow DOM 내부 스타일 격리 확인 (GREEN 구현 완료)', async () => {
    const media = createMedia(2);

    await galleryRenderer.render(media, {
      viewMode: 'vertical',
      useShadowDOM: true, // Phase 4: Shadow DOM 격리 활성화
    });
    await Promise.resolve();

    const galleryRoot = document.querySelector('.xeg-gallery-renderer');
    expect(galleryRoot).not.toBeNull();

    // Phase 4 GREEN: Shadow DOM이 성공적으로 구현되었으므로 shadowRoot가 존재해야 함
    const shadowRoot = galleryRoot.shadowRoot;
    expect(shadowRoot).not.toBeNull(); // 이제 성공해야 함

    if (shadowRoot) {
      // Shadow DOM 내부에 스타일이 주입되어 있어야 함
      const shadowStyles = shadowRoot.querySelector('style');
      expect(shadowStyles).not.toBeNull();

      // 갤러리 고유 스타일이 포함되어 있어야 함
      expect(shadowStyles?.textContent).toContain('.xeg-');

      // 외부 DOM에는 갤러리 스타일이 누출되지 않아야 함 (네임스페이스 격리)
      const externalStyleSheets = Array.from(document.styleSheets);
      const hasGalleryStylesInExternal = externalStyleSheets.some(sheet => {
        try {
          return Array.from(sheet.cssRules).some(
            rule =>
              rule.cssText.includes('.xeg-gallery') || rule.cssText.includes('[data-xeg-role]')
          );
        } catch {
          return false; // CORS 등으로 접근 불가한 경우 무시
        }
      });

      // Shadow DOM 사용 시 외부에는 갤러리 전용 스타일이 없어야 함
      expect(hasGalleryStylesInExternal).toBe(false);
    }
  });
});
