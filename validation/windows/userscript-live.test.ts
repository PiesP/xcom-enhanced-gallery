// SPDX-License-Identifier: MIT
// Copyright (c) 2026 PiesP

import { describe, expect, it } from 'vitest';
import {
  bindInstalledUserscriptSource,
  resolveUserscriptGMCallLine,
} from './userscript-install.ts';

describe('installed userscript product identity', () => {
  const body = 'function installedProduct() { return 495; }';
  const installed = `// ==UserScript==\n// @name Example\n// ==/UserScript==\n${body}\n`;

  it('binds the exact product body independently of manager metadata and wrapper code', () => {
    const binding = bindInstalledUserscriptSource(
      installed,
      `managerPrefix;\n${body}\nmanagerSuffix;`
    );
    expect(binding.bodyBytes).toBe(Buffer.byteLength(body));
    expect(binding.bodyOffsetUtf16).toBe('managerPrefix;\n'.length);
    expect(binding.wrapperSha256).not.toBe(binding.installedSha256);
    expect(binding.bodySha256).toMatch(/^[0-9a-f]{64}$/u);
  });

  it('rejects a changed product body, duplicate body, or missing metadata boundary', () => {
    expect(() => bindInstalledUserscriptSource(installed, body.replace('495', '482'))).toThrow();
    expect(() => bindInstalledUserscriptSource(installed, `${body}\n${body}`)).toThrow();
    expect(() => bindInstalledUserscriptSource(body, body)).toThrow();
  });
});

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
