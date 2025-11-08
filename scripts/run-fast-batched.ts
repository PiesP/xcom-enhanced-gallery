#!/usr/bin/env node
/**
 * Run the 'fast' Vitest project in small batches to avoid IPC/EPIPE under Node 22.
 * - Executes several include globs sequentially
 * - Aggregates exit code
 */
import { spawnSync } from 'node:child_process';

const vitestBaseArgs: string[] = ['vitest', '--project', 'fast', 'run', '--reporter=dot'];

// Use sharding to split the fast project into N sequential shards
const SHARDS = 4;
const shards: string[] = Array.from({ length: SHARDS }, (_, index) => `${index + 1}/${SHARDS}`);

function run(command: string, args: string[]): boolean {
  const result = spawnSync(command, args, { stdio: 'inherit', shell: true, env: process.env });
  return result.status === 0;
}

async function main(): Promise<void> {
  console.log('🧪 Running fast tests in batches...');
  let exitCode = 0;
  for (const shard of shards) {
    console.log(`\n▶️  Shard: ${shard}`);
    const ok = run('npx', [...vitestBaseArgs, '--shard', shard]);
    if (!ok) exitCode = 1; // keep going to finish all batches
  }

  // Always cleanup workers
  run('npm', ['run', 'test:cleanup']);

  if (exitCode === 0) {
    console.log('\n✅ All fast test batches passed');
  } else {
    console.log('\n❌ Some fast test batches failed');
  }
  process.exit(exitCode);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
