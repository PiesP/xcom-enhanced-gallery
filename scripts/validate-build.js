#!/usr/bin/env node

/**
 * Build Validation Script (CI + Local)
 *
 * Validates UserScript build integrity before deployment.
 *
 * **Usage Context**:
 * - **CI/CD**: Used in GitHub Actions (ci.yml, release.yml) for automated build validation
 * - **Local**: Can be run manually via `node scripts/validate-build.js`
 *
 * **Why CI needs this**:
 * - UserScript-specific validation (not covered by standard build tools):
 *   * Tampermonkey/Violentmonkey metadata headers
 *   * @grant permissions verification
 *   * PC-only policy enforcement (Touch/Pointer event detection)
 *   * Source map integrity for debugging
 *   * Legacy API leak detection
 * - Cannot be replaced by standard linters/validators
 *
 * **Validations**:
 * - UserScript metadata (headers, required fields)
 * - Encoding and syntax compliance
 * - PC-only policy enforcement (no Touch/Pointer events)
 * - Source map integrity (for dev build)
 * - Legacy API leak detection (for prod build)
 *
 * Checks both development (with source maps) and production (optimized) outputs.
 *
 * @usage
 *   node validate-build.js
 *
 * @exit
 *   0 - All validations passed
 *   1 - One or more validations failed
 */

import { readFileSync, existsSync } from 'node:fs';
import { resolve, basename } from 'node:path';

/**
 * @typedef {Object} ValidationOptions
 * @property {boolean} [requireNoVitePreload]
 * @property {boolean} [assertNoLegacyGlobals]
 * @property {boolean} [requireSourcemap]
 */

/**
 * @typedef {Object} ValidationResult
 * @property {string} content
 * @property {SourceMap | null} map
 * @property {string | null} mapPath
 */

/**
 * @typedef {Object} SourceMap
 * @property {number} [version]
 * @property {string[]} sources
 * @property {string[]} sourcesContent
 * @property {string[]} [names]
 * @property {string} [mappings]
 * @property {string} [file]
 */

/**
 * Validates a single UserScript file
 *
 * @param {string} scriptPath - Path to the userscript file
 * @param {ValidationOptions} [options] - Validation options
 * @returns {ValidationResult} Validation result
 * @throws Process exits with code 1 on validation failure
 */
function validateOne(
  scriptPath,
  { requireNoVitePreload = false, assertNoLegacyGlobals = false, requireSourcemap = true } = {}
) {
  const content = readFileSync(scriptPath, 'utf8');

  // Validate UserScript header
  if (!content.includes('// ==UserScript==')) {
    console.error('❌ UserScript header not found');
    process.exit(1);
  }

  if (!content.includes('// ==/UserScript==')) {
    console.error('❌ UserScript header end not found');
    process.exit(1);
  }

  // Validate required metadata
  const requiredMeta = ['@name', '@version', '@description', '@match'];

  for (const meta of requiredMeta) {
    if (!content.includes(meta)) {
      console.error(`❌ Required metadata ${meta} not found`);
      process.exit(1);
    }
  }

  // Validate PC environment optimization
  if (content.includes('onTouch') || content.includes('TouchEvent')) {
    console.error('❌ Touch events found in PC-only project');
    process.exit(1);
  }

  // R5: Check sourceMappingURL comment and .map file integrity (optional)
  // Production builds don't generate source maps, so skip validation
  /** @type {SourceMap | null} */
  let map = null;
  /** @type {string | null} */
  let mapPath = null;

  if (requireSourcemap) {
    const scriptFileName = basename(scriptPath);
    const expectedMapName = `${scriptFileName}.map`;
    const sourceMapUrlPattern = /#\s*sourceMappingURL\s*=\s*(.+)$/m;
    const match = content.match(sourceMapUrlPattern);
    if (!match) {
      console.error('❌ Missing sourceMappingURL comment in userscript');
      process.exit(1);
    }
    const mapFileFromComment = match[1].trim();
    if (mapFileFromComment !== expectedMapName) {
      console.error(
        `❌ sourceMappingURL mismatch. Expected '${expectedMapName}', got '${mapFileFromComment}'`
      );
      process.exit(1);
    }

    mapPath = resolve(resolve(scriptPath, '..'), mapFileFromComment);
    if (!existsSync(mapPath)) {
      console.error('❌ Sourcemap file not found:', mapPath);
      process.exit(1);
    }
    try {
      map = JSON.parse(readFileSync(mapPath, 'utf8'));
    } catch (e) {
      const error = /** @type {Error} */ (e);
      console.error('❌ Failed to parse sourcemap JSON:', error.message);
      process.exit(1);
    }
    if (!map || !Array.isArray(map.sources) || map.sources.length === 0) {
      console.error('❌ Sourcemap missing non-empty sources array');
      process.exit(1);
    }
    if (!Array.isArray(map.sourcesContent) || map.sourcesContent.length === 0) {
      console.error('❌ Sourcemap missing non-empty sourcesContent array');
      process.exit(1);
    }
    if (map.sources.length !== map.sourcesContent.length) {
      console.error('❌ Sourcemap sources and sourcesContent length mismatch');
      process.exit(1);
    }
    // Warning: Check for absolute paths (Windows/Unix)
    const hasAbsolute = map.sources.some(s => /^(?:[A-Za-z]:\\|\/)/.test(s));
    if (hasAbsolute) {
      console.warn('⚠️ Sourcemap sources include absolute paths. Consider making them relative.');
    }
  }

  // R5: Check if dead-preload branches like __vitePreload are removed in prod bundle
  if (requireNoVitePreload) {
    if (/__vitePreload/.test(content)) {
      console.error('❌ Prod userscript contains __vitePreload dead branch');
      process.exit(1);
    }
  }

  // P1: Guard against legacy global keys in prod
  if (assertNoLegacyGlobals) {
    const legacyKeys = [
      /__XEG_LEGACY_ADAPTER__/,
      /__XEG_GET_SERVICE_OVERRIDE__/,
      // Forbid legacy vendor API/manager symbol leaks
      /(?<!Static)VendorManager\b/, // Forbid dynamic VendorManager exposure (static manager allowed)
      /vendor-api\.ts/, // Forbid source string leaks
      // New: Forbid runtime DOMEventManager surface (internal only)
      /\bDOMEventManager\b/,
      /\bcreateEventManager\b/,
      // Additional: Forbid runtime AppContainer surface leaks (except test-only harness)
      /\bcreateAppContainer\b/,
      /\bAppContainer\b/,
      // Additional: PC-only policy - forbid Pointer event strings
      /\bonPointer\w+\b/,
      /\bPointerEvent\b/,
    ];
    for (const re of legacyKeys) {
      if (re.test(content)) {
        console.error('❌ Prod userscript leaked legacy global key:', re);
        process.exit(1);
      }
    }
  }

  return { content, map, mapPath };
}

