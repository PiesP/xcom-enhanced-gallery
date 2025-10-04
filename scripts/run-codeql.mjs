#!/usr/bin/env node
/**
 * CodeQL automation runner for xcom-enhanced-gallery.
 *
 * Responsibilities
 * 1. Ensure the CodeQL CLI is available.
 * 2. Create or refresh a JavaScript/TypeScript CodeQL database for the repository.
 * 3. Execute the default CodeQL JavaScript query packs plus optional custom packs.
 * 4. Generate SARIF, CSV summary, and a lightweight improvement-plan markdown document.
 * 5. Support a dry-run mode suitable for CI or local smoke checks without invoking CodeQL.
 *
 * Usage examples (PowerShell):
 *   node ./scripts/run-codeql.mjs --dry-run
 *   node ./scripts/run-codeql.mjs --codeql-path "C:/codeql/codeql.exe"
 *   node ./scripts/run-codeql.mjs --threads=4 --packs=codeql/javascript-security-extended
 *   CODEQL_INCLUDE_EXTENDED=true node ./scripts/run-codeql.mjs
 *
 * The script intentionally avoids external dependencies to simplify execution inside
 * GitHub Actions or local developer environments.
 *
 * Environment overrides:
 * - CODEQL_DEFAULT_QUERY_PACKS: Comma-separated list to replace the default query packs.
 * - CODEQL_FALLBACK_QUERY_PACKS: Comma-separated list to replace fallback packs when default packs are unavailable.
 */

import { promises as fs } from 'node:fs';
import { execFile } from 'node:child_process';
import { spawn } from 'node:child_process';
import { URL } from 'node:url';
import { dirname, isAbsolute, normalize, relative, resolve } from 'node:path';
import { cpus } from 'node:os';
import process from 'node:process';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);

function parseEnvList(rawValue) {
  if (!rawValue) {
    return [];
  }

  return rawValue
    .split(',')
    .map(entry => entry.trim())
    .filter(Boolean);
}

const envDefaultQueryPacks = parseEnvList(process.env.CODEQL_DEFAULT_QUERY_PACKS);
const envFallbackQueryPacks = parseEnvList(process.env.CODEQL_FALLBACK_QUERY_PACKS);

const DEFAULT_DB_DIR = 'codeql-db';
const DEFAULT_SARIF = 'codeql-results.sarif';
const DEFAULT_SUMMARY = 'codeql-results-summary.csv';
const DEFAULT_PLAN = 'codeql-improvement-plan.md';
const DEFAULT_QUERY_PACKS =
  envDefaultQueryPacks.length > 0
    ? envDefaultQueryPacks
    : ['codeql/javascript-security-and-quality'];
const FALLBACK_QUERY_PACKS =
  envFallbackQueryPacks.length > 0 ? envFallbackQueryPacks : ['codeql/javascript-queries'];
const OPTIONAL_DEFAULT_QUERY_PACKS = ['codeql/javascript-security-extended'];

const includeExtendedDefaultPackFlag = (process.env.CODEQL_INCLUDE_EXTENDED ?? '').trim();
const shouldIncludeExtendedDefaultPack = includeExtendedDefaultPackFlag
  ? ['1', 'true', 'yes', 'on'].includes(includeExtendedDefaultPackFlag.toLowerCase())
  : false;

const CODEQL_REQUIRED_NODE_OPTION = '--experimental-default-type=commonjs';
const isWindows = process.platform === 'win32';

const severityOrdering = ['error', 'warning', 'note'];

const workspaceRoot = resolve(process.cwd());
const customQueryPackPath = resolve(workspaceRoot, 'codeql-custom-queries-javascript');

async function pathExists(pathLike) {
  try {
    await fs.access(pathLike);
    return true;
  } catch {
    return false;
  }
}

