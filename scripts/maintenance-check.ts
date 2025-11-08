#!/usr/bin/env node
/**
 * Project Maintenance Checker (Local Environment Only).
 */

import { readdirSync, statSync, readFileSync, existsSync } from 'node:fs';
import { resolve, join } from 'node:path';
import { execSync } from 'node:child_process';

const ROOT = resolve(process.cwd());

interface BackupDirectoryInfo {
  path: string;
  files: number;
}

interface DocumentInfo {
  name: string;
  lines: number;
  path: string;
}

function countFilesRecursive(directory: string): number {
  let count = 0;
  try {
    const entries = readdirSync(directory, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = join(directory, entry.name);
      if (entry.isDirectory()) {
        count += countFilesRecursive(fullPath);
      } else if (entry.isFile()) {
        count += 1;
      }
    }
  } catch {
    // Ignore permission errors
  }
  return count;
}

function checkBackupDirectories(): BackupDirectoryInfo[] {
  console.log('\n📁 Checking backup/temporary directories...');
  const patterns = ['backup', 'tmp', 'old', 'deprecated'];
  const ignorePaths = [
    join(ROOT, 'docs', 'archive'),
    join(ROOT, 'docs', 'temp'),
    join(ROOT, 'scripts', 'temp'),
  ];

  const found: BackupDirectoryInfo[] = [];

  const scan = (dir: string): void => {
    try {
      const entries = readdirSync(dir, { withFileTypes: true });
      for (const entry of entries) {
        if (entry.name === 'node_modules' || entry.name === '.git') continue;

        const fullPath = join(dir, entry.name);
        if (ignorePaths.includes(fullPath)) continue;

        if (entry.isDirectory()) {
          if (patterns.some(pattern => entry.name.toLowerCase().includes(pattern))) {
            const files = countFilesRecursive(fullPath);
            found.push({ path: fullPath, files });
          }
          scan(fullPath);
        }
      }
    } catch {
      // Ignore permission errors
    }
  };

  scan(ROOT);

  if (found.length > 0) {
    console.log('⚠️  Found backup/temporary directories:');
    found.forEach(({ path, files }) => {
      console.log(`   - ${path.replace(ROOT, '.')} (${files} files)`);
    });
    console.log('\n💡 Removal command suggestions:');
    found.forEach(({ path }) => {
      console.log(`   rm -rf "${path}"`);
    });
  } else {
    console.log('✅ No backup/temporary directories found');
  }

  return found;
}

function checkOldDocuments(): DocumentInfo[] {
  console.log('\n📄 Checking documentation size...');
  const docsDir = resolve(ROOT, 'docs');
  if (!existsSync(docsDir)) return [];

  const docs: DocumentInfo[] = readdirSync(docsDir)
    .filter(file => file.endsWith('.md'))
    .map(file => {
      const path = join(docsDir, file);
      const content = readFileSync(path, 'utf8');
      const lines = content.split('\n').length;
      return { name: file, lines, path };
    })
    .sort((a, b) => b.lines - a.lines);

  const large = docs.filter(doc => doc.lines > 500);
  if (large.length > 0) {
    console.log('⚠️  Large documents (500+ lines):');
    large.forEach(doc => {
      console.log(`   - ${doc.name} (${doc.lines} lines) — consider refactoring`);
    });
  } else {
    console.log('✅ All documents within expected size');
  }

  return large;
}

function checkUnusedDependencies(): void {
  console.log('\n📦 Checking dependencies...');

  try {
    console.log('   Running npm audit...');
    execSync('npm audit --audit-level=moderate', {
      encoding: 'utf8',
      stdio: 'pipe',
    });
    console.log('✅ No security vulnerabilities reported');
  } catch (error) {
    const err = error as { stdout?: string; message: string };
    console.log('⚠️  Security vulnerabilities reported:');
    console.log(err.stdout || err.message);
  }

  try {
    console.log('   Checking for unused dependencies...');
    execSync('npx depcheck --skip-missing', {
      encoding: 'utf8',
      stdio: 'inherit',
    });
  } catch {
    console.log('💡 Install depcheck for detailed analysis: npx depcheck');
  }
}

function checkBuildSize(): void {
  console.log('\n📏 Verifying build size...');
  const distDir = resolve(ROOT, 'dist');
  if (!existsSync(distDir)) {
    console.log('⚠️  Build outputs missing (run npm run build)');
    return;
  }

  const prodFile = join(distDir, 'xcom-enhanced-gallery.user.js');
  if (existsSync(prodFile)) {
    const stat = statSync(prodFile);
    const sizeKB = stat.size / 1024;
    const budget = 335; // KB (Phase 78 baseline + 10KB)
    const status = sizeKB <= budget ? '✅' : '⚠️';
    console.log(`${status} Production bundle: ${sizeKB.toFixed(2)} KB (budget: ${budget} KB)`);
  }
}

function checkGitStatus(): void {
  console.log('\n🔍 Checking Git status...');

  try {
    const untracked = execSync('git ls-files --others --exclude-standard', {
      encoding: 'utf8',
    })
      .trim()
      .split('\n')
      .filter(Boolean);

    if (untracked.length > 0) {
      console.log('⚠️  Untracked files:');
      untracked.slice(0, 10).forEach(file => console.log(`   - ${file}`));
      if (untracked.length > 10) {
        console.log(`   ... and ${untracked.length - 10} more`);
      }
    } else {
      console.log('✅ No untracked files');
    }
  } catch {
    console.log('⚠️  Git status check failed (ensure Git is installed)');
  }
}

function generateReport(): void {
  console.log('\n' + '='.repeat(60));
  console.log('🔧 Project Maintenance Report');
  console.log('='.repeat(60));

  const backups = checkBackupDirectories();
  const largeDocs = checkOldDocuments();
  checkUnusedDependencies();
  checkBuildSize();
  checkGitStatus();

  console.log('\n' + '='.repeat(60));
  console.log('📊 Summary');
  console.log('='.repeat(60));

  const issues: string[] = [];
  if (backups.length > 0) issues.push(`Backup directories: ${backups.length}`);
  if (largeDocs.length > 0) issues.push(`Large documents: ${largeDocs.length}`);

  if (issues.length > 0) {
    console.log('⚠️  Action items:');
    issues.forEach(issue => console.log(`   - ${issue}`));
  } else {
    console.log('✅ All checks passed');
  }

  console.log('\n💡 Recommended follow-up commands:');
  console.log('   - npm audit');
  console.log('   - npx depcheck');
  console.log('   - npm run test:coverage');
  console.log('');
}

try {
  generateReport();
} catch (error) {
  const err = error as Error;
  console.error('❌ Maintenance check failed:', err.message);
  process.exit(1);
}
