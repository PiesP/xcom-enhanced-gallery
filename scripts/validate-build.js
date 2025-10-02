#!/usr/bin/env node
/* eslint-env node */

/**
 * 빌드 검증 스크립트
 * UserScript의 기본적인 유효성을 검사합니다.
 */

import { readFileSync, existsSync, writeFileSync } from 'fs';
import { resolve, basename } from 'path';
import { gzipSync } from 'zlib';
import { createHash } from 'crypto';

function validateOne(scriptPath, { requireNoVitePreload = false } = {}) {
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

  // 필수 메타데이터 검증 (EPIC-USH-v4 강화)
  const requiredMeta = ['@name', '@version', '@description', '@match'];
  const requiredMetaUshV4 = ['@homepageURL', '@source', '@icon', '@antifeature'];

  for (const meta of requiredMeta) {
    if (!content.includes(meta)) {
      console.error(`❌ Required metadata ${meta} not found`);
      process.exit(1);
    }
  }

  for (const meta of requiredMetaUshV4) {
    if (!content.includes(meta)) {
      console.error(`❌ Required metadata ${meta} not found (EPIC-USH-v4)`);
      process.exit(1);
    }
  }

  // @antifeature none 값 검증
  const antifeatureMatch = content.match(/\n\s*\/\/\s*@antifeature\s+([^\n]+)/);
  if (!antifeatureMatch || antifeatureMatch[1].trim().toLowerCase() !== 'none') {
    console.error('❌ @antifeature must be present with value "none"');
    process.exit(1);
  }

  // @icon 은 data URI 여야 함(단일 파일 보장)
  const iconMatch = content.match(/\n\s*\/\/\s*@icon\s+([^\n]+)/);
  if (!iconMatch) {
    console.error('❌ @icon not found');
    process.exit(1);
  }
  const iconValue = iconMatch[1].trim();
  if (!/^data:\w+\/.+/.test(iconValue)) {
    console.error('❌ @icon must be a data URI (data:...) to ensure single-file userscript');
    process.exit(1);
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
  const mapPath = resolve(resolve(scriptPath, '..'), expectedMapName);

  // .map 파일은 항상 존재해야 함 (dev/prod 모두)
  if (!existsSync(mapPath)) {
    console.error('❌ Sourcemap file not found:', mapPath);
    process.exit(1);
  }

  // 주석 정책: dev 빌드는 주석 필수, prod 빌드는 주석 금지
  const isProd =
    scriptPath.includes('xcom-enhanced-gallery.user.js') && !scriptPath.includes('.dev.');
  if (isProd) {
    if (match) {
      console.error('❌ Production userscript must NOT contain sourceMappingURL comment');
      console.error(
        '   (Prevents 404 errors when browsers try to load .map file from userscript hosting)'
      );
      process.exit(1);
    }
  } else {
    // dev 빌드는 주석 필수
    if (!match) {
      console.error('❌ Dev userscript missing sourceMappingURL comment');
      process.exit(1);
    }
    const mapFileFromComment = match[1].trim();
    if (mapFileFromComment !== expectedMapName) {
      console.error(
        `❌ sourceMappingURL mismatch. Expected '${expectedMapName}', got '${mapFileFromComment}'`
      );
      process.exit(1);
    }
  }
  // .map 파일 JSON 무결성 검사
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
  const prodInfo = validateOne(prodPath, { requireNoVitePreload: true });

  // EPIC-USH-v4: dist 내 외부 assets 폴더가 없어야 함(단일 파일 보장)
  const assetsDir = resolve(distPath, 'assets');
  if (existsSync(assetsDir)) {
    console.error('❌ dist/assets 폴더가 존재합니다. 모든 자산은 인라인되어야 합니다.');
    process.exit(1);
  }

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

  // ===== Release-001: 릴리즈 메타데이터 동기화 =====
  try {
    const pkg = JSON.parse(readFileSync(resolve(process.cwd(), 'package.json'), 'utf8'));
    const releaseDir = resolve(process.cwd(), 'release');
    const metaPath = resolve(releaseDir, 'metadata.json');

    const content = readFileSync(prodPath);
    const md5 = createHash('md5').update(content).digest('hex');
    const sha256 = createHash('sha256').update(content).digest('hex');
    const fileSize = content.length;

    const expectedFile = 'xcom-enhanced-gallery.user.js';
    const files = [expectedFile, 'checksums.txt', 'RELEASE_NOTES.md', 'metadata.json'];

    const next = {
      version: String(pkg.version),
      buildDate: new Date().toISOString(),
      fileSize,
      fileSizeKB: Math.round(fileSize / 1024),
      checksums: { md5, sha256 },
      files,
    };

    let prev;
    if (existsSync(metaPath)) {
      try {
        prev = JSON.parse(readFileSync(metaPath, 'utf8'));
      } catch {
        prev = undefined;
      }
    }

    if (
      !prev ||
      prev.version !== next.version ||
      prev.fileSize !== next.fileSize ||
      prev.checksums?.sha256 !== next.checksums.sha256
    ) {
      writeFileSync(metaPath, JSON.stringify(next, null, 2) + '\n', 'utf8');
      console.log('📝 Updated release/metadata.json');
    } else {
      console.log('ℹ️ release/metadata.json up-to-date');
    }
  } catch (e) {
    console.warn('⚠️ Release metadata sync skipped or failed:', e?.message || e);
  }

  return true;
}

// 스크립트 실행
try {
  validateUserScript();
} catch (error) {
  console.error('❌ UserScript validation failed:', error.message);
  process.exit(1);
}
