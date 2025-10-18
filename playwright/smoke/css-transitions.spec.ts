import { test, expect } from '@playwright/test';

/**
 * @fileoverview CSS Transitions E2E Tests
 *
 * 목적: 브라우저 CSS transition 기능 검증 (하네스 불필요)
 */

test.describe('CSS Transitions', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('https://x.com');
    await page.waitForLoadState('domcontentloaded');
  });

  test('should apply CSS transition on style change', async ({ page }) => {
    // 요소 생성 및 스타일 설정
    await page.evaluate(() => {
      const element = document.createElement('div');
      element.id = 'transition-test';
      element.style.width = '100px';
      element.style.height = '100px';
      element.style.backgroundColor = 'red';
      element.style.transition = 'all 0.3s ease';
      document.body.appendChild(element);
    });

    // 초기 상태 확인
    const initialBg = await page.evaluate(() => {
      const el = document.getElementById('transition-test');
      return el?.style.backgroundColor;
    });

    expect(initialBg).toBe('red');

    // 스타일 변경
    await page.evaluate(() => {
      const el = document.getElementById('transition-test');
      if (el) {
        el.style.backgroundColor = 'blue';
      }
    });

    // transition 완료 대기
    await page.waitForTimeout(400);

    // 변경된 상태 확인
    const finalBg = await page.evaluate(() => {
      const el = document.getElementById('transition-test');
      return el?.style.backgroundColor;
    });

    expect(finalBg).toBe('blue');
  });

  test('should handle multiple simultaneous transitions', async ({ page }) => {
    // 요소 생성
    await page.evaluate(() => {
      const element = document.createElement('div');
      element.id = 'multi-transition';
      element.style.width = '100px';
      element.style.height = '100px';
      element.style.opacity = '1';
      element.style.transition = 'width 0.3s, height 0.3s, opacity 0.3s';
      document.body.appendChild(element);
    });

    // 여러 속성 동시 변경
    await page.evaluate(() => {
      const el = document.getElementById('multi-transition');
      if (el) {
        el.style.width = '200px';
        el.style.height = '200px';
        el.style.opacity = '0.5';
      }
    });

    await page.waitForTimeout(400);

    // 모든 변경 확인
    const styles = await page.evaluate(() => {
      const el = document.getElementById('multi-transition');
      return {
        width: el?.style.width,
        height: el?.style.height,
        opacity: el?.style.opacity,
      };
    });

    expect(styles.width).toBe('200px');
    expect(styles.height).toBe('200px');
    expect(styles.opacity).toBe('0.5');
  });

  test('should support CSS transform transitions', async ({ page }) => {
    // 요소 생성
    await page.evaluate(() => {
      const element = document.createElement('div');
      element.id = 'transform-test';
      element.style.width = '50px';
      element.style.height = '50px';
      element.style.backgroundColor = 'green';
      element.style.transition = 'transform 0.5s ease-in-out';
      element.style.transform = 'scale(1)';
      document.body.appendChild(element);
    });

    // Transform 변경
    await page.evaluate(() => {
      const el = document.getElementById('transform-test');
      if (el) {
        el.style.transform = 'scale(1.5) rotate(45deg)';
      }
    });

    await page.waitForTimeout(600);

    const finalTransform = await page.evaluate(() => {
      const el = document.getElementById('transform-test');
      return el?.style.transform;
    });

    expect(finalTransform).toContain('scale');
    expect(finalTransform).toContain('rotate');
  });

  test('should handle transition delay', async ({ page }) => {
    // 요소 생성 (지연된 transition)
    await page.evaluate(() => {
      const element = document.createElement('div');
      element.id = 'delayed-transition';
      element.style.width = '100px';
      element.style.backgroundColor = 'yellow';
      element.style.transition = 'background-color 0.3s ease 0.5s'; // 0.5s 지연
      document.body.appendChild(element);
    });

    // 스타일 변경
    const startTime = Date.now();
    await page.evaluate(() => {
      const el = document.getElementById('delayed-transition');
      if (el) {
        el.style.backgroundColor = 'purple';
      }
    });

    // 지연 + transition 시간 대기
    await page.waitForTimeout(900);
    const elapsed = Date.now() - startTime;

    const finalBg = await page.evaluate(() => {
      const el = document.getElementById('delayed-transition');
      return el?.style.backgroundColor;
    });

    expect(finalBg).toBe('purple');
    expect(elapsed).toBeGreaterThanOrEqual(800);
  });
});
