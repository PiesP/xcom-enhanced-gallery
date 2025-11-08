/**
 * @file Playwright Global Setup
 * @description E2E 테스트 하네스 빌드 및 초기화
 *
 * **역할**:
 * - harness/index.ts를 브라우저 실행 가능한 IIFE 번들로 빌드
 * - Solid.js JSX → DOM 변환 (babel-preset-solid)
 * - CSS Modules 스텁 처리 (E2E 환경에서 스타일 불필요)
 * - 빌드 결과를 .cache/harness.js에 저장
 *
 * **실행 흐름**:
 * 1. Playwright 테스트 시작 전 globalSetup 호출
 * 2. esbuild로 harness/index.ts 번들링
 * 3. Solid.js JSX 컴파일 (babel-preset-solid)
 * 4. CSS 모듈 스텁 처리
 * 5. 환경 변수 설정 (XEG_E2E_HARNESS_PATH)
 * 6. smoke/utils.ts의 ensureHarness()에서 사용
 *
 * **에러 처리**:
 * - Babel 변환 실패 시 상세 에러 로깅
 * - 빌드 실패 시 전체 테스트 스킵 (fail-fast)
 *
 * **참조**:
 * - playwright.config.ts (globalSetup 호출)
 * - playwright/smoke/utils.ts (ensureHarness 호출)
 * - playwright/harness/index.ts (테스트 하네스 정의)
 */

import { build } from 'esbuild';
import type { Plugin } from 'esbuild';
import { transformAsync } from '@babel/core';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const harnessEntry = path.resolve(__dirname, 'harness', 'index.ts');
const cacheDir = path.resolve(__dirname, '.cache');
const harnessOutput = path.resolve(cacheDir, 'harness.js');

/**
 * Solid.js JSX 컴파일 플러그인
 *
 * **기능**:
 * - .tsx, .jsx 파일에 babel-preset-solid 적용
 * - 소스맵 제외 (E2E 환경에서 불필요)
 * - TypeScript 타입 제거
 *
 * **에러 처리**:
 * - Babel 변환 실패 시 상세 메시지 출력
 * - 변환 실패 파일과 에러 정보 기록
 */
const solidJsxPlugin: Plugin = {
  name: 'solid-jsx',
  setup(build) {
    build.onLoad({ filter: /\.(tsx|jsx)$/ }, async args => {
      const source = await fs.readFile(args.path, 'utf8');

      try {
        /**
         * babel-preset-solid 동적 import
         * - 타입 정의 없음 (any로 처리)
         * - ES Module과 CommonJS 모두 지원
         */
        const solidPresetModule = await import('babel-preset-solid');
        const solidPreset = solidPresetModule.default || solidPresetModule;

        const result = await transformAsync(source, {
          filename: args.path,
          presets: [
            /**
             * TypeScript 프리셋 설정
             * - isTSX: JSX 구문 허용
             * - allExtensions: .tsx뿐만 아니라 .ts도 처리
             */
            ['@babel/preset-typescript', { isTSX: true, allExtensions: true }],
            /**
             * Solid.js 프리셋
             * - generate: 'dom' = 브라우저 실행 코드 생성
             * - hydratable: false = SSR 미지원 (E2E 테스트는 항상 새로 생성)
             */
            [solidPreset, { generate: 'dom', hydratable: false }],
          ],
          sourceMaps: false,
        });

        return {
          contents: result?.code ?? source,
          loader: 'js',
        };
      } catch (error) {
        /**
         * 에러 로깅 전략
         * - 파일 경로 포함 (어느 파일에서 오류 발생)
         * - 원본 에러 객체 출력 (스택 트레이스)
         * - throw로 빌드 중단 (부분 빌드 방지)
         */
        console.error(`[Harness Build] Babel transform failed for ${args.path}:`, error);
        throw error;
      }
    });
  },
};

/**
 * CSS 모듈 스텁 플러그인
 *
 * **목적**:
 * - E2E 테스트는 비주얼 검증하지 않음 (Playwright 스크린샷 제외)
 * - CSS 모듈 불러오기 에러 방지
 * - 번들 크기 최소화
 *
 * **처리 방식**:
 * 1. .module.css: 빈 Proxy 객체 내보내기 (className 참조 가능)
 * 2. .css: 빈 내용 (전역 스타일은 DOM에 영향 없음)
 */
