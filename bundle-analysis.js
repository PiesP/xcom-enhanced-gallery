/**
 * Bundle Analysis Script - Phase 5 Bundle Optimization
 * 실제 번들 분석을 수행하여 최적화 제안을 도출합니다.
 */

import { BundleOptimizer } from './src/shared/utils/optimization/BundleOptimizer.js';

// 실제 모듈들을 가상으로 등록
const optimizer = new BundleOptimizer();

// 실제 파일 크기를 기반으로 한 추정치들
optimizer.registerModule('unified-utils', 30000, ['logger', 'gallery-signals']);
optimizer.registerModule('core-utils', 15000, ['type-safety-helpers']);
optimizer.registerModule('BundleOptimizer', 12000, []);
optimizer.registerModule('gallery-components', 25000, ['preact', 'signals']);
optimizer.registerModule('media-services', 20000, ['vendor-api']);
optimizer.registerModule('vendor-bundled', 100000, []); // 외부 라이브러리
optimizer.registerModule('css-styles', 25000, []);
optimizer.registerModule('dom-utils', 8000, []);
optimizer.registerModule('type-definitions', 5000, []);

// 분석 수행
const analysis = optimizer.analyzeBundleComposition();
const recommendations = optimizer.generateTreeShakingRecommendations();
const report = optimizer.generateOptimizationReport();

console.log('=== Bundle Analysis Results ===');
console.log(`Total Size: ${(analysis.totalSize / 1024).toFixed(2)} KB`);
console.log(`Gzipped Size: ${(analysis.gzippedSize / 1024).toFixed(2)} KB`);
console.log(`Unused Code: ${(analysis.unusedCodeSize / 1024).toFixed(2)} KB`);
console.log(`Duplicated Code: ${(analysis.duplicatedCodeSize / 1024).toFixed(2)} KB`);

console.log('\n=== Recommendations ===');
recommendations.forEach(rec => console.log(`- ${rec}`));

console.log('\n=== Potential Savings ===');
console.log(`${(report.potentialSavings / 1024).toFixed(2)} KB could be saved`);

console.log('\n=== Module Breakdown ===');
analysis.modulesSizes.forEach((size, name) => {
  console.log(`${name}: ${(size / 1024).toFixed(2)} KB`);
});
