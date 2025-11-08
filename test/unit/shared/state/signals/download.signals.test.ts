/**
 * @fileoverview download.signals.ts Enhanced Result 패턴 테스트
 * @description Phase 355.3 Week 1 - Enhanced Result 마이그레이션 검증
 *
 * 격리 전략: 고유 ID 기반 테스트 독립성 (cleanup 불필요)
 */

import { describe, it, expect } from 'vitest';
import { setupGlobalTestIsolation } from '../../../../shared/global-cleanup-hooks';
import { isSuccess, isFailure, ErrorCode } from '../../../../../src/shared/types/result.types';
import type { MediaInfo } from '../../../../../src/shared/types/media.types';
import {
  createDownloadTask,
  startDownload,
  updateDownloadProgress,
  completeDownload,
  failDownload,
  removeTask,
  getDownloadTask,
} from '../../../../../src/shared/state/signals/download.signals';

describe('download.signals - Enhanced Result Pattern (Phase 355.3)', () => {
  setupGlobalTestIsolation();

  /** 고유 ID로 테스트 격리, cleanup 불필요 */
  const createTestMedia = (suffix = ''): MediaInfo => ({
    id: `media-${Date.now()}-${Math.random()}-${suffix}`,
    type: 'image',
    url: 'https://test.com/image.jpg',
    originalUrl: 'https://test.com/image.jpg:orig',
    width: 1920,
    height: 1080,
  });

  describe('createDownloadTask - ErrorCode.UNKNOWN', () => {
    it('성공 시 Result.status = success, meta에 mediaId/filename', () => {
      const media = createTestMedia('create-success');
      const result = createDownloadTask(media, 'test.jpg');

      expect(isSuccess(result)).toBe(true);
      expect(result.status).toBe('success');
      expect(result.code).toBe(ErrorCode.NONE);
      if (isSuccess(result)) {
        expect(typeof result.data).toBe('string');
        expect(result.meta?.mediaId).toBe(media.id);
        expect(result.meta?.filename).toBe('test.jpg');
      }
    });
  });

  describe('startDownload - ErrorCode.ELEMENT_NOT_FOUND, INVALID_ELEMENT', () => {
    it('존재하지 않는 task: ErrorCode.ELEMENT_NOT_FOUND', () => {
      const uniqueId = `non-existent-${Date.now()}`;
      const result = startDownload(uniqueId);

      expect(isFailure(result)).toBe(true);
      if (isFailure(result)) {
        expect(result.code).toBe(ErrorCode.ELEMENT_NOT_FOUND);
        expect(result.meta?.taskId).toBe(uniqueId);
      }
    });

    it('pending 아닌 task: ErrorCode.INVALID_ELEMENT', () => {
      const media = createTestMedia('start-invalid');
      const createResult = createDownloadTask(media, 'test.jpg');

      if (isSuccess(createResult)) {
        const taskId = String(createResult.data);
        expect(isSuccess(startDownload(taskId))).toBe(true);

        const start2 = startDownload(taskId);
        expect(isFailure(start2)).toBe(true);
        if (isFailure(start2)) {
          expect(start2.code).toBe(ErrorCode.INVALID_ELEMENT);
        }
      }
    });
  });

  describe('updateDownloadProgress - meta 필드', () => {
    it('성공 시 meta에 taskId, progress, globalProgress', () => {
      const media = createTestMedia('progress-success');
      const createResult = createDownloadTask(media, 'test.jpg');

      if (isSuccess(createResult)) {
        const taskId = String(createResult.data);
        startDownload(taskId);
        const result = updateDownloadProgress(taskId, 50);

        expect(isSuccess(result)).toBe(true);
        if (isSuccess(result)) {
          expect(result.meta?.taskId).toBe(taskId);
          expect(result.meta?.progress).toBe(50);
        }
      }
    });

    it('존재하지 않는 task: ErrorCode.ELEMENT_NOT_FOUND', () => {
      const uniqueId = `invalid-${Date.now()}`;
      const result = updateDownloadProgress(uniqueId, 100);

      expect(isFailure(result)).toBe(true);
      if (isFailure(result)) {
        expect(result.code).toBe(ErrorCode.ELEMENT_NOT_FOUND);
        expect(result.meta?.requestedProgress).toBe(100);
      }
    });
  });

  describe('completeDownload - meta에 duration, completedAt', () => {
    it('성공 시 meta에 타이밍 정보 포함', () => {
      const media = createTestMedia('complete-success');
      const createResult = createDownloadTask(media, 'test.jpg');

      if (isSuccess(createResult)) {
        const taskId = String(createResult.data);
        startDownload(taskId);
        const result = completeDownload(taskId);

        expect(isSuccess(result)).toBe(true);
        if (isSuccess(result)) {
          expect(result.meta?.completedAt).toBeGreaterThan(0);
          expect(result.meta?.duration).toBeGreaterThanOrEqual(0);
        }
      }
    });
  });

  describe('failDownload - meta.downloadError', () => {
    it('함수 성공이지만 meta.downloadError에 실패 정보', () => {
      const media = createTestMedia('fail-success');
      const createResult = createDownloadTask(media, 'test.jpg');

      if (isSuccess(createResult)) {
        const taskId = String(createResult.data);
        startDownload(taskId);
        const result = failDownload(taskId, 'Network error');

        expect(isSuccess(result)).toBe(true);
        if (isSuccess(result)) {
          expect(result.meta?.downloadError).toBe('Network error');
          expect(result.meta?.completedAt).toBeGreaterThan(0);
        }
      }
    });

    it('존재하지 않는 task: ErrorCode.ELEMENT_NOT_FOUND', () => {
      const uniqueId = `invalid-${Date.now()}`;
      const result = failDownload(uniqueId, 'error');

      expect(isFailure(result)).toBe(true);
      if (isFailure(result)) {
        expect(result.code).toBe(ErrorCode.ELEMENT_NOT_FOUND);
        expect(result.meta?.attemptedError).toBe('error');
      }
    });
  });

  describe('removeTask - ErrorCode.PERMISSION_DENIED', () => {
    it('downloading 중 제거: ErrorCode.PERMISSION_DENIED', () => {
      const media = createTestMedia('remove-permission');
      const createResult = createDownloadTask(media, 'test.jpg');

      if (isSuccess(createResult)) {
        const taskId = String(createResult.data);
        startDownload(taskId);
        const result = removeTask(taskId);

        expect(isFailure(result)).toBe(true);
        if (isFailure(result)) {
          expect(result.code).toBe(ErrorCode.PERMISSION_DENIED);
          expect(result.meta?.currentStatus).toBe('downloading');
        }
      }
    });

    it('completed task는 제거 가능', () => {
      const media = createTestMedia('remove-completed');
      const createResult = createDownloadTask(media, 'test.jpg');

      if (isSuccess(createResult)) {
        const taskId = String(createResult.data);
        startDownload(taskId);
        completeDownload(taskId);
        const result = removeTask(taskId);

        expect(isSuccess(result)).toBe(true);
        expect(getDownloadTask(taskId)).toBeNull();
      }
    });
  });

  describe('통합 시나리오', () => {
    it('완전한 lifecycle: create → start → progress → complete → remove', () => {
      const media = createTestMedia('lifecycle-complete');
      const createResult = createDownloadTask(media, 'complete.jpg');

      if (isSuccess(createResult)) {
        const taskId = String(createResult.data);
        expect(isSuccess(startDownload(taskId))).toBe(true);

        updateDownloadProgress(taskId, 50);
        expect(isSuccess(updateDownloadProgress(taskId, 100))).toBe(true);

        const completeResult = completeDownload(taskId);
        expect(isSuccess(completeResult)).toBe(true);
        if (isSuccess(completeResult)) {
          expect(completeResult.meta?.duration).toBeGreaterThanOrEqual(0);
        }

        expect(isSuccess(removeTask(taskId))).toBe(true);
        expect(getDownloadTask(taskId)).toBeNull();
      }
    });

    it('실패 lifecycle: create → start → fail → remove', () => {
      const media = createTestMedia('lifecycle-fail');
      const createResult = createDownloadTask(media, 'failed.jpg');

      if (isSuccess(createResult)) {
        const taskId = String(createResult.data);
        startDownload(taskId);

        const failResult = failDownload(taskId, 'Network timeout');
        expect(isSuccess(failResult)).toBe(true);
        if (isSuccess(failResult)) {
          expect(failResult.meta?.downloadError).toBe('Network timeout');
        }

        expect(isSuccess(removeTask(taskId))).toBe(true);
        expect(getDownloadTask(taskId)).toBeNull();
      }
    });

    it('여러 task 동시 관리', () => {
      const media1 = createTestMedia('multi-1');
      const media2 = createTestMedia('multi-2');

      const task1 = createDownloadTask(media1, 'file1.jpg');
      const task2 = createDownloadTask(media2, 'file2.jpg');

      if (isSuccess(task1) && isSuccess(task2)) {
        const taskId1 = String(task1.data);
        const taskId2 = String(task2.data);

        startDownload(taskId1);
        startDownload(taskId2);

        updateDownloadProgress(taskId1, 50);
        updateDownloadProgress(taskId2, 75);

        expect(getDownloadTask(taskId1)).toBeDefined();
        expect(getDownloadTask(taskId2)).toBeDefined();

        completeDownload(taskId1);
        completeDownload(taskId2);
        removeTask(taskId1);
        removeTask(taskId2);
      }
    });
  });
});
