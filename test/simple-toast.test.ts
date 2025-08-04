/**
 * @fileoverview Simple ToastService Test
 * @description ToastService import 및 기본 동작 확인
 */

import { describe, it, expect } from 'vitest';

describe('ToastService Import Test', () => {
  it('should import ToastService successfully', async () => {
    // Dynamic import를 사용하여 ToastService를 가져옴
    const { ToastService } = await import('@shared/services');
    expect(ToastService).toBeDefined();

    const service = new ToastService();
    expect(service).toBeDefined();
    expect(typeof service.show).toBe('function');
  });
});
