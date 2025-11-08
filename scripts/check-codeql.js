#!/usr/bin/env node

/**
 * CodeQL Security Analysis Runner (Local Environment Only)
 *
 * @description
 * Local-only script for running CodeQL security analysis with custom filtering.
 * Executes security-extended queries and applies project-specific exclusions.
 *
 * **Usage Context:**
 * - Local Development: Quick security feedback during development
 * - CI Environment: Uses github/codeql-action@v3 (GitHub official action)
 * - This script auto-detects CI and skips local checks
 *
 * **Why not in CI:**
 * - CI uses GitHub's official CodeQL action (more integrated, native SARIF upload)
 * - This script is for local developer convenience only
 * - Supports custom YAML config filtering (same rules as CI)
 *
 * @usage
 *   node check-codeql.js [options]
 *   npm run codeql:check [-- options]
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
import {
  existsSync,
  readFileSync,
  writeFileSync,
  mkdirSync,
  statSync,
  readdirSync,
  rmSync,
} from 'node:fs';
import { resolve, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = resolve(__dirname, '..');
const dbDir = resolve(rootDir, '.codeql-db');
const resultsDir = resolve(rootDir, 'codeql-results');
const reportsDir = resolve(rootDir, 'codeql-reports');
const configFile = resolve(rootDir, '.github/codeql/codeql-config.yml');

// Parse command-line options
const args = process.argv.slice(2);
const options = {
  json: args.includes('--json'),
  report: args.includes('--report'),
  force: args.includes('--force') || process.env.CODEQL_FORCE_REBUILD === 'true',
  verbose: args.includes('--verbose'),
  quiet: args.includes('--quiet'),
  help: args.includes('--help'),
};

// Detect CI environment
const isCI = process.env.CI === 'true' || process.env.GITHUB_ACTIONS === 'true';

// Cache tool detection results (performance optimization)
let cachedCodeQLTool = null;

// ANSI color codes (disabled in CI)
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
  // Return cached result (performance optimization)
  if (cachedCodeQLTool !== null) {
    return cachedCodeQLTool;
  }

  // 1. Check gh codeql extension (highest priority)
  try {
    execSync('gh codeql version', { stdio: 'pipe' });
    cachedCodeQLTool = 'gh-codeql';
    return cachedCodeQLTool;
  } catch {
    // gh codeql extension not found, proceed to next step
  }

  // 2. Check gh CLI and attempt automatic codeql extension install
  try {
    execSync('gh version', { stdio: 'pipe' });
    // gh CLI found but codeql extension missing → attempt automatic install
    if (!isCI) {
      console.log(
        `${colors.yellow}⚙️  GitHub CLI detected. Attempting CodeQL extension auto-install...${colors.reset}`
      );
    }
    try {
      execSync('gh extension install github/gh-codeql', { stdio: 'pipe' });
      if (!isCI) {
        console.log(`${colors.green}✓ CodeQL extension install complete${colors.reset}\n`);
      }
      cachedCodeQLTool = 'gh-codeql';
      return cachedCodeQLTool;
    } catch {
      // Install failed (may already be installed or permissions issue)
      // Retry: may already be installed
      try {
        execSync('gh codeql version', { stdio: 'pipe' });
        cachedCodeQLTool = 'gh-codeql';
        return cachedCodeQLTool;
      } catch {
        // gh codeql extension unavailable, fallback to codeql CLI
      }
    }
  } catch {
    // gh CLI not found, fallback to codeql CLI
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
  console.log(`${colors.yellow}⚠️  CodeQL tool is not installed.${colors.reset}\n`);
  console.log(`${colors.bright}Installation instructions (in priority order):${colors.reset}`);
  console.log(
    `  ${colors.bright}1. GitHub CLI + CodeQL extension (preferred, with auto-install support):${colors.reset}`
  );
  console.log(`     ${colors.cyan}# Install GitHub CLI (Debian/Ubuntu)${colors.reset}`);
  console.log(
    `     ${colors.cyan}sudo apt-get update && sudo apt-get install -y gh${colors.reset}`
  );
  console.log(`     ${colors.cyan}# Install CodeQL extension (automatic or manual)${colors.reset}`);
  console.log(`     ${colors.cyan}gh extension install github/gh-codeql${colors.reset}\n`);
  console.log(
    `  ${colors.bright}2. Direct CodeQL CLI install (alternative):${colors.reset}\n     ${colors.cyan}https://github.com/github/codeql-cli-binaries/releases${colors.reset}`
  );
  console.log(`     Add to PATH after installation\n`);
  console.log(`${colors.bright}Notes:${colors.reset}`);
  console.log(
    `  - If GitHub CLI is present, this script automatically attempts to install CodeQL extension.`
  );
  console.log(`  - Local runs use standard CodeQL security-extended queries.`);
  console.log(`  - CI runs CodeQL scan automatically via GitHub Actions.\n`);
  console.log(`${colors.green}✓ validate script continues without CodeQL.${colors.reset}\n`);
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
    // Ignore permission errors, etc.
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

  // Check latest modification time of src/ directory
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
  // Force rebuild available via options or environment variable
  const forceRebuild = options.force;

  if (!forceRebuild && isDatabaseValid()) {
    if (!options.quiet && !options.json) {
      console.log(`${colors.green}✓ Reusing existing database (cache hit)${colors.reset}\n`);
    }
    return true;
  }

  if (!options.quiet && !options.json) {
    console.log(
      `${colors.bright}1. Creating CodeQL database...${forceRebuild ? ' (force rebuild)' : ''}${colors.reset}`
    );
  }

  /**
   * Delete existing database
   */
  try {
    if (existsSync(dbDir)) {
      // Cross-platform removal
      rmSync(dbDir, { recursive: true, force: true });
    }
  } catch {
    if (options.verbose) {
      console.log(`${colors.yellow}⚠️  Existing database cleanup failed (ignored)${colors.reset}`);
    }
  }

  try {
    // Create JavaScript project database (excludes dist directory)
    const createCmd = `database create "${dbDir}" --language=javascript --source-root="${rootDir}" --overwrite`;
    execCodeQL(createCmd, { stdio: options.verbose ? 'inherit' : 'pipe' });

    if (!options.quiet) {
      console.log(`${colors.green}✓ Database creation complete${colors.reset}\n`);
    }
    return true;
  } catch (error) {
    console.error(`${colors.red}✗ Database creation failed:${colors.reset}`, error.message);
    return false;
  }
}

