import { lstatSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

export const DISTRIBUTION_NOTICE_PATHS = [
  'LICENSE',
  'NOTICE.md',
  'LICENSES/solid-js-MIT.txt',
  'LICENSES/lucide-ISC.txt',
  'LICENSES/xcom-enhanced-gallery-MIT.txt',
] as const;

export function readDistributionNotices(root: string): Array<{ path: string; bytes: Buffer }> {
  return DISTRIBUTION_NOTICE_PATHS.map((path) => {
    const source = resolve(root, path);
    try {
      if (!lstatSync(source).isFile()) throw new Error('not a regular file');
      return { path, bytes: readFileSync(source) };
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
