// SPDX-License-Identifier: MIT
// Copyright (c) 2024-2026 PiesP

import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vite-plus/test';
import { assertFirefoxConsentManifest } from '../../../scripts/check/firefox-manifest.ts';

interface FirefoxManifest {
  readonly background?: Record<string, unknown>;
  readonly permissions?: readonly string[];
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

  it('requests only the permissions used by the extension runtime', () => {
    const manifest = JSON.parse(
      readFileSync(resolve(process.cwd(), 'extension/manifest.firefox.json'), 'utf8')
    ) as FirefoxManifest;

    expect(manifest.permissions).toEqual(['downloads', 'storage', 'notifications']);
  });

  it('declares the X request data and a Firefox version with built-in consent', () => {
    const manifest = JSON.parse(
      readFileSync(resolve(process.cwd(), 'extension/manifest.firefox.json'), 'utf8')
    ) as unknown;
    expect(() => assertFirefoxConsentManifest(manifest, 'Firefox source')).not.toThrow();
  });

  it.each([
    ['missing disclosure', {}, 'data_collection_permissions'],
    ['malformed disclosure', { data_collection_permissions: 'none' }, 'required data only'],
    ['no-data claim', { data_collection_permissions: { required: ['none'] } }, 'required'],
    [
      'missing browsing data',
      { data_collection_permissions: { required: ['authenticationInfo', 'websiteContent'] } },
      'required',
    ],
    [
      'duplicate data type',
      {
        data_collection_permissions: {
          required: ['authenticationInfo', 'authenticationInfo', 'websiteContent'],
        },
      },
      'required',
    ],
    [
      'optional data',
      {
        data_collection_permissions: {
          required: ['authenticationInfo', 'browsingActivity', 'websiteContent'],
          optional: ['technicalAndInteraction'],
        },
      },
      'required data only',
    ],
  ])('rejects %s', (_name, geckoPatch, detail) => {
    const manifest = {
      browser_specific_settings: {
        gecko: {
          id: 'xcom-enhanced-gallery@piesp.dev',
          strict_min_version: '140.0',
          ...geckoPatch,
        },
        gecko_android: { strict_min_version: '142.0' },
      },
    };
    expect(() => assertFirefoxConsentManifest(manifest, 'Firefox test')).toThrow(detail);
  });

  it('rejects a Firefox floor without built-in consent', () => {
    expect(() =>
      assertFirefoxConsentManifest(
        {
          browser_specific_settings: {
            gecko: {
              id: 'xcom-enhanced-gallery@piesp.dev',
              strict_min_version: '128.0',
              data_collection_permissions: {
                required: ['authenticationInfo', 'browsingActivity', 'websiteContent'],
              },
            },
            gecko_android: { strict_min_version: '142.0' },
          },
        },
        'Firefox test'
      )
    ).toThrow('strict_min_version');
  });

  it.each([
    ['missing', undefined],
    ['old', { strict_min_version: '141.0' }],
    ['malformed', { strict_min_version: '142-beta' }],
  ])('rejects a %s Android consent floor', (_case, geckoAndroid) => {
    const settings = {
      gecko: {
        id: 'xcom-enhanced-gallery@piesp.dev',
        strict_min_version: '140.0',
        data_collection_permissions: {
          required: ['authenticationInfo', 'browsingActivity', 'websiteContent'],
        },
      },
      ...(geckoAndroid === undefined ? {} : { gecko_android: geckoAndroid }),
    };
    expect(() =>
      assertFirefoxConsentManifest({ browser_specific_settings: settings }, 'Firefox test')
    ).toThrow('gecko_android.strict_min_version');
  });
});
