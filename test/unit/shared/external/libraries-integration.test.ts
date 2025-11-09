/**
 * 외부 라이브러리 통합 테스트 (Solid.js 기반)
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { setupGlobalTestIsolation } from '../../../shared/global-cleanup-hooks';
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
  setupGlobalTestIsolation();

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

describe('CSS Animation Utilities 통합', () => {
  setupGlobalTestIsolation();

  beforeEach(() => {
    document.head.innerHTML = '';
    document.body.innerHTML = '';
  });

  it('animation utilities를 노출한다', async () => {
    const animations = await import('@shared/utils/animations');

    expect(typeof animations.injectAnimationStyles).toBe('function');
    expect(typeof animations.animateGalleryEnter).toBe('function');
    expect(typeof animations.animateGalleryExit).toBe('function');
    expect(typeof animations.cleanupAnimations).toBe('function');
  });

  it('injectAnimationStyles는 스타일을 한 번만 주입한다', async () => {
    const { injectAnimationStyles } = await import('@shared/utils/animations');

    injectAnimationStyles();
    injectAnimationStyles();

    const styles = document.querySelectorAll('style#xcom-gallery-animations');
    expect(styles).toHaveLength(1);
  });

  it('animateGalleryEnter는 애니메이션 클래스 추가 후 종료 이벤트를 처리한다', async () => {
    const { animateGalleryEnter, ANIMATION_CLASSES } = await import('@shared/utils/animations');

    const element = document.createElement('div');
    document.body.appendChild(element);

    const promise = animateGalleryEnter(element);

    expect(element.classList.contains(ANIMATION_CLASSES.FADE_IN)).toBe(true);

    element.dispatchEvent(new Event('animationend'));
    await promise;

    expect(element.classList.contains(ANIMATION_CLASSES.FADE_IN)).toBe(false);
  });

  it('cleanupAnimations는 모든 애니메이션 클래스를 제거한다', async () => {
    const { animateGalleryEnter, cleanupAnimations, ANIMATION_CLASSES } = await import(
      '@shared/utils/animations'
    );

    const element = document.createElement('div');
    document.body.appendChild(element);

    const promise = animateGalleryEnter(element);
    element.dispatchEvent(new Event('animationend'));
    await promise;

    // 강제로 다른 클래스 추가
    element.classList.add(ANIMATION_CLASSES.SLIDE_IN_BOTTOM);

    cleanupAnimations(element);

    const animationClassNames = Object.values(ANIMATION_CLASSES) as string[];

    animationClassNames.forEach(className => {
      expect(element.classList.contains(className)).toBe(false);
    });
  });
});
