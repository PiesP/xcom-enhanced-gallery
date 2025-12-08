/// <reference lib="deno.ns" />
/**
 * License Aggregator
 *
 * Reads license files from the LICENSES directory and aggregates them
 * for inclusion in the userscript header.
 */

import { type LicenseInfo, parseLicenseName } from './userscript-meta.ts';

/**
 * Read and aggregate all license files from a directory
 */
export async function aggregateLicenses(licensesDir: string): Promise<LicenseInfo[]> {
  const licenses: LicenseInfo[] = [];

  try {
    for await (const entry of Deno.readDir(licensesDir)) {
      if (!entry.isFile) continue;

      // Skip non-license files
      const filename = entry.name;
      if (!filename.endsWith('.txt') && !filename.endsWith('.md')) {
        continue;
      }

      // Skip the main project license (it's already declared in @license)
      if (filename.toLowerCase().includes('xcom-enhanced-gallery')) {
        continue;
      }

      try {
        const filePath = `${licensesDir}/${filename}`;
        const content = await Deno.readTextFile(filePath);
        const name = parseLicenseName(filename);

        licenses.push({
          name,
          text: content.trim(),
        });

        console.log(`📜 Loaded license: ${name}`);
      } catch (error) {
        console.warn(`⚠️ Failed to read license file: ${filename}`, error);
      }
    }
  } catch (error) {
    if (error instanceof Deno.errors.NotFound) {
      console.warn(`⚠️ Licenses directory not found: ${licensesDir}`);
      return [];
    }
    throw error;
  }

  // Sort licenses alphabetically by name
  licenses.sort((a, b) => a.name.localeCompare(b.name));

  console.log(`📚 Aggregated ${licenses.length} third-party licenses\n`);

  return licenses;
}

/**
 * Check if all required licenses are present
 */
export function validateLicenses(
  licenses: LicenseInfo[],
  required: string[],
): { valid: boolean; missing: string[] } {
  const presentNames = new Set(licenses.map((l) => l.name.toLowerCase()));
  const missing = required.filter((name) => !presentNames.has(name.toLowerCase()));

  return {
    valid: missing.length === 0,
    missing,
  };
}
