#!/usr/bin/env node
/**
 * Dependency Graph Generator (Local Environment Only).
 */

import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, writeFileSync, readFileSync, statSync, readdirSync } from 'node:fs';
import { resolve, join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT = resolve(__dirname, '..');
const DOCS_DIR = resolve(ROOT, 'docs');
const JSON_PATH = resolve(DOCS_DIR, 'dependency-graph.json');
const DOT_PATH = resolve(DOCS_DIR, 'dependency-graph.dot');
const SVG_PATH = resolve(DOCS_DIR, 'dependency-graph.svg');
const CACHE_PATH = resolve(DOCS_DIR, '.dep-graph-cache.json');

const args = process.argv.slice(2);
const formatInput = args.find(arg => arg.startsWith('--format='))?.split('=')[1] ?? 'all';
const forceArg = args.includes('--force') || process.env.CODEQL_FORCE_REBUILD === 'true';
const verboseArg = args.includes('--verbose');

const formatOptions = ['json', 'dot', 'svg', 'all'] as const;
type FormatSelection = (typeof formatOptions)[number];
type OutputFormat = 'json' | 'dot' | 'svg';

const formatArg: FormatSelection = formatOptions.includes(formatInput as FormatSelection)
  ? (formatInput as FormatSelection)
  : 'all';

const FORMATS: Record<FormatSelection, OutputFormat[]> = {
  json: ['json'],
  dot: ['json', 'dot'],
  svg: ['json', 'dot', 'svg'],
  all: ['json', 'dot', 'svg'],
};

const requestedFormats = FORMATS[formatArg];

function elapsedMs(startTime: number): number {
  return Math.round(Date.now() - startTime);
}

function commandExists(cmd: string): boolean {
  const command = process.platform === 'win32' ? 'where' : 'which';
  const res = spawnSync(command, [cmd], { stdio: 'ignore' });
  return res.status === 0;
}

function getLatestModificationTime(dir: string): number {
  let latest = 0;
  try {
    const entries = readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = join(dir, entry.name);
      if (entry.isDirectory() && !['node_modules', '.git'].includes(entry.name)) {
        latest = Math.max(latest, getLatestModificationTime(fullPath));
      } else if (entry.isFile() && /\.(ts|tsx|js|jsx)$/.test(entry.name)) {
        const stat = statSync(fullPath);
        latest = Math.max(latest, stat.mtimeMs);
      }
    }
  } catch {
    // Ignore permission issues
  }
  return latest;
}

function needsRegeneration(): boolean {
  if (forceArg) {
    if (verboseArg) console.log('[verbose] Force flag set, bypassing cache');
    return true;
  }

  if (!existsSync(CACHE_PATH)) {
    if (verboseArg) console.log('[verbose] Cache file not found, regenerating');
    return true;
  }

  try {
    const cache = JSON.parse(readFileSync(CACHE_PATH, 'utf-8')) as {
      srcModTime?: number;
    };
    const srcMod = getLatestModificationTime(resolve(ROOT, 'src'));
    if (srcMod > (cache.srcModTime ?? 0)) {
      if (verboseArg)
        console.log(`[verbose] src/ modified (${srcMod} > ${cache.srcModTime ?? 0}), regenerating`);
      return true;
    }
    if (verboseArg) console.log('[verbose] Cache valid, skipping regeneration');
    return false;
  } catch {
    if (verboseArg) console.log('[verbose] Cache parse error, regenerating');
    return true;
  }
}

function updateCache(): void {
  try {
    const srcMod = getLatestModificationTime(resolve(ROOT, 'src'));
    const payload = {
      srcModTime: srcMod,
      timestamp: Date.now(),
      generator: 'generate-dep-graph.ts v1.0',
    };
    writeFileSync(CACHE_PATH, JSON.stringify(payload, null, 2), 'utf-8');
  } catch {
    // Ignore cache write failures
  }
}

function generateFormat(format: OutputFormat): string {
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
  return res.stdout ?? '';
}

function renderSVG(startTime: number): string {
  const engines = ['dot', 'fdp', 'sfdp'] as const;
  const availableEngine = engines.find(engine => commandExists(engine));

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
    '-Gdpi=96',
    '-Gsize=16,12!',
    '-Gratio=fill',
    '-Goverlap=prism',
    '-Gsplines=ortho',
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

  let svgContent = svgRes.stdout ?? '';
  svgContent = svgContent.replace(
    /<svg /,
    '<svg preserveAspectRatio="xMidYMid meet" class="dependency-graph" '
  );

  if (verboseArg)
    console.log(`[verbose] SVG rendered with ${availableEngine} (${elapsedMs(startTime)}ms)`);
  return svgContent;
}

function main(): void {
  if (!existsSync(DOCS_DIR)) {
    mkdirSync(DOCS_DIR, { recursive: true });
  }

  if (!needsRegeneration()) {
    const paths: Record<OutputFormat, string> = {
      json: JSON_PATH,
      dot: DOT_PATH,
      svg: SVG_PATH,
    };
    if (requestedFormats.every(format => existsSync(paths[format]))) {
      console.log('✓ Dependency graph up-to-date (cache hit). Use --force to regenerate.');
      return;
    }
  }

  console.log(`Generating dependency graph (${formatArg})...`);
  const startTime = Date.now();

  try {
    if (requestedFormats.includes('json')) {
      const jsonOut = generateFormat('json');
      writeFileSync(JSON_PATH, jsonOut, 'utf-8');
      console.log(`✓ JSON generated (${elapsedMs(startTime)}ms)`);
    }

    if (requestedFormats.includes('dot')) {
      const dotOut = generateFormat('dot');
      writeFileSync(DOT_PATH, dotOut, 'utf-8');
      console.log(`✓ DOT generated (${elapsedMs(startTime)}ms)`);
    }

    if (requestedFormats.includes('svg')) {
      const svgContent = renderSVG(startTime);
      writeFileSync(SVG_PATH, svgContent, 'utf-8');
      console.log(`✓ SVG generated (${elapsedMs(startTime)}ms)`);
    }

    updateCache();
    console.log(`✓ Complete (${elapsedMs(startTime)}ms)`);
  } catch (error) {
    console.warn('[error]', error instanceof Error ? error.message : String(error));

    try {
      if (requestedFormats.includes('svg')) {
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
      // Ignore placeholder errors
    }
    process.exit(0);
  }
}

main();
