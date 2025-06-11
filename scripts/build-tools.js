#!/usr/bin/env node

/**
 * 통합 빌드 도구 스크립트
 * 빌드 시스템의 모든 검증 및 패키징 기능을 제공합니다.
 */

import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

// ESM 환경에서 __dirname 설정
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 경로 상수
const PROJECT_ROOT = path.resolve(__dirname, '..');
const DIST_DIR = path.join(PROJECT_ROOT, 'dist');
const RELEASE_DIR = path.join(PROJECT_ROOT, 'release');
const USER_SCRIPT_FILE = path.join(DIST_DIR, 'xcom-enhanced-gallery.user.js');

// 색상 출력을 위한 유틸리티
const colors = {
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  reset: '\x1b[0m',
};

function log(color, message) {
  console.log(color + message + colors.reset);
}

function logSection(title) {
  log(colors.cyan, `\n${'='.repeat(50)}`);
  log(colors.cyan, `📋 ${title}`);
  log(colors.cyan, `${'='.repeat(50)}`);
}

// 디렉토리 생성 유틸리티
function ensureDir(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
    log(colors.blue, `📁 Created directory: ${path.basename(dirPath)}`);
  }
}

// package.json 정보 가져오기
function getPackageInfo() {
  const packagePath = path.join(PROJECT_ROOT, 'package.json');
  return JSON.parse(fs.readFileSync(packagePath, 'utf8'));
}

// 파일 체크섬 생성
function createChecksums(filePath) {
  const content = fs.readFileSync(filePath);

  return {
    md5: crypto.createHash('md5').update(content).digest('hex'),
    sha256: crypto.createHash('sha256').update(content).digest('hex'),
  };
}

// CSS 인라인화 검증
function validateCSSInlining() {
  logSection('CSS 인라인화 검증');

  // 1. 빌드 파일 존재 확인
  if (!fs.existsSync(USER_SCRIPT_FILE)) {
    log(colors.red, '❌ 빌드 파일이 존재하지 않습니다');
    return false;
  }

  // 2. 별도 CSS 파일이 없는지 확인
  if (fs.existsSync(DIST_DIR)) {
    const distFiles = fs.readdirSync(DIST_DIR);
    const cssFiles = distFiles.filter(file => file.endsWith('.css'));

    if (cssFiles.length > 0) {
      log(colors.red, `❌ 별도 CSS 파일 발견: ${cssFiles.join(', ')}`);
      return false;
    }
    log(colors.green, '✅ 별도 CSS 파일 없음');
  }

  // 3. CSS 주입 코드 확인
  const content = fs.readFileSync(USER_SCRIPT_FILE, 'utf8');
  const hasCSSInjection =
    content.includes('CSS Injection') ||
    content.includes('injectCSS') ||
    content.includes("createElement('style')") ||
    content.includes('textContent');

  if (hasCSSInjection) {
    log(colors.green, '✅ CSS 주입 코드 확인됨');
  } else {
    log(colors.yellow, '⚠️  CSS 주입 코드 미확인 (스타일이 없을 수 있음)');
  }

  // 4. 파일 크기 검증
  const fileSizeKB = Math.round(fs.statSync(USER_SCRIPT_FILE).size / 1024);
  log(colors.blue, `📊 빌드 파일 크기: ${fileSizeKB} KB`);

  if (fileSizeKB < 10) {
    log(colors.yellow, '⚠️  파일 크기가 작습니다. 빌드 완전성을 확인하세요.');
  } else if (fileSizeKB > 500) {
    log(colors.yellow, '⚠️  파일 크기가 큽니다. 최적화를 검토하세요.');
  }

  // 5. UserScript 헤더 검증
  const hasHeader = content.startsWith('// ==UserScript==');
  const hasEnd = content.includes('// ==/UserScript==');

  if (!hasHeader || !hasEnd) {
    log(colors.red, '❌ UserScript 헤더가 올바르지 않습니다');
    return false;
  }
  log(colors.green, '✅ UserScript 헤더 검증 완료');

  log(colors.green, '🎉 CSS 인라인화 검증 완료!');
  return true;
}

