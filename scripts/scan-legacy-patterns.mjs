#!/usr/bin/env node

/**
 * @file scripts/scan-legacy-patterns.mjs
 * @description Epic SOLID-NATIVE-002 Phase A: 레거시 패턴 스캔 스크립트
 * 
 * 목표: .value, .subscribe(), createGlobalSignal 패턴을 스캔하고
 *       마이그레이션 맵을 생성합니다.
 */

/* global process, console */

import { readFileSync, writeFileSync } from 'node:fs';
import { glob } from 'glob';
import { relative } from 'node:path';

// ===== 패턴 탐지 함수 =====

/**
 * 코드 문자열에서 레거시 패턴을 스캔합니다.
 * @param {string} code - 스캔할 코드
 * @returns {Array<{type: string, pattern: string, line: number, context: string}>}
 */
function scanLegacyPatterns(code) {
  const patterns = [];
  const lines = code.split('\n');

  // False positive 필터링을 위한 블랙리스트
  const falsePositivePatterns = [
    /\bObject\.values\(/,
    /\bMap\.values\(/,
    /\bSet\.values\(/,
    /\bArray\.from\(.*\.values\(\)\)/,
    /\binput\.value\b/,
    /\belement\.value\b/,
    /\bselect\.value\b/,
    /\btarget\.value\b/,
    /\bthemeSelect\.value\b/,
    /\blanguageSelect\.value\b/,
    /\battr\.value\b/,
    /\bentry\.value\b/,
    /\boption\.value\b/,
    /\bcachedTextarea\.value\b/,
    /\.keys\(\)\.next\(\)\.value/,  // Iterator.next().value
  ];

  lines.forEach((line, index) => {
    const lineNumber = index + 1;
    const trimmedLine = line.trim();

    // 코멘트 라인 스킵
    if (trimmedLine.startsWith('//') || trimmedLine.startsWith('*')) {
      return;
    }

    // False positive 체크
    const isFalsePositive = falsePositivePatterns.some(pattern => pattern.test(line));
    if (isFalsePositive) {
      return;
    }

    // createGlobalSignal import 탐지
    if (/import.*createGlobalSignal/.test(line)) {
      patterns.push({
        type: 'import-createGlobalSignal',
        pattern: 'createGlobalSignal',
        line: lineNumber,
        context: line.trim(),
      });
    }

    // .subscribe() 탐지
    if (/\.subscribe\(/.test(line) && !/\/\//.test(line.split('.subscribe(')[0])) {
      patterns.push({
        type: 'subscribe',
        pattern: line.match(/(\w+)\.subscribe\(/)?.[0] || '.subscribe(',
        line: lineNumber,
        context: line.trim(),
      });
    }

    // .value 쓰기 탐지 (할당)
    if (/\.value\s*=/.test(line)) {
      patterns.push({
        type: 'value-write',
        pattern: line.match(/(\w+)\.value\s*=/)?.[0] || '.value =',
        line: lineNumber,
        context: line.trim(),
      });
    }
    // .value 읽기 탐지 (할당이 아닌 경우)
    else if (/\.value\b/.test(line)) {
      patterns.push({
        type: 'value-read',
        pattern: line.match(/(\w+)\.value/)?.[0] || '.value',
        line: lineNumber,
        context: line.trim(),
      });
    }
  });

  return patterns;
}

/**
 * 패턴을 복잡도에 따라 분류합니다.
 * @param {Array} patterns
 * @returns {{auto: Array, semiAuto: Array, manual: Array}}
 */
function classifyPatterns(patterns) {
  const classified = {
    auto: [],
    semiAuto: [],
    manual: [],
  };

  patterns.forEach(pattern => {
    const enhanced = { ...pattern, complexity: '' };
    
    switch (pattern.type) {
      case 'value-read':
        enhanced.complexity = 'auto';
        classified.auto.push(enhanced);
        break;
      case 'value-write':
        enhanced.complexity = 'semi-auto';
        classified.semiAuto.push(enhanced);
        break;
      case 'subscribe':
      case 'import-createGlobalSignal':
        enhanced.complexity = 'manual';
        classified.manual.push(enhanced);
        break;
    }
  });

  return classified;
}

/**
 * 파일 경로에 따라 우선순위를 할당합니다.
 * @param {string} filePath
 * @returns {'high' | 'medium' | 'low'}
 */
function assignPriority(filePath) {
  if (filePath.includes('shared/state/signals')) {
    return 'high';
  }
  if (filePath.includes('shared/utils') || filePath.includes('shared/state/createGlobalSignal')) {
    return 'medium';
  }
  if (filePath.includes('test/')) {
    return 'low';
  }
  return 'medium'; // 기본값
}

// ===== 메인 스캔 로직 =====

async function main() {
  console.log('🔍 레거시 패턴 스캔 시작...\n');

  const srcPattern = 'src/**/*.{ts,tsx}';
  const testPattern = 'test/**/*.{ts,tsx}';
  
  const srcFiles = await glob(srcPattern, { ignore: 'node_modules/**' });
  const testFiles = await glob(testPattern, { ignore: 'node_modules/**' });
  const allFiles = [...srcFiles, ...testFiles];

  console.log(`📂 스캔 대상 파일: ${allFiles.length}개`);
  console.log(`   - src: ${srcFiles.length}개`);
  console.log(`   - test: ${testFiles.length}개\n`);

  const migrationMap = {
    summary: {
      totalFiles: 0,
      totalPatterns: 0,
      auto: 0,
      semiAuto: 0,
      manual: 0,
    },
    files: [],
  };

  for (const filePath of allFiles) {
    try {
      const code = readFileSync(filePath, 'utf-8');
      const patterns = scanLegacyPatterns(code);

      if (patterns.length > 0) {
        const classified = classifyPatterns(patterns);
        const priority = assignPriority(filePath);

        migrationMap.files.push({
          path: relative(process.cwd(), filePath),
          patterns,
          classified,
          priority,
        });

        migrationMap.summary.totalFiles++;
        migrationMap.summary.totalPatterns += patterns.length;
        migrationMap.summary.auto += classified.auto.length;
        migrationMap.summary.semiAuto += classified.semiAuto.length;
        migrationMap.summary.manual += classified.manual.length;
      }
    } catch (error) {
      console.error(`❌ Error scanning ${filePath}:`, error.message);
    }
  }

  // 우선순위별로 정렬
  migrationMap.files.sort((a, b) => {
    const priorityOrder = { high: 0, medium: 1, low: 2 };
    return priorityOrder[a.priority] - priorityOrder[b.priority];
  });

  // JSON 파일로 저장
  const outputPath = 'docs/legacy-pattern-migration-map.json';
  writeFileSync(outputPath, JSON.stringify(migrationMap, null, 2));

  // 요약 출력
  console.log('✅ 스캔 완료!\n');
  console.log('📊 요약:');
  console.log(`   - 영향받는 파일: ${migrationMap.summary.totalFiles}개`);
  console.log(`   - 총 패턴 수: ${migrationMap.summary.totalPatterns}개`);
  console.log(`   - 자동 변환 가능 (AUTO): ${migrationMap.summary.auto}개`);
  console.log(`   - 반자동 (SEMI_AUTO): ${migrationMap.summary.semiAuto}개`);
  console.log(`   - 수동 변환 필요 (MANUAL): ${migrationMap.summary.manual}개\n`);

  console.log('🎯 우선순위별 파일:');
  const highPriority = migrationMap.files.filter(f => f.priority === 'high');
  const mediumPriority = migrationMap.files.filter(f => f.priority === 'medium');
  const lowPriority = migrationMap.files.filter(f => f.priority === 'low');

  console.log(`   - HIGH (shared/state/signals): ${highPriority.length}개`);
  console.log(`   - MEDIUM (shared/utils 등): ${mediumPriority.length}개`);
  console.log(`   - LOW (test): ${lowPriority.length}개\n`);

  console.log(`📄 상세 리포트: ${outputPath}\n`);

  // 주요 파일 미리보기 (HIGH 우선순위)
  if (highPriority.length > 0) {
    console.log('🔥 HIGH 우선순위 파일 (상위 5개):');
    highPriority.slice(0, 5).forEach(file => {
      console.log(`   - ${file.path}`);
      console.log(`     패턴: ${file.patterns.length}개 (AUTO: ${file.classified.auto.length}, SEMI: ${file.classified.semiAuto.length}, MANUAL: ${file.classified.manual.length})`);
    });
    console.log();
  }
}

main().catch(error => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});
