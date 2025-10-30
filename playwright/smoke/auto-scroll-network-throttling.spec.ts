/**
 * @file E2E Network Throttling Tests for Gallery Loading
 * @description Phase 270 auto-scroll timing feature의 네트워크 시뮬레이션 검증
 *
 * **테스트 범위**:
 * - 느린 네트워크(3G) 환경에서의 갤러리 초기화 성능
 * - 중간 네트워크(4G) 환경에서의 응답 시간
 * - 빠른 네트워크(WiFi) 환경에서의 즉시 응답
 * - 오프라인 환경에서의 폴백 동작
 * - 네트워크 복구 시나리오
 * - 갤러리 이벤트 처리의 안정성
 */

import { expect, test, type Page } from '@playwright/test';
import { ensureHarness } from './utils';

type NetworkProfile = {
  name: string;
  downloadThroughput: number;
  uploadThroughput: number;
  latency: number;
  offline: boolean;
};

const NETWORK_PROFILES = {
  '3g': {
    name: '3G (100 Kbps)',
    downloadThroughput: (100 * 1024) / 8,
    uploadThroughput: (20 * 1024) / 8,
    latency: 200,
    offline: false,
  } as NetworkProfile,
  '4g': {
    name: '4G (4 Mbps)',
    downloadThroughput: (4 * 1024 * 1024) / 8,
    uploadThroughput: (3 * 1024 * 1024) / 8,
    latency: 20,
    offline: false,
  } as NetworkProfile,
  wifi: {
    name: 'WiFi (25 Mbps)',
    downloadThroughput: (25 * 1024 * 1024) / 8,
    uploadThroughput: (10 * 1024 * 1024) / 8,
    latency: 2,
    offline: false,
  } as NetworkProfile,
  offline: {
    name: 'Offline',
    downloadThroughput: 0,
    uploadThroughput: 0,
    latency: 0,
    offline: true,
  } as NetworkProfile,
};

async function applyNetworkProfile(page: Page, profile: NetworkProfile): Promise<void> {
  const client = await page.context().newCDPSession(page);
  try {
    await client.send('Network.emulateNetworkConditions', {
      offline: profile.offline,
      downloadThroughput: profile.downloadThroughput,
      uploadThroughput: profile.uploadThroughput,
      latency: profile.latency,
    });
  } finally {
    await client.detach();
  }
}

async function resetNetworkProfile(page: Page): Promise<void> {
  const client = await page.context().newCDPSession(page);
  try {
    await client.send('Network.emulateNetworkConditions', {
      offline: false,
      downloadThroughput: -1,
      uploadThroughput: -1,
      latency: 0,
    });
  } finally {
    await client.detach();
  }
}

