// SPDX-License-Identifier: MIT
// Copyright (c) 2026 PiesP

import { describe, expect, it } from 'vitest';
import { mkdtemp, mkdir, writeFile, readdir, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import type { CDPSession, BrowserContext, Page } from '@playwright/test';
import {
  bindInstalledUserscriptSource,
  createBrowserDownloadObserver,
  createManagerPhotoApiObserver,
  retainFailedLiveNativeFiles,
  resolveUserscriptGMCallLine,
  resolveUserscriptGMCallerLines,
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

  it('resolves only paired modern and legacy callsites inside the installed adapter', () => {
    const source = [
      'function getUserscript() {',
      '  const gmDownloadModern = asFunction(g.download);',
      '  const gmDownloadLegacy = asFunction(g.downloadLegacy);',
      '  cachedUserscriptAPI = {',
      '    async download(url, filename, signal) {',
      '      if (gmDownloadModern) return downloadViaGM("GM.download", gmDownloadModern, url, filename, signal);',
      '      if (gmDownloadLegacy) return downloadViaGM("GM_download", gmDownloadLegacy, url, filename, signal);',
      '    }',
      '  };',
      '}',
    ].join('\n');
    expect(resolveUserscriptGMCallerLines(source)).toEqual({ modern: 5, legacy: 6 });
    expect(
      resolveUserscriptGMCallerLines(source.replace('g.downloadLegacy', 'g.other'))
    ).toBeNull();
    expect(resolveUserscriptGMCallerLines(source.replace('GM_download', 'GM.other'))).toBeNull();
    expect(resolveUserscriptGMCallerLines(source + '\n' + source)).toBeNull();
  });
});

describe('bounded selected-photo native evidence', () => {
  it('keeps the default browser event bound and adds only six selected-fixture operations', () => {
    for (const selected of [false, true]) {
      const listeners = new Map<string, (event: unknown) => void>();
      const cdp = {
        on: (name: string, callback: (event: unknown) => void) => listeners.set(name, callback),
        off: (name: string) => listeners.delete(name),
      } as unknown as CDPSession;
      const observer = createBrowserDownloadObserver(cdp, selected);
      const maximum = selected ? 18 : 12;
      const begin = listeners.get('Browser.downloadWillBegin')!;
      for (let index = 0; index < maximum; index++) {
        begin({
          guid: `owned-${index}`,
          suggestedFilename: `owned-${index}.zip`,
          url: 'blob:https://x.com/owned',
        });
      }
      expect(observer.snapshot()).toBe(maximum);
      expect(() =>
        begin({
          guid: 'overflow',
          suggestedFilename: 'overflow.zip',
          url: 'blob:https://x.com/owned',
        })
      ).toThrow('Too many task-profile downloads');
      observer.dispose();
      expect(listeners.size).toBe(0);
    }
  });

  it('retains fourteen bounded native files without changing default or byte limits', async () => {
    const root = await mkdtemp(join(tmpdir(), 'xeg-photo-retain-'));
    const downloads = join(root, 'downloads');
    const output = join(root, 'output');
    await mkdir(downloads);
    await mkdir(output);
    try {
      for (let index = 0; index < 14; index++) {
        await writeFile(join(downloads, `owned-${index}.jpg`), Buffer.from(`known-${index}`));
      }
      await expect(retainFailedLiveNativeFiles(downloads, output, [], 8)).rejects.toThrow(
        'too many native entries'
      );
      expect(await readdir(output)).toEqual([]);
      const retained = await retainFailedLiveNativeFiles(downloads, output, [], 14);
      expect(retained).toHaveLength(14);
      expect(await readdir(downloads)).toHaveLength(14);
      expect(await readdir(output)).toHaveLength(14);
      await writeFile(join(downloads, 'unexpected-15.jpg'), Buffer.from('extra'));
      await expect(retainFailedLiveNativeFiles(downloads, output, [], 14)).rejects.toThrow(
        'too many native entries'
      );
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });
});

describe('owned installed manager API source binding', () => {
  const owner = '2121007970545017041';
  const body =
    'function downloadSingleFile() {}\nfunction request() {\n  gmDetails.onload = (response) => {\n    try {\n      if (resourceLimitExceeded) return;\n    } finally {}\n  };\n}';
  const installed = `// ==UserScript==\n// @name Owned test\n// ==/UserScript==\n${body}\n`;
  function host(changed = false) {
    const listeners = new Map<string, Set<(value: unknown) => void>>();
    const calls: string[] = [];
    const executed = `managerPrefix;\n${changed ? body.replace('function request()', 'function changed()') : body}\nmanagerSuffix;`;
    let detached = 0;
    const session = {
      on(name: string, handler: (value: unknown) => void) {
        const list = listeners.get(name) ?? new Set();
        list.add(handler);
        listeners.set(name, list);
      },
      off(name: string, handler: (value: unknown) => void) {
        listeners.get(name)?.delete(handler);
      },
      async send(method: string, params?: Record<string, unknown>) {
        calls.push(method);
        if (method === 'Debugger.enable') {
          for (const callback of listeners.get('Debugger.scriptParsed') ?? []) {
            callback({ scriptId: 'owned-script', url: 'userscript:owned', executionContextId: 7 });
          }
        }
        if (method === 'Debugger.getScriptSource') {
          return { scriptSource: executed };
        }
        if (method === 'Debugger.setBreakpoint') {
          return { breakpointId: 'owned-api', actualLocation: params?.location };
        }
        return {};
      },
      async detach() {
        detached++;
      },
    };
    const context = { newCDPSession: async () => session } as unknown as BrowserContext;
    const page = {
      context: () => context,
      url: () => `https://x.com/shinchilla_/status/${owner}`,
    } as unknown as Page;
    return { context, page, calls, listeners, detached: () => detached };
  }
  it('binds the sole executed product body before arming and detaches after cleanup', async () => {
    const owned = host();
    const observer = createManagerPhotoApiObserver(owned.context, 'a'.repeat(32), installed);
    const trace = await observer(owned.page, owner, () => {});
    expect(trace.snapshot().sourceBinding).toMatchObject({
      executionContextId: 7,
      scriptId: 'owned-script',
    });
    expect(owned.calls).toContain('Debugger.setBreakpoint');
    await trace.stop();
    await trace.stop();
    expect(owned.detached()).toBe(1);
    expect(owned.calls).toContain('Debugger.removeBreakpoint');
    expect(owned.calls).toContain('Debugger.disable');
    expect([...owned.listeners.values()].every((value) => value.size === 0)).toBe(true);
  });
  it('refuses changed executed source and closes its owned debugger session', async () => {
    const owned = host(true);
    const observer = createManagerPhotoApiObserver(owned.context, 'a'.repeat(32), installed);
    await expect(observer(owned.page, owner, () => {})).rejects.toThrow(
      'differs from installed product body'
    );
    expect(owned.detached()).toBe(1);
    expect(owned.calls).not.toContain('Debugger.setBreakpoint');
    expect([...owned.listeners.values()].every((value) => value.size === 0)).toBe(true);
  });
});
