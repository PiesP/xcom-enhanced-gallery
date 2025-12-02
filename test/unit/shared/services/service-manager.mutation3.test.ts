import { CoreService } from '@shared/services/service-manager';
import { describe, it, beforeEach, afterEach, expect, vi } from 'vitest';

vi.mock('@shared/logging', () => ({ logger: { debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn() } }));

describe('CoreService additional mutation tests', () => {
  beforeEach(() => {
    CoreService.resetInstance();
    vi.clearAllMocks();
  });

  afterEach(() => {
    CoreService.resetInstance();
  });

  it('should not treat number primitives as disposable', () => {
    const core = CoreService.getInstance();
    core.register('num', 123 as unknown as object);
    expect(core.has('num')).toBe(true);
    core.cleanup();
    expect(core.has('num')).toBe(false);
  });

  it('should not treat boolean primitives as disposable', () => {
    const core = CoreService.getInstance();
    core.register('bool', true as unknown as object);
    expect(core.has('bool')).toBe(true);
    core.cleanup();
    expect(core.has('bool')).toBe(false);
  });

  it('should call destroy for function-type destroy property on prototype', () => {
    const core = CoreService.getInstance();
    const protoDestroy = vi.fn();
    const proto = { destroy: protoDestroy };
    const obj = Object.create(proto);
    core.register('proto', obj as any);
    core.cleanup();
    expect(protoDestroy).toHaveBeenCalled();
    expect(core.has('proto')).toBe(false);
  });
});