// 릴리스 노트 생성
function generateReleaseNotes(packageInfo) {
  const now = new Date();
  const version = packageInfo.version;
  const fileSize = Math.round(fs.statSync(USER_SCRIPT_FILE).size / 1024);

  return `# Release Notes - v${version}

**Release Date:** ${now.toISOString().split('T')[0]}
**Build Date:** ${now.toISOString()}

## ✨ Features
- Enhanced X.com media viewer with modern UI
- Batch download functionality with ZIP support
- Keyboard navigation and shortcuts
- Modern Preact-based reactive architecture
- Shadow DOM isolation for compatibility

## 🚀 Installation
1. Install a userscript manager:
   - [Tampermonkey](https://www.tampermonkey.net/) (Recommended)
   - [Violentmonkey](https://violentmonkey.github.io/)
   - [Greasemonkey](https://www.greasespot.net/)
2. Click on the userscript file to install
3. Visit X.com and enjoy enhanced media experience

## 📊 Technical Details
- **Bundle Size:** ${fileSize} KB
- **Framework:** Preact v${packageInfo.dependencies.preact}
- **Target:** ES2020+ browsers
- **CSS:** Fully inlined (no external dependencies)

## 🔧 Requirements
- Modern browser (Chrome 80+, Firefox 75+, Safari 13+)
- Userscript manager extension
- JavaScript enabled
- No additional dependencies required

## 🛠️ Build Information
- Built with Vite ${packageInfo.devDependencies.vite}
- TypeScript ${packageInfo.devDependencies.typescript}
- All dependencies bundled inline
- Production optimized and minified

---
*Generated automatically by build system*
`;
}

// 패키지 생성
async function createPackage() {
  logSection('릴리스 패키지 생성');

  // 빌드 파일 존재 확인
  if (!fs.existsSync(USER_SCRIPT_FILE)) {
    log(colors.red, '❌ 빌드 파일이 존재하지 않습니다. 먼저 빌드를 실행하세요.');
    return false;
  }

  // 릴리스 디렉토리 생성
  ensureDir(RELEASE_DIR);

  const packageInfo = getPackageInfo();
  const version = packageInfo.version;

  // 파일명 생성
  const versionedFileName = `xcom-enhanced-gallery-v${version}.user.js`;
  const latestFileName = 'xcom-enhanced-gallery.user.js';

  // 파일 복사
  const versionedPath = path.join(RELEASE_DIR, versionedFileName);
  const latestPath = path.join(RELEASE_DIR, latestFileName);

  fs.copyFileSync(USER_SCRIPT_FILE, versionedPath);
  fs.copyFileSync(USER_SCRIPT_FILE, latestPath);

  log(colors.green, `✅ Created: ${versionedFileName}`);
  log(colors.green, `✅ Created: ${latestFileName}`);

  // 체크섬 생성
  const checksums = createChecksums(USER_SCRIPT_FILE);
  const checksumContent = `# Checksums for v${version}
MD5:    ${checksums.md5}
SHA256: ${checksums.sha256}

# File Information
Version: ${version}
Size: ${Math.round(fs.statSync(USER_SCRIPT_FILE).size / 1024)} KB
Created: ${new Date().toISOString()}

# Verification Commands
# Linux/macOS:
md5sum ${latestFileName}
sha256sum ${latestFileName}

# Windows PowerShell:
Get-FileHash ${latestFileName} -Algorithm MD5
Get-FileHash ${latestFileName} -Algorithm SHA256
`;

  fs.writeFileSync(path.join(RELEASE_DIR, 'checksums.txt'), checksumContent);
  log(colors.green, '✅ Created: checksums.txt');

  // 릴리스 노트 생성
  const releaseNotes = generateReleaseNotes(packageInfo);
  fs.writeFileSync(path.join(RELEASE_DIR, 'RELEASE_NOTES.md'), releaseNotes);
  log(colors.green, '✅ Created: RELEASE_NOTES.md');

  // 메타데이터 생성
  const metadata = {
    version: version,
    buildDate: new Date().toISOString(),
    fileSize: fs.statSync(USER_SCRIPT_FILE).size,
    fileSizeKB: Math.round(fs.statSync(USER_SCRIPT_FILE).size / 1024),
    checksums: checksums,
    files: [
      versionedFileName,
      latestFileName,
      'checksums.txt',
      'RELEASE_NOTES.md',
      'metadata.json',
    ],
    buildInfo: {
      nodeVersion: process.version,
      platform: process.platform,
      arch: process.arch,
    },
  };

  fs.writeFileSync(path.join(RELEASE_DIR, 'metadata.json'), JSON.stringify(metadata, null, 2));
  log(colors.green, '✅ Created: metadata.json');

  // 결과 요약
  log(colors.blue, '\n📋 Release Summary:');
  log(colors.green, `   Version: ${version}`);
  log(colors.green, `   Size: ${metadata.fileSizeKB} KB`);
  log(colors.green, `   Files: ${metadata.files.length}`);
  log(colors.green, `   Location: ${RELEASE_DIR}`);

  log(colors.green, '\n🎉 릴리스 패키지 생성 완료!');
  return true;
}

