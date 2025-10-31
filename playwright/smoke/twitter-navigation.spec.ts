/**
 * Phase 294: Twitter 네비게이션 스크롤 위치 복원 테스트
 * @description 갤러리가 Twitter의 스크롤 복원 메커니즘을 방해하지 않는지 검증
 *
 * ⚠️ 주의: 이 테스트는 Twitter 로그인이 필요하여 로컬 환경 전용입니다.
 * CI/자동화 환경에서는 전체 스킵됩니다.
 */

import { test, expect } from '@playwright/test';

// CI 환경에서는 전체 테스트 스위트 스킵 (Twitter 로그인 필요)
test.describe.skip('Twitter Navigation Scroll Restoration', () => {
  test('갤러리 없이 네비게이션: 스크롤 위치 복원 (기준)', async ({ page }) => {
    // Twitter 홈 타임라인으로 이동
    await page.goto('https://x.com/home', { waitUntil: 'networkidle' });

    const timeline = page.locator('[data-testid="primaryColumn"]');

    // 1. 타임라인 스크롤
    await timeline.evaluate(el => el.scrollTo({ top: 500, behavior: 'instant' }));
    await page.waitForTimeout(500); // 스크롤 안정화

    const scrollBefore = await timeline.evaluate(el => el.scrollTop);
    expect(scrollBefore).toBeGreaterThanOrEqual(400); // 약간의 여유 허용

    // 2. 첫 번째 포스트의 링크 클릭 (상세 페이지 이동)
    const firstPost = page.locator('article').first();
    const statusLink = firstPost.locator('a[href*="/status/"]').first();

    await statusLink.click();
    await page.waitForURL(/\/status\//, { timeout: 5000 });
    await page.waitForTimeout(300);

    // 3. 뒤로 가기
    await page.goBack();
    await page.waitForURL(/\/home/, { timeout: 5000 });
    await page.waitForTimeout(500); // Twitter의 복원 로직 대기

    // 4. 스크롤 위치 확인 (±50px 허용)
    const scrollAfter = await timeline.evaluate(el => el.scrollTop);
    const difference = Math.abs(scrollAfter - scrollBefore);

    expect(difference).toBeLessThan(50);
  });

  test.skip('갤러리 열기 후 네비게이션: 스크롤 위치 복원', async ({ page }) => {
    // TODO: Phase 294 구현 후 활성화
    // 이 테스트는 갤러리를 열고 닫은 후에도 스크롤 복원이 정상 작동하는지 검증
    const timeline = page.locator('[data-testid="primaryColumn"]');

    // 1. 타임라인 스크롤
    await timeline.evaluate(el => el.scrollTo({ top: 500, behavior: 'instant' }));
    await page.waitForTimeout(500);

    const scrollBefore = await timeline.evaluate(el => el.scrollTop);

    // 2. 미디어가 있는 포스트 찾아서 갤러리 오픈
    const mediaPost = page
      .locator('article')
      .filter({
        has: page.locator('[data-testid="tweetPhoto"], [data-testid="videoPlayer"]'),
      })
      .first();

    const mediaElement = mediaPost
      .locator('[data-testid="tweetPhoto"], [data-testid="videoPlayer"]')
      .first();
    await mediaElement.click();

    // 갤러리 오픈 확인
    await page.waitForSelector('.xeg-gallery-overlay', { timeout: 3000 });
    await page.waitForTimeout(300);

    // 3. 갤러리 닫기 (Escape)
    await page.keyboard.press('Escape');
    await page.waitForTimeout(500);

    // 갤러리 닫힘 확인
    await expect(page.locator('.xeg-gallery-overlay')).toBeHidden();

    // 4. 상세 페이지 이동
    const statusLink = mediaPost.locator('a[href*="/status/"]').first();
    await statusLink.click();
    await page.waitForURL(/\/status\//, { timeout: 5000 });
    await page.waitForTimeout(300);

    // 5. 뒤로 가기
    await page.goBack();
    await page.waitForURL(/\/home/, { timeout: 5000 });
    await page.waitForTimeout(500);

    // 6. 스크롤 위치 확인 (±50px 허용)
    const scrollAfter = await timeline.evaluate(el => el.scrollTop);
    const difference = Math.abs(scrollAfter - scrollBefore);

    expect(difference).toBeLessThan(50);
  });

  test.skip('갤러리 활성화 상태에서 네비게이션: 자동 닫힘 후 복원', async ({ page }) => {
    // TODO: Phase 294 구현 후 활성화
    // 이 테스트는 갤러리가 열려 있는 상태에서 네비게이션하면 자동으로 닫히고 복원되는지 검증
    const timeline = page.locator('[data-testid="primaryColumn"]');

    // 1. 타임라인 스크롤
    await timeline.evaluate(el => el.scrollTo({ top: 500, behavior: 'instant' }));
    await page.waitForTimeout(500);

    const scrollBefore = await timeline.evaluate(el => el.scrollTop);

    // 2. 미디어 클릭하여 갤러리 오픈
    const mediaPost = page
      .locator('article')
      .filter({
        has: page.locator('[data-testid="tweetPhoto"], [data-testid="videoPlayer"]'),
      })
      .first();

    const mediaElement = mediaPost
      .locator('[data-testid="tweetPhoto"], [data-testid="videoPlayer"]')
      .first();
    await mediaElement.click();

    await page.waitForSelector('.xeg-gallery-overlay', { timeout: 3000 });
    await page.waitForTimeout(300);

    // 3. 갤러리 열린 상태에서 상세 페이지 이동 (이론적으로 자동 닫힘)
    // 브라우저 뒤로 버튼 시뮬레이션 또는 링크 클릭
    await page.goBack(); // 또는 다른 방법

    // 4. 스크롤 위치 복원 확인
    await page.waitForTimeout(500);
    const scrollAfter = await timeline.evaluate(el => el.scrollTop);
    const difference = Math.abs(scrollAfter - scrollBefore);

    expect(difference).toBeLessThan(50);
  });
});