function parseArgs(argv) {
  const options = {
    dryRun: false,
    keepDb: false,
    keepResults: false,
    codeqlPath: null, // Will be resolved later
    dbPath: resolve(workspaceRoot, DEFAULT_DB_DIR),
    sarifPath: resolve(workspaceRoot, DEFAULT_SARIF),
    summaryPath: resolve(workspaceRoot, DEFAULT_SUMMARY),
    planPath: resolve(workspaceRoot, DEFAULT_PLAN),
    threads: '0',
    includeDefaultPacks: true,
    extraPacks: [],
  };

  for (let index = 0; index < argv.length; index += 1) {
    const raw = argv[index];
    if (!raw.startsWith('--')) {
      continue;
    }

    let flag = raw.slice(2);
    let value;

    if (flag.includes('=')) {
      const [name, inline] = flag.split(/=(.*)/);
      flag = name;
      value = inline === '' ? undefined : inline;
    }

    const ensureValue = errorMessage => {
      if (value == null) {
        const next = argv[index + 1];
        if (typeof next === 'string' && !next.startsWith('--')) {
          value = next;
          index += 1;
        }
      }
      if (value == null || value === '') {
        throw new Error(errorMessage);
      }
    };

    switch (flag) {
      case 'dry-run':
        options.dryRun = true;
        break;
      case 'keep-db':
        options.keepDb = true;
        break;
      case 'keep-results':
        options.keepResults = true;
        break;
      case 'codeql-path':
        ensureValue('--codeql-path requires a value');
        options.codeqlPath = value;
        break;
      case 'db':
        ensureValue('--db requires a directory path');
        options.dbPath = resolve(workspaceRoot, value);
        break;
      case 'sarif':
        ensureValue('--sarif requires a file path');
        options.sarifPath = resolve(workspaceRoot, value);
        break;
      case 'summary':
        ensureValue('--summary requires a file path');
        options.summaryPath = resolve(workspaceRoot, value);
        break;
      case 'plan':
        ensureValue('--plan requires a file path');
        options.planPath = resolve(workspaceRoot, value);
        break;
      case 'threads':
        ensureValue('--threads requires a numeric value');
        if (!Number.isInteger(Number(value))) {
          throw new Error('--threads must be an integer');
        }
        options.threads = String(value);
        break;
      case 'packs':
        ensureValue('--packs requires a comma-separated list');
        options.extraPacks.push(
          ...value
            .split(',')
            .map(entry => entry.trim())
            .filter(Boolean)
        );
        break;
      case 'no-default-packs':
        options.includeDefaultPacks = false;
        break;
      default:
        throw new Error(`Unknown flag --${flag}`);
    }
  }

  if (options.threads === 'auto') {
    options.threads = String(Math.max(1, Math.floor(cpus().length / 2)));
  }

  return options;
}

function logStep(message) {
  const timestamp = new Date().toISOString();
  process.stdout.write(`[${timestamp}] ${message}\n`);
}

function logDryRunDetails(title, details) {
  logStep(`DRY-RUN ▶ ${title}`);
  if (Array.isArray(details)) {
    for (const line of details) {
      process.stdout.write(`  - ${line}\n`);
    }
  } else if (typeof details === 'string') {
    process.stdout.write(`  - ${details}\n`);
  }
}

async function resolveCodeqlPath(providedPath) {
  // 1. If user provided a path, use it
  if (providedPath) {
    return providedPath;
  }

  // 2. Try local workspace paths first
  const localPaths = [
    resolve(workspaceRoot, 'codeql', 'codeql', isWindows ? 'codeql.exe' : 'codeql'),
    resolve(workspaceRoot, 'codeql', isWindows ? 'codeql.exe' : 'codeql'),
  ];

  for (const localPath of localPaths) {
    if (await pathExists(localPath)) {
      logStep(`Found local CodeQL CLI at ${relative(workspaceRoot, localPath)}`);
      return localPath;
    }
  }

  // 3. Fallback to system PATH
  return 'codeql';
}

