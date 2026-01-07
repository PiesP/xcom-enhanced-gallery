/**
 * @fileoverview Vite plugin for managing license assets
 *
 * Aggregates project and third-party licenses during build:
 * - Copies project LICENSE file to dist
 * - Copies third-party license directory to dist
 * - Generates combined license document
 *
 * Runs in the post-build phase after bundle generation,
 * ensuring all licenses are properly included in the distribution.
 */

import * as fs from 'node:fs';
import * as path from 'node:path';

import type { Plugin } from 'vite';

import { LICENSE_OUTPUT_FILES } from '../constants';
import { aggregateLicenses } from '../license-aggregation';
import { LICENSES_DIR, REPO_ROOT } from '../paths';
import type { LicenseInfo } from '../types';

const DIST_DIR = path.resolve(REPO_ROOT, 'dist');
const PROJECT_LICENSE_PATH = path.resolve(REPO_ROOT, 'LICENSE');

/**
 * Read file contents with null-safe handling.
 *
 * Returns null if the file does not exist, preventing errors
 * when optional license files are missing.
 *
 * @param filePath Absolute path to the file to read
 * @returns File contents (trimmed) or null if file doesn't exist
 */
function readTextIfExists(filePath: string): string | null {
  if (!fs.existsSync(filePath)) return null;
  return fs.readFileSync(filePath, 'utf8').trim();
}

/**
 * Ensure a directory exists, creating it recursively if needed.
 *
 * Safe to call on an existing directory (no-op).
 *
 * @param dirPath Absolute path to the directory to ensure
 */
function ensureDir(dirPath: string): void {
  fs.mkdirSync(dirPath, { recursive: true });
}

/**
 * Copy a file to a destination path if the source exists.
 *
 * Silently skips if the source file does not exist.
 * Overwrites destination if it exists.
 *
 * @param sourcePath Absolute path to the source file
 * @param destPath Absolute path to the destination
 */
function copyFileIfExists(sourcePath: string, destPath: string): void {
  if (!fs.existsSync(sourcePath)) return;
  fs.copyFileSync(sourcePath, destPath);
}

/**
 * Copy a directory to a destination path if the source exists.
 *
 * Silently skips if the source directory does not exist.
 * Removes destination directory first if it already exists.
 *
 * @param sourcePath Absolute path to the source directory
 * @param destPath Absolute path to the destination
 */
function copyDirIfExists(sourcePath: string, destPath: string): void {
  if (!fs.existsSync(sourcePath)) return;
  if (fs.existsSync(destPath)) {
    fs.rmSync(destPath, { recursive: true, force: true });
  }
  fs.cpSync(sourcePath, destPath, { recursive: true });
}

/**
 * Build a combined license document from project and third-party licenses.
 *
 * Format:
 * 1. Project license (if present)
 * 2. Section separator
 * 3. Third-party licenses (each with name, file name, and full text)
 *
 * @param projectLicense Project license text (null if not present)
 * @param licenses Array of third-party license information
 * @returns Formatted license document as a single string
 */
function buildCombinedLicenseText(
  projectLicense: string | null,
  licenses: readonly LicenseInfo[]
): string {
  const lines: string[] = [];

  if (projectLicense) {
    lines.push('X.com Enhanced Gallery License');
    lines.push('==============================');
    lines.push('');
    lines.push(projectLicense);
    lines.push('');
  }

  if (licenses.length > 0) {
    lines.push('Third-Party Licenses');
    lines.push('====================');
    lines.push('');

    for (const license of licenses) {
      const title = `${license.name} (${license.fileName})`;
      lines.push(title);
      lines.push('-'.repeat(title.length));
      lines.push('');
      lines.push(license.text.trim());
      lines.push('');
      lines.push('');
    }
  }

  return `${lines.join('\n').trimEnd()}\n`;
}

/**
 * Create a Vite plugin that manages license assets.
 *
 * During the post-build phase:
 * 1. Ensures dist directory exists
 * 2. Reads project and third-party licenses
 * 3. Copies project LICENSE file to dist
 * 4. Copies third-party license directory to dist
 * 5. Generates a combined license document
 *
 * @returns Vite Plugin with closeBundle hook
 */
export function licenseAssetsPlugin(): Plugin {
  return {
    name: 'license-assets',
    apply: 'build',
    enforce: 'post',

    closeBundle(): void {
      ensureDir(DIST_DIR);

      const projectLicense = readTextIfExists(PROJECT_LICENSE_PATH);
      const licenses = aggregateLicenses(LICENSES_DIR);

      const outputProjectLicense = path.join(DIST_DIR, LICENSE_OUTPUT_FILES.project);
      const outputThirdPartyDir = path.join(DIST_DIR, LICENSE_OUTPUT_FILES.thirdPartyDir);
      const outputCombined = path.join(DIST_DIR, LICENSE_OUTPUT_FILES.combined);

      copyFileIfExists(PROJECT_LICENSE_PATH, outputProjectLicense);
      copyDirIfExists(LICENSES_DIR, outputThirdPartyDir);

      const combinedText = buildCombinedLicenseText(projectLicense, licenses);
      fs.writeFileSync(outputCombined, combinedText, 'utf8');
    },
  };
}
