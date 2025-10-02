#!/usr/bin/env node
/* eslint-env node */

/**
 * @fileoverview @connect 헤더 동기화 스크립트
 * @description
 * 코드베이스에서 사용되는 외부 호스트를 추출하여 vite.config.ts의 @connect 헤더와 동기화
 *
 * Epic: CONNECT_SYNC_AUTOMATION
 * 목적: 실행 시 접근 호스트 수집 → @connect 동기화 자동화
 * 기대 효과: 퍼미션 미스 방지 / 릴리즈 안정성 향상
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

/**
 * vite.config.ts에서 @connect 헤더를 추출
 * 백틱 문자열 내부의 `// @connect      hostname\n` 형식 파싱
 */
function parseConnectHosts(configPath) {
  const content = fs.readFileSync(configPath, 'utf-8');
  const pattern = /`\/\/ @connect\s+([^\s\\]+)\\n`/g;
  const matches = Array.from(content.matchAll(pattern));
  return new Set(matches.map(m => m[1]));
}

/**
 * 코드베이스에서 호스트 추출
 *
 * 전략:
 * 1. constants.ts의 DOMAINS 배열
 * 2. url-safety.ts의 TWITTER_MEDIA_HOSTS
 * 3. 기타 파일의 URL 리터럴 (정규식 기반)
 */
function extractHostsFromCodebase(srcDir) {
  const hosts = new Set();

  // 1. constants.ts 스캔
  const constantsPath = path.join(srcDir, 'constants.ts');
  if (fs.existsSync(constantsPath)) {
    const content = fs.readFileSync(constantsPath, 'utf-8');
    // DOMAINS: ['pbs.twimg.com', 'video.twimg.com', ...]
    const domainsMatch = content.match(/DOMAINS:\s*\[([^\]]+)\]/);
    if (domainsMatch) {
      const domainStrings = domainsMatch[1].match(/'([^']+)'/g);
      if (domainStrings) {
        domainStrings.forEach(ds => hosts.add(ds.replace(/'/g, '')));
      }
    }
  }

  // 2. url-safety.ts 스캔
  const urlSafetyPath = path.join(srcDir, 'shared', 'utils', 'url-safety.ts');
  if (fs.existsSync(urlSafetyPath)) {
    const content = fs.readFileSync(urlSafetyPath, 'utf-8');
    // TWITTER_MEDIA_HOSTS = Object.freeze(['pbs.twimg.com', ...])
    const hostMatch = content.match(/TWITTER_MEDIA_HOSTS\s*=\s*Object\.freeze\(\[([^\]]+)\]/);
    if (hostMatch) {
      const hostStrings = hostMatch[1].match(/'([^']+)'/g);
      if (hostStrings) {
        hostStrings.forEach(hs => hosts.add(hs.replace(/'/g, '')));
      }
    }
  }

  // 3. 전체 src/ 디렉터리 재귀 스캔 (URL 리터럴)
  scanDirectoryForHosts(srcDir, hosts);

  return hosts;
}

/**
 * 디렉터리 재귀 스캔하여 URL 리터럴에서 호스트 추출
 */
function scanDirectoryForHosts(dir, hosts) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      // node_modules, dist 등 제외
      if (!['node_modules', 'dist', '.git'].includes(entry.name)) {
        scanDirectoryForHosts(fullPath, hosts);
      }
    } else if (entry.isFile() && /\.(ts|tsx|js|jsx)$/.test(entry.name)) {
      const content = fs.readFileSync(fullPath, 'utf-8');

      // x.com, *.twimg.com 패턴 추출
      // https?://(x\.com|[^/]*\.twimg\.com)
      const urlPattern = /https?:\/\/((?:x\.com|[a-z0-9-]+\.twimg\.com|api\.twitter\.com))/gi;
      const matches = Array.from(content.matchAll(urlPattern));

      matches.forEach(match => {
        hosts.add(match[1].toLowerCase());
      });

      // 문자열 리터럴로 직접 쓰인 호스트
      const hostLiteralPattern = /'((?:x\.com|[a-z0-9-]+\.twimg\.com|api\.twitter\.com))'/gi;
      const literalMatches = Array.from(content.matchAll(hostLiteralPattern));

      literalMatches.forEach(match => {
        hosts.add(match[1].toLowerCase());
      });
    }
  }
}

/**
 * 누락된 호스트 찾기 (코드에는 있으나 헤더에는 없음)
 */
