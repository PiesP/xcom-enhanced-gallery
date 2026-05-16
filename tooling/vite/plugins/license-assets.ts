/**
 * @fileoverview Vite plugin for managing license assets
 *
 * Aggregates project and third-party licenses during build:
 * - Copies project LICENSE file to dist
 * - Copies third-party license directory to dist
 * - Generates combined license document
 *
 * Runs in the post-build phase after bundle generation.
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
 * Build a combined license document from project and third-party licenses.
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
 */
export function licenseAssetsPlugin(): Plugin {
  return {
    name: 'license-assets',
    apply: 'build',
    enforce: 'post',

    closeBundle(): void {
      fs.mkdirSync(DIST_DIR, { recursive: true });

      const projectLicense = fs.existsSync(PROJECT_LICENSE_PATH)
        ? fs.readFileSync(PROJECT_LICENSE_PATH, 'utf8').trim()
        : null;
      const licenses = aggregateLicenses(LICENSES_DIR);

      // Copy project LICENSE
      if (fs.existsSync(PROJECT_LICENSE_PATH)) {
        fs.copyFileSync(PROJECT_LICENSE_PATH, path.join(DIST_DIR, LICENSE_OUTPUT_FILES.project));
      }

      // Copy third-party licenses directory
      if (fs.existsSync(LICENSES_DIR)) {
        const dest = path.join(DIST_DIR, LICENSE_OUTPUT_FILES.thirdPartyDir);
        if (fs.existsSync(dest)) fs.rmSync(dest, { recursive: true, force: true });
        fs.cpSync(LICENSES_DIR, dest, { recursive: true });
      }

      // Write combined license file
      const combinedText = buildCombinedLicenseText(projectLicense, licenses);
      fs.writeFileSync(path.join(DIST_DIR, LICENSE_OUTPUT_FILES.combined), combinedText, 'utf8');
    },
  };
}
