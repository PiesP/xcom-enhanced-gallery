#!/usr/bin/env node

/**
 * 빌드 메트릭스 분석 스크립트
 * 번들 크기와 성능 메트릭을 분석하고 리포트를 생성합니다.
 */

import { statSync, existsSync, writeFileSync, readdirSync, mkdirSync, readFileSync } from 'fs';
import { resolve } from 'path';
import { brotliCompressSync } from 'zlib';

const BUNDLE_SIZE_LIMIT = 550 * 1024; // 550KB

function analyzeBundle() {
  console.log('📊 Analyzing bundle metrics...');

  const distPath = resolve(process.cwd(), 'dist');
  const metricsDir = resolve(process.cwd(), 'metrics');
  const metricsPath = resolve(metricsDir, 'bundle-metrics.json');

  // 프로덕션 파일 우선, 없으면 개발 파일 사용
  let userScriptPath = resolve(distPath, 'xcom-enhanced-gallery.user.js');
  if (!existsSync(userScriptPath)) {
    userScriptPath = resolve(distPath, 'xcom-enhanced-gallery.dev.user.js');
  }

  if (!existsSync(userScriptPath)) {
    console.error('❌ UserScript file not found at:', userScriptPath);
    console.error('   Available files in dist/:', readdirSync(distPath));
    process.exit(1);
  }

  const stats = statSync(userScriptPath);
  const fileSize = stats.size;
  const brotliSize = brotliCompressSync(readFileSync(userScriptPath)).byteLength;
  const isWithinBudget = fileSize <= BUNDLE_SIZE_LIMIT;

  const analysis = {
    totalSize: fileSize,
    isWithinBudget,
    sizeLimit: BUNDLE_SIZE_LIMIT,
    timestamp: new Date().toISOString(),
    chunks: [
      {
        name: 'xcom-enhanced-gallery.user.js',
        size: fileSize,
        type: 'userscript',
      },
    ],
  };

  // 분석 결과 저장
  const outputPath = resolve(distPath, 'bundle-analysis.json');
  writeFileSync(outputPath, JSON.stringify(analysis, null, 2));

  let previousMetrics = null;
  if (existsSync(metricsPath)) {
    try {
      previousMetrics = JSON.parse(readFileSync(metricsPath, 'utf-8'));
    } catch (error) {
      console.warn('⚠️ 기존 bundle-metrics.json을 읽는 중 오류가 발생했습니다:', error.message);
    }
  }

  const defaultRawTolerance = 4096;
  const defaultBrotliTolerance = 2048;

  const rawTolerance =
    previousMetrics?.measurements?.rawBytes?.toleranceBytes ?? defaultRawTolerance;
  const brotliTolerance =
    previousMetrics?.measurements?.brotliBytes?.toleranceBytes ?? defaultBrotliTolerance;

  const rawBudget = Math.max(
    previousMetrics?.measurements?.rawBytes?.budgetBytes ?? fileSize + rawTolerance,
    fileSize + rawTolerance
  );
  const brotliBudget = Math.max(
    previousMetrics?.measurements?.brotliBytes?.budgetBytes ?? brotliSize + brotliTolerance,
    brotliSize + brotliTolerance
  );

  const metricsVersion = previousMetrics?.version != null ? previousMetrics.version + 1 : 1;
  const defaultNotes =
    process.env.METRICS_NOTES ??
    'FRAME-ALT-001 Stage D readiness calibration (auto-generated via scripts/build-metrics.js).';

  const metrics = {
    version: metricsVersion,
    artifact: 'xcom-enhanced-gallery.user.js',
    generatedAt: new Date().toISOString(),
    environment: 'production',
    measurements: {
      rawBytes: {
        baselineBytes: fileSize,
        toleranceBytes: rawTolerance,
        budgetBytes: rawBudget,
      },
      brotliBytes: {
        baselineBytes: brotliSize,
        toleranceBytes: brotliTolerance,
        budgetBytes: brotliBudget,
      },
    },
    notes: defaultNotes,
  };

  mkdirSync(metricsDir, { recursive: true });
  writeFileSync(metricsPath, JSON.stringify(metrics, null, 2));

  // 콘솔 출력
  console.log('📦 Bundle Analysis Results:');
  console.log(`- File: ${userScriptPath}`);
  console.log(`- Size: ${(fileSize / 1024).toFixed(2)} KB`);
  console.log(`- Limit: ${(BUNDLE_SIZE_LIMIT / 1024).toFixed(2)} KB`);
  console.log(`- Within Budget: ${isWithinBudget ? '✅' : '❌'}`);
  console.log(`- Brotli Size: ${(brotliSize / 1024).toFixed(2)} KB`);
  console.log(`📄 Metrics saved to: ${metricsPath}`);

  if (!isWithinBudget) {
    console.warn(
      `⚠️ Bundle size exceeds limit by ${((fileSize - BUNDLE_SIZE_LIMIT) / 1024).toFixed(2)} KB`
    );
  }

  console.log(`📄 Analysis saved to: ${outputPath}`);

  return analysis;
}

// 스크립트 실행
try {
  analyzeBundle();
} catch (error) {
  console.error('❌ Bundle analysis failed:', error.message);
  process.exit(1);
}
