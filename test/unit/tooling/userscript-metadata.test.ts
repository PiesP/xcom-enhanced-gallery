// SPDX-License-Identifier: MIT
// Copyright (c) 2026 PiesP

import { describe, expect, it } from 'vitest';
import { TWITTER_API_CONFIG } from '@shared/core/twitter-api/endpoint';
import {
  generateMetaOnlyHeader,
  generateUserscriptHeader,
  USERSCRIPT_CONFIG,
} from '../../../tooling/vite/utils/userscript.ts';

describe('userscript release metadata provenance', () => {
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

  it('uses an immutable versioned release asset for script downloads', () => {
    const header = generateUserscriptHeader({
      baseConfig: USERSCRIPT_CONFIG,
      isDev: false,
      version: '2.3.0',
    });

    expect(header).toContain(
      '// @downloadURL https://github.com/PiesP/xcom-enhanced-gallery/releases/download/v2.3.0/xcom-enhanced-gallery.user.js'
    );
    expect(header).not.toContain('@release/dist');
  });

  it('checks updates through the latest provenance-gated metadata asset', () => {
    const header = generateMetaOnlyHeader('2.3.0', USERSCRIPT_CONFIG);

    expect(header).toContain(
      '// @updateURL https://github.com/PiesP/xcom-enhanced-gallery/releases/latest/download/xcom-enhanced-gallery.meta.js'
    );
    expect(header).toContain(
      '// @downloadURL https://github.com/PiesP/xcom-enhanced-gallery/releases/download/v2.3.0/xcom-enhanced-gallery.user.js'
    );
    expect(header).not.toContain('jsdelivr');
  });
});
