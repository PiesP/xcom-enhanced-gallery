#!/usr/bin/env node

import { spawnSync } from 'node:child_process';
import { appendFileSync, existsSync, realpathSync, writeSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const outputs = [
  'quality',
  'unit',
  'e2e',
  'build',
  'duplication',
  'osv',
  'semgrep',
  'codeql_actions',
  'codeql_javascript',
] as const;
type Output = (typeof outputs)[number];
type Decision = { selected: ReadonlySet<Output>; reason: string };

export function classifyChanges(
  args: readonly string[],
  env: NodeJS.ProcessEnv = process.env
): Decision {
  const selected = new Set<Output>();
  function select(...names: Output[]): void {
    for (const name of names) selected.add(name);
  }
  const selectAll = () => select(...outputs);
  const selectCiAll = () => select('quality', 'unit', 'e2e', 'build', 'duplication');
  const selectSecurityAll = () => select('osv', 'semgrep', 'codeql_actions', 'codeql_javascript');

  function classifyPath(path: string): void {
    let known = false;

    // Semgrep's secrets ruleset covers every tracked text change. Binary icons
    // are the sole exception because it cannot meaningfully inspect them.
    if (!(path.startsWith('assets/icons/') && path.endsWith('.png'))) select('semgrep');
    if ((path.startsWith('test/') && /\.tsx?$/.test(path)) || path === 'tsconfig.test.json') {
      select('quality');
    }

    if (
      [
        'packages/core',
        '.gitmodules',
        'package.json',
        'pnpm-lock.yaml',
        'pnpm-workspace.yaml',
      ].includes(path)
    ) {
      known = true;
      selectCiAll();
      select('osv', 'codeql_javascript');
    }

    if (path.startsWith('src/')) {
      known = true;
      selectCiAll();
      select('codeql_javascript');
    } else if (path.startsWith('scripts/') || path.startsWith('tooling/')) {
      known = true;
      select('quality', 'unit', 'e2e', 'build', 'codeql_javascript');
    } else if (
      path.startsWith('test/unit/') ||
      ['test/setup.ts', 'vitest.config.ts', 'tsconfig.test.json'].includes(path)
    ) {
      known = true;
      select('unit', 'codeql_javascript');
    } else if (/^test\/e2e\/playwright.*\.config\.ts$/.test(path)) {
      known = true;
      select('unit', 'e2e', 'codeql_javascript');
    } else if (path.startsWith('test/e2e/')) {
      known = true;
      select('e2e', 'codeql_javascript');
    } else if (path.startsWith('test/fixtures/')) {
      known = true;
      select('unit', 'e2e', 'codeql_javascript');
    } else if (path.startsWith('test/visual/')) {
      known = true;
      select('codeql_javascript');
    } else if (path.startsWith('validation/windows/')) {
      known = true;
      select('unit', 'e2e', 'codeql_javascript');
    } else if (path.startsWith('extension/')) {
      known = true;
      select('unit', 'e2e', 'build');
    } else if (path.startsWith('assets/')) {
      known = true;
      select('e2e', 'build');
    }

    if (
      /^vite.*\.ts$/.test(path) ||
      [
        'tsconfig.json',
        'tsconfig.e2e.json',
        'tsconfig.scripts.json',
        'biome.json',
        'knip.json',
      ].includes(path)
    ) {
      known = true;
      select('quality', 'unit', 'e2e', 'build', 'codeql_javascript');
    } else if (
      [
        '.nose-baseline.json',
        'nose.toml',
        'scripts/ci/install-nose.sh', // Retain the deleted path for rename/delete classification.
        'scripts/ci/install-nose.ts',
        'scripts/ci/pinned-tools.ts',
        'scripts/ci/pinned-tools.json',
      ].includes(path)
    ) {
      known = true;
      select('quality', 'duplication');
      if (path === 'scripts/ci/pinned-tools.ts' || path === 'scripts/ci/pinned-tools.json') {
        select('osv', 'semgrep');
      }
    } else if (['stryker.conf.json', 'stryker.conf.fast.json', 'README.md'].includes(path)) {
      known = true;
      select('unit');
    }

    if (['.github/workflows/ci.yaml', 'scripts/ci/classify-changes.ts'].includes(path)) {
      known = true;
      selectCiAll();
    } else if (path === '.github/workflows/security.yaml') {
      known = true;
      select('unit');
      selectSecurityAll();
    } else if (
      ['.github/workflows/deep-checks.yaml', '.github/workflows/release.yaml'].includes(path)
    ) {
      known = true;
      select('unit');
    } else if (
      [
        '.github/workflows/dependabot-auto-merge.yaml',
        '.github/workflows/dependabot-auto-merge-apply.yaml',
      ].includes(path) ||
      path.startsWith('.github/actions/')
    ) {
      known = true;
      select('unit');
    }
    if (path === 'scripts/security/validate-osv-results.py') {
      known = true;
      select('unit', 'osv');
    }
    if (
      path.startsWith('.github/workflows/') ||
      path.startsWith('.github/actions/') ||
      path === '.github/settings.yml'
    ) {
      known = true;
      select('unit');
    }
    if (path.startsWith('.github/workflows/') || path.startsWith('.github/actions/')) {
      known = true;
      select('codeql_actions');
    }

    if (
      [
        'CHANGELOG.md',
        'CODE_OF_CONDUCT.md',
        'CONTRIBUTING.md',
        'LICENSE',
        'PRIVACY.md',
        'SECURITY.md',
        'SUPPORT.md',
        '.github/pull_request_template.md',
        '.github/SECURITY.md',
        '.github/CODEOWNERS',
        '.github/dependabot.yaml',
        '.gitignore',
        '.gitattributes',
      ].includes(path) ||
      path.startsWith('docs/') ||
      path.startsWith('.github/ISSUE_TEMPLATE/')
    ) {
      known = true;
    }

    if (!known) {
      writeSync(2, `Unknown changed path; enabling every check: ${path}\n`);
      selectAll();
    }
  }

  function decision(reason: string): Decision {
    return { selected, reason };
  }

  function classifyGitDiff(event: string): Decision {
    const base = env.BASE_SHA ?? '';
    const head = env.HEAD_SHA ?? '';
    if (!/^[0-9a-f]{40}$/.test(base) || !/^[0-9a-f]{40}$/.test(head) || /^0+$/.test(base)) {
      selectAll();
      return decision('invalid-revision-full');
    }

    const range = `${base}${event === 'push' ? '..' : '...'}${head}`;
    const diff = spawnSync('git', ['diff', '--no-renames', '--name-only', '-z', range, '--'], {
      encoding: 'buffer',
      maxBuffer: 64 * 1024 * 1024,
      stdio: ['ignore', 'pipe', 'ignore'],
    });
    if (diff.status !== 0 || !diff.stdout || diff.error) {
      selectAll();
      return decision('diff-failed-full');
    }
    const bytes = diff.stdout as Buffer;
    if (bytes.length === 0) {
      selectAll();
      return decision('empty-diff-full');
    }
    if (bytes.at(-1) !== 0) {
      selectAll();
      return decision('diff-failed-full');
    }
    try {
      const decode = new TextDecoder('utf-8', { fatal: true });
      const paths = decode.decode(bytes).slice(0, -1).split('\0');
      for (const path of paths) classifyPath(path);
      return decision(`classified-${paths.length}-files`);
    } catch {
      selectAll();
      return decision('diff-failed-full');
    }
  }

  if (args[0] === '--files') {
    for (const path of args.slice(1)) classifyPath(path);
    return decision('explicit-file-list');
  } else {
    const event = env.GITHUB_EVENT_NAME ?? 'unknown';
    if (event === 'workflow_dispatch' || event === 'schedule') {
      selectAll();
      return decision(`${event}-full`);
    } else if (event === 'push' || event === 'pull_request' || event === 'merge_group') {
      return classifyGitDiff(event);
    } else {
      selectAll();
      return decision('unknown-event-full');
    }
  }
}

function emit({ selected, reason }: Decision, env: NodeJS.ProcessEnv): void {
  const body = `${outputs.map((name) => `${name}=${selected.has(name)}`).join('\n')}\nreason=${reason}\n`;
  if (env.GITHUB_OUTPUT) appendFileSync(env.GITHUB_OUTPUT, body);
  else writeSync(1, body);
}

// Compare resolved paths so invoking a symlink to this CLI still runs it.
if (
  process.argv[1] &&
  existsSync(process.argv[1]) &&
  realpathSync(process.argv[1]) === realpathSync(fileURLToPath(import.meta.url))
) {
  emit(classifyChanges(process.argv.slice(2)), process.env);
}
