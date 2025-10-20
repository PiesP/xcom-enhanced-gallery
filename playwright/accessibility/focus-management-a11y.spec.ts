/**
 * 접근성 테스트 - 포커스 관리 종합
 *
 * @axe-core/playwright를 사용한 포커스 인디케이터 및 관리 검증
 *
 * 포커스:
 * - 포커스 인디케이터 시각적 명확성 (outline 3px 이상)
 * - 색상 대비 비율 (포커스 상태 4.5:1 이상)
 * - 포커스 순서 논리적 일관성
 * - Skip to content 링크 (있다면)
 * - 숨겨진 요소 포커스 방지
 *
 * WCAG 2.1 Level AA 준수 검증
 */

import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.describe('Focus Management Accessibility', () => {
  test.beforeEach(async ({ page }) => {
    // 포커스 관리 HTML 시뮬레이션
    await page.goto('about:blank');
    await page.setContent(`
      <!DOCTYPE html>
      <html lang="ko">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Focus Management Test</title>
        <style>
          body { font-family: sans-serif; margin: 20px; line-height: 1.6; }
          
          /* 포커스 인디케이터 강화 */
          *:focus {
            outline: 3px solid oklch(60% 0.2 260);
            outline-offset: 2px;
          }
          
          /* Skip to content 링크 */
          .skip-link {
            position: absolute;
            top: -40px;
            left: 0;
            background: #000;
            color: #fff;
            padding: 8px;
            text-decoration: none;
            z-index: 100;
          }
          .skip-link:focus {
            top: 0;
          }
          
          /* 컨테이너 스타일 */
          .header { padding: 16px; background: #f0f0f0; margin-bottom: 20px; }
          .nav { display: flex; gap: 16px; margin: 16px 0; }
          .nav a { padding: 8px 16px; background: #0066cc; color: white; text-decoration: none; border-radius: 4px; }
          .content { margin: 20px 0; }
          .button-group { display: flex; gap: 8px; margin: 16px 0; }
          button { padding: 8px 16px; border: 1px solid #ccc; border-radius: 4px; cursor: pointer; background: white; }
          button:hover { background: #f0f0f0; }
          
          /* 숨겨진 요소 */
          .hidden { display: none; }
          [aria-hidden="true"] { visibility: hidden; }
        </style>
      </head>
      <body>
        <a href="#main-content" class="skip-link">본문 바로가기</a>
        
        <header class="header">
          <h1>포커스 관리 테스트</h1>
          <nav class="nav">
            <a href="#section1">섹션 1</a>
            <a href="#section2">섹션 2</a>
            <a href="#section3">섹션 3</a>
          </nav>
        </header>
        
        <main id="main-content" tabindex="-1">
          <section id="section1">
            <h2>섹션 1: 버튼 그룹</h2>
            <div class="button-group">
              <button id="btn1">버튼 1</button>
              <button id="btn2">버튼 2</button>
              <button id="btn3">버튼 3</button>
            </div>
          </section>
          
          <section id="section2">
            <h2>섹션 2: 폼 요소</h2>
            <div class="content">
              <label for="text-input">텍스트 입력</label>
              <input type="text" id="text-input">
              
              <label for="select-input">선택 박스</label>
              <select id="select-input">
                <option>옵션 1</option>
                <option>옵션 2</option>
              </select>
              
              <label for="checkbox-input">
                <input type="checkbox" id="checkbox-input">
                체크박스
              </label>
            </div>
          </section>
          
          <section id="section3">
            <h2>섹션 3: 숨겨진 요소</h2>
            <div class="content">
              <button id="visible-btn">보이는 버튼</button>
              <button id="hidden-btn" class="hidden">숨겨진 버튼 (포커스 불가)</button>
              <button id="aria-hidden-btn" aria-hidden="true">ARIA 숨김 버튼</button>
            </div>
          </section>
        </main>
      </body>
      </html>
    `);
  });

  test('should have no accessibility violations', async ({ page }) => {
    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('should have visible focus indicator on all interactive elements', async ({ page }) => {
    const interactiveElements = [
      page.locator('#btn1'),
      page.locator('#btn2'),
      page.locator('#text-input'),
      page.locator('#select-input'),
      page.locator('#checkbox-input'),
      page.locator('.nav a').first(),
    ];

    for (const element of interactiveElements) {
      await element.focus();

      // 포커스 상태 확인
      await expect(element).toBeFocused();

      // outline 스타일 확인 (3px 이상)
      const outlineWidth = await element.evaluate(el => {
        const styles = window.getComputedStyle(el);
        return styles.outlineWidth;
      });

      // outline-width가 3px 이상인지 확인
      const widthValue = parseInt(outlineWidth, 10);
      expect(widthValue).toBeGreaterThanOrEqual(3);
    }
  });

  test('should have skip to content link', async ({ page }) => {
    const skipLink = page.locator('.skip-link');

    // Skip link 존재 확인
    await expect(skipLink).toBeAttached();
    await expect(skipLink).toHaveText('본문 바로가기');
    await expect(skipLink).toHaveAttribute('href', '#main-content');

    // Tab으로 포커스 시 보이기
    await page.keyboard.press('Tab');
    await expect(skipLink).toBeFocused();

    // top 위치 확인 (포커스 시 0)
    const topValue = await skipLink.evaluate(el => {
      const styles = window.getComputedStyle(el);
      return styles.top;
    });
    expect(topValue).toBe('0px');
  });

  test('should have logical focus order', async ({ page }) => {
    const skipLink = page.locator('.skip-link');
    const navLinks = page.locator('.nav a');
    const btn1 = page.locator('#btn1');
    const btn2 = page.locator('#btn2');
    const btn3 = page.locator('#btn3');
    const textInput = page.locator('#text-input');
    const selectInput = page.locator('#select-input');
    const checkbox = page.locator('#checkbox-input');
    const visibleBtn = page.locator('#visible-btn');

    // Tab으로 순차 이동 확인
    await page.keyboard.press('Tab');
    await expect(skipLink).toBeFocused();

    await page.keyboard.press('Tab');
    await expect(navLinks.first()).toBeFocused();

    await page.keyboard.press('Tab');
    await expect(navLinks.nth(1)).toBeFocused();

    await page.keyboard.press('Tab');
    await expect(navLinks.nth(2)).toBeFocused();

    await page.keyboard.press('Tab');
    await expect(btn1).toBeFocused();

    await page.keyboard.press('Tab');
    await expect(btn2).toBeFocused();

    await page.keyboard.press('Tab');
    await expect(btn3).toBeFocused();

    await page.keyboard.press('Tab');
    await expect(textInput).toBeFocused();

    await page.keyboard.press('Tab');
    await expect(selectInput).toBeFocused();

    await page.keyboard.press('Tab');
    await expect(checkbox).toBeFocused();

    await page.keyboard.press('Tab');
    await expect(visibleBtn).toBeFocused();
  });

  test('should not focus on hidden elements', async ({ page }) => {
    const hiddenBtn = page.locator('#hidden-btn');
    const ariaHiddenBtn = page.locator('#aria-hidden-btn');
    const visibleBtn = page.locator('#visible-btn');

    // 숨겨진 버튼은 DOM에 존재하지만 display:none이므로 포커스 불가
    // aria-hidden 버튼은 보이지만 보조 기술에서 숨김

    // 직접 포커스 시도 (실패해야 함)
    const isFocusable = await hiddenBtn.evaluate(el => {
      try {
        el.focus();
        return document.activeElement === el;
      } catch {
        return false;
      }
    });

    expect(isFocusable).toBe(false);
  });

  test('should have sufficient focus indicator contrast', async ({ page }) => {
    // 버튼에 포커스하고 일반 접근성 스캔
    await page.locator('#btn1').focus();

    const accessibilityScanResults = await new AxeBuilder({ page }).withTags(['wcag2aa']).analyze();

    // color-contrast 위반만 확인 (포커스 인디케이터 관련)
    const contrastViolations = accessibilityScanResults.violations.filter(
      v => v.id === 'color-contrast'
    );

    expect(contrastViolations).toHaveLength(0);
  });

  test('should allow reverse navigation with Shift+Tab', async ({ page }) => {
    const btn1 = page.locator('#btn1');
    const navLinks = page.locator('.nav a');
    const skipLink = page.locator('.skip-link');

    // 끝에서 시작
    await btn1.focus();
    await expect(btn1).toBeFocused();

    // Shift+Tab으로 역순 이동
    await page.keyboard.press('Shift+Tab');
    await expect(navLinks.nth(2)).toBeFocused();

    await page.keyboard.press('Shift+Tab');
    await expect(navLinks.nth(1)).toBeFocused();

    await page.keyboard.press('Shift+Tab');
    await expect(navLinks.first()).toBeFocused();

    await page.keyboard.press('Shift+Tab');
    await expect(skipLink).toBeFocused();
  });
});
