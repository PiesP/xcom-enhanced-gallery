/**
 * @fileoverview 테스트 카테고리 정의
 * TDD Phase 5c: Testing Strategy Unification - Categories
 */

export enum TestCategory {
  UNIT = 'unit',
  INTEGRATION = 'integration',
  E2E = 'e2e',
  PERFORMANCE = 'performance',
  ACCESSIBILITY = 'accessibility',
  REGRESSION = 'regression',
  SMOKE = 'smoke',
  STRESS = 'stress',
}

// 카테고리별 설정
export const CATEGORY_CONFIG = {
  [TestCategory.UNIT]: {
    timeout: 5000,
    parallel: true,
    coverage: true,
  },
  [TestCategory.INTEGRATION]: {
    timeout: 10000,
    parallel: false,
    coverage: true,
  },
  [TestCategory.E2E]: {
    timeout: 30000,
    parallel: false,
    coverage: false,
  },
  [TestCategory.PERFORMANCE]: {
    timeout: 60000,
    parallel: false,
    coverage: false,
  },
} as const;
