/**
 * Bundle Analysis Script - Simplified Version
 * 간소화된 번들 분석 스크립트
 */

/* eslint-env node */
/* global console */

import {
  createBundleInfo,
  getBundleOptimizationSuggestions,
} from './src/shared/utils/optimization/bundle.js';

// 실제 모듈들의 추정 크기 정보
const moduleInfo = {
  'unified-utils': 30000,
  'core-utils': 15000,
  'gallery-components': 25000,
  'media-services': 20000,
  'vendor-bundled': 100000, // 외부 라이브러리
  'css-styles': 25000,
  'dom-utils': 8000,
  'type-definitions': 5000,
};

// 전체 번들 정보 생성
const moduleNames = Object.keys(moduleInfo);
const totalSize = Object.values(moduleInfo).reduce((sum, size) => sum + size, 0);

// 간소화된 번들 정보 생성
const bundleInfo = createBundleInfo(moduleNames, totalSize);
const suggestions = getBundleOptimizationSuggestions(bundleInfo, 400); // 400KB 목표

// 분석 결과 출력
console.log('=== 간소화된 Bundle Analysis Results ===');
console.log(`Total Size: ${(bundleInfo.totalSize / 1024).toFixed(2)} KB`);
console.log(`Gzipped Size: ${(bundleInfo.gzippedSize / 1024).toFixed(2)} KB`);

console.log('\n=== Optimization Suggestions ===');
suggestions.forEach(suggestion => console.log(`- ${suggestion}`));

console.log('\n=== Module Breakdown ===');
Object.entries(moduleInfo).forEach(([name, size]) => {
  console.log(`${name}: ${(size / 1024).toFixed(2)} KB`);
});
