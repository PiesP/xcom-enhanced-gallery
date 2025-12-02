import { DownloadOrchestrator } from "@shared/services/download/download-orchestrator";
import * as fallbackModule from "@shared/services/download/fallback-download";
import * as singleDownloadModule from "@shared/services/download/single-download";
import type {
    SingleDownloadResult,
    ZipResult,
} from "@shared/services/download/types";
import * as zipDownloadModule from "@shared/services/download/zip-download";
import * as fileNamingModule from "@shared/services/filename-service";
import type { MediaInfo } from "@shared/types/media.types";
import { ErrorCode } from "@shared/types/result.types";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// Mock dependencies
vi.mock("@shared/services/download/single-download", () => ({
  downloadSingleFile: vi.fn(),
  getGMDownload: vi.fn(),
}));

vi.mock("@shared/services/download/zip-download", () => ({
  downloadAsZip: vi.fn(),
}));

vi.mock("@shared/services/filename-service", () => ({
  generateMediaFilename: vi.fn(),
  generateZipFilename: vi.fn(),
}));

vi.mock("@shared/services/download/fallback-download", () => ({
  detectDownloadCapability: vi.fn(),
  downloadBlobWithAnchor: vi.fn(),
}));

describe("DownloadOrchestrator", () => {
  let orchestrator: DownloadOrchestrator;

  beforeEach(() => {
    // Reset singleton instance to ensure fresh state for each test
    DownloadOrchestrator.resetInstance();
    vi.clearAllMocks();

    // Mock URL.createObjectURL and revokeObjectURL
    global.URL.createObjectURL = vi.fn(() => "blob:mock-url");
    global.URL.revokeObjectURL = vi.fn();

    // Default: simulate GM_download available environment
    vi.mocked(fallbackModule.detectDownloadCapability).mockReturnValue({
      hasGMDownload: true,
      hasFetch: true,
      hasBlob: true,
      method: 'gm_download',
    });

    // Get fresh instance after mocks are set up
    orchestrator = DownloadOrchestrator.getInstance();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("downloadSingle", () => {
    it("should delegate to downloadSingleFile", async () => {
      const mockMedia = { url: "http://example.com/image.jpg" } as MediaInfo;
      const mockOptions = { zipFilename: "test.zip" };
      const mockResult: SingleDownloadResult = {
        success: true,
      };

      vi.mocked(singleDownloadModule.downloadSingleFile).mockResolvedValue(
        mockResult,
      );

      const result = await orchestrator.downloadSingle(mockMedia, mockOptions);

      expect(singleDownloadModule.downloadSingleFile).toHaveBeenCalledWith(
        mockMedia,
        mockOptions,
      );
      expect(result).toBe(mockResult);
    });
  });

  describe("downloadBulk", () => {
    const mockMediaItems = [
      { url: "http://example.com/1.jpg" },
      { url: "http://example.com/2.jpg" },
    ] as MediaInfo[];

    beforeEach(() => {
      vi.mocked(fileNamingModule.generateMediaFilename).mockReturnValue(
        "image.jpg",
      );
      vi.mocked(fileNamingModule.generateZipFilename).mockReturnValue(
        "gallery.zip",
      );
    });

    it("should handle complete failure (no files downloaded)", async () => {
      vi.mocked(zipDownloadModule.downloadAsZip).mockResolvedValue({
        filesSuccessful: 0,
        failures: [{ url: "http://example.com/1.jpg", error: "Failed" }],
        zipData: null,
      } as unknown as ZipResult);

      const result = await orchestrator.downloadBulk(mockMediaItems);

      expect(result.success).toBe(false);
      expect(result.code).toBe(ErrorCode.ALL_FAILED);
      expect(result.filesSuccessful).toBe(0);
    });

    it("should save zip using GM_download when available", async () => {
      const mockZipData = new Blob(["mock data"]);
      vi.mocked(zipDownloadModule.downloadAsZip).mockResolvedValue({
        filesSuccessful: 2,
        failures: [],
        zipData: mockZipData,
      } as unknown as ZipResult);

      const mockGMDownload = vi.fn((opts) => opts.onload());
      vi.mocked(singleDownloadModule.getGMDownload).mockReturnValue(
        mockGMDownload,
      );

      const result = await orchestrator.downloadBulk(mockMediaItems);

      expect(result.success).toBe(true);
      expect(singleDownloadModule.getGMDownload).toHaveBeenCalled();
      expect(mockGMDownload).toHaveBeenCalledWith(
        expect.objectContaining({
          url: "blob:mock-url",
          name: "gallery.zip",
        }),
      );
      expect(URL.revokeObjectURL).toHaveBeenCalledWith("blob:mock-url");
    });

    it("should use fallback module when GM_download is missing", async () => {
      vi.mocked(fallbackModule.detectDownloadCapability).mockReturnValue({
        hasGMDownload: false,
        hasFetch: true,
        hasBlob: true,
        method: 'fetch_blob',
      });

      const mockZipData = new Blob(["mock data"]);
      vi.mocked(zipDownloadModule.downloadAsZip).mockResolvedValue({
        filesSuccessful: 2,
        failures: [],
        zipData: mockZipData,
      } as unknown as ZipResult);

      vi.mocked(singleDownloadModule.getGMDownload).mockReturnValue(undefined);

      vi.mocked(fallbackModule.downloadBlobWithAnchor).mockResolvedValue({
        success: true,
        filename: "gallery.zip",
      });

      const result = await orchestrator.downloadBulk(mockMediaItems);

      expect(result.success).toBe(true);
      expect(fallbackModule.downloadBlobWithAnchor).toHaveBeenCalled();
    });

    it("should report partial success", async () => {
      const mockZipData = new Blob(["mock data"]);
      vi.mocked(zipDownloadModule.downloadAsZip).mockResolvedValue({
        filesSuccessful: 1,
        failures: [{ url: "http://example.com/2.jpg", error: "Failed" }],
        zipData: mockZipData,
      } as unknown as ZipResult);

      vi.mocked(singleDownloadModule.getGMDownload).mockReturnValue(
        vi.fn((opts) => opts.onload()),
      );

      const result = await orchestrator.downloadBulk(mockMediaItems);

      expect(result.success).toBe(true);
      expect(result.status).toBe("partial");
      expect(result.filesSuccessful).toBe(1);
    });

    it("should handle GM_download errors", async () => {
      const mockZipData = new Blob(["mock data"]);
      vi.mocked(zipDownloadModule.downloadAsZip).mockResolvedValue({
        filesSuccessful: 2,
        failures: [],
        zipData: mockZipData,
      } as unknown as ZipResult);

      const mockGMDownload = vi.fn((opts) =>
        opts.onerror(new Error("GM Error")),
      );
      vi.mocked(singleDownloadModule.getGMDownload).mockReturnValue(
        mockGMDownload,
      );

      const result = await orchestrator.downloadBulk(mockMediaItems);

      expect(result.success).toBe(false);
      expect(result.status).toBe("error");
      expect(result.error).toContain("GM Error");
    });

    it("should use fallback when GM_download is not available", async () => {
      vi.mocked(fallbackModule.detectDownloadCapability).mockReturnValue({
        hasGMDownload: false,
        hasFetch: true,
        hasBlob: true,
        method: 'fetch_blob',
      });

      const mockZipData = new Blob(["mock data"]);
      vi.mocked(zipDownloadModule.downloadAsZip).mockResolvedValue({
        filesSuccessful: 2,
        failures: [],
        zipData: mockZipData,
      } as unknown as ZipResult);

      vi.mocked(fallbackModule.downloadBlobWithAnchor).mockResolvedValue({
        success: true,
        filename: "test.zip",
      });

      const result = await orchestrator.downloadBulk(mockMediaItems);

      expect(result.success).toBe(true);
      expect(fallbackModule.downloadBlobWithAnchor).toHaveBeenCalled();
    });

    it("should handle fallback anchor download failure", async () => {
      vi.mocked(fallbackModule.detectDownloadCapability).mockReturnValue({
        hasGMDownload: false,
        hasFetch: true,
        hasBlob: true,
        method: 'fetch_blob',
      });

      const mockZipData = new Blob(["mock data"]);
      vi.mocked(zipDownloadModule.downloadAsZip).mockResolvedValue({
        filesSuccessful: 2,
        failures: [],
        zipData: mockZipData,
      } as unknown as ZipResult);

      vi.mocked(fallbackModule.downloadBlobWithAnchor).mockResolvedValue({
        success: false,
        error: "Failed to trigger download",
      });

      const result = await orchestrator.downloadBulk(mockMediaItems);

      expect(result.success).toBe(false);
      expect(result.status).toBe("error");
      expect(result.error).toBe("Failed to trigger download");
      expect(result.code).toBe(ErrorCode.ALL_FAILED);
    });

    it("should handle no download method available", async () => {
      vi.mocked(fallbackModule.detectDownloadCapability).mockReturnValue({
        hasGMDownload: false,
        hasFetch: false,
        hasBlob: false,
        method: 'none',
      });

      const mockZipData = new Blob(["mock data"]);
      vi.mocked(zipDownloadModule.downloadAsZip).mockResolvedValue({
        filesSuccessful: 2,
        failures: [],
        zipData: mockZipData,
      } as unknown as ZipResult);

      const result = await orchestrator.downloadBulk(mockMediaItems);

      expect(result.success).toBe(false);
      expect(result.status).toBe("error");
      expect(result.error).toBe("No download method available");
      expect(result.code).toBe(ErrorCode.ALL_FAILED);
    });

    it("should handle GM_download timeout", async () => {
      const mockZipData = new Blob(["mock data"]);
      vi.mocked(zipDownloadModule.downloadAsZip).mockResolvedValue({
        filesSuccessful: 2,
        failures: [],
        zipData: mockZipData,
      } as unknown as ZipResult);

      const mockGMDownload = vi.fn((opts) => opts.ontimeout());
      vi.mocked(singleDownloadModule.getGMDownload).mockReturnValue(
        mockGMDownload,
      );

      const result = await orchestrator.downloadBulk(mockMediaItems);

      expect(result.success).toBe(false);
      expect(result.error).toBe("Timeout");
    });

    it("should pass prefetched blobs to downloadAsZip", async () => {
      const mockBlob = new Blob(["test"]);
      const prefetchedBlobs = new Map([["http://example.com/1.jpg", mockBlob]]);

      const mockZipData = new Blob(["mock data"]);
      vi.mocked(zipDownloadModule.downloadAsZip).mockResolvedValue({
        filesSuccessful: 2,
        failures: [],
        zipData: mockZipData,
      } as unknown as ZipResult);

      vi.mocked(singleDownloadModule.getGMDownload).mockReturnValue(
        vi.fn((opts) => opts.onload()),
      );

      await orchestrator.downloadBulk(mockMediaItems, { prefetchedBlobs });

      expect(zipDownloadModule.downloadAsZip).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({ blob: mockBlob }),
          expect.objectContaining({ blob: undefined }),
        ]),
        expect.objectContaining({ prefetchedBlobs }),
      );
    });

    it("should use custom zipFilename when provided", async () => {
      const mockZipData = new Blob(["mock data"]);
      vi.mocked(zipDownloadModule.downloadAsZip).mockResolvedValue({
        filesSuccessful: 2,
        failures: [],
        zipData: mockZipData,
      } as unknown as ZipResult);

      const mockGMDownload = vi.fn((opts) => opts.onload());
      vi.mocked(singleDownloadModule.getGMDownload).mockReturnValue(
        mockGMDownload,
      );

      await orchestrator.downloadBulk(mockMediaItems, { zipFilename: "custom.zip" });

      expect(mockGMDownload).toHaveBeenCalledWith(
        expect.objectContaining({
          name: "custom.zip",
        }),
      );
    });

    it("should return correct filesProcessed count", async () => {
      const mockZipData = new Blob(["mock data"]);
      vi.mocked(zipDownloadModule.downloadAsZip).mockResolvedValue({
        filesSuccessful: 2,
        failures: [],
        zipData: mockZipData,
      } as unknown as ZipResult);

      vi.mocked(singleDownloadModule.getGMDownload).mockReturnValue(
        vi.fn((opts) => opts.onload()),
      );

      const result = await orchestrator.downloadBulk(mockMediaItems);

      expect(result.filesProcessed).toBe(2);
    });

    it("should handle exception from downloadAsZip", async () => {
      vi.mocked(zipDownloadModule.downloadAsZip).mockRejectedValue(
        new Error("Zip creation failed"),
      );

      const result = await orchestrator.downloadBulk(mockMediaItems);

      expect(result.success).toBe(false);
      expect(result.status).toBe("error");
      expect(result.error).toBe("Zip creation failed");
    });

    it("should handle non-Error exceptions", async () => {
      vi.mocked(zipDownloadModule.downloadAsZip).mockRejectedValue("string error");

      const result = await orchestrator.downloadBulk(mockMediaItems);

      expect(result.success).toBe(false);
      expect(result.error).toBe("Unknown error");
    });

    it("should handle fallback download without error message", async () => {
      vi.mocked(fallbackModule.detectDownloadCapability).mockReturnValue({
        hasGMDownload: false,
        hasFetch: true,
        hasBlob: true,
        method: 'fetch_blob',
      });

      const mockZipData = new Blob(["mock data"]);
      vi.mocked(zipDownloadModule.downloadAsZip).mockResolvedValue({
        filesSuccessful: 2,
        failures: [],
        zipData: mockZipData,
      } as unknown as ZipResult);

      vi.mocked(fallbackModule.downloadBlobWithAnchor).mockResolvedValue({
        success: false,
      });

      const result = await orchestrator.downloadBulk(mockMediaItems);

      expect(result.success).toBe(false);
      expect(result.error).toBe("Failed to save ZIP file");
    });
  });
});
