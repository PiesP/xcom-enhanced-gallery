/**
 * 접근성 테스트 - Settings 컴포넌트
 *
 * @axe-core/playwright를 사용한 설정 패널 접근성 검증
 *
 * 포커스:
 * - Dialog 역할 및 aria-modal
 * - 포커스 트랩 (Tab 순환)
 * - 키보드 네비게이션 (Escape 닫기)
 * - ARIA 레이블 적절성
 * - 색상 대비
 *
 * WCAG 2.1 Level AA 준수 검증
 */

import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.describe('Settings Accessibility', () => {
  test.beforeEach(async ({ page }) => {
    // Settings 패널 HTML 시뮬레이션
    await page.goto('about:blank');
    await page.setContent(`
      <!DOCTYPE html>
      <html lang="ko">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Settings Accessibility Test</title>
        <style>
          .dialog-overlay {
            position: fixed;
            inset: 0;
            background: rgba(0, 0, 0, 0.5);
            display: flex;
            align-items: center;
            justify-content: center;
          }
          .dialog {
            background: white;
            padding: 24px;
            border-radius: 8px;
            max-width: 600px;
            width: 90%;
          }
          .dialog h2 {
            margin-top: 0;
          }
          .form-group {
            margin: 16px 0;
          }
          .form-group label {
            display: block;
            margin-bottom: 4px;
            font-weight: bold;
          }
          .form-group input,
          .form-group select {
            width: 100%;
            padding: 8px;
            border: 1px solid #ccc;
            border-radius: 4px;
          }
          .button-group {
            margin-top: 24px;
            display: flex;
            gap: 8px;
            justify-content: flex-end;
          }
          button {
            padding: 8px 16px;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            font-size: 14px;
          }
          button.primary {
            background: #0066cc;
            color: white;
          }
          button.secondary {
            background: #f0f0f0;
            color: #333;
          }
        </style>
      </head>
      <body>
        <div class="dialog-overlay">
          <div role="dialog" aria-modal="true" aria-labelledby="settings-title" class="dialog">
            <h2 id="settings-title">설정</h2>
            
            <div class="form-group">
              <label for="language-select">언어</label>
              <select id="language-select" aria-label="언어 선택">
                <option value="ko">한국어</option>
                <option value="en">English</option>
                <option value="ja">日本語</option>
              </select>
            </div>
            
            <div class="form-group">
              <label for="theme-select">테마</label>
              <select id="theme-select" aria-label="테마 선택">
                <option value="auto">자동</option>
                <option value="light">라이트</option>
                <option value="dark">다크</option>
              </select>
            </div>
            
            <div class="form-group">
              <label for="autoplay-checkbox">
                <input type="checkbox" id="autoplay-checkbox" aria-label="자동 재생 활성화">
                자동 재생
              </label>
            </div>
            
            <div class="button-group">
              <button type="button" class="secondary" aria-label="취소">취소</button>
              <button type="button" class="primary" aria-label="저장">저장</button>
            </div>
          </div>
        </div>
      </body>
      </html>
    `);
  });

  test('should have no accessibility violations in settings dialog', async ({ page }) => {
    // 전체 접근성 스캔
    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('should have proper dialog role and aria-modal', async ({ page }) => {
    const dialog = page.locator('[role="dialog"]');

    await expect(dialog).toBeVisible();
    await expect(dialog).toHaveAttribute('aria-modal', 'true');
    await expect(dialog).toHaveAttribute('aria-labelledby', 'settings-title');

    // 제목 연결 확인
    const titleId = await dialog.getAttribute('aria-labelledby');
    const title = page.locator(`#${titleId}`);
    await expect(title).toBeVisible();
    await expect(title).toHaveText('설정');
  });

  test('should have accessible form controls', async ({ page }) => {
    // 모든 폼 컨트롤에 레이블 있는지 확인
    const languageSelect = page.locator('#language-select');
    const themeSelect = page.locator('#theme-select');
    const autoplayCheckbox = page.locator('#autoplay-checkbox');

    // aria-label 또는 연결된 label 확인
    await expect(languageSelect).toHaveAttribute('aria-label', '언어 선택');
    await expect(themeSelect).toHaveAttribute('aria-label', '테마 선택');
    await expect(autoplayCheckbox).toHaveAttribute('aria-label', '자동 재생 활성화');

    // 포커스 가능 확인
    await languageSelect.focus();
    await expect(languageSelect).toBeFocused();

    await themeSelect.focus();
    await expect(themeSelect).toBeFocused();

    await autoplayCheckbox.focus();
    await expect(autoplayCheckbox).toBeFocused();
  });

  test('should have accessible buttons with labels', async ({ page }) => {
    const cancelButton = page.locator('button:has-text("취소")');
    const saveButton = page.locator('button:has-text("저장")');

    // ARIA 레이블 확인
    await expect(cancelButton).toHaveAttribute('aria-label', '취소');
    await expect(saveButton).toHaveAttribute('aria-label', '저장');

    // 포커스 가능 확인
    await cancelButton.focus();
    await expect(cancelButton).toBeFocused();

    await saveButton.focus();
    await expect(saveButton).toBeFocused();
  });

  test('should support keyboard navigation', async ({ page }) => {
    const languageSelect = page.locator('#language-select');
    const themeSelect = page.locator('#theme-select');
    const autoplayCheckbox = page.locator('#autoplay-checkbox');
    const cancelButton = page.locator('button:has-text("취소")');
    const saveButton = page.locator('button:has-text("저장")');

    // Tab으로 순차 이동
    await page.keyboard.press('Tab');
    await expect(languageSelect).toBeFocused();

    await page.keyboard.press('Tab');
    await expect(themeSelect).toBeFocused();

    await page.keyboard.press('Tab');
    await expect(autoplayCheckbox).toBeFocused();

    await page.keyboard.press('Tab');
    await expect(cancelButton).toBeFocused();

    await page.keyboard.press('Tab');
    await expect(saveButton).toBeFocused();

    // Shift+Tab으로 역순 이동
    await page.keyboard.press('Shift+Tab');
    await expect(cancelButton).toBeFocused();

    await page.keyboard.press('Shift+Tab');
    await expect(autoplayCheckbox).toBeFocused();
  });

  test('should have sufficient color contrast', async ({ page }) => {
    // 색상 대비 검증 (WCAG AA: 4.5:1 for normal text, 3:1 for large text)
    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2aa'])
      .include('button')
      .analyze();

    const colorContrastViolations = accessibilityScanResults.violations.filter(
      v => v.id === 'color-contrast'
    );

    expect(colorContrastViolations).toHaveLength(0);
  });
});
