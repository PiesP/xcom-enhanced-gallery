/**
 * Gallery Open/Close E2E Test
 * X.com Enhanced Gallery의 갤러리 열기/닫기 기능을 테스트합니다.
 */

// 갤러리 열기/닫기 테스트 플랜
const galleryOpenCloseTest = {
  name: 'Gallery Open/Close Test',
  description: '갤러리 열기와 닫기 기능의 정상 동작을 검증합니다.',

  async setup() {
    // 테스트 페이지로 이동
    await browser_navigate('https://twitter.com');
    await browser_wait(3); // 페이지 로딩 대기

    console.log('🚀 갤러리 테스트 시작');
  },

  async testGalleryOpen() {
    console.log('📸 갤러리 열기 테스트');

    // 페이지 스냅샷으로 트윗 이미지 찾기
    const snapshot = await browser_snapshot();
    console.log('페이지 스냅샷 캡처 완료');

    // 트윗 이미지 클릭 (갤러리 열기)
    try {
      await browser_click('트윗 이미지', "img[data-testid='tweetPhoto']");
      await browser_wait(1); // 갤러리 열리는 시간 대기

      // 갤러리가 열렸는지 확인
      const gallerySnapshot = await browser_snapshot();

      // 갤러리 컨테이너 존재 확인
      if (
        gallerySnapshot.includes('vertical-gallery-view') ||
        gallerySnapshot.includes('xeg-gallery')
      ) {
        console.log('✅ 갤러리가 성공적으로 열렸습니다');
        return true;
      } else {
        console.log('❌ 갤러리가 열리지 않았습니다');
        return false;
      }
    } catch (error) {
      console.log('❌ 갤러리 열기 실패:', error.message);
      return false;
    }
  },

  async testGalleryCloseWithEsc() {
    console.log('🔑 ESC 키로 갤러리 닫기 테스트');

    try {
      // ESC 키 누르기
      await browser_press_key('Escape');
      await browser_wait(0.5); // 애니메이션 대기

      // 갤러리가 닫혔는지 확인
      const closedSnapshot = await browser_snapshot();

      if (
        !closedSnapshot.includes('vertical-gallery-view') &&
        !closedSnapshot.includes('xeg-gallery')
      ) {
        console.log('✅ ESC 키로 갤러리가 성공적으로 닫혔습니다');
        return true;
      } else {
        console.log('❌ ESC 키로 갤러리 닫기 실패');
        return false;
      }
    } catch (error) {
      console.log('❌ ESC 키 테스트 실패:', error.message);
      return false;
    }
  },

  async testGalleryCloseWithBackground() {
    console.log('🖱️ 배경 클릭으로 갤러리 닫기 테스트');

    try {
      // 먼저 갤러리 다시 열기
      await browser_click('트윗 이미지', "img[data-testid='tweetPhoto']");
      await browser_wait(1);

      // 갤러리 배경 영역 클릭
      await browser_click('갤러리 배경', '.vertical-gallery-view');
      await browser_wait(0.5);

      // 갤러리가 닫혔는지 확인
      const closedSnapshot = await browser_snapshot();

      if (!closedSnapshot.includes('vertical-gallery-view')) {
        console.log('✅ 배경 클릭으로 갤러리가 성공적으로 닫혔습니다');
        return true;
      } else {
        console.log('❌ 배경 클릭으로 갤러리 닫기 실패');
        return false;
      }
    } catch (error) {
      console.log('❌ 배경 클릭 테스트 실패:', error.message);
      return false;
    }
  },

  async runAll() {
    await this.setup();

    const results = {
      open: await this.testGalleryOpen(),
      closeEsc: await this.testGalleryCloseWithEsc(),
      closeBackground: await this.testGalleryCloseWithBackground(),
    };

    console.log('\n📊 갤러리 열기/닫기 테스트 결과:');
    console.log(`- 갤러리 열기: ${results.open ? '✅ 성공' : '❌ 실패'}`);
    console.log(`- ESC 닫기: ${results.closeEsc ? '✅ 성공' : '❌ 실패'}`);
    console.log(`- 배경 클릭 닫기: ${results.closeBackground ? '✅ 성공' : '❌ 실패'}`);

    const allPassed = Object.values(results).every(result => result);
    console.log(`\n🎯 전체 결과: ${allPassed ? '✅ 모든 테스트 통과' : '❌ 일부 테스트 실패'}`);

    return results;
  },
};

// 테스트 실행
galleryOpenCloseTest.runAll().catch(console.error);
