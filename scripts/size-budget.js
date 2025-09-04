/**
 * @fileoverview Size Budget Script - Phase 3 Performance Budgets
 * @description 번들 사이즈와 성능 메트릭을 추적하는 스크립트
 */

/* eslint-env node */
import { readFileSync, writeFileSync, mkdirSync, statSync } from 'fs';
import { join } from 'path';
import { gzipSync } from 'zlib';

const DIST_DIR = join(process.cwd(), 'dist');
const REPORTS_DIR = join(process.cwd(), 'reports');
const OUTPUT_PATH = join(REPORTS_DIR, 'perf-budget.json');

// 성능 예산 임계값 (bytes)
const BUDGETS = {
  maxGzipSize: 150 * 1024, // 150KB
  maxRawSize: 500 * 1024, // 500KB
  maxModules: 50, // 모듈 수
};

function calculateGzipSize(content) {
  try {
    return gzipSync(content).length;
  } catch {
    return 0;
  }
}

function analyzeBundles() {
  const results = {
    timestamp: new Date().toISOString(),
    budgets: BUDGETS,
    analysis: {},
    violations: [],
    summary: {
      totalFiles: 0,
      totalRawSize: 0,
      totalGzipSize: 0,
      passed: true,
    },
  };

  try {
    // dist 디렉토리 분석
    const modes = ['dev', 'prod'];

    for (const mode of modes) {
      const modeDir = join(DIST_DIR, mode);
      const jsFiles = [];

      try {
        const files = require('fs').readdirSync(modeDir);
        jsFiles.push(...files.filter(f => f.endsWith('.js')));
      } catch {
        continue; // 디렉토리 없으면 건너뛰기
      }

      for (const file of jsFiles) {
        const filePath = join(modeDir, file);
        const content = readFileSync(filePath);
        const rawSize = content.length;
        const gzipSize = calculateGzipSize(content);

        const fileAnalysis = {
          file,
          mode,
          rawSize,
          gzipSize,
          passed: {
            rawSize: rawSize <= BUDGETS.maxRawSize,
            gzipSize: gzipSize <= BUDGETS.maxGzipSize,
          },
        };

        results.analysis[`${mode}/${file}`] = fileAnalysis;
        results.summary.totalFiles++;
        results.summary.totalRawSize += rawSize;
        results.summary.totalGzipSize += gzipSize;

        // 위반 사항 체크
        if (!fileAnalysis.passed.rawSize) {
          results.violations.push({
            type: 'rawSize',
            file: `${mode}/${file}`,
            actual: rawSize,
            budget: BUDGETS.maxRawSize,
            overage: rawSize - BUDGETS.maxRawSize,
          });
          results.summary.passed = false;
        }

        if (!fileAnalysis.passed.gzipSize) {
          results.violations.push({
            type: 'gzipSize',
            file: `${mode}/${file}`,
            actual: gzipSize,
            budget: BUDGETS.maxGzipSize,
            overage: gzipSize - BUDGETS.maxGzipSize,
          });
          results.summary.passed = false;
        }
      }
    }

    // 모듈 수 체크 (대략적)
    const estimatedModules = results.summary.totalFiles * 5; // 대략적 추정
    if (estimatedModules > BUDGETS.maxModules) {
      results.violations.push({
        type: 'moduleCount',
        actual: estimatedModules,
        budget: BUDGETS.maxModules,
        overage: estimatedModules - BUDGETS.maxModules,
      });
      results.summary.passed = false;
    }
  } catch (error) {
    results.error = error.message;
    results.summary.passed = false;
  }

  return results;
}

function main() {
  try {
    mkdirSync(REPORTS_DIR, { recursive: true });
  } catch {
    // ignore mkdir errors
  }

  const report = analyzeBundles();

  // 리포트 저장
  writeFileSync(OUTPUT_PATH, JSON.stringify(report, null, 2));

  // 콘솔 출력
  console.log(JSON.stringify(report, null, 2));

  // CI에서 실패 처리
  if (!report.summary.passed) {
    console.error('\n❌ Performance Budget Violations Found!');
    report.violations.forEach(v => {
      console.error(`  ${v.type}: ${v.file || 'global'} exceeds budget by ${v.overage} bytes`);
    });
    process.exit(1);
  } else {
    console.log('\n✅ All performance budgets passed!');
  }
}

main();
