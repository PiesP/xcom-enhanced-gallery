#!/usr/bin/env node

/**
 * 개발 환경 셋업 스크립트
 * - Husky hooks 설치
 * - 개발 도구 검증
 * - 초기 설정 확인
 */

import { execSync } from 'child_process';
import { existsSync } from 'fs';
import { resolve } from 'path';

function setupDevEnvironment() {
  console.log('🔧 개발 환경 설정 시작...');

  try {
    // 1. Husky 설치 및 초기화
    console.log('📦 Husky 설정 중...');
    execSync('npx husky', { stdio: 'inherit' });

    // 2. Git hooks 확인
    const hooksDir = resolve(process.cwd(), '.husky');
    const requiredHooks = ['pre-commit', 'pre-push', 'commit-msg'];

    for (const hook of requiredHooks) {
      const hookPath = resolve(hooksDir, hook);
      if (existsSync(hookPath)) {
        console.log(`✅ ${hook} 훅이 설정되었습니다.`);
      } else {
        console.warn(`⚠️  ${hook} 훅이 누락되었습니다.`);
      }
    }

    // 3. 의존성 검사
    console.log('🔍 개발 도구 검증 중...');

    const devTools = [
      { name: 'TypeScript', command: 'npx tsc --version' },
      { name: 'ESLint', command: 'npx eslint --version' },
      { name: 'Prettier', command: 'npx prettier --version' },
      { name: 'Vitest', command: 'npx vitest --version' },
    ];

    for (const tool of devTools) {
      try {
        const version = execSync(tool.command, { encoding: 'utf8' }).trim();
        console.log(`✅ ${tool.name}: ${version}`);
      } catch (error) {
        console.error(`❌ ${tool.name}을 찾을 수 없습니다.`);
      }
    }

    // 4. 기본 검증 실행
    console.log('🧪 기본 검증 실행 중...');
    execSync('npm run typecheck', { stdio: 'inherit' });
    execSync('npm run lint', { stdio: 'inherit' });

    console.log('\n✅ 개발 환경 설정 완료!');
    console.log('🚀 이제 개발을 시작할 수 있습니다.');
    console.log('\n주요 명령어:');
    console.log('  npm run dev        - 개발 서버 시작');
    console.log('  npm run test:watch - 테스트 감시 모드');
    console.log('  npm run quality    - 코드 품질 검사');
  } catch (error) {
    console.error('❌ 개발 환경 설정 실패:', error.message);
    process.exit(1);
  }
}

setupDevEnvironment();