const cssModuleStubPlugin: Plugin = {
  name: 'css-module-stub',
  setup(build) {
    /**
     * CSS Modules (*.module.css)
     * - 동적 프로퍼티 접근 지원 (className 사용 가능)
     * - __esModule 플래그로 ES6 호환 표시
     */
    build.onLoad({ filter: /\.module\.css$/ }, async () => ({
      contents:
        'const proxy = new Proxy({}, { get: () => "" }); export default proxy; export const __esModule = true;',
      loader: 'js',
    }));

    /**
     * 일반 CSS (*.css)
     * - 전역 스타일 (E2E에서 무시)
     * - 빈 내용으로 처리 (로드 에러 방지)
     */
    build.onLoad({ filter: /\.css$/ }, async () => ({
      contents: '',
      loader: 'css',
    }));
  },
};

/**
 * 하네스 빌드 함수
 *
 * **단계별 처리**:
 * 1. CI 환경 감지 (프로그레스 로그 제어)
 * 2. 캐시 디렉토리 생성
 * 3. esbuild 번들링 (플러그인 적용)
 * 4. 환경 변수 설정 (playwright/smoke/utils.ts에서 사용)
 * 5. 성공/실패 로그 출력
 *
 * **환경 변수 정의**:
 * - __DEV__: true (개발 환경 기능 활성화)
 * - NODE_ENV: 'development'
 * - import.meta.env.*: Vite 호환 변수
 *
 * **성능 최적화**:
 * - target: chrome120 (최신 브라우저용)
 * - sourcemap: false (번들 크기 감소)
 * - logLevel: 'silent' 또는 'info' (VERBOSE 제어)
 *
 * **디버깅**:
 * - VERBOSE=true 사용 시 상세 빌드 로그 출력
 */
async function buildHarness(): Promise<void> {
  const isCI = process.env.CI === 'true';
  const isVerbose = process.env.VERBOSE === 'true';

  try {
    if (!isCI) {
      console.log('[Harness Build] Building E2E test harness...');
    }

    // 캐시 디렉토리 생성
    await fs.mkdir(cacheDir, { recursive: true });

    // esbuild로 번들링
    await build({
      entryPoints: [harnessEntry],
      outfile: harnessOutput,
      bundle: true,
      format: 'iife', // 즉시 실행 함수 (브라우저에서 바로 실행)
      platform: 'browser',
      target: ['chrome120'], // 최신 브라우저 기능 사용
      sourcemap: false, // 번들 크기 최소화
      logLevel: isVerbose ? 'info' : 'silent',
      define: {
        __DEV__: 'true',
        'process.env.NODE_ENV': '"development"',
        'import.meta.env.MODE': '"e2e"',
        'import.meta.env.DEV': '"true"',
        'import.meta.env.PROD': '"false"',
        'import.meta.env.SSR': '"false"',
      },
      plugins: [solidJsxPlugin, cssModuleStubPlugin],
    });

    // 환경 변수로 하네스 경로 전달 (playwright/smoke/utils.ts 사용)
    process.env.XEG_E2E_HARNESS_PATH = harnessOutput;

    if (!isCI) {
      const relativePath = path.relative(process.cwd(), harnessOutput);
      console.log(`[Harness Build] ✓ Built successfully: ${relativePath}`);
    }
  } catch (error) {
    // 빌드 실패 시 상세 에러 로깅 (전체 테스트 중단됨)
    console.error('[Harness Build] ✗ Build failed:', error);
    throw error;
  }
}

/**
 * Playwright 전역 설정 진입점
 *
 * **호출 시점**: 모든 E2E 테스트 시작 전 한 번
 * **실행 환경**: Node.js (브라우저 아님)
 * **결과**: 환경 변수 설정 및 캐시 파일 생성
 */
export default async function globalSetup(): Promise<void> {
  await buildHarness();
}
