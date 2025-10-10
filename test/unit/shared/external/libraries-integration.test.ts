/**
 * 외부 라이브러리 통합 테스트 (Solid.js 기반)
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  initializeVendors,
  cleanupVendors,
  resetVendorManagerInstance,
  getSolid,
} from '@shared/external/vendors';

beforeEach(async () => {
  resetVendorManagerInstance();
  await initializeVendors();
});

afterEach(() => {
  cleanupVendors();
  resetVendorManagerInstance();
});

describe('Solid vendor 통합', () => {
  it('Solid primitives를 제공한다', () => {
    const solid = getSolid();
    const [getValue, setValue] = solid.createSignal(0);

    expect(getValue()).toBe(0);
    setValue(42);
    expect(getValue()).toBe(42);

    const memo = solid.createMemo(() => getValue() * 2);
    expect(memo()).toBe(84);
  });
});

describe('AnimationService 통합', () => {
  it('AnimationService 인스턴스를 노출한다', async () => {
    const { AnimationService } = await import('@shared/services/AnimationService');
    const animationService = AnimationService.getInstance();

    expect(typeof animationService.fadeIn).toBe('function');
    expect(typeof animationService.fadeOut).toBe('function');
    expect(typeof animationService.cleanup).toBe('function');
  });

  it('fadeIn이 DOM 요소에서 작동한다', async () => {
    const { AnimationService } = await import('@shared/services/AnimationService');
    const animationService = AnimationService.getInstance();

    const element = document.createElement('div');
    element.style.opacity = '0';

    await expect(animationService.fadeIn(element, { duration: 0 })).resolves.toBeUndefined();
  });

  it('cleanup이 예외 없이 수행된다', async () => {
    const { AnimationService } = await import('@shared/services/AnimationService');
    const animationService = AnimationService.getInstance();

    expect(() => animationService.cleanup()).not.toThrow();
  });
});
