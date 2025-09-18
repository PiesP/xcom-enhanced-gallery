#!/usr/bin/env node
/**
 * Unified dependency analysis script
 * - Generates JSON, DOT, SVG in a single process
 * - Runs rule validation (forbidden rules) and exits non-zero on errors
 * - Prints summarized orphan & circular counts
 *
 * Resolves prior issue where direct API call produced empty JSON by explicitly awaiting cruise
 * result and serializing the .modules graph.
 */
import { writeFileSync } from 'node:fs';
import { execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { cruise } from 'dependency-cruiser';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = __dirname.endsWith('scripts') ? dirname(__dirname) : __dirname;
const docsDir = join(projectRoot, 'docs');

async function run() {
	const start = Date.now();
	const result = await cruise(['src'], {
		validate: { ruleSet: (await import('../.dependency-cruiser.cjs', { with: { type: 'commonjs' } })).default || (await import('../.dependency-cruiser.cjs', { with: { type: 'commonjs' } })) },
		includeOnly: '^src',
		tsConfig: { fileName: 'tsconfig.json' },
		outputType: 'json',
	});

	// result.output contains the JSON as string when outputType json not set? Ensure we serialize.
	const jsonGraph = typeof result.output === 'string' ? result.output : JSON.stringify(result, null, 2);
	writeFileSync(join(docsDir, 'dependency-graph.json'), jsonGraph, 'utf-8');

	// Generate DOT via CLI (uses existing config reporterOptions) then SVG via graphviz if available
		try {
			const dot = execSync('npx dependency-cruiser src --config .dependency-cruiser.cjs --output-type dot', { encoding: 'utf-8' });
			writeFileSync(join(docsDir, 'dependency-graph.dot'), dot, 'utf-8');
			try {
				const svg = execSync('npx dot -Tsvg docs/dependency-graph.dot', { encoding: 'utf-8' });
				writeFileSync(join(docsDir, 'dependency-graph.svg'), svg, 'utf-8');
				} catch {
					globalThis.console?.warn?.('[deps-all] graphviz dot not available - skipping svg');
			}
			} catch (err) {
				globalThis.console?.error?.('[deps-all] dot generation failed', err);
		}

	// Summaries
	const modules = result.modules || [];
	const circular = modules.flatMap(m => m.dependencies || []).filter(d => d.cycle);
	const orphans = modules.filter(m => m.orphan);
			globalThis.console?.log?.(`[deps-all] modules=${modules.length} circularEdges=${circular.length} orphans=${orphans.length}`);

	// Validation summary
	if (result?.summary?.error > 0) {
				globalThis.console?.error?.('[deps-all] rule violations (errors):', result.summary.error);
			process.exitCode = 1; // eslint-disable-line no-undef
	}
			globalThis.console?.log?.(`[deps-all] completed in ${Date.now() - start}ms`);
}

run().catch(err => {
	globalThis.console?.error?.('[deps-all] unexpected failure', err);
	process.exit(1); // eslint-disable-line no-undef
});
