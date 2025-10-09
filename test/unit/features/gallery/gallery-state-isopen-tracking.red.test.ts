/**
 * @fileoverview Phase 9.21.2 RED Test - GalleryRenderer isOpen만 추적
 * @description currentIndex 변경 시 setupStateSubscription 콜백이 실행되지 않는지 검증
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

describe('Phase 9.21.2: GalleryRenderer isOpen Tracking (RED)', () => {
  const currentDir = dirname(fileURLToPath(import.meta.url));
  const GALLERY_RENDERER_PATH = resolve(
    currentDir,
    '../../../../src/features/gallery/GalleryRenderer.tsx'
  );

  beforeEach(() => {
    vi.resetModules();
  });

  it('RED: setupStateSubscription should use untrack() pattern', () => {
    const content = readFileSync(GALLERY_RENDERER_PATH, 'utf-8');

    // Phase 9.21.2: untrack을 import해야 함
    expect(content).toContain('untrack');

    // setupStateSubscription 메서드 추출
    const setupStateSubscriptionMatch = content.match(
      /private setupStateSubscription\(\)[\s\S]*?^ {2}\}/m
    );

    expect(setupStateSubscriptionMatch).toBeTruthy();

    if (setupStateSubscriptionMatch) {
      const methodContent = setupStateSubscriptionMatch[0];

      // untrack을 사용하여 galleryState.value를 가져와야 함
      expect(methodContent).toContain('untrack');
      expect(methodContent).toContain('currentState');

      // isOpen만 추적해야 함 (직접 galleryState.value.isOpen 접근 금지)
      // 현재 코드: const isOpen = galleryState.value.isOpen; (❌)
      // 올바른 코드: const currentState = untrack(() => galleryState.value);
      //              const isOpen = currentState.isOpen; (✅)

      // RED: 현재는 untrack 패턴이 없어야 실패함
      const hasUntrackPattern =
        methodContent.includes('untrack(() => galleryState.value)') ||
        methodContent.includes('untrack(() =>');

      expect(hasUntrackPattern).toBe(true);
    }
  });

  it('RED: should NOT directly access galleryState.value.isOpen in createEffect', () => {
    const content = readFileSync(GALLERY_RENDERER_PATH, 'utf-8');

    const setupStateSubscriptionMatch = content.match(
      /private setupStateSubscription\(\)[\s\S]*?^ {2}\}/m
    );

    expect(setupStateSubscriptionMatch).toBeTruthy();

    if (setupStateSubscriptionMatch) {
      const methodContent = setupStateSubscriptionMatch[0];

      // Phase 9.21.1 HOTFIX의 잘못된 패턴 검출
      // const isOpen = galleryState.value.isOpen; (❌ 전체 객체 추적)
      const hasDirectAccess = methodContent.includes('galleryState.value.isOpen');

      // RED: 직접 접근 패턴이 없어야 함
      expect(hasDirectAccess).toBe(false);
    }
  });

  it('RED: should use correct untrack pattern', () => {
    const content = readFileSync(GALLERY_RENDERER_PATH, 'utf-8');

    const setupStateSubscriptionMatch = content.match(
      /private setupStateSubscription\(\)[\s\S]*?^ {2}\}/m
    );

    expect(setupStateSubscriptionMatch).toBeTruthy();

    if (setupStateSubscriptionMatch) {
      const methodContent = setupStateSubscriptionMatch[0];

      // 올바른 패턴:
      // const currentState = untrack(() => galleryState.value);
      // const isOpen = currentState.isOpen;

      const hasCorrectPattern =
        methodContent.includes('untrack(() => galleryState.value)') &&
        methodContent.includes('currentState.isOpen');

      expect(hasCorrectPattern).toBe(true);
    }
  });

  it('RED: should import untrack from getSolid()', () => {
    const content = readFileSync(GALLERY_RENDERER_PATH, 'utf-8');

    // setupStateSubscription 내부에서 untrack을 destructure해야 함
    const setupStateSubscriptionMatch = content.match(
      /private setupStateSubscription\(\)[\s\S]*?^ {2}\}/m
    );

    expect(setupStateSubscriptionMatch).toBeTruthy();

    if (setupStateSubscriptionMatch) {
      const methodContent = setupStateSubscriptionMatch[0];

      // const { createEffect, createRoot, untrack } = getSolid();
      expect(methodContent).toContain('untrack');
      expect(methodContent).toContain('getSolid()');
    }
  });
});
