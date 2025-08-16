#!/usr/bin/env node
/* eslint-env node */
/*
 * List effective unused design tokens (excluding deprecated block)
 */
/* global console, process */
import { analyzeStyleTokens } from '../src/dev-scripts/styleTokenAnalyzer.ts';
import fs from 'fs/promises';
import path from 'path';

async function collectComponentCssFiles(rootDir) {
  const out = [];
  async function walk(dir) {
    const entries = await fs.readdir(dir, { withFileTypes: true });
    for (const e of entries) {
      const full = path.join(dir, e.name);
      if (e.isDirectory()) await walk(full);
      else if (
        full.endsWith('.css') &&
        !full.endsWith('design-tokens.css') &&
        !full.endsWith('design-tokens-solid.css')
      ) {
        out.push(full);
      }
    }
  }
  await walk(rootDir);
  return out;
}

async function main() {
  const projectRoot = process.cwd();
  const cssRoot = path.join(projectRoot, 'src');
  const componentFiles = (await collectComponentCssFiles(cssRoot)).map(p =>
    p.replace(projectRoot + path.sep, '').replace(/\\/g, '/')
  );
  const result = await analyzeStyleTokens({
    definitionRoots: [
      'src/shared/styles/design-tokens.css',
      'src/shared/styles/design-tokens-solid.css',
    ],
    componentFiles,
    includeDefinitionReferences: true,
  });

  const tokensCss = await fs.readFile(
    path.join(projectRoot, 'src/shared/styles/design-tokens.css'),
    'utf-8'
  );
  const deprecatedSectionMatch = tokensCss.match(/DEPRECATED TOKENS[\s\S]*?:root \{([\s\S]*?)\n\}/);
  const deprecatedTokens = new Set();
  if (deprecatedSectionMatch) {
    const body = deprecatedSectionMatch[1];
    const re = /(--[a-z0-9-]+)\s*:/gi;
    let m;
    while ((m = re.exec(body)) !== null) deprecatedTokens.add(m[1]);
  }

  const effectiveUnused = [...result.unusedTokens].filter(t => !deprecatedTokens.has(t)).sort();
  console.log(`Total defined: ${result.definedTokens.size}`);
  console.log(`Total referenced (incl aliases): ${result.referencedTokens.size}`);
  console.log(`Deprecated tokens: ${deprecatedTokens.size}`);
  console.log(`Raw unused: ${result.unusedTokens.size}`);
  console.log(`Effective unused (excluded deprecated): ${effectiveUnused.length}`);
  console.log('\n--- Effective Unused Tokens (first 150) ---');
  effectiveUnused.slice(0, 150).forEach(t => console.log(t));
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
