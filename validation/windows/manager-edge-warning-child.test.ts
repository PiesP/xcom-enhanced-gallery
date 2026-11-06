// SPDX-License-Identifier: MIT
// Copyright (c) 2026 PiesP

import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, it } from 'vitest';

const helper = fileURLToPath(new URL('./manager-edge-warning-window.ps1', import.meta.url));
const shell = process.platform === 'win32' ? 'powershell.exe' : 'pwsh';

function runPredicateCases(): Array<{ name: string; allowed: boolean }> {
  const path = helper.replaceAll("'", "''");
  const command = `
$tokens = $null
$errors = $null
$ast = [System.Management.Automation.Language.Parser]::ParseFile('${path}', [ref]$tokens, [ref]$errors)
if ($errors.Count) { throw 'Warning helper parse failed' }
$node = $ast.Find({ param($item)
  $item -is [System.Management.Automation.Language.FunctionDefinitionAst] -and
  $item.Name -eq 'Test-OwnedChildPane'
}, $true)
if ($null -eq $node) { throw 'Owned child predicate missing' }
. ([scriptblock]::Create($node.Extent.Text))
$profile = 'C:\\Users\\TestUser\\AppData\\Local\\Temp\\xeg-task-profile'
$exe = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe'
$base = @{
  depth = 1; name = ''; controlType = 'ControlType.Pane'; hasChild = $false
  processId = 13880; browserPid = 8508; nativeWindowHandle = 8258866
  windowPid = 13880; insideWarning = $true; parentPid = 8508
  sessionId = 2; browserSessionId = 2; executablePath = $exe
  browserExecutablePath = $exe; creationUtcTicks = '639295543065337870'
  browserCreationUtcTicks = '639295543064094450'
  commandLine = 'msedge.exe --type=renderer --user-data-dir="' + $profile + '"'
  profile = $profile
}
$cases = @(
  @{ name = 'owned empty leaf'; changes = @{} },
  @{ name = 'nested child'; changes = @{ depth = 2 } },
  @{ name = 'named child'; changes = @{ name = 'Later' } },
  @{ name = 'actionable child'; changes = @{ controlType = 'ControlType.Button' } },
  @{ name = 'nonleaf child'; changes = @{ hasChild = $true } },
  @{ name = 'missing pid'; changes = @{ processId = 0 } },
  @{ name = 'browser pid'; changes = @{ processId = 8508 } },
  @{ name = 'missing native window'; changes = @{ nativeWindowHandle = 0 } },
  @{ name = 'foreign native window'; changes = @{ windowPid = 999 } },
  @{ name = 'outside warning window'; changes = @{ insideWarning = $false } },
  @{ name = 'foreign parent'; changes = @{ parentPid = 1 } },
  @{ name = 'foreign session'; changes = @{ sessionId = 3 } },
  @{ name = 'different executable'; changes = @{ executablePath = 'C:\\Windows\\System32\\notepad.exe' } },
  @{ name = 'process predates browser'; changes = @{ creationUtcTicks = '639295543064094449' } },
  @{ name = 'invalid process birth'; changes = @{ creationUtcTicks = 'unknown' } },
  @{ name = 'different profile'; changes = @{ commandLine = 'msedge.exe --user-data-dir=C:\\other' } }
)
@($cases | ForEach-Object {
  $facts = $base.Clone()
  foreach ($key in $_.changes.Keys) { $facts[$key] = $_.changes[$key] }
  @{ name = $_.name; allowed = [bool](Test-OwnedChildPane -Facts $facts) }
}) | ConvertTo-Json -Depth 4 -Compress
`;
  const result = spawnSync(
    shell,
    ['-NoLogo', '-NoProfile', '-NonInteractive', '-Command', command],
    {
      encoding: 'utf8',
      timeout: 30_000,
    }
  );
  assert.equal(result.status, 0, result.stderr || result.stdout);
  return JSON.parse(result.stdout.trim()) as Array<{ name: string; allowed: boolean }>;
}

describe('Edge developer warning child pane ownership', () => {
  it('admits only a task-owned inert leaf inside the exact warning window', () => {
    const source = readFileSync(helper);
    assert.equal(
      source.every((byte) => byte < 128),
      true
    );
    const cases = runPredicateCases();
    assert.deepEqual(
      cases.map(({ name, allowed }) => [name, allowed]),
      [
        ['owned empty leaf', true],
        ['nested child', false],
        ['named child', false],
        ['actionable child', false],
        ['nonleaf child', false],
        ['missing pid', false],
        ['browser pid', false],
        ['missing native window', false],
        ['foreign native window', false],
        ['outside warning window', false],
        ['foreign parent', false],
        ['foreign session', false],
        ['different executable', false],
        ['process predates browser', false],
        ['invalid process birth', false],
        ['different profile', false],
      ]
    );
  });
});
