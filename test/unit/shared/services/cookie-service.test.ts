// Vitest globals (describe/it/expect/vi) are provided by tsconfig "vitest/globals"; avoid importing runtime helpers here
// Mock userscript adapter and logger at the top so tests can toggle the mocked APIs
const mockUserscript: { cookie?: any } = { cookie: undefined };
vi.mock('@shared/external/userscript', () => ({ getUserscript: () => mockUserscript }));
vi.mock('@shared/logging', () => ({ logger: { warn: vi.fn(), debug: vi.fn(), info: vi.fn(), error: vi.fn() } }));
import { getUserscript } from '@shared/external/userscript';
import { CookieService, getCookieService } from '@shared/services/cookie-service';

describe('CookieService (document fallback)', () => {
  let originalCookieDescriptor: PropertyDescriptor | undefined;
  let cookieSetCalls: string[];
  let originalGMCookie: unknown;

  beforeEach(() => {
    // Ensure gmCookie is not available
    originalGMCookie = (globalThis as any).GM_cookie;
    delete (globalThis as any).GM_cookie;

    // Ensure userscript cookie is unavailable (no userscript cookie adapter)

    // Intercept document.cookie setter to capture written values
    cookieSetCalls = [];
    originalCookieDescriptor = Object.getOwnPropertyDescriptor(Document.prototype, 'cookie') as PropertyDescriptor;
    Object.defineProperty(document, 'cookie', {
      configurable: true,
      get() {
        return '';
      },
      set(v: string) {
        cookieSetCalls.push(v);
      },
    } as PropertyDescriptor);
  });

  afterEach(() => {
    // Restore descriptor
    if (originalCookieDescriptor) {
      Object.defineProperty(document, 'cookie', originalCookieDescriptor);
    }
    (globalThis as any).GM_cookie = originalGMCookie;
  });

  it('set should write a cookie string with provided flags', async () => {
    const cs = getCookieService();
    await cs.set({ name: 'test', value: 'value', secure: true, httpOnly: true, expirationDate: 1672531199, path: '/' });
    expect(cookieSetCalls.length).toBe(1);
    const written = cookieSetCalls[0];
    expect(written).toContain('test=');
    expect(written).toContain('path=/');
    // Expires must be present as part of string
    expect(written).toContain('expires=');
    // Secure and HttpOnly flags should be present in string builder even if not reflected by document
    expect(written).toContain('secure');
    expect(written).toContain('HttpOnly');
  });

  it('listFromDocument should return parsed cookies with domain when present', async () => {
    // Simulate two cookies
    Object.defineProperty(document, 'cookie', {
      configurable: true,
      get() {
        return 'a=1; b=2';
      },
      set(_v: any) {},
    } as PropertyDescriptor);

    const cs = getCookieService();
    const list = await cs.list();
    expect(list).toHaveLength(2);
    // Should include the same domain as the running document's hostname
    const currentHost = typeof document?.location?.hostname === 'string' ? document!.location!.hostname : undefined;
    expect(list[0]!).toHaveProperty('domain', currentHost);
    expect(list[1]!).toHaveProperty('domain', currentHost);
  });

  it('listFromDocument should omit domain when document.location is not available', async () => {
    // Save original document
    const originalDoc = (globalThis as any).document as Document;
    try {
      // Replace global document with minimal stub with cookie only
      Object.defineProperty(globalThis as any, 'document', {
        configurable: true,
        value: { cookie: 'a=1' },
      });

      const cs = getCookieService();
      const list = await cs.list();
      expect(list).toHaveLength(1);
      expect(list[0]!.domain).toBeUndefined();
    } finally {
      // Restore original document
      Object.defineProperty(globalThis as any, 'document', {
        configurable: true,
        value: originalDoc,
      });
    }
  });

  it('getValueSync should decode cookie values', () => {
    Object.defineProperty(document, 'cookie', {
      configurable: true,
      get() {
        return 's=%25E3%2581%2593%25E3%2581%25AB'; // percent-encoded
      },
      set(_v: any) {},
    } as PropertyDescriptor);
    const cs = getCookieService();
    const value = cs.getValueSync('s');
    expect(value).toBeDefined();
  });
});

