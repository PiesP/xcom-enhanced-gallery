#!/usr/bin/env node

/**
 * CodeQL 쿼리 실행 스크립트 (v2: 향상된 버전)
 *
 * 주요 개선사항:
 * - CLI 옵션 지원 (--json, --report, --force, --quiet, --verbose)
 * - 고급 캐싱 메커니즘 (상세 캐시 정책)
 * - 다양한 출력 형식 (콘솔, JSON, 마크다운)
 * - 성능 측정 및 상세 로깅
 *
 * 사용법:
 *   node scripts/check-codeql.js [options]
 *
 * 옵션:
 *   --json              JSON 형식으로 결과 출력
 *   --report            마크다운 리포트 생성
 *   --force             데이터베이스 강제 재생성 (CODEQL_FORCE_REBUILD)
 *   --quiet             최소한의 출력만 표시
 *   --verbose           상세 디버깅 정보 출력
 *   --help              도움말 표시
 */

import { execSync } from 'node:child_process';
import {
  existsSync,
  readFileSync,
  mkdirSync,
  statSync,
  readdirSync,
  writeFileSync,
} from 'node:fs';
import { resolve, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = resolve(__dirname, '..');
const queriesDir = resolve(rootDir, 'codeql-custom-queries-javascript');
const dbDir = resolve(rootDir, '.codeql-db');
const resultsDir = resolve(rootDir, 'codeql-results');
const reportsDir = resolve(rootDir, 'codeql-reports');

// CI 환경 감지
const isCI = process.env.CI === 'true' || process.env.GITHUB_ACTIONS === 'true';

// CLI 옵션 파싱
const cliArgs = process.argv.slice(2);
const options = {
  json: cliArgs.includes('--json'),
  report: cliArgs.includes('--report'),
  force: cliArgs.includes('--force') || process.env.CODEQL_FORCE_REBUILD === 'true',
  quiet: cliArgs.includes('--quiet'),
  verbose: cliArgs.includes('--verbose'),
  help: cliArgs.includes('--help'),
};

// 도구 감지 결과 캐싱 (성능 최적화)
let cachedCodeQLTool = null;

// ANSI 색상 코드 (CI/JSON 출력에서는 비활성화)
const colors = !isCI && !options.json
  ? {
      reset: '\x1b[0m',
      bright: '\x1b[1m',
      cyan: '\x1b[36m',
      yellow: '\x1b[33m',
      green: '\x1b[32m',
      red: '\x1b[31m',
      gray: '\x1b[90m',
    }
  : {
      reset: '',
      bright: '',
      cyan: '',
      yellow: '',
      green: '',
      red: '',
      gray: '',
    };

// ============================================
// 유틸리티 함수
// ============================================

/**
 * 도움말 표시
 */
function showHelp() {
  console.log(`
${colors.bright}CodeQL 커스텀 쿼리 검증 스크립트${colors.reset}

${colors.bright}사용법:${colors.reset}
  node scripts/check-codeql.js [options]

${colors.bright}옵션:${colors.reset}
  --json              JSON 형식으로 결과 출력
  --report            마크다운 리포트 생성
  --force             데이터베이스 강제 재생성
  --quiet             최소한의 출력만 표시
  --verbose           상세 디버깅 정보 출력
  --help              도움말 표시

${colors.bright}예시:${colors.reset}
  npm run codeql:check                    # 기본 실행
  npm run codeql:check -- --json          # JSON 출력
  npm run codeql:check -- --report        # 마크다운 리포트 생성
  npm run codeql:check -- --force --json  # 강제 재생성 + JSON
  `);
}

/**
 * 로그 함수 (레벨 별)
 */
function log(message, level = 'info') {
  if (options.quiet && level !== 'error') return;
  if (level === 'verbose' && !options.verbose) return;

  const timestamp = options.verbose ? `${colors.gray}[${new Date().toISOString()}]${colors.reset} ` : '';
  switch (level) {
    case 'info':
      if (!options.json) console.log(message);
      break;
    case 'verbose':
      console.log(`${timestamp}${colors.gray}DEBUG: ${message}${colors.reset}`);
      break;
    case 'warn':
      console.warn(`${colors.yellow}⚠️  ${message}${colors.reset}`);
      break;
    case 'error':
      console.error(`${colors.red}✗ ${message}${colors.reset}`);
      break;
    case 'success':
      console.log(`${colors.green}✓ ${message}${colors.reset}`);
      break;
  }
}

/**
 * 사용 가능한 CodeQL 도구 확인 (캐싱 적용)
 * @returns {'gh-codeql' | 'codeql' | null}
 */
function detectCodeQLTool() {
  // 캐시된 결과 반환 (성능 최적화)
  if (cachedCodeQLTool !== null) {
    return cachedCodeQLTool;
  }

  log('CodeQL 도구 감지 중...', 'verbose');

  // gh codeql 확장 확인
  try {
    execSync('gh codeql version', { stdio: 'pipe' });
    cachedCodeQLTool = 'gh-codeql';
    log('감지됨: gh codeql 확장', 'verbose');
    return cachedCodeQLTool;
  } catch {
    log('gh codeql 확장 미설치', 'verbose');
  }

  // codeql CLI 확인
  try {
    execSync('codeql version', { stdio: 'pipe' });
    cachedCodeQLTool = 'codeql';
    log('감지됨: CodeQL CLI', 'verbose');
    return cachedCodeQLTool;
  } catch {
    log('CodeQL CLI 미설치', 'verbose');
    cachedCodeQLTool = null;
    return null;
  }
}

/**
 * CodeQL 명령 실행
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
 * CodeQL CLI 설치 안내
 */
function printInstallGuide() {
  if (options.json) return;

  console.log(`
${colors.yellow}⚠️  CodeQL 도구가 설치되어 있지 않습니다.${colors.reset}

${colors.bright}설치 방법 (권장 순서):${colors.reset}
  ${colors.bright}1. GitHub CLI 확장 (권장):${colors.reset}
     ${colors.cyan}gh extension install github/gh-codeql${colors.reset}

  ${colors.bright}2. CodeQL CLI 직접 설치:${colors.reset}
     ${colors.cyan}https://github.com/github/codeql-cli-binaries/releases${colors.reset}
     설치 후 PATH에 추가

${colors.bright}참고:${colors.reset}
  - CodeQL 쿼리는 ${colors.cyan}codeql-custom-queries-javascript/${colors.reset} 폴더
  - CI에서는 GitHub Actions의 CodeQL이 자동으로 실행됨
  - validate 스크립트는 CodeQL 없이도 계속 진행됨

${colors.green}✓ CodeQL 설치 안내 완료${colors.reset}
  `);
}

/**
 * 디렉터리의 최신 수정 시간 가져오기 (재귀)
 */
function getLatestModificationTime(dirPath) {
  if (!existsSync(dirPath)) return 0;

  let latestTime = statSync(dirPath).mtime.getTime();

  try {
    const entries = readdirSync(dirPath, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = join(dirPath, entry.name);
      if (entry.isDirectory()) {
        // 제외 디렉터리
        if (['node_modules', '.git', 'dist', 'coverage', '.codeql-db'].includes(entry.name)) {
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
 * 데이터베이스 캐시 유효성 검사
 */
function isDatabaseValid() {
  if (!existsSync(dbDir)) {
    log('DB 디렉터리 없음', 'verbose');
    return false;
  }

  const dbMetadataPath = join(dbDir, 'codeql-database.yml');
  if (!existsSync(dbMetadataPath)) {
    log('DB 메타데이터 없음', 'verbose');
    return false;
  }

  const dbTimestamp = statSync(dbMetadataPath).mtime.getTime();
  const srcDir = join(rootDir, 'src');
  const srcTimestamp = getLatestModificationTime(srcDir);

  const isValid = dbTimestamp > srcTimestamp;
  log(`DB 타임스탬프: ${new Date(dbTimestamp).toISOString()}`, 'verbose');
  log(`SRC 타임스탬프: ${new Date(srcTimestamp).toISOString()}`, 'verbose');
  log(`캐시 유효: ${isValid}`, 'verbose');

  return isValid;
}

/**
 * CodeQL 데이터베이스 생성 (증분 업데이트 지원)
 */
function createDatabase() {
  const forceRebuild = options.force;

  if (!forceRebuild && isDatabaseValid()) {
    log('기존 데이터베이스 재사용 (캐시 히트)', 'success');
    return true;
  }

  log(
    `${colors.bright}1. CodeQL 데이터베이스 생성 중...${forceRebuild ? ' (강제 재생성)' : ''}${colors.reset}`,
    'info'
  );

  try {
    if (existsSync(dbDir)) {
      log(`기존 DB 삭제 중: ${dbDir}`, 'verbose');
      execSync(`rm -rf "${dbDir}"`, { stdio: 'pipe' });
    }
  } catch {
    log('기존 데이터베이스 정리 실패 (무시)', 'warn');
  }

  try {
    execCodeQL(
      `database create "${dbDir}" --language=javascript --source-root="${rootDir}" --overwrite`,
      { stdio: 'inherit' }
    );
    log('데이터베이스 생성 완료', 'success');
    return true;
  } catch (error) {
    log(`데이터베이스 생성 실패: ${error.message}`, 'error');
    return false;
  }
}

/**
 * CodeQL 쿼리 실행 (비동기)
 */
async function runQuery(queryFile) {
  const queryPath = resolve(queriesDir, queryFile);
  const resultFile = join(resultsDir, `${queryFile.replace('.ql', '')}.sarif`);

  try {
    log(`쿼리 실행 중: ${queryFile}`, 'verbose');
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
    log(`쿼리 실행 실패 (${queryFile}): ${error.message}`, 'error');
    return { queryFile, resultFile: null, success: false };
  }
}

/**
 * SARIF 결과 파싱
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
        level: r.level || 'warning',
        locations: r.locations?.map(loc => ({
          uri: loc.physicalLocation?.artifactLocation?.uri,
          startLine: loc.physicalLocation?.region?.startLine,
          startColumn: loc.physicalLocation?.region?.startColumn,
        })),
      })),
    };
  } catch (error) {
    log(`SARIF 파싱 실패: ${error.message}`, 'error');
    return { total: 0, results: [] };
  }
}

/**
 * test-samples 필터링
 */
function filterTestSamples(results) {
  return results.filter(r => {
    return !r.locations?.some(loc => loc.uri?.includes('test-samples/'));
  });
}

/**
 * 콘솔 결과 출력
 */
function printResultsConsole(queryName, results) {
  const filteredResults = filterTestSamples(results.results);
  const filteredTotal = filteredResults.length;

  if (filteredTotal === 0) {
    log(`${colors.green}✓${colors.reset} ${queryName}: 문제 없음`, 'info');
    return true;
  }

  log(`${colors.red}✗${colors.reset} ${queryName}: ${filteredTotal}개 문제 발견`, 'info');
  filteredResults.forEach((r, idx) => {
    console.log(`  ${idx + 1}. ${r.message}`);
    r.locations?.forEach(loc => {
      console.log(`     ${colors.cyan}${loc.uri}:${loc.startLine}:${loc.startColumn}${colors.reset}`);
    });
  });
  return false;
}

/**
 * JSON 결과 출력
 */
function printResultsJSON(allResults) {
  const output = {
    timestamp: new Date().toISOString(),
    tool: detectCodeQLTool(),
    queries: allResults.map(r => ({
      name: r.queryName,
      passed: r.passed,
      total: r.total,
      filtered: r.filtered,
      issues: filterTestSamples(r.results),
    })),
    summary: {
      totalPassed: allResults.every(r => r.passed),
      queriesRun: allResults.length,
      totalIssues: allResults.reduce((sum, r) => sum + r.filtered, 0),
    },
  };

  console.log(JSON.stringify(output, null, 2));
}

/**
 * 마크다운 리포트 생성
 */
function generateMarkdownReport(allResults) {
  const timestamp = new Date().toISOString();
  const tool = detectCodeQLTool();

  let report = `# CodeQL 검증 리포트

**생성 시간**: ${timestamp}
**도구**: ${tool || '미설치'}

## 요약

| 항목 | 값 |
|------|-----|
| 실행 쿼리 수 | ${allResults.length} |
| 통과 | ${allResults.filter(r => r.passed).length} |
| 실패 | ${allResults.filter(r => !r.passed).length} |
| 전체 이슈 | ${allResults.reduce((sum, r) => sum + r.filtered, 0)} |
| 상태 | ${allResults.every(r => r.passed) ? '✅ 통과' : '❌ 실패'} |

## 상세 결과

`;

  allResults.forEach(result => {
    report += `### ${result.queryName}\n\n`;
    report += `**상태**: ${result.passed ? '✅ 통과' : '❌ 실패'}  \n`;
    report += `**이슈**: ${result.filtered}개 (전체: ${result.total}개)\n\n`;

    const filteredResults = filterTestSamples(result.results);
    if (filteredResults.length === 0) {
      report += '문제 없음\n\n';
    } else {
      report += '#### 발견된 문제\n\n';
      filteredResults.forEach((issue, idx) => {
        report += `${idx + 1}. **${issue.message}** (Level: ${issue.level})\n`;
        issue.locations?.forEach(loc => {
          report += `   - \`${loc.uri}:${loc.startLine}:${loc.startColumn}\`\n`;
        });
      });
      report += '\n';
    }
  });

  // 리포트 저장
  if (!existsSync(reportsDir)) {
    mkdirSync(reportsDir, { recursive: true });
  }

  const reportPath = join(reportsDir, `codeql-report-${new Date().toISOString().split('T')[0]}.md`);
  writeFileSync(reportPath, report, 'utf8');

  log(`마크다운 리포트 생성: ${reportPath}`, 'success');
  return reportPath;
}

/**
 * CodeQL 쿼리 실행 (병렬)
 */
async function runCodeQLQueries() {
  const tool = detectCodeQLTool();
  const toolName = tool === 'gh-codeql' ? 'gh codeql' : 'codeql';

  log(
    `${colors.bright}실행 중: CodeQL 커스텀 쿼리 (${toolName} 사용, 병렬 실행)...${colors.reset}`,
    'info'
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
    log('실행 가능한 쿼리가 없습니다.', 'warn');
    return true;
  }

  log(`발견된 쿼리: ${existingQueries.length}개`, 'verbose');

  // 결과 디렉터리 생성
  if (!existsSync(resultsDir)) {
    mkdirSync(resultsDir, { recursive: true });
  }

  // 데이터베이스 생성
  if (!createDatabase()) {
    log('데이터베이스 생성 실패. 쿼리 실행을 건너뜁니다.', 'error');
    return false;
  }

  // 쿼리 병렬 실행 (시작 시간 측정)
  log(
    `${colors.bright}2. 쿼리 병렬 실행 중 (${existingQueries.length}개)...${colors.reset}`,
    'info'
  );
  const startTime = Date.now();

  const queryResults = await Promise.all(existingQueries.map(queryFile => runQuery(queryFile)));

  const elapsedTime = ((Date.now() - startTime) / 1000).toFixed(2);
  log(`쿼리 실행 완료 (${elapsedTime}초)`, 'success');

  // 결과 파싱
  const allResults = [];
  let allPassed = true;

  for (const { queryFile, resultFile, success } of queryResults) {
    if (!success || !resultFile) {
      allPassed = false;
      continue;
    }

    const results = parseSarifResults(resultFile);
    const filtered = filterTestSamples(results.results).length;
    const passed = filtered === 0;

    allResults.push({
      queryName: queryFile.replace('.ql', ''),
      queryFile,
      total: results.total,
      filtered,
      results: results.results,
      passed,
    });

    allPassed = allPassed && passed;
  }

  // 출력 형식에 따라 결과 출력
  if (options.json) {
    printResultsJSON(allResults);
  } else {
    // 콘솔 출력
    log('', 'info');
    allResults.forEach(r => printResultsConsole(r.queryName, { results: r.results }));
    log('', 'info');

    if (allPassed) {
      log(
        `${colors.green}${colors.bright}✓ 모든 CodeQL 쿼리 통과!${colors.reset}`,
        'info'
      );
    } else {
      log(
        `${colors.red}${colors.bright}✗ 일부 CodeQL 쿼리에서 문제가 발견되었습니다.${colors.reset}`,
        'info'
      );
      log(`결과 파일: ${resultsDir}`, 'info');
    }

    if (options.report) {
      generateMarkdownReport(allResults);
    }
  }

  log('', 'info');
  return allPassed;
}

// ============================================
// 메인 함수
// ============================================

/**
 * 메인 함수
 */
async function main() {
  // 도움말 요청
  if (options.help) {
    showHelp();
    process.exit(0);
  }

  // CI 환경에서는 즉시 종료 (성능 최적화)
  if (isCI) {
    log('CodeQL check: Skipped (CI uses GitHub Actions CodeQL workflow)');
    process.exit(0);
  }

  if (!options.json) {
    log(`\n${colors.cyan}${colors.bright}ℹ️  CodeQL 커스텀 쿼리 검증${colors.reset}`, 'info');
    log(`${colors.cyan}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}\n`, 'info');
  }

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
