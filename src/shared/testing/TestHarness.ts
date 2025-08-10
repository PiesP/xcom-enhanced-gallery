/**
 * @fileoverview 테스트 하네스 - 통합 테스트 환경 관리
 * TDD Phase 5c: Testing Strategy Unification - Test Harness
 */

import type { TestContext, TestEnvironmentConfig } from './types';
import { createTestEnvironment } from './environment';

/**
 * TestHarness - 테스트 환경 통합 관리자
 */
export class TestHarness {
  private context: TestContext | null = null;
  private isSetup = false;

  constructor(private readonly config?: Partial<TestEnvironmentConfig>) {}

  /**
   * 테스트 환경 초기 설정
   */
  async setup(): Promise<void> {
    if (this.isSetup) {
      return;
    }

    const defaultConfig: TestEnvironmentConfig = {
      scenario: 'default-test',
      mocks: ['dom'],
      timeout: 30000,
      isolated: true,
    };

    const finalConfig = { ...defaultConfig, ...this.config };
    const env = await createTestEnvironment(finalConfig);

    this.context = {
      scenarioName: finalConfig.scenario,
      startTime: Date.now(),
      dom: env.dom,
      window: env.window,
      mocks: env.mocks,
      cleanup: env.cleanup,
    };

    this.isSetup = true;
  }

  /**
   * 테스트 컨텍스트 생성
   */
  async createContext(scenarioName: string): Promise<TestContext> {
    if (!this.isSetup) {
      await this.setup();
    }

    if (!this.context) {
      throw new Error('Test context not initialized');
    }

    // 새로운 컨텍스트 생성 (기존 것을 기반으로)
    return {
      ...this.context,
      scenarioName,
      startTime: Date.now(),
    };
  }

  /**
   * DOM 접근자
   */
  get dom(): Document {
    if (!this.context) {
      throw new Error('TestHarness not setup. Call setup() first.');
    }
    return this.context.dom;
  }

  /**
   * Window 접근자
   */
  get window(): Window {
    if (!this.context) {
      throw new Error('TestHarness not setup. Call setup() first.');
    }
    return this.context.window;
  }

  /**
   * 병렬 테스트 실행
   */
  async runParallel<T>(tests: Array<() => Promise<T>>): Promise<T[]> {
    if (!this.isSetup) {
      await this.setup();
    }

    return Promise.all(tests.map(test => test()));
  }

  /**
   * 스냅샷 생성
   */
  createSnapshot(options: { type: 'dom' | 'data'; element?: string }): {
    match: (content: string) => boolean;
  } {
    const { type, element } = options;

    let snapshotContent = '';
    if (type === 'dom' && element) {
      snapshotContent = element;
    }

    return {
      match: (content: string) => content === snapshotContent,
    };
  }

  /**
   * 테스트 환경 정리
   */
  async teardown(): Promise<void> {
    await this.context?.cleanup?.();

    this.context = null;
    this.isSetup = false;
  }
}
