#!/usr/bin/env node
/**
 * Phase 327: Apply setupGlobalTestIsolation to all test files.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { globSync } from 'glob';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.join(__dirname, '..');
const testDir = path.join(projectRoot, 'test');

const EXCLUDE_PATTERNS = ['**/archive/**', '**/*.skip.test.ts', '**/temp/**'];

const testFiles = globSync(`${testDir}/**/*.test.ts`, {
  ignore: EXCLUDE_PATTERNS.map(pattern => `${testDir}/${pattern}`),
});

console.log(`📋 Total test files: ${testFiles.length}`);

let isolatedCount = 0;
let notIsolatedCount = 0;
const filesToProcess: string[] = [];

for (const file of testFiles) {
  if (!fs.statSync(file).isFile()) {
    continue;
  }

  const content = fs.readFileSync(file, 'utf-8');

  if (content.includes('setupGlobalTestIsolation')) {
    isolatedCount += 1;
  } else {
    notIsolatedCount += 1;
    filesToProcess.push(file);
  }
}

console.log(`\n✅ Already isolated: ${isolatedCount}`);
console.log(`⚠️  Not yet isolated: ${notIsolatedCount}\n`);

if (filesToProcess.length === 0) {
  console.log('✅ All test files already have isolation applied!');
  process.exit(0);
}

console.log('📝 Sample files needing isolation (first 10):');
filesToProcess.slice(0, 10).forEach((file, index) => {
  const relPath = path.relative(projectRoot, file);
  console.log(`  ${index + 1}. ${relPath}`);
});

if (filesToProcess.length > 10) {
  console.log(`  ... and ${filesToProcess.length - 10} more\n`);
}

console.log('📊 Summary:');
console.log(
  `  - Isolation applied: ${isolatedCount}/${testFiles.length} (${((isolatedCount / testFiles.length) * 100).toFixed(1)}%)`
);
console.log(`  - Isolation needed: ${notIsolatedCount}/${testFiles.length}`);

const categories: Record<string, string[]> = {};
filesToProcess.forEach(file => {
  const relPath = path.relative(testDir, file);
  const parts = relPath.split(path.sep);
  const category = parts[0] || 'root';

  if (!categories[category]) {
    categories[category] = [];
  }
  categories[category].push(file);
});

console.log('\n📁 Files needing isolation by category:');
Object.entries(categories).forEach(([category, files]) => {
  console.log(`  ${category}: ${files.length}`);
});

const args = process.argv.slice(2);
if (args.includes('--apply')) {
  console.log('\n🚀 Applying isolation pattern...');
  applyIsolation(filesToProcess);
} else {
  console.log('\n💡 To apply: node scripts/apply-test-isolation.ts --apply');
}

function applyIsolation(files: string[]): void {
  let successCount = 0;
  let errorCount = 0;
  const errors: string[] = [];

  for (const file of files) {
    try {
      let content = fs.readFileSync(file, 'utf-8');

      if (content.includes('setupGlobalTestIsolation')) {
        continue;
      }

      const importMatch = content.match(/^(import[\s\S]*?from\s+['"][^'"]+['"]\s*;?)\n/m);
      if (!importMatch || importMatch.index === undefined) {
        errors.push(`${file}: No valid import statement found`);
        errorCount += 1;
        continue;
      }

      const fileDir = path.dirname(file);
      const testRootPath = path.join(projectRoot, 'test');
      const depth = path.relative(testRootPath, fileDir).split(path.sep).filter(Boolean).length;
      const relativePath =
        depth > 0
          ? `${Array(depth).fill('..').join(path.sep)}/shared/global-cleanup-hooks`
          : './shared/global-cleanup-hooks';

      const importLine = `import { setupGlobalTestIsolation } from '${relativePath}';\n`;
      const insertPosition = importMatch.index + importMatch[0].length;

      const describeMatch = content.match(/describe\s*\(\s*['"`]/);
      if (!describeMatch || describeMatch.index === undefined) {
        errors.push(`${file}: describe block not found`);
        errorCount += 1;
        continue;
      }

      const describeBlockStart = describeMatch.index + describeMatch[0].length;
      const describeOpenBrace = content.indexOf('{', describeBlockStart);

      if (describeOpenBrace === -1) {
        errors.push(`${file}: Opening brace { of describe block not found`);
        errorCount += 1;
        continue;
      }

      const insertAfterBrace = content.indexOf('\n', describeOpenBrace) + 1;
      const setupLine = '  setupGlobalTestIsolation();\n\n';

      const newContent =
        content.slice(0, insertPosition) +
        importLine +
        content.slice(insertPosition, insertAfterBrace) +
        setupLine +
        content.slice(insertAfterBrace);

      fs.writeFileSync(file, newContent, 'utf-8');
      successCount += 1;

      const relPath = path.relative(projectRoot, file);
      console.log(`  ✅ ${relPath}`);
    } catch (error) {
      errorCount += 1;
      const err = error as Error;
      errors.push(`${file}: ${err.message}`);
    }
  }

  console.log(`\n✅ Complete: ${successCount}/${files.length} files processed`);

  if (errors.length > 0) {
    console.log(`\n⚠️  Errors (${errorCount}):`);
    errors.forEach(message => console.log(`  - ${message}`));
  }

  if (successCount > 0) {
    console.log('\n🔍 Next: Run npm run test:fast to verify');
  }
}
