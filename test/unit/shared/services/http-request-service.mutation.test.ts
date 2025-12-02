import { HttpRequestService } from '@shared/services/http-request-service';

// Mock dependencies
const mockXmlHttpRequest = vi.fn();
const mockAbort = vi.fn();

const mockUserscript = {
  xmlHttpRequest: mockXmlHttpRequest,
};

vi.mock('@shared/external/userscript/adapter', () => ({
  getUserscript: () => mockUserscript,
}));

describe('HttpRequestService Mutation Tests', () => {
  let service: HttpRequestService;

  beforeEach(() => {
    vi.clearAllMocks();
    // Reset singleton
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (HttpRequestService as any).instance = null;
    service = HttpRequestService.getInstance();

    mockXmlHttpRequest.mockReturnValue({
      abort: mockAbort,
    });
  });

  afterEach(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (HttpRequestService as any).instance = null;
  });

  describe('Header Parsing', () => {
    it('should handle malformed headers gracefully', async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      mockXmlHttpRequest.mockImplementation((details: any) => {
        details.onload({
          status: 200,
          statusText: 'OK',
          response: {},
          responseHeaders: 'Valid: Header\r\nInvalidHeader\r\n:EmptyKey\r\nEmptyValue: ',
        });
        return { abort: mockAbort };
      });

      const response = await service.get('https://example.com');

      expect(response.headers).toHaveProperty('valid', 'Header');
      expect(response.headers).toHaveProperty('emptyvalue', '');
      // Should not have invalid headers
      expect(Object.keys(response.headers)).not.toContain('invalidheader');
      expect(Object.keys(response.headers)).not.toContain('');
    });

    it('should handle headers with multiple colons', async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      mockXmlHttpRequest.mockImplementation((details: any) => {
        details.onload({
          status: 200,
          statusText: 'OK',
          response: {},
          responseHeaders: 'Date: Mon, 01 Jan 2024 00:00:00 GMT',
        });
        return { abort: mockAbort };
      });

      const response = await service.get('https://example.com');
      expect(response.headers).toHaveProperty('date', 'Mon, 01 Jan 2024 00:00:00 GMT');
    });
  });

  describe('Response Status', () => {
    it('should consider 199 as not ok', async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      mockXmlHttpRequest.mockImplementation((details: any) => {
        details.onload({ status: 199, statusText: 'Info', response: {} });
        return { abort: mockAbort };
      });

      const response = await service.get('https://example.com');
      expect(response.ok).toBe(false);
    });

    it('should consider 200 as ok', async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      mockXmlHttpRequest.mockImplementation((details: any) => {
        details.onload({ status: 200, statusText: 'OK', response: {} });
        return { abort: mockAbort };
      });

      const response = await service.get('https://example.com');
      expect(response.ok).toBe(true);
    });

    it('should consider 299 as ok', async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      mockXmlHttpRequest.mockImplementation((details: any) => {
        details.onload({ status: 299, statusText: 'OK', response: {} });
        return { abort: mockAbort };
      });

      const response = await service.get('https://example.com');
      expect(response.ok).toBe(true);
    });

    it('should consider 300 as not ok', async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      mockXmlHttpRequest.mockImplementation((details: any) => {
        details.onload({ status: 300, statusText: 'Multiple Choices', response: {} });
        return { abort: mockAbort };
      });

      const response = await service.get('https://example.com');
      expect(response.ok).toBe(false);
    });
  });

  describe('Error Handling Fallback', () => {
    it("should use default 'Network Error' when statusText is missing", async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      mockXmlHttpRequest.mockImplementation((details: any) => {
        details.onerror({ status: 0, statusText: '' });
        return { abort: mockAbort };
      });

      await expect(service.get('https://example.com')).rejects.toThrow('Network Error');
    });

    it('should use provided statusText when available', async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      mockXmlHttpRequest.mockImplementation((details: any) => {
        details.onerror({ status: 404, statusText: 'Not Found' });
        return { abort: mockAbort };
      });

      await expect(service.get('https://example.com')).rejects.toThrow('Not Found');
    });
  });

  describe('Data Serialization', () => {
    it('should handle string data directly', async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      mockXmlHttpRequest.mockImplementation((details: any) => {
        details.onload({ status: 200, response: {} });
        return { abort: mockAbort };
      });

      await service.post('https://example.com', 'raw string');

      expect(mockXmlHttpRequest).toHaveBeenCalledWith(
        expect.objectContaining({
          data: 'raw string',
        })
      );
    });

    it('should stringify plain objects', async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      mockXmlHttpRequest.mockImplementation((details: any) => {
        details.onload({ status: 200, response: {} });
        return { abort: mockAbort };
      });

      const data = { key: 'value' };
      await service.post('https://example.com', data);

      expect(mockXmlHttpRequest).toHaveBeenCalledWith(
        expect.objectContaining({
          data: JSON.stringify(data),
          headers: expect.objectContaining({
            'content-type': 'application/json',
          }),
        })
      );
    });
  });

  describe('Header Initialization', () => {
    it('should initialize headers if undefined when sending JSON', async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      mockXmlHttpRequest.mockImplementation((details: any) => {
        details.onload({ status: 200, response: {} });
        return { abort: mockAbort };
      });

      await service.post('https://example.com', { foo: 'bar' });

      expect(mockXmlHttpRequest).toHaveBeenCalledWith(
        expect.objectContaining({
          headers: {
            'content-type': 'application/json',
          },
        })
      );
    });

    it('should preserve existing headers when sending JSON', async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      mockXmlHttpRequest.mockImplementation((details: any) => {
        details.onload({ status: 200, response: {} });
        return { abort: mockAbort };
      });

      await service.post(
        'https://example.com',
        { foo: 'bar' },
        {
          headers: { 'X-Custom': 'Value' },
        }
      );

      expect(mockXmlHttpRequest).toHaveBeenCalledWith(
        expect.objectContaining({
          headers: {
            'X-Custom': 'Value',
            'content-type': 'application/json',
          },
        })
      );
    });

    it('should not overwrite existing content-type when sending JSON', async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      mockXmlHttpRequest.mockImplementation((details: any) => {
        details.onload({ status: 200, response: {} });
        return { abort: mockAbort };
      });

      await service.post(
        'https://example.com',
        { foo: 'bar' },
        {
          headers: { 'content-type': 'application/vnd.api+json' },
        }
      );

      expect(mockXmlHttpRequest).toHaveBeenCalledWith(
        expect.objectContaining({
          headers: {
            'content-type': 'application/vnd.api+json',
          },
        })
      );
    });
  });

  describe('Request Options', () => {
    it('should handle undefined options gracefully', async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      mockXmlHttpRequest.mockImplementation((details: any) => {
        details.onload({ status: 200, statusText: 'OK', response: {} });
        return { abort: mockAbort };
      });

      // Call get without options
      const response = await service.get('https://example.com');
      expect(response.ok).toBe(true);
    });

    it('should use default timeout when options.timeout is undefined', async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let capturedDetails: any;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      mockXmlHttpRequest.mockImplementation((details: any) => {
        capturedDetails = details;
        details.onload({ status: 200, statusText: 'OK', response: {} });
        return { abort: mockAbort };
      });

      // Pass empty options (timeout undefined)
      await service.get('https://example.com', {});

      // Default timeout is 10000
      expect(capturedDetails.timeout).toBe(10000);
    });
  });

  describe('HTTP Methods', () => {
    it('should pass data and options in PUT request', async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let capturedDetails: any;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      mockXmlHttpRequest.mockImplementation((details: any) => {
        capturedDetails = details;
        details.onload({ status: 200, statusText: 'OK', response: {} });
        return { abort: mockAbort };
      });

      const data = { key: 'value' };
      const options = { headers: { 'X-Custom': 'Test' } };
      await service.put('https://example.com', data, options);

      expect(capturedDetails.method).toBe('PUT');
      expect(capturedDetails.data).toBe(JSON.stringify(data));
      expect(capturedDetails.headers).toHaveProperty('X-Custom', 'Test');
    });

    it('should pass data and options in PATCH request', async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let capturedDetails: any;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      mockXmlHttpRequest.mockImplementation((details: any) => {
        capturedDetails = details;
        details.onload({ status: 200, statusText: 'OK', response: {} });
        return { abort: mockAbort };
      });

      const data = { key: 'value' };
      const options = { headers: { 'X-Custom': 'Test' } };
      await service.patch('https://example.com', data, options);

      expect(capturedDetails.method).toBe('PATCH');
      expect(capturedDetails.data).toBe(JSON.stringify(data));
      expect(capturedDetails.headers).toHaveProperty('X-Custom', 'Test');
    });
  });

  describe('Additional HTTP Methods', () => {
    it('should support DELETE method', async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let capturedDetails: any;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      mockXmlHttpRequest.mockImplementation((details: any) => {
        capturedDetails = details;
        details.onload({ status: 200, statusText: 'OK', response: {} });
        return { abort: mockAbort };
      });

      await service.delete('https://example.com', { headers: { 'X-Delete': 'true' } });

      expect(capturedDetails.method).toBe('DELETE');
      expect(capturedDetails.headers).toHaveProperty('X-Delete', 'true');
    });
  });

  describe('Timeout and Abort', () => {
    it('should handle timeout error', async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      mockXmlHttpRequest.mockImplementation((details: any) => {
        details.ontimeout();
        return { abort: mockAbort };
      });

      await expect(service.get('https://example.com')).rejects.toThrow('Request timeout');
    });

    it('should call abort on control object when signal is aborted', async () => {
      const controller = new AbortController();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      mockXmlHttpRequest.mockImplementation(() => {
        return { abort: mockAbort };
      });

      // We don't await the promise because it won't resolve in this test setup (no onload/onerror called)
      // We just want to check if abort is called.
      service.get('https://example.com', { signal: controller.signal }).catch(() => {});

      controller.abort();

      // Wait for event loop
      await new Promise(resolve => setTimeout(resolve, 0));

      expect(mockAbort).toHaveBeenCalled();
    });

    it('should reject when onabort is called', async () => {
       // eslint-disable-next-line @typescript-eslint/no-explicit-any
      mockXmlHttpRequest.mockImplementation((details: any) => {
        details.onabort();
        return { abort: mockAbort };
      });

      await expect(service.get('https://example.com')).rejects.toThrow('Request was aborted');
    });
  });
});
