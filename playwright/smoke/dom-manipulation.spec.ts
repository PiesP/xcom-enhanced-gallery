import { test, expect } from '@playwright/test';

/**
 * @fileoverview DOM Manipulation E2E Tests
 *
 * 목적: 브라우저 DOM API 기본 동작 검증 (하네스 불필요)
 */

test.describe('DOM Manipulation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('https://x.com');
    await page.waitForLoadState('domcontentloaded');
  });

  test('should create and append elements', async ({ page }) => {
    // 요소 생성 및 추가
    await page.evaluate(() => {
      const container = document.createElement('div');
      container.id = 'test-container';

      const child1 = document.createElement('div');
      child1.className = 'child';
      child1.textContent = 'Child 1';

      const child2 = document.createElement('div');
      child2.className = 'child';
      child2.textContent = 'Child 2';

      container.appendChild(child1);
      container.appendChild(child2);
      document.body.appendChild(container);
    });

    // 요소 확인
    const childCount = await page.evaluate(() => {
      const container = document.getElementById('test-container');
      return container?.querySelectorAll('.child').length;
    });

    expect(childCount).toBe(2);
  });

  test('should remove elements from DOM', async ({ page }) => {
    // 요소 생성
    await page.evaluate(() => {
      const element = document.createElement('div');
      element.id = 'removable';
      element.textContent = 'Remove me';
      document.body.appendChild(element);
    });

    // 요소 존재 확인
    let exists = await page.evaluate(() => {
      return document.getElementById('removable') !== null;
    });
    expect(exists).toBe(true);

    // 요소 제거
    await page.evaluate(() => {
      const element = document.getElementById('removable');
      element?.remove();
    });

    // 제거 확인
    exists = await page.evaluate(() => {
      return document.getElementById('removable') !== null;
    });
    expect(exists).toBe(false);
  });

  test('should modify element attributes', async ({ page }) => {
    // 요소 생성
    await page.evaluate(() => {
      const element = document.createElement('div');
      element.id = 'attr-test';
      document.body.appendChild(element);
    });

    // 속성 추가
    await page.evaluate(() => {
      const element = document.getElementById('attr-test');
      element?.setAttribute('data-test', 'value1');
      element?.setAttribute('aria-label', 'Test Label');
    });

    // 속성 확인
    const attrs = await page.evaluate(() => {
      const element = document.getElementById('attr-test');
      return {
        dataTest: element?.getAttribute('data-test'),
        ariaLabel: element?.getAttribute('aria-label'),
      };
    });

    expect(attrs.dataTest).toBe('value1');
    expect(attrs.ariaLabel).toBe('Test Label');

    // 속성 수정
    await page.evaluate(() => {
      const element = document.getElementById('attr-test');
      element?.setAttribute('data-test', 'value2');
    });

    const updatedValue = await page.evaluate(() => {
      const element = document.getElementById('attr-test');
      return element?.getAttribute('data-test');
    });

    expect(updatedValue).toBe('value2');
  });

  test('should handle element class manipulation', async ({ page }) => {
    // 요소 생성
    await page.evaluate(() => {
      const element = document.createElement('div');
      element.id = 'class-test';
      element.className = 'initial-class';
      document.body.appendChild(element);
    });

    // 클래스 추가
    await page.evaluate(() => {
      const element = document.getElementById('class-test');
      element?.classList.add('added-class');
    });

    let hasClass = await page.evaluate(() => {
      const element = document.getElementById('class-test');
      return element?.classList.contains('added-class');
    });
    expect(hasClass).toBe(true);

    // 클래스 제거
    await page.evaluate(() => {
      const element = document.getElementById('class-test');
      element?.classList.remove('initial-class');
    });

    hasClass = await page.evaluate(() => {
      const element = document.getElementById('class-test');
      return element?.classList.contains('initial-class');
    });
    expect(hasClass).toBe(false);

    // 클래스 토글
    await page.evaluate(() => {
      const element = document.getElementById('class-test');
      element?.classList.toggle('toggled-class');
    });

    hasClass = await page.evaluate(() => {
      const element = document.getElementById('class-test');
      return element?.classList.contains('toggled-class');
    });
    expect(hasClass).toBe(true);
  });

  test('should query elements with various selectors', async ({ page }) => {
    // 복잡한 구조 생성
    await page.evaluate(() => {
      const container = document.createElement('div');
      container.id = 'query-container';

      const div1 = document.createElement('div');
      div1.className = 'item active';
      div1.setAttribute('data-type', 'primary');

      const div2 = document.createElement('div');
      div2.className = 'item';
      div2.setAttribute('data-type', 'secondary');

      const div3 = document.createElement('div');
      div3.className = 'item active';
      div3.setAttribute('data-type', 'primary');

      container.appendChild(div1);
      container.appendChild(div2);
      container.appendChild(div3);
      document.body.appendChild(container);
    });

    // 다양한 쿼리 테스트
    const results = await page.evaluate(() => {
      return {
        allItems: document.querySelectorAll('.item').length,
        activeItems: document.querySelectorAll('.item.active').length,
        primaryItems: document.querySelectorAll('[data-type="primary"]').length,
        secondaryItems: document.querySelectorAll('[data-type="secondary"]').length,
      };
    });

    expect(results.allItems).toBe(3);
    expect(results.activeItems).toBe(2);
    expect(results.primaryItems).toBe(2);
    expect(results.secondaryItems).toBe(1);
  });

  test('should handle event listeners', async ({ page }) => {
    // 요소 생성 및 이벤트 리스너 추가
    const clicked = await page.evaluate(() => {
      return new Promise<boolean>(resolve => {
        const button = document.createElement('button');
        button.id = 'event-test';
        button.textContent = 'Click Me';

        button.addEventListener('click', () => {
          resolve(true);
        });

        document.body.appendChild(button);

        // 프로그래밍 방식으로 클릭
        setTimeout(() => {
          button.click();
        }, 100);
      });
    });

    expect(clicked).toBe(true);
  });

  test('should support custom events', async ({ page }) => {
    // 커스텀 이벤트 테스트
    const eventData = await page.evaluate(() => {
      return new Promise<{ type: string; detail: any }>(resolve => {
        const element = document.createElement('div');
        element.id = 'custom-event-test';

        element.addEventListener('xeg:custom', ((e: CustomEvent) => {
          resolve({
            type: e.type,
            detail: e.detail,
          });
        }) as EventListener);

        document.body.appendChild(element);

        // 커스텀 이벤트 발생
        setTimeout(() => {
          const customEvent = new CustomEvent('xeg:custom', {
            detail: { message: 'test-data' },
          });
          element.dispatchEvent(customEvent);
        }, 100);
      });
    });

    expect(eventData.type).toBe('xeg:custom');
    expect(eventData.detail.message).toBe('test-data');
  });
});
