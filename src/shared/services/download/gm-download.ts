/**
 * Shared GM_download helpers
 * Centralizes detection and access to Tampermonkey's GM_download API.
 */

export type GMDownloadFunction = (options: Record<string, unknown>) => void;

type GlobalWithGMDownload = typeof globalThis & {
  ['GM_download']?: GMDownloadFunction;
};

/**
 * Returns the GM_download implementation when running under Tampermonkey.
 */
export function getGMDownload(): GMDownloadFunction | undefined {
  const gm = globalThis as GlobalWithGMDownload;
  const download =
    typeof GM_download !== 'undefined'
      ? (GM_download as unknown as GMDownloadFunction)
      : gm['GM_download'];
  return typeof download === 'function' ? download : undefined;
}

/**
 * Convenience wrapper that throws when GM_download is unavailable.
 */
export function assertGMDownload(): GMDownloadFunction {
  const gmDownload = getGMDownload();
  if (!gmDownload) {
    throw new Error('GM_download not available in this environment');
  }
  return gmDownload;
}