async function assertCodeqlAvailable(codeqlPath) {
  try {
    const { stdout } = await execFileAsync(codeqlPath, ['--version']);
    logStep(`✅ CodeQL CLI 감지 완료: ${stdout.trim()}`);
  } catch (error) {
    const hint =
      'CodeQL CLI가 PATH에 없거나 codeql.cmd/codeql.exe가 설치되지 않았습니다. https://codeql.github.com/docs/codeql-cli/installation/ 가이드를 참고해 설치 후 다시 실행하세요.';
    if (error?.code === 'ENOENT') {
      throw new Error(
        `❌ CodeQL CLI(${codeqlPath})를 찾을 수 없습니다.\n\n트러블슈팅:\n  - CodeQL CLI 설치 확인\n  - PATH 환경 변수 설정 확인\n  - --codeql-path 옵션으로 경로 지정\n\n${hint}`
      );
    }
    throw new Error(
      `❌ CodeQL CLI 확인 중 오류가 발생했습니다: ${error.message ?? error}.\n\n${hint}`
    );
  }
}

async function removeIfExists(targetPath) {
  await fs.rm(targetPath, { force: true, recursive: true });
}

async function ensureParentDir(filePath) {
  await fs.mkdir(dirname(filePath), { recursive: true });
}

async function runCommand(command, args, options = {}) {
  logStep(`Executing: ${command} ${args.join(' ')}`);
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      stdio: 'inherit',
      ...options,
    });
    child.on('error', error => {
      reject(error);
    });
    child.on('exit', (code, signal) => {
      if (code === 0) {
        resolve();
      } else {
        const reason = signal ? `signal ${signal}` : `exit code ${code}`;
        reject(new Error(`${command} failed with ${reason}`));
      }
    });
  });
}

function ensureRequiredNodeOptions(currentOptions) {
  const normalized = typeof currentOptions === 'string' ? currentOptions.trim() : '';
  if (!normalized) {
    return CODEQL_REQUIRED_NODE_OPTION;
  }

  const tokens = normalized.split(/\s+/g);
  if (tokens.includes(CODEQL_REQUIRED_NODE_OPTION)) {
    return normalized;
  }

  return `${normalized} ${CODEQL_REQUIRED_NODE_OPTION}`;
}

async function resolveExecutablePath(command) {
  if (!command) {
    return null;
  }

  const containsPathSeparator = /[\\/]/.test(command);
  if (containsPathSeparator) {
    try {
      return await fs.realpath(command);
    } catch {
      return null;
    }
  }

  const locator = isWindows ? 'where' : 'which';
  try {
    const { stdout } = await execFileAsync(locator, [command]);
    const firstLine = stdout
      .split(/\r?\n/)
      .map(line => line.trim())
      .find(Boolean);
    if (!firstLine) {
      return null;
    }
    return await fs.realpath(firstLine);
  } catch {
    return null;
  }
}

async function ensureCliCommonJsCompatibility(executablePath) {
  if (!executablePath) {
    return;
  }

  const cliDir = dirname(executablePath);
  const packageJsonPath = resolve(cliDir, 'package.json');

  try {
    let existing = {};
    let hasExistingFile = false;

    try {
      const raw = await fs.readFile(packageJsonPath, 'utf8');
      existing = JSON.parse(raw);
      hasExistingFile = true;
    } catch (error) {
      if (error?.code !== 'ENOENT') {
        throw error;
      }
    }

    if (existing.type === 'commonjs') {
      return;
    }

    const next = { ...existing, type: 'commonjs' };
    const serialized = `${JSON.stringify(next, null, 2)}\n`;
    await fs.writeFile(packageJsonPath, serialized, 'utf8');

    const note = hasExistingFile ? 'Patched' : 'Created';
    logStep(
      `${note} CodeQL CLI package.json at ${relative(
        workspaceRoot,
        packageJsonPath
      )} to enforce CommonJS isolation`
    );
  } catch (error) {
    logStep(
      `Skipping CodeQL CommonJS shim (non-fatal): ${error?.message ?? error}. CLI path: ${executablePath}`
    );
  }
}

function createCodeqlEnv() {
  const env = { ...process.env };
  env.NODE_OPTIONS = ensureRequiredNodeOptions(env.NODE_OPTIONS);
  return env;
}

