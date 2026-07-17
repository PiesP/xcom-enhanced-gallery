// SPDX-License-Identifier: MIT
// Copyright (c) 2024-2026 PiesP

import { describe, it, expect, vi } from 'vitest';
import { createSingleton } from '@shared/services/singleton-base';

// ── Test helpers ──────────────────────────────────────────────────────

interface TestService {
  readonly id: number;
  destroy(): void;
}

function createTestService(id: number): TestService {
  return {
    id,
    destroy() {
      /* noop */
    },
  };
}

// ── createSingleton ───────────────────────────────────────────────────

describe('createSingleton', () => {
  it('should return getInstance and resetForTests functions', () => {
    const { getInstance, resetForTests } = createSingleton(() => createTestService(1));

    expect(typeof getInstance).toBe('function');
    expect(typeof resetForTests).toBe('function');
  });

  it('should return the same instance on repeated calls', () => {
    const { getInstance } = createSingleton(() => createTestService(42));

    const a = getInstance();
    const b = getInstance();

    expect(a).toBe(b);
    expect(a.id).toBe(42);
  });

  it('should call factory only once', () => {
    const factory = vi.fn(() => createTestService(99));
    const { getInstance } = createSingleton(factory);

    getInstance();
    getInstance();
    getInstance();

    expect(factory).toHaveBeenCalledTimes(1);
  });

  it('should destroy and reset instance on resetForTests', () => {
    const destroy = vi.fn();
    let callCount = 0;
    const { getInstance, resetForTests } = createSingleton(() => {
      callCount++;
      return { id: 1, destroy };
    });

    getInstance();
    expect(destroy).not.toHaveBeenCalled();
    expect(callCount).toBe(1);

    resetForTests();
    expect(destroy).toHaveBeenCalledTimes(1);

    // After reset, a new instance is created
    const newInstance = getInstance();
    expect(newInstance.id).toBe(1);
    expect(callCount).toBe(2);
  });

  it('should allow resetForTests when no instance exists', () => {
    const { resetForTests } = createSingleton(() => createTestService(1));

    expect(() => resetForTests()).not.toThrow();
  });
});
