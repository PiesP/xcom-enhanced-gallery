/**
 * @fileoverview 키보드 debounce 유틸리티 테스트
 * 비디오 제어 키 반복 입력 시 debounce 검증
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { setupGlobalTestIsolation } from '../../../shared/global-cleanup-hooks';
import {
  shouldExecuteVideoControlKey,
  shouldExecutePlayPauseKey,
  resetKeyboardDebounceState,
} from '@/shared/utils/keyboard-debounce';

describe('Keyboard Debounce', () => {
  setupGlobalTestIsolation();

  beforeEach(() => {
    resetKeyboardDebounceState();
    vi.useFakeTimers();
  });

  describe('Video Control Key Debounce (100ms)', () => {
    it('should allow first ArrowUp execution', () => {
      expect(shouldExecuteVideoControlKey('ArrowUp')).toBe(true);
    });

    it('should block consecutive ArrowUp within 100ms', () => {
      shouldExecuteVideoControlKey('ArrowUp');
      expect(shouldExecuteVideoControlKey('ArrowUp')).toBe(false);
    });

    it('should allow ArrowUp after 100ms', () => {
      shouldExecuteVideoControlKey('ArrowUp');
      vi.advanceTimersByTime(100);
      expect(shouldExecuteVideoControlKey('ArrowUp')).toBe(true);
    });

    it('should block consecutive ArrowDown within 100ms', () => {
      shouldExecuteVideoControlKey('ArrowDown');
      expect(shouldExecuteVideoControlKey('ArrowDown')).toBe(false);
    });

    it('should allow ArrowDown after 100ms', () => {
      shouldExecuteVideoControlKey('ArrowDown');
      vi.advanceTimersByTime(100);
      expect(shouldExecuteVideoControlKey('ArrowDown')).toBe(true);
    });

    it('should block consecutive M key within 100ms', () => {
      shouldExecuteVideoControlKey('M');
      expect(shouldExecuteVideoControlKey('M')).toBe(false);
    });

    it('should allow M key after 100ms', () => {
      shouldExecuteVideoControlKey('M');
      vi.advanceTimersByTime(100);
      expect(shouldExecuteVideoControlKey('M')).toBe(true);
    });

    it('should allow different video control keys immediately', () => {
      shouldExecuteVideoControlKey('ArrowUp');
      // 다른 키는 debounce 상태 영향 받지 않음 (lastKey 체크로 같은 키만 제한)
      expect(shouldExecuteVideoControlKey('ArrowDown')).toBe(true); // 다른 키이므로 즉시 실행 허용
    });
  });

  describe('Play/Pause Key Debounce (150ms)', () => {
    it('should allow first Space execution', () => {
      expect(shouldExecutePlayPauseKey(' ')).toBe(true);
    });

    it('should block consecutive Space within 150ms', () => {
      shouldExecutePlayPauseKey(' ');
      expect(shouldExecutePlayPauseKey(' ')).toBe(false);
    });

    it('should allow Space after 150ms', () => {
      shouldExecutePlayPauseKey(' ');
      vi.advanceTimersByTime(150);
      expect(shouldExecutePlayPauseKey(' ')).toBe(true);
    });

    it('should allow non-debounce keys immediately', () => {
      expect(shouldExecutePlayPauseKey('Enter')).toBe(true);
      expect(shouldExecutePlayPauseKey('Enter')).toBe(true);
    });
  });

  describe('Debounce State Reset', () => {
    it('should reset debounce state', () => {
      shouldExecuteVideoControlKey('ArrowUp');
      expect(shouldExecuteVideoControlKey('ArrowUp')).toBe(false);

      resetKeyboardDebounceState();
      expect(shouldExecuteVideoControlKey('ArrowUp')).toBe(true);
    });

    it('should allow any key after reset', () => {
      shouldExecutePlayPauseKey(' ');
      expect(shouldExecutePlayPauseKey(' ')).toBe(false);

      resetKeyboardDebounceState();
      expect(shouldExecutePlayPauseKey(' ')).toBe(true);
    });
  });

  describe('Rapid Fire Simulation', () => {
    it('should handle 5 rapid ArrowUp presses with 50ms intervals', () => {
      const executions: boolean[] = [];

      for (let i = 0; i < 5; i++) {
        executions.push(shouldExecuteVideoControlKey('ArrowUp'));
        if (i < 4) vi.advanceTimersByTime(50); // 50ms 간격: 50, 100, 150, 200
      }

      // [1st: true] [2nd @50ms: false] [3rd @100ms: true] [4th @150ms: false] [5th @200ms: true]
      expect(executions).toEqual([true, false, true, false, true]);
    });

    it('should allow executions every 100ms', () => {
      const executions: boolean[] = [];

      for (let i = 0; i < 5; i++) {
        executions.push(shouldExecuteVideoControlKey('ArrowUp'));
        if (i < 4) vi.advanceTimersByTime(100); // 정확히 debounce 간격
      }

      expect(executions).toEqual([true, true, true, true, true]);
    });

    it('should allow executions every 150ms for Space', () => {
      const executions: boolean[] = [];

      for (let i = 0; i < 5; i++) {
        executions.push(shouldExecutePlayPauseKey(' '));
        if (i < 4) vi.advanceTimersByTime(150);
      }

      expect(executions).toEqual([true, true, true, true, true]);
    });
  });
});