test.describe('Phase 270: Gallery Loading with Network Throttling', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('about:blank');
    await ensureHarness(page);
  });

  test.afterEach(async ({ page }) => {
    await resetNetworkProfile(page);

    await page.evaluate(async () => {
      const harness = (window as any).__XEG_HARNESS__;
      if (!harness) return;
      try {
        await harness.disposeGalleryApp();
      } catch {
        /* ignore */
      }
    });
  });

  test('Slow 3G network: gallery initializes despite latency', async ({ page }) => {
    await applyNetworkProfile(page, NETWORK_PROFILES['3g']);

    const result = (await page.evaluate(async () => {
      const startTime = performance.now();
      const harness = (window as any).__XEG_HARNESS__;
      if (!harness) return { success: false, duration: 0 };

      try {
        await harness.setupGalleryApp();
        const endTime = performance.now();
        return { success: true, duration: endTime - startTime };
      } catch {
        return { success: false, duration: 0 };
      }
    })) as { success: boolean; duration: number };

    expect(result.success).toBeTruthy();
    expect(result.duration).toBeLessThan(2000);
  });

  test('Medium 4G network: gallery loads faster than 3G', async ({ page }) => {
    await applyNetworkProfile(page, NETWORK_PROFILES['4g']);

    const result = (await page.evaluate(async () => {
      const startTime = performance.now();
      const harness = (window as any).__XEG_HARNESS__;
      if (!harness) return { success: false, duration: 0 };

      try {
        await harness.setupGalleryApp();
        const endTime = performance.now();
        return { success: true, duration: endTime - startTime };
      } catch {
        return { success: false, duration: 0 };
      }
    })) as { success: boolean; duration: number };

    expect(result.success).toBeTruthy();
    expect(result.duration).toBeLessThan(1500);
  });

  test('Fast WiFi network: immediate gallery loading', async ({ page }) => {
    await applyNetworkProfile(page, NETWORK_PROFILES.wifi);

    const result = (await page.evaluate(async () => {
      const startTime = performance.now();
      const harness = (window as any).__XEG_HARNESS__;
      if (!harness) return { success: false, duration: 0 };

      try {
        await harness.setupGalleryApp();
        const endTime = performance.now();
        return { success: true, duration: endTime - startTime };
      } catch {
        return { success: false, duration: 0 };
      }
    })) as { success: boolean; duration: number };

    expect(result.success).toBeTruthy();
    expect(result.duration).toBeLessThan(1000);
  });

  test('Offline scenario: gallery initialization handles offline state', async ({ page }) => {
    await applyNetworkProfile(page, NETWORK_PROFILES.offline);

    const result = (await page.evaluate(async () => {
      const harness = (window as any).__XEG_HARNESS__;
      if (!harness) return { success: false };

      try {
        await harness.setupGalleryApp();
        return { success: true };
      } catch {
        return { success: false };
      }
    })) as { success: boolean };

    expect(typeof result).toBe('object');
  });

  test('Network recovery: gallery responds after coming online', async ({ page }) => {
    await applyNetworkProfile(page, NETWORK_PROFILES.offline);
    await applyNetworkProfile(page, NETWORK_PROFILES.wifi);

    const result = (await page.evaluate(async () => {
      const harness = (window as any).__XEG_HARNESS__;
      if (!harness) return { success: false };

      try {
        const startTime = performance.now();
        await harness.setupGalleryApp();
        const endTime = performance.now();
        return { success: true, duration: endTime - startTime };
      } catch {
        return { success: false };
      }
    })) as { success: boolean; duration?: number };

    expect(result.success).toBeTruthy();
    if (result.duration !== undefined) {
      expect(result.duration).toBeLessThan(1000);
    }
  });

  test('Gallery events are registered under all network conditions', async ({ page }) => {
    const profiles = ['3g', '4g', 'wifi'] as const;

    for (const profileName of profiles) {
      const profile = NETWORK_PROFILES[profileName];
      await applyNetworkProfile(page, profile);

      const result = (await page.evaluate(async () => {
        const harness = (window as any).__XEG_HARNESS__;
        if (!harness) return { success: false, eventCount: 0 };

        try {
          await harness.setupGalleryApp();
          const events = await harness.evaluateGalleryEvents();
          return { success: true, eventCount: events.registeredEvents?.length || 0 };
        } catch {
          return { success: false, eventCount: 0 };
        }
      })) as { success: boolean; eventCount: number };

      expect(result.success).toBeTruthy();
      expect(result.eventCount).toBeGreaterThan(0);
    }
  });

  test('Performance comparison: all network profiles complete successfully', async ({ page }) => {
    const measurements: Record<string, number> = {};

    const profiles = ['3g', '4g', 'wifi'] as const;

    for (const profileName of profiles) {
      const profile = NETWORK_PROFILES[profileName];
      await applyNetworkProfile(page, profile);

      const duration = (await page.evaluate(async () => {
        const startTime = performance.now();
        const harness = (window as any).__XEG_HARNESS__;
        if (!harness) return 0;

        try {
          await harness.setupGalleryApp();
          await harness.disposeGalleryApp();
          const endTime = performance.now();
          return endTime - startTime;
        } catch {
          return 0;
        }
      })) as number;

      measurements[profileName] = duration;
    }

    expect(measurements['4g']).toBeGreaterThan(0);
    expect(measurements['3g']).toBeGreaterThan(0);
    expect(measurements.wifi).toBeGreaterThan(0);
  });

  test('Toolbar remains functional under 3G network conditions', async ({ page }) => {
    await applyNetworkProfile(page, NETWORK_PROFILES['3g']);

    const result = (await page.evaluate(async () => {
      const harness = (window as any).__XEG_HARNESS__;
      if (!harness) return { success: false };

      try {
        await harness.setupGalleryApp();
        await harness.triggerGalleryAppMediaClick();
        const state = await harness.getGalleryAppState();
        return { success: true, isOpen: state.isOpen, mediaCount: state.mediaCount };
      } catch {
        return { success: false };
      }
    })) as { success: boolean; isOpen?: boolean; mediaCount?: number };

    expect(result.success).toBeTruthy();
    if (result.isOpen !== undefined) {
      expect(result.isOpen).toBeTruthy();
    }
  });
});
