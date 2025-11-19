import { defineConfig, devices } from '@playwright/test';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

/**
 * @file Playwright Test Configuration
 * @description E2E 및 접근성 테스트 설정
 *
 * **역할**:
 * - 테스트 디렉토리 및 파일 패턴 정의
 * - 브라우저 프로젝트 구성
 * - 타임아웃 및 재시도 정책
 * - 병렬 실행 및 워커 설정
 * - 보고서 및 트레이싱 구성
 *
 * **환경 변수**:
 * - PLAYWRIGHT_TEST_DIR: 테스트 디렉토리 선택 (기본값: 'smoke')
 *   예: 'smoke' (기본), 'accessibility' (a11y 테스트)
 * - PLAYWRIGHT_BROWSERS: 브라우저 선택 (기본값: 'chromium')
 *   예: 'chromium', 'firefox', 'webkit', 'all'
 * - CI: CI/CD 환경 여부 (GitHub Actions에서 자동 설정)
 *
 * **사용 방법**:
 * ```bash
 * # 기본 smoke 테스트
 * npm run e2e:smoke
 *
 * # 접근성 테스트
 * npm run e2e:a11y
 *
 * # 모든 테스트
 * npm run e2e:all
 *
 * # 다중 브라우저
 * PLAYWRIGHT_BROWSERS=all npm run e2e:smoke
 * ```
 *
 * **참조**: scripts/validate-build.ts, playwright/global-setup.ts
 */

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const testDir = path.resolve(__dirname, 'playwright');

/**
 * 테스트 서브디렉토리 선택
 * - PLAYWRIGHT_TEST_DIR 환경 변수로 제어
 * - 기본값: 'smoke' (빠른 검증용)
 * - 대안: 'accessibility' (a11y 테스트)
 */
const testSubDir = process.env.PLAYWRIGHT_TEST_DIR || 'smoke';
const testMatch = new RegExp(`${testSubDir}/.*\\.spec\\.ts$`);

/**
 * 브라우저 선택 설정
 *
 * **선택 옵션**:
 * - 'chromium': Chrome/Edge 기반 (기본값, CI/로컬 모두)
 * - 'firefox': Firefox 엔진 (선택적)
 * - 'webkit': Safari 호환성 (선택적)
 * - 'all': 모든 브라우저 (로컬 크로스 브라우저 테스트용)
 *
 * **CI 정책**: Chromium만 실행 (성능 최적화)
 * **로컬 정책**: Chromium 기본, PLAYWRIGHT_BROWSERS=all로 전환 가능
 *
 * **예시**:
 * ```bash
 * # 기본 (Chromium)
 * npm run e2e:smoke
 *
 * # 모든 브라우저
 * PLAYWRIGHT_BROWSERS=all npm run e2e:smoke
 *
 * # Firefox만
 * PLAYWRIGHT_BROWSERS=firefox npm run e2e:smoke
 * ```
 */
const browserArg = process.env.PLAYWRIGHT_BROWSERS || 'chromium';
const selectedBrowsers = browserArg
  .split(',')
  .map(b => b.trim())
  .filter(Boolean);