// 빌드 메트릭 수집
function collectBuildMetrics() {
  logSection('빌드 메트릭 수집');

  if (!fs.existsSync(USER_SCRIPT_FILE)) {
    log(colors.red, '❌ 빌드 파일이 존재하지 않습니다');
    return null;
  }

  const packageInfo = getPackageInfo();
  const stats = fs.statSync(USER_SCRIPT_FILE);
  const content = fs.readFileSync(USER_SCRIPT_FILE, 'utf8');

  const metrics = {
    timestamp: new Date().toISOString(),
    version: packageInfo.version,
    buildTarget: 'userscript',
    file: {
      size: stats.size,
      sizeKB: Math.round(stats.size / 1024),
      created: stats.birthtime.toISOString(),
      modified: stats.mtime.toISOString(),
    },
    content: {
      lines: content.split('\n').length,
      characters: content.length,
      hasUserScriptHeader: content.startsWith('// ==UserScript=='),
      hasCSSInjection: content.includes('CSS Injection') || content.includes('injectCSS'),
      hasErrorHandling: content.includes('try') && content.includes('catch'),
    },
    dependencies: {
      production: Object.keys(packageInfo.dependencies || {}),
      development: Object.keys(packageInfo.devDependencies || {}),
      totalCount: Object.keys({
        ...packageInfo.dependencies,
        ...packageInfo.devDependencies,
      }).length,
    },
    environment: {
      nodeVersion: process.version,
      platform: process.platform,
      arch: process.arch,
    },
  };

  // 메트릭을 파일로 저장
  const metricsFile = path.join(PROJECT_ROOT, 'build-metrics.json');
  fs.writeFileSync(metricsFile, JSON.stringify(metrics, null, 2));

  log(colors.green, `✅ Build metrics saved to: ${path.basename(metricsFile)}`);
  log(colors.blue, `📊 File size: ${metrics.file.sizeKB} KB`);
  log(colors.blue, `📝 Lines: ${metrics.content.lines.toLocaleString()}`);
  log(colors.blue, `📦 Dependencies: ${metrics.dependencies.totalCount}`);

  return metrics;
}

// 메인 실행 함수
async function main() {
  const command = process.argv[2];

  try {
    switch (command) {
      case 'validate-css':
        return validateCSSInlining() ? 0 : 1;

      case 'package':
        return (await createPackage()) ? 0 : 1;

      case 'metrics':
        return collectBuildMetrics() ? 0 : 1;

      case 'all':
        log(colors.blue, '🚀 전체 검증 및 패키징 시작...');

        if (!validateCSSInlining()) {
          log(colors.red, '❌ CSS 검증 실패');
          return 1;
        }

        collectBuildMetrics();

        if (!(await createPackage())) {
          log(colors.red, '❌ 패키지 생성 실패');
          return 1;
        }

        log(colors.green, '\n🎉 모든 작업 완료!');
        return 0;

      default:
        log(
          colors.yellow,
          `
사용법: node build-tools.js <command>

Commands:
  validate-css  - CSS 인라인화 검증
  package      - 릴리스 패키지 생성
  metrics      - 빌드 메트릭 수집
  all          - 모든 작업 실행

Examples:
  node build-tools.js validate-css
  node build-tools.js package
  node build-tools.js all
`
        );
        return 1;
    }
  } catch (error) {
    log(colors.red, `❌ Error: ${error.message}`);
    if (process.env.NODE_ENV === 'development') {
      console.error(error.stack);
    }
    return 1;
  }
}

// 스크립트 실행
main().then(exitCode => {
  process.exit(exitCode);
});
