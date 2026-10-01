import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const root = resolve(import.meta.dirname, '../../..');
const workflow = readFileSync(
  resolve(root, '.github/workflows/update-browser-core.yaml'),
  'utf8'
);
const prepare = workflow.split('      - name: Prepare browser-core update\n')[1]?.split('      - name: Classify browser-core consumer impact\n')[0] ?? '';
const publish = workflow.split('      - name: Publish browser-core update\n')[1] ?? '';

describe('browser-core update automation', () => {
  it('keeps revision and pull-request provenance checks fail closed', () => {
    expect(prepare).toContain('^[0-9a-f]{40}$');
    expect(prepare).toContain('merge-base --is-ancestor "$CORE_SHA" origin/master');
    expect(prepare).toContain(
      'if git -C packages/core cat-file -e "$CURRENT_CORE_SHA^{commit}" \\\n' +
        '            && ! git -C packages/core merge-base --is-ancestor "$CURRENT_CORE_SHA" "$CORE_SHA"; then'
    );
    expect(prepare).toContain('browser-core update would downgrade or diverge');
    expect(prepare).toContain('.isCrossRepository == false');
    expect(prepare).toContain('.headRepository.nameWithOwner');
    expect(publish).toContain('--force-with-lease="refs/heads/$BRANCH:$REMOTE_BRANCH_SHA"');
    expect(publish).toContain('CHANGED_FILES[0]}" != "packages/core"');
  });

  it('hands the exact generated head to manual review without auto-merge', () => {
    const expectedHead = publish.indexOf('EXPECTED_HEAD_SHA="$(git rev-parse HEAD)"');
    const liveHead = publish.indexOf('--json headRefOid');
    const handoff = publish.indexOf('PR head changed before handoff');

    expect(expectedHead).toBeGreaterThan(-1);
    expect(liveHead).toBeGreaterThan(expectedHead);
    expect(handoff).toBeGreaterThan(liveHead);
    expect(workflow).toContain('review the exact head');
    expect(publish).toContain('Optional manual diagnostics never satisfy the pull-request checks');
    expect(workflow).toContain('pull-request CI and security workflows provide the required checks');
    expect(workflow).toContain('GitHub may hold their initial runs for approval');
    expect(workflow).not.toContain('AUTO_MERGE_TOKEN');
    expect(workflow).not.toContain('gh pr merge');
    expect(workflow).not.toContain('event=APPROVE');
  });

  it('avoids redundant core-only and no-open-PR push work', () => {
    expect(workflow).toContain('paths-ignore:\n      - packages/core');
    expect(prepare).toContain('"$GITHUB_EVENT_NAME" == "push" && -z "$OPEN_PR"');
    expect(prepare.indexOf('ready=false')).toBeLessThan(prepare.indexOf('git clone'));
    expect(workflow.match(/if: steps\.prepare\.outputs\.ready == 'true'/g)).toHaveLength(2);
  });

  it('classifies the existing clone before any gitlink or remote mutation', () => {
    expect(prepare).toContain('git clone --filter=blob:none --no-checkout');
    expect(prepare).toContain('printf \'base=%s\\n\' "$CURRENT_CORE_SHA"');
    expect(prepare).toContain('printf \'head=%s\\n\' "$CORE_SHA"');
    expect(workflow).toContain('uses: PiesP/browser-core/automation/actions/consumer-impact@49969d6847f1a7c5130304d4aa25455fdd87e4eb');
    expect(workflow).toContain('base-sha: ${{ steps.prepare.outputs.base }}');
    expect(workflow).toContain('head-sha: ${{ steps.prepare.outputs.head }}');
    expect(publish.indexOf('if [[ "$CONSUMER_IMPACT" == "false" ]]')).toBeLessThan(
      publish.indexOf('git -C packages/core checkout --detach "$CORE_SHA"')
    );
  });

  it('protects dry runs and makes manual diagnostics opt-in', () => {
    expect(workflow).toContain('dry_run:\n        description: Classify the live core revision without remote writes\n        required: false\n        default: false');
    expect(workflow).toContain('preflight:\n        description: Run manual CI and security diagnostics after publishing\n        required: false\n        default: false');
    expect(publish).toContain('DRY_RUN: ${{ inputs.dry_run }}');
    expect(publish).toContain('CONSUMER_IMPACT: ${{ steps.impact.outputs.impact }}');
    expect(publish).toContain('>> "$GITHUB_STEP_SUMMARY"');
    expect(publish).toMatch(/if \[\[ "\$CONSUMER_IMPACT" == "false" \]\];[\s\S]*if \[\[ "\$DRY_RUN" == "true" \]\];[\s\S]*else\s+gh pr close/);
    expect(publish).toMatch(/if git diff --quiet -- packages\/core; then[\s\S]*if \[\[ "\$DRY_RUN" == "true" \]\];[\s\S]*else\s+gh pr close/);
    const dryRunExit = publish.indexOf('echo "Dry run: would update the packages/core gitlink');
    expect(dryRunExit).toBeLessThan(publish.indexOf('git add packages/core'));
    expect(dryRunExit).toBeLessThan(publish.indexOf('git push --set-upstream'));
    expect(dryRunExit).toBeLessThan(publish.indexOf('gh pr edit'));
    expect(dryRunExit).toBeLessThan(publish.indexOf('gh pr create'));
    expect(publish).toMatch(/if \[\[ "\$PREFLIGHT" == "true" \]\];[\s\S]*gh workflow run "🏗️ CI"[\s\S]*gh workflow run "🔒 Security Scanning"/);
    expect(publish.indexOf('if [[ "$PREFLIGHT" == "true" ]]')).toBeGreaterThan(
      publish.indexOf('PR head changed before handoff')
    );
    expect(publish).toContain('|| echo "::warning::Optional CI preflight dispatch failed"');
    expect(publish).toContain('|| echo "::warning::Optional security preflight dispatch failed"');
  });
});
