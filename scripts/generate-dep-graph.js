#!/usr/bin/env node

/**
 * Dependency Graph Generator (Local Environment Only)
 *
 * @description
 * Local-only script for generating visual dependency graphs.
 * Creates JSON/DOT/SVG outputs with intelligent caching for developer reference.
 *
 * **Usage Context:**
 * - Local Development: Visualize module dependencies during refactoring
 * - Documentation: Generate up-to-date architecture diagrams
 * - Analysis: Review dependency violations before commit
 *
 * **Why not in CI:**
 * - CI uses lightweight `npx depcruise src --validate` for validation only
 * - Graph generation (SVG) requires Graphviz (extra dependency)
 * - Visual outputs are for developer reference, not CI artifacts
 * - CI focuses on pass/fail validation, not visualization
 *
 * **Features:**
 * - Multiple output formats (JSON/DOT/SVG)
 * - Intelligent caching (skips unchanged src/)
 * - Interactive viewer (docs/dependency-graph-viewer.html)
 * - Dependency violation detection
 *
 * @usage
 *   node generate-dep-graph.js [--format=json|dot|svg|all] [--force] [--verbose]
 *   npm run deps:json     # Fast validation (JSON only)
 *   npm run deps:graph    # Full visualization (JSON + DOT + SVG)
 *
 * @options
 *   --format=<type>  Output format: json (fast), dot (medium), svg (complete)
 *                    Default: all
 *   --force          Regenerate all outputs, bypass cache
 *   --verbose        Show detailed timing and debug info
 *
 * @performance
 *   - JSON only: ~1-2s (dependency-cruiser analysis)
 *   - + DOT: ~0.5s additional (text generation)
 *   - + SVG: ~2-5s additional (Graphviz rendering, if available)
 *   - Cache hit: ~0.1s (no regeneration needed)
 *
 * @caching
 *   - Automatically skips regeneration if src/ directory unchanged
 *   - Force via CODEQL_FORCE_REBUILD env var or --force flag
 *   - Cache metadata stored in docs/.dep-graph-cache.json
 *
 * @see
 *   docs/DEPENDENCY-GOVERNANCE.md - Dependency rules and policies
 *   docs/dependency-graph-viewer.html - Interactive browser viewer
 */

