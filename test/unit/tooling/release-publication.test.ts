import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { verifyPublication } from '../../../scripts/release/verify-publication.ts';

const sha = 'a'.repeat(40);
const workflowSha = 'b'.repeat(40);
const assetNames = [
  'xcom-enhanced-gallery.user.js', 'xcom-enhanced-gallery.meta.js',
  'xcom-enhanced-gallery-chrome.zip', 'xcom-enhanced-gallery-firefox.zip',
  'checksums.txt', 'metadata.json',
];

function release(tag: string) {
  return {
    tag_name: tag, draft: false, prerelease: false,
    assets: assetNames.map((name, index) => ({ name, id: index + 1, size: 10, state: 'uploaded' })),
  };
}

function fixture(tag = 'v2.3.10', published: unknown[] = []) {
  const metadata = { version: tag.slice(1), commit: sha };
  const calls: string[] = [];
  const responses = new Map<string, unknown>([
    ['/releases?per_page=100&page=1', published],
    ['/releases/latest', published.at(-1) ?? null],
    [`/releases/tags/${tag}`, null],
    ['/releases/assets/6', metadata],
  ]);
  const gitResponses = new Map<string, string>([
    ['rev-parse HEAD', workflowSha],
    [`rev-parse --verify ${tag}^{commit}`, sha],
    [`show ${sha}:package.json`, JSON.stringify({ version: tag.slice(1) })],
  ]);
  return {
    responses, gitResponses, metadata, calls,
    run: () => verifyPublication(tag, sha, workflowSha, metadata, (args) => {
      calls.push(`git ${args.join(' ')}`);
      return gitResponses.get(args.join(' ')) ?? '';
    }, async (path, asset) => {
      calls.push(`${asset ? 'asset' : 'api'} ${path}`);
      if (!responses.has(path)) throw new Error(`Unexpected API read ${path}`);
      const response = responses.get(path);
      if (response instanceof Error) throw response;
      return response;
    }),
  };
}

