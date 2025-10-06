#!/usr/bin/env node

/* eslint-disable no-console */

/**
 * @fileoverview Phase 5: PURE Annotations Automation Script
 * @description Add PURE annotations to 31 pure functions
 *
 * Epic: BUNDLE-SIZE-DEEP-OPTIMIZATION Phase 5 - GREEN Phase
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

// 순수 함수 목록 (파일별로 그룹화)
const PURE_FUNCTIONS = {
  'src/shared/utils/type-safety-helpers.ts': [
    'safeParseInt',
    'safeParseFloat',
    'safeArrayGet',
    'safeNodeListAccess',
    'safeMatchExtract',
    'safeCall',
    'safeEventHandler',
    'undefinedToNull',
    'nullToUndefined',
    'stringWithDefault',
    'safeElementCheck',
  ],
  'src/shared/logging/logger.ts': ['createCorrelationId', 'logFields'],
  'src/shared/utils/optimization/bundle.ts': ['createBundleInfo', 'isWithinSizeTarget'],
  'src/shared/utils/styles/css-utilities.ts': ['createThemedClassName'],
  'src/shared/styles/namespaced-styles.ts': ['createNamespacedClass', 'createNamespacedSelector'],
  'src/shared/utils/url-safety.ts': [
    'isTrustedHostname',
    'createTrustedHostnameGuard',
    'parseTrustedUrl',
  ],
  'src/shared/utils/media/media-url.util.ts': [
    'createMediaInfoFromImage',
    'createMediaInfoFromVideo',
  ],
  'src/shared/utils/utils.ts': ['combineClasses', 'parseColor'],
  'src/shared/utils/deduplication/deduplication-utils.ts': ['removeDuplicates'],
};

/**
 * 함수 선언을 찾아서 PURE 주석 추가
 */
function addPureAnnotation(content, functionName) {
  // Pattern 1: export function functionName(
  const pattern1 = new RegExp(`(export\\s+function\\s+${functionName}\\s*\\()`, 'g');

  // Pattern 2: export const functionName = (
  const pattern2 = new RegExp(`(export\\s+const\\s+${functionName}\\s*=\\s*)`, 'g');

  let modified = content;
  let changed = false;

  // Pattern 1 매치 - 이미 PURE 주석이 있는지 확인
  if (pattern1.test(content)) {
    modified = content.replace(pattern1, (match, p1, offset) => {
      // 이미 PURE 주석이 있는지 확인 (앞쪽 100자 이내)
      const before = content.substring(Math.max(0, offset - 100), offset);
      if (before.includes('/*#__PURE__*/')) {
        return match; // 이미 있으면 스킵
      }
      changed = true;
      return `/*#__PURE__*/ ${p1}`;
    });
  }

  // Pattern 2 매치
  if (pattern2.test(content)) {
    modified = content.replace(pattern2, (match, p1, offset) => {
      const before = content.substring(Math.max(0, offset - 100), offset);
      if (before.includes('/*#__PURE__*/')) {
        return match;
      }
      changed = true;
      return `${p1}/*#__PURE__*/ `;
    });
  }

  return { modified, changed };
}

/**
 * 파일 처리
 */
function processFile(filePath, functionNames) {
  const fullPath = path.resolve(rootDir, filePath);

  if (!fs.existsSync(fullPath)) {
    console.warn(`⚠️  File not found: ${filePath}`);
    return { success: false, changes: 0 };
  }

  let content = fs.readFileSync(fullPath, 'utf-8');
  let totalChanges = 0;

  for (const funcName of functionNames) {
    const { modified, changed } = addPureAnnotation(content, funcName);
    if (changed) {
      content = modified;
      totalChanges++;
      console.log(`  ✓ ${funcName}`);
    } else {
      console.log(`  ○ ${funcName} (already annotated or not found)`);
    }
  }

  if (totalChanges > 0) {
    fs.writeFileSync(fullPath, content, 'utf-8');
    console.log(`✅ ${filePath}: ${totalChanges} functions annotated\n`);
    return { success: true, changes: totalChanges };
  } else {
    console.log(`⊘  ${filePath}: No changes needed\n`);
    return { success: true, changes: 0 };
  }
}

/**
 * 메인 실행
 */
function main() {
  console.log('🚀 Phase 5: Adding PURE Annotations to 31 Functions\n');
  console.log('═'.repeat(60));
  console.log();

  let totalFiles = 0;
  let totalFunctions = 0;
  let successFiles = 0;

  for (const [filePath, functionNames] of Object.entries(PURE_FUNCTIONS)) {
    totalFiles++;
    totalFunctions += functionNames.length;

    console.log(`📄 ${filePath}`);
    const result = processFile(filePath, functionNames);

    if (result.success) {
      successFiles++;
    }
  }

  console.log('═'.repeat(60));
  console.log();
  console.log('📊 Summary:');
  console.log(`   Files processed: ${successFiles}/${totalFiles}`);
  console.log(`   Functions targeted: ${totalFunctions}`);
  console.log();

  if (successFiles === totalFiles) {
    console.log('✅ All files processed successfully!');
    console.log();
    console.log('Next steps:');
    console.log('  1. Run: npm run typecheck');
    console.log('  2. Run: npm run lint:fix');
    console.log('  3. Run: npm test');
    console.log('  4. Run: npm run build');
    console.log('  5. Check bundle size reduction');
    process.exit(0);
  } else {
    console.error('❌ Some files failed to process');
    process.exit(1);
  }
}

main();
