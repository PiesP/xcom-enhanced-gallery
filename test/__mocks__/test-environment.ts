/**
 * 테스트 환경 설정 및 정리 헬퍼
 * @fileoverview 테스트 환경의 초기화 및 정리를 위한 유틸리티
 */

/**
 * 테스트 환경 모드
 * - 'minimal': 기본 설정만 수행
 * - 'full': 전체 기능 포함 설정
 * - 'default': 기본값
 */
type TestEnvironmentMode = 'minimal' | 'full' | 'default' | undefined;

/**
 * 환경 설정 상태 추적
 */
const environmentState = {
  isInitialized: false,
  mode: 'default' as TestEnvironmentMode,
};

/**
 * 테스트 환경 설정
 *
 * 기본 환경(Global setup, test/setup.ts)은 자동으로 적용되며,
 * 이 함수는 특정 테스트 케이스 내 추가 설정이 필요한 경우에 사용합니다.
 *
 * @param mode - 환경 모드 ('minimal' | 'full')
 * @throws {Error} 환경 설정 중 오류 발생 시
 *
 * @example
 * ```typescript
 * beforeEach(async () => {
 *   await setupTestEnvironment('full');
 * });
 *
 * afterEach(async () => {
 *   await cleanupTestEnvironment();
 * });
 * ```
 */
export async function setupTestEnvironment(mode?: TestEnvironmentMode): Promise<void> {
  try {
    environmentState.mode = mode || 'default';

    if (mode === 'minimal') {
      // 최소 환경: 필수 요소만 초기화
      // 현재는 별도 작업 필요 없음
    } else if (mode === 'full') {
      // 전체 환경: 모든 기능 활성화
      // 현재는 별도 작업 필요 없음
    }

    environmentState.isInitialized = true;
  } catch (error) {
    throw new Error(
      `테스트 환경 설정 실패 (mode: ${mode}): ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

/**
 * 테스트 환경 정리
 *
 * 테스트 후 환경을 원래 상태로 복구합니다.
 *
 * @throws {Error} 환경 정리 중 오류 발생 시
 *
 * @example
 * ```typescript
 * afterEach(async () => {
 *   await cleanupTestEnvironment();
 * });
 * ```
 */
export async function cleanupTestEnvironment(): Promise<void> {
  try {
    // 환경 상태 초기화
    environmentState.isInitialized = false;
    environmentState.mode = 'default';
  } catch (error) {
    throw new Error(
      `테스트 환경 정리 실패: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

/**
 * 테스트 환경 상태 조회 (디버깅용)
 * @returns 현재 환경 상태
 */
export function getTestEnvironmentState(): typeof environmentState {
  return { ...environmentState };
}

/**
 * 환경이 초기화되었는지 확인
 * @returns 초기화 상태
 */
export function isTestEnvironmentReady(): boolean {
  return environmentState.isInitialized;
}
