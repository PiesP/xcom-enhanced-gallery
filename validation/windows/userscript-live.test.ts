// SPDX-License-Identifier: MIT
// Copyright (c) 2026 PiesP

import { describe, expect, it } from 'vitest';
import { resolveUserscriptGMCallLine } from './userscript-install.ts';

describe('installed userscript GM call diagnostic', () => {
  it('binds immediately after the sole options-object call and preserves older sources', () => {
    const source = [
      'function downloadViaGM(apiName, gmDownload, url, filename, signal) {',
      '  let handle;',
      '  handle = gmDownload({',
      '    url, name: filename, saveAs: false',
      '  });',
      '  Promise.resolve(handle).then(void 0, fail);',
      '}',
      'function next() {}',
    ].join('\n');
    expect(resolveUserscriptGMCallLine(source)).toBe(5);
    expect(resolveUserscriptGMCallLine('function olderDownload() {}')).toBeNull();
    expect(
      resolveUserscriptGMCallLine(
        [
          'const handle = gmDownloadModern({',
          '  url, name: filename, saveAs: false',
          '});',
          'if (settled) return;',
        ].join('\n')
      )
    ).toBe(3);
    expect(() =>
      resolveUserscriptGMCallLine(source.replace('handle = gmDownload({', 'return gmDownload({'))
    ).toThrow();
    expect(() =>
      resolveUserscriptGMCallLine(
        source.replace(
          'function next() {}',
          '  Promise.resolve(handle).then(void 0, fail);\nfunction next() {}'
        )
      )
    ).toThrow();
  });
});
