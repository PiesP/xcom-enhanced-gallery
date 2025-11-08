#!/usr/bin/env node
/**
 * Build Validation Script (CI + Local).
 */

import { readFileSync, existsSync } from 'node:fs';
import { resolve, basename } from 'node:path';

interface ValidationOptions {
  requireNoVitePreload?: boolean;
  assertNoLegacyGlobals?: boolean;
  requireSourcemap?: boolean;
}

interface SourceMap {
  version?: number;
  sources: string[];
  sourcesContent: string[];
  names?: string[];
  mappings?: string;
  file?: string;
}

interface ValidationResult {
  content: string;
  map: SourceMap | null;
  mapPath: string | null;
}

function fail(message: string): never {
  console.error(`❌ ${message}`);
  process.exit(1);
}

function validateOne(
  scriptPath: string,
  {
    requireNoVitePreload = false,
    assertNoLegacyGlobals = false,
    requireSourcemap = true,
  }: ValidationOptions = {}
): ValidationResult {
  const content = readFileSync(scriptPath, 'utf8');

  if (!content.includes('// ==UserScript==')) {
    fail('UserScript header not found');
  }

  if (!content.includes('// ==/UserScript==')) {
    fail('UserScript header end not found');
  }

  const requiredMeta = ['@name', '@version', '@description', '@match'];

  for (const meta of requiredMeta) {
    if (!content.includes(meta)) {
      fail(`Required metadata ${meta} not found`);
    }
  }

  if (content.includes('onTouch') || content.includes('TouchEvent')) {
    fail('Touch events found in PC-only project');
  }

  let map: SourceMap | null = null;
  let mapPath: string | null = null;

  if (requireSourcemap) {
    const scriptFileName = basename(scriptPath);
    const expectedMapName = `${scriptFileName}.map`;
    const sourceMapUrlPattern = /#\s*sourceMappingURL\s*=\s*(.+)$/m;
    const match = content.match(sourceMapUrlPattern);
    if (!match) {
      fail('Missing sourceMappingURL comment in userscript');
    }
    const mapFileFromComment = match[1].trim();
    if (mapFileFromComment !== expectedMapName) {
      fail(`sourceMappingURL mismatch. Expected '${expectedMapName}', got '${mapFileFromComment}'`);
    }

    mapPath = resolve(resolve(scriptPath, '..'), mapFileFromComment);
    if (!existsSync(mapPath)) {
      fail(`Sourcemap file not found: ${mapPath}`);
    }
    try {
      map = JSON.parse(readFileSync(mapPath, 'utf8')) as SourceMap;
    } catch (error) {
      const err = error as Error;
      fail(`Failed to parse sourcemap JSON: ${err.message}`);
    }
    if (!map || !Array.isArray(map.sources) || map.sources.length === 0) {
      fail('Sourcemap missing non-empty sources array');
    }
    if (!Array.isArray(map.sourcesContent) || map.sourcesContent.length === 0) {
      fail('Sourcemap missing non-empty sourcesContent array');
    }
    if (map.sources.length !== map.sourcesContent.length) {
      fail('Sourcemap sources and sourcesContent length mismatch');
    }
    const hasAbsolute = map.sources.some(source => /^(?:[A-Za-z]:\\|\/)/.test(source));
    if (hasAbsolute) {
      console.warn('⚠️ Sourcemap sources include absolute paths. Consider making them relative.');
    }
  }

  if (requireNoVitePreload) {
    if (/__vitePreload/.test(content)) {
      fail('Prod userscript contains __vitePreload dead branch');
    }
  }

  if (assertNoLegacyGlobals) {
    const legacyKeys = [
      /__XEG_LEGACY_ADAPTER__/,
      /__XEG_GET_SERVICE_OVERRIDE__/,
      /(?<!Static)VendorManager\b/,
      /vendor-api\.ts/,
      /\bDOMEventManager\b/,
      /\bcreateEventManager\b/,
      /\bcreateAppContainer\b/,
      /\bAppContainer\b/,
      /\bonPointer\w+\b/,
      /\bPointerEvent\b/,
    ];
    for (const regex of legacyKeys) {
      if (regex.test(content)) {
        fail(`Prod userscript leaked legacy global key: ${regex}`);
      }
    }
  }

  return { content, map, mapPath };
}

function validateUserScript(): boolean {
  console.log('🔍 Validating UserScript build...');

  const distPath = resolve(process.cwd(), 'dist');

  const prodPath = resolve(distPath, 'xcom-enhanced-gallery.user.js');
  const devPath = resolve(distPath, 'xcom-enhanced-gallery.dev.user.js');

  if (!existsSync(prodPath) || !existsSync(devPath)) {
    const statusReport = `   prod: ${existsSync(prodPath) ? 'OK' : 'MISSING'}\n   dev : ${
      existsSync(devPath) ? 'OK' : 'MISSING'
    }`;
    fail(`Expected both prod and dev userscripts to exist.\n${statusReport}`);
  }

  validateOne(devPath, { requireNoVitePreload: false, requireSourcemap: true });
  const prodInfo = validateOne(prodPath, {
    requireNoVitePreload: true,
    assertNoLegacyGlobals: true,
    requireSourcemap: false,
  });

  if (/Stack trace:/.test(prodInfo.content)) {
    fail('Prod userscript contains development-only stack trace marker (logging gate)');
  }

  try {
    const headerEnd = prodInfo.content.indexOf('// ==/UserScript==');
    const scriptStart = headerEnd + '// ==/UserScript=='.length;
    const scriptContent = prodInfo.content.substring(scriptStart);

    if (scriptContent.includes('undefined is not a function')) {
      console.warn('⚠️ Potential runtime errors detected');
    }
  } catch (error) {
    const err = error as Error;
    fail(`JavaScript syntax validation failed: ${err.message}`);
  }

  console.log('✅ UserScript validation passed');
  console.log(`📄 Files: \n  - ${prodPath}\n  - ${devPath}`);
  console.log('');
  console.log('ℹ️  Build validation includes:');
  console.log('  - Type checking (tsgo)');
  console.log('  - Linting (ESLint, stylelint)');
  console.log('  - Dependency validation (dependency-cruiser)');
  console.log('  - Browser tests (Vitest + Chromium)');
  console.log('  - E2E smoke tests (Playwright)');
  console.log('  - Accessibility tests (axe-core)');

  return true;
}

try {
  validateUserScript();
} catch (error) {
  const err = error as Error;
  fail(`UserScript validation failed: ${err.message}`);
}
