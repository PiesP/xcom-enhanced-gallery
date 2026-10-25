import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import type { Plugin } from 'vite';

/** Rolldown's rendered module lengths attribute emitted JS, excluding wrapper and injected notices. */
export function moduleFootprintPlugin(target: string): Plugin {
  let buildOptions: {
    mode: string;
    minify: string | boolean;
    sourcemap: string | boolean;
    target: string | string[] | false;
    formats: string[];
  } | null = null;
  return {
    name: `module-footprint-${target}`,
    apply: 'build',
    configResolved(config): void {
      buildOptions = {
        mode: config.mode,
        minify: config.build.minify,
        sourcemap: config.build.sourcemap,
        target: config.build.target,
        formats: config.build.lib ? (config.build.lib.formats ?? []) : [],
      };
    },
    generateBundle(_options, bundle): void {
      if (!buildOptions) {
        throw new Error('Resolved production build options are unavailable');
      }
      const categories = {
        application: { modules: 0, renderedBytesEstimate: 0 },
        core: { modules: 0, renderedBytesEstimate: 0 },
        solid: { modules: 0, renderedBytesEstimate: 0 },
        otherDependency: { modules: 0, renderedBytesEstimate: 0 },
        other: { modules: 0, renderedBytesEstimate: 0 },
      };
      for (const output of Object.values(bundle)) {
        if (output.type !== 'chunk') {
          continue;
        }
        for (const [id, module] of Object.entries(output.modules)) {
          const path = id.replaceAll('\\', '/');
          const category =
            path.includes('/packages/core/') || path.includes('/@piesp/browser-core/')
              ? categories.core
              : path.includes('/node_modules/solid-js/') ||
                  path.includes('/node_modules/.pnpm/solid-js@')
                ? categories.solid
                : path.includes('/node_modules/')
                  ? categories.otherDependency
                  : path.includes('/src/') || path.includes('/extension/')
                    ? categories.application
                    : categories.other;
          category.modules += 1;
          category.renderedBytesEstimate += module.renderedLength;
        }
      }
      const reportDir = resolve(import.meta.dirname, '..', '..', '..', 'reports');
      mkdirSync(reportDir, { recursive: true });
      writeFileSync(
        resolve(reportDir, `modules-${target}.json`),
        `${JSON.stringify({ target, buildOptions, method: 'chunk.modules.renderedLength; excludes wrappers, injected notices, CSS, and packaging', categories }, null, 2)}\n`
      );
    },
  };
}
