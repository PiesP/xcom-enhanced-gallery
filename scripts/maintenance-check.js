#!/usr/bin/env node

/**
 * Project Maintenance Checker (Local Environment Only)
 *
 * @description
 * Local-only script for comprehensive project health checks.
 * Performs regular maintenance audits and generates actionable reports.
 *
 * **Usage Context:**
 * - Local Development: End-of-work protocol checks
 * - Manual Execution: npm run maintenance:check
 *
 * **Why not in CI:**
 * - Focus on local cleanup recommendations (backup files, temp directories)
 * - CI workflows handle their own specific checks:
 *   - ci.yml: Build validation, tests, quality checks
 *   - security.yml: npm audit, license checks (weekly)
 * - Removed maintenance.yml workflow (2025-10-29) to enforce local-only principle
 *
 * **Checks Performed:**
 * - Backup/temp directory identification
 * - Document size analysis
 * - Build size budget validation
 * - Git state verification
 * - Infrastructure health reporting
 *
 * @usage
 *   node maintenance-check.js
 *   npm run maintenance:check
 *
 * @output
 *   Structured report with ✅ (OK), ⚠️ (needs action), 💡 (recommendations)
 *   Exit code: 0 (pass) or 1 (action required)
 */

import { readdirSync, statSync, readFileSync, existsSync } from 'node:fs';
import { resolve, join } from 'node:path';
import { execSync } from 'node:child_process';

const ROOT = resolve(process.cwd());

/**
 * Checks for backup/temporary directories that should be cleaned
 *
 * @returns {Array<{path: string, files: number}>} Found backup directories
 */
function checkBackupDirectories() {
  console.log('\n📁 Checking backup/temporary directories...');
  const patterns = ['backup', 'tmp', 'old', 'deprecated'];
  // Intentional directories to ignore (docs/archive, docs/temp, scripts/temp are normal)
  const ignorePaths = [
    join(ROOT, 'docs', 'archive'),
    join(ROOT, 'docs', 'temp'),
    join(ROOT, 'scripts', 'temp'),
  ];
  const found = [];

  function scan(dir) {
    try {
      const entries = readdirSync(dir);
      for (const entry of entries) {
        if (entry === 'node_modules' || entry === '.git') continue;
        const fullPath = join(dir, entry);

        // Skip intended directories
        if (ignorePaths.some(p => fullPath === p)) continue;

        const stat = statSync(fullPath);
        if (stat.isDirectory()) {
          if (patterns.some(p => entry.toLowerCase().includes(p))) {
            const files = readdirSync(fullPath, { recursive: true }).length;
            found.push({ path: fullPath, files });
          }
          scan(fullPath);
        }
      }
    } catch {
      // ignore permission errors
    }
  }

  scan(ROOT);

  if (found.length > 0) {
    console.log('⚠️  Found backup/temporary directories:');
    found.forEach(({ path, files }) => {
      console.log(`   - ${path.replace(ROOT, '.')} (${files} files)`);
    });
    console.log('\n💡 Removal command:');
    found.forEach(({ path }) => {
      console.log(`   Remove-Item -Recurse -Force "${path.replace(ROOT + '\\', '')}"`);
    });
  } else {
    console.log('✅ No backup/temporary directories found');
  }

  return found;
}

/**
 * Checks for large documentation files that may need simplification
 *
 * @returns {Array<{name: string, lines: number, path: string}>} Documents over 500 lines
 */
function checkOldDocuments() {
  console.log('\n📄 Checking document freshness...');
  const docsDir = resolve(ROOT, 'docs');
  if (!existsSync(docsDir)) return [];

  const docs = readdirSync(docsDir)
    .filter(f => f.endsWith('.md'))
    .map(f => {
      const path = join(docsDir, f);
      const content = readFileSync(path, 'utf8');
      const lines = content.split('\n').length;
      return { name: f, lines, path };
    })
    .sort((a, b) => b.lines - a.lines);

  const large = docs.filter(d => d.lines > 500);
  if (large.length > 0) {
    console.log('⚠️  Large documents (500+ lines):');
    large.forEach(d => {
      console.log(`   - ${d.name} (${d.lines} lines) - consider simplification review`);
    });
  } else {
    console.log('✅ All documents have appropriate size');
  }

  return large;
}

