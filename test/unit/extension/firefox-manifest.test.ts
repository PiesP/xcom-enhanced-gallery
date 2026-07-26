// SPDX-License-Identifier: MIT
// Copyright (c) 2024-2026 PiesP

import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

interface FirefoxManifest {
  readonly background?: Record<string, unknown>;
}

describe('Firefox extension manifest', () => {
  it('registers the ES module background entry with Firefox MV3 scripts', () => {
    const manifest = JSON.parse(
      readFileSync(resolve(process.cwd(), 'extension/manifest.firefox.json'), 'utf8')
    ) as FirefoxManifest;

    expect(manifest.background).toEqual({
      scripts: ['background.js'],
      type: 'module',
    });
    expect(manifest.background).not.toHaveProperty('service_worker');
  });
});
