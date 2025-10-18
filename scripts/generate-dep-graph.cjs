#!/usr/bin/env node
/**
 * Generate dependency graph in multiple formats (JSON/DOT/SVG) with caching and incremental builds.
 *
 * Usage:
 *   node generate-dep-graph.cjs [--format=json|dot|svg|all] [--force]
 *
 * Options:
 *   --format=<type>  Output format: json (fast), dot (medium), svg (full), all (default: all)
 *   --force          Skip cache check and regenerate all outputs
 *
 * Performance:
 *   - JSON only: ~1-2s (dependency-cruiser analysis)
 *   - DOT: +0.5s (text generation)
 *   - SVG: +2-5s (Graphviz rendering, if available)
 *   - Caching: Skips regeneration if src/ unchanged since last run
 */

const { spawnSync } = require('node:child_process');
const {
  existsSync,
  mkdirSync,
  writeFileSync,
  readFileSync,
  statSync,
  readdirSync,
} = require('node:fs');
const { resolve, join } = require('node:path');

const ROOT = resolve(__dirname, '..');
const DOCS_DIR = resolve(ROOT, 'docs');
const JSON_PATH = resolve(DOCS_DIR, 'dependency-graph.json');
const DOT_PATH = resolve(DOCS_DIR, 'dependency-graph.dot');
const SVG_PATH = resolve(DOCS_DIR, 'dependency-graph.svg');
const CACHE_PATH = resolve(DOCS_DIR, '.dep-graph-cache.json');

// Parse CLI arguments
const args = process.argv.slice(2);
const formatArg = args.find(a => a.startsWith('--format='))?.split('=')[1] || 'all';
const forceArg = args.includes('--force');

const FORMATS = {
  json: ['json'],
  dot: ['json', 'dot'],
  svg: ['json', 'dot', 'svg'],
  all: ['json', 'dot', 'svg'],
};

const requestedFormats = FORMATS[formatArg] || FORMATS.all;

function which(cmd) {
  const res = spawnSync(process.platform === 'win32' ? 'where' : 'which', [cmd], {
    stdio: 'ignore',
  });
  return res.status === 0;
}

function getLatestModTime(dir) {
  let latest = 0;
  try {
    const scan = d => {
      const entries = readdirSync(d, { withFileTypes: true });
      for (const entry of entries) {
        const fullPath = join(d, entry.name);
        if (entry.isDirectory() && entry.name !== 'node_modules' && entry.name !== '.git') {
          scan(fullPath);
        } else if (entry.isFile() && /\.(ts|tsx|js|jsx)$/.test(entry.name)) {
          const stat = statSync(fullPath);
          if (stat.mtimeMs > latest) latest = stat.mtimeMs;
        }
      }
    };
    scan(dir);
  } catch {}
  return latest;
}

function needsRegeneration() {
  if (forceArg) return true;
  if (!existsSync(CACHE_PATH)) return true;
  try {
    const cache = JSON.parse(readFileSync(CACHE_PATH, 'utf-8'));
    const srcMod = getLatestModTime(resolve(ROOT, 'src'));
    return srcMod > (cache.srcModTime || 0);
  } catch {
    return true;
  }
}

function updateCache() {
  try {
    const srcMod = getLatestModTime(resolve(ROOT, 'src'));
    writeFileSync(
      CACHE_PATH,
      JSON.stringify({ srcModTime: srcMod, timestamp: Date.now() }),
      'utf-8'
    );
  } catch {}
}

function generateFormat(format) {
  const config = resolve(ROOT, '.dependency-cruiser.cjs');

  // Use npx to ensure proper module resolution
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
  if (res.status !== 0)
    throw new Error(res.stderr || `dependency-cruiser ${format} generation failed`);
  return res.stdout;
}

function main() {
  if (!existsSync(DOCS_DIR)) mkdirSync(DOCS_DIR, { recursive: true });

  const skipCache = !needsRegeneration();
  if (
    skipCache &&
    requestedFormats.every(f =>
      existsSync(f === 'json' ? JSON_PATH : f === 'dot' ? DOT_PATH : SVG_PATH)
    )
  ) {
    console.log('✓ Dependency graph up-to-date (cache hit). Use --force to regenerate.');
    return;
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
      const hasDot = which('dot');
      const hasSfdp = which('sfdp');
      const hasFdp = which('fdp');

      if (!hasDot && !hasSfdp && !hasFdp) {
        const placeholder = `<?xml version="1.0" encoding="UTF-8" standalone="no"?>
<svg xmlns="http://www.w3.org/2000/svg" width="600" height="120">
  <rect width="100%" height="100%" fill="#ffffff"/>
  <text x="20" y="60" font-family="Arial, sans-serif" font-size="16" fill="#333">
    Graphviz (dot/sfdp/fdp) not found. Install Graphviz to generate SVG.
  </text>
</svg>`;
        writeFileSync(SVG_PATH, placeholder, 'utf-8');
        console.log('⚠ Graphviz not found; wrote placeholder SVG.');
      } else {
        // Try engines in order of quality: dot (hierarchical) > fdp (force-directed) > sfdp (scalable)
        const engine = hasDot ? 'dot' : hasFdp ? 'fdp' : 'sfdp';

        // Optimized rendering options for better overview
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

        const svgRes = spawnSync(engine, renderOptions, {
          encoding: 'utf-8',
          maxBuffer: 20 * 1024 * 1024,
        });
        if (svgRes.error) throw svgRes.error;
        if (svgRes.status !== 0) throw new Error(svgRes.stderr || `${engine} rendering failed`);

        // Post-process SVG for better viewing
        let svgContent = svgRes.stdout;

        // Add viewport and responsive attributes
        svgContent = svgContent.replace(
          /<svg /,
          '<svg preserveAspectRatio="xMidYMid meet" class="dependency-graph" '
        );

        writeFileSync(SVG_PATH, svgContent, 'utf-8');
        console.log(`✓ SVG generated with ${engine} (${Math.round(Date.now() - startTime)}ms)`);
      }
    }

    updateCache();
    console.log(`✓ Dependency graph complete (${Math.round(Date.now() - startTime)}ms)`);
  } catch (err) {
    console.warn('[deps:graph] Warning:', err && err.message ? err.message : err);
    try {
      if (requestedFormats.includes('svg') && !existsSync(SVG_PATH)) {
        const placeholder = `<?xml version="1.0" encoding="UTF-8" standalone="no"?>
<svg xmlns="http://www.w3.org/2000/svg" width="600" height="120">
  <rect width="100%" height="100%" fill="#ffffff"/>
  <text x="20" y="60" font-family="Arial, sans-serif" font-size="16" fill="#333">
    Dependency graph rendering failed. See logs.
  </text>
</svg>`;
        writeFileSync(SVG_PATH, placeholder, 'utf-8');
      }
    } catch {}
    process.exit(0); // Graceful degradation
  }
}

main();
