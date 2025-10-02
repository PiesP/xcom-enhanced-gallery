#!/usr/bin/env node

/**
 * @fileoverview SolidJS Native Codemod Script
 * @description Preact Signals 레거시 패턴을 SolidJS 네이티브 패턴으로 자동 변환
 *
 * Epic: SOLID-NATIVE-002 Phase B
 *
 * 변환 규칙:
 * 1. AUTO: signal.value (읽기) → signal() 함수 호출
 * 2. SEMI_AUTO: signal.value = newValue → setSignal(newValue) setter 호출
 * 3. MANUAL: signal.subscribe(callback) → 수동 처리 필요 (변환하지 않음)
 *
 * False Positive 필터:
 * - DOM 요소: input.value, element.value, select.value, target.value 등
 * - Object/Map 메서드: Object.values(), Map.values() 등
 *
 * 사용법:
 *   npm run codemod:solid-native          # 미리보기 (Dry Run)
 *   npm run codemod:solid-native --apply  # 실제 변환 적용
 */

/* global process, console */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// False positive 필터 패턴
const DOM_VALUE_PATTERNS = [
  /\binput\.value\b/,
  /\belement\.value\b/,
  /\bselect\.value\b/,
  /\btarget\.value\b/,
  /\bthemeSelect\.value\b/,
  /\blanguageSelect\.value\b/,
  /\battr\.value\b/,
  /\bentry\.value\b/,
  /\boption\.value\b/,
  /\bnode\.value\b/,
  /\btextarea\.value\b/,
];

