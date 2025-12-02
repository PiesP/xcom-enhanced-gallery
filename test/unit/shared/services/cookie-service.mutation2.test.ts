// Reuse existing mocking pattern from other cookie tests
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mockUserscript: { cookie?: any } = { cookie: undefined };
vi.mock('@shared/external/userscript', () => ({ getUserscript: () => mockUserscript }));
vi.mock('@shared/logging', () => ({ logger: { warn: vi.fn(), debug: vi.fn(), info: vi.fn(), error: vi.fn() } }));
import { logger } from '@shared/logging';
import { getCookieService, CookieService } from '@shared/services/cookie-service';

describe('CookieService - extra mutation coverage', () => {
  beforeEach(() => {
    // Reset singleton
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (CookieService as unknown as { instance?: any }).instance = undefined;
    vi.clearAllMocks();

    // Ensure no GM cookie
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    delete (globalThis as any).GM_cookie;
      // Clear document.cookie between tests
      if (typeof document !== 'undefined') {
        const doc = document as Document;
        (doc.cookie ?? '').split(';').forEach((c) => {
          const name = (c.split('=')[0] ?? '').trim();
          if (name) doc.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`;
        });
      }
  });

  it('should not throw and fallback to document.cookie when gmCookie is explicitly null', async () => {
    const cs = getCookieService();
    // Force gmCookie to null on the singleton instance
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (cs as any).gmCookie = null;

    // Set a document cookie and ensure list() returns expected value
    document.cookie = 'explicit=nu';
    const list = await cs.list();
    expect(list).toHaveLength(1);
    expect(list[0]!.name).toBe('explicit');
  });

  it('should fallback to document.cookie when gmCookie.list is not a function', async () => {
    const cs = getCookieService();
    // Force gmCookie with list undefined
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (cs as any).gmCookie = { list: undefined, set: undefined, delete: undefined };

    document.cookie = 'noList=ok';
    const list = await cs.list();
    expect(list).toHaveLength(1);
    expect(list[0]!.name).toBe('noList');
  });

  it('should not throw when gmCookie.set is not a function (fallback to document.cookie)', async () => {
    const cs = getCookieService();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (cs as any).gmCookie = { set: undefined };

    await cs.set({ name: 'fallbackSet', value: 'v' });
    expect(document.cookie).toContain('fallbackSet=v');
  });

  it('should not throw when gmCookie.delete is not a function (fallback to expire cookie)', async () => {
    const cs = getCookieService();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (cs as any).gmCookie = { delete: undefined };

    // Set cookie then delete
    document.cookie = 'toDelete=1';
    await cs.delete({ name: 'toDelete' });
    // Should have expired cookie; exact behavior in JSDOM might vary, ensure no exception and cookie not present
    expect(document.cookie.includes('toDelete=')).toBe(false);
  });

  it('should handle gmCookie.list returning null/undefined robustly (no crash)', async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const gm: any = {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      list: (_opts: any, cb: any) => cb(null, null),
    };

    // Supply gmCookie via userscript adapter
    mockUserscript.cookie = gm;

    const cs = getCookieService();

    const result = await cs.list();
    expect(result).toEqual([]);
    // Should not warn when GM_cookie.list reports no cookies (null/undefined)
    expect(logger.warn).not.toHaveBeenCalled();
  });

  it('should warn and fallback to document.cookie when gmCookie.list returns an error', async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const gm: any = { list: (_opts: any, cb: any) => cb(null, 'Error') };
    mockUserscript.cookie = gm;
    // Reset singleton
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (CookieService as unknown as { instance?: any }).instance = undefined;
    const cs = getCookieService();

    document.cookie = 'err=1';
    const list = await cs.list();
    expect(list).toHaveLength(1);
    expect(list[0]!.name).toBe('err');
    expect(logger.warn).toHaveBeenCalled();
  });

  it('getValue should return undefined for empty name', async () => {
    const cs = getCookieService();
    // Empty or falsy names should return undefined
    expect(await cs.getValue('')).toBeUndefined();
    expect(await cs.getValue('   ')).toBeUndefined();
  });

  it('getValue should not throw when gmCookie.list returns empty array and should fallback to document.cookie', async () => {
    const cs = getCookieService();
    // force gmCookie with list returning empty array
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (cs as any).gmCookie = { list: (_opts: any, cb: any) => cb(null, []) };

    // Ensure document cookie has the expected name/value
    document.cookie = 'fallbackName=fbval';

    const value = await cs.getValue('fallbackName');
    expect(value).toBe('fbval');
  });

  it('listFromDocument should ignore cookies with empty names', async () => {
    // Ensure no GM cookie adapter so listFromDocument is used
    mockUserscript.cookie = undefined;
    // Reset singleton so the instance uses updated userscript
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (CookieService as unknown as { instance?: any }).instance = undefined;
    const cs2 = getCookieService();
    // create a cookie with empty name and another with valid name
    document.cookie = '=bad';
    document.cookie = 'okName=okVal';

    const list = await cs2.list();
    expect(list.map((r) => r.name)).not.toContain('');
    expect(list.map((r) => r.name)).toContain('okName');
  });

  it('set should use GM_cookie.set when available', async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const gm: any = { set: vi.fn((_details: any, cb: any) => cb(null)) };
    mockUserscript.cookie = gm;

    // Reset singleton
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (CookieService as unknown as { instance?: any }).instance = undefined;
    const cs = getCookieService();

    await cs.set({ name: 'gmSet', value: 'v' });
    expect(gm.set).toHaveBeenCalled();
    // Should not have written to document.cookie (since GM set used)
    expect(document.cookie.includes('gmSet=v')).toBe(false);
  });

  it('delete should use GM_cookie.delete when available', async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const gm: any = { delete: vi.fn((_details: any, cb: any) => cb(null)) };
    mockUserscript.cookie = gm;

    // Reset singleton
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (CookieService as unknown as { instance?: any }).instance = undefined;
    const cs = getCookieService();

    document.cookie = 'toDelete=1';
    await cs.delete({ name: 'toDelete' });
    expect(gm.delete).toHaveBeenCalled();
  });
});
