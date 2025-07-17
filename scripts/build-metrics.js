#!/usr/bin/env node

/**
 * 빌드 메트릭스 분석 스크립트
 * 번들 크기와 성능 메트릭을 분석하고 리포트를 생성합니다.
 */

import { statSync, existsSync, writeFileSync } from 'fs';
import { resolve } from 'path';

const BUNDLE_SIZE_LIMIT = 500 * 1024; // 500KB

function analyzeBundle() {
  console.log('📊 Analyzing bundle metrics...');

  const distPath = resolve(process.cwd(), 'dist');
  const userScriptPath = resolve(distPath, 'xcom-enhanced-gallery.user.js');

  if (!existsSync(userScriptPath)) {
    console.error('❌ UserScript file not found at:', userScriptPath);
    process.exit(1);
  }

  const stats = statSync(userScriptPath);
  const fileSize = stats.size;
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

  // 콘솔 출력
  console.log('📦 Bundle Analysis Results:');
  console.log(`- File: ${userScriptPath}`);
  console.log(`- Size: ${(fileSize / 1024).toFixed(2)} KB`);
  console.log(`- Limit: ${(BUNDLE_SIZE_LIMIT / 1024).toFixed(2)} KB`);
  console.log(`- Within Budget: ${isWithinBudget ? '✅' : '❌'}`);

  if (!isWithinBudget) {
    console.warn(
      `⚠️ Bundle size exceeds limit by ${((fileSize - BUNDLE_SIZE_LIMIT) / 1024).toFixed(2)} KB`
    );
  }

  console.log(`📄 Analysis saved to: ${outputPath}`);

  return analysis;
}

// 스크립트 실행
if (import.meta.url === `file://${process.argv[1]}`) {
  try {
    analyzeBundle();
  } catch (error) {
    console.error('❌ Bundle analysis failed:', error.message);
    process.exit(1);
  }
}
