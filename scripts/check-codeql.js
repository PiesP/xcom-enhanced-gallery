#!/usr/bin/env node

/**
 * CodeQL 쿼리 실행 스크립트
 * CodeQL CLI가 설치되어 있으면 커스텀 쿼리를 실행하고, 없으면 안내 메시지 출력
 */

import { execSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = resolve(__dirname, '..');
const queriesDir = resolve(rootDir, 'codeql-custom-queries-javascript');

// CI 환경 감지
const isCI = process.env.CI === 'true' || process.env.GITHUB_ACTIONS === 'true';

// ANSI 색상 코드 (CI에서는 비활성화)
const colors = isCI
  ? {
      reset: '',
      bright: '',
      cyan: '',
      yellow: '',
      green: '',
      red: '',
    }
  : {
      reset: '\x1b[0m',
      bright: '\x1b[1m',
      cyan: '\x1b[36m',
      yellow: '\x1b[33m',
      green: '\x1b[32m',
      red: '\x1b[31m',
    };

/**
 * CodeQL CLI가 설치되어 있는지 확인
 */
function isCodeQLInstalled() {
  try {
    execSync('codeql version', { stdio: 'pipe' });
    return true;
  } catch {
    return false;
  }
}

/**
 * 안내 메시지 출력
 */
function printInfo() {
  if (isCI) {
    console.log('CodeQL check: Starting...');
    return;
  }
  console.log(`\n${colors.cyan}${colors.bright}ℹ️  CodeQL 커스텀 쿼리 검증${colors.reset}`);
  console.log(`${colors.cyan}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}\n`);
}

/**
 * CodeQL CLI 설치 안내
 */
function printInstallGuide() {
  if (isCI) {
    console.log('CodeQL CLI not installed. Skipping local checks (CI will run CodeQL separately).');
    return;
  }
  console.log(`${colors.yellow}⚠️  CodeQL CLI가 설치되어 있지 않습니다.${colors.reset}\n`);
  console.log(`${colors.bright}설치 방법:${colors.reset}`);
  console.log(
    `  1. GitHub CLI 사용: ${colors.cyan}gh extension install github/gh-codeql${colors.reset}`
  );
  console.log(
    `  2. 직접 다운로드: ${colors.cyan}https://github.com/github/codeql-cli-binaries/releases${colors.reset}`
  );
  console.log(`  3. 설치 후 PATH에 추가\n`);
  console.log(`${colors.bright}참고:${colors.reset}`);
  console.log(
    `  - CodeQL 쿼리는 ${colors.cyan}codeql-custom-queries-javascript/${colors.reset} 폴더에 있습니다.`
  );
  console.log(`  - CI에서는 GitHub Actions의 CodeQL 스캔이 자동으로 실행됩니다.\n`);
  console.log(
    `${colors.green}✓ validate 스크립트는 CodeQL 없이도 계속 진행됩니다.${colors.reset}\n`
  );
}

/**
 * CodeQL 쿼리 실행
 */
function runCodeQLQueries() {
  if (isCI) {
    console.log('CodeQL queries will be executed by GitHub Actions workflow.');
    return;
  }

  console.log(`${colors.bright}실행 중: CodeQL 커스텀 쿼리...${colors.reset}\n`);

  // 쿼리 파일 확인
  const queries = [
    'direct-vendor-imports.ql',
    'forbidden-touch-events.ql',
    'hardcoded-color-values.ql',
    'unsafe-download-pattern.ql',
  ];

  const existingQueries = queries.filter(q => existsSync(resolve(queriesDir, q)));

  if (existingQueries.length === 0) {
    console.log(`${colors.yellow}⚠️  실행 가능한 쿼리가 없습니다.${colors.reset}\n`);
    return;
  }

  console.log(`${colors.cyan}쿼리 목록:${colors.reset}`);
  existingQueries.forEach(q => console.log(`  - ${q}`));
  console.log('');

  // 실제 환경에서는 여기서 CodeQL 데이터베이스를 생성하고 쿼리를 실행
  // 현재는 안내 메시지만 출력
  console.log(`${colors.yellow}ℹ️  CodeQL 실행 기능은 개발 중입니다.${colors.reset}`);
  console.log(`${colors.cyan}현재는 GitHub Actions에서 자동으로 실행됩니다.${colors.reset}\n`);
}

/**
 * 메인 함수
 */
function main() {
  printInfo();

  if (!isCodeQLInstalled()) {
    printInstallGuide();
    process.exit(0); // validate 스크립트가 계속 진행되도록 성공 코드 반환
  }

  runCodeQLQueries();
}

main();
