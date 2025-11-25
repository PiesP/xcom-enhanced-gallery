/**
 * @fileoverview Tests for PrefetchManager
 */
import { HttpRequestService } from "@shared/services/http-request-service";
import { PrefetchManager } from "@shared/services/media/prefetch-manager";
import * as performanceUtils from "@shared/utils/performance";
import { globalTimerManager } from "@shared/utils/time/timer-management";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@shared/services/http-request-service");
vi.mock("@shared/utils/time/timer-management");
vi.mock("@shared/utils/performance");

describe("PrefetchManager", () => {
  let manager: PrefetchManager;
  let mockHttpService: { get: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    mockHttpService = {
      get: vi.fn(),
    };
    vi.mocked(HttpRequestService.getInstance).mockReturnValue(
      mockHttpService as unknown as HttpRequestService,
    );
    vi.mocked(globalTimerManager.setTimeout).mockImplementation(
      (fn: () => void) => {
        fn();
        return 1;
      },
    );

    manager = new PrefetchManager(20);
  });

  afterEach(() => {
    vi.clearAllMocks();
    manager.destroy();
  });

  describe("prefetch", () => {
    it("should fetch and cache media", async () => {
      const blob = new Blob(["test"]);
      mockHttpService.get.mockResolvedValue({ ok: true, data: blob });

      await manager.prefetch({ url: "http://example.com/1.jpg" } as never, {
        schedule: "immediate",
      });

      expect(mockHttpService.get).toHaveBeenCalledWith(
        "http://example.com/1.jpg",
        expect.objectContaining({ responseType: "blob" }),
      );
      const cached = manager.get("http://example.com/1.jpg");
      expect(cached).not.toBeNull();
      await expect(cached).resolves.toBe(blob);
    });

    it("should not fetch if already cached", async () => {
      const blob = new Blob(["test"]);
      mockHttpService.get.mockResolvedValue({ ok: true, data: blob });

      await manager.prefetch({ url: "http://example.com/1.jpg" } as never, {
        schedule: "immediate",
      });
      mockHttpService.get.mockClear();

      await manager.prefetch({ url: "http://example.com/1.jpg" } as never, {
        schedule: "immediate",
      });

      expect(mockHttpService.get).not.toHaveBeenCalled();
    });

    it("should schedule with idle", async () => {
      await manager.prefetch({ url: "http://example.com/1.jpg" } as never, {
        schedule: "idle",
      });
      expect(performanceUtils.scheduleIdle).toHaveBeenCalled();
    });

    it("should schedule with raf", async () => {
      await manager.prefetch({ url: "http://example.com/1.jpg" } as never, {
        schedule: "raf",
      });
      expect(performanceUtils.scheduleRaf).toHaveBeenCalled();
    });

    it("should schedule with microtask", async () => {
      await manager.prefetch({ url: "http://example.com/1.jpg" } as never, {
        schedule: "microtask",
      });
      expect(performanceUtils.scheduleMicrotask).toHaveBeenCalled();
    });

    it("should use setTimeout by default", async () => {
      await manager.prefetch({ url: "http://example.com/1.jpg" } as never, {});
      expect(globalTimerManager.setTimeout).toHaveBeenCalled();
    });
  });

  describe("prefetchAround", () => {
    it("should prefetch items around current index", async () => {
      const urls = ["url1", "url2", "url3", "url4", "url5"];
      const currentIndex = 2; // url3 is current

      // Prefetch around - default uses "idle" schedule
      await manager.prefetchAround(urls, currentIndex, {
        prefetchRange: 1,
      });

      // Should have scheduled prefetching for url2 and url4 (index 1 and 3)
      // prefetchAround uses "idle" by default
      expect(performanceUtils.scheduleIdle).toHaveBeenCalled();
    });
  });

  describe("cache operations", () => {
    it("should return null for uncached urls", () => {
      expect(manager.get("nonexistent")).toBeNull();
    });

    it("should check if url is cached", async () => {
      const blob = new Blob(["test"]);
      mockHttpService.get.mockResolvedValue({ ok: true, data: blob });

      expect(manager.has("http://example.com/1.jpg")).toBe(false);

      await manager.prefetch({ url: "http://example.com/1.jpg" } as never, {
        schedule: "immediate",
      });

      expect(manager.has("http://example.com/1.jpg")).toBe(true);
    });

    it("should clear cache", async () => {
      const blob = new Blob(["test"]);
      mockHttpService.get.mockResolvedValue({ ok: true, data: blob });

      await manager.prefetch({ url: "http://example.com/1.jpg" } as never, {
        schedule: "immediate",
      });

      manager.clear();

      expect(manager.has("http://example.com/1.jpg")).toBe(false);
    });

    it("should evict oldest entry when full", async () => {
      const smallManager = new PrefetchManager(2);
      const blob = new Blob(["test"]);
      mockHttpService.get.mockResolvedValue({ ok: true, data: blob });

      await smallManager.prefetch({ url: "url1" } as never, {
        schedule: "immediate",
      });
      await smallManager.prefetch({ url: "url2" } as never, {
        schedule: "immediate",
      });
      await smallManager.prefetch({ url: "url3" } as never, {
        schedule: "immediate",
      });

      expect(smallManager.has("url1")).toBe(false);
      expect(smallManager.has("url2")).toBe(true);
      expect(smallManager.has("url3")).toBe(true);

      smallManager.destroy();
    });
  });

  describe("cancelAll", () => {
    it("should abort all active requests", () => {
      // Start a request that won't resolve immediately
      mockHttpService.get.mockReturnValue(new Promise(() => {}));

      manager.prefetch({ url: "http://example.com/1.jpg" } as never, {
        schedule: "immediate",
      });

      // Should not throw
      expect(() => manager.cancelAll()).not.toThrow();
    });
  });

  describe("destroy", () => {
    it("should cancel and clear everything", async () => {
      const blob = new Blob(["test"]);
      mockHttpService.get.mockResolvedValue({ ok: true, data: blob });

      await manager.prefetch({ url: "http://example.com/1.jpg" } as never, {
        schedule: "immediate",
      });

      manager.destroy();

      expect(manager.has("http://example.com/1.jpg")).toBe(false);
    });
  });

  describe("getCache", () => {
    it("should return the internal cache map", async () => {
      const blob = new Blob(["test"]);
      mockHttpService.get.mockResolvedValue({ ok: true, data: blob });

      await manager.prefetch({ url: "http://example.com/1.jpg" } as never, {
        schedule: "immediate",
      });

      const cache = manager.getCache();
      expect(cache).toBeInstanceOf(Map);
      expect(cache.has("http://example.com/1.jpg")).toBe(true);
    });
  });
});
