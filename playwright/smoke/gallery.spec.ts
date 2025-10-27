/**
 * @file Gallery E2E Tests
 * @description 갤러리 초기화, 이벤트 정책, 열기/닫기 플로우 검증
 *
 * **테스트 범위**:
 * - 서비스 초기화 및 이벤트 핸들러 등록
 * - PC 전용 이벤트 정책 (touch/pointer 금지)
 * - 갤러리 열기/닫기 플로우
 * - 키보드 라우팅 (Escape, Enter)
 *
 * **Consolidated from**:
 * - gallery-app.spec.ts
 * - gallery-events.spec.ts
 */

import { expect, test } from '@playwright/test';
import { ensureHarness } from './utils';

type GalleryAppSetupResult = {
  initialized: boolean;
  eventHandlersRegistered: boolean;
};

type GalleryAppState = {
  isOpen: boolean;
  mediaCount: number;
};

type GalleryEventsResult = {
  registeredEvents: string[];
  forbiddenEvents: string[];
  escapeWhenClosed: number;
  escapeWhenOpen: number;
  enterDelegated: number;
};

test.describe('Gallery Integration', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('about:blank');
    await ensureHarness(page);
  });

  test.afterEach(async ({ page }) => {
    await page.evaluate(async () => {
      const harness = window.__XEG_HARNESS__;
      if (!harness) return;
      try {
        await harness.disposeGalleryApp();
      } catch {
        /* ignore */
      }
    });
  });

  test('Initializes services and handles open/close flow', async ({ page }) => {
    const setup = (await page.evaluate(async () => {
      const harness = window.__XEG_HARNESS__;
      if (!harness) throw new Error('Harness not available');
      return harness.setupGalleryApp();
    })) as GalleryAppSetupResult;

    expect(setup.initialized).toBeTruthy();
    expect(setup.eventHandlersRegistered).toBeTruthy();

    await page.evaluate(async () => {
      const harness = window.__XEG_HARNESS__;
      if (!harness) throw new Error('Harness not available');
      await harness.triggerGalleryAppMediaClick();
    });

    const stateAfterOpen = (await page.evaluate(async () => {
      const harness = window.__XEG_HARNESS__;
      if (!harness) throw new Error('Harness not available');
      return harness.getGalleryAppState();
    })) as GalleryAppState;

    expect(stateAfterOpen.isOpen).toBeTruthy();
    expect(stateAfterOpen.mediaCount).toBeGreaterThan(0);

    await page.evaluate(async () => {
      const harness = window.__XEG_HARNESS__;
      if (!harness) throw new Error('Harness not available');
      await harness.triggerGalleryAppClose();
    });

    const stateAfterClose = (await page.evaluate(async () => {
      const harness = window.__XEG_HARNESS__;
      if (!harness) throw new Error('Harness not available');
      return harness.getGalleryAppState();
    })) as GalleryAppState;

    expect(stateAfterClose.isOpen).toBeFalsy();
  });

  test('Enforces PC-only event policy and keyboard routing', async ({ page }) => {
    const result = (await page.evaluate(async () => {
      const harness = window.__XEG_HARNESS__;
      if (!harness) throw new Error('Harness not available');
      return harness.evaluateGalleryEvents();
    })) as GalleryEventsResult;

    // PC 전용 이벤트만 등록
    expect(result.registeredEvents).toEqual(expect.arrayContaining(['click', 'keydown']));
    // Touch/Pointer 이벤트 없음
    expect(result.forbiddenEvents.length).toBe(0);
    // Escape 키 라우팅: 닫혀있을 때 0, 열려있을 때 1
    expect(result.escapeWhenClosed).toBe(0);
    expect(result.escapeWhenOpen).toBe(1);
    // Enter 키 위임: 최소 1회 이상
    expect(result.enterDelegated).toBeGreaterThanOrEqual(1);
  });
});
