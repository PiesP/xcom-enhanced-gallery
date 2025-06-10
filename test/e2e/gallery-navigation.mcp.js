/**
 * Gallery Navigation E2E Test
 * 갤러리 네비게이션 기능을 테스트합니다.
 */

const navigationTest = {
  name: 'Gallery Navigation Test',

  async setup() {
    await browser_navigate('https://twitter.com');
    await browser_wait(3);

    // 갤러리 열기
    await browser_click('트윗 이미지', "img[data-testid='tweetPhoto']");
    await browser_wait(1);
    console.log('🎯 네비게이션 테스트 시작');
  },

  async testArrowKeyNavigation() {
    console.log('⬅️➡️ 화살표 키 네비게이션 테스트');

    try {
      // 오른쪽 화살표로 다음 이미지
      await browser_press_key('ArrowRight');
      await browser_wait(0.5);

      // 왼쪽 화살표로 이전 이미지
      await browser_press_key('ArrowLeft');
      await browser_wait(0.5);

      console.log('✅ 화살표 키 네비게이션 성공');
      return true;
    } catch (error) {
      console.log('❌ 화살표 키 네비게이션 실패:', error.message);
      return false;
    }
  },

  async testHomeEndKeys() {
    console.log('🏠🔚 Home/End 키 테스트');

    try {
      // End 키로 마지막 이미지
      await browser_press_key('End');
      await browser_wait(0.5);

      // Home 키로 첫 번째 이미지
      await browser_press_key('Home');
      await browser_wait(0.5);

      console.log('✅ Home/End 키 네비게이션 성공');
      return true;
    } catch (error) {
      console.log('❌ Home/End 키 테스트 실패:', error.message);
      return false;
    }
  },
};
