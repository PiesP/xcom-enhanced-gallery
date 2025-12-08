/// <reference lib="deno.ns" />
/**
 * License Aggregator
 *
 * Reads and aggregates third-party license files for userscript header.
 */

import type { LicenseInfo } from './shared/constants.ts';
import { parseLicenseName } from './userscript-meta.ts';

// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────

const LICENSE_EXTENSIONS = new Set(['.txt', '.md']);
const EXCLUDE_PATTERN = /xcom-enhanced-gallery/i;

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function isValidLicenseFile(filename: string): boolean {
  const ext = filename.slice(filename.lastIndexOf('.'));
  return LICENSE_EXTENSIONS.has(ext.toLowerCase()) && !EXCLUDE_PATTERN.test(filename);
}

async function readLicense(dir: string, filename: string): Promise<LicenseInfo | null> {
  try {
    const content = await Deno.readTextFile(`${dir}/${filename}`);
    const name = parseLicenseName(filename);
    console.log(`📜 Loaded license: ${name}`);
    return { name, text: content.trim() };
  } catch (error) {
    console.warn(`⚠️ Failed to read: ${filename}`, error);
    return null;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Public API
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Read and aggregate all license files from directory
 */
export async function aggregateLicenses(licensesDir: string): Promise<LicenseInfo[]> {
  try {
    const entries: string[] = [];

    for await (const entry of Deno.readDir(licensesDir)) {
      if (entry.isFile && isValidLicenseFile(entry.name)) {
        entries.push(entry.name);
      }
    }

    const results = await Promise.all(
      entries.map((name) => readLicense(licensesDir, name)),
    );

    const licenses = results
      .filter((l): l is LicenseInfo => l !== null)
      .sort((a, b) => a.name.localeCompare(b.name));

    console.log(`📚 Aggregated ${licenses.length} third-party licenses\n`);
    return licenses;
  } catch (error) {
    if (error instanceof Deno.errors.NotFound) {
      console.warn(`⚠️ Licenses directory not found: ${licensesDir}`);
      return [];
    }
    throw error;
  }
}
