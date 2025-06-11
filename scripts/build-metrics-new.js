#!/usr/bin/env node

/**
 * 빌드 성능 모니터링 스크립트
 * 빌드 시간, 파일 크기, 압축률 등을 추적
 */

import fs from 'fs';
import path from 'path';
import process from 'process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DIST_DIR = path.join(__dirname, '..', 'dist');
const METRICS_FILE = path.join(__dirname, '..', 'build-metrics.json');

/**
 * 빌드 메트릭스 수집
 */
function collectBuildMetrics() {
  const metrics = {
    timestamp: new Date().toISOString(),
    buildTime: process.env.BUILD_TIME || 'unknown',
    files: [],
    totalSize: 0,
    compressionRatio: null,
  };

  if (!fs.existsSync(DIST_DIR)) {
    console.error('❌ dist 디렉토리가 존재하지 않습니다.');
    return metrics;
  }

  // 빌드 파일들 분석
  const distFiles = fs.readdirSync(DIST_DIR);

  distFiles.forEach(fileName => {
    const filePath = path.join(DIST_DIR, fileName);
    const stats = fs.statSync(filePath);

    const fileInfo = {
      name: fileName,
      size: stats.size,
      sizeKB: Math.round(stats.size / 1024),
      modified: stats.mtime.toISOString(),
    };

    metrics.files.push(fileInfo);
    metrics.totalSize += stats.size;
  });

  return metrics;
}

/**
 * 빌드 메트릭스를 기록하고 분석
 */
function recordAndAnalyzeMetrics() {
  console.log('📊 빌드 성능 메트릭스 수집 중...\n');

  const currentMetrics = collectBuildMetrics();

  // 이전 메트릭스 로드
  let historicalMetrics = [];
  if (fs.existsSync(METRICS_FILE)) {
    try {
      historicalMetrics = JSON.parse(fs.readFileSync(METRICS_FILE, 'utf8'));
    } catch (error) {
      console.warn('⚠️  이전 메트릭스 로드 실패:', error.message);
    }
  }

  // 현재 메트릭스 추가
  historicalMetrics.push(currentMetrics);

  // 최근 10개만 유지
  if (historicalMetrics.length > 10) {
    historicalMetrics = historicalMetrics.slice(-10);
  }

  // 메트릭스 파일 저장
  fs.writeFileSync(METRICS_FILE, JSON.stringify(historicalMetrics, null, 2));

  // 현재 빌드 결과 출력
  console.log('📁 빌드 결과물:');
  currentMetrics.files.forEach(file => {
    console.log(`   ${file.name}: ${file.sizeKB} KB`);
  });

  console.log(`\n📊 총 크기: ${Math.round(currentMetrics.totalSize / 1024)} KB`);

  // 이전 빌드와 비교 (2개 이상의 기록이 있을 때)
  if (historicalMetrics.length >= 2) {
    const previousMetrics = historicalMetrics[historicalMetrics.length - 2];
    const sizeDiff = currentMetrics.totalSize - previousMetrics.totalSize;
    const sizeDiffKB = Math.round(sizeDiff / 1024);

    if (sizeDiff > 0) {
      console.log(`📈 크기 증가: +${sizeDiffKB} KB`);
    } else if (sizeDiff < 0) {
      console.log(`📉 크기 감소: ${sizeDiffKB} KB`);
    } else {
      console.log('📊 크기 변화 없음');
    }
  }

  // 성능 경고
  const mainFile = currentMetrics.files.find(f => f.name.includes('user.js'));
  if (mainFile && mainFile.sizeKB > 500) {
    console.log('\n⚠️  파일 크기가 500KB를 초과했습니다. 최적화를 검토해보세요.');
  }

  if (currentMetrics.files.length > 2) {
    console.log('\n⚠️  예상보다 많은 파일이 생성되었습니다. 번들링을 확인해보세요.');
  }

  // 압축률 계산 (개발/프로덕션 파일이 모두 있는 경우)
  const devFile = currentMetrics.files.find(f => f.name.includes('dev'));
  const prodFile = currentMetrics.files.find(
    f => f.name.includes('user.js') && !f.name.includes('dev')
  );

  if (devFile && prodFile) {
    const compressionRatio = (((devFile.size - prodFile.size) / devFile.size) * 100).toFixed(1);
    console.log(`\n📊 압축률: ${compressionRatio}% (${devFile.sizeKB}KB → ${prodFile.sizeKB}KB)`);
  }

  console.log('\n✅ 빌드 메트릭스 수집 완료');
}

// 스크립트 실행
recordAndAnalyzeMetrics();
