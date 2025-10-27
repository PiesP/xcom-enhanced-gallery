#!/usr/bin/env node

/**
 * CodeQL Security Analysis Runner
 *
 * Executes custom CodeQL security queries if available (gh codeql or codeql CLI).
 * In CI environments, skips local checks (GitHub Actions handles CodeQL separately).
 *
 * @usage
 *   node check-codeql.js
 *
 * @environment
 *   CI, GITHUB_ACTIONS - Detects CI environment, skips local checks
 *   CODEQL_FORCE_REBUILD - Force database rebuild (default: incremental update)
 *
 * @tools
 *   1. gh codeql (GitHub CLI extension, recommended)
 *   2. codeql (CodeQL CLI direct install)
 *   3. Neither (graceful degradation with installation guide)
 *
 * @output
 *   SARIF results in codeql-results/ directory
 *   Summary report to stdout
 *   Exit code: 0 (pass) or 1 (failures found)
 */

import { execSync } from 'node:child_process';
import { existsSync, readFileSync, mkdirSync, statSync, readdirSync } from 'node:fs';
import { resolve, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = resolve(__dirname, '..');
const queriesDir = resolve(rootDir, 'codeql-custom-queries-javascript');
const dbDir = resolve(rootDir, '.codeql-db');
const resultsDir = resolve(rootDir, 'codeql-results');

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
 * Detects available CodeQL tool (cached for performance)
 *
 * @returns {'gh-codeql' | 'codeql' | null} Available tool name or null
 */
function detectCodeQLTool() {
  // 캐시된 결과 반환 (성능 최적화)
  if (cachedCodeQLTool !== null) {
    return cachedCodeQLTool;
  }

  // gh codeql 확장 확인
  try {
    execSync('gh codeql version', { stdio: 'pipe' });
    cachedCodeQLTool = 'gh-codeql';
    return cachedCodeQLTool;
  } catch {
    // 무시하고 다음 확인
  }

  // codeql CLI 확인
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
 * Prints info banner for CodeQL check
 *
 * @returns {void}
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
  console.log(`${colors.bright}설치 방법 (권장 순서):${colors.reset}`);
  console.log(
    `  ${colors.bright}1. GitHub CLI 확장 (권장):${colors.reset}\n     ${colors.cyan}gh extension install github/gh-codeql${colors.reset}`
  );
  console.log(
    `  ${colors.bright}2. CodeQL CLI 직접 설치:${colors.reset}\n     ${colors.cyan}https://github.com/github/codeql-cli-binaries/releases${colors.reset}`
  );
  console.log(`     설치 후 PATH에 추가\n`);
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
  // 환경변수로 강제 재생성 가능
  const forceRebuild = process.env.CODEQL_FORCE_REBUILD === 'true';

  if (!forceRebuild && isDatabaseValid()) {
    console.log(`${colors.green}✓ 기존 데이터베이스 재사용 (캐시 히트)${colors.reset}\n`);
    return true;
  }

  console.log(
    `${colors.bright}1. CodeQL 데이터베이스 생성 중...${forceRebuild ? ' (강제 재생성)' : ''}${colors.reset}`
  );

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
    console.log(`${colors.yellow}⚠️  기존 데이터베이스 정리 실패 (무시)${colors.reset}`);
  }

  try {
    // JavaScript 프로젝트 데이터베이스 생성
    execCodeQL(
      `database create "${dbDir}" --language=javascript --source-root="${rootDir}" --overwrite`,
      { stdio: 'inherit' }
    );
    console.log(`${colors.green}✓ 데이터베이스 생성 완료${colors.reset}\n`);
    return true;
  } catch (error) {
    console.error(`${colors.red}✗ 데이터베이스 생성 실패:${colors.reset}`, error.message);
    return false;
  }
}

/**
 * Runs a single CodeQL query asynchronously
 *
 * @param {string} queryFile - Query filename (e.g., 'direct-vendor-imports.ql')
 * @returns {Promise<{queryFile: string, resultFile: string|null, success: boolean}>} Query result
 */
