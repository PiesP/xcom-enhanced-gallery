/* eslint-env node */
/**
 * Consolidated dependency-cruiser runner (DEPS-GOV P3)
 * ESM variant to interop with dependency-cruiser ESM exports.
 */
import { writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import path from 'node:path';
/* global console, process */

async function run() {
  const { cruise } = await import('dependency-cruiser');
  // dynamic require of config (CJS) via createRequire for ESM context
  const { createRequire } = await import('node:module');
  const require = createRequire(import.meta.url);
  const pkg = require(path.resolve('package.json'));
  const depCfg = pkg?.xeg?.depGraph || {};
  const sourceDir = path.resolve(depCfg.sourceDir || 'src');
  const outDir = path.resolve(depCfg.outputDir || 'docs');
  const files = Object.assign(
    { json: 'dependency-graph.json', dot: 'dependency-graph.dot', svg: 'dependency-graph.svg' },
    depCfg.files || {}
  );
  const configPath = path.resolve(depCfg.configFile || '.dependency-cruiser.cjs');
  /** @type {import('dependency-cruiser').IConfiguration} */
  const config = require(configPath);

  // ensure output directory exists
  if (!existsSync(outDir)) mkdirSync(outDir, { recursive: true });

  const target = [sourceDir];

  const jsonResult = await cruise(target, { ...config, outputType: 'json' });
  const jsonOutput =
    typeof jsonResult.output === 'string' ? jsonResult.output : JSON.stringify(jsonResult, null, 2);
  writeFileSync(path.join(outDir, files.json), jsonOutput, 'utf-8');

  const dotResult = await cruise(target, { ...config, outputType: 'dot' });
  const dotOutput = typeof dotResult.output === 'string' ? dotResult.output : '';
  writeFileSync(path.join(outDir, files.dot), dotOutput, 'utf-8');

  // If DOT output is unexpectedly empty, try CLI fallback
  let effectiveDot = dotOutput;
  if (!effectiveDot || effectiveDot.trim().length === 0) {
    try {
      const { execSync } = await import('node:child_process');
      effectiveDot = execSync(
        `npx dependency-cruiser ${depCfg.sourceDir || 'src'} --config ${depCfg.configFile || '.dependency-cruiser.cjs'} --output-type dot`,
        { encoding: 'utf-8' }
      );
      writeFileSync(path.join(outDir, files.dot), effectiveDot, 'utf-8');
    } catch {
      // noop; keep empty
    }
  }

  // Prefer file-based invocation for portability (Windows friendly)
  const dotPath = path.join(outDir, files.dot);
  const svgPath = path.join(outDir, files.svg);
  const dotVersion = spawnSync('dot', ['-V']);
  if (dotVersion.status === 0) {
    const dotToSvg = spawnSync('dot', ['-Tsvg', dotPath, '-o', svgPath]);
    if (dotToSvg.status !== 0) {
      const sfdpToSvg = spawnSync('sfdp', ['-Tsvg', dotPath, '-o', svgPath]);
      if (sfdpToSvg.status !== 0) {
        console.warn('[deps-runner] Graphviz dot/sfdp failed to generate SVG.');
      }
    }
  } else {
    console.warn('[deps-runner] Graphviz dot not found in PATH; skipping SVG.');
  }

  console.log('[deps-runner] Generated: json + dot + svg (validation via separate script)');
}

run().catch(err => {
  console.error('[deps-runner] Failed:', err);
  process.exit(1);
});
