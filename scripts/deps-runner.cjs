/* eslint-env node */
/* global console, process */
/**
 * Consolidated dependency-cruiser runner (DEPS-GOV P3)
 * - Generates json + dot + svg + validation in a single node process
 * - Reduces process spawn overhead (previously 4 invocations)
 */
// dependency-cruiser doesn't expose a CJS main export with cruise directly when "type": "module" in root.
// Attempt to require the internal API path fallback.
let cruise;
try {
  ({ cruise } = require('dependency-cruiser'));
} catch {
  try {
    ({ cruise } = require('dependency-cruiser/src/main/cruise')); // internal path fallback
  } catch (err) {
    console.error('[deps-runner] Unable to load dependency-cruiser cruise API:', err);
    process.exit(1);
  }
}
const { writeFileSync } = require('node:fs');
const { spawnSync } = require('node:child_process');
const path = require('node:path');

async function run() {
  const configPath = path.resolve('.dependency-cruiser.cjs');
  /** @type {import('dependency-cruiser').IConfiguration} */
  const config = require(configPath);

  const target = ['src'];

  // 1. Cruise once for JSON (includes module/dependency graph)
  const jsonResult = cruise(target, {
    ...(config.options || {}),
    ruleSet: { forbidden: config.forbidden || [] },
    outputType: 'json',
  });
  writeFileSync('docs/dependency-graph.json', JSON.stringify(jsonResult.output, null, 2), 'utf-8');

  // 2. Cruise once for DOT (separate to respect styling). Could reuse modules but keep clarity.
  const dotResult = cruise(target, {
    ...(config.options || {}),
    ruleSet: { forbidden: config.forbidden || [] },
    outputType: 'dot',
  });
  writeFileSync('docs/dependency-graph.dot', dotResult.output, 'utf-8');

  // 3. Convert DOT -> SVG (prefer dot, fallback sfdp)
  const svg = spawnSync('dot', ['-T', 'svg'], { input: dotResult.output });
  if (svg.status === 0) {
    writeFileSync('docs/dependency-graph.svg', svg.stdout, 'utf-8');
  } else {
    const sfdp = spawnSync('sfdp', ['-T', 'svg'], { input: dotResult.output });
    if (sfdp.status === 0) {
      writeFileSync('docs/dependency-graph.svg', sfdp.stdout, 'utf-8');
    } else {
      console.warn('[deps-runner] Graphviz dot/sfdp both failed, skipping svg.');
    }
  }

  // 4. Validation run (forbidden rules) - use results from a cruise with validate
  const validateResult = cruise(['src'], {
    ...(config.options || {}),
    ruleSet: { forbidden: config.forbidden || [] },
  });
  const { summary } = validateResult;
  const hasErrors = summary.error > 0;
  // Write a lightweight summary for potential future tooling
  writeFileSync(
    'docs/dependency-validate-summary.json',
    JSON.stringify(
      {
        timestamp: new Date().toISOString(),
        modules: summary.modules,
        dependencies: summary.dependencies,
        errors: summary.error,
        warnings: summary.warn,
        info: summary.info,
      },
      null,
      2
    ),
    'utf-8'
  );

  if (hasErrors) {
    // Re-render the output lines for visibility (dependency-cruiser doesn't expose full formatted text here)
    // => Fallback: instruct user to run legacy script `npm run deps:check` for detailed output.
    console.error(
      '[deps-runner] Validation errors detected. Run `npm run deps:check` for details.'
    );
    process.exit(1);
  } else {
    console.log('[deps-runner] Completed: json + dot + svg + validate (errors=0)');
  }
}

run().catch(err => {
  console.error('[deps-runner] Failed:', err);
  process.exit(1);
});