async function runQuery(queryFile) {
  const queryPath = resolve(queriesDir, queryFile);
  const resultFile = join(resultsDir, `${queryFile.replace('.ql', '')}.sarif`);

  try {
    await new Promise((resolve, reject) => {
      try {
        execCodeQL(
          `database analyze "${dbDir}" "${queryPath}" --format=sarif-latest --output="${resultFile}"`,
          { stdio: 'pipe' }
        );
        resolve();
      } catch (error) {
        reject(error);
      }
    });
    return { queryFile, resultFile, success: true };
  } catch (error) {
    console.error(`${colors.red}✗ 쿼리 실행 실패 (${queryFile}):${colors.reset}`, error.message);
    return { queryFile, resultFile: null, success: false };
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
 * Prints query results (excludes test-samples directory)
 *
 * @param {string} queryName - Query name for display
 * @param {{total: number, results: Array}} results - Parsed SARIF results
 * @returns {boolean} True if no issues found
 */
function printResults(queryName, results) {
  // test-samples 디렉토리의 결과 필터링 (의도적 위반 예시)
  const filteredResults = results.results.filter(r => {
    return !r.locations?.some(loc => loc.uri?.includes('test-samples/'));
  });

  const filteredTotal = filteredResults.length;

  if (filteredTotal === 0) {
    console.log(`  ${colors.green}✓ ${queryName}: 문제 없음${colors.reset}`);
    return true;
  }

  console.log(`  ${colors.red}✗ ${queryName}: ${filteredTotal}개 문제 발견${colors.reset}`);
  filteredResults.forEach((r, idx) => {
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
 * Runs all CodeQL queries in parallel
 *
 * @returns {Promise<boolean>} True if all queries passed
 */
async function runCodeQLQueries() {
  const tool = detectCodeQLTool();
  const toolName = tool === 'gh-codeql' ? 'gh codeql' : 'codeql';

  console.log(
    `${colors.bright}실행 중: CodeQL 커스텀 쿼리 (${toolName} 사용, 병렬 실행)...${colors.reset}\n`
  );

  // 쿼리 파일 확인
  const queries = [
    'direct-vendor-imports.ql',
    'forbidden-touch-events.ql',
    'hardcoded-color-values.ql',
    'hardcoded-size-values.ql',
    'unsafe-download-pattern.ql',
  ];

  const existingQueries = queries.filter(q => existsSync(resolve(queriesDir, q)));

  if (existingQueries.length === 0) {
    console.log(`${colors.yellow}⚠️  실행 가능한 쿼리가 없습니다.${colors.reset}\n`);
    return true;
  }

  // 결과 디렉터리 생성
  if (!existsSync(resultsDir)) {
    mkdirSync(resultsDir, { recursive: true });
  }

  // 데이터베이스 생성
  if (!createDatabase()) {
    console.log(`${colors.red}데이터베이스 생성 실패. 쿼리 실행을 건너뜁니다.${colors.reset}\n`);
    return false;
  }

  // 쿼리 병렬 실행 (시작 시간 측정)
  console.log(
    `${colors.bright}2. 쿼리 병렬 실행 중 (${existingQueries.length}개)...${colors.reset}`
  );
  const startTime = Date.now();

  const queryResults = await Promise.all(existingQueries.map(queryFile => runQuery(queryFile)));

  const elapsedTime = ((Date.now() - startTime) / 1000).toFixed(2);
  console.log(`${colors.green}✓ 쿼리 실행 완료 (${elapsedTime}초)${colors.reset}\n`);

  // 결과 파싱 및 출력
  let allPassed = true;

  for (const { queryFile, resultFile, success } of queryResults) {
    if (!success || !resultFile) {
      allPassed = false;
      continue;
    }

    const results = parseSarifResults(resultFile);
    const passed = printResults(queryFile, results);
    allPassed = allPassed && passed;
  }

  console.log('');
  if (allPassed) {
    console.log(`${colors.green}${colors.bright}✓ 모든 CodeQL 쿼리 통과!${colors.reset}\n`);
  } else {
    console.log(
      `${colors.red}${colors.bright}✗ 일부 CodeQL 쿼리에서 문제가 발견되었습니다.${colors.reset}\n`
    );
    console.log(`${colors.cyan}결과 파일: ${resultsDir}${colors.reset}\n`);
  }

  return allPassed;
}

/**
 * Main entry point
 *
 * @returns {Promise<void>}
 */
async function main() {
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
