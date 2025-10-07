/**
 * 모든 파일에서 파일 최상단 vendors getter 호출을 함수 내부로 이동하는 스크립트
 *
 * 문제:
 * import { getSolid } from '@shared/external/vendors';
 * const { createSignal } = getSolid();  // ❌ 파일 로드 시점에 즉시 실행
 *
 * 해결:
 * export function MyComponent() {
 *   const { createSignal } = getSolid();  // ✅ 함수 실행 시점에 호출
 * }
 */

const fs = require('fs');
const path = require('path');
const { glob } = require('glob');

// 수정 대상 파일 패턴
const patterns = [
  'src/shared/primitives/*.ts',
  'src/shared/components/ui/**/*.tsx',
  'src/features/**/*.tsx',
];

// vendors getter 패턴 (파일 최상단에서 즉시 호출)
const IMMEDIATE_CALL_PATTERN =
  /^(import \{ (?:get\w+) \} from '@shared\/external\/vendors';)\n(const \{ [^}]+ \} = (?:get\w+)\(\);)/gm;

let fixedCount = 0;
let errorCount = 0;

async function fixFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf-8');

    // 이미 수정된 파일은 스킵
    if (!IMMEDIATE_CALL_PATTERN.test(content)) {
      return false;
    }

    // 백업 생성
    const backupPath = filePath + '.backup';
    fs.writeFileSync(backupPath, content);

    console.log(`\n🔧 Fixing: ${filePath}`);
    console.log('   ⚠️  Found immediate vendor getter call at file top');

    // 패턴 매칭 결과 확인
    content = content.replace(IMMEDIATE_CALL_PATTERN, (match, importLine, constLine) => {
      console.log(`   ✓  Removing: ${constLine}`);
      return importLine; // import만 유지, const 제거
    });

    fs.writeFileSync(filePath, content);
    console.log('   ✅ Fixed - manual component/function update needed');

    fixedCount++;
    return true;
  } catch (error) {
    console.error(`❌ Error fixing ${filePath}:`, error.message);
    errorCount++;
    return false;
  }
}

async function main() {
  console.log('🚀 Starting vendors getter fix...\n');

  for (const pattern of patterns) {
    console.log(`\n📂 Processing pattern: ${pattern}`);
    const files = await glob(pattern, { cwd: process.cwd() });

    console.log(`   Found ${files.length} files`);

    for (const file of files) {
      await fixFile(file);
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log(`✅ Fixed: ${fixedCount} files`);
  console.log(`❌ Errors: ${errorCount} files`);
  console.log('='.repeat(60));

  if (fixedCount > 0) {
    console.log('\n⚠️  IMPORTANT: You must manually add vendor getter calls');
    console.log('   inside each component/function body!');
    console.log('\n   Example:');
    console.log('   export function MyComponent() {');
    console.log('     const { createSignal } = getSolid(); // ← Add this');
    console.log('     // ... rest of code');
    console.log('   }');
  }
}

main().catch(console.error);
