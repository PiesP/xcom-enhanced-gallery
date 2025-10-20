/**
 * 접근성 테스트 - Modal 컴포넌트
 *
 * @axe-core/playwright를 사용한 모달 포커스 트랩 검증
 *
 * 포커스:
 * - 포커스 트랩 (Tab 순환, 외부로 escape 불가)
 * - Escape 키로 닫기
 * - 포커스 복원 (모달 닫힌 후 원래 요소로 복귀)
 * - ARIA 속성 (role="dialog", aria-modal)
 * - 배경 inert (모달 열릴 때 배경 비활성화)
 *
 * WCAG 2.1 Level AA 준수 검증
 */

import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.describe('Modal Accessibility', () => {
  test.beforeEach(async ({ page }) => {
    // Modal 포커스 트랩 HTML 시뮬레이션
    await page.goto('about:blank');
    await page.setContent(`
      <!DOCTYPE html>
      <html lang="ko">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Modal Accessibility Test</title>
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
            
            // 첫 포커스 가능 요소에 포커스
            const firstFocusable = overlay.querySelector('button, input, select, textarea, [tabindex]:not([tabindex="-1"])');
            if (firstFocusable) firstFocusable.focus();
            
            // 배경 inert
            document.getElementById('main-content').setAttribute('inert', '');
            
            // Escape 키 이벤트
            overlay.addEventListener('keydown', handleEscape);
          }
          
          function closeModal() {
            const overlay = document.getElementById('modal-overlay');
            overlay.classList.remove('active');
            
            // 배경 복원
            document.getElementById('main-content').removeAttribute('inert');
            
            // 포커스 복원
            document.getElementById('open-modal-btn').focus();
            
            overlay.removeEventListener('keydown', handleEscape);
          }
          
          function handleEscape(e) {
            if (e.key === 'Escape') closeModal();
          }
          
          // 포커스 트랩 구현
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
                // Shift+Tab
                if (document.activeElement === firstElement) {
                  e.preventDefault();
                  lastElement.focus();
                }
              } else {
                // Tab
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
          <h1>Modal Accessibility Test</h1>
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

  test('should have no accessibility violations when modal is open', async ({ page }) => {
    // 모달 열기
    await page.click('#open-modal-btn');

    // 접근성 스캔
    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('should have proper dialog role and attributes', async ({ page }) => {
    // 모달 열기
    await page.click('#open-modal-btn');

    const modal = page.locator('#modal-overlay');

    // Dialog 역할 및 속성 확인
    await expect(modal).toHaveAttribute('role', 'dialog');
    await expect(modal).toHaveAttribute('aria-modal', 'true');
    await expect(modal).toHaveAttribute('aria-labelledby', 'modal-title');

    // 제목 연결 확인
    const title = page.locator('#modal-title');
    await expect(title).toBeVisible();
    await expect(title).toHaveText('확인');
  });

  test('should trap focus within modal (Tab forward)', async ({ page }) => {
    // 모달 열기
    await page.click('#open-modal-btn');

    const closeButton = page.locator('.close-button');
    const inputField = page.locator('input[type="text"]');
    const cancelButton = page.locator('button.secondary');
    const confirmButton = page.locator('button.primary');

    // 초기 포커스 (첫 버튼)
    await expect(closeButton).toBeFocused();

    // Tab으로 순차 이동
    await page.keyboard.press('Tab');
    await expect(inputField).toBeFocused();

    await page.keyboard.press('Tab');
    await expect(cancelButton).toBeFocused();

    await page.keyboard.press('Tab');
    await expect(confirmButton).toBeFocused();

    // 마지막 요소에서 Tab → 첫 요소로 순환
    await page.keyboard.press('Tab');
    await expect(closeButton).toBeFocused();
  });

  test('should trap focus within modal (Shift+Tab backward)', async ({ page }) => {
    // 모달 열기
    await page.click('#open-modal-btn');

    const closeButton = page.locator('.close-button');
    const inputField = page.locator('input[type="text"]');
    const cancelButton = page.locator('button.secondary');
    const confirmButton = page.locator('button.primary');

    // 초기 포커스에서 Shift+Tab → 마지막 요소로 순환
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

    // 모달 열기
    await openButton.click();
    await expect(modal).toHaveClass(/active/);

    // Escape로 닫기
    await page.keyboard.press('Escape');
    await expect(modal).not.toHaveClass(/active/);

    // 포커스 복원 확인
    await expect(openButton).toBeFocused();
  });

  test('should make background inert when modal is open', async ({ page }) => {
    const mainContent = page.locator('#main-content');
    const openButton = page.locator('#open-modal-btn');

    // 모달 열기 전: inert 없음
    await expect(mainContent).not.toHaveAttribute('inert');

    // 모달 열기
    await openButton.click();

    // 배경 inert 확인
    await expect(mainContent).toHaveAttribute('inert', '');

    // 모달 닫기
    await page.keyboard.press('Escape');

    // inert 제거 확인
    await expect(mainContent).not.toHaveAttribute('inert');
  });

  test('should have accessible close button', async ({ page }) => {
    // 모달 열기
    await page.click('#open-modal-btn');

    const closeButton = page.locator('.close-button');

    // ARIA 레이블 확인
    await expect(closeButton).toHaveAttribute('aria-label', '닫기');

    // 포커스 가능 확인
    await closeButton.focus();
    await expect(closeButton).toBeFocused();

    // 클릭으로 닫기
    await closeButton.click();
    await expect(page.locator('#modal-overlay')).not.toHaveClass(/active/);
  });
});
