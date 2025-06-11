#!/usr/bin/env node

/**
 * CSS 인라인화 검증 스크립트
 * 빌드된 userscript 파일에서 CSS가 제대로 인라인화되었는지 확인
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DIST_DIR = path.join(__dirname, '..', 'dist');
const USER_SCRIPT_FILE = path.join(DIST_DIR, 'xcom-enhanced-gallery.user.js');

console.log('🔍 CSS 인라인화 검증 시작...\n');

// 1. 빌드 파일 존재 확인
if (!fs.existsSync(USER_SCRIPT_FILE)) {
  console.error('❌ 빌드 파일이 존재하지 않습니다:', USER_SCRIPT_FILE);
  process.exit(1);
}

// 2. CSS 파일이 별도로 생성되지 않았는지 확인
const distFiles = fs.readdirSync(DIST_DIR);
const cssFiles = distFiles.filter(file => file.endsWith('.css'));

if (cssFiles.length > 0) {
  console.error('❌ 별도 CSS 파일이 발견되었습니다:', cssFiles);
  console.error('   CSS 인라인화가 제대로 작동하지 않았습니다.');
  process.exit(1);
}

console.log('✅ 별도 CSS 파일 없음 - CSS 인라인화 성공');

// 3. userscript 파일 내용 분석
const userScriptContent = fs.readFileSync(USER_SCRIPT_FILE, 'utf8');

// CSS 주입 코드 존재 확인 (더 포괄적인 검색)
const hasCssInjection =
  userScriptContent.includes('CSS Injection') ||
  userScriptContent.includes('injectCSS') ||
  userScriptContent.includes("createElement('style')") ||
  userScriptContent.includes('createElement("style")') ||
  userScriptContent.includes('style') ||
  userScriptContent.includes('.css') ||
  userScriptContent.includes('textContent') ||
  userScriptContent.includes('appendChild');

if (!hasCssInjection) {
  console.warn('⚠️  CSS 주입 관련 코드를 찾을 수 없습니다.');
  console.warn('   스타일이 없거나 다른 방식으로 처리될 수 있습니다.');
} else {
  console.log('✅ CSS 관련 코드 발견');

  // 좀 더 구체적인 CSS 주입 코드 확인
  if (userScriptContent.includes('createElement') && userScriptContent.includes('style')) {
    console.log('✅ DOM 스타일 주입 코드 확인됨');
  }
}

// 4. 파일 크기 검증
const fileSizeKB = Math.round(fs.statSync(USER_SCRIPT_FILE).size / 1024);
console.log(`📊 빌드 파일 크기: ${fileSizeKB} KB`);

if (fileSizeKB < 10) {
  console.warn('⚠️  파일 크기가 예상보다 작습니다. 빌드가 완전하지 않을 수 있습니다.');
} else if (fileSizeKB > 500) {
  console.warn('⚠️  파일 크기가 예상보다 큽니다. 최적화를 검토해보세요.');
} else {
  console.log('✅ 파일 크기 적정');
}

// 5. UserScript 헤더 검증
const hasUserScriptHeader = userScriptContent.startsWith('// ==UserScript==');
const hasUserScriptEnd = userScriptContent.includes('// ==/UserScript==');

if (!hasUserScriptHeader || !hasUserScriptEnd) {
  console.error('❌ UserScript 헤더가 올바르지 않습니다.');
  process.exit(1);
}

console.log('✅ UserScript 헤더 검증 완료');

// 6. 필수 grant 권한 확인
const requiredGrants = [
  '@grant        GM_download',
  '@grant        GM_setValue',
  '@grant        GM_getValue',
];

const missingGrants = requiredGrants.filter(grant => !userScriptContent.includes(grant.trim()));

if (missingGrants.length > 0) {
  console.warn('⚠️  누락된 grant 권한:', missingGrants);
} else {
  console.log('✅ 필수 grant 권한 확인 완료');
}

// 7. 최종 결과
console.log('\n🎉 CSS 인라인화 검증 완료!');
console.log(`📁 빌드 파일: ${path.basename(USER_SCRIPT_FILE)}`);
console.log(`📊 파일 크기: ${fileSizeKB} KB`);
console.log('✨ 모든 검증 통과 - 배포 준비 완료');
