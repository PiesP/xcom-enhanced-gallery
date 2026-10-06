// SPDX-License-Identifier: MIT
// Copyright (c) 2024-2026 PiesP

import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, realpathSync, rmSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(import.meta.dirname, '..', '..');
function packageVersion(): string {
  const packageJson = JSON.parse(readFileSync(resolve(root, 'package.json'), 'utf8')) as {
    version?: string;
  };
  if (!packageJson.version) {
    throw new Error('package.json does not define a version.');
  }
  return packageJson.version;
}

const targets = [
  { dir: 'dist-extension', name: 'chrome' },
  { dir: 'dist-extension-firefox', name: 'firefox' },
] as const;

export function packageExtensions(options?: {
  fileName?: (browser: 'chrome' | 'firefox', version: string) => string;
  outputDir?: string;
}): string[] {
  const version = packageVersion();
  const outputDir = options?.outputDir ?? resolve(root, 'dist');
  mkdirSync(outputDir, { recursive: true });
  const archives: string[] = [];

  for (const { dir, name } of targets) {
    const sourceDir = resolve(root, dir);
    if (!existsSync(sourceDir)) {
      throw new Error(`[package:extension] ${dir} does not exist. Run build first.`);
    }

    const fileName = options?.fileName?.(name, version) ?? `extension-${name}-v${version}.zip`;
    const outputFile = resolve(outputDir, fileName);
    rmSync(outputFile, { force: true });
    execFileSync('zip', ['-r', '-q', outputFile, '.'], { cwd: sourceDir, stdio: 'inherit' });
    archives.push(outputFile);
    console.log(`[package:extension] Created ${outputFile}`);
  }

  return archives;
}

function isDirectInvocation(): boolean {
  if (!process.argv[1]) return false;
  try {
    return realpathSync(process.argv[1]) === realpathSync(fileURLToPath(import.meta.url));
  } catch {
    return false;
  }
}

if (isDirectInvocation()) packageExtensions();
