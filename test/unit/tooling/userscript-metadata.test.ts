// SPDX-License-Identifier: MIT
// Copyright (c) 2026 PiesP

import { copyFileSync, mkdirSync, mkdtempSync, readFileSync, rmSync, symlinkSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { Script } from 'node:vm';
import { TWITTER_API_CONFIG } from '@shared/core/twitter-api/endpoint';
import { describe, expect, it } from 'vitest';
import { buildSummaryPlugin } from '../../../tooling/vite/plugins/build-summary.ts';
import {
  DISTRIBUTION_NOTICE_PATHS,
  readDistributionNotices,
  readRegularNoticeFile,
} from '../../../tooling/vite/utils/distribution-licenses.ts';
import {
  generateMetaOnlyHeader,
  generateUserscriptHeader,
  USERSCRIPT_CONFIG,
} from '../../../tooling/vite/utils/userscript.ts';
import viteConfig from '../../../vite.config.ts';

const projectRoot = resolve(import.meta.dirname, '../../..');

function userscriptBundle(root: string, isDev: boolean): { code: string } {
  const plugin = buildSummaryPlugin({
    root,
    isDev,
    version: '2.3.0',
    config: { cssCompress: !isDev, cssClassNamePattern: 'test', sourceMap: false },
    baseConfig: USERSCRIPT_CONFIG,
  });
  const hook = plugin.generateBundle;
  if (typeof hook !== 'function') {
    throw new Error('Missing userscript bundle hook');
  }
  const chunk = { type: 'chunk', isEntry: true, code: '(()=>{return 7;})();' };
  Reflect.apply(hook, undefined, [{}, { 'x.user.js': chunk }]);
  return chunk;
}

describe('userscript release metadata provenance', () => {
  it.each([undefined, '2.3.0-custom'])(
    'keeps production metadata owned by production mode with BUILD_VERSION=%s',
    (override) => {
      const previous = process.env.BUILD_VERSION;
      try {
        if (override === undefined) {
          delete process.env.BUILD_VERSION;
        } else {
          process.env.BUILD_VERSION = override;
        }
        const plugins = (mode: string) => {
          if (typeof viteConfig !== 'function') {
            throw new Error('Expected a Vite config factory');
          }
          const config = Reflect.apply(viteConfig, undefined, [{ mode }]) as {
            plugins?: { name: string }[];
          };
          return config.plugins?.map((plugin) => plugin.name) ?? [];
        };
        expect(plugins('development')).not.toContain('meta-only-file');
        expect(plugins('production')).toContain('meta-only-file');
        expect(plugins('development')).not.toContain('meta-only-file');
      } finally {
        if (previous === undefined) {
          delete process.env.BUILD_VERSION;
        } else {
          process.env.BUILD_VERSION = previous;
        }
      }
    }
  );

  it('reads canonical notice bytes from a held regular-file descriptor', () => {
    const root = mkdtempSync(join(tmpdir(), 'xeg-notice-descriptor-'));
    try {
      const source = join(root, 'LICENSE');
      copyFileSync(join(projectRoot, 'LICENSE'), source);
      expect(readRegularNoticeFile(source)).toEqual(readFileSync(join(projectRoot, 'LICENSE')));
      expect(() => readRegularNoticeFile(root)).toThrow();
      if (process.platform !== 'win32') {
        const linked = join(root, 'linked');
        symlinkSync(source, linked);
        expect(() => readRegularNoticeFile(linked)).toThrow();
      }
      expect(() => readDistributionNotices(root)).toThrow(/NOTICE\.md.*missing or invalid/u);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it.each([false, true])(
    'keeps the %s userscript metadata first and embeds every canonical notice',
    (isDev) => {
      const root = mkdtempSync(join(tmpdir(), 'xeg-userscript-notices-'));
      try {
        for (const path of DISTRIBUTION_NOTICE_PATHS) {
          const target = join(root, path);
          mkdirSync(dirname(target), { recursive: true });
          copyFileSync(join(projectRoot, path), target);
        }
        const code = userscriptBundle(root, isDev).code;
        expect(() => new Script(code)).not.toThrow();
        const header = generateUserscriptHeader({
          baseConfig: USERSCRIPT_CONFIG,
          isDev,
          version: '2.3.0',
        });
        expect(code.startsWith(`${header}\n/* LICENSE\n`)).toBe(true);
        expect(code.endsWith('(()=>{return 7;})();')).toBe(true);
        for (const path of DISTRIBUTION_NOTICE_PATHS) {
          expect(Buffer.from(code).includes(readFileSync(join(root, path)))).toBe(true);
        }
        expect(code.indexOf('/* NOTICE.md')).toBeGreaterThan(code.indexOf('/* LICENSE'));
        expect(code.indexOf('(()=>{return 7;})();')).toBeGreaterThan(code.indexOf('/* LICENSES/'));
      } finally {
        rmSync(root, { recursive: true, force: true });
      }
    }
  );

  it('does not modify a userscript chunk when a required notice source is missing', () => {
    const root = mkdtempSync(join(tmpdir(), 'xeg-userscript-notices-missing-'));
    try {
      for (const path of DISTRIBUTION_NOTICE_PATHS.slice(0, -1)) {
        const target = join(root, path);
        mkdirSync(dirname(target), { recursive: true });
        copyFileSync(join(projectRoot, path), target);
      }
      const plugin = buildSummaryPlugin({
        root,
        isDev: false,
        version: '2.3.0',
        config: { cssCompress: true, cssClassNamePattern: 'test', sourceMap: false },
        baseConfig: USERSCRIPT_CONFIG,
      });
      const hook = plugin.generateBundle;
      if (typeof hook !== 'function') {
        throw new Error('Missing userscript bundle hook');
      }
      const chunk = { type: 'chunk', isEntry: true, code: 'original code' };
      expect(() => Reflect.apply(hook, undefined, [{}, { 'x.user.js': chunk }])).toThrow(
        /LICENSES\/xcom-enhanced-gallery-MIT\.txt.*missing or invalid/u
      );
      expect(chunk.code).toBe('original code');
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it('declares the actual API and media hosts in generated @connect metadata', () => {
    const expectedHosts = [
      ...TWITTER_API_CONFIG.SUPPORTED_HOSTS,
      'pbs.twimg.com',
      'video.twimg.com',
    ];
    const header = generateUserscriptHeader({
      baseConfig: USERSCRIPT_CONFIG,
      isDev: false,
      version: '2.3.0',
    });
    const connectLines = header.match(/^\/\/ @connect .+$/gm) ?? [];

    expect(USERSCRIPT_CONFIG.connect).toEqual(expectedHosts);
    expect(connectLines).toEqual(expectedHosts.map((host) => `// @connect ${host}`));
    expect(connectLines).not.toContain('// @connect api.twitter.com');
  });

  it('uses the latest release asset for production script downloads', () => {
    const header = generateUserscriptHeader({
      baseConfig: USERSCRIPT_CONFIG,
      isDev: false,
      version: '2.3.0',
    });

    expect(header).toContain(
      '// @downloadURL https://github.com/PiesP/xcom-enhanced-gallery/releases/latest/download/xcom-enhanced-gallery.user.js'
    );
    expect(header).not.toContain('/releases/download/v2.3.0/');
    expect(header).not.toContain('@release/dist');
  });

  it('keeps development downloads separate from the production release asset', () => {
    const header = generateUserscriptHeader({
      baseConfig: USERSCRIPT_CONFIG,
      isDev: true,
      version: '2.3.0',
    });

    expect(header).toContain(
      '// @downloadURL https://github.com/PiesP/xcom-enhanced-gallery/releases/download/v2.3.0/xcom-enhanced-gallery.dev.user.js'
    );
    expect(header).not.toContain(
      '// @downloadURL https://github.com/PiesP/xcom-enhanced-gallery/releases/latest/download/xcom-enhanced-gallery.user.js'
    );
  });

  it('checks updates and downloads through the latest provenance-gated release assets', () => {
    const header = generateMetaOnlyHeader('2.3.0', USERSCRIPT_CONFIG);

    expect(header).toContain(
      '// @updateURL https://github.com/PiesP/xcom-enhanced-gallery/releases/latest/download/xcom-enhanced-gallery.meta.js'
    );
    expect(header).toContain(
      '// @downloadURL https://github.com/PiesP/xcom-enhanced-gallery/releases/latest/download/xcom-enhanced-gallery.user.js'
    );
    expect(header).not.toContain('/releases/download/v2.3.0/');
    expect(header).not.toContain('jsdelivr');
  });
});
