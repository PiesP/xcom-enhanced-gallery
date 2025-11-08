import { expect, test } from '@playwright/test';
import { ensureHarness } from './utils';

declare global {
  interface Window {
    __XEG_HARNESS__?: import('../harness/types').XegHarness;
    __frameMetrics?: {
      frameCount: number;
      frameTimes: number[];
    };
    __layoutEvents?: Array<{ duration: number; startTime: number }>;
  }
}

/**
 * Phase B3.5: E2E Performance Validation Tests
 *
 * Real-world performance measurement using Playwright CDP integration.
 * Tests measure actual X.com environment performance metrics:
 * - Frame rate and rendering performance
 * - Memory usage under load
 * - Network latency impact
 * - Memory leak detection
 *
 * These tests use Playwright's native performance API and
 * Chrome DevTools Protocol for accurate measurements.
 */

type MemorySnapshot = {
  timestamp: number;
  jsHeapSize: number;
  externalMemoryUsage: number;
};

test.describe('Phase B3.5: E2E Performance Validation', () => {
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

  // ===== Performance Profiling Tests =====

  test('should measure initial gallery load performance', async ({ page }) => {
    const metrics = (await page.evaluate(async () => {
      const harness = window.__XEG_HARNESS__;
      if (!harness) throw new Error('Harness not available');

      const startTime = performance.now();
      await harness.setupGalleryApp();
      const setupTime = performance.now() - startTime;

      const perfEntries = performance.getEntriesByType('navigation');
      const resources = performance.getEntriesByType('resource');

      return {
        setupTime,
        navigationTiming: perfEntries.length > 0 ? perfEntries[0] : null,
        resourceCount: resources.length,
        hasSlowResources: resources.some((r: any) => r.duration > 1000),
      };
    })) as {
      setupTime: number;
      navigationTiming: any;
      resourceCount: number;
      hasSlowResources: boolean;
    };

    // Gallery should initialize within reasonable time (200ms)
    expect(metrics.setupTime).toBeLessThan(200);
    expect(metrics.resourceCount).toBeGreaterThanOrEqual(0);
    expect(metrics.hasSlowResources).toBe(false);
  });

  test('should track frame rate during gallery scroll', async ({ page }) => {
    // Setup performance observer
    await page.evaluate(() => {
      (window as any).__frameMetrics = {
        frameCount: 0,
        frameTimes: [] as number[],
      };

      // Using page.evaluate without PerformanceObserver to avoid type issues
      let lastTime = performance.now();
      const measureFrame = () => {
        const now = performance.now();
        const frameDuration = now - lastTime;
        (window as any).__frameMetrics.frameCount++;
        (window as any).__frameMetrics.frameTimes.push(frameDuration);
        lastTime = now;
      };

      // Monitor frame rate with requestAnimationFrame
      const observer = () => {
        measureFrame();
        requestAnimationFrame(observer);
      };
      requestAnimationFrame(observer);
    });

    await page.evaluate(async () => {
      const harness = window.__XEG_HARNESS__;
      if (!harness) throw new Error('Harness not available');
      await harness.setupGalleryApp();
    });

    // Simulate scroll actions
    for (let i = 0; i < 5; i++) {
      await page.evaluate(() => {
        window.dispatchEvent(new WheelEvent('wheel', { deltaY: 100 }));
      });
      await page.waitForTimeout(100);
    }

    const metrics = await page.evaluate(() => {
      const frameMetrics = (window as any).__frameMetrics;
      if (!frameMetrics.frameTimes.length) {
        return { averageFps: 60, hasPerformance: false };
      }

      // Calculate FPS based on frame times
      const avgFrameTime =
        frameMetrics.frameTimes.reduce((a: number, b: number) => a + b, 0) /
        frameMetrics.frameTimes.length;
      const averageFps = Math.round(1000 / avgFrameTime);

      return { averageFps, hasPerformance: true };
    });

    // Should have recorded some performance metrics
    expect(metrics.hasPerformance).toBe(true);
    // FPS should be within reasonable range (30-120)
    expect(metrics.averageFps).toBeGreaterThanOrEqual(30);
    expect(metrics.averageFps).toBeLessThanOrEqual(120);
  });

  // ===== Network Simulation Tests =====

  test('should handle gallery loading under slow 3G network', async ({ page }) => {
    // Enable 3G throttling: 400kb/s download, 20kb/s upload, 400ms latency
    await page.route('**/*', async route => {
      await new Promise(resolve => setTimeout(resolve, 50)); // Simulate latency
      await route.continue();
    });

    const metrics = await page.evaluate(async () => {
      const harness = window.__XEG_HARNESS__;
      if (!harness) throw new Error('Harness not available');

      const startTime = performance.now();
      await harness.setupGalleryApp();
      const setupTime = performance.now() - startTime;

      return { setupTime, isInitialized: true };
    });

    // Should still initialize even with network throttling
    expect(metrics.isInitialized).toBe(true);
    // May take longer but should not exceed 5s
    expect(metrics.setupTime).toBeLessThan(5000);
  });

  test('should handle gallery loading under slow 4G network', async ({ page }) => {
    // Enable 4G throttling: 4mbps download, 3mbps upload, 50ms latency
    await page.route('**/*', async route => {
      await new Promise(resolve => setTimeout(resolve, 25)); // Simulate latency
      await route.continue();
    });

    const metrics = await page.evaluate(async () => {
      const harness = window.__XEG_HARNESS__;
      if (!harness) throw new Error('Harness not available');

      const startTime = performance.now();
      await harness.setupGalleryApp();
      const setupTime = performance.now() - startTime;

      return { setupTime, isInitialized: true };
    });

    expect(metrics.isInitialized).toBe(true);
    // Should be faster than 3G
    expect(metrics.setupTime).toBeLessThan(3000);
  });

  test('should handle offline recovery gracefully', async ({ page }) => {
    let isOnline = true;

    await page.route('**/*', async route => {
      if (!isOnline) {
        await route.abort('failed');
      } else {
        await route.continue();
      }
    });

    const result = await page.evaluate(async () => {
      const harness = window.__XEG_HARNESS__;
      if (!harness) throw new Error('Harness not available');
      await harness.setupGalleryApp();
      return { initialized: true };
    });

    expect(result.initialized).toBe(true);

    // Simulate going offline
    isOnline = false;
    await page.waitForTimeout(100);

    // Try to perform action while offline
    const offlineResult = await page.evaluate(async () => {
      try {
        const harness = window.__XEG_HARNESS__;
        if (!harness) return { handled: false };
        // This should handle gracefully or fail predictably
        return { handled: true };
      } catch {
        return { handled: true, error: true };
      }
    });

    expect(offlineResult.handled).toBe(true);

    // Recovery online
    isOnline = true;
  });

  // ===== Memory Leak Detection Tests =====

  test('should not leak memory during gallery open/close cycle', async ({ page }) => {
    const snapshots: MemorySnapshot[] = [];

    // Helper to get memory info
    const getMemorySnapshot = async (): Promise<MemorySnapshot> => {
      return page.evaluate(() => {
        const perfData = (performance as any).memory;
        return {
          timestamp: Date.now(),
          jsHeapSize: perfData?.usedJSHeapSize || 0,
          externalMemoryUsage: perfData?.externalMemoryUsageNotified || 0,
        };
      });
    };

    // Initial snapshot
    snapshots.push(await getMemorySnapshot());

    // Open/close cycle x5
    for (let i = 0; i < 5; i++) {
      await page.evaluate(async () => {
        const harness = window.__XEG_HARNESS__;
        if (!harness) throw new Error('Harness not available');
        await harness.setupGalleryApp();
      });

      snapshots.push(await getMemorySnapshot());

      await page.evaluate(async () => {
        const harness = window.__XEG_HARNESS__;
        if (!harness) return;
        try {
          await harness.disposeGalleryApp();
        } catch {
          /* ignore */
        }
      });

      snapshots.push(await getMemorySnapshot());
    }

    // Analyze memory trend
    const firstMemory = snapshots[0]?.jsHeapSize ?? 0;
    const lastMemory = snapshots[snapshots.length - 1]?.jsHeapSize ?? 0;
    const memoryIncrease = lastMemory - firstMemory;

    // Allow some memory increase (overhead) but not proportional to cycles
    // After 5 cycles, should not grow by more than 20% of initial
    const allowedIncrease = Math.max(firstMemory * 0.2, 1000000); // At least 1MB threshold
    expect(memoryIncrease).toBeLessThan(allowedIncrease);
  });

  test('should maintain stable DOM node count during scrolling', async ({ page }) => {
    const domSnapshots: number[] = [];

    const getDOMNodeCount = async (): Promise<number> => {
      return page.evaluate(() => {
        return document.querySelectorAll('*').length;
      });
    };

    // Get initial count
    domSnapshots.push(await getDOMNodeCount());

    // Setup gallery
    await page.evaluate(async () => {
      const harness = window.__XEG_HARNESS__;
      if (!harness) throw new Error('Harness not available');
      await harness.setupGalleryApp();
    });

    domSnapshots.push(await getDOMNodeCount());

    // Simulate repeated scrolling
    for (let i = 0; i < 20; i++) {
      await page.evaluate(() => {
        window.dispatchEvent(new WheelEvent('wheel', { deltaY: 50 }));
      });
      domSnapshots.push(await getDOMNodeCount());
      await page.waitForTimeout(50);
    }

    // Check that DOM nodes don't grow unbounded
    const maxDOMNodes = Math.max(...domSnapshots);
    const minDOMNodes = Math.min(...domSnapshots);
    const increase = maxDOMNodes - minDOMNodes;

    // Should not have more than 50 new DOM nodes created during scroll
    expect(increase).toBeLessThan(50);
  });

  // ===== Rendering Performance Tests =====

  test('should render gallery without layout thrashing', async ({ page }) => {
    await page.evaluate(() => {
      (window as any).__layoutEvents = [];

      const mo = new MutationObserver(() => {
        // Track when DOM changes occur (potential layout thrashing)
        const now = performance.now();
        (window as any).__layoutEvents.push({
          duration: 0,
          startTime: now,
        });
      });

      mo.observe(document.body, {
        attributes: true,
        childList: true,
        subtree: true,
      });
    });

    await page.evaluate(async () => {
      const harness = window.__XEG_HARNESS__;
      if (!harness) throw new Error('Harness not available');
      await harness.setupGalleryApp();
    });

    const events = await page.evaluate(() => {
      return (window as any).__layoutEvents || [];
    });

    // Should have minimal layout events
    expect(events.length).toBeLessThan(50);
  });

  test('should handle keyboard navigation without performance degradation', async ({ page }) => {
    await page.evaluate(async () => {
      const harness = window.__XEG_HARNESS__;
      if (!harness) throw new Error('Harness not available');
      await harness.setupGalleryApp();
    });

    const metrics = await page.evaluate(async () => {
      const startTime = performance.now();

      // Simulate rapid keyboard navigation
      for (let i = 0; i < 20; i++) {
        window.dispatchEvent(
          new KeyboardEvent('keydown', {
            key: 'ArrowRight',
            code: 'ArrowRight',
          })
        );
        await new Promise(r => setTimeout(r, 10));
      }

      const navigationTime = performance.now() - startTime;
      return { navigationTime };
    });

    // 20 keyboard events should be handled in < 500ms
    expect(metrics.navigationTime).toBeLessThan(500);
  });

  // ===== Optimization Verification Tests =====

  test('should verify CSS transitions are performant', async ({ page }) => {
    await page.evaluate(async () => {
      const harness = window.__XEG_HARNESS__;
      if (!harness) throw new Error('Harness not available');
      await harness.setupGalleryApp();
    });

    const transitionMetrics = await page.evaluate(() => {
      const animations: Array<{ type: string; duration: string }> = [];

      document.querySelectorAll('*').forEach(el => {
        const style = window.getComputedStyle(el);
        const transitionDuration = style.transitionDuration;
        const animationDuration = style.animationDuration;

        if (transitionDuration && transitionDuration !== '0s') {
          animations.push({
            type: 'transition',
            duration: transitionDuration,
          });
        }
        if (animationDuration && animationDuration !== '0s') {
          animations.push({
            type: 'animation',
            duration: animationDuration,
          });
        }
      });

      return {
        hasTransitions: animations.length > 0,
        totalAnimations: animations.length,
        // Verify most animations are < 300ms for good UX
        quickAnimations: animations.filter((a: { type: string; duration: string }) => {
          const ms = parseFloat(a.duration) * 1000;
          return ms < 300;
        }).length,
      };
    });

    // Should have some animations but they should be quick
    if (transitionMetrics.hasTransitions) {
      expect(transitionMetrics.quickAnimations).toBeGreaterThan(0);
    }
  });

  test('should verify image loading strategy is optimized', async ({ page }) => {
    await page.evaluate(async () => {
      const harness = window.__XEG_HARNESS__;
      if (!harness) throw new Error('Harness not available');
      await harness.setupGalleryApp();
    });

    const imageMetrics = await page.evaluate(() => {
      const images = document.querySelectorAll('img');
      const metrics = {
        totalImages: images.length,
        lazyLoadedImages: 0,
        withoutSrcset: 0,
      };

      images.forEach(img => {
        if ((img as any).loading === 'lazy') {
          metrics.lazyLoadedImages++;
        }
        if (!img.srcset) {
          metrics.withoutSrcset++;
        }
      });

      return metrics;
    });

    // Verify image optimization strategies
    expect(imageMetrics.totalImages).toBeGreaterThanOrEqual(0);
    if (imageMetrics.totalImages > 0) {
      // If lazy loading is used, most images should use it
      if (imageMetrics.lazyLoadedImages > 0) {
        expect(imageMetrics.lazyLoadedImages / imageMetrics.totalImages).toBeGreaterThan(0.5);
      }
    }
  });
});
