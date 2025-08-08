export const TEST_CATEGORIES = {
  FEATURE: 'feature',
  BEHAVIOR: 'behavior',
  INTEGRATION: 'integration',
  UNIT: 'unit',
  ARCH: 'architecture',
} as const;

export type TestCategory = (typeof TEST_CATEGORIES)[keyof typeof TEST_CATEGORIES];
