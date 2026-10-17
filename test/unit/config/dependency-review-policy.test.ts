import { readdirSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { describe, expect, it } from 'vite-plus/test';

const root = resolve(import.meta.dirname, '../../..');
const dependabot = readFileSync(resolve(root, '.github/dependabot.yaml'), 'utf8');

describe('dependency review policy', () => {
  it('keeps npm and GitHub Actions updates assigned to the maintainer', () => {
    const updates = dependabot.split(/^ {2}- package-ecosystem: /m).slice(1);
    expect(updates).toHaveLength(2);
    for (const update of updates) {
      expect(update).toMatch(/^(?:"npm"|"github-actions")/);
      expect(update).toMatch(/^ {4}reviewers:\n {6}- "PiesP"$/m);
      expect(update).toMatch(/^ {4}cooldown:\n {6}default-days: 1$/m);
    }
  });

  it('grants no workflow or CI script automated PR approval or merge path', () => {
    const sources = ['.github/workflows', 'scripts/ci'].flatMap((directory) =>
      readdirSync(resolve(root, directory))
        .filter((name) =>
          directory === 'scripts/ci'
            ? name.endsWith('.ts') && !name.endsWith('.test.ts')
            : /\.ya?ml$/.test(name)
        )
        .map((name) => join(directory, name))
    );
    expect(sources.length).toBeGreaterThan(0);
    for (const source of sources) {
      const content = readFileSync(resolve(root, source), 'utf8');
      expect(content, source).not.toMatch(/pull_request_target:|dependabot\[bot\]/);
      expect(content, source).not.toMatch(
        /gh\s+pr\s+(?:merge|review)|event=APPROVE|\/pulls\/.*\/reviews|--auto\b/
      );
      if (source.startsWith('.github/workflows/') && /^\s{2}pull_request:\s*$/m.test(content)) {
        expect(content, source).not.toMatch(/(?:contents|pull-requests): write/);
      }
    }
  });
});
