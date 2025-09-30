/**
 * @fileoverview download.signals.ts - SolidJS Native Pattern Tests (Phase G-3-2)
 * @version 1.0.0
 *
 * 목표: download.signals.ts가 SolidJS 네이티브 패턴을 사용하는지 검증
 * - createGlobalSignal 대신 createSignal 사용
 * - .value 속성 대신 함수 호출
 * - .subscribe 메서드 대신 createEffect 패턴
 * - 파생 상태는 createMemo 사용
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { getSolidCore } from '@shared/external/vendors';
import type { Accessor, Setter } from 'solid-js';
import type { DownloadState, DownloadTask, MediaInfo } from '@shared/types';

const { createRoot, createEffect } = getSolidCore();

describe('SOLID-NATIVE-001 Phase G-3-2: download.signals.ts 네이티브 패턴', () => {
  let dispose: (() => void) | undefined;

  afterEach(() => {
    if (dispose) {
      dispose();
      dispose = undefined;
    }
  });

  // ==========================================================================
  // Phase G-3-2-1: 상태 정의 (State Definition)
  // ==========================================================================
  describe('Phase G-3-2-1: 상태 정의', () => {
    it('downloadState는 Accessor<DownloadState> 함수여야 한다', async () => {
      const { downloadState } = await import('@shared/state/signals/download.signals');

      expect(typeof downloadState).toBe('function');
      // SolidJS accessor는 'bound readSignal' 이름을 가짐
      expect(downloadState.name).toMatch(/readSignal|^$/);

      const state = downloadState();
      expect(state).toHaveProperty('activeTasks');
      expect(state).toHaveProperty('queue');
      expect(state).toHaveProperty('isProcessing');
      expect(state).toHaveProperty('globalProgress');
    });

    it('레거시 .value 속성이 존재하지 않아야 한다', async () => {
      const { downloadState } = await import('@shared/state/signals/download.signals');

      // @ts-expect-error - 레거시 API는 더 이상 존재하지 않아야 함
      expect(downloadState.value).toBeUndefined();
    });

    it('레거시 .subscribe 메서드가 존재하지 않아야 한다', async () => {
      const { downloadState } = await import('@shared/state/signals/download.signals');

      // @ts-expect-error - 레거시 API는 더 이상 존재하지 않아야 함
      expect(downloadState.subscribe).toBeUndefined();
    });
  });

  // ==========================================================================
  // Phase G-3-2-2: 상태 업데이트 (State Updates)
  // ==========================================================================
  describe('Phase G-3-2-2: 상태 업데이트', () => {
    it('setDownloadState로 직접 상태를 업데이트할 수 있어야 한다', async () => {
      const { downloadState, setDownloadState } = await import(
        '@shared/state/signals/download.signals'
      );

      expect(typeof setDownloadState).toBe('function');

      const newState: DownloadState = {
        activeTasks: new Map(),
        queue: ['task1', 'task2'],
        isProcessing: true,
        globalProgress: 50,
      };

      dispose = createRoot(disposeRoot => {
        setDownloadState(newState);

        const currentState = downloadState();
        expect(currentState.queue).toEqual(['task1', 'task2']);
        expect(currentState.isProcessing).toBe(true);
        expect(currentState.globalProgress).toBe(50);

        return disposeRoot;
      });
    });

    it('setDownloadState는 함수 업데이터를 받을 수 있어야 한다', async () => {
      const { downloadState, setDownloadState } = await import(
        '@shared/state/signals/download.signals'
      );

      dispose = createRoot(disposeRoot => {
        setDownloadState({
          activeTasks: new Map(),
          queue: [],
          isProcessing: false,
          globalProgress: 0,
        });

        setDownloadState(prev => ({
          ...prev,
          isProcessing: true,
          globalProgress: 75,
        }));

        const currentState = downloadState();
        expect(currentState.isProcessing).toBe(true);
        expect(currentState.globalProgress).toBe(75);

        return disposeRoot;
      });
    });

    it('레거시 .update() 메서드가 존재하지 않아야 한다', async () => {
      const { downloadState } = await import('@shared/state/signals/download.signals');

      // @ts-expect-error - 레거시 API
      expect(downloadState.update).toBeUndefined();
    });
  });

  // ==========================================================================
  // Phase G-3-2-3: 파생 상태 (Derived State)
  // ==========================================================================
  describe('Phase G-3-2-3: 파생 상태', () => {
    it('getDownloadInfo는 createMemo 기반 accessor여야 한다', async () => {
      const { getDownloadInfo, setDownloadState } = await import(
        '@shared/state/signals/download.signals'
      );

      expect(typeof getDownloadInfo).toBe('function');

      dispose = createRoot(disposeRoot => {
        setDownloadState({
          activeTasks: new Map([
            [
              'task1',
              {
                id: 'task1',
                mediaId: 'media1' as any,
                mediaUrl: 'http://example.com/1.jpg',
                filename: 'test1.jpg',
                status: 'downloading',
                progress: 50,
                startedAt: Date.now(),
              },
            ],
          ]),
          queue: ['task1'],
          isProcessing: true,
          globalProgress: 50,
        });

        const info = getDownloadInfo();
        expect(info.isAnyDownloading).toBe(true);
        expect(info.activeTasks).toBe(1);
        expect(info.queueLength).toBe(1);

        return disposeRoot;
      });
    });

    it('getDownloadTask는 특정 작업을 가져오는 selector여야 한다', async () => {
      const { getDownloadTask, setDownloadState } = await import(
        '@shared/state/signals/download.signals'
      );

      expect(typeof getDownloadTask).toBe('function');

      const task: DownloadTask = {
        id: 'test-task',
        mediaId: 'media-123' as any,
        mediaUrl: 'http://example.com/test.jpg',
        filename: 'test.jpg',
        status: 'pending',
        progress: 0,
        startedAt: Date.now(),
      };

      dispose = createRoot(disposeRoot => {
        setDownloadState({
          activeTasks: new Map([['test-task', task]]),
          queue: [],
          isProcessing: false,
          globalProgress: 0,
        });

        const retrieved = getDownloadTask('test-task');
        expect(retrieved).toEqual(task);
        expect(getDownloadTask('non-existent')).toBeNull();

        return disposeRoot;
      });
    });

    it('파생 상태는 source state 변경 시 자동으로 업데이트되어야 한다', async () => {
      const { downloadState, setDownloadState, getDownloadInfo } = await import(
        '@shared/state/signals/download.signals'
      );

      dispose = createRoot(disposeRoot => {
        setDownloadState({
          activeTasks: new Map(),
          queue: [],
          isProcessing: false,
          globalProgress: 0,
        });

        let info = getDownloadInfo();
        expect(info.isAnyDownloading).toBe(false);

        setDownloadState(prev => ({
          ...prev,
          isProcessing: true,
        }));

        info = getDownloadInfo();
        expect(info.isProcessing).toBe(true);

        return disposeRoot;
      });
    });
  });

  // ==========================================================================
  // Phase G-3-2-4: Effects (구독 패턴)
  // ==========================================================================
  describe('Phase G-3-2-4: Effects', () => {
    it('createDownloadTask는 상태를 직접 setter로 업데이트해야 한다', async () => {
      const { createDownloadTask, downloadState } = await import(
        '@shared/state/signals/download.signals'
      );

      dispose = createRoot(disposeRoot => {
        const initialTaskCount = downloadState().activeTasks.size;

        const result = createDownloadTask({
          id: 'media-test',
          url: 'http://example.com/test.jpg',
          filename: 'test.jpg',
          type: 'image',
        } as MediaInfo);

        expect(result.success).toBe(true);
        if (result.success) {
          const newState = downloadState();
          expect(newState.activeTasks.size).toBe(initialTaskCount + 1);
          expect(newState.queue).toContain(result.data);
        }

        return disposeRoot;
      });
    });

    it('startDownload는 상태를 함수 호출로 변경해야 한다', async () => {
      const { createDownloadTask, startDownload, downloadState } = await import(
        '@shared/state/signals/download.signals'
      );

      dispose = createRoot(disposeRoot => {
        const result = createDownloadTask({
          id: 'media-start',
          url: 'http://example.com/start.jpg',
          filename: 'start.jpg',
          type: 'image',
        } as MediaInfo);

        expect(result.success).toBe(true);
        if (result.success) {
          const taskId = result.data;
          startDownload(taskId);

          const task = downloadState().activeTasks.get(taskId);
          expect(task?.status).toBe('downloading');
        }

        return disposeRoot;
      });
    });

    it('외부 구독은 createEffect 패턴을 사용해야 한다', async () => {
      const { downloadState, setDownloadState } = await import(
        '@shared/state/signals/download.signals'
      );

      const changes: number[] = [];

      dispose = createRoot(disposeRoot => {
        // createEffect는 초기 상태도 수집하므로 먼저 실행
        createEffect(() => {
          const state = downloadState();
          changes.push(state.globalProgress);
        });

        // 비동기 업데이트로 effect 트리거 보장
        setTimeout(() => {
          setDownloadState({
            activeTasks: new Map(),
            queue: [],
            isProcessing: false,
            globalProgress: 25,
          });

          setTimeout(() => {
            setDownloadState(prev => ({
              ...prev,
              globalProgress: 75,
            }));
          }, 0);
        }, 0);

        return disposeRoot;
      });

      // 비동기 완료 대기
      await new Promise(resolve => setTimeout(resolve, 10));
      expect(changes.length).toBeGreaterThan(0);
    });
  });

  // ==========================================================================
  // Phase G-3-2-5: 타입 안전성 (Type Safety)
  // ==========================================================================
  describe('Phase G-3-2-5: 타입 안전성', () => {
    it('downloadState는 Accessor<DownloadState> 타입 특성을 가져야 한다', async () => {
      const { downloadState } = await import('@shared/state/signals/download.signals');

      // Accessor는 함수 호출로 값을 반환
      const state = downloadState();
      expect(state).toBeDefined();
      expect(typeof state).toBe('object');

      // Accessor는 인자를 받지 않음
      expect(downloadState.length).toBe(0);
    });

    it('setDownloadState는 Setter<DownloadState> 타입 특성을 가져야 한다', async () => {
      const { setDownloadState } = await import('@shared/state/signals/download.signals');

      // Setter는 함수 (값 또는 업데이터 함수를 받음)
      expect(typeof setDownloadState).toBe('function');
      expect(setDownloadState.length).toBe(1);
    });

    it('파생 상태 함수들은 올바른 반환 타입을 가져야 한다', async () => {
      const { getDownloadInfo, getDownloadTask, setDownloadState } = await import(
        '@shared/state/signals/download.signals'
      );

      dispose = createRoot(disposeRoot => {
        setDownloadState({
          activeTasks: new Map(),
          queue: [],
          isProcessing: false,
          globalProgress: 0,
        });

        const info = getDownloadInfo();
        expect(typeof info.isAnyDownloading).toBe('boolean');
        expect(typeof info.totalTasks).toBe('number');
        expect(typeof info.globalProgress).toBe('number');

        const task = getDownloadTask('non-existent');
        expect(task).toBeNull();

        return disposeRoot;
      });
    });
  });
});
