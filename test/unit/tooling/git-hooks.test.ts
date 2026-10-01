import { execFileSync, spawnSync } from 'node:child_process';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';

const hooks = resolve(import.meta.dirname, '../../../.githooks');
const repositories: string[] = [];

function git(repository: string, ...args: string[]): string {
  return execFileSync('git', args, { cwd: repository, encoding: 'utf8' }).trim();
}

function repository(): string {
  const path = mkdtempSync(join(tmpdir(), 'xcom-git-hooks-'));
  repositories.push(path);
  git(path, 'init', '-q', '-b', 'master');
  git(path, 'config', 'user.name', 'Hook Test');
  git(path, 'config', 'user.email', 'hook-test@example.invalid');
  git(path, 'commit', '--allow-empty', '-q', '-m', 'base');
  return path;
}

function hook(repositoryPath: string, name: string, input = '') {
  return spawnSync('bash', [join(hooks, name)], {
    cwd: repositoryPath,
    input,
    encoding: 'utf8',
  });
}

afterEach(() => {
  for (const path of repositories.splice(0)) rmSync(path, { recursive: true, force: true });
});

describe('protected branch Git hooks', () => {
  it('rejects default-branch commits, including a real pending merge', () => {
    const path = repository();
    expect(hook(path, 'pre-commit').status).not.toBe(0);

    git(path, 'switch', '-q', '-c', 'main');
    expect(hook(path, 'pre-commit').status).not.toBe(0);

    git(path, 'switch', '-q', 'master');
    git(path, 'switch', '-q', '-c', 'topic');
    git(path, 'commit', '--allow-empty', '-q', '-m', 'topic');
    expect(hook(path, 'pre-commit').status).toBe(0);

    git(path, 'switch', '-q', '--detach', 'HEAD');
    expect(hook(path, 'pre-commit').status).not.toBe(0);

    git(path, 'switch', '-q', 'master');
    git(path, 'merge', '--no-ff', '--no-commit', 'topic');
    expect(git(path, 'rev-parse', '-q', '--verify', 'MERGE_HEAD')).toMatch(/^[0-9a-f]{40}$/);
    expect(hook(path, 'pre-commit').status).not.toBe(0);
  });

  it('allows topic pushes but rejects default refs, merge commits, and deletion', () => {
    const path = repository();
    const base = git(path, 'rev-parse', 'HEAD');
    git(path, 'switch', '-q', '-c', 'topic');
    git(path, 'commit', '--allow-empty', '-q', '-m', 'topic');
    const topic = git(path, 'rev-parse', 'HEAD');
    git(path, 'switch', '-q', 'master');
    git(path, 'merge', '--no-ff', '-q', '-m', 'merge topic', 'topic');
    const merge = git(path, 'rev-parse', 'HEAD');
    const zero = '0'.repeat(40);

    expect(hook(path, 'pre-push', `refs/heads/topic ${topic} refs/heads/topic ${zero}\n`).status).toBe(0);
    expect(hook(path, 'pre-push', `refs/heads/master ${merge} refs/heads/master ${base}\n`).status).not.toBe(0);
    expect(hook(path, 'pre-push', `refs/heads/main ${merge} refs/heads/main ${base}\n`).status).not.toBe(0);
    expect(hook(path, 'pre-push', `refs/heads/master ${zero} refs/heads/master ${merge}\n`).status).not.toBe(0);
    expect(
      hook(
        path,
        'pre-push',
        `refs/heads/topic ${topic} refs/heads/topic ${zero}\nrefs/heads/master ${merge} refs/heads/master ${base}\n`
      ).status
    ).not.toBe(0);
  });
});
