import * as fs from 'node:fs';
import * as path from 'node:path';

import { LICENSE_NAME_MAP } from './constants';
import type { LicenseInfo } from './types';

function parseLicenseName(filename: string): string {
  const base = filename.replace(/\.(txt|md)$/i, '').replace(/-(MIT|ISC|LICENSE|APACHE|BSD)$/i, '');
  return LICENSE_NAME_MAP[base] ?? base;
}

export function aggregateLicenses(licensesDir: string): LicenseInfo[] {
  try {
    const entries = fs.readdirSync(licensesDir);
    const validExtensions = new Set(['.txt', '.md']);
    // Exclude licenses that are not shipped/used by the current bundle.
    // (Keep them in the repository for historical context if needed.)
    const excludePattern = /xcom-enhanced-gallery/i;

    return entries
      .filter((entry) => {
        const ext = path.extname(entry).toLowerCase();
        return (
          validExtensions.has(ext) &&
          !excludePattern.test(entry) &&
          fs.statSync(path.join(licensesDir, entry)).isFile()
        );
      })
      .map((filename) => {
        const content = fs.readFileSync(path.join(licensesDir, filename), 'utf8');
        return { fileName: filename, name: parseLicenseName(filename), text: content.trim() };
      })
      .sort((a, b) => a.name.localeCompare(b.name));
  } catch {
    return [];
  }
}