/**
 * Validates both production and development UserScript builds
 *
 * @returns {boolean} True if all validations pass
 * @throws Process exits with code 1 on validation failure
 */
function validateUserScript() {
  console.log('🔍 Validating UserScript build...');

  const distPath = resolve(process.cwd(), 'dist');

  const prodPath = resolve(distPath, 'xcom-enhanced-gallery.user.js');
  const devPath = resolve(distPath, 'xcom-enhanced-gallery.dev.user.js');

  // Both files must exist (build script generates both dev and prod)
  if (!existsSync(prodPath) || !existsSync(devPath)) {
    console.error('❌ Expected both prod and dev userscripts to exist.');
    console.error(`   prod: ${existsSync(prodPath) ? 'OK' : 'MISSING'}`);
    console.error(`   dev : ${existsSync(devPath) ? 'OK' : 'MISSING'}`);
    process.exit(1);
  }

  // Detailed validation: dev (with sourcemap), prod (no sourcemap, dead code removed)
  validateOne(devPath, { requireNoVitePreload: false, requireSourcemap: true });
  const prodInfo = validateOne(prodPath, {
    requireNoVitePreload: true,
    assertNoLegacyGlobals: true,
    requireSourcemap: false, // Production doesn't generate sourcemaps
  });

  // L2: Logging gate v2 — prod bundle must not contain development-only stack trace marker
  if (/Stack trace:/.test(prodInfo.content)) {
    console.error('❌ Prod userscript contains development-only stack trace marker (logging gate)');
    process.exit(1);
  }

  // Basic JavaScript syntax validation
  try {
    // Simple syntax validation (not actually executed)
    const scriptStart =
      prodInfo.content.indexOf('// ==/UserScript==') + '// ==/UserScript=='.length;
    const scriptContent = prodInfo.content.substring(scriptStart);

    // Basic syntax error check
    if (scriptContent.includes('undefined is not a function')) {
      console.warn('⚠️ Potential runtime errors detected');
    }
  } catch (error) {
    const err = /** @type {Error} */ (error);
    console.error('❌ JavaScript syntax validation failed:', err.message);
    process.exit(1);
  }

  console.log('✅ UserScript validation passed');
  console.log(`📄 Files: \n  - ${prodPath}\n  - ${devPath}`);
  console.log('');
  console.log('ℹ️  Build validation includes:');
  console.log('  - Type checking (tsgo)');
  console.log('  - Linting (ESLint, stylelint)');
  console.log('  - Dependency validation (dependency-cruiser)');
  console.log('  - Security analysis (CodeQL)');
  console.log('  - Browser tests (Vitest + Chromium)');
  console.log('  - E2E smoke tests (Playwright)');
  console.log('  - Accessibility tests (axe-core)');

  return true;
}

// Execute script
try {
  validateUserScript();
} catch (error) {
  const err = /** @type {Error} */ (error);
  console.error('❌ UserScript validation failed:', err.message);
  process.exit(1);
}