/**
 * Loads CodeQL configuration and extracts paths-ignore patterns
 *
 * @returns {Array<string>} Array of glob patterns to ignore
 */
function loadPathsIgnore() {
  if (!existsSync(configFile)) {
    return [];
  }

  try {
    const content = readFileSync(configFile, 'utf8');

    // Find paths-ignore section
    const lines = content.split('\n');
    const pathsIgnoreIndex = lines.findIndex(line => line.includes('paths-ignore:'));

    if (pathsIgnoreIndex === -1) {
      return [];
    }

    // Extract paths (lines starting with '  -')
    const paths = [];
    for (let i = pathsIgnoreIndex + 1; i < lines.length; i++) {
      const line = lines[i];

      // Stop if we hit another top-level key (no leading spaces before key)
      if (line.match(/^[a-zA-Z]/) && line.includes(':')) {
        break;
      }

      // Extract path from list item
      if (line.trim().startsWith('-')) {
        const path = line.trim().substring(1).trim();
        if (path.length > 0 && !path.startsWith('#')) {
          paths.push(path);
        }
      }
    }

    return paths;
  } catch (error) {
    console.error(`${colors.yellow}⚠️  설정 파일 로드 실패:${colors.reset}`, error.message);
    return [];
  }
}

/**
 * Checks if a file path should be ignored based on patterns
 *
 * @param {string} uri - File URI from SARIF result
 * @param {Array<string>} ignorePatterns - Array of glob patterns
 * @returns {boolean} True if path should be ignored
 */
function shouldIgnorePath(uri, ignorePatterns) {
  if (!uri || ignorePatterns.length === 0) {
    return false;
  }

  // Normalize path (remove leading /)
  const normalizedUri = uri.startsWith('/') ? uri.substring(1) : uri;

  return ignorePatterns.some(pattern => {
    // Exact match or glob pattern matching
    if (pattern === normalizedUri) {
      return true;
    }

    // Simple glob matching (supports * wildcards)
    const regexPattern = pattern
      .replace(/[.+^${}()|[\]\\]/g, '\\$&') // Escape special regex chars
      .replace(/\*/g, '.*') // * matches any characters
      .replace(/\?/g, '.'); // ? matches single character
    const regex = new RegExp(`^${regexPattern}$`);
    return regex.test(normalizedUri);
  });
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
    const rawResults = sarif.runs?.[0]?.results || [];

    // Load ignore patterns from config
    const ignorePatterns = loadPathsIgnore();

    // Filter results based on paths-ignore configuration
    const filteredResults = rawResults.filter(r => {
      const locations = r.locations || [];
      // Ignore if ALL locations match ignore patterns
      const allIgnored = locations.every(loc => {
        const uri = loc.physicalLocation?.artifactLocation?.uri;
        return shouldIgnorePath(uri, ignorePatterns);
      });
      return !allIgnored;
    });

    return {
      total: filteredResults.length,
      results: filteredResults.map(r => ({
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
  console.log(`${colors.yellow}📦 Downloading JavaScript query pack...${colors.reset}`);
  try {
    execCodeQL('pack download codeql/javascript-queries', { stdio: 'inherit' });
    console.log(`${colors.green}✓ Query pack download complete${colors.reset}\n`);
    return true;
  } catch (error) {
    console.error(`${colors.red}✗ Query pack download failed:${colors.reset}`, error.message);
    console.log(
      `${colors.yellow}💡 Manual download: gh codeql pack download codeql/javascript-queries${colors.reset}\n`
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

  // Create results directory
  if (!existsSync(resultsDir)) {
    mkdirSync(resultsDir, { recursive: true });
  }

  // Check and download query packs
  if (!ensureQueryPacks()) {
    if (!options.quiet && !options.json) {
      console.log(
        `${colors.yellow}⚠️  Query packs unavailable. Skipping local validation.${colors.reset}\n`
      );
      console.log(
        `${colors.green}✓ CodeQL is automatically run via GitHub Actions in CI.${colors.reset}\n`
      );
    }
    if (options.json) {
      console.log(
        JSON.stringify({ success: true, skipped: true, reason: 'query_packs_unavailable' })
      );
    }
    return true; // Don't fail validate script
  }

  // Create database
  if (!createDatabase()) {
    if (!options.json) {
      console.log(
        `${colors.red}Database creation failed. Skipping query execution.${colors.reset}\n`
      );
    }
    return false;
  }

  // Run security-extended query suite (same as CI)
  if (!options.quiet && !options.json) {
    console.log(`${colors.bright}2. Running queries (security-extended suite)...${colors.reset}`);
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
