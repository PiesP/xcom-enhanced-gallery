import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const root = resolve(import.meta.dirname, '../../..');
const workflow = readFileSync(
  resolve(root, '.github/workflows/update-browser-core.yaml'),
  'utf8'
);

describe('browser-core update automation', () => {
  it('keeps revision and pull-request provenance checks fail closed', () => {
    expect(workflow).toContain('^[0-9a-f]{40}$');
    expect(workflow).toContain('merge-base --is-ancestor "$CORE_SHA" origin/master');
    expect(workflow).toContain('.isCrossRepository == false');
    expect(workflow).toContain('.headRepository.nameWithOwner');
    expect(workflow).toContain('--force-with-lease="refs/heads/$BRANCH:$REMOTE_BRANCH_SHA"');
    expect(workflow).toContain('CHANGED_FILES[0]}" != "packages/core"');
  });

  it('binds approval and auto-merge to the generated head commit', () => {
    const expectedHead = workflow.indexOf('EXPECTED_HEAD_SHA="$(git rev-parse HEAD)"');
    const liveHead = workflow.indexOf('--json headRefOid');
    const approval = workflow.indexOf('-f commit_id="$EXPECTED_HEAD_SHA"');
    const merge = workflow.indexOf('--match-head-commit "$EXPECTED_HEAD_SHA"');

    expect(expectedHead).toBeGreaterThan(-1);
    expect(liveHead).toBeGreaterThan(expectedHead);
    expect(approval).toBeGreaterThan(liveHead);
    expect(merge).toBeGreaterThan(approval);
    expect(workflow).toContain('GH_TOKEN="$AUTO_MERGE_TOKEN" gh pr merge');
  });

  it('avoids redundant core-only and no-open-PR push work', () => {
    expect(workflow).toContain('paths-ignore:\n      - packages/core');
    expect(workflow).toContain('"$GITHUB_EVENT_NAME" == "push" && -z "$OPEN_PR"');
    expect(workflow).toContain('gh workflow run "🏗️ CI"');
    expect(workflow).toContain('gh workflow run "🔒 Security Scanning"');
  });
});
