import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  USERSCRIPT_BROWSER_SUPPORT,
  USERSCRIPT_BUILD_TARGETS,
} from '../../../tooling/vite/browser-support.ts';
import { userscriptPreset } from '../../../tooling/vite/presets/userscript.ts';
import { USERSCRIPT_CONFIG } from '../../../tooling/vite/utils/userscript.ts';

const root = resolve(import.meta.dirname, '../../..');

describe('userscript browser support', () => {
  it('uses one compatibility contract for metadata and build targets', () => {
    expect(USERSCRIPT_BROWSER_SUPPORT).toEqual({
      chrome: '123',
      edge: '123',
      firefox: '128',
      safari: '17.5',
    });
    expect(USERSCRIPT_CONFIG.compatible).toBe(USERSCRIPT_BROWSER_SUPPORT);

    const preset = userscriptPreset({
      entryFile: '/tmp/entry.ts',
      outputFileName: 'test.user.js',
      isDev: false,
      cssCompress: true,
      sourceMap: false,
    });

    expect(preset.build?.target).toEqual(USERSCRIPT_BUILD_TARGETS);
  });

  it('documents the same userscript minimum versions', () => {
    const readme = readFileSync(resolve(root, 'README.md'), 'utf8');

    expect(readme).toContain(
      `| Userscript | Chrome/Edge ${USERSCRIPT_BROWSER_SUPPORT.chrome}+, ` +
        `Firefox ${USERSCRIPT_BROWSER_SUPPORT.firefox}+, ` +
        `Safari ${USERSCRIPT_BROWSER_SUPPORT.safari}+ |`
    );
  });
});
