/**
 * @fileoverview Re-export from harness.ts (호환성 유지)
 * @deprecated harness.ts 직접 import 권장: `import { createTestHarness } from '@shared/container/harness'`
 */
export { TestHarness, ServiceHarness, createTestHarness, createServiceHarness } from './harness';
