#!/usr/bin/env node

/**
 * CodeQL Security Analysis Runner
 *
 * Executes standard CodeQL security-extended queries (same as CI).
 * In CI environments, skips local checks (GitHub Actions handles CodeQL separately).
 *
 * @usage
 *   node check-codeql.js [options]
 *
 * @options
 *   --json          Output results in JSON format
 *   --report        Generate markdown report (codeql-reports/)
 *   --force         Force database rebuild
 *   --verbose       Show detailed logging
 *   --quiet         Minimal output
 *   --help          Show this help message
 *
 * @environment
 *   CI, GITHUB_ACTIONS - Detects CI environment, skips local checks
 *   CODEQL_FORCE_REBUILD - Force database rebuild (default: incremental update)
 *
 * @tools (Priority order with auto-install)
 *   1. gh codeql (GitHub CLI extension) - highest priority
 *   2. gh (GitHub CLI) - auto-installs codeql extension if available
 *   3. codeql (CodeQL CLI direct install) - fallback
 *   4. None - graceful degradation with installation guide
 *
 * @output
 *   SARIF results in codeql-results/ directory
 *   Markdown reports in codeql-reports/ (if --report)
 *   Summary report to stdout
 *   Exit code: 0 (pass) or 1 (failures found)
 */

import { execSync } from 'node:child_process';
import { existsSync, readFileSync, writeFileSync, mkdirSync, statSync, readdirSync } from 'node:fs';
import { resolve, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = resolve(__dirname, '..');
const dbDir = resolve(rootDir, '.codeql-db');
const resultsDir = resolve(rootDir, 'codeql-results');
const reportsDir = resolve(rootDir, 'codeql-reports');

// 명령줄 옵션 파싱
const args = process.argv.slice(2);
const options = {
  json: args.includes('--json'),
  report: args.includes('--report'),
  force: args.includes('--force') || process.env.CODEQL_FORCE_REBUILD === 'true',
  verbose: args.includes('--verbose'),
  quiet: args.includes('--quiet'),
  help: args.includes('--help'),
};

// CI 환경 감지
const isCI = process.env.CI === 'true' || process.env.GITHUB_ACTIONS === 'true';

// 도구 감지 결과 캐싱 (성능 최적화)
let cachedCodeQLTool = null;

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
 * Detects available CodeQL tool with priority handling (cached for performance)
 *
 * Priority:
 *   1. gh codeql (GitHub CLI extension) - if already installed
 *   2. gh (GitHub CLI) - attempt auto-install of codeql extension
 *   3. codeql (CodeQL CLI direct install)
 *
 * @returns {'gh-codeql' | 'codeql' | null} Available tool name or null
 */
function detectCodeQLTool() {
  // 캐시된 결과 반환 (성능 최적화)
  if (cachedCodeQLTool !== null) {
    return cachedCodeQLTool;
  }

  // 1. gh codeql 확장 확인 (최우선)
  try {
    execSync('gh codeql version', { stdio: 'pipe' });
    cachedCodeQLTool = 'gh-codeql';
    return cachedCodeQLTool;
  } catch {
    // gh codeql 확장이 없음, 다음 단계로
  }

  // 2. gh CLI 확인 및 codeql 확장 자동 설치 시도
  try {
    execSync('gh version', { stdio: 'pipe' });
    // gh CLI는 있지만 codeql 확장이 없음 → 자동 설치 시도
    if (!isCI) {
      console.log(
        `${colors.yellow}⚙️  GitHub CLI 감지됨. CodeQL 확장 자동 설치 시도 중...${colors.reset}`
      );
    }
    try {
      execSync('gh extension install github/gh-codeql', { stdio: 'pipe' });
      if (!isCI) {
        console.log(`${colors.green}✓ CodeQL 확장 설치 완료${colors.reset}\n`);
      }
      cachedCodeQLTool = 'gh-codeql';
      return cachedCodeQLTool;
    } catch {
      // 설치 실패 (이미 설치되었거나 권한 문제 등)
      // 재시도: 이미 설치되어 있을 수 있음
      try {
        execSync('gh codeql version', { stdio: 'pipe' });
        cachedCodeQLTool = 'gh-codeql';
        return cachedCodeQLTool;
      } catch {
        // gh codeql 확장 설치/사용 불가, codeql CLI로 폴백
      }
    }
  } catch {
    // gh CLI 없음, codeql CLI로 폴백
  }

  // 3. codeql CLI 직접 설치 확인 (최후)
  try {
    execSync('codeql version', { stdio: 'pipe' });
    cachedCodeQLTool = 'codeql';
    return cachedCodeQLTool;
  } catch {
    cachedCodeQLTool = null;
    return null;
  }
}

/**
 * Executes a CodeQL command using available tool
 *
 * @param {string} command - CodeQL command to execute (without 'codeql' prefix)
 * @param {object} [options={}] - execSync options
 * @returns {string} Command output
 * @throws {Error} If no CodeQL tool is available
 */
function execCodeQL(command, options = {}) {
  const tool = detectCodeQLTool();
  if (!tool) {
    throw new Error('No CodeQL tool available');
  }

  const fullCommand = tool === 'gh-codeql' ? `gh codeql ${command}` : `codeql ${command}`;
  return execSync(fullCommand, { encoding: 'utf8', ...options });
}

/**
 * Prints help message
 *
 * @returns {void}
 */
function printHelp() {
  console.log(`
${colors.bright}CodeQL Security Analysis Runner${colors.reset}

${colors.bright}Usage:${colors.reset}
  node check-codeql.js [options]

${colors.bright}Options:${colors.reset}
  --json          Output results in JSON format (for CI/tooling)
  --report        Generate markdown report (codeql-reports/)
  --force         Force database rebuild (ignore cache)
  --verbose       Show detailed logging
  --quiet         Minimal output
  --help          Show this help message

${colors.bright}Environment Variables:${colors.reset}
  CODEQL_FORCE_REBUILD=true    Force database rebuild

${colors.bright}Examples:${colors.reset}
  ${colors.cyan}node check-codeql.js${colors.reset}                    # Basic run
  ${colors.cyan}node check-codeql.js --json${colors.reset}             # JSON output for CI
  ${colors.cyan}node check-codeql.js --report${colors.reset}           # Generate markdown report
  ${colors.cyan}node check-codeql.js --force --verbose${colors.reset}  # Force rebuild with logs
`);
}

/**
 * Prints info banner for CodeQL check
 *
 * @returns {void}
 */
function printInfo() {
  if (isCI || options.quiet || options.json) {
    return;
  }
  console.log(
    `\n${colors.cyan}${colors.bright}ℹ️  CodeQL 표준 보안 검증 (security-extended)${colors.reset}`
  );
  console.log(`${colors.cyan}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}\n`);
}

/**
 * Prints installation guide for CodeQL CLI
 *
 * @returns {void}
 */
function printInstallGuide() {
  if (isCI) {
    console.log('CodeQL CLI not installed. Skipping local checks (CI will run CodeQL separately).');
    return;
  }
  console.log(`${colors.yellow}⚠️  CodeQL 도구가 설치되어 있지 않습니다.${colors.reset}\n`);
  console.log(`${colors.bright}설치 방법 (우선순위 순서):${colors.reset}`);
  console.log(
    `  ${colors.bright}1. GitHub CLI + CodeQL 확장 (최우선, 자동 설치 지원):${colors.reset}`
  );
  console.log(`     ${colors.cyan}# GitHub CLI 설치 (Debian/Ubuntu)${colors.reset}`);
  console.log(
    `     ${colors.cyan}sudo apt-get update && sudo apt-get install -y gh${colors.reset}`
  );
  console.log(`     ${colors.cyan}# CodeQL 확장 설치 (자동 또는 수동)${colors.reset}`);
  console.log(`     ${colors.cyan}gh extension install github/gh-codeql${colors.reset}\n`);
  console.log(
    `  ${colors.bright}2. CodeQL CLI 직접 설치 (대안):${colors.reset}\n     ${colors.cyan}https://github.com/github/codeql-cli-binaries/releases${colors.reset}`
  );
  console.log(`     설치 후 PATH에 추가\n`);
  console.log(`${colors.bright}참고:${colors.reset}`);
  console.log(`  - GitHub CLI가 있으면 스크립트가 자동으로 CodeQL 확장 설치를 시도합니다.`);
  console.log(`  - 로컬에서는 표준 CodeQL security-extended 쿼리를 실행합니다.`);
  console.log(`  - CI에서는 GitHub Actions의 CodeQL 스캔이 자동으로 실행됩니다.\n`);
  console.log(
    `${colors.green}✓ validate 스크립트는 CodeQL 없이도 계속 진행됩니다.${colors.reset}\n`
  );
}

/**
 * Gets latest modification time of directory (recursive)
 *
 * @param {string} dirPath - Directory path to scan
 * @returns {number} Latest modification timestamp in milliseconds
 */
function getLatestModificationTime(dirPath) {
  if (!existsSync(dirPath)) return 0;

  let latestTime = statSync(dirPath).mtime.getTime();

  try {
    const entries = readdirSync(dirPath, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = join(dirPath, entry.name);
      if (entry.isDirectory()) {
        // node_modules, .git 등 제외
        if (['node_modules', '.git', 'dist', 'coverage'].includes(entry.name)) {
          continue;
        }
        const dirTime = getLatestModificationTime(fullPath);
        latestTime = Math.max(latestTime, dirTime);
      } else if (entry.isFile()) {
        const fileTime = statSync(fullPath).mtime.getTime();
        latestTime = Math.max(latestTime, fileTime);
      }
    }
  } catch {
    // 권한 오류 등 무시
  }

  return latestTime;
}

/**
 * Checks if CodeQL database cache is still valid
 *
 * @returns {boolean} True if database is up-to-date
 */
function isDatabaseValid() {
  if (!existsSync(dbDir)) return false;

  const dbMetadataPath = join(dbDir, 'codeql-database.yml');
  if (!existsSync(dbMetadataPath)) return false;

  const dbTimestamp = statSync(dbMetadataPath).mtime.getTime();

  // src/ 디렉터리의 최신 수정 시간 확인
  const srcDir = join(rootDir, 'src');
  const srcTimestamp = getLatestModificationTime(srcDir);

  return dbTimestamp > srcTimestamp;
}

/**
 * Creates CodeQL database with incremental update support
 *
 * @returns {boolean} True if database creation succeeded
 */
function createDatabase() {
  // 옵션 또는 환경변수로 강제 재생성 가능
  const forceRebuild = options.force;

  if (!forceRebuild && isDatabaseValid()) {
    if (!options.quiet && !options.json) {
      console.log(`${colors.green}✓ 기존 데이터베이스 재사용 (캐시 히트)${colors.reset}\n`);
    }
    return true;
  }

  if (!options.quiet && !options.json) {
    console.log(
      `${colors.bright}1. CodeQL 데이터베이스 생성 중...${forceRebuild ? ' (강제 재생성)' : ''}${colors.reset}`
    );
  }

  /**
   * 기존 데이터베이스 삭제
   */
  try {
    if (existsSync(dbDir)) {
      // Debian/Linux 환경에 최적화
      const rmCommand = `rm -rf "${dbDir}"`;
      execSync(rmCommand, { stdio: 'pipe' });
    }
  } catch {
    if (options.verbose) {
      console.log(`${colors.yellow}⚠️  기존 데이터베이스 정리 실패 (무시)${colors.reset}`);
    }
  }

  try {
    // JavaScript 프로젝트 데이터베이스 생성 (dist 디렉터리 제외)
    const createCmd = `database create "${dbDir}" --language=javascript --source-root="${rootDir}" --overwrite`;
    execCodeQL(createCmd, { stdio: options.verbose ? 'inherit' : 'pipe' });

    if (!options.quiet) {
      console.log(`${colors.green}✓ 데이터베이스 생성 완료${colors.reset}\n`);
    }
    return true;
  } catch (error) {
    console.error(`${colors.red}✗ 데이터베이스 생성 실패:${colors.reset}`, error.message);
    return false;
  }
}

/**
 * Parses SARIF results file
 *
 * @param {string} sarifFile - Path to SARIF file
 * @returns {{total: number, results: Array<{ruleId: string, message: string, locations: Array}>}} Parsed results
 */
function parseSarifResults(sarifFile) {
  if (!existsSync(sarifFile)) {
    return { total: 0, results: [] };
  }

  try {
    const content = readFileSync(sarifFile, 'utf8');
    const sarif = JSON.parse(content);
    const results = sarif.runs?.[0]?.results || [];

    return {
      total: results.length,
      results: results.map(r => ({
        ruleId: r.ruleId,
        message: r.message?.text || 'No message',
        locations: r.locations?.map(loc => ({
          uri: loc.physicalLocation?.artifactLocation?.uri,
          startLine: loc.physicalLocation?.region?.startLine,
          startColumn: loc.physicalLocation?.region?.startColumn,
        })),
      })),
    };
  } catch (error) {
    console.error(`${colors.red}✗ SARIF 파싱 실패:${colors.reset}`, error.message);
    return { total: 0, results: [] };
  }
}

/**
 * Prints query results
 *
 * @param {string} queryName - Query name for display
 * @param {{total: number, results: Array}} results - Parsed SARIF results
 * @returns {boolean} True if no issues found
 */
function printResults(queryName, results) {
  const total = results.results.length;

  if (total === 0) {
    console.log(`  ${colors.green}✓ ${queryName}: 문제 없음${colors.reset}`);
    return true;
  }

  console.log(`  ${colors.red}✗ ${queryName}: ${total}개 문제 발견${colors.reset}`);
  results.results.forEach((r, idx) => {
    console.log(`    ${idx + 1}. ${r.message}`);
    r.locations?.forEach(loc => {
      console.log(
        `       ${colors.cyan}${loc.uri}:${loc.startLine}:${loc.startColumn}${colors.reset}`
      );
    });
  });
  return false;
}

/**
 * Ensures CodeQL query packs are available
 *
 * @returns {boolean} True if packs are available
 */
function ensureQueryPacks() {
  try {
    // Check if javascript-queries pack is available
    const packCheck = execCodeQL('resolve packs', { stdio: 'pipe', encoding: 'utf8' });
    if (packCheck.includes('javascript-queries')) {
      return true;
    }
  } catch {
    // Pack check failed, try to download
  }

  // Try to download the pack
  console.log(`${colors.yellow}📦 JavaScript 쿼리 팩 다운로드 중...${colors.reset}`);
  try {
    execCodeQL('pack download codeql/javascript-queries', { stdio: 'inherit' });
    console.log(`${colors.green}✓ 쿼리 팩 다운로드 완료${colors.reset}\n`);
    return true;
  } catch (error) {
    console.error(`${colors.red}✗ 쿼리 팩 다운로드 실패:${colors.reset}`, error.message);
    console.log(
      `${colors.yellow}💡 수동 다운로드: gh codeql pack download codeql/javascript-queries${colors.reset}\n`
    );
    return false;
  }
}

/**
 * Generates markdown report from SARIF results
 *
 * @param {object} results - Parsed SARIF results
 * @param {string} resultFile - Path to SARIF file
 * @returns {void}
 */
function generateMarkdownReport(results, resultFile) {
  if (!existsSync(reportsDir)) {
    mkdirSync(reportsDir, { recursive: true });
  }

  const timestamp = new Date().toISOString();
  const reportFile = join(reportsDir, `security-extended-${Date.now()}.md`);

  let markdown = `# CodeQL Security Analysis Report

**Generated**: ${timestamp}
**Query Suite**: security-extended
**Results File**: ${resultFile}

## Summary

- **Total Issues**: ${results.results.length}
- **Status**: ${results.results.length === 0 ? '✅ Pass' : '❌ Fail'}

`;

  if (results.results.length > 0) {
    markdown += `## Issues Found\n\n`;
    results.results.forEach((result, idx) => {
      markdown += `### ${idx + 1}. ${result.ruleId}\n\n`;
      markdown += `**Message**: ${result.message}\n\n`;
      if (result.locations && result.locations.length > 0) {
        markdown += `**Locations**:\n\n`;
        result.locations.forEach(loc => {
          markdown += `- \`${loc.uri}:${loc.startLine}:${loc.startColumn}\`\n`;
        });
        markdown += `\n`;
      }
    });
  } else {
    markdown += `## ✅ No Issues Found\n\nAll security checks passed successfully.\n`;
  }

  writeFileSync(reportFile, markdown, 'utf8');

  if (!options.quiet) {
    console.log(`${colors.cyan}📄 마크다운 리포트 생성: ${reportFile}${colors.reset}\n`);
  }
}

/**
 * Runs CodeQL security-extended query suite (same as CI)
 *
 * @returns {Promise<boolean>} True if all queries passed
 */
async function runCodeQLQueries() {
  const tool = detectCodeQLTool();
  const toolName = tool === 'gh-codeql' ? 'gh codeql' : 'codeql';

  if (!options.quiet && !options.json) {
    console.log(
      `${colors.bright}실행 중: CodeQL 표준 보안 검증 (${toolName} 사용, security-extended)...${colors.reset}\n`
    );
  }

  // 결과 디렉터리 생성
  if (!existsSync(resultsDir)) {
    mkdirSync(resultsDir, { recursive: true });
  }

  // 쿼리 팩 확인 및 다운로드
  if (!ensureQueryPacks()) {
    if (!options.quiet && !options.json) {
      console.log(
        `${colors.yellow}⚠️  쿼리 팩을 사용할 수 없습니다. 로컬 검증을 건너뜁니다.${colors.reset}\n`
      );
      console.log(
        `${colors.green}✓ CI에서 GitHub Actions CodeQL이 자동으로 실행됩니다.${colors.reset}\n`
      );
    }
    if (options.json) {
      console.log(
        JSON.stringify({ success: true, skipped: true, reason: 'query_packs_unavailable' })
      );
    }
    return true; // Don't fail validate script
  }

  // 데이터베이스 생성
  if (!createDatabase()) {
    if (!options.json) {
      console.log(`${colors.red}데이터베이스 생성 실패. 쿼리 실행을 건너뜁니다.${colors.reset}\n`);
    }
    return false;
  }

  // security-extended 쿼리 스위트 실행 (CI와 동일)
  if (!options.quiet && !options.json) {
    console.log(`${colors.bright}2. 쿼리 실행 중 (security-extended suite)...${colors.reset}`);
  }
  const startTime = Date.now();
  const resultFile = join(resultsDir, 'security-extended.sarif');

  try {
    const analyzeCmd = `database analyze "${dbDir}" codeql/javascript-queries:codeql-suites/javascript-security-extended.qls --format=sarif-latest --output="${resultFile}"`;
    execCodeQL(analyzeCmd, {
      stdio: options.verbose || (!options.quiet && !options.json) ? 'inherit' : 'pipe',
    });

    const elapsedTime = ((Date.now() - startTime) / 1000).toFixed(2);

    if (!options.quiet && !options.json) {
      console.log(`${colors.green}✓ 쿼리 실행 완료 (${elapsedTime}초)${colors.reset}\n`);
    }

    // 결과 파싱 및 출력
    const results = parseSarifResults(resultFile);

    // JSON 출력 모드
    if (options.json) {
      console.log(
        JSON.stringify(
          { success: results.total === 0, issues: results.results.length, elapsed: elapsedTime },
          null,
          2
        )
      );
      return results.total === 0;
    }

    // 마크다운 리포트 생성
    if (options.report) {
      generateMarkdownReport(results, resultFile);
    }

    const allPassed = printResults('Security Extended', results);

    if (!options.quiet) {
      console.log('');
      if (allPassed) {
        console.log(`${colors.green}${colors.bright}✓ CodeQL 보안 검증 통과!${colors.reset}\n`);
      } else {
        console.log(
          `${colors.red}${colors.bright}✗ CodeQL 보안 검증에서 문제가 발견되었습니다.${colors.reset}\n`
        );
        console.log(`${colors.cyan}결과 파일: ${resultFile}${colors.reset}\n`);
      }
    }

    return allPassed;
  } catch (error) {
    console.error(`${colors.red}✗ 쿼리 실행 실패:${colors.reset}`, error.message);
    return false;
  }
}

/**
 * Main entry point
 *
 * @returns {Promise<void>}
 */
async function main() {
  // 헬프 메시지 표시
  if (options.help) {
    printHelp();
    process.exit(0);
  }

  // CI 환경에서는 즉시 종료 (성능 최적화)
  if (isCI) {
    console.log('CodeQL check: Skipped (CI uses GitHub Actions CodeQL workflow)');
    process.exit(0);
  }

  printInfo();

  const tool = detectCodeQLTool();
  if (!tool) {
    printInstallGuide();
    process.exit(0); // validate 스크립트가 계속 진행되도록 성공 코드 반환
  }

  const success = await runCodeQLQueries();

  // 빌드 시 문제가 발견되면 실패 코드 반환
  if (!success) {
    process.exit(1);
  }
}

main();
