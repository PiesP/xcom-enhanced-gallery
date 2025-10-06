/**
 * BulkDownloadService - filename collision & failure summary (TDD)
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

// Mock vendors: stub downloadBlob (native ZIP implementation used internally)
/** @type {Map<string, Uint8Array> | null} */
let capturedZipFileMap = null;

vi.mock('@shared/external/vendors', async () => {
  const actual = await vi.importActual('@shared/external/vendors');
  return {
    ...actual,
    getNativeDownload: () => ({
      downloadBlob: vi.fn(),
    }),
  };
});

// Spy on zip-creator to capture filenames passed to native ZIP creation
vi.mock('@shared/external/zip/zip-creator', async () => {
  const actual = await vi.importActual('@shared/external/zip/zip-creator');
  return {
    ...actual,
    createZipBlobFromFileMap: vi.fn(async fileMap => {
      capturedZipFileMap = fileMap;
      // Return minimal valid ZIP blob (EOCD only)
      return new globalThis.Blob(
        [new Uint8Array([0x50, 0x4b, 0x05, 0x06].concat(new Array(18).fill(0)))],
        {
          type: 'application/zip',
        }
      );
    }),
  };
});

function mediaItem(overrides = {}) {
  return {
    id: overrides.id ?? '100_media_0',
    type: overrides.type ?? 'image',
    url: overrides.url ?? 'https://example.com/a.jpg',
    originalUrl: overrides.originalUrl ?? 'https://example.com/a.jpg',
    filename: overrides.filename ?? 'a.jpg',
    tweetId: overrides.tweetId ?? '100',
    tweetUsername: overrides.tweetUsername ?? 'alice',
  };
}

describe('BulkDownloadService - filename collision & failure summary', () => {
  /** @type {typeof fetch} */
  let originalFetch;

  beforeEach(() => {
    originalFetch = globalThis.fetch;
    capturedZipFileMap = null;
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  it('makes filenames unique in ZIP by suffixing -1, -2 when collisions occur (RED)', async () => {
    const { BulkDownloadService } = await import('@shared/services/BulkDownloadService');
    const svc = new BulkDownloadService();

    // three items producing identical base filename "alice_100_1.jpg"
    const items = [
      mediaItem({ id: '100_media_0' }),
      mediaItem({ id: '100_media_0', url: 'https://example.com/b.jpg', filename: 'b.jpg' }),
      mediaItem({ id: '100_media_0', url: 'https://example.com/c.jpg', filename: 'c.jpg' }),
    ];

    // stub fetch -> distinct content for each to avoid deduplication-by-bytes
    let n = 1;
    // minimal Blob polyfill for Node test env
    if (typeof globalThis.Blob === 'undefined') {
      globalThis.Blob = class {
        constructor(parts) {
          this.parts = parts;
        }
      };
    }

    globalThis.fetch = vi.fn(async () => ({
      ok: true,
      arrayBuffer: async () => new Uint8Array([n++, n++, n++]).buffer,
      blob: async () => new globalThis.Blob([new Uint8Array([1, 2, 3])]),
    }));

    const res = await svc.downloadMultiple(items, {});
    expect(res.success).toBe(true);
    expect(capturedZipFileMap).toBeTruthy();
    expect(capturedZipFileMap instanceof Map).toBe(true);

    const keys = Array.from(capturedZipFileMap.keys());
    // base + -1 + -2
    expect(keys).toHaveLength(3);
    expect(keys).toContain('alice_100_1.jpg');
    expect(keys).toContain('alice_100_1-1.jpg');
    expect(keys).toContain('alice_100_1-2.jpg');
  });

  it('returns a concise failure summary when some downloads fail (RED)', async () => {
    const { BulkDownloadService } = await import('@shared/services/BulkDownloadService');
    const svc = new BulkDownloadService();

    const okItem = mediaItem({ id: '100_media_0', url: 'https://ok/item.jpg' });
    const badItem = mediaItem({ id: '100_media_1', url: 'https://bad/item.jpg' });

    if (typeof globalThis.Blob === 'undefined') {
      globalThis.Blob = class {
        constructor(parts) {
          this.parts = parts;
        }
      };
    }

    globalThis.fetch = vi.fn(async input => {
      const url = typeof input === 'string' ? input : String(input);
      if (url.includes('bad')) {
        throw new Error('Network unreachable');
      }
      return {
        ok: true,
        arrayBuffer: async () => new Uint8Array([7, 7, 7]).buffer,
        blob: async () => new globalThis.Blob([new Uint8Array([7, 7, 7])]),
      };
    });

    const result = await svc.downloadMultiple([okItem, badItem], {});
    expect(result.success).toBe(true);
    // new optional field
    expect(result.failures).toBeDefined();
    expect(Array.isArray(result.failures)).toBe(true);
    expect(result.failures.length).toBe(1);
    expect(result.failures[0].url).toContain('https://bad/item.jpg');
    expect(String(result.failures[0].error).toLowerCase()).toContain('network');
  });
});
