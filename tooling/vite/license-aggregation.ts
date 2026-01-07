/**
 * @fileoverview License file aggregation and parsing utilities.
 *
 * Reads third-party license files from a directory, parses metadata,
 * and provides normalized license information for userscript headers.
 * Supports .txt and .md file formats with automatic name mapping.
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import { LICENSE_NAME_MAP } from './constants';
import type { LicenseInfo } from './types';

/**
 * Parses a license file name to extract the normalized license name.
 *
 * Strips file extensions (.txt, .md) and common license type suffixes
 * (MIT, ISC, LICENSE, APACHE, BSD). Uses LICENSE_NAME_MAP for friendly name mapping.
 *
 * @param filename - License file name (e.g., 'solid-js-MIT.txt')
 * @returns Normalized display name (e.g., 'Solid.js')
 * @internal
 */
function parseLicenseName(filename: string): string {
  const base = filename.replace(/\.(txt|md)$/i, '').replace(/-(MIT|ISC|LICENSE|APACHE|BSD)$/i, '');
  return LICENSE_NAME_MAP[base] ?? base;
}

/**
 * Aggregates all third-party license files from a directory.
 *
 * Reads license files (.txt, .md), extracts normalized names and content,
 * filters out project's own license, and returns sorted license information.
 * On read errors, returns empty array rather than throwing.
 *
 * @param licensesDir - Path to directory containing license files
 * @returns Array of license information sorted alphabetically by name
 * @throws Does not throw; returns empty array on file system errors
 */
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
