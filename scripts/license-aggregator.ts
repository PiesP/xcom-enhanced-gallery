/// <reference lib="deno.ns" />
/**
 * License Aggregator
 *
 * Reads license files from the LICENSES directory and aggregates them
 * for inclusion in the userscript header.
 */

import { type LicenseInfo, parseLicenseName } from './userscript-meta.ts';

// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────

const LICENSE_EXTENSIONS = new Set(['.txt', '.md']);
const PROJECT_LICENSE_PATTERN = /xcom-enhanced-gallery/i;

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

interface LicenseFileEntry {
  readonly name: string;
  readonly path: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Check if a file is a valid license file
 */
function isValidLicenseFile(filename: string): boolean {
  const ext = filename.slice(filename.lastIndexOf('.'));
  return (
    LICENSE_EXTENSIONS.has(ext.toLowerCase()) && !PROJECT_LICENSE_PATTERN.test(filename)
  );
}

/**
 * Read a single license file
 */
async function readLicenseFile(entry: LicenseFileEntry): Promise<LicenseInfo | null> {
  try {
    const content = await Deno.readTextFile(entry.path);
    const name = parseLicenseName(entry.name);
    console.log(`📜 Loaded license: ${name}`);
    return { name, text: content.trim() };
  } catch (error) {
    console.warn(`⚠️ Failed to read license file: ${entry.name}`, error);
    return null;
  }
}

/**
 * Collect license file entries from directory
 */
async function collectLicenseEntries(licensesDir: string): Promise<LicenseFileEntry[]> {
  const entries: LicenseFileEntry[] = [];

  for await (const entry of Deno.readDir(licensesDir)) {
    if (!entry.isFile || !isValidLicenseFile(entry.name)) continue;

    entries.push({
      name: entry.name,
      path: `${licensesDir}/${entry.name}`,
    });
  }

  return entries;
}

// ─────────────────────────────────────────────────────────────────────────────
// Public API
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Read and aggregate all license files from a directory (parallel)
 */
export async function aggregateLicenses(licensesDir: string): Promise<LicenseInfo[]> {
  try {
    const entries = await collectLicenseEntries(licensesDir);

    // Read all license files in parallel
    const results = await Promise.all(entries.map(readLicenseFile));

    // Filter out failed reads and sort alphabetically
    const licenses = results
      .filter((license): license is LicenseInfo => license !== null)
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

/**
 * Check if all required licenses are present
 */
export function validateLicenses(
  licenses: readonly LicenseInfo[],
  required: readonly string[],
): { valid: boolean; missing: readonly string[] } {
  const presentNames = new Set(licenses.map((l) => l.name.toLowerCase()));
  const missing = required.filter((name) => !presentNames.has(name.toLowerCase()));

  return {
    valid: missing.length === 0,
    missing,
  };
}
