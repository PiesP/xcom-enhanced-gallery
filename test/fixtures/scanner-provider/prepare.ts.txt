import {
  appendFileSync,
  chmodSync,
  closeSync,
  constants,
  fstatSync,
  mkdtempSync,
  openSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

function requiredEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is required`);
  return value;
}

export function main(args: readonly string[]): number {
  let destination: string | undefined;
  try {
    if (args.length !== 0) throw new Error('Expected no arguments');
    const runnerTemp = requiredEnv('RUNNER_TEMP');
    const githubOutput = requiredEnv('GITHUB_OUTPUT');
    const source = join(
      dirname(fileURLToPath(import.meta.url)),
      '..',
      '..',
      'security',
      'scanner-pins.ts'
    );
    destination = mkdtempSync(join(runnerTemp, 'scanner-pin-helper-'));
    chmodSync(destination, 0o700);
    const input = openSync(source, constants.O_RDONLY | constants.O_NOFOLLOW);
    let bytes: Buffer;
    try {
      if (!fstatSync(input).isFile())
        throw new Error('Provider scanner pin source is not a regular file');
      bytes = readFileSync(input);
    } finally {
      closeSync(input);
    }
    const helper = join(destination, 'scanner-pins.ts');
    const output = openSync(helper, 'wx', 0o600);
    try {
      writeFileSync(output, bytes);
    } finally {
      closeSync(output);
    }
    chmodSync(helper, 0o600);
    appendFileSync(githubOutput, `helper-path=${helper}\n`);
    destination = undefined; // Success transfers temporary-directory ownership to the caller.
    return 0;
  } catch (error) {
    console.error(
      `prepare-scanner-pins: ${error instanceof Error ? error.message : String(error)}`
    );
    return 1;
  } finally {
    if (destination !== undefined) rmSync(destination, { recursive: true, force: true });
  }
}

if (import.meta.main) process.exitCode = main(process.argv.slice(2));
