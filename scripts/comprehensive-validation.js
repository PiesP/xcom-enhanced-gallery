#!/usr/bin/env node

/**
 * 통합 빌드 검증 스크립트
 * 빌드 결과, 아키텍처, 의존성 등을 종합적으로 검증합니다.
 */

import fs from 'fs';
import path from 'path';
import process from 'process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PROJECT_ROOT = path.resolve(__dirname, '..');
const DIST_DIR = path.join(PROJECT_ROOT, 'dist');
const PACKAGE_JSON = path.join(PROJECT_ROOT, 'package.json');

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

function getPackageInfo() {
  return JSON.parse(fs.readFileSync(PACKAGE_JSON, 'utf8'));
}

function validateProjectStructure() {
  log(colors.blue, '🏗️  프로젝트 구조 검증...');

  const errors = [];
  const warnings = [];

  const requiredDirs = ['src/app', 'src/features', 'src/shared', 'src/core', 'src/infrastructure'];

  requiredDirs.forEach(dir => {
    const dirPath = path.join(PROJECT_ROOT, dir);
    if (!fs.existsSync(dirPath)) {
      errors.push(`Required directory missing: ${dir}`);
    }
  });

  // 아키텍처 레이어 의존성 검증
  const dependencyCruiserConfig = path.join(PROJECT_ROOT, '.dependency-cruiser.cjs');
  if (!fs.existsSync(dependencyCruiserConfig)) {
    warnings.push('Dependency cruiser config not found - architecture rules not enforced');
  }

  return { errors, warnings };
}

function validateBuildOutput() {
  log(colors.blue, '📦 빌드 출력 검증...');

  const errors = [];
  const warnings = [];

  if (!fs.existsSync(DIST_DIR)) {
    errors.push('Build output directory not found');
    return { errors, warnings };
  }

  const files = fs.readdirSync(DIST_DIR);
  const userScriptFiles = files.filter(f => f.endsWith('.user.js'));

  if (userScriptFiles.length === 0) {
    errors.push('No userscript files found in build output');
    return { errors, warnings };
  }

  // 각 userscript 파일 검증
  userScriptFiles.forEach(file => {
    const filePath = path.join(DIST_DIR, file);
    const content = fs.readFileSync(filePath, 'utf8');
    const sizeKB = Math.round(content.length / 1024);

    log(colors.cyan, `  📄 ${file} (${sizeKB} KB)`);

    // UserScript 헤더 검증
    if (!content.startsWith('// ==UserScript==')) {
      errors.push(`${file}: Missing UserScript header`);
    }

    // 필수 헤더 확인
    const requiredHeaders = ['@name', '@version', '@match', '@grant'];
    requiredHeaders.forEach(header => {
      if (!content.includes(header)) {
        errors.push(`${file}: Missing ${header} header`);
      }
    });

    // 크기 경고
    if (sizeKB > 1000) {
      warnings.push(`${file}: Large file size (${sizeKB} KB) - consider optimization`);
    }

    // CSS 인라인 확인
    if (!content.includes("createElement('style')")) {
      warnings.push(`${file}: CSS injection not detected`);
    }
  });

  return { errors, warnings };
}

function validateDependencies() {
  log(colors.blue, '📚 의존성 검증...');

  const errors = [];
  const warnings = [];
  const packageInfo = getPackageInfo();

  // 필수 의존성 확인
  const requiredDeps = ['preact', '@preact/signals', 'fflate'];
  requiredDeps.forEach(dep => {
    if (!packageInfo.dependencies || !packageInfo.dependencies[dep]) {
      errors.push(`Required dependency missing: ${dep}`);
    }
  });

  // 개발 의존성 확인
  const requiredDevDeps = ['typescript', 'vite', 'eslint'];
  requiredDevDeps.forEach(dep => {
    if (!packageInfo.devDependencies || !packageInfo.devDependencies[dep]) {
      warnings.push(`Required dev dependency missing: ${dep}`);
    }
  });

  // Vite 버전 확인 (rolldown-vite 사용 시 경고)
  if (packageInfo.devDependencies?.vite?.includes('rolldown')) {
    warnings.push('Using experimental rolldown-vite package - consider stable vite version');
  }

  return { errors, warnings };
}

function validateScripts() {
  log(colors.blue, '📜 스크립트 검증...');

  const errors = [];
  const warnings = [];
  const packageInfo = getPackageInfo();

  const requiredScripts = ['build', 'dev', 'lint', 'typecheck', 'test'];
  requiredScripts.forEach(script => {
    if (!packageInfo.scripts || !packageInfo.scripts[script]) {
      errors.push(`Required script missing: ${script}`);
    }
  });

  // 추천 스크립트 확인
  const recommendedScripts = ['build:dev', 'quality', 'validate'];
  recommendedScripts.forEach(script => {
    if (!packageInfo.scripts || !packageInfo.scripts[script]) {
      warnings.push(`Recommended script missing: ${script}`);
    }
  });

  return { errors, warnings };
}

function validateConfiguration() {
  log(colors.blue, '⚙️  설정 파일 검증...');

  const errors = [];
  const warnings = [];

  const configFiles = ['tsconfig.json', 'vite.config.ts', 'eslint.config.js', 'package.json'];

  configFiles.forEach(file => {
    const filePath = path.join(PROJECT_ROOT, file);
    if (!fs.existsSync(filePath)) {
      errors.push(`Configuration file missing: ${file}`);
    }
  });

  // GitHub Actions 워크플로우 확인
  const workflowDir = path.join(PROJECT_ROOT, '.github', 'workflows');
  if (fs.existsSync(workflowDir)) {
    const workflows = fs.readdirSync(workflowDir);
    if (workflows.length === 0) {
      warnings.push('No GitHub Actions workflows found');
    } else {
      log(colors.cyan, `  🔄 ${workflows.length} GitHub Actions workflows found`);
    }
  }

  return { errors, warnings };
}

function main() {
  log(colors.blue, '🔍 X.com Enhanced Gallery 통합 검증 시작...\n');

  const allErrors = [];
  const allWarnings = [];

  // 각 검증 단계 실행
  const validations = [
    validateProjectStructure,
    validateBuildOutput,
    validateDependencies,
    validateScripts,
    validateConfiguration,
  ];

  validations.forEach(validation => {
    const { errors, warnings } = validation();
    allErrors.push(...errors);
    allWarnings.push(...warnings);
  });

  // 결과 출력
  console.log('\n' + '='.repeat(60));

  if (allErrors.length === 0 && allWarnings.length === 0) {
    log(colors.green, '🎉 모든 검증이 성공적으로 완료되었습니다!');
    process.exit(0);
  }

  if (allWarnings.length > 0) {
    log(colors.yellow, '\n⚠️  경고사항:');
    allWarnings.forEach(warning => {
      log(colors.yellow, `  • ${warning}`);
    });
  }

  if (allErrors.length > 0) {
    log(colors.red, '\n❌ 오류:');
    allErrors.forEach(error => {
      log(colors.red, `  • ${error}`);
    });
    log(colors.red, '\n💥 검증 실패!');
    process.exit(1);
  }

  log(colors.yellow, '\n✨ 경고사항과 함께 검증 완료');
  process.exit(0);
}

main();
