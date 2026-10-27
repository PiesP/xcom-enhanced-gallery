import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vite-plus/test';

const root = resolve(import.meta.dirname, '../../..');
const setupProject =
  'PiesP/browser-core/automation/actions/setup-project@38cd1cb18c9c37e57e8b53a98e811450bb1a18fc';
const release = readFileSync(resolve(root, '.github/workflows/release.yaml'), 'utf8');

describe('release runtime selection', () => {
  it('declares one exact current Node pin independently of the support range', () => {
    const pin = readFileSync(resolve(root, '.node-version'), 'utf8');
    const manifest = JSON.parse(readFileSync(resolve(root, 'package.json'), 'utf8')) as {
      volta?: unknown;
      engines: { node: string };
      packageManager: string;
    };
    expect(pin).toMatch(/^\d+\.\d+\.\d+\n$/);
    expect(pin.trim()).toBe('26.12.1');
    expect(manifest.volta).toBeUndefined();
    expect(manifest.engines.node).toContain('26.12.1');
    expect(manifest.packageManager).toBe('pnpm@12.15.0');
  });

  it('verifies the protected tag before installing its dependency graph', () => {
    const provenance = release.split('  provenance:\n')[1]?.split('\n  quality:')[0] ?? '';
    const checkout = provenance.indexOf('name: 📥 Checkout protected workflow source');
    const runtime = provenance.indexOf('name: 📦 Setup trusted provenance runtime');
    const verify = provenance.indexOf(
      'run: node --experimental-strip-types scripts/release/verify-source.ts'
    );
    expect(checkout).toBeGreaterThan(-1);
    expect(runtime).toBeGreaterThan(checkout);
    expect(verify).toBeGreaterThan(runtime);
    expect(provenance).toContain(`uses: ${setupProject}`);
    expect(provenance).toContain("install-dependencies: 'false'");
  });

  it('uses the reviewed provider with the verified numeric override for every tagged job', () => {
    const override = 'node-version: ${{ needs.provenance.outputs.node-version }}';
    for (const job of ['quality', 'unit', 'e2e', 'build']) {
      const definition = release.split(`\n  ${job}:\n`)[1]?.split(/\n  [a-z-]+:\n/u)[0] ?? '';
      const checkout = definition.indexOf('Checkout verified release commit');
      const setup = definition.indexOf(`uses: ${setupProject}`);
      expect(checkout, job).toBeGreaterThan(-1);
      expect(setup, job).toBeGreaterThan(checkout);
      expect(definition, job).toContain(override);
      expect(definition, job).not.toContain('./.github/actions/setup-release');
    }
    expect(release.split(override)).toHaveLength(5);
  });

  it('selects the protected runtime before publication HTTPS requests', () => {
    const publish = release.slice(release.indexOf('\n  publish:'));
    const checkout = publish.indexOf('ref: ${{ github.sha }}');
    const runtime = publish.indexOf('name: 📦 Setup trusted publication runtime');
    const verify = publish.indexOf('run: node scripts/release/verify-publication.ts');
    expect(checkout).toBeGreaterThan(-1);
    expect(runtime).toBeGreaterThan(checkout);
    expect(verify).toBeGreaterThan(runtime);
    const setup = publish.slice(runtime, publish.indexOf('\n      - name:', runtime + 1));
    expect(setup).toContain(`uses: ${setupProject}`);
    expect(setup).toContain("install-dependencies: 'false'");
    expect(setup).not.toContain('node-version:');
    expect(publish).toContain('contents: write');
    expect(publish).not.toContain('checkout --detach');
  });
});
