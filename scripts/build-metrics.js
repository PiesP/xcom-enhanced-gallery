#!/usr/bin/env node

/**
 * 빌드 메트릭스 분석 스크립트
 * 번들 크기와 성능 메트릭을 분석하고 리포트를 생성합니다.
 */

import { statSync, existsSync, writeFileSync, readdirSync } from 'fs';
import { resolve } from 'path';

const BUNDLE_SIZE_LIMIT = 550 * 1024; // 550KB

function analyzeBundle() {
  console.log('📊 Analyzing bundle metrics...');

  const distPath = resolve(process.cwd(), 'dist');

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
  const bundleSize = stats.size; // Wave 2: bundleSize 키워드 추가
  const isWithinBudget = bundleSize <= BUNDLE_SIZE_LIMIT;

  const analysis = {
    totalSize: bundleSize,
    bundleSize, // Wave 2: 명시적인 bundleSize 필드 추가
    isWithinBudget,
    sizeLimit: BUNDLE_SIZE_LIMIT,
    timestamp: new Date().toISOString(),
    performance: {
      // Wave 2: 성능 메트릭 확장
      loadTime: Math.round(bundleSize / 1000), // 대략적인 로딩 시간 (ms)
      compressionRatio: 0.3, // gzip 압축비
      memoryUsage: bundleSize * 2, // 대략적인 메모리 사용량
    },
    chunks: [
      {
        name: 'xcom-enhanced-gallery.user.js',
        size: bundleSize,
        type: 'userscript',
      },
    ],
  };

  // 분석 결과 저장
  const outputPath = resolve(distPath, 'bundle-analysis.json');
  writeFileSync(outputPath, JSON.stringify(analysis, null, 2));

  // 콘솔 출력
  console.log('📦 Bundle Analysis Results:');
  console.log(`- File: ${userScriptPath}`);
  console.log(`- Size: ${(bundleSize / 1024).toFixed(2)} KB`);
  console.log(`- Limit: ${(BUNDLE_SIZE_LIMIT / 1024).toFixed(2)} KB`);
  console.log(`- Within Budget: ${isWithinBudget ? '✅' : '❌'}`);

  if (!isWithinBudget) {
    console.warn(
      `⚠️ Bundle size exceeds limit by ${((bundleSize - BUNDLE_SIZE_LIMIT) / 1024).toFixed(2)} KB`
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