export default defineConfig({
  testDir,
  testMatch,

  /**
   * 타임아웃 설정
   * - timeout: 단일 테스트 최대 실행 시간 (ms)
   * - actionTimeout: 사용자 상호작용 대기 시간 (클릭, 입력 등)
   * - expect.timeout: 어서션 대기 시간
   *
   * **성능 고려사항**:
   * - 로컬: 관대한 설정 (디버깅 시간 확보)
   * - CI: 엄격한 설정 (성능 최적화)
   */
  timeout: 60_000, // 60초 (테스트별)
  expect: {
    timeout: 5_000, // 5초 (어서션별)
  },

  /**
   * 병렬 실행 설정
   *
   * **fullyParallel**: 모든 워커가 독립적으로 테스트 실행
   * - true: 최대 병렬화 (CPU 활용도 높음)
   * - false: 파일 단위 순차 (메모리 효율)
   *
   * **workers**: 동시 워커 프로세스 수
   * - 로컬: 10개 (12-core 머신 활용)
   * - CI: 4개 (리소스 제약)
   *
   * **권장사항**:
   * - 로컬: 시스템 코어 수의 80% 정도
   * - CI: 리소스 제약을 고려해 4-6 설정
   */
  fullyParallel: true,
  workers: process.env.CI ? 4 : 10,

  /**
   * CI 정책
   *
   * **forbidOnly**: test.only() 금지 (CI에서 의도치 않은 스킵 방지)
   * **retries**: 실패한 테스트 재시도 횟수
   * - CI: 2회 (플레이키한 테스트 안정화)
   * - 로컬: 0회 (디버깅 편의)
   */
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,

  /**
   * 보고서 및 로깅
   *
   * **reporter**: 테스트 결과 보고 형식
   * - 'list': 간단한 텍스트 출력 (기본값, 빠름)
   * - 'html': 상세 HTML 리포트
   * - 'json': JSON 형식 (CI 통합용)
   *
   * **현재 설정**: 'list' (터미널 출력 최소화)
   * **확장 옵션**: --reporter=html로 보고서 생성 가능
   */
  reporter: [['list']],

  /**
   * 브라우저 및 환경 설정
   *
   * **baseURL**: 모든 navigation의 기본 URL
   * - 'about:blank': 빈 페이지 시작 (harness 주입 용)
   *
   * **viewport**: 기본 창 크기
   * - 1280x720: 일반적인 데스크톱 해상도 (PC 전용 정책)
   *
   * **actionTimeout**: 사용자 상호작용 대기
   * - 10초: 요소 찾기, 클릭 등
   *
   * **trace**: 디버깅용 트레이싱
   * - 'on-first-retry': 첫 재시도 시만 기록
   *
   * **video**: 테스트 영상 기록
   * - CI: 실패 시만 유지 ('retain-on-failure')
   * - 로컬: 재시도 시 기록 ('retry-with-video')
   *
   * **screenshot**: 스크린샷 캡처
   * - 'only-on-failure': 실패한 테스트만 저장
   */
  use: {
    baseURL: 'about:blank',
    viewport: { width: 1280, height: 720 },
    trace: 'on-first-retry',
    video: process.env.CI ? 'retain-on-failure' : 'retry-with-video',
    screenshot: 'only-on-failure',
    actionTimeout: 10_000,
  },

  /**
   * 브라우저 프로젝트 설정
   *
   * **Chromium** (기본):
   * - 모든 환경에서 실행 (CI/로컬)
   * - 성능: 가장 빠름
   * - 호환성: Chrome/Edge 기반
   *
   * **Firefox** (선택적):
   * - PLAYWRIGHT_BROWSERS=firefox 또는 all로 활성화
   * - 성능: Chromium과 유사
   * - 호환성: Firefox 고유 동작 검증
   *
   * **WebKit** (선택적):
   * - PLAYWRIGHT_BROWSERS=webkit 또는 all로 활성화
   * - 성능: 느림 (Safari 호환 테스트용)
   * - 호환성: Safari 고유 동작 검증
   *
   * **확대 전략**:
   * 1. 로컬: PLAYWRIGHT_BROWSERS=all로 크로스 브라우저 테스트
   * 2. CI: Chromium만 (속도 우선)
   * 3. 문제 발생 시: 특정 브라우저에서 재검증
   */
  projects: [
    // Chromium (Chrome/Edge based) - Always in CI and default locally
    ...(selectedBrowsers.includes('chromium') || selectedBrowsers.includes('all')
      ? [
          {
            name: 'chromium',
            use: {
              ...devices['Desktop Chrome'],
            },
          },
        ]
      : []),

    // Firefox - Optional cross-browser testing locally
    ...(selectedBrowsers.includes('firefox') || selectedBrowsers.includes('all')
      ? [
          {
            name: 'firefox',
            use: {
              ...devices['Desktop Firefox'],
            },
          },
        ]
      : []),

    // WebKit (Safari alternative) - Optional cross-browser testing locally
    ...(selectedBrowsers.includes('webkit') || selectedBrowsers.includes('all')
      ? [
          {
            name: 'webkit',
            use: {
              ...devices['Desktop Safari'],
            },
          },
        ]
      : []),
  ],

  /**
   * Global setup script
   *
   * **역할**: Playwright 테스트 시작 전 한 번 실행
   * - E2E 테스트 harness 빌드
   * - 환경 변수 설정 (XEG_E2E_HARNESS_PATH)
   * - 캐시 디렉토리 생성
   * - Phase 415: 로컬 HTTP 서버 시작 (localStorage 테스트용)
   *
   * **참조**: playwright/global-setup.ts
   */
  globalSetup: path.resolve(__dirname, 'playwright', 'global-setup.ts'),

  /**
   * Global teardown script
   *
   * **역할**: Playwright 테스트 종료 후 정리
   * - Phase 415: 로컬 HTTP 서버 중지
   *
   * **참조**: playwright/global-setup.ts (globalTeardown)
   */
  globalTeardown: path.resolve(__dirname, 'playwright', 'global-setup.ts'),
});
