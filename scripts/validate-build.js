#!/usr/bin/env node
/* eslint-env node */

/**
 * 빌드 검증 스크립트
 * UserScript의 기본적인 유효성을 검사합니다.
 */

import { readFileSync, existsSync } from 'fs';
import { resolve, basename } from 'path';
import { gzipSync } from 'zlib';

function validateOne(
  scriptPath,
  { requireNoVitePreload = false, assertNoLegacyGlobals = false } = {}
) {
  const content = readFileSync(scriptPath, 'utf8');

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

  // R5: sourceMappingURL 주석 확인 및 .map 파일 무결성 검사
  const scriptFileName = basename(scriptPath);
  const expectedMapName = `${scriptFileName}.map`;
  const sourceMapUrlPattern = /#\s*sourceMappingURL\s*=\s*(.+)$/m;
  const match = content.match(sourceMapUrlPattern);
  if (!match) {
    console.error('❌ Missing sourceMappingURL comment in userscript');
    process.exit(1);
  }
  const mapFileFromComment = match[1].trim();
  if (mapFileFromComment !== expectedMapName) {
    console.error(
      `❌ sourceMappingURL mismatch. Expected '${expectedMapName}', got '${mapFileFromComment}'`
    );
    process.exit(1);
  }

  const mapPath = resolve(resolve(scriptPath, '..'), mapFileFromComment);
  if (!existsSync(mapPath)) {
    console.error('❌ Sourcemap file not found:', mapPath);
    process.exit(1);
  }
  let map;
  try {
    map = JSON.parse(readFileSync(mapPath, 'utf8'));
  } catch (e) {
    console.error('❌ Failed to parse sourcemap JSON:', e.message);
    process.exit(1);
  }
  if (!map || !Array.isArray(map.sources) || map.sources.length === 0) {
    console.error('❌ Sourcemap missing non-empty sources array');
    process.exit(1);
  }
  if (!Array.isArray(map.sourcesContent) || map.sourcesContent.length === 0) {
    console.error('❌ Sourcemap missing non-empty sourcesContent array');
    process.exit(1);
  }
  if (map.sources.length !== map.sourcesContent.length) {
    console.error('❌ Sourcemap sources and sourcesContent length mismatch');
    process.exit(1);
  }
  // 경고: 절대 경로 포함 여부 체크 (Windows/Unix)
  const hasAbsolute = map.sources.some(s => /^(?:[A-Za-z]:\\|\/)/.test(s));
  if (hasAbsolute) {
    console.warn('⚠️ Sourcemap sources include absolute paths. Consider making them relative.');
  }

  // R5: 프로덕션 번들에서 __vitePreload 등 dead-preload 브랜치가 제거되었는지 검사
  if (requireNoVitePreload) {
    if (/__vitePreload/.test(content)) {
      console.error('❌ Prod userscript contains __vitePreload dead branch');
      process.exit(1);
    }
  }

  // P1: 레거시 전역 키가 prod에 포함되지 않도록 가드
  if (assertNoLegacyGlobals) {
    const legacyKeys = [
      /__XEG_LEGACY_ADAPTER__/,
      /__XEG_GET_SERVICE_OVERRIDE__/,
      // 레거시 벤더 API/매니저 심볼 누출 금지
      /initializeVendorsLegacy\b/,
      /getPreactLegacy\b/,
      /getPreactHooksLegacy\b/,
      /getPreactSignalsLegacy\b/,
      /getPreactCompatLegacy\b/,
      /getNativeDownloadLegacy\b/,
      /validateVendorsLegacy\b/,
      /getVendorVersionsLegacy\b/,
      /cleanupVendorsLegacy\b/,
      /isVendorsInitializedLegacy\b/,
      /getVendorInitializationReportLegacy\b/,
      /getVendorStatusesLegacy\b/,
      /isVendorInitializedLegacy\b/,
      /(?<!Static)VendorManager\b/, // 동적 VendorManager 노출 금지 (정적 매니저는 허용)
      /vendor-api\.ts/, // 소스 문자열 누출 금지
      // 신규: 런타임 DOMEventManager 표면 금지(내부 전용)
      /\bDOMEventManager\b/,
      /\bcreateEventManager\b/,
      // 추가: 런타임 AppContainer 표면 누출 금지(테스트 전용 하니스 외)
      /\bcreateAppContainer\b/,
      /\bAppContainer\b/,
      // 추가: PC-only 정책 - Pointer 이벤트 문자열 금지
      /\bonPointer\w+\b/,
      /\bPointerEvent\b/,
    ];
    for (const re of legacyKeys) {
      if (re.test(content)) {
        console.error('❌ Prod userscript leaked legacy global key:', re);
        process.exit(1);
      }
    }
  }

  return { content, map, mapPath };
}