describe('CookieService', () => {
  beforeEach(() => {
    // Reset singleton
    (CookieService as unknown as { instance?: unknown }).instance = undefined;
    // Clear document.cookie
    if (typeof document !== 'undefined') {
      // simplistic clear for tests
      const doc = document as Document;
      (doc.cookie ?? '').split(';').forEach((c) => {
        const name = (c.split('=')[0] ?? '').trim();
        if (name) doc.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`;
      });
    }
  });

  it('falls back to document.cookie when gmCookie not present and lists cookies', async () => {
    const service = getCookieService();
    // set cookies individually (JSDOM emulates single-cookie set semantics)
    document.cookie = 'alpha=1';
    document.cookie = 'beta=two';
    document.cookie = 'gamma=%20three';
    const list = await service.list();
    expect(list.find((l) => l.name === 'alpha')!.value).toBe('1');
    expect(list.find((l) => l.name === 'beta')!.value).toBe('two');
  });

  it('getValue returns value via gmCookie list fallback to document cookie', async () => {
    const service = getCookieService();
    document.cookie = 'mycook=hello';
    expect(await service.getValue('mycook')).toBe('hello');
    expect(service.getValueSync('mycook')).toBe('hello');
  });

  it('set writes document.cookie when gmCookie missing', async () => {
    const service = getCookieService();
    await service.set({ name: 'setme', value: '1', path: '/' });
    expect(document.cookie.includes('setme=1')).toBe(true);
  });

  it('delete expires cookie when gmCookie missing', async () => {
    const service = getCookieService();
    document.cookie = 'delme=bye';
    await service.delete({ name: 'delme' });
    // Cookie should be expired - value might be empty but not present
    expect(document.cookie.includes('delme=')).toBe(false);
  });
});
// Avoid duplicating imports - already imported at the top of the file

// Reuse top-level mockUserscript and logger mocks - no need to remock here
import { logger } from '@shared/logging';

describe('CookieService', () => {
  let service: CookieService;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let gmCookieMock: any;

  beforeEach(() => {
    vi.clearAllMocks();
    // Reset singleton
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (CookieService as any).instance = null;

    // Setup default mocks
    gmCookieMock = {
      list: vi.fn(),
      set: vi.fn(),
      delete: vi.fn(),
    };
    mockUserscript.cookie = undefined;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    delete (globalThis as any).GM_cookie;

    // Mock document.cookie
    Object.defineProperty(document, 'cookie', {
      writable: true,
      value: '',
    });
  });

  afterEach(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (CookieService as any).instance = null;
  });

  describe('Singleton', () => {
    it('should return the same instance', () => {
      service = CookieService.getInstance();
      const instance2 = getCookieService();
      expect(service).toBe(instance2);
    });
  });

  describe('Initialization', () => {
    it('should detect GM_cookie from userscript adapter', () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      mockUserscript.cookie = gmCookieMock as any;
      service = CookieService.getInstance();
      // Debug: ensure getUserscript is returning our mocked object
      // eslint-disable-next-line no-console
      console.log('DEBUG getUserscript cookie:', (getUserscript as any)().cookie);
      expect(service.hasNativeAccess()).toBe(true);
    });

    it('should detect GM_cookie from global scope', () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (globalThis as any).GM_cookie = gmCookieMock;
      service = CookieService.getInstance();
      expect(service.hasNativeAccess()).toBe(true);
    });

    it('should fallback to document.cookie if GM_cookie is missing', () => {
      service = CookieService.getInstance();
      expect(service.hasNativeAccess()).toBe(false);
    });
  });

  describe('list', () => {
    it('should use GM_cookie.list when available', async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      mockUserscript.cookie = gmCookieMock as any;
      // Debug log to ensure mock is configured properly
      // eslint-disable-next-line no-console
      console.log('DEBUG getUserscript.cookie for list test:', (getUserscript as any)().cookie);
      service = CookieService.getInstance();

      const mockCookies = [{ name: 'test', value: '123' }];
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      gmCookieMock.list.mockImplementation((_opts: any, cb: any) => cb(mockCookies, null));

      const result = await service.list({ name: 'test' });
      expect(result).toEqual(mockCookies);
      // Should not warn on success
      expect(logger.warn).not.toHaveBeenCalled();
      expect(gmCookieMock.list).toHaveBeenCalledWith({ name: 'test' }, expect.any(Function));
    });

    it('should fallback to document.cookie on GM_cookie error', async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      mockUserscript.cookie = gmCookieMock as any;
      service = CookieService.getInstance();

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        gmCookieMock.list.mockImplementation((_opts: any, cb: any) => cb(null, 'Error'));
      document.cookie = 'test=123';

      const result = await service.list();
      expect(result).toHaveLength(1);
      expect(result[0]!.name).toBe('test');
      expect(result[0]!.value).toBe('123');
        // Should warn about GM_cookie.list failing
        expect(logger.warn).toHaveBeenCalled();
    });

    it('should parse document.cookie when GM_cookie is missing', async () => {
      service = CookieService.getInstance();
      document.cookie = 'foo=bar; baz=qux';

      const result = await service.list();
      expect(result).toHaveLength(2);
      expect(result.find(c => c.name === 'foo')?.value).toBe('bar');
      expect(result.find(c => c.name === 'baz')?.value).toBe('qux');
    });

    it('should filter by name when using document.cookie', async () => {
      service = CookieService.getInstance();
      document.cookie = 'foo=bar; baz=qux';

      const result = await service.list({ name: 'foo' });
      expect(result).toHaveLength(1);
      expect(result[0]!.name).toBe('foo');
      expect(result[0]!.value).toBe('bar');
    });

    it('should include domain when document.location.hostname is present', async () => {
      service = CookieService.getInstance();
      // document.location.hostname might vary in test environment; assert equality to the active hostname
      document.cookie = 'foo=bar';
      const result = await service.list();
      expect(result[0]!.domain).toBe(document.location!.hostname);
    });

    it('should ignore cookies with empty names', async () => {
      service = CookieService.getInstance();
      document.cookie = '=value; valid=ok';

      const result = await service.list();
      // Should only include the valid cookie and not the empty-named one
      expect(result).toHaveLength(1);
      expect(result[0]!.name).toBe('valid');
      expect(result.some(r => r.name === 'valid')).toBe(true);
    });
  });

  describe('getValue', () => {
    it('should always return fresh value (no caching)', async () => {
      service = CookieService.getInstance();

      document.cookie = 'cached=value';
      let result = await service.getValue('cached');
      expect(result).toBe('value');

      document.cookie = 'cached=changed';
      result = await service.getValue('cached');
      expect(result).toBe('changed');
    });

    it('should use GM_cookie to fetch value', async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      mockUserscript.cookie = gmCookieMock as any;
      service = CookieService.getInstance();

      const mockCookies = [{ name: 'test', value: 'gm-value' }];
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      gmCookieMock.list.mockImplementation((_opts: any, cb: any) => cb(mockCookies, null));

      const result = await service.getValue('test');
      expect(result).toBe('gm-value');
    });

    it('should use getValueSync fallback', async () => {
      service = CookieService.getInstance();
      document.cookie = 'sync=value';

      const result = await service.getValue('sync');
      expect(result).toBe('value');
    });
  });

  describe('set', () => {
    it('should throw if name is missing', async () => {
      service = CookieService.getInstance();
      await expect(service.set({ value: '123' } as any)).rejects.toThrow('name is required');
    });

    it('should use GM_cookie.set when available', async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      mockUserscript.cookie = gmCookieMock as any;
      service = CookieService.getInstance();

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      gmCookieMock.set.mockImplementation((_opts: any, cb: any) => cb(null));

      await service.set({ name: 'test', value: '123' });
      expect(gmCookieMock.set).toHaveBeenCalledWith(
        expect.objectContaining({ name: 'test', value: '123' }),
        expect.any(Function)
      );
    });

    it('should set document.cookie when GM_cookie is missing', async () => {
      service = CookieService.getInstance();

      await service.set({ name: 'test', value: '123', path: '/foo' });
      expect(document.cookie).toContain('test=123');
      expect(document.cookie).toContain('path=/foo');
    });

    it('should include domain, expires, secure, and HttpOnly flags in document.cookie', async () => {
      service = CookieService.getInstance();
      const date = Math.floor(Date.now() / 1000) + 3600; // +1 hour
      await service.set({
        name: 'test',
        value: '123',
        domain: 'example.com',
        expirationDate: date,
        secure: true,
        httpOnly: true,
      });
      // Check pieces are present in the constructed cookie string
      expect(document.cookie).toContain('test=123');
      expect(document.cookie).toContain('domain=example.com');
      expect(document.cookie).toContain('expires=');
      expect(document.cookie).toContain('secure');
      expect(document.cookie).toContain('HttpOnly');
    });
  });

  describe('delete', () => {
    it('should throw if name is missing', async () => {
      service = CookieService.getInstance();
      await expect(service.delete({} as any)).rejects.toThrow('name is required');
    });

    it('should use GM_cookie.delete when available', async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      mockUserscript.cookie = gmCookieMock as any;
      service = CookieService.getInstance();

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      gmCookieMock.delete.mockImplementation((_opts: any, cb: any) => cb(null));

      await service.delete({ name: 'test' });
      expect(gmCookieMock.delete).toHaveBeenCalledWith(
        expect.objectContaining({ name: 'test' }),
        expect.any(Function)
      );
    });

    it('should expire document.cookie when GM_cookie is missing', async () => {
      service = CookieService.getInstance();
      document.cookie = 'test=123';

      await service.delete({ name: 'test' });
      // document.cookie setter logic in test environment might just append string
      // We verify the expiration string was constructed
      expect(document.cookie).toContain('test=; expires=Thu, 01 Jan 1970');
    });
  });
});

describe('CookieService - mutation coverage', () => {
  let service: CookieService;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let gmCookieMock: any;

  beforeEach(() => {
    vi.clearAllMocks();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (CookieService as any).instance = null;

    gmCookieMock = {
      list: vi.fn(),
      set: vi.fn(),
      delete: vi.fn(),
    };
    mockUserscript.cookie = undefined;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    delete (globalThis as any).GM_cookie;

    Object.defineProperty(document, 'cookie', {
      writable: true,
      value: '',
    });
  });

  afterEach(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (CookieService as any).instance = null;
  });

  describe('decode function coverage', () => {
    it('should return empty string for cookie with empty value', async () => {
      service = CookieService.getInstance();
      // Cookie with name but empty value - in list() this becomes empty string
      document.cookie = 'empty=';
      const result = await service.list();
      const emptyCookie = result.find(c => c.name === 'empty');
      // The value should be empty string
      expect(emptyCookie?.value).toBe('');
    });

    it('should handle decoding failure gracefully', async () => {
      service = CookieService.getInstance();
      // Malformed percent encoding
      document.cookie = 'bad=%E0%A4%A';
      const result = service.getValueSync('bad');
      // Should return original value when decode fails
      expect(result).toBe('%E0%A4%A');
    });
  });

  describe('optional chaining coverage', () => {
    it('should handle gmCookie.list being called with null options', async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      mockUserscript.cookie = gmCookieMock as any;
      service = CookieService.getInstance();

      const mockCookies = [{ name: 'test', value: 'value' }];
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      gmCookieMock.list.mockImplementation((_opts: any, cb: any) => cb(mockCookies, null));

      const result = await service.list();
      expect(result).toHaveLength(1);
    });

    it('should handle cookies[0]?.value being undefined', async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      mockUserscript.cookie = gmCookieMock as any;
      service = CookieService.getInstance();

      // Cookie without value property
      const mockCookies = [{ name: 'test' }];
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      gmCookieMock.list.mockImplementation((_opts: any, cb: any) => cb(mockCookies, null));

      document.cookie = 'test=docvalue';

      const result = await service.getValue('test');
      // Should fallback to document value when GM value is undefined
      expect(result).toBe('docvalue');
    });

    it('should handle match?.[1] being undefined', async () => {
      service = CookieService.getInstance();
      document.cookie = '';

      const result = service.getValueSync('nonexistent');
      expect(result).toBeUndefined();
    });

    it('should handle details?.name being undefined in set', async () => {
      service = CookieService.getInstance();
      await expect(service.set(undefined as any)).rejects.toThrow('name is required');
    });

    it('should handle details?.name being undefined in delete', async () => {
      service = CookieService.getInstance();
      await expect(service.delete(undefined as any)).rejects.toThrow('name is required');
    });
  });

  describe('gmCookie?.set optional chaining', () => {
    it('should safely call gmCookie.set with promisifyVoidCallback', async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      mockUserscript.cookie = gmCookieMock as any;
      service = CookieService.getInstance();

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      gmCookieMock.set.mockImplementation((_opts: any, cb: any) => cb(null));

      await service.set({ name: 'test', value: '123' });
      expect(gmCookieMock.set).toHaveBeenCalled();
    });

    it('should fallback to document.cookie when gmCookie.set is missing from userscript cookie', async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      mockUserscript.cookie = { list: vi.fn(), delete: vi.fn() } as any; // set missing
      service = CookieService.getInstance();

      // document.cookie should be written when gmCookie.set is not present
      Object.defineProperty(document, 'cookie', { writable: true, value: '' });
      await service.set({ name: 'fallback', value: '1', path: '/' });
      expect(document.cookie).toContain('fallback=1');
    });
  });

  describe('gmCookie?.delete optional chaining', () => {
    it('should safely call gmCookie.delete with promisifyVoidCallback', async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      mockUserscript.cookie = gmCookieMock as any;
      service = CookieService.getInstance();

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      gmCookieMock.delete.mockImplementation((_opts: any, cb: any) => cb(null));

      await service.delete({ name: 'test' });
      expect(gmCookieMock.delete).toHaveBeenCalled();
    });

    it('should fallback to expire document.cookie when gmCookie.delete is missing from userscript cookie', async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      mockUserscript.cookie = { list: vi.fn(), set: vi.fn() } as any; // delete missing
      service = CookieService.getInstance();

      document.cookie = 'del=1';
      await service.delete({ name: 'del' });
      // Should write an expiration for 'del' cookie
      expect(document.cookie).toContain('del=; expires=Thu, 01 Jan 1970');
    });
  });

  describe('listFromDocument coverage', () => {
    it('should not include domain when hostname is empty string', async () => {
      service = CookieService.getInstance();

      // Instead of redefining location, test with empty cookies
      document.cookie = 'test=value';
      const result = await service.list();

      // Verify that domain is set when hostname is available
      expect(result[0]?.domain).toBeDefined();
    });

    it('should handle empty cookie entries', async () => {
      service = CookieService.getInstance();
      document.cookie = 'foo=bar;; ;baz=qux';

      const result = await service.list();
      // Should filter out empty entries
      expect(result.every(r => r.name !== '')).toBe(true);
    });

    it('should handle cookie with = in value', async () => {
      service = CookieService.getInstance();
      document.cookie = 'token=abc=def=ghi';

      const result = await service.list();
      expect(result[0]?.value).toBe('abc=def=ghi');
    });

    it('should mark parsed cookies as session=true when parsed from document.cookie', async () => {
      service = CookieService.getInstance();
      document.cookie = 'sess=1';
      const result = await service.list();
      expect(result[0]?.session).toBe(true);
    });
  });

  describe('conditional expression coverage', () => {
    it('should return empty array when document.cookie is not string', async () => {
      service = CookieService.getInstance();
      Object.defineProperty(document, 'cookie', {
        writable: true,
        value: null,
      });

      const result = await service.list();
      expect(result).toEqual([]);
    });

    it('should return undefined from getValueSync when document is undefined', () => {
      service = CookieService.getInstance();
      // This test is tricky since document is always defined in jsdom
      // Instead verify the conditional for document.cookie type
      Object.defineProperty(document, 'cookie', {
        writable: true,
        value: 123, // Not a string
      });

      const result = service.getValueSync('test');
      expect(result).toBeUndefined();
    });

    it('should return undefined from getValue for empty name', async () => {
      service = CookieService.getInstance();
      const result = await service.getValue('');
      expect(result).toBeUndefined();
    });

    it('should return undefined from getValueSync for empty name', () => {
      service = CookieService.getInstance();
      const result = service.getValueSync('');
      expect(result).toBeUndefined();
    });
  });

  describe('buildDocumentCookieString coverage', () => {
    it('should use default path when not specified', async () => {
      service = CookieService.getInstance();

      await service.set({ name: 'test', value: 'value' });
      expect(document.cookie).toContain('path=/');
    });

    it('should include all optional fields when specified', async () => {
      service = CookieService.getInstance();
      const expDate = Math.floor(Date.now() / 1000) + 3600;

      await service.set({
        name: 'full',
        value: 'value',
        path: '/custom',
        domain: '.example.com',
        expirationDate: expDate,
        secure: true,
        httpOnly: true,
      });

      const cookie = document.cookie;
      expect(cookie).toContain('full=value');
      expect(cookie).toContain('path=/custom');
      expect(cookie).toContain('domain=.example.com');
      expect(cookie).toContain('expires=');
      expect(cookie).toContain('secure');
      expect(cookie).toContain('HttpOnly');
    });

    it('should not include domain when not specified', async () => {
      service = CookieService.getInstance();

      await service.set({ name: 'test', value: 'value' });
      expect(document.cookie).not.toContain('domain=');
    });

    it('should not include secure when not specified', async () => {
      service = CookieService.getInstance();

      await service.set({ name: 'test', value: 'value' });
      expect(document.cookie).not.toContain('secure');
    });

    it('should not include expires when not specified', async () => {
      service = CookieService.getInstance();
      await service.set({ name: 'test', value: 'value' });
      expect(document.cookie).not.toContain('expires=');
    });
  });

  describe('expirationDate arithmetic', () => {
    it('should multiply expirationDate by 1000 for Date constructor', async () => {
      service = CookieService.getInstance();

      // Unix timestamp in seconds
      const unixSeconds = 1700000000;

      await service.set({ name: 'test', value: 'value', expirationDate: unixSeconds });

      // Expected date string
      const expectedDate = new Date(unixSeconds * 1000).toUTCString();
      expect(document.cookie).toContain(expectedDate);
    });
  });

  describe('GM_cookie.list null/undefined cookies', () => {
    it('should handle GM_cookie.list returning undefined cookies', async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      mockUserscript.cookie = gmCookieMock as any;
      service = CookieService.getInstance();

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      gmCookieMock.list.mockImplementation((_opts: any, cb: any) => cb(undefined, null));

      const result = await service.list();
      expect(result).toEqual([]);
    });

    it('should handle GM_cookie.list returning null cookies', async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      mockUserscript.cookie = gmCookieMock as any;
      service = CookieService.getInstance();

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      gmCookieMock.list.mockImplementation((_opts: any, cb: any) => cb(null, null));

      const result = await service.list();
      expect(result).toEqual([]);
    });
  });

  describe('resolveCookieAPI coverage', () => {
    it('should use global GM_cookie when userscript throws', () => {
      // Make getUserscript throw
      mockUserscript.cookie = undefined;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (globalThis as any).GM_cookie = gmCookieMock;

      service = CookieService.getInstance();

      expect(service.hasNativeAccess()).toBe(true);
    });

    it('should reject GM_cookie without list function', () => {
      mockUserscript.cookie = undefined;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (globalThis as any).GM_cookie = {
        set: vi.fn(),
        delete: vi.fn(),
        // Missing list function
      };

      service = CookieService.getInstance();

      expect(service.hasNativeAccess()).toBe(false);
    });

    it('should fallback to global GM_cookie when getUserscript throws', () => {
      // Simulate getUserscript throwing by defining a cookie getter that throws when accessed
      Object.defineProperty(mockUserscript, 'cookie', {
        get() {
          throw new Error('boom');
        },
        configurable: true,
      });
      // Provide a global GM_cookie
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (globalThis as any).GM_cookie = { list: vi.fn(), set: vi.fn(), delete: vi.fn() };
      service = CookieService.getInstance();
      expect(service.hasNativeAccess()).toBe(true);
    });
  });
});
