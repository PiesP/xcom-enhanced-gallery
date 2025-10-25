#!/usr/bin/env node

/**
 * Vitest 성능 벤치마크 스크립트
 * 
 * 목적: 프로젝트별 테스트 실행 시간을 측정하고, 최적화 전후 비교
 * 
 * 사용법:
 *   npm run scripts/benchmark-vitest.js                  # 기본 실행 (verbose 출력)
 *   npm run scripts/benchmark-vitest.js --quiet          # 조용한 모드
 *   npm run scripts/benchmark-vitest.js --compare result # 기준선과 비교
 *   npm run scripts/benchmark-vitest.js --save           # 결과 저장
 * 
 * 예상 출력: metrics/benchmark-results.json, metrics/benchmark-report.txt
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// 설정
const PROJECT_ROOT = path.resolve(__dirname, '..');
const RESULTS_FILE = path.join(PROJECT_ROOT, 'metrics', 'benchmark-results.json');
const REPORT_FILE = path.join(PROJECT_ROOT, 'metrics', 'benchmark-report.txt');

let VERBOSE = true;
let SAVE_RESULTS = false;

// 색상 정의 (ANSI 코드)
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
};

// 프로젝트 목록 (vitest.config.ts의 projects 기준)
const PROJECTS = [
  'smoke',
  'fast',
  'unit',
  'features',
  'styles',
  'performance',
  'phases',
  'refactor',
  'guards',
  'browser',
  'raf-timing',
];

/**
 * 로깅 함수
 */
function log_info(msg) {
  if (VERBOSE) {
    console.log(`${colors.blue}ℹ${colors.reset} ${msg}`);
  }
}

function log_success(msg) {
  if (VERBOSE) {
    console.log(`${colors.green}✓${colors.reset} ${msg}`);
  }
}

function log_warn(msg) {
  console.error(`${colors.yellow}⚠${colors.reset} ${msg}`);
}

function log_error(msg) {
  console.error(`${colors.red}✗${colors.reset} ${msg}`);
}

/**
 * 벤치마크 실행
 * @param {string} project - 프로젝트 이름
 * @returns {number} 실행 시간 (ms)
 */
function run_benchmark(project) {
  log_info(`Testing project: ${project}...`);
  
  const startTime = Date.now();
  
  try {
    // 테스트 실행 (stderr와 stdout 캡처)
    execSync(
      `npm run test -- --project ${project} --run`,
      { cwd: PROJECT_ROOT, stdio: 'pipe', timeout: 120000 }
    );
    
    const endTime = Date.now();
    const duration = endTime - startTime;
    
    log_success(`${project}: ${duration}ms`);
    return duration;
  } catch (error) {
    const endTime = Date.now();
    const duration = endTime - startTime;
    
    log_warn(`${project}: ${duration}ms (FAILED)`);
    return duration;
  }
}

/**
 * 결과를 JSON으로 저장
 * @param {Object} results - 프로젝트별 결과
 */
function save_json_results(results) {
  const timestamp = new Date().toISOString();
  const data = {
    timestamp,
    results,
  };
  
  // metrics 디렉토리 생성
  const metricsDir = path.join(PROJECT_ROOT, 'metrics');
  if (!fs.existsSync(metricsDir)) {
    fs.mkdirSync(metricsDir, { recursive: true });
  }
  
  fs.writeFileSync(RESULTS_FILE, JSON.stringify(data, null, 2), 'utf-8');
  log_success(`Results saved to ${RESULTS_FILE}`);
}

/**
 * 보고서 생성
 * @param {Object} results - 프로젝트별 결과
 */
function generate_report(results) {
  let total = 0;
  let max_duration = 0;
  let max_project = '';
  
  const lines = [
    '='.repeat(50),
    'Vitest Performance Benchmark Report',
    '='.repeat(50),
    `Generated: ${new Date().toISOString()}`,
    '',
    'Project-by-Project Results:',
    '-'.repeat(50),
  ];
  
  PROJECTS.forEach(project => {
    const ms = results[project] || 0;
    total += ms;
    
    if (ms > max_duration) {
      max_duration = ms;
      max_project = project;
    }
    
    lines.push(`${project.padEnd(15)}: ${String(ms).padStart(8)} ms`);
  });
  
  lines.push('');
  lines.push('Summary:');
  lines.push('-'.repeat(50));
  lines.push(`Total Time:      ${String(total).padStart(8)} ms`);
  lines.push(`Average Time:    ${String(Math.floor(total / PROJECTS.length)).padStart(8)} ms`);
  lines.push(`Slowest:         ${max_project} (${max_duration} ms)`);
  lines.push('');
  lines.push('='.repeat(50));
  
  const report = lines.join('\n');
  
  // metrics 디렉토리 생성
  const metricsDir = path.join(PROJECT_ROOT, 'metrics');
  if (!fs.existsSync(metricsDir)) {
    fs.mkdirSync(metricsDir, { recursive: true });
  }
  
  fs.writeFileSync(REPORT_FILE, report, 'utf-8');
  console.log(report);
}

/**
 * 메인 함수
 */
function main() {
  // 인자 파싱
  const args = process.argv.slice(2);
  args.forEach(arg => {
    switch (arg) {
      case '--quiet':
        VERBOSE = false;
        break;
      case '--save':
        SAVE_RESULTS = true;
        break;
      default:
        // ignore
    }
  });
  
  log_info(`Starting Vitest benchmark...`);
  log_info(`Projects: ${PROJECTS.length}`);
  console.log('');
  
  // 각 프로젝트별 벤치마크
  const results = {};
  PROJECTS.forEach(project => {
    results[project] = run_benchmark(project);
  });
  
  console.log('');
  
  // 결과 출력
  generate_report(results);
  
  // 결과 저장 (선택사항)
  if (SAVE_RESULTS) {
    save_json_results(results);
  }
  
  log_success('Benchmark completed!');
}

// 스크립트 실행
main();