function findMissingHosts(headerHosts, codeHosts) {
  const missing = [];
  for (const host of codeHosts) {
    if (!headerHosts.has(host)) {
      missing.push(host);
    }
  }
  return missing.sort();
}

/**
 * 사용되지 않는 호스트 찾기 (헤더에는 있으나 코드에는 없음)
 */
function findUnusedHosts(headerHosts, codeHosts) {
  const unused = [];
  for (const host of headerHosts) {
    if (!codeHosts.has(host)) {
      unused.push(host);
    }
  }
  return unused.sort();
}

/**
 * 동기화 리포트 생성
 */
function generateSyncReport(headerHosts, codeHosts) {
  const missing = findMissingHosts(headerHosts, codeHosts);
  const unused = findUnusedHosts(headerHosts, codeHosts);
  const inSync = missing.length === 0 && unused.length === 0;

  return { missing, unused, inSync };
}

/**
 * vite.config.ts 업데이트 (dry-run 옵션 지원)
 */
function updateConnectHeaders(configPath, newHosts, dryRun = false) {
  const content = fs.readFileSync(configPath, 'utf-8');
  const pattern = /(`\/\/ @connect\s+[^\s\\]+\\n`\s*\+?\s*)+/g;

  // 새로운 @connect 헤더 생성 (정렬)
  const sortedHosts = Array.from(newHosts).sort();
  const newConnectBlock = sortedHosts
    .map(host => `    \`// @connect      ${host}\\n\` +`)
    .join('\n');

  // 기존 @connect 블록 찾기
  const oldMatch = content.match(pattern);
  if (!oldMatch) {
    console.error('❌ vite.config.ts에서 @connect 헤더 블록을 찾을 수 없습니다.');
    return { updated: false, changes: [] };
  }

  const oldBlock = oldMatch[0];
  const newContent = content.replace(pattern, newConnectBlock + '\n');

  if (dryRun) {
    console.log('📋 [DRY-RUN] 변경 사항 미리보기:');
    console.log('--- OLD ---');
    console.log(oldBlock);
    console.log('--- NEW ---');
    console.log(newConnectBlock);
    return { updated: false, changes: sortedHosts };
  }

  // 실제 업데이트
  fs.writeFileSync(configPath, newContent, 'utf-8');
  console.log('✅ vite.config.ts 업데이트 완료');

  return { updated: true, changes: sortedHosts };
}

/**
 * 메인 실행
 */
function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');
  const autoFix = args.includes('--fix');

  console.log('🔍 @connect 헤더 동기화 분석 시작...\n');

  // 1. 헤더 추출
  const viteConfigPath = path.join(projectRoot, 'vite.config.ts');
  const headerHosts = parseConnectHosts(viteConfigPath);
  console.log(`📄 vite.config.ts에서 ${headerHosts.size}개 호스트 발견:`);
  console.log('   ', Array.from(headerHosts).sort().join(', '));
  console.log();

  // 2. 코드베이스 스캔
  const srcDir = path.join(projectRoot, 'src');
  const codeHosts = extractHostsFromCodebase(srcDir);
  console.log(`📂 src/ 디렉터리에서 ${codeHosts.size}개 호스트 발견:`);
  console.log('   ', Array.from(codeHosts).sort().join(', '));
  console.log();

  // 3. 리포트 생성
  const report = generateSyncReport(headerHosts, codeHosts);

  if (report.inSync) {
    console.log('✅ @connect 헤더가 코드베이스와 동기화되어 있습니다!');
    return;
  }

  console.log('⚠️  동기화 불일치 감지:\n');

  if (report.missing.length > 0) {
    console.log('❌ 코드에서 사용되지만 @connect 헤더에 없는 호스트:');
    report.missing.forEach(host => console.log(`   - ${host}`));
    console.log();
  }

  if (report.unused.length > 0) {
    console.log('⚠️  @connect 헤더에 있지만 코드에서 사용되지 않는 호스트:');
    report.unused.forEach(host => console.log(`   - ${host}`));
    console.log();
  }

  // 4. 자동 수정
  if (autoFix) {
    console.log('🔧 --fix 옵션 활성화: @connect 헤더를 업데이트합니다...\n');
    const allHosts = new Set([...headerHosts, ...codeHosts]);
    updateConnectHeaders(viteConfigPath, allHosts, dryRun);
  } else {
    console.log('💡 수정하려면 --fix 옵션을 추가하세요:');
    console.log('   node scripts/sync-connect-hosts.mjs --fix');
    console.log('   (미리보기: --dry-run --fix)');
  }
}

main();
