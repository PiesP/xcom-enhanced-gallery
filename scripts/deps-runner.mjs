/* eslint-env node */
/**
 * Consolidated dependency-cruiser runner (DEPS-GOV P3)
 * ESM variant to interop with dependency-cruiser ESM exports.
 */
import { writeFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import path from 'node:path';
/* global console, process */

async function run() {
  const { cruise } = await import('dependency-cruiser');
  // dynamic require of config (CJS) via createRequire for ESM context
  const { createRequire } = await import('node:module');
  const require = createRequire(import.meta.url);
  const configPath = path.resolve('.dependency-cruiser.cjs');
  /** @type {import('dependency-cruiser').IConfiguration} */
  const config = require(configPath);

  const target = ['src'];

  const jsonResult = cruise(target, { ...config, outputType: 'json' });
  const jsonOutput =
    typeof jsonResult.output === 'string' ? jsonResult.output : JSON.stringify(jsonResult, null, 2);
  writeFileSync('docs/dependency-graph.json', jsonOutput, 'utf-8');

  const dotResult = cruise(target, { ...config, outputType: 'dot' });
  const dotOutput = typeof dotResult.output === 'string' ? dotResult.output : '';
  writeFileSync('docs/dependency-graph.dot', dotOutput, 'utf-8');

  const svg = spawnSync('dot', ['-T', 'svg'], { input: dotOutput });
  if (svg.status === 0) {
    writeFileSync('docs/dependency-graph.svg', svg.stdout, 'utf-8');
  } else {
    const sfdp = spawnSync('sfdp', ['-T', 'svg'], { input: dotOutput });
    if (sfdp.status === 0) {
      writeFileSync('docs/dependency-graph.svg', sfdp.stdout, 'utf-8');
    } else {
      console.warn('[deps-runner] Graphviz dot/sfdp both failed, skipping svg.');
    }
  }

  console.log('[deps-runner] Generated: json + dot + svg (validation via separate script)');
}

run().catch(err => {
  console.error('[deps-runner] Failed:', err);
  process.exit(1);
});
