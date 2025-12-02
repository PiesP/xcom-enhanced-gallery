import {
  detectDownloadCapability,
  downloadBlobWithAnchor,
  downloadWithFetchBlob,
} from '@shared/services/download/fallback-download';

describe('fallback-download', () => {
  const originalFetch = globalThis.fetch;
  const originalBlob = globalThis.Blob;
  const originalURL = globalThis.URL;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
    globalThis.Blob = originalBlob;
    globalThis.URL = originalURL;
    vi.restoreAllMocks();
  });

  describe('detectDownloadCapability', () => {
    it('should detect GM_download when available', () => {
      (globalThis as any).GM_download = vi.fn();

      const result = detectDownloadCapability();

      expect(result.hasGMDownload).toBe(true);
      expect(result.method).toBe('gm_download');

      delete (globalThis as any).GM_download;
    });

    it('should detect fetch_blob method when GM_download is unavailable', () => {
      delete (globalThis as any).GM_download;

      const result = detectDownloadCapability();

      expect(result.hasGMDownload).toBe(false);
      expect(result.hasFetch).toBe(true);
      expect(result.hasBlob).toBe(true);
      expect(result.method).toBe('fetch_blob');
    });

    it('should return none when no download method is available', () => {
      delete (globalThis as any).GM_download;
      const originalFetchFn = globalThis.fetch;
      (globalThis as any).fetch = undefined;

      const result = detectDownloadCapability();

      expect(result.method).toBe('none');

      globalThis.fetch = originalFetchFn;
    });

    it('should not detect GM_download when present but not a function', () => {
      // Ensure GM_download is present but not a function
      (globalThis as any).GM_download = 'not-a-function';
      const result = detectDownloadCapability();

      expect(result.hasGMDownload).toBe(false);
      // Fallback should be fetch_blob if fetch/blob available, or none otherwise
      expect(['fetch_blob', 'none']).toContain(result.method);

      delete (globalThis as any).GM_download;
    });

    it('should return none when URL.createObjectURL is not a function', () => {
      delete (globalThis as any).GM_download;

      // Ensure fetch is available so the only failing part is createObjectURL
      const originalFetchFn = globalThis.fetch;
      (globalThis as any).fetch = vi.fn();

      const originalBlob = globalThis.Blob;
      const originalURL = globalThis.URL;

      // Blob present
      (globalThis as any).Blob = originalBlob;
      // URL present but createObjectURL is not a function
      (globalThis as any).URL = { createObjectURL: 'not-a-function' } as any;

      const result = detectDownloadCapability();
      expect(result.hasBlob).toBe(false);
      expect(result.method).toBe('none');

      globalThis.fetch = originalFetchFn;
      globalThis.Blob = originalBlob;
      globalThis.URL = originalURL;
    });

    it('should return none when Blob is undefined but URL exists', () => {
      delete (globalThis as any).GM_download;

      const originalBlob = globalThis.Blob;
      const originalURL = globalThis.URL;
      const originalFetchFn = globalThis.fetch;

      // Blob is missing, URL available (with createObjectURL)
      (globalThis as any).Blob = undefined;
      (globalThis as any).URL = { createObjectURL: () => '' } as any;
      (globalThis as any).fetch = vi.fn();

      const result = detectDownloadCapability();
      expect(result.hasBlob).toBe(false);
      expect(result.method).toBe('none');

      globalThis.Blob = originalBlob;
      globalThis.URL = originalURL;
      globalThis.fetch = originalFetchFn;
    });

    it('should return none when URL is undefined but Blob exists', () => {
      delete (globalThis as any).GM_download;

      const originalBlob = globalThis.Blob;
      const originalURL = globalThis.URL;
      const originalFetchFn = globalThis.fetch;

      (globalThis as any).fetch = vi.fn();

      // Blob exists but URL missing
      (globalThis as any).Blob = originalBlob;
      (globalThis as any).URL = undefined;

      const result = detectDownloadCapability();
      expect(result.hasBlob).toBe(false);
      expect(result.method).toBe('none');

      globalThis.Blob = originalBlob;
      globalThis.URL = originalURL;
      globalThis.fetch = originalFetchFn;
    });

    it('should detect fetch as unavailable when missing', () => {
      delete (globalThis as any).GM_download;

      const originalFetchFn = globalThis.fetch;
      (globalThis as any).fetch = undefined;

      const result = detectDownloadCapability();
      expect(result.hasFetch).toBe(false);
      expect(result.method).toBe('none');

      globalThis.fetch = originalFetchFn;
    });

    it('should prefer GM_download over fetch_blob when both are available', () => {
      // GM_download as a function should be preferred
      (globalThis as any).GM_download = vi.fn();
      const originalFetchFn = globalThis.fetch;
      const originalURL = globalThis.URL;

      (globalThis as any).fetch = vi.fn();
      (globalThis as any).URL = { createObjectURL: () => '' } as any;

      const result = detectDownloadCapability();
      expect(result.hasGMDownload).toBe(true);
      expect(result.method).toBe('gm_download');

      delete (globalThis as any).GM_download;
      globalThis.fetch = originalFetchFn;
      globalThis.URL = originalURL;
    });

    it('should return none when fetch is available but Blob/createObjectURL is missing', () => {
      delete (globalThis as any).GM_download;

      // Provide fetch but remove Blob/URL.createObjectURL
      const originalBlob = globalThis.Blob;
      const originalURL = globalThis.URL;
      (globalThis as any).fetch = vi.fn();
      (globalThis as any).Blob = undefined;
      (globalThis as any).URL = undefined;

      const result = detectDownloadCapability();
      expect(result.method).toBe('none');

      globalThis.Blob = originalBlob;
      globalThis.URL = originalURL;
    });

    it('should return none when Blob is available but fetch is missing', () => {
      delete (globalThis as any).GM_download;

      const originalFetchFn = globalThis.fetch;
      (globalThis as any).fetch = undefined;

      // Blob exists in the environment and URL.createObjectURL is present by default in JSDOM
      const result = detectDownloadCapability();
      expect(result.method).toBe('none');

      globalThis.fetch = originalFetchFn;
    });
  });

  describe('downloadWithFetchBlob', () => {
    let mockAnchor: HTMLAnchorElement;
    let mockBody: HTMLElement;

    beforeEach(() => {
      vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:test-url');
      vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {});

      mockAnchor = {
        href: '',
        download: '',
        style: { display: '' },
        click: vi.fn(),
      } as unknown as HTMLAnchorElement;

      mockBody = {
        appendChild: vi.fn(),
        removeChild: vi.fn(),
      } as unknown as HTMLElement;

      vi.spyOn(document, 'createElement').mockReturnValue(mockAnchor);
      Object.defineProperty(document, 'body', { value: mockBody, writable: true });
    });

    it('should return early if signal is already aborted', async () => {
      const abortController = new AbortController();
      abortController.abort();

      const result = await downloadWithFetchBlob('http://test.com/file.jpg', 'file.jpg', {
        signal: abortController.signal,
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Download cancelled');
    });

    it('should call onProgress with preparing phase', async () => {
      const onProgress = vi.fn();
      const mockResponse = {
        ok: true,
        headers: new Headers({
          'content-type': 'image/jpeg',
        }),
        blob: vi.fn().mockResolvedValue(new Blob(['test'], { type: 'image/jpeg' })),
        body: null,
      };

      vi.spyOn(globalThis, 'fetch').mockResolvedValue(mockResponse as unknown as Response);

      await downloadWithFetchBlob('http://test.com/file.jpg', 'file.jpg', {
        onProgress,
        timeout: 5000,
      });

      expect(onProgress).toHaveBeenCalledWith(
        expect.objectContaining({
          phase: 'preparing',
          filename: 'file.jpg',
        })
      );
        expect(mockBody.appendChild).toHaveBeenCalledWith(mockAnchor);
        expect(mockBody.removeChild).toHaveBeenCalledWith(mockAnchor);
    });

    it('should handle HTTP error response', async () => {
      const mockResponse = {
        ok: false,
        status: 404,
        statusText: 'Not Found',
      };

      vi.spyOn(globalThis, 'fetch').mockResolvedValue(mockResponse as unknown as Response);

      const result = await downloadWithFetchBlob('http://test.com/file.jpg', 'file.jpg');

      expect(result.success).toBe(false);
      expect(result.error).toBe('HTTP 404: Not Found');
    });

    it('should download successfully without content-length', async () => {
      const mockBlob = new Blob(['test content'], { type: 'image/jpeg' });
      const mockResponse = {
        ok: true,
        headers: new Headers({
          'content-type': 'image/jpeg',
        }),
        blob: vi.fn().mockResolvedValue(mockBlob),
        body: null,
      };

      vi.spyOn(globalThis, 'fetch').mockResolvedValue(mockResponse as unknown as Response);

      const result = await downloadWithFetchBlob('http://test.com/file.jpg', 'file.jpg');

      expect(result.success).toBe(true);
      expect(result.filename).toBe('file.jpg');
        expect(mockBody.appendChild).toHaveBeenCalledWith(mockAnchor);
        expect(mockBody.removeChild).toHaveBeenCalledWith(mockAnchor);
    });

    it('should track progress with streaming response', async () => {
      const onProgress = vi.fn();
      const chunk1 = new Uint8Array([1, 2, 3, 4, 5]);
      const chunk2 = new Uint8Array([6, 7, 8, 9, 10]);

      const mockReader = {
        read: vi
          .fn()
          .mockResolvedValueOnce({ done: false, value: chunk1 })
          .mockResolvedValueOnce({ done: false, value: chunk2 })
          .mockResolvedValueOnce({ done: true }),
      };

      const mockResponse = {
        ok: true,
        headers: new Headers({
          'content-length': '10',
          'content-type': 'image/jpeg',
        }),
        body: {
          getReader: () => mockReader,
        },
      };

      vi.spyOn(globalThis, 'fetch').mockResolvedValue(mockResponse as unknown as Response);

      const result = await downloadWithFetchBlob('http://test.com/file.jpg', 'file.jpg', {
        onProgress,
      });

      expect(result.success).toBe(true);
      expect(onProgress).toHaveBeenCalledWith(
        expect.objectContaining({
          phase: 'downloading',
          percentage: 50,
        })
      );
      expect(onProgress).toHaveBeenCalledWith(
        expect.objectContaining({
          phase: 'downloading',
          percentage: 100,
        })
      );
        expect(mockBody.appendChild).toHaveBeenCalledWith(mockAnchor);
        expect(mockBody.removeChild).toHaveBeenCalledWith(mockAnchor);
    });

    it('should handle abort signal during fetch', async () => {
      const abortController = new AbortController();
      const abortError = new Error('The operation was aborted');

      vi.spyOn(globalThis, 'fetch').mockRejectedValue(abortError);

      const result = await downloadWithFetchBlob('http://test.com/file.jpg', 'file.jpg', {
        signal: abortController.signal,
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Download cancelled');
    });

    it('should handle network errors', async () => {
      const networkError = new Error('Network failure');

      vi.spyOn(globalThis, 'fetch').mockRejectedValue(networkError);

      const result = await downloadWithFetchBlob('http://test.com/file.jpg', 'file.jpg');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Network failure');
    });

    it('should report complete phase with error on failure', async () => {
      const onProgress = vi.fn();
      const networkError = new Error('Network failure');

      vi.spyOn(globalThis, 'fetch').mockRejectedValue(networkError);

      await downloadWithFetchBlob('http://test.com/file.jpg', 'file.jpg', {
        onProgress,
      });

      expect(onProgress).toHaveBeenCalledWith(
        expect.objectContaining({
          phase: 'complete',
          percentage: 0,
        })
      );
    });
  });

  describe('downloadBlobWithAnchor', () => {
    let mockAnchor: HTMLAnchorElement;
    let mockBody: HTMLElement;

    beforeEach(() => {
      vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:test-url');
      vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {});

      mockAnchor = {
        href: '',
        download: '',
        style: { display: '' },
        click: vi.fn(),
      } as unknown as HTMLAnchorElement;

      mockBody = {
        appendChild: vi.fn(),
        removeChild: vi.fn(),
      } as unknown as HTMLElement;

      vi.spyOn(document, 'createElement').mockReturnValue(mockAnchor);
      Object.defineProperty(document, 'body', { value: mockBody, writable: true });
    });

    it('should download blob successfully', async () => {
      const blob = new Blob(['test'], { type: 'image/jpeg' });
      const onProgress = vi.fn();

      const result = await downloadBlobWithAnchor(blob, 'test.jpg', { onProgress });

      expect(result.success).toBe(true);
      expect(result.filename).toBe('test.jpg');
      expect(URL.createObjectURL).toHaveBeenCalledWith(blob);
      expect(URL.revokeObjectURL).toHaveBeenCalled();
      expect(mockBody.appendChild).toHaveBeenCalledWith(mockAnchor);
      expect(mockBody.removeChild).toHaveBeenCalledWith(mockAnchor);
    });

    it('should report preparing and complete phases', async () => {
      const blob = new Blob(['test'], { type: 'image/jpeg' });
      const onProgress = vi.fn();

      await downloadBlobWithAnchor(blob, 'test.jpg', { onProgress });

      expect(onProgress).toHaveBeenCalledWith(
        expect.objectContaining({
          phase: 'preparing',
          percentage: 0,
        })
      );
      expect(onProgress).toHaveBeenCalledWith(
        expect.objectContaining({
          phase: 'complete',
          percentage: 100,
        })
      );
      expect(mockBody.appendChild).toHaveBeenCalledWith(mockAnchor);
      expect(mockBody.removeChild).toHaveBeenCalledWith(mockAnchor);
    });

    it('should handle anchor click error', async () => {
      const blob = new Blob(['test'], { type: 'image/jpeg' });
      const onProgress = vi.fn();
      const clickError = new Error('Click failed');

      mockAnchor.click = vi.fn().mockImplementation(() => {
        throw clickError;
      });

      const result = await downloadBlobWithAnchor(blob, 'test.jpg', { onProgress });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Click failed');
      expect(URL.revokeObjectURL).toHaveBeenCalled();
      expect(mockBody.appendChild).toHaveBeenCalledWith(mockAnchor);
    });

    it('should report error phase on failure', async () => {
      const blob = new Blob(['test'], { type: 'image/jpeg' });
      const onProgress = vi.fn();

      mockAnchor.click = vi.fn().mockImplementation(() => {
        throw new Error('Click failed');
      });

      await downloadBlobWithAnchor(blob, 'test.jpg', { onProgress });

      expect(onProgress).toHaveBeenCalledWith(
        expect.objectContaining({
          phase: 'complete',
          percentage: 0,
        })
      );
      expect(mockBody.appendChild).toHaveBeenCalledWith(mockAnchor);
    });

    it('should work without onProgress callback', async () => {
      const blob = new Blob(['test'], { type: 'image/jpeg' });

      const result = await downloadBlobWithAnchor(blob, 'test.jpg');

      expect(result.success).toBe(true);
    });
  });

  describe('detectDownloadCapability mutation tests', () => {
    it('should verify typeof GM_download === function check (mutation: !== to ===)', () => {
      // When GM_download is defined but not a function
      (globalThis as any).GM_download = 'string-not-function';

      const result = detectDownloadCapability();

      // Should return hasGMDownload: false because it's not a function
      expect(result.hasGMDownload).toBe(false);

      delete (globalThis as any).GM_download;
    });

    it('should verify GM_download function type check is both conditions', () => {
      // GM_download undefined
      delete (globalThis as any).GM_download;
      const result1 = detectDownloadCapability();
      expect(result1.hasGMDownload).toBe(false);

      // GM_download exists but is not a function
      (globalThis as any).GM_download = 42;
      const result2 = detectDownloadCapability();
      expect(result2.hasGMDownload).toBe(false);

      // GM_download exists and is a function
      (globalThis as any).GM_download = vi.fn();
      const result3 = detectDownloadCapability();
      expect(result3.hasGMDownload).toBe(true);

      delete (globalThis as any).GM_download;
    });
  });

  describe('downloadWithFetchBlob mutation tests', () => {
    let mockAnchor: HTMLAnchorElement;
    let mockBody: HTMLElement;

    beforeEach(() => {
      vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:test-url');
      vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {});

      mockAnchor = {
        href: '',
        download: '',
        style: { display: '' },
        click: vi.fn(),
      } as unknown as HTMLAnchorElement;

      mockBody = {
        appendChild: vi.fn(),
        removeChild: vi.fn(),
      } as unknown as HTMLElement;

      vi.spyOn(document, 'createElement').mockReturnValue(mockAnchor);
      Object.defineProperty(document, 'body', { value: mockBody, writable: true });
    });

    it('should abort via external signal when provided', async () => {
      const abortController = new AbortController();
      let fetchAbortSignal: AbortSignal | null | undefined;

      vi.spyOn(globalThis, 'fetch').mockImplementation(async (_url, options) => {
        fetchAbortSignal = options?.signal;
        // Simulate delay
        await new Promise(resolve => setTimeout(resolve, 50));
        if (fetchAbortSignal?.aborted) {
          throw new Error('The operation was aborted');
        }
        return {
          ok: true,
          headers: new Headers(),
          blob: vi.fn().mockResolvedValue(new Blob(['test'])),
          body: null,
        } as unknown as Response;
      });

      // Start download then abort
      const promise = downloadWithFetchBlob('http://test.com/file.jpg', 'file.jpg', {
        signal: abortController.signal,
      });

      // Abort after small delay
      setTimeout(() => abortController.abort(), 10);

      const result = await promise;
      expect(result.success).toBe(false);
      expect(result.error).toBe('Download cancelled');
    });

    it('should use fetch options with correct mode and credentials', async () => {
      let capturedOptions: RequestInit | undefined;

      vi.spyOn(globalThis, 'fetch').mockImplementation(async (_url, options) => {
        capturedOptions = options;
        return {
          ok: true,
          headers: new Headers(),
          blob: vi.fn().mockResolvedValue(new Blob(['test'])),
          body: null,
        } as unknown as Response;
      });

      await downloadWithFetchBlob('http://test.com/file.jpg', 'file.jpg');

      expect(capturedOptions?.mode).toBe('cors');
      expect(capturedOptions?.credentials).toBe('omit');
    });

    it('should handle streaming read when totalBytes > 0 but value is undefined', async () => {
      const mockReader = {
        read: vi
          .fn()
          .mockResolvedValueOnce({ done: false, value: undefined }) // value can be undefined
          .mockResolvedValueOnce({ done: true }),
      };

      const mockResponse = {
        ok: true,
        headers: new Headers({
          'content-length': '10',
          'content-type': 'image/jpeg',
        }),
        body: {
          getReader: () => mockReader,
        },
      };

      vi.spyOn(globalThis, 'fetch').mockResolvedValue(mockResponse as unknown as Response);

      // Should not throw even with undefined value
      const result = await downloadWithFetchBlob('http://test.com/file.jpg', 'file.jpg');
      expect(result.success).toBe(true);
    });

    it('should handle streaming read with multiple chunks and verify Blob construction', async () => {
      const chunk1 = new Uint8Array([1, 2, 3]);
      const chunk2 = new Uint8Array([4, 5, 6]);

      const mockReader = {
        read: vi
          .fn()
          .mockResolvedValueOnce({ done: false, value: chunk1 })
          .mockResolvedValueOnce({ done: false, value: chunk2 })
          .mockResolvedValueOnce({ done: true }),
      };

      const mockResponse = {
        ok: true,
        headers: new Headers({
          'content-length': '6',
          'content-type': 'application/octet-stream',
        }),
        body: {
          getReader: () => mockReader,
        },
      };

      vi.spyOn(globalThis, 'fetch').mockResolvedValue(mockResponse as unknown as Response);
      const onProgress = vi.fn();

      const result = await downloadWithFetchBlob('http://test.com/file.bin', 'file.bin', { onProgress });

      expect(result.success).toBe(true);
      // Verify progress was called correctly
      expect(onProgress).toHaveBeenCalledWith(expect.objectContaining({
        phase: 'downloading',
        percentage: 50, // 3/6 * 100
      }));
      expect(onProgress).toHaveBeenCalledWith(expect.objectContaining({
        phase: 'downloading',
        percentage: 100, // 6/6 * 100
      }));
    });

    it('should use fallback content-type when header is missing', async () => {
      const mockReader = {
        read: vi
          .fn()
          .mockResolvedValueOnce({ done: false, value: new Uint8Array([1, 2]) })
          .mockResolvedValueOnce({ done: true }),
      };

      const mockResponse = {
        ok: true,
        headers: new Headers({
          'content-length': '2',
          // content-type is missing
        }),
        body: {
          getReader: () => mockReader,
        },
      };

      vi.spyOn(globalThis, 'fetch').mockResolvedValue(mockResponse as unknown as Response);

      const result = await downloadWithFetchBlob('http://test.com/file.bin', 'file.bin');
      // Should use 'application/octet-stream' as fallback
      expect(result.success).toBe(true);
    });

    it('should clear timeout after successful fetch', async () => {
      const clearTimeoutSpy = vi.spyOn(globalThis, 'clearTimeout');

      const mockResponse = {
        ok: true,
        headers: new Headers(),
        blob: vi.fn().mockResolvedValue(new Blob(['test'])),
        body: null,
      };

      vi.spyOn(globalThis, 'fetch').mockResolvedValue(mockResponse as unknown as Response);

      await downloadWithFetchBlob('http://test.com/file.jpg', 'file.jpg', { timeout: 5000 });

      expect(clearTimeoutSpy).toHaveBeenCalled();
    });

    it('should NOT report progress when onProgress is undefined', async () => {
      const chunk = new Uint8Array([1, 2, 3]);

      const mockReader = {
        read: vi
          .fn()
          .mockResolvedValueOnce({ done: false, value: chunk })
          .mockResolvedValueOnce({ done: true }),
      };

      const mockResponse = {
        ok: true,
        headers: new Headers({
          'content-length': '3',
          'content-type': 'image/jpeg',
        }),
        body: {
          getReader: () => mockReader,
        },
      };

      vi.spyOn(globalThis, 'fetch').mockResolvedValue(mockResponse as unknown as Response);

      // No onProgress - should not throw
      const result = await downloadWithFetchBlob('http://test.com/file.jpg', 'file.jpg');
      expect(result.success).toBe(true);
    });

    it('should handle cancel error message variations', async () => {
      // Test with 'cancel' in error message
      vi.spyOn(globalThis, 'fetch').mockRejectedValueOnce(new Error('Request was cancelled by user'));

      const result1 = await downloadWithFetchBlob('http://test.com/file.jpg', 'file.jpg');
      expect(result1.error).toBe('Download cancelled');

      // Test with 'abort' in error message
      vi.spyOn(globalThis, 'fetch').mockRejectedValueOnce(new Error('Fetch aborted'));

      const result2 = await downloadWithFetchBlob('http://test.com/file.jpg', 'file.jpg');
      expect(result2.error).toBe('Download cancelled');
    });
  });
});