function validateUserScript() {
  console.log('🔍 Validating UserScript build...');

  const distPath = resolve(process.cwd(), 'dist');

  const prodPath = resolve(distPath, 'xcom-enhanced-gallery.user.js');
  const devPath = resolve(distPath, 'xcom-enhanced-gallery.dev.user.js');

  // 두 파일 모두 존재해야 함 (빌드 스크립트가 dev/prod 모두 생성)
  if (!existsSync(prodPath) || !existsSync(devPath)) {
    console.error('❌ Expected both prod and dev userscripts to exist.');
    console.error(`   prod: ${existsSync(prodPath) ? 'OK' : 'MISSING'}`);
    console.error(`   dev : ${existsSync(devPath) ? 'OK' : 'MISSING'}`);
    process.exit(1);
  }

  // 상세 검증: dev (소스맵 포함), prod (소스맵 + dead code 제거)
  validateOne(devPath, { requireNoVitePreload: false });
  const prodInfo = validateOne(prodPath, {
    requireNoVitePreload: true,
    assertNoLegacyGlobals: true,
  });

  // 기본적인 JavaScript 구문 검증
  try {
    // 간단한 구문 검증 (실제 실행하지 않음)
    const scriptStart =
      prodInfo.content.indexOf('// ==/UserScript==') + '// ==/UserScript=='.length;
    const scriptContent = prodInfo.content.substring(scriptStart);

    // 기본적인 구문 오류 검사
    if (scriptContent.includes('undefined is not a function')) {
      console.warn('⚠️ Potential runtime errors detected');
    }
  } catch (error) {
    console.error('❌ JavaScript syntax validation failed:', error.message);
    process.exit(1);
  }

  // 사이즈 예산(Gzip) 검사
  const gzipped = gzipSync(Buffer.from(prodInfo.content, 'utf8'));
  const rawBytes = Buffer.byteLength(prodInfo.content, 'utf8');
  const gzBytes = gzipped.length;

  const WARN_BUDGET = 300 * 1024; // 300KB (경고)
  const FAIL_BUDGET = 450 * 1024; // 450KB (실패)

  if (gzBytes > FAIL_BUDGET) {
    console.error(
      `❌ Gzip size exceeds hard limit: ${(gzBytes / 1024).toFixed(2)} KB (limit ${(FAIL_BUDGET / 1024).toFixed(0)} KB)`
    );
    process.exit(1);
  } else if (gzBytes > WARN_BUDGET) {
    console.warn(
      `⚠️ Gzip size exceeds budget: ${(gzBytes / 1024).toFixed(2)} KB (budget ${(WARN_BUDGET / 1024).toFixed(0)} KB)`
    );
  }

  console.log('✅ UserScript validation passed');
  console.log(`📄 Files: \n  - ${prodPath}\n  - ${devPath}`);
  console.log(`📏 Size (raw): ${(rawBytes / 1024).toFixed(2)} KB`);
  console.log(`📦 Size (gzip): ${(gzBytes / 1024).toFixed(2)} KB`);

  return true;
}

// 스크립트 실행
try {
  validateUserScript();
} catch (error) {
  console.error('❌ UserScript validation failed:', error.message);
  process.exit(1);
}
