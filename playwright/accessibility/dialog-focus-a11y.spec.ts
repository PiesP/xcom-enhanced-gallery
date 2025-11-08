/**
 * Accessibility tests - Dialog and focus management comprehensive
 *
 * Using @axe-core/playwright for accessibility validation
 *
 * Integration Scope:
 * - Modal dialog accessibility (role, aria-modal, focus trap)
 * - Settings panel accessibility (form controls, keyboard navigation)
 * - General focus management (indicators, order, skip link)
 *
 * WCAG 2.1 Level AA compliance validation
 */

import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.describe('Dialog & Focus Management Accessibility', () => {
  test.describe('Basic Dialog', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('about:blank');
      await page.setContent(`
        <!DOCTYPE html>
        <html lang="ko">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Dialog Accessibility Test</title>
          <style>
            body { font-family: sans-serif; padding: 20px; }
            .modal-overlay {
              position: fixed;
              inset: 0;
              background: rgba(0, 0, 0, 0.6);
              display: none;
              align-items: center;
              justify-content: center;
              z-index: 1000;
            }
            .modal-overlay.active { display: flex; }
            .modal {
              background: white;
              padding: 24px;
              border-radius: 8px;
              max-width: 500px;
              width: 90%;
              box-shadow: 0 4px 16px rgba(0,0,0,0.2);
              position: relative;
            }
            .modal h2 { margin-top: 0; }
            .modal-content { margin: 16px 0; }
            .modal-actions {
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
            button.primary { background: #0066cc; color: white; }
            button.secondary { background: #f0f0f0; color: #333; }
            .close-button {
              position: absolute;
              top: 8px;
              right: 8px;
              background: transparent;
              border: none;
              font-size: 24px;
              cursor: pointer;
              padding: 4px 8px;
            }
          </style>
          <script>
            function openModal() {
              const overlay = document.getElementById('modal-overlay');
              overlay.classList.add('active');

              const firstFocusable = overlay.querySelector('button');
              if (firstFocusable) firstFocusable.focus();

              document.getElementById('main-content').setAttribute('inert', '');
              overlay.addEventListener('keydown', handleEscape);
            }

            function closeModal() {
              const overlay = document.getElementById('modal-overlay');
              overlay.classList.remove('active');

              document.getElementById('main-content').removeAttribute('inert');
              document.getElementById('open-modal-btn').focus();

              overlay.removeEventListener('keydown', handleEscape);
            }

            function handleEscape(e) {
              if (e.key === 'Escape') closeModal();
            }

            document.addEventListener('DOMContentLoaded', () => {
              const overlay = document.getElementById('modal-overlay');
              overlay.addEventListener('keydown', (e) => {
                if (e.key !== 'Tab') return;

                const focusableElements = overlay.querySelectorAll(
                  'button, input, select, textarea, [tabindex]:not([tabindex="-1"])'
                );
                const firstElement = focusableElements[0];
                const lastElement = focusableElements[focusableElements.length - 1];

                if (e.shiftKey) {
                  if (document.activeElement === firstElement) {
                    e.preventDefault();
                    lastElement.focus();
                  }
                } else {
                  if (document.activeElement === lastElement) {
                    e.preventDefault();
                    firstElement.focus();
                  }
                }
              });
            });
          </script>
        </head>
        <body>
          <div id="main-content">
            <h1>Dialog Test</h1>
            <button id="open-modal-btn" onclick="openModal()">모달 열기</button>
          </div>

          <div id="modal-overlay" class="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="modal-title">
            <div class="modal">
              <button class="close-button" onclick="closeModal()" aria-label="닫기">×</button>
              <h2 id="modal-title">확인</h2>
              <div class="modal-content">
                <p>이 작업을 계속하시겠습니까?</p>
                <input type="text" placeholder="이유를 입력하세요" aria-label="작업 이유 입력">
              </div>
              <div class="modal-actions">
                <button class="secondary" onclick="closeModal()">취소</button>
                <button class="primary" onclick="closeModal()">확인</button>
              </div>
            </div>
          </div>
        </body>
        </html>
      `);
    });

    test('should have no accessibility violations when dialog is open', async ({ page }) => {
      await page.click('#open-modal-btn');

      const accessibilityScanResults = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
        .analyze();

      expect(accessibilityScanResults.violations).toEqual([]);
    });

    test('should have proper dialog role and attributes', async ({ page }) => {
      await page.click('#open-modal-btn');

      const modal = page.locator('#modal-overlay');

      await expect(modal).toHaveAttribute('role', 'dialog');
      await expect(modal).toHaveAttribute('aria-modal', 'true');
      await expect(modal).toHaveAttribute('aria-labelledby', 'modal-title');

      const title = page.locator('#modal-title');
      await expect(title).toBeVisible();
      await expect(title).toHaveText('확인');
    });

    test('should have accessible close button', async ({ page }) => {
      await page.click('#open-modal-btn');

      const closeButton = page.locator('.close-button');

      await expect(closeButton).toHaveAttribute('aria-label', '닫기');
      await closeButton.focus();
      await expect(closeButton).toBeFocused();

      await closeButton.click();
      await expect(page.locator('#modal-overlay')).not.toHaveClass(/active/);
    });
  });

  test.describe('Focus Trap', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('about:blank');
      await page.setContent(`
        <!DOCTYPE html>
        <html lang="ko">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Focus Trap Test</title>
          <style>
            body { font-family: sans-serif; padding: 20px; }
            .modal-overlay {
              position: fixed;
              inset: 0;
              background: rgba(0, 0, 0, 0.6);
              display: none;
              align-items: center;
              justify-content: center;
              z-index: 1000;
            }
            .modal-overlay.active { display: flex; }
            .modal {
              background: white;
              padding: 24px;
              border-radius: 8px;
              max-width: 500px;
              width: 90%;
              box-shadow: 0 4px 16px rgba(0,0,0,0.2);
              position: relative;
            }
            button {
              padding: 8px 16px;
              border: none;
              border-radius: 4px;
              cursor: pointer;
              font-size: 14px;
            }
            .close-button {
              position: absolute;
              top: 8px;
              right: 8px;
              background: transparent;
              font-size: 24px;
            }
          </style>
          <script>
            function openModal() {
              const overlay = document.getElementById('modal-overlay');
              overlay.classList.add('active');
              overlay.querySelector('.close-button').focus();
              document.getElementById('main-content').setAttribute('inert', '');
              overlay.addEventListener('keydown', handleEscape);
            }

            function closeModal() {
              const overlay = document.getElementById('modal-overlay');
              overlay.classList.remove('active');
              document.getElementById('main-content').removeAttribute('inert');
              document.getElementById('open-modal-btn').focus();
              overlay.removeEventListener('keydown', handleEscape);
            }

            function handleEscape(e) {
              if (e.key === 'Escape') closeModal();
            }

            document.addEventListener('DOMContentLoaded', () => {
              const overlay = document.getElementById('modal-overlay');
              overlay.addEventListener('keydown', (e) => {
                if (e.key !== 'Tab') return;

                const focusableElements = overlay.querySelectorAll(
                  'button, input, select, textarea, [tabindex]:not([tabindex="-1"])'
                );
                const firstElement = focusableElements[0];
                const lastElement = focusableElements[focusableElements.length - 1];

                if (e.shiftKey) {
                  if (document.activeElement === firstElement) {
                    e.preventDefault();
                    lastElement.focus();
                  }
                } else {
                  if (document.activeElement === lastElement) {
                    e.preventDefault();
                    firstElement.focus();
                  }
                }
              });
            });
          </script>
        </head>
        <body>
          <div id="main-content">
            <h1>Focus Trap Test</h1>
            <button id="open-modal-btn" onclick="openModal()">모달 열기</button>
          </div>

          <div id="modal-overlay" class="modal-overlay" role="dialog" aria-modal="true">
            <div class="modal">
              <button class="close-button" onclick="closeModal()">×</button>
              <h2>Modal</h2>
              <input type="text" placeholder="Input" aria-label="Text input">
              <div>
                <button class="secondary" onclick="closeModal()">취소</button>
                <button class="primary" onclick="closeModal()">확인</button>
              </div>
            </div>
          </div>
        </body>
        </html>
      `);
    });

    test('should trap focus forward (Tab)', async ({ page }) => {
      await page.click('#open-modal-btn');

      const closeButton = page.locator('.close-button');
      const inputField = page.locator('input[type="text"]');
      const cancelButton = page.locator('button.secondary');
      const confirmButton = page.locator('button.primary');

      await expect(closeButton).toBeFocused();

      await page.keyboard.press('Tab');
      await expect(inputField).toBeFocused();

      await page.keyboard.press('Tab');
      await expect(cancelButton).toBeFocused();

      await page.keyboard.press('Tab');
      await expect(confirmButton).toBeFocused();

      await page.keyboard.press('Tab');
      await expect(closeButton).toBeFocused();
    });

    test('should trap focus backward (Shift+Tab)', async ({ page }) => {
      await page.click('#open-modal-btn');

      const closeButton = page.locator('.close-button');
      const inputField = page.locator('input[type="text"]');
      const cancelButton = page.locator('button.secondary');
      const confirmButton = page.locator('button.primary');

      await page.keyboard.press('Shift+Tab');
      await expect(confirmButton).toBeFocused();

      await page.keyboard.press('Shift+Tab');
      await expect(cancelButton).toBeFocused();

      await page.keyboard.press('Shift+Tab');
      await expect(inputField).toBeFocused();

      await page.keyboard.press('Shift+Tab');
      await expect(closeButton).toBeFocused();
    });

    test('should close on Escape and restore focus', async ({ page }) => {
      const openButton = page.locator('#open-modal-btn');
      const modal = page.locator('#modal-overlay');

      await openButton.click();
      await expect(modal).toHaveClass(/active/);

      await page.keyboard.press('Escape');
      await expect(modal).not.toHaveClass(/active/);

      await expect(openButton).toBeFocused();
    });

    test('should make background inert when open', async ({ page }) => {
      const mainContent = page.locator('#main-content');
      const openButton = page.locator('#open-modal-btn');

      await expect(mainContent).not.toHaveAttribute('inert');

      await openButton.click();
      await expect(mainContent).toHaveAttribute('inert', '');

      await page.keyboard.press('Escape');
      await expect(mainContent).not.toHaveAttribute('inert');
    });
  });

  test.describe('Settings Dialog', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('about:blank');
      await page.setContent(`
        <!DOCTYPE html>
        <html lang="ko">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Settings Dialog Test</title>
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
            button.primary { background: #0066cc; color: white; }
            button.secondary { background: #f0f0f0; color: #333; }
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

    test('should have no accessibility violations', async ({ page }) => {
      const accessibilityScanResults = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
        .analyze();

      expect(accessibilityScanResults.violations).toEqual([]);
    });

    test('should have accessible form controls', async ({ page }) => {
      const languageSelect = page.locator('#language-select');
      const themeSelect = page.locator('#theme-select');
      const autoplayCheckbox = page.locator('#autoplay-checkbox');

      await expect(languageSelect).toHaveAttribute('aria-label', '언어 선택');
      await expect(themeSelect).toHaveAttribute('aria-label', '테마 선택');
      await expect(autoplayCheckbox).toHaveAttribute('aria-label', '자동 재생 활성화');

      await languageSelect.focus();
      await expect(languageSelect).toBeFocused();

      await themeSelect.focus();
      await expect(themeSelect).toBeFocused();

      await autoplayCheckbox.focus();
      await expect(autoplayCheckbox).toBeFocused();
    });

    test('should have accessible buttons', async ({ page }) => {
      const cancelButton = page.locator('button:has-text("취소")');
      const saveButton = page.locator('button:has-text("저장")');

      await expect(cancelButton).toHaveAttribute('aria-label', '취소');
      await expect(saveButton).toHaveAttribute('aria-label', '저장');

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

      await page.keyboard.press('Shift+Tab');
      await expect(cancelButton).toBeFocused();
    });

    test('should have sufficient color contrast', async ({ page }) => {
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

  test.describe('Focus Indicators', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('about:blank');
      await page.setContent(`
        <!DOCTYPE html>
        <html lang="ko">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Focus Indicators Test</title>
          <style>
            body { font-family: sans-serif; margin: 20px; line-height: 1.6; }

            *:focus {
              outline: 3px solid oklch(60% 0.2 260);
              outline-offset: 2px;
            }

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

            .header { padding: 16px; background: #f0f0f0; margin-bottom: 20px; }
            .nav { display: flex; gap: 16px; margin: 16px 0; }
            .nav a { padding: 8px 16px; background: #0066cc; color: white; text-decoration: none; border-radius: 4px; }
            .content { margin: 20px 0; }
            .button-group { display: flex; gap: 8px; margin: 16px 0; }
            button { padding: 8px 16px; border: 1px solid #ccc; border-radius: 4px; cursor: pointer; background: white; }
            .hidden { display: none; }
          </style>
        </head>
        <body>
          <a href="#main-content" class="skip-link">본문 바로가기</a>

          <header class="header">
            <h1>Focus Indicators Test</h1>
            <nav class="nav">
              <a href="#section1">섹션 1</a>
              <a href="#section2">섹션 2</a>
            </nav>
          </header>

          <main id="main-content" tabindex="-1">
            <section id="section1">
              <h2>버튼 그룹</h2>
              <div class="button-group">
                <button id="btn1">버튼 1</button>
                <button id="btn2">버튼 2</button>
              </div>
            </section>

            <section id="section2">
              <h2>폼 요소</h2>
              <div class="content">
                <label for="text-input">텍스트 입력</label>
                <input type="text" id="text-input">

                <label for="select-input">선택 박스</label>
                <select id="select-input">
                  <option>옵션 1</option>
                  <option>옵션 2</option>
                </select>
              </div>
            </section>

            <section>
              <h2>숨겨진 요소</h2>
              <button id="visible-btn">보이는 버튼</button>
              <button id="hidden-btn" class="hidden">숨겨진 버튼</button>
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

    test('should have visible focus indicator on interactive elements', async ({ page }) => {
      const interactiveElements = [
        page.locator('#btn1'),
        page.locator('#text-input'),
        page.locator('#select-input'),
        page.locator('.nav a').first(),
      ];

      for (const element of interactiveElements) {
        await element.focus();
        await expect(element).toBeFocused();

        const outlineWidth = await element.evaluate(el => {
          const styles = window.getComputedStyle(el);
          return styles.outlineWidth;
        });

        const widthValue = parseInt(outlineWidth, 10);
        expect(widthValue).toBeGreaterThanOrEqual(3);
      }
    });

    test('should have skip to content link', async ({ page }) => {
      const skipLink = page.locator('.skip-link');

      await expect(skipLink).toBeAttached();
      await expect(skipLink).toHaveText('본문 바로가기');
      await expect(skipLink).toHaveAttribute('href', '#main-content');

      await page.keyboard.press('Tab');
      await expect(skipLink).toBeFocused();

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
      const textInput = page.locator('#text-input');
      const selectInput = page.locator('#select-input');
      const visibleBtn = page.locator('#visible-btn');

      await page.keyboard.press('Tab');
      await expect(skipLink).toBeFocused();

      await page.keyboard.press('Tab');
      await expect(navLinks.first()).toBeFocused();

      await page.keyboard.press('Tab');
      await expect(navLinks.nth(1)).toBeFocused();

      await page.keyboard.press('Tab');
      await expect(btn1).toBeFocused();

      await page.keyboard.press('Tab');
      await expect(btn2).toBeFocused();

      await page.keyboard.press('Tab');
      await expect(textInput).toBeFocused();

      await page.keyboard.press('Tab');
      await expect(selectInput).toBeFocused();

      await page.keyboard.press('Tab');
      await expect(visibleBtn).toBeFocused();
    });

    test('should not focus on hidden elements', async ({ page }) => {
      const hiddenBtn = page.locator('#hidden-btn');

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
      await page.locator('#btn1').focus();

      const accessibilityScanResults = await new AxeBuilder({ page })
        .withTags(['wcag2aa'])
        .analyze();

      const contrastViolations = accessibilityScanResults.violations.filter(
        v => v.id === 'color-contrast'
      );

      expect(contrastViolations).toHaveLength(0);
    });

    test('should allow reverse navigation with Shift+Tab', async ({ page }) => {
      const btn1 = page.locator('#btn1');
      const navLinks = page.locator('.nav a');
      const skipLink = page.locator('.skip-link');

      await btn1.focus();
      await expect(btn1).toBeFocused();

      await page.keyboard.press('Shift+Tab');
      await expect(navLinks.nth(1)).toBeFocused();

      await page.keyboard.press('Shift+Tab');
      await expect(navLinks.first()).toBeFocused();

      await page.keyboard.press('Shift+Tab');
      await expect(skipLink).toBeFocused();
    });
  });
});