function composeQueryPackList(includeDefault, extraPacks) {
  const packs = [];
  if (includeDefault) {
    packs.push(...DEFAULT_QUERY_PACKS);
    if (shouldIncludeExtendedDefaultPack) {
      packs.push(...OPTIONAL_DEFAULT_QUERY_PACKS);
    }
  }
  if (extraPacks.length > 0) {
    packs.push(...extraPacks);
  }
  return packs;
}

function uriToRelativePath(uri) {
  if (!uri) {
    return null;
  }

  try {
    const url = new URL(uri);
    if (url.protocol === 'file:') {
      let pathname = decodeURIComponent(url.pathname);
      if (/^\/[A-Za-z]:/.test(pathname)) {
        pathname = pathname.slice(1);
      }
      return relative(workspaceRoot, normalize(pathname));
    }
  } catch {
    // Not a URL; fall through.
  }

  return relative(workspaceRoot, uri);
}

function escapeCsvValue(value) {
  if (value == null) {
    return '';
  }
  const str = String(value);
  if (str.includes('"') || str.includes(',') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function orderBySeverity(findings) {
  return [...findings].sort((a, b) => {
    const severityAIndex = severityOrdering.indexOf(a.severity);
    const severityBIndex = severityOrdering.indexOf(b.severity);
    const normalizedA = severityAIndex === -1 ? severityOrdering.length : severityAIndex;
    const normalizedB = severityBIndex === -1 ? severityOrdering.length : severityBIndex;
    if (normalizedA !== normalizedB) {
      return normalizedA - normalizedB;
    }
    return a.ruleId.localeCompare(b.ruleId);
  });
}

function buildSummaryCsv(findings) {
  const header = ['ruleId', 'severity', 'message', 'file', 'line', 'column', 'helpUrl'];
  const rows = findings.map(finding => [
    finding.ruleId,
    finding.severity,
    finding.message?.replace(/\s+/g, ' ').trim(),
    finding.location?.file ?? '',
    finding.location?.line ?? '',
    finding.location?.column ?? '',
    finding.helpUrl ?? '',
  ]);

  return [header, ...rows].map(row => row.map(escapeCsvValue).join(',')).join('\n');
}

function summarizeCounts(findings) {
  const counts = new Map();
  for (const finding of findings) {
    counts.set(finding.severity, (counts.get(finding.severity) ?? 0) + 1);
  }
  return counts;
}

function buildPlanMarkdown(findings, config, executedPacks) {
  const timestamp = new Date().toISOString();
  const total = findings.length;
  const counts = summarizeCounts(findings);
  const severityTableHeader = '| 심각도 | 개수 |\n| --- | --- |';
  const seen = new Set();
  const severityTableRows = [];
  for (const severity of severityOrdering) {
    if (counts.has(severity)) {
      severityTableRows.push(`| ${severity.toUpperCase()} | ${counts.get(severity)} |`);
      seen.add(severity);
    }
  }
  for (const [severity, count] of counts.entries()) {
    if (!seen.has(severity)) {
      severityTableRows.push(`| ${severity.toUpperCase()} | ${count} |`);
    }
  }

  const intro = [
    '# CodeQL 개선 계획',
    '',
    `- 생성 시각: ${timestamp}`,
    `- 데이터베이스: ${relative(workspaceRoot, config.dbPath)}`,
    `- SARIF 결과: ${relative(workspaceRoot, config.sarifPath)}`,
    `- 사용 쿼리 팩: ${executedPacks.join(', ') || '없음'}`,
    `- 총 결과 수: ${total}`,
    '',
  ];

  if (total === 0) {
    intro.push(
      '이번 분석에서 신규 CodeQL 경고가 발견되지 않았습니다. 다음 사이클에서도 주기적으로 검사해 주세요.'
    );
    return `${intro.join('\n')}\n`;
  }

  const findingsSectionHeader = '## 상세 개선 항목';
  const findingLines = orderBySeverity(findings).map(finding => {
    const locationLine = finding.location?.file
      ? `  - 위치: ${finding.location.file}${finding.location.line ? `:${finding.location.line}` : ''}`
      : null;

    const helpLine = finding.helpUrl ? `  - 가이드: ${finding.helpUrl}` : null;

    return [
      `- [ ] **${finding.ruleId}** (${finding.severity.toUpperCase()}) — ${finding.message?.replace(/\s+/g, ' ').trim()}`,
      locationLine,
      helpLine,
      `  - 우선순위 메모: ${finding.priority}`,
    ]
      .filter(Boolean)
      .join('\n');
  });

  const plan = [
    ...intro,
    severityTableHeader,
    ...severityTableRows,
    '',
    findingsSectionHeader,
    '',
    ...findingLines,
    '',
    '---',
    '',
    '### 후속 절차 제안',
    '',
    '- [ ] 상위 심각도(E/W) 항목을 TDD 백로그에 등록하고 담당자를 지정합니다.',
    '- [ ] `docs/TDD_REFACTORING_PLAN.md`의 "다음 사이클 준비" 섹션을 갱신합니다.',
    '- [ ] 위험도 기준으로 린트/테스트 강화가 필요한 경우 Vitest 케이스를 추가합니다.',
  ];

  return `${plan.join('\n')}\n`;
}

function extractFindingsFromSarif(data) {
  const runs = Array.isArray(data?.runs) ? data.runs : [];
  const findings = [];
  const ruleIndex = new Map();

  for (const run of runs) {
    const rules = run?.tool?.driver?.rules ?? [];
    for (const rule of rules) {
      if (rule?.id) {
        ruleIndex.set(rule.id, rule);
      }
    }
  }

  for (const run of runs) {
    const results = Array.isArray(run?.results) ? run.results : [];
    for (const result of results) {
      const ruleId = result?.ruleId ?? result?.rule?.id ?? 'unknown-rule';
      const rule = ruleIndex.get(ruleId) ?? {};
      const severity = (
        result?.level ??
        rule?.defaultConfiguration?.level ??
        'warning'
      ).toLowerCase();
      const priority =
        result?.properties?.['problem.severity'] ??
        rule?.properties?.['problem.severity'] ??
        severity;
      const helpUrl = rule?.helpUri ?? result?.properties?.['externalUrl'];
      const message = result?.message?.text ?? rule?.shortDescription?.text ?? '';
      const locations = Array.isArray(result?.locations) ? result.locations : [];
      const primary = locations[0]?.physicalLocation;
      let location;
      if (primary?.artifactLocation?.uri) {
        location = {
          file: uriToRelativePath(primary.artifactLocation.uri),
          line: primary.region?.startLine ?? null,
          column: primary.region?.startColumn ?? null,
        };
      }

      findings.push({
        ruleId,
        severity,
        priority,
        helpUrl: helpUrl ?? null,
        message,
        location: location ?? null,
      });
    }
  }

  return findings;
}

async function generateReports(config, executedPacks) {
  const sarifRaw = await fs.readFile(config.sarifPath, 'utf8');
  const sarif = JSON.parse(sarifRaw);
  const findings = extractFindingsFromSarif(sarif);

  // SARIF 통계 로깅 강화 (쿼리 팩 정보 포함)
  const totalRules = sarif.runs?.[0]?.tool?.driver?.rules?.length ?? 0;
  const jsSecurityRules =
    sarif.runs?.[0]?.tool?.driver?.rules?.filter(
      r => r.id?.startsWith('js/') && r.properties?.['security-severity']
    ).length ?? 0;
  const jsSecurityRatio =
    totalRules > 0 ? ((jsSecurityRules / totalRules) * 100).toFixed(1) : '0.0';

  logStep(`📊 SARIF 분석 완료:`);
  logStep(`   - 전체 규칙 수: ${totalRules}개`);
  logStep(`   - JS 보안 규칙: ${jsSecurityRules}개 (${jsSecurityRatio}%)`);
  logStep(`   - 발견된 경고: ${findings.length}개`);

  const csv = buildSummaryCsv(findings);
  const markdown = buildPlanMarkdown(findings, config, executedPacks);

  await ensureParentDir(config.summaryPath);
  await ensureParentDir(config.planPath);

  await fs.writeFile(config.summaryPath, `${csv}\n`, 'utf8');
  await fs.writeFile(config.planPath, markdown, 'utf8');

  logStep(`✅ 요약 CSV 생성: ${relative(workspaceRoot, config.summaryPath)}`);
  logStep(`✅ 개선 계획 Markdown 생성: ${relative(workspaceRoot, config.planPath)}`);
}

async function determineQueryPacks(includeDefault, extraPacks) {
  const packs = composeQueryPackList(includeDefault, extraPacks);
  // 커스텀 쿼리 팩은 Fallback으로만 사용 (주 쿼리 팩 목록에서 제외)
  // if (await pathExists(customQueryPackPath)) {
  //   packs.push(customQueryPackPath);
  // }
  return packs;
}

async function isLocalPackReference(pack) {
  if (typeof pack !== 'string' || pack.length === 0) {
    return false;
  }

  if (pack.startsWith('file://')) {
    return true;
  }

  if (isAbsolute(pack)) {
    return true;
  }

  if (await pathExists(pack)) {
    return true;
  }

  const resolvedCandidate = resolve(workspaceRoot, pack);
  if (await pathExists(resolvedCandidate)) {
    return true;
  }

  return false;
}

async function ensureQueryPacksAvailable(codeqlPath, packs) {
  const available = [];
  for (const pack of packs) {
    if (await isLocalPackReference(pack)) {
      available.push(pack);
      continue;
    }

    try {
      logStep(`📦 CodeQL 쿼리 팩 다운로드 시도: ${pack}`);
      await execFileAsync(codeqlPath, ['pack', 'download', pack], {
        env: createCodeqlEnv(),
      });
      logStep(`✅ 쿼리 팩 다운로드 성공: ${pack}`);
      available.push(pack);
    } catch (error) {
      const stdout = typeof error?.stdout === 'string' ? error.stdout : '';
      const stderr = typeof error?.stderr === 'string' ? error.stderr : '';
      const combined = [stdout, stderr]
        .map(entry => entry.trim())
        .filter(Boolean)
        .join('\n');
      const normalized = combined.toLowerCase();
      if (normalized.includes('http/1.1 403') || normalized.includes('403 forbidden')) {
        logStep(
          `⚠️  쿼리 팩 접근 거부: "${pack}"\n    → GitHub Advanced Security 전용 쿼리 팩일 수 있습니다.\n    → Fallback 쿼리 팩 사용을 권장합니다.`
        );
        continue;
      }
      if (normalized.includes('http/1.1 404') || normalized.includes('404 not found')) {
        logStep(
          `⚠️  쿼리 팩을 찾을 수 없음: "${pack}"\n    → 레지스트리에서 해당 팩이 존재하지 않습니다.`
        );
        continue;
      }
      const reason = combined || error?.message || String(error);
      throw new Error(
        `❌ CodeQL 쿼리 팩 다운로드 실패: "${pack}"\n\n사유: ${reason}\n\n트러블슈팅:\n  - 네트워크 연결 확인\n  - GitHub 인증 토큰 설정 확인\n  - 쿼리 팩 이름 확인`
      );
    }
  }

  return available;
}

async function dryRun(config) {
  const packs = await determineQueryPacks(config.includeDefaultPacks, config.extraPacks);
  logDryRunDetails('실행 설정', [
    `작업 루트: ${workspaceRoot}`,
    `CodeQL CLI: ${config.codeqlPath}`,
    `데이터베이스 경로: ${config.dbPath}`,
    `SARIF 출력: ${config.sarifPath}`,
    `CSV 요약: ${config.summaryPath}`,
    `개선 계획: ${config.planPath}`,
    `스레드: ${config.threads}`,
    `쿼리 팩: ${packs.join(', ') || '없음'}`,
    config.keepDb ? '기존 데이터베이스 유지' : '데이터베이스 재생성',
    config.keepResults ? '기존 결과 유지' : '기존 SARIF/요약 삭제',
  ]);

  logDryRunDetails('명령 미리보기', [
    `${config.codeqlPath} database create ${config.dbPath} --language=javascript --overwrite --source-root ${workspaceRoot} --threads=${config.threads}`,
    `${config.codeqlPath} database analyze ${config.dbPath} ${packs.join(' ')} --format=sarif-latest --output ${config.sarifPath} --threads=${config.threads}`,
    'SARIF 결과를 기반으로 CSV 및 개선 계획을 생성합니다.',
  ]);
}

async function main() {
  let config;
  try {
    config = parseArgs(process.argv.slice(2));
  } catch (error) {
    process.stderr.write(`Argument parsing failed: ${error.message}\n`);
    process.exitCode = 1;
    return;
  }

  // Resolve CodeQL path before proceeding
  config.codeqlPath = await resolveCodeqlPath(config.codeqlPath);

  if (config.threads === '0') {
    config.threads = String(Math.max(1, cpus().length - 1));
  }

  const packs = await determineQueryPacks(config.includeDefaultPacks, config.extraPacks);

  if (config.dryRun) {
    await dryRun(config);
    return;
  }

  try {
    await assertCodeqlAvailable(config.codeqlPath);
    const resolvedCliPath = await resolveExecutablePath(config.codeqlPath);
    await ensureCliCommonJsCompatibility(resolvedCliPath);
    let availablePacks = await ensureQueryPacksAvailable(config.codeqlPath, packs);

    if (availablePacks.length === 0 && config.includeDefaultPacks) {
      const fallbackCandidates = [];

      if (config.includeDefaultPacks) {
        fallbackCandidates.push(...FALLBACK_QUERY_PACKS);
      }

      if (config.extraPacks.length > 0) {
        fallbackCandidates.push(...config.extraPacks);
      }

      if (await pathExists(customQueryPackPath)) {
        fallbackCandidates.push(customQueryPackPath);
      }

      const uniqueFallbacks = [...new Set(fallbackCandidates)];

      if (uniqueFallbacks.length > 0) {
        logStep('');
        logStep('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        logStep('⚠️  Fallback 쿼리 팩으로 전환합니다');
        logStep('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        logStep('');
        logStep('📌 전환 사유:');
        logStep('   표준 쿼리 팩(codeql/javascript-security-and-quality) 접근이 거부되었습니다.');
        logStep('   GitHub Advanced Security가 활성화되지 않은 환경으로 추정됩니다.');
        logStep('');
        logStep('📦 Fallback 쿼리 팩 정보:');
        logStep(`   - 사용할 팩: ${uniqueFallbacks.join(', ')}`);
        logStep('   - 예상 규칙 수: 50+ 개 (표준 팩 대비 제한적)');
        logStep('   - 커버리지: 기본 보안 규칙 중심 (확장 규칙 미포함)');
        logStep('');
        logStep('💡 환경별 가이드:');
        logStep('   [로컬 환경]');
        logStep('     - Fallback 쿼리 팩으로 기본 보안 분석 가능');
        logStep('     - 완전한 분석은 CI 환경(GitHub Actions)에서 자동 실행됨');
        logStep('   [CI 환경]');
        logStep('     - GitHub Advanced Security 활성화 시 400+ 규칙 자동 적용');
        logStep('     - SARIF 업로드로 Code Scanning 대시보드 연동');
        logStep('');
        logStep('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        logStep('');
        availablePacks = await ensureQueryPacksAvailable(config.codeqlPath, uniqueFallbacks);
      }
    }

    if (availablePacks.length === 0) {
      throw new Error(
        '❌ 사용 가능한 CodeQL 쿼리 팩이 없습니다.\n\n트러블슈팅:\n  - GitHub Advanced Security 활성화 확인\n  - 커스텀 쿼리 팩 경로 확인\n  - --packs 옵션으로 로컬 쿼리 팩 지정\n\n문의: https://docs.github.com/en/code-security/code-scanning'
      );
    }

    // 쿼리 팩 종류 감지 및 로깅
    const isStandardPack = availablePacks.some(p => p.includes('javascript-security-and-quality'));
    const isFallbackPack = availablePacks.some(p => p.includes('javascript-queries'));
    const packType = isStandardPack
      ? '표준 쿼리 팩'
      : isFallbackPack
        ? 'Fallback 쿼리 팩'
        : '커스텀 쿼리 팩';
    const expectedRules = isStandardPack ? '400+' : isFallbackPack ? '50+' : '알 수 없음';

    logStep('');
    logStep('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    logStep(`📦 쿼리 팩 종류: ${packType}`);
    logStep('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    logStep(`   - 총 ${availablePacks.length}개 팩 사용`);
    logStep(`   - 예상 규칙 수: ${expectedRules} 개`);
    logStep('');
    availablePacks.forEach((pack, idx) => {
      logStep(`   [${idx + 1}] ${pack}`);
    });
    logStep('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    logStep('');

    if (!config.keepDb && (await pathExists(config.dbPath))) {
      logStep(`Removing existing database at ${config.dbPath}`);
      await removeIfExists(config.dbPath);
    }

    if (!config.keepResults) {
      await removeIfExists(config.sarifPath);
      await removeIfExists(config.summaryPath);
      await removeIfExists(config.planPath);
    }

    await runCommand(
      config.codeqlPath,
      [
        'database',
        'create',
        config.dbPath,
        '--language=javascript',
        '--overwrite',
        '--source-root',
        workspaceRoot,
        '--threads',
        config.threads,
      ],
      {
        env: createCodeqlEnv(),
      }
    );

    const analyzeArgs = [
      'database',
      'analyze',
      config.dbPath,
      ...availablePacks,
      '--format=sarif-latest',
      '--output',
      config.sarifPath,
      '--threads',
      config.threads,
    ];

    await ensureParentDir(config.sarifPath);
    await runCommand(config.codeqlPath, analyzeArgs, {
      env: createCodeqlEnv(),
    });

    await generateReports(config, availablePacks);
    logStep('');
    logStep('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    logStep('✅ CodeQL 분석 완료');
    logStep('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    logStep('');
    logStep('📁 생성된 산출물:');
    logStep(`   - SARIF: ${relative(workspaceRoot, config.sarifPath)}`);
    logStep(`   - CSV 요약: ${relative(workspaceRoot, config.summaryPath)}`);
    logStep(`   - 개선 계획: ${relative(workspaceRoot, config.planPath)}`);
    logStep('');
    logStep('💡 다음 단계:');
    logStep('   1. 개선 계획 문서 검토');
    logStep('   2. 우선순위 높은 경고부터 대응');
    logStep('   3. TDD 백로그에 등록');
    logStep('');
    logStep('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  } catch (error) {
    process.stderr.write('\n');
    process.stderr.write('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    process.stderr.write('❌ CodeQL 실행 실패\n');
    process.stderr.write('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    process.stderr.write('\n');
    process.stderr.write(`오류: ${error.message}\n`);
    process.stderr.write('\n');
    process.stderr.write('💡 트러블슈팅:\n');
    process.stderr.write('   - CodeQL CLI 설치 확인: codeql --version\n');
    process.stderr.write('   - 네트워크 연결 확인\n');
    process.stderr.write('   - GitHub 인증 토큰 설정 확인\n');
    process.stderr.write('   - --dry-run 옵션으로 설정 미리보기\n');
    process.stderr.write('\n');
    process.stderr.write('📚 참고 문서:\n');
    process.stderr.write(
      '   - CodeQL CLI 설치: https://codeql.github.com/docs/codeql-cli/installation/\n'
    );
    process.stderr.write(
      '   - GitHub Advanced Security: https://docs.github.com/en/code-security\n'
    );
    process.stderr.write('\n');
    process.stderr.write('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    process.stderr.write('\n');
    process.exitCode = 1;
  }
}

main();
