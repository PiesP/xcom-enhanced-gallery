import { isAllowedUrl } from '@shared/utils/url/url-safety';
import type { IncomingMessage } from './extension-message-types';

const MAX_FILENAME_LENGTH = 255;
const MAX_TEXT_LENGTH = 4096;
const PAGE_ORIGINS = new Set(['https://x.com', 'https://twitter.com']);

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function isSafeText(
  value: unknown,
  maxLength = MAX_TEXT_LENGTH,
  allowNewlines = false
): value is string {
  const controlCharacters = allowNewlines
    ? /[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/
    : /[\u0000-\u001f\u007f]/;
  return (
    typeof value === 'string' &&
    value.length > 0 &&
    value.length <= maxLength &&
    !controlCharacters.test(value)
  );
}

function isSafeFilename(value: unknown): value is string {
  if (!isSafeText(value, MAX_FILENAME_LENGTH)) return false;
  if (value.startsWith('/') || /^[A-Za-z]:[\\/]/.test(value)) return false;
  return !value.split(/[\\/]/).some((segment) => segment === '..');
}

function isSafeHeaders(value: unknown): value is Record<string, string> {
  if (value === undefined) return true;
  if (!isRecord(value)) return false;
  return Object.entries(value).every(
    ([name, headerValue]) =>
      isSafeText(name, 128) && isSafeText(headerValue, 2048) && !/[\r\n]/.test(name + headerValue)
  );
}

function isPageBlobUrl(value: unknown): value is string {
  if (typeof value !== 'string' || value.length > MAX_TEXT_LENGTH) return false;
  try {
    const url = new URL(value);
    return url.protocol === 'blob:' && PAGE_ORIGINS.has(url.origin) && url.pathname.length > 1;
  } catch {
    return false;
  }
}

function isSafeNotificationImage(value: unknown): value is string {
  if (!isSafeText(value, MAX_TEXT_LENGTH)) return false;
  if (value.startsWith('icons/')) {
    return !value.split('/').some((segment) => segment === '..');
  }
  return isAllowedUrl(value);
}

export function isValidIncomingMessage(message: unknown): message is IncomingMessage {
  if (!isRecord(message) || typeof message.type !== 'string' || !isRecord(message.payload)) {
    return false;
  }

  switch (message.type) {
    case 'DOWNLOAD_REQUEST': {
      const payload = message.payload;
      return (
        typeof payload.url === 'string' &&
        isAllowedUrl(payload.url) &&
        isSafeFilename(payload.filename) &&
        isSafeHeaders(payload.headers) &&
        (payload.requestId === undefined || isSafeText(payload.requestId, 128))
      );
    }
    case 'DOWNLOAD_BLOB_URL_REQUEST': {
      const payload = message.payload;
      return (
        isPageBlobUrl(payload.objectUrl) &&
        isSafeFilename(payload.filename) &&
        (payload.mimeType === undefined ||
          (typeof payload.mimeType === 'string' &&
            /^[A-Za-z0-9.+-]+\/[A-Za-z0-9.+-]+$/.test(payload.mimeType) &&
            payload.mimeType.length <= 128)) &&
        (payload.requestId === undefined || isSafeText(payload.requestId, 128))
      );
    }
    case 'DOWNLOAD_CANCEL_REQUEST':
      return isSafeText(message.payload.requestId, 128);
    case 'SHOW_NOTIFICATION': {
      const payload = message.payload;
      return (
        isSafeText(payload.id, 128) &&
        isSafeText(payload.title) &&
        isSafeText(payload.message, MAX_TEXT_LENGTH, true) &&
        (payload.imageUrl === undefined || isSafeNotificationImage(payload.imageUrl))
      );
    }
    default:
      return false;
  }
}
