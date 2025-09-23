import { logger } from '@shared/logging';

export interface FflateAPI {
  zip: (...args: unknown[]) => Uint8Array;
  unzip: (...args: unknown[]) => Uint8Array;
  strToU8: (input: string, opts?: unknown) => Uint8Array;
  strFromU8: (input: Uint8Array, opts?: unknown) => string;
  zipSync: (...args: unknown[]) => Uint8Array;
  unzipSync: (...args: unknown[]) => Uint8Array;
  deflate: (...args: unknown[]) => Uint8Array;
  inflate: (...args: unknown[]) => Uint8Array;
}

export const FFLATE_REMOVAL_MESSAGE =
  'fflate dependency has been removed. Use StoreZipWriter for ZIP creation.';

function createError(method: string): Error {
  return new Error(`${FFLATE_REMOVAL_MESSAGE} (attempted to call ${method}).`);
}

export function createDeprecatedFflateApi(): FflateAPI {
  const thrower = <T>(method: string) => {
    return ((..._args: unknown[]): T => {
      throw createError(method);
    }) as (...args: unknown[]) => T;
  };

  return {
    zip: thrower('zip'),
    unzip: thrower('unzip'),
    strToU8: thrower('strToU8'),
    strFromU8: thrower('strFromU8'),
    zipSync: thrower('zipSync'),
    unzipSync: thrower('unzipSync'),
    deflate: thrower('deflate'),
    inflate: thrower('inflate'),
  };
}

export function warnFflateDeprecated(context?: string): void {
  const suffix = context ? ` ${context}` : ' Please migrate existing code paths.';
  logger.warn(`[Vendors] ${FFLATE_REMOVAL_MESSAGE}.${suffix}`);
}
