import * as fs from 'node:fs';
import * as path from 'node:path';
import type { Plugin } from 'vite';

import { LICENSE_OUTPUT_FILES } from '../constants';
import { aggregateLicenses } from '../license-aggregation';
import { LICENSES_DIR, REPO_ROOT } from '../paths';
import type { LicenseInfo } from '../types';

const DIST_DIR = path.resolve(REPO_ROOT, 'dist');
const PROJECT_LICENSE_PATH = path.resolve(REPO_ROOT, 'LICENSE');

function readTextIfExists(filePath: string): string | null {
  if (!fs.existsSync(filePath)) return null;
  return fs.readFileSync(filePath, 'utf8').trim();
}

function ensureDir(dirPath: string): void {
  fs.mkdirSync(dirPath, { recursive: true });
}

function copyFileIfExists(sourcePath: string, destPath: string): void {
  if (!fs.existsSync(sourcePath)) return;
  fs.copyFileSync(sourcePath, destPath);
}

function copyDirIfExists(sourcePath: string, destPath: string): void {
  if (!fs.existsSync(sourcePath)) return;
  if (fs.existsSync(destPath)) {
    fs.rmSync(destPath, { recursive: true, force: true });
  }
  fs.cpSync(sourcePath, destPath, { recursive: true });
}

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

export function licenseAssetsPlugin(): Plugin {
  return {
    name: 'license-assets',
    apply: 'build',
    enforce: 'post',

    closeBundle() {
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
