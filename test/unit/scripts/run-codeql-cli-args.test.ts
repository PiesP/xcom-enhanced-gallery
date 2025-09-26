import { execFile } from 'node:child_process';
import { resolve } from 'node:path';
import { execPath, cwd as getCwd } from 'node:process';
import { promisify } from 'node:util';

import { describe, expect, it } from 'vitest';

const execFileAsync = promisify(execFile);
const scriptPath = resolve(getCwd(), 'scripts/run-codeql.mjs');

describe('run-codeql.mjs CLI argument parsing', () => {
  it('accepts space separated values for --codeql-path in dry-run mode', async () => {
    const { stdout, stderr } = await execFileAsync(
      execPath,
      [scriptPath, '--dry-run', '--codeql-path', 'codeql'],
      { encoding: 'utf8' }
    );

    expect(stderr).toBe('');
    expect(stdout).toContain('DRY-RUN');
  });

  it('continues to support equals style values for --codeql-path', async () => {
    const { stdout, stderr } = await execFileAsync(
      execPath,
      [scriptPath, '--dry-run', '--codeql-path=codeql'],
      { encoding: 'utf8' }
    );

    expect(stderr).toBe('');
    expect(stdout).toContain('DRY-RUN');
  });
});