/**
 * Checks for security vulnerabilities and unused dependencies
 *
 * @returns {void}
 */
function checkUnusedDependencies() {
  console.log('\n📦 Checking dependencies...');

  // npm audit availability varies by environment; skip on non-Linux if needed
  try {
    console.log('   Running npm audit...');
    execSync('npm audit --audit-level=moderate', {
      encoding: 'utf8',
      stdio: 'pipe',
    });
    console.log('✅ No security vulnerabilities');
  } catch (err) {
    console.log('⚠️  Security vulnerabilities found:');
    console.log(err.stdout || err.message);
  }

  try {
    console.log('   Checking for unused dependencies...');
    execSync('npx depcheck --skip-missing', {
      encoding: 'utf8',
      stdio: 'inherit',
    });
  } catch {
    // If depcheck not installed, suggest installation
    console.log('💡 Install depcheck for more detailed checks: npx depcheck');
  }
}

/**
 * Checks production build size against budget
 *
 * @returns {void}
 */
function checkBuildSize() {
  console.log('\n📏 빌드 크기 검사...');
  const distDir = resolve(ROOT, 'dist');
  if (!existsSync(distDir)) {
    console.log('⚠️  빌드 파일 없음 (npm run build 실행 필요)');
    return;
  }

  const prodFile = join(distDir, 'xcom-enhanced-gallery.user.js');
  if (existsSync(prodFile)) {
    const stat = statSync(prodFile);
    const sizeKB = (stat.size / 1024).toFixed(2);
    const budget = 335; // KB (Phase 78 baseline + 10KB)
    const status = stat.size / 1024 <= budget ? '✅' : '⚠️';
    console.log(`${status} 프로덕션 빌드: ${sizeKB} KB (예산: ${budget} KB)`);
  }
}

/**
 * Checks Git repository status for untracked files
 *
 * @returns {void}
 */
function checkGitStatus() {
  console.log('\n🔍 Git 상태 검사...');

  try {
    const untracked = execSync('git ls-files --others --exclude-standard', {
      encoding: 'utf8',
    })
      .trim()
      .split('\n')
      .filter(Boolean);

    if (untracked.length > 0) {
      console.log('⚠️  Untracked files:');
      untracked.slice(0, 10).forEach(f => console.log(`   - ${f}`));
      if (untracked.length > 10) {
        console.log(`   ... and ${untracked.length - 10} more`);
      }
    } else {
      console.log('✅ No untracked files');
    }
  } catch {
    console.log('⚠️  Git status check failed (local Git not installed or permission issue)');
  }
}

/**
 * Generates comprehensive maintenance report
 *
 * @returns {void}
 */
function generateReport() {
  console.log('\n' + '='.repeat(60));
  console.log('🔧 프로젝트 유지보수 점검 리포트');
  console.log('='.repeat(60));

  const backups = checkBackupDirectories();
  const largeDocs = checkOldDocuments();
  checkUnusedDependencies();
  checkBuildSize();
  checkGitStatus();

  console.log('\n' + '='.repeat(60));
  console.log('📊 요약');
  console.log('='.repeat(60));

  const issues = [];
  if (backups.length > 0) issues.push(`백업 디렉터리: ${backups.length}개`);
  if (largeDocs.length > 0) issues.push(`큰 문서: ${largeDocs.length}개`);

  if (issues.length > 0) {
    console.log('⚠️  조치 필요 항목:');
    issues.forEach(i => console.log(`   - ${i}`));
  } else {
    console.log('✅ 모든 항목 정상');
  }

  console.log('\n💡 다음 명령으로 상세 정보 확인:');
  console.log('   - npm audit');
  console.log('   - npx depcheck');
  console.log('   - npm run test:coverage');
  console.log('');
}

// 스크립트 실행
try {
  generateReport();
} catch (error) {
  console.error('❌ 점검 실패:', error.message);
  process.exit(1);
}
