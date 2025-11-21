import { getUserscript } from '@shared/external/userscript';
import { logger } from '@shared/logging';
import type {
  CookieAPI,
  CookieDeleteOptions,
  CookieListOptions,
  CookieRecord,
  CookieSetOptions,
} from '@shared/types/core/cookie.types';

type CookieSetOptionsWithName = CookieSetOptions & { name: string };

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

interface GlobalWithCookie {
  GM_cookie?: CookieAPI;
}

function decode(value: string | undefined): string | undefined {
  if (!value) return undefined;
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

function encode(value: string): string {
  try {
    return encodeURIComponent(value);
  } catch {
    return value;
  }
}

function buildDocumentCookieString(details: CookieSetOptionsWithName): string {
  const segments: string[] = [];
  const name = encode(details.name);
  const value = encode(details.value);
  segments.push(`${name}=${value}`);
  segments.push(`path=${details.path ?? '/'}`);
  if (details.domain) {
    segments.push(`domain=${details.domain}`);
  }
  if (details.expirationDate) {
    segments.push(`expires=${new Date(details.expirationDate * 1000).toUTCString()}`);
  }
  if (details.secure) {
    segments.push('secure');
  }
  if (details.httpOnly) {
    segments.push('HttpOnly');
  }
  return segments.join('; ');
}

function expireDocumentCookie(name: string): void {
  if (typeof document === 'undefined') return;
  document.cookie = `${encode(name)}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`;
}

export class CookieService {
  private static instance: CookieService | null = null;
  private readonly gmCookie: CookieAPI | null;
  private readonly cache = new Map<string, string>();

  private constructor() {
    this.gmCookie = this.resolveCookieAPI();
  }

  static getInstance(): CookieService {
    if (!this.instance) {
      this.instance = new CookieService();
    }
    return this.instance;
  }

  /**
   * Returns true when GM_cookie is available.
   */
  hasNativeAccess(): boolean {
    return Boolean(this.gmCookie);
  }

  async list(options?: CookieListOptions): Promise<CookieRecord[]> {
    if (!this.gmCookie?.list) {
      return this.listFromDocument(options);
    }

    return await new Promise<CookieRecord[]>(resolve => {
      try {
        this.gmCookie?.list(options, (cookies, error) => {
          if (error) {
            logger.warn('GM_cookie.list failed; falling back to document.cookie', error);
            resolve(this.listFromDocument(options));
            return;
          }

          const results = (cookies ?? []).map(cookie => ({ ...cookie }));
          for (const record of results) {
            if (record.name && record.value) {
              this.cache.set(record.name, record.value);
            }
          }
          resolve(results);
        });
      } catch (error) {
        logger.warn('GM_cookie.list threw error; falling back to document.cookie', error);
        resolve(this.listFromDocument(options));
      }
    });
  }

  async getValue(name: string, options?: CookieListOptions): Promise<string | undefined> {
    if (!name) return undefined;

    if (this.cache.has(name)) {
      return this.cache.get(name);
    }

    if (this.gmCookie?.list) {
      const cookies = await this.list({ ...options, name });
      const value = cookies[0]?.value;
      if (value) {
        this.cache.set(name, value);
        return value;
      }
    }

    return this.getValueSync(name);
  }

  getValueSync(name: string): string | undefined {
    if (!name) return undefined;
    if (this.cache.has(name)) {
      return this.cache.get(name);
    }
    if (typeof document === 'undefined' || typeof document.cookie !== 'string') {
      return undefined;
    }

    const pattern = new RegExp(`(?:^|;\\s*)${escapeRegex(name)}=([^;]*)`);
    const match = document.cookie.match(pattern);
    const value = decode(match?.[1]);

    if (value) {
      this.cache.set(name, value);
    }

    return value;
  }

  async set(details: CookieSetOptions): Promise<void> {
    const name = details?.name;
    if (!name) {
      throw new Error('Cookie name is required');
    }

    const normalizedDetails: CookieSetOptionsWithName = {
      ...details,
      name,
    };

    if (!this.gmCookie?.set) {
      if (typeof document === 'undefined') {
        throw new Error('Cannot set cookie: document is not available');
      }
      document.cookie = buildDocumentCookieString(normalizedDetails);
      this.cache.set(name, normalizedDetails.value);
      return;
    }

    await new Promise<void>((resolve, reject) => {
      try {
        this.gmCookie?.set?.(normalizedDetails, error => {
          if (error) {
            reject(new Error(error));
            return;
          }
          this.cache.set(name, normalizedDetails.value);
          resolve();
        });
      } catch (error) {
        reject(error instanceof Error ? error : new Error(String(error)));
      }
    });
  }

  async delete(details: CookieDeleteOptions): Promise<void> {
    if (!details?.name) {
      throw new Error('Cookie name is required');
    }

    if (!this.gmCookie?.delete) {
      expireDocumentCookie(details.name);
      this.cache.delete(details.name);
      return;
    }

    await new Promise<void>((resolve, reject) => {
      try {
        this.gmCookie?.delete?.(details, error => {
          if (error) {
            reject(new Error(error));
            return;
          }
          this.cache.delete(details.name);
          resolve();
        });
      } catch (error) {
        reject(error instanceof Error ? error : new Error(String(error)));
      }
    });
  }

  private resolveCookieAPI(): CookieAPI | null {
    try {
      const userscript = getUserscript();
      if (userscript.cookie) {
        return userscript.cookie;
      }
    } catch {
      // Ignore: fall back to global probing below
    }

    const global = globalThis as GlobalWithCookie;
    if (global.GM_cookie && typeof global.GM_cookie.list === 'function') {
      return global.GM_cookie;
    }

    return null;
  }

  private listFromDocument(options?: CookieListOptions): CookieRecord[] {
    if (typeof document === 'undefined' || typeof document.cookie !== 'string') {
      return [];
    }

    const domain =
      typeof document.location?.hostname === 'string' ? document.location.hostname : undefined;

    const records = document.cookie
      .split(';')
      .map(entry => entry.trim())
      .filter(Boolean)
      .map(entry => {
        const [rawName, ...rest] = entry.split('=');
        const nameDecoded = decode(rawName);
        if (!nameDecoded) {
          return null;
        }
        const value = decode(rest.join('=')) ?? '';
        const record: CookieRecord = {
          name: nameDecoded,
          value,
          path: '/',
          session: true,
          ...(domain ? { domain } : {}),
        };
        return record;
      })
      .filter((record): record is CookieRecord => Boolean(record));

    const filtered = options?.name
      ? records.filter(record => record.name === options.name)
      : records;
    for (const record of filtered) {
      if (record.value) {
        this.cache.set(record.name, record.value);
      }
    }
    return filtered;
  }
}

export function getCookieService(): CookieService {
  return CookieService.getInstance();
}
