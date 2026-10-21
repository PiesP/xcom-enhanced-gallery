import { globSync, readdirSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vite-plus/test';

const root = resolve(import.meta.dirname, '../../..');
const primer =
  'PiesP/browser-core/automation/actions/prepare-node-trust@381b4ca733494cf069212cd0d16458389a83c623';
const trustEnvironment = {
  NODE_OPTIONS: '--use-openssl-ca',
  SSL_CERT_FILE: '/etc/ssl/certs/ca-certificates.crt',
  SSL_CERT_DIR: '/etc/ssl/certs',
};

describe('GitHub Actions Node trust boundary', () => {
  it('prepares the fixed OS trust store before every JavaScript Action without overrides', () => {
    const paths = globSync('.github/workflows/*.yaml', { cwd: root });
    expect(paths.length).toBeGreaterThan(0);

    for (const path of paths) {
      const workflow = readFileSync(resolve(root, path), 'utf8');
      const jobs = workflow.split(/^jobs:\n/m)[1];
      expect(jobs, `${path}: jobs`).toBeDefined();

      const globalEnvironment = workflow.split(/^env:\n/m)[1]?.split(/^\S/m)[0] ?? '';
      for (const [key, value] of Object.entries(trustEnvironment)) {
        expect(globalEnvironment, `${path}: global ${key}`).toContain(`  ${key}: ${value}\n`);
        expect(
          workflow.match(new RegExp(`^\\s+${key}:`, 'gm')),
          `${path}: ${key} overrides`
        ).toHaveLength(1);
      }

      const jobBlocks = (jobs ?? '').split(/^  (?=[a-z][a-z0-9-]*:\n)/m).filter(Boolean);
      expect(jobBlocks.length, `${path}: jobs`).toBeGreaterThan(0);

      for (const job of jobBlocks) {
        const name = job.split(':', 1)[0];
        const steps = job.split(/^    steps:\n/m)[1];
        expect(steps, `${path}/${name}: steps`).toBeDefined();
        const stepBlocks = (steps ?? '').split(/^      - (?=name:|uses:|run:)/m).filter(Boolean);
        const actionSteps = stepBlocks.filter((step) => /^\s*uses: /m.test(step));
        const primerSteps = stepBlocks.filter((step) => step.includes(`uses: ${primer}\n`));

        if (actionSteps.length === 0) {
          expect(primerSteps, `${path}/${name}: shell-only job`).toHaveLength(0);
          continue;
        }

        expect(primerSteps, `${path}/${name}: one primer`).toHaveLength(1);
        expect(stepBlocks[0], `${path}/${name}: first step`).toBe(primerSteps[0]);
        expect(primerSteps[0], `${path}/${name}: unconditional primer`).not.toMatch(/^\s*if:/m);
      }
    }
  });
});

it('keeps failure-path Actions behind successful trust preparation', () => {
  const directory = resolve(import.meta.dirname, '../../../.github/workflows');
  for (const file of readdirSync(directory).filter((name) => /\.ya?ml$/u.test(name))) {
    const workflow = readFileSync(resolve(directory, file), 'utf8');
    for (const job of (workflow.split('\njobs:\n')[1] ?? '').split(/(?=^  [\w-]+:\n)/mu)) {
      const steps = job.split('    steps:\n')[1] ?? '';
      const first = steps.split('\n      - ')[0] ?? '';
      for (const step of steps.split(/(?=^      - )/mu)) {
        if (!/^      - uses:|^        uses:/mu.test(step)) {
          continue;
        }
        const condition = step.match(/^        if: (.*)$/mu)?.[1] ?? '';
        if (!/\b(?:always|failure|cancelled)\(/u.test(condition)) {
          continue;
        }
        expect(first, `${file}: primer identity`).toContain('id: node_trust');
        expect(condition, `${file}: ${step.split('\n')[0]}`).toMatch(
          /^\$\{\{ steps\.node_trust\.outcome == 'success' && \(/u
        );
      }
    }
  }
});
