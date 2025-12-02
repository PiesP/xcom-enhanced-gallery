import * as retryFetchModule from "@shared/network/retry-fetch";
import type { OrchestratorItem } from "@shared/services/download/types";
import { downloadAsZip } from "@shared/services/download/zip-download";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// Mock dependencies
vi.mock("@shared/external/zip", () => {
  return {
    StreamingZipWriter: class {
      addFile = vi.fn();
      finalize = vi.fn().mockReturnValue(new Blob(["zip content"]));
    },
  };
});

vi.mock("@shared/network/retry-fetch", () => ({
  fetchArrayBufferWithRetry: vi.fn(),
  DEFAULT_BACKOFF_BASE_MS: 100,
}));

vi.mock("@shared/services/download/download-utils", () => ({
  ensureUniqueFilenameFactory: () => (name: string) => name,
}));

describe("zip-download", () => {
  const mockItems: OrchestratorItem[] = [
    { url: "http://example.com/1.jpg", desiredName: "1.jpg" },
    { url: "http://example.com/2.jpg", desiredName: "2.jpg" },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("should download all items successfully", async () => {
    vi.mocked(retryFetchModule.fetchArrayBufferWithRetry).mockResolvedValue(
      new Uint8Array(10),
    );

    const result = await downloadAsZip(mockItems);

    expect(result.filesSuccessful).toBe(2);
    expect(result.failures).toHaveLength(0);
    expect(result.zipData).toBeInstanceOf(Blob);
    expect(retryFetchModule.fetchArrayBufferWithRetry).toHaveBeenCalledTimes(2);
  });

  it("should handle failures", async () => {
    vi.mocked(retryFetchModule.fetchArrayBufferWithRetry)
      .mockResolvedValueOnce(new Uint8Array(10))
      .mockRejectedValueOnce(new Error("Network Error"));

    const result = await downloadAsZip(mockItems);

    expect(result.filesSuccessful).toBe(1);
    expect(result.failures).toHaveLength(1);
    expect(result.failures[0]!.url).toBe("http://example.com/2.jpg");
    expect(result.failures[0]!.error).toBe("Network Error");
  });

  it("should use prefetched blobs if available", async () => {
    const blob = new Blob(["prefetched"]);
    blob.arrayBuffer = vi.fn().mockResolvedValue(new ArrayBuffer(10));
    const itemsWithBlob: OrchestratorItem[] = [
      {
        url: "http://example.com/1.jpg",
        desiredName: "1.jpg",
        blob: blob,
      },
    ];

    const result = await downloadAsZip(itemsWithBlob);

    expect(result.filesSuccessful).toBe(1);
    expect(retryFetchModule.fetchArrayBufferWithRetry).not.toHaveBeenCalled();
  });

  it("should respect abort signal", async () => {
    const controller = new AbortController();
    const signal = controller.signal;

    // Mock fetch to take some time so we can abort
    vi.mocked(retryFetchModule.fetchArrayBufferWithRetry).mockImplementation(
      async () => {
        controller.abort(); // Abort during fetch
        return new Uint8Array(10);
      },
    );

    // Actually, the check is inside the loop.
    // If we abort before calling, it should stop.
    controller.abort();

    const result = await downloadAsZip(mockItems, { signal });

    // If aborted immediately, loop shouldn't run or should stop early
    // But downloadAsZip initializes writer first.

    // Wait, if aborted, it might return partial results or throw?
    // The code checks `if (abortSignal?.aborted) return;` inside `runNext`.

    // If we abort immediately, `runNext` will return immediately.
    // Then `await Promise.all(workers)` will resolve.
    // Then `writer.close()` is called.

    expect(result.filesSuccessful).toBe(0);
  });

  it("should report progress", async () => {
    vi.mocked(retryFetchModule.fetchArrayBufferWithRetry).mockResolvedValue(
      new Uint8Array(10),
    );
    const onProgress = vi.fn();

    await downloadAsZip(mockItems, { onProgress });

    expect(onProgress).toHaveBeenCalled();
    expect(onProgress).toHaveBeenCalledWith(
      expect.objectContaining({
        phase: "downloading",
        total: 2,
      }),
    );
  });
});
