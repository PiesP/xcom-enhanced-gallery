#!/usr/bin/env node

/**
 * Project Maintenance Checker
 *
 * Performs regular health checks on the project:
 * - Identifies backup/temp directories that should be cleaned
 * - Checks document sizes for potential simplification
 * - Scans for security vulnerabilities and unused dependencies
 * - Validates build size against budget
 * - Verifies Git state (staged changes, untracked files)
 * - Reports on infrastructure health
 *
 * @usage
 *   node maintenance-check.js
 *
 * @output
 *   Structured report with ✅ (OK), ⚠️ (needs action), 💡 (recommendations)
 *   Generated as part of 'npm run maintenance:check'
 *
 * @context
 *   Part of project end-of-work protocol (also run: validate & build)
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
  console.log('\n📁 백업/임시 디렉터리 검사...');
  const patterns = ['backup', 'tmp', 'old', 'deprecated'];
  // 의도적으로 무시할 디렉터리 (docs/archive, docs/temp, scripts/temp는 정상)
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

        // 의도된 디렉터리는 건너뛰기
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
    console.log('⚠️  발견된 백업/임시 디렉터리:');
    found.forEach(({ path, files }) => {
      console.log(`   - ${path.replace(ROOT, '.')} (${files}개 파일)`);
    });
    console.log('\n💡 제거 명령:');
    found.forEach(({ path }) => {
      console.log(`   Remove-Item -Recurse -Force "${path.replace(ROOT + '\\', '')}"`);
    });
  } else {
    console.log('✅ 백업/임시 디렉터리 없음');
  }

  return found;
}

/**
 * Checks for large documentation files that may need simplification
 *
 * @returns {Array<{name: string, lines: number, path: string}>} Documents over 500 lines
 */
function checkOldDocuments() {
  console.log('\n📄 문서 최신성 검사...');
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
    console.log('⚠️  500줄 이상의 큰 문서:');
    large.forEach(d => {
      console.log(`   - ${d.name} (${d.lines}줄) - 간소화 검토 권장`);
    });
  } else {
    console.log('✅ 모든 문서가 적절한 크기');
  }

  return large;
}

/**
 * Checks for security vulnerabilities and unused dependencies
 *
 * @returns {void}
 */
function checkUnusedDependencies() {
  console.log('\n📦 의존성 검사...');

  try {
    console.log('   npm audit 실행 중...');
    execSync('npm audit --audit-level=moderate', {
      encoding: 'utf8',
      stdio: 'pipe',
    });
    console.log('✅ 보안 취약점 없음');
  } catch (err) {
    console.log('⚠️  보안 취약점 발견:');
    console.log(err.stdout || err.message);
  }

  try {
    console.log('   사용되지 않는 의존성 검사 중...');
    execSync('npx depcheck --skip-missing', {
      encoding: 'utf8',
      stdio: 'inherit',
    });
  } catch {
    // depcheck가 없으면 설치 제안
    console.log('💡 depcheck를 설치하면 더 상세한 검사 가능: npx depcheck');
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
      console.log('⚠️  추적되지 않는 파일:');
      untracked.slice(0, 10).forEach(f => console.log(`   - ${f}`));
      if (untracked.length > 10) {
        console.log(`   ... 그 외 ${untracked.length - 10}개`);
      }
    } else {
      console.log('✅ 추적되지 않는 파일 없음');
    }
  } catch {
    console.log('⚠️  Git 상태 확인 실패');
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
