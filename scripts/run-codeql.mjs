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
 *
 * The script intentionally avoids external dependencies to simplify execution inside
 * GitHub Actions or local developer environments.
 */

import { promises as fs } from 'node:fs';
import { execFile } from 'node:child_process';
import { spawn } from 'node:child_process';
import { URL } from 'node:url';
import { dirname, normalize, relative, resolve } from 'node:path';
import { cpus } from 'node:os';
import process from 'node:process';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);

const DEFAULT_DB_DIR = 'codeql-db';
const DEFAULT_SARIF = 'codeql-results.sarif';
const DEFAULT_SUMMARY = 'codeql-results-summary.csv';
const DEFAULT_PLAN = 'codeql-improvement-plan.md';
const DEFAULT_QUERY_PACKS = [
  'codeql/javascript-security-extended',
  'codeql/javascript-security-and-quality',
];

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
    codeqlPath: 'codeql',
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

async function assertCodeqlAvailable(codeqlPath) {
  try {
    const { stdout } = await execFileAsync(codeqlPath, ['--version']);
    logStep(`Detected CodeQL CLI: ${stdout.trim()}`);
  } catch (error) {
    const hint =
      'CodeQL CLI가 PATH에 없거나 codeql.cmd/codeql.exe가 설치되지 않았습니다. https://codeql.github.com/docs/codeql-cli/installation/ 가이드를 참고해 설치 후 다시 실행하세요.';
    if (error?.code === 'ENOENT') {
      throw new Error(`CodeQL CLI(${codeqlPath})를 찾을 수 없습니다. ${hint}`);
    }
    throw new Error(`CodeQL CLI 확인 중 오류가 발생했습니다: ${error.message ?? error}. ${hint}`);
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

function composeQueryPackList(includeDefault, extraPacks) {
  const packs = [];
  if (includeDefault) {
    packs.push(...DEFAULT_QUERY_PACKS);
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
  const csv = buildSummaryCsv(findings);
  const markdown = buildPlanMarkdown(findings, config, executedPacks);

  await ensureParentDir(config.summaryPath);
  await ensureParentDir(config.planPath);

  await fs.writeFile(config.summaryPath, `${csv}\n`, 'utf8');
  await fs.writeFile(config.planPath, markdown, 'utf8');

  logStep(`요약 CSV 생성: ${relative(workspaceRoot, config.summaryPath)}`);
  logStep(`개선 계획 Markdown 생성: ${relative(workspaceRoot, config.planPath)}`);
}

async function determineQueryPacks(includeDefault, extraPacks) {
  const packs = composeQueryPackList(includeDefault, extraPacks);
  if (await pathExists(customQueryPackPath)) {
    packs.push(customQueryPackPath);
  }
  return packs;
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

    if (!config.keepDb && (await pathExists(config.dbPath))) {
      logStep(`Removing existing database at ${config.dbPath}`);
      await removeIfExists(config.dbPath);
    }

    if (!config.keepResults) {
      await removeIfExists(config.sarifPath);
      await removeIfExists(config.summaryPath);
      await removeIfExists(config.planPath);
    }

    await runCommand(config.codeqlPath, [
      'database',
      'create',
      config.dbPath,
      '--language=javascript',
      '--overwrite',
      '--source-root',
      workspaceRoot,
      '--threads',
      config.threads,
    ]);

    const analyzeArgs = [
      'database',
      'analyze',
      config.dbPath,
      ...packs,
      '--format=sarif-latest',
      '--output',
      config.sarifPath,
      '--threads',
      config.threads,
    ];

    await ensureParentDir(config.sarifPath);
    await runCommand(config.codeqlPath, analyzeArgs);

    await generateReports(config, packs);
    logStep('CodeQL 분석이 완료되었습니다.');
  } catch (error) {
    process.stderr.write(`CodeQL 실행이 실패했습니다: ${error.message}\n`);
    process.exitCode = 1;
  }
}

main();
