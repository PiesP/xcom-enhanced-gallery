/**
 * @fileoverview CSS Animation utilities test suite (AnimationService legacy replacement)
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { setupGlobalTestIsolation } from '../../../shared/global-cleanup-hooks';
import {
  injectAnimationStyles,
  animateGalleryEnter,
  animateGalleryExit,
  animateImageItemsEnter,
  animateCustom,
  cleanupAnimations,
  toolbarSlideDown,
  toolbarSlideUp,
  ANIMATION_CLASSES,
  ANIMATION_CONSTANTS,
} from '@shared/utils/animations';
import { globalTimerManager } from '@shared/utils/timer-management';

describe('CSS Animation utilities', () => {
  setupGlobalTestIsolation();

  beforeEach(() => {
    document.head.innerHTML = '';
    document.body.innerHTML = '';
    globalTimerManager.cleanup();
  });

  afterEach(() => {
    vi.useRealTimers();
    globalTimerManager.cleanup();
  });

  it('injectAnimationStyles injects the gallery animation stylesheet once', () => {
    injectAnimationStyles();
    injectAnimationStyles();

    const styles = document.querySelectorAll('style#xcom-gallery-animations');
    expect(styles).toHaveLength(1);
    const css = styles[0]?.textContent || '';
    expect(css).toContain('@keyframes fade-in');
    expect(css).toMatch(/var\(--xeg-duration-normal\)/);
  });

  it('animateGalleryEnter resolves after animationend and cleans up classes', async () => {
    const element = document.createElement('div');
    document.body.appendChild(element);

    const promise = animateGalleryEnter(element);
    expect(element.classList.contains(ANIMATION_CLASSES.FADE_IN)).toBe(true);

    element.dispatchEvent(new Event('animationend'));
    await promise;

    expect(element.classList.contains(ANIMATION_CLASSES.FADE_IN)).toBe(false);
  });

  it('animateGalleryExit resolves after animationend and cleans up classes', async () => {
    const element = document.createElement('div');
    document.body.appendChild(element);

    const promise = animateGalleryExit(element);
    expect(element.classList.contains(ANIMATION_CLASSES.FADE_OUT)).toBe(true);

    element.dispatchEvent(new Event('animationend'));
    await promise;

    expect(element.classList.contains(ANIMATION_CLASSES.FADE_OUT)).toBe(false);
  });

  it('animateImageItemsEnter animates multiple elements with staggered delays', async () => {
    const elements = [document.createElement('div'), document.createElement('div')];
    elements.forEach(el => document.body.appendChild(el));

    vi.useFakeTimers();
    const promise = animateImageItemsEnter(elements);

    await vi.advanceTimersByTimeAsync(ANIMATION_CONSTANTS.STAGGER_DELAY * elements.length + 10);
    elements.forEach(el => el.dispatchEvent(new Event('animationend')));
    await promise;

    elements.forEach(el => {
      expect(el.classList.contains(ANIMATION_CLASSES.SLIDE_IN_BOTTOM)).toBe(false);
    });
  });

  it('cleanupAnimations removes all animation classes from an element', () => {
    const element = document.createElement('div');
    document.body.appendChild(element);

    Object.values(ANIMATION_CLASSES).forEach(className => {
      element.classList.add(className);
    });

    cleanupAnimations(element);

    const classNames = Object.values(ANIMATION_CLASSES) as string[];
    classNames.forEach(className => {
      expect(element.classList.contains(className)).toBe(false);
    });
  });

  it('animateCustom applies token-based transitions and resolves after duration', async () => {
    const element = document.createElement('div');
    document.body.appendChild(element);

    vi.useFakeTimers();
    const promise = animateCustom(
      element,
      { opacity: '1', transform: 'scale(1)' },
      { durationToken: 'fast', delay: 20 }
    );

    await vi.advanceTimersByTimeAsync(ANIMATION_CONSTANTS.DURATION_FAST + 20);
    await promise;

    expect(element.style.transition).toContain('var(--xeg-duration-fast)');
    expect(element.style.transition).toContain('var(--xeg-ease-standard)');
  });

  it('toolbarSlideDown and toolbarSlideUp drive translate animations via animateCustom', async () => {
    const element = document.createElement('div');
    document.body.appendChild(element);

    vi.useFakeTimers();
    const slideDown = toolbarSlideDown(element);
    await vi.advanceTimersByTimeAsync(ANIMATION_CONSTANTS.DURATION_FAST);
    await slideDown;
    expect(element.style.transform).toBe('translateY(0)');

    const slideUp = toolbarSlideUp(element);
    await vi.advanceTimersByTimeAsync(ANIMATION_CONSTANTS.DURATION_FAST);
    await slideUp;
    expect(element.style.transform).toBe('translateY(-100%)');
  });
});
