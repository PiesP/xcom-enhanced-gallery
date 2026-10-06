import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { appendFileSync, mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { isCliEntry, readPins } from './pinned-tools.ts';

function run(file: string, args: string[], env = process.env): void {
  const result = spawnSync(file, args, { env, stdio: 'inherit' });
  if (result.error) throw result.error;
  if (result.signal) throw new Error(`${file} terminated by ${result.signal}`);
  if (result.status !== 0) throw new Error(`${file} exited with status ${result.status}`);
}

export function main(args: readonly string[]): number {
  try {
    if (args.length !== 0) throw new Error('install-nose takes no arguments');
    const githubPath = process.env.GITHUB_PATH;
    const home = process.env.HOME;
    if (!githubPath) throw new Error('GITHUB_PATH is required');
    if (!home) throw new Error('HOME is required');
    const { nose } = readPins();
    const temporary = mkdtempSync(
      join(process.env.RUNNER_TEMP || process.env.TMPDIR || tmpdir(), 'nose-installer-')
    );
    try {
      const installer = join(temporary, 'nose-cli-installer.sh');
      run('curl', [
        '--fail',
        '--silent',
        '--show-error',
        '--location',
        '--proto',
        '=https',
        '--tlsv1.2',
        `https://github.com/corca-ai/nose/releases/download/v${nose.version}/nose-cli-installer.sh`,
        '--output',
        installer,
      ]);
      const actual = createHash('sha256').update(readFileSync(installer)).digest('hex');
      if (actual !== nose.installerSha256) throw new Error('Nose installer SHA-256 mismatch');
      const cleanEnv = { ...process.env };
      delete cleanEnv.GH_TOKEN;
      delete cleanEnv.GITHUB_TOKEN;
      delete cleanEnv.NOSE_CLI_GITHUB_TOKEN;
      run('sh', [installer], cleanEnv);
      appendFileSync(githubPath, `${join(home, '.cargo/bin')}\n`);
      return 0;
    } finally {
      rmSync(temporary, { recursive: true, force: true });
    }
  } catch (error) {
    console.error(`install-nose: ${error instanceof Error ? error.message : String(error)}`);
    return 1;
  }
}

if (isCliEntry(import.meta.url)) process.exitCode = main(process.argv.slice(2));
