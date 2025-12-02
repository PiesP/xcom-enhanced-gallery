import {
    downloadSingleFile,
    getGMDownload,
} from "@shared/services/download/single-download";
import * as fallbackModule from "@shared/services/download/fallback-download";
import * as fileNamingModule from "@shared/services/filename-service";
import type { MediaInfo } from "@shared/types/media.types";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// Mock dependencies
vi.mock("@shared/services/filename-service", () => ({
  generateMediaFilename: vi.fn(),
}));

vi.mock("@shared/utils/time/timer-management", () => ({
  globalTimerManager: {
    setTimeout: vi.fn((fn) => setTimeout(fn, 0)), // Immediate execution for timeout simulation? No, we want to control it.
    clearTimeout: vi.fn(),
  },
}));

// Mock fallback download module
vi.mock("@shared/services/download/fallback-download", () => ({
  detectDownloadCapability: vi.fn(),
  downloadBlobWithAnchor: vi.fn(),
  downloadWithFetchBlob: vi.fn(),
}));

describe("single-download", () => {
  const mockMedia: MediaInfo = {
    url: "http://example.com/image.jpg",
  } as MediaInfo;

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(fileNamingModule.generateMediaFilename).mockReturnValue(
      "image.jpg",
    );
    // Reset global GM_download
    (globalThis as any).GM_download = undefined;
    // Default: simulate GM_download available environment
    vi.mocked(fallbackModule.detectDownloadCapability).mockReturnValue({
      hasGMDownload: true,
      hasFetch: true,
      hasBlob: true,
      method: 'gm_download',
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
    delete (globalThis as any).GM_download;
  });

  describe("getGMDownload", () => {
    it("should return undefined if GM_download is not defined", () => {
      expect(getGMDownload()).toBeUndefined();
    });

    it("should return GM_download if defined globally", () => {
      const mockFn = vi.fn();
      (globalThis as any).GM_download = mockFn;
      expect(getGMDownload()).toBe(mockFn);
    });
  });

  describe("downloadSingleFile", () => {
    const originalCreateObjectURL = URL.createObjectURL;
    const originalRevokeObjectURL = URL.revokeObjectURL;
    const mockCreateObjectURL = vi.fn();
    const mockRevokeObjectURL = vi.fn();

    beforeEach(() => {
      URL.createObjectURL = mockCreateObjectURL;
      URL.revokeObjectURL = mockRevokeObjectURL;
      mockCreateObjectURL.mockReturnValue("blob:http://example.com/uuid");
    });

    afterEach(() => {
      URL.createObjectURL = originalCreateObjectURL;
      URL.revokeObjectURL = originalRevokeObjectURL;
    });

    it("should fail if aborted", async () => {
      const controller = new AbortController();
      controller.abort();
      const result = await downloadSingleFile(mockMedia, {
        signal: controller.signal,
      });
      expect(result.success).toBe(false);
      expect(result.error).toBe("User cancelled download");
    });

    it("should fail if no download method is available", async () => {
      vi.mocked(fallbackModule.detectDownloadCapability).mockReturnValue({
        hasGMDownload: false,
        hasFetch: false,
        hasBlob: false,
        method: 'none',
      });
      const result = await downloadSingleFile(mockMedia);
      expect(result.success).toBe(false);
      expect(result.error).toBe("No download method available in this environment");
    });

    it("should use fetch_blob fallback when GM_download is missing", async () => {
      vi.mocked(fallbackModule.detectDownloadCapability).mockReturnValue({
        hasGMDownload: false,
        hasFetch: true,
        hasBlob: true,
        method: 'fetch_blob',
      });
      vi.mocked(fallbackModule.downloadWithFetchBlob).mockResolvedValue({
        success: true,
        filename: "image.jpg",
      });

      const result = await downloadSingleFile(mockMedia);
      expect(result.success).toBe(true);
      expect(fallbackModule.downloadWithFetchBlob).toHaveBeenCalled();
    });

    it("should succeed when GM_download calls onload", async () => {
      const mockGMDownload = vi.fn((opts) => opts.onload());
      (globalThis as any).GM_download = mockGMDownload;

      const result = await downloadSingleFile(mockMedia);

      expect(result.success).toBe(true);
      expect(result.filename).toBe("image.jpg");
      expect(mockGMDownload).toHaveBeenCalledWith(
        expect.objectContaining({
          url: "http://example.com/image.jpg",
          name: "image.jpg",
        }),
      );
    });

    it("should fail when GM_download calls onerror", async () => {
      const mockGMDownload = vi.fn((opts) =>
        opts.onerror(new Error("Network Error")),
      );
      (globalThis as any).GM_download = mockGMDownload;

      const result = await downloadSingleFile(mockMedia);

      expect(result.success).toBe(false);
      expect(result.error).toContain("Network Error");
    });

    it("should fail when GM_download calls ontimeout", async () => {
      const mockGMDownload = vi.fn((opts) => opts.ontimeout());
      (globalThis as any).GM_download = mockGMDownload;

      const result = await downloadSingleFile(mockMedia);

      expect(result.success).toBe(false);
      expect(result.error).toBe("Download timeout");
    });

    it("should report progress", async () => {
      const onProgress = vi.fn();
      const mockGMDownload = vi.fn((opts) => {
        if (opts.onprogress) {
          opts.onprogress({ loaded: 50, total: 100 });
        }
        opts.onload();
      });
      (globalThis as any).GM_download = mockGMDownload;

      await downloadSingleFile(mockMedia, { onProgress });

      expect(onProgress).toHaveBeenCalledTimes(2);
      expect(onProgress).toHaveBeenNthCalledWith(
        1,
        expect.objectContaining({
          phase: "downloading",
          percentage: 50,
        }),
      );
    });

    it("should use blob URL if blob is provided", async () => {
      const mockGMDownload = vi.fn((opts) => opts.onload());
      (globalThis as any).GM_download = mockGMDownload;
      const mockBlob = new Blob(["test"], { type: "text/plain" });

      const result = await downloadSingleFile(mockMedia, { blob: mockBlob });

      expect(result.success).toBe(true);
      expect(mockCreateObjectURL).toHaveBeenCalledWith(mockBlob);
      expect(mockGMDownload).toHaveBeenCalledWith(
        expect.objectContaining({
          url: "blob:http://example.com/uuid",
          name: "image.jpg",
        }),
      );
      expect(mockRevokeObjectURL).toHaveBeenCalledWith(
        "blob:http://example.com/uuid",
      );
    });
  });
});
