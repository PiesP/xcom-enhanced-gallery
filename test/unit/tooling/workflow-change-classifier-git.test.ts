import { execFileSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, readFileSync, renameSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const classifier = resolve(import.meta.dirname, '../../../scripts/ci/classify-changes.sh');
const ciOutputs = ['quality', 'unit', 'e2e', 'build', 'duplication'] as const;
const allOutputs = [...ciOutputs, 'osv', 'semgrep', 'codeql_actions', 'codeql_javascript'] as const;

function git(cwd: string, ...args: string[]): string {
  return execFileSync('git', args, { cwd, encoding: 'utf8' }).trim();
}

function fixture(run: (cwd: string) => void): void {
  const cwd = mkdtempSync(join(tmpdir(), 'xeg-classifier-git-'));
  try {
    git(cwd, 'init', '-q');
    git(cwd, 'config', 'user.name', 'Classifier Test');
    git(cwd, 'config', 'user.email', 'classifier@example.invalid');
    git(cwd, 'config', 'diff.renames', 'true');
    run(cwd);
  } finally {
    rmSync(cwd, { recursive: true, force: true });
  }
}

function write(cwd: string, path: string, content = 'fixture\n'): void {
  mkdirSync(dirname(join(cwd, path)), { recursive: true });
  writeFileSync(join(cwd, path), content);
}

function commit(cwd: string): string {
  git(cwd, 'add', '-A');
  git(cwd, 'commit', '-qm', 'fixture');
  return git(cwd, 'rev-parse', 'HEAD');
}

function classifyEvent(
  cwd: string,
  event: string,
  base: string,
  head: string
): Record<string, string> {
  const outputDirectory = mkdtempSync(join(tmpdir(), 'xeg-classifier-output-'));
  const outputPath = join(outputDirectory, 'outputs.txt');
  try {
    execFileSync('bash', [classifier], {
      cwd,
      env: {
        ...process.env,
        GITHUB_EVENT_NAME: event,
        BASE_SHA: base,
        HEAD_SHA: head,
        GITHUB_OUTPUT: outputPath,
      },
      stdio: 'pipe',
    });
    return Object.fromEntries(
      readFileSync(outputPath, 'utf8')
        .trim()
        .split('\n')
        .map((line) => {
          const separator = line.indexOf('=');
          return [line.slice(0, separator), line.slice(separator + 1)];
        })
    );
  } finally {
    rmSync(outputDirectory, { recursive: true, force: true });
  }
}

function expectEnabled(outputs: Record<string, string>, names: readonly string[]): void {
  for (const name of names) expect(outputs[name], name).toBe('true');
}

function expectOnly(outputs: Record<string, string>, names: readonly string[]): void {
  for (const name of allOutputs) {
    expect(outputs[name], name).toBe(names.includes(name) ? 'true' : 'false');
  }
}

describe('classifier Git event path extraction', () => {
  it.each(['docs/audit-example.ts', 'test/unit/audit-example.ts'])(
    'classifies both sides of a source move to %s on push',
    (destination) => {
      fixture((cwd) => {
        write(cwd, 'src/audit-example.ts');
        const base = commit(cwd);
        mkdirSync(dirname(join(cwd, destination)), { recursive: true });
        renameSync(join(cwd, 'src/audit-example.ts'), join(cwd, destination));
        const head = commit(cwd);

        const outputs = classifyEvent(cwd, 'push', base, head);
        expectEnabled(outputs, [...ciOutputs, 'semgrep', 'codeql_javascript']);
        expect(outputs.reason).toBe('classified-2-files');
      });
    }
  );

  it.each(['docs/audit-example.ts', 'test/unit/audit-example.ts'])(
    'classifies both sides of a move from %s into source on pull requests',
    (origin) => {
      fixture((cwd) => {
        write(cwd, origin);
        const base = commit(cwd);
        mkdirSync(join(cwd, 'src'), { recursive: true });
        renameSync(join(cwd, origin), join(cwd, 'src/audit-example.ts'));
        const head = commit(cwd);

        const outputs = classifyEvent(cwd, 'pull_request', base, head);
        expectEnabled(outputs, [...ciOutputs, 'semgrep', 'codeql_javascript']);
        expect(outputs.reason).toBe('classified-2-files');
      });
    }
  );

  it('preserves rename-only, deletion, type-change, and NUL-delimited paths', () => {
    fixture((cwd) => {
      write(cwd, 'src/renamed.ts');
      write(cwd, 'src/deleted.ts');
      write(cwd, 'docs/type-changed.md');
      write(cwd, 'src/line\nbreak.ts');
      const base = commit(cwd);
      renameSync(join(cwd, 'src/renamed.ts'), join(cwd, 'src/renamed-again.ts'));
      rmSync(join(cwd, 'src/deleted.ts'));
      rmSync(join(cwd, 'docs/type-changed.md'));
      symlinkSync('target.md', join(cwd, 'docs/type-changed.md'));
      renameSync(join(cwd, 'src/line\nbreak.ts'), join(cwd, 'docs/line\nbreak.md'));
      const head = commit(cwd);

      const outputs = classifyEvent(cwd, 'merge_group', base, head);
      expectEnabled(outputs, [...ciOutputs, 'semgrep', 'codeql_javascript']);
      expect(outputs.reason).toBe('classified-6-files');
    });
  });

  it('keeps documentation narrow and README compatibility tests selected', () => {
    fixture((cwd) => {
      write(cwd, 'docs/guide.md');
      write(cwd, 'README.md');
      const base = commit(cwd);
      write(cwd, 'docs/guide.md', 'updated\n');
      const docsHead = commit(cwd);
      expectOnly(classifyEvent(cwd, 'push', base, docsHead), ['semgrep']);
      write(cwd, 'README.md', 'updated\n');
      const readmeHead = commit(cwd);
      expectOnly(classifyEvent(cwd, 'push', docsHead, readmeHead), ['unit', 'semgrep']);
    });
  });

  it('keeps unknown paths and failed revisions conservative', () => {
    fixture((cwd) => {
      write(cwd, 'docs/guide.md');
      const base = commit(cwd);
      write(cwd, 'new-unclassified-input.xyz');
      const head = commit(cwd);

      expectEnabled(classifyEvent(cwd, 'push', base, head), allOutputs);
      const invalid = classifyEvent(cwd, 'push', '0'.repeat(40), head);
      expectEnabled(invalid, allOutputs);
      expect(invalid.reason).toBe('invalid-revision-full');
      const unreadable = classifyEvent(cwd, 'push', 'a'.repeat(40), head);
      expectEnabled(unreadable, allOutputs);
      expect(unreadable.reason).toBe('diff-failed-full');
      const empty = classifyEvent(cwd, 'push', head, head);
      expectEnabled(empty, allOutputs);
      expect(empty.reason).toBe('empty-diff-full');
    });
  });

  it('uses a direct push diff and merge-base diffs for PR and merge group events', () => {
    fixture((cwd) => {
      write(cwd, 'docs/shared.md');
      const common = commit(cwd);
      git(cwd, 'branch', 'base');
      write(cwd, 'docs/head.md');
      const head = commit(cwd);
      git(cwd, 'switch', '-q', 'base');
      write(cwd, 'src/base-only.ts');
      const base = commit(cwd);

      for (const event of ['pull_request', 'merge_group']) {
        const outputs = classifyEvent(cwd, event, base, head);
        expectOnly(outputs, ['semgrep']);
        expect(outputs.reason).toBe('classified-1-files');
      }
      const push = classifyEvent(cwd, 'push', base, head);
      expectEnabled(push, [...ciOutputs, 'semgrep', 'codeql_javascript']);
      expect(push.reason).toBe('classified-2-files');
      expect(git(cwd, 'merge-base', base, head)).toBe(common);
    });
  });
});
