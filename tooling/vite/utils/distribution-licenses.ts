import { closeSync, constants, fstatSync, lstatSync, openSync, readFileSync } from 'node:fs';
import { platform } from 'node:os';
import { resolve } from 'node:path';

export const DISTRIBUTION_NOTICE_PATHS = [
  'LICENSE',
  'NOTICE.md',
  'LICENSES/solid-js-MIT.txt',
  'LICENSES/lucide-ISC.txt',
  'LICENSES/xcom-enhanced-gallery-MIT.txt',
] as const;

/** Read from the same descriptor whose regular-file identity was validated. */
export function readRegularNoticeFile(path: string): Buffer {
  const posixSafety = platform() === 'win32'
    ? 0 : (constants.O_NOFOLLOW ?? 0) | (constants.O_NONBLOCK ?? 0);
  const fd = openSync(path, constants.O_RDONLY | posixSafety);
  try {
    const opened = fstatSync(fd);
    const entry = lstatSync(path);
    if (!opened.isFile() || !entry.isFile() ||
        opened.dev !== entry.dev || opened.ino !== entry.ino) {
      throw new Error('Notice is not a stable regular file.');
    }
    return readFileSync(fd);
  } finally {
    closeSync(fd);
  }
}

export function readDistributionNotices(root: string): Array<{ path: string; bytes: Buffer }> {
  return DISTRIBUTION_NOTICE_PATHS.map((path) => {
    const source = resolve(root, path);
    try {
      return { path, bytes: readRegularNoticeFile(source) };
    } catch {
      throw new Error(`Required distribution notice ${path} is missing or invalid.`);
    }
  });
}

export function renderUserscriptNotices(notices: ReadonlyArray<{ path: string; bytes: Buffer }>): string {
  return notices.map(({ path, bytes }) => {
    const text = bytes.toString('utf8');
    if (!Buffer.from(text, 'utf8').equals(bytes) || text.includes('*/')) {
      throw new Error(`Required distribution notice ${path} cannot be embedded as a JS comment.`);
    }
    return `/* ${path}\n${text}\n*/`;
  }).join('\n');
}