const OBJECT_MAP_PATTERNS = [
  /\bObject\.values\(/,
  /\bMap\.prototype\.values\(/,
  /\bmap\.values\(/,
  /\bArray\.from\([^)]*\.values\(\)/,
];

/**
 * 마이그레이션 맵 JSON 로드
 */
function loadMigrationMap() {
  const mapPath = path.join(__dirname, '../docs/legacy-pattern-migration-map.json');
  if (!fs.existsSync(mapPath)) {
    throw new Error('Migration map not found. Run scan-legacy-patterns first.');
  }
  return JSON.parse(fs.readFileSync(mapPath, 'utf-8'));
}

/**
 * False positive 여부 확인
 */
function isFalsePositive(line) {
  // DOM 요소 .value 패턴
  for (const pattern of DOM_VALUE_PATTERNS) {
    if (pattern.test(line)) return true;
  }

  // Object/Map 메서드 패턴
  for (const pattern of OBJECT_MAP_PATTERNS) {
    if (pattern.test(line)) return true;
  }

  return false;
}

/**
 * .value 읽기 패턴 변환: signal.value → signal()
 */
function transformValueRead(content) {
  let transformedContent = content;
  const transformations = [];
  const lines = content.split('\n');

  lines.forEach((line, index) => {
    if (isFalsePositive(line)) return;

    // .value 읽기 패턴 찾기 (할당문이 아닌 경우만)
    const valueReadPattern = /\b(\w+)\.value\b(?!\s*=)/g;
    let match;
    const lineTransformations = [];

    while ((match = valueReadPattern.exec(line)) !== null) {
      const signalName = match[1];

      lineTransformations.push({
        type: 'value-read',
        line: index + 1,
        original: `${signalName}.value`,
        transformed: `${signalName}()`,
        signalName,
      });
    }

    // 라인별로 역순으로 치환 (인덱스 변경 방지)
    if (lineTransformations.length > 0) {
      let transformedLine = line;
      // 같은 라인에 여러 패턴이 있을 수 있으므로 전체 치환
      transformedLine = transformedLine.replace(/\b(\w+)\.value\b(?!\s*=)/g, '$1()');

      const originalLine = lines[index];
      transformedContent = transformedContent.replace(originalLine, transformedLine);

      transformations.push(...lineTransformations);
    }
  });

  return {
    content: transformedContent,
    transformations,
  };
}

/**
 * .value 쓰기 패턴 변환: signal.value = x → setSignal(x)
 */
function transformValueWrite(content) {
  let transformedContent = content;
  const transformations = [];
  const lines = content.split('\n');

  lines.forEach((line, index) => {
    if (isFalsePositive(line)) return;

    // .value 할당 패턴
    const valueWritePattern = /\b(\w+)\.value\s*=\s*(.+?)(;|$)/g;
    let match;

    while ((match = valueWritePattern.exec(line)) !== null) {
      const signalName = match[1];
      const value = match[2].trim();
      const terminator = match[3];

      // Setter 이름 추론: mySignal → setMySignal
      const setterName = `set${signalName.charAt(0).toUpperCase()}${signalName.slice(1)}`;

      const original = `${signalName}.value = ${value}`;
      const transformed = `${setterName}(${value})`;

      transformations.push({
        type: 'value-write',
        line: index + 1,
        original: original + terminator,
        transformed: transformed + terminator,
        signalName,
        setterName,
      });
    }
  });

  // 변환 적용 (역순으로 처리하여 인덱스 변경 방지)
  transformations.reverse().forEach(t => {
    const pattern = new RegExp(
      `\\b${t.signalName}\\.value\\s*=\\s*${escapeRegExp(t.original.replace(`${t.signalName}.value = `, '').replace(/;$/, ''))}`,
      'g'
    );
    const replacement = t.transformed.replace(/;$/, '');
    transformedContent = transformedContent.replace(pattern, replacement);
  });

  return {
    content: transformedContent,
    transformations: transformations.reverse(),
  };
}

/**
 * 정규식 특수문자 이스케이프
 */
function escapeRegExp(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * 파일 변환 분석
 */
function analyzeFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');

  // 1차 변환: .value 읽기
  const step1 = transformValueRead(content);

  // 2차 변환: .value 쓰기
  const step2 = transformValueWrite(step1.content);

  const allTransformations = [...step1.transformations, ...step2.transformations];
  const changed = allTransformations.length > 0;

  return {
    filePath,
    changed,
    transformations: allTransformations,
    transformedContent: step2.content,
  };
}

/**
 * 변환 리포트 생성
 */
function generateReport(results) {
  const changedFiles = results.filter(r => r.changed);

  console.log('\n📊 변환 요약:');
  console.log(`  - 스캔한 파일: ${results.length}개`);
  console.log(`  - 변환 필요: ${changedFiles.length}개`);
  console.log(`  - 변환 없음: ${results.length - changedFiles.length}개`);

  if (changedFiles.length > 0) {
    console.log('\n📝 변환 상세:');
    changedFiles.forEach(result => {
      console.log(`\n=== ${path.relative(process.cwd(), result.filePath)} ===`);
      result.transformations.forEach(t => {
        console.log(`  Line ${t.line} [${t.type}]:`);
        console.log(`    - ${t.original}`);
        console.log(`    + ${t.transformed}`);
      });
    });
  }

  return changedFiles;
}

/**
 * Codemod 실행
 */
async function runCodemod(dryRun = true) {
  console.log('🔍 Loading migration map...');
  const migrationMap = loadMigrationMap();

  console.log(`\n📋 마이그레이션 맵 요약:`);
  console.log(`  - 총 파일: ${migrationMap.summary.totalFiles}개`);
  console.log(`  - 총 패턴: ${migrationMap.summary.totalPatterns}개`);
  console.log(`  - AUTO: ${migrationMap.summary.auto}개`);
  console.log(`  - SEMI_AUTO: ${migrationMap.summary.semiAuto}개`);
  console.log(`  - MANUAL: ${migrationMap.summary.manual}개 (건너뜀)`);

  // AUTO 패턴만 처리 (SEMI_AUTO는 setter 이름 추론 필요)
  const autoFiles = migrationMap.files
    .filter(f => f.classified.auto.length > 0)
    .map(f => path.join(process.cwd(), f.path));

  console.log(`\n🎯 처리 대상: ${autoFiles.length}개 파일`);

  const results = [];

  for (const filePath of autoFiles) {
    const analysis = analyzeFile(filePath);
    results.push(analysis);
  }

  const changedFiles = generateReport(results);

  if (!dryRun && changedFiles.length > 0) {
    console.log('\n🚀 변환 적용 중...');

    for (const result of changedFiles) {
      fs.writeFileSync(result.filePath, result.transformedContent, 'utf-8');
      console.log(`  ✅ ${path.relative(process.cwd(), result.filePath)}`);
    }

    console.log(`\n🎉 ${changedFiles.length}개 파일 변환 완료!`);
  } else if (changedFiles.length === 0) {
    console.log('\n✨ 변환할 파일이 없습니다.');
  }
}

// CLI
const isDryRun = !process.argv.includes('--apply');

// Only run if directly executed (not imported as module)
if (import.meta.url === `file://${process.argv[1].replace(/\\/g, '/')}`) {
  if (isDryRun) {
    console.log('🔍 DRY RUN 모드 - 파일 변경 없음');
    console.log('실제 변환을 적용하려면 --apply 플래그를 사용하세요\n');
  }

  runCodemod(isDryRun).catch(error => {
    console.error('❌ Codemod 실행 오류:', error);
    process.exit(1);
  });
}

// Export for testing
/**
 * @typedef {Object} Transformation
 * @property {'value-read' | 'value-write'} type
 * @property {number} line
 * @property {string} original
 * @property {string} transformed
 * @property {string} [signalName]
 * @property {string} [setterName]
 */

/**
 * @typedef {Object} TransformResult
 * @property {string} filePath
 * @property {boolean} changed
 * @property {Transformation[]} transformations
 * @property {string} [transformedContent]
 */

export { transformValueRead, transformValueWrite, analyzeFile };
