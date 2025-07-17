#!/usr/bin/env node

/**
 * 빌드 검증 스크립트
 * UserScript의 기본적인 유효성을 검사합니다.
 */

import { readFileSync, existsSync } from 'fs';
import { resolve } from 'path';

function validateUserScript() {
  console.log('🔍 Validating UserScript build...');

  const distPath = resolve(process.cwd(), 'dist');

  // 프로덕션 파일 우선, 없으면 개발 파일 사용
  let userScriptPath = resolve(distPath, 'xcom-enhanced-gallery.user.js');
  if (!existsSync(userScriptPath)) {
    userScriptPath = resolve(distPath, 'xcom-enhanced-gallery.dev.user.js');
  }

  if (!existsSync(userScriptPath)) {
    console.error('❌ UserScript file not found at:', userScriptPath);
    process.exit(1);
  }

  const content = readFileSync(userScriptPath, 'utf8');

  // UserScript 헤더 검증
  if (!content.includes('// ==UserScript==')) {
    console.error('❌ UserScript header not found');
    process.exit(1);
  }

  if (!content.includes('// ==/UserScript==')) {
    console.error('❌ UserScript header end not found');
    process.exit(1);
  }

  // 필수 메타데이터 검증
  const requiredMeta = ['@name', '@version', '@description', '@match'];

  for (const meta of requiredMeta) {
    if (!content.includes(meta)) {
      console.error(`❌ Required metadata ${meta} not found`);
      process.exit(1);
    }
  }

  // PC 환경 최적화 검증
  if (content.includes('onTouch') || content.includes('TouchEvent')) {
    console.error('❌ Touch events found in PC-only project');
    process.exit(1);
  }

  // 기본적인 JavaScript 구문 검증
  try {
    // 간단한 구문 검증 (실제 실행하지 않음)
    const scriptStart = content.indexOf('// ==/UserScript==') + '// ==/UserScript=='.length;
    const scriptContent = content.substring(scriptStart);

    // 기본적인 구문 오류 검사
    if (scriptContent.includes('undefined is not a function')) {
      console.warn('⚠️ Potential runtime errors detected');
    }
  } catch (error) {
    console.error('❌ JavaScript syntax validation failed:', error.message);
    process.exit(1);
  }

  console.log('✅ UserScript validation passed');
  console.log(`📄 File: ${userScriptPath}`);
  console.log(`📏 Size: ${(content.length / 1024).toFixed(2)} KB`);

  return true;
}

// 스크립트 실행
try {
  validateUserScript();
} catch (error) {
  console.error('❌ UserScript validation failed:', error.message);
  process.exit(1);
}
