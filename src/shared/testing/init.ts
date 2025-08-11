/**
 * @fileoverview Testing framework initialization helper moved out of barrel for hygiene.
 */
import { TestHarness } from './TestHarness';
import { StandardMockFactory } from './StandardMockFactory';
import { TestReporter } from './TestReporter';

export const DEFAULT_TEST_CONFIG = {
  timeout: 30000,
  retries: 2,
  isolation: true,
  parallel: true,
} as const;

export async function initializeTestingFramework(): Promise<{
  harness: TestHarness;
  mockFactory: StandardMockFactory;
  reporter: TestReporter;
}> {
  const harness = new TestHarness();
  const mockFactory = new StandardMockFactory();
  const reporter = new TestReporter();

  await harness.setup();

  return { harness, mockFactory, reporter };
}