describe('serialized release publication policy', () => {
  it('permits the first release and explicitly selects Latest', async () => {
    const check = fixture();
    await expect(check.run()).resolves.toEqual({ publish: true, makeLatest: true });
    expect(check.calls.slice(0, 5)).toEqual([
      `git rev-parse HEAD`,
      `git fetch --force origin refs/tags/v2.3.10:refs/tags/v2.3.10`,
      `git rev-parse --verify v2.3.10^{commit}`,
      `git merge-base --is-ancestor ${sha} ${workflowSha}`,
      `git show ${sha}:package.json`,
    ]);
  });

  it('compares numeric versions and rejects a delayed or manual historical target', async () => {
    await expect(fixture('v2.3.10', [release('v2.3.9')]).run())
      .resolves.toEqual({ publish: true, makeLatest: true });
    await expect(fixture('v2.3.9', [release('v2.3.10')]).run())
      .rejects.toThrow('Historical publication');
    await expect(fixture('v2.3.9', [release('v2.3.10'), release('v2.3.8')]).run())
      .rejects.toThrow('Historical publication');
    await expect(fixture('v2.3.100000000000000000000', [release('v2.3.99999999999999999999')]).run())
      .resolves.toEqual({ publish: true, makeLatest: true });
  });

  it('makes a complete same-version retry a no-op without changing assets or Latest', async () => {
    const target = release('v2.3.10');
    const check = fixture(target.tag_name, [target]);
    check.responses.set(`/releases/tags/${target.tag_name}`, target);
    await expect(check.run()).resolves.toEqual({ publish: false, makeLatest: false });
    expect(check.calls.at(-1)).toBe('asset /releases/assets/6');
  });

  it('refuses incomplete releases, source conflicts and draft/archive retries', async () => {
    const target = release('v2.3.10');
    for (const broken of [
      { ...target, assets: target.assets.slice(1) },
      { ...target, assets: [...target.assets, target.assets[0]] },
      { ...target, draft: true },
      { ...target, prerelease: true },
    ]) {
      const check = fixture(target.tag_name, [target]);
      check.responses.set(`/releases/tags/${target.tag_name}`, broken);
      await expect(check.run()).rejects.toThrow();
    }
    const conflict = fixture(target.tag_name, [target]);
    conflict.responses.set(`/releases/tags/${target.tag_name}`, target);
    conflict.responses.set('/releases/assets/6', { version: '2.3.10', commit: 'c'.repeat(40) });
    await expect(conflict.run()).rejects.toThrow('metadata does not match');
    const archive = fixture(target.tag_name, [release('v2.3.10'), release('v2.3.9')]);
    archive.responses.set(`/releases/tags/${target.tag_name}`, target);
    await expect(archive.run()).rejects.toThrow('maintainer review');
  });

  it.each(['v2.3', 'v2.03.10', 'v2.3.10-beta', 'v2.3.10\n', 'latest'])(
    'refuses malformed target and public versions: %s', async (tag) => {
      await expect(fixture(tag).run()).rejects.toThrow();
      await expect(fixture('v2.3.10', [release(tag)]).run()).rejects.toThrow();
    },
  );

  it('fails closed on malformed, unavailable and contradictory API state', async () => {
    for (const state of [null, {}, new Error('network failure'), new Error('HTTP 403')]) {
      const check = fixture();
      check.responses.set('/releases?per_page=100&page=1', state);
      await expect(check.run()).rejects.toThrow();
    }
    for (const latest of [null, {}, release('v2.3.8'), new Error('HTTP 500')]) {
      const check = fixture('v2.3.10', [release('v2.3.9')]);
      check.responses.set('/releases/latest', latest);
      await expect(check.run()).rejects.toThrow();
    }
    const conflict = fixture();
    conflict.responses.set('/releases/latest', release('v2.3.9'));
    await expect(conflict.run()).rejects.toThrow('First-release state');
    const changed = fixture('v2.3.10', [release('v2.3.10')]);
    await expect(changed.run()).rejects.toThrow('state changed');
  });

  it('checks later release-history pages instead of assuming the first page is complete', async () => {
    const check = fixture('v2.3.10', Array.from({ length: 100 }, () => ({ draft: true, prerelease: false })));
    check.responses.set('/releases?per_page=100&page=2', [release('v2.3.11')]);
    check.responses.set('/releases/latest', release('v2.3.11'));
    await expect(check.run()).rejects.toThrow('Historical publication');
    check.responses.set('/releases?per_page=100&page=2', new Error('page fetch failure'));
    await expect(check.run()).rejects.toThrow('page fetch failure');
  });

  it('revalidates workflow, tag, manifest and bundle source before reading public state', async () => {
    for (const [key, value] of [
      ['rev-parse HEAD', sha],
      ['rev-parse --verify v2.3.10^{commit}', workflowSha],
      [`show ${sha}:package.json`, '{"version":"2.3.9"}'],
    ]) {
      const check = fixture();
      if (key === undefined || value === undefined) throw new Error('Invalid test input');
      check.gitResponses.set(key, value);
      await expect(check.run()).rejects.toThrow();
      expect(check.calls.some((call) => call.startsWith('api '))).toBe(false);
    }
    const check = fixture();
    check.metadata.commit = workflowSha;
    await expect(check.run()).rejects.toThrow('metadata does not match');
  });

  it('places live validation after the shared writer lock and before the only publication action', () => {
    const workflow = readFileSync(resolve(import.meta.dirname, '../../../.github/workflows/release.yaml'), 'utf8');
    const publish = workflow.slice(workflow.indexOf('\n  publish:'));
    expect(publish).toContain('group: xcom-release-publication');
    expect(publish).toContain('cancel-in-progress: false');
    expect(publish.indexOf('ref: ${{ github.sha }}')).toBeLessThan(publish.indexOf('node scripts/release/verify-publication.ts'));
    expect(publish.indexOf('node scripts/release/verify-publication.ts')).toBeLessThan(publish.indexOf('uses: softprops/action-gh-release@'));
    expect(publish).toContain("if: steps.publication.outputs.publish == 'true'");
    expect(publish).toContain('make_latest: ${{ steps.publication.outputs.make-latest }}');
    expect(publish).toContain('overwrite_files: false');
    expect(publish).toContain('needs: [provenance, quality, unit, e2e, duplication, mutation, build]');
  });
});
