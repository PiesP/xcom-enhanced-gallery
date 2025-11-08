#!/usr/bin/env node

/**
 * Phase 327: Apply setupGlobalTestIsolation to all test files
 *
 * @description Bulk apply setupGlobalTestIsolation() pattern to all test files
 * @usage node scripts/apply-test-isolation.js [--apply]
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { globSync } from 'glob';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.join(__dirname, '..');
const testDir = path.join(projectRoot, 'test');

// Exclude patterns
const EXCLUDE_PATTERNS = ['**/archive/**', '**/*.skip.test.ts', '**/temp/**'];

// Get test file list
const testFiles = globSync(`${testDir}/**/*.test.ts`, {
  ignore: EXCLUDE_PATTERNS.map(p => `${testDir}/${p}`),
});

console.log(`📋 Total test files: ${testFiles.length}`);

// Analysis results
let isolatedCount = 0;
let notIsolatedCount = 0;
const filesToProcess = [];

for (const file of testFiles) {
  // Skip directories
  if (!fs.statSync(file).isFile()) {
    continue;
  }

  const content = fs.readFileSync(file, 'utf-8');

  if (content.includes('setupGlobalTestIsolation')) {
    isolatedCount++;
  } else {
    notIsolatedCount++;
    filesToProcess.push(file);
  }
}

console.log(`
✅ Already isolated: ${isolatedCount}
⚠️  Not yet isolated: ${notIsolatedCount}
`);

if (filesToProcess.length === 0) {
  console.log('✅ All test files already have isolation applied!');
  process.exit(0);
}

// Show sample of first 10 files
console.log('📝 Sample of files needing isolation (first 10):');
filesToProcess.slice(0, 10).forEach((file, idx) => {
  const relPath = path.relative(projectRoot, file);
  console.log(`  ${idx + 1}. ${relPath}`);
});

if (filesToProcess.length > 10) {
  console.log(`  ... and ${filesToProcess.length - 10} more\n`);
}

// Statistics
console.log('📊 Summary:');
console.log(
  `  - Isolation applied: ${isolatedCount}/${testFiles.length} (${((isolatedCount / testFiles.length) * 100).toFixed(1)}%)`
);
console.log(`  - Isolation needed: ${notIsolatedCount}/${testFiles.length}`);

// Category-based analysis
const categories = {};
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
Object.entries(categories).forEach(([cat, files]) => {
  console.log(`  ${cat}: ${files.length}`);
});

// Check if apply flag is set
const args = process.argv.slice(2);
if (args.includes('--apply')) {
  console.log('\n🚀 Starting isolation pattern application...');
  applyIsolation(filesToProcess);
} else {
  console.log('\n💡 To apply: node scripts/apply-test-isolation.js --apply');
}

function applyIsolation(files) {
  let successCount = 0;
  let errorCount = 0;
  const errors = [];

  for (const file of files) {
    try {
      let content = fs.readFileSync(file, 'utf-8');

      // Skip if already applied
      if (content.includes('setupGlobalTestIsolation')) {
        continue;
      }

      // Identify import section
      const importMatch = content.match(/^(import[\s\S]*?from\s+['"][^'"]+['"]\s*;?)\n/m);
      if (!importMatch) {
        errors.push(`${file}: No valid import statement found`);
        errorCount++;
        continue;
      }

      // Calculate relative path based on file depth
      const fileDir = path.dirname(file);
      const testRootPath = path.join(projectRoot, 'test');
      const depth = path.relative(testRootPath, fileDir).split(path.sep).length;
      const relativePath =
        depth > 0
          ? `${Array(depth).fill('..').join(path.sep)}/shared/global-cleanup-hooks`
          : './shared/global-cleanup-hooks';

      // Add import statement
      const importLine = `import { setupGlobalTestIsolation } from '${relativePath}';\n`;
      const insertPosition = importMatch.index + importMatch[0].length;

      // Identify describe block
      const describeMatch = content.match(/describe\s*\(\s*['"`]/);
      if (!describeMatch) {
        errors.push(`${file}: describe block not found`);
        errorCount++;
        continue;
      }

      // Find opening brace of describe block
      const describeBlockStart = describeMatch.index + describeMatch[0].length;
      const describeOpenBrace = content.indexOf('{', describeBlockStart);

      if (describeOpenBrace === -1) {
        errors.push(`${file}: Opening brace { of describe block not found`);
        errorCount++;
        continue;
      }

      // Find insertion point after describe opening brace
      const insertAfterBrace = content.indexOf('\n', describeOpenBrace) + 1;
      const setupLine = '  setupGlobalTestIsolation();\n\n';

      // Build final content
      let newContent =
        content.slice(0, insertPosition) +
        importLine +
        content.slice(insertPosition, insertAfterBrace) +
        setupLine +
        content.slice(insertAfterBrace);

      // Write file
      fs.writeFileSync(file, newContent, 'utf-8');
      successCount++;

      const relPath = path.relative(projectRoot, file);
      console.log(`  ✅ ${relPath}`);
    } catch (error) {
      errorCount++;
      errors.push(`${file}: ${error.message}`);
    }
  }

  console.log(`\n✅ Complete: ${successCount}/${files.length} files processed`);

  if (errors.length > 0) {
    console.log(`\n⚠️  Errors (${errorCount}):`);
    errors.forEach(err => console.log(`  - ${err}`));
  }

  if (successCount > 0) {
    console.log('\n🔍 Next: Run npm run test:fast to verify');
  }
}
