#!/usr/bin/env node
/**
 * Alias 토큰 분석 스크립트
 * - design-tokens.semantic.css의 --xeg-* 토큰 추출
 * - 각 토큰의 사용 빈도 확인
 * - 중복 정의 탐지
 * - unused alias 식별
 */

import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, extname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { dirname } from 'node:path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '..');

// 토큰 정의 파일
const tokenFile = join(projectRoot, 'src', 'shared', 'styles', 'design-tokens.semantic.css');

// 검색 대상 디렉터리
const searchDirs = [
  join(projectRoot, 'src', 'features'),
  join(projectRoot, 'src', 'shared', 'components'),
  join(projectRoot, 'src', 'shared', 'styles'),
  join(projectRoot, 'src', 'assets'),
];

// 토큰 정의 추출
function extractTokenDefinitions(content) {
  const definitions = new Map();
  const lines = content.split(/\r?\n/);

  lines.forEach((line, idx) => {
    const match = line.match(/^\s*(--xeg-[a-z0-9-]+)\s*:/);
    if (match) {
      const token = match[1];
      if (!definitions.has(token)) {
        definitions.set(token, []);
      }
      definitions.get(token).push(idx + 1);
    }
  });

  return definitions;
}

// CSS/TS/TSX 파일 재귀 검색
function findFiles(dir, extensions = ['.css', '.ts', '.tsx']) {
  const results = [];

  try {
    const items = readdirSync(dir);

    for (const item of items) {
      const fullPath = join(dir, item);
      const stat = statSync(fullPath);

      if (stat.isDirectory()) {
        results.push(...findFiles(fullPath, extensions));
      } else if (extensions.includes(extname(item))) {
        results.push(fullPath);
      }
    }
  } catch (err) {
    // ignore access errors
  }

  return results;
}

// 토큰 사용 빈도 계산
function countTokenUsage(files, tokens) {
  const usage = new Map();

  for (const token of tokens) {
    usage.set(token, { count: 0, files: [] });
  }

  for (const file of files) {
    // 토큰 정의 파일 자체는 제외
    if (file === tokenFile) continue;

    const content = readFileSync(file, 'utf8');

    for (const token of tokens) {
      const regex = new RegExp(`var\\(${token.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\)`, 'g');
      const matches = content.match(regex);

      if (matches) {
        usage.get(token).count += matches.length;
        usage.get(token).files.push(file.replace(projectRoot, ''));
      }
    }
  }

  return usage;
}

// 메인 분석
function analyzeAliasTokens() {
  console.log('🔍 Alias 토큰 분석 시작...\n');

  // 1. 토큰 정의 추출
  const tokenContent = readFileSync(tokenFile, 'utf8');
  const definitions = extractTokenDefinitions(tokenContent);

  console.log(`📋 총 토큰 개수: ${definitions.size}`);

  // 2. 중복 정의 확인
  const duplicates = Array.from(definitions.entries()).filter(([token, lines]) => lines.length > 1);

  if (duplicates.length > 0) {
    console.log(`\n⚠️  중복 정의된 토큰: ${duplicates.length}개`);
    for (const [token, lines] of duplicates) {
      console.log(`   ${token}: ${lines.length}번 정의 (lines: ${lines.join(', ')})`);
    }
  }

  // 3. 파일 수집
  console.log('\n📂 파일 수집 중...');
  let allFiles = [];
  for (const dir of searchDirs) {
    allFiles.push(...findFiles(dir));
  }
  console.log(`   수집된 파일: ${allFiles.length}개`);

  // 4. 사용 빈도 계산
  console.log('\n📊 토큰 사용 빈도 계산 중...');
  const tokens = Array.from(definitions.keys());
  const usage = countTokenUsage(allFiles, tokens);

  // 5. 결과 분류
  const unused = [];
  const lowUsage = [];
  const normalUsage = [];

  for (const [token, data] of usage) {
    if (data.count === 0) {
      unused.push(token);
    } else if (data.count <= 2) {
      lowUsage.push({ token, ...data });
    } else {
      normalUsage.push({ token, ...data });
    }
  }

  // 6. 결과 출력
  console.log(`\n✅ 정상 사용 토큰: ${normalUsage.length}개`);
  console.log(`⚠️  적게 사용되는 토큰 (≤2회): ${lowUsage.length}개`);
  console.log(`❌ 사용되지 않는 토큰: ${unused.length}개\n`);

  if (unused.length > 0) {
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('❌ 제거 대상 (사용되지 않는 토큰)');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    for (const token of unused.sort()) {
      const lines = definitions.get(token);
      console.log(`   ${token} (line ${lines.join(', ')})`);
    }
    console.log('');
  }

  if (lowUsage.length > 0) {
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('⚠️  검토 대상 (적게 사용되는 토큰)');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    for (const { token, count, files } of lowUsage.sort((a, b) => a.count - b.count)) {
      const lines = definitions.get(token);
      console.log(`   ${token} (${count}회, line ${lines.join(', ')})`);
      for (const file of files) {
        console.log(`     - ${file}`);
      }
    }
    console.log('');
  }

  // 7. 통계 요약
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📊 통계 요약');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`총 토큰: ${tokens.length}개`);
  console.log(`중복 정의: ${duplicates.length}개`);
  console.log(`사용되지 않음: ${unused.length}개`);
  console.log(`적게 사용됨 (≤2회): ${lowUsage.length}개`);
  console.log(`정상 사용: ${normalUsage.length}개`);
  console.log('');

  // Phase 54.3 목표 체크
  const totalRemovable = unused.length + duplicates.length;
  const currentCount = tokens.length;
  const afterRemoval = currentCount - totalRemovable;

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🎯 Phase 54.3 목표 달성 가능성');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`현재 토큰 수: ${currentCount}개`);
  console.log(`제거 가능 (unused + 중복): ${totalRemovable}개`);
  console.log(`제거 후 예상: ${afterRemoval}개`);
  console.log(`목표 (<10개): ${afterRemoval < 10 ? '✅ 달성 가능' : '❌ 추가 작업 필요'}`);
  console.log('');
}

// 실행
try {
  analyzeAliasTokens();
} catch (err) {
  console.error('❌ 오류 발생:', err.message);
  process.exit(1);
}
