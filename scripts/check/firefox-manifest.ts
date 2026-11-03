// SPDX-License-Identifier: MIT
// Copyright (c) 2024-2026 PiesP

import { readFileSync } from 'node:fs';

const requiredDataTypes = ['authenticationInfo', 'browsingActivity', 'websiteContent'] as const;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/** Keep Firefox's install-time disclosure aligned with its functional X requests. */
export function assertFirefoxConsentManifest(manifest: unknown, artifact: string): void {
  const settings = isRecord(manifest) ? manifest.browser_specific_settings : undefined;
  const gecko = isRecord(settings) ? settings.gecko : undefined;
  if (!isRecord(gecko) || gecko.id !== 'xcom-enhanced-gallery@piesp.dev') {
    throw new Error(`${artifact}: missing Firefox Gecko identity.`);
  }

  const version = gecko.strict_min_version;
  const match = typeof version === 'string' ? /^(\d+)\.(\d+)(?:\.\d+)?$/.exec(version) : null;
  if (!match || Number(match[1]) < 140) {
    throw new Error(`${artifact}: Firefox strict_min_version must be 140.0 or newer.`);
  }

  const consent = gecko.data_collection_permissions;
  if (!isRecord(consent) || Object.keys(consent).length !== 1) {
    throw new Error(
      `${artifact}: Firefox data_collection_permissions must declare required data only.`
    );
  }
  const required = consent.required;
  if (
    !Array.isArray(required) ||
    required.length !== requiredDataTypes.length ||
    !requiredDataTypes.every((type) => required.includes(type))
  ) {
    throw new Error(
      `${artifact}: Firefox data_collection_permissions.required must cover X authentication, browsing, and website data.`
    );
  }

  const android = isRecord(settings) ? settings.gecko_android : undefined;
  const androidVersion = isRecord(android) ? android.strict_min_version : undefined;
  const androidMatch =
    typeof androidVersion === 'string' ? /^(\d+)\.(\d+)(?:\.\d+)?$/.exec(androidVersion) : null;
  if (!androidMatch || Number(androidMatch[1]) < 142) {
    throw new Error(
      `${artifact}: Firefox gecko_android.strict_min_version must be 142.0 or newer.`
    );
  }
}

export function assertFirefoxConsentManifestFile(path: string): void {
  let manifest: unknown;
  try {
    manifest = JSON.parse(readFileSync(path, 'utf8')) as unknown;
  } catch (error: unknown) {
    throw new Error(`${path}: could not read Firefox manifest.`, { cause: error });
  }
  assertFirefoxConsentManifest(manifest, path);
}
