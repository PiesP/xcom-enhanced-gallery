#!/usr/bin/env node

/**
 * 빌드 결과 검증 스크립트
 * 생성된 userscript가 올바른 형태인지 검증합니다.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DIST_DIR = path.resolve(__dirname, '..', 'dist');
const USER_SCRIPT_FILE = path.join(DIST_DIR, 'xcom-enhanced-gallery.user.js');

// 색상 출력을 위한 유틸리티
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

function validateBuild() {
  log(colors.blue, '🔍 Validating build output...');

  const errors = [];
  const warnings = [];

  // 1. 빌드 파일 존재 확인
  if (!fs.existsSync(USER_SCRIPT_FILE)) {
    errors.push('User script file does not exist: ' + USER_SCRIPT_FILE);
    return { errors, warnings };
  }

  const content = fs.readFileSync(USER_SCRIPT_FILE, 'utf8');

  // 2. 파일 크기 검증
  const fileSizeKB = Math.round(content.length / 1024);
  log(colors.blue, `📦 File size: ${fileSizeKB} KB`);

  if (fileSizeKB > 2000) {
    warnings.push(`Large bundle size: ${fileSizeKB} KB (consider optimization)`);
  }

  // 3. UserScript 헤더 검증
  if (!content.startsWith('// ==UserScript==')) {
    errors.push('Missing UserScript header');
  }

  const requiredHeaders = ['@name', '@version', '@description', '@author', '@match', '@grant'];

  requiredHeaders.forEach(header => {
    if (!content.includes(header)) {
      errors.push(`Missing required header: ${header}`);
    }
  });

  // 4. CSS 인라인화 검증
  const hasCSSInjection =
    content.includes("createElement('style')") ||
    content.includes('injectCSS') ||
    content.includes('style.textContent');

  if (!hasCSSInjection) {
    warnings.push('CSS injection code not found - styles might not be applied');
  } else {
    log(colors.green, '✅ CSS injection detected');
  }

  // 5. 별도 CSS 파일 존재 확인 (있으면 안 됨)
  const cssFiles = fs.readdirSync(DIST_DIR).filter(file => file.endsWith('.css'));
  if (cssFiles.length > 0) {
    warnings.push(`Separate CSS files found: ${cssFiles.join(', ')} (should be inlined)`);
  } else {
    log(colors.green, '✅ No separate CSS files (properly inlined)');
  }

  // 6. 핵심 기능 검증
  const requiredFeatures = [
    'XEGUserScript',
    'MediaExtractorService',
    'GalleryStateManager',
    'DownloadManager',
  ];

  requiredFeatures.forEach(feature => {
    if (!content.includes(feature)) {
      warnings.push(`Core feature not found: ${feature}`);
    }
  });

  // 7. 환경 변수 확인
  if (content.includes('process.env') && !content.includes('NODE_ENV')) {
    warnings.push('process.env usage detected but NODE_ENV not defined');
  }

  // 8. 신택스 에러 검증 (간단한 체크)
  try {
    // UserScript 헤더 제거 후 JavaScript 부분만 검증
    const jsContent = content.replace(/\/\/ ==UserScript==[\s\S]*?\/\/ ==\/UserScript==/, '');
    new Function(jsContent); // 신택스 검증
    log(colors.green, '✅ JavaScript syntax validation passed');
  } catch (error) {
    errors.push(`JavaScript syntax error: ${error.message}`);
  }

  return { errors, warnings };
}

function main() {
  const { errors, warnings } = validateBuild();

  // 결과 출력
  if (errors.length === 0 && warnings.length === 0) {
    log(colors.green, '🎉 Build validation passed successfully!');
    process.exit(0);
  }

  if (warnings.length > 0) {
    log(colors.yellow, '\n⚠️  Warnings:');
    warnings.forEach(warning => {
      log(colors.yellow, `  • ${warning}`);
    });
  }

  if (errors.length > 0) {
    log(colors.red, '\n❌ Errors:');
    errors.forEach(error => {
      log(colors.red, `  • ${error}`);
    });
    log(colors.red, '\n💥 Build validation failed!');
    process.exit(1);
  }

  log(colors.yellow, '\n✨ Build validation completed with warnings');
  process.exit(0);
}

main();