import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, writeFileSync, readFileSync, statSync, readdirSync } from 'node:fs';
import { resolve, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = join(fileURLToPath(import.meta.url), '..');
const ROOT = resolve(__dirname, '..');
const DOCS_DIR = resolve(ROOT, 'docs');
const JSON_PATH = resolve(DOCS_DIR, 'dependency-graph.json');
const DOT_PATH = resolve(DOCS_DIR, 'dependency-graph.dot');
const SVG_PATH = resolve(DOCS_DIR, 'dependency-graph.svg');
const CACHE_PATH = resolve(DOCS_DIR, '.dep-graph-cache.json');

// Parse CLI arguments
const args = process.argv.slice(2);
const formatArg = args.find(a => a.startsWith('--format='))?.split('=')[1] || 'all';
const forceArg = args.includes('--force') || process.env.CODEQL_FORCE_REBUILD === 'true';
const verboseArg = args.includes('--verbose');

const FORMATS = {
  json: ['json'],
  dot: ['json', 'dot'],
  svg: ['json', 'dot', 'svg'],
  all: ['json', 'dot', 'svg'],
};

const requestedFormats = FORMATS[formatArg] || FORMATS.all;

/**
 * Checks if a command exists in PATH
 *
 * @param {string} cmd - Command name to check
 * @returns {boolean} True if command is available
 */
function commandExists(cmd) {
  const res = spawnSync(process.platform === 'win32' ? 'where' : 'which', [cmd], {
    stdio: 'ignore',
  });
  return res.status === 0;
}

/**
 * Gets latest modification time for all source files in a directory (recursive)
 *
 * @param {string} dir - Directory to scan
 * @returns {number} Latest modification time in milliseconds
 */
function getLatestModificationTime(dir) {
  let latest = 0;
  try {
    const scan = d => {
      const entries = readdirSync(d, { withFileTypes: true });
      for (const entry of entries) {
        const fullPath = join(d, entry.name);
        // Skip node_modules and .git (no analysis needed)
        if (entry.isDirectory() && !['node_modules', '.git'].includes(entry.name)) {
          scan(fullPath);
        } else if (entry.isFile() && /\.(ts|tsx|js|jsx)$/.test(entry.name)) {
          const stat = statSync(fullPath);
          if (stat.mtimeMs > latest) latest = stat.mtimeMs;
        }
      }
    };
    scan(dir);
  } catch {
    // Silently handle permission errors
  }
  return latest;
}

/**
 * Checks if cached output is still valid
 *
 * @returns {boolean} True if regeneration needed
 */
function needsRegeneration() {
  // Force flag overrides cache
  if (forceArg) {
    if (verboseArg) console.log('[verbose] Force flag set, bypassing cache');
    return true;
  }

  // No cache file means regeneration needed
  if (!existsSync(CACHE_PATH)) {
    if (verboseArg) console.log('[verbose] Cache file not found, regenerating');
    return true;
  }

  try {
    const cache = JSON.parse(readFileSync(CACHE_PATH, 'utf-8'));
    const srcMod = getLatestModificationTime(resolve(ROOT, 'src'));

    // If src/ newer than cache, regenerate
    if (srcMod > (cache.srcModTime || 0)) {
      if (verboseArg)
        console.log(`[verbose] src/ modified (${srcMod} > ${cache.srcModTime}), regenerating`);
      return true;
    }

    if (verboseArg) console.log('[verbose] Cache valid, skipping regeneration');
    return false;
  } catch {
    if (verboseArg) console.log('[verbose] Cache parse error, regenerating');
    return true;
  }
}

/**
 * Updates cache metadata with current src/ modification time
 *
 * @returns {void}
 */
function updateCache() {
  try {
    const srcMod = getLatestModificationTime(resolve(ROOT, 'src'));
    writeFileSync(
      CACHE_PATH,
      JSON.stringify(
        {
          srcModTime: srcMod,
          timestamp: Date.now(),
          generator: 'generate-dep-graph.js v1.0',
        },
        null,
        2
      ),
      'utf-8'
    );
  } catch {
    // Silently ignore cache update failures
  }
}

/**
 * Generates specific output format using dependency-cruiser
 *
 * @param {string} format - Format to generate (json, dot, svg, etc.)
 * @returns {string} Generated output
 * @throws {Error} If generation fails
 */
function generateFormat(format) {
  const config = resolve(ROOT, '.dependency-cruiser.cjs');

  const res = spawnSync(
    'npx',
    ['dependency-cruiser', '--config', config, '--output-type', format, 'src'],
    {
      encoding: 'utf-8',
      maxBuffer: 20 * 1024 * 1024,
      cwd: ROOT,
      shell: true,
    }
  );

  if (res.error) throw res.error;
  if (res.status !== 0) {
    throw new Error(res.stderr || `dependency-cruiser ${format} generation failed`);
  }
  return res.stdout;
}

/**
 * Renders SVG from DOT using available Graphviz engine
 *
 * @param {number} startTime - Start time for timing calculation
 * @returns {string} SVG content
 */
function renderSVG(startTime) {
  const engines = ['dot', 'fdp', 'sfdp'];
  const availableEngine = engines.find(e => commandExists(e));

  if (!availableEngine) {
    if (verboseArg) console.log('[verbose] No Graphviz engine found, generating placeholder SVG');
    return `<?xml version="1.0" encoding="UTF-8" standalone="no"?>
<svg xmlns="http://www.w3.org/2000/svg" width="600" height="120">
  <rect width="100%" height="100%" fill="#ffffff"/>
  <text x="20" y="60" font-family="Arial, sans-serif" font-size="14" fill="#666">
    Graphviz not found. Install graphviz to generate SVG.
  </text>
</svg>`;
  }

  if (verboseArg) console.log(`[verbose] Using ${availableEngine} engine for SVG rendering`);

  const renderOptions = [
    '-T',
    'svg',
    '-Gdpi=96', // Standard screen DPI
    '-Gsize=16,12!', // Max size in inches (forces aspect ratio)
    '-Gratio=fill', // Fill the size
    '-Goverlap=prism', // Better overlap removal
    '-Gsplines=ortho', // Orthogonal edges for clarity
    DOT_PATH,
  ];

  const svgRes = spawnSync(availableEngine, renderOptions, {
    encoding: 'utf-8',
    maxBuffer: 20 * 1024 * 1024,
  });

  if (svgRes.error) throw svgRes.error;
  if (svgRes.status !== 0) {
    throw new Error(svgRes.stderr || `${availableEngine} rendering failed`);
  }

  // Post-process SVG: add responsive attributes
  let svgContent = svgRes.stdout;
  svgContent = svgContent.replace(
    /<svg /,
    '<svg preserveAspectRatio="xMidYMid meet" class="dependency-graph" '
  );

  if (verboseArg)
    console.log(
      `[verbose] SVG rendered with ${availableEngine} (${Math.round(Date.now() - startTime)}ms)`
    );
  return svgContent;
}

/**
 * Main execution function
 *
 * @returns {void}
 */
function main() {
  // Ensure output directory exists
  if (!existsSync(DOCS_DIR)) {
    mkdirSync(DOCS_DIR, { recursive: true });
  }

  // Check cache validity
  if (!needsRegeneration()) {
    // Verify all requested outputs exist
    if (
      requestedFormats.every(f =>
        existsSync(f === 'json' ? JSON_PATH : f === 'dot' ? DOT_PATH : SVG_PATH)
      )
    ) {
      console.log('✓ Dependency graph up-to-date (cache hit). Use --force to regenerate.');
      return;
    }
  }

  console.log(`Generating dependency graph (${formatArg})...`);
  const startTime = Date.now();

  try {
    // Stage 1: JSON (always needed as base, ~1-2s)
    if (requestedFormats.includes('json')) {
      const jsonOut = generateFormat('json');
      writeFileSync(JSON_PATH, jsonOut, 'utf-8');
      console.log(`✓ JSON generated (${Math.round(Date.now() - startTime)}ms)`);
    }

    // Stage 2: DOT (~0.5s)
    if (requestedFormats.includes('dot')) {
      const dotOut = generateFormat('dot');
      writeFileSync(DOT_PATH, dotOut, 'utf-8');
      console.log(`✓ DOT generated (${Math.round(Date.now() - startTime)}ms)`);
    }

    // Stage 3: SVG (~2-5s, requires Graphviz)
    if (requestedFormats.includes('svg')) {
      const svgContent = renderSVG(startTime);
      writeFileSync(SVG_PATH, svgContent, 'utf-8');
      console.log(`✓ SVG generated (${Math.round(Date.now() - startTime)}ms)`);
    }

    // Update cache for future runs
    updateCache();
    console.log(`✓ Complete (${Math.round(Date.now() - startTime)}ms)`);
  } catch (err) {
    console.warn('[error]', err?.message || err);

    // Graceful degradation: write placeholder SVG if rendering failed
    try {
      if (requestedFormats.includes('svg')) {
        // TOCTOU 방지: existsSync 체크 없이 직접 writeFileSync 시도
        // 파일이 이미 존재하면 덮어쓰고, 없으면 생성
        const placeholder = `<?xml version="1.0" encoding="UTF-8" standalone="no"?>
<svg xmlns="http://www.w3.org/2000/svg" width="600" height="120">
  <rect width="100%" height="100%" fill="#ffffff"/>
  <text x="20" y="60" font-family="Arial, sans-serif" font-size="14" fill="#666">
    Dependency graph rendering failed. See console output for details.
  </text>
</svg>`;
        writeFileSync(SVG_PATH, placeholder, 'utf-8');
      }
    } catch {
      // Ignore write errors
    }
    process.exit(0); // Graceful degradation - allow build to continue
  }
}

main();
