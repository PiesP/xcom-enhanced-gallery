import { execSync } from 'node:child_process';
import { parseArgs } from 'node:util';
import { readdirSync, statSync } from 'node:fs';
import { join, resolve } from 'node:path';

console.log('Running unit tests batched...');

const { values } = parseArgs({
  args: process.argv.slice(2),
  options: {
    'batch-size': { type: 'string', default: '20' },
    'monitor-memory': { type: 'boolean' },
    retry: { type: 'string', default: '0' },
    verbose: { type: 'boolean' },
    'fail-fast': { type: 'boolean' },
  },
});

const batchSize = parseInt(values['batch-size'] as string, 10);
const retries = parseInt(values.retry as string, 10);
const failFast = values['fail-fast'];

// Helper to find test files
function findTestFiles(dir: string): string[] {
  let results: string[] = [];
  if (!statSync(dir).isDirectory()) return results;

  const list = readdirSync(dir);
  list.forEach(file => {
    const filePath = join(dir, file);
    const stat = statSync(filePath);
    if (stat && stat.isDirectory()) {
      if (file !== 'node_modules' && file !== 'dist' && file !== 'e2e' && file !== 'playwright') {
         results = results.concat(findTestFiles(filePath));
      }
    } else if (file.endsWith('.test.ts') || file.endsWith('.spec.ts')) {
      // Exclude e2e/browser tests if they are in specific folders
      if (!filePath.includes('/playwright/') && !filePath.includes('/e2e/')) {
          results.push(filePath);
      }
    }
  });
  return results;
}

const rootDir = process.cwd();
const testFiles = [
    ...findTestFiles(resolve(rootDir, 'src')),
    ...findTestFiles(resolve(rootDir, 'test/unit'))
];

console.log(`Found ${testFiles.length} test files.`);

// Chunk files
const batches: string[][] = [];
for (let i = 0; i < testFiles.length; i += batchSize) {
  batches.push(testFiles.slice(i, i + batchSize));
}

console.log(`Running in ${batches.length} batches (size: ${batchSize})...`);

let failed = false;

for (let i = 0; i < batches.length; i++) {
  const batch = batches[i];
  if (!batch || batch.length === 0) {
    console.log(`\nBatch ${i + 1}/${batches.length} is empty. Skipping.`);
    continue;
  }

  console.log(`\nBatch ${i + 1}/${batches.length} (${batch.length} files)...`);

  const cmd = `npx vitest run ${batch.map(f => `"${f}"`).join(' ')} --passWithNoTests`;

  try {
    execSync(cmd, { stdio: 'inherit' });
  } catch {
    console.error(`Batch ${i + 1} failed.`);
    if (retries > 0) {
        console.log(`Retrying batch ${i + 1} (${retries} attempts left)...`);
        // Simple retry logic could be added here if needed
    }
    failed = true;
    if (failFast) {
        console.error('Fail-fast enabled. Stopping.');
        process.exit(1);
    }
  }
}

if (failed) {
  console.error('Some batches failed.');
  process.exit(1);
}

console.log('All batches completed successfully.');
