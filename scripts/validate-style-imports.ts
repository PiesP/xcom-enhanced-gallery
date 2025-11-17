import { promises as fs } from 'node:fs';
import path from 'node:path';
import process from 'node:process';

import { logger } from '@shared/logging';

const PROJECT_ROOT = process.cwd();
const SHARED_STYLES_DIR = path.join(PROJECT_ROOT, 'src', 'shared', 'styles');
const GLOBAL_STYLES_ENTRY = path.join(PROJECT_ROOT, 'src', 'styles', 'globals.ts');

async function collectCssFiles(directory: string): Promise<string[]> {
  const entries = await fs.readdir(directory, { withFileTypes: true });
  const files = await Promise.all(
    entries.map(async entry => {
      const entryPath = path.join(directory, entry.name);
      if (entry.isDirectory()) {
        return collectCssFiles(entryPath);
      }

      if (entry.isFile() && entry.name.endsWith('.css')) {
        return [entryPath];
      }

      return [];
    })
  );

  return files.flat();
}

async function parseGlobalsImports(filePath: string): Promise<Set<string>> {
  const content = await fs.readFile(filePath, 'utf8');
  const importRegex = /import\s+['"]([^'"]+\.css)['"];?/g;
  const imports = new Set<string>();

  let match: RegExpExecArray | null;
  while ((match = importRegex.exec(content)) !== null) {
    imports.add(match[1]);
  }

  return imports;
}

function toAlias(absolutePath: string): string {
  const sharedRoot = path.join(PROJECT_ROOT, 'src', 'shared');
  const relative = path.relative(sharedRoot, absolutePath).replace(/\\/g, '/');
  return `@shared/${relative}`;
}

async function main(): Promise<void> {
  const [cssFiles, globalsImports] = await Promise.all([
    collectCssFiles(SHARED_STYLES_DIR),
    parseGlobalsImports(GLOBAL_STYLES_ENTRY),
  ]);

  const expectedAliases = cssFiles.map(toAlias).sort();

  const missing = expectedAliases.filter(alias => !globalsImports.has(alias));
  const stale = [...globalsImports]
    .filter(alias => alias.startsWith('@shared/styles/'))
    .filter(alias => !expectedAliases.includes(alias));

  if (missing.length > 0 || stale.length > 0) {
    if (missing.length > 0) {
      logger.error('[styles:guard] Missing imports in src/styles/globals.ts', missing);
    }

    if (stale.length > 0) {
      logger.error('[styles:guard] Stale imports referencing non-existent files', stale);
    }

    process.exitCode = 1;
    return;
  }

  logger.info('[styles:guard] Global style imports are up to date.');
}

main().catch(error => {
  logger.error('[styles:guard] Validation failed with error', error);
  process.exitCode = 1;
});
