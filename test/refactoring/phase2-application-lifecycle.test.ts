/**
 * @fileoverview Phase 2: 초기화 프로세스 단순화 - ApplicationLifecycle TDD 테스트
 * @description main.ts의 복잡한 초기화 로직을 체계화하는 ApplicationLifecycle TDD 테스트
 */

/**
 * Phase 2: 초기화 프로세스 단순화 - ApplicationLifecycle TDD 테스트
 *
 * 목표: main.ts의 복잡한 초기화 로직을 체계화
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ApplicationLifecycle } from '@shared/services/ApplicationLifecycle';

describe('ApplicationLifecycle - TDD Phase 2', () => {
  let lifecycle: ApplicationLifecycle;

  beforeEach(() => {
    lifecycle = new ApplicationLifecycle();
  });

  describe('기본 단계 관리', () => {
    it('단계를 등록하고 순서대로 실행할 수 있어야 한다', async () => {
      // Given: 실행 순서 추적 배열
      const executionOrder: string[] = [];

      // When: 여러 단계 등록
      lifecycle.addStage('infrastructure', async () => {
        executionOrder.push('infrastructure');
      });
      lifecycle.addStage('services', async () => {
        executionOrder.push('services');
      });
      lifecycle.addStage('features', async () => {
        executionOrder.push('features');
      });

      // When: 라이프사이클 시작
      await lifecycle.start();

      // Then: 등록한 순서대로 실행되어야 함
      expect(executionOrder).toEqual(['infrastructure', 'services', 'features']);
    });

    it('빈 라이프사이클을 시작할 수 있어야 한다', async () => {
      // When & Then: 단계가 없어도 정상 실행
      await expect(lifecycle.start()).resolves.toBeUndefined();
    });
  });

  describe('에러 처리', () => {
    it('단계 실행 중 에러 발생 시 적절히 처리해야 한다', async () => {
      // Given: 에러가 발생하는 단계
      lifecycle.addStage('failing-stage', async () => {
        throw new Error('Stage failed');
      });

      // When & Then: 에러가 전파되어야 함
      await expect(lifecycle.start()).rejects.toThrow('Stage failed');
    });

    it('에러 발생 후에도 다시 시작할 수 있어야 한다', async () => {
      // Given: 에러가 발생하는 단계와 정상 단계
      const executionOrder: string[] = [];

      lifecycle.addStage('normal-stage', async () => {
        executionOrder.push('normal');
      });
      lifecycle.addStage('failing-stage', async () => {
        throw new Error('Test error');
      });

      // When: 첫 번째 시도 (실패)
      await expect(lifecycle.start()).rejects.toThrow();

      // When: 단계 재설정 후 재시도
      lifecycle.reset();
      lifecycle.addStage('recovery-stage', async () => {
        executionOrder.push('recovery');
      });

      await lifecycle.start();

      // Then: 정상 실행되어야 함
      expect(executionOrder).toContain('recovery');
    });
  });

  describe('단계 중복 및 덮어쓰기', () => {
    it('같은 이름의 단계를 등록하면 덮어써야 한다', async () => {
      // Given: 실행 추적
      const executionOrder: string[] = [];

      // When: 같은 이름으로 두 번 등록
      lifecycle.addStage('test-stage', async () => {
        executionOrder.push('first');
      });
      lifecycle.addStage('test-stage', async () => {
        executionOrder.push('second');
      });

      await lifecycle.start();

      // Then: 마지막에 등록된 것만 실행되어야 함
      expect(executionOrder).toEqual(['second']);
    });

    it('allowOverwrite=false일 때 중복 등록을 방지해야 한다', () => {
      // Given: 첫 번째 단계 등록
      lifecycle.addStage('test-stage', async () => {});

      // When & Then: allowOverwrite=false로 중복 등록 시 에러
      expect(() => {
        lifecycle.addStage('test-stage', async () => {}, false);
      }).toThrow('Stage already exists: test-stage');
    });
  });

  describe('단계 상태 관리', () => {
    it('등록된 단계 목록을 조회할 수 있어야 한다', () => {
      // Given: 여러 단계 등록
      lifecycle.addStage('stage1', async () => {});
      lifecycle.addStage('stage2', async () => {});
      lifecycle.addStage('stage3', async () => {});

      // When: 단계 목록 조회
      const stages = lifecycle.getStages();

      // Then: 모든 단계가 포함되어야 함
      expect(stages).toContain('stage1');
      expect(stages).toContain('stage2');
      expect(stages).toContain('stage3');
      expect(stages).toHaveLength(3);
    });

    it('단계 존재 여부를 확인할 수 있어야 한다', () => {
      // Given: 단계 등록
      lifecycle.addStage('existing-stage', async () => {});

      // When & Then: 존재 여부 확인
      expect(lifecycle.hasStage('existing-stage')).toBe(true);
      expect(lifecycle.hasStage('non-existing-stage')).toBe(false);
    });
  });

  describe('실행 상태 추적', () => {
    it('라이프사이클 실행 상태를 추적할 수 있어야 한다', async () => {
      // Given: 단계 등록
      lifecycle.addStage('test-stage', async () => {
        // 실행 중 상태 확인
        expect(lifecycle.isRunning()).toBe(true);
      });

      // When: 실행 전 상태 확인
      expect(lifecycle.isRunning()).toBe(false);

      // When: 라이프사이클 실행
      await lifecycle.start();

      // Then: 실행 완료 후 상태 확인
      expect(lifecycle.isRunning()).toBe(false);
    });

    it('중복 실행을 방지해야 한다', async () => {
      // Given: 긴 실행 시간을 가진 단계
      lifecycle.addStage('long-stage', async () => {
        await new Promise(resolve => setTimeout(resolve, 50));
      });

      // When: 동시에 두 번 시작 시도
      const firstStart = lifecycle.start();

      // Then: 두 번째 시작은 에러 발생
      await expect(lifecycle.start()).rejects.toThrow('Lifecycle is already running');

      // 첫 번째 실행 완료 대기
      await firstStart;
    });
  });

  describe('단계 제거', () => {
    it('등록된 단계를 제거할 수 있어야 한다', async () => {
      // Given: 단계 등록
      const executionOrder: string[] = [];
      lifecycle.addStage('stage1', async () => {
        executionOrder.push('stage1');
      });
      lifecycle.addStage('stage2', async () => {
        executionOrder.push('stage2');
      });
      lifecycle.addStage('stage3', async () => {
        executionOrder.push('stage3');
      });

      // When: 중간 단계 제거
      const removed = lifecycle.removeStage('stage2');

      // Then: 제거 성공 확인
      expect(removed).toBe(true);
      expect(lifecycle.hasStage('stage2')).toBe(false);

      // When: 라이프사이클 실행
      await lifecycle.start();

      // Then: 제거된 단계는 실행되지 않아야 함
      expect(executionOrder).toEqual(['stage1', 'stage3']);
    });

    it('존재하지 않는 단계 제거 시 false를 반환해야 한다', () => {
      // When & Then: 존재하지 않는 단계 제거
      const removed = lifecycle.removeStage('non-existing');
      expect(removed).toBe(false);
    });
  });

  describe('리소스 정리', () => {
    it('reset으로 모든 단계를 제거할 수 있어야 한다', async () => {
      // Given: 여러 단계 등록
      lifecycle.addStage('stage1', async () => {});
      lifecycle.addStage('stage2', async () => {});

      // When: 리셋 실행
      lifecycle.reset();

      // Then: 모든 단계가 제거되어야 함
      expect(lifecycle.getStages()).toHaveLength(0);
      expect(lifecycle.hasStage('stage1')).toBe(false);
      expect(lifecycle.hasStage('stage2')).toBe(false);
    });
  });

  describe('단계 실행 시간 측정', () => {
    it('각 단계의 실행 시간을 측정할 수 있어야 한다', async () => {
      // Given: 실행 시간이 있는 단계들
      lifecycle.addStage('fast-stage', async () => {
        await new Promise(resolve => setTimeout(resolve, 10));
      });
      lifecycle.addStage('slow-stage', async () => {
        await new Promise(resolve => setTimeout(resolve, 20));
      });

      // When: 실행 시간 측정과 함께 시작
      const result = await lifecycle.startWithTiming();

      // Then: 실행 시간 정보 확인
      expect(result.totalTime).toBeGreaterThan(25); // 최소 30ms (10+20)
      expect(result.stages).toHaveLength(2);
      expect(result.stages[0].name).toBe('fast-stage');
      expect(result.stages[1].name).toBe('slow-stage');
      expect(result.stages[0].duration).toBeGreaterThan(5);
      expect(result.stages[1].duration).toBeGreaterThan(15);
    });
  });
});
