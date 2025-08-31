#!/usr/bin/env node
/**
 * 최적화된 빌드 스크립트
 * - 전체 빌드 시간 측정
 * - 각 단계별 진행상황 표시
 * - 빌드 결과 요약
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const COLORS = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  red: '\x1b[31m',
  cyan: '\x1b[36m',
};

function colorize(text, color) {
  return `${COLORS[color]}${text}${COLORS.reset}`;
}

function logStep(step, message) {
  console.log(`${colorize('📋', 'cyan')} ${colorize(`[${step}]`, 'bright')} ${message}`);
}

function logSuccess(message) {
  console.log(`${colorize('✅', 'green')} ${message}`);
}

function logError(message) {
  console.error(`${colorize('❌', 'red')} ${message}`);
}

function formatTime(ms) {
  if (ms < 1000) return `${ms}ms`;
  const seconds = (ms / 1000).toFixed(1);
  return `${seconds}s`;
}

function formatSize(bytes) {
  const sizes = ['B', 'KB', 'MB', 'GB'];
  let i = 0;
  while (bytes >= 1024 && i < sizes.length - 1) {
    bytes /= 1024;
    i++;
  }
  return `${bytes.toFixed(2)} ${sizes[i]}`;
}

function getFileSize(filePath) {
  try {
    return fs.statSync(filePath).size;
  } catch {
    return 0;
  }
}

function runCommand(command, stepName) {
  const startTime = Date.now();
  logStep(stepName, '실행 중...');

  try {
    execSync(command, { stdio: 'inherit' });
    const duration = Date.now() - startTime;
    logSuccess(`${stepName} 완료 (${formatTime(duration)})`);
    return { success: true, duration };
  } catch (error) {
    const duration = Date.now() - startTime;
    logError(`${stepName} 실패 (${formatTime(duration)})`);
    return { success: false, duration, error };
  }
}

function printBuildSummary(startTime, results) {
  const totalTime = Date.now() - startTime;

  console.log(`\n${colorize('📊 빌드 요약', 'bright')}`);
  console.log('─'.repeat(50));

  // 전체 시간
  console.log(`⏱️  총 빌드 시간: ${colorize(formatTime(totalTime), 'yellow')}`);

  // 각 단계별 시간
  results.forEach(result => {
    const status = result.success ? colorize('✅', 'green') : colorize('❌', 'red');
    console.log(`${status} ${result.name}: ${formatTime(result.duration)}`);
  });

  // 빌드 결과 파일 크기
  const devFile = path.join('dist', 'xcom-enhanced-gallery.dev.user.js');
  const prodFile = path.join('dist', 'xcom-enhanced-gallery.user.js');

  if (fs.existsSync(devFile)) {
    const devSize = getFileSize(devFile);
    console.log(`📦 Development: ${colorize(formatSize(devSize), 'blue')}`);
  }

  if (fs.existsSync(prodFile)) {
    const prodSize = getFileSize(prodFile);
    console.log(`📦 Production: ${colorize(formatSize(prodSize), 'green')}`);
  }

  console.log('─'.repeat(50));

  const allSuccess = results.every(r => r.success);
  if (allSuccess) {
    logSuccess(`모든 빌드 완료! (${formatTime(totalTime)})`);
  } else {
    logError(`일부 빌드 실패 (${formatTime(totalTime)})`);
    process.exit(1);
  }
}

function main() {
  console.log(`${colorize('🚀 X.com Enhanced Gallery 빌드 시작', 'bright')}`);
  console.log('─'.repeat(50));

  const startTime = Date.now();
  const results = [];

  // 1. 정리
  const cleanResult = runCommand('npm run clean', '정리');
  results.push({ name: '정리', ...cleanResult });

  if (!cleanResult.success) {
    printBuildSummary(startTime, results);
    return;
  }

  // 2. 개발 빌드
  const devResult = runCommand('npm run build:dev', '개발 빌드');
  results.push({ name: '개발 빌드', ...devResult });

  // 3. 프로덕션 빌드
  const prodResult = runCommand('npm run build:prod', '프로덕션 빌드');
  results.push({ name: '프로덕션 빌드', ...prodResult });

  // 4. 파일 복사
  const copyResult = runCommand('npm run build:copy', '파일 복사');
  results.push({ name: '파일 복사', ...copyResult });

  // 빌드 요약 출력
  printBuildSummary(startTime, results);
}

if (require.main === module) {
  main();
}

module.exports = { main };
