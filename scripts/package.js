#!/usr/bin/env node

/**
 * 릴리스 패키지 생성 스크립트
 * 최종 배포용 파일들을 생성하고 검증합니다.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DIST_DIR = path.resolve(__dirname, '..', 'dist');
const RELEASE_DIR = path.resolve(__dirname, '..', 'release');
const USER_SCRIPT_FILE = path.join(DIST_DIR, 'xcom-enhanced-gallery.user.js');

const colors = {
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m',
};

function log(color, message) {
  console.log(color + message + colors.reset);
}

function ensureDir(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

function getPackageInfo() {
  const packagePath = path.resolve(__dirname, '..', 'package.json');
  return JSON.parse(fs.readFileSync(packagePath, 'utf8'));
}

function generateReleaseNotes(packageInfo) {
  const now = new Date();
  const version = packageInfo.version;

  return `# Release Notes - v${version}

**Release Date:** ${now.toISOString().split('T')[0]}

## Features
- Enhanced X.com media viewer
- Batch download functionality
- Keyboard navigation support
- Modern Preact-based UI

## Installation
1. Install a userscript manager (Tampermonkey, Violentmonkey, etc.)
2. Click on the userscript file to install
3. Visit X.com and enjoy enhanced media experience

## Technical Details
- **Bundle Size:** ${Math.round(fs.statSync(USER_SCRIPT_FILE).size / 1024)} KB
- **Framework:** Preact v${packageInfo.dependencies.preact}
- **Build Date:** ${now.toISOString()}

## Requirements
- Modern browser with userscript manager
- JavaScript enabled
- No additional dependencies required

---
Generated automatically by build system
`;
}

async function createChecksums(filePath) {
  const crypto = await import('crypto');
  const content = fs.readFileSync(filePath);

  return {
    md5: crypto.createHash('md5').update(content).digest('hex'),
    sha256: crypto.createHash('sha256').update(content).digest('hex'),
  };
}

async function main() {
  log(colors.blue, '📦 Creating release package...');

  // 빌드 파일 존재 확인
  if (!fs.existsSync(USER_SCRIPT_FILE)) {
    log(colors.red, '❌ Build file not found. Run build first.');
    process.exit(1);
  }

  // 릴리스 디렉토리 생성
  ensureDir(RELEASE_DIR);

  const packageInfo = getPackageInfo();
  const version = packageInfo.version;

  // 버전별 파일명 생성
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
  const checksums = await createChecksums(USER_SCRIPT_FILE);
  const checksumFile = path.join(RELEASE_DIR, 'checksums.txt');

  const checksumContent = `# Checksums for v${version}
MD5:    ${checksums.md5}
SHA256: ${checksums.sha256}

# Verification
# On Linux/macOS:
# md5sum ${latestFileName}
# sha256sum ${latestFileName}
#
# On Windows (PowerShell):
# Get-FileHash ${latestFileName} -Algorithm MD5
# Get-FileHash ${latestFileName} -Algorithm SHA256
`;

  fs.writeFileSync(checksumFile, checksumContent);
  log(colors.green, '✅ Created: checksums.txt');

  // 릴리스 노트 생성
  const releaseNotes = generateReleaseNotes(packageInfo);
  const releaseNotesFile = path.join(RELEASE_DIR, 'RELEASE_NOTES.md');
  fs.writeFileSync(releaseNotesFile, releaseNotes);
  log(colors.green, '✅ Created: RELEASE_NOTES.md');

  // 메타데이터 파일 생성
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
  };

  const metadataFile = path.join(RELEASE_DIR, 'metadata.json');
  fs.writeFileSync(metadataFile, JSON.stringify(metadata, null, 2));
  log(colors.green, '✅ Created: metadata.json');

  // 결과 요약
  log(colors.blue, '\n📋 Release Summary:');
  log(colors.green, `   Version: ${version}`);
  log(colors.green, `   Size: ${metadata.fileSizeKB} KB`);
  log(colors.green, `   Files: ${metadata.files.length}`);
  log(colors.green, `   Location: ${RELEASE_DIR}`);

  log(colors.green, '\n🎉 Release package created successfully!');
}

main().catch(error => {
  log(colors.red, `❌ Error: ${error.message}`);
  process.exit(1);
});
