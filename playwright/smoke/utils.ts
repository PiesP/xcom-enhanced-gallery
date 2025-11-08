import type { Page } from '@playwright/test';

/**
 * E2E 테스트 유틸리티
 * @module playwright/smoke/utils
 */

/**
 * 테스트 페이지에 E2E 하네스 주입
 *
 * **목적**: Solid.js 테스트 컴포넌트를 브라우저에 로드
 * **실행 환경**: Playwright 테스트 (about:blank 페이지)
 *
 * **사용 흐름**:
 * 1. test.beforeEach에서 호출
 * 2. global-setup.ts에서 빌드한 harness.js 로드
 * 3. window.__XEG_HARNESS__ 전역 객체 생성
 * 4. 테스트에서 harness API 사용 (setupGalleryApp, mountToolbar 등)
 *
 * **환경 변수**:
 * - XEG_E2E_HARNESS_PATH: global-setup.ts에서 설정
 *   (playwright/.cache/harness.js)
 *
 * **에러 처리**:
 * - XEG_E2E_HARNESS_PATH 없음: 에러 발생
 *   (global-setup 미실행 또는 실패)
 * - 스크립트 로드 실패: Playwright 에러
 * - 하네스 초기화 실패: waitForFunction 타임아웃
 *
 * **최적화**:
 * - 멱등성: 이미 로드된 경우 재로드 안 함
 * - 오류 감지: waitForFunction으로 초기화 확인
 *
 * @param page - Playwright Page 객체
 * @throws {Error} XEG_E2E_HARNESS_PATH 환경 변수 미설정
 * @throws {Error} 하네스 로드 또는 초기화 실패
 *
 * @example
 * ```typescript
 * test.beforeEach(async ({ page }) => {
 *   await page.goto('about:blank');
 *   await ensureHarness(page);
 * });
 *
 * test('setup gallery', async ({ page }) => {
 *   const harness = page.evaluate(() => window.__XEG_HARNESS__);
 *   const result = await harness.setupGalleryApp();
 *   expect(result.initialized).toBe(true);
 * });
 * ```
 *
 * **참조**:
 * - playwright.config.ts (globalSetup)
 * - playwright/global-setup.ts (빌드 및 경로 설정)
 * - playwright/harness/index.ts (하네스 정의)
 */
export async function ensureHarness(page: Page): Promise<void> {
  // 환경 변수 확인 (global-setup에서 설정)
  const harnessPath = process.env.XEG_E2E_HARNESS_PATH;
  if (!harnessPath) {
    throw new Error(
      'XEG_E2E_HARNESS_PATH is not set. Ensure Playwright global setup ran successfully.'
    );
  }

  /**
   * 하네스 로드 상태 확인
   * - 첫 호출: undefined (미로드)
   * - 이후 호출: 함수/객체 (로드됨)
   */
  const isLoaded = await page.evaluate<boolean | null>(() => {
    return typeof window.__XEG_HARNESS__ !== 'undefined';
  });

  if (!isLoaded) {
    /**
     * 스크립트 주입 및 초기화 대기
     *
     * **단계**:
     * 1. addScriptTag: 하네스 번들 로드
     * 2. waitForFunction: __XEG_HARNESS__ 객체 초기화 확인
     *
     * **타임아웃**: playwright.config.ts의 timeout 적용
     */
    await page.addScriptTag({ path: harnessPath });
    await page.waitForFunction(() => typeof window.__XEG_HARNESS__ !== 'undefined');
  }
}
